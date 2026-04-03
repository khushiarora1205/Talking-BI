# rag/chroma.py
import chromadb
import config

_client = None

def get_client() -> chromadb.ClientAPI:
    global _client
    if _client is None:
        _client = chromadb.PersistentClient(path=config.CHROMA_PATH)
    return _client

def get_collection(name: str):
    return get_client().get_or_create_collection(name)

def reset_all_collections():
    """
    Called on every new DB connection.
    Deletes ALL collections so stale schema/insight embeddings
    from the previous database cannot bleed into the new one.
    """
    client = get_client()
    for col in client.list_collections():
        col_name = col.name if hasattr(col, 'name') else str(col)
        try:
            client.delete_collection(col_name)
        except Exception as e:
            print(f"Warning: could not delete collection '{col_name}': {e}")
    print("ChromaDB: all collections cleared for new database connection.")