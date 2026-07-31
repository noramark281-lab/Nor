package com.mexc.trading.app.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowDropDown
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.mexc.trading.app.data.model.MarketTicker
import com.mexc.trading.app.ui.theme.*

@Composable
fun TickerHeader(
    symbolList: List<String>,
    selectedSymbol: String,
    currentTicker: MarketTicker?,
    onSelectSymbol: (String) -> Unit,
    modifier: Modifier = Modifier
) {
    var expanded by remember { mutableStateOf(false) }

    val lastPriceStr = currentTicker?.let { String.format("%.2f", it.lastPrice) } ?: "--"
    val isPositive = (currentTicker?.riseFallRate ?: 0.0) >= 0
    val changePctStr = currentTicker?.let {
        val pct = it.riseFallRate * 100
        val sign = if (pct >= 0) "+" else ""
        "$sign${String.format("%.2f", pct)}%"
    } ?: "0.00%"

    Surface(
        modifier = modifier.fillMaxWidth(),
        color = DarkSurface,
        shadowElevation = 4.dp
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 12.dp, vertical = 8.dp)
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                // Symbol Dropdown Selector
                Box {
                    Row(
                        modifier = Modifier
                            .background(DarkCanvas, RoundedCornerShape(8.dp))
                            .clickable { expanded = true }
                            .padding(horizontal = 12.dp, vertical = 6.dp)
                            .testTag("symbol_selector"),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text(
                            text = selectedSymbol.replace("_", "/"),
                            color = TextPrimary,
                            fontWeight = FontWeight.Bold,
                            fontSize = 16.sp
                        )
                        Icon(
                            imageVector = Icons.Default.ArrowDropDown,
                            contentDescription = "Select Symbol",
                            tint = TextSecondary
                        )
                    }

                    DropdownMenu(
                        expanded = expanded,
                        onDismissRequest = { expanded = false },
                        modifier = Modifier.background(DarkSurface)
                    ) {
                        symbolList.forEach { sym ->
                            DropdownMenuItem(
                                text = {
                                    Text(
                                        text = sym.replace("_", "/"),
                                        color = if (sym == selectedSymbol) CyanAccent else TextPrimary,
                                        fontWeight = if (sym == selectedSymbol) FontWeight.Bold else FontWeight.Normal
                                    )
                                },
                                onClick = {
                                    onSelectSymbol(sym)
                                    expanded = false
                                }
                            )
                        }
                    }
                }

                // Price & 24h Change %
                Column(horizontalAlignment = Alignment.End) {
                    Text(
                        text = "$lastPriceStr USDT",
                        color = if (isPositive) LongGreen else ShortRed,
                        fontSize = 18.sp,
                        fontWeight = FontWeight.Bold
                    )
                    Text(
                        text = changePctStr,
                        color = if (isPositive) LongGreen else ShortRed,
                        fontSize = 12.sp,
                        fontWeight = FontWeight.SemiBold
                    )
                }
            }

            Spacer(modifier = Modifier.height(6.dp))

            // Stats row (24h High, 24h Low, Funding Rate, Volume)
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                TickerStatItem(
                    label = "24h High",
                    value = currentTicker?.let { String.format("%.2f", it.high24Price) } ?: "--"
                )
                TickerStatItem(
                    label = "24h Low",
                    value = currentTicker?.let { String.format("%.2f", it.low24Price) } ?: "--"
                )
                TickerStatItem(
                    label = "Funding Rate",
                    value = currentTicker?.let { String.format("%.4f%%", it.fundingRate * 100) } ?: "--"
                )
                TickerStatItem(
                    label = "24h Vol",
                    value = currentTicker?.let { String.format("%.1fM", it.volume24 / 1_000_000) } ?: "--"
                )
            }
        }
    }
}

@Composable
private fun TickerStatItem(label: String, value: String) {
    Column(horizontalAlignment = Alignment.CenterHorizontally) {
        Text(text = label, color = TextMuted, fontSize = 10.sp)
        Text(text = value, color = TextSecondary, fontSize = 11.sp, fontWeight = FontWeight.Medium)
    }
}
