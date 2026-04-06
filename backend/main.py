# backend/main.py
from fastapi import FastAPI, UploadFile, File, Header, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse, RedirectResponse
import io
import config
import tempfile, os, io

app = FastAPI(title="Talking BI")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[config.FRONTEND_URL],
    allow_methods=["*"],
    allow_headers=["*"],
)

_schema_cache: dict = {}
_db_ready: bool = False


# ── AUTH HELPERS ──────────────────────────────────────────────────

def _get_current_user(authorization: str = None) -> dict:
    """Extract and verify user from Authorization header. Returns user dict."""
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Not authenticated")
    token = authorization.split(" ", 1)[1]
    try:
        from auth import verify_session_token
        return verify_session_token(token)
    except Exception as e:
        raise HTTPException(status_code=401, detail=str(e))


# ── AUTH ROUTES ───────────────────────────────────────────────────

@app.get("/auth/google")
async def auth_google():
    """Redirect browser to Google OAuth consent screen."""
    from auth import get_google_auth_url
    return RedirectResponse(url=get_google_auth_url())


@app.get("/auth/callback")
async def auth_callback(code: str = None, error: str = None):
    if error or not code:
        return RedirectResponse(
            url=f"{config.FRONTEND_URL}?auth_error={error or 'cancelled'}"
        )
    try:
        from auth import exchange_code_for_token, get_google_user, create_session_token
        token_data = exchange_code_for_token(code)
        user       = get_google_user(token_data["access_token"])

        # ── Session tracking (non-fatal) ──────────────────────────
        session_id = None
        try:
            from services.session_tracker import track_login
            tracking   = await track_login(
                name  = user.get("name", ""),
                email = user.get("email", ""),
            )
            session_id = tracking.get("session_id")   # top-level key
        except Exception as te:
            print(f"Session tracking warning (non-fatal): {te}")
        # ─────────────────────────────────────────────────────────

        session_jwt = create_session_token(user, session_id=session_id)
        return RedirectResponse(
            url=f"{config.FRONTEND_URL}/auth?token={session_jwt}"
        )
    except Exception as e:
        return RedirectResponse(
            url=f"{config.FRONTEND_URL}?auth_error={str(e)}"
        )


@app.get("/auth/me")
async def auth_me(authorization: str = Header(default=None)):
    """Return current user info from JWT."""
    user = _get_current_user(authorization)
    return {
        "email":   user["email"],
        "name":    user["name"],
        "picture": user["picture"],
    }


@app.post("/auth/logout")
async def auth_logout(authorization: str = Header(default=None)):
    """Logout and deactivate session."""
    try:
        user = _get_current_user(authorization)
        session_id = user.get("session_id")
        if session_id:
            from services.session_tracker import logout_session
            await logout_session(session_id)
    except Exception as e:
        print(f"Logout tracking: {e}")
    return {"success": True}
# ── HEALTH ────────────────────────────────────────────────────────

@app.get("/health")
async def health():
    return {
        "status":        "ok",
        "db_connected":  _db_ready,
        "schema_tables": list(_schema_cache.keys()),
    }


# ── DB CONNECT ────────────────────────────────────────────────────

# @app.post("/connect")
# async def connect_db(
#     payload: dict,
#     authorization: str = Header(default=None)
# ):
#     _get_current_user(authorization)   # must be logged in

#     global _schema_cache, _db_ready

#     db_url = payload.get("database_url", "").strip()
#     if not db_url:
#         return {"success": False, "error": "No database URL provided"}

#     if not db_url.startswith(("postgresql://", "postgres://")):
#         return {"success": False,
#                 "error": "URL must start with postgresql:// or postgres://"}

#     config.DATABASE_URL = db_url

#     from db.supabase import reset_pool
#     await reset_pool()

#     from rag.chroma import reset_all_collections
#     reset_all_collections()

#     try:
#         from agents.schema_agent import explore_schema
#         _schema_cache = await explore_schema(sample_values=True)
#         _db_ready = True
#         tables = [t for t in _schema_cache if not _schema_cache[t]["is_view"]]
#         views  = [t for t in _schema_cache if _schema_cache[t]["is_view"]]
#         return {"success": True, "tables": tables,
#                 "views": views, "total": len(_schema_cache)}
#     except Exception as e:
#         _schema_cache = {}
#         _db_ready = False
#         err = str(e)
#         if "nodename nor servname" in err or "Name or service" in err:
#             hint = ("Cannot reach host. Connection string may be incomplete. "
#                     "Go to Supabase → Settings → Database → URI and copy the full string.")
#         elif "password authentication" in err:
#             hint = "Wrong password. Check the password in your connection string."
#         elif "SSL" in err or "ssl" in err:
#             hint = "SSL error. Ensure your URL ends with ?sslmode=require"
#         elif "timeout" in err.lower():
#             hint = "Connection timed out. Check your network."
#         else:
#             hint = err
#         return {"success": False, "error": hint}

