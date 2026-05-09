@echo off
set SCRIPT_DIR=%~dp0
title Taskflow Server
powershell -NoExit -ExecutionPolicy Bypass -File "%SCRIPT_DIR%iniciar.ps1"
