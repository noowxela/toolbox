# SDD: PDF to Markdown

- **Repo:** `/Users/alexwoon/Documents/github/01_project/o000o_active/toolbox`
- **Status:** `implemented`
- **Date:** 2026-10-02
- **Related:** `docs/architecture.md`, `docs/todo.md`, `docs/risk.md`

## 1. Context / current architecture

The toolbox repo is new. There is no converter yet. Existing Render services `food-picker-api` and `food-picker-catmeme-api` stay untouched.

## 2. Problem and non-goals

**Problem:** Turn one digital PDF into Markdown in the browser, with a copy button, using a Python converter that can later run on Render. The page itself must stay static so it can go on GitHub Pages.

**Non-goals:** Sign-in, pricing, language switch, URL fetch, OCR, Marker, Docling, and creating the live Render service or GitHub Pages site in this change.

## 3. Questions asked and answers

| Question | Answer |
| --- | --- |
| Browser JavaScript or Python? | Python on Render. The page stays static for GitHub Pages. |
| What does the first version do? | Upload a PDF, convert to Markdown, copy button. |
| Is the repo only this converter? | No. The repo is a toolbox. PDF to Markdown is the first tool. |

## 4. Proposed approach, pros / cons, rejected alternatives

**Approach:** FastAPI `POST /tools/pdf-to-md/convert` uses `pymupdf4llm`. The Vite page uploads the file, shows the Markdown, and copies it. Uploads over 15 MB and non-PDFs are rejected. CORS allows local dev plus `ALLOWED_ORIGINS`.

**Pros:**

- Better heading and table output than reading text in the browser.
- Fits a free Render Python instance.
- The route is namespaced, so the next tool does not replace this one.

**Cons / risks:**

- See `docs/risk.md`. Scans are weak, the free instance sleeps, and the PDF is sent to the API.

**Rejected alternatives:**

| Alternative | Why not |
| --- | --- |
| pdf.js only in the browser | Weaker Markdown. Kept only if Render were unavailable. |
| Marker or Docling | Too heavy for the free instance. |
| Repo named `pdf-to-md` | More tools are coming. The repo is `toolbox`. |
| Add the route to a food-picker API | Different product. |

## 5. Acceptance criteria and verification

- [x] A text PDF returns Markdown and the copy button puts it on the clipboard
- [x] A non-PDF shows an error
- [x] A nearly empty result tells the user the PDF had almost no selectable text
- [x] `GET /health` returns ok
- [x] Verified in the browser against local uvicorn and Vite

## 6. Status history

| Date | Status | Note |
| --- | --- | --- |
| 2026-10-02 | approved | Plan approved. Repo named toolbox. Todos in `docs/todo.md`, risks in `docs/risk.md`. |
| 2026-10-02 | implemented | Local page and API verified. Render and GitHub Pages not created. |
