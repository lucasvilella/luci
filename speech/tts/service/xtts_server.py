"""
xtts_server.py

High-performance XTTS-v2 FastAPI service for Luci
Features:
  - Model + embeddings preloaded in GPU memory at startup
  - FP16 inference for ~30-40% latency reduction
  - Fixed seed for deterministic, reproducible voice
  - Streaming endpoint (sentence-by-sentence SSE) for instant TTFA
  - Phrase cache for common greetings (<100ms response)
  - Single-sentence endpoint for pipelined synthesis from TypeScript

Endpoints:
  GET  /health           - Server and model status
  POST /tts              - Full text synthesis (returns complete WAV)
  POST /tts/sentence     - Single sentence synthesis (for pipelined streaming)
  POST /tts/stream       - SSE streaming (sentence-by-sentence chunks)
  POST /tts/warmup       - Pre-cache common greetings
"""

import os
import sys
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')
if hasattr(sys.stderr, 'reconfigure'):
    sys.stderr.reconfigure(encoding='utf-8')
os.environ["COQUI_TOS_AGREED"] = "1"
os.environ["OMP_NUM_THREADS"] = "12"
os.environ["MKL_NUM_THREADS"] = "12"

import io
import time
import re
import hashlib
import json
import torch
# Maximize CPU multithreading for XTTS inference
torch.set_num_threads(12)
if hasattr(torch, 'set_num_interop_threads'):
    try:
        torch.set_num_interop_threads(4)
    except:
        pass
import torchaudio
import soundfile as sf
import numpy as np
import scipy.signal as signal
import librosa
import noisereduce as nr
from fastapi import FastAPI, HTTPException
from fastapi.responses import Response, StreamingResponse
from pydantic import BaseModel
from typing import Optional
import asyncio
from concurrent.futures import ThreadPoolExecutor

# ─── Seed fixa para reprodutibilidade ───
VOICE_SEED = 42

# Safe torchaudio loader
def safe_torchaudio_load(file_path, **kwargs):
    data, sample_rate = sf.read(file_path, dtype='float32')
    tensor = torch.from_numpy(data)
    if tensor.ndim == 1:
        tensor = tensor.unsqueeze(0)
    elif tensor.ndim == 2:
        tensor = tensor.T
    return tensor, sample_rate

torchaudio.load = safe_torchaudio_load

import transformers.pytorch_utils
if not hasattr(transformers.pytorch_utils, "isin_mps_friendly"):
    transformers.pytorch_utils.isin_mps_friendly = torch.isin

from TTS.api import TTS

app = FastAPI(title="Luci XTTS-v2 Official Voice Service")

# ─── Global State ───
tts_model = None
gpt_cond_latent = None
speaker_embedding = None
device = "cpu"
phrase_cache: dict[str, bytes] = {}  # hash -> WAV bytes
executor = ThreadPoolExecutor(max_workers=1)  # GPU is single-threaded

REF_PATH = os.environ.get("XTTS_REF_PATH", "lucy_best_ref_24k.wav")
CACHE_DIR = os.path.join(os.path.dirname(__file__), "..", "..", "..", "cache", "tts")

# ─── Request Models ───
class TTSRequest(BaseModel):
    text: str
    language: str = "pt"
    speed: float = 1.13
    temperature: float = 0.65
    repetition_penalty: float = 3.5
    top_k: int = 50
    top_p: float = 0.70

class SentenceRequest(BaseModel):
    text: str
    language: str = "pt"
    speed: float = 1.13
    temperature: float = 0.65
    repetition_penalty: float = 3.5
    top_k: int = 50
    top_p: float = 0.70
    is_last: bool = False

class WarmupRequest(BaseModel):
    phrases: list[str] = [
        "Hum.",
        "Sei.",
        "Ah, sim.",
        "Entendido.",
        "Certo.",
        "Um momento.",
        "Deixa eu ver.",
        "Com certeza.",
        "Pronto.",
        "Perfeito.",
    ]

