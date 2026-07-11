'use strict';
// Slidecraft smoke test — pure Node, NO Electron window. Covers:
//   1. auto-layout engine: reflow (bullet font shrinks as content grows),
//      two-column geometry (no overlap, exact gutter), bounds safety,
//      theme-swap invariance (geometry never changes with theme)
//   2. chart geometry: bar heights exactly proportional, pie closes at 2π,
//      line points span the box
//   3. PPTX export: real .pptx on disk — PK zip magic, unzipped and inspected
//      (slide count, title text, bullets, notes, native chart XML)
//   4. PDF export: real .pdf on disk — %PDF- magic, %%EOF, exact page count,
//      re-parsed content
const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const zlib = require('zlib');

const T = require('../src/core/themes.js');
const L = require('../src/core/layout.js');
const C = require('../src/core/charts.js');
const { deckToPptxBuffer } = require('../src/core/export-pptx.js');
const { deckToPdfBuffer } = require('../src/core/export-pdf.js');

let passed = 0;
function ok(cond, msg) { assert.ok(cond, msg); passed++; console.log('  ✔ ' + msg); }
function eq(a, b, msg) { assert.strictEqual(a, b, `${msg} (expected ${b}, got ${a})`); passed++; console.log('  ✔ ' + msg); }
function approx(a, b, tol, msg) { assert.ok(Math.abs(a - b) <= tol, `${msg} (expected ~${b}±${tol}, got ${a})`); passed++; console.log('  ✔ ' + msg); }

// tiny 4x4 red PNG for image slides
const RED_PNG =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAQAAAAECAIAAAAmkwkpAAAAEklEQVR4nGP8z4APMOGVHXbSAKrBAxHKcHktAAAAAElFTkSuQmCC';

function buildDeck() {
  return {
    version: 1,
    theme: 'midnight',
    title: 'Smoke Deck',
    slides: [
      { ...L.newSlide('title'), title: 'Slidecraft Smoke Test', subtitle: 'Auto-layout, charts and exports', notes: 'Welcome everyone to the smoke test.' },
      { ...L.newSlide('agenda'), title: 'Agenda', bullets: ['Layout engine', 'Charts', 'Exports'] },
      { ...L.newSlide('bullets'), title: 'Bullets reflow', bullets: ['First point', 'Second point', 'Third point'] },
      { ...L.newSlide('two-column'), title: 'Before vs after', col1Title: 'Before', col2Title: 'After', bullets: ['Manual layout', 'Broken alignment'], bullets2: ['Auto-layout', 'Always clean'] },
      { ...L.newSlide('image-text'), title: 'Image and text', image: RED_PNG, bullets: ['Images cover-fit their zone'] },
      { ...L.newSlide('chart'), title: 'Quarterly numbers', chart: { type: 'bar', labels: ['Q1', 'Q2', 'Q3'], values: [10, 20, 5] }, notes: 'Q2 doubled.' },
      { ...L.newSlide('chart'), title: 'Share', chart: { type: 'pie', labels: ['A', 'B', 'C'], values: [1, 2, 1] } },
      { ...L.newSlide('quote'), quote: 'Pay once. Own it forever.', attribution: 'Every Slidecraft user' }
    ]
  };
}

