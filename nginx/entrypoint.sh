#!/bin/sh
set -e

PROVIDED_DIR=/etc/nginx/certs
RUNTIME_DIR=/var/cache/nginx/certs
TLS_CN_VALUE="${TLS_CN:-sticommande.local}"

mkdir -p "$RUNTIME_DIR" /var/cache/nginx

if [ -s "$PROVIDED_DIR/fullchain.pem" ] && [ -s "$PROVIDED_DIR/privkey.pem" ]; then
    CERT_DIR="$PROVIDED_DIR"
    echo "[gateway] Using TLS certificates mounted at $PROVIDED_DIR"
else
    CERT_DIR="$RUNTIME_DIR"
    if [ ! -s "$CERT_DIR/fullchain.pem" ] || [ ! -s "$CERT_DIR/privkey.pem" ]; then
        echo "[gateway] No TLS certificates provided - generating self-signed certificate (CN=$TLS_CN_VALUE)"
        openssl req -x509 -nodes -newkey rsa:2048 -days 825 \
            -keyout "$CERT_DIR/privkey.pem" \
            -out "$CERT_DIR/fullchain.pem" \
            -subj "/C=XX/O=StiCommande/CN=$TLS_CN_VALUE" \
            -addext "subjectAltName=DNS:$TLS_CN_VALUE,DNS:localhost,IP:127.0.0.1" \
            >/dev/null 2>&1
        chmod 600 "$CERT_DIR/privkey.pem"
    fi
    echo "[gateway] Using TLS certificate in $CERT_DIR (replace it by filling ./certs on the host)"
fi

if [ ! -s "$CERT_DIR/fullchain.pem" ] || [ ! -s "$CERT_DIR/privkey.pem" ]; then
    echo "[gateway] ERROR: TLS certificate missing at $CERT_DIR" >&2
    exit 1
fi

cat > /etc/nginx/tls_certs.conf <<EOF
ssl_certificate     $CERT_DIR/fullchain.pem;
ssl_certificate_key $CERT_DIR/privkey.pem;
EOF

exec "$@"
