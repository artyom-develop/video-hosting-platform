FROM python:3.11-alpine

WORKDIR /app

# Используем зеркало Aliyun (более надёжное)
RUN echo "https://mirrors.aliyun.com/alpine/v3.22/main" > /etc/apk/repositories && \
    echo "https://mirrors.aliyun.com/alpine/v3.22/community" >> /etc/apk/repositories && \
    apk update && apk add --no-cache \
    postgresql-client \
    jpeg-dev \
    zlib-dev \
    curl \
    && rm -rf /var/cache/apk/*

# Копирование requirements
COPY requirements.txt .

# Установка Python зависимостей
RUN pip install --no-cache-dir -r requirements.txt

# Копирование приложения
COPY . .

# Expose port
EXPOSE 8000

# Run application
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
