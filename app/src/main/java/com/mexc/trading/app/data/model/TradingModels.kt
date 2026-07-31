package com.mexc.trading.app.data.model

import kotlinx.serialization.Serializable

enum class PositionSide { LONG, SHORT }
enum class OrderType { LIMIT, MARKET }
enum class BotType { GRID, DCA, AI_TREND, TRAILING_STOP }
enum class BotStatus { RUNNING, PAUSED, STOPPED, ERROR }
enum class LogLevel { INFO, WARN, SUCCESS, ERROR }
enum class TradingMode { LIVE, SIMULATION }
enum class AppLanguage { ARABIC, ENGLISH }

@Serializable
data class MarketTicker(
    val symbol: String,
    val lastPrice: Double,
    val riseFallRate: Double, // e.g. 0.0345 (3.45%)
    val high24Price: Double,
    val low24Price: Double,
    val volume24: Double,
    val amount24: Double,
    val fundingRate: Double,
    val fairPrice: Double,
    val indexPrice: Double
)

@Serializable
data class KlineCandle(
    val time: Long,
    val open: Double,
    val high: Double,
    val low: Double,
    val close: Double,
    val volume: Double
)

@Serializable
data class OrderBookEntry(
    val price: Double,
    val amount: Double,
    val total: Double
)

@Serializable
data class OrderBookData(
    val bids: List<OrderBookEntry> = emptyList(),
    val asks: List<OrderBookEntry> = emptyList()
)

@Serializable
data class AccountAsset(
    val currency: String = "USDT",
    val equity: Double = 10000.0,
    val availableBalance: Double = 9500.0,
    val positionMargin: Double = 500.0,
    val frozenBalance: Double = 0.0,
    val unrealizedPnL: Double = 0.0,
    val unrealizedPnLPercent: Double = 0.0
)

@Serializable
data class FuturesPosition(
    val id: String,
    val symbol: String,
    val side: PositionSide,
    val size: Double,
    val entryPrice: Double,
    val markPrice: Double,
    val liquidationPrice: Double,
    val margin: Double,
    val leverage: Int,
    val unrealizedPnL: Double,
    val unrealizedPnLPercent: Double,
    val tpPrice: Double? = null,
    val slPrice: Double? = null,
    val createdAt: Long = System.currentTimeMillis()
)

@Serializable
data class BotStrategyConfig(
    val id: String,
    val name: String,
    val type: BotType,
    val symbol: String,
    val enabled: Boolean,
    val leverage: Int,
    val allocatedMargin: Double,
    val lowerPrice: Double? = null,
    val upperPrice: Double? = null,
    val gridCount: Int? = null,
    val dcaStepPercent: Double? = null,
    val dcaMultiplier: Double? = null,
    val maxDcaSteps: Int? = null,
    val takeProfitPercent: Double = 3.0,
    val stopLossPercent: Double = 1.5,
    val maxPositions: Int = 1,
    val totalTrades: Int = 0,
    val winningTrades: Int = 0,
    val profitUsdt: Double = 0.0,
    val status: BotStatus = BotStatus.STOPPED,
    val lastRunTimestamp: Long? = null
)

@Serializable
data class BotLog(
    val id: String,
    val timestamp: Long,
    val strategyName: String,
    val symbol: String,
    val level: LogLevel,
    val message: String
)

@Serializable
data class AIAnalysisResult(
    val symbol: String,
    val sentiment: String, // "BULLISH", "BEARISH", "NEUTRAL"
    val confidenceScore: Int, // 0-100
    val summary: String,
    val summaryAr: String,
    val support1: Double,
    val support2: Double,
    val resistance1: Double,
    val resistance2: Double,
    val recommendedAction: String, // "STRONG_BUY_LONG", "BUY_LONG", "HOLD", "SELL_SHORT", "STRONG_SELL_SHORT"
    val suggestedLeverage: Int,
    val suggestedEntryPrice: Double,
    val suggestedTakeProfit: Double,
    val suggestedStopLoss: Double,
    val rsi: Double,
    val macdSignal: String,
    val trend: String
)

@Serializable
data class MexcApiCredentials(
    val apiKey: String = "",
    val secretKey: String = "",
    val isConfigured: Boolean = false,
    val isValidated: Boolean = false
)
