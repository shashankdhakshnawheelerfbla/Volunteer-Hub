@echo off
setlocal
cd /d "%~dp0"

echo Starting Volunteer-Hub AI auto-sync...
echo Keep this window open while you work.
echo Press Ctrl+C to stop.
echo.

powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0watch_volunteer_hub.ps1"

if errorlevel 1 (
    echo.
    echo Auto-sync stopped with an error.
    pause
)