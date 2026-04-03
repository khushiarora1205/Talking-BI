# agents/viz_agent.py
import json
from groq import Groq
import config

client = Groq(api_key=config.GROQ_API_KEY)

# Keys MUST match the THEMES object in frontend App.jsx exactly
THEMES = {
    'minimal':   {'colors': ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899']},
    'executive': {'colors': ['#312E81', '#4338CA', '#6366F1', '#818CF8', '#A5B4FC', '#C7D2FE']},
    'earthy':    {'colors': ['#92400E', '#D97706', '#FBBF24', '#6B7280', '#374151', '#9CA3AF']},
    'vivid':     {'colors': ['#EC4899', '#8B5CF6', '#3B82F6', '#10B981', '#F59E0B', '#EF4444']},
}

CHART_PROMPT = """Given this data sample and question, decide the best chart type and labels.

Data sample (first 5 rows):
{sample}

Column types:
- X axis candidate: {x_key} (text/category)
- Y axis candidate: {y_key} (numeric)
- Total rows: {row_count}

Question: {question}

Rules:
- Use "bar" for comparisons between categories
- Use "line" or "area" for time-series or sequential data
- Use "pie" for part-of-whole (max 8 slices, else use bar)
- Use "scatter" only if both axes are numeric

Return ONLY this JSON (no markdown, no backticks):
{{"chart_type": "bar|line|area|pie|scatter", "title": "...", "x_label": "...", "y_label": "..."}}"""


def build_chart_specs(processed: dict, question: str, intent: str = 'auto') -> dict:
    """
    Generate 4 themed chart specs from processed data.
    Works with any database — no hardcoded table or column names.
    """
    if not processed.get('data'):
        return {t: {'chart_type': 'bar', 'data': [], 'title': question[:60],
                    'x_key': None, 'y_key': None, 'colors': THEMES[t]['colors']}
                for t in THEMES}

    sample = json.dumps(processed['data'][:5], default=str)
    prompt = CHART_PROMPT.format(
        sample=sample,
        x_key=processed['x_key'],
        y_key=processed['y_key'],
        row_count=processed['row_count'],
        question=question,
    )

    try:
        resp = client.chat.completions.create(
            model=config.GROQ_MODEL,
            messages=[{'role': 'user', 'content': prompt}],
            temperature=0,
            max_tokens=200,
        )
        raw = resp.choices[0].message.content.strip()
        # Strip markdown fences if present
        if '```' in raw:
            raw = raw.split('```')[1]
            if raw.startswith('json'):
                raw = raw[4:]
        base = json.loads(raw.strip())
    except Exception:
        # Safe fallback
        base = {
            'chart_type': 'bar',
            'title':      question[:60],
            'x_label':    str(processed.get('x_key', 'Category')),
            'y_label':    str(processed.get('y_key', 'Value')),
        }

    specs = {}
    for theme_name, theme_cfg in THEMES.items():
        specs[theme_name] = {
            **base,
            'data':    processed['data'],
            'x_key':   processed['x_key'],
            'y_key':   processed['y_key'],
            'colors':  theme_cfg['colors'],
            'theme':   theme_name,
        }
    return specs