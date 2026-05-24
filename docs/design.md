# Seyyah — Tasarım Promptu & Spesifikasyonu

> Bu belge, **Seyyah** projesinin görsel kimliğini ve arayüz tasarımını
> baştan yeniden üretebilecek kadar ayrıntılı bir referanstır. Hem bir
> yapay zekâya verilebilecek "tek prompt" hem de geliştiriciler için
> ayrıntılı bir tasarım sistemi içerir.

---

## 1. Konsept ve Kimlik

**Seyyah** (gezgin), Türkiye'nin şehirlerini keşfetmek isteyen kullanıcılar
için sade ve ferah bir gezi rehberidir. Kullanıcı bir şehir seçer; nerede ne
yiyebileceğini, hangi camiyi, müzeyi ve gezilecek yeri görebileceğini tek
bakışta öğrenir.

Tasarımın hissi: **modern, minimal, ferah, güven veren.** Süs değil, içerik
ön planda. "Pasaport sayfası gibi sade ama nefes alan" bir his.

---

## 2. Tasarım Felsefesi

- **Boşluk bir tasarım öğesidir.** Her bileşen rahatça nefes alsın; sıkışık
  görünüm yasak.
- **Düz yüzeyler.** Gradyan, doku, gölge yok. Sadece ince çizgiler ve düz
  beyaz/krem yüzeyler.
- **Az renk, çok anlam.** Renk dekoratif değil, kategori kodlamak için
  kullanılır. Nötr bir zemin + kategoriye özel ince renk dokunuşları.
- **İçerik hiyerarşisi tipografiyle kurulur**, kutu içine kutu ile değil.
- **Tutarlılık.** Aynı bileşen her yerde aynı kenarlık, köşe yarıçapı ve
  boşlukla görünür.

---

## 3. Renk Paleti

### Nötr (zemin ve metin)

| Rol | Açık tema | Açıklama |
|-----|-----------|----------|
| Ana zemin | `#FFFFFF` | Kart ve içerik yüzeyleri |
| İkincil zemin | `#F1EFE8` | Kart başlık şeridi, rozet zemini, çip |
| Ana metin | `#1A1A18` | Başlıklar, vurgulu metin |
| İkincil metin | `#5F5E5A` | Açıklamalar, alt başlık |
| Soluk metin | `#8B8A82` | İpucu, sayaç, etiket |
| Kenarlık | `rgba(0,0,0,0.12)` | Varsayılan 0.5px çizgi |
| Kenarlık (vurgu) | `rgba(0,0,0,0.28)` | Hover / odak |

### Kategori renkleri (yalnızca rozet ve küçük vurgular)

| Kategori | Zemin (50) | Metin (900) |
|----------|------------|-------------|
| Yemek | `#FAECE7` (mercan) | `#4A1B0C` |
| Cami | `#E1F5EE` (yeşil-mavi) | `#04342C` |
| Müze | `#EEEDFE` (mor) | `#26215C` |
| Gezilecek | `#FAEEDA` (kehribar) | `#412402` |

> Kural: Renkli bir zemin üzerindeki metin **her zaman** aynı renk ailesinin
> en koyu tonundan seçilir; asla saf siyah/gri kullanılmaz.

### Karanlık tema
Tüm renkler karanlık temada da çalışmalı: zeminler koyu, metinler açık tonlara
döner. Tasarımı kurarken "zemin neredeyse siyah olsaydı her metin yine
okunur muydu?" testini uygula.

---

## 4. Tipografi

- **Gövde fontu:** Modern, okunaklı bir sans-serif (örn. *Inter*, *Source Sans 3*).
- **Başlık fontu (opsiyonel karakter):** Hafif nostalji için bir serif
  (örn. *Playfair Display*) yalnızca logo/şehir adı gibi büyük başlıklarda
  kullanılabilir. Abartmadan.
- **Ağırlıklar:** Sadece **400 (normal)** ve **500 (orta-kalın)**. 600/700
  kullanma — fazla ağır durur.
- **Ölçek:**
  - Logo / büyük başlık: 20–22px / 500
  - Bölüm başlığı: 16–18px / 500
  - Gövde: 14–16px / 400, satır yüksekliği 1.55–1.7
  - Etiket / ipucu: 12–13px
- **Cümle düzeni:** Her zaman normal cümle düzeni. ASLA Büyük Harfli Başlık
  ya da TAMAMI BÜYÜK kullanma.

---

## 5. Düzen (Layout)

- **Konteyner genişliği:** İçerik ortalanır, masaüstünde ~1100px maksimum.
- **Izgara (grid):** Şehir ve mekan kartları `repeat(auto-fit, minmax(190px, 1fr))`
  ile esnek sütunlara dağılır — ekran genişliğine göre 1–3 sütun.
- **Dikey ritim:** Bölümler arası 1.25–2rem boşluk. Bileşen içi boşluklar
  8–16px.
- **Köşe yarıçapı:** Kartlar `12px`, küçük öğeler (input, rozet) `8px`,
  çipler tam yuvarlak (`999px`).
- **Kenarlıklar:** Her zaman `0.5px solid` ince çizgi.

---

## 6. Bileşenler

### Üst başlık (header)
- Solda yuvarlak ikon rozeti içinde konum/pusula ikonu + "Seyyah" kelime
  markası, altında küçük soluk slogan ("Türkiye'nin şehirlerini keşfet").

