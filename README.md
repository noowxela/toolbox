# Toolbox

Small tools on one static site. PDF to Markdown sends the file to the Python API for that request. The other tools run in the browser. Their files and text are not uploaded.

| Tool | Route | Where it runs |
| --- | --- | --- |
| PDF to Markdown | `#/pdf-to-md` | API |
| QR code | `#/qr` | Browser |
| Image compress & convert | `#/image` | Browser |
| JSON formatter | `#/json` | Browser |
| Timestamp & time zones | `#/time` | Browser |
| Text diff | `#/diff` | Browser |

The tool list is `#/`. Routes are hashes so GitHub Pages can host the site at `/toolbox/` without a fallback file.

## Web

```bash
cd web
npm ci
npm test
npm run dev
```

The dev server is `http://127.0.0.1:5173/`. `npm run build` typechecks, then builds. `npm run lint` runs oxlint.

PDF to Markdown reads `VITE_API_URL`. When it is unset, the page calls `http://127.0.0.1:8000`.

## API

The API is only required for PDF to Markdown and `GET /health`.

```bash
cd api
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload --host 127.0.0.1 --port 8000
```

`GET /tools` lists every tool and whether it runs in the browser or the API.

## GitHub Pages

`.github/workflows/pages.yml` is manual (`workflow_dispatch`). It builds `web/` with `VITE_BASE=/toolbox/` and `VITE_API_URL`. The variable has to be the Render service URL, because the PDF tool is in the same build. The other tools work in the published site even when the API is asleep.

## Render

`render.yaml` describes a free Python web service in Singapore. The root directory is `api`. Create that service only when asked. Do not attach this API to the food-picker services.
