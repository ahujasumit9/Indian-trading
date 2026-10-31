def validate_trade(*, capital, risk_pct, entry, stop, quantity, lot_size=1, max_lots=None):
    errors = []
    if min(capital, risk_pct, entry, stop, quantity, lot_size) <= 0:
        errors.append("All numeric inputs must be positive.")
    if entry == stop:
        errors.append("Entry and stop-loss cannot be equal.")
    risk_per_unit = abs(entry - stop)
    total_risk = risk_per_unit * quantity
    allowed_risk = capital * risk_pct / 100
    if total_risk > allowed_risk:
        errors.append(f"Estimated risk ₹{total_risk:,.2f} exceeds limit ₹{allowed_risk:,.2f}.")
    if quantity % lot_size:
        errors.append(f"Quantity must be a multiple of lot size {lot_size}.")
    if max_lots is not None and quantity // lot_size > max_lots:
        errors.append(f"Quantity exceeds configured maximum of {max_lots} lots.")
    return {"status": "BLOCK" if errors else "PASS", "estimated_risk": total_risk,
            "allowed_risk": allowed_risk, "reasons": errors}
