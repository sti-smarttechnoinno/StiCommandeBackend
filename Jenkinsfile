pipeline {
    agent any
    environment {
        DEPLOY_PATH = '/var/www/commande/backend'
    }
    stages {
        stage('Checkout') {
            steps { checkout scm }
        }
        stage('Install deps') {
            steps { sh 'composer install --optimize-autoloader --no-dev' }
        }
        stage('Test') {
            steps { sh 'php artisan test' }
        }
        stage('Deploy') {
            steps {
                sh '''
                    rsync -a --exclude=".env" --exclude="storage" ./ $DEPLOY_PATH/
                    cd $DEPLOY_PATH
                    php artisan migrate --force
                    php artisan config:cache
                    php artisan route:cache
                    sudo supervisorctl restart all
                    sudo systemctl restart php8.5-fpm
                '''
            }
        }
    }
}