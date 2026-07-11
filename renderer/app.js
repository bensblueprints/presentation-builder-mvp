/* Slidecraft editor — renders slides from the SAME layout engine the
   exporters use (src/core/layout.js), as absolutely-positioned DOM boxes. */
const T = window.SlidecraftThemes;
const L = window.SlidecraftLayout;
const C = window.SlidecraftCharts;

const REF_W = 960, REF_H = 540;
let deck = L.newDeck();
let current = 0;

const $ = (id) => document.getElementById(id);
const theme = () => T.getTheme(deck.theme);
const slide = () => deck.slides[current];

/* ── slide surface rendering (stage, thumbs, presenter) ─────────────────── */
function renderSurface(el, s, thm) {
  el.innerHTML = '';
  el.style.background = thm.bg;
  const W = el.clientWidth || REF_W;
  const H = el.clientHeight || REF_H;
  const k = W / REF_W; // scale factor from reference layout space
  let boxes;
  try { boxes = L.layoutSlide(s, REF_W, REF_H); } catch { return; }

  for (const b of boxes) {
    if (b.type === 'chart') { renderChart(el, b, thm, k); continue; }
    const d = document.createElement('div');
    d.className = 'sb ' + b.type;
    Object.assign(d.style, {
      left: b.x * k + 'px', top: b.y * k + 'px',
      width: b.w * k + 'px', height: b.h * k + 'px'
    });
    const fs = (b.fontSize || 16) * k;
    switch (b.type) {
      case 'accent-bar': d.style.background = thm.accent; break;
      case 'title':
        d.style.cssText += `font-family:${thm.cssHead};font-weight:700;font-size:${fs}px;color:${thm.title};line-height:1.12;text-align:${b.align || 'left'};`;
        d.textContent = b.text || 'Click to add a title →';
        if (!b.text) d.style.opacity = 0.35;
        break;
      case 'text':
        d.style.cssText += `font-family:${thm.cssBody};font-size:${fs}px;color:${b.muted ? thm.muted : thm.text};line-height:1.4;`;
        d.textContent = b.text || '';
        break;
      case 'col-title':
        d.style.cssText += `font-family:${thm.cssBody};font-weight:700;font-size:${fs}px;color:${thm.accent};letter-spacing:0.04em;text-transform:uppercase;`;
        d.textContent = b.text || '';
        break;
      case 'bullets':
        for (const item of b.items) {
          const li = document.createElement('div');
          li.className = 'li';
          li.style.cssText = `font-family:${thm.cssBody};font-size:${fs}px;color:${thm.text};line-height:1.35;margin-bottom:${fs * 0.55}px;`;
          const dot = document.createElement('span');
          dot.className = 'dot';
          dot.style.cssText = `width:${fs * 0.3}px;height:${fs * 0.3}px;background:${thm.accent};`;
          li.appendChild(dot);
          li.append(item);
          d.appendChild(li);
        }
        break;
      case 'agenda-item': {
        d.style.cssText += `display:flex;align-items:center;gap:${fs}px;border-bottom:1px solid ${thm.panel};`;
        const num = document.createElement('span');
        num.style.cssText = `font-family:${thm.cssHead};font-weight:700;font-size:${fs * 1.15}px;color:${thm.accent};`;
        num.textContent = String(b.index).padStart(2, '0');
        const tx = document.createElement('span');
        tx.style.cssText = `font-family:${thm.cssBody};font-size:${fs}px;color:${thm.text};`;
        tx.textContent = b.text;
        d.append(num, tx);
        break;
      }
      case 'quote-mark':
        d.style.cssText += `font-family:Georgia,serif;font-weight:700;font-size:${b.h * k * 1.9}px;color:${thm.accent};line-height:0.8;`;
        d.textContent = '“';
        break;
      case 'quote':
        d.style.cssText += `font-family:${thm.cssHead};font-style:italic;font-size:${fs}px;color:${thm.title};line-height:1.3;`;
        d.textContent = b.text || 'Add a quote →';
        if (!b.text) d.style.opacity = 0.35;
        break;
      case 'attribution':
        d.style.cssText += `font-family:${thm.cssBody};font-size:${fs}px;color:${thm.accent};`;
        d.textContent = b.text ? '— ' + b.text : '';
        break;
      case 'image':
        if (b.src) {
          d.style.cssText += `background-image:url(${b.src});background-size:cover;background-position:center;border-radius:${8 * k}px;`;
        } else {
          d.style.cssText += `background:${thm.panel};border:1px dashed ${thm.muted};border-radius:${8 * k}px;display:flex;align-items:center;justify-content:center;color:${thm.muted};font-size:${13 * k}px;`;
          d.textContent = 'Choose image in the inspector →';
        }
        break;
      default: break;
    }
    el.appendChild(d);
  }
}

