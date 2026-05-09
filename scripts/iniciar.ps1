$projectRoot = Split-Path $PSScriptRoot -Parent
$venvPython = Join-Path $projectRoot ".venv\Scripts\python.exe"
$bundledPython = "C:\Users\joaqu\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe"
$apiFile = Join-Path $projectRoot "api.py"
$sitePackages = Join-Path $projectRoot ".venv\Lib\site-packages"

Set-Location $projectRoot

$candidates = @()
if (Test-Path $venvPython) {
    $candidates += $venvPython
}

$systemPython = Get-Command python -ErrorAction SilentlyContinue
if ($systemPython) {
    $candidates += $systemPython.Source
}

if (Test-Path $bundledPython) {
    $candidates += $bundledPython
}

$pythonExe = $null
foreach ($candidate in $candidates | Select-Object -Unique) {
    try {
        & $candidate --version *> $null
        if ($LASTEXITCODE -eq 0) {
            $pythonExe = $candidate
            break
        }
    } catch {
        continue
    }
}

if (-not $pythonExe) {
    Write-Host ""
    Write-Host "No se encontro un interprete de Python utilizable." -ForegroundColor Red
    Write-Host "Instala Python o usa el entorno virtual del proyecto." -ForegroundColor Yellow
    exit 1
}

if ($pythonExe -eq $bundledPython -and (Test-Path $sitePackages)) {
    if ([string]::IsNullOrWhiteSpace($env:PYTHONPATH)) {
        $env:PYTHONPATH = $sitePackages
    } else {
        $env:PYTHONPATH = "$sitePackages;$env:PYTHONPATH"
    }
}

Write-Host ""
Write-Host "Iniciando Taskflow en http://localhost:5000" -ForegroundColor Cyan
Write-Host "Presiona Ctrl + C para detener el servidor." -ForegroundColor DarkGray
Write-Host ""

& $pythonExe $apiFile
