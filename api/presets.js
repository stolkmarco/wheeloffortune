// /api/presets.js - CommonJS for Vercel
const fs = require('fs').promises;
const path = require('path');
const PRESETS_PATH = path.join(process.cwd(), 'presets.json');

module.exports = async (req, res) => {
  try {
    if (req.method === 'GET') {
      let data = '{}';
      try { data = await fs.readFile(PRESETS_PATH, 'utf8'); } catch(e){ /* not found */ }
      res.setHeader('Content-Type', 'application/json');
      return res.status(200).send(data);
    }
    if (req.method === 'POST') {
      let body = req.body;
      if (typeof body === 'string') {
        try { body = JSON.parse(body); } catch(e){}
      }
      if (!body || typeof body !== 'object') {
        return res.status(400).json({ error: 'Invalid presets payload' });
      }
      await fs.writeFile(PRESETS_PATH, JSON.stringify(body, null, 2), 'utf8');
      return res.status(200).json({ ok: true });
    }
    res.setHeader('Allow', 'GET, POST');
    return res.status(405).end('Method Not Allowed');
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'Server error' });
  }
};
