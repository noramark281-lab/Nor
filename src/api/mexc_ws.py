"""
MEXC WebSocket Client for Real-time Market Data
"""
import json
import logging
import threading
import time
from typing import Optional, Callable, Dict, Any, List
import websocket

logger = logging.getLogger(__name__)

class MEXCWebSocketClient:
    """WebSocket client for real-time MEXC market data"""
    
    BASE_URL = "wss://wbs.mexc.com/ws"
    
    def __init__(self):
        """Initialize WebSocket client"""
        self.ws = None
        self.running = False
        self.subscriptions: Dict[str, Callable] = {}
        self.thread: Optional[threading.Thread] = None
        self.lock = threading.Lock()
        
    def subscribe_ticker(self, symbol: str, callback: Callable[[Dict[str, Any]], None]):
        """
        Subscribe to real-time ticker updates
        
        Args:
            symbol: Trading pair (e.g., 'BTCUSDT')
            callback: Function to call with ticker data
        """
        subscription_key = f"ticker_{symbol.lower()}"
        with self.lock:
            self.subscriptions[subscription_key] = callback
        
        if self.ws and self.ws.connected:
            self._send_subscription(symbol, "ticker")
    
    def subscribe_klines(self, symbol: str, interval: str, callback: Callable[[Dict[str, Any]], None]):
        """
        Subscribe to kline (candlestick) data
        
        Args:
            symbol: Trading pair
            interval: Kline interval (1m, 5m, 15m, 1h, 4h, 1d, etc.)
            callback: Function to call with kline data
        """
        subscription_key = f"kline_{symbol.lower()}_{interval}"
        with self.lock:
            self.subscriptions[subscription_key] = callback
        
        if self.ws and self.ws.connected:
            self._send_subscription(symbol, f"kline_{interval}")
    
    def subscribe_depth(self, symbol: str, callback: Callable[[Dict[str, Any]], None]):
        """
        Subscribe to order book depth updates
        
        Args:
            symbol: Trading pair
            callback: Function to call with depth data
        """
        subscription_key = f"depth_{symbol.lower()}"
        with self.lock:
            self.subscriptions[subscription_key] = callback
        
        if self.ws and self.ws.connected:
            self._send_subscription(symbol, "depth")
    
    def connect(self):
        """Connect to WebSocket and start message listener"""
        if self.running:
            logger.warning("WebSocket already connected")
            return
        
        self.running = True
        self.thread = threading.Thread(target=self._connect_and_listen, daemon=True)
        self.thread.start()
    
    def _connect_and_listen(self):
        """Internal method to establish WebSocket connection and listen for messages"""
        try:
            self.ws = websocket.WebSocketApp(
                self.BASE_URL,
                on_message=self._on_message,
                on_error=self._on_error,
                on_close=self._on_close,
                on_open=self._on_open
            )
            
            # Subscribe to all tracked subscriptions
            with self.lock:
                for subscription_key in list(self.subscriptions.keys()):
                    if subscription_key.startswith("ticker_"):
                        symbol = subscription_key.replace("ticker_", "").upper()
                        self._send_subscription(symbol, "ticker")
                    elif subscription_key.startswith("kline_"):
                        parts = subscription_key.replace("kline_", "").split("_")
                        symbol = parts[0].upper()
                        interval = "_".join(parts[1:])
                        self._send_subscription(symbol, f"kline_{interval}")
                    elif subscription_key.startswith("depth_"):
                        symbol = subscription_key.replace("depth_", "").upper()
                        self._send_subscription(symbol, "depth")
            
            self.ws.run_forever()
        
        except Exception as e:
            logger.error(f"WebSocket error: {e}")
            self.running = False
    
    def _send_subscription(self, symbol: str, subscription_type: str):
        """Send subscription message to WebSocket"""
        if not self.ws or not self.ws.connected:
            return
        
        message = {
            "method": "SUBSCRIPTION",
            "params": [f"{symbol.lower()}@{subscription_type}"]
        }
        
        try:
            self.ws.send(json.dumps(message))
        except Exception as e:
            logger.error(f"Failed to send subscription: {e}")
    
    def _on_message(self, ws, message: str):
        """Handle incoming WebSocket message"""
        try:
            data = json.loads(message)
            
            # Extract symbol and type from the data
            stream = data.get("stream", "")
            
            # Find matching subscription callback
            with self.lock:
                for subscription_key, callback in list(self.subscriptions.items()):
                    if self._stream_matches_subscription(stream, subscription_key):
                        try:
                            callback(data.get("data", data))
                        except Exception as e:
                            logger.error(f"Error in subscription callback: {e}")
                        break
        
        except json.JSONDecodeError:
            logger.error(f"Failed to parse WebSocket message: {message}")
        except Exception as e:
            logger.error(f"Error processing WebSocket message: {e}")
    
    def _stream_matches_subscription(self, stream: str, subscription_key: str) -> bool:
        """Check if stream matches subscription"""
        if subscription_key.startswith("ticker_"):
            symbol = subscription_key.replace("ticker_", "")
            return stream.startswith(symbol) and "@ticker" in stream
        elif subscription_key.startswith("kline_"):
            parts = subscription_key.replace("kline_", "").split("_")
            symbol = parts[0]
            interval = "_".join(parts[1:])
            return stream.startswith(symbol) and f"@kline_{interval}" in stream
        elif subscription_key.startswith("depth_"):
            symbol = subscription_key.replace("depth_", "")
            return stream.startswith(symbol) and "@depth" in stream
        
        return False
    
    def _on_error(self, ws, error):
        """Handle WebSocket error"""
        logger.error(f"WebSocket error: {error}")
    
    def _on_close(self, ws, close_status_code, close_msg):
        """Handle WebSocket close"""
        logger.warning(f"WebSocket closed: {close_status_code} - {close_msg}")
        self.running = False
    
    def _on_open(self, ws):
        """Handle WebSocket open"""
        logger.info("WebSocket connected")
    
    def disconnect(self):
        """Disconnect from WebSocket"""
        self.running = False
        if self.ws:
            self.ws.close()
        if self.thread:
            self.thread.join(timeout=5)
    
    def is_connected(self) -> bool:
        """Check if WebSocket is connected"""
        return self.running and self.ws and self.ws.connected
