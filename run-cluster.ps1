#!/usr/bin/env pwsh
# Скрипт для запуска Docker Desktop и кластера

Write-Host "🐳 Проверка Docker Desktop..." -ForegroundColor Cyan

# Проверить установлен ли Docker Desktop
$dockerDesktopPath = "C:\Program Files\Docker\Docker\Docker Desktop.exe"

if (-not (Test-Path $dockerDesktopPath)) {
    Write-Host "❌ Docker Desktop не найден по пути: $dockerDesktopPath" -ForegroundColor Red
    Write-Host "Установите Docker Desktop и попробуйте снова" -ForegroundColor Yellow
    exit 1
}

Write-Host "✓ Docker Desktop найден" -ForegroundColor Green
Write-Host ""

# Проверить запущен ли Docker
$dockerRunning = $false
try {
    docker version >$null 2>&1
    $dockerRunning = $true
    Write-Host "✓ Docker уже запущен" -ForegroundColor Green
}
catch {
    Write-Host "⏳ Docker не запущен, запускаю Docker Desktop..." -ForegroundColor Yellow
    & $dockerDesktopPath
    
    # Ждём пока Docker запустится
    Write-Host "⏳ Ожидание запуска Docker (30 сек)..." -ForegroundColor Yellow
    Start-Sleep -Seconds 30
    
    # Проверим ещё раз
    for ($i = 0; $i -lt 5; $i++) {
        try {
            docker version >$null 2>&1
            $dockerRunning = $true
            Write-Host "✓ Docker запущен успешно!" -ForegroundColor Green
            break
        }
        catch {
            Write-Host "⏳ Попытка $($i+1)/5... ещё ждём..." -ForegroundColor Yellow
            Start-Sleep -Seconds 5
        }
    }
}

if (-not $dockerRunning) {
    Write-Host "❌ Docker не запустился" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "🚀 Запуск XaTube кластера..." -ForegroundColor Cyan
Write-Host ""

# Перейти в директорию проекта
cd d:\kursach

# Очистить старые контейнеры
Write-Host "[1/3] Очистка старых контейнеров..." -ForegroundColor Yellow
docker compose -f docker-compose-cluster.yml down -v 2>&1 | Out-Null

Write-Host "✓ Очистка завершена" -ForegroundColor Green
Write-Host ""

# Запустить кластер
Write-Host "[2/3] Запуск кластера (это может занять 2-5 минут)..." -ForegroundColor Yellow
docker compose -f docker-compose-cluster.yml up -d

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Ошибка при запуске кластера" -ForegroundColor Red
    docker compose -f docker-compose-cluster.yml logs | Select-Object -Last 50
    exit 1
}

Write-Host "✓ Кластер запущен" -ForegroundColor Green
Write-Host ""

# Ждём здоровья сервисов
Write-Host "[3/3] Ожидание здоровья сервисов (1 минута)..." -ForegroundColor Yellow
Start-Sleep -Seconds 60

# Проверить статус
Write-Host ""
Write-Host "📊 Статус сервисов:" -ForegroundColor Cyan
docker compose -f docker-compose-cluster.yml ps

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "🎉 XaTube Кластер готов к работе!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""

Write-Host "📱 Доступные сервисы:" -ForegroundColor Cyan
Write-Host "  🌐 Приложение:    http://localhost" -ForegroundColor White
Write-Host "  📚 API Docs:      http://localhost/docs" -ForegroundColor White
Write-Host "  📊 Prometheus:    http://localhost:9090" -ForegroundColor White
Write-Host "  📈 Grafana:       http://localhost:3001 (admin/password)" -ForegroundColor White
Write-Host "  💬 RabbitMQ:      http://localhost:15672 (guest/guest)" -ForegroundColor White
Write-Host "  🎬 RTMP Stats:    http://localhost:8080/stat" -ForegroundColor White
Write-Host ""

Write-Host "🔧 Backend инстансы:" -ForegroundColor Cyan
Write-Host "  Backend-1: http://localhost:8001" -ForegroundColor White
Write-Host "  Backend-2: http://localhost:8002" -ForegroundColor White
Write-Host "  Backend-3: http://localhost:8003" -ForegroundColor White
Write-Host ""

Write-Host "💾 База данных:" -ForegroundColor Cyan
Write-Host "  Primary:  localhost:5432 (postgres/postgres)" -ForegroundColor White
Write-Host "  Replica:  localhost:5433 (postgres/postgres)" -ForegroundColor White
Write-Host ""

Write-Host "🔴 Кэш:" -ForegroundColor Cyan
Write-Host "  Redis:    localhost:6379 (password: password)" -ForegroundColor White
Write-Host ""

Write-Host "📝 Команды для управления кластером:" -ForegroundColor Yellow
Write-Host "  Логи:     docker compose -f docker-compose-cluster.yml logs -f" -ForegroundColor White
Write-Host "  Статус:   docker compose -f docker-compose-cluster.yml ps" -ForegroundColor White
Write-Host "  Остановить: docker compose -f docker-compose-cluster.yml down" -ForegroundColor White
Write-Host ""
