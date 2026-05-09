@echo off
set SCRIPT_DIR=%~dp0

start "Taskflow Server" powershell -NoExit -ExecutionPolicy Bypass -File "%SCRIPT_DIR%iniciar.ps1"
timeout /t 3 /nobreak >nul
start "" http://127.0.0.1:5000/
