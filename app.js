"use strict";

/*
 * Seyyah — app.js
 * Vanilla JS SPA — no framework, no build step.
 *
 * SECURITY NOTE:
 * All JSON data comes exclusively from local files under our control.
 * Dynamic content is passed through esc() before being rendered;
 * that function converts &, <, >, ", ' to their HTML entities.
 * innerHTML usage is intentional; XSS safety is ensured by esc().
 */

// ── 1. Constants ─────────────────────────────────────────────────────
const CITIES_URL = "data/cities.json";
const LS_LANG = "seyyah-lang";
const LS_THEME = "seyyah-theme";
const LS_FAVS = "seyyah-favs";
const LS_PLACE_FAVS = "seyyah-place-favs";
const LS_PLAN = "seyyah-plan";
const LS_VISITS = "seyyah-visits";
const LS_SEARCH_HIST = "seyyah-search-hist";
const LS_STATS_OPEN = "seyyah-stats-open";
const MAX_HIST = 5;

// Region colour palettes — used for city card gradient backgrounds (no external images)
const REGION_PALETTE = {
  "Marmara":              { from: "#8B3A2A", to: "#3D1610" }, // brick red
  "İç Anadolu":           { from: "#8A6230", to: "#3D2B10" }, // earthy sand
  "Ege":                  { from: "#1A5F8A", to: "#0A2E45" }, // Mediterranean blue
  "Güneydoğu Anadolu":    { from: "#A05C18", to: "#4A2708" }, // spice amber
  "Karadeniz":            { from: "#1F6B3E", to: "#0A3020" }, // forest green
  "Akdeniz":              { from: "#1A7A6E", to: "#0A3A35" }, // teal
  "Doğu Anadolu":         { from: "#6B3A8A", to: "#2E1040" }, // purple
};

// Category colour palettes — used for modal banner gradient backgrounds
const CAT_BANNER_PALETTE = {
  yemek: { from: "#9B3020", to: "#4A1410" }, // coral/red
  cami:  { from: "#0F6648", to: "#063324" }, // teal/green
  muze:  { from: "#5B2EA6", to: "#2C1550" }, // purple
  gezi:  { from: "#8A5518", to: "#3D2408" }, // amber
};

// City centres — used for nearest-city calculation (slug → [lat, lng])
const CITY_CENTERS = {
  istanbul: [41.0082, 28.9784],
  ankara: [39.9334, 32.8597],
  izmir: [38.4192, 27.1287],
  konya: [37.8667, 32.4833],
  trabzon: [41.0027, 39.7168],
  gaziantep: [37.0594, 37.3825],
};

// ── 2. State ─────────────────────────────────────────────────────────
const state = {
  cities: [],
  cityData: null,
  slug: null,
  category: "all",
  search: "",
  region: "all",
  activeTags: new Set(),
  favorites: new Set(JSON.parse(localStorage.getItem(LS_FAVS) || "[]")),
  lang: localStorage.getItem(LS_LANG) || "tr",
  theme: localStorage.getItem(LS_THEME) || "light",
  mapInstance: null,
  mapMarkers: {},
  modalPlace: null,
  modalMapInst: null,
  placeFavs: new Set(JSON.parse(localStorage.getItem(LS_PLACE_FAVS) || "[]")),
  plan: JSON.parse(localStorage.getItem(LS_PLAN) || "[]"),
  visits: JSON.parse(localStorage.getItem(LS_VISITS) || "{}"),
  sortBy: "default",
  openOnly: false,
  userLat: null,
  userLng: null,
  allPlaces: [],
  allPlacesLoaded: false,
  // Focus management: element that last triggered modal / plan drawer
  _modalTrigger: null,
  _planDrawerTrigger: null,
};

// ── 3. Translations ──────────────────────────────────────────────────
const STRINGS = {
  tr: {
    tagline: "Türkiye'nin şehirlerini keşfet",
    search_ph: "Şehir veya mekan ara…",
    all_regions: "Tümü",
    regions: {
      Marmara: "Marmara",
      "İç Anadolu": "İç Anadolu",
      Ege: "Ege",
      "Güneydoğu Anadolu": "Güneydoğu Anadolu",
      Karadeniz: "Karadeniz",
      Akdeniz: "Akdeniz",
      "Doğu Anadolu": "Doğu Anadolu",
    },
    cats: {
      all: "Hepsi",
      yemek: "Yemek",
      cami: "Cami",
      muze: "Müze",
      gezi: "Gezilecek",
    },
    places_count: (n) => n + " mekan",
    must_eat: "Meşhuru:",
    directions: "Yol tarifi",
    open_hours: "Açık:",
    back: "Tüm şehirler",
    no_results: "Sonuç bulunamadı.",
    no_places: "Bu kategoride mekan yok.",
    fav_add: "Favorilere ekle",
    fav_remove: "Favorilerden çıkar",
    share_favs: "Favorileri paylaş",
    favs_copied: "Link panoya kopyalandı!",
    favs_title: "Favorilerim",
    map_unavail:
      "Harita için vendor/leaflet/ klasörüne Leaflet ekleyin. → leafletjs.com/download.html",
    price: (n) => "₺".repeat(n),
    filter_tags: "Etiket:",
    clear_tags: "Temizle",
    lang_switch: "EN",
    theme_light: "Açık temaya geç",
    theme_dark: "Karanlık temaya geç",
    map_legend: "Haritada gösterilen mekanlar",
    share_label: "Paylaş",
    load_err: "Veri yüklenemedi: ",
    no_coord: "Koordinat bilgisi olan mekan bulunamadı.",
    map_route: "Rotayı Göster",
    map_route_n: (n) => n + " mekan",
    plan_add: "Plana Ekle",
    plan_remove: "Plandan Çıkar",
    plan_added: "Plana eklendi!",
    plan_removed: "Plandan çıkarıldı",
    plan_share_ok: "Plan linki kopyalandı!",
    plan_empty: "Henüz mekan eklenmedi.",
    plan_title: "Gezi Planım",
    plan_clear: "Temizle",
    plan_route: "Google Maps Rotası",
    plan_share: "Planı Paylaş",
    modal_close: "Kapat",
    modal_share: "Linki Kopyala",
    modal_share_ok: "Mekan linki kopyalandı!",
    modal_plan: "Gezi Planına Ekle",
    place_fav_add: "Mekanı favorile",
    place_fav_rm: "Favoriden çıkar",
    visit_mark: "Ziyaret Ettim",
    visit_unmark: "Ziyareti Sil",
    visit_done: "Ziyaret Edildi ✓",
    visit_date: "Tarih:",
    visit_note_ph: "Notun… (isteğe bağlı)",
    visit_progress: function (v, tot) {
      return v + " / " + tot + " ziyaret edildi";
    },
    visit_none: "Henüz ziyaret yok",
    sort_label: "Sırala",
    sort_default: "Varsayılan",
    sort_name: "A → Z",
    sort_price: "Fiyat ↑",
    sort_open: "Şu an açık",
    sort_nearby: "Yakınlar",
    nearby_btn: "Konumu Al",
    nearby_got: "Konum alındı ✓",
    nearby_getting: "Konum alınıyor…",
    nearby_denied: "Konum izni reddedildi.",
    nearby_unsup: "Tarayıcın konum desteği yok.",
    nearby_label: "En yakın:",
    nearby_city: function (c, km) {
      return c + " · " + km + " km uzakta";
    },
    open_now: "Açık",
    closed_now: "Kapalı",
    open_unknown: "",
    open_only_btn: "Sadece açıklar",
    season_title: "En İyi Dönem",
    season_good: "İdeal",
    season_ok: "Uygun",
    season_avoid: "Kaçın",
    season_hint: {
      good: "Ziyaret için ideal ay",
      ok: "Ziyaret için uygun ay",
      avoid: "Daha iyi zamanlar var",
    },
    acc_title: "Erişilebilirlik",
    acc_wheelchair: "Tekerlekli Sandalye",
    acc_elevator: "Asansör",
    acc_toilet: "Engelli Tuvaleti",
    acc_audio: "Sesli Rehber",
    acc_yes: "Mevcut",
    acc_no: "Mevcut değil",
    acc_unknown: "Bilgi yok",
    similar_title: "Şunlara da bak",
    stats_title: "Gezgin Profilim",
    stats_visited: "Ziyaret",
    stats_fav: "Fav. Şehir",
    stats_plan: "Plan",
    stats_progress: "Genel ilerleme",
    stats_top: "En çok:",
    stats_empty: "Henüz veri yok. Şehirleri keşfet, mekanları ziyaret et!",
    search_clear: "Aramayı temizle",
    region_filter: "Bölgeye göre filtrele",
    cat_filter: "Kategoriye göre filtrele",
    visit_note_label: "Ziyaret notun",
    plan_move_up: "Yukarı taşı",
    plan_move_down: "Aşağı taşı",
    hist_remove: "Geçmişten sil",
    map_region_label: "Haritadaki mekanlar",
  },
  en: {
    tagline: "Discover Turkey's cities",
    search_ph: "Search city or place…",
    all_regions: "All",
    regions: {
      Marmara: "Marmara",
      "İç Anadolu": "Central Anatolia",
      Ege: "Aegean",
      "Güneydoğu Anadolu": "Southeast Anatolia",
      Karadeniz: "Black Sea",
      Akdeniz: "Mediterranean",
      "Doğu Anadolu": "Eastern Anatolia",
    },
    cats: {
      all: "All",
      yemek: "Food",
      cami: "Mosque",
      muze: "Museum",
      gezi: "Sights",
    },
    places_count: (n) => n + " place" + (n !== 1 ? "s" : ""),
    must_eat: "Must try:",
    directions: "Directions",
    open_hours: "Open:",
    back: "All cities",
    no_results: "No results found.",
    no_places: "No places in this category.",
    fav_add: "Add to favorites",
    fav_remove: "Remove from favorites",
    share_favs: "Share favorites",
    favs_copied: "Link copied to clipboard!",
    favs_title: "My Favorites",
    map_unavail:
      "Add Leaflet to vendor/leaflet/ to enable the map. → leafletjs.com/download.html",
    price: (n) => "₺".repeat(n),
    filter_tags: "Tags:",
    clear_tags: "Clear",
    lang_switch: "TR",
    theme_light: "Switch to light mode",
    theme_dark: "Switch to dark mode",
    map_legend: "Places shown on map",
    share_label: "Share",
    load_err: "Failed to load data: ",
    no_coord: "No places with coordinates found.",
    map_route: "Show Route",
    map_route_n: (n) => n + " place" + (n !== 1 ? "s" : ""),
    plan_add: "Add to Plan",
    plan_remove: "Remove from Plan",
    plan_added: "Added to plan!",
    plan_removed: "Removed from plan",
    plan_share_ok: "Plan link copied!",
    plan_empty: "No places added yet.",
    plan_title: "My Trip Plan",
    plan_clear: "Clear",
    plan_route: "Google Maps Route",
    plan_share: "Share Plan",
    modal_close: "Close",
    modal_share: "Copy Link",
    modal_share_ok: "Place link copied!",
    modal_plan: "Add to Plan",
    place_fav_add: "Save place",
    place_fav_rm: "Unsave place",
    visit_mark: "Mark as Visited",
    visit_unmark: "Remove Visit",
    visit_done: "Visited ✓",
    visit_date: "Date:",
    visit_note_ph: "Your notes… (optional)",
    visit_progress: function (v, tot) {
      return v + " of " + tot + " visited";
    },
    visit_none: "Not visited yet",
    sort_label: "Sort",
    sort_default: "Default",
    sort_name: "A → Z",
    sort_price: "Price ↑",
    sort_open: "Open now",
    sort_nearby: "Nearby",
    nearby_btn: "Use My Location",
    nearby_got: "Location set ✓",
    nearby_getting: "Getting location…",
    nearby_denied: "Location permission denied.",
    nearby_unsup: "Geolocation not supported.",
    nearby_label: "Nearest:",
    nearby_city: function (c, km) {
      return c + " · " + km + " km away";
    },
    open_now: "Open",
    closed_now: "Closed",
    open_unknown: "",
    open_only_btn: "Open now only",
    season_title: "Best Time to Visit",
    season_good: "Ideal",
    season_ok: "Fair",
    season_avoid: "Avoid",
    season_hint: {
      good: "Ideal month to visit",
      ok: "Fair time to visit",
      avoid: "Consider another time",
    },
    acc_title: "Accessibility",
    acc_wheelchair: "Wheelchair Access",
    acc_elevator: "Elevator",
    acc_toilet: "Accessible Toilet",
    acc_audio: "Audio Guide",
    acc_yes: "Available",
    acc_no: "Not available",
    acc_unknown: "Unknown",
    similar_title: "You might also like",
    stats_title: "My Travel Profile",
    stats_visited: "Visited",
    stats_fav: "Fav. City",
    stats_plan: "Plan",
    stats_progress: "Overall progress",
    stats_top: "Most visited:",
    stats_empty: "No data yet. Explore cities and mark places as visited!",
    search_clear: "Clear search",
    region_filter: "Filter by region",
    cat_filter: "Filter by category",
    visit_note_label: "Your visit notes",
    plan_move_up: "Move up",
    plan_move_down: "Move down",
    hist_remove: "Remove from history",
    map_region_label: "Places shown on map",
  },
};

function t(key, ...args) {
  const val = key.split(".").reduce((o, k) => o && o[k], STRINGS[state.lang]);
  if (typeof val === "function") return val(...args);
  return val != null ? val : key;
}

// ── 4. SVG Icons ─────────────────────────────────────────────────────
function svg(paths, size) {
  size = size || 16;
  return (
    '<svg xmlns="http://www.w3.org/2000/svg" width="' +
    size +
    '" height="' +
    size +
    '" ' +
    'viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" ' +
    'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
    paths +
    "</svg>"
  );
}

const IC = {
  compass: svg(
    '<circle cx="12" cy="12" r="10"/><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/>',
  ),
  search: svg(
    '<circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>',
  ),
  mapPin: svg(
    '<path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/>',
  ),
  arrowLeft: svg('<path d="m12 19-7-7 7-7"/><path d="M19 12H5"/>'),
  moon: svg('<path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9z"/>'),
  sun: svg(
    '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/>',
  ),
  heart: svg(
    '<path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>',
  ),
  heartFill: svg(
    '<path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" fill="currentColor"/>',
  ),
  globe: svg(
    '<circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>',
  ),
  share: svg(
    '<path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/>',
  ),
  xMark: svg(
    '<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>',
  ),
  clock: svg(
    '<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>',
  ),
  extLink: svg(
    '<path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>',
  ),
  utensils: svg(
    '<path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"/><path d="M7 2v20"/><path d="M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7"/>',
  ),
  mosque: svg(
    '<path d="M2 22h20"/><path d="M12 2c0 0-4 3-4 8h8c0-5-4-8-4-8z"/><rect x="4" y="10" width="16" height="12"/>',
  ),
  landmark: svg(
    '<line x1="3" y1="22" x2="21" y2="22"/><line x1="6" y1="18" x2="6" y2="11"/><line x1="10" y1="18" x2="10" y2="11"/><line x1="14" y1="18" x2="14" y2="11"/><line x1="18" y1="18" x2="18" y2="11"/><polygon points="12 2 20 7 4 7"/>',
  ),
  bino: svg(
    '<circle cx="8.5" cy="13" r="4"/><circle cx="15.5" cy="13" r="4"/><path d="M1 13h4M19 13h4M8.5 9V7M15.5 9V7M10.5 13h3"/>',
  ),
  tag: svg(
    '<path d="M12 2H2v10l9.29 9.29c.94.94 2.48.94 3.42 0l6.58-6.58c.94-.94.94-2.48 0-3.42L12 2Z"/><path d="M7 7h.01"/>',
  ),
  link: svg(
    '<path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>',
  ),
  plan: svg(
    '<rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/><line x1="9" y1="16" x2="15" y2="16"/><line x1="12" y1="13" x2="12" y2="19"/>',
  ),
  check: svg('<polyline points="20 6 9 17 4 12"/>'),
  locate: svg(
    '<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3"/>',
  ),
};

const CAT_IC = {
  yemek: IC.utensils,
  cami: IC.mosque,
  muze: IC.landmark,
  gezi: IC.bino,
};
const MAP_COL = {
  yemek: "#c0392b",
  cami: "#27ae60",
  muze: "#8e44ad",
  gezi: "#e67e22",
};

// ── 5. Helpers ───────────────────────────────────────────────────────

// All dynamic content passes through this function (XSS prevention)
function esc(s) {
  return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
    return {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    }[c];
  });
}

function mapsUrl(lat, lng) {
  return (
    "https://www.google.com/maps/dir/?api=1&destination=" + lat + "," + lng
  );
}

