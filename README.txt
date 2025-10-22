Option B (Supabase) patch
--------------------------------
Drop the `api/presets.js` file from this zip into your project, replacing the existing one,
then redeploy. This version reads *either* standard env names:

  SUPABASE_URL
  SUPABASE_SERVICE_ROLE_KEY
  SUPABASE_SCHEMA (optional, default 'public')
  SUPABASE_TABLE  (optional, default 'presets')

*or* your prefixed names from the screenshot:

  WHEELOF_SUPABASE_URL
  WHEELOF_SUPABASE_SERVICE_ROLE_KEY
  WHEELOF_SUPABASE_SCHEMA
  WHEELOF_SUPABASE_TABLE

Nothing else changes. After redeploy:
- Visit /api/presets -> should return {} initially.
- Save a preset in the Admin panel -> "Preset saved." and it appears in the dropdown.
- Open on another device -> the same preset is available.
