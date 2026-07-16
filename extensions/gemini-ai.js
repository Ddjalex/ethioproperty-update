import { WebSocketServer, WebSocket as WSClient } from 'ws';
import { isAdmin, getExampleEnvValue } from './features.js';

/* ─── GEMINI AI — chat, text-to-speech, and live voice-to-voice ──────────
   Every AI feature in this app (chat widget, "speak" button, and the
   real-time voice call) uses Gemini only — no other AI/TTS provider is
   called from here, by explicit product decision. If Gemini's own voice
   quality for a language is ever a problem, fix it with prompt/voice
   tuning or a different Gemini model, not by adding another vendor. */

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
  // Official subcity name variants
  'nifas': 'Nifas Silk Lafto', 'silk lafto': 'Nifas Silk Lafto',
  // Popular neighbourhood names → canonical subcity
  'old airport': 'Bole', 'bole road': 'Bole', 'sarbet': 'Nifas Silk Lafto',
  'megenagna': 'Yeka', 'megenanya': 'Yeka', 'kazanchis': 'Kirkos', 'mexico': 'Kirkos',
  'piassa': 'Arada', 'piyassa': 'Arada', 'arat kilo': 'Arada', 'semen': 'Gulele',
  '4 kilo': 'Arada', '4kilo': 'Arada', 'kera': 'Lideta',
  'hayahulet': 'Bole', '22': 'Bole',
  // Actual address values stored in DB
  'cmc': 'Lemi Kura', 'cmc figa': 'Lemi Kura',
  'summit': 'Lemi Kura', 'summit 72': 'Lemi Kura', 'semit': 'Lemi Kura',
  'semit 72': 'Lemi Kura', 'semit figa': 'Lemi Kura', 'semit giorgis': 'Lemi Kura',
  'gofa': 'Nifas Silk Lafto', 'jemo': 'Nifas Silk Lafto',
  'ayat': 'Yeka', 'ayat zone 2': 'Yeka',
  'bole bulbula': 'Bole', 'bole dembel': 'Bole', 'bole gazebo': 'Bole',
  'bole peacock': 'Bole', 'bole edna': 'Bole', 'bole sheger': 'Bole',
  'bole millennium': 'Bole', 'millennium': 'Bole',
  'bisrate': 'Bole', 'bisrate gebriel': 'Bole',
  'bulgaria': 'Bole', 'bulgary': 'Bole',
  'alemgena': 'Akaki Kality',
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
const PROPERTY_SELECT_COLS =
  'id, title, price, city, subcity, address, bedrooms, bathrooms, property_type, status, features, images';

/** Shape a raw DB row into the compact structure the frontend uses to render
 *  a real property card (real link, real image, real price/beds/baths). */
function toCardShape(p) {
  const loc = [p.address, p.subcity, p.city].filter(Boolean).join(', ');
  const images = Array.isArray(p.images) ? p.images : [];
  const features = Array.isArray(p.features) ? p.features : [];
  return {
    id: p.id,
    title: p.title,
    price: Number(p.price) || 0,
    propertyType: p.property_type,
    status: p.status,
    bedrooms: p.bedrooms,
    bathrooms: p.bathrooms,
    location: loc,
    features,
    image: images[0] || null,
    link: `/properties/${p.id}`,
  };
}

function formatListingLine(p) {
  const loc = [p.address, p.subcity, p.city].filter(Boolean).join(', ');
  const features = Array.isArray(p.features) ? p.features : [];
  const featuresStr = features.length ? features.slice(0, 6).join(', ') : 'none listed';
  return `- [#${p.id}] ${p.title} | ${p.property_type} | ${p.status} | ETB ${Number(p.price).toLocaleString()} | ${loc} | ${p.bedrooms}bd ${p.bathrooms}ba | Amenities: ${featuresStr} | View: /properties/${p.id}`;
}

