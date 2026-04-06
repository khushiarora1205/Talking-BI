# agents/schema_agent.py
import json
from db.universal import run_query, get_dialect
from rag.chroma import get_collection
from rag.embedder import embed_text

# ── Dialect-specific schema SQL ───────────────────────────────────

PG_COLUMNS_SQL = """
SELECT
    c.table_name,
    c.column_name,
    c.data_type,
    c.is_nullable,
    CASE WHEN pk.column_name IS NOT NULL THEN true ELSE false END AS is_primary_key
FROM information_schema.columns c
LEFT JOIN (
    SELECT ku.table_name, ku.column_name
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage ku
        ON tc.constraint_name = ku.constraint_name
        AND tc.table_schema = ku.table_schema
    WHERE tc.constraint_type = 'PRIMARY KEY' AND tc.table_schema = 'public'
) pk ON pk.table_name = c.table_name AND pk.column_name = c.column_name
WHERE c.table_schema = 'public'
ORDER BY c.table_name, c.ordinal_position;
"""

PG_FK_SQL = """
SELECT kcu.table_name AS from_table, kcu.column_name AS from_column,
       ccu.table_name AS to_table, ccu.column_name AS to_column
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu
    ON tc.constraint_name = kcu.constraint_name AND kcu.table_schema = 'public'
JOIN information_schema.constraint_column_usage ccu
    ON ccu.constraint_name = tc.constraint_name AND ccu.table_schema = 'public'
WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_schema = 'public';
"""

PG_VIEWS_SQL = "SELECT table_name FROM information_schema.views WHERE table_schema = 'public';"

MYSQL_COLUMNS_SQL = """
SELECT TABLE_NAME as table_name, COLUMN_NAME as column_name,
       DATA_TYPE as data_type,
       IS_NULLABLE as is_nullable,
       CASE WHEN COLUMN_KEY = 'PRI' THEN 1 ELSE 0 END as is_primary_key
FROM information_schema.COLUMNS
WHERE TABLE_SCHEMA = DATABASE()
ORDER BY TABLE_NAME, ORDINAL_POSITION;
"""

MYSQL_FK_SQL = """
SELECT TABLE_NAME as from_table, COLUMN_NAME as from_column,
       REFERENCED_TABLE_NAME as to_table, REFERENCED_COLUMN_NAME as to_column
FROM information_schema.KEY_COLUMN_USAGE
WHERE TABLE_SCHEMA = DATABASE() AND REFERENCED_TABLE_NAME IS NOT NULL;
"""

SQLITE_TABLES_SQL = "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%';"


async def _get_sqlite_schema() -> dict:
    """Special handler for SQLite which has per-table PRAGMA."""
    tables_rows = await run_query(SQLITE_TABLES_SQL)
    schema = {}
    for row in tables_rows:
        tname = row['name']
        schema[tname] = {'columns': [], 'foreign_keys': [], 'sample_values': {}, 'is_view': False}
        col_rows = await run_query(f'PRAGMA table_info("{tname}")')
        for c in col_rows:
            schema[tname]['columns'].append({
                'name': c['name'], 'type': c['type'] or 'text',
                'nullable': not c['notnull'], 'is_pk': bool(c['pk']),
            })
        fk_rows = await run_query(f'PRAGMA foreign_key_list("{tname}")')
        for fk in fk_rows:
            schema[tname]['foreign_keys'].append(
                f"{fk['from']} -> {fk['table']}.{fk['to']}"
            )
    return schema


async def _get_sample_values(table: str, column: str, dtype: str) -> list:
    skip = {'bytea', 'json', 'jsonb', 'blob', 'binary', 'varbinary', 'longblob'}
    if any(s in dtype.lower() for s in skip):
        return []
    try:
        rows = await run_query(
            f'SELECT DISTINCT "{column}" FROM "{table}" WHERE "{column}" IS NOT NULL LIMIT 5'
        )
        return [str(r[column]) for r in rows if r[column] is not None]
    except Exception:
        return []


