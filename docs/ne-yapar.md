# Seyyah — Proje Analizi

## Genel Tanım

Seyyah, Türkiye'deki şehirleri keşfetmek isteyen gezginler için tasarlanmış, tamamen statik, sunucusuz (zero-backend) bir seyahat rehberi PWA'sıdır. Framework kullanmaz; vanilla JavaScript, CSS ve JSON dosyalarıyla çalışır. Build adımı yoktur — doğrudan tarayıcıda çalışır.

---

## Mimari

```
seyyah/
├── index.html          → Tek HTML dosyası (SPA giriş noktası)
├── app.js              → Tüm uygulama mantığı (~4600 satır)
├── style.css           → Tasarım sistemi + temalar (~75KB)
├── sw.js               → Service Worker (PWA / offline)
├── manifest.json       → PWA metadata
├── data/
│   ├── cities.json     → Tüm şehirlerin özet listesi
│   ├── bursa.json      → Şehre özel detaylı veri
│   ├── gaziantep.json
│   └── konya.json
└── docs/               → Proje dokümantasyonu
```

**Yığın (Stack):**
- Dil: Vanilla JavaScript (ES6+)
- Harita: Leaflet.js + OpenStreetMap
- Depolama: Browser localStorage
- PWA: Service Worker (cache-first strateji)
- SEO: sitemap.xml, robots.txt, Open Graph, hreflang

---

## Veri Modelleri

### Şehir (`cities.json`)

```json
{
  "city": "Bursa",
  "slug": "bursa",
  "region": "Marmara",
  "description": "Osmanlı'nın ilk başkenti, yeşil doğası ve lezzetleriyle",
  "seasons": {
    "jan": "ok", "feb": "ok", "mar": "good",
    "apr": "good", "may": "good", "jun": "good",
    "jul": "ok", "aug": "ok", "sep": "good",
    "oct": "good", "nov": "ok", "dec": "ok",
    "note": "İlkbahar ve sonbahar en ideal dönem"
  },
  "places": [ /* Place[] */ ]
}
```

### Yer (`Place`)

```json
{
  "name": "Ulu Cami",
  "category": "cami",
  "description": "Bursa'nın simgesi olan 20 kubbeli Osmanlı camii",
  "tags": ["historic", "free", "iconic"],
  "priceLevel": 1,
  "openHours": "09:00 – 22:00",
  "location": { "lat": 40.1828, "lng": 29.0605 },
  "accessibility": {
    "wheelchair": true,
    "elevator": null,
    "accessibleToilet": false,
    "audioGuide": null
  },
  "mustEat": ["İskender Kebap", "Cantık"]
}
```

**Kategoriler:** `yemek` (yemek), `cami`, `muze`, `gezi`

---

## Ekranlar / View'lar

### 1. Ana Ekran (`renderCityList`)

- Tam genişlik arama kutusu (cross-city, geçmişli)
- Bölge filtre chip'leri (Marmara, Ege, Karadeniz vb.)
- Şehir kartı grid'i (responsive, 1–3 sütun)
- Her kartta: bölge degrade, şehir adı, açıklama, yer sayısı rozeti, ziyaret ilerleme çubuğu
- Konuma en yakın şehir öne çıkarılır (`getNearestCity`)

### 2. Şehir Detay (`renderCityDetail`)

- Geri butonu → ana ekran
- Kategori sekmeleri: Tümü / Yemek / Cami / Müze / Gezi
- Etiket (tag) çoklu filtresi
- Sıralama: Varsayılan / Alfabetik / Fiyat / Yakın
- "Şu an açık" filtresi
- Yer kartları: ad, kategori rozeti, açıklama, etiketler, yemek chip'leri, fiyat seviyesi, yol tarifi linki

### 3. Yer Modal'ı (`openPlaceModal`)

- Kategori ikonlu başlık bannerı
- Tam açıklama + etiketler
- Bilgi grid'i: çalışma saatleri, gerçek zamanlı açık/kapalı rozeti, fiyat seviyesi
- 12 aylık sezon takvimi
- Erişilebilirlik şeridi (tekerlekli sandalye, asansör, tuvalet, sesli rehber)
- Musteat bölümü (yemek kategorisi için)
- Mini Leaflet haritası
- Google Maps yol tarifi butonu
- Ziyaret takibi (tarih + not)
- Favoriye ekleme
- Plana ekleme
- Benzer yer önerileri

### 4. Gezi Planı Drawer (`renderPlan`)

- Slayt açılan yan panel
- Drag-and-drop sıralama (native HTML `draggable`)
- Her öğe: yer adı, şehir, tahmini süre, kaldır butonu, yukarı/aşağı taşıma
- Toplam istatistikler: süre + yer sayısı
- Google Maps rotası butonu (origin → waypoints → destination)
- Planı paylaş butonu (base64 URL hash)
- Tümünü temizle

---

## Plan Sistemi

**Veri Yapısı:**

```javascript
// localStorage: "seyyah-plan"
[
  {
    key: "bursa__ulu-cami",
    citySlug: "bursa",
    cityName: "Bursa",
    placeName: "Ulu Cami",
    category: "cami",
    location: { lat: 40.1828, lng: 29.0605 }
  }
]
```

**Temel Fonksiyonlar:**

