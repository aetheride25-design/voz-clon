# Voz Clon

Interfaz local para el modelo de clonación de voz Qwen3-TTS, hecha por **chito.dev** ([chitodev2501@gmail.com](mailto:chitodev2501@gmail.com)).

Clona tu voz en tu propia máquina con [Qwen3-TTS-12Hz-1.7B-Base](https://huggingface.co/Qwen/Qwen3-TTS-12Hz-1.7B-Base):
subes unos segundos de audio, escribes un texto en español o inglés y obtienes un WAV con tu voz.
Nada sale de tu computadora.

- **Dashboard** en React (Vite + TypeScript): referencia, modo de clonación, texto, idioma, carpeta de salida, historial.
- **Worker** en Python (FastAPI): carga el modelo una vez en la GPU y sintetiza. Cachea el perfil de voz para no recodificar la referencia.
- Funciona en **NVIDIA (CUDA)**, **AMD en Windows (ROCm)** y **CPU** (lento). El backend se detecta solo.

## Inicio rápido

Si ya lo instalaste (ver [Instalación](#instalación)), para usarlo:

- **Windows:** doble clic en `start.bat`.
- **Linux/macOS:** `./start.sh`

Se abre el worker (carga el modelo) y el navegador en **http://localhost:5173**. Espera a que la cabecera diga
"Modelo listo" y listo.

## Requisitos

| Qué | Versión / nota |
|---|---|
| Python | 3.12 (obligatorio para AMD en Windows; recomendado para el resto) |
| Node.js + pnpm | Node 20 o superior, `npm i -g pnpm` |
| ffmpeg | en el PATH. Decodifica la referencia (AAC, M4A, MP3, WAV, OGG) |
| GPU NVIDIA | 8 GB de VRAM o más. El modelo ocupa ~4.5 GB en bf16 |
| GPU AMD (Windows) | Windows 11, driver Adrenalin 26.2.2 o superior y una de las GPU de la lista de AMD (ver paso 2) |
| CPU | 16 GB de RAM. Funciona, pero tarda minutos por frase |
| Disco | ~5 GB para el modelo (se descarga solo la primera vez) |

El modelo **no está en este repositorio**. La primera vez que arranca el worker, `qwen-tts` lo descarga
de Hugging Face (4.6 GB) a la caché de tu usuario (`~/.cache/huggingface/hub`). Puedes cambiar la ubicación con la
variable de entorno `HF_HOME`.

## Instalación

### 1. Clonar y crear el entorno de Python

```bash
git clone https://github.com/aetheride25-design/voz-clon.git
cd voz-clon
python -m venv .venv
```

Activa el entorno: `.venv\Scripts\activate` (Windows) o `source .venv/bin/activate` (Linux/macOS).
Si usas [uv](https://docs.astral.sh/uv/): `uv venv --python 3.12 .venv` y luego `uv pip install` en lugar de `pip install`.

### 2. Instalar PyTorch según tu GPU

Elige **una** opción.

**NVIDIA (Linux o Windows).** Instala `torch` y `torchaudio` con el comando que te da el selector oficial de
[pytorch.org/get-started](https://pytorch.org/get-started/locally/) para tu versión de CUDA. Opcional, más rápido:
`pip install flash-attn --no-build-isolation` (necesita compilador; si falla, el worker usa SDPA automáticamente).

**AMD en Windows.** Wheels oficiales de AMD (PyTorch 2.9.1 + ROCm 7.2.1), Windows 11 y Python 3.12 obligatorios.
Es una configuración general, no por tarjeta: sirve para todas las GPU que AMD lista para PyTorch en Windows con
ROCm 7.2.1: Radeon RX 9070 XT, RX 9070, RX 9060 XT, RX 7900 XTX, RX 7700, Radeon PRO W7900 (y Dual Slot) y
Radeon AI PRO R9700. Otras tarjetas pueden funcionar, pero no están soportadas por AMD ni probadas aquí.

```bash
pip install --no-cache-dir -r services/tts-worker/requirements-amd-windows.txt
```

Probado en una RX 9060 XT. El worker aplica solo el ajuste `MIOPEN_FIND_MODE=FAST`, que también es general de ROCm.

**AMD en Linux.** Usa el selector de [pytorch.org/get-started](https://pytorch.org/get-started/locally/) con la opción
ROCm. No probado en este proyecto.

**CPU.**

```bash
pip install torch torchaudio --index-url https://download.pytorch.org/whl/cpu
```

Comprueba que PyTorch ve tu GPU (en AMD también se llama `cuda`, es normal):

```bash
python -c "import torch; print(torch.cuda.is_available(), torch.cuda.get_device_name(0) if torch.cuda.is_available() else 'cpu')"
```

### 3. Instalar el worker y el dashboard

```bash
pip install -r services/tts-worker/requirements.txt
```

```bash
pnpm -C apps/dashboard install
```

## Ejecutar

La forma fácil: `start.bat` (Windows) o `./start.sh` (Linux/macOS). Hacen exactamente lo de abajo.

A mano, con el entorno `.venv` activado. Terminal 1, el worker (la primera vez descarga el modelo; después carga en ~8 s):

```bash
python -m uvicorn server_local:app --app-dir services/tts-worker --host 127.0.0.1 --port 8001
```

Terminal 2, el dashboard:

```bash
pnpm -C apps/dashboard dev
```

Abre **http://localhost:5173** (usa `localhost`, no `127.0.0.1`). La cabecera dice "Modelo listo" cuando el worker terminó de cargar.

## Uso

1. **Audio de referencia:** 3 a 20 segundos de tu voz, claros y sin música. Vale AAC, MP3, WAV, OGG.
2. **Modo de clonación:**
   - *Con transcripción* (recomendado): escribe exactamente lo que dices en el audio. Es el modo de mejor calidad.
   - *Solo huella de voz*: sin transcripción. Parecido menor.
3. **Texto e idioma:** español o inglés.
4. **Carpeta de salida:** en Chrome/Edge, elige una carpeta y los WAV se guardan ahí directamente como
   `fecha_idioma_texto.wav`. En otros navegadores se descargan.
5. **Generar.** El resultado muestra tiempos, frames/s, tokens/s y el factor de tiempo real.

## Configuración

Variables de entorno del worker (opcionales):

| Variable | Valores | Por defecto |
|---|---|---|
| `TTS_DEVICE` | `cuda:0`, `cpu` | GPU si hay |
| `TTS_DTYPE` | `bfloat16`, `float16`, `float32` | bf16 en NVIDIA, fp16 en AMD, fp32 en CPU |
| `TTS_ATTN` | `flash_attention_2`, `sdpa`, `eager` | flash-attn en NVIDIA si está instalado; si no, sdpa |
| `MIOPEN_FIND_MODE` | ver nota | `FAST` (solo afecta a AMD) |
| `HF_HOME` | ruta | caché por defecto de Hugging Face |

Nota AMD: sin `MIOPEN_FIND_MODE=FAST`, MIOpen busca kernels de convolución para cada longitud de audio nueva y el
decodificador tarda ~25 s por generación. El worker lo fija solo; no hace falta tocarlo.

## Rendimiento medido

AMD Radeon RX 9060 XT (16 GB), Windows 11, fp16, SDPA:

| Etapa | Tiempo |
|---|---|
| Carga del modelo (en caliente) | ~8 s |
| Perfil de voz (primera vez / en caché) | 3 s / 0 s |
| Generación | ~10 frames/s ≈ 165 tokens/s, factor ×0.85 de tiempo real |
| Párrafo de 10 s de audio | ~12 s |

NVIDIA: sin medir todavía. Con bf16 y flash-attn debería ser más rápido, es la configuración que documenta Qwen.

## Estructura

```
apps/dashboard/src
  components/   solo UI (paneles, botones, iconos), sin lógica
  hooks/        lógica: salud del worker, audio de referencia, carpeta de salida, síntesis
  api/          cliente HTTP del worker
  lib/          helpers: File System Access API, nombres de archivo
services/tts-worker
  core.py       motor: detección de backend, carga, perfil de voz cacheado, síntesis, métricas
  server_local.py  FastAPI: GET /health, POST /synthesize
start.bat / start.sh  arrancan worker + dashboard
```

## Problemas comunes

- **"Worker sin conexión" en la cabecera:** el worker no está corriendo o sigue cargando. Mira su terminal.
- **`ffmpeg` no está en PATH:** el worker responde 500 al decodificar. Instala ffmpeg y reinicia el worker.
- **`torch.cuda.is_available()` devuelve `False`:** instalaste el PyTorch de CPU. Repite el paso 2 para tu GPU
  (en Windows con NVIDIA, `pip install torch` a secas instala la versión de CPU).
- **Aviso de symlinks de Hugging Face en Windows:** inofensivo; la caché usa copias.
- **Firefox/Safari:** no permiten elegir carpeta. El WAV se descarga.
- **Textos muy largos:** el modelo puede volverse inestable. Genera por párrafos.

## Uso responsable

Clona solo tu propia voz o una para la que tengas permiso explícito. No la uses para suplantar a nadie.

## Créditos y licencia

- Modelo y librería [`qwen-tts`](https://github.com/QwenLM/Qwen3-TTS): Alibaba Qwen, licencia Apache-2.0.
  Este repositorio no incluye el modelo; se descarga de Hugging Face al arrancar.
- El dashboard y el worker de este repositorio: licencia [MIT](LICENSE).
