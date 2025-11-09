FROM python:3.11-alpine

WORKDIR /app

# Установка системных зависимостей
RUN apk add --no-cache \
    postgresql-client \
    jpeg-dev \
    zlib-dev \
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
