'use strict';

/*
 * Seyyah — app.js
 * Vanilla JS SPA — çerçeve yok, derleme adımı yok.
 *
 * GÜVENLİK NOTU:
 * Tüm JSON verisi sadece bizim kontrolümüzdeki yerel dosyalardan gelir.
 * Dinamik içerik ekrana basılmadan önce esc() fonksiyonundan geçer;
 * bu fonksiyon &, <, >, ", ' karakterlerini HTML varlıklarına dönüştürür.
 * innerHTML kullanımı kasıtlıdır ve XSS güvenliği esc() ile sağlanmıştır.
 */

// ── 1. Sabitler ───────────────────────────────────────────────────────
const CITIES_URL = 'data/cities.json';
const LS_LANG    = 'seyyah-lang';
const LS_THEME   = 'seyyah-theme';
const LS_FAVS        = 'seyyah-favs';
const LS_PLACE_FAVS  = 'seyyah-place-favs';

// ── 2. Durum ──────────────────────────────────────────────────────────
const state = {
  cities:      [],
  cityData:    null,
  slug:        null,
  category:    'all',
  search:      '',
  region:      'all',
  activeTags:  new Set(),
  favorites:   new Set(JSON.parse(localStorage.getItem(LS_FAVS) || '[]')),
  lang:        localStorage.getItem(LS_LANG)  || 'tr',
  theme:       localStorage.getItem(LS_THEME) || 'light',
  mapInstance:  null,
  modalPlace:   null,
  modalMapInst: null,
  placeFavs:    new Set(JSON.parse(localStorage.getItem(LS_PLACE_FAVS) || '[]')),
};

// ── 3. Çeviriler ──────────────────────────────────────────────────────
const STRINGS = {
  tr: {
    tagline:      "Türkiye'nin şehirlerini keşfet",
    search_ph:    'Şehir veya mekan ara…',
    all_regions:  'Tümü',
    regions: {
      'Marmara': 'Marmara', 'İç Anadolu': 'İç Anadolu', 'Ege': 'Ege',
      'Güneydoğu Anadolu': 'Güneydoğu Anadolu', 'Karadeniz': 'Karadeniz',
      'Akdeniz': 'Akdeniz', 'Doğu Anadolu': 'Doğu Anadolu',
    },
    cats: { all: 'Hepsi', yemek: 'Yemek', cami: 'Cami', muze: 'Müze', gezi: 'Gezilecek' },
    places_count: (n) => n + ' mekan',
    must_eat:     'Meşhuru:',
    directions:   'Yol tarifi',
    open_hours:   'Açık:',
    back:         'Tüm şehirler',
    no_results:   'Sonuç bulunamadı.',
    no_places:    'Bu kategoride mekan yok.',
    fav_add:      'Favorilere ekle',
    fav_remove:   'Favorilerden çıkar',
    share_favs:   'Favorileri paylaş',
    favs_copied:  'Link panoya kopyalandı!',
    favs_title:   'Favorilerim',
    map_unavail:  'Harita için vendor/leaflet/ klasörüne Leaflet ekleyin. → leafletjs.com/download.html',
    price:        (n) => '₺'.repeat(n),
    filter_tags:  'Etiket:',
    clear_tags:   'Temizle',
    lang_switch:  'EN',
    theme_light:  'Açık temaya geç',
    theme_dark:   'Karanlık temaya geç',
    map_legend:   'Haritada gösterilen mekanlar',
    share_label:  'Paylaş',
    load_err:     'Veri yüklenemedi: ',
    no_coord:       'Koordinat bilgisi olan mekan bulunamadı.',
    modal_close:    'Kapat',
    modal_share:    'Linki Kopyala',
    modal_share_ok: 'Mekan linki kopyalandı!',
    modal_plan:     'Gezi Planına Ekle',
    place_fav_add:  'Mekanı favorile',
    place_fav_rm:   'Favoriden çıkar',
  },
  en: {
    tagline:      "Discover Turkey's cities",
    search_ph:    'Search city or place…',
    all_regions:  'All',
    regions: {
      'Marmara': 'Marmara', 'İç Anadolu': 'Central Anatolia', 'Ege': 'Aegean',
      'Güneydoğu Anadolu': 'Southeast Anatolia', 'Karadeniz': 'Black Sea',
      'Akdeniz': 'Mediterranean', 'Doğu Anadolu': 'Eastern Anatolia',
    },
    cats: { all: 'All', yemek: 'Food', cami: 'Mosque', muze: 'Museum', gezi: 'Sights' },
    places_count: (n) => n + ' place' + (n !== 1 ? 's' : ''),
    must_eat:     'Must try:',
    directions:   'Directions',
    open_hours:   'Open:',
    back:         'All cities',
    no_results:   'No results found.',
    no_places:    'No places in this category.',
    fav_add:      'Add to favorites',
    fav_remove:   'Remove from favorites',
    share_favs:   'Share favorites',
    favs_copied:  'Link copied to clipboard!',
    favs_title:   'My Favorites',
    map_unavail:  'Add Leaflet to vendor/leaflet/ to enable the map. → leafletjs.com/download.html',
    price:        (n) => '₺'.repeat(n),
    filter_tags:  'Tags:',
    clear_tags:   'Clear',
    lang_switch:  'TR',
    theme_light:  'Switch to light mode',
    theme_dark:   'Switch to dark mode',
    map_legend:   'Places shown on map',
    share_label:  'Share',
    load_err:     'Failed to load data: ',
    no_coord:       'No places with coordinates found.',
    modal_close:    'Close',
    modal_share:    'Copy Link',
    modal_share_ok: 'Place link copied!',
    modal_plan:     'Add to Plan',
    place_fav_add:  'Save place',
    place_fav_rm:   'Unsave place',
  },
};

function t(key, ...args) {
  const val = key.split('.').reduce((o, k) => o && o[k], STRINGS[state.lang]);
  if (typeof val === 'function') return val(...args);
  return val != null ? val : key;
}

