#!/bin/bash
# Проверка что ключ работает перед попыткой стримить в OBS

STREAM_KEY="$1"
BACKEND_URL="${2:-http://localhost:8000}"

echo "🔍 Validating stream key: $STREAM_KEY"

RESPONSE=$(curl -s -w "\n%{http_code}" "$BACKEND_URL/api/rtmp/validate-key?stream_key=$STREAM_KEY")
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | head -n-1)

echo "Response code: $HTTP_CODE"
echo "Body: $BODY"

if [ "$HTTP_CODE" = "200" ]; then
    echo "✅ Stream key is VALID! You can start streaming now."
    exit 0
else
    echo "❌ Stream key is INVALID! Please check your stream key."
    exit 1
fi
