// TP Wheel v26b - predefined live read + shared presets with fallback
const canvas = document.getElementById('wheel');
const ctx = canvas.getContext('2d');
const spinBtn = document.getElementById('spinBtn');
const resultEl = document.getElementById('result');

// Admin elements
const adminDialog = document.getElementById('adminDialog');
document.getElementById('openAdmin').onclick = () => adminDialog.showModal();
document.getElementById('closeAdmin').onclick = () => adminDialog.close();
const modeSel = document.getElementById('mode');
const sectionsInput = document.getElementById('sections');
const labelsWrap = document.getElementById('labelsWrap');
const predefRow = document.getElementById('predefRow');
const targetSel = document.getElementById('predefinedTarget');

// Presets UI
const presetNameInput = document.getElementById('presetName');
const presetSelect = document.getElementById('presetSelect');
const savePresetBtn = document.getElementById('savePreset');
const deletePresetBtn = document.getElementById('deletePreset');

// Bulk import
const bulkTextEl = document.getElementById('bulkText');
const bulkFileEl = document.getElementById('bulkFile');

document.getElementById('resetConfig').onclick = (e)=>{
  e.preventDefault();
  localStorage.removeItem('tp-wheel-config');
  loadConfig(true);
};

document.getElementById('saveConfig').onclick = (e)=>{
  const n = parseInt(sectionsInput.value || '0', 10);
  const labels = [];
  for (let i=0;i<n;i++){
    const v = document.getElementById('label_'+i).value.trim();
    labels.push(v || `Option ${i+1}`);
  }
  const cfg = { mode: modeSel.value, n, labels, target: targetSel.value || null };
  localStorage.setItem('tp-wheel-config', JSON.stringify(cfg));
  buildTargetOptions(cfg.labels);
  drawWheel();
  adminDialog.close();
};

// ---- Shared Presets API (absolute paths) with local fallback ----
async function apiGetPresets(){
  try{
    const res = await fetch('/presets.json?ts=' + Date.now(), { cache: 'no-store' });
    if (!res.ok) throw new Error('GET failed');
    return await res.json();
  } catch(e){
    // fallback to local (useful when running file:// or offline)
    try { return JSON.parse(localStorage.getItem('tp-wheel-presets')||'{}'); } catch(_){ return {}; }
  }
}
async function apiSavePresets(presets){
  try{
    const res = await fetch('/api/presets', {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify(presets)
    });
    if (!res.ok) throw new Error('POST failed');
    return await res.json();
  } catch(e){
    // fallback store (local only) so user doesn't lose work when testing locally
    localStorage.setItem('tp-wheel-presets', JSON.stringify(presets));
    return { ok: true, local: true };
  }
}

function getWorkingConfig(){
  let cfg=null;
  try{ cfg = JSON.parse(localStorage.getItem('tp-wheel-config')||'null'); }catch(e){}
  if (!cfg){
    cfg = { mode:'random', n:6, labels:['Alpha','Bravo','Charlie','Delta','Echo','Foxtrot'], target:null };
    localStorage.setItem('tp-wheel-config', JSON.stringify(cfg));
  }
  return cfg;
}

async function refreshPresetUI(){
  const presets = await apiGetPresets();
  presetSelect.innerHTML='';
  const ph = document.createElement('option'); ph.value=''; ph.textContent='— Select preset —'; presetSelect.appendChild(ph);
  Object.keys(presets).sort((a,b)=>a.localeCompare(b)).forEach(name=>{
    const opt=document.createElement('option'); opt.value=name; opt.textContent=name; presetSelect.appendChild(opt);
  });
}

function cfgClamp(cfg){
  const out = JSON.parse(JSON.stringify(cfg || {}));
  out.n = Math.min(70, Math.max(2, parseInt(out.n||out.labels?.length||6,10)));
  if (!Array.isArray(out.labels)) out.labels = [];
  out.labels = out.labels.slice(0, out.n);
  out.mode = (out.mode==='predefined') ? 'predefined' : 'random';
  if (out.target != null) out.target = String(out.target);
  return out;
}

