# voice/stt.py
import tempfile
import os

_model = None

def get_whisper():
    global _model
    if _model is None:
        from faster_whisper import WhisperModel
        # tiny model = 75MB, fast, good enough for BI queries
        _model = WhisperModel("tiny", device="cpu", compute_type="int8")
    return _model

def transcribe(audio_bytes: bytes, language="en") -> str:
    model = get_whisper()
    with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as f:
        f.write(audio_bytes)
        tmp_path = f.name
    try:
        segments, _ = model.transcribe(tmp_path, language=language)
        return " ".join(seg.text for seg in segments).strip()
    finally:
        os.unlink(tmp_path)