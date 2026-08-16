"""
MEXC Spot Auto-Trading Bot - Main Entry Point
Provides both GUI and CLI interfaces
"""
import sys
import argparse
import logging
import json
from pathlib import Path
from typing import Optional
import asyncio
import time

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

def load_config(config_path: str = "config.json") -> dict:
    """
    Load configuration from JSON file
    
    Args:
        config_path: Path to configuration file
        
    Returns:
        Configuration dictionary
    """
    try:
        with open(config_path, 'r') as f:
            return json.load(f)
    except FileNotFoundError:
        logger.warning(f"Config file not found at {config_path}")
        return {}
    except json.JSONDecodeError:
        logger.error(f"Invalid JSON in {config_path}")
        return {}

def save_config(config: dict, config_path: str = "config.json"):
    """
    Save configuration to JSON file
    
    Args:
        config: Configuration dictionary
        config_path: Path to configuration file
    """
    with open(config_path, 'w') as f:
        json.dump(config, f, indent=2)
    logger.info(f"Configuration saved to {config_path}")

def run_gui_mode():
    """Run the application in GUI mode"""
    try:
        from src.gui.main_app import run_gui_app
        logger.info("Starting MEXC Trading Bot in GUI mode...")
        run_gui_app()
    except ImportError as e:
        logger.error(f"GUI dependencies not installed: {e}")
        logger.error("Install Kivy: pip install kivy")
        sys.exit(1)
    except Exception as e:
        logger.error(f"GUI error: {e}")
        sys.exit(1)

def run_cli_mode(config: dict):
    """
    Run the application in CLI mode
    
    Args:
        config: Configuration dictionary
    """
    from src.api.mexc_spot_client import MEXCSpotClient
    from src.strategy.balance_manager import BalanceManager
    from src.strategy.scanner import PairScanner
    from src.strategy.news_sentiment import NewsSentimentAnalyzer
    from src.strategy.freeze_manager import FreezeManager
    
    api_key = config.get("api_key")
    api_secret = config.get("api_secret")
    
    if not api_key or not api_secret:
        logger.error("API key and secret required in config.json")
        sys.exit(1)
    
    logger.info("Starting MEXC Trading Bot in CLI mode...")
    
    # Initialize components
    client = MEXCSpotClient(api_key, api_secret)
    balance_manager = BalanceManager(default_allocation=config.get("allocation", 1.0))
    scanner = PairScanner(min_volume_usdt=config.get("min_volume", 1000000))
    sentiment_analyzer = NewsSentimentAnalyzer(sensitivity=config.get("sentiment_sensitivity", 0.6))
    freeze_manager = FreezeManager(trailing_stop_loss_percent=config.get("stop_loss", 2.0))
    
    try:
        # Get account info
        logger.info("Connecting to MEXC...")
        account = client.get_account_info()
        usdt_balance = client.get_usdt_balance()
        logger.info(f"Connected! USDT Balance: ${usdt_balance:.2f}")
        
        # Get exchange info
        exchange_info = client.get_exchange_info()
        logger.info(f"Exchange has {len(exchange_info.get('symbols', []))} trading pairs")
        
        # Scan top pairs
        logger.info("Scanning top pairs...")
        tickers = client.get_24h_ticker()
        top_pairs = scanner.get_top_pairs(tickers, limit=10, criteria="volume")
        
        logger.info("Top 10 pairs by volume:")
        for i, pair in enumerate(top_pairs, 1):
            logger.info(f"  {i}. {pair['symbol']}: ${pair['volume_usdt']:,.0f}")
        
        # Check market sentiment
        if config.get("enable_news_sentiment", False):
            logger.info("Analyzing market sentiment...")
            news_items = sentiment_analyzer.fetch_news()
            analyzed_news = sentiment_analyzer.analyze_news_batch(news_items)
            summary = sentiment_analyzer.get_sentiment_summary(analyzed_news)
            
            logger.info(f"Market Sentiment: {summary['market_sentiment']}")
            logger.info(f"  Positive: {summary['positive_percent']:.1f}%")
            logger.info(f"  Average Confidence: {summary['avg_confidence']:.2f}")
        
        # Test trading (dry run)
        if config.get("dry_run", True):
            logger.info("\n=== DRY RUN MODE (No real trades) ===")
            
            symbol = top_pairs[0]["symbol"]
            price = top_pairs[0]["price"]
            pair_info = client.get_pair_info(symbol)
            
            if pair_info:
                min_notional = float(pair_info.get("minNotional", 10))
                step_size = float(pair_info.get("baseAssetPrecision", 8))
                
                logger.info(f"\nTesting trade for {symbol}:")
                logger.info(f"  Current Price: ${price}")
                logger.info(f"  Min Notional: ${min_notional}")
                
                # Validate trade
                trade_validation = balance_manager.validate_trade(
                    symbol=symbol,
                    available_usdt=usdt_balance,
                    current_price=price,
                    min_notional=min_notional,
                    step_size=step_size,
                    allocation=config.get("allocation", 1.0)
                )
                
                if trade_validation["valid"]:
                    logger.info(f"  ✓ Trade Valid")
                    logger.info(f"    Order Amount: ${trade_validation['order_amount']:.2f}")
                    logger.info(f"    Quantity: {trade_validation['order_quantity']}")
                else:
                    logger.warning(f"  ✗ Trade Invalid: {trade_validation['reason']}")
        
        logger.info("\n=== TRADING BOT READY ===")
        logger.info("Press Ctrl+C to stop")
        
        # Main loop
        try:
            while True:
                time.sleep(60)  # Check every minute
                
                # Periodic tasks
                usdt_balance = client.get_usdt_balance()
                logger.info(f"Current USDT Balance: ${usdt_balance:.2f}")
        
        except KeyboardInterrupt:
            logger.info("Stopping trading bot...")
    
    except Exception as e:
        logger.error(f"Error: {e}")
        sys.exit(1)

