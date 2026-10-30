<#
Volunteer Hub - Database Verification (corrected)
- Reads the project's Wrangler configuration.
- Reviews migration SQL and server-side error-handling patterns.
- Checks .gitignore and reports tracked secret-like filenames for manual review.
- Runs a disposable LOCAL D1 persistence test using a temporary Wrangler config.
- Reads remote D1 schema metadata only; it does not write to remote databases.
#>

[CmdletBinding()]
param(
    [string]$ProjectRoot = (Get-Location).Path,
    [string]$ReportPath = ""
)

$ErrorActionPreference = "Stop"
$script:Results = [System.Collections.Generic.List[object]]::new()

function Add-Result {
    param(
        [string]$Check,
        [ValidateSet("PASS","WARN","FAIL","INFO")][string]$Status,
        [string]$Details
    )
    $script:Results.Add([pscustomobject]@{
        Check = $Check
        Status = $Status
        Details = $Details
    })
    $color = switch ($Status) {
        "PASS" { "Green" }
        "WARN" { "Yellow" }
        "FAIL" { "Red" }
        default { "Cyan" }
    }
    Write-Host ("[{0}] {1} - {2}" -f $Status, $Check, $Details) -ForegroundColor $color
}

function Invoke-Wrangler {
    param([string[]]$Arguments)
    $output = & npx wrangler @Arguments 2>&1
    $exitCode = $LASTEXITCODE
    [pscustomobject]@{
        ExitCode = $exitCode
        Output = ($output | Out-String).Trim()
    }
}

$ProjectRoot = (Resolve-Path -LiteralPath $ProjectRoot).Path
Set-Location -LiteralPath $ProjectRoot

Write-Host "`nVolunteer Hub database verification (corrected)" -ForegroundColor Cyan
Write-Host "Project: $ProjectRoot`n"

# Find Wrangler config. Wrap in @() so a single result remains an array.
$configCandidates = @(
    "wrangler.json",
    "wrangler.jsonc",
    "wrangler.toml"
) | ForEach-Object {
    Join-Path $ProjectRoot $_
} | Where-Object {
    Test-Path -LiteralPath $_ -PathType Leaf
}

$config = $null
$configPath = $null
if ($configCandidates.Count -gt 0) {
    $configPath = $configCandidates | Select-Object -First 1
    if ([IO.Path]::GetExtension($configPath) -eq ".toml") {
        Add-Result "Inspect database configuration" "WARN" "Found wrangler.toml; this script does not parse TOML automatically."
    } else {
        try {
            $configText = Get-Content -LiteralPath $configPath -Raw
            # Basic JSONC support: remove full-line // comments.
            $cleanText = $configText -replace '(?m)^\s*//.*$',''
            $config = ConvertFrom-Json -InputObject $cleanText
            $bindings = @($config.d1_databases)
            if ($bindings.Count -gt 0) {
                $bindingSummary = ($bindings | ForEach-Object {
                    "{0} -> {1}" -f $_.binding, $_.database_name
                }) -join "; "
                Add-Result "Inspect database configuration" "PASS" "Read $([IO.Path]::GetFileName($configPath)); D1 bindings: $bindingSummary"
            } else {
                Add-Result "Inspect database configuration" "FAIL" "No d1_databases bindings found."
            }
        } catch {
            Add-Result "Inspect database configuration" "FAIL" "Could not parse Wrangler config: $($_.Exception.Message)"
        }
    }
} else {
    Add-Result "Inspect database configuration" "FAIL" "No wrangler.json, wrangler.jsonc, or wrangler.toml found."
}

