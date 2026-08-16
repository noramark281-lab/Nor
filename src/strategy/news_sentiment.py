"""
News Sentiment Analyzer for Market-Driven Trading
Fetches and analyzes news to trigger automated buy orders
"""
import logging
import re
from typing import Dict, List, Any, Optional
from datetime import datetime
import feedparser
import requests

logger = logging.getLogger(__name__)

class NewsSentimentAnalyzer:
    """Analyzes news sentiment to identify trading opportunities"""
    
    # Positive sentiment keywords
    POSITIVE_KEYWORDS = [
        "surge", "rally", "bull", "momentum", "breakout", "pump",
        "gain", "profit", "up", "rising", "growth", "spike",
        "jump", "boost", "high", "record", "new high", "peak",
        "partnership", "approval", "adoption", "bullish", "green",
        "positive", "strong", "successful", "innovation", "launch"
    ]
    
    # Negative sentiment keywords
    NEGATIVE_KEYWORDS = [
        "crash", "crash", "dump", "bear", "decline", "fall",
        "loss", "down", "dropping", "slump", "bearish", "red",
        "negative", "weak", "fail", "ban", "regulation", "concern",
        "risk", "risk", "short", "downside", "sell-off", "plunge",
        "collapse", "correction", "pullback", "volatility"
    ]
    
    # Crypto-specific news sources
    RSS_FEEDS = [
        "https://feeds.bloomberg.com/markets/crypto.rss",
        "https://feeds.coindesk.com/crypto",
        "https://cryptopanic.com/feed/?auth=a",
    ]
    
    def __init__(self, sensitivity: float = 0.6):
        """
        Initialize News Sentiment Analyzer
        
        Args:
            sensitivity: Confidence threshold for sentiment (0.0 - 1.0)
        """
        self.sensitivity = sensitivity
        self.sentiment_history: List[Dict[str, Any]] = []
    
    def fetch_news(self) -> List[Dict[str, Any]]:
        """
        Fetch news from RSS feeds and news APIs
        
        Returns:
            List of news articles with title and URL
        """
        news_items = []
        
        for feed_url in self.RSS_FEEDS:
            try:
                feed = feedparser.parse(feed_url)
                
                for entry in feed.entries[:10]:  # Limit to 10 entries per feed
                    news_items.append({
                        "title": entry.get("title", ""),
                        "link": entry.get("link", ""),
                        "published": entry.get("published", ""),
                        "summary": entry.get("summary", ""),
                        "source": feed_url
                    })
            
            except Exception as e:
                logger.warning(f"Failed to fetch news from {feed_url}: {e}")
        
        return news_items
    
    def fetch_cryptopanic_news(
        self,
        kind: str = "news",
        threshold: int = 1
    ) -> List[Dict[str, Any]]:
        """
        Fetch news from CryptoPanic API (requires API key)
        
        Args:
            kind: Type of news (news, media)
            threshold: Minimum votes required (1-4)
            
        Returns:
            List of news articles
        """
        # Note: This would require a CryptoPanic API key
        # For now, we'll return empty list
        logger.info("CryptoPanic fetch requires API key (optional feature)")
        return []
    
    def analyze_sentiment(self, text: str) -> Dict[str, Any]:
        """
        Analyze sentiment of text using keyword matching
        
        Args:
            text: Text to analyze (typically news headline or summary)
            
        Returns:
            Sentiment analysis with score and classification
        """
        text_lower = text.lower()
        
        # Count keyword occurrences
        positive_count = sum(1 for keyword in self.POSITIVE_KEYWORDS if keyword in text_lower)
        negative_count = sum(1 for keyword in self.NEGATIVE_KEYWORDS if keyword in text_lower)
        
        total_count = positive_count + negative_count
        
        if total_count == 0:
            sentiment = "NEUTRAL"
            score = 0.5
            confidence = 0.1
        else:
            score = positive_count / total_count
            
            if score > 0.6:
                sentiment = "POSITIVE"
                confidence = min(0.95, score)
            elif score < 0.4:
                sentiment = "NEGATIVE"
                confidence = min(0.95, 1 - score)
            else:
                sentiment = "NEUTRAL"
                confidence = 0.5
        
        return {
            "sentiment": sentiment,
            "score": score,
            "confidence": confidence,
            "positive_count": positive_count,
            "negative_count": negative_count,
            "text_length": len(text)
        }
    
    def extract_symbols(self, text: str) -> List[str]:
        """
        Extract cryptocurrency symbols from text (e.g., BTC, ETH)
        
        Args:
            text: Text to extract symbols from
            
        Returns:
            List of extracted symbols
        """
        # Pattern to find 3-5 letter uppercase symbols
        pattern = r'\b[A-Z]{3,5}\b'
        matches = re.findall(pattern, text)
        
        # Filter to known crypto symbols
        known_symbols = {
            "BTC", "ETH", "XRP", "ADA", "SOL", "DOT", "DOGE", "LTC",
            "LINK", "BCH", "XLM", "EOS", "USDC", "USDT", "DAI", "BUSD",
            "APE", "PEPE", "SHIB", "LUNC", "LUNA", "FTT", "ARB", "OP"
        }
        
        # Return intersection of found symbols and known symbols
        return [sym for sym in matches if sym in known_symbols]
    
    def analyze_news_batch(
        self,
        news_items: List[Dict[str, Any]]
    ) -> List[Dict[str, Any]]:
        """
        Analyze sentiment for batch of news items
        
        Args:
            news_items: List of news articles
            
        Returns:
            Analyzed news with sentiment and symbols
        """
        analyzed = []
        
        for news in news_items:
            title = news.get("title", "")
            summary = news.get("summary", "")
            
            # Analyze title and summary
            title_sentiment = self.analyze_sentiment(title)
            summary_sentiment = self.analyze_sentiment(summary) if summary else {"sentiment": "NEUTRAL", "score": 0.5, "confidence": 0.1}
            
            # Average sentiment from title and summary
            avg_score = (title_sentiment["score"] + summary_sentiment["score"]) / 2
            avg_confidence = (title_sentiment["confidence"] + summary_sentiment["confidence"]) / 2
            
            if avg_score > 0.6:
                final_sentiment = "POSITIVE"
            elif avg_score < 0.4:
                final_sentiment = "NEGATIVE"
            else:
                final_sentiment = "NEUTRAL"
            
            # Extract affected symbols
            symbols = self.extract_symbols(title)
            if not symbols:
                symbols = self.extract_symbols(summary)
            
            analyzed_item = {
                "title": title,
                "link": news.get("link", ""),
                "published": news.get("published", ""),
                "sentiment": final_sentiment,
                "confidence": avg_confidence,
                "score": avg_score,
                "symbols": symbols,
                "analyzed_at": datetime.now().isoformat()
            }
            
            analyzed.append(analyzed_item)
        
        return analyzed
    
    def get_actionable_news(
        self,
        analyzed_news: List[Dict[str, Any]]
    ) -> List[Dict[str, Any]]:
        """
        Filter news to find high-confidence buy signals
        
        Args:
            analyzed_news: List of analyzed news items
            
        Returns:
            High-confidence positive news items for trading
        """
        actionable = []
        
        for item in analyzed_news:
            # Only consider positive news with high confidence
            if (item["sentiment"] == "POSITIVE" and 
                item["confidence"] >= self.sensitivity and
                len(item["symbols"]) > 0):
                actionable.append(item)
        
        # Sort by confidence descending
        actionable.sort(key=lambda x: x["confidence"], reverse=True)
        
        return actionable
    
    def should_buy_signal(
        self,
        news_item: Dict[str, Any],
        symbol: str
    ) -> bool:
        """
        Determine if news item triggers a buy signal for specific symbol
        
        Args:
            news_item: Analyzed news item
            symbol: Trading symbol (e.g., 'BTC', 'ETH')
            
        Returns:
            True if buy signal should be triggered
        """
        return (news_item["sentiment"] == "POSITIVE" and
                news_item["confidence"] >= self.sensitivity and
                symbol.replace("USDT", "") in news_item["symbols"])
    
    def get_sentiment_summary(
        self,
        analyzed_news: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """
        Get summary statistics from sentiment analysis
        
        Args:
            analyzed_news: List of analyzed news items
            
        Returns:
            Summary statistics
        """
        if not analyzed_news:
            return {
                "total_articles": 0,
                "positive_count": 0,
                "negative_count": 0,
                "neutral_count": 0,
                "positive_percent": 0.0,
                "avg_confidence": 0.0,
                "market_sentiment": "NEUTRAL"
            }
        
        total = len(analyzed_news)
        positive = sum(1 for item in analyzed_news if item["sentiment"] == "POSITIVE")
        negative = sum(1 for item in analyzed_news if item["sentiment"] == "NEGATIVE")
        neutral = total - positive - negative
        
        avg_confidence = sum(item["confidence"] for item in analyzed_news) / total
        
        positive_percent = (positive / total) * 100 if total > 0 else 0
        
        if positive_percent > 60:
            market_sentiment = "BULLISH"
        elif positive_percent < 40:
            market_sentiment = "BEARISH"
        else:
            market_sentiment = "NEUTRAL"
        
        return {
            "total_articles": total,
            "positive_count": positive,
            "negative_count": negative,
            "neutral_count": neutral,
            "positive_percent": positive_percent,
            "avg_confidence": avg_confidence,
            "market_sentiment": market_sentiment
        }
