# db/auth_db.py
"""
Dedicated asyncpg connection pool for talking-bi-auth database.
This is COMPLETELY SEPARATE from the universal driver (db/universal.py)
which connects to the user's data database.

This module ONLY connects to AUTH_DB_URL (talking-bi-auth project).
"""
import ssl
import urllib.parse
import asyncpg
import config

_auth_pool = None


def _parse_auth_url(url: str) -> dict:
    """
    Parse the auth DB URL.
    Handles passwords containing @ by splitting on the LAST @ sign.
    Strips ?sslmode from query and passes ssl= as a separate parameter.
    """
    url = url.strip()

    # Strip scheme
    if url.startswith('postgresql://'):
        rest = url[len('postgresql://'):]
    elif url.startswith('postgres://'):
        rest = url[len('postgres://'):]
    else:
        raise ValueError('AUTH_DB_URL must start with postgresql:// or postgres://')

    # Split off query string
    query_str = ''
    if '?' in rest:
        rest, query_str = rest.rsplit('?', 1)

    # Split off database name
    if '/' in rest:
        host_part, dbname = rest.rsplit('/', 1)
    else:
        host_part, dbname = rest, 'postgres'

    # Split credentials from host on the LAST @ (handles @ in passwords)
    last_at = host_part.rfind('@')
    if last_at == -1:
        raise ValueError('AUTH_DB_URL missing @ separator')

    creds     = host_part[:last_at]
    host_port = host_part[last_at + 1:]

    username, password = creds.split(':', 1) if ':' in creds else (creds, '')
    host, port_str     = host_port.rsplit(':', 1) if ':' in host_port else (host_port, '5432')
    port = int(port_str) if port_str.isdigit() else 5432

    # SSL
    params  = urllib.parse.parse_qs(query_str)
    sslmode = params.get('sslmode', [''])[0]
    extra   = {}
    if sslmode in ('require', 'verify-ca', 'verify-full'):
        ctx = ssl.create_default_context()
        ctx.check_hostname = False
        ctx.verify_mode    = ssl.CERT_NONE
        extra['ssl']       = ctx

    return dict(host=host, port=port, user=username,
                password=password, database=dbname, **extra)


async def get_auth_pool() -> asyncpg.Pool:
    """Get or create the auth DB connection pool. Lazy-initialised."""
    global _auth_pool
    if _auth_pool is None:
        if not config.AUTH_DB_URL:
            raise RuntimeError(
                'AUTH_DB_URL is not set in .env. '
                'Please add the connection string for your talking-bi-auth Supabase project.'
            )
        kwargs = _parse_auth_url(config.AUTH_DB_URL)
        _auth_pool = await asyncpg.create_pool(
            min_size=1,
            max_size=5,
            statement_cache_size=0,   # required for Supabase PgBouncer
            **kwargs,
        )
        print('✅ Auth DB pool initialised (talking-bi-auth)')
    return _auth_pool


async def auth_query(sql: str, *args) -> list:
    """
    Run a query on the auth DB and return list of dicts.
    Use $1, $2, ... placeholders for parameters (asyncpg style).
    """
    pool = await get_auth_pool()
    async with pool.acquire() as conn:
        rows = await conn.fetch(sql, *args)
        return [dict(r) for r in rows]


async def auth_execute(sql: str, *args) -> str:
    """
    Run a write query (INSERT/UPDATE) on the auth DB.
    Returns the status string from asyncpg.
    """
    pool = await get_auth_pool()
    async with pool.acquire() as conn:
        return await conn.execute(sql, *args)


async def close_auth_pool():
    global _auth_pool
    if _auth_pool:
        await _auth_pool.close()
        _auth_pool = None