// POST /api/load  { id }  Returns a saved draft so someone can pick up where they left off.
const L = require('./_lib');

module.exports = async (req, res) => {
  if (req.method !== 'POST') return L.send(res, 405, { error: 'method' });
  if (!L.configured()) return L.send(res, 503, { error: 'storage_not_configured' });
  try {
    const { id } = L.body(req);
    if (!L.ID_RE.test(String(id || ''))) return L.send(res, 400, { error: 'bad_id' });
    const rec = await L.readJson(L.recPath(id));
    if (!rec) return L.send(res, 404, { error: 'not_found' });
    return L.send(res, 200, {
      ok: true, id: rec.id, reference: rec.reference, status: rec.status, step: rec.step, data: rec.data,
      files: (rec.files || []).map((f) => ({ kind: f.kind, name: f.name, size: f.size })),
    });
  } catch (e) {
    console.error('load failed', e);
    return L.send(res, 500, { error: 'server' });
  }
};
