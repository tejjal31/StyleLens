
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pathlib import Path
import shutil
import tempfile

from .analyze_clothing import analyze

app = FastAPI(title="StyleLens Computer Vision API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:8083"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health():
    return {"status": "ok", "service": "StyleLens Computer Vision"}


@app.post("/analyze")
async def analyze_clothing_image(file: UploadFile = File(...)):
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Please upload an image.")

    suffix = Path(file.filename or "image.jpg").suffix or ".jpg"

    try:
        with tempfile.NamedTemporaryFile(suffix=suffix, delete=False) as temp:
            temp_path = Path(temp.name)
            shutil.copyfileobj(file.file, temp)

        result, img, mask = analyze(str(temp_path))
        return result

    except Exception as error:
        raise HTTPException(status_code=500, detail=str(error))

    finally:
        if "temp_path" in locals():
            temp_path.unlink(missing_ok=True)
        await file.close()
