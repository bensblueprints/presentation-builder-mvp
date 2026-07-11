// Chart geometry from typed-in data — pure math shared by the editor preview,
// the PDF exporter and the smoke test. (PPTX export uses native PowerPoint
// charts via pptxgenjs so they stay editable.)
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.SlidecraftCharts = factory();
})(typeof self !== 'undefined' ? self : this, function () {

  /** Bars with heights exactly proportional to value/max. */
  function barChart(labels, values, box) {
    const n = values.length;
    if (!n) return { bars: [], axis: { x: box.x, y: box.y + box.h } };
    const max = Math.max(...values, 0);
    const labelBand = box.h * 0.12;
    const plotH = box.h - labelBand;
    const slot = box.w / n;
    const barW = slot * 0.6;
    const bars = values.map((v, i) => {
      const h = max > 0 ? (v / max) * plotH : 0;
      return {
        label: labels[i] != null ? String(labels[i]) : '',
        value: v,
        x: box.x + i * slot + (slot - barW) / 2,
        y: box.y + plotH - h,
        w: barW,
        h
      };
    });
    return { bars, plotH, labelBand, axis: { x: box.x, y: box.y + plotH } };
  }

  /** Pie slices — angles proportional to value/total, summing to exactly 2π. */
  function pieChart(values, box) {
    const total = values.reduce((a, b) => a + b, 0);
    const cx = box.x + box.w / 2;
    const cy = box.y + box.h / 2;
    const r = Math.min(box.w, box.h) / 2 * 0.85;
    const slices = [];
    let angle = -Math.PI / 2;
    for (let i = 0; i < values.length; i++) {
      const frac = total > 0 ? values[i] / total : 1 / values.length;
      const sweep = frac * Math.PI * 2;
      slices.push({ value: values[i], startAngle: angle, endAngle: angle + sweep, frac });
      angle += sweep;
    }
    // Kill accumulated float error on the final slice so the pie closes exactly.
    if (slices.length) slices[slices.length - 1].endAngle = -Math.PI / 2 + Math.PI * 2;
    return { cx, cy, r, slices };
  }

  /** Polyline points scaled into the box (x evenly spaced, y by value). */
  function lineChart(labels, values, box) {
    const n = values.length;
    if (!n) return { points: [] };
    const max = Math.max(...values, 0);
    const min = Math.min(...values, 0);
    const span = max - min || 1;
    const labelBand = box.h * 0.12;
    const plotH = box.h - labelBand;
    const points = values.map((v, i) => ({
      label: labels[i] != null ? String(labels[i]) : '',
      value: v,
      x: box.x + (n === 1 ? box.w / 2 : (i / (n - 1)) * box.w),
      y: box.y + plotH - ((v - min) / span) * plotH
    }));
    return { points, plotH, labelBand };
  }

  function computeChart(chart, box) {
    const labels = chart.labels || [];
    const values = (chart.values || []).map(Number).filter((v) => Number.isFinite(v));
    switch (chart.type) {
      case 'pie': return { type: 'pie', ...pieChart(values, box) };
      case 'line': return { type: 'line', ...lineChart(labels, values, box) };
      case 'bar':
      default: return { type: 'bar', ...barChart(labels, values, box) };
    }
  }

  return { barChart, pieChart, lineChart, computeChart };
});
