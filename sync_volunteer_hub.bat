```bat
@echo off
setlocal
cd /d "%~dp0"

where git >nul 2>&1
if errorlevel 1 (
    echo ERROR: Git isn't installed or isn't on PATH.
    exit /b 1
)

where python >nul 2>&1
if errorlevel 1 (
    echo ERROR: Python isn't installed or isn't on PATH.
    exit /b 1
)

git rev-parse --is-inside-work-tree >nul 2>&1
if errorlevel 1 (
    echo ERROR: This folder isn't a Git repository.
    exit /b 1
)

if "%OPENAI_API_KEY%"=="" (
    echo ERROR: OPENAI_API_KEY isn't set.
    exit /b 1
)

for /f "delims=" %%B in ('git branch --show-current') do set "BRANCH=%%B"

if "%BRANCH%"=="" (
    echo ERROR: Couldn't determine the current branch.
    exit /b 1
)

echo Checking Volunteer-Hub changes...
git add -A
if errorlevel 1 exit /b 1

git diff --cached --quiet
if not errorlevel 1 goto pullpush

echo Generating AI commit title and description...
python "%~dp0ai_commit_message.py"
if errorlevel 1 (
    echo ERROR: AI message generation failed. No commit created.
    exit /b 1
)

if not exist "%TEMP%\volunteer_hub_commit_message.txt" (
    echo ERROR: Commit message file wasn't created.
    exit /b 1
)

echo Creating commit...
git commit -F "%TEMP%\volunteer_hub_commit_message.txt"
if errorlevel 1 (
    echo ERROR: Commit failed.
    exit /b 1
)

:pullpush
echo Pulling remote changes...
git pull --rebase origin "%BRANCH%"
if errorlevel 1 (
    echo ERROR: Pull/rebase failed. Resolve the Git issue manually.
    exit /b 1
)

echo Pushing to GitHub...
git push -u origin "%BRANCH%"
if errorlevel 1 (
    echo ERROR: Push failed. Check your network and GitHub authentication.
    exit /b 1
)

echo Sync completed successfully.
exit /b 0
```