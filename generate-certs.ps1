# Генерация самоподписанных SSL сертификатов для локальной разработки
# Для продакшена используйте Let's Encrypt или другие CA

$certDir = ".\certs"
$domain = "localhost"

New-Item -ItemType Directory -Force -Path $certDir | Out-Null

$certFile = "$certDir\fullchain.pem"
$keyFile = "$certDir\privkey.pem"

# Создание самоподписанного сертификата
$reqFile = "$certDir\req.txt"
@"
[req]
default_bits = 2048
prompt = no
default_md = sha256
distinguished_name = dn
x509_extensions = v3_req

[dn]
C = RU
ST = MSK
L = Moscow
O = StomApp
OU = Development
CN = $domain

[v3_req]
subjectAltName = @alt_names

[alt_names]
DNS.1 = $domain
DNS.2 = localhost
IP.1 = 127.0.0.1
"@ | Out-File -Encoding ASCII $reqFile

openssl req -x509 -new -nodes -keyout $keyFile -out $certFile -days 365 -config $reqFile

Remove-Item $reqFile

Write-Host "SSL сертификаты созданы в папке $certDir"
Write-Host "Для продакшена используйте Let's Encrypt:"
Write-Host "  certbot certonly --nginx -d your-domain.com"