@echo off
cd /d "%~dp0"

echo [1/3] Scanning Volunteer-Hub for modified or new files...
git status --porcelain | findstr /R "^" >nul

if %errorlevel% neq 0 (
    echo No changes detected. Local folder matches your remote repository.
    timeout /t 3 >nul
    exit /b
)

echo Changes detected! Staging files...
git add .

set current_date=%date%
set current_time=%time%

echo [2/3] Committing changes locally...
git commit -m "Automated backup: %current_date% @ %current_time%"

echo [3/3] Syncing changes with GitHub...
git pull --rebase origin main
git push origin main

echo Synchronized successfully!
timeout /t 5
