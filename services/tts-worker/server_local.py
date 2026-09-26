"""Transporte HTTP local para TTSEngine (FastAPI). Uso:
  uvicorn server_local:app --host 127.0.0.1 --port 8001
"""
from __future__ import annotations

import json
from contextlib import asynccontextmanager
from dataclasses import asdict

from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.responses import Response

from core import TTSEngine

engine = TTSEngine()


@asynccontextmanager
async def lifespan(_: FastAPI):
    print("cargando modelo...", flush=True)
    print(json.dumps(engine.load()), flush=True)
    yield


app = FastAPI(title="tts-worker", lifespan=lifespan)


@app.get("/health")
def health() -> dict:
    return engine.info()


@app.post("/synthesize")
async def synthesize(
    ref_audio: UploadFile = File(...),
    text: str = Form(...),
    language: str = Form("es"),
    ref_text: str = Form(""),
    x_vector_only: bool = Form(False),
) -> Response:
    audio_bytes = await ref_audio.read()
    if not audio_bytes:
        raise HTTPException(400, "ref_audio vacio")
    try:
        wav, timings = engine.synthesize(
            ref_audio=audio_bytes,
            ref_filename=ref_audio.filename or "ref.wav",
            ref_text=ref_text,
            x_vector_only=x_vector_only,
            text=text,
            language=language,
        )
    except ValueError as e:
        raise HTTPException(400, str(e)) from e
    return Response(
        content=wav,
        media_type="audio/wav",
        headers={"X-Timings": json.dumps(asdict(timings)), "Access-Control-Expose-Headers": "X-Timings"},
    )
