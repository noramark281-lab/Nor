"""
MEXC Spot Trading REST API Client
Implements HMAC SHA256 authentication and core trading operations
"""
import hashlib
import hmac
import json
import time
import logging
from typing import Optional, Dict, Any, List
import requests
from urllib.parse import urlencode

logger = logging.getLogger(__name__)

class MEXCSpotClient:
    """MEXC Spot Trading API Client with authentication and rate limiting"""
    
    BASE_URL = "https://api.mexc.com/api/v3"
    
    def __init__(self, api_key: str, api_secret: str, rate_limit_delay: float = 1.0):
        """
        Initialize MEXC API client
        
        Args:
            api_key: MEXC API key
            api_secret: MEXC API secret
            rate_limit_delay: Delay between requests in seconds (default: 1.0)
        """
        self.api_key = api_key
        self.api_secret = api_secret
        self.rate_limit_delay = rate_limit_delay
        self.last_request_time = 0
        self.session = requests.Session()
        
    def _get_signature(self, params: Dict[str, Any]) -> str:
        """
        Generate HMAC SHA256 signature for request authentication
        
        Args:
            params: Request parameters
            
        Returns:
            Signature string
        """
        query_string = urlencode(params)
        signature = hmac.new(
            self.api_secret.encode('utf-8'),
            query_string.encode('utf-8'),
            hashlib.sha256
        ).hexdigest()
        return signature
    
    def _apply_rate_limit(self):
        """Apply rate limiting between requests"""
        elapsed = time.time() - self.last_request_time
        if elapsed < self.rate_limit_delay:
            time.sleep(self.rate_limit_delay - elapsed)
        self.last_request_time = time.time()
    
    def _request(
        self,
        method: str,
        endpoint: str,
        params: Optional[Dict[str, Any]] = None,
        signed: bool = False
    ) -> Dict[str, Any]:
        """
        Make HTTP request to MEXC API
        
        Args:
            method: HTTP method (GET, POST, DELETE, etc.)
            endpoint: API endpoint
            params: Request parameters
            signed: Whether request needs authentication
            
        Returns:
            Response JSON as dictionary
        """
        self._apply_rate_limit()
        
        url = f"{self.BASE_URL}{endpoint}"
        headers = {"X-MEXC-APIKEY": self.api_key}
        
        if params is None:
            params = {}
        
        if signed:
            params["timestamp"] = int(time.time() * 1000)
            params["signature"] = self._get_signature(params)
        
        try:
            if method == "GET":
                response = self.session.get(url, params=params, headers=headers, timeout=10)
            elif method == "POST":
                response = self.session.post(url, params=params, headers=headers, timeout=10)
            elif method == "DELETE":
                response = self.session.delete(url, params=params, headers=headers, timeout=10)
            else:
                raise ValueError(f"Unsupported method: {method}")
            
            response.raise_for_status()
            return response.json()
        
        except requests.exceptions.RequestException as e:
            logger.error(f"API request failed: {e}")
            raise
    
    def get_account_info(self) -> Dict[str, Any]:
        """
        Get account information including balances
        
        Returns:
            Account information with balances
        """
        return self._request("GET", "/account", signed=True)
    
    def get_usdt_balance(self) -> float:
        """
        Get available USDT balance
        
        Returns:
            Available USDT balance as float
        """
        account = self.get_account_info()
        balances = account.get("balances", [])
        
        for balance in balances:
            if balance.get("asset") == "USDT":
                return float(balance.get("free", 0))
        
        return 0.0
    
    def get_24h_ticker(self, symbol: Optional[str] = None) -> Dict[str, Any] | List[Dict[str, Any]]:
        """
        Get 24-hour ticker data
        
        Args:
            symbol: Trading pair (e.g., 'BTCUSDT'). If None, returns all pairs.
            
        Returns:
            Ticker data for specified pair or all pairs
        """
        params = {}
        if symbol:
            params["symbol"] = symbol
        
        return self._request("GET", "/ticker/24hr", params=params)
    
    def get_exchange_info(self) -> Dict[str, Any]:
        """
        Get exchange information including trading pairs and their constraints
        
        Returns:
            Exchange information
        """
        return self._request("GET", "/exchangeInfo")
    
    def get_pair_info(self, symbol: str) -> Optional[Dict[str, Any]]:
        """
        Get specific pair information (minNotional, stepSize, etc.)
        
        Args:
            symbol: Trading pair (e.g., 'BTCUSDT')
            
        Returns:
            Pair information or None if not found
        """
        exchange_info = self.get_exchange_info()
        symbols = exchange_info.get("symbols", [])
        
        for sym_info in symbols:
            if sym_info.get("symbol") == symbol:
                return sym_info
        
        return None
    
    def place_spot_order(
        self,
        symbol: str,
        side: str,
        order_type: str = "MARKET",
        quantity: Optional[float] = None,
        quote_order_qty: Optional[float] = None,
        price: Optional[float] = None,
        time_in_force: str = "GTC"
    ) -> Dict[str, Any]:
        """
        Place a spot trading order
        
        Args:
            symbol: Trading pair (e.g., 'BTCUSDT')
            side: Order side ('BUY' or 'SELL')
            order_type: Order type ('MARKET', 'LIMIT', etc.)
            quantity: Order quantity (for SELL orders)
            quote_order_qty: Quote asset quantity (for MARKET BUY)
            price: Order price (for LIMIT orders)
            time_in_force: Time in force ('GTC', 'IOC', etc.)
            
        Returns:
            Order confirmation data
        """
        params = {
            "symbol": symbol,
            "side": side.upper(),
            "type": order_type.upper()
        }
        
        if quantity is not None:
            params["quantity"] = quantity
        
        if quote_order_qty is not None:
            params["quoteOrderQty"] = quote_order_qty
        
        if price is not None:
            params["price"] = price
        
        if order_type.upper() != "MARKET":
            params["timeInForce"] = time_in_force
        
        return self._request("POST", "/order", params=params, signed=True)
    
    def get_open_orders(self, symbol: Optional[str] = None) -> List[Dict[str, Any]]:
        """
        Get all open orders
        
        Args:
            symbol: Optional specific trading pair
            
        Returns:
            List of open orders
        """
        params = {}
        if symbol:
            params["symbol"] = symbol
        
        return self._request("GET", "/openOrders", params=params, signed=True)
    
    def cancel_order(self, symbol: str, order_id: int) -> Dict[str, Any]:
        """
        Cancel an open order
        
        Args:
            symbol: Trading pair
            order_id: Order ID to cancel
            
        Returns:
            Canceled order details
        """
        params = {
            "symbol": symbol,
            "orderId": order_id
        }
        
        return self._request("DELETE", "/order", params=params, signed=True)
    
    def get_order_status(self, symbol: str, order_id: int) -> Dict[str, Any]:
        """
        Get status of a specific order
        
        Args:
            symbol: Trading pair
            order_id: Order ID
            
        Returns:
            Order status details
        """
        params = {
            "symbol": symbol,
            "orderId": order_id
        }
        
        return self._request("GET", "/order", params=params, signed=True)
    
    def get_klines(
        self,
        symbol: str,
        interval: str = "1m",
        limit: int = 500,
        start_time: Optional[int] = None,
        end_time: Optional[int] = None
    ) -> List[List[Any]]:
        """
        Get kline (candlestick) data
        
        Args:
            symbol: Trading pair
            interval: Kline interval (1m, 5m, 15m, 1h, 4h, 1d, etc.)
            limit: Number of klines (default: 500)
            start_time: Start time in milliseconds
            end_time: End time in milliseconds
            
        Returns:
            List of klines
        """
        params = {
            "symbol": symbol,
            "interval": interval,
            "limit": limit
        }
        
        if start_time:
            params["startTime"] = start_time
        
        if end_time:
            params["endTime"] = end_time
        
        return self._request("GET", "/klines", params=params)
