#!/bin/bash
set -e

# Скрипт для корректного запуска RTMP сервера
# Обработка сигналов для graceful shutdown
trap "nginx -s quit; exit 0" SIGINT SIGTERM

# Создание необходимых директорий если они не существуют
mkdir -p /recordings /tmp/hls /tmp/dash
chmod -R 777 /recordings /tmp/hls /tmp/dash

# Установка переменных окружения по умолчанию
if [ -z "$BACKEND_HOST" ]; then
  export BACKEND_HOST="backend"
fi
if [ -z "$BACKEND_PORT" ]; then
  export BACKEND_PORT="8000"
fi

# Вывод информации о конфигурации
echo "========================================="
echo "RTMP Server Configuration"
echo "========================================="
echo "Backend Host: $BACKEND_HOST"
echo "Backend Port: $BACKEND_PORT"
echo "Recording path: /recordings"
echo "HLS path: /tmp/hls"
echo "DASH path: /tmp/dash"
echo "RTMP port: 1935"
echo "HTTP port: 8080"
echo "========================================="

# Подстановка переменных окружения в конфиг
# Используем sed для замены переменных вместо envsubst
echo "Substituting environment variables in nginx config..."
mkdir -p /etc/nginx/conf.d

# Используем sed для замены переменных в конфиге
sed -e "s|\$BACKEND_HOST|${BACKEND_HOST}|g" \
    -e "s|\$BACKEND_PORT|${BACKEND_PORT}|g" \
    /etc/nginx/nginx.conf > /etc/nginx/nginx.conf.tmp

if [ -s /etc/nginx/nginx.conf.tmp ]; then
  mv /etc/nginx/nginx.conf.tmp /etc/nginx/nginx.conf
else
  echo "ERROR: Failed to substitute variables in nginx.conf"
  exit 1
fi

echo "RTMP validation enabled at http://${BACKEND_HOST}:${BACKEND_PORT}/api/rtmp/publish"
echo "Starting nginx..."

# Запуск nginx
exec /usr/local/sbin/nginx -g "daemon off;"
