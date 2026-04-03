# rag/embedder.py
from sentence_transformers import SentenceTransformer
from config import EMBEDDING_MODEL

_model = None

def get_model():
    global _model
    if _model is None:
        _model = SentenceTransformer(EMBEDDING_MODEL)
    return _model

def embed_text(text: str) -> list:
    return get_model().encode(text).tolist()

def embed_batch(texts: list) -> list:
    return get_model().encode(texts).tolist()