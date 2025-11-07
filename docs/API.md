# API Документация XaTube

## Базовая информация

- **Base URL**: `http://localhost:8000/api`
- **Authentication**: JWT Bearer Token
- **Content-Type**: `application/json`

## Аутентификация

### Регистрация

```http
POST /auth/register
Content-Type: application/json

{
  "username": "johndoe",
  "email": "john@example.com",
  "password": "securepassword123",
  "full_name": "John Doe"
}
```

**Response (201)**
```json
{
  "id": 1,
  "username": "johndoe",
  "email": "john@example.com",
  "full_name": "John Doe",
  "avatar_url": null,
  "bio": null,
  "is_active": true,
  "created_at": "2025-11-07T10:00:00"
}
```

### Вход

```http
POST /auth/login
Content-Type: application/json

{
  "username": "johndoe",
  "password": "securepassword123"
}
```

**Response (200)**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer"
}
```

### Получить текущего пользователя

```http
GET /auth/me
Authorization: Bearer <token>
```

**Response (200)**
```json
{
  "id": 1,
  "username": "johndoe",
  "email": "john@example.com",
  "full_name": "John Doe",
  "avatar_url": null,
  "bio": null,
  "is_active": true,
  "created_at": "2025-11-07T10:00:00"
}
```

## Каналы

### Получить список каналов

```http
GET /channels?skip=0&limit=20&is_live=true
```

**Response (200)**
```json
[
  {
    "id": 1,
    "user_id": 1,
    "title": "My Gaming Channel",
    "description": "Playing games daily",
    "thumbnail_url": "https://example.com/thumb.jpg",
    "stream_key": "abc123def456",
    "is_live": true,
    "viewers_count": 100,
    "created_at": "2025-11-07T10:00:00",
    "updated_at": "2025-11-07T10:00:00"
  }
]
```

### Создать канал

```http
POST /channels
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "My Gaming Channel",
  "description": "Playing games daily",
  "thumbnail_url": null
}
```

**Response (201)**
```json
{
  "id": 1,
  "user_id": 1,
  "title": "My Gaming Channel",
  "description": "Playing games daily",
  "thumbnail_url": null,
  "stream_key": "abc123def456xyz789",
  "is_live": false,
  "viewers_count": 0,
  "created_at": "2025-11-07T10:00:00",
  "updated_at": "2025-11-07T10:00:00"
}
```

### Получить ключ потока

```http
GET /channels/{channel_id}/stream-key?user_id=1
Authorization: Bearer <token>
```

**Response (200)**
```json
{
  "stream_key": "abc123def456xyz789"
}
```

### Переген. ключ потока

```http
POST /channels/{channel_id}/regenerate-stream-key?user_id=1
Authorization: Bearer <token>
```

**Response (200)**
```json
{
  "stream_key": "newkey123456789abc"
}
```

## Потоки

### Создать поток

```http
POST /streams/{channel_id}
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Epic Gaming Session",
  "description": "Playing my favorite game"
}
```

**Response (201)**
```json
{
  "id": 1,
  "channel_id": 1,
  "title": "Epic Gaming Session",
  "description": "Playing my favorite game",
  "thumbnail_url": null,
  "cover_image_url": null,
  "duration": 0,
  "is_live": false,
  "is_archived": false,
  "view_count": 0,
  "started_at": null,
  "ended_at": null,
  "created_at": "2025-11-07T10:00:00",
  "updated_at": "2025-11-07T10:00:00"
}
```

### Начать трансляцию

```http
POST /streams/{stream_id}/start
Authorization: Bearer <token>
```

**Response (200)**
```json
{
  "stream_id": 1,
  "is_live": true,
  "viewers_count": 0,
  "duration": 0,
  "started_at": "2025-11-07T10:00:00"
}
```

### Остановить трансляцию

```http
POST /streams/{stream_id}/stop
Authorization: Bearer <token>
```

**Response (200)**
```json
{
  "stream_id": 1,
  "is_live": false,
  "viewers_count": 0,
  "duration": 3600,
  "started_at": "2025-11-07T10:00:00"
}
```

### Получить статус потока

```http
GET /streams/{stream_id}/status
```

**Response (200)**
```json
{
  "stream_id": 1,
  "is_live": true,
  "viewers_count": 50,
  "duration": 1800,
  "started_at": "2025-11-07T10:00:00"
}
```

## Статистика

### Получить статистику канала

```http
GET /statistics/channel/{channel_id}
```

**Response (200)**
```json
{
  "total_views": 5000,
  "unique_viewers": 150,
  "avg_watch_time": 600.5,
  "active_streams": 1
}
```

### Получить дневную статистику

```http
GET /statistics/channel/{channel_id}/daily?days=30
```

**Response (200)**
```json
[
  {
    "id": 1,
    "channel_id": 1,
    "date": "2025-11-06",
    "total_views": 100,
    "unique_viewers": 50,
    "avg_watch_time": 600.0
  }
]
```

### Получить топ потоки

```http
GET /statistics/channel/{channel_id}/top-streams?limit=10
```

**Response (200)**
```json
[
  {
    "id": 1,
    "channel_id": 1,
    "title": "Stream Title",
    "view_count": 5000
  }
]
```

## Документы

### Получить все документы

```http
GET /documents
```

**Response (200)**
```json
[
  {
    "id": 1,
    "slug": "terms-of-service",
    "title": "Terms of Service",
    "content": "<h1>Terms of Service</h1>...",
    "version": 1,
    "created_at": "2025-11-07T10:00:00",
    "updated_at": "2025-11-07T10:00:00"
  }
]
```

### Получить документ по slug

```http
GET /documents/{slug}
```

**Response (200)**
```json
{
  "id": 1,
  "slug": "privacy-policy",
  "title": "Privacy Policy",
  "content": "<h1>Privacy Policy</h1>...",
  "version": 1,
  "created_at": "2025-11-07T10:00:00",
  "updated_at": "2025-11-07T10:00:00"
}
```

## Коды ошибок

| Код | Описание |
|-----|---------|
| 200 | OK |
| 201 | Created |
| 400 | Bad Request |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Not Found |
| 500 | Internal Server Error |

## Пример использования в cURL

```bash
# Регистрация
curl -X POST http://localhost:8000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"user","email":"user@test.com","password":"pass123","full_name":"Test User"}'

# Вход
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"user","password":"pass123"}'

# Получить каналы
curl -X GET http://localhost:8000/api/channels \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Swagger UI

Полную интерактивную документацию можно найти по адресу:
http://localhost:8000/docs
