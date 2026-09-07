pipeline {
    agent any

    options {
        timeout(time: 30, unit: 'MINUTES')
        buildDiscarder(logRotator(numToKeepStr: '10', artifactNumToKeepStr: '10'))
        timestamps()
    }

    environment {
        // Docker & Runtime Configuration
        PHP_VERSION            = '8.5'
        IMAGE_NAME             = 'sticommande-backend'
        IMAGE_TAG              = "${env.BUILD_NUMBER}"
        CONTAINER_NAME         = 'sticommande-backend'
        CONTAINER_PORT         = '8000'
        WS_PORT                = '8085'
        
        // Deployment Configuration
        // Options for DEPLOY_STRATEGY: 'docker-compose', 'docker-run', or 'rsync'
        DEPLOY_STRATEGY        = 'docker-compose'
        DEPLOY_PATH            = '/var/www/commande/backend'

        // Optional Docker Registry (e.g. 'docker.io/username' or AWS ECR / Harbor)
        // Leave empty if building & running directly on Jenkins / local docker host
        REGISTRY_URL           = ''
        REGISTRY_CREDENTIALS   = ''
    }

    stages {
        stage('Checkout') {
            steps {
                echo "--> Checking out source code..."
                checkout scm
            }
        }

        stage('Determine Context') {
            steps {
                script {
                    if (fileExists('composer.json')) {
                        env.APP_DIR = '.'
                    } else if (fileExists('backend/composer.json')) {
                        env.APP_DIR = 'backend'
                    } else {
                        error "Could not locate composer.json in root or backend/ directory!"
                    }
                    echo "--> Working directory set to: ${env.APP_DIR}"
                }
            }
        }

        stage('Test & Quality') {
            steps {
                dir("${env.APP_DIR}") {
                    echo "--> Running automated tests and code checks using PHP ${PHP_VERSION}..."
                    sh """
                        # Check for PHP 8.5 on host or run inside container
                        if command -v php${PHP_VERSION} >/dev/null 2>&1; then
                            PHP_CMD="php${PHP_VERSION}"
                        else
                            PHP_CMD="php"
                        fi

                        echo "Using PHP command: \$(\$PHP_CMD -v | head -n 1)"

                        if command -v composer >/dev/null 2>&1; then
                            composer install --prefer-dist --no-interaction
                            if [ -f artisan ]; then
                                \$PHP_CMD artisan test --env=testing || ./vendor/bin/phpunit
                            fi
                        else
                            echo "Composer not found on agent host; running tests inside php:${PHP_VERSION}-alpine container..."
                            docker run --rm -v "\$(pwd):/app" -w /app php:${PHP_VERSION}-alpine sh -c "
                                apk add --no-cache curl sqlite-dev icu-dev libzip-dev
                                docker-php-ext-install pdo pdo_sqlite intl zip
                                curl -sS https://getcomposer.org/installer | php -- --install-dir=/usr/local/bin --filename=composer
                                composer install --prefer-dist --no-interaction
                                php artisan test --env=testing
                            "
                        fi
                    """
                }
            }
        }

        stage('Build Docker Image') {
            steps {
                dir("${env.APP_DIR}") {
                    echo "--> Building production Docker image with PHP ${PHP_VERSION}: ${IMAGE_NAME}:${IMAGE_TAG}..."
                    sh """
                        docker build \
                            --build-arg PHP_VERSION=${PHP_VERSION} \
                            -t ${IMAGE_NAME}:${IMAGE_TAG} \
                            -t ${IMAGE_NAME}:latest \
                            -f Dockerfile .
                    """
                }
            }
        }

        stage('Smoke Test (Healthcheck)') {
            steps {
                echo "--> Performing container smoke test on health endpoint /up..."
                sh """
                    TEST_CONTAINER="test_${IMAGE_NAME}_${BUILD_NUMBER}"
                    
                    # Run ephemeral test container
                    docker run -d --name "\$TEST_CONTAINER" \
                        -e APP_ENV=testing \
                        -e APP_KEY=base64:Sm9obkRvZUlzQUZha2VLZXlGb3JUZXN0aW5nMTIzNDU= \
                        -e DB_CONNECTION=sqlite \
                        -e DB_DATABASE=:memory: \
                        -e RUN_MIGRATIONS=false \
                        -p 8099:80 \
                        ${IMAGE_NAME}:${IMAGE_TAG}

                    echo "Waiting for container initialization..."
                    sleep 10

                    # Verify health check endpoint responds with HTTP 200
                    HTTP_STATUS=\$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8099/up || echo "000")
                    echo "Health endpoint returned HTTP status: \$HTTP_STATUS"

                    # Clean up test container
                    docker stop "\$TEST_CONTAINER" || true
                    docker rm -f "\$TEST_CONTAINER" || true

                    if [ "\$HTTP_STATUS" != "200" ]; then
                        echo "ERROR: Health check failed! Container did not boot properly."
                        exit 1
                    fi
                """
            }
        }

        stage('Push to Registry') {
            when {
                expression {
                    return env.REGISTRY_URL != '' && env.REGISTRY_CREDENTIALS != ''
                }
            }
            steps {
                echo "--> Pushing image to remote registry: ${REGISTRY_URL}..."
                withCredentials([usernamePassword(credentialsId: "${env.REGISTRY_CREDENTIALS}", usernameVariable: 'REG_USER', passwordVariable: 'REG_PASS')]) {
                    sh """
                        echo "\$REG_PASS" | docker login -u "\$REG_USER" --password-stdin "${env.REGISTRY_URL}"
                        docker tag ${IMAGE_NAME}:${IMAGE_TAG} ${REGISTRY_URL}/${IMAGE_NAME}:${IMAGE_TAG}
                        docker tag ${IMAGE_NAME}:latest ${REGISTRY_URL}/${IMAGE_NAME}:latest
                        docker push ${REGISTRY_URL}/${IMAGE_NAME}:${IMAGE_TAG}
                        docker push ${REGISTRY_URL}/${IMAGE_NAME}:latest
                        docker logout "${env.REGISTRY_URL}" || true
                    """
                }
            }
        }

        stage('Deploy') {
            steps {
                script {
                    if (env.DEPLOY_STRATEGY == 'docker-compose') {
                        echo "--> Deploying via Docker Compose..."
                        dir("${env.APP_DIR}") {
                            sh '''
                                if [ -f docker-compose.yml ]; then
                                    docker compose down --remove-orphans || true
                                    docker compose up -d --build
                                    docker compose ps
                                else
                                    echo "docker-compose.yml not found, skipping compose deploy."
                                fi
                            '''
                        }
                    } else if (env.DEPLOY_STRATEGY == 'docker-run') {
                        echo "--> Deploying standalone Docker container..."
                        sh """
                            # Stop and remove existing running container
                            docker stop ${CONTAINER_NAME} || true
                            docker rm -f ${CONTAINER_NAME} || true

                            # Run new production container
                            docker run -d \
                                --name ${CONTAINER_NAME} \
                                --restart unless-stopped \
                                -p ${CONTAINER_PORT}:80 \
                                -p ${WS_PORT}:8085 \
                                -v sticommande_storage:/var/www/html/storage \
                                --env-file ${DEPLOY_PATH}/.env \
                                ${IMAGE_NAME}:latest

                            echo "--> Deployment active on port ${CONTAINER_PORT} (Web) and ${WS_PORT} (WebSockets)."
                        """
                    } else if (env.DEPLOY_STRATEGY == 'rsync') {
                        echo "--> Deploying via legacy Rsync..."
                        dir("${env.APP_DIR}") {
                            sh """
                                rsync -a --exclude=".env" --exclude="storage" ./ ${DEPLOY_PATH}/
                                cd ${DEPLOY_PATH}
                                php artisan migrate --force
                                php artisan config:cache
                                php artisan route:cache
                                sudo supervisorctl restart all || true
                                sudo systemctl restart php8.5-fpm || true
                            """
                        }
                    }
                }
            }
        }
    }

    post {
        always {
            echo "--> Cleaning up dangling images..."
            sh 'docker image prune -f || true'
        }
        success {
            echo "SUCCESS: StiCommande Backend build and deployment completed successfully."
        }
        failure {
            echo "FAILURE: StiCommande Backend pipeline failed. Please check stage logs above."
        }
    }
}