if ($config -and $config.d1_databases) {
    $names = @($config.d1_databases | ForEach-Object { [string]$_.binding })
    $expected = @("DB", "SOCIAL_ACCOUNTS", "HOURS_DB")
    $missing = @($expected | Where-Object { $_ -notin $names })
    if ($missing.Count -eq 0) {
        Add-Result "Choose compatible backend / verify bindings" "PASS" "Expected Cloudflare D1 bindings are configured."
    } else {
        Add-Result "Choose compatible backend / verify bindings" "WARN" "Expected bindings not found: $($missing -join ', ')."
    }

    $hours = @($config.d1_databases | Where-Object { $_.binding -eq "HOURS_DB" })
    if ($hours.Count -gt 0 -and $hours[0].database_name -eq "volunteer-hours-db") {
        Add-Result "Keep service-hours database separate" "PASS" "HOURS_DB points to volunteer-hours-db."
    } else {
        Add-Result "Keep service-hours database separate" "WARN" "Could not confirm HOURS_DB points to volunteer-hours-db."
    }
} else {
    Add-Result "Choose compatible backend / verify bindings" "WARN" "D1 bindings could not be verified."
}

# Inspect SQL migrations.
$migrationFiles = @()
$migrationRoot = Join-Path $ProjectRoot "migrations"
if (Test-Path -LiteralPath $migrationRoot) {
    $migrationFiles = @(Get-ChildItem -LiteralPath $migrationRoot -Filter "*.sql" -File -Recurse)
}
if ($migrationFiles.Count -gt 0) {
    $sql = ($migrationFiles | ForEach-Object { Get-Content -LiteralPath $_.FullName -Raw }) -join "`n"
    $tables = @(
        [regex]::Matches($sql, '(?im)CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?["`\[]?([A-Za-z_][A-Za-z0-9_]*)') |
        ForEach-Object { $_.Groups[1].Value } | Sort-Object -Unique
    )
    if ($tables.Count -gt 0) {
        Add-Result "Design data tables" "PASS" "Found tables: $($tables -join ', ')"
    } else {
        Add-Result "Design data tables" "WARN" "No CREATE TABLE statements detected."
    }

    $references = [regex]::Matches($sql, '(?i)\bREFERENCES\b').Count
    if ($references -gt 0) {
        Add-Result "Define relationships" "PASS" "Found $references REFERENCES clause(s)."
    } else {
        Add-Result "Define relationships" "WARN" "No foreign-key REFERENCES clauses detected."
    }

    $types = @("INTEGER","TEXT","REAL","BLOB","NUMERIC") | Where-Object {
        [regex]::IsMatch($sql, "(?i)\b$_\b")
    }
    if ($types.Count -gt 0) {
        Add-Result "Use appropriate data types" "PASS" "SQLite types found: $($types -join ', '). Column-by-column suitability still requires review."
    } else {
        Add-Result "Use appropriate data types" "WARN" "No common SQLite types detected."
    }
} else {
    Add-Result "Design tables / relationships / data types" "WARN" "No SQL migration files found under .\migrations."
}

# Static review of Functions error handling.
$functionsPath = Join-Path $ProjectRoot "functions"
$jsFiles = @()
if (Test-Path -LiteralPath $functionsPath) {
    $jsFiles = @(Get-ChildItem -LiteralPath $functionsPath -Filter "*.js" -File -Recurse)
}
if ($jsFiles.Count -gt 0) {
    $js = ($jsFiles | ForEach-Object { Get-Content -LiteralPath $_.FullName -Raw }) -join "`n"
    $tryCount = [regex]::Matches($js, '(?i)\btry\s*\{').Count
    $catchCount = [regex]::Matches($js, '(?i)\bcatch\s*\(').Count
    if ($tryCount -gt 0 -and $catchCount -gt 0) {
        Add-Result "Handle database errors" "PASS" "Found $tryCount try block(s) and $catchCount catch block(s). Static check only."
    } else {
        Add-Result "Handle database errors" "WARN" "No complete try/catch pattern detected. Runtime database error tests are still needed."
    }
    $statusCount = [regex]::Matches($js, '\bstatus\s*:\s*(?:4\d\d|5\d\d)\b').Count
    Add-Result "Validate API error responses" "INFO" "Found $statusCount explicit 4xx/5xx status patterns; response quality is not verified."
} else {
    Add-Result "Handle database errors" "WARN" "No Pages Functions JavaScript files found."
}

