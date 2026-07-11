// Theme system: palette + font pairing applied globally. Swapping a theme
// never changes layout geometry — only colors and font families.
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.SlidecraftThemes = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  const THEMES = [
    {
      id: 'midnight',
      label: 'Midnight',
      bg: '#0e1526', panel: '#182238', accent: '#6d8dff',
      title: '#f4f7ff', text: '#c3cce0', muted: '#7d89a6',
      headFont: 'Helvetica-Bold', bodyFont: 'Helvetica',
      cssHead: '"Segoe UI", Arial, sans-serif', cssBody: '"Segoe UI", Arial, sans-serif'
    },
    {
      id: 'paper',
      label: 'Paper',
      bg: '#faf7f2', panel: '#efe9df', accent: '#c2410c',
      title: '#1c1917', text: '#44403c', muted: '#a8a29e',
      headFont: 'Times-Bold', bodyFont: 'Helvetica',
      cssHead: 'Georgia, serif', cssBody: '"Segoe UI", Arial, sans-serif'
    },
    {
      id: 'forest',
      label: 'Forest',
      bg: '#0c1512', panel: '#16241f', accent: '#34d399',
      title: '#ecfdf5', text: '#b5cec2', muted: '#6b8579',
      headFont: 'Helvetica-Bold', bodyFont: 'Helvetica',
      cssHead: '"Segoe UI", Arial, sans-serif', cssBody: '"Segoe UI", Arial, sans-serif'
    },
    {
      id: 'bold',
      label: 'Bold',
      bg: '#18181b', panel: '#27272a', accent: '#facc15',
      title: '#fafafa', text: '#d4d4d8', muted: '#8a8a93',
      headFont: 'Helvetica-Bold', bodyFont: 'Helvetica',
      cssHead: 'Impact, "Segoe UI", sans-serif', cssBody: '"Segoe UI", Arial, sans-serif'
    },
    {
      id: 'daylight',
      label: 'Daylight',
      bg: '#ffffff', panel: '#f1f5f9', accent: '#2563eb',
      title: '#0f172a', text: '#334155', muted: '#94a3b8',
      headFont: 'Helvetica-Bold', bodyFont: 'Helvetica',
      cssHead: '"Segoe UI", Arial, sans-serif', cssBody: '"Segoe UI", Arial, sans-serif'
    }
  ];

  function getTheme(id) {
    return THEMES.find((t) => t.id === id) || THEMES[0];
  }

  return { THEMES, getTheme };
});
