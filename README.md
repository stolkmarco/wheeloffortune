TP Wheel of Fortune — v3b (Edge Config + predefined fixes)
- Presets saved via /api/presets to Vercel Edge Config (shared across devices).
- Admin controls persist instantly (mode/target/labels), no need to press Save to affect a spin.
- Spin logic only aims when Predefined + valid target, otherwise random.
Vercel vars needed:
  EDGE_CONFIG_ID, VERCEL_ACCESS_TOKEN, (optional) EDGE_CONFIG_KEY=tp-wheel-presets