function renderChart(el, b, thm, k) {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('class', 'chart');
  svg.style.cssText = `left:${b.x * k}px;top:${b.y * k}px;width:${b.w * k}px;height:${b.h * k}px;`;
  svg.setAttribute('viewBox', `${b.x} ${b.y} ${b.w} ${b.h}`);
  const g = C.computeChart(b.chart || {}, b);
  const palette = [thm.accent, '#34d399', '#f59e0b', '#f472b6', '#60a5fa', '#a78bfa'];
  const mk = (tag, attrs, text) => {
    const n = document.createElementNS('http://www.w3.org/2000/svg', tag);
    for (const [key, v] of Object.entries(attrs)) n.setAttribute(key, v);
    if (text != null) n.textContent = text;
    return n;
  };
  if (g.type === 'bar') {
    svg.appendChild(mk('line', { x1: b.x, y1: g.axis.y, x2: b.x + b.w, y2: g.axis.y, stroke: thm.muted, 'stroke-width': 1 }));
    for (const bar of g.bars) {
      svg.appendChild(mk('rect', { x: bar.x, y: bar.y, width: bar.w, height: Math.max(bar.h, 0.5), fill: thm.accent, rx: 3 }));
      svg.appendChild(mk('text', { x: bar.x + bar.w / 2, y: g.axis.y + 16, fill: thm.muted, 'font-size': 12, 'text-anchor': 'middle', 'font-family': 'Arial' }, bar.label));
      svg.appendChild(mk('text', { x: bar.x + bar.w / 2, y: bar.y - 5, fill: thm.text, 'font-size': 12, 'text-anchor': 'middle', 'font-family': 'Arial' }, bar.value));
    }
  } else if (g.type === 'pie') {
    g.slices.forEach((s, i) => {
      const x1 = g.cx + g.r * Math.cos(s.startAngle), y1 = g.cy + g.r * Math.sin(s.startAngle);
      const x2 = g.cx + g.r * Math.cos(s.endAngle), y2 = g.cy + g.r * Math.sin(s.endAngle);
      const large = s.endAngle - s.startAngle > Math.PI ? 1 : 0;
      svg.appendChild(mk('path', {
        d: `M ${g.cx} ${g.cy} L ${x1} ${y1} A ${g.r} ${g.r} 0 ${large} 1 ${x2} ${y2} Z`,
        fill: palette[i % palette.length]
      }));
    });
  } else if (g.type === 'line' && g.points.length) {
    const pts = g.points.map((p) => `${p.x},${p.y}`).join(' ');
    svg.appendChild(mk('polyline', { points: pts, fill: 'none', stroke: thm.accent, 'stroke-width': 3 }));
    for (const p of g.points) {
      svg.appendChild(mk('circle', { cx: p.x, cy: p.y, r: 4.5, fill: thm.accent }));
      svg.appendChild(mk('text', { x: p.x, y: b.y + b.h - 4, fill: thm.muted, 'font-size': 11, 'text-anchor': 'middle', 'font-family': 'Arial' }, p.label));
    }
  }
  el.appendChild(svg);
}

/* ── thumbs / stage / inspector ─────────────────────────────────────────── */
function renderThumbs() {
  const wrap = $('thumbs');
  wrap.innerHTML = '';
  deck.slides.forEach((s, i) => {
    const t = document.createElement('div');
    t.className = 'thumb' + (i === current ? ' active' : '');
    const mini = document.createElement('div');
    mini.className = 'mini slide-surface';
    const tw = 162, th = 91;
    mini.style.width = REF_W + 'px'; mini.style.height = REF_H + 'px';
    mini.style.transform = `scale(${tw / REF_W})`;
    t.appendChild(mini);
    const n = document.createElement('span');
    n.className = 'n'; n.textContent = i + 1;
    t.appendChild(n);
    t.onclick = () => { current = i; renderAll(); };
    wrap.appendChild(t);
    requestAnimationFrame(() => renderSurface(mini, s, theme()));
  });
}

function renderStage() {
  let surf = $('stage').querySelector('.slide-surface');
  if (!surf) {
    surf = document.createElement('div');
    surf.className = 'slide-surface';
    $('stage').appendChild(surf);
  }
  renderSurface(surf, slide(), theme());
  $('notes').value = slide().notes || '';
}

