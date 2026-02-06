# ft_transcendence

Basit bir web uygulaması Docker Compose ile çalışır.

## Servisler

- **Frontend**: React (Port 3000)
- **Backend**: Django (Port 8000)
- **Database**: PostgreSQL
- **Redis**: Cache/Queue
- **Caddy**: Reverse Proxy + SSL (Port 80/443)
- **Google OAuth**: ✅ Destekleniyor

## Kurulum ve Çalıştırma

```bash
# Projeyi başlat
make

# veya
make build

# Logları görüntüle
make logs

# Durdur
make down

# Temizle ve yeniden başlat
make re
```

## Erişim

- **HTTPS**: https://localhost
- **HTTP**: http://localhost
- **Frontend**: http://localhost:3000
- **Backend**: http://localhost:8000

Caddy otomatik olarak SSL sertifikası oluşturur (self-signed).