/**
 * Query the DB for properties matching the extracted criteria.
 * Returns { text, rows, cards } (text for the LLM prompt, cards for the
 * frontend to render as real property cards) or null if no criteria /
 * no matches at all.
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
    SELECT ${PROPERTY_SELECT_COLS}
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
        `SELECT ${PROPERTY_SELECT_COLS}
         FROM properties ${looseWhere}
         ORDER BY is_featured DESC, created_at DESC LIMIT 8`,
        looseParams
      ).catch(() => ({ rows: [] }));
      if (!looseRows.length) return null;
      return {
        text: `(Relaxed criteria — closest available matches)\n` + looseRows.map(formatListingLine).join('\n'),
        rows: looseRows,
        cards: looseRows.map(toCardShape),
      };
    }
    return {
      text: rows.map(formatListingLine).join('\n'),
      rows,
      cards: rows.map(toCardShape),
    };
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
    `SELECT ${PROPERTY_SELECT_COLS}
     FROM properties ORDER BY is_featured DESC, created_at DESC LIMIT 30`
  ).catch(() => ({ rows: [] }));
  const result = rows.length
    ? { text: rows.map(formatListingLine).join('\n'), rows, cards: rows.map(toCardShape) }
    : { text: '(No properties listed yet)', rows: [], cards: [] };
  AI_PROPS_CACHE.value = result;
  AI_PROPS_CACHE.expires = now + AI_CACHE_TTL_MS;
  return result;
}

export function registerAIRoutes(app, pool) {
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
      (!hasPid && !hasSearchCriteria) ? getCachedPropertySummary(pool) : Promise.resolve(null),
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
    let currentPropertyCard = null;
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
      currentPropertyCard = toCardShape(cp);
    }

    const langInstruction = lang === 'am'
      ? '\n\nIMPORTANT: Reply ONLY in Amharic (አማርኛ). Use simple, clear, professional Amharic. Never reply in English. Even when describing property data that is stored in English, translate or transliterate it into Amharic.'
      : '\n\nIMPORTANT: Reply ONLY in English. Use clear, professional English. Never reply in Amharic.';

    // Build listings block: prefer targeted search results, fall back to generic summary
    let listingsBlock = '';
    let cards = [];
    if (matchedListings) {
      const criteriaDesc = [
        criteria.propertyType,
        criteria.bedrooms ? `${criteria.bedrooms}-bedroom` : null,
        criteria.subcity ? `in ${criteria.subcity}` : null,
        criteria.status,
        criteria.maxPrice ? `under ETB ${criteria.maxPrice.toLocaleString()}` : null,
        criteria.minPrice ? `above ETB ${criteria.minPrice.toLocaleString()}` : null,
      ].filter(Boolean).join(' ');
      listingsBlock = `\n\nMatching listings from the database (${criteriaDesc || 'filtered search'}):\n${matchedListings.text}\n\nIMPORTANT: Base your answer ONLY on these real listings, including their exact price, bedrooms, bathrooms, address and amenities/features. Reference specific property IDs from this list. Do not invent or alter any detail.`;
      cards = matchedListings.cards;
      console.log(`[AI search] criteria: ${JSON.stringify(criteria)} → matched listings block injected`);
    } else if (propSummary && propSummary.text) {
      listingsBlock = `\n\nCurrent property listings:\n${propSummary.text}`;
      cards = propSummary.cards.slice(0, 8);
    }
    if (currentPropertyCard) {
      cards = [currentPropertyCard, ...cards.filter(c => c.id !== currentPropertyCard.id)];
    }

    const systemInstruction = `${basePrompt}${langInstruction}${listingsBlock}${currentPropertyBlock}`;

    const recent = Array.isArray(messages) ? messages.slice(-8) : [];
    const contents = recent.map(m => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: String(m.content || '').slice(0, 1000) }]
    }));

    return {
      lang,
      cards,
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
      res.json({ text, properties: built.cards || [] });
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
      if (built.cards && built.cards.length) {
        sendEvent({ properties: built.cards });
      }
      res.write('data: [DONE]\n\n');
      res.end();
    } catch (e) {
      console.error('[AI chat-stream] Exception:', e.message);
      try { finishWith(aiFallbackText('en')); } catch {}
    }
  });

  /* POST /api/ai/tts — Gemini text-to-speech, returns WAV audio.
     This is the ONLY text-to-speech path in the app — no other provider
     is used, even for Amharic. */
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
        ? `Speak warmly, naturally and clearly in Amharic with a professional tone: ${cleanText}`
        : `Speak in a deep, professional, confident voice: ${cleanText}`;
      // Note: Gemini TTS only handles English reliably here; Amharic TTS is
      // handled client-side via SpeechSynthesisUtterance(lang='am-ET').
      const requestBody = {
        contents: [{ parts: [{ text: ttsPrompt }] }],
        generationConfig: {
          responseModalities: ['AUDIO'],
          speechConfig: {
            languageCode: 'en-US',
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

/* ─── LIVE VOICE-TO-VOICE (Gemini Live API, real-time WebSocket) ─────────
   Proxies a browser WebSocket at /api/ai/live to Google's Live API so the
   audio never touches the client's API key. Native audio-to-audio only —
   by explicit product decision this never falls back to another TTS
   provider, even for Amharic. Uses Gemini 3.1 Flash Live for its improved
   multilingual native audio quality.
   Note: this app only sets systemInstruction once at connection time (no
   mid-session prompt swaps are performed).
   LIVE_MODEL must be a model that actually supports bidiGenerateContent —
   verify against GET /v1beta/models before changing this, since Gemini
   silently closes the socket right after setup (no error event) if the
   model name is invalid or doesn't support live/bidi audio. */
const LIVE_MODEL = 'models/gemini-3.1-flash-live-preview';
const LIVE_VOICE_NAME = 'Charon';
const LIVE_WS_URL = 'wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContent';

function buildLiveSystemInstruction(basePrompt, lang) {
  // Language rule is placed FIRST so it dominates the model's generation context,
  // and is written bilingually (target language + English) so the model's own
  // language processing is anchored in the correct language from the very first token.
  const langLine = lang === 'am'
    ? '=== ቋንቋ ደንብ (LANGUAGE RULE) ===\n' +
      'አማርኛ ብቻ ተናገር። አንድም የእንግሊዘኛ ቃል አትጠቀም። ጎብኚው እንግሊዘኛ ቢናገርም፣ ' +
      'ምላሽህ ሙሉ በሙሉ በአማርኛ መሆን አለበት።\n' +
      'CRITICAL: You MUST speak ONLY in Amharic (አማርኛ) for this entire conversation. ' +
      'Every single word you say must be in Amharic. Never use English. ' +
      'If the visitor speaks in English, still reply entirely in Amharic. ' +
      'Translate any English property data you mention into spoken Amharic.\n' +
      '=========================\n\n'
    : '=== LANGUAGE RULE ===\n' +
      'You MUST speak ONLY in English for this entire conversation. ' +
      'Every single word must be in English. Never switch to Amharic. ' +
      'Keep all property details and responses in clear, professional English.\n' +
      '=========================\n\n';
  const voiceLine = '\n\nYou are in a live, real-time spoken phone-style conversation, not a text chat. ' +
    'Keep replies short and natural — 1 to 3 sentences at a time. Never use markdown, bullet points, ' +
    'asterisks, or emoji, since everything you say is spoken aloud. Pause and let the visitor speak; ' +
    'if they interrupt you, stop and listen.';
  const toolLine = '\n\nYou have a tool named search_properties connected to the real, live Ethio Property ' +
    'database. Call it every single time the visitor asks about a property, price, location, amenity, or ' +
    'bedroom/bathroom count — even if you already showed listings earlier in the call, since the visitor may ' +
    'be asking about a different one. Never state a price, address, amenity, or bedroom/bathroom count that ' +
    'did not come back from that tool. If the tool returns nothing matching, say so honestly instead of guessing.\n\n' +
    'CRITICAL TOOL RULE: NEVER speak, say, or read aloud any function call name, JSON, parameter, or argument text. ' +
    'Tool calls are completely silent and invisible to the visitor — you invoke them internally, wait for the result, ' +
    'then speak ONLY your natural-language reply in the conversation language. ' +
    'If you say "call:search_properties" or any function name out loud, that is a serious error.';
  return `${langLine}${basePrompt}${voiceLine}${toolLine}`;
}

const SEARCH_PROPERTIES_TOOL = {
  functionDeclarations: [{
    name: 'search_properties',
    description: 'Search real, live property listings on the Ethio Property platform (uploaded by the admin). ' +
      'Always call this before telling the visitor any price, address, amenity, or bedroom/bathroom count.',
    parameters: {
      type: 'OBJECT',
      properties: {
        subcity: { type: 'STRING', description: 'Subcity or neighbourhood in Addis Ababa, e.g. Bole, Kirkos.' },
        propertyType: { type: 'STRING', description: 'Apartment, House, Villa, Townhouse, Commercial, or Land.' },
        bedrooms: { type: 'INTEGER', description: 'Exact number of bedrooms requested.' },
        status: { type: 'STRING', description: '"For Sale" or "For Rent".' },
        minPrice: { type: 'NUMBER', description: 'Minimum price in ETB.' },
        maxPrice: { type: 'NUMBER', description: 'Maximum price in ETB.' },
      },
    },
  }],
};

export function registerLiveVoiceRoute(server, pool) {
  if (!server || typeof server.on !== 'function') {
    console.warn('[AI live] No httpServer available — /api/ai/live will not be registered.');
    return;
  }

  const wss = new WebSocketServer({ noServer: true });

  server.on('upgrade', (req, socket, head) => {
    let pathname = '';
    try { pathname = new URL(req.url, 'http://localhost').pathname; } catch { pathname = req.url || ''; }
    if (pathname !== '/api/ai/live') return; // leave other upgrade listeners (e.g. Vite HMR) alone
    wss.handleUpgrade(req, socket, head, (ws) => wss.emit('connection', ws, req));
  });

  wss.on('connection', (clientWs) => {
    let upstream = null;
    let upstreamReady = false;
    let closed = false;
    const pendingRealtime = [];

    const sendToClient = (obj) => {
      if (clientWs.readyState === clientWs.OPEN) {
        try { clientWs.send(JSON.stringify(obj)); } catch {}
      }
    };

    const teardown = () => {
      if (closed) return;
      closed = true;
      if (upstream) { try { upstream.close(); } catch {} upstream = null; }
      try { clientWs.close(); } catch {}
    };

    clientWs.on('message', async (raw) => {
      let msg;
      try { msg = JSON.parse(raw.toString()); } catch { return; }

      if (msg.type === 'init') {
        const apiKey = process.env.GEMINI_API_KEY || getExampleEnvValue('GEMINI_API_KEY');
        if (!apiKey) {
          sendToClient({ type: 'error', message: 'Live voice is not configured on the server yet.' });
          return teardown();
        }
        const lang = msg.lang === 'am' ? 'am' : 'en';
        const pidNum = Number(msg.propertyId);
        const hasPid = Number.isInteger(pidNum) && pidNum > 0;

        let basePrompt = 'You are Addis, a warm and professional real estate agent for Ethio Property, a property platform in Addis Ababa, Ethiopia.';
        let extraBlock = '';
        try {
          const [promptByLang, propSummary, currentPropRes] = await Promise.all([
            getCachedPrompts(pool),
            hasPid ? Promise.resolve('') : getCachedPropertySummary(pool),
            hasPid
              ? pool.query('SELECT * FROM properties WHERE id = $1 LIMIT 1', [pidNum]).catch(() => ({ rows: [] }))
              : Promise.resolve({ rows: [] })
          ]);
          basePrompt = promptByLang[lang] || promptByLang[lang === 'am' ? 'en' : 'am'] || basePrompt;
          if (propSummary && propSummary.text) extraBlock += `\n\nCurrent property listings (call search_properties for a targeted, up-to-date match instead of relying only on this list):\n${propSummary.text}`;
          const cp = currentPropRes.rows[0];
          if (cp) {
            extraBlock += `\n\nThe visitor is currently viewing property #${cp.id}: ${cp.title || ''}, ` +
              `${cp.property_type || ''}, ${cp.status || ''}, ETB ${Number(cp.price || 0).toLocaleString()}, ` +
              `${cp.bedrooms ?? '?'}bd/${cp.bathrooms ?? '?'}ba, ${[cp.subcity, cp.city].filter(Boolean).join(', ')}.`;
          }
        } catch (e) {
          console.error('[AI live] prompt build error:', e.message);
        }

        const systemInstruction = buildLiveSystemInstruction(basePrompt + extraBlock, lang);

        try {
          upstream = new WSClient(`${LIVE_WS_URL}?key=${apiKey}`);
        } catch (e) {
          console.error('[AI live] failed to open upstream:', e.message);
          sendToClient({ type: 'error', message: 'Could not start the live voice session.' });
          return teardown();
        }

        const speechLangCode = lang === 'am' ? 'am-ET' : 'en-US';
        console.log(`[AI live] session init | lang=${lang} | speechLangCode=${speechLangCode}`);
        console.log(`[AI live] systemInstruction preview: ${systemInstruction.slice(0, 300)}`);
        upstream.on('open', () => {
          const setupMsg = {
            setup: {
              model: LIVE_MODEL,
              generationConfig: {
                responseModalities: ['AUDIO'],
                speechConfig: {
                  languageCode: speechLangCode,
                  voiceConfig: { prebuiltVoiceConfig: { voiceName: LIVE_VOICE_NAME } }
                }
              },
              systemInstruction: { parts: [{ text: systemInstruction }] },
              tools: [SEARCH_PROPERTIES_TOOL],
              // inputAudioTranscription/outputAudioTranscription only accept an empty
              // object to enable transcription — a languageCode field here is rejected
              // by the API with a 1007 "Cannot find field" close (language is inferred
              // from speechConfig.languageCode above).
              inputAudioTranscription: {},
              outputAudioTranscription: {}
            }
          };
          console.log('[AI live] sending setup to Gemini:', JSON.stringify(setupMsg).slice(0, 500));
          upstream.send(JSON.stringify(setupMsg));
        });

        upstream.on('message', async (data) => {
          let obj;
          try { obj = JSON.parse(data.toString()); } catch { return; }

          if (obj.setupComplete) {
            upstreamReady = true;
            sendToClient({ type: 'ready' });
            for (const m of pendingRealtime) { try { upstream.send(m); } catch {} }
            pendingRealtime.length = 0;
            return;
          }

          if (obj.toolCall && Array.isArray(obj.toolCall.functionCalls)) {
            const functionResponses = [];
            for (const call of obj.toolCall.functionCalls) {
              let resultText = 'No matching properties found in the database.';
              let cards = [];
              if (call.name === 'search_properties') {
                try {
                  const criteria = {};
                  const args = call.args || {};
                  if (args.subcity) criteria.subcity = args.subcity;
                  if (args.propertyType) criteria.propertyType = args.propertyType;
                  if (args.bedrooms) criteria.bedrooms = Number(args.bedrooms);
                  if (args.status) criteria.status = args.status;
                  if (args.minPrice != null) criteria.minPrice = Number(args.minPrice);
                  if (args.maxPrice != null) criteria.maxPrice = Number(args.maxPrice);
                  const result = Object.keys(criteria).length
                    ? await queryMatchingProperties(pool, criteria)
                    : await getCachedPropertySummary(pool);
                  if (result && result.text) {
                    resultText = result.text;
                    cards = result.cards || [];
                  }
                } catch (e) {
                  console.error('[AI live] search_properties tool error:', e.message);
                  resultText = 'Search failed due to a server error.';
                }
              }
              functionResponses.push({ id: call.id, name: call.name, response: { result: resultText } });
              if (cards.length) sendToClient({ type: 'properties', properties: cards });
            }
            try {
              upstream.send(JSON.stringify({ toolResponse: { functionResponses } }));
            } catch (e) {
              console.error('[AI live] failed to send tool response:', e.message);
            }
            return;
          }

          const sc = obj.serverContent;
          if (!sc) return;

          if (sc.interrupted) { sendToClient({ type: 'interrupted' }); return; }

          const parts = (sc.modelTurn && sc.modelTurn.parts) || [];
          for (const part of parts) {
            if (part.inlineData && part.inlineData.data) {
              sendToClient({
                type: 'audio',
                data: part.inlineData.data,
                mimeType: part.inlineData.mimeType || 'audio/pcm;rate=24000'
              });
            }
          }
          if (sc.outputTranscription && sc.outputTranscription.text) {
            // Strip any function-call notation the model may have vocalized (e.g. "call:search_properties{...}")
            const rawOut = sc.outputTranscription.text;
            const cleanOut = rawOut.replace(/call:\w[\w.]*\{[^}]*\}?/g, '').replace(/\s{2,}/g, ' ').trim();
            if (cleanOut) sendToClient({ type: 'transcript', role: 'assistant', text: cleanOut });
          }
          if (sc.inputTranscription && sc.inputTranscription.text) {
            sendToClient({ type: 'transcript', role: 'user', text: sc.inputTranscription.text });
          }
          if (sc.turnComplete) sendToClient({ type: 'turnComplete' });
        });

        upstream.on('error', (err) => {
          console.error('[AI live] upstream error:', err.message);
          sendToClient({ type: 'error', message: 'Live voice connection failed. You can keep typing instead.' });
          teardown();
        });

        upstream.on('close', (code, reason) => {
          console.log(`[AI live] upstream closed | code=${code} reason=${reason ? reason.toString().slice(0, 300) : ''}`);
          if (!closed) sendToClient({ type: 'error', message: 'Live voice session ended. You can keep typing instead.' });
          teardown();
        });

        return;
      }

      if (msg.realtimeInput) {
        const raw2 = JSON.stringify(msg);
        if (upstream && upstreamReady && upstream.readyState === upstream.OPEN) {
          try { upstream.send(raw2); } catch {}
        } else if (upstream) {
          pendingRealtime.push(raw2);
        }
      }
    });

    clientWs.on('close', teardown);
    clientWs.on('error', teardown);
  });

  console.log('[extensions] Live voice-to-voice WebSocket route registered (/api/ai/live)');
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
