// POST /api/upload  (raw file body)
// Headers: x-reg-id, x-doc-kind (licence | id | address), x-file-name (URI-encoded). Max 4 MB.
const L = require('./_lib');
const KINDS = ['licence', 'id', 'address'];
const TYPES = { pdf: 'application/pdf', jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png' };
const MAX = 4 * 1024 * 1024;

async function raw(req) {
  if (Buffer.isBuffer(req.body)) return req.body;
  const chunks = []; let n = 0;
  for await (const c of req) { n += c.length; if (n > MAX + 1024) throw new Error('too_large'); chunks.push(c); }
  return Buffer.concat(chunks);
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') return L.send(res, 405, { error: 'method' });
  if (!L.configured()) return L.send(res, 503, { error: 'storage_not_configured' });
  try {
    const id = String(req.headers['x-reg-id'] || '');
    const kind = String(req.headers['x-doc-kind'] || '');
    let name = '';
    try { name = decodeURIComponent(String(req.headers['x-file-name'] || '')); } catch (e) { name = ''; }
    if (!L.ID_RE.test(id) || !KINDS.includes(kind)) return L.send(res, 400, { error: 'bad_request' });
    const ext = (name.split('.').pop() || '').toLowerCase();
    if (!TYPES[ext]) return L.send(res, 415, { error: 'file_type' });
    const rec = await L.readJson(L.recPath(id));
    if (!rec) return L.send(res, 404, { error: 'not_found' });
    const buf = await raw(req);
    if (!buf.length) return L.send(res, 400, { error: 'empty' });
    if (buf.length > MAX) return L.send(res, 413, { error: 'too_large' });
    const safe = name.replace(/[^A-Za-z0-9._-]+/g, '-').slice(-80);
    const path = `docs/${id}/${kind}.${ext}`;
    await L.put(path, buf, { access: 'private', allowOverwrite: true, contentType: TYPES[ext] });
    rec.files = (rec.files || []).filter((f) => f.kind !== kind).concat([{ kind, name: safe, size: buf.length, path, at: new Date().toISOString() }]);
    rec.updatedAt = new Date().toISOString();
    await L.writeJson(L.recPath(id), rec);
    return L.send(res, 200, { ok: true, kind, name: safe, size: buf.length });
  } catch (e) {
    if (String(e.message) === 'too_large') return L.send(res, 413, { error: 'too_large' });
    console.error('upload failed', e);
    return L.send(res, 500, { error: 'server' });
  }
};
module.exports.config = { api: { bodyParser: false } };
