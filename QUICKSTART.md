# 🚀 Руководство по запуску XaTube

## Требования

- Docker 20.10+
- Docker Compose 2.0+
- Git
- 8GB+ RAM
- 20GB свободного места на диске

## Быстрый старт (3 минуты)

### 1. Клонирование репозитория
```bash
git clone https://github.com/xatube/xatube.git
cd xatube
```

### 2. Конфигурация окружения
```bash
# Бэкэнд
cp backend/.env.example backend/.env

# Фронтэнд
cp frontend/.env.example frontend/.env
```

### 3. Запуск Docker Compose
```bash
docker-compose up -d
```

### 4. Инициализация базы данных
```bash
# БД инициализируется автоматически при первом запуске
# Проверить статус:
docker-compose ps
```

### 5. Доступ к приложению
```
🌐 Главное приложение: http://localhost
📚 API Документация: http://localhost:8000/docs
📊 Prometheus: http://localhost:9090
📈 Grafana: http://localhost:3000
```

---

## Детальный запуск

### Шаг 1: Подготовка

```bash
# Клонирование
git clone https://github.com/xatube/xatube.git
cd xatube

# Создание .env файлов
mkdir -p backend frontend
```

### Шаг 2: Конфигурация Backend

**backend/.env**
```env
DATABASE_URL=postgresql://postgres:postgres@db:5432/xatube
REDIS_URL=redis://:password@cache:6379/0
SECRET_KEY=your-super-secret-key-min-32-chars-long-xxxxx
JWT_ALGORITHM=HS256
JWT_EXPIRATION_HOURS=24
API_TITLE=XaTube
API_DESCRIPTION=XaTube - Video Streaming Platform
ALLOWED_HOSTS=localhost,127.0.0.1,nginx
CORS_ORIGINS=http://localhost:3000,http://localhost
RTMP_SERVER_URL=http://rtmp:8080
```

### Шаг 3: Конфигурация Frontend

**frontend/.env**
```env
REACT_APP_API_URL=http://localhost:8000/api
REACT_APP_APP_NAME=XaTube
REACT_APP_LOG_LEVEL=info
NODE_ENV=production
```

### Шаг 4: Запуск сервисов

```bash
# Запуск всех контейнеров
docker-compose up -d

# Проверка статуса
docker-compose ps

# Просмотр логов
docker-compose logs -f
```

### Шаг 5: Проверка здоровья сервисов

```bash
# Проверить, что все сервисы готовы
docker-compose ps | grep healthy

# Проверить API
curl http://localhost:8000/docs

# Проверить фронтэнд
curl http://localhost
```

---

## 🧪 Первый запуск

### 1. Создать аккаунт
```
1. Откройте http://localhost
2. Нажмите "Регистрация"
3. Заполните форму:
   - Username: testuser
   - Email: test@example.com
   - Password: SecurePass123!
   - Full Name: Test User
4. Нажмите "Зарегистрироваться"
```

### 2. Вход в аккаунт
```
1. Нажмите "Вход"
2. Введите credentials
3. Нажмите "Вход"
```

### 3. Получить ключ трансляции
```
1. Перейти в профиль (👤 в навигации)
2. Выбрать вкладку "Ключ трансляции"
3. Скопировать RTMP URL и ключ
```

### 4. Настроить OBS Studio
```
1. Скачать OBS Studio: https://obsproject.com/
2. Открыть Settings → Stream
3. Stream Service: Custom
4. Server: rtmp://localhost:1935/live
5. Stream Key: <ваш ключ из профиля>
6. Нажать Start Streaming
```

### 5. Просмотреть трансляцию
```
1. На главной странице появится ваша трансляция
2. Нажать на карточку для просмотра
3. Видеоплеер откроется с вашей трансляцией
```

---

## 📊 Мониторинг

### Prometheus
```
URL: http://localhost:9090

Важные метрики:
- api_requests_total - Всего запросов
- api_request_duration_seconds - Время ответа
- active_streams - Активных потоков
- total_viewers - Всего зрителей
```

### Grafana
```
URL: http://localhost:3000
Username: admin
Password: password

Даш-борды:
- System Overview - Общая статистика
- Application Metrics - Метрики приложения
- Stream Statistics - Статистика потоков
```

---

## 🐛 Решение проблем

