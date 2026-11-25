// Shared helpers for the registration API. Files starting with "_" are not exposed as routes.
const crypto = require('crypto');
const { put, get, list } = require('@vercel/blob');

const ID_RE = /^[a-f0-9]{32}$/;
const configured = () => Boolean(process.env.BLOB_READ_WRITE_TOKEN || process.env.BLOB_STORE_ID);
const newId = () => crypto.randomBytes(16).toString('hex');
const recPath = (id) => `registrations/${id}.json`;
const reference = (id) => 'DB-' + id.slice(0, 6).toUpperCase();

function send(res, status, body) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify(body));
}

async function readJson(pathname) {
  const r = await get(pathname, { access: 'private', useCache: false });
  if (!r || !r.stream) return null;
  return JSON.parse(await new Response(r.stream).text());
}

async function writeJson(pathname, obj) {
  await put(pathname, JSON.stringify(obj), {
    access: 'private', allowOverwrite: true, contentType: 'application/json', cacheControlMaxAge: 60,
  });
}

// Keep only plain, bounded values so nobody can store megabytes or odd types.
function clean(v, depth = 0) {
  if (v === null || typeof v === 'boolean' || typeof v === 'number') return v;
  if (typeof v === 'string') return v.slice(0, 600);
  if (depth > 3) return null;
  if (Array.isArray(v)) return v.slice(0, 40).map((x) => clean(x, depth + 1));
  if (typeof v === 'object') {
    const o = {};
    Object.keys(v).slice(0, 60).forEach((k) => { o[String(k).slice(0, 40)] = clean(v[k], depth + 1); });
    return o;
  }
  return null;
}

function body(req) {
  if (req.body && typeof req.body === 'object' && !Buffer.isBuffer(req.body)) return req.body;
  try { return JSON.parse(Buffer.isBuffer(req.body) ? req.body.toString('utf8') : (req.body || '{}')); } catch (e) { return {}; }
}

function isAdmin(req) {
  const key = process.env.ADMIN_KEY || '';
  const given = String(req.headers.authorization || '').replace(/^Bearer\s+/i, '');
  if (key.length < 12 || given.length !== key.length) return false;
  return crypto.timingSafeEqual(Buffer.from(given), Buffer.from(key));
}

module.exports = { ID_RE, configured, newId, recPath, reference, send, readJson, writeJson, clean, body, isAdmin, put, get, list };
