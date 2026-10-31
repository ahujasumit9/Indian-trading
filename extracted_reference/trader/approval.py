import hashlib, json, time

def ticket_fingerprint(ticket: dict) -> str:
    canonical = json.dumps(ticket, sort_keys=True, separators=(",", ":"))
    return hashlib.sha256(canonical.encode()).hexdigest()

class ApprovalLedger:
    """In-memory demonstration ledger. Replace with durable DB storage before deployment."""
    def __init__(self):
        self._approved = {}
    def approve(self, ticket: dict, user_confirmed: bool):
        if not user_confirmed:
            raise PermissionError("Explicit user approval is required.")
        fp = ticket_fingerprint(ticket)
        self._approved[fp] = {"approved_at": time.time(), "ticket": ticket}
        return fp
    def is_approved(self, ticket: dict):
        return ticket_fingerprint(ticket) in self._approved
