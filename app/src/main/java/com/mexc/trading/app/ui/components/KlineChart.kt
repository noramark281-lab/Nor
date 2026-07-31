package com.mexc.trading.app.ui.components

import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Text
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.mexc.trading.app.data.model.KlineCandle
import com.mexc.trading.app.ui.theme.*
import kotlin.math.abs
import kotlin.math.max
import kotlin.math.min

@Composable
fun KlineChart(
    klines: List<KlineCandle>,
    modifier: Modifier = Modifier
) {
    var selectedInterval by remember { mutableStateOf("15m") }
    val intervals = listOf("15m", "1h", "4h", "1D")

    Column(
        modifier = modifier
            .fillMaxWidth()
            .background(DarkCanvas)
            .padding(8.dp)
            .testTag("kline_chart")
    ) {
        // Timeframe Selector
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(bottom = 6.dp),
            horizontalArrangement = Arrangement.Start
        ) {
            intervals.forEach { interval ->
                Box(
                    modifier = Modifier
                        .padding(end = 6.dp)
                        .background(
                            color = if (selectedInterval == interval) CyanAccentContainer else DarkSurface,
                            shape = RoundedCornerShape(4.dp)
                        )
                        .clickable { selectedInterval = interval }
                        .padding(horizontal = 10.dp, vertical = 4.dp)
                ) {
                    Text(
                        text = interval,
                        color = if (selectedInterval == interval) CyanAccent else TextSecondary,
                        fontSize = 12.sp,
                        fontWeight = FontWeight.Bold
                    )
                }
            }
        }

        // Chart Canvas
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .height(200.dp)
                .background(DarkSurface, RoundedCornerShape(6.dp))
                .padding(8.dp)
        ) {
            if (klines.isEmpty()) {
                Text(
                    text = "Loading Candlestick Data...",
                    color = TextMuted,
                    fontSize = 12.sp,
                    modifier = Modifier.align(Alignment.Center)
                )
            } else {
                Canvas(modifier = Modifier.fillMaxSize()) {
                    val canvasWidth = size.width
                    val canvasHeight = size.height

                    val chartHeight = canvasHeight * 0.75f
                    val volumeHeight = canvasHeight * 0.20f
                    val volumeTop = canvasHeight * 0.80f

                    val candleCount = klines.size
                    val candleWidth = canvasWidth / candleCount
                    val candleBodyWidth = max(2f, candleWidth * 0.65f)

                    val maxPrice = klines.maxOfOrNull { it.high } ?: 1.0
                    val minPrice = klines.minOfOrNull { it.low } ?: 0.0
                    val priceRange = max(1.0, maxPrice - minPrice)

                    val maxVolume = klines.maxOfOrNull { it.volume } ?: 1.0

                    // Grid lines (horizontal)
                    val gridLines = 4
                    for (i in 0..gridLines) {
                        val y = (chartHeight / gridLines) * i
                        drawLine(
                            color = DarkCardBorder,
                            start = Offset(0f, y),
                            end = Offset(canvasWidth, y),
                            strokeWidth = 1f
                        )
                    }

                    // Render candles & volume bars
                    klines.forEachIndexed { index, candle ->
                        val x = index * candleWidth + candleWidth / 2f

                        // Candle Y coordinates
                        val highY = chartHeight - ((candle.high - minPrice) / priceRange * chartHeight).toFloat()
                        val lowY = chartHeight - ((candle.low - minPrice) / priceRange * chartHeight).toFloat()
                        val openY = chartHeight - ((candle.open - minPrice) / priceRange * chartHeight).toFloat()
                        val closeY = chartHeight - ((candle.close - minPrice) / priceRange * chartHeight).toFloat()

                        val isBullish = candle.close >= candle.open
                        val color = if (isBullish) LongGreen else ShortRed

                        // Draw Wick (High to Low line)
                        drawLine(
                            color = color,
                            start = Offset(x, highY),
                            end = Offset(x, lowY),
                            strokeWidth = 2f
                        )

                        // Draw Body (Open to Close rectangle)
                        val topY = min(openY, closeY)
                        val bodyHeight = max(2f, abs(openY - closeY))
                        drawRect(
                            color = color,
                            topLeft = Offset(x - candleBodyWidth / 2f, topY),
                            size = Size(candleBodyWidth, bodyHeight)
                        )

                        // Draw Volume Histogram Bar
                        val volBarHeight = ((candle.volume / maxVolume) * volumeHeight).toFloat()
                        drawRect(
                            color = color.copy(alpha = 0.4f),
                            topLeft = Offset(x - candleBodyWidth / 2f, canvasHeight - volBarHeight),
                            size = Size(candleBodyWidth, volBarHeight)
                        )
                    }
                }
            }
        }
    }
}
