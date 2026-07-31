package com.mexc.trading.app.ui

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Build
import androidx.compose.material.icons.filled.List
import androidx.compose.material.icons.filled.Person
import androidx.compose.material.icons.filled.Settings
import androidx.compose.material.icons.filled.Star
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.mexc.trading.app.data.model.TradingMode
import com.mexc.trading.app.ui.components.*
import com.mexc.trading.app.ui.theme.*

enum class AppTab(val title: String, val testTag: String) {
    TERMINAL("Terminal", "tab_terminal"),
    BOTS("Bots", "tab_bots"),
    AI_SIGNALS("AI Signals", "tab_ai"),
    ACCOUNT("Account", "tab_account"),
    SETTINGS("Settings", "tab_settings")
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun MainScreen(viewModel: MainViewModel) {
    var selectedTab by remember { mutableStateOf(AppTab.TERMINAL) }

    val tickers by viewModel.tickers.collectAsStateWithLifecycle()
    val selectedSymbol by viewModel.selectedSymbol.collectAsStateWithLifecycle()
    val klines by viewModel.klines.collectAsStateWithLifecycle()
    val orderBook by viewModel.orderBook.collectAsStateWithLifecycle()
    val tradingMode by viewModel.tradingMode.collectAsStateWithLifecycle()
    val language by viewModel.language.collectAsStateWithLifecycle()

    val aiAnalysis by viewModel.aiAnalysis.collectAsStateWithLifecycle()
    val isAiLoading by viewModel.isAiLoading.collectAsStateWithLifecycle()
    val latencyMs by viewModel.latencyMs.collectAsStateWithLifecycle()
    val isConnected by viewModel.isConnected.collectAsStateWithLifecycle()

    val bots by viewModel.bots.collectAsStateWithLifecycle()
    val botLogs by viewModel.botLogs.collectAsStateWithLifecycle()
    val positions by viewModel.positions.collectAsStateWithLifecycle()
    val credentials by viewModel.credentials.collectAsStateWithLifecycle()
    val account by viewModel.account.collectAsStateWithLifecycle()

    val symbolList = listOf("BTC_USDT", "ETH_USDT", "SOL_USDT", "XRP_USDT", "BNB_USDT", "DOGE_USDT")
    val currentTicker = tickers.find { it.symbol == selectedSymbol }

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Text(
                            text = "MEXC",
                            color = CyanAccent,
                            fontWeight = FontWeight.Bold,
                            fontSize = 18.sp
                        )
                        Spacer(modifier = Modifier.width(4.dp))
                        Text(
                            text = "FUTURES",
                            color = TextPrimary,
                            fontWeight = FontWeight.Bold,
                            fontSize = 16.sp
                        )
                    }
                },
                actions = {
                    // Connection Status & Ping Latency
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        modifier = Modifier.padding(end = 8.dp)
                    ) {
                        Box(
                            modifier = Modifier
                                .size(8.dp)
                                .background(
                                    color = if (isConnected) LongGreen else ShortRed,
                                    shape = MaterialTheme.shapes.extraSmall
                                )
                        )
                        Spacer(modifier = Modifier.width(4.dp))
                        Text(
                            text = if (isConnected) "${latencyMs}ms" else "Offline",
                            color = if (isConnected && latencyMs < 150) LongGreen else GoldWarning,
                            fontSize = 11.sp,
                            fontWeight = FontWeight.Bold
                        )
                    }

                    // Mode Badge (Live vs Simulation)
                    Box(
                        modifier = Modifier
                            .padding(end = 8.dp)
                            .background(
                                color = if (tradingMode == TradingMode.LIVE) LongGreenContainer else CyanAccentContainer,
                                shape = MaterialTheme.shapes.small
                            )
                            .padding(horizontal = 8.dp, vertical = 4.dp)
                    ) {
                        Text(
                            text = if (tradingMode == TradingMode.LIVE) "LIVE API" else "PAPER SIM",
                            color = if (tradingMode == TradingMode.LIVE) LongGreen else CyanAccent,
                            fontSize = 11.sp,
                            fontWeight = FontWeight.Bold
                        )
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = DarkSurface)
            )
        },
        bottomBar = {
            NavigationBar(
                containerColor = DarkSurface,
                modifier = Modifier.windowInsetsPadding(WindowInsets.navigationBars)
            ) {
                AppTab.values().forEach { tab ->
                    val isSelected = selectedTab == tab
                    NavigationBarItem(
                        selected = isSelected,
                        onClick = { selectedTab = tab },
                        modifier = Modifier.testTag(tab.testTag),
                        icon = {
                            val iconVector = when (tab) {
                                AppTab.TERMINAL -> Icons.Default.List
                                AppTab.BOTS -> Icons.Default.Build
                                AppTab.AI_SIGNALS -> Icons.Default.Star
                                AppTab.ACCOUNT -> Icons.Default.Person
                                AppTab.SETTINGS -> Icons.Default.Settings
                            }
                            Icon(
                                imageVector = iconVector,
                                contentDescription = tab.title,
                                tint = if (isSelected) CyanAccent else TextMuted
                            )
                        },
                        label = {
                            Text(
                                text = tab.title,
                                color = if (isSelected) CyanAccent else TextMuted,
                                fontSize = 11.sp,
                                fontWeight = if (isSelected) FontWeight.Bold else FontWeight.Normal
                            )
                        },
                        colors = NavigationBarItemDefaults.colors(
                            indicatorColor = CyanAccentContainer
                        )
                    )
                }
            }
        },
        containerColor = DarkCanvas
    ) { paddingValues ->
        Box(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
        ) {
            when (selectedTab) {
                AppTab.TERMINAL -> {
                    Column(modifier = Modifier.fillMaxSize()) {
                        // Ticker stats & symbol selector
                        TickerHeader(
                            symbolList = symbolList,
                            selectedSymbol = selectedSymbol,
                            currentTicker = currentTicker,
                            onSelectSymbol = { viewModel.selectSymbol(it) }
                        )

                        // Main Terminal Content
                        Column(
                            modifier = Modifier
                                .fillMaxSize()
                                .padding(8.dp)
                        ) {
                            // Candlestick Chart
                            KlineChart(klines = klines)

                            Spacer(modifier = Modifier.height(8.dp))

                            // Split Row: Order Book & Order Form
                            Row(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .weight(1f),
                                horizontalArrangement = Arrangement.spacedBy(8.dp)
                            ) {
                                OrderBookView(
                                    orderBook = orderBook,
                                    modifier = Modifier.weight(0.45f)
                                )

                                OrderFormView(
                                    symbol = selectedSymbol,
                                    currentPrice = currentTicker?.lastPrice ?: 67000.0,
                                    availableBalance = account.availableBalance,
                                    onExecuteOrder = { side, type, price, size, leverage, tp, sl ->
                                        viewModel.openPosition(
                                            symbol = selectedSymbol,
                                            side = side,
                                            type = type,
                                            price = price,
                                            size = size,
                                            leverage = leverage,
                                            tpPrice = tp,
                                            slPrice = sl
                                        )
                                    },
                                    modifier = Modifier.weight(0.55f)
                                )
                            }

                            Spacer(modifier = Modifier.height(8.dp))

                            // Active Positions List
                            PositionsView(
                                positions = positions,
                                onClosePosition = { posId -> viewModel.closePosition(posId) },
                                onCloseAllPositions = { viewModel.closeAllPositions() }
                            )
                        }
                    }
                }

                AppTab.BOTS -> {
                    BotManagerView(
                        bots = bots,
                        logs = botLogs,
                        onSaveBot = { viewModel.saveBot(it) },
                        onToggleBotStatus = { viewModel.toggleBotStatus(it) },
                        onDeleteBot = { viewModel.deleteBot(it) }
                    )
                }

                AppTab.AI_SIGNALS -> {
                    AiSignalsView(
                        selectedSymbol = selectedSymbol,
                        aiResult = aiAnalysis,
                        isLoading = isAiLoading,
                        onGenerateAnalysis = { sym, q -> viewModel.generateAiAnalysis(sym, q) }
                    )
                }

                AppTab.ACCOUNT -> {
                    AccountView(
                        account = account,
                        onResetBalance = { viewModel.resetAccountBalance() }
                    )
                }

                AppTab.SETTINGS -> {
                    SettingsView(
                        credentials = credentials,
                        tradingMode = tradingMode,
                        language = language,
                        onSaveCredentials = { api, sec -> viewModel.saveCredentials(api, sec) },
                        onSetTradingMode = { viewModel.setTradingMode(it) },
                        onSetLanguage = { viewModel.setLanguage(it) }
                    )
                }
            }
        }
    }
}
