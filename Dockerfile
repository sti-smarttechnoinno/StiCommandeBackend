# =========================================================
# Stage 1: Install PHP Composer Dependencies
# =========================================================
FROM docker.io/library/composer:2 AS composer_builder

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
# Stage 2: Build Frontend Assets (Vite / React / Tailwind)
# =========================================================
FROM docker.io/library/node:20-alpine AS node_builder

WORKDIR /app

# Install PHP CLI & modules required by Wayfinder (artisan wayfinder:generate)
RUN apk add --no-cache \
    php \
    php-cli \
    php-phar \
    php-mbstring \
    php-openssl \
    php-tokenizer \
    php-xml \
    php-dom \
    php-curl \
    php-fileinfo

# Provide dummy key for artisan commands during build
ENV APP_KEY=base64:Sm9obkRvZUlzQUZha2VLZXlGb3JUZXN0aW5nMTIzNDU=

# Copy dependency definitions & clean install
COPY package.json package-lock.json ./
RUN npm ci

# Copy application source code
COPY . .

# Copy vendor from composer_builder so artisan wayfinder:generate can run
COPY --from=composer_builder /app/vendor ./vendor

# Build Vite assets
RUN npm run build

# Remove development dependencies to keep production footprint minimal
RUN npm prune --omit=dev

# =========================================================
# Stage 3: Production Runtime (PHP 8.5 FPM + Nginx + WebSockets)
# =========================================================
ARG PHP_VERSION=8.5
FROM docker.io/library/php:${PHP_VERSION}-fpm-alpine

LABEL maintainer="StiCommande DevOps Team"
LABEL description="Production Docker image for StiCommande Backend (PHP 8.5 + Laravel + Nginx + WebSockets)"

WORKDIR /var/www/html

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
        opcache \
        pcntl \
        pdo \
        pdo_mysql \
        pdo_pgsql \
        pdo_sqlite \
        pgsql \
        zip \
    && pecl install redis \
    && docker-php-ext-enable redis \
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

RUN chmod +x /usr/local/bin/entrypoint.sh

# Copy application source code
COPY . /var/www/html

# Copy pre-built vendor packages from composer_builder
COPY --from=composer_builder /app/vendor /var/www/html/vendor

# Copy compiled public assets and production node modules from node_builder
COPY --from=node_builder /app/public/build /var/www/html/public/build
COPY --from=node_builder /app/node_modules /var/www/html/node_modules

# Prepare directory structure, run discovery, and set permissions
RUN mkdir -p \
    /var/www/html/storage/framework/cache/data \
    /var/www/html/storage/framework/sessions \
    /var/www/html/storage/framework/views \
    /var/www/html/storage/logs \
    /var/www/html/bootstrap/cache \
    /run/nginx \
    /var/log/supervisor \
    && chown -R www-data:www-data /var/www/html/storage /var/www/html/bootstrap/cache \
    && chmod -R 775 /var/www/html/storage /var/www/html/bootstrap/cache

# Expose HTTP port (80) and WebSocket Hub port (8085)
EXPOSE 80 8085

# Healthcheck checking Laravel's /up endpoint
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
    CMD curl -f http://localhost/up || exit 1

ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]
CMD ["/usr/bin/supervisord", "-c", "/etc/supervisor/conf.d/supervisord.conf"]
