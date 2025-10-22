// /api/presets.js — Supabase (REST) with flexible env var names
// Supported envs (either standard or prefixed with WHEELOF_):
//   SUPABASE_URL                      | WHEELOF_SUPABASE_URL
//   SUPABASE_SERVICE_ROLE_KEY         | WHEELOF_SUPABASE_SERVICE_ROLE_KEY
//   SUPABASE_SCHEMA (optional)        | WHEELOF_SUPABASE_SCHEMA
//   SUPABASE_TABLE  (optional)        | WHEELOF_SUPABASE_TABLE
//
// Table (run once in Supabase SQL editor):
//   create table if not exists public.presets (
//     name text primary key,
//     data jsonb not null,
//     updated_at timestamptz not null default now()
//   );

const fetchFn = global.fetch || require('node-fetch');

function env(...keys){ for(const k of keys){ if(process.env[k]) return process.env[k]; } return undefined; }

const SB_URL  = env('SUPABASE_URL','WHEELOF_SUPABASE_URL');
const SB_KEY  = env('SUPABASE_SERVICE_ROLE_KEY','WHEELOF_SUPABASE_SERVICE_ROLE_KEY');
const SCHEMA  = env('SUPABASE_SCHEMA','WHEELOF_SUPABASE_SCHEMA') || 'public';
const TABLE   = env('SUPABASE_TABLE','WHEELOF_SUPABASE_TABLE') || 'presets';

if (!SB_URL || !SB_KEY) {
  console.warn("Supabase env missing. Set SUPABASE_URL & SUPABASE_SERVICE_ROLE_KEY (or WHEELOF_ equivalents).");
}

function tableUrl() { return `${SB_URL}/rest/v1/${TABLE}`; }

async function sbGetAll() {
  const url = `${tableUrl()}?select=name,data,updated_at&order=name.asc`;
  const res = await (fetchFn)(url, {
    headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}`, Accept: 'application/json' }
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`Supabase GET ${res.status}: ${text}`);
  const rows = JSON.parse(text);
  const out = {};
  for (const r of rows) out[r.name] = r.data;
  return out;
}

async function sbUpsertAll(obj) {
  const rows = Object.entries(obj).map(([name, data]) => ({
    name, data, updated_at: new Date().toISOString()
  }));
  const url = `${tableUrl()}?on_conflict=name`;
  const res = await (fetchFn)(url, {
    method: 'POST',
    headers: {
      apikey: SB_KEY,
      Authorization: `Bearer ${SB_KEY}`,
      'Content-Type': 'application/json',
      Prefer: 'resolution=merge-duplicates'
    },
    body: JSON.stringify(rows)
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`Supabase UPSERT ${res.status}: ${text}`);
  return { ok: true, store: 'supabase' };
}

module.exports = async (req, res) => {
  try {
    if (!SB_URL || !SB_KEY) return res.status(500).json({ error: 'Supabase not configured on server' });

    if (req.method === 'GET') {
      const data = await sbGetAll();
      return res.status(200).json(data);
    }

    if (req.method === 'POST') {
      let body = req.body;
      if (typeof body === 'string') { try { body = JSON.parse(body); } catch {} }
      if (!body || typeof body !== 'object') return res.status(400).json({ error: 'Invalid presets payload' });

      const r = await sbUpsertAll(body);
      return res.status(200).json(r);
    }

    res.setHeader('Allow', 'GET, POST');
    return res.status(405).end('Method Not Allowed');
  } catch (e) {
    console.error('Supabase API error:', e);
    return res.status(500).json({ error: e.message || 'Server error' });
  }
};
