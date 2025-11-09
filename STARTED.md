# 🎉 XaTube - Успешно запущено!

## ✅ Статус

```
✔ Backend      http://localhost:8000    [РАБОТАЕТ ✓]
✔ Frontend     http://localhost:3000    [РАБОТАЕТ ✓]
✔ PostgreSQL   localhost:5432            [РАБОТАЕТ ✓]
✔ Redis        localhost:6379            [РАБОТАЕТ ✓]
✔ Prometheus   http://localhost:9090     [РАБОТАЕТ ✓]
✔ Grafana      http://localhost:3001     [РАБОТАЕТ ✓]
✔ RTMP         rtmp://localhost:1935     [РАБОТАЕТ ✓]
```

## 🚀 Начало работы

### Backend API
```
Адрес: http://localhost:8000
Документация: http://localhost:8000/docs
```

### Проверить health
```powershell
Invoke-WebRequest -Uri http://localhost:8000/health -Method Get
```

Результат:
```json
{
  "status": "healthy",
  "service": "XaTube Backend"
}
```

### React приложение
```
Адрес: http://localhost:3000
```

## 📝 Основные команды

### Просмотр статуса
```bash
docker compose -f docker-compose.yml ps
```

### Логи
```bash
# Все логи
docker compose -f docker-compose.yml logs -f

# Backend логи
docker compose -f docker-compose.yml logs -f backend

# Frontend логи
docker compose -f docker-compose.yml logs -f frontend
```

### Остановка/Запуск
```bash
# Остановить
docker compose -f docker-compose.yml down

# Запустить
docker compose -f docker-compose.yml up -d
```

## 📊 Архитектура

```
┌─────────────────────────────────────────┐
│  React Frontend (port 3000)              │
│  - Pages: Auth, Home, Player, Profile   │
│  - Real-time streaming player           │
│  - Dashboard с статистикой              │
└──────────────┬──────────────────────────┘
               │
┌──────────────▼──────────────────────────┐
│  FastAPI Backend (port 8000)             │
│  - 25+ REST API endpoints                │
│  - JWT authentication                    │
│  - Stream management                     │
└──────────────┬──────────────────────────┘
               │
       ┌───────┼───────┐
       │       │       │
   ┌───▼──┐ ┌──▼───┐ ┌▼───────┐
   │ PG   │ │Redis │ │RTMP    │
   │ 5432 │ │6379  │ │1935    │
   └──────┘ └──────┘ └────────┘
```

## 🎥 Тестирование функционала

### 1. Регистрация
```bash
curl -X POST http://localhost:8000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@example.com",
    "password": "secure_password_123"
  }'
```

### 2. Логин
```bash
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "password": "secure_password_123"
  }'
```

### 3. Создание канала
```bash
curl -X POST http://localhost:8000/api/channels \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "My Channel",
    "description": "My awesome streaming channel"
  }'
```

### 4. Запуск трансляции
```bash
curl -X POST http://localhost:8000/api/streams \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "channel_id": 1,
    "title": "Live Stream #1"
  }'
```

## 📚 Документация

- [STATUS.md](STATUS.md) - Полный статус и требования
- [RUNNING.md](RUNNING.md) - Инструкции по запуску
- [QUICKSTART.md](QUICKSTART.md) - Быстрый старт
- [CLUSTER_SETUP.md](CLUSTER_SETUP.md) - Кластеризация (future)
- [docs/API.md](docs/API.md) - API документация
- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) - Архитектура

## 🔧 Проблемы и решения

### Port 80 занят
Если NGINX не может занять порт 80 (на Windows часто занят системой):
```bash
# Используйте другой порт в docker-compose.yml
ports:
  - "8080:80"  # Вместо 80:80
```

### PostgreSQL не подключается
```bash
# Проверить логи БД
docker compose logs postgres

# Пересоздать БД
docker compose down -v
docker compose up -d
```

### Backend не запускается
```bash
# Проверить ошибки
docker compose logs backend

# Пересоздать образ
docker compose up -d --build
```

## 💾 Данные

### Где хранятся данные
- **PostgreSQL**: `/var/lib/postgresql/data` (volume: `postgres_data`)
- **Redis**: В памяти (volatile)
- **Файлы**: `/tmp/rtmp` (volume: `rtmp_recordings`)

### Backup БД
```bash
docker compose exec postgres \
  pg_dump -U postgres xatube > backup.sql
```

### Restore БД
```bash
docker compose exec -T postgres \
  psql -U postgres xatube < backup.sql
```

## 🌐 Ports

| Сервис | Port | URL |
|--------|------|-----|
| Frontend | 3000 | http://localhost:3000 |
| Backend API | 8000 | http://localhost:8000 |
| NGINX | 80, 443 | http://localhost |
| PostgreSQL | 5432 | localhost:5432 |
| Redis | 6379 | localhost:6379 |
| Prometheus | 9090 | http://localhost:9090 |
| Grafana | 3001 | http://localhost:3001 |
| RTMP | 1935 | rtmp://localhost:1935 |

## 📞 Support

Если возникли проблемы:

1. **Проверьте логи**
   ```bash
   docker compose logs -f SERVICE_NAME
   ```

2. **Перезагрузитесь**
   ```bash
   docker compose restart
   ```

3. **Очистите и переустановите**
   ```bash
   docker compose down -v
   docker compose up -d
   ```

4. **Проверьте документацию**
   - RUNNING.md
   - STATUS.md
   - docs/ARCHITECTURE.md

## 🎓 Технологический стек

- **Backend**: FastAPI, SQLAlchemy, Pydantic
- **Frontend**: React 18, Axios
- **Database**: PostgreSQL 15
- **Cache**: Redis 7
- **Web Server**: NGINX
- **Streaming**: nginx-rtmp
- **Monitoring**: Prometheus, Grafana
- **Container**: Docker, Docker Compose

## 🚀 Следующие шаги

1. Зарегистрируйтесь на http://localhost:3000
2. Создайте канал
3. Получите Stream Key
4. Настройте OBS для трансляции
5. Начните вещание!

**Приятного использования XaTube! 🎬**
