package com.mexc.trading.app.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.PlayArrow
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.mexc.trading.app.data.model.*
import com.mexc.trading.app.ui.theme.*
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale
import java.util.UUID

@Composable
fun BotManagerView(
    bots: List<BotStrategyConfig>,
    logs: List<BotLog>,
    onSaveBot: (BotStrategyConfig) -> Unit,
    onToggleBotStatus: (String) -> Unit,
    onDeleteBot: (String) -> Unit,
    modifier: Modifier = Modifier
) {
    var showCreateModal by remember { mutableStateOf(false) }
    var selectedTab by remember { mutableIntStateOf(0) } // 0: Strategies, 1: Live Logs

    Column(
        modifier = modifier
            .fillMaxSize()
            .background(DarkCanvas)
            .padding(12.dp)
    ) {
        // Header Banner with Create Bot FAB
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(bottom = 8.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Column {
                Text(
                    text = "24/7 Cloud Automated Trading",
                    color = TextPrimary,
                    fontSize = 18.sp,
                    fontWeight = FontWeight.Bold
                )
                Text(
                    text = "Deploy Grid, DCA & AI Trend strategies on MEXC Futures",
                    color = TextMuted,
                    fontSize = 12.sp
                )
            }

            Button(
                onClick = { showCreateModal = true },
                colors = ButtonDefaults.buttonColors(containerColor = CyanAccent),
                shape = RoundedCornerShape(8.dp),
                modifier = Modifier.testTag("btn_create_bot")
            ) {
                Icon(imageVector = Icons.Default.Add, contentDescription = "Add", tint = DarkCanvas)
                Spacer(modifier = Modifier.width(4.dp))
                Text(text = "New Bot", color = DarkCanvas, fontWeight = FontWeight.Bold)
            }
        }

        // Segmented Tabs: Strategies vs Live Logs
        TabRow(
            selectedTabIndex = selectedTab,
            containerColor = DarkSurface,
            contentColor = CyanAccent,
            modifier = Modifier.padding(vertical = 8.dp)
        ) {
            Tab(
                selected = selectedTab == 0,
                onClick = { selectedTab = 0 },
                text = { Text("Active Strategies (${bots.size})", fontWeight = FontWeight.Bold) }
            )
            Tab(
                selected = selectedTab == 1,
                onClick = { selectedTab = 1 },
                text = { Text("Live Bot Terminal Logs", fontWeight = FontWeight.Bold) }
            )
        }

        if (selectedTab == 0) {
            // Strategies List
            if (bots.isEmpty()) {
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .weight(1f)
                        .background(DarkSurface, RoundedCornerShape(8.dp))
                        .padding(24.dp),
                    contentAlignment = Alignment.Center
                ) {
                    Text(
                        text = "No trading bots created yet. Tap 'New Bot' to deploy an automated strategy.",
                        color = TextMuted,
                        fontSize = 13.sp
                    )
                }
            } else {
                LazyColumn(
                    modifier = Modifier.weight(1f),
                    verticalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    items(bots, key = { it.id }) { bot ->
                        BotCard(
                            bot = bot,
                            onToggleStatus = { onToggleBotStatus(bot.id) },
                            onDelete = { onDeleteBot(bot.id) }
                        )
                    }
                }
            }
        } else {
            // Live Logs Terminal Output
            LazyColumn(
                modifier = Modifier
                    .fillMaxWidth()
                    .weight(1f)
                    .background(DarkSurface, RoundedCornerShape(8.dp))
                    .padding(8.dp)
                    .testTag("bot_logs_terminal")
            ) {
                items(logs, key = { it.id }) { log ->
                    BotLogItem(log = log)
                }
            }
        }
    }

    if (showCreateModal) {
        CreateBotDialog(
            onDismiss = { showCreateModal = false },
            onSaveBot = { newBot ->
                onSaveBot(newBot)
                showCreateModal = false
            }
        )
    }
}

@Composable
private fun BotCard(
    bot: BotStrategyConfig,
    onToggleStatus: () -> Unit,
    onDelete: () -> Unit
) {
    val isRunning = bot.status == BotStatus.RUNNING
    val statusColor = if (isRunning) LongGreen else GoldWarning

    Card(
        modifier = Modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(containerColor = DarkSurface),
        shape = RoundedCornerShape(8.dp)
    ) {
        Column(modifier = Modifier.padding(12.dp)) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Box(
                        modifier = Modifier
                            .background(statusColor.copy(alpha = 0.2f), RoundedCornerShape(4.dp))
                            .padding(horizontal = 6.dp, vertical = 2.dp)
                    ) {
                        Text(
                            text = bot.status.name,
                            color = statusColor,
                            fontSize = 11.sp,
                            fontWeight = FontWeight.Bold
                        )
                    }
                    Spacer(modifier = Modifier.width(8.dp))
                    Text(text = bot.name, color = TextPrimary, fontWeight = FontWeight.Bold, fontSize = 15.sp)
                }

                Row {
                    IconButton(onClick = onToggleStatus) {
                        Icon(
                            imageVector = if (isRunning) Icons.Default.Close else Icons.Default.PlayArrow,
                            contentDescription = "Toggle Status",
                            tint = if (isRunning) ShortRed else LongGreen
                        )
                    }
                }
            }

            Spacer(modifier = Modifier.height(6.dp))

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                BotStat("Type", bot.type.name)
                BotStat("Symbol", bot.symbol.replace("_", "/"))
                BotStat("Leverage", "${bot.leverage}x")
                BotStat("Allocated", "${bot.allocatedMargin} USDT")
            }

            Spacer(modifier = Modifier.height(6.dp))
            Divider(color = DarkCardBorder)
            Spacer(modifier = Modifier.height(6.dp))

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                val winPct = if (bot.totalTrades > 0) (bot.winningTrades.toDouble() / bot.totalTrades) * 100 else 0.0
                BotStat("Total Trades", "${bot.totalTrades}")
                BotStat("Win Rate", String.format("%.1f%%", winPct))
                val profitColor = if (bot.profitUsdt >= 0) LongGreen else ShortRed
                Column(horizontalAlignment = Alignment.End) {
                    Text(text = "Total Profit", color = TextMuted, fontSize = 10.sp)
                    Text(
                        text = "${String.format("%.2f", bot.profitUsdt)} USDT",
                        color = profitColor,
                        fontWeight = FontWeight.Bold,
                        fontSize = 13.sp
                    )
                }
            }
        }
    }
}

