# db/cache.py
import time

_cache = {}

def set_cache(key: str, value, ttl_seconds=300):
    _cache[key] = {"value": value, "expires": time.time() + ttl_seconds}

def get_cache(key: str):
    entry = _cache.get(key)
    if entry and time.time() < entry["expires"]:
        return entry["value"]
    return None