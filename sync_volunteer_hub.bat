
@echo off
setlocal
cd /d "%~dp0"

where git >nul 2>&1
if errorlevel 1 (
    echo ERROR: Git is not installed or is not on PATH.
    exit /b 1
)

where python >nul 2>&1
if errorlevel 1 (
    echo ERROR: Python is not installed or is not on PATH.
    exit /b 1
)

git rev-parse --is-inside-work-tree >nul 2>&1
if errorlevel 1 (
    echo ERROR: This folder is not a Git repository.
    exit /b 1
)

for /f "delims=" %%B in ('git branch --show-current') do set "BRANCH=%%B"
if "%BRANCH%"=="" (
    echo ERROR: Could not determine the current branch.
    exit /b 1
)

echo Checking Volunteer-Hub changes...
git status --short

echo.
echo Review the changes above before continuing.
set /p "CONFIRM=Stage all non-ignored changes? Type YES to continue: "
if /I not "%CONFIRM%"=="YES" (
    echo Cancelled. No changes staged by this script.
    exit /b 0
)

git add -A
if errorlevel 1 exit /b 1

git diff --cached --quiet
if not errorlevel 1 goto pullpush

if "%OPENAI_API_KEY%"=="" (
    echo ERROR: OPENAI_API_KEY is not set in this terminal.
    exit /b 1
)

echo Review staged filenames for secrets before continuing:
git diff --cached --name-only
set /p "CONFIRM=Commit these staged changes? Type YES to continue: "
if /I not "%CONFIRM%"=="YES" (
    echo Cancelled. Changes remain staged.
    exit /b 0
)

python "%~dp0ai_commit_message.py"
if errorlevel 1 (
    echo ERROR: AI commit message generation failed.
    exit /b 1
)

if not exist "%TEMP%\volunteer_hub_commit_message.txt" (
    echo ERROR: Commit message file was not created.
    exit /b 1
)

git commit -F "%TEMP%\volunteer_hub_commit_message.txt"
if errorlevel 1 exit /b 1

:pullpush
git pull --rebase origin "%BRANCH%"
if errorlevel 1 (
    echo ERROR: Pull/rebase failed. Resolve the Git issue manually.
    exit /b 1
)

set /p "CONFIRM=Push commits to GitHub? Type YES to continue: "
if /I not "%CONFIRM%"=="YES" (
    echo Push cancelled. Your local commits are unchanged.
    exit /b 0
)

git push -u origin "%BRANCH%"
if errorlevel 1 (
    echo ERROR: Push failed. Check GitHub authentication and network.
    exit /b 1
)

echo Sync completed successfully.
exit /b 0