# ─── Utility Functions ───

def set_deterministic_seed(seed: int = VOICE_SEED):
    """Fix all randomness sources for identical output."""
    torch.manual_seed(seed)
    if torch.cuda.is_available():
        torch.cuda.manual_seed(seed)
        torch.cuda.manual_seed_all(seed)
    np.random.seed(seed)
    torch.backends.cudnn.deterministic = True
    torch.backends.cudnn.benchmark = False

def get_phrase_hash(text: str) -> str:
    """Deterministic hash for cache key."""
    normalized = text.strip().lower()
    return hashlib.md5(normalized.encode()).hexdigest()[:12]

def clean_sentence_for_tts(sentence: str) -> str:
    text = sentence.strip()
    replacements = {
        r'\b15%\b': 'quinze por cento',
        r'\b18\b': 'dezoito',
        r'\b16\b': 'dezesseis',
        r'\b2026\b': 'dois mil e vinte e seis',
        r'\b100%\b': 'cem por cento',
        r'\b%\b': ' por cento',
        r'\bº\b': ' graus',
        r'\b°\b': ' graus',
    }
    for pattern, repl in replacements.items():
        text = re.sub(pattern, repl, text, flags=re.IGNORECASE)
    return text

def split_into_clean_sentences(text: str) -> list[str]:
    raw_sentences = [s.strip() for s in re.split(r'(?<=[.!?])\s+', text) if s.strip()]
    merged = []
    buffer = ""
    for s in raw_sentences:
        if buffer:
            buffer = f"{buffer} {s}"
        else:
            buffer = s
        if len(buffer.split()) >= 3 and len(buffer) >= 14:
            merged.append(buffer)
            buffer = ""
    if buffer:
        if merged:
            merged[-1] = f"{merged[-1]} {buffer}"
        else:
            merged.append(buffer)
    return merged

def synthesize_single_sentence(
    text: str,
    speed: float = 1.13,
    temperature: float = 0.50,
    repetition_penalty: float = 3.5,
    top_k: int = 50,
    top_p: float = 0.72,
    add_pause: bool = False,
) -> bytes:
    """
    Synthesize a single sentence into WAV bytes.
    Uses FP16 inference and fixed seed for speed + determinism.
    """
    global tts_model, gpt_cond_latent, speaker_embedding, device
    sr = 24000

    clean_text = clean_sentence_for_tts(text)
    
    # Check cache first
    cache_key = get_phrase_hash(clean_text)
    if cache_key in phrase_cache:
        return phrase_cache[cache_key]

    # Fixed seed before inference
    set_deterministic_seed(VOICE_SEED)

    # FP16 inference for speed on CUDA
    with torch.inference_mode():
        if device == "cuda":
            with torch.amp.autocast("cuda"):
                out = tts_model.inference(
                    text=clean_text,
                    language="pt",
                    gpt_cond_latent=gpt_cond_latent,
                    speaker_embedding=speaker_embedding,
                    temperature=temperature,
                    repetition_penalty=repetition_penalty,
                    top_k=top_k,
                    top_p=top_p,
                    speed=speed,
                    enable_text_splitting=False,
                )
        else:
            out = tts_model.inference(
                text=clean_text,
                language="pt",
                gpt_cond_latent=gpt_cond_latent,
                speaker_embedding=speaker_embedding,
                temperature=temperature,
                repetition_penalty=repetition_penalty,
                top_k=top_k,
                top_p=top_p,
                speed=speed,
                enable_text_splitting=False,
            )

    wav = np.array(out["wav"], dtype=np.float32).squeeze()

    # 1. Limpeza de ruído de estúdio profissional (Master Final: ruído zero com timbre encorpado)
    clean_wav = nr.reduce_noise(y=wav, sr=sr, prop_decrease=0.85, stationary=True)
    sos = signal.butter(4, 120, 'hp', fs=sr, output='sos')
    clean_wav = signal.sosfilt(sos, clean_wav)

    # 2. Recorte cirúrgico de silêncio residual
    intervals = librosa.effects.split(clean_wav, top_db=25, frame_length=1024, hop_length=256)
    if len(intervals) > 0:
        clean_wav = clean_wav[intervals[0][0]:intervals[-1][1]]
    else:
        clean_wav, _ = librosa.effects.trim(clean_wav, top_db=25)

    # 3. Fade-in/Fade-out suave de 12ms
    fade_len = int(0.012 * sr)
    if len(clean_wav) > fade_len * 2:
        clean_wav[:fade_len] *= np.linspace(0, 1, fade_len)
        clean_wav[-fade_len:] *= np.linspace(1, 0, fade_len)

    # Conversational micro-pause
    if add_pause:
        pause_dur = 0.15 if text.strip().endswith("?") else 0.11
        pause_samples = int(pause_dur * sr)
        clean_wav = np.pad(clean_wav, (0, pause_samples))

    # Normalize
    peak = np.max(np.abs(clean_wav))
    if peak > 0:
        clean_wav = clean_wav * (0.94 / peak)

    # Encode to WAV bytes
    buf = io.BytesIO()
    sf.write(buf, clean_wav.astype(np.float32), sr, format='WAV')
    buf.seek(0)
    wav_bytes = buf.read()

    # Cache this phrase
    phrase_cache[cache_key] = wav_bytes

    return wav_bytes


