FROM php:8.1-apache

# Instalamos extensiones de MySQL
RUN docker-php-ext-install pdo pdo_mysql

# ACTIVAR MOD_REWRITE (Esto es lo que quita el error 500)
RUN a2enmod rewrite

# Permitir que el .htaccess sobrescriba la configuración
RUN sed -i '/<Directory \/var\/www\/>/,/<\/Directory>/ s/AllowOverride None/AllowOverride All/' /etc/apache2/apache2.conf

COPY src/ /var/www/html/

# Crear carpeta de uploads y dar permisos
RUN mkdir -p /var/www/html/uploads && \
    chown -R www-data:www-data /var/www/html/uploads && \
    chmod -R 755 /var/www/html/uploads

EXPOSE 80