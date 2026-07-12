# 📽 Slidecraft

[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

**The auto-layout presentation builder you buy once.** Pick a layout, type your content, and the slide arranges itself — add a bullet and everything reflows to stay clean, swap themes without breaking a thing. Export real, fully editable **PPTX** (native PowerPoint charts, real bullets, speaker notes) and **PDF**. Present with a built-in presenter mode: next-slide preview, notes and a timer.

Beautiful.ai charges **$12–40/month, forever**, for auto-layout. The auto-layout logic *is* the product — Slidecraft gives it to you for **$29, once**, running entirely on your machine.

![Slidecraft screenshot](docs/screenshot.png)

## ☕ Skip the setup — get the 1-click installer

Don't want to touch a terminal? Grab the packaged Windows installer (and support development):

**→ [Get Slidecraft on Whop](https://whop.com/benjisaiempire/slidecraft)** — pay once, own it forever.

## Features

- 🧠 **Content-aware smart layouts** — title, bullet list, two-column, image+text, chart, quote, agenda. Add or remove content and font sizes, columns and spacing recompute automatically; nothing ever overflows or overlaps
- 🎨 **Theme system** — 5 palettes + font pairings applied globally; themes carry zero geometry, so swapping never breaks a layout (this is asserted in the test suite)
- 📊 **Native charts** — bar/line/pie from typed-in data; rendered as vectors in the editor & PDF, and exported as **real editable PowerPoint charts** in PPTX, not screenshots
- 🗒 **Speaker notes + presenter mode** — full-screen presenting with next-slide preview, notes pane, elapsed timer, keyboard navigation
- 📤 **Real exports** — `.pptx` via pptxgenjs (opens in PowerPoint/Keynote/Google Slides) and 16:9 vector `.pdf` via pdfkit; both run headless in pure Node
- 💾 **Own your files** — decks are plain-JSON `.slidecraft` files; version them in git if you like
- 🌑 Premium dark editor UI — slide thumbnails, live inspector, no accounts, no cloud, no telemetry

## Quick start

```bash
npm i
npm start        # the editor
npm test         # headless layout/chart/export smoke test (no window needed)
```

## Tech stack

Electron · shared pure-JS layout & chart engine (editor, PPTX and PDF exporters all consume the same geometry) · pptxgenjs · pdfkit

## Slidecraft vs Beautiful.ai

| | **Slidecraft** | Beautiful.ai |
|---|---|---|
| Price | **$29 once** | $12–40/mo ($144–480/yr) |
| Auto-layout slides | ✅ | ✅ |
| Works offline | ✅ 100% local | ❌ |
| PPTX export | ✅ (all plans, native charts) | Paid tiers only |
| PDF export | ✅ | ✅ |
| Presenter mode w/ notes + timer | ✅ | ✅ |
| Your decks stored | On your disk, plain JSON | Their cloud |
| AI design suggestions | ❌ | ✅ |
| Source code | MIT, yours | Proprietary |

**Honesty note:** Beautiful.ai has more layout variety and AI assistance. Slidecraft covers the seven layouts that make up 95% of real decks, does the same "content reflows automatically" trick, and costs less than one month of their Pro plan.

## License

MIT © 2026 Ben (bensblueprints)
