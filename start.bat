@echo off
rem Arranca el worker (ventana aparte) y el dashboard, y abre el navegador.
cd /d "%~dp0"

if not exist ".venv\Scripts\python.exe" (
  echo No encuentro el entorno .venv. Sigue los pasos de instalacion del README.
  pause
  exit /b 1
)
if not exist "apps\dashboard\node_modules" call pnpm -C apps/dashboard install || (pause & exit /b 1)

start "Voz Clon - worker" cmd /k ".venv\Scripts\python.exe -m uvicorn server_local:app --app-dir services/tts-worker --host 127.0.0.1 --port 8001"
pnpm -C apps/dashboard dev --open
