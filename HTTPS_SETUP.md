# Настройка HTTPS для StomApp Mini App

## Почему HTTPS обязателен для Telegram Mini Apps

Telegram Mini Apps требуют HTTPS по следующим причинам:
- **Безопасность:** Защита данных пользователей
- **Требование Telegram:** Mini Apps не работают по HTTP
- **Web API:** Telegram Web Apps API требует защищенного соединения

## Варианты настройки HTTPS

### 1. Локальная разработка (самоподписанные сертификаты)

Для локальной разработки используйте самоподписанные сертификаты:

```bash
# Linux/Mac
chmod +x generate-certs.sh
./generate-certs.sh

# Windows PowerShell
.\generate-certs.ps1
```

Сертификаты будут созданы в папке `certs/`:
- `fullchain.pem` - сертификат
- `privkey.pem` - приватный ключ

**Важно:** Самоподписанные сертификаты нужно добавить в доверенные в браузере!

### 2. Продакшен с использованием Let's Encrypt (бесплатно)

#### На VPS сервере:

```bash
# Установка Certbot
sudo apt update
sudo apt install certbot python3-certbot-nginx

# Генерация сертификата
sudo certbot certonly --nginx -d your-domain.com

# Сертификаты будут сохранены в:
# /etc/letsencrypt/live/your-domain.com/fullchain.pem
# /etc/letsencrypt/live/your-domain.com/privkey.pem
```

#### Автоматическое обновление:

```bash
# Добавить в crontab для автоматического обновления
sudo crontab -e
```

Добавить строку:
```
0 0 * * * certbot renew --quiet && docker-compose restart nginx
```

### 3. Платные SSL сертификаты

Если нужен сертификат от доверенного CA:
- Comodo SSL
- DigiCert
- GlobalSign

## Конфигурация Nginx

Конфигурация в `nginx/nginx.conf` уже настроена для HTTPS:

```nginx
server {
    listen 443 ssl http2;
    server_name your-domain.com;

    ssl_certificate /etc/nginx/certs/fullchain.pem;
    ssl_certificate_key /etc/nginx/certs/privkey.pem;
    
    # ... остальная конфигурация
}
```

## Настройка домена

### Для локальной разработки:

Добавить в `/etc/hosts` (Linux/Mac) или `C:\Windows\System32\drivers\etc\hosts` (Windows):
```
127.0.0.1 localhost.localdev
```

### Для продакшена:

1. Купите домен или используйте существующий
2. Настройте DNS записи:
   - A запись: `your-domain.com` → IP вашего VPS
3. Обновите `nginx.conf` с правильным доменом

## Проверка HTTPS

После настройки проверьте:

```bash
# Проверка конфигурации Nginx
sudo nginx -t

# Проверка SSL сертификата
openssl s_client -connect your-domain.com:443 -servername your-domain.com

# Онлайн проверка
# https://www.ssllabs.com/ssltest/
```

## Запуск с HTTPS

### Локально:

```bash
# Генерация сертификатов
.\generate-certs.ps1

# Запуск с Docker Compose
docker-compose up -d
```

Доступ: https://localhost (примите самоподписанный сертификат в браузере)

### На VPS:

```bash
# Настройка Let's Encrypt
sudo certbot certonly --nginx -d your-domain.com

# Копирование сертификатов
sudo cp /etc/letsencrypt/live/your-domain.com/fullchain.pem ./certs/
sudo cp /etc/letsencrypt/live/your-domain.com/privkey.pem ./certs/

# Запуск
docker-compose up -d
```

## Интеграция с Telegram

После настройки HTTPS:

1. Обновите URL в Telegram Bot:
```python
web_app_url = "https://your-domain.com"
```

2. Убедитесь, что домен доступен извне:
```bash
curl https://your-domain.com
```

3. Протестируйте Mini App в Telegram:
   - Откройте бот
   - Нажмите кнопку "Открыть приложение"
   - Mini App загрузится по HTTPS

## Решение проблем

### Сертификат не доверяется (локально):
- Добавьте сертификат в "Доверенные корневые центры сертификации"
- Или используйте `mkcert` для создания локально доверенных сертификатов

### ERR_SSL_PROTOCOL_ERROR:
- Проверьте, что Nginx слушает порт 443
- Проверьте правила firewall

### Сертификат истек:
- Обновите сертификат: `certbot renew`
- Перезапустите Nginx: `docker-compose restart nginx`

## Безопасность

Для продакшена убедитесь:

- ✅ Используете Let's Encrypt или другой доверенный CA
- ✅ Включен HSTS (Strict-Transport-Security)
- ✅ Используются современные протоколы (TLS 1.2, TLS 1.3)
- ✅ Сертификаты автоматически обновляются
- ✅ Firewall настроен правильно (открыты порты 80, 443)