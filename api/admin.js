// POST /api/admin  { action: 'list' | 'get' | 'file', id?, kind? }
// Team-only. Needs the header  Authorization: Bearer <ADMIN_KEY>  (set ADMIN_KEY in Vercel, 12+ characters).
const L = require('./_lib');

module.exports = async (req, res) => {
  if (req.method !== 'POST') return L.send(res, 405, { error: 'method' });
  if (!process.env.ADMIN_KEY) return L.send(res, 503, { error: 'admin_not_configured' });
  if (!L.isAdmin(req)) return L.send(res, 401, { error: 'unauthorised' });
  if (!L.configured()) return L.send(res, 503, { error: 'storage_not_configured' });
  try {
    const b = L.body(req);
    if (b.action === 'list') {
      const out = []; let cursor;
      do {
        const r = await L.list({ prefix: 'registrations/', cursor, limit: 200 });
        for (const bl of r.blobs) {
          const rec = await L.readJson(bl.pathname).catch(() => null);
          if (!rec) continue;
          const d = rec.data || {};
          out.push({ id: rec.id, reference: rec.reference, status: rec.status, step: rec.step, createdAt: rec.createdAt, updatedAt: rec.updatedAt,
            name: d.name || '', email: d.email || '', phone: ((d.dial || '') + ' ' + (d.phone || '')).trim(), company: d.company || '',
            files: (rec.files || []).length, call: rec.callRequest ? true : false });
        }
        cursor = r.hasMore ? r.cursor : undefined;
      } while (cursor && out.length < 1000);
      out.sort((a, c) => String(c.updatedAt).localeCompare(String(a.updatedAt)));
      return L.send(res, 200, { ok: true, items: out });
    }
    if (!L.ID_RE.test(String(b.id || ''))) return L.send(res, 400, { error: 'bad_id' });
    const rec = await L.readJson(L.recPath(b.id));
    if (!rec) return L.send(res, 404, { error: 'not_found' });
    if (b.action === 'get') return L.send(res, 200, { ok: true, record: rec });
    if (b.action === 'file') {
      const f = (rec.files || []).find((x) => x.kind === b.kind);
      if (!f) return L.send(res, 404, { error: 'not_found' });
      const r = await L.get(f.path, { access: 'private', useCache: false });
      if (!r || !r.stream) return L.send(res, 404, { error: 'not_found' });
      const buf = Buffer.from(await new Response(r.stream).arrayBuffer());
      res.statusCode = 200;
      res.setHeader('Content-Type', (r.blob && r.blob.contentType) || 'application/octet-stream');
      res.setHeader('Content-Disposition', 'attachment; filename="' + f.kind + '-' + f.name + '"');
      res.setHeader('Cache-Control', 'no-store');
      return res.end(buf);
    }
    return L.send(res, 400, { error: 'bad_action' });
  } catch (e) {
    console.error('admin failed', e);
    return L.send(res, 500, { error: 'server' });
  }
};
