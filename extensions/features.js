import pg from 'pg';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import sanitizeHtml from 'sanitize-html';
import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { scrypt, randomBytes } from 'crypto';
import { promisify } from 'util';
import { google } from 'googleapis';
import { registerAIRoutes, registerLiveVoiceRoute } from './gemini-ai.js';

const scryptAsync = promisify(scrypt);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/* ─── helpers ─────────────────────────────────────────── */
export function isAdmin(req, res, next) {
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

export function getExampleEnvValue(key) {
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

/* ─── GOOGLE SHEETS LEAD SYNC ────────────────────────────────────────────
   Appends a single lead row to the configured Sheet. Fire-and-forget;
   never throws — caller must .catch() if it wants to log errors.          */

function buildSheetsAuth() {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  let key = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY || '';
  // Env vars sometimes store literal \n instead of real newlines
  if (key && !key.includes('\n')) {
    key = key.replace(/\\n/g, '\n');
  }
  if (!email || !key) return null;
  return new google.auth.JWT({
    email,
    key,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });
}

async function appendLeadToSheets(name, phone, email, source) {
  const auth = buildSheetsAuth();
  if (!auth) {
    console.warn('[Sheets] Skipping — GOOGLE_SERVICE_ACCOUNT_EMAIL / GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY not set');
    return;
  }
  const spreadsheetId = process.env.GOOGLE_SHEETS_ID;
  if (!spreadsheetId) {
    console.warn('[Sheets] Skipping — GOOGLE_SHEETS_ID not set');
    return;
  }
  const date = new Date().toLocaleString('en-US', { timeZone: 'Africa/Addis_Ababa' });
  const sheets = google.sheets({ version: 'v4', auth });
  await sheets.spreadsheets.values.append({
    spreadsheetId,
    range: 'Sheet1!A:E',
    valueInputOption: 'USER_ENTERED',
    requestBody: {
      values: [[name || '', phone || '', email || '', source || '', date]],
    },
  });
  console.log(`[Sheets] Lead appended — ${source}: ${name} <${email}>`);
}

/* Splices a res.json() interceptor BEFORE the /api/subscribe route in
   Express's internal stack so we catch 201 responses without touching
   the compiled bundle. */
function installSubscribeInterceptor(app) {
  const interceptorFn = (req, res, next) => {
    if (req.method !== 'POST' || req.path !== '/api/subscribe') return next();
    const origJson = res.json.bind(res);
    res.json = function (body) {
      if (res.statusCode === 201 && body && body.subscriber) {
        const s = body.subscriber;
        appendLeadToSheets(s.name || 'Website Visitor', s.phone || '', s.email || '', 'Website Popup')
          .catch(e => console.error('[Sheets] Subscribe sync error:', e.message));
      }
      return origJson.call(this, body);
    };
    next();
  };

  // Register via app.use() so Express creates a proper Layer object for us
  app.use(interceptorFn);

  // Move that layer from the end of the stack to just after the built-in
  // query-parser / init layers (positions 0-1), so it fires before the
  // bundle's /api/subscribe route handler.
  const stack = app._router && app._router.stack;
  if (stack && stack.length > 2) {
    const layer = stack.pop();
    stack.splice(2, 0, layer);
    console.log('[Sheets] Subscribe response interceptor installed');
  } else {
    console.warn('[Sheets] Could not reposition interceptor — stack not accessible');
  }
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

/* ─── MAIN EXPORT ────────────────────────────────────── */
export async function setup(app, server) {
  let pool;
  try {
    const connStr = process.env.NEON_DATABASE_URL || process.env.DATABASE_URL;
    pool = new pg.Pool({ connectionString: connStr });
    await runMigrations(pool);
    registerBlogRoutes(app, pool);
    registerBlogSSRRoutes(app, pool);
    registerAIRoutes(app, pool);
    registerGoogleAuthRoutes(app, pool);
    registerLiveVoiceRoute(server, pool);

    // ── Google Sheets lead sync ──────────────────────────────────────────
    // Intercept /api/subscribe 201 responses (from the compiled bundle's route)
    installSubscribeInterceptor(app);

    // Manual/test endpoint — POST { name, phone, email, source }
    app.post('/api/sheets-lead', async (req, res) => {
      try {
        const { name, phone, email, source } = req.body || {};
        await appendLeadToSheets(name || '', phone || '', email || '', source || 'Manual');
        res.json({ ok: true });
      } catch (e) {
        console.error('[Sheets] /api/sheets-lead error:', e.message);
        res.status(500).json({ ok: false, error: e.message });
      }
    });

    console.log('[extensions] All features registered successfully');
  } catch (err) {
    console.error('[extensions] Setup error:', err.message);
  }
}