// ── 4. SVG İkonlar ────────────────────────────────────────────────────
function svg(paths, size) {
  size = size || 16;
  return '<svg xmlns="http://www.w3.org/2000/svg" width="' + size + '" height="' + size + '" '
    + 'viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" '
    + 'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + paths + '</svg>';
}

const IC = {
  compass:   svg('<circle cx="12" cy="12" r="10"/><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/>'),
  search:    svg('<circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>'),
  mapPin:    svg('<path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/>'),
  arrowLeft: svg('<path d="m12 19-7-7 7-7"/><path d="M19 12H5"/>'),
  moon:      svg('<path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9z"/>'),
  sun:       svg('<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/>'),
  heart:     svg('<path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>'),
  heartFill: svg('<path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" fill="currentColor"/>'),
  globe:     svg('<circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>'),
  share:     svg('<path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/>'),
  xMark:     svg('<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>'),
  clock:     svg('<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>'),
  extLink:   svg('<path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>'),
  utensils:  svg('<path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"/><path d="M7 2v20"/><path d="M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7"/>'),
  mosque:    svg('<path d="M2 22h20"/><path d="M12 2c0 0-4 3-4 8h8c0-5-4-8-4-8z"/><rect x="4" y="10" width="16" height="12"/>'),
  landmark:  svg('<line x1="3" y1="22" x2="21" y2="22"/><line x1="6" y1="18" x2="6" y2="11"/><line x1="10" y1="18" x2="10" y2="11"/><line x1="14" y1="18" x2="14" y2="11"/><line x1="18" y1="18" x2="18" y2="11"/><polygon points="12 2 20 7 4 7"/>'),
  bino:      svg('<circle cx="8.5" cy="13" r="4"/><circle cx="15.5" cy="13" r="4"/><path d="M1 13h4M19 13h4M8.5 9V7M15.5 9V7M10.5 13h3"/>'),
  tag:       svg('<path d="M12 2H2v10l9.29 9.29c.94.94 2.48.94 3.42 0l6.58-6.58c.94-.94.94-2.48 0-3.42L12 2Z"/><path d="M7 7h.01"/>'),
  link:      svg('<path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>'),
  plan:      svg('<rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/><line x1="9" y1="16" x2="15" y2="16"/><line x1="12" y1="13" x2="12" y2="19"/>'),
};

const CAT_IC  = { yemek: IC.utensils, cami: IC.mosque, muze: IC.landmark, gezi: IC.bino };
const MAP_COL = { yemek: '#c0392b', cami: '#27ae60', muze: '#8e44ad', gezi: '#e67e22' };

// ── 5. Yardımcılar ────────────────────────────────────────────────────

// Tüm dinamik içerik bu fonksiyondan geçirilir (XSS önlemi)
function esc(s) {
  return String(s == null ? '' : s).replace(/[&<>"']/g, function(c) {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
  });
}

function mapsUrl(lat, lng) {
  return 'https://www.google.com/maps/dir/?api=1&destination=' + lat + ',' + lng;
}

