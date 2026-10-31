import pandas as pd

REQUIRED = {"strike", "option_type", "ltp", "volume", "oi"}

def analyse_option_chain(df: pd.DataFrame) -> dict:
    missing = REQUIRED - set(df.columns)
    if missing:
        raise ValueError(f"Missing option-chain columns: {', '.join(sorted(missing))}")
    d = df.copy()
    d["option_type"] = d["option_type"].astype(str).str.upper()
    for c in ["ltp", "volume", "oi"]:
        d[c] = pd.to_numeric(d[c], errors="coerce").fillna(0)
    calls = d[d.option_type == "CE"]
    puts = d[d.option_type == "PE"]
    call_oi, put_oi = float(calls.oi.sum()), float(puts.oi.sum())
    pcr = put_oi / call_oi if call_oi else None
    return {
        "call_oi": call_oi, "put_oi": put_oi, "pcr": pcr,
        "top_call_oi": calls.nlargest(5, "oi")[["strike","oi","ltp"]].to_dict("records"),
        "top_put_oi": puts.nlargest(5, "oi")[["strike","oi","ltp"]].to_dict("records"),
        "has_oi_change": "oi_change" in d.columns,
        "has_greeks": all(c in d.columns for c in ["delta","gamma","theta","vega"]),
        "has_iv": "iv" in d.columns
    }
