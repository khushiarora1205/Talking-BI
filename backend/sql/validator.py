# sql/validator.py
import sqlglot

def is_safe_sql(sql: str) -> tuple:
    blocked = ["insert", "update", "delete", "drop", "create", "alter", "truncate"]
    lower = sql.lower().strip()
    for kw in blocked:
        if lower.startswith(kw) or f" {kw} " in lower:
            return False, f"'{kw}' not allowed"
    try:
        sqlglot.parse_one(sql, dialect="postgres")
        return True, "ok"
    except Exception as e:
        return False, str(e)