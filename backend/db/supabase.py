# db/supabase.py
# Backward-compatible shim — routes through universal driver
from db.universal import run_query, reset_pool, init_pool, get_dialect

__all__ = ['run_query', 'reset_pool', 'init_pool', 'get_dialect']