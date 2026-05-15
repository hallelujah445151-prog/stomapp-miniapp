"""
Генерация самоподписанных сертификатов для локального HTTPS
Для разработки и тестирования StomApp Mini App
"""

import os
import ssl
import socket
from datetime import datetime, timedelta

CERT_DIR = r"C:\Users\crush\AppData\Roaming\projects\stomapp\mini-app\certs"
DOMAIN = "localhost"

def create_self_signed_cert():
    """Создает самоподписанный сертификат для localhost"""
    
    print("Создание самоподписанных сертификатов для localhost...")
    
    # Создаем папку для сертификатов
    os.makedirs(CERT_DIR, exist_ok=True)
    
    cert_path = os.path.join(CERT_DIR, "localhost.crt")
    key_path = os.path.join(CERT_DIR, "localhost.key")
    
    # Создаем самоподписанный сертификат
    from cryptography import x509
    from cryptography.x509.oid import NameOID
    from cryptography.hazmat.primitives import hashes
    from cryptography.hazmat.primitives.asymmetric import rsa
    from cryptography.hazmat.primitives import serialization
    
    # Генерируем приватный ключ
    private_key = rsa.generate_private_key(
        public_exponent=65537,
        key_size=2048,
    )
    
    # Создаем сертификат
    subject = issuer = x509.Name([
        x509.NameAttribute(NameOID.COUNTRY_NAME, "RU"),
        x509.NameAttribute(NameOID.STATE_OR_PROVINCE_NAME, "Moscow"),
        x509.NameAttribute(NameOID.LOCALITY_NAME, "Moscow"),
        x509.NameAttribute(NameOID.ORGANIZATION_NAME, "StomApp"),
        x509.NameAttribute(NameOID.COMMON_NAME, DOMAIN),
    ])
    
    cert = x509.CertificateBuilder().subject_name(
        subject
    ).issuer_name(
        issuer
    ).public_key(
        private_key.public_key()
    ).serial_number(
        x509.random_serial_number()
    ).not_valid_before(
        datetime.utcnow()
    ).not_valid_after(
        datetime.utcnow() + timedelta(days=365)
    ).add_extension(
        x509.SubjectAlternativeName([
            x509.DNSName(DOMAIN),
            x509.DNSName("*.localhost"),
        ]),
        critical=False,
    ).sign(private_key, hashes.SHA256())
    
    # Сохраняем сертификат
    with open(cert_path, "wb") as f:
        f.write(cert.public_bytes(serialization.Encoding.PEM))
    
    # Сохраняем приватный ключ
    with open(key_path, "wb") as f:
        f.write(private_key.private_bytes(
            encoding=serialization.Encoding.PEM,
            format=serialization.PrivateFormat.TraditionalOpenSSL,
            encryption_algorithm=serialization.NoEncryption()
        ))
    
    print(f"✅ Сертификат создан: {cert_path}")
    print(f"✅ Ключ создан: {key_path}")
    
    return True

if __name__ == "__main__":
    try:
        create_self_signed_cert()
        print("\nСертификаты готовы для использования!")
    except ImportError:
        print("Установка cryptography...")
        os.system("pip install cryptography")
        create_self_signed_cert()
    except Exception as e:
        print(f"Ошибка: {e}")