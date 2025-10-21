// /api/presets.js — Edge Config with optional teamId
// Env vars:
//   EDGE_CONFIG_ID        (required)
//   VERCEL_ACCESS_TOKEN   (required; write scope for the project/team)
//   EDGE_CONFIG_KEY       (optional; default 'tp-wheel-presets')
//   VERCEL_TEAM_ID        (optional; recommended if your token belongs to a team)

const fetchFn = global.fetch || require('node-fetch');

const EDGE_CONFIG_ID = process.env.EDGE_CONFIG_ID;
const VERCEL_ACCESS_TOKEN = process.env.VERCEL_ACCESS_TOKEN;
const EDGE_CONFIG_KEY = process.env.EDGE_CONFIG_KEY || 'tp-wheel-presets';
const VERCEL_TEAM_ID = process.env.VERCEL_TEAM_ID ? `?teamId=${encodeURIComponent(process.env.VERCEL_TEAM_ID)}` : '';

function withTeamParam(url) {
  return VERCEL_TEAM_ID ? (url + (url.includes('?') ? '&' : '?') + VERCEL_TEAM_ID.slice(1)) : url;
}

async function edgeConfigGet() {
  if (!EDGE_CONFIG_ID || !VERCEL_ACCESS_TOKEN) throw new Error('Edge Config not configured');
  let url = `https://api.vercel.com/v1/edge-config/${EDGE_CONFIG_ID}/items?key=${encodeURIComponent(EDGE_CONFIG_KEY)}`;
  url = withTeamParam(url);
  const res = await fetchFn(url, { headers: { Authorization: `Bearer ${VERCEL_ACCESS_TOKEN}` } });
  const text = await res.text();
  if (!res.ok) throw new Error(`GET ${res.status}: ${text}`);
  const data = JSON.parse(text);
  const value = Array.isArray(data.items) && data.items.length ? data.items[0].value : {};
  return value || {};
}

async function edgeConfigSet(obj) {
  if (!EDGE_CONFIG_ID || !VERCEL_ACCESS_TOKEN) throw new Error('Edge Config not configured');
  let url = `https://api.vercel.com/v1/edge-config/${EDGE_CONFIG_ID}/items`;
  url = withTeamParam(url);
  const body = { items: [{ operation: 'upsert', key: EDGE_CONFIG_KEY, value: obj }] };
  const res = await fetchFn(url, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${VERCEL_ACCESS_TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`PATCH ${res.status}: ${text}`);
  return { ok: true, store: 'edge-config' };
}

module.exports = async (req, res) => {
  try {
    if (req.method === 'GET') {
      const obj = await edgeConfigGet();
      return res.status(200).json(obj);
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
    console.error('EdgeConfig API error:', e.message);
    return res.status(500).json({ error: e.message });
  }
};
