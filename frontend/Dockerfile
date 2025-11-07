FROM node:18-alpine

WORKDIR /app

# Копирование package files
COPY package.json package-lock.json ./

# Установка зависимостей
RUN npm ci

# Копирование приложения
COPY . .

# Build приложения
RUN npm run build

# Expose port
EXPOSE 3000

# Запуск dev сервера
CMD ["npm", "start"]
