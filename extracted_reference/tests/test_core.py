import unittest
from trader.risk import validate_trade
from trader.approval import ApprovalLedger

class CoreTests(unittest.TestCase):
    def test_risk_pass(self):
        r = validate_trade(capital=100000, risk_pct=1, entry=100, stop=90, quantity=50, lot_size=25)
        self.assertEqual(r["status"], "PASS")
    def test_risk_blocks_excess(self):
        r = validate_trade(capital=10000, risk_pct=1, entry=100, stop=80, quantity=50, lot_size=25)
        self.assertEqual(r["status"], "BLOCK")
    def test_approval_required(self):
        ledger = ApprovalLedger()
        ticket = {"symbol":"NIFTY", "side":"BUY", "qty":25}
        with self.assertRaises(PermissionError):
            ledger.approve(ticket, False)
        ledger.approve(ticket, True)
        self.assertTrue(ledger.is_approved(ticket))

if __name__ == "__main__":
    unittest.main()
