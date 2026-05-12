# update-skills-list.ps1
# Scans .claude/commands and regenerates the skills table in README.md
# Preserves the README header (everything before the table) to avoid encoding issues.

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$projectRoot = Split-Path -Parent $scriptDir
$commandsDir = Join-Path $projectRoot ".claude\commands"
$readmeFile = Join-Path $projectRoot "README.md"

# Build table rows from command files
$commandRows = [System.Collections.Generic.List[string]]::new()

if (Test-Path $commandsDir) {
    $commandFiles = Get-ChildItem -Path $commandsDir -Filter "*.md" | Sort-Object Name

    foreach ($file in $commandFiles) {
        $content = [System.IO.File]::ReadAllText($file.FullName, [System.Text.Encoding]::UTF8)
        $cmdName = $file.BaseName
        $nameZh = ""
        $description = ""

        if ($content -match '(?s)^---.*?name_zh:\s*(.+?)\s*\n') { $nameZh = $matches[1].Trim() }
        if ($content -match '(?s)^---.*?description:\s*(.+?)\s*\n---') { $description = $matches[1].Trim() }

        if ($nameZh -eq "") { $nameZh = $cmdName }
        if ($description -eq "") {
            $lines = ($content -split "`n") | Where-Object { $_.Trim() -ne "" -and -not $_.Trim().StartsWith("#") -and -not $_.Trim().StartsWith("---") }
            if ($lines.Count -gt 0) { $description = $lines[0].Trim() }
        }

        $commandRows.Add("| ``/$cmdName`` | $nameZh | $description |")
    }
}

# Preserve the README header (everything before the table) to avoid encoding issues
$header = ""
if (Test-Path $readmeFile) {
    $existing = [System.IO.File]::ReadAllText($readmeFile, [System.Text.Encoding]::UTF8)
    $markerIdx = $existing.IndexOf("| Command |")
    if ($markerIdx -ge 0) {
        $header = $existing.Substring(0, $markerIdx)
    } else {
        $header = $existing.TrimEnd() + "`n`n"
    }
}

$tableRows = ($commandRows -join "`n") + "`n"
$tableHeader = "| Command |"
# Read the table header line from existing README if present; otherwise use a safe fallback
$tableHeaderLine = ""
if ($existing -match '(\| Command \|[^\n]+)') { $tableHeaderLine = $matches[1] }
if ($tableHeaderLine -eq "") { $tableHeaderLine = "| Command | Name | Description |" }

$newTable = $tableHeaderLine + "`n|---------|------|------|`n" + $tableRows

$readmeContent = $header + $newTable
[System.IO.File]::WriteAllText($readmeFile, $readmeContent, [System.Text.Encoding]::UTF8)
Write-Host "README.md updated. Commands: $($commandRows.Count)"
