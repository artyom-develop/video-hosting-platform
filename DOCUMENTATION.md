# 📚 XaTube - Полная документация

## 🎯 Начало работы

1. **Новичок в проекте?**
   - Начните с [QUICKSTART.md](./QUICKSTART.md)
   - Прочитайте [README.md](./README.md)

2. **Хотите развернуть на сервере?**
   - Следуйте инструкциям в [DEPLOYMENT.md](./docs/DEPLOYMENT.md)
   - Проверьте [PRE_PRODUCTION_CHECKLIST.md](./PRE_PRODUCTION_CHECKLIST.md)

3. **Разработчик на бэкэнде?**
   - Изучите архитектуру в [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md)
   - Используйте [docs/API.md](./docs/API.md) для понимания endpoints
   - Посмотрите примеры в Swagger UI: http://localhost:8000/docs

4. **Разработчик на фронтэнде?**
   - Начните с [frontend/src/App.js](./frontend/src/App.js)
   - Посмотрите компоненты в [frontend/src/pages/](./frontend/src/pages/)
   - Стили находятся в [frontend/src/styles/](./frontend/src/styles/)

---

## 📖 Документация по модулям

### Backend (FastAPI)

#### 📦 Структура
```
backend/
├── app/
│   ├── core/              # Конфигурация и утилиты
│   │   ├── config.py      # Настройки приложения
│   │   ├── database.py    # Подключение к БД
│   │   ├── security.py    # JWT и пароли
│   │   └── metrics.py     # Prometheus метрики
│   ├── models/
│   │   └── models.py      # SQLAlchemy модели (6 таблиц)
│   ├── schemas/
│   │   └── schemas.py     # Pydantic валидация (12 schemas)
│   ├── routes/            # API endpoints (6 модулей, 25+ endpoints)
│   │   ├── auth.py        # Аутентификация
│   │   ├── channels.py    # Управление каналами
│   │   ├── streams.py     # Управление потоками
│   │   ├── statistics.py  # Аналитика
│   │   ├── documents.py   # Документация
│   │   └── users.py       # Профили
│   └── main.py            # FastAPI приложение
├── requirements.txt       # Python зависимости
└── Dockerfile             # Docker образ
```

#### 🔗 API endpoints

**Аутентификация** (`/auth`)
- `POST /register` - Регистрация нового пользователя
- `POST /login` - Вход в систему
- `POST /logout` - Выход из системы
- `GET /me` - Получить текущего пользователя

**Каналы** (`/channels`)
- `GET /` - Получить все каналы
- `POST /` - Создать новый канал
- `GET /{id}` - Получить конкретный канал
- `PUT /{id}` - Обновить канал
- `DELETE /{id}` - Удалить канал
- `GET /{id}/stream-key` - Получить ключ потока
- `POST /{id}/regenerate-stream-key` - Регенерировать ключ

**Потоки** (`/streams`)
- `GET /` - Получить все потоки
- `POST /` - Создать новый поток
- `GET /{id}` - Получить поток
- `PUT /{id}` - Обновить поток
- `DELETE /{id}` - Удалить поток
- `POST /{id}/start` - Запустить трансляцию
- `POST /{id}/stop` - Остановить трансляцию
- `GET /{id}/status` - Получить статус

**Статистика** (`/statistics`)
- `GET /channel/{id}` - Общая статистика канала
- `GET /channel/{id}/daily` - Дневная статистика
- `GET /channel/{id}/top-streams` - Топ видео
- `GET /user/{id}/overview` - Обзор пользователя

**Документы** (`/documents`)
- `GET /` - Получить все активные документы
- `GET /{slug}` - Получить документ по slug

**Пользователи** (`/users`)
- `GET /{id}` - Получить профиль пользователя
- `PUT /{id}` - Обновить профиль
- `GET /{id}/channels` - Получить каналы пользователя

#### 📊 Модели данных
- `User` - Пользователи
- `Channel` - Каналы (постоянные)
- `Stream` - Потоки (временные)
- `StreamView` - Просмотры потока
- `Statistic` - Статистика по дням
- `Document` - Регуляторные документы

---

### Frontend (React)