function field(labelText, value, onInput, { textarea, rows, placeholder } = {}) {
  const wrap = document.createDocumentFragment();
  const l = document.createElement('label');
  l.textContent = labelText;
  wrap.appendChild(l);
  const inp = document.createElement(textarea ? 'textarea' : 'input');
  if (!textarea) inp.type = 'text';
  else inp.rows = rows || 4;
  inp.value = value || '';
  if (placeholder) inp.placeholder = placeholder;
  inp.addEventListener('input', () => { onInput(inp.value); renderStage(); renderThumbsSoon(); });
  wrap.appendChild(inp);
  return wrap;
}

let thumbTimer = null;
function renderThumbsSoon() {
  clearTimeout(thumbTimer);
  thumbTimer = setTimeout(renderThumbs, 400);
}

function renderInspector() {
  const s = slide();
  // layouts
  const lg = $('layouts');
  lg.innerHTML = '';
  for (const ly of L.LAYOUTS) {
    const b = document.createElement('button');
    b.textContent = ly.label;
    if (s.layout === ly.id) b.classList.add('active');
    b.onclick = () => { s.layout = ly.id; renderAll(); };
    lg.appendChild(b);
  }
  // fields
  const f = $('fields');
  f.innerHTML = '';
  const bulletsField = (label, key) => f.appendChild(field(label, (s[key] || []).join('\n'),
    (v) => { s[key] = v.split('\n'); }, { textarea: true, rows: 6, placeholder: 'One bullet per line' }));

  if (s.layout !== 'quote') f.appendChild(field('Title', s.title, (v) => { s.title = v; }));
  switch (s.layout) {
    case 'title':
      f.appendChild(field('Subtitle', s.subtitle, (v) => { s.subtitle = v; }));
      break;
    case 'bullets':
    case 'agenda':
      bulletsField(s.layout === 'agenda' ? 'Agenda items (one per line)' : 'Bullets (one per line)', 'bullets');
      break;
    case 'two-column': {
      const r = document.createElement('div'); r.className = 'row2';
      f.appendChild(r);
      // build the two header inputs inside the row
      const mk = (label, key) => {
        const cell = document.createElement('div');
        cell.appendChild(field(label, s[key], (v) => { s[key] = v; }));
        r.appendChild(cell);
      };
      mk('Left heading', 'col1Title'); mk('Right heading', 'col2Title');
      bulletsField('Left bullets', 'bullets');
      bulletsField('Right bullets', 'bullets2');
      break;
    }
    case 'image-text': {
      const btn = document.createElement('button');
      btn.className = 'ghost'; btn.style.marginTop = '10px'; btn.style.width = '100%';
      btn.textContent = s.image ? 'Replace image…' : 'Choose image…';
      btn.onclick = async () => {
        const img = await window.slidecraft.pickImage();
        if (img) { s.image = img; renderAll(); }
      };
      f.appendChild(btn);
      const sideSel = document.createElement('select');
      sideSel.innerHTML = '<option value="left">Image on the left</option><option value="right">Image on the right</option>';
      sideSel.value = s.imageSide || 'left';
      sideSel.style.marginTop = '8px';
      sideSel.onchange = () => { s.imageSide = sideSel.value; renderAll(); };
      f.appendChild(sideSel);
      bulletsField('Text bullets', 'bullets');
      break;
    }
    case 'chart': {
      const c = s.chart || (s.chart = { type: 'bar', labels: [], values: [] });
      const sel = document.createElement('select');
      sel.innerHTML = '<option value="bar">Bar chart</option><option value="line">Line chart</option><option value="pie">Pie chart</option>';
      sel.value = c.type;
      sel.onchange = () => { c.type = sel.value; renderStage(); renderThumbsSoon(); };
      const l0 = document.createElement('label'); l0.textContent = 'Chart type';
      f.appendChild(l0); f.appendChild(sel);
      f.appendChild(field('Labels (comma-separated)', (c.labels || []).join(', '),
        (v) => { c.labels = v.split(',').map((x) => x.trim()); }));
      f.appendChild(field('Values (comma-separated numbers)', (c.values || []).join(', '),
        (v) => { c.values = v.split(',').map((x) => parseFloat(x)).filter((n) => Number.isFinite(n)); }));
      break;
    }
    case 'quote':
      f.appendChild(field('Quote', s.quote, (v) => { s.quote = v; }, { textarea: true, rows: 4 }));
      f.appendChild(field('Attribution', s.attribution, (v) => { s.attribution = v; }));
      break;
    default: break;
  }
}

