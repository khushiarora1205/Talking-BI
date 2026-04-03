# agents/rag_agent.py
from groq import Groq
from rag.chroma import get_collection
from rag.embedder import embed_text
import config

client = Groq(api_key=config.GROQ_API_KEY)

RAG_SYSTEM = """You are a business intelligence assistant with access to a live database.

You help users understand their data by answering questions clearly and concisely.

DATABASE SCHEMA (current connection):
{schema}

RETRIEVED CONTEXT (previous insights and analysis):
{context}

RULES:
- Answer based on the schema and retrieved context
- If data was just queried, reference the result in your answer
- Never invent data — if uncertain, say so
- Keep answers concise: 2-4 sentences
- If the user asks about charts or visuals, confirm what was generated"""


def retrieve_context(question: str, top_k: int = 5) -> str:
    try:
        collection = get_collection('insights')
        count = collection.count()
        if count == 0:
            return 'No prior analysis available.'
        q_emb = embed_text(question)
        results = collection.query(
            query_embeddings=[q_emb],
            n_results=min(top_k, count),
        )
        docs = results.get('documents', [[]])[0]
        return '\n'.join(f'- {d}' for d in docs) if docs else 'No prior analysis available.'
    except Exception:
        return 'No prior analysis available.'


def chat(question: str, history: list, schema_context: str) -> str:
    context = retrieve_context(question)
    system  = RAG_SYSTEM.format(schema=schema_context, context=context)

    messages = [{'role': 'system', 'content': system}]
    # Include last 3 conversation turns for context
    for m in history[-6:]:
        if m.get('role') in ('user', 'assistant') and m.get('content'):
            messages.append({'role': m['role'], 'content': m['content']})
    messages.append({'role': 'user', 'content': question})

    try:
        resp = client.chat.completions.create(
            model=config.GROQ_MODEL,
            messages=messages,
            temperature=0.3,
            max_tokens=600,
        )
        return resp.choices[0].message.content
    except Exception as e:
        return f'Could not generate response: {str(e)}'