function slugify(str) {
  return String(str == null ? "" : str)
    .toLowerCase()
    .replace(/ğ/g, "g")
    .replace(/ü/g, "u")
    .replace(/ş/g, "s")
    .replace(/ı/g, "i")
    .replace(/ö/g, "o")
    .replace(/ç/g, "c")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function saveFavs() {
  localStorage.setItem(LS_FAVS, JSON.stringify(Array.from(state.favorites)));
}

function savePlaceFavs() {
  localStorage.setItem(
    LS_PLACE_FAVS,
    JSON.stringify(Array.from(state.placeFavs)),
  );
}

function saveVisits() {
  localStorage.setItem(LS_VISITS, JSON.stringify(state.visits));
}

function isVisited(key) {
  return !!state.visits[key];
}

function markVisited(key, date, note) {
  state.visits[key] = {
    date: date || new Date().toISOString().slice(0, 10),
    note: note !== undefined ? note : "",
  };
  saveVisits();
}

function unmarkVisited(key) {
  delete state.visits[key];
  saveVisits();
}

function getVisitProgress() {
  if (!state.cityData) return { visited: 0, total: 0, pct: 0 };
  var total = state.cityData.places.length;
  var slug = state.slug || "";
  var visited = state.cityData.places.filter(function (p) {
    return isVisited(slug + "__" + slugify(p.name));
  }).length;
  return {
    visited: visited,
    total: total,
    pct: total ? Math.round((visited / total) * 100) : 0,
  };
}

// Update visited badge on existing place cards (without re-rendering while modal is open)
function updateVisitedCards() {
  if (!state.cityData) return;
  var slug = state.slug || "";
  state.cityData.places.forEach(function (p) {
    var key = slug + "__" + slugify(p.name);
    var visited = isVisited(key);
    document
      .querySelectorAll(".place-card[data-place-name]")
      .forEach(function (card) {
        if (card.dataset.placeName !== p.name) return;
        card.classList.toggle("place-visited", visited);
        var existing = card.querySelector(".visited-badge");
        if (visited && !existing) {
          var badge = document.createElement("span");
          badge.className = "visited-badge";
          badge.setAttribute("aria-label", t("visit_done"));
          badge.textContent = "✓";
          card.style.position = card.style.position || "";
          var body = card.querySelector(".place-card-body");
          if (body) body.insertBefore(badge, body.firstChild);
        } else if (!visited && existing) {
          existing.remove();
        }
      });
  });
  updateCityProgress();
}

// Update the progress bar on the city detail page
function updateCityProgress() {
  var bar = document.getElementById("city-progress");
  if (!bar) return;
  var prog = getVisitProgress();
  var fill = bar.querySelector(".progress-fill");
  var text = bar.querySelector(".progress-text");
  var pct = bar.querySelector(".progress-pct");
  if (fill) fill.style.width = prog.pct + "%";
  if (text) text.textContent = t("visit_progress", prog.visited, prog.total);
  if (pct) pct.textContent = prog.pct + "%";
}

// ── 5b. Season Calendar ─────────────────────────────────────────────

var MONTH_KEYS = [
  "jan",
  "feb",
  "mar",
  "apr",
  "may",
  "jun",
  "jul",
  "aug",
  "sep",
  "oct",
  "nov",
  "dec",
];
var MONTHS_TR = [
  "Oca",
  "Şub",
  "Mar",
  "Nis",
  "May",
  "Haz",
  "Tem",
  "Ağu",
  "Eyl",
  "Eki",
  "Kas",
  "Ara",
];
var MONTHS_EN = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

// Full 12-month calendar (city detail page)
function buildSeasonCalendar(seasons) {
  if (!seasons) return "";
  var now = new Date();
  var curMo = now.getMonth(); // 0-based
  var months = state.lang === "tr" ? MONTHS_TR : MONTHS_EN;

  var cells = MONTH_KEYS.map(function (key, i) {
    var val = seasons[key] || "ok";
    var isCur = i === curMo;
    return (
      '<div class="season-cell season-' +
      esc(val) +
      (isCur ? " season-current" : "") +
      '"' +
      ' title="' +
      esc(months[i]) +
      '">' +
      '<span class="season-month-label">' +
      esc(months[i]) +
      "</span>" +
      '<span class="season-dot" aria-hidden="true"></span>' +
      "</div>"
    );
  }).join("");

  var noteHTML = seasons.note
    ? '<p class="season-note">' + esc(seasons.note) + "</p>"
    : "";

  return (
    '<section class="season-calendar" aria-label="' +
    esc(t("season_title")) +
    '">' +
    '<div class="season-header">' +
    '<span class="season-title">' +
    IC.compass +
    " " +
    esc(t("season_title")) +
    "</span>" +
    '<div class="season-legend">' +
    '<span class="season-legend-item"><span class="season-dot season-good"></span>' +
    esc(t("season_good")) +
    "</span>" +
    '<span class="season-legend-item"><span class="season-dot season-ok"></span>' +
    esc(t("season_ok")) +
    "</span>" +
    '<span class="season-legend-item"><span class="season-dot season-avoid"></span>' +
    esc(t("season_avoid")) +
    "</span>" +
    "</div></div>" +
    '<div class="season-grid">' +
    cells +
    "</div>" +
    noteHTML +
    "</section>"
  );
}

// Compact month strip (place modal)
function buildSeasonCompact(seasons) {
  if (!seasons) return "";
  var now = new Date();
  var curMo = now.getMonth();
  var key = MONTH_KEYS[curMo];
  var val = seasons[key] || "ok";
  var months = state.lang === "tr" ? MONTHS_TR : MONTHS_EN;
  var hint = t("season_hint." + val);
  return (
    '<div class="season-compact season-compact-' +
    esc(val) +
    '">' +
    '<span class="season-compact-dot" aria-hidden="true"></span>' +
    "<span>" +
    esc(months[curMo]) +
    " — " +
    esc(hint) +
    "</span>" +
    "</div>"
  );
}

// Accessibility strip (place modal)
function buildAccessibilityStrip(acc) {
  if (!acc) return "";
  var fields = [
    { key: "wheelchair", labelKey: "acc_wheelchair" },
    { key: "elevator", labelKey: "acc_elevator" },
    { key: "accessibleToilet", labelKey: "acc_toilet" },
    { key: "audioGuide", labelKey: "acc_audio" },
  ];
  // Hide if no field has a defined value
  var hasAny = fields.some(function (f) {
    return acc[f.key] !== undefined;
  });
  if (!hasAny) return "";

  var items = fields
    .map(function (f) {
      var val = acc[f.key];
      var cls = val === true ? "acc-yes" : val === false ? "acc-no" : "acc-unk";
      var mark = val === true ? "✓" : val === false ? "✗" : "?";
      var tip =
        val === true
          ? t("acc_yes")
          : val === false
            ? t("acc_no")
            : t("acc_unknown");
      return (
        '<div class="acc-item ' +
        esc(cls) +
        '">' +
        '<span class="acc-mark" aria-hidden="true">' +
        esc(mark) +
        "</span>" +
        '<span class="acc-label-text">' +
        esc(t(f.labelKey)) +
        "</span>" +
        "</div>"
      );
    })
    .join("");

  return (
    '<div class="accessibility-strip">' +
    '<span class="accessibility-title">' +
    IC.check +
    " " +
    esc(t("acc_title")) +
    "</span>" +
    '<div class="acc-grid">' +
    items +
    "</div>" +
    "</div>"
  );
}

// Similarity score: same category +3, each shared tag +1
function getSimilarPlaces(place, max) {
  if (!state.cityData) return [];
  max = max || 3;
  var placeTags = place.tags || [];
  return state.cityData.places
    .filter(function (p) {
      return p.name !== place.name;
    })
    .map(function (p) {
      var score = p.category === place.category ? 3 : 0;
      (p.tags || []).forEach(function (tag) {
        if (placeTags.indexOf(tag) !== -1) score += 1;
      });
      return { place: p, score: score };
    })
    .filter(function (item) {
      return item.score > 0;
    })
    .sort(function (a, b) {
      return b.score - a.score;
    })
    .slice(0, max)
    .map(function (item) {
      return item.place;
    });
}

// Similar places horizontal strip
function buildSimilarPlacesHTML(place) {
  var similar = getSimilarPlaces(place, 3);
  if (!similar.length) return "";

  var placeTags = place.tags || [];
  var cards = similar
    .map(function (p) {
      // Show at most 2 shared tags
      var commonTags = (p.tags || [])
        .filter(function (tag) {
          return placeTags.indexOf(tag) !== -1;
        })
        .slice(0, 2);
      var tagsH = commonTags
        .map(function (tag) {
          return '<span class="similar-tag">' + esc(tag) + "</span>";
        })
        .join("");
      return (
        '<button class="similar-card" data-place-name="' +
        esc(p.name) +
        '" ' +
        'aria-label="' +
        esc(p.name) +
        '">' +
        '<div class="similar-card-cat">' +
        (CAT_IC[p.category] || "") +
        " " +
        esc(t("cats." + p.category)) +
        "</div>" +
        '<div class="similar-card-name">' +
        esc(p.name) +
        "</div>" +
        (tagsH ? '<div class="similar-card-tags">' + tagsH + "</div>" : "") +
        "</button>"
      );
    })
    .join("");

  return (
    '<div class="similar-section">' +
    '<div class="similar-title">' +
    IC.bino +
    " " +
    esc(t("similar_title")) +
    "</div>" +
    '<div class="similar-scroll">' +
    cards +
    "</div>" +
    "</div>"
  );
}

// ── 6. Theme & Language ──────────────────────────────────────────────

function applyTheme() {
  document.documentElement.setAttribute("data-theme", state.theme);
  var isDark = state.theme === "dark";
  var iconEl = document.getElementById("theme-icon");
  var btnEl = document.getElementById("btn-theme");
  if (iconEl) iconEl.innerHTML = isDark ? IC.sun : IC.moon;
  if (btnEl)
    btnEl.setAttribute(
      "aria-label",
      isDark ? t("theme_light") : t("theme_dark"),
    );
}

function toggleTheme() {
  state.theme = state.theme === "light" ? "dark" : "light";
  localStorage.setItem(LS_THEME, state.theme);
  applyTheme();
}

function applyLang() {
  document.documentElement.lang = state.lang;
  var labelEl = document.getElementById("lang-label");
  var taglineEl = document.getElementById("logo-tagline");
  if (labelEl) labelEl.textContent = t("lang_switch");
  if (taglineEl) taglineEl.textContent = t("tagline");
}

function toggleLang() {
  state.lang = state.lang === "tr" ? "en" : "tr";
  localStorage.setItem(LS_LANG, state.lang);
  applyLang();
  if (state.slug) renderCityDetail();
  else renderCityList();
}

// ── 7. Data Fetching ─────────────────────────────────────────────────

function fetchJSON(url) {
  return fetch(url).then(function (res) {
    if (!res.ok) throw new Error("HTTP " + res.status + ": " + url);
    return res.json();
  });
}

// ── 8. Skeleton ──────────────────────────────────────────────────────

function skeletonCityCard() {
  return (
    '<div class="city-card skeleton" aria-hidden="true">' +
    '<div class="city-card-img"></div>' +
    '<div class="city-card-body">' +
    '<div class="skel-line skel-title"></div>' +
    '<div class="skel-line skel-desc"></div>' +
    '<div class="skel-line skel-short"></div>' +
    "</div></div>"
  );
}

function skeletonPlaceCard() {
  return (
    '<div class="place-card skeleton" aria-hidden="true">' +
    '<div class="skel-line skel-title"></div>' +
    '<div class="skel-line skel-desc"></div>' +
    '<div class="skel-line skel-short"></div>' +
    "</div>"
  );
}

// ── 8b. Stats Panel ──────────────────────────────────────────────────

function getTopCity() {
  var counts = {};
  Object.keys(state.visits).forEach(function (key) {
    var slug = key.split("__")[0];
    counts[slug] = (counts[slug] || 0) + 1;
  });
  var top = null,
    max = 0;
  Object.keys(counts).forEach(function (slug) {
    if (counts[slug] > max) {
      max = counts[slug];
      top = slug;
    }
  });
  if (!top) return null;
  var city = state.cities.find(function (c) {
    return c.slug === top;
  });
  return city ? { city: city, count: max } : null;
}

function getCategoryStats() {
  if (!state.allPlacesLoaded) return null;
  var counts = {};
  Object.keys(state.visits).forEach(function (key) {
    var parts = key.split("__");
    var cSlug = parts[0];
    var pSlug = parts[1];
    var found = state.allPlaces.find(function (p) {
      return p.citySlug === cSlug && slugify(p.name) === pSlug;
    });
    if (found && found.category) {
      counts[found.category] = (counts[found.category] || 0) + 1;
    }
  });
  return Object.keys(counts).length ? counts : null;
}

function buildStatsPanel() {
  var totalVisited = Object.keys(state.visits).length;
  var isEmpty =
    totalVisited === 0 && state.favorites.size === 0 && state.plan.length === 0;
  // Default closed when there is no data yet; respect saved preference otherwise
  var savedPref = localStorage.getItem(LS_STATS_OPEN);
  var isOpen = isEmpty ? false : (savedPref !== "false");

  // If there are visits, load allPlaces in background (for category stats)
  if (totalVisited > 0 && !state.allPlacesLoaded) loadAllPlaces();

  // Counters
  var countersHTML =
    '<div class="stats-counters">' +
    '<div class="stats-counter"><span class="stats-num">' +
    esc(String(totalVisited)) +
    "</span>" +
    '<span class="stats-lbl">' +
    esc(t("stats_visited")) +
    "</span></div>" +
    '<div class="stats-counter"><span class="stats-num">' +
    esc(String(state.favorites.size)) +
    "</span>" +
    '<span class="stats-lbl">' +
    esc(t("stats_fav")) +
    "</span></div>" +
    '<div class="stats-counter"><span class="stats-num">' +
    esc(String(state.plan.length)) +
    "</span>" +
    '<span class="stats-lbl">' +
    esc(t("stats_plan")) +
    "</span></div>" +
    "</div>";

  // Overall progress — placeCount loaded in background; skip bar if zero
  var totalPlaces = state.cities.reduce(function (s, c) {
    return s + (c.placeCount || 0);
  }, 0);
  var overallPct =
    totalPlaces > 0 ? Math.round((totalVisited / totalPlaces) * 100) : 0;
  var progressHTML =
    totalPlaces > 0
      ? '<div class="stats-progress-row">' +
        '<span class="stats-progress-label">' +
        esc(t("stats_progress")) +
        "</span>" +
        '<span class="stats-progress-pct">' +
        esc(String(overallPct)) +
        "%</span>" +
        "</div>" +
        '<div class="stats-bar" role="progressbar" aria-valuenow="' +
        esc(String(Math.min(overallPct, 100))) +
        '" aria-valuemin="0" aria-valuemax="100" aria-label="' +
        esc(t("stats_progress")) +
        '"><div class="stats-bar-fill" style="width:' +
        esc(String(Math.min(overallPct, 100))) +
        '%"></div></div>'
      : "";

  // Most visited city
  var topCity = getTopCity();
  var topCityHTML = topCity
    ? '<div class="stats-top-city">' +
      '<span class="stats-top-label">' +
      esc(t("stats_top")) +
      "</span>" +
      ' <span class="stats-top-name">' +
      esc(topCity.city.city) +
      "</span>" +
      '<span class="stats-top-count">' +
      IC.check +
      " " +
      esc(String(topCity.count)) +
      "</span>" +
      "</div>"
    : "";

  // Category breakdown (only if allPlaces is loaded)
  var catStats = getCategoryStats();
  var catHTML = "";
  if (catStats) {
    var maxCat = Math.max.apply(
      null,
      Object.keys(catStats).map(function (k) {
        return catStats[k];
      }),
    );
    var catOrder = ["yemek", "muze", "gezi", "cami"];
    catHTML =
      '<div class="stats-cats">' +
      catOrder
        .filter(function (c) {
          return catStats[c];
        })
        .map(function (cat) {
          var n = catStats[cat];
          var pct = Math.round((n / maxCat) * 100);
          return (
            '<div class="stats-cat-row">' +
            '<span class="stats-cat-label">' +
            (CAT_IC[cat] ? CAT_IC[cat] : "") +
            " " +
            esc(t("cats." + cat)) +
            "</span>" +
            '<div class="stats-cat-bar" role="progressbar" aria-valuenow="' +
            esc(String(pct)) +
            '" aria-valuemin="0" aria-valuemax="100" aria-label="' +
            esc(t("cats." + cat)) +
            '"><div class="stats-cat-fill" style="width:' +
            esc(String(pct)) +
            '%"></div></div>' +
            '<span class="stats-cat-num">' +
            esc(String(n)) +
            "</span>" +
            "</div>"
          );
        })
        .join("") +
      "</div>";
  }

  var bodyContent = isEmpty
    ? '<p class="stats-empty">' + esc(t("stats_empty")) + "</p>"
    : countersHTML + topCityHTML + progressHTML + catHTML;

  return (
    '<div class="stats-panel' +
    (isOpen ? " stats-open" : "") +
    '" id="stats-panel">' +
    '<div class="container">' +
    '<button class="stats-panel-toggle" id="stats-panel-toggle" ' +
    'aria-expanded="' +
    (isOpen ? "true" : "false") +
    '" ' +
    'aria-controls="stats-panel-body">' +
    IC.bino +
    ' <span class="stats-panel-title">' +
    esc(t("stats_title")) +
    "</span>" +
    '<span class="stats-toggle-icon" aria-hidden="true">' +
    (isOpen ? "−" : "+") +
    "</span>" +
    "</button>" +
    '<div class="stats-panel-body" id="stats-panel-body" role="region" ' +
    'aria-label="' +
    esc(t("stats_title")) +
    '" aria-hidden="' +
    (isOpen ? "false" : "true") +
    '">' +
    '<div class="stats-body-inner">' +
    bodyContent +
    "</div>" +
    "</div>" +
    "</div>" +
    "</div>"
  );
}

// ── 9. City List ─────────────────────────────────────────────────────

function getRegions() {
  var seen = {};
  return state.cities
    .map(function (c) {
      return c.region;
    })
    .filter(function (r) {
      if (seen[r]) return false;
      seen[r] = true;
      return true;
    });
}

function filterCities() {
  var q = state.search.toLowerCase().trim();
  return state.cities.filter(function (city) {
    var matchR = state.region === "all" || city.region === state.region;
    if (!q) return matchR;
    var matchCity =
      city.city.toLowerCase().indexOf(q) !== -1 ||
      city.description.toLowerCase().indexOf(q) !== -1;
    // If allPlaces is loaded, also search places within that city
    var matchPlace =
      !matchCity &&
      state.allPlacesLoaded &&
      state.allPlaces.some(function (p) {
        return (
          p.citySlug === city.slug &&
          (p.name.toLowerCase().indexOf(q) !== -1 ||
            p.tags.some(function (tag) {
              return tag.toLowerCase().indexOf(q) !== -1;
            }))
        );
      });
    return matchR && (matchCity || matchPlace);
  });
}

function cityCardHTML(city) {
  var isFav = state.favorites.has(city.slug);
  var count = city.placeCount != null ? city.placeCount : "…";
  var palette = REGION_PALETTE[city.region] || { from: "#555", to: "#222" };
  var initial = (city.city || "?").charAt(0).toUpperCase();
  var cityVisited = Object.keys(state.visits).filter(function (k) {
    return k.indexOf(city.slug + "__") === 0;
  }).length;
  return (
    '<article class="city-card" data-slug="' +
    esc(city.slug) +
    '" role="button" tabindex="0" ' +
    'aria-label="' +
    esc(city.city) +
    '">' +
    '<div class="city-card-img" style="background: linear-gradient(145deg, ' +
    esc(palette.from) + ' 0%, ' + esc(palette.to) + ' 100%)">' +
    '<span class="city-card-initial" aria-hidden="true">' + esc(initial) + '</span>' +
    '<div class="city-card-img-overlay"></div>' +
    '<span class="city-card-region">' +
    esc(city.region) +
    "</span>" +
    '<button class="btn-fav city-fav ' +
    (isFav ? "is-fav" : "") +
    '" data-slug="' +
    esc(city.slug) +
    '" ' +
    'aria-label="' +
    esc(isFav ? t("fav_remove") : t("fav_add")) +
    '">' +
    (isFav ? IC.heartFill : IC.heart) +
    "</button></div>" +
    '<div class="city-card-body">' +
    '<h2 class="city-name">' +
    esc(city.city) +
    "</h2>" +
    '<p class="city-desc">' +
    esc(city.description) +
    "</p>" +
    '<div class="city-footer">' +
    '<span class="city-count">' +
    IC.mapPin +
    " " +
    esc(t("places_count", count)) +
    "</span>" +
    (cityVisited > 0
      ? '<span class="city-visited-count">' +
        IC.check +
        " " +
        cityVisited +
        "</span>"
      : '<span class="city-arrow">→</span>') +
    "</div>" +
    "</div></article>"
  );
}

// Builds the city cards section (excluding the hero)
function buildCityContentInner() {
  var filtered = filterCities();
  var favCities = state.cities.filter(function (c) {
    return state.favorites.has(c.slug);
  });
  var showFavs =
    favCities.length > 0 && !state.search && state.region === "all";

  var cityCardsHTML = filtered.length
    ? filtered.map(cityCardHTML).join("")
    : '<p class="empty-state">' + esc(t("no_results")) + "</p>";

  var favsHTML = showFavs
    ? '<section class="favs-section" aria-label="' +
      esc(t("favs_title")) +
      '">' +
      '<div class="section-header">' +
      '<h2 class="section-title">' +
      IC.heartFill +
      " " +
      esc(t("favs_title")) +
      "</h2>" +
      '<button class="btn-text" id="btn-share-favs">' +
      IC.share +
      " " +
      esc(t("share_favs")) +
      "</button>" +
      "</div>" +
      '<div class="city-grid">' +
      favCities.map(cityCardHTML).join("") +
      "</div>" +
      "</section>"
    : "";

  var resultLabel =
    state.lang === "tr"
      ? filtered.length + " sonuç"
      : filtered.length + " result" + (filtered.length !== 1 ? "s" : "");
  var sectionLabel = state.lang === "tr" ? "Şehirler" : "Cities";

  var nearestCityHTML = "";
  var _nc = getNearestCity();
  if (_nc) {
    var _ncDist = Math.round(_nc.d);
    nearestCityHTML =
      '<div class="nearest-city-strip">' +
      IC.locate +
      " " +
      esc(t("nearby_city", _nc.city.city, _ncDist)) +
      '<button class="nearest-city-btn" data-slug="' +
      esc(_nc.city.slug) +
      '">' +
      esc(state.lang === "tr" ? "Keşfet →" : "Explore →") +
      "</button></div>";
  }

  return (
    nearestCityHTML +
    favsHTML +
    '<section aria-label="' +
    esc(sectionLabel) +
    '">' +
    '<div class="section-label">' +
    '<span class="section-label-text">' +
    esc(sectionLabel) +
    "</span>" +
    '<span class="section-label-line"></span>' +
    '<span class="section-label-count">' +
    esc(resultLabel) +
    "</span>" +
    "</div>" +
    '<div class="city-grid">' +
    cityCardsHTML +
    "</div>" +
    "</section>"
  );
}

// Updates only the cards section — does not touch the hero or input
function updateCityContent() {
  var container = document.getElementById("city-content");
  if (!container) {
    renderCityList();
    return;
  }
  container.innerHTML = buildCityContentInner();
  bindCityCardEvents();
}

// Syncs region chip active states and aria-pressed (without a full re-render)
function updateChipActiveStates() {
  document.querySelectorAll(".chip[data-region]").forEach(function (chip) {
    var isActive = chip.dataset.region === state.region;
    chip.classList.toggle("chip-active", isActive);
    chip.setAttribute("aria-pressed", isActive ? "true" : "false");
  });
}

// Binds card & favourite events only within #city-content
function bindCityCardEvents() {
  var container = document.getElementById("city-content");
  if (!container) return;

  container.querySelectorAll(".city-card[data-slug]").forEach(function (card) {
    card.addEventListener("click", function (e) {
      if (e.target.closest(".btn-fav")) return;
      if (!card.classList.contains("skeleton"))
        location.hash = card.dataset.slug;
    });
    card.addEventListener("keydown", function (e) {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        if (!card.classList.contains("skeleton"))
          location.hash = card.dataset.slug;
      }
    });
  });

  container.querySelectorAll(".btn-fav[data-slug]").forEach(function (btn) {
    btn.addEventListener("click", function (e) {
      e.stopPropagation();
      var slug = btn.dataset.slug;
      if (state.favorites.has(slug)) state.favorites.delete(slug);
      else state.favorites.add(slug);
      saveFavs();
      updateCityContent();
    });
  });

  var shareBtn = container.querySelector("#btn-share-favs");
  if (shareBtn) shareBtn.addEventListener("click", shareFavorites);

  var nearestBtn = container.querySelector(".nearest-city-btn[data-slug]");
  if (nearestBtn) {
    nearestBtn.addEventListener("click", function () {
      location.hash = nearestBtn.dataset.slug;
    });
  }
}

