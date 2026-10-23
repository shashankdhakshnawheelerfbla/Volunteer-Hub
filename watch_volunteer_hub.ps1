```powershell
# Watches Volunteer-Hub for file changes and starts syncing
# after four seconds without further changes.

$ErrorActionPreference = 'Stop'
$projectPath = $PSScriptRoot
$syncScript = Join-Path $projectPath 'sync_volunteer_hub.bat'

if (-not (Test-Path (Join-Path $projectPath '.git'))) {
    Write-Host "ERROR: No .git folder found in $projectPath" -ForegroundColor Red
    Read-Host "Press Enter to close"
    exit 1
}

if (-not (Test-Path $syncScript)) {
    Write-Host "ERROR: sync_volunteer_hub.bat was not found." -ForegroundColor Red
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

$action = {
    $path = $Event.SourceEventArgs.FullPath

    # Ignore Git and common generated/dependency folders.
    if (
        $path -match '[\\/]\.git([\\/]|$)' -or
        $path -match '[\\/](node_modules|\.venv|venv|dist|build|\.next|coverage|__pycache__)([\\/]|$)' -or
        $path -match '[\\/]\.DS_Store$'
    ) {
        return
    }

    $state.LastChange = Get-Date
    $state.Pending = $true
}

$subscriptions = @()

foreach ($eventName in @('Changed', 'Created', 'Deleted', 'Renamed')) {
    $subscriptions += Register-ObjectEvent `
        -InputObject $watcher `
        -EventName $eventName `
        -SourceIdentifier "VolunteerHub_$eventName" `
        -Action $action
}

$watcher.EnableRaisingEvents = $true

Write-Host "Volunteer-Hub auto-sync is running." -ForegroundColor Green
Write-Host "Folder: $projectPath"
Write-Host "Waits four seconds after changes before syncing."
Write-Host "Press Ctrl+C to stop."
Write-Host ""

try {
    while ($true) {
        Start-Sleep -Milliseconds 500

        if (
            $state.Pending -and
            -not $state.Running -and
            ((Get-Date) - $state.LastChange).TotalSeconds -ge 4
        ) {
            $state.Pending = $false
            $state.Running = $true

            try {
                Write-Host "[$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')] Syncing..."

                $process = Start-Process `
                    -FilePath $syncScript `
                    -WorkingDirectory $projectPath `
                    -Wait `
                    -PassThru

                if ($process.ExitCode -eq 0) {
                    Write-Host "Sync completed." -ForegroundColor Green
                } else {
                    Write-Host "Sync failed with exit code $($process.ExitCode)." -ForegroundColor Red
                }
            } catch {
                Write-Host "Sync error: $($_.Exception.Message)" -ForegroundColor Red
            } finally {
                $state.Running = $false
            }
        }
    }
}
finally {
    $watcher.EnableRaisingEvents = $false
    $watcher.Dispose()

    Get-EventSubscriber |
        Where-Object { $_.SourceIdentifier -like 'VolunteerHub_*' } |
        Unregister-Event

    $subscriptions |
        ForEach-Object {
            if ($_.Action) {
                Remove-Job -Id $_.Id -Force -ErrorAction SilentlyContinue
            }
        }
}
```