savePresetBtn?.addEventListener('click', async ()=>{
  const name = (presetNameInput.value||'').trim();
  if (!name) return alert('Enter a preset name first.');
  const presets = await apiGetPresets();
  const cfg = cfgClamp(getWorkingConfig());
  presets[name] = cfg;
  const res = await apiSavePresets(presets);
  if (res?.ok) { alert(res.local ? 'Preset saved locally (testing mode).' : 'Preset saved to server.'); }
  await refreshPresetUI();
});

deletePresetBtn?.addEventListener('click', async ()=>{
  const sel = presetSelect.value;
  if (!sel) return alert('Select a preset to delete.');
  const presets = await apiGetPresets();
  if (!presets[sel]) return;
  delete presets[sel];
  const res = await apiSavePresets(presets);
  if (res?.ok) { alert(res.local ? 'Deleted locally (testing mode).' : 'Preset deleted.'); }
  await refreshPresetUI();
});
presetSelect?.addEventListener('change', async ()=>{
  const sel = presetSelect.value;
  if (!sel) return;
  const presets = await apiGetPresets();
  const cfg = presets[sel];
  if (!cfg) return alert('Preset not found.');
  const c = cfgClamp(cfg);
  localStorage.setItem('tp-wheel-config', JSON.stringify(c));
  modeSel.value = c.mode || 'random';
  sectionsInput.value = c.n;
  renderLabelInputs(c.labels);
  buildTargetOptions(c.labels, c.target);
  predefRow.classList.toggle('hidden', modeSel.value!=='predefined');
  drawWheel();
});

// ---- Config form dynamics ----
function loadConfig(resetIfMissing=false){
  let cfg = null;
  try { cfg = JSON.parse(localStorage.getItem('tp-wheel-config')||'null'); } catch(e){}
  if (!cfg || resetIfMissing){
    cfg = { mode:'random', n:6, labels:['Alpha','Bravo','Charlie','Delta','Echo','Foxtrot'], target:null };
    localStorage.setItem('tp-wheel-config', JSON.stringify(cfg));
  }
  modeSel.value = cfg.mode;
  sectionsInput.value = cfg.n;
  renderLabelInputs(cfg.labels);
  buildTargetOptions(cfg.labels, cfg.target);
  predefRow.classList.toggle('hidden', modeSel.value!=='predefined');
  drawWheel();
}
modeSel.addEventListener('change', ()=> predefRow.classList.toggle('hidden', modeSel.value!=='predefined'));
sectionsInput.addEventListener('change', ()=>{
  const n = Math.max(2, Math.min(70, parseInt(sectionsInput.value||'0',10)));
  sectionsInput.value = n;
  const labels = [];
  for (let i=0;i<n;i++){
    const el = document.getElementById('label_'+i);
    labels.push(el ? el.value : `Option ${i+1}`);
  }
  renderLabelInputs(labels);
  buildTargetOptions(labels);
});

function renderLabelInputs(labels){
  labelsWrap.innerHTML = '';
  labels.forEach((txt, i)=>{
    const row = document.createElement('div');
    row.className = 'label-row';
    row.innerHTML = `<div style="opacity:.7; padding:10px 0;">${i+1}</div>
      <input id="label_${i}" type="text" value="${txt.replace(/"/g,'&quot;')}" placeholder="Label ${i+1}">`;
    labelsWrap.appendChild(row);
  });
}
function buildTargetOptions(labels, selected=null){
  targetSel.innerHTML = '';
  labels.forEach((name, i)=>{
    const opt = document.createElement('option');
    opt.value = i.toString();
    opt.textContent = `${i+1}. ${name}`;
    if (selected!==null && selected!==undefined && (''+selected)===(''+i)) opt.selected = true;
    targetSel.appendChild(opt);
  });
}