function renderCityList() {
  updateMetaTags("home");
  var main = document.getElementById("main");

  var regionChipsHTML =
    '<button class="chip ' +
    (state.region === "all" ? "chip-active" : "") +
    '" data-region="all" aria-pressed="' +
    (state.region === "all" ? "true" : "false") +
    '">' +
    esc(t("all_regions")) +
    "</button>" +
    getRegions()
      .map(function (r) {
        var label = t("regions." + r) || r;
        return (
          '<button class="chip ' +
          (state.region === r ? "chip-active" : "") +
          '" data-region="' +
          esc(r) +
          '" aria-pressed="' +
          (state.region === r ? "true" : "false") +
          '">' +
          esc(label) +
          "</button>"
        );
      })
      .join("");

  var heroTitle =
    state.lang === "tr"
      ? "Türkiye'yi<br><span>Keşfet</span>"
      : "Explore<br><span>Turkey</span>";
  var heroSub =
    state.lang === "tr"
      ? "Tarihin, lezzetin ve doğanın iç içe geçtiği şehirleri keşfet. Her köşede seni bekleyen unutulmaz anlar var."
      : "Discover cities where history, flavor, and nature intertwine. Unforgettable moments await around every corner.";
  var eyebrow =
    state.lang === "tr"
      ? "✶  " + state.cities.length + " şehir keşfet"
      : "✶  " + state.cities.length + " cities to explore";

  // search-clear and search-badge are always in the DOM; toggled via has-search class
  var heroHTML =
    '<section class="hero">' +
    '<div class="container hero-content">' +
    '<div class="hero-eyebrow">' +
    eyebrow +
    "</div>" +
    '<h1 class="hero-title">' +
    heroTitle +
    "</h1>" +
    '<p class="hero-subtitle">' +
    esc(heroSub) +
    "</p>" +
    '<div class="search-wrap' +
    (state.search ? " has-search" : "") +
    '">' +
    '<span class="search-icon">' +
    IC.search +
    "</span>" +
    '<input id="search-input" class="search-input" type="search" ' +
    'placeholder="' +
    esc(t("search_ph")) +
    '" ' +
    'value="' +
    esc(state.search) +
    '" ' +
    'aria-label="' +
    esc(t("search_ph")) +
    '" ' +
    'role="combobox" aria-expanded="false" aria-autocomplete="list" ' +
    'aria-controls="ac-dropdown" aria-activedescendant="" ' +
    'autocomplete="off" spellcheck="false">' +
    '<button class="search-clear" id="search-clear" aria-label="' +
    esc(t("search_clear")) +
    '">' +
    IC.xMark +
    "</button>" +
    '<span class="search-badge" aria-hidden="true">' +
    (/Mac|iPhone|iPad|iPod/.test(navigator.platform) ? '⌘K' : 'Ctrl K') +
    '</span>' +
    "</div>" +
    '<div class="region-chips" role="group" aria-label="' +
    esc(t("region_filter")) +
    '">' +
    regionChipsHTML +
    "</div>" +
    "</div></section>";

  main.innerHTML =
    heroHTML +
    buildStatsPanel() +
    '<div id="city-content" class="container section-wrap">' +
    buildCityContentInner() +
    "</div>";

  bindCityListEvents();
}
function bindCityListEvents() {
  var main = document.getElementById("main");
  var inp = main.querySelector("#search-input");

  if (inp) {
    // On first focus: load places in background + show search history
    inp.addEventListener("focus", function () {
      loadAllPlaces();
      if (!inp.value.trim()) {
        var hist = loadSearchHist();
        if (hist.length) openAutocomplete(inp, hist, true);
      }
    });

    // On each keystroke: update cards only, do not touch the input
    inp.addEventListener("input", function () {
      state.search = inp.value;
      // Toggle × / ⌘K visibility via has-search class
      var wrap = inp.closest(".search-wrap");
      if (wrap) wrap.classList.toggle("has-search", !!state.search);
      updateCityContent();
      refreshAutocomplete(inp);
    });

    inp.addEventListener("blur", function () {
      setTimeout(closeAutocomplete, 160);
    });

    inp.addEventListener("keydown", function (e) {
      var ac = document.getElementById("ac-dropdown");
      if (!ac) return;
      var items = Array.from(ac.querySelectorAll(".ac-item"));
      var focIdx = items.findIndex(function (i) {
        return i.classList.contains("ac-item-focused");
      });

      // Helper: move focus to a specific item index
      function moveFocusTo(newIdx) {
        items.forEach(function (i) {
          i.classList.remove("ac-item-focused");
          i.setAttribute("aria-selected", "false");
        });
        var target = items[newIdx];
        if (!target) return;
        target.classList.add("ac-item-focused");
        target.setAttribute("aria-selected", "true");
        inp.setAttribute("aria-activedescendant", target.id || "");
      }

      if (e.key === "ArrowDown") {
        e.preventDefault();
        moveFocusTo(Math.min(focIdx + 1, items.length - 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        moveFocusTo(Math.max(focIdx - 1, 0));
      } else if (e.key === "Enter") {
        var focused = ac.querySelector(".ac-item-focused");
        if (focused) {
          e.preventDefault();
          focused.dispatchEvent(new MouseEvent("mousedown", { bubbles: true }));
        }
      } else if (e.key === "Escape") {
        closeAutocomplete();
      }
    });
  }

  var clrBtn = main.querySelector("#search-clear");
  if (clrBtn) {
    clrBtn.addEventListener("click", function () {
      state.search = "";
      var wrap = inp && inp.closest(".search-wrap");
      if (wrap) wrap.classList.remove("has-search");
      closeAutocomplete();
      updateCityContent();
      if (inp) inp.focus();
    });
  }

  main.querySelectorAll(".chip[data-region]").forEach(function (chip) {
    chip.addEventListener("click", function (e) {
      state.region = e.currentTarget.dataset.region;
      updateChipActiveStates();
      updateCityContent();
    });
  });



  // Toggle stats panel open/closed
  var statsToggle = main.querySelector("#stats-panel-toggle");
  if (statsToggle) {
    statsToggle.addEventListener("click", function () {
      var panel = document.getElementById("stats-panel");
      var icon = statsToggle.querySelector(".stats-toggle-icon");
      if (!panel) return;
      var nowOpen = panel.classList.toggle("stats-open");
      statsToggle.setAttribute("aria-expanded", nowOpen ? "true" : "false");
      if (icon) icon.textContent = nowOpen ? "−" : "+";
      // Sync aria-hidden so screen readers skip the collapsed body
      var body = document.getElementById("stats-panel-body");
      if (body) body.setAttribute("aria-hidden", nowOpen ? "false" : "true");
      localStorage.setItem(LS_STATS_OPEN, nowOpen ? "true" : "false");
    });
  }

  bindCityCardEvents();
}

// ── 10. City Detail ──────────────────────────────────────────────────

function filterPlaces() {
  if (!state.cityData) return [];
  return state.cityData.places.filter(function (p) {
    var matchCat = state.category === "all" || p.category === state.category;
    var matchTags =
      state.activeTags.size === 0 ||
      Array.from(state.activeTags).every(function (tag) {
        return p.tags && p.tags.indexOf(tag) !== -1;
      });
    var matchOpen = !state.openOnly || isOpenNow(p.openHours) === true;
    return matchCat && matchTags && matchOpen;
  });
}

// Parses "08:30 – 18:00 (...)" format and returns whether the place is currently open.
// null → no data; true/false → open/closed
function isOpenNow(openHours) {
  if (!openHours) return null;
  var m = openHours.match(/(\d{1,2}):(\d{2})\s*[–-]\s*(\d{1,2}):(\d{2})/);
  if (!m) return null;
  var now = new Date();
  var cur = now.getHours() * 60 + now.getMinutes();
  var open = parseInt(m[1], 10) * 60 + parseInt(m[2], 10);
  var close = parseInt(m[3], 10) * 60 + parseInt(m[4], 10);
  if (close === 0) close = 24 * 60; // 00:00 → midnight
  if (close < open) close += 24 * 60; // overnight shift
  return cur >= open && cur < close;
}

function sortPlaces(places) {
  var sorted = places.slice();
  if (state.sortBy === "name") {
    sorted.sort(function (a, b) {
      return a.name.localeCompare(b.name, "tr");
    });
  } else if (state.sortBy === "price") {
    sorted.sort(function (a, b) {
      var pa = a.priceLevel || 99;
      var pb = b.priceLevel || 99;
      return pa - pb;
    });
  } else if (state.sortBy === "open") {
    sorted.sort(function (a, b) {
      var oa = isOpenNow(a.openHours);
      var ob = isOpenNow(b.openHours);
      // true → 0, false/null → 1
      var va = oa === true ? 0 : oa === false ? 1 : 2;
      var vb = ob === true ? 0 : ob === false ? 1 : 2;
      return va - vb;
    });
  } else if (state.sortBy === "nearby" && state.userLat !== null) {
    sorted.sort(function (a, b) {
      var da =
        a.location && a.location.lat
          ? haversineKm(
              state.userLat,
              state.userLng,
              a.location.lat,
              a.location.lng,
            )
          : 99999;
      var db =
        b.location && b.location.lat
          ? haversineKm(
              state.userLat,
              state.userLng,
              b.location.lat,
              b.location.lng,
            )
          : 99999;
      return da - db;
    });
  }
  // 'default' → preserve JSON order, do nothing
  return sorted;
}

// Filtered + sorted place list
function getPlaces() {
  return sortPlaces(filterPlaces());
}

function getAllTags() {
  if (!state.cityData) return [];
  var tags = {};
  state.cityData.places.forEach(function (p) {
    if (p.tags)
      p.tags.forEach(function (tag) {
        tags[tag] = true;
      });
  });
  return Object.keys(tags).sort(function (a, b) {
    var aActive = state.activeTags.has(a) ? 0 : 1;
    var bActive = state.activeTags.has(b) ? 0 : 1;
    if (aActive !== bActive) return aActive - bActive;
    return a.localeCompare(b, "tr");
  });
}

// Returns open/closed badge HTML (empty string if no hours data)
function openBadgeHTML(openHours) {
  var status = isOpenNow(openHours);
  if (status === null) return "";
  var label = status ? t("open_now") : t("closed_now");
  var cls = status ? "open-badge-open" : "open-badge-closed";
  return (
    '<span class="open-badge ' +
    cls +
    '" aria-label="' +
    esc(label) +
    '">' +
    '<span class="open-badge-dot" aria-hidden="true"></span>' +
    esc(label) +
    "</span>"
  );
}

function badgeHTML(category) {
  return (
    '<span class="badge badge-' +
    esc(category) +
    '">' +
    (CAT_IC[category] || "") +
    esc(t("cats." + category)) +
    "</span>"
  );
}

function placeCardHTML(place) {
  var hasLoc = place.location && place.location.lat && place.location.lng;

  var mustEatHTML = "";
  if (place.mustEat && place.mustEat.length) {
    mustEatHTML =
      '<div class="must-eat">' +
      '<span class="must-eat-label">' +
      esc(t("must_eat")) +
      "</span>" +
      '<div class="must-eat-chips">' +
      place.mustEat
        .map(function (item) {
          return '<span class="must-chip">' + esc(item) + "</span>";
        })
        .join("") +
      "</div></div>";
  }

  var tagsHTML = "";
  if (place.tags && place.tags.length) {
    tagsHTML =
      '<div class="place-tags">' +
      place.tags
        .map(function (tag) {
          return (
            '<button class="chip-tag ' +
            (state.activeTags.has(tag) ? "chip-tag-active" : "") +
            '" data-tag="' +
            esc(tag) +
            '" aria-pressed="' +
            (state.activeTags.has(tag) ? "true" : "false") +
            '">' +
            esc(tag) +
            "</button>"
          );
        })
        .join("") +
      "</div>";
  }

  var hoursHTML = place.openHours
    ? '<span class="place-hours">' +
      IC.clock +
      " " +
      esc(place.openHours) +
      " " +
      openBadgeHTML(place.openHours) +
      "</span>"
    : "";

  var distHTML = "";
  if (state.userLat !== null && place.location && place.location.lat) {
    var _d = haversineKm(
      state.userLat,
      state.userLng,
      place.location.lat,
      place.location.lng,
    );
    distHTML =
      '<span class="dist-badge">' +
      IC.locate +
      " " +
      esc(fmtDist(_d)) +
      "</span>";
  }

  var priceHTML = place.priceLevel
    ? '<span class="place-price">' +
      esc(t("price", place.priceLevel)) +
      "</span>"
    : "";

  var dirHTML = hasLoc
    ? '<a class="place-dir" href="' +
      mapsUrl(place.location.lat, place.location.lng) +
      '" target="_blank" rel="noopener noreferrer">' +
      esc(t("directions")) +
      " " +
      IC.extLink +
      "</a>"
    : "";

  var footerHTML =
    hoursHTML || priceHTML || dirHTML || distHTML
      ? '<footer class="place-card-footer">' +
        distHTML +
        hoursHTML +
        priceHTML +
        dirHTML +
        "</footer>"
      : "";

  var visitedKey = (state.slug || "") + "__" + slugify(place.name);
  var isVis = isVisited(visitedKey);

  return (
    '<article class="place-card place-card-clickable' +
    (isVis ? " place-visited" : "") +
    '" ' +
    'data-place-name="' +
    esc(place.name) +
    '" ' +
    'role="button" tabindex="0" aria-label="' +
    esc(place.name) +
    ' – detayları gör">' +
    '<div class="place-card-accent place-accent-' +
    esc(place.category) +
    '"></div>' +
    '<div class="place-card-body">' +
    (isVis
      ? '<span class="visited-badge" aria-label="' +
        esc(t("visit_done")) +
        '">✓</span>'
      : "") +
    '<div class="place-card-header">' +
    '<h3 class="place-name">' +
    esc(place.name) +
    "</h3>" +
    badgeHTML(place.category) +
    "</div>" +
    '<p class="place-desc">' +
    esc(place.description) +
    "</p>" +
    tagsHTML +
    mustEatHTML +
    footerHTML +
    "</div></article>"
  );
}

function tagChipsHTML(tags) {
  return (
    tags
      .map(function (tag) {
        return (
          '<button class="chip-tag ' +
          (state.activeTags.has(tag) ? "chip-tag-active" : "") +
          '" data-tag="' +
          esc(tag) +
          '" aria-pressed="' +
          (state.activeTags.has(tag) ? "true" : "false") +
          '">' +
          esc(tag) +
          "</button>"
        );
      })
      .join("") +
    (state.activeTags.size
      ? '<button class="chip-clear" id="clear-tags">' +
        esc(t("clear_tags")) +
        "</button>"
      : "")
  );
}

async function renderCityDetail() {
  var main = document.getElementById("main");

  // Show skeleton
  main.innerHTML =
    '<div class="container detail-view">' +
    '<div class="detail-header">' +
    '<button class="btn-back" id="btn-back-skel">' +
    IC.arrowLeft +
    " " +
    esc(t("back")) +
    "</button>" +
    "</div>" +
    '<div class="detail-meta">' +
    '<div class="skel-line skel-city-name"></div>' +
    '<div class="skel-line skel-desc" style="width:55%;margin-top:0.5rem;"></div>' +
    "</div>" +
    '<div class="place-grid">' +
    [0, 1, 2, 3, 4, 5].map(skeletonPlaceCard).join("") +
    "</div>" +
    "</div>";

  document.getElementById("btn-back-skel") &&
    document
      .getElementById("btn-back-skel")
      .addEventListener("click", function () {
        location.hash = "";
      });

  // Fetch data
  try {
    var cityMeta = state.cities.find(function (c) {
      return c.slug === state.slug;
    });
    if (!cityMeta) throw new Error("City not found: " + state.slug);
    state.cityData = await fetchJSON(cityMeta.data);
    cityMeta.placeCount = state.cityData.places.length;
    updateMetaTags("city", { cityMeta: cityMeta, cityData: state.cityData });
  } catch (err) {
    main.innerHTML =
      '<div class="container detail-view">' +
      '<div class="detail-header">' +
      '<button class="btn-back" id="btn-back-err">' +
      IC.arrowLeft +
      " " +
      esc(t("back")) +
      "</button>" +
      "</div>" +
      '<p class="empty-state">' +
      esc(t("load_err")) +
      esc(err.message) +
      "</p>" +
      "</div>";
    document.getElementById("btn-back-err") &&
      document
        .getElementById("btn-back-err")
        .addEventListener("click", function () {
          location.hash = "";
        });
    return;
  }

  // Tabs
  var categories = ["all", "yemek", "cami", "muze", "gezi"];
  var tabsHTML = categories
    .map(function (cat) {
      var count =
        cat === "all"
          ? state.cityData.places.length
          : state.cityData.places.filter(function (p) {
              return p.category === cat;
            }).length;
      if (cat !== "all" && count === 0) return "";
      return (
        '<button class="tab ' +
        (state.category === cat ? "tab-active" : "") +
        '" ' +
        'id="tab-' +
        cat +
        '" data-cat="' +
        cat +
        '" role="tab" aria-selected="' +
        (state.category === cat ? "true" : "false") +
        '" aria-controls="place-grid">' +
        (CAT_IC[cat] || "") +
        " " +
        esc(t("cats." + cat)) +
        ' <span class="tab-count">' +
        count +
        "</span></button>"
      );
    })
    .join("");

  // Tag filter
  var allTags = getAllTags();
  var tagFilterHTML = allTags.length
    ? '<div class="tag-filter">' +
      '<span class="tag-filter-label">' +
      IC.tag +
      " " +
      esc(t("filter_tags")) +
      "</span>" +
      '<div class="tag-filter-chips" id="tag-filter-chips">' +
      tagChipsHTML(allTags) +
      "</div>" +
      "</div>"
    : "";

  // Sort dropdown
  var sortOpts = ["default", "name", "price", "open", "nearby"];
  var sortOptsHTML = sortOpts
    .map(function (v) {
      var disabled =
        v === "nearby" && state.userLat === null ? " disabled" : "";
      return (
        '<option value="' +
        v +
        '"' +
        (state.sortBy === v ? " selected" : "") +
        disabled +
        ">" +
        esc(t("sort_" + v)) +
        (v === "nearby" && state.userLat === null ? " …" : "") +
        "</option>"
      );
    })
    .join("");
  var hasLoc = state.userLat !== null;
  var nearbyWidgetHTML =
    '<div class="nearby-widget" id="nearby-widget">' +
    '<button class="nearby-loc-btn' +
    (hasLoc ? " has-location" : "") +
    '" id="nearby-loc-btn" aria-pressed="' +
    (hasLoc ? "true" : "false") +
    '">' +
    IC.locate +
    ' <span class="nearby-loc-text">' +
    esc(hasLoc ? t("nearby_got") : t("nearby_btn")) +
    "</span>" +
    "</button>" +
    (hasLoc ? buildNearestPlaceInfo() : "") +
    "</div>";

  var sortBarHTML =
    '<div class="sort-bar">' +
    '<button class="open-filter-btn' +
    (state.openOnly ? " open-filter-active" : "") +
    '" id="open-filter-btn" aria-pressed="' +
    (state.openOnly ? "true" : "false") +
    '">' +
    '<span class="open-filter-dot" aria-hidden="true"></span>' +
    esc(t("open_only_btn")) +
    "</button>" +
    '<label class="sort-label" for="sort-select">' +
    esc(t("sort_label")) +
    "</label>" +
    '<select class="sort-select" id="sort-select">' +
    sortOptsHTML +
    "</select>" +
    "</div>";

  // Places
  var filtered = getPlaces();
  var placesHTML = filtered.length
    ? filtered.map(placeCardHTML).join("")
    : '<p class="empty-state col-span">' + esc(t("no_places")) + "</p>";

  // Season calendar
  var seasonHTML = buildSeasonCalendar(state.cityData.seasons);

  var prog = getVisitProgress();
  var progressHTML =
    prog.total > 0
      ? '<div class="city-progress" id="city-progress">' +
        '<div class="progress-header">' +
        '<span class="progress-text">' +
        esc(t("visit_progress", prog.visited, prog.total)) +
        "</span>" +
        '<span class="progress-pct">' +
        prog.pct +
        "%</span>" +
        "</div>" +
        '<div class="progress-bar" role="progressbar" aria-valuenow="' +
        prog.pct +
        '" aria-valuemin="0" aria-valuemax="100" aria-label="' +
        esc(t("visit_progress", prog.visited, prog.total)) +
        '"><div class="progress-fill" style="width:' +
        prog.pct +
        '%"></div></div>' +
        "</div>"
      : "";

  main.innerHTML =
    '<div class="container detail-view">' +
    '<div class="detail-header">' +
    '<button class="btn-back" id="btn-back">' +
    IC.arrowLeft +
    " " +
    esc(t("back")) +
    "</button>" +
    "</div>" +
    '<div class="detail-meta">' +
    '<h1 class="detail-city-name">' +
    esc(state.cityData.city) +
    "</h1>" +
    '<p class="detail-city-desc">' +
    esc(state.cityData.description) +
    "</p>" +
    "</div>" +
    seasonHTML +
    progressHTML +
    '<nav class="tabs" role="tablist" aria-label="' + esc(t("cat_filter")) + '">' +
    tabsHTML +
    "</nav>" +
    tagFilterHTML +
    sortBarHTML +
    nearbyWidgetHTML +
    '<div class="place-grid" id="place-grid" role="tabpanel" aria-labelledby="tab-' +
    esc(state.category) +
    '">' +
    placesHTML +
    "</div>" +
    '<div class="map-section">' +
    '<div class="map-section-header">' +
    '<p class="map-section-label">' +
    IC.mapPin +
    " " +
    esc(t("map_legend")) +
    "</p>" +
    '<a class="map-route-btn" id="map-route-btn" href="#" target="_blank" rel="noopener noreferrer" style="display:none">' +
    IC.mapPin +
    " " +
    esc(t("map_route")) +
    ' <span class="map-route-count"></span>' +
    "</a>" +
    "</div>" +
    '<div id="city-map" class="city-map" role="region" aria-label="' +
    esc(t("map_region_label")) +
    '"></div>' +
    "</div>" +
    "</div>";

  bindDetailEvents();
  initMap();
}

function bindDetailEvents() {
  var main = document.getElementById("main");

  var backBtn = document.getElementById("btn-back");
  if (backBtn)
    backBtn.addEventListener("click", function () {
      location.hash = "";
    });

  main.querySelectorAll(".tab[data-cat]").forEach(function (tab) {
    tab.addEventListener("click", function (e) {
      state.category = e.currentTarget.dataset.cat;
      main.querySelectorAll(".tab").forEach(function (tb) {
        var isActive = tb.dataset.cat === state.category;
        tb.classList.toggle("tab-active", isActive);
        tb.setAttribute("aria-selected", isActive ? "true" : "false");
      });
      // Keep tabpanel labelled by the active tab
      var grid = document.getElementById("place-grid");
      if (grid) grid.setAttribute("aria-labelledby", "tab-" + state.category);
      updatePlaceGrid();
      updateMapMarkers();
    });
  });

  bindTagChipEvents();

  var nearbyLocBtn = document.getElementById("nearby-loc-btn");
  if (nearbyLocBtn) {
    nearbyLocBtn.addEventListener("click", function () {
      if (state.userLat !== null) return; // already acquired
      getUserLocation(function () {
        // Update button state
        nearbyLocBtn.classList.add("has-location");
        nearbyLocBtn.setAttribute("aria-pressed", "true");
        var txt = nearbyLocBtn.querySelector(".nearby-loc-text");
        if (txt) txt.textContent = t("nearby_got");
        // Add nearest info
        var widget = document.getElementById("nearby-widget");
        if (widget && !widget.querySelector(".nearby-info")) {
          var infoHTML = buildNearestPlaceInfo();
          if (infoHTML) {
            var frag = document
              .createRange()
              .createContextualFragment(infoHTML);
            widget.appendChild(frag);
          }
        }
        // Enable nearby option in the sort dropdown
        var sortSel = document.getElementById("sort-select");
        if (sortSel) {
          var opt = sortSel.querySelector('option[value="nearby"]');
          if (opt) {
            opt.disabled = false;
            opt.textContent = t("sort_nearby");
          }
          sortSel.value = "nearby";
          state.sortBy = "nearby";
        }
        // Refresh grid + map
        updatePlaceGrid();
        updateMapMarkers();
      });
    });
  }

  var openFilterBtn = document.getElementById("open-filter-btn");
  if (openFilterBtn) {
    openFilterBtn.addEventListener("click", function () {
      state.openOnly = !state.openOnly;
      openFilterBtn.classList.toggle("open-filter-active", state.openOnly);
      openFilterBtn.setAttribute("aria-pressed", state.openOnly ? "true" : "false");
      updatePlaceGrid();
      updateMapMarkers();
    });
  }

  var sortSel = document.getElementById("sort-select");
  if (sortSel) {
    sortSel.addEventListener("change", function () {
      state.sortBy = sortSel.value;
      updatePlaceGrid();
    });
  }

  var grid = document.getElementById("place-grid");
  if (grid) bindPlaceCardClicks(grid);
}

function bindTagChipEvents() {
  var container = document.getElementById("tag-filter-chips");
  if (!container) return;

  container.querySelectorAll(".chip-tag[data-tag]").forEach(function (chip) {
    chip.addEventListener("click", function (e) {
      var tag = e.currentTarget.dataset.tag;
      if (state.activeTags.has(tag)) state.activeTags.delete(tag);
      else state.activeTags.add(tag);
      // Keep aria-pressed in sync before re-render
      e.currentTarget.setAttribute("aria-pressed", state.activeTags.has(tag) ? "true" : "false");
      refreshTagFilter();
      updatePlaceGrid();
    });
  });

  var clr = container.querySelector("#clear-tags");
  if (clr) {
    clr.addEventListener("click", function () {
      state.activeTags.clear();
      refreshTagFilter();
      updatePlaceGrid();
    });
  }
}

function refreshTagFilter() {
  var container = document.getElementById("tag-filter-chips");
  if (!container) return;
  container.innerHTML = tagChipsHTML(getAllTags());
  bindTagChipEvents();
}

function updatePlaceGrid() {
  var grid = document.getElementById("place-grid");
  if (!grid) return;
  var filtered = getPlaces();
  grid.innerHTML = filtered.length
    ? filtered.map(placeCardHTML).join("")
    : '<p class="empty-state col-span">' + esc(t("no_places")) + "</p>";

  // Bind tag chips inside cards
  grid.querySelectorAll(".chip-tag[data-tag]").forEach(function (chip) {
    chip.addEventListener("click", function (e) {
      e.stopPropagation();
      var tag = e.currentTarget.dataset.tag;
      if (state.activeTags.has(tag)) state.activeTags.delete(tag);
      else state.activeTags.add(tag);
      refreshTagFilter();
      updatePlaceGrid();
    });
  });

  bindPlaceCardClicks(grid);
  updateMapMarkers();
}

// ── 11. Leaflet Map ──────────────────────────────────────────────────

function buildRouteUrl(places) {
  var located = places.filter(function (p) {
    return p.location && p.location.lat;
  });
  if (!located.length) return "";
  if (located.length === 1)
    return mapsUrl(located[0].location.lat, located[0].location.lng);
  var origin = located[0].location.lat + "," + located[0].location.lng;
  var dest =
    located[located.length - 1].location.lat +
    "," +
    located[located.length - 1].location.lng;
  var wps = located
    .slice(1, -1)
    .map(function (p) {
      return p.location.lat + "," + p.location.lng;
    })
    .join("|");
  var url =
    "https://www.google.com/maps/dir/?api=1" +
    "&origin=" +
    encodeURIComponent(origin) +
    "&destination=" +
    encodeURIComponent(dest);
  if (wps) url += "&waypoints=" + encodeURIComponent(wps);
  return url;
}

function updateRouteBtn(places) {
  var btn = document.getElementById("map-route-btn");
  if (!btn) return;
  var located = (places || filterPlaces()).filter(function (p) {
    return p.location && p.location.lat;
  });
  if (!located.length) {
    btn.style.display = "none";
    return;
  }
  btn.href = buildRouteUrl(located);
  btn.dataset.count = located.length;
  btn.querySelector(".map-route-count").textContent = t(
    "map_route_n",
    located.length,
  );
  btn.style.display = "inline-flex";
}

function updateMapMarkers() {
  if (!state.mapInstance || typeof window.L === "undefined") return;
  var filtered = filterPlaces();
  var filteredKeys = new Set(
    filtered.map(function (p) {
      return slugify(p.name);
    }),
  );

  Object.keys(state.mapMarkers).forEach(function (key) {
    var md = state.mapMarkers[key];
    var onMap = state.mapInstance.hasLayer(md.marker);
    if (filteredKeys.has(key) && !onMap) {
      md.marker.addTo(state.mapInstance);
    } else if (!filteredKeys.has(key) && onMap) {
      state.mapInstance.removeLayer(md.marker);
    }
  });

  // Fit bounds to visible markers
  var visibleMarkers = filtered
    .filter(function (p) {
      return p.location && p.location.lat && state.mapMarkers[slugify(p.name)];
    })
    .map(function (p) {
      return state.mapMarkers[slugify(p.name)].marker;
    });

  if (visibleMarkers.length > 1) {
    try {
      state.mapInstance.fitBounds(
        L.featureGroup(visibleMarkers).getBounds().pad(0.15),
      );
    } catch (_) {}
  } else if (visibleMarkers.length === 1) {
    state.mapInstance.panTo(visibleMarkers[0].getLatLng(), {
      animate: true,
      duration: 0.4,
    });
  }

  updateRouteBtn(filtered);
}

function initMap() {
  var mapEl = document.getElementById("city-map");
  if (!mapEl) return;

  if (typeof window.L === "undefined") {
    mapEl.innerHTML =
      '<div class="map-unavail">' +
      IC.mapPin +
      " " +
      esc(t("map_unavail")) +
      "</div>";
    mapEl.classList.add("map-unavail-wrap");
    return;
  }

  if (state.mapInstance) {
    state.mapInstance.remove();
    state.mapInstance = null;
  }
  state.mapMarkers = {};

  var allPlaces = ((state.cityData && state.cityData.places) || []).filter(
    function (p) {
      return p.location && p.location.lat && p.location.lng;
    },
  );

  if (!allPlaces.length) {
    mapEl.innerHTML =
      '<div class="map-unavail">' +
      IC.mapPin +
      " " +
      esc(t("no_coord")) +
      "</div>";
    mapEl.classList.add("map-unavail-wrap");
    return;
  }

  try {
    L.Icon.Default.mergeOptions({
      iconUrl: "vendor/leaflet/images/marker-icon.png",
      iconRetinaUrl: "vendor/leaflet/images/marker-icon-2x.png",
      shadowUrl: "vendor/leaflet/images/marker-shadow.png",
    });
  } catch (_) {}

  var map = L.map("city-map", { zoomControl: true, scrollWheelZoom: false });
  state.mapInstance = map;

  var isDark = document.documentElement.dataset.theme === "dark";
  var tileUrl = isDark
    ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
    : "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png";
  L.tileLayer(tileUrl, {
    attribution: '© <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a> © <a href="https://carto.com/attributions" target="_blank">CARTO</a>',
    maxZoom: 19,
  }).addTo(map);

  var markerGroup = L.featureGroup();

  allPlaces.forEach(function (place) {
    var color = MAP_COL[place.category] || "#555";
    var catLabel = t("cats." + place.category);
    var dirLink =
      '<br><a href="' +
      mapsUrl(place.location.lat, place.location.lng) +
      '" target="_blank" rel="noopener">' +
      t("directions") +
      "</a>";

    var marker = L.marker([place.location.lat, place.location.lng], {
      icon: L.divIcon({
        className: "map-marker",
        html:
          '<div class="map-marker-inner" style="background:' +
          color +
          '" title="' +
          esc(place.name) +
          '"></div>',
        iconSize: [14, 14],
        iconAnchor: [7, 7],
        popupAnchor: [0, -8],
      }),
      alt: place.name,
    });

    marker.bindPopup(
      "<strong>" +
        esc(place.name) +
        "</strong><br>" +
        '<span style="color:#888;font-size:11px">' +
        esc(catLabel) +
        "</span>" +
        dirLink,
      { closeButton: false },
    );

    // On marker click → scroll to the related card and highlight it
    marker.on("click", function () {
      var pName = place.name;
      var cards = document.querySelectorAll(
        ".place-card-clickable[data-place-name]",
      );
      var found = null;
      cards.forEach(function (c) {
        if (c.dataset.placeName === pName) found = c;
      });
      if (found) {
        found.scrollIntoView({ behavior: "smooth", block: "center" });
        found.classList.add("card-map-active");
        setTimeout(function () {
          found.classList.remove("card-map-active");
        }, 1600);
      }
    });

    markerGroup.addLayer(marker);
    state.mapMarkers[slugify(place.name)] = { marker: marker, place: place };
  });

  markerGroup.addTo(map);
  try {
    map.fitBounds(markerGroup.getBounds().pad(0.15));
  } catch (_) {
    map.setView([allPlaces[0].location.lat, allPlaces[0].location.lng], 13);
  }

  updateRouteBtn(state.cityData.places);
}

// ── 12. Place Detail Modal ───────────────────────────────────────────

function modalInnerHTML(place) {
  var hasLoc = place.location && place.location.lat && place.location.lng;
  var bannerPalette = CAT_BANNER_PALETTE[place.category] || { from: "#333", to: "#111" };
  var favKey = (state.slug || "") + "__" + slugify(place.name);
  var isFav = state.placeFavs.has(favKey);
  var planKey = (state.slug || "") + "__" + slugify(place.name);
  var inPlan = isPlanItem(planKey);

  var tagsHTML = "";
  if (place.tags && place.tags.length) {
    tagsHTML =
      '<div class="modal-tags">' +
      place.tags
        .map(function (tag) {
          return '<span class="chip-tag">' + esc(tag) + "</span>";
        })
        .join("") +
      "</div>";
  }

  var mustEatHTML = "";
  if (place.mustEat && place.mustEat.length) {
    mustEatHTML =
      '<div class="must-eat"><span class="must-eat-label">' +
      esc(t("must_eat")) +
      "</span>" +
      '<div class="must-eat-chips">' +
      place.mustEat
        .map(function (item) {
          return '<span class="must-chip">' + esc(item) + "</span>";
        })
        .join("") +
      "</div></div>";
  }

  var infoItems = "";
  if (place.openHours) {
    infoItems +=
      '<div class="modal-info-item"><span class="modal-info-label">' +
      IC.clock +
      " " +
      esc(t("open_hours")) +
      "</span>" +
      '<span class="modal-info-val">' +
      esc(place.openHours) +
      " " +
      openBadgeHTML(place.openHours) +
      "</span></div>";
  }
  if (place.priceLevel) {
    var priceLabel = state.lang === "tr" ? "Fiyat" : "Price";
    infoItems +=
      '<div class="modal-info-item"><span class="modal-info-label">₺ ' +
      esc(priceLabel) +
      "</span>" +
      '<span class="modal-info-val">' +
      esc(t("price", place.priceLevel)) +
      "</span></div>";
  }

  // Compact strip if city has season data
  var seasonCompactHTML =
    state.cityData && state.cityData.seasons
      ? buildSeasonCompact(state.cityData.seasons)
      : "";

  // Accessibility strip
  var accessibilityHTML = buildAccessibilityStrip(place.accessibility);

  // Similar places
  var similarHTML = buildSimilarPlacesHTML(place);

  var mapHTML = hasLoc
    ? '<div id="modal-map" class="modal-map-mini"></div>'
    : "";
  var dirBtn = hasLoc
    ? '<a class="modal-btn modal-btn-primary" href="' +
      esc(mapsUrl(place.location.lat, place.location.lng)) +
      '" target="_blank" rel="noopener noreferrer">' +
      IC.mapPin +
      " " +
      esc(t("directions")) +
      "</a>"
    : "";

  var visitKey = (state.slug || "") + "__" + slugify(place.name);
  var visited = isVisited(visitKey);
  var visitObj = state.visits[visitKey] || {};
  var visitDate = visitObj.date || new Date().toISOString().slice(0, 10);
  var visitNote = visitObj.note || "";
  var today = new Date().toISOString().slice(0, 10);

  var visitHTML =
    '<div class="visit-section" id="visit-section">' +
    '<button class="modal-btn modal-btn-visit' +
    (visited ? " is-visited" : "") +
    '" id="modal-visit-btn">' +
    IC.check +
    " " +
    esc(visited ? t("visit_done") : t("visit_mark")) +
    "</button>" +
    '<div class="visit-meta" id="visit-meta"' +
    (visited ? "" : ' style="display:none"') +
    ">" +
    '<label class="visit-date-label">' +
    IC.clock +
    " " +
    esc(t("visit_date")) +
    '<input type="date" id="visit-date" class="visit-date-input" value="' +
    esc(visitDate) +
    '" max="' +
    esc(today) +
    '"></label>' +
    '<textarea id="visit-note" class="visit-note-input" ' +
    'aria-label="' + esc(t("visit_note_label")) + '" ' +
    'placeholder="' +
    esc(t("visit_note_ph")) +
    '" rows="2">' +
    esc(visitNote) +
    "</textarea>" +
    "</div>" +
    "</div>";

  return (
    '<div class="modal">' +
    '<div class="modal-banner" style="background: linear-gradient(145deg, ' +
    esc(bannerPalette.from) + ' 0%, ' + esc(bannerPalette.to) + ' 100%)">' +
    '<span class="modal-banner-initial" aria-hidden="true">' +
    esc((place.name || "?").charAt(0).toUpperCase()) +
    '</span>' +
    '<button class="modal-close" id="modal-close" aria-label="' +
    esc(t("modal_close")) +
    '">' +
    IC.xMark +
    "</button>" +
    '<div class="modal-banner-badge">' +
    badgeHTML(place.category) +
    "</div>" +
    '</div><div class="modal-body">' +
    '<h2 class="modal-place-name" id="modal-place-name">' +
    esc(place.name) +
    "</h2>" +
    tagsHTML +
    '<p class="modal-desc">' +
    esc(place.description) +
    "</p>" +
    (infoItems ? '<div class="modal-info-grid">' + infoItems + "</div>" : "") +
    seasonCompactHTML +
    accessibilityHTML +
    mustEatHTML +
    mapHTML +
    '<div class="modal-actions">' +
    dirBtn +
    '<button class="modal-btn modal-btn-plan ' +
    (inPlan ? "is-planned" : "") +
    '" id="modal-plan-btn">' +
    IC.plan +
    ' <span class="modal-plan-text">' +
    esc(inPlan ? t("plan_remove") : t("plan_add")) +
    "</span></button>" +
    '<button class="modal-btn modal-btn-secondary" id="modal-share-btn">' +
    IC.share +
    " " +
    esc(t("modal_share")) +
    "</button>" +
    '<button class="modal-btn modal-btn-fav ' +
    (isFav ? "is-fav" : "") +
    '" id="modal-fav-btn" ' +
    'aria-label="' +
    esc(isFav ? t("place_fav_rm") : t("place_fav_add")) +
    '">' +
    (isFav ? IC.heartFill : IC.heart) +
    "</button>" +
    "</div>" +
    visitHTML +
    similarHTML +
    "</div></div>"
  );
}

function openPlaceModal(place, updateUrl) {
  // Store the trigger so focus can return when the modal closes
  state._modalTrigger = document.activeElement || null;

  var old = document.getElementById("place-modal-overlay");
  if (old) {
    old.remove();
    if (state.modalMapInst) {
      state.modalMapInst.remove();
      state.modalMapInst = null;
    }
  }
  state.modalPlace = place;
  if (updateUrl !== false && state.slug) {
    history.pushState(null, "", "#" + state.slug + "/" + slugify(place.name));
  }
  // SEO: update meta tags when place modal opens
  var cityMeta = state.cities.find(function (c) {
    return c.slug === state.slug;
  });
  updateMetaTags("place", { place: place, cityMeta: cityMeta });

  var overlay = document.createElement("div");
  overlay.id = "place-modal-overlay";
  overlay.className = "modal-overlay";
  overlay.setAttribute("role", "dialog");
  overlay.setAttribute("aria-modal", "true");
  overlay.setAttribute("aria-labelledby", "modal-place-name");

  // Safe HTML injection: all content is sanitized via esc() (see file header note)
  var safeHTML = modalInnerHTML(place);
  var frag = document.createRange().createContextualFragment(safeHTML);
  overlay.appendChild(frag);

  document.body.appendChild(overlay);
  document.body.classList.add("modal-open");

  requestAnimationFrame(function () {
    requestAnimationFrame(function () {
      overlay.classList.add("modal-overlay-visible");
    });
  });

  if (place.location && place.location.lat) {
    setTimeout(function () {
      initModalMap(place);
    }, 100);
  }
  bindModalEvents(overlay, place);
  trapFocus(overlay);

  var closeBtn = overlay.querySelector("#modal-close");
  if (closeBtn)
    setTimeout(function () {
      closeBtn.focus();
    }, 60);
}

function closePlaceModal(updateUrl) {
  var overlay = document.getElementById("place-modal-overlay");
  if (!overlay) return;
  overlay.classList.remove("modal-overlay-visible");
  if (overlay._cleanupTrap) overlay._cleanupTrap();
  setTimeout(function () {
    if (overlay.parentNode) overlay.remove();
    document.body.classList.remove("modal-open");
    state.modalPlace = null;
    if (state.modalMapInst) {
      state.modalMapInst.remove();
      state.modalMapInst = null;
    }
    // Return focus to the card that opened the modal
    if (state._modalTrigger && state._modalTrigger.focus) {
      state._modalTrigger.focus();
    }
    state._modalTrigger = null;
  }, 270);
  if (updateUrl !== false && state.slug) {
    history.pushState(null, "", "#" + state.slug);
  }
  // SEO: restore city meta tags when modal closes
  if (state.slug && state.cityData) {
    var closeCityMeta = state.cities.find(function (c) {
      return c.slug === state.slug;
    });
    if (closeCityMeta)
      updateMetaTags("city", {
        cityMeta: closeCityMeta,
        cityData: state.cityData,
      });
  }
}

function initModalMap(place) {
  var mapEl = document.getElementById("modal-map");
  if (!mapEl || typeof window.L === "undefined") return;
  if (!place.location || !place.location.lat) return;
  if (state.modalMapInst) {
    state.modalMapInst.remove();
    state.modalMapInst = null;
  }
  try {
    var map = L.map("modal-map", {
      zoomControl: true,
      scrollWheelZoom: false,
      attributionControl: false,
    });
    state.modalMapInst = map;
    var isModalDark = document.documentElement.dataset.theme === "dark";
    var modalTileUrl = isModalDark
      ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
      : "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png";
    L.tileLayer(modalTileUrl, {
      attribution: '© <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a> © <a href="https://carto.com/attributions" target="_blank">CARTO</a>',
      maxZoom: 19,
    }).addTo(map);
    var color = MAP_COL[place.category] || "#555";
    var marker = L.marker([place.location.lat, place.location.lng], {
      icon: L.divIcon({
        className: "map-marker",
        html:
          '<div class="map-marker-inner" style="background:' +
          color +
          ';width:18px;height:18px;border-width:3px"></div>',
        iconSize: [18, 18],
        iconAnchor: [9, 9],
        popupAnchor: [0, -12],
      }),
      alt: place.name,
    });
    marker.addTo(map);
    marker
      .bindPopup("<strong>" + esc(place.name) + "</strong>", {
        closeButton: false,
      })
      .openPopup();
    map.setView([place.location.lat, place.location.lng], 15);
  } catch (_) {}
}

function bindModalEvents(overlay, place) {
  var closeBtn = overlay.querySelector("#modal-close");
  if (closeBtn)
    closeBtn.addEventListener("click", function () {
      closePlaceModal();
    });

  overlay.addEventListener("click", function (e) {
    if (e.target === overlay) closePlaceModal();
  });

  var shareBtn = overlay.querySelector("#modal-share-btn");
  if (shareBtn) {
    shareBtn.addEventListener("click", function () {
      var url =
        location.origin +
        location.pathname +
        "#" +
        (state.slug || "") +
        "/" +
        slugify(place.name);
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard
          .writeText(url)
          .then(function () {
            showToast(t("modal_share_ok"));
          })
          .catch(function () {
            fallbackCopy(url);
            showToast(t("modal_share_ok"));
          });
      } else {
        fallbackCopy(url);
        showToast(t("modal_share_ok"));
      }
    });
  }

  var planBtn = overlay.querySelector("#modal-plan-btn");
  if (planBtn) {
    planBtn.addEventListener("click", function () {
      var pk = (state.slug || "") + "__" + slugify(place.name);
      var txt = planBtn.querySelector(".modal-plan-text");
      if (isPlanItem(pk)) {
        removeFromPlan(pk);
        planBtn.classList.remove("is-planned");
        if (txt) txt.textContent = t("plan_add");
        showToast(t("plan_removed"));
      } else {
        addToPlan(place);
        planBtn.classList.add("is-planned");
        if (txt) txt.textContent = t("plan_remove");
        showToast(t("plan_added"));
      }
      updatePlanBtn();
    });
  }

  var favBtn = overlay.querySelector("#modal-fav-btn");
  if (favBtn) {
    favBtn.addEventListener("click", function () {
      var favKey = (state.slug || "") + "__" + slugify(place.name);
      if (state.placeFavs.has(favKey)) {
        state.placeFavs.delete(favKey);
        favBtn.classList.remove("is-fav");
        favBtn.innerHTML = IC.heart;
        favBtn.setAttribute("aria-label", t("place_fav_add"));
      } else {
        state.placeFavs.add(favKey);
        favBtn.classList.add("is-fav");
        favBtn.innerHTML = IC.heartFill;
        favBtn.setAttribute("aria-label", t("place_fav_rm"));
      }
      savePlaceFavs();
    });
  }

  // ── Visit Tracking System ──────────────────────────────────────────
  var visitBtn = overlay.querySelector("#modal-visit-btn");
  var visitMeta = overlay.querySelector("#visit-meta");
  var dateInput = overlay.querySelector("#visit-date");
  var noteInput = overlay.querySelector("#visit-note");
  var visitKey = (state.slug || "") + "__" + slugify(place.name);

  if (visitBtn) {
    visitBtn.addEventListener("click", function () {
      if (isVisited(visitKey)) {
        // Remove visit
        unmarkVisited(visitKey);
        visitBtn.classList.remove("is-visited");
        var frag = document
          .createRange()
          .createContextualFragment(IC.check + " " + esc(t("visit_mark")));
        visitBtn.textContent = "";
        visitBtn.appendChild(frag);
        if (visitMeta) visitMeta.style.display = "none";
      } else {
        // Mark as visited with today's date
        var todayStr = new Date().toISOString().slice(0, 10);
        markVisited(visitKey, todayStr, "");
        visitBtn.classList.add("is-visited");
        var frag2 = document
          .createRange()
          .createContextualFragment(IC.check + " " + esc(t("visit_done")));
        visitBtn.textContent = "";
        visitBtn.appendChild(frag2);
        if (visitMeta) {
          visitMeta.style.display = "flex";
        }
        if (dateInput) {
          dateInput.value = todayStr;
        }
      }
      updateVisitedCards();
    });
  }

  // Update when date changes
  if (dateInput) {
    dateInput.addEventListener("change", function () {
      if (isVisited(visitKey)) {
        state.visits[visitKey].date = dateInput.value;
        saveVisits();
      }
    });
  }

  // Update when note is saved (blur)
  if (noteInput) {
    noteInput.addEventListener("blur", function () {
      if (isVisited(visitKey)) {
        state.visits[visitKey].note = noteInput.value;
        saveVisits();
      }
    });
  }

  // ── Similar Places ────────────────────────────────────────────────
  overlay
    .querySelectorAll(".similar-card[data-place-name]")
    .forEach(function (card) {
      card.addEventListener("click", function () {
        var pName = card.dataset.placeName;
        var similar =
          state.cityData &&
          state.cityData.places.find(function (p) {
            return p.name === pName;
          });
        if (similar) openPlaceModal(similar);
      });
    });
}

function bindPlaceCardClicks(container) {
  if (!container) return;
  container
    .querySelectorAll(".place-card-clickable[data-place-name]")
    .forEach(function (card) {
      card.addEventListener("click", function (e) {
        if (e.target.closest("a, .chip-tag")) return;
        var placeName = card.dataset.placeName;
        var place =
          state.cityData &&
          state.cityData.places.find(function (p) {
            return p.name === placeName;
          });
        if (place) openPlaceModal(place);
      });
      card.addEventListener("keydown", function (e) {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          var placeName = card.dataset.placeName;
          var place =
            state.cityData &&
            state.cityData.places.find(function (p) {
              return p.name === placeName;
            });
          if (place) openPlaceModal(place);
        }
      });

      // Hover → highlight map marker
      card.addEventListener("mouseenter", function () {
        if (!state.mapInstance) return;
        var md = state.mapMarkers[slugify(card.dataset.placeName)];
        if (!md) return;
        state.mapInstance.panTo(md.marker.getLatLng(), {
          animate: true,
          duration: 0.3,
        });
        md.marker.openPopup();
        var el = md.marker.getElement();
        if (el) {
          var inner = el.querySelector(".map-marker-inner");
          if (inner) inner.classList.add("map-pin-active");
        }
      });
      card.addEventListener("mouseleave", function () {
        var md = state.mapMarkers[slugify(card.dataset.placeName)];
        if (!md) return;
        md.marker.closePopup();
        var el = md.marker.getElement();
        if (el) {
          var inner = el.querySelector(".map-marker-inner");
          if (inner) inner.classList.remove("map-pin-active");
        }
      });
    });
}

