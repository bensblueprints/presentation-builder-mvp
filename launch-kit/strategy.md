# Launch strategy — Slidecraft

## Target communities

- **r/powerpoint / r/presentations** — angle: "auto-layout without the subscription"; show the add-a-bullet-and-it-reflows GIF. Disclose maker status; these subs allow tools with genuine demos.
- **r/consulting / r/sales adjacent communities** — deck-heavy professions where Beautiful.ai seats are a real line item; lead with the PPTX-stays-editable point (their teams require .pptx).
- **r/selfhosted / local-first crowd** — "your pitch deck is a JSON file on your disk" resonates; no cloud dependency for something as sensitive as an unreleased fundraise deck.
- **Indie Hackers / founder Slacks** — pitch-deck season angle: "stop paying deck-tool rent between fundraises."
- **Teachers' communities (r/Teachers, FB groups)** — lecture decks weekly, budgets tiny, $29-once beats any per-month tool.

## Show HN draft

**Title:** Show HN: Slidecraft – auto-layout presentations, pay once, exports real PPTX

Beautiful.ai's core feature is auto-layout: slides re-arrange as content changes. I rebuilt that as a local desktop app. The interesting part is the architecture: every slide is a pure function layout(content, W, H) → boxes. The Electron editor renders those boxes as DOM, the PDF exporter draws them with pdfkit, and the PPTX exporter maps them to pptxgenjs shapes — one geometry source, three consumers, so WYSIWYG is enforced by construction rather than by testing screenshots.

Other choices HN might care about: charts export as native OOXML chart parts (editable in PowerPoint), not images; themes carry zero geometry so theme-swap can't break layout (asserted in tests); decks are plain JSON; the whole export pipeline runs headless in Node — the smoke test unzips the .pptx and inspects slide XML, and inflates the PDF content streams to verify the text was actually drawn.

MIT source; packaged installer sold separately for non-terminal folks.

## SEO keywords

1. beautiful.ai alternative offline
2. presentation software no subscription
3. pptx generator desktop
4. auto layout slide maker
5. presentation builder one time purchase
6. beautiful ai alternative free
7. offline presentation maker windows
8. slide deck software pay once
9. presentation tool with presenter mode
10. powerpoint alternative auto design

## AppSumo / PitchGround pitch

Slidecraft brings Beautiful.ai's signature auto-layout to a $29 one-time desktop app. Users pick from seven content-aware layouts — bullets, two-column, image+text, charts, quote, agenda — and slides reflow automatically as content changes, so decks look designed without a designer. It ships five global themes, typed-in bar/line/pie charts that export as genuinely editable PowerPoint charts, speaker notes with a full presenter mode (timer, next-slide preview), and real PPTX + PDF export. Decks are local JSON files — nothing touches a cloud, which enterprise and finance buyers specifically want for confidential decks. Against $144–480/yr subscriptions, this is the classic lifetime-deal no-brainer.

## Pricing math

**$29 one-time.** Beautiful.ai Pro is $12/mo (annual) — Slidecraft pays for itself in **under 3 months**; against the $40/mo Team plan, in **22 days**. A 5-person team saves ~$2,400/yr.
