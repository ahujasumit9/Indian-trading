class BrokerAdapter:
    name = "abstract"
    live_orders_enabled = False
    def get_quote(self, instrument):
        raise NotImplementedError
    def get_option_chain(self, underlying):
        raise NotImplementedError
    def prepare_order(self, order):
        return {"broker": self.name, "status": "PREVIEW_ONLY", "order": order}
    def place_order(self, order, approval_token=None):
        raise RuntimeError("Live order placement is intentionally disabled in this starter.")
