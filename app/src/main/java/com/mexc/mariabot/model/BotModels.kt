package com.mexc.mariabot.model

data class MEXCConfig(
    val apiKey: String = "",
    val apiSecret: String = "",
    val isSandbox: Boolean = false, // Default to real account execution mode when credentials exist
    val autoTransferRewards: Boolean = true,
    val leverage: Int = 20,
    val eventDurationMinutes: Int = 10, // Default 10m event contract
    val autoTradeStrategy: String = "BALANCED", // CONSERVATIVE, BALANCED, AGGRESSIVE
    val maxInvestmentPerTrade: Double = 10.0, // USDT per event contract
    val winPayoutRate: Double = 0.85 // 85% payout rate
)

data class EventContract(
    val id: String,
    val symbol: String = "BTCUSDT",
    val durationMinutes: Int = 10, // 10m, 30m, 60m, 1440m
    val prediction: String, // "HIGHER" (أعلى) or "LOWER" (أدنى)
    val amountUsdt: Double,
    val strikePrice: Double,
    val currentPrice: Double = strikePrice,
    val settlementPrice: Double? = null,
    val payoutRate: Double = 0.85,
    val pnl: Double = 0.0,
    val startTime: Long,
    val expiryTime: Long,
    val status: String = "ACTIVE" // "ACTIVE", "WON", "LOST", "CANCELLED"
)

data class TradePosition(
    val id: String,
    val pair: String = "BTCUSDT",
    val type: String, // "LONG" or "SHORT"
    val entryPrice: Double,
    val currentPrice: Double,
    val amount: Double,
    val leverage: Int,
    val pnl: Double = 0.0,
    val pnlPercent: Double = 0.0,
    val timestamp: Long,
    val status: String = "ACTIVE", // "ACTIVE" or "CLOSED"
    val stopLoss: Double? = null,
    val takeProfit: Double? = null
)

data class RewardTransferLog(
    val id: String,
    val amount: Double,
    val asset: String = "USDT",
    val fromAccount: String = "Spot Wallet (MEXC Rewards)",
    val toAccount: String = "Futures Wallet",
    val status: String = "SUCCESS",
    val timestamp: Long
)

data class BotLog(
    val id: String,
    val timestamp: Long,
    val type: String, // "INFO", "SUCCESS", "WARNING", "ERROR"
    val message: String
)

data class Candle(
    val time: Long,
    val open: Double,
    val high: Double,
    val low: Double,
    val close: Double,
    val volume: Double
)

enum class DashboardTab {
    DASHBOARD, MARKETS, FUTURES, EVENTS, WALLET, ORDERS, SETTINGS
}