function slugify(str) {
  return String(str == null ? '' : str).toLowerCase()
    .replace(/ğ/g, 'g').replace(/ü/g, 'u').replace(/ş/g, 's')
    .replace(/ı/g, 'i').replace(/ö/g, 'o').replace(/ç/g, 'c')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function saveFavs() {
  localStorage.setItem(LS_FAVS, JSON.stringify(Array.from(state.favorites)));
}

function savePlaceFavs() {
  localStorage.setItem(LS_PLACE_FAVS, JSON.stringify(Array.from(state.placeFavs)));
}

// ── 6. Tema & Dil ─────────────────────────────────────────────────────

function applyTheme() {
  document.documentElement.setAttribute('data-theme', state.theme);
  var isDark  = state.theme === 'dark';
  var iconEl  = document.getElementById('theme-icon');
  var btnEl   = document.getElementById('btn-theme');
  if (iconEl) iconEl.innerHTML = isDark ? IC.sun : IC.moon;
  if (btnEl)  btnEl.setAttribute('aria-label', isDark ? t('theme_light') : t('theme_dark'));
}

function toggleTheme() {
  state.theme = state.theme === 'light' ? 'dark' : 'light';
  localStorage.setItem(LS_THEME, state.theme);
  applyTheme();
}

function applyLang() {
  document.documentElement.lang = state.lang;
  var labelEl   = document.getElementById('lang-label');
  var taglineEl = document.getElementById('logo-tagline');
  if (labelEl)   labelEl.textContent = t('lang_switch');
  if (taglineEl) taglineEl.textContent = t('tagline');
}

function toggleLang() {
  state.lang = state.lang === 'tr' ? 'en' : 'tr';
  localStorage.setItem(LS_LANG, state.lang);
  applyLang();
  if (state.slug) renderCityDetail();
  else            renderCityList();
}

// ── 7. Veri Çekme ─────────────────────────────────────────────────────

function fetchJSON(url) {
  return fetch(url).then(function(res) {
    if (!res.ok) throw new Error('HTTP ' + res.status + ': ' + url);
    return res.json();
  });
}

// ── 8. Skeleton ───────────────────────────────────────────────────────

function skeletonCityCard() {
  return '<div class="city-card skeleton" aria-hidden="true">'
    + '<div class="city-card-img"></div>'
    + '<div class="city-card-body">'
    + '<div class="skel-line skel-title"></div>'
    + '<div class="skel-line skel-desc"></div>'
    + '<div class="skel-line skel-short"></div>'
    + '</div></div>';
}

function skeletonPlaceCard() {
  return '<div class="place-card skeleton" aria-hidden="true">'
    + '<div class="skel-line skel-title"></div>'
    + '<div class="skel-line skel-desc"></div>'
    + '<div class="skel-line skel-short"></div>'
    + '</div>';
}

// ── 9. Şehir Listesi ──────────────────────────────────────────────────

function getRegions() {
  var seen = {};
  return state.cities.map(function(c) { return c.region; }).filter(function(r) {
    if (seen[r]) return false;
    seen[r] = true; return true;
  });
}

function filterCities() {
  var q = state.search.toLowerCase().trim();
  return state.cities.filter(function(city) {
    var matchR = state.region === 'all' || city.region === state.region;
    var matchS = !q
      || city.city.toLowerCase().indexOf(q) !== -1
      || city.description.toLowerCase().indexOf(q) !== -1;
    return matchR && matchS;
  });
}

function cityCardHTML(city) {
  var isFav = state.favorites.has(city.slug);
  var count = city.placeCount != null ? city.placeCount : '…';
  var imgUrl = 'https://picsum.photos/seed/' + encodeURIComponent(city.slug) + '/600/400';
  return '<article class="city-card" data-slug="' + esc(city.slug) + '" role="button" tabindex="0" '
    + 'aria-label="' + esc(city.city) + '">'
    + '<div class="city-card-img">'
    + '<img src="' + imgUrl + '" alt="' + esc(city.city) + '" loading="lazy">'
    + '<div class="city-card-img-overlay"></div>'
    + '<span class="city-card-region">' + esc(city.region) + '</span>'
    + '<button class="btn-fav city-fav ' + (isFav ? 'is-fav' : '') + '" data-slug="' + esc(city.slug) + '" '
    + 'aria-label="' + esc(isFav ? t('fav_remove') : t('fav_add')) + '">'
    + (isFav ? IC.heartFill : IC.heart)
    + '</button></div>'
    + '<div class="city-card-body">'
    + '<h2 class="city-name">' + esc(city.city) + '</h2>'
    + '<p class="city-desc">' + esc(city.description) + '</p>'
    + '<div class="city-footer">'
    + '<span class="city-count">' + IC.mapPin + ' ' + esc(t('places_count', count)) + '</span>'
    + '<span class="city-arrow">→</span>'
    + '</div>'
    + '</div></article>';
}

function renderCityList() {
  var main      = document.getElementById('main');
  var filtered  = filterCities();
  var favCities = state.cities.filter(function(c) { return state.favorites.has(c.slug); });
  var showFavs  = favCities.length > 0 && !state.search && state.region === 'all';

  var regionChipsHTML = '<button class="chip ' + (state.region === 'all' ? 'chip-active' : '')
    + '" data-region="all">' + esc(t('all_regions')) + '</button>'
    + getRegions().map(function(r) {
        var label = t('regions.' + r) || r;
        return '<button class="chip ' + (state.region === r ? 'chip-active' : '')
          + '" data-region="' + esc(r) + '">' + esc(label) + '</button>';
      }).join('');

  var cityCardsHTML = filtered.length
    ? filtered.map(cityCardHTML).join('')
    : '<p class="empty-state">' + esc(t('no_results')) + '</p>';

  var favsHTML = showFavs
    ? '<section class="favs-section" aria-label="' + esc(t('favs_title')) + '">'
      + '<div class="section-header">'
      + '<h2 class="section-title">' + IC.heartFill + ' ' + esc(t('favs_title')) + '</h2>'
      + '<button class="btn-text" id="btn-share-favs">' + IC.share + ' ' + esc(t('share_favs')) + '</button>'
      + '</div>'
      + '<div class="city-grid">' + favCities.map(cityCardHTML).join('') + '</div>'
      + '</section>'
    : '';

  var heroTitle = state.lang === 'tr'
    ? 'Türkiye\'yi<br><span>Keşfet</span>'
    : 'Explore<br><span>Turkey</span>';
  var heroSub = state.lang === 'tr'
    ? 'Tarihin, lezzetin ve doğanın iç içe geçtiği şehirleri keşfet. Her köşede seni bekleyen unutulmaz anlar var.'
    : 'Discover cities where history, flavor, and nature intertwine. Unforgettable moments await around every corner.';
  var eyebrow = state.lang === 'tr'
    ? '✶  ' + state.cities.length + ' şehir keşfet'
    : '✶  ' + state.cities.length + ' cities to explore';

  var heroHTML = '<section class="hero">'
    + '<div class="container hero-content">'
    + '<div class="hero-eyebrow">' + eyebrow + '</div>'
    + '<h1 class="hero-title">' + heroTitle + '</h1>'
    + '<p class="hero-subtitle">' + esc(heroSub) + '</p>'
    + '<div class="search-wrap">'
    + '<span class="search-icon">' + IC.search + '</span>'
    + '<input id="search-input" class="search-input" type="search" '
    + 'placeholder="' + esc(t('search_ph')) + '" '
    + 'value="' + esc(state.search) + '" '
    + 'aria-label="' + esc(t('search_ph')) + '" '
    + 'autocomplete="off" spellcheck="false">'
    + (state.search
        ? '<button class="search-clear" id="search-clear" aria-label="Arama temizle">' + IC.xMark + '</button>'
        : '<span class="search-badge">⌘K</span>')
    + '</div>'
    + '<div class="region-chips" role="group" aria-label="Bölge filtresi">' + regionChipsHTML + '</div>'
    + '</div></section>';

  var resultLabel = state.lang === 'tr'
    ? (filtered.length + ' sonuç')
    : (filtered.length + ' result' + (filtered.length !== 1 ? 's' : ''));
  var sectionLabel = state.lang === 'tr' ? 'Şehirler' : 'Cities';

  var contentHTML = '<div class="container section-wrap">'
    + favsHTML
    + '<section aria-label="' + esc(sectionLabel) + '">'
    + '<div class="section-label">'
    + '<span class="section-label-text">' + esc(sectionLabel) + '</span>'
    + '<span class="section-label-line"></span>'
    + '<span class="section-label-count">' + esc(resultLabel) + '</span>'
    + '</div>'
    + '<div class="city-grid">' + cityCardsHTML + '</div>'
    + '</section></div>';

  main.innerHTML = heroHTML + contentHTML;
  bindCityListEvents();

  if (state.search) {
    var inp = document.getElementById('search-input');
    if (inp) { inp.focus(); inp.setSelectionRange(inp.value.length, inp.value.length); }
  }
}

function bindCityListEvents() {
  var main = document.getElementById('main');

  var inp = main.querySelector('#search-input');
  if (inp) {
    inp.addEventListener('input', function(e) {
      state.search = e.target.value;
      renderCityList();
    });
  }

  var clrBtn = main.querySelector('#search-clear');
  if (clrBtn) {
    clrBtn.addEventListener('click', function() {
      state.search = '';
      renderCityList();
      var i = document.getElementById('search-input');
      if (i) i.focus();
    });
  }

  main.querySelectorAll('.chip[data-region]').forEach(function(chip) {
    chip.addEventListener('click', function(e) {
      state.region = e.currentTarget.dataset.region;
      renderCityList();
    });
  });

  main.querySelectorAll('.city-card[data-slug]').forEach(function(card) {
    card.addEventListener('click', function(e) {
      if (e.target.closest('.btn-fav')) return;
      if (!card.classList.contains('skeleton')) location.hash = card.dataset.slug;
    });
    card.addEventListener('keydown', function(e) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        if (!card.classList.contains('skeleton')) location.hash = card.dataset.slug;
      }
    });
  });

  main.querySelectorAll('.btn-fav[data-slug]').forEach(function(btn) {
    btn.addEventListener('click', function(e) {
      e.stopPropagation();
      var slug = btn.dataset.slug;
      if (state.favorites.has(slug)) state.favorites.delete(slug);
      else                           state.favorites.add(slug);
      saveFavs();
      renderCityList();
    });
  });

  var shareBtn = main.querySelector('#btn-share-favs');
  if (shareBtn) shareBtn.addEventListener('click', shareFavorites);
}