#### 📦 Структура
```
frontend/
├── src/
│   ├── components/
│   │   └── Header.js          # Навигация приложения
│   ├── context/
│   │   └── AuthContext.js     # Глобальное состояние
│   ├── pages/
│   │   ├── AuthPages.js       # Логин/Регистрация
│   │   ├── HomePage.js        # Каталог трансляций
│   │   ├── ProfilePage.js     # Профиль пользователя
│   │   ├── StatisticsPage.js  # Статистика
│   │   └── PlayerPage.js      # Видеоплеер
│   ├── services/
│   │   └── api.js             # HTTP клиент
│   ├── styles/
│   │   ├── index.css          # Глобальные стили
│   │   ├── App.css            # Основные стили
│   │   ├── Header.css         # Навигация
│   │   ├── Auth.css           # Формы
│   │   ├── Home.css           # Главная
│   │   ├── Player.css         # Плеер
│   │   ├── Profile.css        # Профиль
│   │   └── Statistics.css     # Статистика
│   ├── App.js                 # Маршрутизация
│   └── index.js               # Точка входа
├── package.json               # npm зависимости
└── public/index.html          # HTML шаблон
```

#### 🎨 Маршруты
- `/` - Главная страница (каталог потоков)
- `/login` - Страница входа
- `/register` - Страница регистрации
- `/profile` - Профиль пользователя (защищённо)
- `/statistics` - Статистика (защищённо)
- `/player/:streamId` - Видеоплеер

#### ⚙️ Context API
- `AuthContext` - Управление аутентификацией и пользователем

#### 🎬 Компоненты
- `Header` - Навигация с логотипом
- `AuthPages` - LoginForm и RegisterForm
- `HomePage` - Каталог с фильтрами и поиском
- `ProfilePage` - Редактирование и управление ключом
- `StatisticsPage` - Аналитика с графиками и таблицами
- `PlayerPage` - HTML5 видеоплеер с HLS поддержкой

---

### Инфраструктура (Docker)

#### 🐳 Сервисы

| Сервис | Образ | Порт | Описание |
|--------|-------|------|---------|
| `db` | postgres:15-alpine | 5432 | База данных PostgreSQL |
| `cache` | redis:7-alpine | 6379 | Кэш Redis |
| `backend` | custom | 8000 | FastAPI API |
| `frontend` | node:18-alpine | 3000 | React приложение |
| `nginx` | nginx:alpine | 80/443 | Reverse proxy |
| `rtmp` | custom | 1935 | RTMP сервер |
| `prometheus` | prom/prometheus | 9090 | Метрики |
| `grafana` | grafana/grafana | 3000 | Визуализация |
| `node-exporter` | prom/node-exporter | 9100 | Метрики хоста |

#### 🚀 Запуск

```bash
# Запуск всех сервисов
docker-compose up -d

# Проверка статуса
docker-compose ps

# Просмотр логов
docker-compose logs -f backend

# Остановка
docker-compose down
```

#### 📋 Конфигурационные файлы

- `docker-compose.yml` - Оркестрация сервисов
- `docker/nginx/nginx.conf` - Конфиг NGINX
- `docker/nginx/Dockerfile` - Образ NGINX
- `docker/rtmp/nginx.conf` - Конфиг RTMP
- `docker/rtmp/Dockerfile` - Образ RTMP
- `docker/postgres/init.sql` - Инициализация БД
- `docker/prometheus/prometheus.yml` - Конфиг Prometheus
- `docker/grafana/provisioning/` - Конфиги Grafana

---

## 🔑 Конфигурация

### Backend переменные окружения

```env
# Database
DATABASE_URL=postgresql://...
POSTGRES_DB=xatube
POSTGRES_PASSWORD=...

# Security
SECRET_KEY=...
JWT_ALGORITHM=HS256

# API
CORS_ORIGINS=http://localhost:3000

# Logging
LOG_LEVEL=INFO
```

Полный список в [backend/.env.example](./backend/.env.example)

### Frontend переменные окружения

```env
REACT_APP_API_URL=http://localhost:8000/api
REACT_APP_APP_NAME=XaTube
NODE_ENV=production
```

Полный список в [frontend/.env.example](./frontend/.env.example)

---

## 🧪 Тестирование

### Тестирование API

```bash
# Получить документацию
curl http://localhost:8000/docs

# Тестировать endpoint
curl -X POST http://localhost:8000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"test","email":"test@test.com","password":"pass","full_name":"Test"}'
```

