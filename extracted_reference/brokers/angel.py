from .base import BrokerAdapter

class AngelOneAdapter(BrokerAdapter):
    name = "angel_one"
    def __init__(self, api_key=None, client_code=None):
        self.api_key = api_key
        self.client_code = client_code
    def get_quote(self, instrument):
        raise NotImplementedError("Connect official SmartAPI SDK and validate instrument-token mapping.")
    def get_option_chain(self, underlying):
        raise NotImplementedError("Implement using a permitted, broker-supported market-data source.")