// ── 10. Şehir Detayı ──────────────────────────────────────────────────

function filterPlaces() {
  if (!state.cityData) return [];
  return state.cityData.places.filter(function(p) {
    var matchCat  = state.category === 'all' || p.category === state.category;
    var matchTags = state.activeTags.size === 0
      || Array.from(state.activeTags).every(function(tag) {
           return p.tags && p.tags.indexOf(tag) !== -1;
         });
    return matchCat && matchTags;
  });
}

function getAllTags() {
  if (!state.cityData) return [];
  var tags = {};
  state.cityData.places.forEach(function(p) {
    if (p.tags) p.tags.forEach(function(tag) { tags[tag] = true; });
  });
  return Object.keys(tags).sort(function(a, b) { return a.localeCompare(b, 'tr'); });
}

function badgeHTML(category) {
  return '<span class="badge badge-' + esc(category) + '">'
    + (CAT_IC[category] || '') + esc(t('cats.' + category)) + '</span>';
}

function placeCardHTML(place) {
  var hasLoc = place.location && place.location.lat && place.location.lng;

  var mustEatHTML = '';
  if (place.mustEat && place.mustEat.length) {
    mustEatHTML = '<div class="must-eat">'
      + '<span class="must-eat-label">' + esc(t('must_eat')) + '</span>'
      + '<div class="must-eat-chips">'
      + place.mustEat.map(function(item) { return '<span class="must-chip">' + esc(item) + '</span>'; }).join('')
      + '</div></div>';
  }

  var tagsHTML = '';
  if (place.tags && place.tags.length) {
    tagsHTML = '<div class="place-tags">'
      + place.tags.map(function(tag) {
          return '<button class="chip-tag ' + (state.activeTags.has(tag) ? 'chip-tag-active' : '')
            + '" data-tag="' + esc(tag) + '">' + esc(tag) + '</button>';
        }).join('')
      + '</div>';
  }

  var hoursHTML = place.openHours
    ? '<span class="place-hours">' + IC.clock + ' ' + esc(place.openHours) + '</span>'
    : '';

  var priceHTML = place.priceLevel
    ? '<span class="place-price">' + esc(t('price', place.priceLevel)) + '</span>'
    : '';

  var dirHTML = hasLoc
    ? '<a class="place-dir" href="' + mapsUrl(place.location.lat, place.location.lng)
      + '" target="_blank" rel="noopener noreferrer">'
      + esc(t('directions')) + ' ' + IC.extLink + '</a>'
    : '';

  var footerHTML = (hoursHTML || priceHTML || dirHTML)
    ? '<footer class="place-card-footer">' + hoursHTML + priceHTML + dirHTML + '</footer>'
    : '';

  return '<article class="place-card place-card-clickable" '
    + 'data-place-name="' + esc(place.name) + '" '
    + 'role="button" tabindex="0" aria-label="' + esc(place.name) + ' – detayları gör">'
    + '<div class="place-card-accent place-accent-' + esc(place.category) + '"></div>'
    + '<div class="place-card-body">'
    + '<div class="place-card-header">'
    + '<h3 class="place-name">' + esc(place.name) + '</h3>'
    + badgeHTML(place.category)
    + '</div>'
    + '<p class="place-desc">' + esc(place.description) + '</p>'
    + tagsHTML
    + mustEatHTML
    + footerHTML
    + '</div></article>';
}

function tagChipsHTML(tags) {
  return tags.map(function(tag) {
    return '<button class="chip-tag ' + (state.activeTags.has(tag) ? 'chip-tag-active' : '')
      + '" data-tag="' + esc(tag) + '">' + esc(tag) + '</button>';
  }).join('')
  + (state.activeTags.size
      ? '<button class="chip-clear" id="clear-tags">' + esc(t('clear_tags')) + '</button>'
      : '');
}

