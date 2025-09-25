// TP Wheel v18 (easing landing)
const brand = window.__TP_BRAND__ || {};
const canvas = document.getElementById('wheel');
const ctx = canvas.getContext('2d');
const spinBtn = document.getElementById('spinBtn');
const resultEl = document.getElementById('result');

// Admin
const adminDialog = document.getElementById('adminDialog');
document.getElementById('openAdmin').onclick = () => adminDialog.showModal();
document.getElementById('closeAdmin').onclick = () => adminDialog.close();
const modeSel = document.getElementById('mode');
const sectionsInput = document.getElementById('sections');
const labelsWrap = document.getElementById('labelsWrap');
const predefRow = document.getElementById('predefRow');
const targetSel = document.getElementById('predefinedTarget');
document.getElementById('resetConfig').onclick = (e)=>{ e.preventDefault(); localStorage.removeItem('tp-wheel-config'); loadConfig(true); };
document.getElementById('saveConfig').onclick = (e)=>{
  const n = parseInt(sectionsInput.value || '0', 10);
  const labels = [];
  for (let i=0;i<n;i++){ const v = document.getElementById('label_'+i).value.trim(); labels.push(v || `Option ${i+1}`); }
  const cfg = { mode: modeSel.value, n, labels, target: targetSel.value || null };
  localStorage.setItem('tp-wheel-config', JSON.stringify(cfg));
  buildTargetOptions(cfg.labels); drawWheel(); adminDialog.close();
};

function loadConfig(resetIfMissing=false){
  let cfg = null;
  try { cfg = JSON.parse(localStorage.getItem('tp-wheel-config')||'null'); } catch(e){ console.error("⚠️ parse config", e); }
  if (!cfg || resetIfMissing){ cfg = { mode:'random', n:6, labels:['Alpha','Bravo','Charlie','Delta','Echo','Foxtrot'], target:null }; localStorage.setItem('tp-wheel-config', JSON.stringify(cfg)); }
  modeSel.value = cfg.mode; sectionsInput.value = cfg.n;
  renderLabelInputs(cfg.labels); buildTargetOptions(cfg.labels, cfg.target);
  predefRow.classList.toggle('hidden', modeSel.value!=='predefined');
  drawWheel();
}
modeSel.addEventListener('change', ()=> predefRow.classList.toggle('hidden', modeSel.value!=='predefined'));
sectionsInput.addEventListener('change', ()=>{
  const n = Math.max(2, Math.min(24, parseInt(sectionsInput.value||'0',10))); sectionsInput.value = n;
  const labels=[]; for(let i=0;i<n;i++){ const el=document.getElementById('label_'+i); labels.push(el?el.value:`Option ${i+1}`); }
  renderLabelInputs(labels); buildTargetOptions(labels);
});
function renderLabelInputs(labels){
  labelsWrap.innerHTML = ''; labels.forEach((txt,i)=>{ const row=document.createElement('div'); row.className='label-row';
    row.innerHTML = `<div style="opacity:.7; padding:10px 0;">${i+1}</div><input id="label_${i}" type="text" value="${txt.replace(/"/g,'&quot;')}" placeholder="Label ${i+1}">`;
    labelsWrap.appendChild(row);
  });
}
function buildTargetOptions(labels, selected=null){
  targetSel.innerHTML=''; labels.forEach((name,i)=>{ const opt=document.createElement('option'); opt.value=i.toString(); opt.textContent=`${i+1}. ${name}`;
    if (selected!==null && selected!==undefined && (''+selected)===(''+i)) opt.selected=true; targetSel.appendChild(opt);
  });
}

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
  ctx.fillStyle = '#d0d2d6'; ctx.strokeStyle='#000'; ctx.lineWidth=3; ctx.fill(); ctx.stroke(); ctx.restore();
}

