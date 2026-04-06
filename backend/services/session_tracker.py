# services/session_tracker.py
"""
Session tracking service for talking-bi-auth database.
Uses db/auth_db.py — a dedicated connection SEPARATE from the data DB.

Tables used (in talking-bi-auth Supabase project):
  - users          (userid, name, email, last_login, is_active, active_sessions)
  - login_sessions (session_id, user_id, is_active, login_time)
"""
import uuid
from datetime import datetime, timezone
from db.auth_db import auth_query, auth_execute


# ── Internal helpers ──────────────────────────────────────────────

async def _get_user_by_email(email: str) -> dict | None:
    rows = await auth_query(
        'SELECT * FROM users WHERE email = $1 LIMIT 1',
        email
    )
    return rows[0] if rows else None


async def _create_user(name: str, email: str) -> dict:
    now = datetime.now(timezone.utc)
    rows = await auth_query(
        '''
        INSERT INTO users (name, email, last_login, is_active, active_sessions)
        VALUES ($1, $2, $3, true, 0)
        RETURNING *
        ''',
        name, email, now
    )
    print(f'✅ Created new user: {email}')
    return rows[0]


async def _update_last_login(user_id: str) -> None:
    now = datetime.now(timezone.utc)
    await auth_execute(
        'UPDATE users SET last_login = $1 WHERE userid = $2',
        now, uuid.UUID(str(user_id))
    )


async def _update_active_sessions_count(user_id: str) -> int:
    """Recount active sessions from login_sessions and update users table."""
    rows = await auth_query(
        'SELECT COUNT(*) AS cnt FROM login_sessions WHERE user_id = $1 AND is_active = true',
        uuid.UUID(str(user_id))
    )
    count = int(rows[0]['cnt']) if rows else 0
    await auth_execute(
        'UPDATE users SET active_sessions = $1 WHERE userid = $2',
        count, uuid.UUID(str(user_id))
    )
    return count


async def _deactivate_oldest_session(user_id: str) -> None:
    """Deactivate the oldest active session when limit is exceeded."""
    rows = await auth_query(
        '''
        SELECT session_id FROM login_sessions
        WHERE user_id = $1 AND is_active = true
        ORDER BY login_time ASC
        LIMIT 1
        ''',
        uuid.UUID(str(user_id))
    )
    if rows:
        oldest_id = rows[0]['session_id']
        await auth_execute(
            'UPDATE login_sessions SET is_active = false WHERE session_id = $1',
            oldest_id
        )
        print(f'⚠️  Deactivated oldest session {oldest_id} (limit reached)')


async def _count_active_sessions(user_id: str) -> int:
    rows = await auth_query(
        'SELECT COUNT(*) AS cnt FROM login_sessions WHERE user_id = $1 AND is_active = true',
        uuid.UUID(str(user_id))
    )
    return int(rows[0]['cnt']) if rows else 0


# ── Public API ────────────────────────────────────────────────────

async def get_or_create_user(name: str, email: str) -> dict:
    """Find user by email. Create if not found. Always update last_login."""
    user = await _get_user_by_email(email)
    if user:
        await _update_last_login(str(user['userid']))
        print(f'🔄 Returning user: {email}')
        return dict(user)
    else:
        return await _create_user(name, email)


async def enforce_session_limit(user_id: str, max_sessions: int = 2) -> None:
    """Deactivate oldest session(s) until active count is below max_sessions."""
    while True:
        count = await _count_active_sessions(user_id)
        if count < max_sessions:
            break
        await _deactivate_oldest_session(user_id)


async def create_session(user_id: str) -> dict:
    """Enforce limit, then insert a new active session. Returns session dict."""
    # 1. Enforce max 2 active sessions
    await enforce_session_limit(user_id, max_sessions=2)

    # 2. Insert new session
    now = datetime.now(timezone.utc)
    rows = await auth_query(
        '''
        INSERT INTO login_sessions (user_id, is_active, login_time)
        VALUES ($1, true, $2)
        RETURNING *
        ''',
        uuid.UUID(str(user_id)), now
    )
    session = dict(rows[0])

    # 3. Update count on users table
    count = await _update_active_sessions_count(user_id)
    print(f'✅ New session created for user {user_id} (active sessions: {count})')

    return session


async def track_login(name: str, email: str) -> dict:
    """
    MAIN ENTRY POINT — called from main.py after get_google_user().
    Returns: {'user': {...}, 'session': {...}, 'session_id': str}
    """
    try:
        user    = await get_or_create_user(name, email)
        session = await create_session(str(user['userid']))

        session_id = str(session['session_id'])
        print(f'✅ Login tracked: {email} → session {session_id}')

        return {
            'success':    True,
            'user':       user,
            'session':    session,
            'session_id': session_id,
        }
    except Exception as e:
        import traceback
        print(f'❌ track_login FAILED: {type(e).__name__}: {e}')
        traceback.print_exc()
        # Return a fallback session_id so JWT can still be issued
        return {
            'success':    False,
            'session_id': str(uuid.uuid4()),
            'error':      str(e),
        }


async def logout_session(session_id: str) -> dict:
    """Mark a session as inactive and update the user's active_sessions count."""
    try:
        # Get user_id first so we can update count
        rows = await auth_query(
            'SELECT user_id FROM login_sessions WHERE session_id = $1',
            uuid.UUID(str(session_id))
        )
        if not rows:
            return {'success': False, 'error': 'Session not found'}

        user_id = str(rows[0]['user_id'])

        # Deactivate session
        await auth_execute(
            'UPDATE login_sessions SET is_active = false WHERE session_id = $1',
            uuid.UUID(str(session_id))
        )

        # Update count
        count = await _update_active_sessions_count(user_id)
        print(f'✅ Logged out session {session_id} (remaining active: {count})')
        return {'success': True}

    except Exception as e:
        print(f'⚠️ logout_session failed: {e}')
        return {'success': False, 'error': str(e)}