async function renderCityDetail() {
  var main = document.getElementById('main');

  // Skeleton göster
  main.innerHTML = '<div class="container detail-view">'
    + '<div class="detail-header">'
    + '<button class="btn-back" id="btn-back-skel">' + IC.arrowLeft + ' ' + esc(t('back')) + '</button>'
    + '</div>'
    + '<div class="detail-meta">'
    + '<div class="skel-line skel-city-name"></div>'
    + '<div class="skel-line skel-desc" style="width:55%;margin-top:0.5rem;"></div>'
    + '</div>'
    + '<div class="place-grid">'
    + [0,1,2,3,4,5].map(skeletonPlaceCard).join('')
    + '</div>'
    + '</div>';

  document.getElementById('btn-back-skel') &&
    document.getElementById('btn-back-skel').addEventListener('click', function() { location.hash = ''; });

  // Veriyi çek
  try {
    var cityMeta = state.cities.find(function(c) { return c.slug === state.slug; });
    if (!cityMeta) throw new Error('Şehir bulunamadı: ' + state.slug);
    state.cityData = await fetchJSON(cityMeta.data);
    cityMeta.placeCount = state.cityData.places.length;
  } catch (err) {
    main.innerHTML = '<div class="container detail-view">'
      + '<div class="detail-header">'
      + '<button class="btn-back" id="btn-back-err">' + IC.arrowLeft + ' ' + esc(t('back')) + '</button>'
      + '</div>'
      + '<p class="empty-state">' + esc(t('load_err')) + esc(err.message) + '</p>'
      + '</div>';
    document.getElementById('btn-back-err') &&
      document.getElementById('btn-back-err').addEventListener('click', function() { location.hash = ''; });
    return;
  }

  // Sekmeler
  var categories = ['all', 'yemek', 'cami', 'muze', 'gezi'];
  var tabsHTML = categories.map(function(cat) {
    var count = cat === 'all'
      ? state.cityData.places.length
      : state.cityData.places.filter(function(p) { return p.category === cat; }).length;
    if (cat !== 'all' && count === 0) return '';
    return '<button class="tab ' + (state.category === cat ? 'tab-active' : '') + '" '
      + 'data-cat="' + cat + '" role="tab" aria-selected="' + (state.category === cat) + '">'
      + (CAT_IC[cat] || '') + ' ' + esc(t('cats.' + cat))
      + ' <span class="tab-count">' + count + '</span></button>';
  }).join('');

  // Etiket filtresi
  var allTags = getAllTags();
  var tagFilterHTML = allTags.length
    ? '<div class="tag-filter">'
      + '<span class="tag-filter-label">' + IC.tag + ' ' + esc(t('filter_tags')) + '</span>'
      + '<div class="tag-filter-chips" id="tag-filter-chips">' + tagChipsHTML(allTags) + '</div>'
      + '</div>'
    : '';

  // Mekanlar
  var filtered   = filterPlaces();
  var placesHTML = filtered.length
    ? filtered.map(placeCardHTML).join('')
    : '<p class="empty-state col-span">' + esc(t('no_places')) + '</p>';

  main.innerHTML = '<div class="container detail-view">'
    + '<div class="detail-header">'
    + '<button class="btn-back" id="btn-back">' + IC.arrowLeft + ' ' + esc(t('back')) + '</button>'
    + '</div>'
    + '<div class="detail-meta">'
    + '<h1 class="detail-city-name">' + esc(state.cityData.city) + '</h1>'
    + '<p class="detail-city-desc">' + esc(state.cityData.description) + '</p>'
    + '</div>'
    + '<nav class="tabs" role="tablist" aria-label="Kategori filtresi">' + tabsHTML + '</nav>'
    + tagFilterHTML
    + '<div class="place-grid" id="place-grid">' + placesHTML + '</div>'
    + '<div class="map-section">'
    + '<p class="map-section-label">' + esc(t('map_legend')) + '</p>'
    + '<div id="city-map" class="city-map" role="img" aria-label="' + esc(t('map_legend')) + '"></div>'
    + '</div>'
    + '</div>';

  bindDetailEvents();
  initMap();
}

function bindDetailEvents() {
  var main = document.getElementById('main');

  var backBtn = document.getElementById('btn-back');
  if (backBtn) backBtn.addEventListener('click', function() { location.hash = ''; });

  main.querySelectorAll('.tab[data-cat]').forEach(function(tab) {
    tab.addEventListener('click', function(e) {
      state.category = e.currentTarget.dataset.cat;
      main.querySelectorAll('.tab').forEach(function(tb) {
        tb.classList.toggle('tab-active', tb.dataset.cat === state.category);
        tb.setAttribute('aria-selected', tb.dataset.cat === state.category);
      });
      updatePlaceGrid();
    });
  });

  bindTagChipEvents();

  var grid = document.getElementById('place-grid');
  if (grid) bindPlaceCardClicks(grid);
}

function bindTagChipEvents() {
  var container = document.getElementById('tag-filter-chips');
  if (!container) return;

  container.querySelectorAll('.chip-tag[data-tag]').forEach(function(chip) {
    chip.addEventListener('click', function(e) {
      var tag = e.currentTarget.dataset.tag;
      if (state.activeTags.has(tag)) state.activeTags.delete(tag);
      else                           state.activeTags.add(tag);
      refreshTagFilter();
      updatePlaceGrid();
    });
  });

  var clr = container.querySelector('#clear-tags');
  if (clr) {
    clr.addEventListener('click', function() {
      state.activeTags.clear();
      refreshTagFilter();
      updatePlaceGrid();
    });
  }
}

function refreshTagFilter() {
  var container = document.getElementById('tag-filter-chips');
  if (!container) return;
  container.innerHTML = tagChipsHTML(getAllTags());
  bindTagChipEvents();
}

function updatePlaceGrid() {
  var grid = document.getElementById('place-grid');
  if (!grid) return;
  var filtered = filterPlaces();
  grid.innerHTML = filtered.length
    ? filtered.map(placeCardHTML).join('')
    : '<p class="empty-state col-span">' + esc(t('no_places')) + '</p>';

  // Kart içi etiket çiplerini bağla
  grid.querySelectorAll('.chip-tag[data-tag]').forEach(function(chip) {
    chip.addEventListener('click', function(e) {
      e.stopPropagation();
      var tag = e.currentTarget.dataset.tag;
      if (state.activeTags.has(tag)) state.activeTags.delete(tag);
      else                           state.activeTags.add(tag);
      refreshTagFilter();
      updatePlaceGrid();
    });
  });

  bindPlaceCardClicks(grid);
}

