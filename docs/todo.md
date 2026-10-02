# Toolbox todos

The repo is a toolbox. PDF to Markdown is the first tool. Later tools get their own route and page; they do not replace this one.

## Now

- [x] Write `docs/architecture.md`, `docs/sdd/INDEX.md`, and `docs/sdd/001-pdf-to-md.md`
- [x] FastAPI `POST /tools/pdf-to-md/convert` with PyMuPDF (`pymupdf4llm`), a 15 MB cap, and CORS
- [x] `GET /health` for Render
- [x] Vite page: drop a PDF, convert, show Markdown, copy button
- [x] Say so when the Markdown is almost empty (scanned or image-only PDF)
- [x] `render.yaml` for a new free Python service in Singapore on Alex's workspace
- [x] GitHub Pages workflow for `web/`, base path `/toolbox/`, not run until asked
- [x] Verify locally: text PDF converts and copies; a non-PDF shows an error

## Later, when asked

- [ ] Create the GitHub repo and push
- [ ] Create the Render service from `render.yaml` (do not attach this to the food-picker APIs)
- [ ] Set `ALLOWED_ORIGINS` to the GitHub Pages origin
- [ ] Set `VITE_API_URL` and run the Pages workflow
- [ ] Add the next tool beside PDF to Markdown
