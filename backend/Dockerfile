# Global build arg for PHP version (available in all stages)
ARG PHP_VERSION=8.5

# =========================================================
# Stage 1: Install PHP Composer Dependencies
# =========================================================
FROM --platform=linux/amd64 docker.io/library/composer:2 AS composer_builder

WORKDIR /app

# Copy composer definitions
COPY composer.json composer.lock ./

# Install production dependencies without dev packages or scripts
RUN composer install \
    --no-dev \
    --no-interaction \
    --prefer-dist \
    --optimize-autoloader \
    --no-scripts \
    --ignore-platform-reqs

# Copy application code to generate complete autoloader
COPY . .
RUN composer dump-autoload --optimize --no-scripts

# =========================================================
# Stage 2: Production Runtime (PHP FPM + Nginx + WebSockets)
# =========================================================
FROM --platform=linux/amd64 docker.io/library/php:${PHP_VERSION}-fpm-alpine

LABEL maintainer="StiCommande DevOps Team"
LABEL description="Production Docker image for StiCommande Backend (PHP 8.5 + Laravel + Nginx + WebSockets)"

WORKDIR /var/www/commande/backend

# Install runtime packages, Nginx, Supervisor, Node.js and build dependencies
RUN apk add --no-cache \
    bash \
    curl \
    nginx \
    supervisor \
    nodejs \
    libpng \
    libpng-dev \
    libjpeg-turbo \
    libjpeg-turbo-dev \
    freetype \
    freetype-dev \
    libzip \
    libzip-dev \
    icu \
    icu-dev \
    libpq \
    libpq-dev \
    sqlite-dev \
    oniguruma-dev \
    $PHPIZE_DEPS \
    && docker-php-ext-configure gd --with-freetype --with-jpeg \
    && docker-php-ext-install -j$(nproc) \
        bcmath \
        exif \
        gd \
        intl \
        pcntl \
        pdo_mysql \
        pdo_pgsql \
        pdo_sqlite \
        pgsql \
        zip \
    && mkdir -p /tmp/redis \
    && (curl -fsSL --retry 3 https://pecl.php.net/get/redis -o /tmp/redis.tar.gz || curl -fsSL --retry 3 https://github.com/phpredis/phpredis/archive/refs/tags/6.1.0.tar.gz -o /tmp/redis.tar.gz) \
    && tar -xzf /tmp/redis.tar.gz -C /tmp/redis --strip-components=1 \
    && (cd /tmp/redis && phpize && ./configure && make -j$(nproc) && make install) \
    && docker-php-ext-enable redis \
    && rm -rf /tmp/redis /tmp/redis.tar.gz \
    && apk del --no-cache \
        $PHPIZE_DEPS \
        libpng-dev \
        libjpeg-turbo-dev \
        freetype-dev \
        libzip-dev \
        icu-dev \
        libpq-dev \
        sqlite-dev \
        oniguruma-dev

# Copy configuration files
COPY docker/php.ini /usr/local/etc/php/conf.d/custom.ini
COPY docker/nginx.conf /etc/nginx/nginx.conf
COPY docker/supervisord.conf /etc/supervisor/conf.d/supervisord.conf
COPY docker/entrypoint.sh /usr/local/bin/entrypoint.sh

RUN sed -i 's/\r$//' /usr/local/bin/entrypoint.sh && chmod +x /usr/local/bin/entrypoint.sh

# Copy application source code
COPY . /var/www/commande/backend

# Copy pre-built vendor packages from composer_builder
COPY --from=composer_builder /app/vendor /var/www/commande/backend/vendor

# Prepare directory structure, clean stale cache, and set permissions
RUN rm -rf /var/www/commande/backend/bootstrap/cache/*.php \
    && mkdir -p \
    /var/www/commande/backend/storage/framework/cache/data \
    /var/www/commande/backend/storage/framework/sessions \
    /var/www/commande/backend/storage/framework/views \
    /var/www/commande/backend/storage/logs \
    /var/www/commande/backend/bootstrap/cache \
    /var/www/commande/backend/public/build \
    /run/nginx \
    /var/log/supervisor \
    && echo '{}' > /var/www/commande/backend/public/build/manifest.json \
    && touch /var/www/commande/backend/storage/logs/laravel.log \
    && chown -R www-data:www-data /var/www/commande/backend/storage /var/www/commande/backend/bootstrap/cache \
    && chmod -R 775 /var/www/commande/backend/storage /var/www/commande/backend/bootstrap/cache \
    && chmod -R 777 /var/www/commande/backend/storage/logs

# Expose HTTP port (80) and WebSocket Hub port (8085)
EXPOSE 80 8085

# Healthcheck checking Laravel's /up endpoint
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
    CMD curl -f http://localhost/up || exit 1

# Default supervisor daemon environment variables
ENV START_WEBSOCKET=true \
    START_QUEUE_WORKER=false

# Use SIGTERM so supervisord shuts down gracefully without 10s SIGQUIT timeout
STOPSIGNAL SIGTERM

ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]
CMD ["/usr/bin/supervisord", "-c", "/etc/supervisor/conf.d/supervisord.conf"]
