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
        // Prevents overlapping builds from colliding on the fixed test ports (5433, 8099)
        disableConcurrentBuilds()
    }

    environment {
        // Docker & Runtime Configuration
        PHP_VERSION            = '8.5'
        IMAGE_NAME             = 'sticommande-backend'
        IMAGE_TAG              = "${env.BUILD_NUMBER}"
        CONTAINER_NAME         = 'sticommande-backend'
        CONTAINER_PORT         = '8000'
        WS_PORT                = '8085'

        // Ephemeral test database (used only by the Test & Quality stage)
        TEST_DB_NAME           = 'sticommande_test'
        TEST_DB_USER           = 'postgres'
        TEST_DB_PASS           = 'secret_test_pass'
        TEST_DB_PORT           = '5433'
        TEST_APP_KEY           = 'base64:Sm9obkRvZUlzQUZha2VLZXlGb3JUZXN0aW5nMTIzNDU='

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
                    script {
                        if (isUnix()) {
                            sh """
                                TEST_PG_CONTAINER="pg_test_${env.BUILD_NUMBER}"

                                # Clean up any leftover test container
                                docker rm -f "\$TEST_PG_CONTAINER" || true

                                echo "--> Starting ephemeral PostgreSQL 16 test container on port ${env.TEST_DB_PORT}..."
                                docker run -d --name "\$TEST_PG_CONTAINER" \
                                    -e POSTGRES_DB=${env.TEST_DB_NAME} \
                                    -e POSTGRES_USER=${env.TEST_DB_USER} \
                                    -e POSTGRES_PASSWORD=${env.TEST_DB_PASS} \
                                    -p ${env.TEST_DB_PORT}:5432 \
                                    docker.io/library/postgres:16-alpine

                                echo "--> Waiting for PostgreSQL test database to be healthy..."
                                for i in \$(seq 1 20); do
                                    if docker exec "\$TEST_PG_CONTAINER" pg_isready -U ${env.TEST_DB_USER} -d ${env.TEST_DB_NAME} >/dev/null 2>&1; then
                                        echo "PostgreSQL test container is ready!"
                                        break
                                    fi
                                    sleep 1
                                done

                                # Install composer dependencies
                                if command -v composer >/dev/null 2>&1; then
                                    composer install --prefer-dist --no-interaction
                                fi

                                # Test env vars ÔÇö explicit so results don't depend on an untracked .env.testing
                                export APP_KEY="${env.TEST_APP_KEY}"
                                export DB_CONNECTION=pgsql
                                export DB_HOST=127.0.0.1
                                export DB_PORT=${env.TEST_DB_PORT}
                                export DB_DATABASE=${env.TEST_DB_NAME}
                                export DB_USERNAME=${env.TEST_DB_USER}
                                export DB_PASSWORD=${env.TEST_DB_PASS}

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
                                        -e APP_KEY="${env.TEST_APP_KEY}" \
                                        -e DB_CONNECTION=pgsql \
                                        -e DB_HOST=127.0.0.1 \
                                        -e DB_PORT=${env.TEST_DB_PORT} \
                                        -e DB_DATABASE=${env.TEST_DB_NAME} \
                                        -e DB_USERNAME=${env.TEST_DB_USER} \
                                        -e DB_PASSWORD=${env.TEST_DB_PASS} \
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
                        } else {
                            powershell """
                                \$ErrorActionPreference = 'Continue'
                                \$testPgContainer = "pg_test_${env.BUILD_NUMBER}"

                                # Clean up leftover test container
                                docker rm -f \$testPgContainer 2>\$null

                                Write-Host "--> Starting ephemeral PostgreSQL 16 test container on port ${env.TEST_DB_PORT}..."
                                docker run -d --name \$testPgContainer `
                                    -e POSTGRES_DB=${env.TEST_DB_NAME} `
                                    -e POSTGRES_USER=${env.TEST_DB_USER} `
                                    -e POSTGRES_PASSWORD=${env.TEST_DB_PASS} `
                                    -p ${env.TEST_DB_PORT}:5432 `
                                    docker.io/library/postgres:16-alpine

                                Write-Host "--> Waiting for PostgreSQL test database to be healthy..."
                                \$ready = \$false
                                for (\$i = 1; \$i -le 20; \$i++) {
                                    docker exec \$testPgContainer pg_isready -U ${env.TEST_DB_USER} -d ${env.TEST_DB_NAME} 2>\$null
                                    if (\$LASTEXITCODE -eq 0) {
                                        Write-Host "PostgreSQL test container is ready!"
                                        \$ready = \$true
                                        break
                                    }
                                    Start-Sleep -Seconds 1
                                }

                                if (-not (Test-Path "public/build")) {
                                    New-Item -ItemType Directory -Force -Path "public/build" | Out-Null
                                }
                                Set-Content -Path "public/build/manifest.json" -Value "{}" -Encoding ASCII

                                if (Get-Command composer -ErrorAction SilentlyContinue) {
                                    composer install --prefer-dist --no-interaction
                                }

                                \$env:APP_KEY = "${env.TEST_APP_KEY}"
                                \$env:DB_CONNECTION = "pgsql"
                                \$env:DB_HOST = "127.0.0.1"
                                \$env:DB_PORT = "${env.TEST_DB_PORT}"
                                \$env:DB_DATABASE = "${env.TEST_DB_NAME}"
                                \$env:DB_USERNAME = "${env.TEST_DB_USER}"
                                \$env:DB_PASSWORD = "${env.TEST_DB_PASS}"

                                \$phpCmd = \$null
                                if (Get-Command "php${env.PHP_VERSION}" -ErrorAction SilentlyContinue) {
                                    \$modules = & "php${env.PHP_VERSION}" -m
                                    if (\$modules -match "pdo_pgsql") { \$phpCmd = "php${env.PHP_VERSION}" }
                                }
                                if (-not \$phpCmd -and (Get-Command "php" -ErrorAction SilentlyContinue)) {
                                    \$modules = & php -m
                                    if (\$modules -match "pdo_pgsql") { \$phpCmd = "php" }
                                }

                                if (\$phpCmd) {
                                    Write-Host "--> Running tests with host \$phpCmd against PostgreSQL..."
                                    & \$phpCmd artisan test --env=testing
                                    if (\$LASTEXITCODE -ne 0) { exit \$LASTEXITCODE }
                                } else {
                                    Write-Host "--> Host PHP lacks pdo_pgsql or php is not installed. Running tests in Docker container with PHP ${env.PHP_VERSION}..."
                                    \$netName = "net_test_${env.BUILD_NUMBER}"
                                    docker network create \$netName 2>\$null
                                    docker network connect \$netName \$testPgContainer 2>\$null
                                    \$workspacePath = (Get-Location).Path.Replace('\\', '/')
                                    docker run --rm `
                                        --network \$netName `
                                        -e APP_KEY="${env.TEST_APP_KEY}" `
                                        -e DB_CONNECTION=pgsql `
                                        -e DB_HOST=\$testPgContainer `
                                        -e DB_PORT=5432 `
                                        -e DB_DATABASE="${env.TEST_DB_NAME}" `
                                        -e DB_USERNAME="${env.TEST_DB_USER}" `
                                        -e DB_PASSWORD="${env.TEST_DB_PASS}" `
                                        -v "\${workspacePath}:/app" -w /app `
                                        docker.io/library/php:${env.PHP_VERSION}-alpine sh -c "
                                            apk add --no-cache curl postgresql-dev icu-dev libzip-dev
                                            docker-php-ext-install pdo pdo_pgsql intl zip
                                            curl -sS https://getcomposer.org/installer | php -- --install-dir=/usr/local/bin --filename=composer
                                            composer install --prefer-dist --no-interaction
                                            php artisan test --env=testing
                                        "
                                    \$testExit = \$LASTEXITCODE
                                    docker network rm \$netName 2>\$null
                                    if (\$testExit -ne 0) { exit \$testExit }
                                }
                            """
                        }
                    }
                }
            }
            post {
                always {
                    script {
                        if (isUnix()) {
                            sh """
                                TEST_PG_CONTAINER="pg_test_${env.BUILD_NUMBER}"
                                echo "--> Cleaning up ephemeral PostgreSQL test container..."
                                docker rm -f "\$TEST_PG_CONTAINER" || true
                                echo "--> Cleaning up test bootstrap cache..."
                                rm -f ${env.APP_DIR}/bootstrap/cache/*.php || true
                            """
                        } else {
                            powershell """
                                \$testPgContainer = "pg_test_${env.BUILD_NUMBER}"
                                Write-Host "--> Cleaning up ephemeral PostgreSQL test container..."
                                docker rm -f \$testPgContainer 2>\$null
                                Write-Host "--> Cleaning up test bootstrap cache..."
                                Remove-Item -Path "${env.APP_DIR}/bootstrap/cache/*.php" -Force -ErrorAction SilentlyContinue
                            """
                        }
                    }
                }
            }
        }

        stage('Build Docker Image') {
            steps {
                dir("${env.APP_DIR}") {
                    echo "--> Building production Docker image with PHP ${env.PHP_VERSION}: ${env.IMAGE_NAME}:${env.IMAGE_TAG}..."
                    script {
                        if (isUnix()) {
                            sh """
                                docker build \
                                    --build-arg PHP_VERSION=${env.PHP_VERSION} \
                                    -t ${env.IMAGE_NAME}:${env.IMAGE_TAG} \
                                    -t ${env.IMAGE_NAME}:latest \
                                    -f Dockerfile .
                            """
                        } else {
                            powershell """
                                docker build `
                                    --build-arg PHP_VERSION=${env.PHP_VERSION} `
                                    -t ${env.IMAGE_NAME}:${env.IMAGE_TAG} `
                                    -t ${env.IMAGE_NAME}:latest `
                                    -f Dockerfile .
                                if (\$LASTEXITCODE -ne 0) { exit \$LASTEXITCODE }
                            """
                        }
                    }
                }
            }
        }

        stage('Smoke Test (Healthcheck)') {
            steps {
                echo "--> Performing container smoke test on health endpoint /up..."
                script {
                    if (isUnix()) {
                        sh """
                            TEST_CONTAINER="test_${env.IMAGE_NAME}_${env.BUILD_NUMBER}"

                            # Clean up any leftover test container
                            docker rm -f "\$TEST_CONTAINER" >/dev/null 2>&1 || true

                            # Run ephemeral test container
                            docker run -d --name "\$TEST_CONTAINER" \
                                -e APP_ENV=testing \
                                -e APP_KEY=${env.TEST_APP_KEY} \
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
                    } else {
                        powershell """
                            \$testContainer = "test_${env.IMAGE_NAME}_${env.BUILD_NUMBER}"
                            docker rm -f \$testContainer 2>\$null

                            docker run -d --name \$testContainer `
                                -e APP_ENV=testing `
                                -e APP_KEY="${env.TEST_APP_KEY}" `
                                -e DB_CONNECTION=sqlite `
                                -e DB_DATABASE=:memory: `
                                -e CACHE_STORE=array `
                                -e SESSION_DRIVER=array `
                                -e QUEUE_CONNECTION=sync `
                                -e RUN_MIGRATIONS=false `
                                -e START_WEBSOCKET=false `
                                -e START_QUEUE_WORKER=false `
                                -p 127.0.0.1:8099:80 `
                                ${env.IMAGE_NAME}:${env.IMAGE_TAG}

                            Write-Host "Waiting for container initialization..."
                            \$httpStatus = "000"

                            for (\$i = 1; \$i -le 30; \$i++) {
                                try {
                                    \$response = Invoke-WebRequest -Uri "http://127.0.0.1:8099/up" -UseBasicParsing -TimeoutSec 2 -ErrorAction SilentlyContinue
                                    if (\$response.StatusCode -eq 200) {
                                        \$httpStatus = "200"
                                        Write-Host "Healthcheck passed on host port 8099 after \${i}s!"
                                        break
                                    }
                                } catch {
                                    \$code = docker exec \$testContainer curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1/up 2>\$null
                                    if (\$code -eq "200") {
                                        \$httpStatus = "200"
                                        Write-Host "Healthcheck passed inside container after \${i}s!"
                                        break
                                    }
                                }
                                Start-Sleep -Seconds 1
                            }

                            Write-Host "Health endpoint returned HTTP status: \$httpStatus"

                            if (\$httpStatus -ne "200") {
                                Write-Host "ERROR: Health check failed! Printing container logs:"
                                docker logs \$testContainer
                                docker stop \$testContainer 2>\$null
                                docker rm -f \$testContainer 2>\$null
                                exit 1
                            }

                            docker stop \$testContainer 2>\$null
                            docker rm -f \$testContainer 2>\$null
                        """
                    }
                }
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
                    script {
                        if (isUnix()) {
                            sh """
                                echo "\$REG_PASS" | docker login -u "\$REG_USER" --password-stdin "${env.REGISTRY_URL}"
                                docker tag ${env.IMAGE_NAME}:${env.IMAGE_TAG} ${env.REGISTRY_URL}/${env.IMAGE_NAME}:${env.IMAGE_TAG}
                                docker tag ${env.IMAGE_NAME}:latest ${env.REGISTRY_URL}/${env.IMAGE_NAME}:latest
                                docker push ${env.REGISTRY_URL}/${env.IMAGE_NAME}:${env.IMAGE_TAG}
                                docker push ${env.REGISTRY_URL}/${env.IMAGE_NAME}:latest
                                docker logout "${env.REGISTRY_URL}" || true
                            """
                        } else {
                            powershell """
                                \$env:REG_PASS | docker login -u \$env:REG_USER --password-stdin "${env.REGISTRY_URL}"
                                docker tag ${env.IMAGE_NAME}:${env.IMAGE_TAG} ${env.REGISTRY_URL}/${env.IMAGE_NAME}:${env.IMAGE_TAG}
                                docker tag ${env.IMAGE_NAME}:latest ${env.REGISTRY_URL}/${env.IMAGE_NAME}:latest
                                docker push ${env.REGISTRY_URL}/${env.IMAGE_NAME}:${env.IMAGE_TAG}
                                docker push ${env.REGISTRY_URL}/${env.IMAGE_NAME}:latest
                                docker logout "${env.REGISTRY_URL}" 2>\$null
                            """
                        }
                    }
                }
            }
        }

        stage('Deploy') {
            steps {
                script {
                    dir("${env.APP_DIR}") {
                        if (isUnix()) {
                            sh """
                                # Detect if non-interactive sudo is available
                                SUDO=""
                                if command -v sudo >/dev/null 2>&1 && sudo -n true 2>/dev/null; then
                                    SUDO="sudo -n"
                                fi

                                TARGET_DIR="${env.DEPLOY_PATH}"

                                # Determine if target DEPLOY_PATH is writable or can be created
                                CAN_USE_DEPLOY_PATH=false
                                if [ -d "\$TARGET_DIR" ] && [ -w "\$TARGET_DIR" ]; then
                                    CAN_USE_DEPLOY_PATH=true
                                elif mkdir -p "\$TARGET_DIR" 2>/dev/null; then
                                    CAN_USE_DEPLOY_PATH=true
                                elif [ -n "\$SUDO" ] && \$SUDO mkdir -p "\$TARGET_DIR" 2>/dev/null; then
                                    \$SUDO chown -R \$(whoami): "\$TARGET_DIR" 2>/dev/null || true
                                    CAN_USE_DEPLOY_PATH=true
                                fi

                                if [ "\$CAN_USE_DEPLOY_PATH" = "true" ]; then
                                    echo "--> Synchronizing updated code to \$TARGET_DIR..."
                                    rsync -av --delete \
                                        --no-owner \
                                        --no-group \
                                        --no-perms \
                                        --exclude=".git" \
                                        --exclude=".env" \
                                        --exclude="storage" \
                                        --exclude="vendor" \
                                        --exclude="node_modules" \
                                        ./ "\$TARGET_DIR"/

                                    # Ensure proper Laravel storage directories & permissions exist on server
                                    mkdir -p "\$TARGET_DIR"/storage/framework/{cache/data,sessions,views}
                                    mkdir -p "\$TARGET_DIR"/storage/logs
                                    mkdir -p "\$TARGET_DIR"/bootstrap/cache
                                    chmod -R 775 "\$TARGET_DIR"/storage "\$TARGET_DIR"/bootstrap/cache 2>/dev/null || true
                                    if [ -n "\$SUDO" ]; then
                                        \$SUDO chown -R www-data:www-data "\$TARGET_DIR"/storage "\$TARGET_DIR"/bootstrap/cache 2>/dev/null || true
                                    fi
                                else
                                    echo "Notice: Cannot write to \$TARGET_DIR and passwordless sudo is unavailable for user '\$(whoami)'."
                                    echo "--> Deploying directly from workspace directory: \$(pwd)"
                                    TARGET_DIR="\$(pwd)"
                                fi

                                if [ "${env.DEPLOY_STRATEGY}" = "docker-compose" ]; then
                                    echo "--> Deploying via Docker Compose inside \$TARGET_DIR..."
                                    cd "\$TARGET_DIR"
                                    docker compose down --remove-orphans || true
                                    docker compose up -d
                                    docker compose ps
                                elif [ "${env.DEPLOY_STRATEGY}" = "docker-run" ]; then
                                    echo "--> Deploying standalone Docker container from \$TARGET_DIR..."
                                    docker stop ${env.CONTAINER_NAME} || true
                                    docker rm -f ${env.CONTAINER_NAME} || true

                                    ENV_FILE_ARG=""
                                    if [ -f "\$TARGET_DIR/.env" ]; then
                                        ENV_FILE_ARG="--env-file \$TARGET_DIR/.env"
                                    fi

                                    docker run -d \
                                        --name ${env.CONTAINER_NAME} \
                                        --restart unless-stopped \
                                        -p 127.0.0.1:${env.CONTAINER_PORT}:80 \
                                        -p 127.0.0.1:${env.WS_PORT}:8085 \
                                        -v sticommande_backend_storage:/var/www/commande/backend/storage \
                                        \$ENV_FILE_ARG \
                                        ${env.IMAGE_NAME}:latest

                                    echo "--> Deployment active on port ${env.CONTAINER_PORT} (Web) and ${env.WS_PORT} (WebSockets)."
                                elif [ "${env.DEPLOY_STRATEGY}" = "rsync" ]; then
                                    if [ "\$CAN_USE_DEPLOY_PATH" != "true" ]; then
                                        echo "ERROR: DEPLOY_STRATEGY is 'rsync' but \$TARGET_DIR is not writable."
                                        echo "Please run on the server: sudo mkdir -p ${env.DEPLOY_PATH} && sudo chown -R \$(whoami): ${env.DEPLOY_PATH}"
                                        exit 1
                                    fi
                                    echo "--> Executing host post-deploy hooks in \$TARGET_DIR..."
                                    cd "\$TARGET_DIR"
                                    php artisan migrate --force || true
                                    php artisan config:cache || true
                                    php artisan route:cache || true
                                    if [ -n "\$SUDO" ]; then
                                        \$SUDO supervisorctl restart all || true
                                        \$SUDO systemctl restart php${env.PHP_VERSION}-fpm || true
                                    fi
                                fi
                            """
                        } else {
                            powershell """
                                Write-Host "--> Deploying backend on Windows Server..."
                                if ("${env.DEPLOY_STRATEGY}" -eq "docker-compose") {
                                    Write-Host "--> Deploying via Docker Compose..."
                                    docker compose down --remove-orphans 2>\$null
                                    docker compose up -d
                                    if (\$LASTEXITCODE -ne 0) { exit \$LASTEXITCODE }
                                    docker compose ps
                                } elseif ("${env.DEPLOY_STRATEGY}" -eq "docker-run") {
                                    Write-Host "--> Deploying standalone Docker container..."
                                    docker stop ${env.CONTAINER_NAME} 2>\$null
                                    docker rm -f ${env.CONTAINER_NAME} 2>\$null

                                    \$envArg = ""
                                    if (Test-Path ".env") {
                                        \$envArg = "--env-file .env"
                                    }

                                    docker run -d `
                                        --name ${env.CONTAINER_NAME} `
                                        --restart unless-stopped `
                                        -p 127.0.0.1:${env.CONTAINER_PORT}:80 `
                                        -p 127.0.0.1:${env.WS_PORT}:8085 `
                                        -v sticommande_backend_storage:/var/www/commande/backend/storage `
                                        \$envArg `
                                        ${env.IMAGE_NAME}:latest

                                    Write-Host "--> Deployment active on port ${env.CONTAINER_PORT} (Web) and ${env.WS_PORT} (WebSockets)."
                                } else {
                                    Write-Host "Notice: Executing deployment via Docker Compose..."
                                    docker compose down --remove-orphans 2>\$null
                                    docker compose up -d
                                }
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
            script {
                if (isUnix()) {
                    sh 'docker image prune -f || true'
                } else {
                    powershell 'docker image prune -f 2>$null'
                }
            }
        }
        success {
            echo "SUCCESS: StiCommande Backend build and deployment completed successfully."
        }
        failure {
            echo "FAILURE: StiCommande Backend pipeline failed. Please check stage logs above."
        }
    }
}
