# Seyyah 🧭

> Türkiye'nin şehirlerini keşfetmek için sade, hızlı ve tamamen statik bir
> gezi rehberi. Bir şehir seç; **nerede ne yiyebileceğini**, hangi **camiyi**,
> **müzeyi** ve **gezilecek yeri** görebileceğini tek sayfada öğren.

---

## İçindekiler
- [Proje Nedir?](#proje-nedir)
- [Amaç ve Hedef Kitle](#amaç-ve-hedef-kitle)
- [Özellikler](#özellikler)
- [Teknoloji](#teknoloji)
- [Dosya Yapısı](#dosya-yapısı)
- [Veri Modeli (JSON)](#veri-modeli-json)
- [Çalışma Mantığı](#çalışma-mantığı)
- [Yerel Geliştirme](#yerel-geliştirme)
- [GitHub Pages'e Yayınlama](#github-pagese-yayınlama)
- [Yeni Şehir / Mekan Ekleme](#yeni-şehir--mekan-ekleme)
- [Yol Haritası](#yol-haritası)
- [Lisans](#lisans)

---

## Proje Nedir?

**Seyyah**, herhangi bir kuruluma ihtiyaç duymayan, saf **HTML + CSS + JavaScript**
ile yazılmış statik bir web uygulamasıdır. Tüm içerik (şehirler ve mekanlar)
`data/` klasöründeki **JSON** dosyalarından okunur; arayüz bu veriyi dinamik
olarak ekrana basar. Tek `index.html` üzerinden çalıştığı için **GitHub Pages**
ile ücretsiz ve kolayca yayınlanabilir.

Çerçeve (framework) yok, derleme (build) adımı yok, sunucu gerekmez.

---

## Amaç ve Hedef Kitle

- Türkiye'de bir şehre gidecek olan **gezginler** için pratik bir başvuru.
- "Buraya gittim, ne yenir, nereye gidilir?" sorusuna **hızlı yanıt**.
- İçerik üreticileri / katkıda bulunanlar için **düzenlemesi kolay** bir veri
  yapısı (sadece JSON düzenleyerek şehir/mekan eklenir).

---

## Özellikler

### Mevcut
- 🔎 **Canlı arama** — şehir veya mekan adına göre anında filtreleme.
- 🗺️ **Bölgeye göre süzme** — Marmara, Karadeniz, Güneydoğu… çipleri.
- 🏙️ **Şehir kartları** — kapak alanı, kısa açıklama ve mekan sayacı.
- 📂 **Kategori sekmeleri** — Hepsi / Yemek / Cami / Müze / Gezilecek.
- 🍽️ **"Ne yenir?"** — yemek mekanlarında "Meşhuru:" çip listesi.
- 📍 **Yol tarifi** — her mekan için koordinattan Google Maps linki.
- 📱 **Tam responsive** — mobil, tablet ve masaüstü uyumlu.
- 🌗 **Karanlık tema uyumlu** tasarım sistemi.

### Planlanan (Yol Haritası'na bakın)
- Şehir kapak fotoğrafları (telifsiz kaynaklardan).
- Detay sayfasında gömülü harita.
- Favorilere ekleme (tarayıcı belleği yerine paylaşılabilir URL ile).
- Çoklu dil (TR/EN).

---

## Teknoloji

| Katman | Tercih |
|--------|--------|
| İşaretleme | Saf HTML5 |
| Stil | Saf CSS (CSS değişkenleri ile temalama) |
| Mantık | Vanilla JavaScript (ES6+), `fetch` ile JSON okuma |
| Veri | Statik `.json` dosyaları |
| Barındırma | GitHub Pages (statik) |

Bağımlılık yok. (İsteğe bağlı: ikon seti için Tabler/Lucide, font için Google Fonts.)

---

## Dosya Yapısı

```
seyyah/
├── index.html          # Tek giriş noktası (GitHub Pages bunu yayınlar)
├── style.css           # Tüm stiller + tema değişkenleri
├── app.js              # Veri çekme, render, arama, filtre, yönlendirme
└── data/
    ├── cities.json     # Şehir listesi (özet: ad, bölge, açıklama, kapak)
    ├── istanbul.json   # Şehir detayı (mekanlar) — şehir başına bir dosya
    ├── gaziantep.json
    └── trabzon.json
```

> Not: Veri küçükse her şey tek `cities.json` içinde de tutulabilir. Şehir
> başına ayrı dosya, dosyalar büyüdükçe yönetimi ve gerektiğinde gecikmeli
> (lazy) yüklemeyi kolaylaştırır.

---

## Veri Modeli (JSON)

### `cities.json` — şehir özetleri

```json
[
  {
    "city": "İstanbul",
    "slug": "istanbul",
    "region": "Marmara",
    "description": "İki kıtayı birleştiren tarih başkenti.",
    "cover": "data/img/istanbul.jpg",
    "data": "data/istanbul.json"
  }
]
```

### `istanbul.json` — şehir detayı ve mekanlar

```json
{
  "city": "İstanbul",
  "slug": "istanbul",
  "region": "Marmara",
  "description": "İki kıtayı birleştiren tarih başkenti.",
  "places": [
    {
      "name": "Sultanahmet Camii",
      "category": "cami",
      "description": "Mavi çinileriyle ünlü 17. yy Osmanlı camisi.",
      "tags": ["tarihi", "ücretsiz"],
      "openHours": "08:30 - 18:00",
      "location": { "lat": 41.0054, "lng": 28.9768 }
    },
    {
      "name": "Tarihi Sultanahmet Köftecisi",
      "category": "yemek",
      "description": "1920'den beri açık efsane köfteci.",
      "mustEat": ["Izgara köfte", "Piyaz", "İrmik helvası"],
      "priceLevel": 2,
      "location": { "lat": 41.0086, "lng": 28.9744 }
    }
  ]
}
```

### Alan açıklamaları

| Alan | Tip | Zorunlu | Açıklama |
|------|-----|:------:|----------|
| `name` | string | ✓ | Mekan adı |
| `category` | string | ✓ | `yemek` \| `cami` \| `muze` \| `gezi` (genişletilebilir) |
| `description` | string | ✓ | Bir-iki cümlelik tanıtım |
| `mustEat` | string[] | – | Yalnızca yemek mekanları: "ne yenir" listesi |
| `priceLevel` | number | – | 1–3 arası fiyat seviyesi |
| `tags` | string[] | – | Filtre/etiket (örn. "tarihi", "ücretsiz") |
| `openHours` | string | – | Açılış saatleri |
| `location` | object | – | `{ lat, lng }` — yol tarifi linki için |

> Kategori değerleri esnek tutulmuştur; ileride `park`, `çarşı`, `kahvaltı`
> gibi yeni türler eklemek için JSON'a yeni `category` değeri vermek yeterlidir
> (arayüzde sekme ve renk eşlemesi de eklenmelidir).

---

## Çalışma Mantığı

1. Sayfa açılınca `app.js`, `fetch('data/cities.json')` ile şehir listesini
   çeker ve kartları render eder.
2. Arama kutusu ve bölge çipleri istemci tarafında (JS) filtreleme yapar;
   yeni istek atılmaz.
3. Bir şehre tıklanınca o şehrin detay JSON'u çekilir, URL `#istanbul`
   olarak güncellenir ve detay görünümü render edilir.
4. Kategori sekmeleri mekanları `category` alanına göre süzer.
5. Her mekan kartındaki "Yol tarifi" linki şu kalıpla üretilir:
   `https://www.google.com/maps/dir/?api=1&destination=<lat>,<lng>`

> **Tek Sayfa (SPA) yaklaşımı:** Tüm görünümler tek `index.html` içinde JS ile
> değiştirilir. `#slug` hash yönlendirmesi sayesinde geri/ileri tuşları ve
> paylaşılabilir linkler çalışır.

---

## Yerel Geliştirme

`fetch`, dosya sisteminden (`file://`) **çalışmaz**. Yerelde test için küçük
bir statik sunucu çalıştır:

```bash
# Python ile (genelde yüklü gelir)
python -m http.server 8000
# Tarayıcıda: http://localhost:8000

# veya Node ile
npx serve
```

GitHub Pages'te zaten gerçek bir sunucu üzerinden sunulduğu için bu sorun
yaşanmaz.

---

## GitHub Pages'e Yayınlama

1. Projeyi GitHub'a **public** repo olarak yükle (örn. `seyyah`).
2. Repo → **Settings → Pages**.
3. **Source** olarak `Deploy from a branch` seç.
4. Branch: `main`, klasör: `/ (root)` → **Save**.
5. Birkaç dakika içinde site şu adreste yayında olur:
   `https://<kullanıcı-adı>.github.io/seyyah/`

> ⚠️ **Önemli:** Tüm dosya yollarını **göreceli** ver. `fetch('/data/...')`
> gibi başında `/` olan **mutlak** yollar, site alt klasörde (`/seyyah/`)
> yayınlandığı için kırılır. Doğru kullanım: `fetch('data/cities.json')`.

---

## Yeni Şehir / Mekan Ekleme

**Yeni şehir eklemek için:**
1. `data/<slug>.json` dosyası oluştur (yukarıdaki şema ile).
2. `cities.json` içine şehrin özet kaydını ekle.
3. (Opsiyonel) `data/img/<slug>.jpg` kapak görselini ekle.

**Yeni mekan eklemek için:**
- İlgili şehrin JSON'undaki `places` dizisine yeni bir nesne ekle. Kod
  değişikliği gerekmez.

---

## Yol Haritası

- [ ] Şehir kapak fotoğrafları (telifsiz: Unsplash / Wikimedia).
- [ ] Detay sayfasına gömülü harita (örn. Leaflet + OpenStreetMap).
- [ ] Etikete göre gelişmiş filtre (ücretsiz, tarihi, manzaralı…).
- [ ] Paylaşılabilir favori listesi (URL parametresiyle).
- [ ] TR/EN dil seçeneği.
- [ ] İskelet (skeleton) yükleme durumu.

---

## Lisans

Dilersen MIT lisansı önerilir. İçeriklerde (fotoğraf, metin) kullandığın
kaynakların telif durumuna dikkat et; telifsiz veya kendi ürettiğin
görselleri tercih et.

---

*Seyyah — yola çıkmadan önce.* 🧭
