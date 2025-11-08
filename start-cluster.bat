@echo off
REM XaTube Cluster Startup Script for Windows

setlocal enabledelayedexpansion

echo ========================================
echo  XaTube Cluster Setup & Verification
echo ========================================
echo.

REM Check Docker
echo [1/5] Checking Docker installation...
docker --version >nul 2>&1
if !errorlevel! neq 0 (
    echo ERROR: Docker not found! Please install Docker Desktop
    exit /b 1
)
echo ✓ Docker found
echo.

REM Check Docker Compose
echo [2/5] Checking Docker Compose...
docker compose version >nul 2>&1
if !errorlevel! neq 0 (
    echo ERROR: Docker Compose not found!
    exit /b 1
)
echo ✓ Docker Compose found
echo.

REM Check Backend folder
echo [3/5] Checking project structure...
if not exist "backend\Dockerfile" (
    echo ERROR: backend\Dockerfile not found!
    echo Please ensure project structure is correct
    exit /b 1
)
if not exist "frontend\Dockerfile" (
    echo ERROR: frontend\Dockerfile not found!
    exit /b 1
)
echo ✓ Project structure OK
echo.

REM Clean up old containers
echo [4/5] Cleaning up old containers...
docker compose -f docker-compose-cluster-lite.yml down -v 2>nul
echo ✓ Cleanup complete
echo.

REM Start cluster
echo [5/5] Starting XaTube cluster...
echo.
echo This will pull and build Docker images. Please wait...
echo.

docker compose -f docker-compose-cluster-lite.yml up -d

if !errorlevel! neq 0 (
    echo ERROR: Failed to start cluster!
    docker compose -f docker-compose-cluster-lite.yml logs
    exit /b 1
)

echo.
echo ========================================
echo Cluster is starting...
echo ========================================
echo.
echo Waiting for services to become healthy...
timeout /t 30 /nobreak

echo.
echo Checking service status...
docker compose -f docker-compose-cluster-lite.yml ps

echo.
echo ========================================
echo 🎉 XaTube Cluster Ready!
echo ========================================
echo.
echo Access points:
echo   Application:   http://localhost
echo   Frontend:      http://localhost:3000
echo   API Docs:      http://localhost/docs
echo   Prometheus:    http://localhost:9090
echo   Grafana:       http://localhost:3001 (admin/password)
echo   RabbitMQ:      http://localhost:15672 (guest/guest)
echo.
echo Backend instances (direct access):
echo   Backend-1:     http://localhost:8001
echo   Backend-2:     http://localhost:8002
echo   Backend-3:     http://localhost:8003
echo.
echo Database:
echo   Primary:       localhost:5432 (postgres/postgres)
echo   Replica:       localhost:5433 (postgres/postgres)
echo.
echo Cache:
echo   Redis:         localhost:6379 (password: password)
echo.
echo RTMP:
echo   Server:        rtmp://localhost:1935/live
echo   Stats:         http://localhost:8080/stat
echo.
echo For more information, see CLUSTER_SETUP.md
echo.

endlocal
