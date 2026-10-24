VOLUNTEER-HUB AUTO-SYNC SETUP

Files:
- sync_volunteer_hub.bat: safer Git commit/pull/push script
- watch_volunteer_hub.ps1: watches project files and syncs after 4 seconds of inactivity
- start_auto_sync.bat: starts the watcher

INSTALL:
1. Copy all three files into the ROOT of your Volunteer-Hub Git repository, beside the .git folder.
2. Make sure your repository uses a remote named "origin" and branch "main".
3. Open a terminal in that folder and run:
   git remote -v
   git branch --show-current
   git status
4. Double-click start_auto_sync.bat. Keep its window open while working.
5. Edit/create/delete a project file. After you stop editing for about 4 seconds, the watcher should run Git sync.

TO START AUTOMATICALLY WHEN YOU SIGN IN:
1. Press Win+R, type shell:startup, and press Enter.
2. Create a shortcut to start_auto_sync.bat and place the shortcut in the Startup folder.
3. On future sign-ins, the watcher starts and stays running in a window.

IMPORTANT:
- This uploads changed files to GitHub. Do not keep passwords, API keys, private data, or secrets in the repository.
- GitHub authentication must already be configured.
- The script assumes the remote branch is named main. Change origin/main in sync_volunteer_hub.bat if your branch is different.
- If a merge/rebase conflict occurs or push is rejected, the script reports failure. Resolve it manually before continuing.
- Auto-sync commits every detected batch of changes. If you don't want that, don't start the watcher.
- It ignores .git and common generated/dependency folders for change detection.
Auto-sync test: verifying AI-generated commit messages.