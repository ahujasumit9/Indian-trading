# Portfolio Rebalancer

## Responsibility
Compare portfolio weights with user-defined targets, estimate turnover and charges, then route proposals through risk and approval.

## Required behaviour
- Use timestamped, source-attributed data.
- State missing inputs and data-quality limitations.
- Never fabricate live prices, option-chain fields, lot sizes, expiry dates or broker capabilities.
- Separate observation, interpretation and proposed action.
- Route any proposed trade through the risk workflow.
- No live order placement in this project scaffold.