# Ensure cache directory exists
os.makedirs(CACHE_DIR, exist_ok=True)

# ─── Load Model at Startup ───
device = "cuda" if torch.cuda.is_available() else "cpu"
print(f"[XTTS Server] Inicializando modelo no dispositivo: {device}...")
tts = TTS("tts_models/multilingual/multi-dataset/xtts_v2").to(device)
tts_model = tts.synthesizer.tts_model
tts_model.eval()

if os.path.exists(REF_PATH):
    print(f"[XTTS Server] Pré-carregando embeddings da Lucy de: {REF_PATH}...")
    gpt_cond_latent, speaker_embedding = tts_model.get_conditioning_latents(audio_path=REF_PATH)
    print("[XTTS Server] Embeddings neurais prontos na memória!")
else:
    print(f"[XTTS Server] AVISO: Referência {REF_PATH} não encontrada.")

print(f"[XTTS Server] [OK] Servidor pronto na porta 8002 ({device.upper()})")

# ─── Endpoints ───

@app.get("/health")
def health_check():
    return {
        "status": "ok",
        "model": "xtts_v2",
        "voice": "Lucy (Oficial)",
        "device": device,
        "preloaded": gpt_cond_latent is not None,
        "cached_phrases": len(phrase_cache),
        "seed": VOICE_SEED,
        "timestamp": time.time(),
    }


