"""Nucleo de inferencia: carga Qwen3-TTS-12Hz-1.7B-Base una vez y clona voces.

Sin dependencias de transporte (HTTP, RunPod): solo bytes/np dentro, wav fuera.
"""
from __future__ import annotations

import hashlib
import importlib.util
import io
import os
import subprocess
import tempfile
import time
from dataclasses import dataclass

# Debe fijarse antes de importar torch: evita que MIOpen re-busque kernels por cada
# longitud de audio nueva (en Windows/ROCm costaba ~25 s por decodificacion).
os.environ.setdefault("MIOPEN_FIND_MODE", "FAST")

import numpy as np  # noqa: E402
import soundfile as sf  # noqa: E402
import torch  # noqa: E402
from qwen_tts import Qwen3TTSModel  # noqa: E402

MODEL_ID = "Qwen/Qwen3-TTS-12Hz-1.7B-Base"
LANGUAGES = {"es": "Spanish", "en": "English"}
DECODE_SR = 24000  # frecuencia a la que se normaliza la referencia (la del modelo)
# Del config del tokenizer 12Hz: 1 frame = 1920 muestras a 24 kHz (12.5 frames/s), 16 codigos por frame.
SAMPLES_PER_FRAME = 1920
CODES_PER_FRAME = 16


@dataclass
class Timings:
    profile_s: float
    generate_s: float
    total_s: float
    audio_s: float
    profile_cached: bool
    frames: int
    frames_per_s: float
    codes_per_s: float
    realtime_factor: float  # segundos de audio generados por segundo de computo (>1 = mas rapido que tiempo real)


_DTYPES = {"float16": torch.float16, "bfloat16": torch.bfloat16, "float32": torch.float32}


def detect_backend() -> tuple[str, str, torch.dtype, str]:
    """Elige (backend, device, dtype, attn) segun la build de PyTorch instalada.

    - cuda (NVIDIA): bfloat16 + flash_attention_2 si el paquete flash-attn esta instalado, si no sdpa.
    - rocm (AMD):    float16 + sdpa (flash-attn no existe para ROCm en Windows).
    - cpu:           float32 + sdpa (funciona, lento).
    Cualquiera se puede forzar con TTS_DEVICE, TTS_DTYPE (float16|bfloat16|float32) y TTS_ATTN.
    """
    if not torch.cuda.is_available():
        backend, device, dtype, attn = "cpu", "cpu", torch.float32, "sdpa"
    elif torch.version.hip:
        backend, device, dtype, attn = "rocm", "cuda:0", torch.float16, "sdpa"
    else:
        has_flash = importlib.util.find_spec("flash_attn") is not None
        backend, device, dtype, attn = "cuda", "cuda:0", torch.bfloat16, "flash_attention_2" if has_flash else "sdpa"

    device = os.environ.get("TTS_DEVICE", device)
    dtype = _DTYPES[os.environ.get("TTS_DTYPE", str(dtype).replace("torch.", ""))]
    attn = os.environ.get("TTS_ATTN", attn)
    return backend, device, dtype, attn


