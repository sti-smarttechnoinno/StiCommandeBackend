#!/bin/bash
set -e

echo "=== Initializing StiCommande Backend Container ==="

# Ensure directories exist
mkdir -p /var/www/commande/backend/storage/framework/{cache/data,sessions,views}
mkdir -p /var/www/commande/backend/storage/logs
mkdir -p /var/www/commande/backend/bootstrap/cache
mkdir -p /run/nginx

# Ensure correct permissions
chown -R www-data:www-data /var/www/commande/backend/storage /var/www/commande/backend/bootstrap/cache
chmod -R 775 /var/www/commande/backend/storage /var/www/commande/backend/bootstrap/cache

# Generate application key if not set
if [ -z "$APP_KEY" ]; then
    echo "Notice: APP_KEY not provided. Generating application key..."
    php artisan key:generate --force || true
fi

# Run database migrations if enabled
if [ "${RUN_MIGRATIONS:-true}" = "true" ]; then
    echo "Running database migrations..."
    php artisan migrate --force || echo "Warning: Migration failed or skipped (verify database connectivity)."
fi

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

echo "=== StiCommande Backend Ready. Starting services ==="
exec "$@"
