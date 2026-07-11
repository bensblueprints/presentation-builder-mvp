// Slidecraft auto-layout engine — the core differentiator. Given a slide's
// content and a canvas size, it returns positioned boxes; add or remove
// content and everything reflows to stay clean. Pure math: runs identically
// in the browser editor, the PPTX exporter and the PDF exporter.
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.SlidecraftLayout = factory();
})(typeof self !== 'undefined' ? self : this, function () {

  const LAYOUTS = [
    { id: 'title', label: 'Title' },
    { id: 'bullets', label: 'Bullet list' },
    { id: 'two-column', label: 'Two columns' },
    { id: 'image-text', label: 'Image + text' },
    { id: 'chart', label: 'Chart' },
    { id: 'quote', label: 'Quote' },
    { id: 'agenda', label: 'Agenda' }
  ];

  const MARGIN = 0.06;      // fractional slide margin
  const GUTTER = 0.04;      // gap between columns
  const TITLE_BAND = 0.17;  // height reserved for slide titles

  /**
   * Bullet font auto-sizing: few bullets render large, many shrink to fit.
   * Returns a font size as a fraction of slide height.
   */
  function bulletFontFrac(count, areaHFrac) {
    if (count <= 0) return 0.05;
    const lineFactor = 1.55; // line height multiplier
    const maxFrac = 0.052;
    const fit = areaHFrac / (count * lineFactor);
    return Math.max(0.022, Math.min(maxFrac, fit));
  }

  /**
   * Compute layout boxes for one slide.
   * @param {object} slide  { layout, title, subtitle, bullets, bullets2,
   *                          col1Title, col2Title, image, imageSide, chart,
   *                          quote, attribution }
   * @param {number} W  canvas width (px/pt — any unit)
   * @param {number} H  canvas height
   * @returns {object[]} boxes: { type, x, y, w, h, fontSize?, align?, text?, items?, index? }
   */
  function layoutSlide(slide, W, H) {
    const m = MARGIN * Math.min(W, H) * (W / Math.min(W, H)); // horizontal margin
    const mx = MARGIN * W;
    const my = MARGIN * H;
    const innerW = W - 2 * mx;
    const boxes = [];
    const layout = slide.layout || 'bullets';

    const titleBox = (frac = TITLE_BAND) => ({
      type: 'title', text: slide.title || '', x: mx, y: my, w: innerW, h: frac * H - my,
      fontSize: 0.072 * H, align: 'left'
    });

    switch (layout) {
      case 'title': {
        boxes.push({ type: 'accent-bar', x: mx, y: 0.40 * H - 0.02 * H - 0.012 * H, w: 0.14 * W, h: 0.012 * H });
        boxes.push({
          type: 'title', text: slide.title || '', x: mx, y: 0.40 * H, w: innerW, h: 0.20 * H,
          fontSize: 0.105 * H, align: 'left'
        });
        boxes.push({
          type: 'text', text: slide.subtitle || '', x: mx, y: 0.62 * H, w: innerW, h: 0.10 * H,
          fontSize: 0.038 * H, align: 'left', muted: true
        });
        break;
      }

      case 'bullets': {
        boxes.push(titleBox());
        const items = (slide.bullets || []).filter((b) => String(b).trim());
        const areaY = TITLE_BAND * H + 0.02 * H;
        const areaH = H - areaY - my;
        const fs = bulletFontFrac(items.length, areaH / H) * H;
        boxes.push({
          type: 'bullets', items, x: mx, y: areaY, w: innerW, h: areaH,
          fontSize: fs, lineHeight: 1.55
        });
        break;
      }

      case 'two-column': {
        boxes.push(titleBox());
        const colW = (innerW - GUTTER * W) / 2;
        const areaY = TITLE_BAND * H + 0.02 * H;
        const areaH = H - areaY - my;
        const headH = 0.07 * H;
        const cols = [
          { items: (slide.bullets || []).filter(Boolean), head: slide.col1Title || '', x: mx },
          { items: (slide.bullets2 || []).filter(Boolean), head: slide.col2Title || '', x: mx + colW + GUTTER * W }
        ];
        // Both columns share ONE font size (the tighter of the two) so they match.
        const n = Math.max(cols[0].items.length, cols[1].items.length, 1);
        const fs = bulletFontFrac(n, (areaH - headH) / H) * H;
        for (const c of cols) {
          if (c.head) {
            boxes.push({ type: 'col-title', text: c.head, x: c.x, y: areaY, w: colW, h: headH, fontSize: 0.036 * H });
          }
          boxes.push({
            type: 'bullets', items: c.items, x: c.x, y: areaY + headH, w: colW, h: areaH - headH,
            fontSize: fs, lineHeight: 1.55
          });
        }
        break;
      }

      case 'image-text': {
        boxes.push(titleBox());
        const areaY = TITLE_BAND * H + 0.02 * H;
        const areaH = H - areaY - my;
        const imgW = 0.44 * W;
        const textX = slide.imageSide === 'right' ? mx : mx + imgW + GUTTER * W;
        const imgX = slide.imageSide === 'right' ? mx + innerW - imgW : mx;
        boxes.push({ type: 'image', src: slide.image || null, x: imgX, y: areaY, w: imgW, h: areaH });
        const items = (slide.bullets || []).filter(Boolean);
        const fs = bulletFontFrac(items.length, areaH / H) * H;
        boxes.push({
          type: 'bullets', items, x: textX, y: areaY, w: innerW - imgW - GUTTER * W, h: areaH,
          fontSize: fs, lineHeight: 1.55
        });
        break;
      }

      case 'chart': {
        boxes.push(titleBox());
        const areaY = TITLE_BAND * H + 0.03 * H;
        boxes.push({
          type: 'chart', chart: slide.chart || { type: 'bar', labels: [], values: [] },
          x: mx, y: areaY, w: innerW, h: H - areaY - my - 0.04 * H
        });
        break;
      }

      case 'quote': {
        boxes.push({ type: 'quote-mark', x: mx, y: 0.16 * H, w: 0.10 * W, h: 0.12 * H });
        boxes.push({
          type: 'quote', text: slide.quote || slide.title || '', x: mx + 0.04 * W, y: 0.30 * H,
          w: innerW - 0.08 * W, h: 0.34 * H, fontSize: 0.058 * H, align: 'left'
        });
        boxes.push({
          type: 'attribution', text: slide.attribution || '', x: mx + 0.04 * W, y: 0.70 * H,
          w: innerW - 0.08 * W, h: 0.07 * H, fontSize: 0.032 * H
        });
        break;
      }

      case 'agenda': {
        boxes.push(titleBox());
        const items = (slide.bullets || []).filter(Boolean);
        const areaY = TITLE_BAND * H + 0.02 * H;
        const areaH = H - areaY - my;
        const rowH = Math.min(0.115 * H, areaH / Math.max(items.length, 1));
        items.forEach((item, i) => {
          boxes.push({
            type: 'agenda-item', text: item, index: i + 1,
            x: mx, y: areaY + i * rowH, w: innerW, h: rowH,
            fontSize: Math.min(0.042 * H, rowH * 0.42)
          });
        });
        break;
      }

      default:
        throw new Error(`unknown layout: ${layout}`);
    }

    // Safety: clamp everything inside the slide.
    for (const b of boxes) {
      if (b.x < 0 || b.y < 0 || b.x + b.w > W + 0.5 || b.y + b.h > H + 0.5) {
        throw new Error(`layout '${layout}' produced an out-of-bounds box: ${b.type}`);
      }
    }
    return boxes;
  }

  function newSlide(layout = 'bullets') {
    return {
      layout, title: '', subtitle: '', bullets: [], bullets2: [],
      col1Title: '', col2Title: '', image: null, imageSide: 'left',
      chart: { type: 'bar', labels: ['A', 'B', 'C'], values: [3, 5, 2] },
      quote: '', attribution: '', notes: ''
    };
  }

  function newDeck() {
    return {
      version: 1,
      theme: 'midnight',
      title: 'Untitled deck',
      slides: [{ ...newSlide('title'), title: 'Your presentation', subtitle: 'Built with Slidecraft' }]
    };
  }

  return { LAYOUTS, MARGIN, GUTTER, TITLE_BAND, layoutSlide, bulletFontFrac, newSlide, newDeck };
});
