# XaTube - Современная видеостриминговая платформа

Полнофункциональная видеостриминговая платформа с поддержкой многопользовательского доступа, аналитикой в реальном времени и надежной архитектурой на базе микросервисов.

## 🚀 Особенности

- **Стриминг в реальном времени** - Приём RTMP потоков с OBS
- **Многопользовательская архитектура** - Полная поддержка профилей и каналов
- **Аналитика** - Статистика просмотров, длительность, график активности
- **Мониторинг** - Prometheus + Grafana для наблюдения за системой
- **Масштабируемость** - Кластеризация с Redis и кэшированием
- **Безопасность** - JWT аутентификация, CORS, защита от XSS/CSRF
- **Красивый UI** - Современный интерфейс на React

## 🏗️ Архитектура

```
┌─────────────────────────────────────────────────────────┐
│                    NGINX (Reverse Proxy)                 │
│                   (Port 80/443)                          │
└───────────┬─────────────────────────────────────┬────────┘
            │                                     │
    ┌───────▼────────┐              ┌────────────▼──────┐
    │  Frontend      │              │  FastAPI Backend   │
    │  React         │              │  (Port 8000)       │
    │  (Port 3000)   │              └────────────┬───────┘
    └────────────────┘                           │
                           ┌──────────────┬──────▼──────┬──────────┐
                           │              │             │          │
                    ┌──────▼────┐  ┌──────▼────┐  ┌────▼────┐  ┌──▼────┐
                    │ PostgreSQL │  │  RTMP    │  │  Redis  │  │Prometh│
                    │  (Port 5432)│  │ Server  │  │ (Port   │  │eus   │
                    └────────────┘  │(Port1935)│  │  6379)  │  └───────┘
                                    └─────────┘  └─────────┘
                                          │
                                    ┌─────▼──────┐
                                    │  Grafana   │
                                    │(Port 3001) │
                                    └────────────┘
```

## 📋 Требования

- Docker & Docker Compose
- Python 3.10+
- Node.js 18+
- Git

## 🚀 Быстрый старт

### 1. Клонирование репозитория

```bash
git clone <repository>
cd kursach
```

### 2. Запуск Docker Compose

```bash
docker-compose up -d
```

Сервисы будут доступны по адресам:
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs
- **Grafana**: http://localhost:3001 (admin/admin)
- **Prometheus**: http://localhost:9090
- **RTMP Server**: rtmp://localhost:1935

### 3. Локальная разработка

#### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

#### Frontend

```bash
cd frontend
npm install
npm start
```

## 📚 Структура проекта

```
kursach/
├── backend/              # FastAPI приложение
│   ├── app/
│   │   ├── models/      # SQLAlchemy модели
│   │   ├── schemas/     # Pydantic схемы
│   │   ├── routes/      # API endpoints
│   │   ├── services/    # Бизнес-логика
│   │   ├── core/        # Конфигурация и утилиты
│   │   └── main.py      # Точка входа
│   ├── migrations/       # Alembic миграции БД
│   └── requirements.txt
├── frontend/            # React приложение
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── context/
│   │   └── App.js
│   └── package.json
├── docker/              # Docker конфигурации
│   ├── nginx/
│   │   └── nginx.conf
│   └── rtmp/
│       └── Dockerfile
├── docs/                # Документация
│   ├── API.md
│   ├── ARCHITECTURE.md
│   ├── TERMS_OF_SERVICE.md
│   ├── PRIVACY_POLICY.md
│   └── CONTENT_GUIDELINES.md
└── docker-compose.yml
```

## 🔌 API Endpoints

### Аутентификация

- `POST /api/auth/register` - Регистрация нового пользователя
- `POST /api/auth/login` - Вход в систему
- `POST /api/auth/logout` - Выход из системы
- `GET /api/auth/me` - Получить текущего пользователя

### Каналы

- `GET /api/channels` - Список всех активных каналов
- `GET /api/channels/{id}` - Получить информацию о канале
- `POST /api/channels` - Создать новый канал
- `PUT /api/channels/{id}` - Обновить канал
- `DELETE /api/channels/{id}` - Удалить канал

### Трансляции

- `POST /api/channels/{id}/streams/start` - Начать трансляцию
- `POST /api/channels/{id}/streams/stop` - Остановить трансляцию
- `GET /api/channels/{id}/stream-status` - Статус трансляции

### Статистика

- `GET /api/channels/{id}/stats` - Статистика канала
- `GET /api/channels/{id}/stats/history` - История просмотров

## 🔐 Безопасность

- JWT токены для аутентификации
- CORS настроена для безопасного кросс-доменного доступа
- Валидация входных данных на уровне Pydantic
- Защита от XSS через Content-Security-Policy
- CSRF токены для изменяющих операций
- HTTPS поддержка в продакшене

## 📖 Документация

Полная документация доступна в папке `docs/`:

- [Архитектура системы](./docs/ARCHITECTURE.md)
- [API Документация](./docs/API.md)
- [Условия использования](./docs/TERMS_OF_SERVICE.md)
- [Политика конфиденциальности](./docs/PRIVACY_POLICY.md)
- [Руководство по контенту](./docs/CONTENT_GUIDELINES.md)

## 🐛 Отладка

### Логи Docker

```bash
docker-compose logs -f backend  # Логи FastAPI
docker-compose logs -f frontend # Логи React
docker-compose logs -f rtmp     # Логи RTMP сервера
```

### Подключение к БД

```bash
docker-compose exec postgres psql -U streamhub -d streamhub
```

## 📝 Лицензия

MIT License

## 👥 Автор

Курсовой проект по теме "Настройка и администрирование видеостриминговой платформы с многопользовательским доступом"

## 📝 История проекта

**XaTube** создана с нуля как полная переработка предыдущей версии курсовой работы. Новая версия использует:
- React вместо TypeScript
- Компактные формы аутентификации без скроллинга
- Постоянные каналы с временными видео-потоками
- Покрытия изображений для видеоконтента
- Полнофункциональную аналитику в реальном времени
- Расширенную архитектуру с мониторингом