def run_test_mode():
    """Run the application in test mode"""
    from src.strategy.balance_manager import BalanceManager
    from src.strategy.scanner import PairScanner
    from src.strategy.news_sentiment import NewsSentimentAnalyzer
    
    logger.info("Running in TEST mode...")
    
    # Test Balance Manager
    logger.info("\n=== Testing Balance Manager ===")
    bm = BalanceManager(default_allocation=1.0)
    
    validation = bm.validate_trade(
        symbol="BTCUSDT",
        available_usdt=100.0,
        current_price=50000.0,
        min_notional=10.0,
        step_size=0.00001,
        allocation=1.0
    )
    
    logger.info(f"Trade Validation: {validation}")
    
    # Test Sentiment Analyzer
    logger.info("\n=== Testing Sentiment Analyzer ===")
    sa = NewsSentimentAnalyzer()
    
    test_headlines = [
        "Bitcoin surges to new all-time high",
        "Ethereum drops amid regulatory concerns",
        "Crypto market shows mixed signals"
    ]
    
    for headline in test_headlines:
        sentiment = sa.analyze_sentiment(headline)
        logger.info(f"\nHeadline: {headline}")
        logger.info(f"Sentiment: {sentiment}")
    
    logger.info("\n=== Tests Complete ===")

def main():
    """Main entry point"""
    parser = argparse.ArgumentParser(
        description="MEXC Spot Auto-Trading Bot",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  %(prog)s --gui                 # Run GUI mode (default)
  %(prog)s --cli                 # Run CLI mode
  %(prog)s --test                # Run test mode
  %(prog)s --config custom.json  # Use custom config file
        """
    )
    
    parser.add_argument(
        "--gui",
        action="store_true",
        help="Run in GUI mode (default)"
    )
    
    parser.add_argument(
        "--cli",
        action="store_true",
        help="Run in CLI mode"
    )
    
    parser.add_argument(
        "--test",
        action="store_true",
        help="Run in test mode"
    )
    
    parser.add_argument(
        "--config",
        type=str,
        default="config.json",
        help="Path to configuration file (default: config.json)"
    )
    
    parser.add_argument(
        "--create-config",
        action="store_true",
        help="Create example configuration file"
    )
    
    parser.add_argument(
        "-v", "--verbose",
        action="store_true",
        help="Enable verbose logging"
    )
    
    args = parser.parse_args()
    
    # Set logging level
    if args.verbose:
        logging.getLogger().setLevel(logging.DEBUG)
    
    # Create example config if requested
    if args.create_config:
        example_config = {
            "api_key": "your_mexc_api_key_here",
            "api_secret": "your_mexc_api_secret_here",
            "allocation": 1.0,
            "min_volume": 1000000,
            "stop_loss": 2.0,
            "sentiment_sensitivity": 0.6,
            "enable_news_sentiment": True,
            "dry_run": True,
            "rate_limit_delay": 1.0
        }
        save_config(example_config, args.config)
        logger.info(f"Example configuration created at {args.config}")
        logger.info("Please update with your MEXC API credentials and run again")
        return
    
    # Load configuration
    config = load_config(args.config)
    
    # Determine mode and run
    if args.cli:
        run_cli_mode(config)
    elif args.test:
        run_test_mode()
    else:
        # Default to GUI mode
        run_gui_mode()

if __name__ == "__main__":
    main()
