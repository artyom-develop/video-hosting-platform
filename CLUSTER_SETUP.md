# 🚀 XaTube Cluster Architecture - Запуск & Управление

## 📋 Что такое кластерная архитектура?

Кластерная архитектура XaTube обеспечивает:
- ✅ **Масштабируемость** - 3 инстанса backend'а с load balancing
- ✅ **Высокая доступность** - Primary PostgreSQL + Replica для failover
- ✅ **Распределённое кэширование** - Redis для session и cache
- ✅ **Мониторинг** - Prometheus + Grafana для каждого сервиса
- ✅ **Очередь сообщений** - RabbitMQ для асинхронных задач
- ✅ **RTMP Streaming** - Потоковое вещание в реальном времени

**Всего 12 сервисов в кластере:**
1. PostgreSQL Primary (5432)
2. PostgreSQL Replica (5433)
3. Redis Cache (6379)
4. Backend-1 (8001)
5. Backend-2 (8002)
6. Backend-3 (8003)
7. Frontend (3000)
8. NGINX Load Balancer (80, 443)
9. RTMP Server (1935, 8080)
10. Prometheus (9090)
11. Grafana (3001)
12. RabbitMQ (5672, 15672)

---

## 🏗️ Архитектура кластера

```
┌─────────────────────────────────────────────────────────────┐
│                    NGINX (Load Balancer)                     │
│             Least Conn, Rate Limiting, Caching              │
└────────┬──────────────────────┬──────────────────┬──────────┘
         │                      │                  │
    ┌────▼────┐            ┌────▼────┐        ┌────▼────┐
    │Backend-1│            │Backend-2│        │Backend-3│
    │Port8001 │            │Port8002 │        │Port8003 │
    └────┬────┘            └────┬────┘        └────┬────┘
         │                      │                  │
         └──────────┬───────────┴──────────────────┘
                    │
         ┌──────────▼──────────┐
         │   PostgreSQL        │
         │   Primary (5432)    │
         │   + Replica(5433)   │
         └──────────┬──────────┘
                    │
         ┌──────────▼──────────┐
         │  Redis Cache        │
         │  (6379)             │
         └─────────────────────┘
         
┌─────────────────────────────────────────────────────────────┐
│                MONITORING STACK                             │
├─────────────────────────────────────────────────────────────┤
│  Prometheus(9090) → Grafana(3001) → Node-Exporter(9100)   │
│  RabbitMQ(5672) → RabbitMQ Mgmt(15672)                    │
│  RTMP Server(1935) → Stats(8080)                          │
└─────────────────────────────────────────────────────────────┘
```

---

## 🚀 Быстрый старт кластера

### 1️⃣ Подготовка

```bash
# Перейти в проект
cd xatube

# Убедиться что есть все необходимые файлы
docker-compose -f docker-compose-cluster.yml config

# Проверить что ports доступны
netstat -ano | findstr "80\|443\|3000\|8000\|9090\|9200"
```

### 2️⃣ Запуск кластера

```bash
# Запустить весь кластер
docker-compose -f docker-compose-cluster.yml up -d

# Или с логами
docker-compose -f docker-compose-cluster.yml up
```

### 3️⃣ Проверка статуса

```bash
# Проверить что все сервисы запущены
docker-compose -f docker-compose-cluster.yml ps

# Проверить логи
docker-compose -f docker-compose-cluster.yml logs -f backend-1
docker-compose -f docker-compose-cluster.yml logs -f nginx
docker-compose -f docker-compose-cluster.yml logs -f postgres-primary

# Проверить что backend'ы здоровы
curl http://localhost:8001/health
curl http://localhost:8002/health
curl http://localhost:8003/health

# Проверить load balancer
curl http://localhost/health
```

### 4️⃣ Доступ к сервисам

| Сервис | URL | Логин/Пароль | Описание |
|--------|-----|--------------|---------|
| 🌐 Приложение | http://localhost | - | Главное приложение |
| 📚 API Docs | http://localhost/docs | - | Swagger документация |
| 📊 Prometheus | http://localhost:9090 | - | Метрики |
| 📈 Grafana | http://localhost:3001 | admin/password | Визуализация метрик |
| � RabbitMQ | http://localhost:15672 | guest/guest | Управление очередями |
| 🎬 RTMP Stats | http://localhost:8080/stat | - | Статистика потоков |
| 💾 PostgreSQL Primary | localhost:5432 | postgres/postgres | БД |
| � PostgreSQL Replica | localhost:5433 | postgres/postgres | Бэкап БД |
| 🔴 Redis | localhost:6379 | password | Кэш сессий |

