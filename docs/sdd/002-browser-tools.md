# SDD: Browser tools

- **Repo:** toolbox
- **Status:** `implemented`
- **Date:** 2026-10-21
- **Related:** `docs/architecture.md`, `docs/design.md`, `docs/risk.md`, `docs/sdd/001-pdf-to-md.md`

## 1. Context / current architecture

PDF to Markdown is one Vite page and one FastAPI route. The page is static and the GitHub Pages workflow publishes `web/dist` with base path `/toolbox/`. The free Render API sleeps, and the PDF is uploaded for that request.

## 2. Problem and non-goals

**Problem:** Host more than one tool without breaking PDF to Markdown. Add five tools that run entirely in the browser: QR code, image compress and convert, JSON formatter, timestamp and time zones, and text diff.

**Non-goals:** Accounts, OCR, a new PDF converter, moving the PDF tool into the browser, and creating the live Render service or GitHub Pages site.

## 3. Questions asked and answers

The request answered these before implementation. They are recorded here.

| Question | Answer |
| --- | --- |
| Where do the five tools run? | In the browser. No API calls. Files and text stay on the device, and the page says so. |
| How do several tools share one GitHub Pages site? | Hash routes (`#/qr`) so `/toolbox/` keeps working without a 404 fallback. PDF to Markdown stays at `#/pdf-to-md`. |

## 4. Proposed approach, pros / cons, rejected alternatives

**Approach:** A tool list at `#/` and one lazy-loaded page per tool. Shared chrome is the wordmark, a nav, and a light/dark control that keeps the existing type scale. PDF to Markdown still posts to `POST /tools/pdf-to-md/convert`. The other tools are pure browser code, with Vitest covering Wi-Fi and vCard payloads, CSV and YAML conversion, timestamps, resize math, and the diff.

**Pros:**

- The PDF tool keeps its API and its page.
- Files for the new tools are not uploaded, and the free API is not woken up by them.
- Each tool is its own chunk, so the first load does not include `qrcode`, `yaml`, `diff`, `fflate`, or `marked`.

**Cons / risks:**

- See `docs/risk.md`. Hash URLs are part of the address. WebP encoding and copying an image depend on the browser. Large images and diffs run on the main thread.

**Rejected alternatives:**

| Alternative | Why not |
| --- | --- |
| BrowserRouter and a Pages `404.html` copy | Refresh and the base path are easy to get wrong. Hash routes work with the workflow as it is. |
| `react-router` | Six routes do not need another runtime dependency. |
| Send images or JSON through FastAPI | Uploads, cold start, and the 512 MB instance. The request says these tools stay on the device. |

## 5. Acceptance criteria and verification

- [x] `#/` lists the six tools. `#/pdf-to-md`, `#/qr`, `#/image`, `#/json`, `#/time`, and `#/diff` each open one tool.
- [x] PDF to Markdown still posts to `/tools/pdf-to-md/convert`.
- [x] The five new tools do not fetch the API, and each says that files and text stay on the device.
- [x] QR: URL, text, Wi-Fi, vCard, colors, error correction, size, margin, logo raises correction to H, PNG, SVG, copy image.
- [x] Images: several files, JPG/PNG/WebP, quality, max box or percent, before/after size, zip, metadata dropped by re-encoding.
- [x] JSON: format, minify, line and column on invalid input, indent, sort keys, tree, YAML, CSV, copy, download.
- [x] Time: live clock, Unix seconds and milliseconds, ISO 8601, zones starting at Asia/Kuala_Lumpur, add a zone, relative time.
- [x] Diff: two panes, side by side and inline, line and word or character highlights, ignore whitespace and case, swap, added and removed counts.
- [x] Light and dark, narrow layout, and keyboard access for the controls.
- [x] `npm test`, `npm run lint`, and `npm run build` pass. Pages build still sets `VITE_BASE=/toolbox/`.
- [x] Each tool checked in the running app, including PDF to Markdown still opening.

## 6. Status history

| Date | Status | Note |
| --- | --- | --- |
| 2026-10-21 | implemented | Request specified browser-only tools and hash routes. Unit tests, lint, and the `/toolbox/` production build passed. Browser pass covered the home list, all five tools, dark and narrow layouts, and a PDF convert that returned the sample text. |
