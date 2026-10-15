# Moneyline Studio toolchain check (Phase 0)
# Run: powershell -ExecutionPolicy Bypass -File .\scripts\doctor.ps1
# Reads nothing secret: it only checks that .env exists and which keys are filled in, never prints values.

$ok = 0; $bad = 0

function Check-Cmd($label, $cmd, $versionArgs) {
    $found = Get-Command $cmd -ErrorAction SilentlyContinue
    if ($found) {
        $v = & $cmd $versionArgs 2>&1 | Select-Object -First 1
        Write-Host ("OK       {0,-12} {1}" -f $label, $v) -ForegroundColor Green
        $script:ok++
    } else {
        Write-Host ("MISSING  {0,-12} (command '{1}' not found)" -f $label, $cmd) -ForegroundColor Red
        $script:bad++
    }
}

Write-Host "`n== Commands ==" -ForegroundColor Cyan
Check-Cmd "git"     "git"     "--version"
Check-Cmd "node"    "node"    "--version"
Check-Cmd "npm"     "npm"     "--version"
Check-Cmd "python"  "python"  "--version"
Check-Cmd "ffmpeg"  "ffmpeg"  "-version"
Check-Cmd "claude"  "claude"  "--version"

# Node major version
$nodeCmd = Get-Command node -ErrorAction SilentlyContinue
if ($nodeCmd) {
    $major = [int]((node --version).TrimStart('v').Split('.')[0])
    if ($major -lt 22) {
        Write-Host "WARN     node is v$major; this project needs v22 or newer" -ForegroundColor Yellow
    }
}

# Python 3.11
$pyCmd = Get-Command python -ErrorAction SilentlyContinue
if ($pyCmd) {
    $pv = (python --version 2>&1).ToString()
    if ($pv -notmatch "3\.11") {
        Write-Host "WARN     $pv found; tools/audio expects Python 3.11" -ForegroundColor Yellow
    }
}

Write-Host "`n== .env ==" -ForegroundColor Cyan
$envPath = Join-Path (Get-Location) ".env"
if (Test-Path $envPath) {
    $lines = Get-Content $envPath | Where-Object { $_ -match "^[A-Z_]+=" }
    $want = @("NVIDIA_API_KEY","NVIDIA_MODEL","SEC_USER_AGENT","FRED_API_KEY","PIXABAY_API_KEY","RHUBARB_PATH")
    # Optional: Pexels paused new API keys (Oct 2026); footage also comes from keyless sources.
    $optional = @("PEXELS_API_KEY")
    foreach ($k in ($want + $optional)) {
        $line = $lines | Where-Object { $_ -like "$k=*" } | Select-Object -First 1
        if ($line -and ($line.Substring($k.Length + 1).Trim().Length -gt 0)) {
            Write-Host ("OK       {0,-16} set" -f $k) -ForegroundColor Green; $ok++
        } elseif ($optional -contains $k) {
            Write-Host ("SKIP     {0,-16} empty (optional)" -f $k) -ForegroundColor DarkGray
        } else {
            Write-Host ("MISSING  {0,-16} empty in .env" -f $k) -ForegroundColor Red; $bad++
        }
    }
} else {
    Write-Host "MISSING  .env  (run: Copy-Item .env.example .env)" -ForegroundColor Red; $bad++
}

Write-Host "`n== Rhubarb ==" -ForegroundColor Cyan
$rh = $null
if (Test-Path $envPath) {
    $rhLine = Get-Content $envPath | Where-Object { $_ -like "RHUBARB_PATH=*" } | Select-Object -First 1
    if ($rhLine) { $rh = $rhLine.Substring(13).Trim() }
}
if ($rh -and (Test-Path $rh)) { Write-Host "OK       rhubarb at $rh" -ForegroundColor Green; $ok++ }
else { Write-Host "MISSING  rhubarb (set RHUBARB_PATH in .env to rhubarb.exe)" -ForegroundColor Red; $bad++ }

Write-Host "`n== Outside skills (user level) ==" -ForegroundColor Cyan
$skills = Join-Path $HOME ".claude\skills"
foreach ($s in @("content-principles","yt-script","yt-package","yt-seo","yt-chapters","yt-shorts")) {
    if (Test-Path (Join-Path $skills $s)) { Write-Host "OK       skill $s" -ForegroundColor Green; $ok++ }
    else { Write-Host "MISSING  skill $s (see docs/SETUP_WINDOWS.md step 6)" -ForegroundColor Red; $bad++ }
}

Write-Host "`n== Machine ==" -ForegroundColor Cyan
$ramGB = [math]::Round((Get-CimInstance Win32_ComputerSystem).TotalPhysicalMemory / 1GB, 1)
$drive = (Get-Location).Drive
$freeGB = [math]::Round(($drive.Free) / 1GB, 1)
Write-Host "INFO     RAM ${ramGB} GB, free disk on $($drive.Name): ${freeGB} GB"
if ($freeGB -lt 20) { Write-Host "WARN     less than 20 GB free; renders and models may not fit" -ForegroundColor Yellow }

Write-Host ("`nDone: {0} OK, {1} missing." -f $ok, $bad)
if ($bad -gt 0) { exit 1 } else { exit 0 }