// ── 13. Trip Planner ────────────────────────────────────────────────────

var DURATION = { muze: 90, gezi: 60, cami: 30, yemek: 45 };

function planItemKey(citySlug, placeName) {
  return (citySlug || "") + "__" + slugify(placeName);
}

function isPlanItem(key) {
  for (var i = 0; i < state.plan.length; i++) {
    if (state.plan[i].key === key) return true;
  }
  return false;
}

function estimateDuration(item) {
  return DURATION[item.category] || 45;
}

function formatDuration(totalMin) {
  var h = Math.floor(totalMin / 60),
    m = totalMin % 60;
  return state.lang === "tr"
    ? h > 0
      ? h + " sa" + (m > 0 ? " " + m + " dk" : "")
      : m + " dk"
    : h > 0
      ? h + "h" + (m > 0 ? " " + m + "m" : "")
      : m + "m";
}

function savePlan() {
  localStorage.setItem(LS_PLAN, JSON.stringify(state.plan));
}

function addToPlan(place) {
  var key = planItemKey(state.slug, place.name);
  if (isPlanItem(key)) return;
  state.plan.push({
    key: key,
    citySlug: state.slug || "",
    cityName: (state.cityData && state.cityData.city) || "",
    placeName: place.name,
    category: place.category || "",
    location: place.location || null,
  });
  savePlan();
}

