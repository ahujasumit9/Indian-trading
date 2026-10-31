from .base import BrokerAdapter

class SahiAdapter(BrokerAdapter):
    name = "sahi"
    def __init__(self, api_key=None, client_id=None):
        self.api_key = api_key
        self.client_id = client_id
    def get_quote(self, instrument):
        raise NotImplementedError("Implement against Sahi's current official Trade API schema.")
    def get_option_chain(self, underlying):
        raise NotImplementedError("Implement against Sahi's current official option-chain API schema.")
