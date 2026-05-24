# Seyyah 🧭

> Türkiye'nin şehirlerini keşfetmek için sade, hızlı ve tamamen statik bir gezi rehberi.

Çerçeve yok · Derleme adımı yok · Sunucu gerekmez · Saf HTML + CSS + JavaScript

---

## Özellikler

- 🔎 **Canlı arama** — şehir veya mekan adına göre anında filtreleme
- 🗺️ **Bölgeye göre süzme** — Marmara, Karadeniz, Güneydoğu… çipleri
- 🏙️ **Şehir kartları** — kapak alanı, açıklama ve mekan sayacı
- 📂 **Kategori sekmeleri** — Hepsi / Yemek / Cami / Müze / Gezilecek
- 🏷️ **Etiket filtresi** — tarihi, ücretsiz, manzara, tatlı…
- 🍽️ **"Meşhuru:"** — yemek mekanlarında ne yeneceği
- 📍 **Yol tarifi** — her mekan için Google Maps linki
- 🗺️ **Gömülü harita** — Leaflet + OpenStreetMap (isteğe bağlı, bkz. aşağıda)
- ❤️ **Favoriler** — tarayıcıda saklanır, URL ile paylaşılabilir
- 🌗 **Karanlık tema** — sistem tercihine göre başlar, değiştirilebilir
- 🌍 **TR / EN** — tam iki dil desteği
- 📱 **Tam responsive** — mobil, tablet, masaüstü

---

## Yerel Geliştirme

`fetch()` API'si `file://` protokolüyle çalışmaz; küçük bir yerel sunucu başlatın:

```bash
# Python 3 (genellikle hazır yüklüdür)
python -m http.server 8000
# → http://localhost:8000

# veya Node.js ile
npx serve
```

---

## Leaflet Harita Kurulumu (İsteğe Bağlı)

Harita özelliği Leaflet kütüphanesini gerektirir. Leaflet olmadan uygulama
tam çalışır; harita alanında yalnızca kısa bir bilgi mesajı görünür.

**Adımlar:**

1. **İndir:** https://leafletjs.com/download.html → ZIP'i indir ve aç.
2. **Kopyala:** Şu dosyaları `vendor/leaflet/` klasörüne koy:

```
vendor/leaflet/
├── leaflet.js
├── leaflet.css
└── images/
    ├── marker-icon.png
    ├── marker-icon-2x.png
    └── marker-shadow.png
```

3. Yerel sunucuyu yeniden başlat. Harita artık görünür olacak.

---

## GitHub Pages'e Yayınlama

1. Projeyi GitHub'a **public** repo olarak yükle (repo adı: `seyyah`).
2. Repo → **Settings → Pages**.
3. **Source:** `Deploy from a branch` → branch: `main`, klasör: `/ (root)` → **Save**.
4. Birkaç dakika içinde site şu adreste yayında:

```
https://<kullanıcı-adı>.github.io/seyyah/
```

> ⚠️ Tüm dosya yolları görecelidir (`data/cities.json`). Başında `/` olan
> mutlak yollar GitHub Pages alt klasöründe kırılır.

---

## Yeni Şehir / Mekan Ekleme

**Yeni şehir:**
1. `data/<slug>.json` dosyası oluştur (istanbul.json şemasını takip et).
2. `data/cities.json` içine yeni kaydı ekle.

**Yeni mekan:**
- İlgili şehrin `places` dizisine yeni nesne ekle. Kod değişikliği gerekmez.

### Mekan Alanları

| Alan | Tip | Zorunlu | Açıklama |
|------|-----|:-------:|----------|
| `name` | string | ✓ | Mekan adı |
| `category` | string | ✓ | `yemek` / `cami` / `muze` / `gezi` |
| `description` | string | ✓ | Kısa tanıtım |
| `tags` | string[] | — | Etiketler (ücretsiz, tarihi, manzara…) |
| `mustEat` | string[] | — | Yalnızca yemek: ne yenir |
| `priceLevel` | 1–3 | — | Fiyat seviyesi (₺ sembolü sayısı) |
| `openHours` | string | — | Açılış saatleri |
| `location` | `{ lat, lng }` | — | Google Maps yol tarifi ve harita için |

---

## Dosya Yapısı

```
seyyah/
├── index.html          ← tek giriş noktası
├── style.css           ← tüm stiller + iki tema
├── app.js              ← SPA mantığı, i18n, router
├── data/
│   ├── cities.json     ← şehir listesi
│   ├── istanbul.json   ← şehir detayları
│   └── …
└── vendor/
    └── leaflet/        ← elle indirilir (bkz. yukarı)
```

---

*Seyyah — yola çıkmadan önce.* 🧭