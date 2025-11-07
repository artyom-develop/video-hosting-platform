FROM tiangolo/nginx-rtmp:latest

# Установка необходимых пакетов
RUN apk add --no-cache \
    redis \
    python3 \
    py3-pip

# Копирование конфигурации nginx
COPY nginx.conf /etc/nginx/nginx.conf

# Создание необходимых директорий
RUN mkdir -p /recordings /tmp/hls /tmp/dash && \
    chmod -R 777 /recordings /tmp/hls /tmp/dash

# Здоровье сервиса
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD nc -z localhost 1935 || exit 1

EXPOSE 1935 8080

CMD ["/usr/local/nginx/sbin/nginx", "-g", "daemon off;"]