// ── 11. Leaflet Harita ────────────────────────────────────────────────

function initMap() {
  var mapEl = document.getElementById('city-map');
  if (!mapEl) return;

  if (typeof window.L === 'undefined') {
    mapEl.innerHTML = '<div class="map-unavail">' + IC.mapPin + ' ' + esc(t('map_unavail')) + '</div>';
    mapEl.classList.add('map-unavail-wrap');
    return;
  }

  if (state.mapInstance) {
    state.mapInstance.remove();
    state.mapInstance = null;
  }

  var places = (state.cityData && state.cityData.places || []).filter(function(p) {
    return p.location && p.location.lat && p.location.lng;
  });

  if (!places.length) {
    mapEl.innerHTML = '<div class="map-unavail">' + IC.mapPin + ' ' + esc(t('no_coord')) + '</div>';
    mapEl.classList.add('map-unavail-wrap');
    return;
  }

  try {
    L.Icon.Default.mergeOptions({
      iconUrl:       'vendor/leaflet/images/marker-icon.png',
      iconRetinaUrl: 'vendor/leaflet/images/marker-icon-2x.png',
      shadowUrl:     'vendor/leaflet/images/marker-shadow.png',
    });
  } catch (_) {}

  var map = L.map('city-map', {
    zoomControl: true,
    scrollWheelZoom: false,
  });
  state.mapInstance = map;

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a>',
    maxZoom: 19,
  }).addTo(map);

  var markerGroup = L.featureGroup();

  places.forEach(function(place) {
    var color    = MAP_COL[place.category] || '#555';
    var catLabel = t('cats.' + place.category);
    var dirLink  = '<br><a href="' + mapsUrl(place.location.lat, place.location.lng)
                 + '" target="_blank" rel="noopener">' + t('directions') + '</a>';

    var marker = L.marker([place.location.lat, place.location.lng], {
      icon: L.divIcon({
        className: 'map-marker',
        html: '<div class="map-marker-inner" style="background:' + color + '" title="'
              + esc(place.name) + '"></div>',
        iconSize:    [14, 14],
        iconAnchor:  [7, 7],
        popupAnchor: [0, -8],
      }),
      alt: place.name,
    });

    marker.bindPopup(
      '<strong>' + esc(place.name) + '</strong><br>'
      + '<span style="color:#888;font-size:11px">' + esc(catLabel) + '</span>'
      + dirLink,
      { closeButton: false }
    );
    markerGroup.addLayer(marker);
  });

  markerGroup.addTo(map);

  try {
    map.fitBounds(markerGroup.getBounds().pad(0.15));
  } catch (_) {
    map.setView([places[0].location.lat, places[0].location.lng], 13);
  }
}

// ── 12. Yer Detay Modalı ──────────────────────────────────────────────

function modalInnerHTML(place) {
  var hasLoc  = place.location && place.location.lat && place.location.lng;
  var imgSeed = slugify(place.name) || 'place';
  var imgUrl  = 'https://picsum.photos/seed/' + encodeURIComponent(imgSeed + '-detail') + '/800/420';
  var favKey  = (state.slug || '') + '__' + slugify(place.name);
  var isFav   = state.placeFavs.has(favKey);

  var tagsHTML = '';
  if (place.tags && place.tags.length) {
    tagsHTML = '<div class="modal-tags">'
      + place.tags.map(function(tag) {
          return '<span class="chip-tag">' + esc(tag) + '</span>';
        }).join('') + '</div>';
  }

  var mustEatHTML = '';
  if (place.mustEat && place.mustEat.length) {
    mustEatHTML = '<div class="must-eat"><span class="must-eat-label">' + esc(t('must_eat')) + '</span>'
      + '<div class="must-eat-chips">'
      + place.mustEat.map(function(item) {
          return '<span class="must-chip">' + esc(item) + '</span>';
        }).join('') + '</div></div>';
  }

  var infoItems = '';
  if (place.openHours) {
    infoItems += '<div class="modal-info-item"><span class="modal-info-label">'
      + IC.clock + ' ' + esc(t('open_hours')) + '</span>'
      + '<span class="modal-info-val">' + esc(place.openHours) + '</span></div>';
  }
  if (place.priceLevel) {
    var priceLabel = state.lang === 'tr' ? 'Fiyat' : 'Price';
    infoItems += '<div class="modal-info-item"><span class="modal-info-label">₺ ' + esc(priceLabel) + '</span>'
      + '<span class="modal-info-val">' + esc(t('price', place.priceLevel)) + '</span></div>';
  }

  var mapHTML = hasLoc ? '<div id="modal-map" class="modal-map-mini"></div>' : '';
  var dirBtn  = hasLoc
    ? '<a class="modal-btn modal-btn-primary" href="' + esc(mapsUrl(place.location.lat, place.location.lng))
      + '" target="_blank" rel="noopener noreferrer">' + IC.mapPin + ' ' + esc(t('directions')) + '</a>'
    : '';

  return '<div class="modal" role="document">'
    + '<div class="modal-banner">'
    + '<img class="modal-banner-img" src="' + imgUrl + '" alt="' + esc(place.name) + '" loading="eager">'
    + '<div class="modal-banner-overlay"></div>'
    + '<button class="modal-close" id="modal-close" aria-label="' + esc(t('modal_close')) + '">' + IC.xMark + '</button>'
    + '<div class="modal-banner-badge">' + badgeHTML(place.category) + '</div>'
    + '</div><div class="modal-body">'
    + '<h2 class="modal-place-name" id="modal-place-name">' + esc(place.name) + '</h2>'
    + tagsHTML
    + '<p class="modal-desc">' + esc(place.description) + '</p>'
    + (infoItems ? '<div class="modal-info-grid">' + infoItems + '</div>' : '')
    + mustEatHTML + mapHTML
    + '<div class="modal-actions">' + dirBtn
    + '<button class="modal-btn modal-btn-secondary" id="modal-share-btn">'
    + IC.share + ' ' + esc(t('modal_share')) + '</button>'
    + '<button class="modal-btn modal-btn-fav ' + (isFav ? 'is-fav' : '') + '" id="modal-fav-btn" '
    + 'aria-label="' + esc(isFav ? t('place_fav_rm') : t('place_fav_add')) + '">'
    + (isFav ? IC.heartFill : IC.heart) + '</button>'
    + '</div></div></div>';
}