function removeFromPlan(key) {
  state.plan = state.plan.filter(function (i) {
    return i.key !== key;
  });
  savePlan();
}

function clearPlan() {
  state.plan = [];
  savePlan();
}

function updatePlanBtn() {
  var fab = document.getElementById("plan-fab");
  if (!fab) return;
  var count = state.plan.length;
  var badge = fab.querySelector(".plan-fab-badge");
  var label = fab.querySelector(".plan-fab-label");
  fab.style.display = count > 0 ? "flex" : "none";
  if (badge) badge.textContent = count;
  if (label) label.textContent = state.lang === "tr" ? "Plan" : "Plan";
}

function planDrawerHTML() {
  var items = state.plan;
  var totalMin = items.reduce(function (s, i) {
    return s + estimateDuration(i);
  }, 0);
  var durStr = formatDuration(totalMin);
  var isTr = state.lang === "tr";
  var statsStr =
    "~" +
    durStr +
    " · " +
    items.length +
    (isTr ? " mekan" : " place" + (items.length !== 1 ? "s" : ""));

  var itemsHTML =
    items.length === 0
      ? '<li class="plan-empty">' + esc(t("plan_empty")) + "</li>"
      : items
          .map(function (item, idx) {
            return (
              '<li class="plan-item" draggable="true" data-key="' +
              esc(item.key) +
              '">' +
              '<span class="plan-drag" aria-hidden="true">&#8286;</span>' +
              '<span class="plan-item-num">' +
              (idx + 1) +
              "</span>" +
              '<div class="plan-item-info">' +
              '<span class="plan-item-name">' +
              esc(item.placeName) +
              "</span>" +
              '<span class="plan-item-city">' +
              esc(item.cityName) +
              "</span>" +
              "</div>" +
              '<span class="plan-item-dur">' +
              estimateDuration(item) +
              " dk</span>" +
              '<button class="plan-item-rm" data-key="' +
              esc(item.key) +
              '" aria-label="' +
              esc(t("plan_remove")) +
              ' ' +
              esc(item.placeName) +
              '">✕</button>' +
              '<div class="plan-item-reorder">' +
              '<button class="plan-item-move" data-move="up" data-key="' +
              esc(item.key) +
              '" aria-label="' +
              esc(t("plan_move_up")) +
              '" ' +
              (idx === 0 ? "disabled" : "") +
              '>▲</button>' +
              '<button class="plan-item-move" data-move="down" data-key="' +
              esc(item.key) +
              '" aria-label="' +
              esc(t("plan_move_down")) +
              '" ' +
              (idx === items.length - 1 ? "disabled" : "") +
              '>▼</button>' +
              '</div>' +
              "</li>"
            );
          })
          .join("");

  var located = items.filter(function (i) {
    return i.location && i.location.lat;
  });
  var routeUrl =
    located.length > 1
      ? buildRouteUrl(
          located.map(function (i) {
            return { location: i.location };
          }),
        )
      : "";

  return (
    '<div class="plan-drawer-panel">' +
    '<div class="plan-drawer-header">' +
    '<h2 class="plan-drawer-title" id="plan-drawer-title">' +
    IC.plan +
    " " +
    esc(t("plan_title")) +
    "</h2>" +
    '<div class="plan-drawer-actions">' +
    (items.length > 0
      ? '<button class="plan-clear-btn" id="plan-clear">' +
        esc(t("plan_clear")) +
        "</button>"
      : "") +
    '<button class="plan-close-btn" id="plan-drawer-close" aria-label="' +
    esc(t("modal_close")) +
    '">' +
    IC.xMark +
    "</button>" +
    "</div></div>" +
    '<ol class="plan-list" id="plan-list">' +
    itemsHTML +
    "</ol>" +
    (items.length > 0
      ? '<div class="plan-footer">' +
        '<div class="plan-stats">' +
        esc(statsStr) +
        "</div>" +
        (routeUrl
          ? '<a class="plan-route-btn" href="' +
            esc(routeUrl) +
            '" target="_blank" rel="noopener noreferrer">' +
            IC.mapPin +
            " " +
            esc(t("plan_route")) +
            "</a>"
          : "") +
        '<button class="plan-share-btn" id="plan-share">' +
        IC.share +
        " " +
        esc(t("plan_share")) +
        "</button>" +
        "</div>"
      : "") +
    "</div>"
  );
}

