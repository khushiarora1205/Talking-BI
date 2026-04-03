# agents/insight_agent.py
import json
from groq import Groq
from rag.chroma import get_collection
from rag.embedder import embed_text
import config

client = Groq(api_key=config.GROQ_API_KEY)

INSIGHT_PROMPT = """You are a business intelligence analyst.

Analyze this dataset for the question: "{question}"

Data ({row_count} rows total, showing first 25):
{sample}

X axis: {x_key}
Y axis: {y_key}

Generate exactly 4 concise, data-specific insights:
1. The main trend or pattern
2. The highest or lowest value (include the actual number and label)
3. Any anomaly, outlier, or surprising finding
4. A specific, actionable business recommendation

IMPORTANT:
- Reference actual values from the data
- Be specific, not generic
- One sentence each

Return ONLY a JSON array of 4 strings. No markdown, no backticks."""


def generate_insights(data: list, question: str, x_key, y_key) -> list:
    if not data:
        return ['No data available to analyze.']

    sample = json.dumps(data[:25], default=str)
    prompt = INSIGHT_PROMPT.format(
        question=question,
        row_count=len(data),
        sample=sample,
        x_key=x_key or 'unknown',
        y_key=y_key or 'unknown',
    )

    try:
        resp = client.chat.completions.create(
            model=config.GROQ_MODEL,
            messages=[{'role': 'user', 'content': prompt}],
            temperature=0.2,
            max_tokens=500,
        )
        raw = resp.choices[0].message.content.strip()
        if '```' in raw:
            raw = raw.split('```')[1]
            if raw.startswith('json'):
                raw = raw[4:]
        insights = json.loads(raw.strip())
        if not isinstance(insights, list):
            raise ValueError('Not a list')
    except Exception as e:
        print(f'Insight generation error: {e}')
        insights = [f'Analysis of {len(data)} rows returned for: {question}']

    # Store in ChromaDB for RAG — tag with question for retrieval
    try:
        collection = get_collection('insights')
        for i, insight in enumerate(insights):
            doc_id = f"{abs(hash(question))}_{i}"
            collection.upsert(
                ids=[doc_id],
                embeddings=[embed_text(insight)],
                documents=[insight],
                metadatas=[{'question': question[:100], 'index': str(i)}],
            )
    except Exception as e:
        print(f'ChromaDB insight store warning: {e}')

    return insights