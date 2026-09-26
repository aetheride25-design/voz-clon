@echo off
rem Igual que start.bat pero con el modelo pequeno (0.6B), para GPUs con poca memoria.
set TTS_MODEL=Qwen/Qwen3-TTS-12Hz-0.6B-Base
call "%~dp0start.bat"