async def explore_schema(sample_values: bool = True) -> dict:
    dialect = get_dialect()

    if dialect == 'sqlite':
        schema = await _get_sqlite_schema()
    else:
        col_sql = PG_COLUMNS_SQL if dialect == 'postgresql' else MYSQL_COLUMNS_SQL
        fk_sql  = PG_FK_SQL      if dialect == 'postgresql' else MYSQL_FK_SQL

        col_rows = await run_query(col_sql)
        fk_rows  = await run_query(fk_sql)
        view_names = set()

        if dialect == 'postgresql':
            view_rows  = await run_query(PG_VIEWS_SQL)
            view_names = {r['table_name'] for r in view_rows}

        schema = {}
        for r in col_rows:
            t = r['table_name']
            if t not in schema:
                schema[t] = {'columns': [], 'foreign_keys': [],
                             'sample_values': {}, 'is_view': t in view_names}
            schema[t]['columns'].append({
                'name': r['column_name'], 'type': r['data_type'],
                'nullable': str(r.get('is_nullable', 'YES')).upper() == 'YES',
                'is_pk': bool(r.get('is_primary_key', False)),
            })

        for fk in fk_rows:
            t = fk['from_table']
            if t in schema:
                schema[t]['foreign_keys'].append(
                    f"{fk['from_column']} -> {fk['to_table']}.{fk['to_column']}"
                )

    # Sample values for text/categorical columns
    if sample_values:
        for table, info in schema.items():
            if info.get('is_view'):
                continue
            for col in info['columns']:
                dtype = col['type'].lower()
                if any(t in dtype for t in ('char', 'text', 'enum', 'bool', 'varchar')):
                    samples = await _get_sample_values(table, col['name'], dtype)
                    if samples:
                        info['sample_values'][col['name']] = samples

    # Embed into ChromaDB
    try:
        collection = get_collection('schema')
        for table, info in schema.items():
            col_parts = []
            for c in info['columns']:
                pk_tag = ' [PK]' if c['is_pk'] else ''
                samples = info['sample_values'].get(c['name'], [])
                s_tag = f" (e.g. {', '.join(samples[:3])})" if samples else ''
                col_parts.append(f"{c['name']} {c['type']}{pk_tag}{s_tag}")
            fk_text = (' | FK: ' + '; '.join(info['foreign_keys'])) if info['foreign_keys'] else ''
            doc = f"Table {table}: {', '.join(col_parts)}{fk_text}"
            collection.upsert(ids=[table], embeddings=[embed_text(doc)],
                              documents=[doc],
                              metadatas=[{'table': table, 'is_view': str(info.get('is_view', False))}])
    except Exception as e:
        print(f"ChromaDB embed warning: {e}")

    print(f"Schema loaded ({dialect}): {list(schema.keys())}")
    return schema


def build_schema_context(schema: dict, relevant_tables: list = None) -> str:
    tables = relevant_tables if relevant_tables else list(schema.keys())
    lines = []
    for table in tables:
        if table not in schema:
            continue
        info = schema[table]
        view_tag = ' [VIEW]' if info.get('is_view') else ''
        lines.append(f"\nTABLE: {table}{view_tag}")
        for col in info['columns']:
            pk_tag   = ' PK'       if col['is_pk']    else ''
            null_tag = ' NULLABLE' if col['nullable']  else ''
            samples  = info['sample_values'].get(col['name'], [])
            s_tag    = f"  -- e.g. {', '.join(repr(s) for s in samples[:4])}" if samples else ''
            lines.append(f"  {col['name']}  {col['type']}{pk_tag}{null_tag}{s_tag}")
        if info.get('foreign_keys'):
            lines.append(f"  -- FK: {'; '.join(info['foreign_keys'])}")
    return '\n'.join(lines)


def get_relevant_tables(question: str, schema: dict, top_k: int = 6) -> list:
    try:
        collection = get_collection('schema')
        q_emb = embed_text(question)
        results = collection.query(
            query_embeddings=[q_emb],
            n_results=min(top_k, max(1, len(schema))),
        )
        return results['ids'][0] if results['ids'] else list(schema.keys())
    except Exception:
        return list(schema.keys())