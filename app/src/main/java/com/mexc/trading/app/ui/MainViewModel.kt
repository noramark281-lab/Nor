package com.mexc.trading.app.ui

import android.app.Application
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.mexc.trading.app.data.model.*
import com.mexc.trading.app.repository.MexcRepository
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch

class MainViewModel(application: Application) : AndroidViewModel(application) {

    private val repository = MexcRepository(application)

    val tickers: StateFlow<List<MarketTicker>> = repository.tickers
    val selectedSymbol: StateFlow<String> = repository.selectedSymbol
    val klines: StateFlow<List<KlineCandle>> = repository.klines
    val orderBook: StateFlow<OrderBookData> = repository.orderBook
    val tradingMode: StateFlow<TradingMode> = repository.tradingMode
    val language: StateFlow<AppLanguage> = repository.language

    val aiAnalysis: StateFlow<AIAnalysisResult?> = repository.aiAnalysis
    val isAiLoading: StateFlow<Boolean> = repository.isAiLoading
    val latencyMs: StateFlow<Long> = repository.latencyMs
    val isConnected: StateFlow<Boolean> = repository.isConnected

    val bots: StateFlow<List<BotStrategyConfig>> = repository.bots
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

    val botLogs: StateFlow<List<BotLog>> = repository.botLogs
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

    val positions: StateFlow<List<FuturesPosition>> = repository.positions
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

    val credentials: StateFlow<MexcApiCredentials> = repository.credentials
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), MexcApiCredentials())

    val account: StateFlow<AccountAsset> = repository.account
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), AccountAsset())

    fun selectSymbol(symbol: String) {
        repository.setSelectedSymbol(symbol)
    }

    fun setTradingMode(mode: TradingMode) {
        repository.setTradingMode(mode)
    }

    fun setLanguage(lang: AppLanguage) {
        repository.setLanguage(lang)
    }

    fun saveCredentials(apiKey: String, secretKey: String) {
        viewModelScope.launch {
            repository.saveCredentials(apiKey, secretKey)
        }
    }

    fun openPosition(
        symbol: String,
        side: PositionSide,
        type: OrderType,
        price: Double,
        size: Double,
        leverage: Int,
        tpPrice: Double? = null,
        slPrice: Double? = null
    ) {
        viewModelScope.launch {
            repository.openPosition(symbol, side, type, price, size, leverage, tpPrice, slPrice)
        }
    }

    fun closePosition(positionId: String) {
        viewModelScope.launch {
            repository.closePosition(positionId)
        }
    }

    fun closeAllPositions() {
        viewModelScope.launch {
            repository.closeAllPositions()
        }
    }

    fun saveBot(bot: BotStrategyConfig) {
        viewModelScope.launch {
            repository.saveBot(bot)
        }
    }

    fun toggleBotStatus(botId: String) {
        viewModelScope.launch {
            repository.toggleBotStatus(botId)
        }
    }

    fun deleteBot(botId: String) {
        viewModelScope.launch {
            repository.deleteBot(botId)
        }
    }

    fun resetAccountBalance() {
        viewModelScope.launch {
            repository.resetAccountBalance()
        }
    }

    fun generateAiAnalysis(symbol: String, userQuestion: String? = null) {
        viewModelScope.launch {
            repository.generateAiMarketAnalysis(symbol, userQuestion)
        }
    }
}
