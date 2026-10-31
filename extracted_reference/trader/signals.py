from .indicators import add_indicators

def score_market(candles):
    d = add_indicators(candles)
    r = d.iloc[-1]
    score = 50
    evidence = []
    if r.close > r.ema15:
        score += 8; evidence.append("Close above EMA15")
    else:
        score -= 8; evidence.append("Close below EMA15")
    if r.ema15 > r.ema20:
        score += 10; evidence.append("EMA15 above EMA20")
    else:
        score -= 10; evidence.append("EMA15 below EMA20")
    if r.close > r.vwap:
        score += 8; evidence.append("Close above VWAP")
    else:
        score -= 8; evidence.append("Close below VWAP")
    if r.macd > r.macd_signal:
        score += 7; evidence.append("MACD bullish crossover state")
    else:
        score -= 7; evidence.append("MACD bearish crossover state")
    if r.rsi14 == r.rsi14 and 50 <= r.rsi14 <= 70:
        score += 7; evidence.append("RSI supports bullish momentum")
    elif r.rsi14 == r.rsi14 and 30 <= r.rsi14 < 50:
        score -= 7; evidence.append("RSI supports bearish momentum")
    else:
        evidence.append("RSI neutral or extreme")
    score = max(0, min(100, int(score)))
    direction = "BULLISH" if score >= 65 else "BEARISH" if score <= 35 else "NEUTRAL"
    return {"score": score, "direction": direction, "evidence": evidence,
            "last_close": float(r.close), "rsi14": None if r.rsi14 != r.rsi14 else float(r.rsi14)}