@app.post("/connect")
async def connect_db(
    payload: dict,
    authorization: str = Header(default=None)
):
    _get_current_user(authorization)   # must be logged in

    global _schema_cache, _db_ready

    db_url = payload.get("database_url", "").strip()
    if not db_url:
        return {"success": False, "error": "No database URL provided"}

    if not db_url.startswith(("postgresql://", "postgres://")):
        return {"success": False,
                "error": "URL must start with postgresql:// or postgres://"}

    config.DATABASE_URL = db_url
    print(f"🔗 Attempting to connect to: {db_url[:50]}...")

    from db.supabase import reset_pool, init_pool  # ADD init_pool import
    await reset_pool()
    await init_pool(db_url)  # ADD THIS LINE - Initialize with new URL

    from rag.chroma import reset_all_collections
    reset_all_collections()

    try:
        from agents.schema_agent import explore_schema
        _schema_cache = await explore_schema(sample_values=True)
        _db_ready = True
        tables = [t for t in _schema_cache if not _schema_cache[t]["is_view"]]
        views  = [t for t in _schema_cache if _schema_cache[t]["is_view"]]
        print(f"✅ Connected! Found {len(tables)} tables, {len(views)} views")
        return {"success": True, "tables": tables,
                "views": views, "total": len(_schema_cache)}
    except Exception as e:
        _schema_cache = {}
        _db_ready = False
        err = str(e)
        print(f"❌ CONNECTION ERROR: {err}")
        print(f"📋 Full exception: {type(e).__name__}: {e}")
        
        if "nodename nor servname" in err or "Name or service" in err:
            hint = ("Cannot reach host. Connection string may be incomplete. "
                    "Go to Supabase → Settings → Database → URI and copy the full string.")
        elif "password authentication" in err:
            hint = "Wrong password. Check the password in your connection string."
        elif "SSL" in err or "ssl" in err:
            hint = "SSL error. Ensure your URL ends with ?sslmode=require"
        elif "timeout" in err.lower():
            hint = "Connection timed out. Check your network."
        else:
            hint = err
        return {"success": False, "error": hint}
@app.post("/upload-csv")
async def upload_csv(
    files: list[UploadFile] = File(...),
    authorization: str = Header(default=None)
):
    """
    Fallback: user uploads one or more CSV files.
    Creates an in-memory SQLite DB, loads CSVs as tables, explores schema.
    """
    _get_current_user(authorization)
    global _schema_cache, _db_ready

    import pandas as pd
    import sqlite3, re

    # Create a temp SQLite file
    tmp = tempfile.NamedTemporaryFile(suffix='.sqlite3', delete=False)
    tmp.close()
    sqlite_path = tmp.name

    try:
        conn = sqlite3.connect(sqlite_path)
        table_names = []

        for f in files:
            raw = await f.read()
            # Try common encodings
            for enc in ('utf-8', 'utf-8-sig', 'latin-1', 'cp1252'):
                try:
                    df = pd.read_csv(io.BytesIO(raw), encoding=enc)
                    break
                except Exception:
                    continue

            # Sanitize table name from filename
            tname = re.sub(r'[^a-zA-Z0-9_]', '_', f.filename.replace('.csv', ''))
            tname = re.sub(r'_+', '_', tname).strip('_').lower() or 'uploaded_data'

            df.to_sql(tname, conn, if_exists='replace', index=False)
            table_names.append(tname)

        conn.close()

        # Point the universal driver at this SQLite file
        from db.universal import init_pool, reset_pool
        from rag.chroma import reset_all_collections

        await reset_pool()
        reset_all_collections()
        config.DATABASE_URL = f"sqlite:///{sqlite_path}"
        await init_pool(config.DATABASE_URL)

        from agents.schema_agent import explore_schema
        _schema_cache = await explore_schema(sample_values=True)
        _db_ready = True

        tables = list(_schema_cache.keys())
        return {
            'success': True,
            'tables': tables,
            'source': 'csv',
            'message': f"Loaded {len(files)} CSV file(s) as tables: {', '.join(table_names)}"
        }

    except Exception as e:
        _db_ready = False
        return {'success': False, 'error': str(e)}

# ── STARTUP ───────────────────────────────────────────────────────