### Arama kutusu
- Tam genişlik, sol içinde arama ikonu, placeholder: "Şehir veya mekan ara…".
- Yükseklik ~36px, ince kenarlık, odaklanınca yumuşak odak halkası.
- Canlı filtre: yazdıkça hem şehir adına hem mekan adına göre süzer.

### Bölge çipleri
- Yatay, sarmalanabilir (wrap) çip sırası: "Tümü", "Marmara", "Karadeniz"…
- Seçili çip dolu (koyu zemin/açık metin), diğerleri sadece kenarlıklı.

### Şehir kartı
- Üstte ~84px yükseklikte **kapak görseli alanı** (görsel yoksa ikincil
  zemin rengi). Alt köşede şehrin bölgesi soluk metinle.
- Gövde: şehir adı (16px/500), kısa açıklama (13px ikincil), en altta
  "⚲ N mekan" sayacı.
- Hover'da kart 2px yukarı kalkar ve kenarlık koyulaşır.

### Şehir detay görünümü
- Üstte "← Tüm şehirler" geri butonu.
- Büyük şehir adı + tek satır açıklama.
- Altında **kategori sekmeleri:** Hepsi / Yemek / Cami / Müze / Gezilecek.
  Aktif sekme alt çizgiyle ve koyu metinle belirtilir.
- Sekmenin altında o kategoriye ait **mekan kartları** dikey ızgarada.

### Mekan kartı
- Üst satır: mekan adı (15px/500) + sağda kategori rozeti.
- Açıklama (13px ikincil).
- Yemek mekanlarında **"Meşhuru:"** etiketi + meşhur yemeklerin küçük çip
  listesi (ikincil zeminli).
- En altta **"⚲ Yol tarifi"** linki — koordinatlardan Google Maps yol
  tarifi URL'si üretir.

### Rozet (badge)
- 11px metin, 3px×9px iç boşluk, 8px köşe, kategori renginin açık zemini +
  koyu metni.

### Buton
- Şeffaf zemin, 0.5px ikincil kenarlık, hover'da hafif zemin, tıklamada
  `scale(0.98)`. Geri ve sekme butonları çizgisiz, metin tarzında.

---

## 7. Etkileşim ve Hareket

- Geçişler kısa ve yumuşak: `0.15s ease` (kenarlık, dönüşüm, zemin).
- Hover yükselmeleri 2px ile sınırlı; abartılı animasyon yok.
- Sayfa içi gezinme `#sehir-slug` hash ile yönetilir; geri/ileri ve
  paylaşılabilir link çalışır.
- Yükleniyor durumu için iskelet (skeleton) kartlar gösterilebilir.

---

## 8. Responsive Davranış

- **Mobil (≤600px):** Tek sütun. Arama tam genişlik. Sekmeler yatay
  kaydırılabilir. Dokunma hedefleri ≥44px.
- **Tablet (600–1000px):** 2 sütun ızgara.
- **Masaüstü (>1000px):** 3 sütun, ortalanmış konteyner.
- Görseller `object-fit: cover` ile orantısını korur.

---

## 9. İkonografi

- Tek bir ince çizgili (outline) ikon seti kullan (örn. Tabler / Lucide).
- Sık ikonlar: konum (`map-pin`), arama (`search`), geri ok (`arrow-left`),
  kategori başına opsiyonel ince ikon.
- İkonlar metin rengini ve boyutunu üst öğeden miras alır.

---

## 10. Erişilebilirlik

- Renk tek başına anlam taşımasın; rozetlerde metin de bulunsun.
- Kontrast oranı en az AA (4.5:1) olmalı.
- Tüm etkileşimli öğeler klavyeyle gezilebilir; görünür odak halkası olsun.
- Görsellerde `alt`, ikon-only butonlarda `aria-label` kullan.

---

## 11. Tek Paragraf Prompt (kopyala–yapıştır)

> Türkiye şehir gezi rehberi "Seyyah" için modern, minimal ve ferah bir web
> arayüzü tasarla. Bol beyaz alan, 0.5px ince çizgiler, gölge ve gradyan yok.
> Nötr krem/beyaz zemin (`#FFFFFF`, `#F1EFE8`) üzerine yalnızca kategori
> kodlayan ince renk dokunuşları: yemek mercan, cami yeşil-mavi, müze mor,
> gezilecek kehribar. Sans-serif gövde, isteğe bağlı serif büyük başlık;
> sadece 400 ve 500 ağırlık, cümle düzeni. Üstte logo + canlı arama + bölge
> çipleri; altında esnek ızgarada şehir kartları (kapak alanı, şehir adı,
> kısa açıklama, mekan sayacı). Bir şehre tıklanınca detay görünümü açılır:
> geri butonu, büyük şehir adı, "Hepsi/Yemek/Cami/Müze/Gezilecek" sekmeleri
> ve mekan kartları. Yemek kartlarında "Meşhuru:" çip listesi ve her kartta
> koordinattan üretilen "Yol tarifi" linki bulunur. Hover'da kart 2px kalkar,
> geçişler 0.15s. Tam responsive (mobil 1, tablet 2, masaüstü 3 sütun),
> karanlık tema uyumlu, AA kontrast, klavye erişilebilir.
