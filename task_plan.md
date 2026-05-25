# SEO Geliştirme Planı — Seyyah

## Hedef
Seyyah SPA'ya kapsamlı SEO altyapısı eklemek.

## Fazlar

### Faz 1: robots.txt + sitemap.xml [PLANNED]
- `robots.txt` oluştur
- `sitemap.xml` şehirlerden dinamik üret (build script)
- `generate-sitemap.js` node scripti

### Faz 2: Dinamik meta tags (title + description) [PLANNED]
- `updateMetaTags(type, data)` fonksiyonu app.js'e ekle
- Router'da her route değişiminde çağır
- TR/EN dil desteğiyle

### Faz 3: Canonical tag [PLANNED]
- `<link rel="canonical">` index.html'e ekle
- Route değişiminde dinamik güncelle

### Faz 4: Open Graph + Twitter Cards [PLANNED]
- index.html'e statik OG meta tagları ekle
- Route değişiminde dinamik güncelle (og:title, og:description, og:url, og:image)
- Twitter card tagları

### Faz 5: JSON-LD Schema markup [PLANNED]
- Ana sayfa: WebSite + Organization schema
- Şehir sayfası: TouristDestination + ItemList schema
- Yer modalı: TouristAttraction / FoodEstablishment / LodgingBusiness schema

## Dosya Yapısı
- `/robots.txt` — yeni
- `/sitemap.xml` — yeni (veya generate-sitemap.js ile üret)
- `/generate-sitemap.js` — build scripti
- `index.html` — meta tag eklemeleri
- `app.js` — updateMetaTags() + router entegrasyonu

## Kararlar
- Hash routing korunacak (SPA mimarisini bozmayacağız)
- Domain: https://seyyah.app (manifest'te de aynı olacak)
- Sitemap: şehir bazında (place bazında çok fazla olabilir)
- JSON-LD: script tag olarak dinamik inject edilecek

## Hatalar
_henüz yok_