function drawWheel(){
  const cfg = JSON.parse(localStorage.getItem('tp-wheel-config'));
  const W=canvas.width,H=canvas.height; const cx=W/2, cy=H/2, r=wheelRadius();
  ctx.clearRect(0,0,W,H); drawBezel(cx,cy,r);
  const n=Math.max(2, cfg.n|0), labels=cfg.labels||[]; const angle=(Math.PI*2)/n;
  for (let i=0;i<n;i++){ ctx.beginPath(); ctx.moveTo(cx,cy); ctx.arc(cx,cy,r, i*angle,(i+1)*angle); ctx.closePath();
    ctx.fillStyle=SLICE_COLORS[i%SLICE_COLORS.length]; ctx.fill(); ctx.strokeStyle='#00000040'; ctx.lineWidth=2; ctx.stroke(); }
  ctx.save(); ctx.translate(cx,cy); ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillStyle='#fff'; ctx.font='bold 16px Inter, sans-serif';
  for(let i=0;i<n;i++){ const a=i*angle+angle/2; const tx=Math.cos(a)*(r-60); const ty=Math.sin(a)*(r-60); const txt=(labels[i]||`Option ${i+1}`).slice(0,26);
    ctx.save(); ctx.translate(tx,ty); ctx.rotate(a); wrapText(ctx, txt, 0,0,120,18); ctx.restore(); }
  ctx.restore(); drawHub(cx,cy); drawPointer(cx,cy,r);
}
function renderRotation(){
  const cfg = JSON.parse(localStorage.getItem('tp-wheel-config'));
  const W=canvas.width,H=canvas.height; const cx=W/2, cy=H/2, r=wheelRadius();
  ctx.clearRect(0,0,W,H); drawBezel(cx,cy,r);
  const n=Math.max(2, cfg.n|0), labels=cfg.labels||[]; const angle=(Math.PI*2)/n;
  ctx.save(); ctx.translate(cx,cy); ctx.rotate(rotation);
  for (let i=0;i<n;i++){ ctx.beginPath(); ctx.moveTo(0,0); ctx.arc(0,0,r, i*angle,(i+1)*angle); ctx.closePath();
    ctx.fillStyle=SLICE_COLORS[i%SLICE_COLORS.length]; ctx.fill(); ctx.strokeStyle='#00000040'; ctx.lineWidth=2; ctx.stroke(); }
  ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillStyle='#fff'; ctx.font='bold 16px Inter, sans-serif';
  for(let i=0;i<n;i++){ const a=i*angle+angle/2; const tx=Math.cos(a)*(r-60); const ty=Math.sin(a)*(r-60); const txt=(labels[i]||`Option ${i+1}`).slice(0,26);
    ctx.save(); ctx.translate(tx,ty); ctx.rotate(a); wrapText(ctx, txt, 0,0,120,18); ctx.restore(); }
  ctx.restore(); drawHub(cx,cy); drawPointer(cx,cy,r);
}

function wrapText(ctx, text, x, y, maxWidth, lineHeight){
  const words=text.split(' '); let line=''; let yy=y;
  for(let n=0;n<words.length;n++){ const test=line+words[n]+' '; if(ctx.measureText(test).width>maxWidth && n>0){ ctx.fillText(line.trim(),x,yy); line=words[n]+' '; yy+=lineHeight; } else line=test; }
  ctx.fillText(line.trim(), x, yy);
}

// Easing-based spin
let spinning=false, rotation=0, animStart=0, animDuration=3200, startRot=0, totalDelta=0, plannedLabelIndex=null;
function easeOutCubic(x){ return 1 - Math.pow(1 - x, 3); }
function raf(ts){ if(!spinning) return; if(!animStart) animStart=ts; const t=Math.min(1,(ts-animStart)/animDuration); rotation=startRot+totalDelta*easeOutCubic(t); renderRotation();
  if(t>=1){ spinning=false; finalizeLanding(plannedLabelIndex); return; } requestAnimationFrame(raf); }
function finalizeLanding(predefIndex=null){
  const cfg=JSON.parse(localStorage.getItem('tp-wheel-config')); const n=Math.max(2,cfg.n|0); const anglePer=(Math.PI*2)/n; const twoPI=Math.PI*2;
  if(predefIndex!==null){ const idx=predefIndex % n; resultEl.textContent=`Result: ${cfg.labels[idx] || `Option ${idx+1}`}`; return; }
  const current=((rotation % twoPI)+twoPI)%twoPI; const theta=(( -Math.PI/2 - current) % twoPI + twoPI) % twoPI; const index=Math.floor(theta/anglePer)%n;
  resultEl.textContent=`Result: ${cfg.labels[index] || `Option ${index+1}`}`;
}
spinBtn.addEventListener('click', ()=>{ if(spinning) return; const cfg=JSON.parse(localStorage.getItem('tp-wheel-config'));
  const n=Math.max(2,cfg.n|0); const anglePer=(Math.PI*2)/n; const twoPI=Math.PI*2;
  startRot=rotation; animStart=0; animDuration=2800+Math.random()*1200; const extraSpins=6+Math.floor(Math.random()*5); plannedLabelIndex=null;
  if(cfg.mode==='predefined' && cfg.target!=null){ const idx=parseInt(cfg.target,10)%n; plannedLabelIndex=idx; const targetCenter=(idx+0.5)*anglePer;
    const desiredAbs=(-Math.PI/2 - targetCenter); const currentNorm=((rotation % twoPI)+twoPI)%twoPI; const delta=((desiredAbs - currentNorm)%twoPI + twoPI)%twoPI;
    const jitter=(Math.random()*0.4-0.2)*anglePer*0.5; totalDelta = extraSpins*twoPI + delta + jitter;
  } else { totalDelta = extraSpins*twoPI + Math.random()*twoPI; }
  spinning=true; resultEl.textContent='Spinning...'; requestAnimationFrame(raf);
});

// init
loadConfig(true);
