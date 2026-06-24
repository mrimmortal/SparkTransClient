[CmdletBinding()]
param(
  [ValidateSet("up", "deploy", "restart", "down", "status", "ps", "logs", "help")]
  [string]$Action = "up",

  [string]$ProjectName = $env:SPARKTRANS_PROJECT_NAME,

  [Parameter(ValueFromRemainingArguments = $true)]
  [string[]]$RemainingArgs
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

if ([string]::IsNullOrWhiteSpace($ProjectName)) {
  $ProjectName = "sparktransclient"
}

$RootDir = Resolve-Path (Join-Path $PSScriptRoot "..")

function Show-Usage {
  Write-Output "Usage: .\scripts\deploy-docker-windows.ps1 [-Action up|deploy|restart|down|status|ps|logs]"
  Write-Output ""
  Write-Output "Environment:"
  Write-Output "  SPARKTRANS_PROJECT_NAME  Docker Compose project name. Default: sparktransclient"
}

function Invoke-Compose {
  param([Parameter(ValueFromRemainingArguments = $true)][string[]]$ComposeArgs)

  docker compose version *> $null
  if ($LASTEXITCODE -eq 0) {
    & docker compose -p $ProjectName @ComposeArgs
    if ($LASTEXITCODE -ne 0) {
      throw "docker compose failed with exit code $LASTEXITCODE"
    }
    return
  }

  $DockerCompose = Get-Command docker-compose -ErrorAction SilentlyContinue
  if ($null -ne $DockerCompose) {
    & docker-compose -p $ProjectName @ComposeArgs
    if ($LASTEXITCODE -ne 0) {
      throw "docker-compose failed with exit code $LASTEXITCODE"
    }
    return
  }

  throw "Docker Compose is required. Install Docker Desktop with Compose support."
}

if ($Action -eq "help") {
  Show-Usage
  exit 0
}

if ($null -eq (Get-Command docker -ErrorAction SilentlyContinue)) {
  throw "Missing required command: docker"
}

Set-Location $RootDir

switch ($Action) {
  { $_ -in @("up", "deploy") } {
    Invoke-Compose up --build -d
    break
  }
  "restart" {
    Invoke-Compose down
    Invoke-Compose up --build -d
    break
  }
  "down" {
    Invoke-Compose down
    break
  }
  { $_ -in @("status", "ps") } {
    Invoke-Compose ps
    break
  }
  "logs" {
    Invoke-Compose logs -f @RemainingArgs
    break
  }
}

if ($Action -in @("up", "deploy", "restart")) {
  Write-Output ""
  Write-Output "SparkTransClient is starting with Docker Compose project: $ProjectName"
  Write-Output "Frontend: http://localhost:8080"
  Write-Output "Backend:  http://localhost:8000"
  Write-Output "Logs:     .\scripts\deploy-docker-windows.ps1 -Action logs"
}
