# 🚀 XaTube - Готово к работе!

## ✅ Статус системы

Все сервисы успешно запущены и работают!

```
✔ xatube-backend      Up (healthy) - http://localhost:8000
✔ xatube-frontend     Up          - http://localhost:3000
✔ xatube-nginx        Up          - http://localhost (80, 443)
✔ xatube-postgres     Up (healthy)- localhost:5432
✔ xatube-redis        Up (healthy)- localhost:6379
✔ xatube-prometheus   Up          - http://localhost:9090
✔ xatube-grafana      Up          - http://localhost:3001
✔ xatube-rtmp         Up          - rtmp://localhost:1935
✔ xatube-node-exporter Up         - http://localhost:9100
```

## 🌐 Доступные сервисы

### Основное приложение
- **Приложение**: http://localhost
- **Frontend (React)**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Documentation (Swagger)**: http://localhost:8000/docs

### Мониторинг
- **Prometheus**: http://localhost:9090
- **Grafana**: http://localhost:3001 (логин: admin, пароль: admin)
- **Node Exporter**: http://localhost:9100

### Потоковое вещание
- **RTMP Server**: rtmp://localhost:1935/live
- **RTMP Stats**: http://localhost:8080/stat

### База данных и кэш
- **PostgreSQL**: localhost:5432 (пользователь: postgres, пароль: postgres)
- **Redis**: localhost:6379

## 📝 Основные команды

### Запуск
```bash
docker compose -f docker-compose.yml up -d
```

### Остановка
```bash
docker compose -f docker-compose.yml down
```

### Просмотр логов
```bash
# Все логи
docker compose -f docker-compose.yml logs -f

# Логи конкретного сервиса
docker compose -f docker-compose.yml logs -f backend
docker compose -f docker-compose.yml logs -f frontend
docker compose -f docker-compose.yml logs -f postgres
```

### Проверка статуса
```bash
docker compose -f docker-compose.yml ps
```

### Перестроение образов
```bash
docker compose -f docker-compose.yml up -d --build
```

## 🎥 Начало работы

### 1. Регистрация
- Откройте http://localhost
- Нажмите "Sign Up"
- Заполните форму регистрации
- Подтвердите email (если требуется)

### 2. Создание канала
- Перейдите в профиль
- Создайте новый канал
- Сохраните Stream Key для OBS

### 3. Настройка OBS для трансляции
```
Сервер: rtmp://localhost:1935/live
Ключ потока: YOUR_STREAM_KEY
```

### 4. Запуск трансляции
- Настройте OBS с параметрами выше
- Нажмите "Start Streaming" в OBS
- Транслируемый видеопоток появится на сайте

## 📊 API примеры

### Получить список каналов
```bash
curl http://localhost:8000/api/channels
```

### Получить текущего пользователя
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:8000/api/users/me
```

### Начать трансляцию
```bash
curl -X POST http://localhost:8000/api/streams \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"channel_id": 1, "title": "My Stream"}'
```

## 🗄️ База данных

### Подключение к PostgreSQL
```bash
psql -h localhost -U postgres -d xatube
```

### Основные таблицы
- `users` - пользователи
- `channels` - каналы
- `streams` - трансляции
- `stream_views` - просмотры потоков
- `statistics` - статистика по дням
- `documents` - документы (ToS, Privacy Policy)

## 🔐 Безопасность

### Переменные окружения для production
Отредактируйте `.env` файлы перед развёртыванием:

- `SECRET_KEY` - смените на случайную строку (32+ символа)
- `DATABASE_URL` - используйте внешнюю БД
- `REDIS_URL` - используйте внешний Redis
- `CORS_ORIGINS` -限制доступные домены

## 📈 Мониторинг

### Grafana дашборды
1. Откройте http://localhost:3001
2. Логин: admin, пароль: admin
3. Добавьте Prometheus как источник данных
4. Создайте дашборды для отслеживания метрик

### Метрики Prometheus
- API requests (http_requests_total)
- Response time (http_request_duration_seconds)
- Database connections (db_connections)
- Redis operations (redis_operations_total)

## 🐛 Troubleshooting

### Backend не запускается
```bash
# Проверить логи
docker compose logs backend

# Пересоздать контейнер
docker compose down -v
docker compose up -d
```

### База данных не инициализируется
```bash
# Очистить volume
docker volume rm kursach_postgres_data

# Перезапустить
docker compose down -v
docker compose up -d
```

### Frontend не загружается
```bash
# Проверить NGINX
docker compose logs nginx

# Пересобрать
docker compose down
docker compose up -d --build
```

## 📚 Дополнительная информация

- [README.md](README.md) - Общее описание проекта
- [QUICKSTART.md](QUICKSTART.md) - Быстрый старт
- [CLUSTER_SETUP.md](CLUSTER_SETUP.md) - Настройка кластера (когда будете готовы)
- [API.md](docs/API.md) - Документация API
- [ARCHITECTURE.md](docs/ARCHITECTURE.md) - Архитектура системы

## 🎉 Готово!

XaTube полностью функционален и готов к использованию!

Если у вас возникнут вопросы или проблемы, проверьте логи контейнеров и документацию проекта.

**Приятного использования! 🚀**
