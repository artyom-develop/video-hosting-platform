# Руководство по развертыванию StreamHub

## Предварительные требования

- Docker 20.10+
- Docker Compose 2.0+
- Git
- Минимум 4GB оперативной памяти
- Минимум 20GB свободного дискового пространства

## Локальное развертывание

### 1. Клонирование репозитория

```bash
git clone <repository>
cd kursach
```

### 2. Запуск Docker Compose

```bash
docker-compose up -d
```

### 3. Проверка статуса сервисов

```bash
docker-compose ps
```

### 4. Доступ к сервисам

| Сервис | URL | Учетные данные |
|--------|-----|----------------|
| Frontend | http://localhost:3000 | - |
| Backend API | http://localhost:8000 | - |
| API Docs | http://localhost:8000/docs | - |
| Grafana | http://localhost:3001 | admin/admin |
| Prometheus | http://localhost:9090 | - |
| RTMP Server | rtmp://localhost:1935 | - |

## Первоначальная конфигурация

### 1. Проверка БД

```bash
docker-compose exec postgres psql -U streamhub -d streamhub -c "SELECT * FROM users;"
```

### 2. Создание первого пользователя

```bash
curl -X POST http://localhost:8000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "email": "admin@streamhub.local",
    "password": "changeme123",
    "full_name": "Administrator"
  }'
```

### 3. Вход в систему

```bash
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "changeme123"
  }'
```

## Production развертывание

### 1. Обновление переменных окружения

Отредактируйте `docker-compose.yml` и обновите:

```yaml
environment:
  SECRET_KEY: "your-production-secret-key"
  ENVIRONMENT: "production"
  DATABASE_URL: "postgresql://user:pass@host:5432/db"
  REDIS_URL: "redis://:pass@host:6379/0"
```

### 2. Настройка SSL/TLS

```bash
# Скопируйте сертификаты
cp /path/to/cert.pem docker/nginx/ssl/
cp /path/to/key.pem docker/nginx/ssl/
```

### 3. Обновление CORS

В `backend/app/core/config.py` обновите `cors_origins`:

```python
cors_origins: list = [
    "https://yourdomain.com",
    "https://www.yourdomain.com",
]
```

### 4. Запуск с правильной конфигурацией

```bash
docker-compose -f docker-compose.yml up -d
```

## Резервное копирование и восстановление

### Резервное копирование БД

```bash
docker-compose exec postgres pg_dump -U streamhub streamhub > backup.sql
```

### Восстановление из резервной копии

```bash
docker-compose exec -T postgres psql -U streamhub streamhub < backup.sql
```

## Обновление приложения

### 1. Получение новых изменений

```bash
git pull origin main
```

### 2. Перестроение контейнеров

```bash
docker-compose build
```

### 3. Перезапуск сервисов

```bash
docker-compose up -d
```

## Мониторинг

### Проверка логов

```bash
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f rtmp
```

### Метрики Prometheus

Доступны по адресу: http://localhost:9090

Предустановленные графики:
- API requests rate
- Response times
- Active streams
- Database connections

### Grafana дашборды

Доступны по адресу: http://localhost:3001

Логин: admin
Пароль: admin

Дашборды:
- System Overview
- API Performance
- Stream Statistics

## Проблемы и решения

### Контейнеры не запускаются

```bash
# Проверьте логи
docker-compose logs

# Пересоберите контейнеры
docker-compose down
docker-compose build --no-cache
docker-compose up
```

### БД не инициализируется

```bash
# Очистите томы
docker-compose down -v

# Пересоздайте без сохраненных данных
docker-compose up -d
```

### RTMP поток не работает

```bash
# Проверьте RTMP сервер
docker-compose logs rtmp

# Проверьте RTMP URL
rtmp://localhost:1935/live
```

### Проблемы с CORS

```bash
# Добавьте origin в config.py
cors_origins.append("http://yourdomain.com")

# Перезапустите backend
docker-compose restart backend
```

## Чистка и удаление

### Остановка всех сервисов

```bash
docker-compose down
```

### Полное удаление (включая данные)

```bash
docker-compose down -v
docker volume prune
```

## Документация OBS

### Настройка OBS для трансляции

1. Откройте OBS Studio
2. Перейдите в Settings > Stream
3. Выберите "Custom" в качестве сервиса
4. Установите URL: `rtmp://localhost:1935/live`
5. Stream Key: используйте значение из StreamHub
6. Нажмите "Start Streaming"

### Получение Stream Key

```bash
curl -X GET "http://localhost:8000/api/channels/1/stream-key" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Производительность и оптимизация

### Масштабирование Backend

Создайте несколько экземпляров:

```yaml
backend-1:
  # конфиг 1
backend-2:
  # конфиг 2
```

### Оптимизация БД

```bash
# Подключитесь к БД
docker-compose exec postgres psql -U streamhub -d streamhub

# Выполните ANALYZE
ANALYZE;

# Проверьте индексы
\di
```

### Кэширование Redis

Убедитесь, что все приложения используют Redis для кэширования:

```python
redis_url = settings.redis_url
cache = redis.from_url(redis_url)
```

## Безопасность

### Основные шаги

1. Измените все пароли по умолчанию
2. Включите HTTPS в production
3. Регулярно обновляйте зависимости
4. Включите WAF (Web Application Firewall)
5. Используйте VPN для admin доступа

### Переменные окружения

Никогда не коммитьте `.env` файлы:

```bash
echo ".env" >> .gitignore
git rm --cached .env
```

---

Для дополнительной помощи посетите документацию или создайте issue в репозитории.
