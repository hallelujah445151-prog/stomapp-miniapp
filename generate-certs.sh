#!/bin/bash

# Генерация самоподписанных SSL сертификатов для локальной разработки
# Для продакшена используйте Let's Encrypt или другие CA

CERT_DIR="./certs"
DOMAIN="localhost"

mkdir -p "$CERT_DIR"

openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout "$CERT_DIR/privkey.pem" \
  -out "$CERT_DIR/fullchain.pem" \
  -subj "/C=RU/ST=MSK/L=Moscow/O=StomApp/OU=Development/CN=$DOMAIN"

echo "SSL сертификаты созданы в папке $CERT_DIR"
echo "Для продакшена используйте Let's Encrypt:"
echo "  certbot certonly --nginx -d your-domain.com"