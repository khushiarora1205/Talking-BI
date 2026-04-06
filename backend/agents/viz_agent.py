# agents/viz_agent.py
import json
import re
from groq import Groq
import config

client = Groq(api_key=config.GROQ_API_KEY)

THEMES = {
    'minimal':   {'colors': ['#3B82F6','#10B981','#F59E0B','#EF4444','#8B5CF6','#EC4899']},
    'executive': {'colors': ['#312E81','#4338CA','#6366F1','#818CF8','#A5B4FC','#C7D2FE']},
    'earthy':    {'colors': ['#92400E','#D97706','#FBBF24','#6B7280','#374151','#9CA3AF']},
    'vivid':     {'colors': ['#EC4899','#8B5CF6','#3B82F6','#10B981','#F59E0B','#EF4444']},
}

TEMPORAL_WORDS = {'year','month','date','day','week','quarter','time',
                   'period','hour','minute','created','updated','yr','qtr'}


def _is_temporal(col_name: str, data: list) -> bool:
    """Check if a column looks like a time series."""
    if not col_name:
        return False
    name_lower = col_name.lower()
    if any(w in name_lower for w in TEMPORAL_WORDS):
        return True
    # Check if values look like years (4-digit numbers 1900-2100)
    if data:
        sample = str(data[0].get(col_name, ''))
        if re.match(r'^(19|20)\d{2}$', sample.strip()):
            return True
    return False


def _count_unique(data: list, col: str) -> int:
    if not data or not col:
        return 0
    return len(set(str(r.get(col, '')) for r in data))


def _both_numeric(processed: dict) -> bool:
    """True if we have at least 2 numeric columns."""
    return len(processed.get('numeric_cols', [])) >= 2


def _pick_best_charts(processed: dict, question: str) -> list:
    """
    Score all chart types and return 4 best-fit types (all different).

    Scoring rules:
    - line:   +3 if temporal x-axis, +1 if >5 rows, -2 if not temporal
    - area:   +3 if temporal, +2 if question has 'trend'/'over time'/'growth',
              -2 if not temporal
    - bar:    +2 always (good baseline), +1 if >5 categories, +2 if question has
              'compare'/'top'/'rank'/'most'/'least'
    - pie:    +3 if <=6 unique x values, +2 if question has 'distribution'/'share'
              /'percentage'/'proportion', -99 if >10 unique values
    - scatter:+3 if both axes numeric, -99 if only 1 numeric col
    - horizontal_bar: +2 if >8 categories with long text labels, +1 if question has
              'compare'/'rank'
    """
    data       = processed.get('data', [])
    x_key      = processed.get('x_key')
    y_key      = processed.get('y_key')
    row_count  = processed.get('row_count', 0)
    q_lower    = question.lower()

    temporal   = _is_temporal(x_key, data)
    n_unique   = _count_unique(data, x_key)
    two_num    = _both_numeric(processed)

    # Average label length for horizontal bar decision
    avg_label_len = 0
    if data and x_key:
        labels = [str(r.get(x_key, '')) for r in data[:20]]
        avg_label_len = sum(len(l) for l in labels) / max(len(labels), 1)

    trend_words   = {'trend','over time','growth','change','progress','evolution','monthly','yearly','daily','weekly','quarterly'}
    compare_words = {'compare','top','rank','most','least','highest','lowest','best','worst','vs','versus'}
    dist_words    = {'distribution','share','percentage','proportion','breakdown','composition','split','ratio'}

    has_trend   = any(w in q_lower for w in trend_words)
    has_compare = any(w in q_lower for w in compare_words)
    has_dist    = any(w in q_lower for w in dist_words)

    scores = {
        'line':           0,
        'area':           0,
        'bar':            2,
        'pie':            0,
        'scatter':        0,
        'horizontal_bar': 0,
    }

    # line
    if temporal:       scores['line'] += 3
    if row_count > 5:  scores['line'] += 1
    if has_trend:      scores['line'] += 2
    if not temporal:   scores['line'] -= 2

    # area
    if temporal:       scores['area'] += 3
    if has_trend:      scores['area'] += 2
    if not temporal:   scores['area'] -= 2

    # bar
    if n_unique > 5:   scores['bar'] += 1
    if has_compare:    scores['bar'] += 2
    if temporal and row_count <= 12: scores['bar'] += 1  # few time periods: bar still ok

    # pie
    if n_unique <= 6:  scores['pie'] += 3
    elif n_unique > 10: scores['pie'] = -99  # too many slices
    if has_dist:       scores['pie'] += 2
    if row_count > 10: scores['pie'] -= 1

    # scatter
    if two_num:        scores['scatter'] += 3
    else:              scores['scatter'] = -99

    # horizontal_bar — good when labels are long or many categories
    if avg_label_len > 8:  scores['horizontal_bar'] += 2
    if n_unique > 8:       scores['horizontal_bar'] += 2
    if has_compare:        scores['horizontal_bar'] += 1

    # Sort by score descending, pick top 4 unique
    ranked = sorted(scores.items(), key=lambda x: x[1], reverse=True)
    chosen = [ct for ct, sc in ranked if sc > -50][:4]

    # Always return at least 4 — pad with fallbacks if needed
    fallbacks = ['bar', 'line', 'area', 'pie']
    for fb in fallbacks:
        if len(chosen) >= 4:
            break
        if fb not in chosen:
            chosen.append(fb)

    return chosen[:4]


