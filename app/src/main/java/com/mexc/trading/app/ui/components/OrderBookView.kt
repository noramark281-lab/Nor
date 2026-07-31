package com.mexc.trading.app.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.mexc.trading.app.data.model.OrderBookData
import com.mexc.trading.app.data.model.OrderBookEntry
import com.mexc.trading.app.ui.theme.*

@Composable
fun OrderBookView(
    orderBook: OrderBookData,
    modifier: Modifier = Modifier
) {
    val maxAskTotal = orderBook.asks.maxOfOrNull { it.total } ?: 1.0
    val maxBidTotal = orderBook.bids.maxOfOrNull { it.total } ?: 1.0
    val maxTotal = kotlin.math.max(maxAskTotal, maxBidTotal)

    Column(
        modifier = modifier
            .fillMaxWidth()
            .background(DarkSurface, RoundedCornerShape(8.dp))
            .padding(8.dp)
            .testTag("order_book")
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(bottom = 6.dp),
            horizontalArrangement = Arrangement.SpaceBetween
        ) {
            Text(text = "Price (USDT)", color = TextMuted, fontSize = 11.sp, fontWeight = FontWeight.Bold)
            Text(text = "Size", color = TextMuted, fontSize = 11.sp, fontWeight = FontWeight.Bold)
            Text(text = "Total", color = TextMuted, fontSize = 11.sp, fontWeight = FontWeight.Bold)
        }

        // Asks (Sells) - Red (Top 5)
        Column {
            orderBook.asks.take(5).reversed().forEach { ask ->
                OrderBookRow(entry = ask, isAsk = true, maxTotal = maxTotal)
            }
        }

        Spacer(modifier = Modifier.height(4.dp))
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .height(1.dp)
                .background(DarkCardBorder)
        )
        Spacer(modifier = Modifier.height(4.dp))

        // Bids (Buys) - Green (Top 5)
        Column {
            orderBook.bids.take(5).forEach { bid ->
                OrderBookRow(entry = bid, isAsk = false, maxTotal = maxTotal)
            }
        }
    }
}

@Composable
private fun OrderBookRow(
    entry: OrderBookEntry,
    isAsk: Boolean,
    maxTotal: Double
) {
    val fillWidthFraction = ((entry.total / maxTotal)).coerceIn(0.05, 1.0).toFloat()
    val barColor = if (isAsk) ShortRed.copy(alpha = 0.15f) else LongGreen.copy(alpha = 0.15f)
    val priceColor = if (isAsk) ShortRed else LongGreen

    Box(
        modifier = Modifier
            .fillMaxWidth()
            .height(20.dp)
    ) {
        // Visual Depth Bar Background
        Box(
            modifier = Modifier
                .fillMaxHeight()
                .fillMaxWidth(fillWidthFraction)
                .align(Alignment.CenterEnd)
                .background(barColor, RoundedCornerShape(2.dp))
        )

        // Text Content
        Row(
            modifier = Modifier
                .fillMaxSize()
                .padding(horizontal = 4.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text(
                text = String.format(java.util.Locale.US, "%.2f", entry.price),
                color = priceColor,
                fontSize = 11.sp,
                fontWeight = FontWeight.SemiBold
            )
            Text(
                text = String.format(java.util.Locale.US, "%.3f", entry.amount),
                color = TextPrimary,
                fontSize = 11.sp
            )
            Text(
                text = String.format(java.util.Locale.US, "%.2f", entry.total),
                color = TextSecondary,
                fontSize = 11.sp
            )
        }
    }
}
