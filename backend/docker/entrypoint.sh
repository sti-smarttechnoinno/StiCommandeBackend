#!/bin/bash
set -e

echo "=== Initializing StiCommande Backend Container ==="

# Clean up any stale bootstrap cache files from build/host environments
rm -f /var/www/commande/backend/bootstrap/cache/*.php

# Ensure directories exist
mkdir -p /var/www/commande/backend/storage/framework/{cache/data,sessions,views}
mkdir -p /var/www/commande/backend/storage/logs
mkdir -p /var/www/commande/backend/bootstrap/cache
mkdir -p /run/nginx

# Ensure log file exists
touch /var/www/commande/backend/storage/logs/laravel.log

# Ensure initial permissions
chown -R www-data:www-data /var/www/commande/backend/storage /var/www/commande/backend/bootstrap/cache
chmod -R 775 /var/www/commande/backend/storage /var/www/commande/backend/bootstrap/cache

# Export runtime flags with sensible defaults for supervisor
export START_WEBSOCKET="${START_WEBSOCKET:-true}"
export START_QUEUE_WORKER="${START_QUEUE_WORKER:-false}"

# Resolve the application key: env var wins, then a key persisted in the
# storage volume, otherwise generate one and persist it for the next boot.
KEY_FILE="/var/www/commande/backend/storage/app/.app_key"
if [ -z "$APP_KEY" ]; then
    if [ -s "$KEY_FILE" ]; then
        APP_KEY="$(cat "$KEY_FILE")"
        export APP_KEY
        echo "APP_KEY loaded from $KEY_FILE"
    else
        echo "APP_KEY not provided - generating a new application key..."
        mkdir -p /var/www/commande/backend/storage/app
        APP_KEY="$(php artisan key:generate --show 2>/dev/null | grep -oE 'base64:[A-Za-z0-9+/=]+' | head -n 1)"
        if [ -n "$APP_KEY" ]; then
            export APP_KEY
            printf '%s\n' "$APP_KEY" > "$KEY_FILE"
            chmod 600 "$KEY_FILE"
            chown www-data:www-data "$KEY_FILE" || true
            echo "New APP_KEY persisted to $KEY_FILE (set APP_KEY in .env for a fixed key)."
        else
            echo "ERROR: unable to generate APP_KEY" >&2
            exit 1
        fi
    fi
fi

# Run database migrations if enabled
if [ "${RUN_MIGRATIONS:-true}" = "true" ]; then
    echo "Running database migrations..."
    php artisan migrate --force || echo "Warning: Migration failed or skipped (verify database connectivity)."
fi

# Discover packages against the current vendor installation
php artisan package:discover --ansi || true

# In production mode, cache configuration and routes for peak performance
if [ "${APP_ENV:-production}" = "production" ]; then
    echo "Optimizing Laravel configuration & routes for production..."
    php artisan config:cache || true
    php artisan route:cache || true
    php artisan view:cache || true
else
    echo "Running in ${APP_ENV:-development} mode, clearing caches..."
    php artisan config:clear || true
    php artisan route:clear || true
    php artisan view:clear || true
fi

# Re-apply ownership and permissions to ensure all files created by artisan are accessible by www-data
touch /var/www/commande/backend/storage/logs/laravel.log
chown -R www-data:www-data /var/www/commande/backend/storage /var/www/commande/backend/bootstrap/cache
chmod -R 775 /var/www/commande/backend/storage /var/www/commande/backend/bootstrap/cache

# Validate Nginx and PHP-FPM configurations
nginx -t || { echo "ERROR: Nginx configuration test failed!"; exit 1; }
php-fpm -t || { echo "ERROR: PHP-FPM configuration test failed!"; exit 1; }

echo "=== StiCommande Backend Ready. Starting services ==="
exec "$@"