def _ask_llm_for_title_and_labels(processed: dict, question: str, chart_type: str) -> dict:
    """Ask Groq for chart title + axis labels. Returns dict."""
    sample = json.dumps(processed['data'][:3], default=str)
    prompt = f"""Given this data sample: {sample}
Question: {question}
Chart type: {chart_type}
x_key: {processed.get('x_key')}, y_key: {processed.get('y_key')}

Return ONLY this JSON (no markdown):
{{"title": "...", "x_label": "...", "y_label": "..."}}"""

    try:
        resp = client.chat.completions.create(
            model=config.GROQ_MODEL,
            messages=[{'role': 'user', 'content': prompt}],
            temperature=0, max_tokens=120,
        )
        raw = resp.choices[0].message.content.strip()
        if '```' in raw:
            raw = raw.split('```')[1]
            if raw.startswith('json'):
                raw = raw[4:]
        return json.loads(raw.strip())
    except Exception:
        return {
            'title':   question[:60],
            'x_label': str(processed.get('x_key', '')),
            'y_label': str(processed.get('y_key', '')),
        }


def build_chart_specs(processed: dict, question: str, intent: str = 'auto') -> dict:
    """
    Build 4 chart specs with dynamically chosen chart types.
    Each of the 4 specs may have a DIFFERENT chart type — chosen by data analysis.
    All 4 themes get the same 4 chart types but different color palettes.
    """
    if not processed.get('data'):
        empty = {'chart_type': 'bar', 'data': [], 'title': question[:60],
                 'x_key': None, 'y_key': None}
        return {t: [dict(empty, colors=THEMES[t]['colors'], theme=t)] * 4 for t in THEMES}

    # Step 1: Pick 4 best chart types for this data
    chart_types = _pick_best_charts(processed, question)

    # Step 2: Get title and labels (one LLM call for the primary chart type)
    labels = _ask_llm_for_title_and_labels(processed, question, chart_types[0])

    # Step 3: Build a spec for each chart type × each theme
    # Return format: { theme_name: [spec1, spec2, spec3, spec4] }
    # Each spec has its own chart_type
    result = {}
    for theme_name, theme_cfg in THEMES.items():
        specs = []
        for ct in chart_types:
            specs.append({
                'chart_type': ct,
                'title':      labels.get('title', question[:60]),
                'x_label':    labels.get('x_label', str(processed.get('x_key', ''))),
                'y_label':    labels.get('y_label', str(processed.get('y_key', ''))),
                'data':       processed['data'],
                'x_key':      processed['x_key'],
                'y_key':      processed['y_key'],
                'colors':     theme_cfg['colors'],
                'theme':      theme_name,
            })
        result[theme_name] = specs
    return result