function openPlaceModal(place, updateUrl) {
  var old = document.getElementById('place-modal-overlay');
  if (old) {
    old.remove();
    if (state.modalMapInst) { state.modalMapInst.remove(); state.modalMapInst = null; }
  }
  state.modalPlace = place;
  if (updateUrl !== false && state.slug) {
    history.pushState(null, '', '#' + state.slug + '/' + slugify(place.name));
  }

  var overlay = document.createElement('div');
  overlay.id        = 'place-modal-overlay';
  overlay.className = 'modal-overlay';
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-modal', 'true');
  overlay.setAttribute('aria-labelledby', 'modal-place-name');

  // Güvenli HTML enjeksiyonu: tüm içerik esc() ile sanitize edilmiştir (dosya başı notuna bak)
  var safeHTML = modalInnerHTML(place);
  var frag = document.createRange().createContextualFragment(safeHTML);
  overlay.appendChild(frag);

  document.body.appendChild(overlay);
  document.body.classList.add('modal-open');

  requestAnimationFrame(function() {
    requestAnimationFrame(function() { overlay.classList.add('modal-overlay-visible'); });
  });

  if (place.location && place.location.lat) {
    setTimeout(function() { initModalMap(place); }, 100);
  }
  bindModalEvents(overlay, place);

  var closeBtn = overlay.querySelector('#modal-close');
  if (closeBtn) setTimeout(function() { closeBtn.focus(); }, 60);
}

function closePlaceModal(updateUrl) {
  var overlay = document.getElementById('place-modal-overlay');
  if (!overlay) return;
  overlay.classList.remove('modal-overlay-visible');
  setTimeout(function() {
    if (overlay.parentNode) overlay.remove();
    document.body.classList.remove('modal-open');
    state.modalPlace = null;
    if (state.modalMapInst) { state.modalMapInst.remove(); state.modalMapInst = null; }
  }, 270);
  if (updateUrl !== false && state.slug) {
    history.pushState(null, '', '#' + state.slug);
  }
}

function initModalMap(place) {
  var mapEl = document.getElementById('modal-map');
  if (!mapEl || typeof window.L === 'undefined') return;
  if (!place.location || !place.location.lat) return;
  if (state.modalMapInst) { state.modalMapInst.remove(); state.modalMapInst = null; }
  try {
    var map = L.map('modal-map', { zoomControl: true, scrollWheelZoom: false, attributionControl: false });
    state.modalMapInst = map;
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19 }).addTo(map);
    var color  = MAP_COL[place.category] || '#555';
    var marker = L.marker([place.location.lat, place.location.lng], {
      icon: L.divIcon({
        className: 'map-marker',
        html: '<div class="map-marker-inner" style="background:' + color + ';width:18px;height:18px;border-width:3px"></div>',
        iconSize: [18, 18], iconAnchor: [9, 9], popupAnchor: [0, -12],
      }),
      alt: place.name,
    });
    marker.addTo(map);
    marker.bindPopup('<strong>' + esc(place.name) + '</strong>', { closeButton: false }).openPopup();
    map.setView([place.location.lat, place.location.lng], 15);
  } catch(_) {}
}

function bindModalEvents(overlay, place) {
  var closeBtn = overlay.querySelector('#modal-close');
  if (closeBtn) closeBtn.addEventListener('click', function() { closePlaceModal(); });

  overlay.addEventListener('click', function(e) {
    if (e.target === overlay) closePlaceModal();
  });

  var shareBtn = overlay.querySelector('#modal-share-btn');
  if (shareBtn) {
    shareBtn.addEventListener('click', function() {
      var url = location.origin + location.pathname + '#' + (state.slug || '') + '/' + slugify(place.name);
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(url)
          .then(function() { showToast(t('modal_share_ok')); })
          .catch(function() { fallbackCopy(url); showToast(t('modal_share_ok')); });
      } else {
        fallbackCopy(url);
        showToast(t('modal_share_ok'));
      }
    });
  }

  var favBtn = overlay.querySelector('#modal-fav-btn');
  if (favBtn) {
    favBtn.addEventListener('click', function() {
      var favKey = (state.slug || '') + '__' + slugify(place.name);
      if (state.placeFavs.has(favKey)) {
        state.placeFavs.delete(favKey);
        favBtn.classList.remove('is-fav');
        favBtn.innerHTML = IC.heart;
        favBtn.setAttribute('aria-label', t('place_fav_add'));
      } else {
        state.placeFavs.add(favKey);
        favBtn.classList.add('is-fav');
        favBtn.innerHTML = IC.heartFill;
        favBtn.setAttribute('aria-label', t('place_fav_rm'));
      }
      savePlaceFavs();
    });
  }
}

function bindPlaceCardClicks(container) {
  if (!container) return;
  container.querySelectorAll('.place-card-clickable[data-place-name]').forEach(function(card) {
    card.addEventListener('click', function(e) {
      if (e.target.closest('a, .chip-tag')) return;
      var placeName = card.dataset.placeName;
      var place = state.cityData && state.cityData.places.find(function(p) { return p.name === placeName; });
      if (place) openPlaceModal(place);
    });
    card.addEventListener('keydown', function(e) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        var placeName = card.dataset.placeName;
        var place = state.cityData && state.cityData.places.find(function(p) { return p.name === placeName; });
        if (place) openPlaceModal(place);
      }
    });
  });
}

// ── 13. Favoriler Paylaş ──────────────────────────────────────────────

function shareFavorites() {
  var slugs = Array.from(state.favorites).join(',');
  var url   = location.origin + location.pathname + '#?favs=' + slugs;

  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(url)
      .then(function() { showToast(t('favs_copied')); })
      .catch(function() { fallbackCopy(url); });
  } else {
    fallbackCopy(url);
  }
}