---

## ⚙️ Конфигурация кластера

### Backend инстансы

Каждый backend запущен на отдельном порту с одним набором переменных:

```yaml
backend-1: localhost:8001
backend-2: localhost:8002
backend-3: localhost:8003
```

NGINX распределяет нагрузку используя алгоритм **least connections**:
- Request идёт в backend с наименьшим числом соединений
- Если backend'а нет - запрос перенаправляется на другой
- Health check каждые 10 секунд

### Database Replication

**Primary** (5432):
- Принимает все write операции
- Реплицирует данные в Replica

**Replica** (5433):
- Только read операции (опционально)
- Failover при недоступности Primary
- Backup репозиторий

### Redis

Single instance с конфигурацией:
- Max memory: 512MB
- Eviction policy: allkeys-lru (вытеснение)
- Password: `password`

---

## 📊 Мониторинг кластера

### Prometheus

Собирает метрики каждые 15 секунд с:
- 3 backend инстансов
- PostgreSQL primary + replica
- Redis cache
- RTMP server
- Node exporter
- RabbitMQ
- Elasticsearch

**URL**: http://localhost:9090

### Grafana

Визуализирует метрики Prometheus.

**Логин**: admin / password

**Основные дашборды**:
1. **Cluster Overview** - Общее состояние
2. **Backend Performance** - Нагрузка на backend'ы
3. **Database Health** - Статус БД и репликации
4. **API Metrics** - Requests, latency, errors
5. **Resource Utilization** - CPU, Memory, Disk

### Elasticsearch & Kibana

Собирает логи со всех компонентов.

**URL**: http://localhost:5601

---

## 🔄 Операции с кластером

### Масштабирование

Добавить 4-й backend:

```yaml
# В docker-compose-cluster.yml добавить:
backend-4:
  build:
    context: ./backend
    dockerfile: Dockerfile
  container_name: xatube-backend-4
  environment: [... копировать из backend-1 ...]
  ports:
    - "8004:8000"
  depends_on: [...]
  networks:
    - xatube-network
```

Затем обновить nginx-cluster.conf:

```nginx
upstream backend_cluster {
    least_conn;
    
    server backend-1:8000 weight=1 max_fails=3 fail_timeout=30s;
    server backend-2:8000 weight=1 max_fails=3 fail_timeout=30s;
    server backend-3:8000 weight=1 max_fails=3 fail_timeout=30s;
    server backend-4:8000 weight=1 max_fails=3 fail_timeout=30s;  # NEW
    
    keepalive 32;
}
```

### Обновление backend'а

```bash
# Перестроить image
docker-compose -f docker-compose-cluster.yml build backend-1

# Перезапустить один instance (без downtime для других)
docker-compose -f docker-compose-cluster.yml up -d --no-deps backend-1

# Повторить для backend-2 и backend-3
docker-compose -f docker-compose-cluster.yml up -d --no-deps backend-2
docker-compose -f docker-compose-cluster.yml up -d --no-deps backend-3
```

### Failover практика

**Отключить backend-1:**

```bash
docker-compose -f docker-compose-cluster.yml stop backend-1
```

**Результат:**
- NGINX переводит его в "down" состояние
- Все новые requests идут на backend-2 и backend-3
- Existing connections gracefully закрываются
- Backend-1 остаётся в docker'е (мёртвый но запущен)

**Восстановление:**

```bash
docker-compose -f docker-compose-cluster.yml start backend-1
```

### Database Failover

**В случае критического отказа primary:**

```bash
# Переключить replica на primary
docker-compose -f docker-compose-cluster.yml exec postgres-replica \
  pg_ctl promote -D /var/lib/postgresql/data

# Обновить connection strings в backend'ах
# DATABASE_URL=postgresql://postgres:postgres@postgres-replica:5432/xatube
```

---

## 📈 Load Testing кластера

### Используя ApacheBench

```bash
# Простой тест (100 requests, 10 concurrent)
ab -n 100 -c 10 http://localhost/

# Тяжёлый тест (10000 requests, 100 concurrent)
ab -n 10000 -c 100 http://localhost/

# С детальной статистикой
ab -n 1000 -c 50 -g results.tsv http://localhost/api/streams
```

### Используя wrk

