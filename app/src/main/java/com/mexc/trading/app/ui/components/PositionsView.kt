package com.mexc.trading.app.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.mexc.trading.app.data.model.FuturesPosition
import com.mexc.trading.app.data.model.PositionSide
import com.mexc.trading.app.ui.theme.*

@Composable
fun PositionsView(
    positions: List<FuturesPosition>,
    onClosePosition: (String) -> Unit,
    onCloseAllPositions: () -> Unit = {},
    modifier: Modifier = Modifier
) {
    Column(
        modifier = modifier
            .fillMaxWidth()
            .testTag("positions_list")
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(vertical = 6.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text(
                text = "Open Positions (${positions.size})",
                color = TextPrimary,
                fontWeight = FontWeight.Bold,
                fontSize = 15.sp
            )

            if (positions.isNotEmpty()) {
                Button(
                    onClick = onCloseAllPositions,
                    colors = ButtonDefaults.buttonColors(containerColor = ShortRed),
                    shape = RoundedCornerShape(4.dp),
                    contentPadding = PaddingValues(horizontal = 8.dp, vertical = 2.dp),
                    modifier = Modifier.height(28.dp).testTag("btn_close_all_positions")
                ) {
                    Text(
                        text = "🚨 إغلاق كافة الصفقات",
                        color = TextPrimary,
                        fontSize = 10.sp,
                        fontWeight = FontWeight.Bold
                    )
                }
            }
        }

        if (positions.isEmpty()) {
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .background(DarkSurface, RoundedCornerShape(8.dp))
                    .padding(24.dp),
                contentAlignment = Alignment.Center
            ) {
                Text(
                    text = "No active positions. Place a market/limit order to open a position.",
                    color = TextMuted,
                    fontSize = 13.sp
                )
            }
        } else {
            Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                positions.forEach { pos ->
                    PositionCard(position = pos, onClosePosition = onClosePosition)
                }
            }
        }
    }
}

@Composable
private fun PositionCard(
    position: FuturesPosition,
    onClosePosition: (String) -> Unit
) {
    val isLong = position.side == PositionSide.LONG
    val badgeColor = if (isLong) LongGreen else ShortRed
    val pnlIsPositive = position.unrealizedPnL >= 0
    val pnlColor = if (pnlIsPositive) LongGreen else ShortRed

    Card(
        modifier = Modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(containerColor = DarkSurface),
        shape = RoundedCornerShape(8.dp)
    ) {
        Column(modifier = Modifier.padding(12.dp)) {
            // Top Row: Symbol, Side Badge, Leverage & PnL
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Box(
                        modifier = Modifier
                            .background(badgeColor.copy(alpha = 0.2f), RoundedCornerShape(4.dp))
                            .padding(horizontal = 6.dp, vertical = 2.dp)
                    ) {
                        Text(
                            text = if (isLong) "LONG" else "SHORT",
                            color = badgeColor,
                            fontWeight = FontWeight.Bold,
                            fontSize = 11.sp
                        )
                    }
                    Spacer(modifier = Modifier.width(6.dp))
                    Text(
                        text = position.symbol.replace("_", "/"),
                        color = TextPrimary,
                        fontWeight = FontWeight.Bold,
                        fontSize = 15.sp
                    )
                    Spacer(modifier = Modifier.width(6.dp))
                    Text(
                        text = "${position.leverage}x",
                        color = GoldWarning,
                        fontWeight = FontWeight.Bold,
                        fontSize = 12.sp
                    )
                }

                // PnL Summary
                Column(horizontalAlignment = Alignment.End) {
                    val pnlSign = if (pnlIsPositive) "+" else ""
                    val pnlText = "$pnlSign${String.format("%.2f", position.unrealizedPnL)} USDT"
                    val pnlPctText = "($pnlSign${String.format("%.2f", position.unrealizedPnLPercent)}%)"

                    Text(
                        text = pnlText,
                        color = pnlColor,
                        fontWeight = FontWeight.Bold,
                        fontSize = 14.sp
                    )
                    Text(
                        text = pnlPctText,
                        color = pnlColor,
                        fontSize = 11.sp,
                        fontWeight = FontWeight.SemiBold
                    )
                }
            }

            Spacer(modifier = Modifier.height(8.dp))

            // Details Grid (Entry Price, Mark Price, Liq Price, Margin)
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                PosDetailItem("Size", String.format("%.3f", position.size))
                PosDetailItem("Entry Price", String.format("%.2f", position.entryPrice))
                PosDetailItem("Mark Price", String.format("%.2f", position.markPrice))
                PosDetailItem("Liq. Price", String.format("%.2f", position.liquidationPrice))
            }

            Spacer(modifier = Modifier.height(6.dp))

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = "Margin: ${String.format("%.2f", position.margin)} USDT",
                    color = TextMuted,
                    fontSize = 11.sp
                )

                // Close Button
                Button(
                    onClick = { onClosePosition(position.id) },
                    colors = ButtonDefaults.buttonColors(containerColor = ShortRed),
                    shape = RoundedCornerShape(4.dp),
                    contentPadding = PaddingValues(horizontal = 12.dp, vertical = 4.dp),
                    modifier = Modifier.height(30.dp).testTag("btn_close_position")
                ) {
                    Text(
                        text = "Close Position",
                        color = TextPrimary,
                        fontSize = 11.sp,
                        fontWeight = FontWeight.Bold
                    )
                }
            }
        }
    }
}

@Composable
private fun PosDetailItem(label: String, value: String) {
    Column(horizontalAlignment = Alignment.CenterHorizontally) {
        Text(text = label, color = TextMuted, fontSize = 10.sp)
        Text(text = value, color = TextSecondary, fontSize = 11.sp, fontWeight = FontWeight.Medium)
    }
}
