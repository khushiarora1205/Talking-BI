# agents/data_agent.py
import pandas as pd
import numpy as np


def process_for_chart(rows: list, intent: str = 'auto') -> dict:
    """
    Cleans raw query results and prepares them for chart rendering.
    Fully dynamic — works with any schema.
    """
    if not rows:
        return {
            'data': [], 'x_key': None, 'y_key': None,
            'numeric_cols': [], 'text_cols': [], 'row_count': 0,
        }

    df = pd.DataFrame(rows)

    # Convert object columns to numeric where possible
    for col in df.columns:
        try:
            converted = pd.to_numeric(df[col], errors='coerce')
            # Only convert if at least 60% of values are valid numbers
            if converted.notna().mean() >= 0.6:
                df[col] = converted
        except Exception:
            pass

    # Drop all-null columns
    df = df.dropna(axis=1, how='all')
    # Drop all-null rows
    df = df.dropna(how='all')

    numeric_cols = df.select_dtypes(include=[np.number]).columns.tolist()
    text_cols    = df.select_dtypes(exclude=[np.number]).columns.tolist()

    # Prefer a text column as X axis (category/label axis)
    x_key = text_cols[0] if text_cols else (df.columns[0] if len(df.columns) > 0 else None)
    # Prefer a numeric column as Y axis (value axis)
    y_key = numeric_cols[0] if numeric_cols else (
        df.columns[1] if len(df.columns) > 1 else df.columns[0] if len(df.columns) > 0 else None
    )

    # If x_key looks like dates, parse and sort
    if x_key and df[x_key].dtype == object:
        try:
            parsed = pd.to_datetime(df[x_key], infer_datetime_format=True)
            df[x_key] = parsed
            df = df.sort_values(x_key)
            df[x_key] = df[x_key].dt.strftime('%Y-%m-%d')
        except Exception:
            pass

    # Sort by y_key descending for better chart readability (non-time series)
    if y_key and x_key and df[x_key].dtype == object:
        try:
            df = df.sort_values(y_key, ascending=False)
        except Exception:
            pass

    # Convert all values to JSON-serialisable types
    data = []
    for record in df.to_dict(orient='records'):
        clean = {}
        for k, v in record.items():
            if pd.isna(v) if not isinstance(v, (list, dict)) else False:
                clean[k] = None
            elif isinstance(v, (np.integer,)):
                clean[k] = int(v)
            elif isinstance(v, (np.floating,)):
                clean[k] = float(v)
            else:
                clean[k] = str(v) if not isinstance(v, (int, float, bool, type(None))) else v
        data.append(clean)

    return {
        'data':         data,
        'x_key':        x_key,
        'y_key':        y_key,
        'numeric_cols': numeric_cols,
        'text_cols':    text_cols,
        'row_count':    len(df),
    }