/**
 * Google Indexing API — auto-notifies Google when a property is created/updated/deleted.
 * Uses a service account JWT to authenticate.
 */
import crypto from 'crypto';
import https from 'https';

const SERVICE_ACCOUNT = {
  type: "service_account",
  project_id: "primeaddis-seo",
  private_key_id: "17778f88ddd27e0bcd89dbb1170af014f19224e3",
  private_key: "-----BEGIN PRIVATE KEY-----\nMIIEvAIBADANBgkqhkiG9w0BAQEFAASCBKYwggSiAgEAAoIBAQCojPsEM6rkOXIf\n01OxD8PS8VntM2pNQWFzx/JECa4jX0QelFlsTdwdUYMCNqgpKkoio6EIWqmU1kh8\nMkvhILb1EjR4cv/ZXBH7A1dpCwLkVz52cpB5XB9bOgbEOhjssHW9Yi9iKKct3Tjv\nKrNwCF47eh7FI317P1C4jXlKh5HQWLOLrvhe92//7lOZsjvmgIxRjw55TuaCTX3y\nPwzdgflhOONL4xeCfCoS7rvJsBH5EYJDcJ2jIdwvzhz64w4cddlTxF6BrtTeI5R+\n/3467N0iPuSa3nS/SnZkUjV8FDLl5Vz6NsqT2Yr9KMMAmIqmTR6O5WInw+OoF2Q/\nIcHzGthFAgMBAAECggEAAsfP8Q7GlstNsyNtiBoYgRo1yHv9riMVrEf84cmfNH4f\neU8dJN7wuXPe7TXWj527dBQAWUQSSUVrzN1fb5S9fwk1w4zOVmrrxjyNvHVovRwX\nAXPVNXn8DBsxeoy6B3qq9+drVaKD4mePHJR+K87TiD8mr4Ts8jOw1IPn2HhEyivE\nPoraa8cL0SZ+/mwf/evpE6hjLvf0q1IB4a1D05vrQThQgNY2W4ZHoTyHR2Iu+619\nLezuzurWEuW34GntWau9P4x9YHMiu/GCAsmtCDLoRLDvLt5YxUF0CqIT3kapa+op\n4sHeamNF3lWL48ewxwbeKPoEM4Fec5D3G8evbOy4aQKBgQDTv3H1E9WTXNXNR61a\nKxkP0wsp+SIFbJzSwPODD1yVcW43OybNgKf8D4RJCiqd0UfP7rOQPyC+CDy6eEEc\n5qOc3lmP+mBLKek13djS1xBJBDDUU/4tF0YZP54Nsam9sV8VWVbV5FkU20csQ1q7\n89Kl5TXeW2tHTMI8Vr66wRDouQKBgQDLxnrPU8GoZGDV7TLOUVBSLboA0VWHKkZt\nqcWgr2C+ktfEfbLeyPlTTANKdLf0MrnmCWMhK+rV58owOI0siP92Q+YLvu3b22lg\nTXEkbmSvu4DgQyVtp/oqCuln7B/m53g0jzhNZMv7Yqf2rd7mucVxUC8quLjjYcqq\nkBgg2rIN7QKBgHcLgdjkHsXrgnQXoRk5c6yW3Qbq/rqH9p7yRbVgNI/8Jpe8lLMi\nas7mNlwN8Cmr2DDJpYAqTZEo9mNrakgCTufJhhbRD8QSOv/Cyry2lnxGc+Fbm2Hk\nXM+jGYvfX2u7RZauFIjKCV8VbK0w7NkQWlRUSfXJ9cUvHWBo8G/0TTpZAoGANwD6\nQWBgU63UnaoLHrnALo59OJ9IsNVucUd0Ou1b9dT5POaZE523/w3zjXN3/Ah9OWSr\nR1btapPIdb+uC6lnG2s0e1MsLT5KcV41/hl2QCEipmY5giHnWtXbLtwDuHYeckF+\ndxWQIej9YY6JLkpSy0VTlfqKnYXWCLggay3dBfkCgYA5BiWEku2AEh9MOflTKNuc\n83+RYg8iNVJaTk+XGCHHfL3g/SBL/vRfTD4AZINMRuSfuIUwzB4rHUWXdSNm/z+4\nz7sQkZ2TLsspPHzR2+r2fhg+GR0psYXWIcsf2uW6HJHnoWAeqICLlt0+PZZwZW8P\nWhSQFoLvy2qUPUvEtzvPcw==\n-----END PRIVATE KEY-----\n",
  client_email: "primeaddis-indexing@primeaddis-seo.iam.gserviceaccount.com",
  token_uri: "https://oauth2.googleapis.com/token"
};

