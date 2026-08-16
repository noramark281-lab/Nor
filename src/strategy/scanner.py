"""
MEXC Pair Scanner for Dynamic Pair Selection
Identifies top volume and volatile pairs for trading
"""
import logging
from typing import List, Dict, Any, Optional
from datetime import datetime

logger = logging.getLogger(__name__)

class PairScanner:
    """Scans and filters trading pairs based on volume, volatility, and liquidity"""
    
    def __init__(
        self,
        min_volume_usdt: float = 1000000.0,
        min_spread_percentage: Optional[float] = None,
        max_spread_percentage: float = 2.0,
        min_price_change_percentage: float = 0.5
    ):
        """
        Initialize Pair Scanner
        
        Args:
            min_volume_usdt: Minimum 24h volume in USDT (default: $1,000,000)
            min_spread_percentage: Minimum bid-ask spread % for liquidity
            max_spread_percentage: Maximum bid-ask spread % (default: 2.0%)
            min_price_change_percentage: Minimum 24h price change % for volatility
        """
        self.min_volume_usdt = min_volume_usdt
        self.min_spread_percentage = min_spread_percentage
        self.max_spread_percentage = max_spread_percentage
        self.min_price_change_percentage = min_price_change_percentage
    
    def filter_by_volume(
        self,
        tickers: List[Dict[str, Any]],
        limit: Optional[int] = None
    ) -> List[Dict[str, Any]]:
        """
        Filter pairs by 24h trading volume
        
        Args:
            tickers: List of ticker data from API
            limit: Maximum number of pairs to return
            
        Returns:
            Filtered list of pairs sorted by volume (descending)
        """
        filtered = []
        
        for ticker in tickers:
            symbol = ticker.get("symbol", "")
            quoteAssetVolume = float(ticker.get("quoteAssetVolume", 0))
            
            # Skip non-USDT pairs and those without sufficient volume
            if not symbol.endswith("USDT") or quoteAssetVolume < self.min_volume_usdt:
                continue
            
            filtered.append({
                "symbol": symbol,
                "volume_usdt": quoteAssetVolume,
                "price": float(ticker.get("lastPrice", 0)),
                "volume": float(ticker.get("volume", 0)),
                "bid_price": float(ticker.get("bidPrice", 0)),
                "ask_price": float(ticker.get("askPrice", 0))
            })
        
        # Sort by volume descending
        filtered.sort(key=lambda x: x["volume_usdt"], reverse=True)
        
        if limit:
            filtered = filtered[:limit]
        
        return filtered
    
    def filter_by_volatility(
        self,
        tickers: List[Dict[str, Any]],
        limit: Optional[int] = None
    ) -> List[Dict[str, Any]]:
        """
        Filter pairs by 24h price volatility
        
        Args:
            tickers: List of ticker data from API
            limit: Maximum number of pairs to return
            
        Returns:
            Filtered list of pairs sorted by price change % (descending)
        """
        filtered = []
        
        for ticker in tickers:
            symbol = ticker.get("symbol", "")
            priceChangePercent = float(ticker.get("priceChangePercent", 0))
            volume_usdt = float(ticker.get("quoteAssetVolume", 0))
            
            # Skip non-USDT pairs, insufficient volume, and low volatility
            if (not symbol.endswith("USDT") or 
                volume_usdt < self.min_volume_usdt or
                abs(priceChangePercent) < self.min_price_change_percentage):
                continue
            
            filtered.append({
                "symbol": symbol,
                "price_change_percent": priceChangePercent,
                "price": float(ticker.get("lastPrice", 0)),
                "volume_usdt": volume_usdt,
                "volume": float(ticker.get("volume", 0)),
                "bid_price": float(ticker.get("bidPrice", 0)),
                "ask_price": float(ticker.get("askPrice", 0))
            })
        
        # Sort by absolute price change descending
        filtered.sort(key=lambda x: abs(x["price_change_percent"]), reverse=True)
        
        if limit:
            filtered = filtered[:limit]
        
        return filtered
    
    def filter_by_spread(
        self,
        tickers: List[Dict[str, Any]],
        limit: Optional[int] = None
    ) -> List[Dict[str, Any]]:
        """
        Filter pairs by bid-ask spread (liquidity indicator)
        
        Args:
            tickers: List of ticker data from API
            limit: Maximum number of pairs to return
            
        Returns:
            Filtered list of pairs sorted by spread (ascending for tighter spreads)
        """
        filtered = []
        
        for ticker in tickers:
            symbol = ticker.get("symbol", "")
            bid_price = float(ticker.get("bidPrice", 0))
            ask_price = float(ticker.get("askPrice", 0))
            volume_usdt = float(ticker.get("quoteAssetVolume", 0))
            
            if not symbol.endswith("USDT") or volume_usdt < self.min_volume_usdt:
                continue
            
            if bid_price <= 0 or ask_price <= 0:
                continue
            
            # Calculate spread percentage
            spread_percent = ((ask_price - bid_price) / bid_price) * 100
            
            # Check spread constraints
            if (self.min_spread_percentage and spread_percent < self.min_spread_percentage):
                continue
            if spread_percent > self.max_spread_percentage:
                continue
            
            filtered.append({
                "symbol": symbol,
                "spread_percent": spread_percent,
                "bid_price": bid_price,
                "ask_price": ask_price,
                "price": float(ticker.get("lastPrice", 0)),
                "volume_usdt": volume_usdt,
                "volume": float(ticker.get("volume", 0))
            })
        
        # Sort by spread ascending (tighter spreads first)
        filtered.sort(key=lambda x: x["spread_percent"])
        
        if limit:
            filtered = filtered[:limit]
        
        return filtered
    
    def get_top_pairs(
        self,
        tickers: List[Dict[str, Any]],
        limit: int = 50,
        criteria: str = "volume"
    ) -> List[Dict[str, Any]]:
        """
        Get top pairs ranked by specified criteria
        
        Args:
            tickers: List of ticker data from API
            limit: Number of top pairs to return
            criteria: Ranking criteria ('volume', 'volatility', or 'spread')
            
        Returns:
            List of top pairs
        """
        if criteria == "volume":
            return self.filter_by_volume(tickers, limit)
        elif criteria == "volatility":
            return self.filter_by_volatility(tickers, limit)
        elif criteria == "spread":
            return self.filter_by_spread(tickers, limit)
        else:
            logger.warning(f"Unknown criteria: {criteria}, using volume")
            return self.filter_by_volume(tickers, limit)
    
    def get_trending_pairs(
        self,
        tickers: List[Dict[str, Any]],
        limit: int = 20,
        positive_only: bool = True
    ) -> List[Dict[str, Any]]:
        """
        Get trending pairs based on price change
        
        Args:
            tickers: List of ticker data from API
            limit: Number of pairs to return
            positive_only: If True, only return pairs with positive price change
            
        Returns:
            List of trending pairs
        """
        trending = []
        
        for ticker in tickers:
            symbol = ticker.get("symbol", "")
            price_change_percent = float(ticker.get("priceChangePercent", 0))
            volume_usdt = float(ticker.get("quoteAssetVolume", 0))
            
            if not symbol.endswith("USDT") or volume_usdt < self.min_volume_usdt:
                continue
            
            if positive_only and price_change_percent <= 0:
                continue
            
            trending.append({
                "symbol": symbol,
                "price_change_percent": price_change_percent,
                "price": float(ticker.get("lastPrice", 0)),
                "volume_usdt": volume_usdt,
                "high": float(ticker.get("highPrice", 0)),
                "low": float(ticker.get("lowPrice", 0))
            })
        
        # Sort by price change descending
        trending.sort(key=lambda x: x["price_change_percent"], reverse=True)
        
        return trending[:limit]
    
    def get_scan_summary(self, tickers: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Get summary statistics from market scan
        
        Args:
            tickers: List of ticker data from API
            
        Returns:
            Summary statistics
        """
        usdt_pairs = [t for t in tickers if t.get("symbol", "").endswith("USDT")]
        
        high_volume_pairs = self.filter_by_volume(usdt_pairs, limit=None)
        volatile_pairs = self.filter_by_volatility(usdt_pairs, limit=None)
        
        return {
            "scan_timestamp": datetime.now().isoformat(),
            "total_pairs_analyzed": len(usdt_pairs),
            "high_volume_pairs_count": len(high_volume_pairs),
            "volatile_pairs_count": len(volatile_pairs),
            "top_volume": high_volume_pairs[0] if high_volume_pairs else None,
            "top_gainer": volatile_pairs[0] if volatile_pairs else None,
            "min_volume_filter": self.min_volume_usdt,
            "max_spread_filter": self.max_spread_percentage
        }
