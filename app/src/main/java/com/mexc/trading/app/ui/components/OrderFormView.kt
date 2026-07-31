package com.mexc.trading.app.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.mexc.trading.app.data.model.OrderType
import com.mexc.trading.app.data.model.PositionSide
import com.mexc.trading.app.ui.theme.*

@Composable
fun OrderFormView(
    symbol: String,
    currentPrice: Double,
    availableBalance: Double,
    onExecuteOrder: (
        side: PositionSide,
        type: OrderType,
        price: Double,
        size: Double,
        leverage: Int,
        tpPrice: Double?,
        slPrice: Double?
    ) -> Unit,
    modifier: Modifier = Modifier
) {
    var selectedSide by remember { mutableStateOf(PositionSide.LONG) }
    var selectedType by remember { mutableStateOf(OrderType.MARKET) }
    var leverage by remember { mutableIntStateOf(10) }

    var limitPriceText by remember(currentPrice, selectedType) {
        mutableStateOf(String.format("%.2f", currentPrice))
    }
    var amountText by remember { mutableStateOf("0.05") }
    var tpPriceText by remember { mutableStateOf("") }
    var slPriceText by remember { mutableStateOf("") }
    var enableTpSl by remember { mutableStateOf(false) }

    val leverageOptions = listOf(5, 10, 25, 50, 100)
    val pctOptions = listOf(25, 50, 75, 100)

    Column(
        modifier = modifier
            .fillMaxWidth()
            .background(DarkSurface, RoundedCornerShape(8.dp))
            .padding(12.dp)
            .testTag("order_form")
    ) {
        // 1. Long / Short Side Selector
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            Button(
                onClick = { selectedSide = PositionSide.LONG },
                modifier = Modifier
                    .weight(1f)
                    .height(38.dp)
                    .testTag("btn_side_long"),
                colors = ButtonDefaults.buttonColors(
                    containerColor = if (selectedSide == PositionSide.LONG) LongGreen else DarkCanvas
                ),
                shape = RoundedCornerShape(6.dp)
            ) {
                Text(
                    text = "Open Long",
                    fontWeight = FontWeight.Bold,
                    color = if (selectedSide == PositionSide.LONG) TextPrimary else TextSecondary
                )
            }

            Button(
                onClick = { selectedSide = PositionSide.SHORT },
                modifier = Modifier
                    .weight(1f)
                    .height(38.dp)
                    .testTag("btn_side_short"),
                colors = ButtonDefaults.buttonColors(
                    containerColor = if (selectedSide == PositionSide.SHORT) ShortRed else DarkCanvas
                ),
                shape = RoundedCornerShape(6.dp)
            ) {
                Text(
                    text = "Open Short",
                    fontWeight = FontWeight.Bold,
                    color = if (selectedSide == PositionSide.SHORT) TextPrimary else TextSecondary
                )
            }
        }

        Spacer(modifier = Modifier.height(10.dp))

        // 2. Market vs Limit Toggle & Leverage Selection
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            // Order Type Segment
            Row(
                modifier = Modifier
                    .background(DarkCanvas, RoundedCornerShape(6.dp))
                    .padding(2.dp)
            ) {
                Box(
                    modifier = Modifier
                        .background(
                            if (selectedType == OrderType.MARKET) CyanAccentContainer else Color.Transparent,
                            RoundedCornerShape(4.dp)
                        )
                        .clickable { selectedType = OrderType.MARKET }
                        .padding(horizontal = 10.dp, vertical = 4.dp)
                ) {
                    Text(
                        text = "Market",
                        color = if (selectedType == OrderType.MARKET) CyanAccent else TextMuted,
                        fontSize = 12.sp,
                        fontWeight = FontWeight.Bold
                    )
                }
                Box(
                    modifier = Modifier
                        .background(
                            if (selectedType == OrderType.LIMIT) CyanAccentContainer else Color.Transparent,
                            RoundedCornerShape(4.dp)
                        )
                        .clickable { selectedType = OrderType.LIMIT }
                        .padding(horizontal = 10.dp, vertical = 4.dp)
                ) {
                    Text(
                        text = "Limit",
                        color = if (selectedType == OrderType.LIMIT) CyanAccent else TextMuted,
                        fontSize = 12.sp,
                        fontWeight = FontWeight.Bold
                    )
                }
            }

            // Leverage Badge
            Text(
                text = "${leverage}x Cross",
                color = GoldWarning,
                fontSize = 13.sp,
                fontWeight = FontWeight.Bold,
                modifier = Modifier
                    .background(DarkCanvas, RoundedCornerShape(4.dp))
                    .padding(horizontal = 8.dp, vertical = 4.dp)
            )
        }

        // Quick Leverage Chips
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(vertical = 6.dp),
            horizontalArrangement = Arrangement.spacedBy(4.dp)
        ) {
            leverageOptions.forEach { lev ->
                Box(
                    modifier = Modifier
                        .weight(1f)
                        .background(
                            if (leverage == lev) GoldWarning.copy(alpha = 0.2f) else DarkCanvas,
                            RoundedCornerShape(4.dp)
                        )
                        .border(
                            1.dp,
                            if (leverage == lev) GoldWarning else Color.Transparent,
                            RoundedCornerShape(4.dp)
                        )
                        .clickable { leverage = lev }
                        .padding(vertical = 4.dp),
                    contentAlignment = Alignment.Center
                ) {
                    Text(
                        text = "${lev}x",
                        color = if (leverage == lev) GoldWarning else TextSecondary,
                        fontSize = 11.sp,
                        fontWeight = FontWeight.Bold
                    )
                }
            }
        }

        // 3. Limit Price Input (if Limit order selected)
        if (selectedType == OrderType.LIMIT) {
            OutlinedTextField(
                value = limitPriceText,
                onValueChange = { limitPriceText = it },
                label = { Text("Limit Price (USDT)") },
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(vertical = 4.dp)
                    .testTag("input_limit_price"),
                keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                colors = OutlinedTextFieldDefaults.colors(
                    focusedBorderColor = CyanAccent,
                    unfocusedBorderColor = DarkCardBorder,
                    focusedLabelColor = CyanAccent,
                    unfocusedLabelColor = TextMuted
                ),
                singleLine = true
            )
        }

        // 4. Contract Amount / Size Input
        OutlinedTextField(
            value = amountText,
            onValueChange = { amountText = it },
            label = { Text("Amount / Contracts (${symbol.split("_").firstOrNull() ?: "BTC"})") },
            modifier = Modifier
                .fillMaxWidth()
                .padding(vertical = 4.dp)
                .testTag("input_order_amount"),
            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
            colors = OutlinedTextFieldDefaults.colors(
                focusedBorderColor = CyanAccent,
                unfocusedBorderColor = DarkCardBorder,
                focusedLabelColor = CyanAccent,
                unfocusedLabelColor = TextMuted
            ),
            singleLine = true
        )

        // Percentage Balance Chips (25%, 50%, 75%, 100%)
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(vertical = 4.dp),
            horizontalArrangement = Arrangement.spacedBy(4.dp)
        ) {
            pctOptions.forEach { pct ->
                Box(
                    modifier = Modifier
                        .weight(1f)
                        .background(DarkCanvas, RoundedCornerShape(4.dp))
                        .clickable {
                            val priceToUse = limitPriceText.toDoubleOrNull() ?: currentPrice
                            if (priceToUse > 0) {
                                val maxMargin = (availableBalance * (pct / 100.0))
                                val maxVolume = (maxMargin * leverage) / priceToUse
                                amountText = String.format("%.3f", maxVolume)
                            }
                        }
                        .padding(vertical = 4.dp),
                    contentAlignment = Alignment.Center
                ) {
                    Text(
                        text = "$pct%",
                        color = TextSecondary,
                        fontSize = 11.sp,
                        fontWeight = FontWeight.Bold
                    )
                }
            }
        }

        // 5. TP / SL Toggle & Inputs
        Row(
            modifier = Modifier.fillMaxWidth(),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Checkbox(
                checked = enableTpSl,
                onCheckedChange = { enableTpSl = it },
                colors = CheckboxDefaults.colors(checkedColor = CyanAccent)
            )
            Text(text = "Take Profit / Stop Loss", color = TextSecondary, fontSize = 12.sp)
        }

        if (enableTpSl) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                OutlinedTextField(
                    value = tpPriceText,
                    onValueChange = { tpPriceText = it },
                    label = { Text("TP Price") },
                    modifier = Modifier.weight(1f),
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedBorderColor = LongGreen,
                        unfocusedBorderColor = DarkCardBorder
                    ),
                    singleLine = true
                )
                OutlinedTextField(
                    value = slPriceText,
                    onValueChange = { slPriceText = it },
                    label = { Text("SL Price") },
                    modifier = Modifier.weight(1f),
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedBorderColor = ShortRed,
                        unfocusedBorderColor = DarkCardBorder
                    ),
                    singleLine = true
                )
            }
        }

        Spacer(modifier = Modifier.height(10.dp))

        // Calculated Required Margin Display
        val sizeVal = amountText.toDoubleOrNull() ?: 0.0
        val priceVal = if (selectedType == OrderType.LIMIT) (limitPriceText.toDoubleOrNull() ?: currentPrice) else currentPrice
        val reqMargin = (sizeVal * priceVal) / leverage

        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(bottom = 8.dp),
            horizontalArrangement = Arrangement.SpaceBetween
        ) {
            Text(text = "Margin Required:", color = TextMuted, fontSize = 11.sp)
            Text(
                text = "${String.format("%.2f", reqMargin)} USDT",
                color = TextPrimary,
                fontSize = 11.sp,
                fontWeight = FontWeight.Bold
            )
        }

        // Execute Button
        val buttonColor = if (selectedSide == PositionSide.LONG) LongGreen else ShortRed
        val actionTag = if (selectedSide == PositionSide.LONG) "btn_open_long" else "btn_open_short"
        val actionLabel = if (selectedSide == PositionSide.LONG) "BUY / LONG $symbol" else "SELL / SHORT $symbol"

        Button(
            onClick = {
                val tp = if (enableTpSl) tpPriceText.toDoubleOrNull() else null
                val sl = if (enableTpSl) slPriceText.toDoubleOrNull() else null
                onExecuteOrder(
                    selectedSide,
                    selectedType,
                    priceVal,
                    sizeVal,
                    leverage,
                    tp,
                    sl
                )
            },
            modifier = Modifier
                .fillMaxWidth()
                .height(46.dp)
                .testTag(actionTag),
            colors = ButtonDefaults.buttonColors(containerColor = buttonColor),
            shape = RoundedCornerShape(8.dp)
        ) {
            Text(
                text = actionLabel,
                color = TextPrimary,
                fontWeight = FontWeight.Bold,
                fontSize = 15.sp
            )
        }
    }
}