@Composable
private fun BotStat(label: String, value: String) {
    Column {
        Text(text = label, color = TextMuted, fontSize = 10.sp)
        Text(text = value, color = TextSecondary, fontSize = 11.sp, fontWeight = FontWeight.SemiBold)
    }
}

@Composable
private fun BotLogItem(log: BotLog) {
    val levelColor = when (log.level) {
        LogLevel.SUCCESS -> LongGreen
        LogLevel.ERROR -> ShortRed
        LogLevel.WARN -> GoldWarning
        else -> CyanAccent
    }
    val timeStr = SimpleDateFormat("HH:mm:ss", Locale.getDefault()).format(Date(log.timestamp))

    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 3.dp),
        verticalAlignment = Alignment.Top
    ) {
        Text(
            text = "[$timeStr]",
            color = TextMuted,
            fontSize = 11.sp,
            fontFamily = FontFamily.Monospace,
            modifier = Modifier.padding(end = 6.dp)
        )
        Text(
            text = "[${log.strategyName}]",
            color = levelColor,
            fontSize = 11.sp,
            fontWeight = FontWeight.Bold,
            fontFamily = FontFamily.Monospace,
            modifier = Modifier.padding(end = 6.dp)
        )
        Text(
            text = log.message,
            color = TextPrimary,
            fontSize = 11.sp,
            fontFamily = FontFamily.Monospace
        )
    }
}

@Composable
private fun CreateBotDialog(
    onDismiss: () -> Unit,
    onSaveBot: (BotStrategyConfig) -> Unit
) {
    var name by remember { mutableStateOf("BTC Grid Bot") }
    var selectedType by remember { mutableStateOf(BotType.GRID) }
    var symbol by remember { mutableStateOf("BTC_USDT") }
    var leverageText by remember { mutableStateOf("10") }
    var marginText by remember { mutableStateOf("200") }
    var tpText by remember { mutableStateOf("3.0") }
    var slText by remember { mutableStateOf("1.5") }

    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("Deploy 24/7 Automated Bot Strategy", color = TextPrimary) },
        text = {
            Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                OutlinedTextField(
                    value = name,
                    onValueChange = { name = it },
                    label = { Text("Bot Name") },
                    singleLine = true
                )

                Row(horizontalArrangement = Arrangement.spacedBy(4.dp)) {
                    BotType.values().forEach { type ->
                        Box(
                            modifier = Modifier
                                .weight(1f)
                                .background(
                                    if (selectedType == type) CyanAccentContainer else DarkSurface,
                                    RoundedCornerShape(4.dp)
                                )
                                .clickable { selectedType = type }
                                .padding(vertical = 6.dp),
                            contentAlignment = Alignment.Center
                        ) {
                            Text(
                                text = type.name,
                                color = if (selectedType == type) CyanAccent else TextMuted,
                                fontSize = 10.sp,
                                fontWeight = FontWeight.Bold
                            )
                        }
                    }
                }

                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    OutlinedTextField(
                        value = leverageText,
                        onValueChange = { leverageText = it },
                        label = { Text("Leverage (x)") },
                        modifier = Modifier.weight(1f),
                        singleLine = true
                    )
                    OutlinedTextField(
                        value = marginText,
                        onValueChange = { marginText = it },
                        label = { Text("Margin (USDT)") },
                        modifier = Modifier.weight(1f),
                        singleLine = true
                    )
                }

                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    OutlinedTextField(
                        value = tpText,
                        onValueChange = { tpText = it },
                        label = { Text("Take Profit %") },
                        modifier = Modifier.weight(1f),
                        singleLine = true
                    )
                    OutlinedTextField(
                        value = slText,
                        onValueChange = { slText = it },
                        label = { Text("Stop Loss %") },
                        modifier = Modifier.weight(1f),
                        singleLine = true
                    )
                }
            }
        },
        confirmButton = {
            Button(
                onClick = {
                    val lev = leverageText.toIntOrNull() ?: 10
                    val margin = marginText.toDoubleOrNull() ?: 100.0
                    val tp = tpText.toDoubleOrNull() ?: 3.0
                    val sl = slText.toDoubleOrNull() ?: 1.5

                    val newBot = BotStrategyConfig(
                        id = UUID.randomUUID().toString(),
                        name = name,
                        type = selectedType,
                        symbol = symbol,
                        enabled = true,
                        leverage = lev,
                        allocatedMargin = margin,
                        takeProfitPercent = tp,
                        stopLossPercent = sl,
                        status = BotStatus.RUNNING,
                        lastRunTimestamp = System.currentTimeMillis()
                    )
                    onSaveBot(newBot)
                },
                colors = ButtonDefaults.buttonColors(containerColor = CyanAccent)
            ) {
                Text("Deploy Bot", color = DarkCanvas, fontWeight = FontWeight.Bold)
            }
        },
        dismissButton = {
            TextButton(onClick = onDismiss) {
                Text("Cancel", color = TextMuted)
            }
        },
        containerColor = DarkSurface
    )
}