// Bulk import utilities
function normalizeNames(list){
  const names = list.map(s => (s ?? '').toString().replace(/[\r\n\t]+/g,' ').replace(/\s+/g,' ').trim()).filter(s => s.length>0);
  if (names.length > 70) alert(`Imported ${names.length} items. Only the first 70 will be used.`);
  return names.slice(0,70);
}
function applyNamesToConfig(names){
  if (!names || !names.length){ alert('No names found to import.'); return; }
  const cfg = getWorkingConfig();
  cfg.n = names.length;
  cfg.labels = names;
  if (cfg.target != null && parseInt(cfg.target,10) >= cfg.n){ cfg.target = null; }
  localStorage.setItem('tp-wheel-config', JSON.stringify(cfg));
  sectionsInput.value = cfg.n;
  renderLabelInputs(cfg.labels);
  buildTargetOptions(cfg.labels, cfg.target);
  drawWheel();
}
bulkTextEl?.addEventListener('blur', ()=>{
  const lines = (bulkTextEl.value || '').replace(/\r/g,'').split(/\n+/);
  const names = normalizeNames(lines);
  if (names.length) applyNamesToConfig(names);
});
bulkFileEl?.addEventListener('change', async (e)=>{
  const file = e.target.files?.[0];
  if (!file) return;
  const name = (file.name || '').toLowerCase();
  try {
    if (name.endsWith('.xlsx') || name.endsWith('.xls')){
      const buf = await file.arrayBuffer();
      const wb = XLSX.read(buf, { type:'array' });
      const wsName = wb.SheetNames[0];
      const ws = wb.Sheets[wsName];
      const rows = XLSX.utils.sheet_to_json(ws, { header:1 });
      const firstCol = rows.map(r => {
        let v = Array.isArray(r) ? r.find(v => v!=null && String(v).trim().length>0) : null;
        return v==null ? null : String(v).replace(/[\r\n\t]+/g,' ').replace(/\s+/g,' ').trim();
      });
      const names = normalizeNames(firstCol);
      applyNamesToConfig(names);
    } else {
      const text = await file.text();
      const clean = text.replace(/\r/g,'');
      let raw = clean.split(/\n+/);
      if (clean.includes(',') || clean.includes(';')) raw = raw.flatMap(line => line.split(/[;,]+/));
      const names = normalizeNames(raw);
      applyNamesToConfig(names);
    }
  } catch(err){
    console.error('Bulk import failed:', err);
    alert('Could not parse the file. Try a simple .csv or paste one name per line.');
  } finally {
    e.target.value = '';
  }
});

// Colors & geometry
const SLICE_COLORS = ["#ff0082","#780096","#8042CF","#3047b0","#0087ff","#00AF9B","#00D769","#ff5c00","#f5d200"];
function wheelRadius(){ return Math.min(canvas.width, canvas.height)/2 - 36; }
function drawBezel(cx, cy, r){ ctx.save();
  ctx.beginPath(); ctx.lineWidth=22; ctx.strokeStyle='#e6e6e5'; ctx.arc(cx,cy,r+18,0,Math.PI*2); ctx.stroke();
  ctx.beginPath(); ctx.lineWidth=8; ctx.strokeStyle='#41414155'; ctx.arc(cx,cy,r+6,0,Math.PI*2); ctx.stroke();
  ctx.restore();
}
function drawHub(cx, cy){ ctx.beginPath(); ctx.arc(cx,cy,70,0,Math.PI*2); ctx.fillStyle='#1d1b26'; ctx.fill(); }
function drawPointer(cx, cy, r){ ctx.save(); ctx.translate(cx,cy);
  ctx.beginPath(); ctx.moveTo(0, -r - 6); ctx.lineTo(-18, -r - 30); ctx.lineTo(18, -r - 30); ctx.closePath();
  ctx.fillStyle='#d0d2d6'; ctx.strokeStyle='#000'; ctx.lineWidth=3; ctx.fill(); ctx.stroke(); ctx.restore();
}

