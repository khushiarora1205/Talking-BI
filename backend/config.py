# backend/config.py
import os
from dotenv import load_dotenv

load_dotenv()

GROQ_API_KEY         = os.getenv("GROQ_API_KEY")
DATABASE_URL         = os.getenv("DATABASE_URL", "")
CHROMA_PATH          = os.getenv("CHROMA_PATH", "./chroma_db")
GROQ_MODEL           = os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile")
EMBEDDING_MODEL      = os.getenv("EMBEDDING_MODEL", "sentence-transformers/all-MiniLM-L6-v2")
GOOGLE_CLIENT_ID     = os.getenv("GOOGLE_CLIENT_ID", "")
GOOGLE_CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET", "")
GOOGLE_REDIRECT_URI  = os.getenv("GOOGLE_REDIRECT_URI", "http://localhost:8000/auth/callback")
JWT_SECRET           = os.getenv("JWT_SECRET", "change-me-in-production")
FRONTEND_URL         = os.getenv("FRONTEND_URL", "http://localhost:5173")
AUTH_DB_URL          = os.getenv("AUTH_DB_URL", "")