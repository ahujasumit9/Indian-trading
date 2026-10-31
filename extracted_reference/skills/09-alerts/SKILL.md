# Market Alerts

## Responsibility
Monitor price levels, EMA/VWAP conditions, option premium, OI changes and market-session/holiday schedules using verified exchange calendars.

## Required behaviour
- Use timestamped, source-attributed data.
- State missing inputs and data-quality limitations.
- Never fabricate live prices, option-chain fields, lot sizes, expiry dates or broker capabilities.
- Separate observation, interpretation and proposed action.
- Route any proposed trade through the risk workflow.
- No live order placement in this project scaffold.