// Single-line labels
function processLabelText(s){ return (s||'').toString().replace(/[\r\n\t]+/g,' ').replace(/\s+/g,' ').trim().replace(/ /g,'\u00A0'); }
function computeMaxTextWidth(n, r){ const angle=(Math.PI*2)/n; const usable=(r-40)*angle; return Math.max(60, Math.min(200, Math.round(usable*0.75))); }
function baseFontSize(n){ const angleDeg = 360/n; return Math.max(9, Math.min(22, Math.round(10 + 0.18*angleDeg))); }
function drawSingleLineText(ctx, text, maxWidth, minPx, startPx){
  let size = startPx;
  ctx.font = `bold ${size}px Inter, sans-serif`;
  while (ctx.measureText(text).width > maxWidth && size > minPx){
    size -= 1; ctx.font = `bold ${size}px Inter, sans-serif`;
  }
  return size;
}

// Draw wheel
function drawWheel(){
  const cfg = getWorkingConfig();
  const W=canvas.width,H=canvas.height; const cx=W/2, cy=H/2, r=wheelRadius();
  ctx.clearRect(0,0,W,H); drawBezel(cx,cy,r);
  const n=Math.max(2, cfg.n|0), labels=cfg.labels||[]; const angle=(Math.PI*2)/n;

  for (let i=0;i<n;i++){ ctx.beginPath(); ctx.moveTo(cx,cy); ctx.arc(cx,cy,r, i*angle,(i+1)*angle); ctx.closePath();
    ctx.fillStyle=SLICE_COLORS[i%SLICE_COLORS.length]; ctx.fill(); ctx.strokeStyle='#00000040'; ctx.lineWidth=2; ctx.stroke(); }

  ctx.save(); ctx.translate(cx,cy);
  ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillStyle='#fff';
  for (let i=0;i<n;i++){ const a=i*angle+angle/2; const tx=Math.cos(a)*(r-60); const ty=Math.sin(a)*(r-60);
    const raw=(labels[i]||`Option ${i+1}`); const txt=processLabelText(raw);
    const maxW=computeMaxTextWidth(n,r); const fs=drawSingleLineText(ctx, txt, maxW, 8, baseFontSize(n));
    ctx.save(); ctx.translate(tx,ty); ctx.rotate(a); ctx.font=`bold ${fs}px Inter, sans-serif`; ctx.fillText(txt,0,0); ctx.restore();
  }
  ctx.restore(); drawHub(cx,cy); drawPointer(cx,cy,r);
}

// --- Read LIVE form for predefined so Save isn't required ---
function getLiveConfigForSpin(){
  const cfg = getWorkingConfig();
  const live = { ...cfg };
  if (modeSel && modeSel.value) live.mode = modeSel.value;
  const nInput = parseInt(sectionsInput?.value || live.n || 6, 10);
  live.n = Math.max(2, Math.min(70, isNaN(nInput) ? (live.n||6) : nInput));
  const labels = [];
  for (let i=0;i<live.n;i++){
    const el = document.getElementById('label_'+i);
    labels.push(el ? (el.value.trim() || `Option ${i+1}`) : (cfg.labels[i] || `Option ${i+1}`));
  }
  live.labels = labels;
  if (targetSel && targetSel.value !== undefined && targetSel.value !== null && targetSel.value !== '') {
    live.target = targetSel.value;
  }
  return live;
}

