# Architecture

- **Repo:** toolbox
- **Status:** `implemented`
- **Date:** 2026-10-21

Toolbox is a small multi-tool site. Each tool is one page in `web/`. PDF to Markdown is the only tool that calls `api/`. The other tools run in the browser and do not upload files.

```text
web (Vite, GitHub Pages, base /toolbox/)
  #/            tool list
  #/pdf-to-md   POST /tools/pdf-to-md/convert
  #/qr          browser
  #/image       browser
  #/json        browser
  #/time        browser
  #/diff        browser

api (FastAPI on Render)
  GET /health
  GET /tools
  POST /tools/pdf-to-md/convert   pymupdf4llm.to_markdown
```

- Routes are hashes (`#/qr`). GitHub Pages can serve the built `index.html` at `/toolbox/` without a fallback for unknown paths. `VITE_BASE` is `/toolbox/` in the Pages workflow and `/` locally.
- Each tool page is a separate JavaScript chunk, loaded when that route opens.
- `api/` is the Python service. Render root directory is `api`.
- Local API default is `http://127.0.0.1:8000`. The PDF page reads `VITE_API_URL`.
- The browser tools do not read `VITE_API_URL`.

Workspace for the service: Alex's workspace `tea-dap4tfoae00c7393c5hg`, region Singapore, plan free. Not the food-picker services.
