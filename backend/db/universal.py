# db/universal.py
"""
Universal async database driver.
Supports: PostgreSQL/Supabase, MySQL, SQLite
Detects dialect from connection string and routes accordingly.
"""
import re
import os
import asyncio
from typing import List, Dict, Any
import config

_pool = None
_dialect = None   # 'postgresql' | 'mysql' | 'sqlite'
_sqlite_path = None


def detect_dialect(url: str) -> str:
    url = url.strip().lower()
    if url.startswith(('postgresql://', 'postgres://')):
        return 'postgresql'
    if url.startswith(('mysql://', 'mysql+aiomysql://')):
        return 'mysql'
    if url.startswith(('sqlite://', 'sqlite+aiosqlite://')):
        return 'sqlite'
    if url.endswith('.db') or url.endswith('.sqlite') or url.endswith('.sqlite3'):
        return 'sqlite'
    raise ValueError(
        f"Unsupported connection string format.\n"
        f"Supported: postgresql://, mysql://, sqlite://\n"
        f"Got: {url[:60]}"
    )


# ── PostgreSQL ────────────────────────────────────────────────────
def _parse_pg_url(url: str):
    """Parse PostgreSQL URL, handling @ in passwords."""
    import ssl as ssl_lib
    import urllib.parse

    url = url.strip()
    scheme = 'postgresql'
    rest = url[len('postgresql://'):]  if url.startswith('postgresql://') else url[len('postgres://'):]

    query_str = ''
    if '?' in rest:
        rest, query_str = rest.rsplit('?', 1)

    if '/' in rest:
        host_part, dbname = rest.rsplit('/', 1)
    else:
        host_part, dbname = rest, 'postgres'

    last_at = host_part.rfind('@')
    if last_at == -1:
        raise ValueError('No @ in PostgreSQL URL')

    creds = host_part[:last_at]
    host_port = host_part[last_at+1:]

    username, password = (creds.split(':', 1) if ':' in creds else (creds, ''))
    host, port = (host_port.rsplit(':', 1) if ':' in host_port else (host_port, '5432'))
    try:
        port = int(port)
    except ValueError:
        port = 5432

    params = urllib.parse.parse_qs(query_str)
    sslmode = params.get('sslmode', [''])[0]
    extra = {}
    if sslmode in ('require', 'verify-ca', 'verify-full'):
        ctx = ssl_lib.create_default_context()
        ctx.check_hostname = False
        ctx.verify_mode = ssl_lib.CERT_NONE
        extra['ssl'] = ctx

    return dict(host=host, port=port, user=username,
                password=password, database=dbname, **extra)


async def _init_postgresql(url: str):
    import asyncpg
    kwargs = _parse_pg_url(url)
    return await asyncpg.create_pool(
        min_size=1, max_size=10, statement_cache_size=0, **kwargs
    )


async def _run_postgresql(pool, sql: str) -> List[Dict]:
    async with pool.acquire() as conn:
        rows = await conn.fetch(sql)
        return [dict(r) for r in rows]


# ── MySQL ─────────────────────────────────────────────────────────
def _parse_mysql_url(url: str):
    """Parse mysql://user:pass@host:port/dbname"""
    import urllib.parse
    url = url.replace('mysql+aiomysql://', 'mysql://')
    parsed = urllib.parse.urlparse(url)
    return dict(
        host=parsed.hostname or 'localhost',
        port=parsed.port or 3306,
        user=parsed.username or 'root',
        password=urllib.parse.unquote(parsed.password or ''),
        db=parsed.path.lstrip('/') or 'mysql',
        autocommit=True,
        charset='utf8mb4',
    )


async def _init_mysql(url: str):
    import aiomysql
    kwargs = _parse_mysql_url(url)
    return await aiomysql.create_pool(minsize=1, maxsize=10, **kwargs)


async def _run_mysql(pool, sql: str) -> List[Dict]:
    async with pool.acquire() as conn:
        async with conn.cursor(aiomysql.DictCursor) as cur:
            await cur.execute(sql)
            return list(await cur.fetchall())


# ── SQLite ────────────────────────────────────────────────────────
def _parse_sqlite_path(url: str) -> str:
    url = url.strip()
    for prefix in ('sqlite+aiosqlite://', 'sqlite:///', 'sqlite://'):
        if url.startswith(prefix):
            return url[len(prefix):]
    # Bare path like /path/to/file.db
    return url


async def _run_sqlite(path: str, sql: str) -> List[Dict]:
    import aiosqlite
    async with aiosqlite.connect(path) as db:
        db.row_factory = aiosqlite.Row
        async with db.execute(sql) as cursor:
            rows = await cursor.fetchall()
            return [dict(row) for row in rows]


# ── PUBLIC API ────────────────────────────────────────────────────
async def init_pool(url: str):
    global _pool, _dialect, _sqlite_path
    dialect = detect_dialect(url)
    _dialect = dialect
    if dialect == 'postgresql':
        _pool = await _init_postgresql(url)
    elif dialect == 'mysql':
        _pool = await _init_mysql(url)
    elif dialect == 'sqlite':
        _sqlite_path = _parse_sqlite_path(url)
        _pool = None   # SQLite is connectionless
    return dialect


async def run_query(sql: str) -> List[Dict]:
    if _dialect == 'postgresql':
        return await _run_postgresql(_pool, sql)
    elif _dialect == 'mysql':
        return await _run_mysql(_pool, sql)
    elif _dialect == 'sqlite':
        return await _run_sqlite(_sqlite_path, sql)
    raise RuntimeError("No database initialised")


async def reset_pool():
    global _pool, _dialect, _sqlite_path
    if _pool is not None:
        try:
            if _dialect == 'postgresql':
                await _pool.close()
            elif _dialect == 'mysql':
                _pool.close()
                await _pool.wait_closed()
        except Exception:
            pass
    _pool = None
    _dialect = None
    _sqlite_path = None


def get_dialect() -> str:
    return _dialect or 'unknown'