function renderPlanDrawer() {
  var drawer = document.getElementById("plan-drawer");
  if (!drawer) return;
  var old = drawer.querySelector(".plan-drawer-panel");
  if (old) old.remove();
  var frag = document.createRange().createContextualFragment(planDrawerHTML());
  drawer.appendChild(frag);
  bindPlanDrawerEvents(drawer);
  updatePlanBtn();
}

function openPlanDrawer() {
  if (document.getElementById("plan-drawer")) {
    closePlanDrawer();
    return;
  }

  // Remember the element that triggered the drawer so we can restore focus
  state._planDrawerTrigger = document.activeElement || null;

  var overlay = document.createElement("div");
  overlay.id = "plan-overlay";
  overlay.className = "plan-overlay";
  overlay.addEventListener("click", closePlanDrawer);
  document.body.appendChild(overlay);

  var drawer = document.createElement("div");
  drawer.id = "plan-drawer";
  drawer.className = "plan-drawer";
  // Drawer is a dialog — give it the correct ARIA semantics
  drawer.setAttribute("role", "dialog");
  drawer.setAttribute("aria-modal", "true");
  drawer.setAttribute("aria-labelledby", "plan-drawer-title");
  var frag = document.createRange().createContextualFragment(planDrawerHTML());
  drawer.appendChild(frag);
  document.body.appendChild(drawer);

  requestAnimationFrame(function () {
    requestAnimationFrame(function () {
      overlay.classList.add("plan-overlay-visible");
      drawer.classList.add("plan-drawer-open");
      // Move focus to the close button inside the drawer
      var closeBtn = drawer.querySelector("#plan-drawer-close");
      if (closeBtn) closeBtn.focus();
    });
  });
  bindPlanDrawerEvents(drawer);
  trapFocus(drawer);
}

function closePlanDrawer() {
  var overlay = document.getElementById("plan-overlay");
  var drawer = document.getElementById("plan-drawer");
  if (overlay) overlay.classList.remove("plan-overlay-visible");
  if (drawer) {
    drawer.classList.remove("plan-drawer-open");
    if (drawer._cleanupTrap) drawer._cleanupTrap();
  }
  setTimeout(function () {
    if (overlay && overlay.parentNode) overlay.remove();
    if (drawer && drawer.parentNode) drawer.remove();
    // Return focus to the element that opened the drawer
    if (state._planDrawerTrigger && state._planDrawerTrigger.focus) {
      state._planDrawerTrigger.focus();
    }
    state._planDrawerTrigger = null;
  }, 280);
}

function bindPlanDrawerEvents(drawer) {
  var closeBtn = drawer.querySelector("#plan-drawer-close");
  if (closeBtn) closeBtn.addEventListener("click", closePlanDrawer);

  var clearBtn = drawer.querySelector("#plan-clear");
  if (clearBtn)
    clearBtn.addEventListener("click", function () {
      clearPlan();
      renderPlanDrawer();
    });

  var shareBtn = drawer.querySelector("#plan-share");
  if (shareBtn) shareBtn.addEventListener("click", sharePlan);

  drawer.querySelectorAll(".plan-item-rm[data-key]").forEach(function (btn) {
    btn.addEventListener("click", function (e) {
      e.stopPropagation();
      removeFromPlan(btn.dataset.key);
      renderPlanDrawer();
    });
  });

  // Keyboard reorder — move up / move down buttons
  drawer.querySelectorAll(".plan-item-move[data-key]").forEach(function (btn) {
    btn.addEventListener("click", function (e) {
      e.stopPropagation();
      var key = btn.dataset.key;
      var direction = btn.dataset.move;
      var idx = state.plan.findIndex(function (p) { return p.key === key; });
      if (idx === -1) return;
      var swapIdx = direction === "up" ? idx - 1 : idx + 1;
      if (swapIdx < 0 || swapIdx >= state.plan.length) return;
      var tmp = state.plan[idx];
      state.plan[idx] = state.plan[swapIdx];
      state.plan[swapIdx] = tmp;
      savePlan();
      renderPlanDrawer();
      // Restore focus to the moved item's button in the new position
      setTimeout(function () {
        var moved = drawer.querySelector(
          '.plan-item-move[data-key="' + key + '"][data-move="' + direction + '"]'
        );
        if (moved && !moved.disabled) moved.focus();
      }, 30);
    });
  });

  bindPlanDragDrop(drawer.querySelector("#plan-list"));
}

function bindPlanDragDrop(listEl) {
  if (!listEl) return;
  var dragSrc = null;

  listEl.querySelectorAll(".plan-item[draggable]").forEach(function (item) {
    item.addEventListener("dragstart", function (e) {
      dragSrc = item;
      item.classList.add("plan-dragging");
      e.dataTransfer.effectAllowed = "move";
      e.dataTransfer.setData("text/plain", item.dataset.key);
    });
    item.addEventListener("dragend", function () {
      item.classList.remove("plan-dragging");
      listEl.querySelectorAll(".plan-item").forEach(function (i) {
        i.classList.remove("plan-drag-over");
      });
      dragSrc = null;
    });
    item.addEventListener("dragover", function (e) {
      e.preventDefault();
      if (dragSrc && dragSrc !== item) {
        listEl.querySelectorAll(".plan-item").forEach(function (i) {
          i.classList.remove("plan-drag-over");
        });
        item.classList.add("plan-drag-over");
      }
    });
    item.addEventListener("drop", function (e) {
      e.preventDefault();
      item.classList.remove("plan-drag-over");
      if (!dragSrc || dragSrc === item) return;
      var srcKey = dragSrc.dataset.key,
        tgtKey = item.dataset.key;
      var srcIdx = -1,
        tgtIdx = -1;
      state.plan.forEach(function (p, i) {
        if (p.key === srcKey) srcIdx = i;
        if (p.key === tgtKey) tgtIdx = i;
      });
      if (srcIdx !== -1 && tgtIdx !== -1) {
        var tmp = state.plan[srcIdx];
        state.plan[srcIdx] = state.plan[tgtIdx];
        state.plan[tgtIdx] = tmp;
        savePlan();
        renderPlanDrawer();
      }
    });
  });
}

function sharePlan() {
  var keys = state.plan
    .slice(0, 20)
    .map(function (i) {
      return i.key;
    })
    .join(",");
  var url = location.origin + location.pathname + "#?plan=" + keys;
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard
      .writeText(url)
      .then(function () {
        showToast(t("plan_share_ok"));
      })
      .catch(function () {
        fallbackCopy(url);
        showToast(t("plan_share_ok"));
      });
  } else {
    fallbackCopy(url);
    showToast(t("plan_share_ok"));
  }
}

function loadPlanFromUrl() {
  var hash = location.hash;
  if (hash.indexOf("?plan=") === -1) return false;
  var param = hash.split("?plan=")[1] || "";
  param
    .split(",")
    .filter(Boolean)
    .forEach(function (key) {
      if (isPlanItem(key)) return;
      var parts = key.split("__");
      var citySlug = parts[0] || "";
      var placeSlug = parts.slice(1).join("__");
      state.plan.push({
        key: key,
        citySlug: citySlug,
        cityName: citySlug,
        placeName: placeSlug.replace(/-/g, " "),
        category: "",
        location: null,
      });
    });
  savePlan();
  updatePlanBtn();
  return true;
}

function createPlanFab() {
  if (document.getElementById("plan-fab")) return;
  var fab = document.createElement("button");
  fab.id = "plan-fab";
  fab.className = "plan-fab";
  fab.style.display = "none";
  fab.setAttribute(
    "aria-label",
    state.lang === "tr" ? "Gezi planını aç" : "Open trip plan",
  );

  var iconSpan = document.createElement("span");
  iconSpan.setAttribute("aria-hidden", "true");
  iconSpan.appendChild(
    document.createRange().createContextualFragment(IC.plan),
  );

  var labelSpan = document.createElement("span");
  labelSpan.className = "plan-fab-label";
  labelSpan.textContent = state.lang === "tr" ? "Plan" : "Plan";

  var badge = document.createElement("span");
  badge.className = "plan-fab-badge";
  badge.textContent = "0";

  fab.appendChild(iconSpan);
  fab.appendChild(labelSpan);
  fab.appendChild(badge);
  fab.addEventListener("click", openPlanDrawer);
  document.body.appendChild(fab);
  updatePlanBtn();
}

// ── 13b. Nearby Places (Geolocation) ───────────────────────────────

