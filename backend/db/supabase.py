# db/supabase.py
import asyncpg
import ssl
import urllib.parse
import config

_pool = None


def _parse_url(url: str) -> tuple[str, dict]:
    """
    asyncpg does NOT support ?sslmode=require in the URL.
    Strip query params from URL and handle ssl separately.
    Returns (clean_url, extra_kwargs).
    """
    parsed = urllib.parse.urlparse(url)

    # Rebuild URL without query string
    clean = urllib.parse.urlunparse((
        parsed.scheme,
        parsed.netloc,
        parsed.path,
        '', '', ''  # no params, query, fragment
    ))

    extra = {}

    # Handle SSL
    sslmode = urllib.parse.parse_qs(parsed.query).get('sslmode', [''])[0]
    if sslmode in ('require', 'verify-ca', 'verify-full'):
        ctx = ssl.create_default_context()
        ctx.check_hostname = False
        ctx.verify_mode = ssl.CERT_NONE
        extra['ssl'] = ctx
    elif sslmode == 'disable':
        extra['ssl'] = False

    return clean, extra


async def get_pool():
    global _pool
    if _pool is None and config.DATABASE_URL:
        clean_url, ssl_kwargs = _parse_url(config.DATABASE_URL)
        _pool = await asyncpg.create_pool(
            clean_url,
            min_size=1,
            max_size=10,
            statement_cache_size=0,   # required for Supabase PgBouncer
            **ssl_kwargs,
        )
    return _pool


async def run_query(sql: str) -> list:
    pool = await get_pool()
    if not pool:
        raise RuntimeError("No database connection. Use /connect first.")
    async with pool.acquire() as conn:
        rows = await conn.fetch(sql)
        return [dict(r) for r in rows]


async def reset_pool():
    global _pool
    if _pool:
        try:
            await _pool.close()
        except Exception:
            pass
    _pool = None