@app.post("/tts")
async def synthesize_full(req: TTSRequest):
    """Full text synthesis — returns complete WAV with all sentences concatenated."""
    if not req.text:
        raise HTTPException(status_code=400, detail="Text is required")
    if tts_model is None or gpt_cond_latent is None:
        raise HTTPException(status_code=503, detail="XTTS-v2 model is still loading")

    sr = 24000
    sentences = split_into_clean_sentences(req.text)

    try:
        loop = asyncio.get_event_loop()
        audio_chunks = []
        for idx, sentence in enumerate(sentences, 1):
            is_last = (idx == len(sentences))
            wav_bytes = await loop.run_in_executor(
                executor,
                synthesize_single_sentence,
                sentence, req.speed, req.temperature, req.repetition_penalty,
                req.top_k, req.top_p, not is_last,
            )
            # Decode WAV bytes back to numpy for concatenation
            buf = io.BytesIO(wav_bytes)
            data, _ = sf.read(buf, dtype='float32')
            audio_chunks.append(data)

        final_audio = np.concatenate(audio_chunks)

        out_buffer = io.BytesIO()
        sf.write(out_buffer, final_audio.astype(np.float32), sr, format='WAV')
        out_buffer.seek(0)

        return Response(content=out_buffer.read(), media_type="audio/wav")

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/tts/sentence")
async def synthesize_sentence(req: SentenceRequest):
    """
    Single sentence synthesis — used by TypeScript provider for pipelined streaming.
    Returns WAV bytes for one sentence immediately.
    TTFA: ~2-4s per sentence on GPU, <100ms if cached.
    """
    if not req.text:
        raise HTTPException(status_code=400, detail="Text is required")
    if tts_model is None or gpt_cond_latent is None:
        raise HTTPException(status_code=503, detail="XTTS-v2 model is still loading")

    try:
        loop = asyncio.get_event_loop()
        wav_bytes = await loop.run_in_executor(
            executor,
            synthesize_single_sentence,
            req.text, req.speed, req.temperature, req.repetition_penalty,
            req.top_k, req.top_p, not req.is_last,
        )

        return Response(content=wav_bytes, media_type="audio/wav")

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/tts/stream")
async def synthesize_stream(req: TTSRequest):
    """
    SSE streaming — synthesizes sentence-by-sentence and sends each as an event.
    The client starts playing audio as soon as the first sentence arrives.
    
    Event format:
      data: {"index": 0, "total": 4, "text": "...", "audio_base64": "...", "duration_ms": 123}
    """
    if not req.text:
        raise HTTPException(status_code=400, detail="Text is required")
    if tts_model is None or gpt_cond_latent is None:
        raise HTTPException(status_code=503, detail="XTTS-v2 model is still loading")

    import base64

    sentences = split_into_clean_sentences(req.text)

    async def generate_events():
        loop = asyncio.get_event_loop()
        for idx, sentence in enumerate(sentences):
            is_last = (idx == len(sentences) - 1)
            start_t = time.time()
            
            wav_bytes = await loop.run_in_executor(
                executor,
                synthesize_single_sentence,
                sentence, req.speed, req.temperature, req.repetition_penalty,
                req.top_k, req.top_p, not is_last,
            )
            
            elapsed_ms = int((time.time() - start_t) * 1000)
            audio_b64 = base64.b64encode(wav_bytes).decode('ascii')

            event_data = json.dumps({
                "index": idx,
                "total": len(sentences),
                "text": sentence,
                "audio_base64": audio_b64,
                "synthesis_ms": elapsed_ms,
                "cached": get_phrase_hash(clean_sentence_for_tts(sentence)) in phrase_cache,
            })

            yield f"data: {event_data}\n\n"

        yield "data: {\"done\": true}\n\n"

    return StreamingResponse(
        generate_events(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )


@app.post("/tts/warmup")
async def warmup_cache(req: WarmupRequest):
    """
    Pre-synthesize common phrases into cache for instant playback (<100ms).
    Call this once after server startup or when idle.
    """
    if tts_model is None or gpt_cond_latent is None:
        raise HTTPException(status_code=503, detail="XTTS-v2 model is still loading")

    results = []
    loop = asyncio.get_event_loop()
    for phrase in req.phrases:
        start_t = time.time()
        cache_key = get_phrase_hash(clean_sentence_for_tts(phrase))
        
        if cache_key in phrase_cache:
            results.append({"phrase": phrase, "status": "already_cached", "ms": 0})
            continue

        await loop.run_in_executor(
            executor,
            synthesize_single_sentence,
            phrase, 1.13, 0.65, 3.5, 50, 0.70, False,
        )
        
        elapsed = int((time.time() - start_t) * 1000)
        results.append({"phrase": phrase, "status": "cached", "ms": elapsed})

    return {"cached_total": len(phrase_cache), "results": results}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8002)
