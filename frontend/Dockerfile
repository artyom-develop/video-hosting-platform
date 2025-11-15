FROM node:18-alpine

WORKDIR /app

# Копирование package файла
COPY package.json package-lock.json ./

# Установка зависимостей
RUN npm install

# Копирование приложения
COPY . .

# Build приложения для production
RUN npm run build

# Используем serve для production
RUN npm install -g serve

# Expose port
EXPOSE 3000

# Health check - проверяем что фронтенд ответит на запрос
HEALTHCHECK --interval=10s --timeout=5s --retries=3 \
    CMD wget --quiet --tries=1 --spider http://localhost:3000 || exit 1

# Запуск production сервера
CMD ["serve", "-s", "build", "-l", "3000"]
