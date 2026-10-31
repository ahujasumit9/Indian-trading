# India Trader Skill — Enhanced Edition

An India-focused modular trading research and paper-trading starter inspired by the architecture of
[Jakeschincariol/trader-skill](https://github.com/Jakeschincariol/trader-skill).

## What is included
- 11 retained/adapted research workflow skills
- SENSEX and NIFTY technical signal engine
- Options-chain analytics (OI change, PCR, IV/Greeks fields when supplied)
- Position sizing and pre-trade risk gates
- Broker-neutral adapters for Angel One SmartAPI and Sahi Trade API
- Manual approval ledger and paper-trading mode
- Streamlit dashboard and Docker deployment files

## Important implementation status
This is a **development scaffold**, not a live-connected trading product. Broker adapters define safe integration boundaries and deliberately do not submit live orders. Live data, authentication, order placement, static-IP registration, broker permissions, exchange rules, and API field mappings must be verified and implemented against each broker's current official documentation before use.

The original repository is a Claude-skill pack using public US data sources and workflows. This project adapts its useful modular concepts; it is not a byte-for-byte port and does not claim to reproduce its US-specific SEC/House Clerk data integrations.

## Run locally
```bash
python -m venv .venv
# Windows: .venv\Scripts\activate
# macOS/Linux: source .venv/bin/activate
pip install -r requirements.txt
streamlit run app.py
```

## Docker
```bash
docker build -t india-trader .
docker run --rm -p 8501:8501 --env-file .env india-trader
```

## Input formats
Candles CSV columns: `timestamp, open, high, low, close, volume`.
Option-chain CSV recommended columns: `strike, option_type, ltp, volume, oi, oi_change, iv, delta, gamma, theta, vega`.
Use `option_type` values `CE` and `PE`.

## Safety model
1. Analysis produces a candidate signal only.
2. Risk engine validates a proposed trade.
3. Approval ledger records a user's explicit approval for one exact ticket.
4. Broker adapters in this starter remain disabled for live orders.
5. Paper trading is the default.

Never paste broker passwords, TOTP seeds, API secrets, or access tokens into chat or source files. Use a secret manager/environment variables. Do not enable live execution until broker-specific rules and regulatory requirements have been confirmed with the broker.

## Skills
See `skills/` for the adapted skill specifications and `trader/workflows.md` for handoffs.
