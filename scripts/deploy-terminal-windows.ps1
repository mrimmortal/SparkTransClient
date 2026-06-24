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

function Show-Usage {
  Write-Output "Usage: .\scripts\deploy-terminal-windows.ps1 [-Action up|deploy]"
  Write-Output ""
  Write-Output "Starts backend and frontend directly in this terminal without Docker."
}

if ($Action -eq "help") {
  Show-Usage
  exit 0
}

if ($null -eq (Get-Command npm -ErrorAction SilentlyContinue)) {
  throw "Missing required command: npm"
}

if (-not (Test-Path $VenvPython)) {
  $PythonCommand = Get-Command py -ErrorAction SilentlyContinue
  if ($null -ne $PythonCommand) {
    & py -3 -m venv (Join-Path $BackendDir ".venv")
  } elseif ($null -ne (Get-Command python -ErrorAction SilentlyContinue)) {
    & python -m venv (Join-Path $BackendDir ".venv")
  } else {
    throw "Missing required command: py or python"
  }
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