# Credential safeguards: inspect names only, never print file contents.
$gitIgnorePath = Join-Path $ProjectRoot ".gitignore"
$ignoreText = if (Test-Path -LiteralPath $gitIgnorePath) {
    Get-Content -LiteralPath $gitIgnorePath -Raw
} else { "" }

$envRulesPresent = (
    $ignoreText -match '(?m)^\s*\.env\s*$' -and
    $ignoreText -match '(?m)^\s*\.dev\.vars\s*$'
)

$trackedSensitive = @()
if (Get-Command git -ErrorAction SilentlyContinue) {
    $trackedFiles = & git ls-files 2>$null
    $trackedSensitive = @($trackedFiles | Where-Object {
        $_ -match '(^|/)(\.env(\..*)?|\.dev\.vars(\..*)?|.*private.?key.*|.*credential.*)$'
    })
}
if ($envRulesPresent -and $trackedSensitive.Count -eq 0) {
    Add-Result "Protect credentials" "PASS" ".gitignore contains .env and .dev.vars rules; no obvious tracked credential filenames found."
} else {
    $notes = @()
    if (-not $envRulesPresent) { $notes += ".gitignore should include .env and .dev.vars rules" }
    if ($trackedSensitive.Count -gt 0) { $notes += "review tracked files: $($trackedSensitive -join ', ')" }
    Add-Result "Protect credentials" "WARN" ($notes -join "; ")
}
Add-Result "Cloudflare secret values" "INFO" "This script does not read or display secret values. Confirm credentials are stored as Cloudflare secrets."

# Disposable LOCAL D1 test with its own temporary Wrangler config.
$tempRoot = Join-Path ([IO.Path]::GetTempPath()) ("vh-d1-" + [guid]::NewGuid().ToString("N"))
$tempPersist = Join-Path $tempRoot "persist"
$tempConfig = Join-Path $tempRoot "wrangler.json"
try {
    New-Item -ItemType Directory -Path $tempPersist -Force | Out-Null

    $tempDbName = "vh-local-verification"
    $tempDbId = [guid]::NewGuid().ToString()
    $tempWrangler = [ordered]@{
        name = "vh-local-verification"
        compatibility_date = "2026-10-29"
        d1_databases = @(
            [ordered]@{
                binding = "TEST_DB"
                database_name = $tempDbName
                database_id = $tempDbId
            }
        )
    }
    $tempWrangler | ConvertTo-Json -Depth 8 | Set-Content -LiteralPath $tempConfig -Encoding UTF8

    $common = @("--config", $tempConfig, "d1", "execute", $tempDbName, "--local", "--persist-to", $tempPersist)
    $commands = @(
        "CREATE TABLE IF NOT EXISTS verification_smoke_test (id INTEGER PRIMARY KEY, label TEXT NOT NULL, hours REAL NOT NULL);",
        "INSERT INTO verification_smoke_test (id, label, hours) VALUES (1, 'local-persistence-check', 1.5);",
        "SELECT id, label, hours FROM verification_smoke_test WHERE id = 1;",
        "UPDATE verification_smoke_test SET hours = 2.0 WHERE id = 1;",
        "DELETE FROM verification_smoke_test WHERE id = 1;",
        "DROP TABLE IF EXISTS verification_smoke_test;"
    )

    $step = 0
    foreach ($command in $commands) {
        $step++
        $args = @($common) + @("--command", $command)
        $result = Invoke-Wrangler $args
        if ($result.ExitCode -ne 0) {
            throw "Local D1 step $step failed: $($result.Output)"
        }
        if ($step -eq 3 -and $result.Output -notmatch "local-persistence-check") {
            throw "Local D1 SELECT did not show the inserted test row. Output: $($result.Output)"
        }
    }
    Add-Result "Test persistence (local D1)" "PASS" "Temporary local D1 CREATE/INSERT/SELECT across commands/UPDATE/DELETE/DROP succeeded. No production DB was written."
} catch {
    Add-Result "Test persistence (local D1)" "WARN" "Temporary local D1 test did not complete: $($_.Exception.Message)"
} finally {
    if (Test-Path -LiteralPath $tempRoot) {
        Remove-Item -LiteralPath $tempRoot -Recurse -Force -ErrorAction SilentlyContinue
    }
}

