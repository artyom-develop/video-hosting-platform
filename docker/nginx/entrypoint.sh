#!/bin/sh
echo "Starting nginx with special handling..."

# Запускаем nginx в foreground
nginx -g "daemon off;"

# Если nginx выходит, пытаемся перезапустить
echo "Nginx exited, attempting restart..."
sleep 2
exec "$@"
