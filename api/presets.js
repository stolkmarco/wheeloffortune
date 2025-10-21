// /api/presets.js — Shared presets via Vercel Edge Config
// Required env vars (Project → Settings → Environment Variables):
//   EDGE_CONFIG_ID           - Your Edge Config ID
//   VERCEL_ACCESS_TOKEN      - Personal Access Token (write)
// Optional:
//   EDGE_CONFIG_KEY          - Defaults to "tp-wheel-presets"

const fetchFn = global.fetch || require('node-fetch');

const EDGE_CONFIG_ID = process.env.EDGE_CONFIG_ID;
const VERCEL_ACCESS_TOKEN = process.env.VERCEL_ACCESS_TOKEN;
const EDGE_CONFIG_KEY = process.env.EDGE_CONFIG_KEY || 'tp-wheel-presets';

async function edgeConfigGet() {
  if (!EDGE_CONFIG_ID || !VERCEL_ACCESS_TOKEN) throw new Error('Edge Config not configured');
  const url = `https://api.vercel.com/v1/edge-config/${EDGE_CONFIG_ID}/items?key=${encodeURIComponent(EDGE_CONFIG_KEY)}`;
  const res = await fetchFn(url, { headers: { Authorization: `Bearer ${VERCEL_ACCESS_TOKEN}` } });
  if (!res.ok) throw new Error(`EdgeConfig GET failed: ${res.status}`);
  const data = await res.json();
  const value = Array.isArray(data.items) && data.items.length ? data.items[0].value : {};
  return value || {};
}
async function edgeConfigSet(obj) {
  if (!EDGE_CONFIG_ID || !VERCEL_ACCESS_TOKEN) throw new Error('Edge Config not configured');
  const url = `https://api.vercel.com/v1/edge-config/${EDGE_CONFIG_ID}/items`;
  const body = { items: [{ operation: 'upsert', key: EDGE_CONFIG_KEY, value: obj }] };
  const res = await fetchFn(url, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${VERCEL_ACCESS_TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const txt = await res.text().catch(() => '');
    throw new Error(`EdgeConfig SET failed: ${res.status} ${txt}`);
  }
  return { ok: true, store: 'edge-config' };
}

module.exports = async (req, res) => {
  try {
    if (req.method === 'GET') {
      try {
        const obj = await edgeConfigGet();
        return res.status(200).json(obj);
      } catch {
        return res.status(200).json({});
      }
    }
    if (req.method === 'POST') {
      let body = req.body;
      if (typeof body === 'string') { try { body = JSON.parse(body); } catch {} }
      if (!body || typeof body !== 'object') return res.status(400).json({ error: 'Invalid presets payload' });
      const r = await edgeConfigSet(body);
      return res.status(200).json(r);
    }
    res.setHeader('Allow', 'GET, POST');
    return res.status(405).end('Method Not Allowed');
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'Server error' });
  }
};
