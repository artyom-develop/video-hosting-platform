#!/bin/sh

echo "Nginx entrypoint starting..."
echo "Waiting for services to stabilize..."
sleep 5

echo "Services ready. Testing nginx configuration..."

# Проверяем конфиг nginx
if ! nginx -t 2>&1; then
    echo "ERROR: Nginx configuration test failed!"
    exit 1
fi

echo "Starting nginx on foreground..."

# КРИТИЧНО: exec заменяет текущий процесс shell на nginx
# daemon off - чтобы nginx работал в foreground режиме (не в фоне)
exec nginx -g "daemon off;"
