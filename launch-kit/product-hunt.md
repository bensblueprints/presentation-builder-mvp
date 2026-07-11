# Product Hunt launch — Slidecraft

**Name:** Slidecraft

**Tagline (60 chars):** Auto-layout presentations. Pay once, export real PPTX.

**Description (260 chars):**
Slidecraft is a desktop presentation builder with Beautiful.ai-style auto-layout: pick a layout, type content, slides reflow to stay clean. Native charts, themes, speaker notes, presenter mode, and real PPTX + PDF export. $29 once — no $40/mo subscription.

**Full description:**
Beautiful.ai's core magic is auto-layout: you type, the slide stays designed. That magic is worth having — the $12–40/month subscription around it isn't. Slidecraft:

- 7 content-aware layouts (title, bullets, two-column, image+text, chart, quote, agenda) that reflow as you add/remove content — nothing overflows, nothing overlaps
- 5 themes (palette + font pairing) that swap globally without ever breaking a layout
- Bar/line/pie charts from typed-in data — exported as NATIVE editable PowerPoint charts
- Speaker notes + presenter mode (next-slide preview, notes, timer)
- Exports: real .pptx (PowerPoint/Keynote/Google Slides) and vector 16:9 PDF
- Decks are plain JSON files on your disk — git-friendly, cloud-free
- Windows desktop app, works offline, zero telemetry

**Maker first comment:**
Hi PH 👋 I loved Beautiful.ai's core idea — slides that lay themselves out — but not paying rent for it. So I rebuilt the part that matters: a deterministic layout engine where every slide is a pure function of (content, layout, canvas). The editor, the PPTX exporter and the PDF exporter all consume the exact same geometry, which means what you present is what you export. Charts export as real PowerPoint chart XML so your team can still edit them. $29 once. Happy to nerd out about the layout math!

**Gallery shots:**
1. Editor: slide thumbnails left, live slide center, layout/content inspector right (dark theme)
2. Same bullets slide shown with 3 vs 10 bullets — font auto-shrunk, still clean
3. Theme picker mid-swap: identical layout in Midnight vs Paper themes side by side
4. Presenter mode: current slide + timer + next-slide preview + notes
5. The exported .pptx open in PowerPoint with an editable native bar chart selected
