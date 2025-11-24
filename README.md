# 🏓 ft_transcendence

Bu proje, 42 İstanbul’un ft_transcendence konusu kapsamında geliştirdiğim, tamamen **Docker üzerinde çalışan**, **HTTPS destekli**, **Single Page Application (SPA)** mimarisinde tasarlanmış modern bir Pong platformudur.  

Hem zorunlu kısımları hem de genişletilebilir modülleri kendi tercihlerime göre seçip uygulayarak projenin kapsamını önemli ölçüde genişlettim. Amacım sadece temel Pong oyununu yapmak değildi; bunun yerine kullanıcı yönetimi, gerçek zamanlı etkileşim, uzak oyuncularla oyun, AI rakip ve sunucu taraflı oyun motoru gibi özelliklerle gerçek bir multiplayer oyun platformu kurmak istedim.

---

## 🎯 Projenin Amacı

Bu projede hedefim:

- Modern, SPA yapısında çalışan bir web tabanlı Pong oyunu geliştirmek  
- Oyunu sadece lokal değil, **uzaktaki oyuncuların birbirine karşı gerçek zamanlı oynayabileceği** bir sisteme dönüştürmek  
- Kullanıcı yönetimi, chat, profil, istatistik, turnuva ve AI gibi gelişmiş özellikler eklemek  
- Sunucu tarafında çalışan gerçek bir **game engine** yazmak  
- Tüm sistemi Docker üzerinden **tek komutla** ayağa kaldırmak  
- ft_transcendence’in gerektirdiği güvenlik, SPA, HTTPS ve hata yönetimi kurallarına uymak  

---

## ✅ Zorunlu Kısım (Mandatory Part)

ft_transcendence’in gerektirdiği temel özellikler projede bulunmaktadır:

- **SPA mimarisi**  
- **Pong oyunu** (iki kişilik, aynı klavye)  
- **Turnuva ve alias sistemi**  
- **Güvenlik gereksinimleri**
  - HTTPS
  - XSS/SQL injection korumaları
  - Form validation
  - Hashlenmiş şifreler
  - .env dosyalarının korunması
- **Docker ile tek komutla çalışabilirlik**

Bu temel kısımları kusursuz şekilde tamamladıktan sonra modül seçimi yapıp projeyi genişlettim.

---

## 🧩 Seçtiğim Modüller

ft_transcendence modül sisteminden bilinçli şekilde aşağıdaki modülleri seçtim.  
Toplamda **7 major modül karşılığı** gelmektedir ve projenin büyük bölümünü bu modüller oluşturmaktadır.

### 🟦 1) Backend Framework (Fastify) — **Major**
Backend'i Fastify kullanarak geliştirdim.  
Bu tercihi yaptım çünkü:
- Modern, hızlı ve düşük overhead'lı bir yapı sunuyor
- WebSocket yönetimi için ideal
- Sunucu tarafında çalışan Pong motoru ile doğal şekilde entegre olabiliyor
- API tabanlı bir mimari için temiz ve güvenli

### 🎨 2) Tailwind CSS — **Minor**
Frontend'de framework kullanmadan minimalist ama güçlü bir yapı istediğim için Tailwind CSS'i seçtim.  
SPA yapısını bozmadan, hızlıca şık bir arayüz oluşturmamı sağlıyor.

### 🗃️ 3) SQLite Database — **Minor**
Projede SQLite kullanmayı tercih ettim çünkü:
- ft_transcendence tarafından izin verilen tek DB modülü
- Docker içinde sorunsuz çalışıyor
- Kullanıcı, chat, maç geçmişi ve istatistikler için ideal

### 👤 4) Login & Register Sistemi — **Major**
Turnuvadaki “alias” mantığı yerine gerçek kullanıcı hesapları eklemeyi seçtim.  
Bu modülle:
- Kayıt
- Giriş
- Profil
- Avatar
- Match history
- Arkadaş listesi  
gibi özellikleri ekleyebildim.

### 💬 5) Live Chat — **Major**
Gerçek zamanlı chat, projenin sosyal yönünü güçlendirdi.  
Bu sistem üzerinden:
- Direkt mesaj
- Kullanıcı engelleme
- Oyun daveti gönderme
- Turnuva bildirimleri  
gibi özellikler yer alıyor.

### 🌐 6) Remote Multiplayer — **Major**
Uzak oyuncuların gerçek zamanlı şekilde Pong oynayabilmesi için bu modülü seçtim.  
WebSocket tabanlı bir altyapı ile input senkronizasyonu, lag yönetimi ve bağlantı sorunlarının çözümü sağlanıyor.

### 🧠 7) AI Opponent — **Major**
Projeye bir yapay zekâ rakip ekledim.  
AI şu şekilde çalışıyor:
- İnsan oyuncu hızında hareket eder
- Tuş basma simülasyonu kullanır
- Oyun sahnesini yalnızca **saniyede 1 kez görebilir** (konunun zorunlu kısıtı)
- Topun gelecekteki pozisyonunu tahmin etmeye çalışır

Bu modül oyunu hem daha zengin kılıyor hem de teknik anlamda en zorlayıcı kısımlardan biri.

### 🎮 8) Server-Side Pong + API — **Major**
En kritik modüllerden biri.  
Pong tamamen sunucu tarafında çalışır:

- Oyun döngüsü (tick-rate)
- Çarpışma hesaplamaları
- Skor yönetimi
- AI oyuncu kontrolü
- Client’lara sadece state gönderme  
gibi tüm logic backend’de gerçekleşir.

Client tarafı sadece:
- Input gönderir  
- Görsel render yapar  

Bu mimari uzak oyuncular, AI ve turnuva sistemi ile mükemmel uyum sağlar.

---

## 🐳 Docker

Proje tamamen Docker üzerinden çalışır ve tüm servisler tek komutla ayağa kalkar:

```bash
docker-compose up --build
```


Nginx reverse proxy üzerinden HTTPS ve WebSocket trafiği yönlendirilir.  
App servisi üzerinde Fastify backend, API, WebSocket, server-side Pong motoru ve SPA frontend bulunur.

---

## 🔥 Sonuç

Bu projede sadece zorunlu Pong uygulamasını yapmak yerine, kendi seçimlerimle projeyi çok daha geniş kapsamlı bir oyun platformuna dönüştürdüm.  
Gerçek zamanlı oyun, chat, kullanıcı yönetimi, AI, turnuva ve server-side engine gibi modüllerle hem teknik olarak zorlayıcı hem de eğlenceli bir çalışma oldu.

Geliştirme sürecinde performans, güvenlik, gerçek zamanlı iletişim ve tarayıcı uyumluluğu konularına özellikle dikkat ettim.  

Proje ft_transcendence'in hem ruhuna hem de teknik gereksinimlerine tamamen uygundur.

---

