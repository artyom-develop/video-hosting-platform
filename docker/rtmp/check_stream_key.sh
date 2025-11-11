#!/bin/bash
# Скрипт для проверки ключей перед публикацией
# Используется как on_publish хук

STREAM_KEY="$1"
APP_NAME="$2"

BACKEND_HOST="${BACKEND_HOST:-backend}"
BACKEND_PORT="${BACKEND_PORT:-8000}"

echo "[$(date)] Stream publish attempt - Key: $STREAM_KEY, App: $APP_NAME" >> /var/log/rtmp_access.log

# Проверяем ключ через backend
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "http://$BACKEND_HOST:$BACKEND_PORT/api/rtmp/publish" \
    -d "name=$STREAM_KEY&app=$APP_NAME" \
    -H "Content-Type: application/x-www-form-urlencoded")

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | head -n-1)

echo "[$(date)] Backend response: $HTTP_CODE - $BODY" >> /var/log/rtmp_access.log

if [ "$HTTP_CODE" != "200" ]; then
    echo "[$(date)] ❌ Invalid stream key: $STREAM_KEY" >> /var/log/rtmp_access.log
    exit 1
fi

echo "[$(date)] ✅ Stream key validated: $STREAM_KEY" >> /var/log/rtmp_access.log
exit 0