| Fonksiyon | Görev |
|-----------|-------|
| `addToPlan(place)` | Plana yer ekler |
| `removeFromPlan(key)` | Anahtarla yer kaldırır |
| `clearPlan()` | Planı temizler |
| `savePlan()` | localStorage'a yazar |
| `estimateDuration(item)` | Kategori bazlı süre tahmini |
| `buildRouteUrl(places)` | Google Maps multi-stop URL'i oluşturur |
| `sharePlan()` | Planı base64 URL hash'e encode eder |
| `bindPlanDragDrop()` | Sürükle-bırak sıralama bağlar |

**Google Maps URL formatı:**
```
https://www.google.com/maps/dir/?api=1
  &origin=LAT,LNG
  &destination=LAT,LNG
  &waypoints=LAT,LNG|LAT,LNG|...
```

---

## Diğer Özellikler

### Arama

- `runSearch(query)` → tüm şehirlerdeki yer adları + şehir adları üzerinde cross-search
- Sonuçlar anlık, debounce'suz
- Son 5 arama geçmişi (localStorage `seyyah-search-hist`)

### Konum Özellikleri

- Haversine formülü (`haversineKm`) ile mesafe hesaplama
- `navigator.geolocation` ile kullanıcı konumu
- En yakın yer: `buildNearestPlaceInfo()`
- En yakın şehir: `getNearestCity()`
- Meskeye göre sıralama: `sortPlaces()` içinde "nearby" modu

### Ziyaret Takibi

```javascript
// localStorage: "seyyah-visits"
{
  "bursa__ulu-cami": { "date": "2025-06-01", "note": "Muhteşemdi" }
}
```

### Favoriler

- `seyyah-favs`: şehir slug'ları (JSON array)
- `seyyah-place-favs`: yer anahtarları (JSON array)
- Paylaşılabilir: `?favs=base64` URL hash'i

### Dil Desteği (i18n)

- Türkçe (tr) ve İngilizce (en)
- `STRINGS` nesnesi (satır 85–335), dot-notation ile erişim
- `t("cats.yemek")` → "Yemek" (TR) veya "Food" (EN)
- Bazı çeviriler fonksiyon: `t("visit_progress", ziyaret, toplam)`

### Tema

- Açık / Koyu mod
- CSS Custom Properties (`--color-bg`, `--color-text`, vb.)
- `[data-theme="dark"]` selector
- localStorage'da kalıcı

### Gerçek Zamanlı Açık/Kapalı

- `isOpenNow(openHours)` → `"09:00 – 17:00 (Monday closed)"` formatını parse eder
- Güncel saat + gün karşılaştırması
- Modal'da ve filtre chip'inde kullanılır

---

## Tasarım Sistemi

**Renkler:**

| Öğe | Değer |
|-----|-------|
| Marka (terracotta) | `#C8432A` |
| Yemek | Mercan (coral) |
| Cami | Deniz mavisi-yeşili (teal) |
| Müze | Mor (purple) |
| Gezi | Amber |

**Tipografi:**
- Gövde: DM Sans (400, 500)
- Logo/başlık: Cinzel (600, 700)
- Ölçek: 12–22px

**Layout:**
- Maks genişlik: 1140px
- Kart radius: 16px, pill radius: 999px
- Geçiş süresi: 0.18s ease
- Grid: `repeat(auto-fit, minmax(190px, 1fr))`

**Breakpoint'ler:**
- Mobil ≤600px: tek sütun
- Tablet 600–1000px: iki sütun
- Masaüstü >1000px: üç sütun

---

## localStorage Anahtarları

| Anahtar | İçerik |
|---------|--------|
| `seyyah-lang` | Dil tercihi (`"tr"` / `"en"`) |
| `seyyah-theme` | Tema (`"light"` / `"dark"`) |
| `seyyah-favs` | Favori şehir slug'ları (`string[]`) |
| `seyyah-place-favs` | Favori yer anahtarları (`string[]`) |
| `seyyah-plan` | Gezi planı (`PlanItem[]`) |
| `seyyah-visits` | Ziyaret geçmişi (`{ key: {date, note} }`) |
| `seyyah-search-hist` | Arama geçmişi (`string[]`, maks 5) |
| `seyyah-stats-open` | İstatistik paneli açık/kapalı durumu |

---

## Deep Link / URL Yapısı

| URL | Görünüm |
|-----|---------|
| `/` | Ana ekran |
| `/#bursa` | Bursa şehir detayı |
| `/#bursa/ulu-cami` | Bursa → Ulu Cami modal'ı |
| `/?plan=BASE64` | Paylaşılan gezi planı |
| `/?favs=BASE64` | Paylaşılan favoriler |

---

## Mevcut Şehirler

| Şehir | Bölge | Durum |
|-------|-------|-------|
| Bursa | Marmara | Aktif |
| Gaziantep | Güneydoğu Anadolu | Aktif |
| Konya | İç Anadolu | Aktif |

Şehir merkezi koordinatları ayrıca `app.js` içinde hardcoded (satır 46–53):
`istanbul`, `ankara`, `izmir`, `konya`, `trabzon`, `gaziantep`

---

## Planlanan / Eksik Özellikler (Geliştirmeye Açık)

- **Hazır güzergahlar**: 1 günlük, 3 günlük, 5 günlük küratör rotaları (şu an yok)
- **Daha fazla şehir**: İstanbul, Ankara, İzmir, Trabzon vb. (veri dosyası yok)
- **Kullanıcı yorumları**: Ziyaret notu var ama paylaşılamıyor
- **Offline harita**: Leaflet tile'ları cache'lenmiyor
- **Filtrelenmiş paylaşım**: Sadece belirli kategorideki yerleri paylaşma
