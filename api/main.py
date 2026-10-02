import os

import pymupdf
import pymupdf4llm
from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware

MAX_BYTES = 15 * 1024 * 1024

app = FastAPI(title="Toolbox")

def allowed_origins() -> list[str]:
    origins = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ]
    extra = os.environ.get("ALLOWED_ORIGINS", "")
    origins.extend(item.strip() for item in extra.split(",") if item.strip())
    return origins


app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins(),
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)


@app.get("/health")
def health() -> dict[str, bool]:
    return {"ok": True}


@app.get("/tools")
def tools() -> dict[str, list[dict[str, str]]]:
    return {
        "tools": [
            {"id": "pdf-to-md", "name": "PDF to Markdown"},
        ]
    }


@app.post("/tools/pdf-to-md/convert")
async def convert_pdf(file: UploadFile = File(...)) -> dict[str, str]:
    data = await file.read()
    if len(data) > MAX_BYTES:
        raise HTTPException(status_code=413, detail="PDF must be 15 MB or smaller.")
    if not data.startswith(b"%PDF"):
        raise HTTPException(status_code=400, detail="Only PDF files are accepted.")

    try:
        document = pymupdf.open(stream=data, filetype="pdf")
    except Exception as error:
        raise HTTPException(status_code=422, detail="Could not read that PDF.") from error

    try:
        if document.is_encrypted and document.needs_pass:
            raise HTTPException(status_code=422, detail="This PDF is password protected.")
        markdown = pymupdf4llm.to_markdown(document)
    except HTTPException:
        raise
    except Exception as error:
        raise HTTPException(status_code=422, detail="Could not convert that PDF.") from error
    finally:
        document.close()

    return {"markdown": markdown or ""}
