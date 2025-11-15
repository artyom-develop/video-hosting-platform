FROM nginx:alpine

# Используем простой конфиг 
COPY nginx-simple.conf /etc/nginx/nginx.conf

# Удаляем дефолтные конфиги из conf.d
RUN rm -f /etc/nginx/conf.d/*.conf

# Копируем entrypoint
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

EXPOSE 80 443

# Используем наш entrypoint
ENTRYPOINT ["/entrypoint.sh"]
CMD ["nginx", "-g", "daemon off;"]
