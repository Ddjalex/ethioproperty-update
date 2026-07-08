/**
 * SEO SSR Patch for Prime Addis
 * Fixes: crawled-not-indexed, canonical, soft 404, duplicate pages, robots.txt conflict
 * Drop this file in the dist/ folder — it is auto-loaded by index.js via the wrapper.
 */

import fs from "fs";
import path from "path";

const BASE_URL = "https://primeaddiset.com";
const DEFAULT_TITLE = "Real Estate in Addis Ababa Ethiopia | Buy & Rent Property – Prime Addis";
const DEFAULT_DESC = "Ethiopia's first real estate platform with 3D & VR property tours. Buy, sell or rent homes, apartments and villas in Addis Ababa and across Ethiopia.";
const DEFAULT_IMAGE = "/assets/prime-addis-logo.png";

function escHtml(str) {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function generateSlug(title, subcity, city) {
  if (!title || title.trim() === "") return "";
  let combined = title.trim();
  if (subcity && subcity.trim() !== "") combined += ` ${subcity.trim()}`;
  const cityName = city && city.trim() !== "" ? city.trim() : "addis-ababa";
  if (!combined.toLowerCase().includes(cityName.toLowerCase())) combined += ` ${cityName}`;
  return combined.toLowerCase().trim()
    .replace(/[\s_]+/g, "-")
    .replace(/[^a-z0-9\-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function generatePropertyUrl(id, title, subcity, city) {
  const slug = generateSlug(title, subcity, city);
  return slug ? `/properties/${id}-${slug}` : `/properties/${id}`;
}

function formatPrice(price) {
  if (!price) return "";
  return new Intl.NumberFormat("en-US").format(price);
}

function injectSSR(html, { title, desc, url, canonical, image, jsonld }) {
  const safeTitle = escHtml(title || DEFAULT_TITLE);
  const safeDesc = escHtml(desc || DEFAULT_DESC);
  const safeUrl = escHtml(url || BASE_URL + "/");
  const safeCanonical = escHtml(canonical || BASE_URL + "/");
  const safeImage = escHtml(image || DEFAULT_IMAGE);

  // Replace title placeholder (appears in <title> and og:title and twitter:title)
  html = html.replace(/<!--SSR_TITLE-->.*?<!--\/SSR_TITLE-->/g, safeTitle);
  // Replace description placeholder
  html = html.replace(/<!--SSR_DESC-->.*?<!--\/SSR_DESC-->/g, safeDesc);
  // Replace URL placeholder
  html = html.replace(/<!--SSR_URL-->.*?<!--\/SSR_URL-->/g, safeUrl);
  // Replace canonical
  html = html.replace(/<!--SSR_CANONICAL-->.*?<!--\/SSR_CANONICAL-->/g, safeCanonical);
  // Replace og:image if we have a custom one
  if (image) {
    html = html.replace(
      /<!--SSR_OG_IMAGE_BLOCK-->.*?<!--\/SSR_OG_IMAGE_BLOCK-->/g,
      `<meta property="og:image" content="${safeImage}" /><meta property="twitter:image" content="${safeImage}" />`
    );
  } else {
    html = html.replace(/<!--SSR_OG_IMAGE_BLOCK-->.*?<!--\/SSR_OG_IMAGE_BLOCK-->/g, "");
  }
  // Inject JSON-LD
  if (jsonld) {
    html = html.replace(
      /<!--SSR_JSONLD-->.*?<!--\/SSR_JSONLD-->/g,
      `<script type="application/ld+json">${JSON.stringify(jsonld)}</script>`
    );
  } else {
    html = html.replace(/<!--SSR_JSONLD-->.*?<!--\/SSR_JSONLD-->/g, "");
  }
  return html;
}

export function applySEOMiddleware(app, storage, distPath) {
  const indexHtmlPath = path.resolve(distPath, "index.html");

  // Read template once (cache it; restart server to pick up index.html changes)
  let htmlTemplate;
  try {
    htmlTemplate = fs.readFileSync(indexHtmlPath, "utf-8");
  } catch (e) {
    console.error("[SEO] Could not read index.html:", e.message);
    return;
  }

  // ─── Property detail pages: /properties/:slug ───────────────────────────
  // These were "crawled – currently not indexed" because Google got empty HTML.
  // Now we inject real title/description/JSON-LD from the DB into the <head>.
  app.get("/properties/:slug", async (req, res, next) => {
    const { slug } = req.params;

    // Pure-integer slug — let client handle (old URL; server redirect is already set up)
    if (/^\d+$/.test(slug)) return next();

    // Extract leading integer ID
    const idMatch = slug.match(/^(\d+)/);
    if (!idMatch) return next();

    const id = parseInt(idMatch[1], 10);
    let property;
    try {
      property = await storage.getPropertyById(id);
    } catch (e) {
      // DB error — fall back to SPA
      return next();
    }

    // Property not found → real 404 (fixes Soft 404 issue)
    if (!property) {
      const notFoundHtml = injectSSR(htmlTemplate, {
        title: "Property Not Found | Prime Addis",
        desc: "The property you are looking for does not exist or has been removed.",
        url: `${BASE_URL}/properties`,
        canonical: `${BASE_URL}/properties`,
      });
      return res.status(404).set("Content-Type", "text/html").send(notFoundHtml);
    }

    // Canonical URL for this property
    const canonicalPath = generatePropertyUrl(property.id, property.title, property.subcity, property.city);
    const canonicalUrl = `${BASE_URL}${canonicalPath}`;

    // If slug doesn't match canonical → 301 redirect (already in place, but belt-and-suspenders)
    const requestedPath = `/properties/${slug}`;
    if (requestedPath !== canonicalPath) {
      return res.redirect(301, canonicalUrl);
    }

    // Build rich title and description
    const parts = [];
    if (property.bedrooms) parts.push(`${property.bedrooms}BR`);
    if (property.bathrooms) parts.push(`${property.bathrooms}BA`);
    const locationParts = [property.subcity, property.city].filter(Boolean);
    const location = locationParts.join(", ") || "Addis Ababa";
    const priceStr = property.price ? `ETB ${formatPrice(property.price)}` : "";

    const title = [
      property.title,
      property.propertyType,
      parts.length ? parts.join(" ") : null,
      location,
      "| Prime Addis"
    ].filter(Boolean).join(" – ");

    const descParts = [
      `${property.propertyType || "Property"} for ${property.status || "sale"} in ${location}.`,
      priceStr ? `Price: ${priceStr}.` : null,
      property.bedrooms ? `${property.bedrooms} bedrooms, ${property.bathrooms} bathrooms.` : null,
      property.squareFeet ? `${property.squareFeet} sq ft.` : null,
      property.description ? property.description.slice(0, 120) + "…" : null,
    ].filter(Boolean);
    const desc = descParts.join(" ");

    const image = property.images && property.images.length > 0
      ? (property.images[0].startsWith("http") ? property.images[0] : `${BASE_URL}${property.images[0]}`)
      : null;

    // JSON-LD: RealEstateListing schema
    const jsonld = {
      "@context": "https://schema.org",
      "@type": "RealEstateListing",
      "name": property.title,
      "description": property.description || desc,
      "url": canonicalUrl,
      "image": property.images && property.images.length > 0
        ? property.images.map(img => img.startsWith("http") ? img : `${BASE_URL}${img}`)
        : undefined,
      "offers": {
        "@type": "Offer",
        "price": property.price,
        "priceCurrency": "ETB",
        "availability": "https://schema.org/InStock"
      },
      "numberOfRooms": property.bedrooms || undefined,
      "floorSize": property.squareFeet ? {
        "@type": "QuantitativeValue",
        "value": property.squareFeet,
        "unitCode": "FTK"
      } : undefined,
      "address": {
        "@type": "PostalAddress",
        "streetAddress": property.address,
        "addressLocality": property.subcity || property.city,
        "addressRegion": property.state,
        "addressCountry": "ET"
      },
      "provider": {
        "@type": "RealEstateAgent",
        "name": "Prime Addis",
        "url": BASE_URL,
        "telephone": "+251972555566",
        "email": "ethioproperty1@gmail.com"
      }
    };

    const html = injectSSR(htmlTemplate, {
      title, desc, image,
      url: canonicalUrl,
      canonical: canonicalUrl,
      jsonld,
    });

    // Set headers that help crawlers and CDNs
    res.set("Content-Type", "text/html");
    res.set("Cache-Control", "public, max-age=300, stale-while-revalidate=60");
    return res.status(200).send(html);
  });

  // ─── /properties listing page ────────────────────────────────────────────
  app.get("/properties", (_req, res) => {
    const html = injectSSR(htmlTemplate, {
      title: "Properties for Sale & Rent in Ethiopia | Prime Addis",
      desc: "Browse all real estate listings in Addis Ababa, Ethiopia. Find houses, apartments, villas, and commercial properties for sale or rent.",
      url: `${BASE_URL}/properties`,
      canonical: `${BASE_URL}/properties`,
    });
    res.set("Content-Type", "text/html").send(html);
  });

  // ─── /about ─────────────────────────────────────────────────────────────
  app.get("/about", (_req, res) => {
    const html = injectSSR(htmlTemplate, {
      title: "About Prime Addis | Real Estate Agency in Ethiopia",
      desc: "Prime Addis is Ethiopia's premier real estate platform. Learn about our mission to connect buyers, sellers, and renters with verified properties in Addis Ababa.",
      url: `${BASE_URL}/about`,
      canonical: `${BASE_URL}/about`,
    });
    res.set("Content-Type", "text/html").send(html);
  });

  // ─── /contact ────────────────────────────────────────────────────────────
  app.get("/contact", (_req, res) => {
    const html = injectSSR(htmlTemplate, {
      title: "Contact Prime Addis | Real Estate Experts in Addis Ababa",
      desc: "Get in touch with Prime Addis for property inquiries, custom property requests, or general questions about real estate in Ethiopia.",
      url: `${BASE_URL}/contact`,
      canonical: `${BASE_URL}/contact`,
    });
    res.set("Content-Type", "text/html").send(html);
  });

  // ─── /blog ───────────────────────────────────────────────────────────────
  app.get("/blog", (_req, res) => {
    const html = injectSSR(htmlTemplate, {
      title: "Real Estate Blog | Prime Addis Ethiopia",
      desc: "Read the latest real estate news, market trends, and property investment tips for Addis Ababa and Ethiopia from Prime Addis.",
      url: `${BASE_URL}/blog`,
      canonical: `${BASE_URL}/blog`,
    });
    res.set("Content-Type", "text/html").send(html);
  });

  // ─── Admin & auth: block from indexing at HTTP level ─────────────────────
  // robots.txt already blocks these, but this adds an X-Robots-Tag header
  // which works even if robots.txt is ever misconfigured (fixes the
  // "indexed though blocked by robots.txt" GSC warning)
  app.use(["/admin", "/auth", "/api"], (req, res, next) => {
    res.set("X-Robots-Tag", "noindex, nofollow");
    next();
  });

  // ─── SPA catch-all: inject canonical per-path for remaining routes ────────
  app.use("*", (req, res) => {
    const reqPath = req.path || "/";
    // Block clearly invalid paths with real 404
    if (reqPath.includes("..") || reqPath.match(/\.(php|asp|aspx|cgi|exe)$/i)) {
      return res.status(404).send("Not found");
    }

    const canonicalUrl = `${BASE_URL}${reqPath === "/" ? "/" : reqPath.replace(/\/$/, "")}`;
    const html = injectSSR(htmlTemplate, {
      url: canonicalUrl,
      canonical: canonicalUrl,
    });
    res.set("Content-Type", "text/html").send(html);
  });
}