```bash
# Установка (Windows)
# Скачать: https://github.com/wg/wrk/releases

# Тест (4 потока, 100 connections, 30 секунд)
wrk -t4 -c100 -d30s http://localhost/

# С custom скриптом
wrk -t4 -c100 -d30s -s script.lua http://localhost/api/streams
```

### Мониторинг во время теста

В отдельном терминале смотреть Prometheus:

```bash
# Текущая нагрузка на backend'ы
curl http://localhost:9090/api/v1/query?query=request_duration_seconds

# Throughput
curl http://localhost:9090/api/v1/query?query=rate(api_requests_total[1m])

# Ошибки
curl http://localhost:9090/api/v1/query?query=rate(api_errors_total[1m])
```

---

## 🛑 Остановка и очистка

### Остановить кластер

```bash
# Остановить все сервисы (данные сохраняются)
docker-compose -f docker-compose-cluster.yml stop

# Остановить и удалить контейнеры
docker-compose -f docker-compose-cluster.yml down

# Очистить всё включая volumes (⚠️ потеря данных!)
docker-compose -f docker-compose-cluster.yml down -v
```

### Просмотр логов

```bash
# Все логи
docker-compose -f docker-compose-cluster.yml logs

# Логи конкретного сервиса
docker-compose -f docker-compose-cluster.yml logs backend-1
docker-compose -f docker-compose-cluster.yml logs nginx

# Последние 100 строк в real-time
docker-compose -f docker-compose-cluster.yml logs -f --tail=100 backend-1
```

---

## 🔍 Troubleshooting

### Проблема: "Connection refused"

```bash
# Проверить что все контейнеры запущены
docker-compose -f docker-compose-cluster.yml ps

# Проверить логи
docker-compose -f docker-compose-cluster.yml logs nginx | tail -20

# Проверить NGINX конфиг
docker-compose -f docker-compose-cluster.yml exec nginx nginx -t
```

### Проблема: "Backend не отвечает"

```bash
# Проверить backend напрямую
curl http://localhost:8001/health
curl http://localhost:8002/health
curl http://localhost:8003/health

# Если не отвечает - проверить логи
docker-compose -f docker-compose-cluster.yml logs backend-1 | tail -50

# Перезагрузить
docker-compose -f docker-compose-cluster.yml restart backend-1
```

### Проблема: "БД недоступна"

```bash
# Проверить PostgreSQL
docker-compose -f docker-compose-cluster.yml exec postgres-primary \
  psql -U postgres -d xatube -c "SELECT 1;"

# Проверить репликацию
docker-compose -f docker-compose-cluster.yml exec postgres-primary \
  psql -U postgres -x -c "SHOW wal_level;"

# Проверить логи
docker-compose -f docker-compose-cluster.yml logs postgres-primary | tail -50
```

### Проблема: "High Memory Usage"

```bash
# Проверить использование памяти
docker stats

# Очистить неиспользуемые volumes
docker volume prune

# Уменьшить Redis max memory в docker-compose
# Измени: POSTGRES_INITDB_ARGS: "-c max_connections=100"
```

---

## 🔐 Безопасность кластера

### Рекомендации для production

1. **SSL/TLS сертификаты**
   ```bash
   # Раскомментировать HTTPS секцию в nginx-cluster.conf
   # Поставить реальные сертификаты
   ```

2. **Пароли**
   ```bash
   # Изменить все default пароли
   # PostgreSQL: postgres
   # Redis: password
   # Grafana: admin/password
   # RabbitMQ: guest/guest
   ```

3. **Firewall**
   ```bash
   # Открыть только необходимые порты
   # 80, 443 (публичные)
   # Остальные только для internal traffic
   ```

4. **Backup**
   ```bash
   # Регулярный backup PostgreSQL
   docker-compose -f docker-compose-cluster.yml exec postgres-primary \
     pg_dump -U postgres xatube > backup.sql
   ```

---

## 📚 Дополнительные ресурсы

- [QUICKSTART.md](./QUICKSTART.md) - Быстрый старт базовой версии
- [DEPLOYMENT.md](./docs/DEPLOYMENT.md) - Deployment guide
- [ARCHITECTURE.md](./docs/ARCHITECTURE.md) - Архитектура системы
- [DOCUMENTATION.md](./DOCUMENTATION.md) - Полная документация

---

## 🎉 Готово!

Кластер запущен и готов к production использованию! 🚀

Следи за:
- 📊 Prometheus на http://localhost:9090
- 📈 Grafana на http://localhost:3001
- 📡 Backend здоровьем через health checks
- 🗄️ Database репликацией

**Удачи с масштабированием! 🌟**
