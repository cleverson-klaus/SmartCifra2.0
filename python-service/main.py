"""
SmartCifra Chord Detection Service
FastAPI microservice que analisa áudio e retorna acordes com timestamps.

Endpoints:
  GET  /health  → status do serviço
  POST /detect  → recebe arquivo de áudio, retorna BPM + key + chords[]
"""

import os
import tempfile
from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from chord_detector import detect_chords

app = FastAPI(title="SmartCifra Chord Service", version="1.0.0")

# Permite requisições do Next.js em desenvolvimento e produção
ALLOWED_ORIGINS = os.environ.get(
    "ALLOWED_ORIGINS",
    "http://localhost:3000,http://127.0.0.1:3000"
).split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)

SUPPORTED_EXTENSIONS = {".mp3", ".wav", ".m4a", ".ogg", ".flac", ".aac", ".opus"}
MAX_FILE_SIZE = 50 * 1024 * 1024  # 50 MB


@app.get("/health")
def health():
    return {"status": "ok", "service": "smartcifra-chord-detector"}


@app.post("/detect")
async def detect(file: UploadFile = File(...)):
    """
    Recebe um arquivo de áudio e retorna:
    - bpm: tempo em BPM
    - key: tonalidade estimada (ex: "G", "Am")
    - chords: lista de {chord, time} com o timestamp em segundos de cada mudança
    """
    filename = file.filename or "audio"
    ext = os.path.splitext(filename)[1].lower()

    if ext not in SUPPORTED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Formato '{ext}' não suportado. Use: {', '.join(sorted(SUPPORTED_EXTENSIONS))}"
        )

    content = await file.read()

    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=413,
            detail=f"Arquivo muito grande. Limite: {MAX_FILE_SIZE // 1024 // 1024} MB"
        )

    # Salva em arquivo temporário para o librosa processar
    with tempfile.NamedTemporaryFile(suffix=ext, delete=False) as tmp:
        tmp.write(content)
        tmp_path = tmp.name

    try:
        result = detect_chords(tmp_path)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro na análise: {str(e)}")
    finally:
        if os.path.exists(tmp_path):
            os.unlink(tmp_path)