const SITE_BASE = 'https://primeaddiset.com';

// Build a signed JWT for Google OAuth2
function buildJWT() {
  const now = Math.floor(Date.now() / 1000);
  const header = Buffer.from(JSON.stringify({ alg: 'RS256', typ: 'JWT' })).toString('base64url');
  const payload = Buffer.from(JSON.stringify({
    iss: SERVICE_ACCOUNT.client_email,
    scope: 'https://www.googleapis.com/auth/indexing',
    aud: SERVICE_ACCOUNT.token_uri,
    iat: now,
    exp: now + 3600
  })).toString('base64url');
  const sign = crypto.createSign('RSA-SHA256');
  sign.update(`${header}.${payload}`);
  const sig = sign.sign(SERVICE_ACCOUNT.private_key, 'base64url');
  return `${header}.${payload}.${sig}`;
}

// Get access token from Google
async function getAccessToken() {
  const jwt = buildJWT();
  const body = `grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Ajwt-bearer&assertion=${jwt}`;
  return new Promise((resolve, reject) => {
    const req = https.request({
      hostname: 'oauth2.googleapis.com',
      path: '/token',
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'Content-Length': body.length }
    }, res => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        try { resolve(JSON.parse(data).access_token); }
        catch (e) { reject(e); }
      });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

// Notify Google Indexing API
async function notifyGoogle(url, type = 'URL_UPDATED') {
  try {
    const token = await getAccessToken();
    const body = JSON.stringify({ url, type });
    return new Promise((resolve) => {
      const req = https.request({
        hostname: 'indexing.googleapis.com',
        path: '/v3/urlNotifications:publish',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'Content-Length': Buffer.byteLength(body)
        }
      }, res => {
        let data = '';
        res.on('data', c => data += c);
        res.on('end', () => {
          console.log(`[Google Indexing] ${type} ${url} → ${res.statusCode}`);
          resolve(res.statusCode);
        });
      });
      req.on('error', e => {
        console.error('[Google Indexing] Error:', e.message);
        resolve(null);
      });
      req.write(body);
      req.end();
    });
  } catch (e) {
    console.error('[Google Indexing] Failed:', e.message);
  }
}

// Also ping the sitemap
function pingSitemap() {
  const sitemapUrl = encodeURIComponent(`${SITE_BASE}/sitemap.xml`);
  https.get(`https://www.google.com/ping?sitemap=${sitemapUrl}`, res => {
    console.log(`[Sitemap Ping] Status: ${res.statusCode}`);
  }).on('error', e => {
    console.error('[Sitemap Ping] Error:', e.message);
  });
}

/**
 * Main function — call this after a property is created/updated/deleted.
 * @param {object} property - the property object with id, title, subcity, city
 * @param {'created'|'updated'|'deleted'} action
 */
export async function notifyGoogleOfProperty(property, action = 'created') {
  try {
    // Build the property URL (same slug logic as the frontend)
    const slug = [property.title, property.subcity, property.city || 'addis-ababa']
      .filter(Boolean)
      .join(' ')
      .toLowerCase()
      .replace(/[\s_]+/g, '-')
      .replace(/[^a-z0-9-]/g, '')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');

    const url = `${SITE_BASE}/properties/${property.id}-${slug}`;
    const type = action === 'deleted' ? 'URL_DELETED' : 'URL_UPDATED';

    // Fire and forget — don't block the response
    notifyGoogle(url, type).catch(() => {});
    if (action !== 'deleted') pingSitemap();

    console.log(`[Auto-Index] Queued ${type} for: ${url}`);
  } catch (e) {
    console.error('[Auto-Index] Error building URL:', e.message);
  }
}
