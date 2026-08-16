"""
Freeze Manager for Risk Mitigation
Implements trailing stop-loss and dust cleanup
"""
import logging
from typing import Dict, List, Any, Optional
from datetime import datetime, timedelta

logger = logging.getLogger(__name__)

class FreezeManager:
    """Manages trailing stop-loss and risk mitigation strategies"""
    
    def __init__(
        self,
        trailing_stop_loss_percent: float = 2.0,
        min_dust_usdt_value: float = 10.0,
        check_interval_seconds: int = 60
    ):
        """
        Initialize Freeze Manager
        
        Args:
            trailing_stop_loss_percent: Trailing stop-loss percentage (default: 2.0%)
            min_dust_usdt_value: Minimum USDT value for dust (default: $10)
            check_interval_seconds: Interval for checking stop-loss (default: 60 sec)
        """
        self.trailing_stop_loss_percent = trailing_stop_loss_percent
        self.min_dust_usdt_value = min_dust_usdt_value
        self.check_interval_seconds = check_interval_seconds
        self.tracked_positions: Dict[str, Dict[str, Any]] = {}
    
    def open_position(
        self,
        order_id: str,
        symbol: str,
        entry_price: float,
        quantity: float,
        buy_amount: float,
        timestamp: Optional[datetime] = None
    ):
        """
        Track a new open position
        
        Args:
            order_id: Order ID
            symbol: Trading pair
            entry_price: Entry price
            quantity: Quantity bought
            buy_amount: Total amount spent in USDT
            timestamp: Trade timestamp
        """
        if timestamp is None:
            timestamp = datetime.now()
        
        self.tracked_positions[order_id] = {
            "symbol": symbol,
            "entry_price": entry_price,
            "quantity": quantity,
            "buy_amount": buy_amount,
            "highest_price": entry_price,
            "peak_profit": 0.0,
            "open_timestamp": timestamp,
            "last_check": timestamp,
            "status": "OPEN"
        }
        
        logger.info(f"Opened position {order_id}: {symbol} @ {entry_price} qty={quantity}")
    
    def update_price(
        self,
        order_id: str,
        current_price: float,
        timestamp: Optional[datetime] = None
    ) -> Dict[str, Any]:
        """
        Update current price for position and check stop-loss
        
        Args:
            order_id: Order ID
            current_price: Current market price
            timestamp: Update timestamp
            
        Returns:
            Position status and stop-loss trigger info
        """
        if timestamp is None:
            timestamp = datetime.now()
        
        if order_id not in self.tracked_positions:
            return {"error": "Position not found"}
        
        position = self.tracked_positions[order_id]
        
        # Update highest price
        if current_price > position["highest_price"]:
            position["highest_price"] = current_price
        
        # Calculate profit
        current_value = current_price * position["quantity"]
        profit = current_value - position["buy_amount"]
        profit_percent = (profit / position["buy_amount"]) * 100
        
        # Calculate trailing stop-loss level
        stop_loss_price = position["highest_price"] * (1 - self.trailing_stop_loss_percent / 100)
        
        # Check if stop-loss triggered
        should_sell = current_price <= stop_loss_price
        
        result = {
            "order_id": order_id,
            "symbol": position["symbol"],
            "current_price": current_price,
            "entry_price": position["entry_price"],
            "highest_price": position["highest_price"],
            "quantity": position["quantity"],
            "current_value": current_value,
            "profit": profit,
            "profit_percent": profit_percent,
            "stop_loss_price": stop_loss_price,
            "should_sell": should_sell,
            "timestamp": timestamp.isoformat()
        }
        
        position["last_check"] = timestamp
        
        if should_sell:
            position["status"] = "STOP_LOSS_TRIGGERED"
            logger.warning(f"Stop-loss triggered for {order_id}: price {current_price} <= {stop_loss_price}")
        
        return result
    
    def close_position(
        self,
        order_id: str,
        exit_price: float,
        timestamp: Optional[datetime] = None
    ) -> Dict[str, Any]:
        """
        Close a position and calculate final P&L
        
        Args:
            order_id: Order ID
            exit_price: Exit price
            timestamp: Exit timestamp
            
        Returns:
            Final position details and P&L
        """
        if timestamp is None:
            timestamp = datetime.now()
        
        if order_id not in self.tracked_positions:
            return {"error": "Position not found"}
        
        position = self.tracked_positions[order_id]
        
        exit_value = exit_price * position["quantity"]
        profit = exit_value - position["buy_amount"]
        profit_percent = (profit / position["buy_amount"]) * 100
        
        hold_duration = timestamp - position["open_timestamp"]
        
        result = {
            "order_id": order_id,
            "symbol": position["symbol"],
            "entry_price": position["entry_price"],
            "exit_price": exit_price,
            "quantity": position["quantity"],
            "buy_amount": position["buy_amount"],
            "exit_amount": exit_value,
            "profit": profit,
            "profit_percent": profit_percent,
            "peak_price": position["highest_price"],
            "max_unrealized_profit_percent": ((position["highest_price"] - position["entry_price"]) / position["entry_price"]) * 100,
            "hold_duration_seconds": hold_duration.total_seconds(),
            "hold_duration_formatted": str(hold_duration),
            "open_timestamp": position["open_timestamp"].isoformat(),
            "close_timestamp": timestamp.isoformat()
        }
        
        position["status"] = "CLOSED"
        
        logger.info(f"Closed position {order_id}: P&L={profit:.2f} USDT ({profit_percent:.2f}%)")
        
        return result
    
    def get_position_status(self, order_id: str) -> Optional[Dict[str, Any]]:
        """
        Get current status of a position
        
        Args:
            order_id: Order ID
            
        Returns:
            Position status or None if not found
        """
        if order_id not in self.tracked_positions:
            return None
        
        position = self.tracked_positions[order_id]
        
        return {
            "order_id": order_id,
            "symbol": position["symbol"],
            "entry_price": position["entry_price"],
            "quantity": position["quantity"],
            "highest_price": position["highest_price"],
            "buy_amount": position["buy_amount"],
            "status": position["status"],
            "open_timestamp": position["open_timestamp"].isoformat(),
            "last_check": position["last_check"].isoformat()
        }
    
    def identify_dust(
        self,
        balances: List[Dict[str, Any]],
        current_prices: Dict[str, float]
    ) -> List[Dict[str, Any]]:
        """
        Identify dust balances (residual amounts with value < min_dust_usdt_value)
        
        Args:
            balances: List of account balances
            current_prices: Dictionary mapping symbols to USDT prices
            
        Returns:
            List of dust balances
        """
        dust_list = []
        
        for balance in balances:
            asset = balance.get("asset", "")
            free = float(balance.get("free", 0))
            locked = float(balance.get("locked", 0))
            
            # Skip USDT and zero amounts
            if asset == "USDT" or (free + locked) <= 0:
                continue
            
            # Get price for this asset
            symbol = f"{asset}USDT"
            price = current_prices.get(symbol, 0)
            
            if price <= 0:
                continue
            
            # Calculate value in USDT
            total_amount = free + locked
            usdt_value = total_amount * price
            
            # Mark as dust if below minimum
            if usdt_value < self.min_dust_usdt_value:
                dust_list.append({
                    "asset": asset,
                    "amount": total_amount,
                    "price": price,
                    "usdt_value": usdt_value,
                    "free": free,
                    "locked": locked
                })
        
        return dust_list
    
    def get_all_positions(self) -> List[Dict[str, Any]]:
        """
        Get all tracked positions
        
        Returns:
            List of all positions
        """
        positions = []
        for order_id, position in self.tracked_positions.items():
            positions.append({
                "order_id": order_id,
                "symbol": position["symbol"],
                "entry_price": position["entry_price"],
                "quantity": position["quantity"],
                "highest_price": position["highest_price"],
                "status": position["status"],
                "open_timestamp": position["open_timestamp"].isoformat()
            })
        
        return positions
    
    def get_performance_summary(self) -> Dict[str, Any]:
        """
        Get summary of all closed positions for performance analysis
        
        Returns:
            Performance summary
        """
        closed_positions = [p for p in self.tracked_positions.values() if p["status"] == "CLOSED"]
        
        if not closed_positions:
            return {
                "total_closed_positions": 0,
                "winning_trades": 0,
                "losing_trades": 0,
                "win_rate": 0.0,
                "total_profit": 0.0,
                "avg_profit": 0.0,
                "max_profit": 0.0,
                "max_loss": 0.0
            }
        
        profits = []
        
        for position in closed_positions:
            profit = (position["highest_price"] - position["entry_price"]) * position["quantity"]
            profits.append(profit)
        
        winning_trades = sum(1 for p in profits if p > 0)
        losing_trades = sum(1 for p in profits if p < 0)
        total_profit = sum(profits)
        
        return {
            "total_closed_positions": len(closed_positions),
            "winning_trades": winning_trades,
            "losing_trades": losing_trades,
            "win_rate": (winning_trades / len(closed_positions)) * 100 if closed_positions else 0.0,
            "total_profit": total_profit,
            "avg_profit": total_profit / len(closed_positions) if closed_positions else 0.0,
            "max_profit": max(profits) if profits else 0.0,
            "max_loss": min(profits) if profits else 0.0
        }
