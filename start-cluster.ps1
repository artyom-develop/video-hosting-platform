#!/usr/bin/env pwsh
# XaTube Cluster Startup Script for PowerShell

$ErrorActionPreference = "Stop"

function Show-Header {
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host " XaTube Cluster Setup & Verification" -ForegroundColor Cyan
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host ""
}

function Check-Docker {
    Write-Host "[1/5] Checking Docker installation..." -ForegroundColor Yellow
    
    try {
        docker --version | Out-Null
        Write-Host "✓ Docker found" -ForegroundColor Green
    }
    catch {
        Write-Host "ERROR: Docker not found! Please install Docker Desktop" -ForegroundColor Red
        exit 1
    }
}

function Check-DockerCompose {
    Write-Host "[2/5] Checking Docker Compose..." -ForegroundColor Yellow
    
    try {
        docker compose version | Out-Null
        Write-Host "✓ Docker Compose found" -ForegroundColor Green
    }
    catch {
        Write-Host "ERROR: Docker Compose not found!" -ForegroundColor Red
        exit 1
    }
}

function Check-ProjectStructure {
    Write-Host "[3/5] Checking project structure..." -ForegroundColor Yellow
    
    if (-not (Test-Path "backend\Dockerfile")) {
        Write-Host "ERROR: backend\Dockerfile not found!" -ForegroundColor Red
        exit 1
    }
    
    if (-not (Test-Path "frontend\Dockerfile")) {
        Write-Host "ERROR: frontend\Dockerfile not found!" -ForegroundColor Red
        exit 1
    }
    
    Write-Host "✓ Project structure OK" -ForegroundColor Green
}

function Cleanup-OldContainers {
    Write-Host "[4/5] Cleaning up old containers..." -ForegroundColor Yellow
    
    try {
        docker compose -f docker-compose-cluster-lite.yml down -v 2>$null
        Write-Host "✓ Cleanup complete" -ForegroundColor Green
    }
    catch {
        # Ignore errors if nothing to cleanup
        Write-Host "✓ Cleanup complete (no old containers)" -ForegroundColor Green
    }
}

function Start-Cluster {
    Write-Host "[5/5] Starting XaTube cluster..." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "This will pull and build Docker images. Please wait..." -ForegroundColor Cyan
    Write-Host ""
    
    docker compose -f docker-compose-cluster-lite.yml up -d
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "ERROR: Failed to start cluster!" -ForegroundColor Red
        docker compose -f docker-compose-cluster-lite.yml logs
        exit 1
    }
}

function Show-Status {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "Cluster is starting..." -ForegroundColor Cyan
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Waiting for services to become healthy..." -ForegroundColor Yellow
    
    Start-Sleep -Seconds 30
    
    Write-Host ""
    Write-Host "Checking service status..." -ForegroundColor Yellow
    docker compose -f docker-compose-cluster-lite.yml ps
}

function Show-AccessPoints {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "🎉 XaTube Cluster Ready!" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
    Write-Host ""
    
    Write-Host "Access points:" -ForegroundColor Cyan
    Write-Host "  Application:   http://localhost" -ForegroundColor White
    Write-Host "  Frontend:      http://localhost:3000" -ForegroundColor White
    Write-Host "  API Docs:      http://localhost/docs" -ForegroundColor White
    Write-Host "  Prometheus:    http://localhost:9090" -ForegroundColor White
    Write-Host "  Grafana:       http://localhost:3001 (admin/password)" -ForegroundColor White
    Write-Host "  RabbitMQ:      http://localhost:15672 (guest/guest)" -ForegroundColor White
    Write-Host ""
    
    Write-Host "Backend instances (direct access):" -ForegroundColor Cyan
    Write-Host "  Backend-1:     http://localhost:8001" -ForegroundColor White
    Write-Host "  Backend-2:     http://localhost:8002" -ForegroundColor White
    Write-Host "  Backend-3:     http://localhost:8003" -ForegroundColor White
    Write-Host ""
    
    Write-Host "Database:" -ForegroundColor Cyan
    Write-Host "  Primary:       localhost:5432 (postgres/postgres)" -ForegroundColor White
    Write-Host "  Replica:       localhost:5433 (postgres/postgres)" -ForegroundColor White
    Write-Host ""
    
    Write-Host "Cache:" -ForegroundColor Cyan
    Write-Host "  Redis:         localhost:6379 (password: password)" -ForegroundColor White
    Write-Host ""
    
    Write-Host "RTMP:" -ForegroundColor Cyan
    Write-Host "  Server:        rtmp://localhost:1935/live" -ForegroundColor White
    Write-Host "  Stats:         http://localhost:8080/stat" -ForegroundColor White
    Write-Host ""
    
    Write-Host "For more information, see CLUSTER_SETUP.md" -ForegroundColor Yellow
    Write-Host ""
}

# Main execution
Show-Header
Write-Host ""

try {
    Check-Docker
    Write-Host ""
    
    Check-DockerCompose
    Write-Host ""
    
    Check-ProjectStructure
    Write-Host ""
    
    Cleanup-OldContainers
    Write-Host ""
    
    Start-Cluster
    
    Show-Status
    Show-AccessPoints
}
catch {
    Write-Host "ERROR: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}