function haversineKm(lat1, lng1, lat2, lng2) {
  var R = 6371;
  var dLat = ((lat2 - lat1) * Math.PI) / 180;
  var dLng = ((lng2 - lng1) * Math.PI) / 180;
  var a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function fmtDist(km) {
  return km < 1 ? Math.round(km * 1000) + " m" : km.toFixed(1) + " km";
}

function getUserLocation(onSuccess) {
  if (!navigator.geolocation) {
    showToast(t("nearby_unsup"));
    return;
  }
  showToast(t("nearby_getting"));
  navigator.geolocation.getCurrentPosition(
    function (pos) {
      state.userLat = pos.coords.latitude;
      state.userLng = pos.coords.longitude;
      showToast(t("nearby_got"));
      if (onSuccess) onSuccess();
    },
    function () {
      showToast(t("nearby_denied"));
    },
    { enableHighAccuracy: false, timeout: 8000 },
  );
}

// Returns the nearest place in the current city
function buildNearestPlaceInfo() {
  if (!state.cityData || state.userLat === null) return "";
  var places = state.cityData.places.filter(function (p) {
    return p.location && p.location.lat;
  });
  if (!places.length) return "";
  var best = null;
  places.forEach(function (p) {
    var d = haversineKm(
      state.userLat,
      state.userLng,
      p.location.lat,
      p.location.lng,
    );
    if (!best || d < best.d) best = { p: p, d: d };
  });
  if (!best) return "";
  return (
    '<span class="nearby-info">' +
    IC.mapPin +
    " " +
    esc(t("nearby_label")) +
    " <strong>" +
    esc(best.p.name) +
    "</strong>" +
    ' <span class="nearby-dist">' +
    esc(fmtDist(best.d)) +
    "</span></span>"
  );
}

// Returns the nearest city for the home screen
function getNearestCity() {
  if (state.userLat === null || !state.cities.length) return null;
  var best = null;
  state.cities.forEach(function (city) {
    var center = CITY_CENTERS[city.slug];
    if (!center) return;
    var d = haversineKm(state.userLat, state.userLng, center[0], center[1]);
    if (!best || d < best.d) best = { city: city, d: d };
  });
  return best;
}

// ── 14. Advanced Search & Autocomplete ──────────────────────────────

// One-time Promise — prevents concurrent duplicate fetches
var _allPlacesPromise = null;

function loadAllPlaces() {
  if (state.allPlacesLoaded) return Promise.resolve();
  if (_allPlacesPromise) return _allPlacesPromise;
  _allPlacesPromise = Promise.all(
    state.cities.map(function (city) {
      return fetchJSON(city.data)
        .then(function (data) {
          return data.places.map(function (p) {
            return {
              name: p.name,
              category: p.category,
              citySlug: city.slug,
              cityName: data.city,
              tags: p.tags || [],
              openHours: p.openHours || "",
            };
          });
        })
        .catch(function () {
          return [];
        });
    }),
  ).then(function (results) {
    state.allPlaces = [].concat.apply([], results);
    state.allPlacesLoaded = true;
    _allPlacesPromise = null;
  });
  return _allPlacesPromise;
}

function runSearch(query) {
  if (!query || !state.allPlacesLoaded) return [];
  var q = query.toLowerCase().trim();
  return state.allPlaces
    .filter(function (p) {
      return (
        p.name.toLowerCase().indexOf(q) !== -1 ||
        p.cityName.toLowerCase().indexOf(q) !== -1 ||
        p.tags.some(function (tag) {
          return tag.toLowerCase().indexOf(q) !== -1;
        })
      );
    })
    .slice(0, 8);
}

function loadSearchHist() {
  return JSON.parse(localStorage.getItem(LS_SEARCH_HIST) || "[]");
}

function addToSearchHist(query) {
  if (!query || !query.trim()) return;
  var q = query.trim();
  var hist = loadSearchHist().filter(function (h) {
    return h !== q;
  });
  hist.unshift(q);
  if (hist.length > MAX_HIST) hist = hist.slice(0, MAX_HIST);
  localStorage.setItem(LS_SEARCH_HIST, JSON.stringify(hist));
}

function removeFromSearchHist(query) {
  var hist = loadSearchHist().filter(function (h) {
    return h !== query;
  });
  localStorage.setItem(LS_SEARCH_HIST, JSON.stringify(hist));
}

function closeAutocomplete() {
  var ac = document.getElementById("ac-dropdown");
  if (!ac) return;
  if (ac._cleanupPos) ac._cleanupPos();
  ac.remove();
  // Announce collapsed state to screen readers
  var inp = document.getElementById("search-input");
  if (inp) {
    inp.setAttribute("aria-expanded", "false");
    inp.setAttribute("aria-activedescendant", "");
  }
}

// Appends the dropdown to body using viewport coordinates.
// Prevents clipping by .hero { overflow: hidden }.
function positionAutocomplete(inp) {
  var ac = document.getElementById("ac-dropdown");
  if (!ac || !inp) return;
  var r = inp.getBoundingClientRect();
  ac.style.top = r.bottom + 6 + window.scrollY + "px";
  ac.style.left = r.left + window.scrollX + "px";
  ac.style.width = r.width + "px";
}

function openAutocomplete(inp, items, isHist) {
  closeAutocomplete();
  if (!items || !items.length) return;
  if (!inp) return;

  var itemsHTML = items
    .map(function (item, idx) {
      var optId = "ac-opt-" + idx;
      if (isHist) {
        // History items: the option element holds text; the delete button is
        // a sibling so it does not violate the rule against interactive
        // children inside role="option".
        return (
          '<div class="ac-hist-row" style="display:flex;align-items:center">' +
          '<div class="ac-item ac-hist-item" role="option" aria-selected="false" ' +
          'id="' + optId + '" tabindex="-1" data-query="' +
          esc(item) +
          '">' +
          '<span class="ac-item-icon" aria-hidden="true">' +
          IC.clock +
          "</span>" +
          '<span class="ac-item-text">' +
          esc(item) +
          "</span>" +
          "</div>" +
          '<button class="ac-hist-rm" data-query="' +
          esc(item) +
          '" aria-label="' +
          esc(t("hist_remove") + ": " + item) +
          '" tabindex="-1">' +
          IC.xMark +
          "</button>" +
          "</div>"
        );
      }
      return (
        '<div class="ac-item" role="option" aria-selected="false" ' +
        'id="' + optId + '" tabindex="-1" ' +
        'data-city="' +
        esc(item.citySlug) +
        '" data-place="' +
        esc(slugify(item.name)) +
        '">' +
        '<span class="ac-item-icon" aria-hidden="true">' +
        (CAT_IC[item.category] || IC.mapPin) +
        "</span>" +
        '<div class="ac-item-info">' +
        '<span class="ac-item-name">' +
        esc(item.name) +
        "</span>" +
        '<span class="ac-item-city">' +
        esc(item.cityName) +
        "</span>" +
        "</div>" +
        '<span class="ac-badge badge badge-' +
        esc(item.category) +
        '">' +
        esc(t("cats." + item.category)) +
        "</span>" +
        "</div>"
      );
    })
    .join("");

  var ac = document.createElement("div");
  ac.id = "ac-dropdown";
  ac.className = "ac-dropdown";
  ac.setAttribute("role", "listbox");

  var frag = document.createRange().createContextualFragment(itemsHTML);
  ac.appendChild(frag);
  // Append to body — to avoid clipping by .hero overflow:hidden
  document.body.appendChild(ac);
  positionAutocomplete(inp);

  // Mark the combobox input as expanded and link it to the listbox
  inp.setAttribute("aria-expanded", "true");
  inp.setAttribute("aria-activedescendant", "");

  // Update position on scroll / resize
  var _rePos = function () {
    positionAutocomplete(inp);
  };
  window.addEventListener("scroll", _rePos, { passive: true });
  window.addEventListener("resize", _rePos, { passive: true });
  ac._cleanupPos = function () {
    window.removeEventListener("scroll", _rePos);
    window.removeEventListener("resize", _rePos);
  };

  // Click on place results
  ac.querySelectorAll(".ac-item[data-city]").forEach(function (el) {
    el.addEventListener("mousedown", function (e) {
      e.preventDefault();
      var q = inp ? inp.value.trim() : "";
      if (q) addToSearchHist(q);
      closeAutocomplete();
      state.search = "";
      location.hash = el.dataset.city + "/" + el.dataset.place;
    });
  });

  // Click on history items
  ac.querySelectorAll(".ac-item[data-query]").forEach(function (el) {
    el.addEventListener("mousedown", function (e) {
      if (e.target.closest(".ac-hist-rm")) return;
      e.preventDefault();
      var q = el.dataset.query;
      if (inp) inp.value = q;
      state.search = q;
      closeAutocomplete();
      renderCityList();
    });
  });

  // Delete-from-history buttons
  ac.querySelectorAll(".ac-hist-rm").forEach(function (btn) {
    btn.addEventListener("mousedown", function (e) {
      e.preventDefault();
      e.stopPropagation();
      removeFromSearchHist(btn.dataset.query);
      var freshInp = document.getElementById("search-input");
      var hist = loadSearchHist();
      if (hist.length && freshInp) openAutocomplete(freshInp, hist, true);
      else closeAutocomplete();
    });
  });
}

// Refresh autocomplete content for a specific input (after render)
function refreshAutocomplete(inp) {
  if (!inp) return;
  var q = inp.value.trim();
  if (!q) {
    var hist = loadSearchHist();
    if (hist.length) openAutocomplete(inp, hist, true);
    else closeAutocomplete();
  } else if (state.allPlacesLoaded) {
    var results = runSearch(q);
    if (results.length) openAutocomplete(inp, results, false);
    else closeAutocomplete();
  } else {
    closeAutocomplete();
    loadAllPlaces().then(function () {
      var fi = document.getElementById("search-input");
      if (fi && state.search === q) {
        var r = runSearch(q);
        if (r.length) openAutocomplete(fi, r, false);
      }
    });
  }
}

// ── 15. Share Favorites ──────────────────────────────────────────────

function shareFavorites() {
  var slugs = Array.from(state.favorites).join(",");
  var url = location.origin + location.pathname + "#?favs=" + slugs;

  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard
      .writeText(url)
      .then(function () {
        showToast(t("favs_copied"));
      })
      .catch(function () {
        fallbackCopy(url);
      });
  } else {
    fallbackCopy(url);
  }
}

function fallbackCopy(text) {
  var el = document.createElement("textarea");
  el.value = text;
  el.style.cssText = "position:fixed;top:-999px;left:-999px";
  document.body.appendChild(el);
  el.select();
  try {
    document.execCommand("copy");
    showToast(t("favs_copied"));
  } catch (_) {}
  el.remove();
}

function loadSharedFavs() {
  var hash = location.hash;
  if (hash.indexOf("?favs=") === -1) return false;
  var favsParam = hash.split("?favs=")[1] || "";
  favsParam
    .split(",")
    .filter(Boolean)
    .forEach(function (slug) {
      state.favorites.add(slug);
    });
  saveFavs();
  return true;
}

// ── Focus trap utility ────────────────────────────────────────────────
// Constrains Tab/Shift+Tab navigation within a container element.
// Returns a cleanup function; also stores it on container._cleanupTrap.
function trapFocus(container) {
  var FOCUSABLE =
    'a[href], button:not([disabled]), textarea, input, select, ' +
    '[tabindex]:not([tabindex="-1"])';

  function getFocusable() {
    return Array.from(container.querySelectorAll(FOCUSABLE)).filter(function (el) {
      return !el.closest('[aria-hidden="true"]') && el.offsetParent !== null;
    });
  }

  function onKeyDown(e) {
    if (e.key !== "Tab") return;
    var focusable = getFocusable();
    if (!focusable.length) return;
    var first = focusable[0];
    var last = focusable[focusable.length - 1];
    if (e.shiftKey) {
      if (document.activeElement === first) {
        e.preventDefault();
        last.focus();
      }
    } else {
      if (document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  }

  container.addEventListener("keydown", onKeyDown);
  container._cleanupTrap = function () {
    container.removeEventListener("keydown", onKeyDown);
  };
  return container._cleanupTrap;
}

// ── 13. Toast ─────────────────────────────────────────────────────────

function showToast(msg) {
  var old = document.querySelector(".toast");
  if (old) old.remove();
  var toast = document.createElement("div");
  toast.className = "toast";
  toast.textContent = msg;
  toast.setAttribute("role", "status");
  toast.setAttribute("aria-live", "polite");
  document.body.appendChild(toast);
  requestAnimationFrame(function () {
    requestAnimationFrame(function () {
      toast.classList.add("toast-show");
    });
  });
  setTimeout(function () {
    toast.classList.remove("toast-show");
    setTimeout(function () {
      toast.remove();
    }, 300);
  }, 2500);
}

// ── 13b. SEO — Meta Tag & JSON-LD Management ───────────────────────

var SEO_BASE_URL = "https://abdullahsahin.org/seyyah/";
var SEO_OG_IMAGE = SEO_BASE_URL + "/icons/icon-512.svg";

/** Add / update a meta tag (by name or property attribute) */
function setMeta(attr, key, value) {
  var el = document.querySelector("meta[" + attr + '="' + key + '"]');
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute("content", value || "");
}

/** Add / update a link rel tag */
function setLink(rel, href) {
  var el = document.querySelector('link[rel="' + rel + '"]');
  if (!el) {
    el = document.createElement("link");
    el.setAttribute("rel", rel);
    document.head.appendChild(el);
  }
  el.setAttribute("href", href || "");
}

/** Convert a place category to a Schema.org type */
function categoryToSchema(cat) {
  var map = {
    yemek: "FoodEstablishment",
    cami: "PlaceOfWorship",
    muze: "Museum",
    gezi: "TouristAttraction",
  };
  return map[cat] || "TouristAttraction";
}

/** Update the JSON-LD script tag */
function setJsonLd(obj) {
  var ldEl = document.getElementById("ld-json");
  if (!ldEl) {
    ldEl = document.createElement("script");
    ldEl.id = "ld-json";
    ldEl.type = "application/ld+json";
    document.head.appendChild(ldEl);
  }
  ldEl.textContent = JSON.stringify(obj, null, 2);
}

// ── AI SEO helpers ──────────────────────────────────────────────────

/** FAQ schema: Q&A block for the city page */
function buildCityFAQ(cityData, cityMeta, isTr) {
  var cityName   = cityData.city || cityMeta.city;
  var places     = cityData.places || [];
  var foods      = places.filter(function(p) { return p.category === 'yemek'; });
  var museums    = places.filter(function(p) { return p.category === 'muze'; });
  var mosques    = places.filter(function(p) { return p.category === 'cami'; });
  var sights     = places.filter(function(p) { return p.category === 'gezi'; });
  var seasonNote = (cityData.seasons && cityData.seasons.note) || '';
  var foodNames  = foods.map(function(p) { return p.name; }).join(', ');
  var allSights  = [].concat(museums, mosques, sights).map(function(p) { return p.name; }).join(', ');

  var pairs = isTr ? [
    {
      q: cityName + "'te ne yenir? En iyi restoranlar nerede?",
      a: foodNames
        ? cityName + "'nin öne çıkan lezzetleri: " + foodNames + ". " + (foods[0] ? foods[0].description : '')
        : cityName + "'te yerel mutfaktan tatmaya değer pek çok seçenek bulunmaktadır.",
    },
    {
      q: cityName + " hangi mevsimde gezilir? Ne zaman gidilmeli?",
      a: seasonNote || (cityName + " yıl boyunca ziyaret edilebilir. İlkbahar ve sonbahar genel olarak en konforlu dönemlerdir."),
    },
    {
      q: cityName + "'de mutlaka görülmesi gereken yerler neler?",
      a: allSights
        ? cityName + "'in öne çıkan gezilecek yerleri: " + allSights + "."
        : cityName + " birçok tarihi ve kültürel alan barındırmaktadır.",
    },
    {
      q: cityName + "'te kaç günde gezilir?",
      a: places.length > 8
        ? "Detaylı bir gezi için " + cityName + "'e en az 3-4 gün ayırmanızı öneririz."
        : "Temel noktaları görmek için " + cityName + "'e 2 gün yeterlidir.",
    },
  ] : [
    {
      q: "What to eat in " + cityName + "? Best restaurants?",
      a: foodNames
        ? "Top food spots in " + cityName + ": " + foodNames + ". " + (foods[0] ? foods[0].description : '')
        : "There are many local cuisine options worth trying in " + cityName + ".",
    },
    {
      q: "Best time to visit " + cityName + "?",
      a: seasonNote || ("Spring and early autumn are generally the most comfortable seasons to visit " + cityName + "."),
    },
    {
      q: "What are the must-see places in " + cityName + "?",
      a: allSights
        ? "Top attractions in " + cityName + ": " + allSights + "."
        : cityName + " has numerous historical and cultural sites worth visiting.",
    },
    {
      q: "How many days do you need in " + cityName + "?",
      a: places.length > 8
        ? "We recommend at least 3-4 days in " + cityName + " for a thorough visit."
        : "2 days are sufficient to cover the main highlights of " + cityName + ".",
    },
  ];

  return {
    '@type': 'FAQPage',
    mainEntity: pairs.map(function(pair) {
      return { '@type': 'Question', name: pair.q, acceptedAnswer: { '@type': 'Answer', text: pair.a } };
    }),
  };
}

/** FAQ schema: Q&A block for the place modal */
function buildPlaceFAQ(place, cityMeta, isTr) {
  var cityName = cityMeta ? cityMeta.city : '';
  var pairs = isTr ? [
    {
      q: place.name + " nerede? Nasıl gidilir?",
      a: place.name + ", " + cityName + "'de yer almaktadır."
        + (place.location && place.location.lat ? " Koordinatlar: " + place.location.lat + ", " + place.location.lng + "." : ""),
    },
    {
      q: place.name + " açık mı? Çalışma saatleri nedir?",
      a: place.openHours
        ? place.name + " çalışma saatleri: " + place.openHours + "."
        : place.name + " ziyaret saatleri için resmi kaynakları kontrol etmenizi öneririz.",
    },
    {
      q: place.name + " hakkında bilgi?",
      a: place.description || (place.name + ", " + cityName + "'nin önemli bir ziyaret noktasıdır."),
    },
  ] : [
    {
      q: "Where is " + place.name + "? How to get there?",
      a: place.name + " is located in " + cityName + "."
        + (place.location && place.location.lat ? " Coordinates: " + place.location.lat + ", " + place.location.lng + "." : ""),
    },
    {
      q: "Is " + place.name + " open? What are the opening hours?",
      a: place.openHours
        ? place.name + " opening hours: " + place.openHours + "."
        : "Please check official sources for the current opening hours of " + place.name + ".",
    },
    {
      q: "What is " + place.name + "?",
      a: place.description || (place.name + " is a notable attraction in " + cityName + "."),
    },
  ];

  return {
    '@type': 'FAQPage',
    mainEntity: pairs.map(function(pair) {
      return { '@type': 'Question', name: pair.q, acceptedAnswer: { '@type': 'Answer', text: pair.a } };
    }),
  };
}

/** HowTo schema: how to plan a city trip */
function buildCityHowTo(cityData, cityMeta, isTr) {
  var cityName = cityData.city || cityMeta.city;
  var places   = cityData.places || [];
  var sights   = places.filter(function(p) { return p.category !== 'yemek'; }).slice(0, 3);
  var foods    = places.filter(function(p) { return p.category === 'yemek'; }).slice(0, 2);
  var seasonNote = (cityData.seasons && cityData.seasons.note) || '';

  if (isTr) {
    return {
      '@type': 'HowTo',
      name: cityName + " Gezi Planı Nasıl Yapılır?",
      description: cityName + "'i en verimli şekilde gezmek için adım adım rehber.",
      step: [
        {
          '@type': 'HowToStep',
          name: "Tarihi ve kültürel mekanları planlayın",
          text: sights.length
            ? "Önce tarihi merkezden başlayın. " + cityName + "'nin öne çıkan yerleri: " + sights.map(function(p) { return p.name; }).join(', ') + "."
            : "Önce şehrin tarihi merkezini ve müzelerini gezip zaman ayarlayın.",
        },
        {
          '@type': 'HowToStep',
          name: "Yerel lezzetleri deneyin",
          text: foods.length
            ? "Öğle veya akşam yemeğinde yerel lezzetleri tatmayı ihmal etmeyin: " + foods.map(function(p) { return p.name; }).join(', ') + "."
            : "Yerel restoranları ve çarşıları gezin.",
        },
        {
          '@type': 'HowToStep',
          name: "Mevsime göre hazırlanın",
          text: seasonNote || "Ziyaret dönemine göre uygun kıyafet hazırlayın.",
        },
        {
          '@type': 'HowToStep',
          name: "Seyyah uygulamasıyla takip edin",
          text: "Tüm mekanları Seyyah'ta favorilere ekleyin, gezi planınıza alın ve harita ile konum bulun.",
        },
      ],
    };
  } else {
    return {
      '@type': 'HowTo',
      name: "How to Plan a Trip to " + cityName + "?",
      description: "Step-by-step guide to exploring " + cityName + " efficiently.",
      step: [
        {
          '@type': 'HowToStep',
          name: "Plan your historical and cultural sites",
          text: sights.length
            ? "Start from the historic center. Top sights in " + cityName + ": " + sights.map(function(p) { return p.name; }).join(', ') + "."
            : "Start with the historic center and main museums.",
        },
        {
          '@type': 'HowToStep',
          name: "Try local food",
          text: foods.length
            ? "Don't miss local flavors: " + foods.map(function(p) { return p.name; }).join(', ') + "."
            : "Explore local restaurants and bazaars.",
        },
        {
          '@type': 'HowToStep',
          name: "Prepare for the season",
          text: seasonNote || "Pack accordingly for your travel season.",
        },
        {
          '@type': 'HowToStep',
          name: "Track with Seyyah",
          text: "Add all places to favorites on Seyyah, build your trip plan, and use the map to navigate.",
        },
      ],
    };
  }
}

/** Speakable: CSS selectors for AI voice responses */
function buildSpeakable(cssSelectors) {
  return { '@type': 'SpeakableSpecification', cssSelector: cssSelectors };
}

/** Update the second JSON-LD script tag (for AI schemas) */
function setJsonLdAI(obj) {
  var ldEl = document.getElementById('ld-json-ai');
  if (!ldEl) {
    ldEl = document.createElement('script');
    ldEl.id   = 'ld-json-ai';
    ldEl.type = 'application/ld+json';
    document.head.appendChild(ldEl);
  }
  ldEl.textContent = JSON.stringify(obj, null, 2);
}

/**
 * updateMetaTags(type, data)
 *  type: 'home' | 'city' | 'place'
 *  data: (home) undefined | (city) {cityMeta, cityData} | (place) {place, cityMeta}
 */
function updateMetaTags(type, data) {
  var lang  = state.lang;
  var isTr  = lang === 'tr';
  var title, desc, url, ldJson, ldJsonAI;

  if (type === 'home') {
    title = isTr ? "Seyyah — Türkiye'nin şehirlerini keşfet" : 'Seyyah — Explore Turkey';
    desc  = isTr
      ? "Türkiye'nin şehirlerini keşfetmek için sade, hızlı gezi rehberi."
      : "A simple, fast travel guide for discovering Turkey's cities.";
    url   = SEO_BASE_URL + '/';

    ldJson = {
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'WebSite',
          name: 'Seyyah',
          url: SEO_BASE_URL,
          description: desc,
          inLanguage: isTr ? 'tr-TR' : 'en',
          potentialAction: {
            '@type': 'SearchAction',
            target: { '@type': 'EntryPoint', urlTemplate: SEO_BASE_URL + '/#?q={search_term_string}' },
            'query-input': 'required name=search_term_string',
          },
        },
        {
          '@type': 'Organization',
          name: 'Seyyah',
          url: SEO_BASE_URL,
          logo: { '@type': 'ImageObject', url: SEO_OG_IMAGE },
        },
        {
          '@type': 'ItemList',
          name: isTr ? "Türkiye'nin Şehirleri" : 'Cities of Turkey',
          itemListElement: state.cities.map(function(city, i) {
            return { '@type': 'ListItem', position: i + 1, name: city.city, url: SEO_BASE_URL + '/#' + city.slug };
          }),
        },
      ],
    };

    // AI SEO: Ana sayfa FAQ + Speakable
    var homeFAQ = isTr ? [
      {
        q: "Türkiye'de hangi şehirler gezilmeli?",
        a: "Türkiye'nin öne çıkan gezi şehirleri: İstanbul (tarihi merkezler), İzmir (Ege kıyısı, Efes), Gaziantep (gastronomi başkenti), Trabzon (Karadeniz doğası), Konya (Mevlana), Ankara (Anıtkabir, müzeler).",
      },
      {
        q: "Türkiye ne zaman gezilir? En iyi mevsim hangisi?",
        a: "Genel olarak ilkbahar (Nisan–Mayıs) ve erken sonbahar (Eylül–Ekim) en ideal dönemlerdir. Her bölgenin iklimi farklıdır: Trabzon için yaz, Konya için Aralık, Gaziantep için Mart–Nisan önerilir.",
      },
      {
        q: "Türkiye'de en iyi yemek nerede yenir?",
        a: "Gaziantep UNESCO Yaratıcı Gastronomi Şehri'dir — baklava ve kebap için vazgeçilmez. İstanbul çok kültürlü mutfağıyla, İzmir ise deniz ürünleri ve kumrusuyla öne çıkar.",
      },
      {
        q: "Efes Antik Kenti nerede?",
        a: "Efes, İzmir'e yaklaşık 80 km uzaklıkta, Selçuk ilçesindedir. İzmir üzerinden kolayca ulaşılabilir.",
      },
      {
        q: "Mevlana Müzesi nerede, nasıl gidilir?",
        a: "Mevlana Müzesi ve Türbesi, Konya şehir merkezinde yer almaktadır. Aralık ayındaki Şeb-i Arus törenleri için dünyadan ziyaretçi çeker.",
      },
    ] : [
      {
        q: "Which cities should I visit in Turkey?",
        a: "Top cities in Turkey: Istanbul (historic sites), Izmir (Aegean coast, Ephesus), Gaziantep (gastronomy capital), Trabzon (Black Sea nature), Konya (Mevlana), Ankara (Atatürk Mausoleum, museums).",
      },
      {
        q: "When is the best time to visit Turkey?",
        a: "Spring (April–May) and early autumn (September–October) are generally ideal. Each region varies: summer for Trabzon, December for Konya, March–April for Gaziantep.",
      },
      {
        q: "Where to eat the best food in Turkey?",
        a: "Gaziantep is a UNESCO Creative City of Gastronomy — essential for baklava and kebab. Istanbul shines with its multicultural cuisine, Izmir with seafood.",
      },
      {
        q: "Where is Ephesus (Efes)?",
        a: "Ephesus is approximately 80 km from Izmir, near the town of Selçuk. It is easily accessible from Izmir.",
      },
      {
        q: "Where is the Mevlana Museum?",
        a: "The Mevlana Museum and Mausoleum is located in the city center of Konya. It attracts visitors from around the world during the Şeb-i Arus ceremonies in December.",
      },
    ];

    ldJsonAI = {
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'FAQPage',
          mainEntity: homeFAQ.map(function(p) {
            return { '@type': 'Question', name: p.q, acceptedAnswer: { '@type': 'Answer', text: p.a } };
          }),
        },
        buildSpeakable(['.hero-title', '.hero-subtitle', '.city-card .city-name', '.city-card .city-desc']),
      ],
    };

  } else if (type === 'city') {
    var cityMeta = data.cityMeta;
    var cityData = data.cityData;
    var cityName = cityData.city || cityMeta.city;
    var cityDesc = cityData.description || cityMeta.description || '';
    var count    = cityData.places ? cityData.places.length : 0;

    title = cityName + (isTr ? ' Gezi Rehberi — Seyyah' : ' Travel Guide — Seyyah');
    desc  = cityDesc + (isTr
      ? ' ' + count + ' mekan, harita ve detaylı bilgilerle.'
      : ' With ' + count + ' places, maps and detailed info.');
    url   = SEO_BASE_URL + '/#' + cityMeta.slug;

    var placeItems = (cityData.places || []).map(function(place, i) {
      return {
        '@type': 'ListItem',
        position: i + 1,
        item: {
          '@type': categoryToSchema(place.category),
          name: place.name,
          description: place.description,
          url: SEO_BASE_URL + '/#' + cityMeta.slug + '/' + slugify(place.name),
        },
      };
    });

    ldJson = {
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Seyyah', item: SEO_BASE_URL },
            { '@type': 'ListItem', position: 2, name: cityName, item: url },
          ],
        },
        {
          '@type': 'TouristDestination',
          name: cityName,
          description: cityDesc,
          url: url,
          inLanguage: isTr ? 'tr-TR' : 'en',
          speakable: buildSpeakable(['.detail-city-name', '.detail-desc', '.place-card .place-name', '.place-card .place-desc']),
          touristType: isTr
            ? ['Tarih meraklısı', 'Kültür gezgini', 'Yemek tutkunu', 'Doğa sevdalısı']
            : ['History lovers', 'Culture travelers', 'Food enthusiasts', 'Nature lovers'],
        },
        {
          '@type': 'ItemList',
          name: isTr ? cityName + ' Gezilecek Yerler' : 'Places to visit in ' + cityName,
          numberOfItems: count,
          itemListElement: placeItems,
        },
      ],
    };

    // AI SEO: FAQ + HowTo
    ldJsonAI = {
      '@context': 'https://schema.org',
      '@graph': [
        buildCityFAQ(cityData, cityMeta, isTr),
        buildCityHowTo(cityData, cityMeta, isTr),
      ],
    };

  } else if (type === 'place') {
    var place     = data.place;
    var cityMeta  = data.cityMeta;
    var cityName  = cityMeta ? cityMeta.city : '';
    var placeSlug = slugify(place.name);

    title = place.name + ' — ' + cityName + ' | Seyyah';
    desc  = place.description || '';
    url   = SEO_BASE_URL + '/#' + (cityMeta ? cityMeta.slug : '') + '/' + placeSlug;

    var schemaType = categoryToSchema(place.category);
    var ldPlace = {
      '@type': schemaType,
      name: place.name,
      description: place.description,
      url: url,
      inLanguage: isTr ? 'tr-TR' : 'en',
      speakable: buildSpeakable(['#modal-place-name', '.modal-desc', '.modal-hours', '.access-strip']),
    };
    if (place.location && place.location.lat) {
      ldPlace.geo = { '@type': 'GeoCoordinates', latitude: place.location.lat, longitude: place.location.lng };
    }
    if (place.openHours) {
      ldPlace.openingHoursSpecification = { '@type': 'OpeningHoursSpecification', description: place.openHours };
    }
    if (place.tags && place.tags.length) {
      ldPlace.keywords = place.tags.join(', ');
    }

    ldJson = {
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Seyyah', item: SEO_BASE_URL },
            { '@type': 'ListItem', position: 2, name: cityName, item: SEO_BASE_URL + '/#' + (cityMeta ? cityMeta.slug : '') },
            { '@type': 'ListItem', position: 3, name: place.name, item: url },
          ],
        },
        ldPlace,
      ],
    };

    // AI SEO: Place FAQ
    ldJsonAI = {
      '@context': 'https://schema.org',
      '@graph': [ buildPlaceFAQ(place, cityMeta, isTr) ],
    };
  }

  // ── Uygula ──────────────────────────────────────────────────────────
  document.title = title;
  document.documentElement.lang = isTr ? 'tr' : 'en';
  setMeta('name', 'description', desc);
  setLink('canonical', url);
  setMeta('property', 'og:title',       title);
  setMeta('property', 'og:description', desc);
  setMeta('property', 'og:url',         url);
  setMeta('property', 'og:type',        type === 'home' ? 'website' : 'article');
  setMeta('property', 'og:locale',      isTr ? 'tr_TR' : 'en_US');
  setMeta('property', 'og:image',       SEO_OG_IMAGE);
  setMeta('property', 'og:image:alt',   isTr ? 'Seyyah — Türkiye Gezi Rehberi' : 'Seyyah — Turkey Travel Guide');
  setMeta('name', 'twitter:title',       title);
  setMeta('name', 'twitter:description', desc);
  setMeta('name', 'twitter:image',       SEO_OG_IMAGE);
  setJsonLd(ldJson);
  if (ldJsonAI) setJsonLdAI(ldJsonAI);
}

