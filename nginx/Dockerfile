# =========================================================
# StiCommande Gateway image (nginx + TLS certificate bootstrap)
# Certificates: /etc/nginx/certs/{fullchain.pem,privkey.pem} (mounted from ./certs)
# If none are provided, a self-signed certificate is generated at startup.
# =========================================================
FROM docker.io/library/nginx:1.27-alpine

RUN apk add --no-cache openssl

COPY default.conf /etc/nginx/conf.d/default.conf
COPY entrypoint.sh /usr/local/bin/gateway-entrypoint.sh
RUN sed -i 's/\r$//' /usr/local/bin/gateway-entrypoint.sh \
    && chmod +x /usr/local/bin/gateway-entrypoint.sh

EXPOSE 80 443

HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
    CMD wget -qO- http://127.0.0.1/up >/dev/null || exit 1

ENTRYPOINT ["/usr/local/bin/gateway-entrypoint.sh"]
CMD ["nginx", "-g", "daemon off;"]