"""
MEXC Spot Trading API Client
Implements HMAC SHA256 authentication and REST API wrapper for MEXC Spot trading
"""

import hmac
import hashlib
import json
import time
import requests
from typing import Dict, Optional, Any
from urllib.parse import urlencode
import logging

logger = logging.getLogger(__name__)


class MEXCSpotClient:
    """MEXC Spot Trading API Client with authentication"""
    
    BASE_URL = "https://api.mexc.com/api/v3"
    
    def __init__(self, api_key: str, api_secret: str, request_timeout: int = 10):
        """
        Initialize MEXC API client
        
        Args:
            api_key: MEXC API Key
            api_secret: MEXC API Secret
            request_timeout: Request timeout in seconds
        """
        self.api_key = api_key
        self.api_secret = api_secret
        self.request_timeout = request_timeout
        self.session = requests.Session()
        self.last_request_time = 0
        self.rate_limit_delay = 1.0  # 1 second minimum between requests
    
    def _generate_signature(self, query_string: str) -> str:
        """
        Generate HMAC SHA256 signature for request authentication
        
        Args:
            query_string: Query string to sign
            
        Returns:
            Signature string
        """
        return hmac.new(
            self.api_secret.encode(),
            query_string.encode(),
            hashlib.sha256
        ).hexdigest()
    
    def _apply_rate_limit(self):
        """Apply rate limiting to prevent API bans"""
        elapsed = time.time() - self.last_request_time
        if elapsed < self.rate_limit_delay:
            time.sleep(self.rate_limit_delay - elapsed)
        self.last_request_time = time.time()
    
    def _request(
        self,
        method: str,
        endpoint: str,
        params: Optional[Dict[str, Any]] = None,
        signed: bool = False
    ) -> Dict[str, Any]:
        """
        Make HTTP request to MEXC API
        
        Args:
            method: HTTP method (GET, POST, etc.)
            endpoint: API endpoint
            params: Request parameters
            signed: Whether request requires authentication
            
        Returns:
            Response JSON
        """
        self._apply_rate_limit()
        
        url = f"{self.BASE_URL}{endpoint}"
        headers = {
            "User-Agent": "MEXC-Spot-Bot/1.0",
        }
        
        params = params or {}
        
        if signed:
            params["timestamp"] = int(time.time() * 1000)
            query_string = urlencode(params)
            params["signature"] = self._generate_signature(query_string)
            headers["X-MEXC-APIKEY"] = self.api_key
        
        try:
            if method.upper() == "GET":
                response = self.session.get(
                    url,
                    params=params,
                    headers=headers,
                    timeout=self.request_timeout
                )
            elif method.upper() == "POST":
                response = self.session.post(
                    url,
                    params=params,
                    headers=headers,
                    timeout=self.request_timeout
                )
            else:
                raise ValueError(f"Unsupported HTTP method: {method}")
            
            response.raise_for_status()
            return response.json()
        
        except requests.exceptions.RequestException as e:
            logger.error(f"API request failed: {e}")
            raise
    
    def get_account_info(self) -> Dict[str, Any]:
        """
        Get account information including balances
        
        Returns:
            Account info dictionary with balances
        """
        return self._request("GET", "/account", signed=True)
    
    def get_balance(self, asset: str = "USDT") -> float:
        """
        Get available balance for specific asset
        
        Args:
            asset: Asset symbol (default: USDT)
            
        Returns:
            Available balance amount
        """
        try:
            account = self.get_account_info()
            balances = account.get("balances", [])
            
            for balance in balances:
                if balance.get("asset") == asset:
                    return float(balance.get("free", 0))
            
            return 0.0
        except Exception as e:
            logger.error(f"Error getting balance for {asset}: {e}")
            return 0.0
    
    def get_24h_ticker(self, symbol: str) -> Dict[str, Any]:
        """
        Get 24-hour ticker data for a symbol
        
        Args:
            symbol: Trading symbol (e.g., "BTCUSDT")
            
        Returns:
            24h ticker data
        """
        return self._request("GET", "/ticker/24hr", {"symbol": symbol})
    
    def get_top_volume_pairs(self, limit: int = 20, min_volume: float = 1000000) -> list:
        """
        Get top trading pairs by 24h volume
        
        Args:
            limit: Number of pairs to return
            min_volume: Minimum volume in USDT
            
        Returns:
            List of symbols meeting criteria
        """
        try:
            tickers = self._request("GET", "/ticker/24hr")
            
            # Filter for USDT pairs and sufficient volume
            filtered = [
                t for t in tickers
                if t.get("symbol", "").endswith("USDT") and
                float(t.get("quoteAssetVolume", 0)) > min_volume
            ]
            
            # Sort by volume descending
            filtered.sort(
                key=lambda x: float(x.get("quoteAssetVolume", 0)),
                reverse=True
            )
            
            return [t["symbol"] for t in filtered[:limit]]
        
        except Exception as e:
            logger.error(f"Error getting top volume pairs: {e}")
            return []
    
    def get_exchange_info(self, symbol: Optional[str] = None) -> Dict[str, Any]:
        """
        Get exchange information including trading rules
        
        Args:
            symbol: Specific symbol (optional)
            
        Returns:
            Exchange info dictionary
        """
        params = {}
        if symbol:
            params["symbol"] = symbol
        
        return self._request("GET", "/exchangeInfo", params)
    
    def get_symbol_info(self, symbol: str) -> Dict[str, Any]:
        """
        Get trading rules and limits for specific symbol
        
        Args:
            symbol: Trading symbol
            
        Returns:
            Symbol trading rules
        """
        try:
            exchange_info = self.get_exchange_info(symbol)
            symbols = exchange_info.get("symbols", [])
            
            for s in symbols:
                if s.get("symbol") == symbol:
                    return s
            
            return {}
        except Exception as e:
            logger.error(f"Error getting symbol info for {symbol}: {e}")
            return {}
    
    def place_spot_order(
        self,
        symbol: str,
        side: str,
        order_type: str = "MARKET",
        quantity: Optional[float] = None,
        quote_order_qty: Optional[float] = None,
        price: Optional[float] = None
    ) -> Dict[str, Any]:
        """
        Place a spot trade order
        
        Args:
            symbol: Trading symbol
            side: BUY or SELL
            order_type: MARKET or LIMIT
            quantity: Order quantity
            quote_order_qty: Order value in quote asset
            price: Price (for LIMIT orders)
            
        Returns:
            Order response
        """
        params = {
            "symbol": symbol,
            "side": side.upper(),
            "type": order_type.upper()
        }
        
        if quantity:
            params["quantity"] = quantity
        if quote_order_qty:
            params["quoteOrderQty"] = quote_order_qty
        if price:
            params["price"] = price
        
        return self._request("POST", "/order", params, signed=True)
    
    def buy_market(self, symbol: str, quote_order_qty: float) -> Dict[str, Any]:
        """
        Place a market buy order
        
        Args:
            symbol: Trading symbol
            quote_order_qty: Order value in USDT
            
        Returns:
            Order response
        """
        return self.place_spot_order(
            symbol,
            "BUY",
            "MARKET",
            quote_order_qty=quote_order_qty
        )
    
    def sell_market(self, symbol: str, quantity: float) -> Dict[str, Any]:
        """
        Place a market sell order
        
        Args:
            symbol: Trading symbol
            quantity: Amount to sell
            
        Returns:
            Order response
        """
        return self.place_spot_order(
            symbol,
            "SELL",
            "MARKET",
            quantity=quantity
        )
    
    def get_open_orders(self, symbol: Optional[str] = None) -> list:
        """
        Get open orders
        
        Args:
            symbol: Specific symbol (optional)
            
        Returns:
            List of open orders
        """
        params = {}
        if symbol:
            params["symbol"] = symbol
        
        return self._request("GET", "/openOrders", params, signed=True)
    
    def cancel_order(self, symbol: str, order_id: str) -> Dict[str, Any]:
        """
        Cancel an open order
        
        Args:
            symbol: Trading symbol
            order_id: Order ID to cancel
            
        Returns:
            Cancellation response
        """
        params = {
            "symbol": symbol,
            "orderId": order_id
        }
        
        return self._request("POST", "/order", params, signed=True)