// ── 14. Router ────────────────────────────────────────────────────────

async function router() {
  var raw = location.hash.slice(1);
  var hash = raw.split("?")[0];

  if (raw.indexOf("?favs=") === 0) {
    loadSharedFavs();
    location.hash = "";
    return;
  }

  if (raw.indexOf("?plan=") === 0) {
    loadPlanFromUrl();
    location.hash = "";
    openPlanDrawer();
    return;
  }

  // #cityslug/placeslug → city detail + place modal
  var slashIdx = hash.indexOf("/");
  if (slashIdx !== -1) {
    var citySlug = hash.slice(0, slashIdx);
    var placeSlug = hash.slice(slashIdx + 1);
    if (citySlug && placeSlug) {
      // Clear any open modal immediately
      var oldM = document.getElementById("place-modal-overlay");
      if (oldM) {
        oldM.remove();
        document.body.classList.remove("modal-open");
        if (state.modalMapInst) {
          state.modalMapInst.remove();
          state.modalMapInst = null;
        }
        state.modalPlace = null;
      }
      // Load the city (skip if already loaded)
      if (state.slug !== citySlug || !state.cityData) {
        state.slug = citySlug;
        state.category = "all";
        state.activeTags = new Set();
        state.sortBy = "default";
        state.openOnly = false;
        await renderCityDetail();
      }
      // Find the place and open its modal
      if (state.cityData) {
        var target = null;
        for (var pi = 0; pi < state.cityData.places.length; pi++) {
          if (slugify(state.cityData.places[pi].name) === placeSlug) {
            target = state.cityData.places[pi];
            break;
          }
        }
        if (target) openPlaceModal(target, false);
      }
      return;
    }
  }

  // Close modal if open (we navigated back to the city URL)
  var oldM2 = document.getElementById("place-modal-overlay");
  if (oldM2) {
    oldM2.remove();
    document.body.classList.remove("modal-open");
    if (state.modalMapInst) {
      state.modalMapInst.remove();
      state.modalMapInst = null;
    }
    state.modalPlace = null;
  }

  if (hash && hash !== "/") {
    state.slug = hash;
    state.category = "all";
    state.activeTags = new Set();
    state.sortBy = "default";
    state.openOnly = false;
    await renderCityDetail();
  } else {
    state.slug = null;
    state.cityData = null;
    state.mapMarkers = {};
    if (state.mapInstance) {
      state.mapInstance.remove();
      state.mapInstance = null;
    }
    renderCityList();
  }
}

// ── 14b. PWA — Service Worker & Install Banner ───────────────────────

var _deferredInstall = null;

function registerSW() {
  if (!("serviceWorker" in navigator)) return;
  navigator.serviceWorker.register("./sw.js").catch(function () {});
}

function showInstallBar() {
  if (document.getElementById("pwa-install-bar")) return;
  var label = state.lang === "tr" ? "Uygulamayı Yükle" : "Install App";
  var dismiss = state.lang === "tr" ? "Kapat" : "Dismiss";
  var desc =
    state.lang === "tr"
      ? "Seyyah'ı ana ekrana ekle"
      : "Add Seyyah to your home screen";

  var bar = document.createElement("div");
  bar.id = "pwa-install-bar";
  bar.className = "pwa-install-bar";
  bar.setAttribute("role", "complementary");
  bar.setAttribute("aria-label", label);

  var html =
    '<div class="pwa-install-inner">' +
    '<span class="pwa-install-icon" aria-hidden="true">' +
    IC.compass +
    "</span>" +
    '<span class="pwa-install-desc">' +
    esc(desc) +
    "</span>" +
    '<button class="pwa-install-btn" id="pwa-install-btn">' +
    esc(label) +
    "</button>" +
    '<button class="pwa-install-dismiss" id="pwa-install-dismiss" aria-label="' +
    esc(dismiss) +
    '">' +
    IC.xMark +
    "</button>" +
    "</div>";

  var frag = document.createRange().createContextualFragment(html);
  bar.appendChild(frag);
  document.body.appendChild(bar);

  requestAnimationFrame(function () {
    requestAnimationFrame(function () {
      bar.classList.add("pwa-bar-visible");
    });
  });

  document
    .getElementById("pwa-install-btn")
    .addEventListener("click", function () {
      if (!_deferredInstall) return;
      _deferredInstall.prompt();
      _deferredInstall.userChoice.then(function () {
        _deferredInstall = null;
        hideInstallBar();
      });
    });

  document
    .getElementById("pwa-install-dismiss")
    .addEventListener("click", hideInstallBar);
}

function hideInstallBar() {
  var bar = document.getElementById("pwa-install-bar");
  if (!bar) return;
  bar.classList.remove("pwa-bar-visible");
  setTimeout(function () {
    if (bar.parentNode) bar.remove();
  }, 320);
}

function initInstallBanner() {
  window.addEventListener("beforeinstallprompt", function (e) {
    e.preventDefault();
    _deferredInstall = e;
    showInstallBar();
  });
  window.addEventListener("appinstalled", function () {
    hideInstallBar();
    _deferredInstall = null;
  });
}

// ── 15. Initialisation ──────────────────────────────────────────────

async function init() {
  // Register service worker and show install banner (PWA)
  registerSW();
  initInstallBanner();

  var logoIconEl = document.getElementById("logo-icon");
  if (logoIconEl) logoIconEl.innerHTML = IC.compass;

  applyTheme();
  applyLang();

  var themeBtn = document.getElementById("btn-theme");
  if (themeBtn) themeBtn.addEventListener("click", toggleTheme);

  var langBtn = document.getElementById("btn-lang");
  if (langBtn) langBtn.addEventListener("click", toggleLang);

  // ⌘K / Ctrl+K → focus search  |  ESC → close modal
  document.addEventListener("keydown", function (e) {
    if ((e.metaKey || e.ctrlKey) && e.key === "k") {
      e.preventDefault();
      var inp = document.getElementById("search-input");
      if (inp) {
        inp.focus();
        inp.select();
        if (!inp.value.trim()) {
          var hist = loadSearchHist();
          if (hist.length) openAutocomplete(inp, hist, true);
        }
      }
    }
    if (e.key === "Escape") {
      closePlaceModal();
      closePlanDrawer();
      closeAutocomplete();
    }
  });

  // Browser back button → close modal
  window.addEventListener("popstate", function () {
    var h = location.hash.slice(1).split("?")[0];
    if (h.indexOf("/") === -1) {
      var ov = document.getElementById("place-modal-overlay");
      if (ov) {
        ov.classList.remove("modal-overlay-visible");
        setTimeout(function () {
          if (ov.parentNode) ov.remove();
          document.body.classList.remove("modal-open");
          state.modalPlace = null;
          if (state.modalMapInst) {
            state.modalMapInst.remove();
            state.modalMapInst = null;
          }
        }, 270);
      }
    }
  });

  // Create plan FAB
  createPlanFab();

  // Is there a shared favourites URL?
  if (location.hash.indexOf("#?favs=") === 0) {
    loadSharedFavs();
    location.hash = "";
  }

  // Is there a shared plan URL?
  if (location.hash.indexOf("#?plan=") === 0) {
    loadPlanFromUrl();
    location.hash = "";
  }

  // Load cities
  try {
    state.cities = await fetchJSON(CITIES_URL);
  } catch (err) {
    document.getElementById("main").innerHTML =
      '<p class="empty-state">' +
      esc(t("load_err")) +
      esc(err.message) +
      "</p>";
    return;
  }

  await router();
  window.addEventListener("hashchange", router);

  // Fetch place counts in the background
  state.cities.forEach(function (city) {
    if (city.placeCount == null) {
      fetchJSON(city.data)
        .then(function (data) {
          city.placeCount = data.places.length;
          if (!state.slug) {
            var countEl = document.querySelector(
              '.city-card[data-slug="' + city.slug + '"] .city-count',
            );
            if (countEl)
              countEl.innerHTML =
                IC.mapPin + " " + esc(t("places_count", city.placeCount));
          }
        })
        .catch(function () {
          city.placeCount = "?";
        });
    }
  });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}