@app.on_event("startup")
async def startup():
    global _schema_cache, _db_ready

    # ── Verify auth DB connection at startup ──────────────────────
    if config.AUTH_DB_URL:
        try:
            from db.auth_db import get_auth_pool
            await get_auth_pool()   # This triggers pool creation + prints success message
        except Exception as e:
            print(f'⚠️  Auth DB connection failed at startup: {e}')
            print('   Session tracking will not work until AUTH_DB_URL is fixed in .env')
    else:
        print('⚠️  AUTH_DB_URL not set — session tracking disabled')

    # ── Data DB startup (existing logic, unchanged) ───────────────
    if config.DATABASE_URL:
        try:
            from db.universal import init_pool
            from rag.chroma import reset_all_collections
            reset_all_collections()
            await init_pool(config.DATABASE_URL)
            from agents.schema_agent import explore_schema
            _schema_cache = await explore_schema(sample_values=True)
            _db_ready = True
            print(f'Schema loaded: {list(_schema_cache.keys())}')
        except Exception as e:
            print(f'Startup DB warning: {e}')
            _schema_cache = {}
            _db_ready = False
    else:
        _schema_cache = {}
        _db_ready = False

# ── VOICE ─────────────────────────────────────────────────────────

@app.post("/voice/transcribe")
async def transcribe_audio(
    file: UploadFile = File(...),
    authorization: str = Header(default=None)
):
    _get_current_user(authorization)
    from voice.stt import transcribe
    audio_bytes = await file.read()
    return {"text": transcribe(audio_bytes)}


@app.post("/voice/speak")
async def speak_text(
    payload: dict,
    authorization: str = Header(default=None)
):
    _get_current_user(authorization)
    from voice.tts import synthesise
    text = payload.get("text", "").strip()
    if not text:
        return {"error": "No text provided"}
    audio_bytes = synthesise(text)
    if not audio_bytes:
        return {"error": "TTS unavailable"}
    return StreamingResponse(io.BytesIO(audio_bytes), media_type="audio/wav")


# ── TITLE GENERATION ──────────────────────────────────────────────

def _generate_title(question: str) -> str:
    """Ask Groq to turn a user question into a clean dashboard title."""
    try:
        from groq import Groq
        client = Groq(api_key=config.GROQ_API_KEY)
        resp = client.chat.completions.create(
            model=config.GROQ_MODEL,
            messages=[{
                "role": "user",
                "content": (
                    f"Convert this user question into a short, clean dashboard title "
                    f"(max 7 words, Title Case, no quotes, no punctuation at end):\n\n"
                    f"Question: {question}\n\nTitle:"
                )
            }],
            temperature=0,
            max_tokens=30,
        )
        title = resp.choices[0].message.content.strip().strip('"\'')
        return title if title else question[:60]
    except Exception:
        # Fallback: capitalise first letter of each word
        return " ".join(w.capitalize() for w in question.split()[:7])


# ── QUERY ─────────────────────────────────────────────────────────

@app.post("/query")
async def handle_query(
    payload: dict,
    authorization: str = Header(default=None)
):
    _get_current_user(authorization)

    if not _db_ready:
        return {"error": "No database connected.", "type": "config_error"}

    from agents.schema_agent  import build_schema_context, get_relevant_tables
    from agents.sql_agent     import generate_sql
    from agents.data_agent    import process_for_chart
    from agents.viz_agent     import build_chart_specs
    from agents.insight_agent import generate_insights
    from agents.rag_agent     import chat
    from db.supabase          import run_query

    question = payload.get("question", "").strip()
    history  = payload.get("history", [])
    if not question:
        return {"error": "Empty question", "type": "input_error"}

    # Generate a clean title
    title = _generate_title(question)

    relevant_tables = get_relevant_tables(question, _schema_cache, top_k=6)
    schema_context  = build_schema_context(_schema_cache, relevant_tables)
    full_schema_ctx = build_schema_context(_schema_cache)

    try:
        sql_result = await generate_sql(question, schema_context)
    except Exception as e:
        return {"error": f"SQL generation failed: {e}", "type": "sql_error"}

    if not sql_result["valid"]:
        return {
            "error": f"Could not generate valid SQL: {sql_result['error']}",
            "type": "sql_error",
        }

    try:
        rows = await run_query(sql_result["sql"])
    except Exception as e:
        return {"error": f"Query failed: {e}", "type": "db_error"}

    processed = {"data": [], "x_key": None, "y_key": None,
                 "numeric_cols": [], "row_count": 0}
    try:
        processed = process_for_chart(rows)
    except Exception as e:
        print(f"Data processing error: {e}")

    specs = {}
    try:
        specs = build_chart_specs(processed, question)
    except Exception as e:
        print(f"Chart spec error: {e}")

    insights = []
    try:
        insights = generate_insights(
            processed["data"], question,
            processed.get("x_key"), processed.get("y_key"),
        )
    except Exception as e:
        print(f"Insight error: {e}")

    answer = f"Query returned {processed.get('row_count', 0)} rows."
    try:
        answer = chat(question, history, full_schema_ctx)
    except Exception as e:
        print(f"RAG error: {e}")

    return {
        "sql":         sql_result["sql"],
        "chart_specs": specs,
        "insights":    insights,
        "answer":      answer,
        "row_count":   processed.get("row_count", 0),
        "title":       title,
    }