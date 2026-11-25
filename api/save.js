// POST /api/save  { id?, data, step, submit?, callRequest? }
// Creates or updates a registration. Called as the applicant types, so partial applications are kept.
const L = require('./_lib');

module.exports = async (req, res) => {
  if (req.method !== 'POST') return L.send(res, 405, { error: 'method' });
  if (!L.configured()) return L.send(res, 503, { error: 'storage_not_configured' });
  try {
    const b = L.body(req);
    if (JSON.stringify(b).length > 60000) return L.send(res, 413, { error: 'too_large' });
    let id = b.id, rec = null;
    if (id) {
      if (!L.ID_RE.test(id)) return L.send(res, 400, { error: 'bad_id' });
      rec = await L.readJson(L.recPath(id));
      if (!rec) return L.send(res, 404, { error: 'not_found' });
    } else {
      const d = b.data || {};
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(String(d.email || ''))) return L.send(res, 400, { error: 'email_required' });
      id = L.newId();
      rec = { id, reference: L.reference(id), createdAt: new Date().toISOString(), status: 'draft', step: 0, data: {}, files: [] };
    }
    const now = new Date().toISOString();
    if (rec.status === 'submitted') {
      // After sending, only a call request can be added.
      if (!b.callRequest) return L.send(res, 409, { error: 'already_submitted', reference: rec.reference });
      rec.callRequest = Object.assign(L.clean(b.callRequest) || {}, { at: now });
    } else {
      if (b.data) rec.data = L.clean(b.data) || {};
      if (Number.isInteger(b.step)) rec.step = Math.max(0, Math.min(8, b.step));
      if (b.submit === true) { rec.status = 'submitted'; rec.submittedAt = now; }
    }
    rec.updatedAt = now;
    await L.writeJson(L.recPath(id), rec);
    return L.send(res, 200, { ok: true, id, reference: rec.reference, status: rec.status });
  } catch (e) {
    console.error('save failed', e);
    return L.send(res, 500, { error: 'server' });
  }
};