"""
MEXC WebSocket Client
Real-time orderbook and price updates via WebSocket
"""

import asyncio
import json
import websockets
from typing import Callable, Optional, Dict, Any
import logging

logger = logging.getLogger(__name__)


class MEXCWebSocketClient:
    """WebSocket client for MEXC real-time data streams"""
    
    BASE_URL = "wss://wbs.mexc.com/raw"
    
    def __init__(self):
        """Initialize WebSocket client"""
        self.ws = None
        self.running = False
        self.callbacks: Dict[str, list] = {}
        self.reconnect_interval = 5  # seconds
        self.max_retries = 3
    
    def on(self, event: str, callback: Callable):
        """
        Register event handler
        
        Args:
            event: Event name (e.g., 'ticker', 'orderbook')
            callback: Callback function
        """
        if event not in self.callbacks:
            self.callbacks[event] = []
        self.callbacks[event].append(callback)
    
    def off(self, event: str, callback: Callable):
        """
        Remove event handler
        
        Args:
            event: Event name
            callback: Callback function to remove
        """
        if event in self.callbacks:
            self.callbacks[event] = [
                cb for cb in self.callbacks[event] if cb != callback
            ]
    
    def _emit(self, event: str, data: Any):
        """
        Emit event to all registered handlers
        
        Args:
            event: Event name
            data: Event data
        """
        if event in self.callbacks:
            for callback in self.callbacks[event]:
                try:
                    callback(data)
                except Exception as e:
                    logger.error(f"Error in callback for {event}: {e}")
    
    async def _connect_and_subscribe(self, symbols: list, stream_type: str = "ticker"):
        """
        Connect and subscribe to WebSocket streams
        
        Args:
            symbols: List of trading symbols
            stream_type: Stream type (ticker, kline, orderbook)
        """
        retries = 0
        
        while retries < self.max_retries and self.running:
            try:
                async with websockets.connect(self.BASE_URL) as ws:
                    self.ws = ws
                    logger.info("WebSocket connected")
                    self._emit("connected", {})
                    
                    # Subscribe to streams
                    for symbol in symbols:
                        stream = self._build_stream(symbol, stream_type)
                        await self._subscribe(ws, stream)
                    
                    # Listen for messages
                    async for message in ws:
                        if not self.running:
                            break
                        
                        try:
                            data = json.loads(message)
                            self._handle_message(data)
                        except json.JSONDecodeError as e:
                            logger.error(f"Invalid JSON: {e}")
                
                retries = 0  # Reset retries on successful connection
            
            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"WebSocket error (retry {retries + 1}): {e}")
                retries += 1
                
                if retries < self.max_retries and self.running:
                    await asyncio.sleep(self.reconnect_interval)
    
    def _build_stream(self, symbol: str, stream_type: str) -> str:
        """
        Build stream name for subscription
        
        Args:
            symbol: Trading symbol
            stream_type: Stream type
            
        Returns:
            Stream name
        """
        symbol_lower = symbol.lower()
        
        if stream_type == "ticker":
            return f"spot@public.ticker.v3.{symbol_lower}"
        elif stream_type == "kline":
            return f"spot@public.kline.v3.{symbol_lower}"
        elif stream_type == "orderbook":
            return f"spot@public.bookTicker.v3.{symbol_lower}"
        else:
            return f"spot@public.{stream_type}.v3.{symbol_lower}"
    
    async def _subscribe(self, ws, stream: str):
        """
        Send subscription request
        
        Args:
            ws: WebSocket connection
            stream: Stream to subscribe to
        """
        try:
            message = {
                "method": "SUBSCRIPTION",
                "params": [stream]
            }
            await ws.send(json.dumps(message))
            logger.debug(f"Subscribed to {stream}")
        except Exception as e:
            logger.error(f"Subscription failed: {e}")
    
    def _handle_message(self, data: Dict[str, Any]):
        """
        Handle incoming WebSocket message
        
        Args:
            data: Message data
        """
        if "d" in data:
            # MEXC WebSocket format
            msg_type = data.get("c", "")
            payload = data.get("d", {})
            
            if "ticker" in msg_type:
                self._emit("ticker", payload)
            elif "bookTicker" in msg_type:
                self._emit("orderbook", payload)
            elif "kline" in msg_type:
                self._emit("kline", payload)
            else:
                self._emit("message", data)
        else:
            self._emit("message", data)
    
    async def subscribe_ticker(self, symbols: list):
        """
        Subscribe to ticker updates
        
        Args:
            symbols: List of trading symbols
        """
        self.running = True
        await self._connect_and_subscribe(symbols, "ticker")
    
    async def subscribe_orderbook(self, symbols: list):
        """
        Subscribe to order book updates
        
        Args:
            symbols: List of trading symbols
        """
        self.running = True
        await self._connect_and_subscribe(symbols, "bookTicker")
    
    async def subscribe_kline(self, symbols: list):
        """
        Subscribe to kline/candlestick updates
        
        Args:
            symbols: List of trading symbols
        """
        self.running = True
        await self._connect_and_subscribe(symbols, "kline")
    
    def start_ticker(self, symbols: list):
        """
        Start ticker subscription in background
        
        Args:
            symbols: List of trading symbols
        """
        try:
            loop = asyncio.get_event_loop()
        except RuntimeError:
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
        
        self.running = True
        task = loop.create_task(self.subscribe_ticker(symbols))
        return task
    
    def stop(self):
        """Stop WebSocket client"""
        self.running = False
        if self.ws:
            try:
                asyncio.create_task(self.ws.close())
            except:
                pass
    
    async def close(self):
        """Close WebSocket connection"""
        self.running = False
        if self.ws:
            await self.ws.close()
