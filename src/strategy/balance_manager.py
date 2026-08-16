"""
Balance Manager for MEXC Spot Trading
Enforces allocation rules and validates trades against available balance
"""
import logging
from typing import Optional, Dict, Any
from decimal import Decimal

logger = logging.getLogger(__name__)

class BalanceManager:
    """Manages trading allocation and balance validation"""
    
    def __init__(
        self,
        default_allocation: float = 1.0,
        min_usdt_buffer: float = 0.1
    ):
        """
        Initialize Balance Manager
        
        Args:
            default_allocation: Default allocation per trade in USD (default: $1.00)
            min_usdt_buffer: Minimum USDT buffer to keep untouched (default: $0.10)
        """
        self.default_allocation = default_allocation
        self.min_usdt_buffer = min_usdt_buffer
    
    def calculate_order_amount(
        self,
        available_usdt: float,
        allocation: Optional[float] = None
    ) -> float:
        """
        Calculate safe order amount considering available balance
        
        Args:
            available_usdt: Available USDT balance
            allocation: Optional specific allocation (uses default if not provided)
            
        Returns:
            Safe order amount in USDT
        """
        target_allocation = allocation or self.default_allocation
        
        # Ensure we have enough buffer
        usable_balance = available_usdt - self.min_usdt_buffer
        
        if usable_balance <= 0:
            return 0.0
        
        # Return minimum of target allocation or available balance
        return min(target_allocation, usable_balance)
    
    def validate_trade(
        self,
        symbol: str,
        available_usdt: float,
        current_price: float,
        min_notional: float,
        step_size: float,
        allocation: Optional[float] = None
    ) -> Dict[str, Any]:
        """
        Validate if a trade can be executed with current balance and pair constraints
        
        Args:
            symbol: Trading pair
            available_usdt: Available USDT balance
            current_price: Current price of the asset
            min_notional: Minimum order value in USDT (from exchange)
            step_size: Minimum quantity step size (from exchange)
            allocation: Optional specific allocation
            
        Returns:
            Dictionary with validation result and details
        """
        result = {
            "valid": False,
            "symbol": symbol,
            "reason": None,
            "order_amount": 0.0,
            "order_quantity": 0.0,
            "available_usdt": available_usdt
        }
        
        # Check if we have any USDT
        if available_usdt <= self.min_usdt_buffer:
            result["reason"] = f"Insufficient USDT balance. Available: {available_usdt}, Required minimum buffer: {self.min_usdt_buffer}"
            return result
        
        # Calculate order amount
        order_amount = self.calculate_order_amount(available_usdt, allocation)
        
        # Check minimum notional
        if order_amount < min_notional:
            result["reason"] = f"Order amount {order_amount} USDT below minimum notional {min_notional} USDT"
            return result
        
        # Calculate quantity
        quantity = order_amount / current_price
        
        # Round down to step size
        quantity_rounded = self._round_to_step_size(quantity, step_size)
        
        if quantity_rounded <= 0:
            result["reason"] = f"Calculated quantity rounds to 0 with step size {step_size}"
            return result
        
        # Re-calculate amount with rounded quantity
        final_amount = quantity_rounded * current_price
        
        if final_amount < min_notional:
            result["reason"] = f"Final order amount {final_amount} USDT below minimum notional {min_notional} USDT after rounding"
            return result
        
        result["valid"] = True
        result["order_amount"] = final_amount
        result["order_quantity"] = quantity_rounded
        
        return result
    
    def _round_to_step_size(self, value: float, step_size: float) -> float:
        """
        Round value down to nearest step size
        
        Args:
            value: Value to round
            step_size: Step size
            
        Returns:
            Rounded value
        """
        if step_size == 0:
            return value
        
        # Use Decimal for precise rounding
        value_decimal = Decimal(str(value))
        step_decimal = Decimal(str(step_size))
        
        rounded = (value_decimal / step_decimal).to_integral_value() * step_decimal
        return float(rounded)
    
    def cleanup_dust(
        self,
        balances: list,
        min_notional: float = 10.0
    ) -> Dict[str, Any]:
        """
        Identify dust balances (residual amounts too small to trade)
        
        Args:
            balances: List of balance dictionaries with 'asset' and 'free' keys
            min_notional: Minimum order value in USDT
            
        Returns:
            Dictionary with dust information
        """
        dust_info = {
            "has_dust": False,
            "dust_balances": [],
            "total_dust_value_estimate": 0.0
        }
        
        for balance in balances:
            asset = balance.get("asset", "")
            free = float(balance.get("free", 0))
            
            # Skip USDT and zero balances
            if asset == "USDT" or free <= 0:
                continue
            
            # Flag as dust if very small
            if free < 0.0001:  # Arbitrary small amount
                dust_info["has_dust"] = True
                dust_info["dust_balances"].append({
                    "asset": asset,
                    "amount": free
                })
        
        return dust_info
    
    def get_portfolio_value(
        self,
        balances: list,
        current_prices: Dict[str, float]
    ) -> float:
        """
        Calculate total portfolio value in USDT
        
        Args:
            balances: List of balance dictionaries
            current_prices: Dictionary mapping symbols to prices (e.g., {'BTCUSDT': 50000})
            
        Returns:
            Total portfolio value in USDT
        """
        total_value = 0.0
        
        for balance in balances:
            asset = balance.get("asset", "")
            free = float(balance.get("free", 0))
            locked = float(balance.get("locked", 0))
            total_amount = free + locked
            
            if total_amount <= 0:
                continue
            
            if asset == "USDT":
                total_value += total_amount
            else:
                # Look for price in format ASSET + USDT
                symbol = f"{asset}USDT"
                if symbol in current_prices:
                    price = current_prices[symbol]
                    total_value += total_amount * price
        
        return total_value
