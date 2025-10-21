TP Wheel of Fortune v26 — Shared Presets
- Presets are stored in presets.json (repo root).
- API route /api/presets handles GET/POST to read/write shared presets.
- Everything else unchanged (easing spin, pointer, bezel, bulk import, 70-cap, single-line labels).

Deploy on Vercel as a static app with serverless function.


v26a: Predefined reads live form values so Save is optional before spinning.