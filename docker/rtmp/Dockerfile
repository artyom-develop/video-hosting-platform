FROM tiangolo/nginx-rtmp:latest

# Установка необходимых пакетов
RUN apt-get update && apt-get install -y \
    redis-server \
    python3 \
    python3-pip \
    bash \
    gettext \
    && rm -rf /var/lib/apt/lists/*

# Копирование конфигурации nginx
COPY nginx.conf /etc/nginx/nginx.conf

# Копирование entrypoint скрипта
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

# Создание необходимых директорий
RUN mkdir -p /recordings /tmp/hls /tmp/dash && \
    chmod -R 777 /recordings /tmp/hls /tmp/dash

# Здоровье сервиса
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD nc -z localhost 1935 || exit 1

EXPOSE 1935 8080

ENTRYPOINT ["/entrypoint.sh"]