### Проблема: Контейнеры не запускаются
```bash
# Проверить логи
docker-compose logs backend
docker-compose logs postgres

# Перезагрузить
docker-compose down -v
docker-compose up -d
```

### Проблема: 502 Bad Gateway
```bash
# Проверить backend
curl http://localhost:8000/docs

# Перезагрузить nginx
docker-compose restart nginx
```

### Проблема: RTMP не работает
```bash
# Проверить RTMP сервер
curl http://localhost:8080/stat

# Перезагрузить
docker-compose restart rtmp
```

### Проблема: БД не инициализируется
```bash
# Проверить logs
docker-compose logs postgres

# Очистить volume и пересоздать
docker-compose down -v
docker-compose up -d postgres

# Дождитесь инициализации (~30 сек)
sleep 30
docker-compose up -d
```

### Проблема: Frontend не загружается
```bash
# Очистить cache
docker-compose down
docker system prune -a
docker-compose up -d
```

---

## 🔑 Стандартные credentials

### Администратор
```
Username: admin
Password: admin123
Email: admin@xatube.com
```

### Тестовый пользователь
```
Username: testuser
Password: test123
Email: test@xatube.com
```

---

## 📝 Важные файлы

```
xatube/
├── docker-compose.yml          # Конфигурация всех сервисов
├── .gitignore                  # Исключения Git
├── README.md                   # Основная документация
├── ARCHITECTURE.md             # Архитектура системы
├── API.md                      # Документация API
├── DEPLOYMENT.md               # Развертывание
│
├── backend/
│   ├── .env                    # Конфигурация (не коммитить!)
│   ├── .env.example            # Шаблон .env
│   ├── requirements.txt        # Python зависимости
│   └── app/main.py             # Точка входа
│
├── frontend/
│   ├── .env                    # Конфигурация (не коммитить!)
│   ├── .env.example            # Шаблон .env
│   ├── package.json            # npm зависимости
│   └── src/App.js              # Главный компонент
│
└── docker/
    ├── postgres/init.sql       # Инициализация БД
    ├── nginx/nginx.conf        # Конфиг NGINX
    ├── rtmp/nginx.conf         # Конфиг RTMP
    ├── prometheus/prometheus.yml   # Конфиг Prometheus
    └── grafana/provisioning/   # Конфиги Grafana
```

---

## 🛠 Полезные команды

```bash
# Просмотр логов
docker-compose logs -f backend
docker-compose logs -f frontend

# Вход в контейнер
docker-compose exec backend bash
docker-compose exec postgres psql -U postgres -d xatube

# Перезагрузка сервиса
docker-compose restart backend
docker-compose restart frontend

# Остановка/запуск
docker-compose stop
docker-compose start

# Полная переустановка
docker-compose down -v
docker-compose up -d

# Очистка системы
docker system prune -a
docker volume prune

# Проверка портов
netstat -tuln | grep LISTEN
```

---

## 📈 Масштабирование

### Для production

1. **SSL сертификаты**
```bash
# Использовать Let's Encrypt
sudo certbot certonly --standalone -d xatube.example.com
```

2. **Увеличить ресурсы в docker-compose.yml**
```yaml
backend:
  deploy:
    resources:
      limits:
        cpus: '2'
        memory: 4G
```

3. **Добавить несколько инстансов backend**
```bash
docker-compose up -d --scale backend=3
```

4. **Настроить HAProxy/Nginx load balancing**

5. **Использовать внешний PostgreSQL** (RDS, Azure Database)

---

## 🔐 Безопасность

### Для production

1. **Изменить все пароли** в .env файлах
2. **Использовать HTTPS** с real сертификатом
3. **Изменить SECRET_KEY** на длинный случайный ключ
4. **Отключить debug** mode
5. **Настроить firewall** на сервере
6. **Регулярно обновлять** dependencies
7. **Включить backup** для БД

---

## 📞 Поддержка

- **Issues**: https://github.com/xatube/xatube/issues
- **Documentation**: https://xatube.readthedocs.io
- **API Docs**: http://your-server:8000/docs
- **Community**: https://discord.gg/xatube

---

## 📜 Лицензия

MIT License - см. LICENSE файл

---

**Последнее обновление**: 2024
**Версия**: 1.0.0
**Статус**: Production Ready ✅

Enjoy streaming with XaTube! 🎬🚀
