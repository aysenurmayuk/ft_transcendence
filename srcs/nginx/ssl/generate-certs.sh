#!/bin/bash

# SSL sertifikalarını oluşturmak için gerekli dizinleri oluştur
mkdir -p /etc/nginx/ssl

# Özel anahtar oluştur
openssl genrsa -out /etc/nginx/ssl/nginx.key 2048

# Sertifika oluştur
openssl req -new -x509 -key /etc/nginx/ssl/nginx.key -out /etc/nginx/ssl/nginx.crt -days 365 -subj "/C=TR/ST=Istanbul/L=Istanbul/O=ft_transcendence/OU=IT Department/CN=localhost"