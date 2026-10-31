# Broker Order Workflow

## Responsibility
Prepare exact order previews for Angel One or Sahi. Require a fresh risk PASS and explicit approval for each exact order. Live placement disabled until verified.

## Required behaviour
- Use timestamped, source-attributed data.
- State missing inputs and data-quality limitations.
- Never fabricate live prices, option-chain fields, lot sizes, expiry dates or broker capabilities.
- Separate observation, interpretation and proposed action.
- Route any proposed trade through the risk workflow.
- No live order placement in this project scaffold.
