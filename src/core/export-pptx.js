// Deck -> real .pptx via pptxgenjs (pure Node, no window). Slides stay fully
// editable in PowerPoint/Keynote/Google Slides; charts export as NATIVE
// PowerPoint charts, not screenshots.
const PptxGenJS = require('pptxgenjs');
const L = require('./layout.js');
const { getTheme } = require('./themes.js');

const SLIDE_W = 10;      // inches (16:9)
const SLIDE_H = 5.625;
// layout space: use a 960x540 reference canvas, convert to inches
const REF_W = 960, REF_H = 540;
const toInX = (v) => (v / REF_W) * SLIDE_W;
const toInY = (v) => (v / REF_H) * SLIDE_H;
const hex = (c) => String(c || '#000000').replace('#', '').toUpperCase();

async function deckToPptxBuffer(deck) {
  const theme = getTheme(deck.theme);
  const pptx = new PptxGenJS();
  pptx.defineLayout({ name: 'SC169', width: SLIDE_W, height: SLIDE_H });
  pptx.layout = 'SC169';
  pptx.author = 'Slidecraft';
  pptx.title = deck.title || 'Slidecraft deck';

  const headFace = theme.headFont.startsWith('Times') ? 'Georgia' : 'Arial';
  const bodyFace = 'Arial';

  for (const slide of deck.slides) {
    const s = pptx.addSlide();
    s.background = { color: hex(theme.bg) };
    const boxes = L.layoutSlide(slide, REF_W, REF_H);

    for (const b of boxes) {
      const pos = { x: toInX(b.x), y: toInY(b.y), w: toInX(b.w), h: toInY(b.h) };
      switch (b.type) {
        case 'accent-bar':
          s.addShape(pptx.ShapeType.rect, { ...pos, fill: { color: hex(theme.accent) }, line: { type: 'none' } });
          break;
        case 'title':
          s.addText(b.text || ' ', {
            ...pos, fontSize: Math.round(b.fontSize * 0.75), fontFace: headFace, bold: true,
            color: hex(theme.title), align: b.align || 'left', valign: 'top'
          });
          break;
        case 'text':
        case 'col-title':
        case 'attribution':
          if (b.text) {
            s.addText(b.text, {
              ...pos, fontSize: Math.round(b.fontSize * 0.75), fontFace: bodyFace,
              bold: b.type === 'col-title', color: b.type === 'col-title' ? hex(theme.accent) : b.muted ? hex(theme.muted) : hex(theme.text),
              align: b.align || 'left', valign: 'top'
            });
          }
          break;
        case 'quote':
          s.addText(b.text || ' ', {
            ...pos, fontSize: Math.round(b.fontSize * 0.75), fontFace: headFace, italic: true,
            color: hex(theme.title), align: 'left', valign: 'top'
          });
          break;
        case 'quote-mark':
          s.addText('“', {
            ...pos, fontSize: Math.round(b.h * 1.9 * 0.75), fontFace: 'Georgia',
            color: hex(theme.accent), bold: true, valign: 'top'
          });
          break;
        case 'bullets':
          if (b.items.length) {
            s.addText(
              b.items.map((t) => ({
                text: t,
                options: { bullet: { code: '2022', indent: 12 }, color: hex(theme.text), breakLine: true }
              })),
              {
                ...pos, fontSize: Math.round(b.fontSize * 0.75), fontFace: bodyFace,
                valign: 'top', lineSpacingMultiple: 1.25, paraSpaceAfter: Math.round(b.fontSize * 0.3)
              }
            );
          }
          break;
        case 'agenda-item': {
          const numW = toInY(b.h) * 0.9;
          s.addText(String(b.index), {
            x: pos.x, y: pos.y, w: numW, h: pos.h * 0.8,
            fontSize: Math.round(b.fontSize * 0.75), fontFace: headFace, bold: true,
            color: hex(theme.accent), valign: 'middle'
          });
          s.addText(b.text, {
            x: pos.x + numW, y: pos.y, w: pos.w - numW, h: pos.h * 0.8,
            fontSize: Math.round(b.fontSize * 0.75), fontFace: bodyFace,
            color: hex(theme.text), valign: 'middle'
          });
          break;
        }
        case 'image':
          if (b.src && /^data:image\//.test(b.src)) {
            s.addImage({ data: b.src, ...pos });
          } else {
            s.addShape(pptx.ShapeType.roundRect, {
              ...pos, fill: { color: hex(theme.panel) }, line: { color: hex(theme.accent), width: 1 }, rectRadius: 0.06
            });
          }
          break;
        case 'chart': {
          const c = b.chart || {};
          const values = (c.values || []).map(Number);
          const labels = (c.labels || []).map(String);
          const data = [{ name: slide.title || 'Series', labels, values }];
          const typeMap = { bar: pptx.ChartType.bar, line: pptx.ChartType.line, pie: pptx.ChartType.pie };
          s.addChart(typeMap[c.type] || pptx.ChartType.bar, data, {
            ...pos,
            chartColors: [hex(theme.accent), '34D399', 'F59E0B', 'F472B6', '60A5FA', 'A78BFA'],
            catAxisLabelColor: hex(theme.muted),
            valAxisLabelColor: hex(theme.muted),
            dataLabelColor: hex(theme.text),
            showLegend: c.type === 'pie',
            legendColor: hex(theme.text)
          });
          break;
        }
        default:
          break;
      }
    }

    if (slide.notes) s.addNotes(slide.notes);
  }

  const buf = await pptx.write({ outputType: 'nodebuffer' });
  return Buffer.from(buf);
}

module.exports = { deckToPptxBuffer, REF_W, REF_H };