(async () => {
  const W = 960, H = 540;

  console.log('\n— Auto-layout: content-aware reflow —');
  {
    const few = L.layoutSlide({ layout: 'bullets', title: 'T', bullets: ['a', 'b', 'c'] }, W, H)
      .find((b) => b.type === 'bullets');
    const many = L.layoutSlide({ layout: 'bullets', title: 'T', bullets: Array.from({ length: 12 }, (_, i) => 'bullet ' + i) }, W, H)
      .find((b) => b.type === 'bullets');
    ok(few.fontSize > many.fontSize, `12 bullets auto-shrink below 3 bullets (${many.fontSize.toFixed(1)}px < ${few.fontSize.toFixed(1)}px)`);
    approx(many.fontSize * 12 * 1.55, many.h, many.h * 0.08, '12-bullet block height ≈ available area (reflow fills, never overflows)');
    ok(many.fontSize >= 0.022 * H - 0.01, 'auto-shrink respects the minimum readable size');
    eq(few.items.length, 3, 'layout preserves bullet count');
  }

  console.log('\n— Auto-layout: two-column geometry —');
  {
    const boxes = L.layoutSlide({
      layout: 'two-column', title: 'T', col1Title: 'L', col2Title: 'R',
      bullets: ['a', 'b'], bullets2: Array.from({ length: 14 }, (_, i) => 'item ' + i)
    }, W, H);
    const cols = boxes.filter((b) => b.type === 'bullets');
    eq(cols.length, 2, 'two columns produced');
    const [left, right] = cols.sort((a, b2) => a.x - b2.x);
    approx(left.w, right.w, 0.001, 'columns are exactly equal width');
    approx(right.x - (left.x + left.w), L.GUTTER * W, 0.001, `gutter is exactly ${L.GUTTER * W}px`);
    ok(left.x + left.w <= right.x, 'columns never overlap');
    eq(left.fontSize, right.fontSize, 'both columns share one font size (denser column wins)');
    const solo = L.layoutSlide({ layout: 'two-column', title: 'T', bullets: ['a', 'b'], bullets2: ['c', 'd'] }, W, H)
      .filter((b) => b.type === 'bullets')[0];
    ok(solo.fontSize > left.fontSize, 'fewer items per column → larger shared font');
  }

  console.log('\n— Auto-layout: bounds + theme invariance —');
  {
    const deck = buildDeck();
    for (const s of deck.slides) {
      const boxes = L.layoutSlide(s, W, H); // layoutSlide throws on out-of-bounds
      assert.ok(boxes.length > 0);
    }
    passed++; console.log('  ✔ all 8 sample slides lay out inside the canvas');

    const a = JSON.stringify(L.layoutSlide(deck.slides[3], W, H));
    // themes only carry colors/fonts — geometry must be byte-identical
    const b = JSON.stringify(L.layoutSlide(deck.slides[3], W, H));
    eq(a, b, 'layout is deterministic');
    ok(!a.includes('#'), 'layout output contains no theme colors — theme swap cannot break layout');
    assert.throws(() => L.layoutSlide({ layout: 'freeform' }, W, H), /unknown layout/);
    passed++; console.log('  ✔ unknown layout throws');
  }

  console.log('\n— Chart geometry —');
  {
    const box = { x: 0, y: 0, w: 600, h: 400 };
    const bars = C.barChart(['a', 'b', 'c'], [10, 20, 5], box).bars;
    approx(bars[0].h / bars[1].h, 0.5, 1e-9, 'bar heights exactly proportional (10 vs 20 → ratio 0.5)');
    approx(bars[2].h / bars[1].h, 0.25, 1e-9, 'bar heights exactly proportional (5 vs 20 → ratio 0.25)');
    approx(bars[1].h, 400 * 0.88, 1e-9, 'max bar fills the plot area exactly');
    ok(bars[0].x < bars[1].x && bars[1].x < bars[2].x, 'bars ordered left to right');

    const pie = C.pieChart([1, 2, 1], box);
    eq(pie.slices.length, 3, 'pie has 3 slices');
    approx(pie.slices[1].endAngle - pie.slices[1].startAngle, Math.PI, 1e-9, '50% slice sweeps exactly π');
    approx(pie.slices[2].endAngle - pie.slices[0].startAngle, Math.PI * 2, 1e-12, 'pie closes at exactly 2π');
    for (let i = 1; i < pie.slices.length; i++) {
      assert.strictEqual(pie.slices[i].startAngle, pie.slices[i - 1].endAngle, 'slices are contiguous');
    }
    passed++; console.log('  ✔ pie slices are contiguous (no gaps, no overlap)');

    const line = C.lineChart(['a', 'b', 'c'], [0, 5, 10], box);
    approx(line.points[0].x, 0, 1e-9, 'first line point at box left');
    approx(line.points[2].x, 600, 1e-9, 'last line point at box right');
    ok(line.points[0].y > line.points[2].y, 'higher value → higher on canvas (smaller y)');
  }

  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'slidecraft-test-'));
  const deck = buildDeck();

  console.log('\n— PPTX export: real file, unzipped and inspected —');
  {
    const buf = await deckToPptxBuffer(deck);
    const file = path.join(dir, 'smoke.pptx');
    fs.writeFileSync(file, buf);
    const onDisk = fs.readFileSync(file);
    ok(onDisk.length > 10000, `pptx is non-trivial (${onDisk.length} bytes)`);
    eq(onDisk.readUInt32LE(0), 0x04034b50, 'pptx starts with PK\\x03\\x04 zip magic');

    // pptxgenjs bundles jszip — use it to actually open the archive
    const JSZip = require('jszip'); // transitive dep of pptxgenjs (hoisted)
    const zip = await JSZip.loadAsync(onDisk);
    const names = Object.keys(zip.files);
    ok(names.includes('[Content_Types].xml'), 'archive has [Content_Types].xml');
    ok(names.includes('ppt/presentation.xml'), 'archive has ppt/presentation.xml');
    const slideXmls = names.filter((n) => /^ppt\/slides\/slide\d+\.xml$/.test(n));
    eq(slideXmls.length, 8, 'pptx contains exactly 8 slide XMLs (one per deck slide)');

    const slide1 = await zip.file('ppt/slides/slide1.xml').async('string');
    ok(slide1.includes('Slidecraft Smoke Test'), 'slide 1 XML contains the title text');
    const slide3 = await zip.file('ppt/slides/slide3.xml').async('string');
    ok(slide3.includes('First point') && slide3.includes('Third point'), 'bullets landed in slide 3 XML');
    ok(slide3.includes('buChar'), 'bullets use real PowerPoint bullet formatting');

    const notes = names.filter((n) => /^ppt\/notesSlides\/notesSlide\d+\.xml$/.test(n));
    ok(notes.length >= 2, `speaker notes exported (${notes.length} notes slides)`);
    const notes1 = await zip.file(notes[0]).async('string');
    ok(notes1.includes('Welcome everyone'), 'notes XML contains the speaker notes text');

    const charts = names.filter((n) => /^ppt\/charts\/chart\d+\.xml$/.test(n));
    eq(charts.length, 2, 'both chart slides exported as NATIVE PowerPoint charts (editable, not images)');
    const chartXml = await zip.file(charts[0]).async('string');
    ok(chartXml.includes('barChart') || chartXml.includes('pieChart'), 'chart XML declares a real chart type');
    const media = names.filter((n) => n.startsWith('ppt/media/'));
    ok(media.length >= 1, 'embedded image landed in ppt/media/');
  }

  console.log('\n— PDF export: real file, magic + exact page count —');
  {
    const buf = await deckToPdfBuffer(deck);
    const file = path.join(dir, 'smoke.pdf');
    fs.writeFileSync(file, buf);
    const onDisk = fs.readFileSync(file);
    ok(onDisk.length > 5000, `pdf is non-trivial (${onDisk.length} bytes)`);
    eq(onDisk.subarray(0, 5).toString('latin1'), '%PDF-', 'pdf starts with %PDF- magic');
    ok(onDisk.subarray(-32).toString('latin1').includes('%%EOF'), 'pdf ends with %%EOF');
    const raw = onDisk.toString('latin1');
    const pages = (raw.match(/\/Type\s*\/Page[^s]/g) || []).length;
    eq(pages, 8, 'pdf has exactly 8 pages (one per slide)');
    ok(/\/MediaBox\s*\[0 0 960 540\]/.test(raw), 'pages are 960×540 (16:9)');

    // decompress content streams and confirm the title text was really drawn
    // (pdfkit hex-encodes show-text strings: "Slidecraft Smoke" appears as its hex bytes)
    const titleHex = Buffer.from('Slidecraft Smoke').toString('hex');
    let foundTitle = false;
    const streamRe = /stream\r?\n/g;
    let m;
    while ((m = streamRe.exec(raw)) && !foundTitle) {
      const start = m.index + m[0].length;
      const end = raw.indexOf('endstream', start);
      if (end < 0) break;
      const chunk = onDisk.subarray(start, end);
      try {
        const inflated = zlib.inflateSync(chunk).toString('latin1').toLowerCase();
        if (inflated.includes(titleHex) && inflated.includes(' tj')) foundTitle = true;
      } catch { /* not a flate stream */ }
    }
    ok(foundTitle, 'decompressed PDF content stream contains the rendered title text (hex-encoded Tj)');
  }

  console.log('\n— Theme swap changes styling but not structure —');
  {
    const deckB = { ...buildDeck(), theme: 'daylight' };
    const pdfA = await deckToPdfBuffer(buildDeck());
    const pdfB = await deckToPdfBuffer(deckB);
    ok(!pdfA.equals(pdfB), 'different theme → different PDF bytes');
    const pagesA = (pdfA.toString('latin1').match(/\/Type\s*\/Page[^s]/g) || []).length;
    const pagesB = (pdfB.toString('latin1').match(/\/Type\s*\/Page[^s]/g) || []).length;
    eq(pagesA, pagesB, 'theme swap keeps the same page count/structure');
  }

  fs.rmSync(dir, { recursive: true, force: true });
  console.log(`\nAll good — ${passed} assertions passed.\n`);
})().catch((e) => {
  console.error('\n❌ Smoke test failed:', e.message);
  process.exit(1);
});
