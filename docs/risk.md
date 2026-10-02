# Risks

## Conversion quality

- PyMuPDF reads selectable text. A scanned page comes back thin or empty. This version has no OCR.
- Multi-column pages and complex tables can still come out in a rough order. Marker and Docling handle that better, and they do not fit a free Render instance (model weights, 2 GB or more, slow cold start).

## Render free instance

- The service sleeps when idle. The first convert after a quiet period can take about a minute.
- Memory is 512 MB. A very large or image-heavy PDF can fail even under the 15 MB upload cap.
- The live service is not created in the first build. Render can clone the repo only after it exists on GitHub.

## Privacy

- The PDF is uploaded to the API. The handler reads it in memory and does not write it to disk. It is not kept after the response.
- Do not put this route on `food-picker-api` or `food-picker-catmeme-api`.

## GitHub Pages

- Pages only serves the static page. If `VITE_API_URL` is missing at build time, the published page cannot reach the converter.
- The API must allow the Pages origin in `ALLOWED_ORIGINS`, or the browser will block the upload.
- URL fetch stays out. Most public PDF URLs fail in the browser because of CORS, and a static host cannot proxy them.

## License

- PyMuPDF is AGPL (with a commercial license option). This personal toolbox is fine. Selling the converter, or combining it into a closed product, needs a license check first.
