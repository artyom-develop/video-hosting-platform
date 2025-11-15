#!/usr/bin/env pwsh

# Swarm Management Script for Windows PowerShell

# Colors
$Green = 'Green'
$Red = 'Red'
$Yellow = 'Yellow'
$Cyan = 'Cyan'

function Print-Header {
    param([string]$Message)
    Write-Host "=====================================" -ForegroundColor $Cyan
    Write-Host $Message -ForegroundColor $Cyan
    Write-Host "=====================================" -ForegroundColor $Cyan
}

function Print-Success {
    param([string]$Message)
    Write-Host "✓ $Message" -ForegroundColor $Green
}

function Print-Error {
    param([string]$Message)
    Write-Host "✗ $Message" -ForegroundColor $Red
}

function Print-Warning {
    param([string]$Message)
    Write-Host "⚠ $Message" -ForegroundColor $Yellow
}

function Check-Docker {
    if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
        Print-Error "Docker is not installed or not in PATH"
        exit 1
    }
    Print-Success "Docker is installed"
}

function Init-Swarm {
    Print-Header "Initializing Docker Swarm"
    
    $swarmStatus = docker info | Select-String "Swarm: active"
    if ($swarmStatus) {
        Print-Warning "Swarm is already active"
        return
    }
    
    docker swarm init
    if ($LASTEXITCODE -eq 0) {
        Print-Success "Swarm initialized successfully"
        docker node ls
    }
    else {
        Print-Error "Failed to initialize Swarm"
        exit 1
    }
}

function Build-Images {
    Print-Header "Building Docker images"
    
    Write-Host "Building backend image..." -ForegroundColor $Yellow
    docker build -t kursach-backend:latest ./backend
    if ($LASTEXITCODE -eq 0) {
        Print-Success "Backend image built"
    }
    else {
        Print-Error "Failed to build backend image"
        exit 1
    }
    
    Write-Host "Building frontend image..." -ForegroundColor $Yellow
    docker build -t kursach-frontend:latest ./frontend
    if ($LASTEXITCODE -eq 0) {
        Print-Success "Frontend image built"
    }
    else {
        Print-Error "Failed to build frontend image"
        exit 1
    }
}

function Deploy-Stack {
    Print-Header "Deploying Xatube stack to Swarm"
    
    docker stack deploy -c docker-compose-swarm.yml xatube
    if ($LASTEXITCODE -eq 0) {
        Print-Success "Stack deployed successfully"
    }
    else {
        Print-Error "Failed to deploy stack"
        exit 1
    }
}

function Wait-ForServices {
    Print-Header "Waiting for services to be ready"
    
    Write-Host "Services status:" -ForegroundColor $Yellow
    docker service ls
    
    Write-Host "Waiting 30 seconds for services to stabilize..." -ForegroundColor $Yellow
    Start-Sleep -Seconds 30
    
    Write-Host "Service replicas:" -ForegroundColor $Yellow
    docker service ls --format "{{.Name}}`t{{.Replicas}}"
}

function Show-Logs {
    Print-Header "Recent service logs"
    
    Write-Host "Backend logs:" -ForegroundColor $Yellow
    docker service logs xatube_backend --tail 20 2>$null | ForEach-Object { $_ }
    
    Write-Host "Frontend logs:" -ForegroundColor $Yellow
    docker service logs xatube_frontend --tail 20 2>$null | ForEach-Object { $_ }
}

function Remove-Stack {
    Print-Header "Removing Xatube stack"
    
    docker stack rm xatube
    if ($LASTEXITCODE -eq 0) {
        Print-Success "Stack removed successfully"
    }
    else {
        Print-Error "Failed to remove stack"
    }
}

function Leave-Swarm {
    Print-Header "Leaving Swarm"
    
    docker swarm leave --force
    if ($LASTEXITCODE -eq 0) {
        Print-Success "Left Swarm successfully"
    }
    else {
        Print-Error "Failed to leave Swarm"
    }
}

function Show-Usage {
    Write-Host "Docker Swarm Management for Xatube"
    Write-Host ""
    Write-Host "Usage: .\swarm-manage.ps1 -Command {init|build|deploy|status|logs|remove|leave|help}"
    Write-Host ""
    Write-Host "Commands:"
    Write-Host "  init     - Initialize Docker Swarm"
    Write-Host "  build    - Build Docker images"
    Write-Host "  deploy   - Deploy stack to Swarm"
    Write-Host "  status   - Show service status"
    Write-Host "  logs     - Show service logs"
    Write-Host "  remove   - Remove stack from Swarm"
    Write-Host "  leave    - Leave Swarm and clean up"
    Write-Host "  help     - Show this help message"
}

# Main
param(
    [Parameter(Mandatory=$false)]
    [string]$Command = "help"
)

Check-Docker

switch ($Command.ToLower()) {
    "init" {
        Init-Swarm
    }
    "build" {
        Build-Images
    }
    "deploy" {
        Deploy-Stack
        Wait-ForServices
    }
    "status" {
        Print-Header "Swarm and Service Status"
        Write-Host "Swarm Status:" -ForegroundColor $Yellow
        docker info | Select-String -Pattern "Swarm" -Context 0, 5
        
        Write-Host "Nodes:" -ForegroundColor $Yellow
        docker node ls
        
        Write-Host "Services:" -ForegroundColor $Yellow
        docker service ls
        
        Write-Host "Service Details:" -ForegroundColor $Yellow
        docker service ls --format "{{.Name}}`t{{.Replicas}}`t{{.Image}}"
    }
    "logs" {
        Show-Logs
    }
    "remove" {
        Remove-Stack
        Wait-ForServices
    }
    "leave" {
        Remove-Stack
        Leave-Swarm
    }
    default {
        Show-Usage
    }
}