# Write a clearly labelled, non-executed sample fixture.
$fixturePath = Join-Path $ProjectRoot "database-test-data.example.sql"
$fixture = @'
-- EXAMPLE DATA ONLY. Do not run against production.
-- Run only in a disposable LOCAL database after applying the main DB migrations.
INSERT INTO volunteers (name, email)
VALUES ('Jordan Sample', 'jordan.sample@example.test');

INSERT INTO profiles (volunteer_id, bio, phone, location)
SELECT id, 'Local test profile.', '555-0100', 'Smyrna, GA'
FROM volunteers
WHERE email = 'jordan.sample@example.test';

INSERT INTO opportunities (title, description, organization, location, status)
VALUES ('Community Cleanup - Test', 'Disposable local test opportunity.',
        'Sample Community Group', 'Smyrna, GA', 'open');

INSERT INTO volunteer_signups (volunteer_id, opportunity_id, status)
SELECT v.id, o.id, 'pending'
FROM volunteers v CROSS JOIN opportunities o
WHERE v.email = 'jordan.sample@example.test'
  AND o.title = 'Community Cleanup - Test';

-- Service-hours data belongs in the separate volunteer-hours-db only.
-- Apply its migration before using a service_hour_reports fixture.
'@
try {
    Set-Content -LiteralPath $fixturePath -Value $fixture -Encoding UTF8
    Add-Result "Prepare realistic test data" "PASS" "Created database-test-data.example.sql; this fixture was not executed."
} catch {
    Add-Result "Prepare realistic test data" "WARN" "Could not create fixture: $($_.Exception.Message)"
}

# Remote schema metadata only. No remote INSERT/UPDATE/DELETE operations.
if ($config -and $config.d1_databases -and (Get-Command npx -ErrorAction SilentlyContinue)) {
    foreach ($binding in @($config.d1_databases)) {
        if (-not $binding.database_name) { continue }
        $remoteQuery = "SELECT name, type FROM sqlite_master WHERE type IN ('table','index') ORDER BY type, name;"
        $remoteResult = Invoke-Wrangler @("d1","execute",[string]$binding.database_name,"--remote","--command",$remoteQuery)
        if ($remoteResult.ExitCode -eq 0) {
            Add-Result "Remote schema read-only: $($binding.database_name)" "PASS" "Successfully read remote table/index metadata; no data modified."
        } else {
            Add-Result "Remote schema read-only: $($binding.database_name)" "WARN" "Could not read metadata: $($remoteResult.Output)"
        }
    }
}

if ([string]::IsNullOrWhiteSpace($ReportPath)) {
    $ReportPath = Join-Path $ProjectRoot ("database-verification-report-" + (Get-Date -Format "yyyyMMdd-HHmmss") + ".txt")
} elseif (-not [IO.Path]::IsPathRooted($ReportPath)) {
    $ReportPath = Join-Path $ProjectRoot $ReportPath
}

$report = @(
    "Volunteer Hub Database Verification",
    "Project: $ProjectRoot",
    "Date: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')",
    "",
    "Remote D1 operations were schema-metadata reads only.",
    "Persistence test used a temporary local D1 config and local storage.",
    "Static scans are not proof of runtime security or application correctness.",
    "",
    ($script:Results | Format-Table -AutoSize | Out-String)
)
Set-Content -LiteralPath $ReportPath -Value ($report -join "`r`n") -Encoding UTF8

Write-Host "`nReport saved to: $ReportPath" -ForegroundColor Cyan
Write-Host "`nFinished. Review WARN/FAIL results; static checks are not proof of runtime behavior." -ForegroundColor Yellow