### Тестирование RTMP

```bash
# 1. Запустить OBS
# 2. Settings → Stream
# Server: rtmp://localhost:1935/live
# Stream Key: <ключ из профиля>
# 3. Start Streaming
```

---

## 📊 Мониторинг

### Prometheus
- URL: http://localhost:9090
- Метрики отправляются из FastAPI приложения
- Настройка в [docker/prometheus/prometheus.yml](./docker/prometheus/prometheus.yml)

### Grafana
- URL: http://localhost:3000
- Username: admin
- Password: password
- Дашборды автоматически загружаются

---

## 🔒 Безопасность

- **JWT токены** - Аутентификация через HS256
- **Bcrypt пароли** - Хеширование паролей
- **CORS** - Кросс-доменные запросы ограничены
- **Rate Limiting** - Защита от DDoS в NGINX
- **SQL Injection** - Защита через ORM
- **CSRF** - Защита через NGINX headers
- **Security Headers** - HSTS, CSP, X-Frame-Options

Подробнее в [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md)

---

## 📚 Документация

### Основные файлы

| Файл | Описание |
|------|---------|
| [README.md](./README.md) | Общее описание проекта |
| [QUICKSTART.md](./QUICKSTART.md) | Быстрый старт |
| [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md) | Архитектура системы |
| [docs/API.md](./docs/API.md) | Документация API |
| [docs/DEPLOYMENT.md](./docs/DEPLOYMENT.md) | Развертывание |
| [COMPONENTS_CHECKLIST.md](./COMPONENTS_CHECKLIST.md) | Чеклист компонентов |
| [PRE_PRODUCTION_CHECKLIST.md](./PRE_PRODUCTION_CHECKLIST.md) | Чеклист перед production |
| [COMPLETION_REPORT.md](./COMPLETION_REPORT.md) | Отчет о завершении |

### Регуляторные документы

| Документ | Размер | Описание |
|----------|--------|---------|
| [docs/TERMS_OF_SERVICE.md](./docs/TERMS_OF_SERVICE.md) | 2847 слов | Условия использования |
| [docs/PRIVACY_POLICY.md](./docs/PRIVACY_POLICY.md) | 2156 слов | Политика конфиденциальности |
| [docs/CONTENT_GUIDELINES.md](./docs/CONTENT_GUIDELINES.md) | 3421 слово | Правила контента |

---

## 🛠 Полезные команды

```bash
# Просмотр логов
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f nginx

# Вход в контейнер
docker-compose exec backend bash
docker-compose exec postgres psql -U postgres -d xatube

# Перезагрузка
docker-compose restart backend
docker-compose down && docker-compose up -d

# Проверка здоровья
docker-compose ps
curl http://localhost:8000/health
```

---

## 📱 Интеграции

### OBS Studio
1. Скачать https://obsproject.com/
2. Settings → Stream
3. Custom RTMP:
   - Server: `rtmp://localhost:1935/live`
   - Key: Из профиля на XaTube
4. Start Streaming

### Grafana Dashboards
Дашборды автоматически загружаются при запуске.
Редактировать в [docker/grafana/provisioning/dashboards/](./docker/grafana/provisioning/dashboards/)

---

## 🤝 Внесение вклада

1. Форк репозитория
2. Создайте feature branch
3. Коммитьте изменения
4. Push в branch
5. Откройте Pull Request

---

## 📞 Поддержка

- **Issues**: GitHub Issues
- **Docs**: https://xatube.readthedocs.io
- **API Docs**: http://localhost:8000/docs
- **Community**: Discord

---

## 📄 Лицензия

MIT License - смотрите [LICENSE](./LICENSE)

---

## 🎓 Стек технологий

### Backend
- FastAPI 0.104.1
- SQLAlchemy 2.0.23
- Pydantic 2.5.0
- PostgreSQL 15
- Redis 7
- Prometheus client

### Frontend
- React 18.2.0
- React Router 6
- Axios 1.6.0
- CSS3

### Infrastructure
- Docker & Docker Compose
- NGINX
- Prometheus + Grafana
- PostgreSQL
- Redis

---

**Последнее обновление**: 2024
**Версия**: 1.0.0
**Статус**: Production Ready ✅

---

*Спасибо за интерес к XaTube! 🚀*
