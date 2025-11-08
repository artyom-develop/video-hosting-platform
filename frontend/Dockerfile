FROM node:18-alpine

WORKDIR /app

# Копирование package файла
COPY package.json ./

# Установка зависимостей
RUN npm install

# Копирование приложения
COPY . .

# Build приложения
RUN npm run build

# Expose port
EXPOSE 3000

# Запуск приложения
CMD ["npm", "start"]
