#!/bin/sh
set -e

PROVIDED_DIR="${TLS_CERT_DIR:-/etc/nginx/certs}"
RUNTIME_DIR="${TLS_RUNTIME_DIR:-/var/cache/nginx/certs}"
TLS_CONF="${TLS_CONF_FILE:-/etc/nginx/tls_certs.conf}"
TLS_CN_VALUE="${TLS_CN:-sticommande.local}"

mkdir -p "$RUNTIME_DIR" /var/cache/nginx/client_temp /var/cache/nginx/proxy_temp
chown -R nginx:nginx /var/cache/nginx 2>/dev/null || true

SAN_LIST=""
CN_VALUE=""
OLD_IFS=$IFS
IFS=','
for raw in $TLS_CN_VALUE; do
    entry=$(printf '%s' "$raw" | sed 's/^[[:space:]]*//; s/[[:space:]]*$//')
    [ -z "$entry" ] && continue
    if printf '%s' "$entry" | grep -qE '^[0-9]{1,3}(\.[0-9]{1,3}){3}$'; then
        KIND="IP"
    else
        KIND="DNS"
    fi
    if [ -z "$CN_VALUE" ]; then
        CN_VALUE="$entry"
    fi
    if [ -z "$SAN_LIST" ]; then
        SAN_LIST="$KIND:$entry"
    else
        SAN_LIST="$SAN_LIST,$KIND:$entry"
    fi
done
IFS=$OLD_IFS

if [ -z "$CN_VALUE" ]; then
    CN_VALUE="sticommande.local"
    SAN_LIST="DNS:sticommande.local"
fi

if [ -s "$PROVIDED_DIR/fullchain.pem" ] && [ -s "$PROVIDED_DIR/privkey.pem" ]; then
    CERT_DIR="$PROVIDED_DIR"
    echo "[gateway] Using TLS certificates mounted at $PROVIDED_DIR"
else
    CERT_DIR="$RUNTIME_DIR"
    if [ ! -s "$CERT_DIR/fullchain.pem" ] || [ ! -s "$CERT_DIR/privkey.pem" ]; then
        echo "[gateway] No TLS certificates provided - generating self-signed certificate (CN=$CN_VALUE, SAN=$SAN_LIST)"
        openssl req -x509 -nodes -newkey rsa:2048 -days 825 \
            -keyout "$CERT_DIR/privkey.pem" \
            -out "$CERT_DIR/fullchain.pem" \
            -subj "/C=XX/O=StiCommande/CN=$CN_VALUE" \
            -addext "subjectAltName=$SAN_LIST,DNS:localhost,IP:127.0.0.1" \
            >/dev/null 2>&1
        chmod 600 "$CERT_DIR/privkey.pem"
    fi
    echo "[gateway] Using TLS certificate in $CERT_DIR (replace it by filling ./certs on the host)"
fi

if [ ! -s "$CERT_DIR/fullchain.pem" ] || [ ! -s "$CERT_DIR/privkey.pem" ]; then
    echo "[gateway] ERROR: TLS certificate missing at $CERT_DIR" >&2
    exit 1
fi

cat > "$TLS_CONF" <<EOF
ssl_certificate     $CERT_DIR/fullchain.pem;
ssl_certificate_key $CERT_DIR/privkey.pem;
EOF

exec "$@"
