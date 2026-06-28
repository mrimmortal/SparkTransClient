[CmdletBinding()]
param(
  [ValidateSet("up", "deploy", "help")]
  [string]$Action = "up",

  [string]$BackendHost = "127.0.0.1",
  [int]$BackendPort = 8000,
  [string]$FrontendHost = "127.0.0.1",
  [int]$FrontendPort = 8080
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$RootDir = Resolve-Path (Join-Path $PSScriptRoot "..")
$BackendDir = Join-Path $RootDir "backend"
$FrontendDir = Join-Path $RootDir "frontend"
$VenvPython = Join-Path $BackendDir ".venv\Scripts\python.exe"
$VenvPip = Join-Path $BackendDir ".venv\Scripts\pip.exe"
$MinPythonMajor = 3
$MinPythonMinor = 12
$MinNodeMajor = 22

function Show-Usage {
  Write-Output "Usage: .\scripts\deploy-terminal-windows.ps1 [-Action up|deploy]"
  Write-Output ""
  Write-Output "Starts backend and frontend directly in this terminal without Docker."
  Write-Output ""
  Write-Output "Requires:"
  Write-Output "  Python  $MinPythonMajor.$MinPythonMinor or newer"
  Write-Output "  Node.js $MinNodeMajor or newer, with npm"
}

function Show-PythonInstallInstructions {
  Write-Error @"
Python $MinPythonMajor.$MinPythonMinor or newer is required and was not found.

Install Python $MinPythonMajor.$MinPythonMinor or newer, then re-run:
  winget install --id Python.Python.3.12 --source winget
  choco install python312 -y
"@
}

function Show-NodeInstallInstructions {
  Write-Error @"
Node.js $MinNodeMajor or newer with npm is required and was not found.

Install Node.js $MinNodeMajor or newer, then re-run:
  winget install --id OpenJS.NodeJS.LTS --source winget
  choco install nodejs-lts -y
"@
}

function Install-Python {
  Write-Output "Python $MinPythonMajor.$MinPythonMinor or newer is not available. Attempting installation..."

  if ($null -ne (Get-Command winget -ErrorAction SilentlyContinue)) {
    & winget install --id Python.Python.3.12 --source winget --accept-package-agreements --accept-source-agreements
    return
  }

  if ($null -ne (Get-Command choco -ErrorAction SilentlyContinue)) {
    & choco install python312 -y
    return
  }

  Show-PythonInstallInstructions
  throw "Unable to install Python automatically."
}

function Install-Node {
  Write-Output "Node.js $MinNodeMajor or newer with npm is not available. Attempting installation..."

  if ($null -ne (Get-Command winget -ErrorAction SilentlyContinue)) {
    & winget install --id OpenJS.NodeJS.LTS --source winget --accept-package-agreements --accept-source-agreements
    return
  }

  if ($null -ne (Get-Command choco -ErrorAction SilentlyContinue)) {
    & choco install nodejs-lts -y
    return
  }

  Show-NodeInstallInstructions
  throw "Unable to install Node.js automatically."
}

function Get-PythonVersion {
  param([pscustomobject]$Command)

  $Output = & $Command.Executable @($Command.Arguments) -c "import sys; print(f'{sys.version_info.major}.{sys.version_info.minor}')" 2>$null
  if ($LASTEXITCODE -ne 0 -or [string]::IsNullOrWhiteSpace($Output)) {
    return $null
  }

  return [version]$Output.Trim()
}

function Find-SupportedPythonCommand {
  $Candidates = @()

  if ($null -ne (Get-Command py -ErrorAction SilentlyContinue)) {
    $Candidates += [pscustomobject]@{ Executable = "py"; Arguments = @("-3.12") }
    $Candidates += [pscustomobject]@{ Executable = "py"; Arguments = @("-3") }
  }

  if ($null -ne (Get-Command python -ErrorAction SilentlyContinue)) {
    $Candidates += [pscustomobject]@{ Executable = "python"; Arguments = @() }
  }

  if ($null -ne (Get-Command python3 -ErrorAction SilentlyContinue)) {
    $Candidates += [pscustomobject]@{ Executable = "python3"; Arguments = @() }
  }

  foreach ($Candidate in $Candidates) {
    $Version = Get-PythonVersion -Command $Candidate
    if ($null -ne $Version -and ($Version.Major -gt $MinPythonMajor -or ($Version.Major -eq $MinPythonMajor -and $Version.Minor -ge $MinPythonMinor))) {
      return $Candidate
    }
  }

  return $null
}

function Ensure-SupportedPython {
  $PythonCommand = Find-SupportedPythonCommand
  if ($null -ne $PythonCommand) {
    return $PythonCommand
  }

  Install-Python
  $PythonCommand = Find-SupportedPythonCommand
  if ($null -ne $PythonCommand) {
    return $PythonCommand
  }

  Show-PythonInstallInstructions
  throw "Python $MinPythonMajor.$MinPythonMinor or newer is still unavailable after installation."
}

function Ensure-SupportedNode {
  $HasNode = $null -ne (Get-Command node -ErrorAction SilentlyContinue)
  $HasNpm = $null -ne (Get-Command npm -ErrorAction SilentlyContinue)

  if ($HasNode -and $HasNpm) {
    $NodeMajor = [int](& node -p "Number(process.versions.node.split('.')[0])")
    if ($LASTEXITCODE -eq 0 -and $NodeMajor -ge $MinNodeMajor) {
      return
    }
  }

  Install-Node

  $HasNode = $null -ne (Get-Command node -ErrorAction SilentlyContinue)
  $HasNpm = $null -ne (Get-Command npm -ErrorAction SilentlyContinue)
  if ($HasNode -and $HasNpm) {
    $NodeMajor = [int](& node -p "Number(process.versions.node.split('.')[0])")
    if ($LASTEXITCODE -eq 0 -and $NodeMajor -ge $MinNodeMajor) {
      return
    }
  }

  Show-NodeInstallInstructions
  throw "Node.js $MinNodeMajor or newer with npm is still unavailable after installation."
}

if ($Action -eq "help") {
  Show-Usage
  exit 0
}

$PythonCommand = Ensure-SupportedPython
Ensure-SupportedNode

if (-not (Test-Path $VenvPython)) {
  & $PythonCommand.Executable @($PythonCommand.Arguments) -m venv (Join-Path $BackendDir ".venv")
}

if (-not (Test-Path $VenvPython)) {
  throw "Virtual environment Python was not created at $VenvPython"
}

if (-not (Test-Path $VenvPip)) {
  throw "Virtual environment pip was not created at $VenvPip"
}

& $VenvPip install -r (Join-Path $BackendDir "requirements.txt")
& $VenvPython (Join-Path $BackendDir "scripts\seed_sample_user.py")

if (Test-Path (Join-Path $FrontendDir "package-lock.json")) {
  & npm --prefix $FrontendDir ci
} else {
  & npm --prefix $FrontendDir install
}
& npm --prefix $FrontendDir run build

$BackendArgs = @(
  "/c",
  "`"$VenvPython`" -m uvicorn app.main:app --host $BackendHost --port $BackendPort"
)
$FrontendArgs = @(
  "/c",
  "npm --prefix `"$FrontendDir`" run preview -- --host $FrontendHost --port $FrontendPort"
)

Write-Output "Starting backend: http://${BackendHost}:${BackendPort}"
$BackendProcess = Start-Process -FilePath "cmd.exe" -ArgumentList $BackendArgs -WorkingDirectory $BackendDir -NoNewWindow -PassThru

Write-Output "Starting frontend preview: http://${FrontendHost}:${FrontendPort}"
$FrontendProcess = Start-Process -FilePath "cmd.exe" -ArgumentList $FrontendArgs -WorkingDirectory $RootDir -NoNewWindow -PassThru

Write-Output ""
Write-Output "Sample login:"
Write-Output "  Email:    sample@sparktrans.app"
Write-Output "  Password: SampleUser123!"
Write-Output ""
Write-Output "CoreSTT expected at ws://127.0.0.1:8020/ws/transcribe for real dictation."
Write-Output "Press Ctrl+C to stop both servers."

try {
  $ProcessIds = @($BackendProcess.Id, $FrontendProcess.Id)
  Wait-Process -Id $ProcessIds
} finally {
  if (-not $BackendProcess.HasExited) {
    Stop-Process -Id $BackendProcess.Id -Force
  }
  if (-not $FrontendProcess.HasExited) {
    Stop-Process -Id $FrontendProcess.Id -Force
  }
}
