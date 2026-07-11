import pg from 'pg';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import sanitizeHtml from 'sanitize-html';
import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { scrypt, randomBytes } from 'crypto';
import { promisify } from 'util';

const scryptAsync = promisify(scrypt);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/* ─── helpers ─────────────────────────────────────────── */
function isAdmin(req, res, next) {
  if (!req.isAuthenticated || !req.isAuthenticated() || !req.user?.isAdmin) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
  next();
}

function slugify(text) {
  return (text || '').toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function escHtml(s) {
  return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function getExampleEnvValue(key) {
  // Only used as a last-resort fallback for local/dev convenience; real
  // secrets from process.env must always take priority over this.
  try {
    const text = fs.readFileSync(path.join(process.cwd(), '.env.example'), 'utf8');
    const line = text.split(/\r?\n/).find(l => l.startsWith(`${key}=`));
    if (!line) return '';
    return line.slice(key.length + 1).trim();
  } catch {
    return '';
  }
}

function formatDate(d) {
  if (!d) return '';
  return new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}

/* ─── SSR page shell (uses this project's own Ethio Property branding) ─── */
function pageHead(title, desc, keywords, canonical, extra = '') {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escHtml(title)} | Ethio Property</title>
  <meta name="description" content="${escHtml(desc)}">
  ${keywords ? `<meta name="keywords" content="${escHtml(keywords)}">` : ''}
  <link rel="canonical" href="https://ethioproperty.com${canonical}">
  <meta property="og:title" content="${escHtml(title)} | Ethio Property">
  <meta property="og:description" content="${escHtml(desc)}">
  <meta property="og:type" content="website">
  <meta property="og:image" content="/assets/ethioproperty.png">
  <meta name="author" content="Ethio Property">
  <link rel="icon" href="/favicon.ico">
  <link rel="icon" type="image/svg+xml" href="/assets/favicon.svg">
  <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png">
  ${extra}
  <style>
    *{margin:0;padding:0;box-sizing:border-box}
    body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#f8fafc;color:#1e293b}
    a{color:inherit;text-decoration:none}
    img{max-width:100%}
    .nav{background:#fff;box-shadow:0 1px 2px rgba(0,0,0,.05);padding:0 32px;display:flex;align-items:center;gap:28px;height:64px;position:sticky;top:0;z-index:100}
    .nav-logo{display:flex;align-items:center;gap:10px;margin-right:auto}
    .nav-logo img{height:40px;width:auto}
    .nav a{color:#334155;font-size:15px;font-weight:500;transition:color .2s;white-space:nowrap}
    .nav a:hover{color:#0f172a}
    .nav a.active{color:#0f172a}
    .hero{background:linear-gradient(135deg,#0f172a 60%,#1e3a5f);color:#fff;padding:64px 32px;text-align:center}
    .hero h1{font-size:2.4rem;font-weight:800;margin-bottom:14px;line-height:1.2}
    .hero p{font-size:1.05rem;color:#94a3b8;max-width:560px;margin:0 auto;line-height:1.7}
    .container{max-width:1100px;margin:0 auto;padding:52px 24px}
    .grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:24px;margin-top:36px}
    .card{background:#fff;border-radius:14px;box-shadow:0 1px 4px rgba(0,0,0,.08);overflow:hidden;transition:box-shadow .2s;display:flex;flex-direction:column}
    .card:hover{box-shadow:0 6px 20px rgba(0,0,0,.13)}
    .card-img{width:100%;height:200px;object-fit:cover}
    .card-body{padding:20px;flex:1;display:flex;flex-direction:column;gap:8px}
    .card-tag{display:inline-block;background:#eff6ff;color:#1d4ed8;font-size:11px;font-weight:600;padding:3px 10px;border-radius:999px;width:fit-content}
    .card-title{font-size:1.1rem;font-weight:700;color:#0f172a;line-height:1.35}
    .card-title a:hover{color:#1d4ed8}
    .card-excerpt{font-size:14px;color:#64748b;line-height:1.65;flex:1}
    .card-meta{font-size:12px;color:#94a3b8;margin-top:auto}
    .card-cta{font-size:13px;font-weight:600;color:#1d4ed8;margin-top:8px;display:inline-flex;align-items:center;gap:4px}
    .prose{max-width:760px;margin:0 auto}
    .prose h1{font-size:2rem;font-weight:800;color:#0f172a;margin-bottom:12px;line-height:1.3}
    .prose h2{font-size:1.4rem;font-weight:700;color:#0f172a;margin:36px 0 12px}
    .prose h3{font-size:1.15rem;font-weight:600;margin:24px 0 8px}
    .prose p{color:#374151;line-height:1.8;margin-bottom:16px;font-size:15.5px}
    .prose img{width:100%;border-radius:10px;margin:24px 0}
    .prose ul,.prose ol{padding-left:20px;margin-bottom:16px;color:#374151;line-height:1.8}
    .breadcrumb{font-size:13px;color:#94a3b8;margin-bottom:28px}
    .breadcrumb a{color:#60a5fa}
    .section-hd{text-align:center;margin-bottom:44px}
    .section-hd h2{font-size:2rem;font-weight:800;color:#0f172a;margin-bottom:10px}
    .section-hd p{color:#64748b;font-size:1rem;max-width:500px;margin:0 auto}
    .featured-img{width:100%;max-height:460px;object-fit:cover;border-radius:14px;margin-bottom:36px}
    .footer{background:#0f172a;color:#64748b;text-align:center;padding:36px 24px;font-size:13px;margin-top:80px}
    .footer a{color:#60a5fa;margin:0 8px}
    .back-btn{display:inline-flex;align-items:center;gap:6px;color:#1d4ed8;font-size:14px;font-weight:500;margin-bottom:28px}
    .back-btn:hover{text-decoration:underline}
    @media(max-width:768px){.hero h1{font-size:1.7rem}.grid{grid-template-columns:1fr}.nav{padding:0 16px;gap:16px}.nav a{display:none}.nav-logo{margin-right:0}}
  </style>
</head>
<body>
<nav class="nav">
  <a href="/" class="nav-logo"><img src="/assets/ethioproperty.png" alt="Ethio Property"></a>
  <a href="/">Home</a>
  <a href="/properties">Properties</a>
  <a href="/blog" class="${canonical.startsWith('/blog') ? 'active' : ''}">Blog</a>
  <a href="/contact">Contact</a>
</nav>`;
}

function pageFooter() {
  return `
<footer class="footer">
  <p>&copy; ${new Date().getFullYear()} Ethio Property. All rights reserved. &mdash; Premier Real Estate in Ethiopia</p>
  <p style="margin-top:8px">
    <a href="/">Home</a><a href="/properties">Properties</a><a href="/blog">Blog</a><a href="/contact">Contact</a>
  </p>
</footer>
</body></html>`;
}

/* ─── GOOGLE OAUTH LOGIN ─────────────────────────────────
   Reuses the Passport session already configured by server/auth.ts
   (passport.initialize()/passport.session() + serializeUser/deserializeUser
   run against the real `users` table before this module loads). We only
   register an additional Strategy + two routes here. ────────────────── */
async function hashRandomPassword() {
  // Google-signup accounts still need a `password` value (NOT NULL column)
  // but must never be usable for local/password login, so we store a long
  // random value in the same "hash.salt" format as hashPassword() below.
  const salt = randomBytes(16).toString('hex');
  const buf = await scryptAsync(randomBytes(32).toString('hex'), salt, 64);
  return `${buf.toString('hex')}.${salt}`;
}

function usernameBaseFromProfile(profile, email) {
  const source = profile.displayName || (email ? email.split('@')[0] : 'user');
  const cleaned = source.toLowerCase().replace(/[^a-z0-9]+/g, '');
  return cleaned || 'user';
}

async function findOrCreateGoogleUser(pool, profile) {
  const email = profile.emails && profile.emails[0] && profile.emails[0].value;
  if (!email) {
    throw new Error('Google account did not return an email address');
  }
  const { rows: existingRows } = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
  if (existingRows[0]) {
    return existingRows[0];
  }
  const base = usernameBaseFromProfile(profile, email);
  let username = base;
  let suffix = 0;
  // Guard against username collisions since `username` is UNIQUE NOT NULL.
  while (true) {
    const { rows } = await pool.query('SELECT 1 FROM users WHERE username = $1', [username]);
    if (rows.length === 0) break;
    suffix += 1;
    username = `${base}${suffix}`;
  }
  const password = await hashRandomPassword();
  const { rows: inserted } = await pool.query(
    'INSERT INTO users (username, password, email, is_admin) VALUES ($1, $2, $3, false) RETURNING *',
    [username, password, email]
  );
  console.log(`[extensions] Created new user via Google sign-in: ${username} <${email}>`);
  return inserted[0];
}

function registerGoogleAuthRoutes(app, pool) {
  const clientID = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (!clientID || !clientSecret) {
    console.warn('[extensions] Google OAuth skipped: GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET not set');
    return;
  }

  passport.use(new GoogleStrategy(
    {
      clientID,
      clientSecret,
      // Relative callbackURL: passport-oauth2 resolves this against the
      // incoming request's protocol+host, so it works unchanged on both
      // ethioproperty.com and the Replit preview domain, as long as each
      // exact "<host>/auth/google/callback" is registered in Google Cloud
      // Console as an authorized redirect URI.
      callbackURL: '/auth/google/callback'
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const user = await findOrCreateGoogleUser(pool, profile);
        // Passed through as req.authInfo on the callback route below (not
        // persisted) so lead-capture forms can prefill the user's actual
        // Google display name, since the stored `username` is a slugified
        // value and may not match it.
        return done(null, user, { displayName: profile.displayName || '' });
      } catch (err) {
        return done(err);
      }
    }
  ));

  // Only allow redirecting back to a same-site relative path (e.g. a lead
  // capture form the user was filling out), never an absolute/external URL,
  // to avoid this becoming an open redirect.
  function safeReturnTo(value) {
    if (typeof value !== 'string') return null;
    if (!value.startsWith('/') || value.startsWith('//') || value.includes('://')) return null;
    return value;
  }

  app.get('/auth/google', (req, res, next) => {
    const returnTo = safeReturnTo(req.query.returnTo);
    passport.authenticate('google', {
      scope: ['profile', 'email'],
      ...(returnTo ? { state: returnTo } : {})
    })(req, res, next);
  });

  app.get(
    '/auth/google/callback',
    passport.authenticate('google', { failureRedirect: '/auth?error=login-failed' }),
    (req, res) => {
      // Session is established by passport.authenticate above. If the user
      // started this flow from a lead-capture form (Request Property
      // Updates / Inquiry / Visit), send them back to it so the
      // google-signin-patch can prefill their name/email; otherwise fall
      // back to the existing /auth page behavior.
      const returnTo = safeReturnTo(req.query.state);
      if (!returnTo) {
        return res.redirect('/auth');
      }
      const displayName = (req.authInfo && req.authInfo.displayName) || '';
      const sep = returnTo.includes('?') ? '&' : '?';
      res.redirect(`${returnTo}${sep}paGoogleName=${encodeURIComponent(displayName)}`);
    }
  );

  console.log('[extensions] Google OAuth routes registered (/auth/google, /auth/google/callback)');
}

/* ─── DB migrations (blog + AI prompts only — this project's own subscribers
   table already exists, and about/portfolio/partners are out of scope) ──── */
async function runMigrations(pool) {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS ai_prompts (
      id SERIAL PRIMARY KEY,
      lang TEXT NOT NULL UNIQUE,
      system_prompt TEXT,
      updated_at TIMESTAMP DEFAULT NOW()
    )
  `);
  await pool.query(`
    ALTER TABLE ai_prompts ADD COLUMN IF NOT EXISTS greeting TEXT
  `).catch(() => {});

  await pool.query(`
    CREATE TABLE IF NOT EXISTS blog_posts (
      id SERIAL PRIMARY KEY,
      title TEXT NOT NULL,
      slug TEXT NOT NULL UNIQUE,
      content TEXT NOT NULL DEFAULT '',
      excerpt TEXT DEFAULT '',
      featured_image TEXT,
      meta_description TEXT DEFAULT '',
      meta_keywords TEXT DEFAULT '',
      author TEXT DEFAULT 'Ethio Property',
      is_published BOOLEAN DEFAULT false,
      published_at TIMESTAMP,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    )
  `);

  console.log('[extensions] DB migrations complete');
}

/* ─── BLOG ROUTES ────────────────────────────────────── */
function registerBlogRoutes(app, pool) {
  app.get('/api/blog', async (req, res) => {
    try {
      const { rows } = await pool.query('SELECT id,title,slug,excerpt,featured_image,author,published_at,created_at FROM blog_posts WHERE is_published=true ORDER BY published_at DESC, created_at DESC');
      res.json(rows);
    } catch (e) { res.status(500).json({ error: e.message }); }
  });

  app.get('/api/blog/:slug', async (req, res) => {
    try {
      const { rows } = await pool.query('SELECT * FROM blog_posts WHERE slug=$1 AND is_published=true', [req.params.slug]);
      if (!rows.length) return res.status(404).json({ message: 'Not found' });
      res.json(rows[0]);
    } catch (e) { res.status(500).json({ error: e.message }); }
  });

  app.get('/api/admin/blog', isAdmin, async (req, res) => {
    try {
      const { rows } = await pool.query('SELECT * FROM blog_posts ORDER BY created_at DESC');
      res.json(rows);
    } catch (e) { res.status(500).json({ error: e.message }); }
  });

  app.post('/api/admin/blog', isAdmin, async (req, res) => {
    try {
      const { title, content, excerpt, featured_image, meta_description, meta_keywords, author, is_published } = req.body;
      const slug = slugify(title) + '-' + Date.now();
      const pub = is_published ? new Date() : null;
      const { rows } = await pool.query(
        `INSERT INTO blog_posts (title,slug,content,excerpt,featured_image,meta_description,meta_keywords,author,is_published,published_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
        [title, slug, content || '', excerpt || '', featured_image || null, meta_description || '', meta_keywords || '', author || 'Ethio Property', !!is_published, pub]
      );
      res.json(rows[0]);
    } catch (e) { res.status(500).json({ error: e.message }); }
  });

  app.put('/api/admin/blog/:id', isAdmin, async (req, res) => {
    try {
      const { title, content, excerpt, featured_image, meta_description, meta_keywords, author, is_published } = req.body;
      const existing = await pool.query('SELECT slug, is_published FROM blog_posts WHERE id=$1', [req.params.id]);
      const wasPublished = existing.rows[0]?.is_published;
      const pub = is_published && !wasPublished ? new Date() : (existing.rows[0]?.published_at || null);
      const { rows } = await pool.query(
        `UPDATE blog_posts SET title=$1,content=$2,excerpt=$3,featured_image=$4,meta_description=$5,meta_keywords=$6,author=$7,is_published=$8,published_at=$9,updated_at=NOW()
         WHERE id=$10 RETURNING *`,
        [title, content || '', excerpt || '', featured_image || null, meta_description || '', meta_keywords || '', author || 'Ethio Property', !!is_published, pub, req.params.id]
      );
      res.json(rows[0]);
    } catch (e) { res.status(500).json({ error: e.message }); }
  });

  app.delete('/api/admin/blog/:id', isAdmin, async (req, res) => {
    try {
      await pool.query('DELETE FROM blog_posts WHERE id=$1', [req.params.id]);
      res.json({ success: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
  });
}

/* ─── BLOG SSR PAGES (about/portfolio SSR intentionally NOT ported) ─────── */
function registerBlogSSRRoutes(app, pool) {
  app.get('/blog', async (req, res) => {
    try {
      const { rows } = await pool.query('SELECT id,title,slug,excerpt,featured_image,author,published_at,created_at,meta_description FROM blog_posts WHERE is_published=true ORDER BY published_at DESC, created_at DESC');
      let html = pageHead('Blog', 'Real estate tips, news and insights from Ethio Property — Ethiopia\'s premier property experts.', 'real estate blog Ethiopia, Ethio Property blog, property tips Addis Ababa', '/blog');
      html += `<section class="hero"><h1>Our Blog</h1><p>Real estate insights, market trends and property tips from our experts.</p></section>`;
      html += `<div class="container">`;
      if (!rows.length) {
        html += `<div style="text-align:center;padding:60px 0;color:#94a3b8;font-size:1.1rem">No blog posts yet. Check back soon!</div>`;
      } else {
        html += `<div class="grid">`;
        rows.forEach(post => {
          html += `<article class="card" itemscope itemtype="https://schema.org/BlogPosting">
            ${post.featured_image ? `<img class="card-img" src="${escHtml(post.featured_image)}" alt="${escHtml(post.title)}" itemprop="image">` : ''}
            <div class="card-body">
              <div class="card-meta">${formatDate(post.published_at || post.created_at)} &bull; ${escHtml(post.author || 'Ethio Property')}</div>
              <div class="card-title" itemprop="headline"><a href="/blog/${escHtml(post.slug)}">${escHtml(post.title)}</a></div>
              ${post.excerpt ? `<p class="card-excerpt" itemprop="description">${escHtml(post.excerpt)}</p>` : ''}
              <a href="/blog/${escHtml(post.slug)}" class="card-cta">Read more &#8594;</a>
            </div>
          </article>`;
        });
        html += `</div>`;
      }
      html += `</div>`;
      html += pageFooter();
      res.send(html);
    } catch (e) { res.status(500).send('Error loading blog'); }
  });

  app.get('/blog/:slug', async (req, res) => {
    try {
      const { rows } = await pool.query('SELECT * FROM blog_posts WHERE slug=$1 AND is_published=true', [req.params.slug]);
      if (!rows.length) return res.status(404).send(pageHead('Post Not Found', '', '', '/blog') + '<div style="text-align:center;padding:80px;font-size:1.2rem">Post not found. <a href="/blog" style="color:#1d4ed8">Back to Blog</a></div>' + pageFooter());
      const post = rows[0];
      const ld = JSON.stringify({ "@context":"https://schema.org","@type":"BlogPosting","headline":post.title,"description":post.excerpt||post.meta_description,"author":{"@type":"Organization","name":post.author||"Ethio Property"},"datePublished":post.published_at||post.created_at,"dateModified":post.updated_at||post.created_at,"publisher":{"@type":"Organization","name":"Ethio Property"},"image":post.featured_image||"" });
      let html = pageHead(post.title, post.meta_description || post.excerpt || '', post.meta_keywords || '', `/blog/${post.slug}`, `<script type="application/ld+json">${ld}</script>`);
      html += `<div class="container"><div class="prose">`;
      html += `<div class="breadcrumb"><a href="/">Home</a> › <a href="/blog">Blog</a> › ${escHtml(post.title)}</div>`;
      html += `<h1>${escHtml(post.title)}</h1>`;
      html += `<div class="card-meta" style="margin-bottom:24px">${formatDate(post.published_at || post.created_at)} &bull; ${escHtml(post.author || 'Ethio Property')}</div>`;
      if (post.featured_image) html += `<img class="featured-img" src="${escHtml(post.featured_image)}" alt="${escHtml(post.title)}">`;
      const safeContent = sanitizeHtml(post.content || '', {
        allowedTags: sanitizeHtml.defaults.allowedTags.concat(['img', 'h1', 'h2', 'figure', 'figcaption']),
        allowedAttributes: {
          ...sanitizeHtml.defaults.allowedAttributes,
          img: ['src', 'alt', 'title', 'width', 'height'],
          a: ['href', 'name', 'target', 'rel'],
        },
        allowedSchemes: ['http', 'https', 'mailto'],
      });
      html += `<div>${safeContent}</div>`;
      html += `<div style="margin-top:48px"><a href="/blog" class="back-btn">&#8592; Back to Blog</a></div>`;
      html += `</div></div>`;
      html += pageFooter();
      res.send(html);
    } catch (e) { res.status(500).send('Error loading post'); }
  });
}

/* ─── AI ASSISTANT ROUTES ─────────────────────────────── */
const GEMINI_MODEL = 'gemini-2.5-flash-lite';
const GEMINI_FALLBACK_MODELS = ['gemini-2.5-flash', 'gemini-flash-latest'];
const GEMINI_API_BASE = 'https://generativelanguage.googleapis.com/v1beta/models';

async function callGeminiWithFallback(apiKey, requestBody, lang) {
  const models = [GEMINI_MODEL, ...GEMINI_FALLBACK_MODELS];
  let lastStatus = 0, lastBody = '';
  for (const model of models) {
    const url = `${GEMINI_API_BASE}/${model}:generateContent?key=${apiKey}`;
    console.log(`[AI chat] → ${model} | lang=${lang}`);
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 12000);
    let r;
    try {
      r = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
        signal: ctrl.signal
      });
    } catch (e) {
      clearTimeout(timer);
      console.error(`[AI chat] ${model} fetch error:`, e.message);
      lastStatus = 0; lastBody = e.message;
      continue;
    }
    clearTimeout(timer);
    const raw = await r.text();
    if (r.ok) {
      let data; try { data = JSON.parse(raw); } catch { data = {}; }
      return { ok: true, data };
    }
    lastStatus = r.status; lastBody = raw;
    console.error(`[AI chat] ${model} HTTP ${r.status}:`, raw.slice(0, 200));
    if (r.status === 503) { await new Promise(s => setTimeout(s, 200)); }
  }
  return { ok: false, status: lastStatus, body: lastBody };
}

function aiFallbackText(lang) {
  if (lang === 'am') {
    return 'ይቅርታ፣ አሁን የAI አገልግሎቱ በጊዜያዊነት ተገድቧል። ነገር ግን ለመርዳት እችላለሁ፤ እባክዎ የሚፈልጉትን የንብረት ዓይነት፣ ቦታ እና በጀት ይጻፉ።';
  }
  return 'Sorry, the AI service is temporarily limited. Please share the property type, location, and budget you are looking for.';
}

/* In-memory caches to cut DB round-trips on hot paths.
   Both caches are tiny (a few rows) and refreshed every 60 s. */
const AI_PROMPT_CACHE = { value: null, expires: 0 };
const AI_PROPS_CACHE  = { value: null, expires: 0 };
const AI_CACHE_TTL_MS = 60 * 1000;

/* ── Property search criteria extraction ──────────────────────────── */

const SUBCITY_ALIASES = {
  bole: 'Bole', kirkos: 'Kirkos', yeka: 'Yeka', kolfe: 'Kolfe Keranio',
  'kolfe keranio': 'Kolfe Keranio', 'nifas silk': 'Nifas Silk Lafto',
  'nifas silk lafto': 'Nifas Silk Lafto', lafto: 'Nifas Silk Lafto',
  arada: 'Arada', lideta: 'Lideta', gulele: 'Gulele',
  'akaki': 'Akaki Kality', 'akaki kality': 'Akaki Kality', kality: 'Akaki Kality',
  'addis ketema': 'Addis Ketema', lemi: 'Lemi Kura', 'lemi kura': 'Lemi Kura',
  // popular neighbourhood names
  'old airport': 'Bole', 'bole road': 'Bole', 'sarbet': 'Nifas Silk Lafto',
  'megenagna': 'Yeka', 'kazanchis': 'Kirkos', 'mexico': 'Kirkos',
  'piassa': 'Arada', 'arat kilo': 'Arada', 'semen': 'Gulele',
  '4 kilo': 'Arada', '4kilo': 'Arada', 'kera': 'Lideta',
  'summit': 'Bole', 'hayahulet': 'Bole', '22': 'Bole',
};

const PROPERTY_TYPE_ALIASES = {
  apartment: 'Apartment', apt: 'Apartment', flat: 'Apartment', condo: 'Apartment',
  house: 'House', home: 'House', villa: 'Villa', townhouse: 'Townhouse',
  commercial: 'Commercial', office: 'Commercial', shop: 'Commercial', store: 'Commercial',
  land: 'Land', plot: 'Land', lot: 'Land',
};

/**
 * Extract searchable criteria from a free-text user message.
 * Returns an object: { subcity, propertyType, bedrooms, minPrice, maxPrice, status }
 * All fields are optional (undefined when not detected).
 */
function parseSearchCriteria(text) {
  const t = (text || '').toLowerCase();
  const criteria = {};

  // Subcity / area
  for (const [alias, canonical] of Object.entries(SUBCITY_ALIASES)) {
    if (t.includes(alias)) { criteria.subcity = canonical; break; }
  }

  // Property type
  for (const [alias, canonical] of Object.entries(PROPERTY_TYPE_ALIASES)) {
    if (new RegExp(`\\b${alias}s?\\b`).test(t)) { criteria.propertyType = canonical; break; }
  }

  // Bedrooms — match patterns like "2 bed", "3-bedroom", "4br", "3bd", "two bedroom"
  const WORD_NUMS = { one:1, two:2, three:3, four:4, five:5, six:6 };
  const bedMatch = t.match(/(\d+)\s*[-\s]?(bed(?:room)?s?|br\b|bd\b)/) ||
                   t.match(/(one|two|three|four|five|six)\s*[-\s]?bed(?:room)?s?/);
  if (bedMatch) {
    const raw = bedMatch[1];
    criteria.bedrooms = WORD_NUMS[raw] ?? parseInt(raw, 10);
  }

  // Status — for rent / for sale
  if (/\brent(al)?\b|\bto rent\b|\bfor rent\b/.test(t)) criteria.status = 'For Rent';
  else if (/\bfor sale\b|\bbuy\b|\bpurchase\b|\bto buy\b/.test(t)) criteria.status = 'For Sale';

  // Price — extract numeric ETB amounts (e.g. "3 million", "2.5m", "500k", "1,500,000")
  const millionMatch = t.match(/(\d+(?:\.\d+)?)\s*(?:million|m\b)/);
  const kMatch       = t.match(/(\d+(?:\.\d+)?)\s*(?:thousand|k\b)/);
  const rawMatch     = t.match(/(?:etb|birr)?\s*([\d,]+)/);

  let anchor = null;
  if (millionMatch)      anchor = parseFloat(millionMatch[1]) * 1_000_000;
  else if (kMatch)       anchor = parseFloat(kMatch[1]) * 1_000;
  else if (rawMatch)     anchor = parseFloat(rawMatch[1].replace(/,/g, ''));

  if (anchor && anchor >= 10_000) {
    // "under X" / "below X" / "less than X" → max price
    if (/\b(?:under|below|less than|max(?:imum)?|up to|budget)\b/.test(t)) {
      criteria.maxPrice = anchor;
    } else if (/\b(?:above|over|more than|at least|minimum|min)\b/.test(t)) {
      criteria.minPrice = anchor;
    } else {
      // treat as an approximate anchor: ±60% range
      criteria.minPrice = Math.round(anchor * 0.4);
      criteria.maxPrice = Math.round(anchor * 1.6);
    }
  }

  return criteria;
}

/**
 * Query the DB for properties matching the extracted criteria.
 * Returns a formatted string block (same style as getCachedPropertySummary)
 * or null if no criteria were found / no matches.
 */
async function queryMatchingProperties(pool, criteria) {
  const hasCriteria = Object.keys(criteria).length > 0;
  if (!hasCriteria) return null;

  const conditions = [];
  const params = [];

  if (criteria.subcity) {
    params.push(`%${criteria.subcity}%`);
    conditions.push(`(subcity ILIKE $${params.length} OR city ILIKE $${params.length} OR address ILIKE $${params.length})`);
  }
  if (criteria.propertyType) {
    params.push(criteria.propertyType);
    conditions.push(`property_type ILIKE $${params.length}`);
  }
  if (criteria.bedrooms) {
    params.push(criteria.bedrooms);
    conditions.push(`bedrooms = $${params.length}`);
  }
  if (criteria.status) {
    params.push(criteria.status);
    conditions.push(`status ILIKE $${params.length}`);
  }
  if (criteria.minPrice != null) {
    params.push(criteria.minPrice);
    conditions.push(`price >= $${params.length}`);
  }
  if (criteria.maxPrice != null) {
    params.push(criteria.maxPrice);
    conditions.push(`price <= $${params.length}`);
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const sql = `
    SELECT id, title, price, city, subcity, bedrooms, bathrooms,
           property_type, status, address
    FROM properties
    ${where}
    ORDER BY is_featured DESC, created_at DESC
    LIMIT 8
  `;

  try {
    const { rows } = await pool.query(sql, params);
    if (!rows.length) {
      // No exact matches — relax to a broader query (drop bedrooms/price if set)
      const looseConds = [];
      const looseParams = [];
      if (criteria.subcity) {
        looseParams.push(`%${criteria.subcity}%`);
        looseConds.push(`(subcity ILIKE $${looseParams.length} OR city ILIKE $${looseParams.length} OR address ILIKE $${looseParams.length})`);
      }
      if (criteria.propertyType) {
        looseParams.push(criteria.propertyType);
        looseConds.push(`property_type ILIKE $${looseParams.length}`);
      }
      if (criteria.status) {
        looseParams.push(criteria.status);
        looseConds.push(`status ILIKE $${looseParams.length}`);
      }
      if (!looseConds.length) return null;
      const looseWhere = `WHERE ${looseConds.join(' AND ')}`;
      const { rows: looseRows } = await pool.query(
        `SELECT id, title, price, city, subcity, bedrooms, bathrooms, property_type, status, address
         FROM properties ${looseWhere}
         ORDER BY is_featured DESC, created_at DESC LIMIT 8`,
        looseParams
      ).catch(() => ({ rows: [] }));
      if (!looseRows.length) return null;
      return `(Relaxed criteria — closest available matches)\n` +
        looseRows.map(p =>
          `- [#${p.id}] ${p.title} | ${p.property_type} | ${p.status} | ETB ${Number(p.price).toLocaleString()} | ${[p.subcity, p.city].filter(Boolean).join(', ')} | ${p.bedrooms}bd ${p.bathrooms}ba | View: /properties/${p.id}`
        ).join('\n');
    }
    return rows.map(p =>
      `- [#${p.id}] ${p.title} | ${p.property_type} | ${p.status} | ETB ${Number(p.price).toLocaleString()} | ${[p.subcity, p.city].filter(Boolean).join(', ')} | ${p.bedrooms}bd ${p.bathrooms}ba | View: /properties/${p.id}`
    ).join('\n');
  } catch (e) {
    console.error('[AI search] query error:', e.message);
    return null;
  }
}

async function getCachedPrompts(pool) {
  const now = Date.now();
  if (AI_PROMPT_CACHE.value && now < AI_PROMPT_CACHE.expires) return AI_PROMPT_CACHE.value;
  const { rows } = await pool.query(
    'SELECT lang, system_prompt FROM ai_prompts WHERE system_prompt IS NOT NULL'
  );
  const map = {};
  for (const r of rows) map[r.lang] = r.system_prompt;
  AI_PROMPT_CACHE.value = map;
  AI_PROMPT_CACHE.expires = now + AI_CACHE_TTL_MS;
  return map;
}

async function getCachedPropertySummary(pool) {
  const now = Date.now();
  if (AI_PROPS_CACHE.value && now < AI_PROPS_CACHE.expires) return AI_PROPS_CACHE.value;
  const { rows } = await pool.query(
    `SELECT id, title, price, city, subcity, bedrooms, bathrooms, property_type, status
     FROM properties ORDER BY is_featured DESC, created_at DESC LIMIT 30`
  ).catch(() => ({ rows: [] }));
  const summary = rows.length
    ? rows.map(p =>
        `- [#${p.id}] ${p.title} | ${p.property_type} | ${p.status} | ETB ${Number(p.price).toLocaleString()} | ${[p.subcity, p.city].filter(Boolean).join(', ')} | ${p.bedrooms}bd ${p.bathrooms}ba`
      ).join('\n')
    : '(No properties listed yet)';
  AI_PROPS_CACHE.value = summary;
  AI_PROPS_CACHE.expires = now + AI_CACHE_TTL_MS;
  return summary;
}

function registerAIRoutes(app, pool) {
  /* GET /api/ai/prompt/:lang  — public, returns the system prompt for a language */
  app.get('/api/ai/prompt/:lang', async (req, res) => {
    try {
      const { rows } = await pool.query(
        'SELECT system_prompt, updated_at FROM ai_prompts WHERE lang = $1', [req.params.lang]
      );
      if (!rows.length) return res.status(404).json({ error: 'Prompt not found' });
      res.json(rows[0]);
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  /* GET /api/ai/greeting/:lang  — public, returns the configured greeting */
  app.get('/api/ai/greeting/:lang', async (req, res) => {
    try {
      const { rows } = await pool.query(
        'SELECT greeting FROM ai_prompts WHERE lang = $1', [req.params.lang]
      );
      res.json({ greeting: rows[0]?.greeting || '' });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  /* GET /api/admin/ai-prompts  — admin: list all prompts */
  app.get('/api/admin/ai-prompts', isAdmin, async (req, res) => {
    try {
      const { rows } = await pool.query('SELECT * FROM ai_prompts ORDER BY lang');
      res.json(rows);
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  /* PUT /api/admin/ai-prompts/:lang  — admin: update a prompt and/or greeting
     (needed by the ported admin AI-prompt editor UI to save changes) */
  app.put('/api/admin/ai-prompts/:lang', isAdmin, async (req, res) => {
    try {
      const { system_prompt, greeting } = req.body;
      if (system_prompt == null && greeting == null) {
        return res.status(400).json({ error: 'system_prompt or greeting required' });
      }
      const { rows } = await pool.query(
        `INSERT INTO ai_prompts (lang, system_prompt, greeting, updated_at)
         VALUES ($1, $2, $3, NOW())
         ON CONFLICT (lang) DO UPDATE SET
           system_prompt = COALESCE($2, ai_prompts.system_prompt),
           greeting = COALESCE($3, ai_prompts.greeting),
           updated_at = NOW()
         RETURNING *`,
        [req.params.lang, system_prompt ?? null, greeting ?? null]
      );
      AI_PROMPT_CACHE.value = null;
      AI_PROMPT_CACHE.expires = 0;
      res.json(rows[0]);
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  /* Build the system instruction shared by both the streaming and JSON chat paths. */
  async function buildChatRequest({ messages, language, propertyId }) {
    const allText = Array.isArray(messages)
      ? messages.map(m => String(m?.content || '')).join(' ')
      : '';
    const containsAmharic = /[\u1200-\u137F]/.test(allText);
    let lang;
    if (language === 'am' || language === 'en') {
      lang = language;
      if (containsAmharic) lang = 'am';
    } else {
      lang = containsAmharic ? 'am' : 'en';
    }

    const pidNum = Number(propertyId);
    const hasPid = Number.isInteger(pidNum) && pidNum > 0;

    // Extract search criteria from the latest user message for targeted retrieval
    const recentMessages = Array.isArray(messages) ? messages : [];
    const lastUserMsg = [...recentMessages].reverse().find(m => m.role === 'user');
    const criteria = hasPid ? {} : parseSearchCriteria(lastUserMsg?.content || '');
    const hasSearchCriteria = Object.keys(criteria).length > 0;

    const [promptByLang, propSummary, matchedListings, currentPropRes] = await Promise.all([
      getCachedPrompts(pool),
      // Use generic summary only when no specific criteria detected and not on a property page
      (!hasPid && !hasSearchCriteria) ? getCachedPropertySummary(pool) : Promise.resolve(''),
      // Run targeted search when criteria found
      (!hasPid && hasSearchCriteria) ? queryMatchingProperties(pool, criteria) : Promise.resolve(null),
      hasPid
        ? pool.query(`SELECT * FROM properties WHERE id = $1 LIMIT 1`, [pidNum]).catch(() => ({ rows: [] }))
        : Promise.resolve({ rows: [] })
    ]);

    const otherLang = lang === 'am' ? 'en' : 'am';
    const basePrompt = promptByLang[lang] || promptByLang[otherLang];
    if (!basePrompt) {
      return { error: 'no admin prompt configured', lang };
    }

    let currentPropertyBlock = '';
    const cp = currentPropRes.rows[0];
    if (cp) {
      const features = Array.isArray(cp.features) ? cp.features.join(', ') : (cp.features || '');
      const fullAddr = [cp.address, cp.subcity, cp.city, cp.state, cp.zip_code, cp.country]
        .filter(Boolean).join(', ');
      const lines = [
        `ID: #${cp.id}`,
        `Title: ${cp.title || ''}`,
        `Status: ${cp.status || ''}`,
        `Type: ${cp.property_type || ''}`,
        `Price: ETB ${Number(cp.price || 0).toLocaleString()}`,
        `Bedrooms: ${cp.bedrooms ?? ''}`,
        `Bathrooms: ${cp.bathrooms ?? ''}`,
        `Size: ${cp.square_feet ?? ''} sq ft`,
        `Year built: ${cp.year_built ?? ''}`,
        `Address: ${fullAddr}`,
        features ? `Features: ${features}` : '',
        cp.description ? `Description: ${String(cp.description).slice(0, 800)}` : ''
      ].filter(Boolean).join('\n');
      currentPropertyBlock = lang === 'am'
        ? `\n\nተጠቃሚው አሁን ይህን ንብረት እያየ ነው። ስለዚህ ንብረት ሲጠይቅ ከታች ካለው መረጃ ብቻ መልስ። ምላሹን ሙሉ በሙሉ በአማርኛ ስጥ (የንብረቱ መረጃ በእንግሊዝኛ ቢሆንም እንኳን ስሞችንና አካባቢዎችን ተርጉም/ግልባጭ አድርግ)።\n--- Currently viewed property ---\n${lines}\n--- End ---`
        : `\n\nThe user is currently viewing this property. Answer questions about it using only the data below.\n--- Currently viewed property ---\n${lines}\n--- End ---`;
    }

    const langInstruction = lang === 'am'
      ? '\n\nIMPORTANT: Reply ONLY in Amharic (አማርኛ). Use simple, clear, professional Amharic. Never reply in English. Even when describing property data that is stored in English, translate or transliterate it into Amharic.'
      : '\n\nIMPORTANT: Reply ONLY in English. Use clear, professional English. Never reply in Amharic.';

    // Build listings block: prefer targeted search results, fall back to generic summary
    let listingsBlock = '';
    if (matchedListings) {
      const criteriaDesc = [
        criteria.propertyType,
        criteria.bedrooms ? `${criteria.bedrooms}-bedroom` : null,
        criteria.subcity ? `in ${criteria.subcity}` : null,
        criteria.status,
        criteria.maxPrice ? `under ETB ${criteria.maxPrice.toLocaleString()}` : null,
        criteria.minPrice ? `above ETB ${criteria.minPrice.toLocaleString()}` : null,
      ].filter(Boolean).join(' ');
      listingsBlock = `\n\nMatching listings from the database (${criteriaDesc || 'filtered search'}):\n${matchedListings}\n\nIMPORTANT: Base your answer on these real listings. Reference specific property IDs and prices from this list. Do not invent properties.`;
      console.log(`[AI search] criteria: ${JSON.stringify(criteria)} → matched listings block injected`);
    } else if (propSummary) {
      listingsBlock = `\n\nCurrent property listings:\n${propSummary}`;
    }

    const systemInstruction = `${basePrompt}${langInstruction}${listingsBlock}${currentPropertyBlock}`;

    const recent = Array.isArray(messages) ? messages.slice(-8) : [];
    const contents = recent.map(m => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: String(m.content || '').slice(0, 1000) }]
    }));

    return {
      lang,
      requestBody: {
        system_instruction: { parts: [{ text: systemInstruction }] },
        contents,
        generationConfig: {
          temperature: 0.4,
          maxOutputTokens: 220,
          thinkingConfig: { thinkingBudget: 0 }
        }
      }
    };
  }

  /* POST /api/ai/chat  — proxies to Gemini Flash (non-streaming, kept for back-compat) */
  app.post('/api/ai/chat', async (req, res) => {
    try {
      const apiKey = process.env.GEMINI_API_KEY || getExampleEnvValue('GEMINI_API_KEY');
      const built = await buildChatRequest(req.body || {});
      const lang = built.lang;
      if (!apiKey) return res.json({ text: aiFallbackText(lang), limited: true });
      if (built.error) {
        return res.status(503).json({ text: aiFallbackText(lang), error: built.error });
      }
      const result = await callGeminiWithFallback(apiKey, built.requestBody, lang);
      if (!result.ok) {
        return res.json({ text: aiFallbackText(lang), limited: true });
      }
      const text = result.data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) {
        console.error('[AI chat] No text in response:', JSON.stringify(result.data).slice(0, 500));
        return res.json({ text: lang === 'am' ? 'ይቅርታ፣ ምላሽ አልተገኘም።' : 'Sorry, no response was generated.' });
      }
      console.log(`[AI chat] ✓ response (${text.length} chars)`);
      res.json({ text });
    } catch (e) {
      console.error('[AI chat] Exception:', e.message);
      const lang = req.body?.language === 'am' ? 'am' : 'en';
      res.json({ text: aiFallbackText(lang), limited: true });
    }
  });

  /* POST /api/ai/chat-stream  — server-sent events streaming for low-latency UX.
     Sends `data: {"delta":"..."}` chunks and a final `data: [DONE]` line. */
  app.post('/api/ai/chat-stream', async (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    res.flushHeaders?.();

    const sendEvent = (obj) => {
      res.write(`data: ${JSON.stringify(obj)}\n\n`);
    };
    const finishWith = (text) => {
      sendEvent({ delta: text });
      res.write('data: [DONE]\n\n');
      res.end();
    };

    try {
      const apiKey = process.env.GEMINI_API_KEY || getExampleEnvValue('GEMINI_API_KEY');
      const built = await buildChatRequest(req.body || {});
      const lang = built.lang;
      if (!apiKey) return finishWith(aiFallbackText(lang));
      if (built.error) return finishWith(aiFallbackText(lang));

      const models = [GEMINI_MODEL, ...GEMINI_FALLBACK_MODELS];
      let streamed = false;
      for (const model of models) {
        const url = `${GEMINI_API_BASE}/${model}:streamGenerateContent?alt=sse&key=${apiKey}`;
        console.log(`[AI chat-stream] → ${model} | lang=${lang}`);
        let upstream;
        try {
          upstream = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Accept: 'text/event-stream' },
            body: JSON.stringify(built.requestBody)
          });
        } catch (e) {
          console.error(`[AI chat-stream] ${model} fetch error:`, e.message);
          continue;
        }
        if (!upstream.ok || !upstream.body) {
          const t = await upstream.text().catch(() => '');
          console.error(`[AI chat-stream] ${model} HTTP ${upstream.status}:`, t.slice(0, 200));
          continue;
        }

        const decoder = new TextDecoder();
        let buf = '';
        let totalChars = 0;

        const handleChunk = (chunk) => {
          buf += decoder.decode(chunk, { stream: true });
          buf = buf.replace(/\r\n/g, '\n');
          let idx;
          while ((idx = buf.indexOf('\n\n')) !== -1) {
            const event = buf.slice(0, idx);
            buf = buf.slice(idx + 2);
            const dataLines = event.split('\n')
              .filter(l => l.startsWith('data:'))
              .map(l => l.slice(5).replace(/^ /, ''));
            if (!dataLines.length) continue;
            const payload = dataLines.join('\n').trim();
            if (!payload || payload === '[DONE]') continue;
            try {
              const obj = JSON.parse(payload);
              const parts = obj?.candidates?.[0]?.content?.parts || [];
              for (const p of parts) {
                if (typeof p?.text === 'string' && p.text.length) {
                  totalChars += p.text.length;
                  sendEvent({ delta: p.text });
                }
              }
            } catch (err) {
              console.warn('[AI chat-stream] parse failed:', err.message, 'payload sample:', payload.slice(0, 120));
            }
          }
        };

        try {
          if (upstream.body && typeof upstream.body.getReader === 'function') {
            const reader = upstream.body.getReader();
            while (true) {
              const { value, done } = await reader.read();
              if (done) break;
              handleChunk(value);
            }
          } else {
            for await (const chunk of upstream.body) {
              handleChunk(chunk);
            }
          }
          if (buf.trim()) {
            handleChunk(Buffer.from('\n\n'));
          }
        } catch (e) {
          console.error(`[AI chat-stream] ${model} read error:`, e.message);
        }
        console.log(`[AI chat-stream] ✓ streamed (${totalChars} chars)`);
        if (totalChars === 0) {
          continue;
        }
        streamed = true;
        break;
      }

      if (!streamed) {
        sendEvent({ delta: aiFallbackText(lang) });
      }
      res.write('data: [DONE]\n\n');
      res.end();
    } catch (e) {
      console.error('[AI chat-stream] Exception:', e.message);
      try { finishWith(aiFallbackText('en')); } catch {}
    }
  });

  /* POST /api/ai/tts — Gemini text-to-speech, returns WAV audio */
  const TTS_MODELS = ['gemini-3.1-flash-tts-preview', 'gemini-2.5-flash-preview-tts', 'gemini-2.5-pro-preview-tts'];
  const TTS_CACHE = new Map(); // key -> { wav: Buffer, at: number }
  const TTS_CACHE_MAX = 80;
  const TTS_CACHE_TTL = 24 * 60 * 60 * 1000;
  function cacheGet(key) {
    const e = TTS_CACHE.get(key);
    if (!e) return null;
    if (Date.now() - e.at > TTS_CACHE_TTL) { TTS_CACHE.delete(key); return null; }
    return e.wav;
  }
  function cacheSet(key, wav) {
    if (TTS_CACHE.size >= TTS_CACHE_MAX) {
      const first = TTS_CACHE.keys().next().value;
      if (first !== undefined) TTS_CACHE.delete(first);
    }
    TTS_CACHE.set(key, { wav, at: Date.now() });
  }
  app.post('/api/ai/tts', async (req, res) => {
    try {
      const { text, voice } = req.body || {};
      if (!text || typeof text !== 'string') {
        return res.status(400).json({ error: 'text required' });
      }
      const apiKey = process.env.GEMINI_API_KEY || getExampleEnvValue('GEMINI_API_KEY');
      if (!apiKey) return res.status(503).json({ error: 'tts unavailable' });

      const cleanText = text.slice(0, 1500);
      const voiceName = (voice && /^[A-Za-z]+$/.test(voice)) ? voice : 'Charon';
      const isAmharic = /[\u1200-\u137F]/.test(cleanText);

      const cacheKey = voiceName + '|' + cleanText;
      const cached = cacheGet(cacheKey);
      if (cached) {
        res.setHeader('Content-Type', 'audio/wav');
        res.setHeader('Cache-Control', 'no-store');
        res.setHeader('X-TTS-Cache', 'hit');
        return res.send(cached);
      }

      const ttsPrompt = isAmharic
        ? `Speak warmly, naturally and clearly in Amharic with a deep professional male tone: ${cleanText}`
        : `Speak in a deep, professional, confident male voice: ${cleanText}`;
      const requestBody = {
        contents: [{ parts: [{ text: ttsPrompt }] }],
        generationConfig: {
          responseModalities: ['AUDIO'],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName } }
          }
        }
      };

      let audioB64 = null, mimeType = 'audio/L16;rate=24000';
      let lastErr = '';
      for (const model of TTS_MODELS) {
        const url = `${GEMINI_API_BASE}/${model}:generateContent?key=${apiKey}`;
        console.log(`[AI tts] → ${model} | chars=${cleanText.length}`);
        const r = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestBody)
        });
        const raw = await r.text();
        if (!r.ok) {
          lastErr = `${r.status} ${raw.slice(0, 200)}`;
          console.error(`[AI tts] ${model} HTTP ${r.status}:`, raw.slice(0, 200));
          continue;
        }
        let data; try { data = JSON.parse(raw); } catch { data = {}; }
        const part = data?.candidates?.[0]?.content?.parts?.find(p => p.inlineData);
        if (part?.inlineData?.data) {
          audioB64 = part.inlineData.data;
          mimeType = part.inlineData.mimeType || mimeType;
          break;
        }
        lastErr = 'no audio in response';
      }

      if (!audioB64) {
        const isQuota = /\b429\b|RESOURCE_EXHAUSTED|quota/i.test(lastErr || '');
        return res.status(isQuota ? 429 : 502).json({
          error: isQuota ? 'tts quota exhausted' : 'tts failed',
          quota: isQuota,
          detail: (lastErr || '').slice(0, 200)
        });
      }

      const pcm = Buffer.from(audioB64, 'base64');
      const rateMatch = /rate=(\d+)/i.exec(mimeType);
      const sampleRate = rateMatch ? parseInt(rateMatch[1], 10) : 24000;
      const wav = pcmToWav(pcm, sampleRate, 1, 16);

      cacheSet(cacheKey, wav);
      res.setHeader('Content-Type', 'audio/wav');
      res.setHeader('Cache-Control', 'no-store');
      res.setHeader('X-TTS-Cache', 'miss');
      res.send(wav);
    } catch (e) {
      console.error('[AI tts] Exception:', e.message);
      res.status(500).json({ error: 'tts error' });
    }
  });
}

/* Wrap raw PCM in a minimal WAV container the browser can play */
function pcmToWav(pcm, sampleRate, channels, bitsPerSample) {
  const byteRate = sampleRate * channels * bitsPerSample / 8;
  const blockAlign = channels * bitsPerSample / 8;
  const dataSize = pcm.length;
  const buffer = Buffer.alloc(44 + dataSize);
  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write('WAVE', 8);
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20);
  buffer.writeUInt16LE(channels, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(byteRate, 28);
  buffer.writeUInt16LE(blockAlign, 32);
  buffer.writeUInt16LE(bitsPerSample, 34);
  buffer.write('data', 36);
  buffer.writeUInt32LE(dataSize, 40);
  pcm.copy(buffer, 44);
  return buffer;
}

/* ─── MAIN EXPORT ────────────────────────────────────── */
export async function setup(app) {
  let pool;
  try {
    const connStr = process.env.NEON_DATABASE_URL || process.env.DATABASE_URL;
    pool = new pg.Pool({ connectionString: connStr });
    await runMigrations(pool);
    registerBlogRoutes(app, pool);
    registerBlogSSRRoutes(app, pool);
    registerAIRoutes(app, pool);
    registerGoogleAuthRoutes(app, pool);
    console.log('[extensions] All features registered successfully');
  } catch (err) {
    console.error('[extensions] Setup error:', err.message);
  }
}
