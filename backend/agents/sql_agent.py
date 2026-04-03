# agents/sql_agent.py
import re
import sqlglot
from groq import Groq
import config

client = Groq(api_key=config.GROQ_API_KEY)

SYSTEM_PROMPT = """You are an expert PostgreSQL data analyst.

Given a database schema and a natural language question, write ONE valid PostgreSQL SELECT query.

STRICT RULES:
1. Only SELECT statements. Never INSERT, UPDATE, DELETE, DROP, CREATE, ALTER, TRUNCATE.
2. Always quote identifiers with double quotes: "table_name"."column_name"
3. Use table aliases for readability.
4. If joining tables, use the foreign key relationships shown in the schema.
5. For aggregations, always include a GROUP BY.
6. Return ONLY the raw SQL — no markdown, no backticks, no explanation.
7. If the question cannot be answered with the given schema, return: SELECT 'insufficient schema' AS error;
"""

def _clean_sql(raw: str) -> str:
    """Strip markdown fences and whitespace from LLM output."""
    raw = raw.strip()
    # Remove ```sql ... ``` or ``` ... ```
    raw = re.sub(r'^```(?:sql)?\s*', '', raw, flags=re.IGNORECASE)
    raw = re.sub(r'\s*```$', '', raw)
    return raw.strip()

def _validate_sql(sql: str) -> tuple[bool, str]:
    """Block write operations and validate syntax."""
    lower = sql.lower()
    blocked = ['insert ', 'update ', 'delete ', 'drop ', 'create ',
               'alter ', 'truncate ', 'grant ', 'revoke ']
    for kw in blocked:
        if kw in lower:
            return False, f"Blocked keyword '{kw.strip()}' detected"
    try:
        sqlglot.parse_one(sql, dialect='postgres')
        return True, 'ok'
    except Exception as e:
        return False, str(e)

async def generate_sql(
    question: str,
    schema_context: str,
    attempt: int = 1,
    previous_error: str = None,
) -> dict:
    """
    Generate a validated PostgreSQL SELECT query from a natural language question.
    Retries up to 3 times with error feedback on failure.
    """
    error_section = ''
    if previous_error:
        error_section = f"\n\nPREVIOUS ATTEMPT FAILED WITH ERROR:\n{previous_error}\nPlease fix the query."

    user_prompt = f"""DATABASE SCHEMA:
{schema_context}

QUESTION: {question}{error_section}

SQL:"""

    try:
        response = client.chat.completions.create(
            model=config.GROQ_MODEL,
            messages=[
                {'role': 'system', 'content': SYSTEM_PROMPT},
                {'role': 'user',   'content': user_prompt},
            ],
            temperature=0.0,
            max_tokens=1024,
        )
        sql = _clean_sql(response.choices[0].message.content)
        valid, error = _validate_sql(sql)

        if not valid and attempt < 3:
            return await generate_sql(
                question, schema_context,
                attempt=attempt + 1,
                previous_error=f"Syntax/validation error: {error}\nBad SQL was:\n{sql}",
            )

        return {
            'sql':      sql,
            'valid':    valid,
            'error':    error if not valid else None,
            'attempts': attempt,
        }

    except Exception as e:
        return {
            'sql':      '',
            'valid':    False,
            'error':    str(e),
            'attempts': attempt,
        }