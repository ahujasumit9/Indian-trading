import pandas as pd

REQUIRED = {"open", "high", "low", "close", "volume"}

def validate_candles(df: pd.DataFrame) -> pd.DataFrame:
    missing = REQUIRED - set(df.columns)
    if missing:
        raise ValueError(f"Missing candle columns: {', '.join(sorted(missing))}")
    out = df.copy()
    for col in REQUIRED:
        out[col] = pd.to_numeric(out[col], errors="coerce")
    out = out.dropna(subset=list(REQUIRED)).reset_index(drop=True)
    if out.empty:
        raise ValueError("No valid candle rows found")
    return out

def add_indicators(df: pd.DataFrame) -> pd.DataFrame:
    out = validate_candles(df)
    out["ema15"] = out["close"].ewm(span=15, adjust=False).mean()
    out["ema20"] = out["close"].ewm(span=20, adjust=False).mean()
    delta = out["close"].diff()
    gain = delta.clip(lower=0).ewm(alpha=1/14, adjust=False).mean()
    loss = (-delta.clip(upper=0)).ewm(alpha=1/14, adjust=False).mean()
    rs = gain / loss.replace(0, pd.NA)
    out["rsi14"] = 100 - (100 / (1 + rs))
    typical = (out["high"] + out["low"] + out["close"]) / 3
    vol = out["volume"].replace(0, pd.NA)
    out["vwap"] = (typical * out["volume"]).cumsum() / vol.cumsum()
    ema12 = out["close"].ewm(span=12, adjust=False).mean()
    ema26 = out["close"].ewm(span=26, adjust=False).mean()
    out["macd"] = ema12 - ema26
    out["macd_signal"] = out["macd"].ewm(span=9, adjust=False).mean()
    tr = pd.concat([
        out["high"] - out["low"],
        (out["high"] - out["close"].shift()).abs(),
        (out["low"] - out["close"].shift()).abs()
    ], axis=1).max(axis=1)
    out["atr14"] = tr.ewm(alpha=1/14, adjust=False).mean()
    return out
