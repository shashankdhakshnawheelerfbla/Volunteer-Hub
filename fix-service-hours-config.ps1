# ==========================================================
# VOLUNTEER HUB - FIX SERVICE HOURS D1 CONFIGURATION
# ==========================================================

$ErrorActionPreference = "Stop"

# Run this script from the Volunteer-Hub project root.
$ProjectRoot = (Get-Location).Path
$ConfigPath = Join-Path $ProjectRoot "wrangler.json"
$MigrationPath = Join-Path $ProjectRoot "migrations\service-hours\0001_service_hours_reports.sql"

# This is the ID of the existing volunteer-hours-db database.
# Do not create another database.
$HoursDatabaseName = "volunteer-hours-db"
$HoursDatabaseId = "7f6cad28-ff2d-415d-a030-9cefc0829b30"
$HoursBindingName = "HOURS_DB"
$HoursMigrationsDirectory = "migrations/service-hours"

Write-Host "`nVOLUNTEER HUB - SERVICE HOURS CONFIGURATION FIX" -ForegroundColor Cyan

if (!(Test-Path $ConfigPath)) {
    throw "wrangler.json was not found. Open the Volunteer-Hub project root and run this script again."
}

if (!(Test-Path $MigrationPath)) {
    throw "The service-hours migration was not found at migrations\service-hours\0001_service_hours_reports.sql. No configuration changes were made."
}

# Read the existing configuration without replacing its other settings.
$config = Get-Content -Path $ConfigPath -Raw | ConvertFrom-Json -AsHashtable

if (!$config.ContainsKey("d1_databases")) {
    $config["d1_databases"] = @()
}

$databases = @($config["d1_databases"])

# Check whether the HOURS_DB binding or database already exists.
$matchingByName = @($databases | Where-Object {
    $_.database_name -eq $HoursDatabaseName
})

$matchingByBinding = @($databases | Where-Object {
    $_.binding -eq $HoursBindingName
})

if ($matchingByName.Count -gt 1) {
    throw "More than one volunteer-hours-db entry exists. Resolve the duplicate entries manually."
}

if ($matchingByBinding.Count -gt 1) {
    throw "More than one HOURS_DB binding exists. Resolve the duplicate entries manually."
}

if ($matchingByName.Count -eq 1) {
    # Repair the existing entry, including a missing/null database_id.
    $hoursEntry = $matchingByName[0]

    if ($hoursEntry.binding -and $hoursEntry.binding -ne $HoursBindingName) {
        throw "The volunteer-hours-db database is already assigned to a different binding: $($hoursEntry.binding)."
    }

    $hoursEntry["binding"] = $HoursBindingName
    $hoursEntry["database_id"] = $HoursDatabaseId
    $hoursEntry["migrations_dir"] = $HoursMigrationsDirectory
}
elseif ($matchingByBinding.Count -eq 1) {
    # Do not silently reassign a binding belonging to another database.
    $hoursEntry = $matchingByBinding[0]

    if ($hoursEntry.database_name -and $hoursEntry.database_name -ne $HoursDatabaseName) {
        throw "HOURS_DB is already assigned to '$($hoursEntry.database_name)'. No changes were made."
    }

    $hoursEntry["database_name"] = $HoursDatabaseName
    $hoursEntry["database_id"] = $HoursDatabaseId
    $hoursEntry["migrations_dir"] = $HoursMigrationsDirectory
}
else {
    # Add the existing service-hours database as a third D1 binding.
    $databases += @{
        binding        = $HoursBindingName
        database_name  = $HoursDatabaseName
        database_id    = $HoursDatabaseId
        migrations_dir = $HoursMigrationsDirectory
    }
}

$config["d1_databases"] = @($databases)

# Validate all three database bindings before saving.
$requiredBindings = @("DB", "SOCIAL_ACCOUNTS", "HOURS_DB")
foreach ($bindingName in $requiredBindings) {
    $found = @($config["d1_databases"] | Where-Object {
        $_.binding -eq $bindingName -and
        ![string]::IsNullOrWhiteSpace([string]$_.database_id)
    })

    if ($found.Count -ne 1) {
        throw "Expected exactly one valid D1 database binding named '$bindingName'. No configuration was saved."
    }
}

# Confirm HOURS_DB points to the expected existing database.
$verifiedHoursEntry = @($config["d1_databases"] | Where-Object {
    $_.binding -eq $HoursBindingName
})[0]

if ($verifiedHoursEntry.database_id -ne $HoursDatabaseId) {
    throw "HOURS_DB has an unexpected database ID. No configuration was saved."
}

# Make a timestamped backup before changing wrangler.json.
$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$backupPath = "$ConfigPath.before-hours-config-fix-$timestamp.backup"
Copy-Item -Path $ConfigPath -Destination $backupPath

# Save valid JSON. Existing DB and SOCIAL_ACCOUNTS entries are preserved.
$config |
    ConvertTo-Json -Depth 100 |
    Set-Content -Path $ConfigPath -Encoding utf8

# Re-read the saved file to ensure it is valid JSON.
$savedConfig = Get-Content -Path $ConfigPath -Raw | ConvertFrom-Json -AsHashtable
$savedHoursEntry = @($savedConfig["d1_databases"] | Where-Object {
    $_.binding -eq $HoursBindingName
})[0]

if ($savedHoursEntry.database_id -ne $HoursDatabaseId) {
    Copy-Item -Path $backupPath -Destination $ConfigPath -Force
    throw "Post-save verification failed. The original configuration was restored."
}

Write-Host "`nConfiguration repaired successfully." -ForegroundColor Green
Write-Host "Backup: $backupPath"
Write-Host "`nD1 bindings now configured:"
foreach ($entry in $savedConfig["d1_databases"]) {
    Write-Host " - $($entry.database_name) [$($entry.binding)]"
}

Write-Host "`nThe existing service-hours database was NOT recreated."
Write-Host "The migration was NOT reapplied."
Write-Host "website\index.html was NOT changed."

Write-Host "`nNext, verify the remote migration status with:" -ForegroundColor Cyan
Write-Host "npx wrangler d1 migrations list volunteer-hours-db --remote"
Write-Host "`nThen verify the tables with:" -ForegroundColor Cyan
Write-Host 'npx wrangler d1 execute volunteer-hours-db --remote --command="SELECT name FROM sqlite_master WHERE type=''table'' AND name LIKE ''service_hour%'';"'