// Rotation render + easing spin
let spinning=false, rotation=0, animStart=0, animDuration=3200, startRot=0, totalDelta=0, plannedLabelIndex=null;
function renderRotation(){
  const cfg = getWorkingConfig();
  const W=canvas.width,H=canvas.height; const cx=W/2, cy=H/2, r=wheelRadius();
  ctx.clearRect(0,0,W,H); drawBezel(cx,cy,r);
  const n=Math.max(2, cfg.n|0), labels=cfg.labels||[]; const angle=(Math.PI*2)/n;

  ctx.save(); ctx.translate(cx,cy); ctx.rotate(rotation);
  for (let i=0;i<n;i++){ ctx.beginPath(); ctx.moveTo(0,0); ctx.arc(0,0,r, i*angle,(i+1)*angle); ctx.closePath();
    ctx.fillStyle=SLICE_COLORS[i%SLICE_COLORS.length]; ctx.fill(); ctx.strokeStyle='#00000040'; ctx.lineWidth=2; ctx.stroke(); }
  ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillStyle='#fff';
  for (let i=0;i<n;i++){ const a=i*angle+angle/2; const tx=Math.cos(a)*(r-60); const ty=Math.sin(a)*(r-60);
    const raw=(labels[i]||`Option ${i+1}`); const txt=processLabelText(raw);
    const maxW=computeMaxTextWidth(n,r); const fs=drawSingleLineText(ctx, txt, maxW, 8, baseFontSize(n));
    ctx.save(); ctx.translate(tx,ty); ctx.rotate(a); ctx.font=`bold ${fs}px Inter, sans-serif`; ctx.fillText(txt,0,0); ctx.restore();
  }
  ctx.restore(); drawHub(cx,cy); drawPointer(cx,cy,r);
}
function easeOutCubic(x){ return 1 - Math.pow(1 - x, 3); }
function raf(ts){ if(!spinning) return; if(!animStart) animStart=ts; const t=Math.min(1,(ts-animStart)/animDuration);
  rotation=startRot+totalDelta*easeOutCubic(t); renderRotation(); if(t>=1){ spinning=false; finalizeLanding(plannedLabelIndex); return; } requestAnimationFrame(raf); }
function finalizeLanding(predefIndex=null){
  const cfg = getWorkingConfig(); const n=Math.max(2,cfg.n|0); const anglePer=(Math.PI*2)/n; const twoPI=Math.PI*2;
  if(predefIndex!==null){ const idx=predefIndex % n; resultEl.textContent = `Result: ${cfg.labels[idx] || `Option ${idx+1}`}`; return; }
  const current=((rotation % twoPI)+twoPI)%twoPI; const theta=((-Math.PI/2 - current) % twoPI + twoPI) % twoPI; const index=Math.floor(theta/anglePer)%n;
  resultEl.textContent = `Result: ${cfg.labels[index] || `Option ${index+1}`}`;
}
spinBtn.addEventListener('click', ()=>{
  if (spinning) return;
  const cfg = getLiveConfigForSpin();
  const n=Math.max(2,cfg.n|0); const anglePer=(Math.PI*2)/n; const twoPI=Math.PI*2;
  startRot=rotation; animStart=0; animDuration=2800+Math.random()*1200; const extraSpins=6+Math.floor(Math.random()*5); plannedLabelIndex=null;
  if (cfg.mode==='predefined' && cfg.target!=null){ const idx=parseInt(cfg.target,10)%n; plannedLabelIndex=idx;
    const targetCenter=(idx+0.5)*anglePer; const desiredAbs=(-Math.PI/2 - targetCenter);
    const currentNorm=((rotation % twoPI)+twoPI)%twoPI; const delta=((desiredAbs - currentNorm)%twoPI + twoPI)%twoPI;
    const jitter=(Math.random()*0.4-0.2)*anglePer*0.5; totalDelta = extraSpins*twoPI + delta + jitter;
  } else { totalDelta = extraSpins*twoPI + Math.random()*twoPI; }
  spinning=true; resultEl.textContent='Spinning...'; requestAnimationFrame(raf);
});

// Init
(async function init(){
  await refreshPresetUI();
  loadConfig(true);
})();