class TTSEngine:
    def __init__(self) -> None:
        self.tts: Qwen3TTSModel | None = None
        self.backend, self.device, self.dtype, self.attn = detect_backend()
        self._profiles: dict[str, list] = {}

    # ---- ciclo de vida -------------------------------------------------
    def load(self) -> dict:
        t = time.time()
        self.tts = Qwen3TTSModel.from_pretrained(
            MODEL_ID, device_map=self.device, dtype=self.dtype, attn_implementation=self.attn,
        )
        return {**self.info(), "load_s": round(time.time() - t, 1)}

    def info(self) -> dict:
        name = torch.cuda.get_device_name(0) if self.device.startswith("cuda") else "CPU"
        return {
            "model": MODEL_ID,
            "backend": self.backend,
            "device": self.device,
            "device_name": name,
            "dtype": str(self.dtype).replace("torch.", ""),
            "attn": self.attn,
            "loaded": self.tts is not None,
            "languages": LANGUAGES,
        }

    # ---- perfil de voz --------------------------------------------------
    @staticmethod
    def _decode_audio(audio_bytes: bytes, filename: str) -> tuple[np.ndarray, int]:
        """Decodifica cualquier formato (wav/mp3/flac/aac/m4a/ogg) a mono float32 con ffmpeg.

        libsndfile no lee AAC/M4A y librosa 1.x ya no cae a ffmpeg por su cuenta, asi que
        se invoca ffmpeg directamente. El archivo temporal permite contenedores que
        requieren seek (m4a).
        """
        suffix = os.path.splitext(filename)[1] or ".bin"
        with tempfile.NamedTemporaryFile(suffix=suffix, delete=False) as f:
            f.write(audio_bytes)
            path = f.name
        try:
            proc = subprocess.run(
                ["ffmpeg", "-v", "error", "-i", path, "-f", "f32le", "-ac", "1", "-ar", str(DECODE_SR), "pipe:1"],
                capture_output=True,
                check=False,
            )
        except FileNotFoundError as e:
            raise RuntimeError("ffmpeg no esta instalado o no esta en PATH") from e
        finally:
            os.unlink(path)
        if proc.returncode != 0 or not proc.stdout:
            raise ValueError(f"no se pudo decodificar el audio: {proc.stderr.decode(errors='ignore').strip()[:300]}")
        audio = np.frombuffer(proc.stdout, dtype=np.float32)
        return audio, DECODE_SR

    def _profile(self, audio_bytes: bytes, filename: str, ref_text: str | None, x_vector_only: bool):
        assert self.tts is not None, "modelo no cargado"
        key = hashlib.sha256(audio_bytes + (ref_text or "").encode() + bytes([x_vector_only])).hexdigest()
        if key in self._profiles:
            return self._profiles[key], True
        audio, sr = self._decode_audio(audio_bytes, filename)
        items = self.tts.create_voice_clone_prompt(
            ref_audio=(audio, sr), ref_text=ref_text, x_vector_only_mode=x_vector_only,
        )
        self._profiles[key] = items
        return items, False

    # ---- sintesis -------------------------------------------------------
    def synthesize(
        self,
        ref_audio: bytes,
        ref_filename: str,
        ref_text: str | None,
        x_vector_only: bool,
        text: str,
        language: str,
    ) -> tuple[bytes, Timings]:
        assert self.tts is not None, "modelo no cargado"
        if language not in LANGUAGES:
            raise ValueError(f"idioma no soportado: {language}. Usa uno de {list(LANGUAGES)}")
        if not x_vector_only and not (ref_text and ref_text.strip()):
            raise ValueError("ref_text es obligatorio salvo en modo x_vector_only")
        if not text.strip():
            raise ValueError("text vacio")

        t0 = time.time()
        items, cached = self._profile(ref_audio, ref_filename, ref_text.strip() if ref_text else None, x_vector_only)
        t1 = time.time()
        wavs, sr = self.tts.generate_voice_clone(
            text=text.strip(), language=LANGUAGES[language], voice_clone_prompt=items,
        )
        t2 = time.time()

        buf = io.BytesIO()
        sf.write(buf, wavs[0], sr, format="WAV", subtype="PCM_16")
        audio_s = len(wavs[0]) / sr
        generate_s = t2 - t1  # talker + code predictor + decodificador (~0.4 s de este ultimo)
        frames = round(len(wavs[0]) / SAMPLES_PER_FRAME)
        timings = Timings(
            profile_s=round(t1 - t0, 2),
            generate_s=round(generate_s, 2),
            total_s=round(t2 - t0, 2),
            audio_s=round(audio_s, 2),
            profile_cached=cached,
            frames=frames,
            frames_per_s=round(frames / generate_s, 1),
            codes_per_s=round(frames * CODES_PER_FRAME / generate_s, 0),
            realtime_factor=round(audio_s / generate_s, 2),
        )
        return buf.getvalue(), timings
