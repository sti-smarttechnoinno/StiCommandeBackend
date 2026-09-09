pipeline {
    agent any

    triggers {
        // Automatically check GitHub every 2 minutes for new commits (works on local network 192.168.x.x)
        pollSCM('H/2 * * * *')
        // Instant trigger if GitHub webhook is active
        githubPush()
    }

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
                    echo "--> Setting up ephemeral PostgreSQL test database and running tests..."
                    sh """
                        TEST_PG_CONTAINER="pg_test_${env.BUILD_NUMBER}"

                        # Clean up any leftover test container
                        docker rm -f "\$TEST_PG_CONTAINER" || true

                        echo "--> Starting ephemeral PostgreSQL 16 test container on port 5433..."
                        docker run -d --name "\$TEST_PG_CONTAINER" \
                            -e POSTGRES_DB=sticommande_test \
                            -e POSTGRES_USER=postgres \
                            -e POSTGRES_PASSWORD=secret_test_pass \
                            -p 5433:5432 \
                            docker.io/library/postgres:16-alpine

                        echo "--> Waiting for PostgreSQL test database to be healthy..."
                        for i in \$(seq 1 20); do
                            if docker exec "\$TEST_PG_CONTAINER" pg_isready -U postgres -d sticommande_test >/dev/null 2>&1; then
                                echo "PostgreSQL test container is ready!"
                                break
                            fi
                            sleep 1
                        done

                        # Install composer dependencies
                        if command -v composer >/dev/null 2>&1; then
                            composer install --prefer-dist --no-interaction
                        fi

                        # Set testing APP_KEY if missing
                        export APP_KEY="base64:Sm9obkRvZUlzQUZha2VLZXlGb3JUZXN0aW5nMTIzNDU="

                        # Ensure stub Vite manifest exists for testing views
                        mkdir -p public/build
                        echo '{}' > public/build/manifest.json

                        # Check if host PHP 8.5 has pdo_pgsql extension
                        if command -v php${env.PHP_VERSION} >/dev/null 2>&1 && php${env.PHP_VERSION} -m | grep -qi pdo_pgsql; then
                            echo "--> Running tests with host php${env.PHP_VERSION} against PostgreSQL..."
                            php${env.PHP_VERSION} artisan test --env=testing
                        elif command -v php >/dev/null 2>&1 && php -m | grep -qi pdo_pgsql; then
                            echo "--> Running tests with host php against PostgreSQL..."
                            php artisan test --env=testing
                        else
                            echo "--> Host PHP lacks pdo_pgsql extension. Running tests in Docker container with PHP ${env.PHP_VERSION} & PostgreSQL drivers..."
                            docker run --rm \
                                --network host \
                                -v "\$(pwd):/app" -w /app \
                                docker.io/library/php:${env.PHP_VERSION}-alpine sh -c "
                                    apk add --no-cache curl postgresql-dev icu-dev libzip-dev
                                    docker-php-ext-install pdo pdo_pgsql intl zip
                                    curl -sS https://getcomposer.org/installer | php -- --install-dir=/usr/local/bin --filename=composer
                                    composer install --prefer-dist --no-interaction
                                    php artisan test --env=testing
                                "
                        fi
                    """
                }
            }
            post {
                always {
                    sh """
                        TEST_PG_CONTAINER="pg_test_${env.BUILD_NUMBER}"
                        echo "--> Cleaning up ephemeral PostgreSQL test container..."
                        docker rm -f "\$TEST_PG_CONTAINER" || true
                        echo "--> Cleaning up test bootstrap cache..."
                        rm -f ${env.APP_DIR}/bootstrap/cache/*.php || true
                    """
                }
            }
        }

        stage('Build Docker Image') {
            steps {
                dir("${env.APP_DIR}") {
                    echo "--> Building production Docker image with PHP ${env.PHP_VERSION}: ${env.IMAGE_NAME}:${env.IMAGE_TAG}..."
                    sh """
                        docker build \
                            --build-arg PHP_VERSION=${env.PHP_VERSION} \
                            -t ${env.IMAGE_NAME}:${env.IMAGE_TAG} \
                            -t ${env.IMAGE_NAME}:latest \
                            -f Dockerfile .
                    """
                }
            }
        }

        stage('Smoke Test (Healthcheck)') {
            steps {
                echo "--> Performing container smoke test on health endpoint /up..."
                sh """
                    TEST_CONTAINER="test_${env.IMAGE_NAME}_${env.BUILD_NUMBER}"

                    # Clean up any leftover test container
                    docker rm -f "\$TEST_CONTAINER" >/dev/null 2>&1 || true

                    # Run ephemeral test container
                    docker run -d --name "\$TEST_CONTAINER" \
                        -e APP_ENV=testing \
                        -e APP_KEY=base64:Sm9obkRvZUlzQUZha2VLZXlGb3JUZXN0aW5nMTIzNDU= \
                        -e DB_CONNECTION=sqlite \
                        -e DB_DATABASE=:memory: \
                        -e CACHE_STORE=array \
                        -e SESSION_DRIVER=array \
                        -e QUEUE_CONNECTION=sync \
                        -e RUN_MIGRATIONS=false \
                        -e START_WEBSOCKET=false \
                        -e START_QUEUE_WORKER=false \
                        -p 127.0.0.1:8099:80 \
                        ${env.IMAGE_NAME}:${env.IMAGE_TAG}

                    echo "Waiting for container initialization..."
                    HTTP_STATUS="000"

                    # Poll up to 30 seconds for container readiness
                    for i in \$(seq 1 30); do
                        # Check host-mapped port via IPv4 (127.0.0.1)
                        STATUS=\$(curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:8099/up 2>/dev/null || true)
                        if [ "\$STATUS" = "200" ]; then
                            HTTP_STATUS="200"
                            echo "Healthcheck passed on host port 8099 after \${i}s!"
                            break
                        fi

                        # Check directly inside container if host networking/rootless podman port forwarding has latency
                        CONTAINER_STATUS=\$(docker exec "\$TEST_CONTAINER" curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1/up 2>/dev/null || true)
                        if [ "\$CONTAINER_STATUS" = "200" ]; then
                            HTTP_STATUS="200"
                            echo "Healthcheck passed inside container after \${i}s!"
                            break
                        fi

                        sleep 1
                    done

                    echo "Health endpoint returned HTTP status: \$HTTP_STATUS"

                    if [ "\$HTTP_STATUS" != "200" ]; then
                        echo "ERROR: Health check failed! Printing container logs:"
                        docker logs "\$TEST_CONTAINER" || true
                        docker stop "\$TEST_CONTAINER" || true
                        docker rm -f "\$TEST_CONTAINER" || true
                        exit 1
                    fi

                    # Clean up test container
                    docker stop "\$TEST_CONTAINER" || true
                    docker rm -f "\$TEST_CONTAINER" || true
                """
            }
        }

        stage('Push to Registry') {
            when {
                expression {
                    return (env.REGISTRY_URL?.trim() ?: '') != '' && (env.REGISTRY_CREDENTIALS?.trim() ?: '') != ''
                }
            }
            steps {
                echo "--> Pushing image to remote registry: ${env.REGISTRY_URL}..."
                withCredentials([usernamePassword(credentialsId: "${env.REGISTRY_CREDENTIALS}", usernameVariable: 'REG_USER', passwordVariable: 'REG_PASS')]) {
                    sh """
                        echo "\$REG_PASS" | docker login -u "\$REG_USER" --password-stdin "${env.REGISTRY_URL}"
                        docker tag ${env.IMAGE_NAME}:${env.IMAGE_TAG} ${env.REGISTRY_URL}/${env.IMAGE_NAME}:${env.IMAGE_TAG}
                        docker tag ${env.IMAGE_NAME}:latest ${env.REGISTRY_URL}/${env.IMAGE_NAME}:latest
                        docker push ${env.REGISTRY_URL}/${env.IMAGE_NAME}:${env.IMAGE_TAG}
                        docker push ${env.REGISTRY_URL}/${env.IMAGE_NAME}:latest
                        docker logout "${env.REGISTRY_URL}" || true
                    """
                }
            }
        }

        stage('Deploy') {
            steps {
                script {
                    dir("${env.APP_DIR}") {
                        echo "--> Synchronizing updated code to ${env.DEPLOY_PATH}..."
                        sh """
                            # Ensure deploy directory exists
                            sudo mkdir -p ${env.DEPLOY_PATH}
                            sudo chown -R \$(whoami): ${env.DEPLOY_PATH} || true

                            # Synchronize code to /var/www/commande/backend while protecting .env and storage
                            rsync -av --delete \
                                --exclude=".git" \
                                --exclude=".env" \
                                --exclude="storage" \
                                ./ ${env.DEPLOY_PATH}/

                            # Ensure proper Laravel storage directories & permissions exist on server
                            mkdir -p ${env.DEPLOY_PATH}/storage/framework/{cache/data,sessions,views}
                            mkdir -p ${env.DEPLOY_PATH}/storage/logs
                            mkdir -p ${env.DEPLOY_PATH}/bootstrap/cache
                            chmod -R 775 ${env.DEPLOY_PATH}/storage ${env.DEPLOY_PATH}/bootstrap/cache
                            sudo chown -R www-data:www-data ${env.DEPLOY_PATH}/storage ${env.DEPLOY_PATH}/bootstrap/cache || true
                        """

                        if (env.DEPLOY_STRATEGY == 'docker-compose') {
                            echo "--> Deploying via Docker Compose inside ${env.DEPLOY_PATH}..."
                            sh """
                                cd ${env.DEPLOY_PATH}
                                docker compose down --remove-orphans || true
                                docker compose up -d --build
                                docker compose ps
                            """
                        } else if (env.DEPLOY_STRATEGY == 'docker-run') {
                            echo "--> Deploying standalone Docker container from ${env.DEPLOY_PATH}..."
                            sh """
                                docker stop ${env.CONTAINER_NAME} || true
                                docker rm -f ${env.CONTAINER_NAME} || true

                                docker run -d \
                                    --name ${env.CONTAINER_NAME} \
                                    --restart unless-stopped \
                                    -p ${env.CONTAINER_PORT}:80 \
                                    -p ${env.WS_PORT}:8085 \
                                    -v ${env.DEPLOY_PATH}/storage:/var/www/html/storage \
                                    --env-file ${env.DEPLOY_PATH}/.env \
                                    ${env.IMAGE_NAME}:latest

                                echo "--> Deployment active on port ${env.CONTAINER_PORT} (Web) and ${env.WS_PORT} (WebSockets)."
                            """
                        } else if (env.DEPLOY_STRATEGY == 'rsync') {
                            echo "--> Executing host post-deploy hooks in ${env.DEPLOY_PATH}..."
                            sh """
                                cd ${env.DEPLOY_PATH}
                                php artisan migrate --force || true
                                php artisan config:cache || true
                                php artisan route:cache || true
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