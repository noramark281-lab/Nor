"""
MEXC API Client for Real Trading
Supports Spot API v3 with proper HMAC-SHA256 signing
"""
import time
import hmac
import hashlib
import requests
from typing import Optional, Dict, Any, List
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class MexcClient:
    """MEXC Spot API v3 Client"""
    
    def __init__(self, api_key: str, api_secret: str, base_url: str = "https://api.mexc.com"):
        self.api_key = api_key
        self.api_secret = api_secret
        self.base_url = base_url.rstrip('/')
        self.session = requests.Session()
        self.session.headers.update({
            'Content-Type': 'application/json',
            'X-MEXC-APIKEY': self.api_key
        })
    
    def _sign(self, query_string: str) -> str:
        """Create HMAC-SHA256 signature"""
        return hmac.new(
            self.api_secret.encode('utf-8'),
            query_string.encode('utf-8'),
            hashlib.sha256
        ).hexdigest()
    
    def _get_timestamp(self) -> str:
        """Get current timestamp in milliseconds (synced with server if possible)"""
        return str(int(time.time() * 1000))
    
    def _build_signed_params(self, params: Optional[Dict] = None) -> str:
        """Build query string with timestamp and signature"""
        params = params or {}
        params['timestamp'] = self._get_timestamp()
        query_string = '&'.join([f"{k}={v}" for k, v in sorted(params.items())])
        signature = self._sign(query_string)
        return f"{query_string}&signature={signature}"
    
    def _request(self, method: str, endpoint: str, params: Optional[Dict] = None, 
                 data: Optional[Dict] = None, signed: bool = True) -> Dict[str, Any]:
        """Make HTTP request to MEXC API"""
        url = f"{self.base_url}{endpoint}"
        
        try:
            if signed:
                query = self._build_signed_params(params)
                url = f"{url}?{query}"
                if method.upper() == 'GET':
                    response = self.session.get(url)
                else:
                    response = self.session.post(url, json=data)
            else:
                if method.upper() == 'GET':
                    response = self.session.get(url, params=params)
                else:
                    response = self.session.post(url, json=data)
            
            response.raise_for_status()
            return response.json()
        except requests.exceptions.RequestException as e:
            logger.error(f"API request failed: {e}")
            if hasattr(e.response, 'text'):
                logger.error(f"Response: {e.response.text}")
            raise
    
    # ========== PUBLIC ENDPOINTS ==========
    
    def ping(self) -> Dict:
        """Test connectivity"""
        return self._request('GET', '/api/v3/ping', signed=False)
    
    def get_server_time(self) -> Dict:
        """Get server time to sync local time"""
        return self._request('GET', '/api/v3/time', signed=False)
    
    def get_ticker_24h(self, symbol: Optional[str] = None) -> Dict:
        """Get 24hr ticker price change statistics"""
        params = {'symbol': symbol} if symbol else {}
        return self._request('GET', '/api/v3/ticker/24hr', params=params, signed=False)
    
    def get_klines(self, symbol: str, interval: str = '1m', limit: int = 100) -> List:
        """Get kline/candlestick data"""
        params = {
            'symbol': symbol,
            'interval': interval,
            'limit': limit
        }
        return self._request('GET', '/api/v3/klines', params=params, signed=False)
    
    def get_order_book(self, symbol: str, limit: int = 100) -> Dict:
        """Get order book"""
        params = {'symbol': symbol, 'limit': limit}
        return self._request('GET', '/api/v3/depth', params=params, signed=False)
    
    def get_recent_trades(self, symbol: str, limit: int = 100) -> List:
        """Get recent trades"""
        params = {'symbol': symbol, 'limit': limit}
        return self._request('GET', '/api/v3/trades', params=params, signed=False)
    
    def get_exchange_info(self) -> Dict:
        """Get exchange info (symbols, filters, etc.)"""
        return self._request('GET', '/api/v3/exchangeInfo', signed=False)
    
    # ========== PRIVATE ENDPOINTS (REQUIRE API KEY) ==========
    
    def get_account(self) -> Dict:
        """Get account information including balances"""
        return self._request('GET', '/api/v3/account')
    
    def get_balance(self, asset: str = 'USDT') -> float:
        """Get specific asset balance"""
        account = self.get_account()
        for bal in account.get('balances', []):
            if bal['asset'] == asset:
                return float(bal['free'])
        return 0.0
    
    def get_all_balances(self) -> List[Dict]:
        """Get all non-zero balances"""
        account = self.get_account()
        balances = []
        for bal in account.get('balances', []):
            free = float(bal['free'])
            locked = float(bal['locked'])
            if free > 0 or locked > 0:
                balances.append({
                    'asset': bal['asset'],
                    'free': free,
                    'locked': locked,
                    'total': free + locked
                })
        return balances
    
    def place_order(self, symbol: str, side: str, order_type: str = 'MARKET',
                    quantity: Optional[float] = None, quote_order_qty: Optional[float] = None,
                    price: Optional[float] = None, test: bool = False) -> Dict:
        """
        Place a new order
        
        Args:
            symbol: Trading pair (e.g., BTCUSDT)
            side: BUY or SELL
            order_type: MARKET, LIMIT
            quantity: Amount of base asset
            quote_order_qty: Amount to spend (for MARKET buy in quote asset)
            price: Limit price (required for LIMIT orders)
            test: If True, use test endpoint (no real order placed)
        """
        endpoint = '/api/v3/order/test' if test else '/api/v3/order'
        
        data = {
            'symbol': symbol,
            'side': side,
            'type': order_type,
        }
        
        if quantity is not None:
            data['quantity'] = quantity
        if quote_order_qty is not None:
            data['quoteOrderQty'] = quote_order_qty
        if price is not None:
            data['price'] = price
        if order_type == 'LIMIT':
            data['timeInForce'] = 'GTC'
        
        logger.info(f"Placing order: {symbol} {side} {order_type} Qty={quantity} QuoteQty={quote_order_qty}")
        return self._request('POST', endpoint, data=data)
    
    def get_order(self, symbol: str, order_id: Optional[int] = None, 
                  client_order_id: Optional[str] = None) -> Dict:
        """Get order status"""
        params = {'symbol': symbol}
        if order_id:
            params['orderId'] = order_id
        if client_order_id:
            params['origClientOrderId'] = client_order_id
        return self._request('GET', '/api/v3/order', params=params)
    
    def cancel_order(self, symbol: str, order_id: Optional[int] = None,
                     client_order_id: Optional[str] = None) -> Dict:
        """Cancel an order"""
        params = {'symbol': symbol}
        if order_id:
            params['orderId'] = order_id
        if client_order_id:
            params['origClientOrderId'] = client_order_id
        return self._request('DELETE', '/api/v3/order', params=params)
    
    def get_open_orders(self, symbol: Optional[str] = None) -> List:
        """Get all open orders"""
        params = {}
        if symbol:
            params['symbol'] = symbol
        return self._request('GET', '/api/v3/openOrders', params=params)
    
    def get_all_orders(self, symbol: str, limit: int = 500) -> List:
        """Get all orders for a symbol"""
        params = {'symbol': symbol, 'limit': limit}
        return self._request('GET', '/api/v3/allOrders', params=params)
    
    def get_my_trades(self, symbol: str, limit: int = 500) -> List:
        """Get trade history for a symbol"""
        params = {'symbol': symbol, 'limit': limit}
        return self._request('GET', '/api/v3/myTrades', params=params)
    
    def get_account_trade_list(self, symbol: str, limit: int = 500) -> List:
        """Alternative: get account trade list"""
        return self.get_my_trades(symbol, limit)
