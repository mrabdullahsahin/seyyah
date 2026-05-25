#!/usr/bin/env node
/**
 * generate-sitemap.js
 * Seyyah — sitemap.xml generator
 *
 * Usage:  node generate-sitemap.js
 * Output: sitemap.xml
 */

const fs = require("fs");
const path = require("path");

const BASE_URL = "https://abdullahsahin.org/seyyah/";
const TODAY = new Date().toISOString().split("T")[0]; // YYYY-MM-DD

// Read the city list
const cities = JSON.parse(
  fs.readFileSync(path.join(__dirname, "data", "cities.json"), "utf-8"),
);

const urls = [];

// 1. Homepage
urls.push({
  loc: BASE_URL + "/",
  lastmod: TODAY,
  changefreq: "weekly",
  priority: "1.0",
});

// 2. City pages (#cityslug)
for (const city of cities) {
  urls.push({
    loc: BASE_URL + "/#" + city.slug,
    lastmod: TODAY,
    changefreq: "monthly",
    priority: "0.8",
  });

  // 3. Place pages (#cityslug/placeslug) — optional (can be many)
  const cityFile = path.join(__dirname, "data", city.slug + ".json");
  if (fs.existsSync(cityFile)) {
    const cityData = JSON.parse(fs.readFileSync(cityFile, "utf-8"));
    if (cityData.places) {
      for (const place of cityData.places) {
        const placeSlug = slugify(place.name);
        urls.push({
          loc: BASE_URL + "/#" + city.slug + "/" + placeSlug,
          lastmod: TODAY,
          changefreq: "monthly",
          priority: "0.6",
        });
      }
    }
  }
}

// slugify — same logic as app.js
function slugify(str) {
  return str
    .toLowerCase()
    .replace(/ğ/g, "g")
    .replace(/ü/g, "u")
    .replace(/ş/g, "s")
    .replace(/ı/g, "i")
    .replace(/ö/g, "o")
    .replace(/ç/g, "c")
    .replace(/İ/g, "i")
    .replace(/Ğ/g, "g")
    .replace(/Ü/g, "u")
    .replace(/Ş/g, "s")
    .replace(/Ö/g, "o")
    .replace(/Ç/g, "c")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// Generate XML
const xml = [
  '<?xml version="1.0" encoding="UTF-8"?>',
  '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
  ...urls.map((u) =>
    [
      "  <url>",
      "    <loc>" + u.loc + "</loc>",
      "    <lastmod>" + u.lastmod + "</lastmod>",
      "    <changefreq>" + u.changefreq + "</changefreq>",
      "    <priority>" + u.priority + "</priority>",
      "  </url>",
    ].join("\n"),
  ),
  "</urlset>",
].join("\n");

fs.writeFileSync(path.join(__dirname, "sitemap.xml"), xml, "utf-8");
console.log("✅ sitemap.xml generated — " + urls.length + " URLs");
