import streamlit as st
import pandas as pd
from trader.signals import score_market
from trader.options import analyse_option_chain
from trader.risk import validate_trade

st.set_page_config(page_title="India Trader Skill", layout="wide")
st.title("India Trader Skill — SENSEX + NIFTY")
st.caption("Enhanced modular research and paper-trading workspace | Live execution disabled")

with st.sidebar:
    st.header("Workspace")
    market = st.selectbox("Underlying", ["SENSEX", "NIFTY"])
    broker = st.selectbox("Broker adapter", ["Not connected", "Angel One", "Sahi"])
    st.info("Paper mode is always on in this starter.")

c1, c2, c3 = st.columns(3)
c1.metric("Selected market", market)
c2.metric("Broker", broker)
c3.metric("Execution", "Disabled")

tab1, tab2, tab3 = st.tabs(["Market signal", "Option chain", "Risk check"])
with tab1:
    st.subheader(f"{market} technical analysis")
    f = st.file_uploader("Upload candle CSV", type="csv", key="candles")
    if f:
        try:
            df = pd.read_csv(f)
            result = score_market(df)
            a,b,c = st.columns(3)
            a.metric("Signal score", f"{result['score']}/100")
            b.metric("Direction", result["direction"])
            c.metric("Last close", f"{result['last_close']:,.2f}")
            st.write("Evidence")
            for item in result["evidence"]: st.write("•", item)
        except Exception as e:
            st.error(str(e))
    else:
        st.write("Upload candles with timestamp, open, high, low, close and volume columns.")

with tab2:
    st.subheader("Options intelligence")
    f = st.file_uploader("Upload option-chain CSV", type="csv", key="chain")
    if f:
        try:
            result = analyse_option_chain(pd.read_csv(f))
            a,b,c = st.columns(3)
            a.metric("Call OI", f"{result['call_oi']:,.0f}")
            b.metric("Put OI", f"{result['put_oi']:,.0f}")
            c.metric("PCR", "N/A" if result["pcr"] is None else f"{result['pcr']:.3f}")
            st.write("Highest call OI", result["top_call_oi"])
            st.write("Highest put OI", result["top_put_oi"])
            st.caption(f"OI change: {result['has_oi_change']} | IV: {result['has_iv']} | Greeks: {result['has_greeks']}")
        except Exception as e:
            st.error(str(e))
    else:
        st.write("Upload a broker/exported option-chain CSV. Verify field definitions and timestamps.")

with tab3:
    st.subheader("Pre-trade risk validation")
    capital = st.number_input("Trading capital (₹)", min_value=1.0, value=100000.0)
    risk_pct = st.number_input("Maximum risk per trade (%)", min_value=0.1, max_value=5.0, value=1.0)
    entry = st.number_input("Option entry premium (₹)", min_value=0.05, value=100.0)
    stop = st.number_input("Stop-loss premium (₹)", min_value=0.05, value=80.0)
    lot = st.number_input("Lot size", min_value=1, value=20, step=1)
    lots = st.number_input("Number of lots", min_value=1, value=1, step=1)
    if st.button("Validate proposed trade"):
        result = validate_trade(capital=capital, risk_pct=risk_pct, entry=entry, stop=stop,
                                quantity=int(lot*lots), lot_size=int(lot))
        st.metric("Risk gate", result["status"])
        st.write(f"Estimated risk: ₹{result['estimated_risk']:,.2f}")
        st.write(f"Allowed risk: ₹{result['allowed_risk']:,.2f}")
        for reason in result["reasons"]: st.error(reason)

st.divider()
st.warning("Signals are analytical outputs, not trade recommendations. This build has no live feed or live order execution.")
