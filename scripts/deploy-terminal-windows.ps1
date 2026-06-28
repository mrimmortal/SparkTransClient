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

$MinPythonMajor = 3
$MinPythonMinor = 12
$MinNodeMajor = 22

function Show-Usage {
  Write-Output "Usage: .\scripts\deploy-terminal-windows.ps1 [-Action up|deploy]"
  Write-Output ""
  Write-Output "Windows direct terminal deployment."
  Write-Output ""
  Write-Output "Requires:"
  Write-Output "  Python 3.12 or newer"
  Write-Output "  Node.js 22 or newer, with npm"
  Write-Output ""
  Write-Output "Runs the project using docs/COMMANDS.md:"
  Write-Output "  backend: python venv, pip install -r requirements.txt, seed user, uvicorn"
  Write-Output "  frontend: npm install, npm run build, npm run preview"
}

function Confirm-Install {
  param([string]$Name)

  $Answer = Read-Host "$Name is missing or unsupported. Install it now? [y/N]"
  return $Answer -in @("y", "Y", "yes", "YES")
}

function Install-Python {
  if (-not (Confirm-Install "Python $MinPythonMajor.$MinPythonMinor+")) {
    throw "Install Python $MinPythonMajor.$MinPythonMinor+ manually, then re-run this script."
  }

  if ($null -ne (Get-Command winget -ErrorAction SilentlyContinue)) {
    & winget install --id Python.Python.3.12 --source winget --accept-package-agreements --accept-source-agreements
    return
  }

  if ($null -ne (Get-Command choco -ErrorAction SilentlyContinue)) {
    & choco install python312 -y
    return
  }

  throw "No supported Windows package manager found. Install Python $MinPythonMajor.$MinPythonMinor+ manually."
}

function Install-Node {
  if (-not (Confirm-Install "Node.js $MinNodeMajor+ with npm")) {
    throw "Install Node.js $MinNodeMajor+ with npm manually, then re-run this script."
  }

  if ($null -ne (Get-Command winget -ErrorAction SilentlyContinue)) {
    & winget install --id OpenJS.NodeJS.LTS --source winget --accept-package-agreements --accept-source-agreements
    return
  }

  if ($null -ne (Get-Command choco -ErrorAction SilentlyContinue)) {
    & choco install nodejs-lts -y
    return
  }

  throw "No supported Windows package manager found. Install Node.js $MinNodeMajor+ manually."
}

function Get-PythonVersion {
  param([pscustomobject]$Command)

  $Output = & $Command.Executable @($Command.Arguments) -c "import sys; print(f'{sys.version_info.major}.{sys.version_info.minor}')" 2>$null
  if ($LASTEXITCODE -ne 0 -or [string]::IsNullOrWhiteSpace($Output)) {
    return $null
  }

  return [version]$Output.Trim()
}

function Find-SupportedPython {
  $Candidates = @()

  if ($null -ne (Get-Command py -ErrorAction SilentlyContinue)) {
    $Candidates += [pscustomobject]@{ Executable = "py"; Arguments = @("-3.12") }
    $Candidates += [pscustomobject]@{ Executable = "py"; Arguments = @("-3") }
  }

  if ($null -ne (Get-Command python -ErrorAction SilentlyContinue)) {
    $Candidates += [pscustomobject]@{ Executable = "python"; Arguments = @() }
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
  $PythonCommand = Find-SupportedPython
  if ($null -ne $PythonCommand) {
    return $PythonCommand
  }

  Install-Python
  $PythonCommand = Find-SupportedPython
  if ($null -ne $PythonCommand) {
    return $PythonCommand
  }

  throw "Python $MinPythonMajor.$MinPythonMinor+ is still unavailable. Install it manually, then re-run this script."
}

function Ensure-SupportedNode {
  if ($null -ne (Get-Command node -ErrorAction SilentlyContinue) -and $null -ne (Get-Command npm -ErrorAction SilentlyContinue)) {
    $NodeMajor = [int](& node -p "Number(process.versions.node.split('.')[0])")
    if ($LASTEXITCODE -eq 0 -and $NodeMajor -ge $MinNodeMajor) {
      return
    }
  }

  Install-Node

  if ($null -ne (Get-Command node -ErrorAction SilentlyContinue) -and $null -ne (Get-Command npm -ErrorAction SilentlyContinue)) {
    $NodeMajor = [int](& node -p "Number(process.versions.node.split('.')[0])")
    if ($LASTEXITCODE -eq 0 -and $NodeMajor -ge $MinNodeMajor) {
      return
    }
  }

  throw "Node.js $MinNodeMajor+ with npm is still unavailable. Install it manually, then re-run this script."
}

function Ensure-BackendVenv {
  param([pscustomobject]$PythonCommand)

  if (-not (Test-Path $VenvPython)) {
    & $PythonCommand.Executable @($PythonCommand.Arguments) -m venv (Join-Path $BackendDir ".venv")
  }

  if (-not (Test-Path $VenvPython)) {
    throw "Virtual environment was not created at $VenvPython"
  }
}

if ($Action -eq "help") {
  Show-Usage
  exit 0
}

$PythonCommand = Ensure-SupportedPython
Ensure-SupportedNode
Ensure-BackendVenv -PythonCommand $PythonCommand

& $VenvPython -m pip install -r (Join-Path $BackendDir "requirements.txt")
& $VenvPython (Join-Path $BackendDir "scripts\seed_sample_user.py")

& npm --prefix $FrontendDir install
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
  Wait-Process -Id @($BackendProcess.Id, $FrontendProcess.Id)
} finally {
  if (-not $BackendProcess.HasExited) {
    Stop-Process -Id $BackendProcess.Id -Force
  }
  if (-not $FrontendProcess.HasExited) {
    Stop-Process -Id $FrontendProcess.Id -Force
  }
}
