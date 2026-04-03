# agents/schema_agent.py
import json
from db.supabase import run_query
from rag.chroma import get_collection
from rag.embedder import embed_text

# ── SQL that works on any PostgreSQL / Supabase database ──────────

COLUMNS_SQL = """
SELECT
    c.table_name,
    c.column_name,
    c.data_type,
    c.is_nullable,
    c.column_default,
    CASE WHEN pk.column_name IS NOT NULL THEN true ELSE false END AS is_primary_key
FROM information_schema.columns c
LEFT JOIN (
    SELECT ku.table_name, ku.column_name
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage ku
        ON tc.constraint_name = ku.constraint_name
        AND tc.table_schema = ku.table_schema
    WHERE tc.constraint_type = 'PRIMARY KEY'
      AND tc.table_schema = 'public'
) pk ON pk.table_name = c.table_name AND pk.column_name = c.column_name
WHERE c.table_schema = 'public'
ORDER BY c.table_name, c.ordinal_position;
"""

FK_SQL = """
SELECT
    kcu.table_name        AS from_table,
    kcu.column_name       AS from_column,
    ccu.table_name        AS to_table,
    ccu.column_name       AS to_column
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu
    ON tc.constraint_name = kcu.constraint_name
    AND kcu.table_schema = 'public'
JOIN information_schema.constraint_column_usage ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = 'public'
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_schema = 'public';
"""

VIEWS_SQL = """
SELECT table_name
FROM information_schema.views
WHERE table_schema = 'public';
"""

async def _get_sample_values(table: str, column: str, dtype: str, limit: int = 5) -> list:
    """Fetch a few sample values for a column to help the LLM understand the data."""
    # Only sample text/categorical columns — skip large numeric/timestamp ones
    skip_types = {'bytea', 'json', 'jsonb', 'text'}
    if dtype in skip_types:
        return []
    try:
        rows = await run_query(
            f'SELECT DISTINCT "{column}" FROM "{table}" '
            f'WHERE "{column}" IS NOT NULL LIMIT {limit}'
        )
        return [str(r[column]) for r in rows if r[column] is not None]
    except Exception:
        return []

async def explore_schema(sample_values: bool = True) -> dict:
    """
    Dynamically explores the connected database.
    Returns a schema dict keyed by table name. Each value contains:
      - columns: list of {name, type, nullable, is_pk}
      - foreign_keys: list of "col -> other_table.other_col" strings
      - sample_values: dict of {col_name: [val1, val2, ...]}
      - is_view: bool
    Also embeds each table description into ChromaDB for semantic search.
    """
    col_rows = await run_query(COLUMNS_SQL)
    fk_rows  = await run_query(FK_SQL)
    view_rows = await run_query(VIEWS_SQL)
    view_names = {r['table_name'] for r in view_rows}

    # Build base schema
    schema: dict = {}
    for r in col_rows:
        t = r['table_name']
        if t not in schema:
            schema[t] = {
                'columns': [],
                'foreign_keys': [],
                'sample_values': {},
                'is_view': t in view_names,
            }
        schema[t]['columns'].append({
            'name':     r['column_name'],
            'type':     r['data_type'],
            'nullable': r['is_nullable'] == 'YES',
            'is_pk':    bool(r['is_primary_key']),
        })

    # Attach foreign keys
    for fk in fk_rows:
        t = fk['from_table']
        if t in schema:
            schema[t]['foreign_keys'].append(
                f"{fk['from_column']} -> {fk['to_table']}.{fk['to_column']}"
            )

    # Attach sample values for non-view tables
    if sample_values:
        for table, info in schema.items():
            if info['is_view']:
                continue
            for col in info['columns']:
                dtype = col['type']
                # Sample categorical/text columns only
                if any(t in dtype for t in ('char', 'text', 'enum', 'bool')):
                    samples = await _get_sample_values(table, col['name'], dtype)
                    if samples:
                        info['sample_values'][col['name']] = samples

    # Embed each table into ChromaDB for semantic retrieval
    try:
        collection = get_collection("schema")
        for table, info in schema.items():
            col_parts = []
            for c in info['columns']:
                pk_tag = ' [PK]' if c['is_pk'] else ''
                samples = info['sample_values'].get(c['name'], [])
                sample_tag = f" (e.g. {', '.join(samples[:3])})" if samples else ''
                col_parts.append(f"{c['name']} {c['type']}{pk_tag}{sample_tag}")

            fk_text = ''
            if info['foreign_keys']:
                fk_text = ' | FK: ' + '; '.join(info['foreign_keys'])

            doc = f"Table {table}: {', '.join(col_parts)}{fk_text}"
            embedding = embed_text(doc)
            collection.upsert(
                ids=[table],
                embeddings=[embedding],
                documents=[doc],
                metadatas=[{'table': table, 'is_view': str(info['is_view'])}],
            )
    except Exception as e:
        print(f"ChromaDB schema embed warning: {e}")

    print(f"Schema loaded: {list(schema.keys())}")
    return schema


def build_schema_context(schema: dict, relevant_tables: list = None) -> str:
    """
    Converts the schema dict into a rich text block for LLM prompts.
    If relevant_tables is provided, only includes those tables.
    """
    tables = relevant_tables if relevant_tables else list(schema.keys())
    lines = []
    for table in tables:
        if table not in schema:
            continue
        info = schema[table]
        view_tag = ' [VIEW]' if info['is_view'] else ''
        lines.append(f"\nTABLE: {table}{view_tag}")

        for col in info['columns']:
            pk_tag  = ' PK'       if col['is_pk']    else ''
            null_tag = ' NULLABLE' if col['nullable'] else ''
            samples = info['sample_values'].get(col['name'], [])
            sample_tag = f"  -- e.g. {', '.join(repr(s) for s in samples[:4])}" if samples else ''
            lines.append(f"  {col['name']}  {col['type']}{pk_tag}{null_tag}{sample_tag}")

        if info['foreign_keys']:
            lines.append(f"  -- FK: {'; '.join(info['foreign_keys'])}")

    return '\n'.join(lines)


def get_relevant_tables(question: str, schema: dict, top_k: int = 6) -> list:
    """
    Semantic search over ChromaDB to find the most relevant tables
    for a given natural-language question.
    """
    try:
        from rag.embedder import embed_text
        collection = get_collection("schema")
        q_emb = embed_text(question)
        results = collection.query(
            query_embeddings=[q_emb],
            n_results=min(top_k, len(schema)),
        )
        return results['ids'][0] if results['ids'] else list(schema.keys())
    except Exception:
        return list(schema.keys())