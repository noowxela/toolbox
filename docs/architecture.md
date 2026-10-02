# Architecture

- **Repo:** `/Users/alexwoon/Documents/github/01_project/o000o_active/toolbox`
- **Status:** `implemented`
- **Date:** 2026-10-02

Toolbox is a small multi-tool app. Each tool is one page in `web/` and one route group under `/tools/<id>/` in `api/`. PDF to Markdown is the only tool.

```text
web (Vite)  --POST PDF-->  api (FastAPI on Render)
                         pymupdf4llm.to_markdown
                         { "markdown": "..." }
```

- `api/` is the Python service. Render root directory is `api`.
- `web/` is the static page. GitHub Pages base path is `/toolbox/` when the Pages workflow runs.
- Local API default is `http://127.0.0.1:8000`. The page reads `VITE_API_URL`.
- Live Render and GitHub Pages are not created until asked. See `docs/todo.md` and `docs/risk.md`.

Workspace for the future service: Alex's workspace `tea-dap4tfoae00c7393c5hg`, region Singapore, plan free. Not the food-picker services.
