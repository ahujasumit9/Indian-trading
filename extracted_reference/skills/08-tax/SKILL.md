# Indian Tax Ledger

## Responsibility
Maintain transaction lots, realised/unrealised P&L, charges and tax-report exports. Flag tax treatment for CA review; do not provide definitive tax advice.

## Required behaviour
- Use timestamped, source-attributed data.
- State missing inputs and data-quality limitations.
- Never fabricate live prices, option-chain fields, lot sizes, expiry dates or broker capabilities.
- Separate observation, interpretation and proposed action.
- Route any proposed trade through the risk workflow.
- No live order placement in this project scaffold.
