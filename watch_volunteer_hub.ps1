# Watches this folder and its subfolders, then syncs after 4 seconds without file changes.
# Save this file in the root of your Volunteer-Hub Git repository.

$ErrorActionPreference = 'Stop'
$projectPath = $PSScriptRoot
$syncScript = Join-Path $projectPath 'sync_volunteer_hub.bat'

if (-not (Test-Path (Join-Path $projectPath '.git'))) {
    Write-Host "ERROR: No .git folder found in $projectPath"
    Write-Host "Put this watcher in the root of your Volunteer-Hub Git repository."
    Read-Host "Press Enter to close"
    exit 1
}
if (-not (Test-Path $syncScript)) {
    Write-Host "ERROR: sync_volunteer_hub.bat wasn't found in $projectPath"
    Read-Host "Press Enter to close"
    exit 1
}

$state = [hashtable]::Synchronized(@{
    LastChange = [datetime]::MinValue
    Pending = $false
    Running = $false
})

$watcher = New-Object System.IO.FileSystemWatcher
$watcher.Path = $projectPath
$watcher.IncludeSubdirectories = $true
$watcher.NotifyFilter = [IO.NotifyFilters]'FileName, DirectoryName, LastWrite, Size'
$watcher.InternalBufferSize = 32768
$watcher.EnableRaisingEvents = $true

$action = {
    $path = $Event.SourceEventArgs.FullPath
    # Ignore Git internals and common generated/dependency folders.
    if ($path -match '[\\/]\.git([\\/]|$)' -or
        $path -match '[\\/](node_modules|\.venv|venv|dist|build|\.next|coverage)([\\/]|$)' -or
        $path -match '[\\/]\.DS_Store$') {
        return
    }
    $state.LastChange = Get-Date
    $state.Pending = $true
}

$subs = @()
foreach ($eventName in @('Changed','Created','Deleted','Renamed')) {
    $subs += Register-ObjectEvent -InputObject $watcher -EventName $eventName -SourceIdentifier "VolunteerHub_$eventName" -Action $action
}

Write-Host "Volunteer-Hub auto-sync is running."
Write-Host "Folder: $projectPath"
Write-Host "After file changes stop for 4 seconds, Git will commit and push to origin/main."
Write-Host "Keep this window open. Press Ctrl+C to stop."
Write-Host ""

try {
    while ($true) {
        Start-Sleep -Milliseconds 500
        if ($state.Pending -and -not $state.Running -and ((Get-Date) - $state.LastChange).TotalSeconds -ge 4) {
            $state.Pending = $false
            $state.Running = $true
            try {
                Write-Host "[$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')] Changes detected. Syncing..."
                $proc = Start-Process -FilePath $syncScript -WorkingDirectory $projectPath -Wait -PassThru
                if ($proc.ExitCode -eq 0) {
                    Write-Host "Sync finished."
                } else {
                    Write-Host "Sync failed with exit code $($proc.ExitCode). Check Git output and credentials."
                }
            } catch {
                Write-Host "Sync error: $_"
            } finally {
                $state.Running = $false
            }
        }
    }
}
finally {
    $watcher.EnableRaisingEvents = $false
    $watcher.Dispose()
    Get-EventSubscriber | Where-Object { $_.SourceIdentifier -like 'VolunteerHub_*' } | Unregister-Event
    $subs | Remove-Job -Force -ErrorAction SilentlyContinue
}
