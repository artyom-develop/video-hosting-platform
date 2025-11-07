# Архитектура StreamHub

## Общая архитектура

StreamHub построена на основе микросервисной архитектуры с использованием современных технологий для видеостриминга.

### Компоненты системы

#### 1. **Frontend Layer** (React)
- Пользовательский интерфейс на React 18
- Без TypeScript для упрощения разработки
- React Router для навигации
- Axios для HTTP запросов
- Context API для управления состоянием аутентификации
- Video.js для проигрывания видео
- Chart.js для статистики

#### 2. **API Gateway** (NGINX)
- Обратный прокси-сервер
- SSL/TLS поддержка
- Rate limiting
- CORS обработка
- Маршрутизация запросов
- Сжатие Gzip

#### 3. **Backend API** (FastAPI)
- RESTful API на FastAPI
- SQLAlchemy ORM
- PostgreSQL как основная БД
- Redis для кэширования и сессий
- JWT аутентификация
- Prometheus метрики
- Alembic для миграций

#### 4. **RTMP Server**
- nginx-rtmp для приема потоков от OBS
- HLS трансляция потоков
- DASH адаптивное видео
- Запись потоков

#### 5. **Database** (PostgreSQL)
- Пользователи (Users)
- Каналы (Channels)
- Потоки/Видео (Streams)
- Просмотры (Stream Views)
- Статистика (Statistics)
- Документы (Terms, Privacy Policy и т.д.)

#### 6. **Cache** (Redis)
- Кэширование данных
- Управление сессиями
- Очереди задач
- Статус потоков

#### 7. **Monitoring**
- Prometheus для сбора метрик
- Grafana для визуализации
- Node Exporter для метрик хоста

### Диаграмма взаимодействия

```
┌─────────────┐
│   Browser   │
└──────┬──────┘
       │ HTTPS
       ▼
┌─────────────────────────────────┐
│      NGINX (Reverse Proxy)      │
│  • SSL/TLS                      │
│  • Rate Limiting                │
│  • CORS                         │
└─────────────┬───────────────────┘
              │
    ┌─────────┼─────────┐
    │         │         │
    ▼         ▼         ▼
┌────────┐ ┌──────────┐ ┌─────────┐
│Frontend│ │Backend   │ │RTMP     │
│(React) │ │(FastAPI) │ │Server   │
│3000    │ │8000      │ │1935     │
└────────┘ └─────┬────┘ └────┬────┘
                │            │
        ┌───────┼────────┬───┘
        │       │        │
        ▼       ▼        ▼
    ┌─────────────────────────┐
    │    PostgreSQL (5432)    │
    │    Redis (6379)         │
    └─────────────────────────┘

┌──────────────────┐
│  Prometheus      │
│  (9090)          │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│  Grafana         │
│  (3001)          │
└──────────────────┘
```

## Модели данных

### Users
```
id: Integer (PK)
username: String(50) UNIQUE
email: String(100) UNIQUE
hashed_password: String(255)
full_name: String(100)
avatar_url: String(500)
bio: Text
is_active: Boolean
created_at: DateTime
updated_at: DateTime
```

### Channels
```
id: Integer (PK)
user_id: Integer (FK)
title: String(200)
description: Text
thumbnail_url: String(500)
stream_key: String(255) UNIQUE
is_live: Boolean
viewers_count: Integer
created_at: DateTime
updated_at: DateTime
```

### Streams
```
id: Integer (PK)
channel_id: Integer (FK)
title: String(200)
description: Text
thumbnail_url: String(500)
cover_image_url: String(500)
duration: Integer
started_at: DateTime
ended_at: DateTime
is_live: Boolean
is_archived: Boolean
view_count: Integer
created_at: DateTime
updated_at: DateTime
```

### Stream Views
```
id: Integer (PK)
stream_id: Integer (FK)
user_id: Integer (FK, nullable)
session_id: String(255)
watch_duration: Integer
started_at: DateTime
ended_at: DateTime
```

### Statistics
```
id: Integer (PK)
channel_id: Integer (FK)
date: String (YYYY-MM-DD)
total_views: Integer
unique_viewers: Integer
avg_watch_time: Float
```

## API Endpoints

### Аутентификация
- `POST /api/auth/register` - Регистрация
- `POST /api/auth/login` - Вход
- `POST /api/auth/logout` - Выход
- `GET /api/auth/me` - Текущий пользователь

### Каналы
- `GET /api/channels` - Список каналов
- `GET /api/channels/{id}` - Информация о канале
- `POST /api/channels` - Создать канал
- `PUT /api/channels/{id}` - Обновить канал
- `DELETE /api/channels/{id}` - Удалить канал
- `GET /api/channels/{id}/stream-key` - Получить ключ потока
- `POST /api/channels/{id}/regenerate-stream-key` - Переген. ключ

### Потоки
- `GET /api/streams` - Список потоков
- `GET /api/streams/{id}` - Информация о потоке
- `POST /api/streams/{id}` - Создать поток
- `PUT /api/streams/{id}` - Обновить поток
- `POST /api/streams/{id}/start` - Начать трансляцию
- `POST /api/streams/{id}/stop` - Остановить трансляцию
- `GET /api/streams/{id}/status` - Статус потока
- `DELETE /api/streams/{id}` - Удалить поток

### Статистика
- `GET /api/statistics/channel/{id}` - Статистика канала
- `GET /api/statistics/channel/{id}/daily` - Дневная статистика
- `GET /api/statistics/channel/{id}/top-streams` - Топ потоки
- `GET /api/statistics/user/{id}/overview` - Обзор пользователя

### Документы
- `GET /api/documents` - Все документы
- `GET /api/documents/{slug}` - Получить документ

### Пользователи
- `GET /api/users/{id}` - Профиль пользователя
- `PUT /api/users/{id}` - Обновить профиль
- `GET /api/users/{id}/channels` - Каналы пользователя

## Безопасность

### JWT Аутентификация
- Token expires in 24 hours
- Refresh token механика (может быть добавлена)
- Secure HTTP-only cookies (опционально)

### CORS
- Настроена для локальной разработки
- Может быть настроена для production

### Защита от атак
- CSRF protection (в работе)
- XSS protection через Content-Security-Policy
- SQL injection protection через ORM
- Rate limiting в NGINX

## Развертывание

### Docker Compose
- Все сервисы в контейнерах
- Управление томами для данных
- Сетевая изоляция
- Автоматический перезапуск сервисов

### Масштабирование
- Можно запустить несколько экземпляров backend
- Redis для кэширования между экземплярами
- PostgreSQL с репликацией (опционально)

## Мониторинг

### Prometheus метрики
- API запросы (count, duration)
- Активные потоки
- Зрители
- Просмотры
- Подключения к БД
- Подключения к Redis

### Grafana дашборды
- Статистика API
- Мониторинг потоков
- Здоровье системы
- Производительность
