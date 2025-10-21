// /api/presets.js - Vercel Serverless Function
import { promises as fs } from 'fs';
import path from 'path';

const PRESETS_PATH = path.join(process.cwd(), 'presets.json');

export default async function handler(req, res) {
  try {
    if (req.method === 'GET') {
      const data = await fs.readFile(PRESETS_PATH, 'utf8').catch(async () => '{}');
      res.setHeader('Content-Type', 'application/json');
      return res.status(200).send(data);
    }
    if (req.method === 'POST') {
      const body = req.body;
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
}
