# backend/auth.py
import os
import json
import urllib.request
import urllib.parse
from datetime import datetime, timedelta
from jose import jwt, JWTError
from config import (GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET,
                    GOOGLE_REDIRECT_URI, JWT_SECRET, FRONTEND_URL)

GOOGLE_AUTH_URL  = "https://accounts.google.com/o/oauth2/v2/auth"
GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token"
GOOGLE_USER_URL  = "https://www.googleapis.com/oauth2/v3/userinfo"
ALGORITHM        = "HS256"
TOKEN_EXPIRE_HOURS = 24


def get_google_auth_url() -> str:
    params = {
        "client_id":     GOOGLE_CLIENT_ID,
        "redirect_uri":  GOOGLE_REDIRECT_URI,
        "response_type": "code",
        "scope":         "openid email profile",
        "access_type":   "offline",
        "prompt":        "select_account",
    }
    return f"{GOOGLE_AUTH_URL}?{urllib.parse.urlencode(params)}"


def exchange_code_for_token(code: str) -> dict:
    """Exchange OAuth code for Google access token."""
    data = urllib.parse.urlencode({
        "code":          code,
        "client_id":     GOOGLE_CLIENT_ID,
        "client_secret": GOOGLE_CLIENT_SECRET,
        "redirect_uri":  GOOGLE_REDIRECT_URI,
        "grant_type":    "authorization_code",
    }).encode()

    req = urllib.request.Request(GOOGLE_TOKEN_URL, data=data,
                                  method="POST")
    req.add_header("Content-Type", "application/x-www-form-urlencoded")
    with urllib.request.urlopen(req) as resp:
        return json.loads(resp.read())


def get_google_user(access_token: str) -> dict:
    """Fetch Google user profile."""
    req = urllib.request.Request(GOOGLE_USER_URL)
    req.add_header("Authorization", f"Bearer {access_token}")
    with urllib.request.urlopen(req) as resp:
        return json.loads(resp.read())


def create_session_token(user: dict, session_id: str = None) -> str:
    payload = {
        "sub":        user["email"],
        "email":      user["email"],
        "name":       user.get("name", ""),
        "picture":    user.get("picture", ""),
        "session_id": session_id,   # added — used for logout
        "exp":        datetime.utcnow() + timedelta(hours=TOKEN_EXPIRE_HOURS),
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=ALGORITHM)


def verify_session_token(token: str) -> dict:
    """Verify JWT and return user payload. Raises if invalid."""
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[ALGORITHM])
        return payload
    except JWTError as e:
        raise ValueError(f"Invalid session token: {e}")