function renderAll() {
  renderThumbs();
  renderStage();
  renderInspector();
}

/* ── top bar wiring ─────────────────────────────────────────────────────── */
for (const t of T.THEMES) {
  const o = document.createElement('option');
  o.value = t.id; o.textContent = 'Theme: ' + t.label;
  $('theme-picker').appendChild(o);
}
$('theme-picker').onchange = () => { deck.theme = $('theme-picker').value; renderAll(); };
$('deck-title').addEventListener('input', () => { deck.title = $('deck-title').value; });
$('notes').addEventListener('input', () => { slide().notes = $('notes').value; });

$('add-slide').onclick = () => {
  deck.slides.splice(current + 1, 0, L.newSlide('bullets'));
  current++;
  renderAll();
};
$('delete-slide').onclick = () => {
  if (deck.slides.length <= 1) return;
  deck.slides.splice(current, 1);
  current = Math.max(0, current - 1);
  renderAll();
};

$('save-deck').onclick = () => window.slidecraft.saveDeck(deck);
$('open-deck').onclick = async () => {
  const d = await window.slidecraft.openDeck();
  if (d && Array.isArray(d.slides)) {
    deck = d; current = 0;
    $('deck-title').value = deck.title || 'Untitled deck';
    $('theme-picker').value = deck.theme || 'midnight';
    renderAll();
  }
};
$('export-pptx').onclick = async () => {
  const p = await window.slidecraft.exportPptx(deck);
  if (p) $('export-pptx').textContent = '✔ Exported';
  setTimeout(() => { $('export-pptx').textContent = 'Export PPTX'; }, 1800);
};
$('export-pdf').onclick = async () => {
  const p = await window.slidecraft.exportPdf(deck);
  if (p) $('export-pdf').textContent = '✔ PDF';
  setTimeout(() => { $('export-pdf').textContent = 'PDF'; }, 1800);
};

/* ── presenter mode ─────────────────────────────────────────────────────── */
let pIndex = 0, pStart = 0, pTick = null;
function presentAt(i) {
  pIndex = Math.max(0, Math.min(i, deck.slides.length - 1));
  const main = $('p-main');
  let surf = main.querySelector('.slide-surface');
  if (!surf) { surf = document.createElement('div'); surf.className = 'slide-surface'; main.appendChild(surf); }
  renderSurface(surf, deck.slides[pIndex], theme());
  const nextWrap = $('p-next');
  let nsurf = nextWrap.querySelector('.slide-surface');
  if (!nsurf) { nsurf = document.createElement('div'); nsurf.className = 'slide-surface'; nextWrap.appendChild(nsurf); }
  if (pIndex + 1 < deck.slides.length) renderSurface(nsurf, deck.slides[pIndex + 1], theme());
  else { nsurf.innerHTML = ''; nsurf.style.background = '#0a0a0c'; }
  $('p-notes').textContent = deck.slides[pIndex].notes || '(no notes)';
}
$('present').onclick = () => {
  $('presenter').classList.remove('hidden');
  pStart = Date.now();
  clearInterval(pTick);
  pTick = setInterval(() => {
    const sec = Math.floor((Date.now() - pStart) / 1000);
    $('p-timer').textContent = `${String(Math.floor(sec / 60)).padStart(2, '0')}:${String(sec % 60).padStart(2, '0')}`;
  }, 500);
  presentAt(current);
};
document.addEventListener('keydown', (e) => {
  if ($('presenter').classList.contains('hidden')) return;
  if (e.key === 'Escape') { $('presenter').classList.add('hidden'); clearInterval(pTick); }
  else if (e.key === 'ArrowRight' || e.key === ' ' || e.key === 'PageDown') presentAt(pIndex + 1);
  else if (e.key === 'ArrowLeft' || e.key === 'PageUp') presentAt(pIndex - 1);
});

/* boot with a small sample so the app never opens empty */
deck = L.newDeck();
deck.slides.push(
  { ...L.newSlide('agenda'), title: 'Agenda', bullets: ['The problem', 'What we built', 'The numbers', 'Next steps'] },
  { ...L.newSlide('bullets'), title: 'Why auto-layout?', bullets: ['Content-aware layouts keep slides clean', 'Add a bullet — everything reflows', 'Swap themes without breaking anything'] },
  { ...L.newSlide('chart'), title: 'Subscriptions replaced', chart: { type: 'bar', labels: ['Q1', 'Q2', 'Q3', 'Q4'], values: [4, 9, 14, 22] } }
);
renderAll();