function fallbackCopy(text) {
  var el = document.createElement('textarea');
  el.value = text;
  el.style.cssText = 'position:fixed;top:-999px;left:-999px';
  document.body.appendChild(el);
  el.select();
  try { document.execCommand('copy'); showToast(t('favs_copied')); } catch (_) {}
  el.remove();
}

function loadSharedFavs() {
  var hash = location.hash;
  if (hash.indexOf('?favs=') === -1) return false;
  var favsParam = hash.split('?favs=')[1] || '';
  favsParam.split(',').filter(Boolean).forEach(function(slug) { state.favorites.add(slug); });
  saveFavs();
  return true;
}

// ── 13. Toast ─────────────────────────────────────────────────────────

function showToast(msg) {
  var old = document.querySelector('.toast');
  if (old) old.remove();
  var toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = msg;
  toast.setAttribute('role', 'status');
  toast.setAttribute('aria-live', 'polite');
  document.body.appendChild(toast);
  requestAnimationFrame(function() {
    requestAnimationFrame(function() { toast.classList.add('toast-show'); });
  });
  setTimeout(function() {
    toast.classList.remove('toast-show');
    setTimeout(function() { toast.remove(); }, 300);
  }, 2500);
}

// ── 14. Router ────────────────────────────────────────────────────────

async function router() {
  var raw  = location.hash.slice(1);
  var hash = raw.split('?')[0];

  if (raw.indexOf('?favs=') === 0) {
    loadSharedFavs();
    location.hash = '';
    return;
  }

  // #cityslug/placeslug → şehir detayı + yer modalı
  var slashIdx = hash.indexOf('/');
  if (slashIdx !== -1) {
    var citySlug  = hash.slice(0, slashIdx);
    var placeSlug = hash.slice(slashIdx + 1);
    if (citySlug && placeSlug) {
      // Açık modal varsa hemen temizle
      var oldM = document.getElementById('place-modal-overlay');
      if (oldM) {
        oldM.remove();
        document.body.classList.remove('modal-open');
        if (state.modalMapInst) { state.modalMapInst.remove(); state.modalMapInst = null; }
        state.modalPlace = null;
      }
      // Şehri yükle (zaten yüklüyse tekrar yükleme)
      if (state.slug !== citySlug || !state.cityData) {
        state.slug       = citySlug;
        state.category   = 'all';
        state.activeTags = new Set();
        await renderCityDetail();
      }
      // Yeri bul ve modalı aç
      if (state.cityData) {
        var target = null;
        for (var pi = 0; pi < state.cityData.places.length; pi++) {
          if (slugify(state.cityData.places[pi].name) === placeSlug) {
            target = state.cityData.places[pi]; break;
          }
        }
        if (target) openPlaceModal(target, false);
      }
      return;
    }
  }

  // Modal açıksa kapat (city URL'e geri döndük)
  var oldM2 = document.getElementById('place-modal-overlay');
  if (oldM2) {
    oldM2.remove();
    document.body.classList.remove('modal-open');
    if (state.modalMapInst) { state.modalMapInst.remove(); state.modalMapInst = null; }
    state.modalPlace = null;
  }

  if (hash && hash !== '/') {
    state.slug       = hash;
    state.category   = 'all';
    state.activeTags = new Set();
    await renderCityDetail();
  } else {
    state.slug     = null;
    state.cityData = null;
    if (state.mapInstance) {
      state.mapInstance.remove();
      state.mapInstance = null;
    }
    renderCityList();
  }
}

// ── 15. Başlangıç ─────────────────────────────────────────────────────

async function init() {
  var logoIconEl = document.getElementById('logo-icon');
  if (logoIconEl) logoIconEl.innerHTML = IC.compass;

  applyTheme();
  applyLang();

  var themeBtn = document.getElementById('btn-theme');
  if (themeBtn) themeBtn.addEventListener('click', toggleTheme);

  var langBtn = document.getElementById('btn-lang');
  if (langBtn) langBtn.addEventListener('click', toggleLang);

  // ⌘K / Ctrl+K → search odağı  |  ESC → modal kapat
  document.addEventListener('keydown', function(e) {
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault();
      var inp = document.getElementById('search-input');
      if (inp) { inp.focus(); inp.select(); }
    }
    if (e.key === 'Escape') { closePlaceModal(); }
  });

  // Tarayıcı geri butonu → modal kapat
  window.addEventListener('popstate', function() {
    var h = location.hash.slice(1).split('?')[0];
    if (h.indexOf('/') === -1) {
      var ov = document.getElementById('place-modal-overlay');
      if (ov) {
        ov.classList.remove('modal-overlay-visible');
        setTimeout(function() {
          if (ov.parentNode) ov.remove();
          document.body.classList.remove('modal-open');
          state.modalPlace = null;
          if (state.modalMapInst) { state.modalMapInst.remove(); state.modalMapInst = null; }
        }, 270);
      }
    }
  });

  // Paylaşılan favori URL'si var mı?
  if (location.hash.indexOf('#?favs=') === 0) {
    loadSharedFavs();
    location.hash = '';
  }

  // Şehirleri yükle
  try {
    state.cities = await fetchJSON(CITIES_URL);
  } catch (err) {
    document.getElementById('main').innerHTML =
      '<p class="empty-state">' + esc(t('load_err')) + esc(err.message) + '</p>';
    return;
  }

  await router();
  window.addEventListener('hashchange', router);

  // Arka planda mekan sayılarını getir
  state.cities.forEach(function(city) {
    if (city.placeCount == null) {
      fetchJSON(city.data).then(function(data) {
        city.placeCount = data.places.length;
        if (!state.slug) {
          var countEl = document.querySelector('.city-card[data-slug="' + city.slug + '"] .city-count');
          if (countEl) countEl.innerHTML = IC.mapPin + ' ' + esc(t('places_count', city.placeCount));
        }
      }).catch(function() { city.placeCount = '?'; });
    }
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
