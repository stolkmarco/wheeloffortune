TP Wheel of Fortune v26b
Fixes:
- Predefined reads LIVE admin values on spin (no need to click Save first).
- Shared presets use absolute /api paths; when offline or local file://, saves fall back to local cache.

Note: On Vercel, writing to the repo filesystem may not persist. For durable shared presets,
use a write-capable store (KV/DB). This build keeps your requested folder-based JSON for simplicity.
