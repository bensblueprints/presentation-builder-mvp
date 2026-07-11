// Deck -> PDF via pdfkit (pure Node, no window). Uses the same layout engine
// and chart geometry as the editor, drawn as vectors.
const PDFDocument = require('pdfkit');
const L = require('./layout.js');
const { computeChart } = require('./charts.js');
const { getTheme } = require('./themes.js');

const PAGE_W = 960, PAGE_H = 540;

function dataUrlToBuffer(src) {
  const m = /^data:image\/(png|jpe?g);base64,(.+)$/.exec(src || '');
  return m ? Buffer.from(m[2], 'base64') : null;
}

function deckToPdfBuffer(deck) {
  return new Promise((resolve, reject) => {
    const theme = getTheme(deck.theme);
    const doc = new PDFDocument({ size: [PAGE_W, PAGE_H], margin: 0, autoFirstPage: false });
    const chunks = [];
    doc.on('data', (c) => chunks.push(c));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    const head = theme.headFont;   // pdfkit built-in AFM fonts
    const body = theme.bodyFont;

    for (const slide of deck.slides) {
      doc.addPage({ size: [PAGE_W, PAGE_H], margin: 0 });
      doc.rect(0, 0, PAGE_W, PAGE_H).fill(theme.bg);
      const boxes = L.layoutSlide(slide, PAGE_W, PAGE_H);

      for (const b of boxes) {
        switch (b.type) {
          case 'accent-bar':
            doc.rect(b.x, b.y, b.w, b.h).fill(theme.accent);
            break;
          case 'title':
            doc.font(head).fontSize(b.fontSize).fillColor(theme.title)
              .text(b.text || '', b.x, b.y, { width: b.w, height: b.h, align: b.align || 'left', ellipsis: true });
            break;
          case 'text':
            doc.font(body).fontSize(b.fontSize).fillColor(b.muted ? theme.muted : theme.text)
              .text(b.text || '', b.x, b.y, { width: b.w, height: b.h, align: b.align || 'left' });
            break;
          case 'col-title':
            doc.font(head).fontSize(b.fontSize).fillColor(theme.accent)
              .text(b.text || '', b.x, b.y, { width: b.w, height: b.h });
            break;
          case 'bullets': {
            doc.font(body).fontSize(b.fontSize).fillColor(theme.text);
            let y = b.y;
            const lh = b.fontSize * (b.lineHeight || 1.55);
            for (const item of b.items) {
              if (y + lh > b.y + b.h + 1) break;
              doc.circle(b.x + b.fontSize * 0.28, y + b.fontSize * 0.45, b.fontSize * 0.14).fill(theme.accent);
              doc.fillColor(theme.text).text(item, b.x + b.fontSize * 0.9, y, {
                width: b.w - b.fontSize * 0.9, height: lh * 2, ellipsis: true
              });
              const used = doc.heightOfString(item, { width: b.w - b.fontSize * 0.9 });
              y += Math.max(lh, used + b.fontSize * 0.55);
            }
            break;
          }
          case 'agenda-item': {
            doc.font(head).fontSize(b.fontSize * 1.1).fillColor(theme.accent)
              .text(String(b.index).padStart(2, '0'), b.x, b.y + b.h * 0.18, { width: b.h, lineBreak: false });
            doc.font(body).fontSize(b.fontSize).fillColor(theme.text)
              .text(b.text, b.x + b.h * 0.9, b.y + b.h * 0.22, { width: b.w - b.h * 0.9, ellipsis: true });
            doc.moveTo(b.x, b.y + b.h * 0.9).lineTo(b.x + b.w, b.y + b.h * 0.9)
              .lineWidth(0.6).strokeColor(theme.panel).stroke();
            break;
          }
          case 'quote-mark':
            doc.font('Times-Bold').fontSize(b.h * 1.9).fillColor(theme.accent)
              .text('“', b.x, b.y - b.h * 0.35, { lineBreak: false });
            break;
          case 'quote':
            doc.font(head).fontSize(b.fontSize).fillColor(theme.title)
              .text(b.text || '', b.x, b.y, { width: b.w, height: b.h, oblique: true });
            break;
          case 'attribution':
            if (b.text) {
              doc.font(body).fontSize(b.fontSize).fillColor(theme.accent)
                .text('— ' + b.text, b.x, b.y, { width: b.w });
            }
            break;
          case 'image': {
            const buf = dataUrlToBuffer(b.src);
            if (buf) {
              try {
                doc.save();
                doc.rect(b.x, b.y, b.w, b.h).clip();
                doc.image(buf, b.x, b.y, { cover: [b.w, b.h], align: 'center', valign: 'center' });
                doc.restore();
                break;
              } catch { doc.restore(); /* fall through to placeholder */ }
            }
            doc.roundedRect(b.x, b.y, b.w, b.h, 8).fill(theme.panel);
            doc.font(body).fontSize(14).fillColor(theme.muted)
              .text('image', b.x, b.y + b.h / 2 - 8, { width: b.w, align: 'center' });
            break;
          }
          case 'chart': {
            const g = computeChart(b.chart || {}, b);
            if (g.type === 'bar') {
              doc.moveTo(b.x, g.axis.y).lineTo(b.x + b.w, g.axis.y).lineWidth(1).strokeColor(theme.muted).stroke();
              for (const bar of g.bars) {
                doc.rect(bar.x, bar.y, bar.w, bar.h).fill(theme.accent);
                doc.font(body).fontSize(12).fillColor(theme.muted)
                  .text(bar.label, bar.x - 10, g.axis.y + 6, { width: bar.w + 20, align: 'center' });
                doc.fontSize(12).fillColor(theme.text)
                  .text(String(bar.value), bar.x - 10, bar.y - 16, { width: bar.w + 20, align: 'center' });
              }
            } else if (g.type === 'pie') {
              const palette = [theme.accent, '#34d399', '#f59e0b', '#f472b6', '#60a5fa', '#a78bfa'];
              g.slices.forEach((s, i) => {
                const x1 = g.cx + g.r * Math.cos(s.startAngle);
                const y1 = g.cy + g.r * Math.sin(s.startAngle);
                const x2 = g.cx + g.r * Math.cos(s.endAngle);
                const y2 = g.cy + g.r * Math.sin(s.endAngle);
                const large = s.endAngle - s.startAngle > Math.PI ? 1 : 0;
                doc.path(`M ${g.cx} ${g.cy} L ${x1} ${y1} A ${g.r} ${g.r} 0 ${large} 1 ${x2} ${y2} Z`)
                  .fill(palette[i % palette.length]);
              });
            } else if (g.type === 'line') {
              if (g.points.length > 1) {
                doc.moveTo(g.points[0].x, g.points[0].y);
                for (let i = 1; i < g.points.length; i++) doc.lineTo(g.points[i].x, g.points[i].y);
                doc.lineWidth(3).strokeColor(theme.accent).stroke();
              }
              for (const p of g.points) {
                doc.circle(p.x, p.y, 4).fill(theme.accent);
                doc.font(body).fontSize(11).fillColor(theme.muted)
                  .text(p.label, p.x - 20, b.y + b.h - g.labelBand + 6, { width: 40, align: 'center', lineBreak: false });
              }
            }
            break;
          }
          default:
            break;
        }
      }

      // slide number
      doc.font(body).fontSize(11).fillColor(theme.muted)
        .text(String(deck.slides.indexOf(slide) + 1), PAGE_W - 50, PAGE_H - 26, { width: 30, align: 'right' });
    }

    doc.end();
  });
}

module.exports = { deckToPdfBuffer, PAGE_W, PAGE_H };
