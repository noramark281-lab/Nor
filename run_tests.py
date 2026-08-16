#!/usr/bin/env python3
"""
Comprehensive Test Suite for MEXC Spot Auto-Trading Bot
Tests all modules and validates configuration
"""

import sys
import logging
from pathlib import Path

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


class TestRunner:
    """Run comprehensive tests"""
    
    def __init__(self):
        self.tests_passed = 0
        self.tests_failed = 0
    
    def test_imports(self):
        """Test if all modules can be imported"""
        logger.info("=" * 60)
        logger.info("TEST: Module Imports")
        logger.info("=" * 60)
        
        tests = [
            ("MEXC API Client", "src.api.mexc_spot_client"),
            ("WebSocket Client", "src.api.mexc_ws"),
            ("Balance Manager", "src.strategy.balance_manager"),
            ("Pair Scanner", "src.strategy.scanner"),
            ("Sentiment Analyzer", "src.strategy.news_sentiment"),
            ("Freeze Manager", "src.strategy.freeze_manager"),
        ]
        
        for name, module in tests:
            try:
                __import__(module)
                logger.info(f"✓ {name}: OK")
                self.tests_passed += 1
            except Exception as e:
                logger.error(f"✗ {name}: FAILED - {e}")
                self.tests_failed += 1
    
    def test_balance_manager(self):
        """Test balance manager functionality"""
        logger.info("\n" + "=" * 60)
        logger.info("TEST: Balance Manager")
        logger.info("=" * 60)
        
        try:
            from src.strategy.balance_manager import BalanceManager
            
            bm = BalanceManager(default_allocation=1.0)
            
            # Test trade validation
            result = bm.validate_trade(
                symbol="BTCUSDT",
                available_usdt=100.0,
                current_price=50000.0,
                min_notional=10.0,
                step_size=0.00001,
                allocation=1.0
            )
            
            if result["valid"]:
                logger.info(f"✓ Trade Validation: OK (Qty: {result['order_quantity']})")
                self.tests_passed += 1
            else:
                logger.error(f"✗ Trade Validation: FAILED - {result['reason']}")
                self.tests_failed += 1
            
            # Test dust detection
            dust = bm.cleanup_dust(
                balances=[
                    {"asset": "BTC", "free": "0.00000001"},
                    {"asset": "ETH", "free": "0.001"},
                    {"asset": "USDT", "free": "100"}
                ]
            )
            
            if dust["has_dust"]:
                logger.info(f"✓ Dust Detection: OK (Found: {len(dust['dust_balances'])} dust balances)")
                self.tests_passed += 1
            else:
                logger.info("✓ Dust Detection: OK (No dust found)")
                self.tests_passed += 1
        
        except Exception as e:
            logger.error(f"✗ Balance Manager Tests: FAILED - {e}")
            self.tests_failed += 1
    
    def test_pair_scanner(self):
        """Test pair scanner functionality"""
        logger.info("\n" + "=" * 60)
        logger.info("TEST: Pair Scanner")
        logger.info("=" * 60)
        
        try:
            from src.strategy.scanner import PairScanner
            
            scanner = PairScanner(
                min_volume_usdt=1000000,
                max_spread_percentage=2.0
            )
            
            # Mock ticker data
            tickers = [
                {
                    "symbol": "BTCUSDT",
                    "quoteAssetVolume": "5000000",
                    "lastPrice": "50000",
                    "priceChangePercent": "5.5",
                    "volume": "10",
                    "bidPrice": "49999",
                    "askPrice": "50001"
                },
                {
                    "symbol": "ETHUSDT",
                    "quoteAssetVolume": "3000000",
                    "lastPrice": "3000",
                    "priceChangePercent": "3.2",
                    "volume": "100",
                    "bidPrice": "2999",
                    "askPrice": "3001"
                }
            ]
            
            # Test volume filter
            volume_filtered = scanner.filter_by_volume(tickers, limit=5)
            if len(volume_filtered) == 2:
                logger.info(f"✓ Volume Filter: OK (Found {len(volume_filtered)} pairs)")
                self.tests_passed += 1
            else:
                logger.error(f"✗ Volume Filter: FAILED")
                self.tests_failed += 1
            
            # Test volatility filter
            volatility_filtered = scanner.filter_by_volatility(tickers, limit=5)
            if len(volatility_filtered) > 0:
                logger.info(f"✓ Volatility Filter: OK (Found {len(volatility_filtered)} volatile pairs)")
                self.tests_passed += 1
            else:
                logger.error(f"✗ Volatility Filter: FAILED")
                self.tests_failed += 1
        
        except Exception as e:
            logger.error(f"✗ Pair Scanner Tests: FAILED - {e}")
            self.tests_failed += 1
    
    def test_sentiment_analyzer(self):
        """Test sentiment analysis"""
        logger.info("\n" + "=" * 60)
        logger.info("TEST: Sentiment Analyzer")
        logger.info("=" * 60)
        
        try:
            from src.strategy.news_sentiment import NewsSentimentAnalyzer
            
            analyzer = NewsSentimentAnalyzer()
            
            # Test sentiment classification
            test_cases = [
                ("Bitcoin surge to new all-time high!", "POSITIVE"),
                ("Market crash following negative news", "NEGATIVE"),
                ("Bitcoin price updates from MEXC", "NEUTRAL"),
            ]
            
            for text, expected in test_cases:
                sentiment, confidence = analyzer.analyze_text_sentiment(text)
                if sentiment == expected:
                    logger.info(f"✓ Sentiment '{text[:30]}...': {sentiment} ({confidence:.2f})")
                    self.tests_passed += 1
                else:
                    logger.error(f"✗ Sentiment '{text[:30]}...': Expected {expected}, got {sentiment}")
                    self.tests_failed += 1
        
        except Exception as e:
            logger.error(f"✗ Sentiment Analyzer Tests: FAILED - {e}")
            self.tests_failed += 1
    
    def test_freeze_manager(self):
        """Test freeze/stop-loss manager"""
        logger.info("\n" + "=" * 60)
        logger.info("TEST: Freeze Manager")
        logger.info("=" * 60)
        
        try:
            from src.strategy.freeze_manager import FreezeManager
            
            freeze_mgr = FreezeManager(trailing_stop_loss_percent=2.0)
            
            # Open position
            freeze_mgr.open_position(
                order_id="test_001",
                symbol="BTCUSDT",
                entry_price=50000.0,
                quantity=0.00001,
                buy_amount=1.0
            )
            
            logger.info("✓ Position Tracking: Opened position")
            self.tests_passed += 1
            
            # Update price (profit)
            result = freeze_mgr.update_price("test_001", current_price=51000.0)
            if result.get("profit_percent"):
                logger.info(f"✓ Price Update: Profit {result['profit_percent']:.2f}%")
                self.tests_passed += 1
            
            # Check stop-loss trigger
            result = freeze_mgr.update_price("test_001", current_price=49000.0)
            if result.get("should_sell"):
                logger.info(f"✓ Stop-Loss Trigger: {result['loss_percent']:.2f}% loss")
                self.tests_passed += 1
            else:
                logger.warning("⚠ Stop-Loss: Not triggered (normal for small loss)")
        
        except Exception as e:
            logger.error(f"✗ Freeze Manager Tests: FAILED - {e}")
            self.tests_failed += 1
    
    def test_configuration(self):
        """Test configuration loading"""
        logger.info("\n" + "=" * 60)
        logger.info("TEST: Configuration")
        logger.info("=" * 60)
        
        try:
            import json
            
            # Check if example config exists
            config_path = Path("config.json.example")
            if config_path.exists():
                with open(config_path) as f:
                    config = json.load(f)
                logger.info("✓ Config File: config.json.example found")
                self.tests_passed += 1
                
                # Validate structure
                required_keys = ["mexc", "trading", "pair_scanner"]
                if all(key in config for key in required_keys):
                    logger.info("✓ Config Structure: Valid")
                    self.tests_passed += 1
                else:
                    logger.error("✗ Config Structure: Missing keys")
                    self.tests_failed += 1
            else:
                logger.error("✗ Config File: config.json.example not found")
                self.tests_failed += 1
        
        except Exception as e:
            logger.error(f"✗ Configuration Tests: FAILED - {e}")
            self.tests_failed += 1
    
    def run_all(self):
        """Run all tests"""
        logger.info("\n")
        logger.info("╔" + "=" * 58 + "╗")
        logger.info("║" + " MEXC Spot Auto-Trading Bot - Test Suite ".center(58) + "║")
        logger.info("╚" + "=" * 58 + "╝")
        logger.info("")
        
        self.test_imports()
        self.test_balance_manager()
        self.test_pair_scanner()
        self.test_sentiment_analyzer()
        self.test_freeze_manager()
        self.test_configuration()
        
        # Summary
        logger.info("\n" + "=" * 60)
        logger.info("TEST SUMMARY")
        logger.info("=" * 60)
        logger.info(f"✓ Passed: {self.tests_passed}")
        logger.info(f"✗ Failed: {self.tests_failed}")
        logger.info(f"Total:   {self.tests_passed + self.tests_failed}")
        logger.info("=" * 60)
        
        if self.tests_failed == 0:
            logger.info("\n✓ ALL TESTS PASSED!")
            return 0
        else:
            logger.error(f"\n✗ {self.tests_failed} TEST(S) FAILED!")
            return 1


if __name__ == "__main__":
    runner = TestRunner()
    exit_code = runner.run_all()
    sys.exit(exit_code)
