@echo off
REM Script to start Docker and XaTube Cluster

setlocal enabledelayedexpansion

echo.
echo ========================================
echo  XaTube Cluster Startup
echo ========================================
echo.

REM Check if Docker Desktop is running
echo Checking Docker...
docker version >nul 2>&1

if !errorlevel! neq 0 (
    echo Docker is not running. Attempting to start Docker Desktop...
    start "" "C:\Program Files\Docker\Docker\Docker Desktop.exe"
    
    echo Waiting for Docker to start (30 seconds)...
    timeout /t 30 /nobreak
)

cd /d d:\kursach

echo.
echo [1/3] Cleaning up old containers...
docker compose -f docker-compose-cluster.yml down -v 2>nul

echo [1/3] Done!
echo.

echo [2/3] Starting cluster (this may take 2-5 minutes)...
docker compose -f docker-compose-cluster.yml up -d

if !errorlevel! neq 0 (
    echo ERROR: Failed to start cluster
    docker compose -f docker-compose-cluster.yml logs
    exit /b 1
)

echo.
echo [3/3] Waiting for services to become healthy (60 seconds)...
timeout /t 60 /nobreak

echo.
echo ========================================
echo Checking service status...
echo ========================================
echo.

docker compose -f docker-compose-cluster.yml ps

echo.
echo ========================================
echo 🎉 XaTube Cluster is Ready!
echo ========================================
echo.

echo Available Services:
echo   🌐 Application:    http://localhost
echo   📚 API Docs:       http://localhost/docs
echo   📊 Prometheus:     http://localhost:9090
echo   📈 Grafana:        http://localhost:3001 ^(admin/password^)
echo   💬 RabbitMQ:       http://localhost:15672 ^(guest/guest^)
echo   🎬 RTMP Stats:     http://localhost:8080/stat
echo.

echo Backend instances:
echo   Backend-1: http://localhost:8001
echo   Backend-2: http://localhost:8002
echo   Backend-3: http://localhost:8003
echo.

echo Database:
echo   Primary:  localhost:5432 ^(postgres/postgres^)
echo   Replica:  localhost:5433 ^(postgres/postgres^)
echo.

echo Cache:
echo   Redis:    localhost:6379 ^(password: password^)
echo.

echo Management commands:
echo   Logs:     docker compose -f docker-compose-cluster.yml logs -f
echo   Status:   docker compose -f docker-compose-cluster.yml ps
echo   Stop:     docker compose -f docker-compose-cluster.yml down
echo.

pause
