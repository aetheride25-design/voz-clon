#!/usr/bin/env bash
# Arranca el worker en segundo plano y el dashboard, y abre el navegador. Ctrl+C cierra ambos.
set -e
cd "$(dirname "$0")"

PY=.venv/bin/python
if [ ! -x "$PY" ]; then
  echo "No encuentro el entorno .venv. Sigue los pasos de instalacion del README."
  exit 1
fi
[ -d apps/dashboard/node_modules ] || pnpm -C apps/dashboard install

"$PY" -m uvicorn server_local:app --app-dir services/tts-worker --host 127.0.0.1 --port 8001 &
WORKER=$!
trap 'kill $WORKER 2>/dev/null' EXIT
pnpm -C apps/dashboard dev --open
