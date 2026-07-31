package com.mexc.trading.app.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Star
import androidx.compose.material.icons.filled.Send
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.mexc.trading.app.data.model.AIAnalysisResult
import com.mexc.trading.app.ui.theme.*

@Composable
fun AiSignalsView(
    selectedSymbol: String,
    aiResult: AIAnalysisResult?,
    isLoading: Boolean,
    onGenerateAnalysis: (symbol: String, question: String?) -> Unit,
    modifier: Modifier = Modifier
) {
    var promptInput by remember { mutableStateOf("") }
    val scrollState = rememberScrollState()

    Column(
        modifier = modifier
            .fillMaxSize()
            .background(DarkCanvas)
            .padding(12.dp)
            .verticalScroll(scrollState)
    ) {
        // Header Banner
        Card(
            modifier = Modifier.fillMaxWidth(),
            colors = CardDefaults.cardColors(containerColor = DarkSurface),
            shape = RoundedCornerShape(8.dp)
        ) {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(12.dp),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Icon(
                        imageVector = Icons.Default.Star,
                        contentDescription = "Gemini AI",
                        tint = PurpleAi,
                        modifier = Modifier.size(28.dp)
                    )
                    Spacer(modifier = Modifier.width(8.dp))
                    Column {
                        Text(
                            text = "Gemini AI Signal & Market Analyst",
                            color = TextPrimary,
                            fontSize = 16.sp,
                            fontWeight = FontWeight.Bold
                        )
                        Text(
                            text = "Real-time technical indicators & AI futures recommendations",
                            color = TextMuted,
                            fontSize = 11.sp
                        )
                    }
                }

                Button(
                    onClick = { onGenerateAnalysis(selectedSymbol, null) },
                    enabled = !isLoading,
                    colors = ButtonDefaults.buttonColors(containerColor = PurpleAi),
                    shape = RoundedCornerShape(6.dp),
                    modifier = Modifier.testTag("btn_analyze_symbol")
                ) {
                    if (isLoading) {
                        CircularProgressIndicator(
                            color = TextPrimary,
                            modifier = Modifier.size(16.dp),
                            strokeWidth = 2.dp
                        )
                    } else {
                        Text("Analyze $selectedSymbol", color = TextPrimary, fontWeight = FontWeight.Bold, fontSize = 12.sp)
                    }
                }
            }
        }

        Spacer(modifier = Modifier.height(10.dp))

        if (aiResult != null) {
            // 1. Sentiment Gauge & Confidence Card
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
                        Text(
                            text = "Market Sentiment: ${aiResult.sentiment}",
                            color = if (aiResult.sentiment == "BULLISH") LongGreen else if (aiResult.sentiment == "BEARISH") ShortRed else GoldWarning,
                            fontWeight = FontWeight.Bold,
                            fontSize = 16.sp
                        )
                        Box(
                            modifier = Modifier
                                .background(CyanAccentContainer, RoundedCornerShape(4.dp))
                                .padding(horizontal = 8.dp, vertical = 4.dp)
                        ) {
                            Text(
                                text = "Confidence: ${aiResult.confidenceScore}%",
                                color = CyanAccent,
                                fontWeight = FontWeight.Bold,
                                fontSize = 12.sp
                            )
                        }
                    }

                    Spacer(modifier = Modifier.height(8.dp))
                    Text(
                        text = aiResult.summary,
                        color = TextSecondary,
                        fontSize = 13.sp,
                        lineHeight = 18.sp
                    )
                    Spacer(modifier = Modifier.height(4.dp))
                    Text(
                        text = aiResult.summaryAr,
                        color = TextMuted,
                        fontSize = 12.sp,
                        lineHeight = 16.sp
                    )
                }
            }

            Spacer(modifier = Modifier.height(10.dp))

            // 2. Action Recommendation Banner
            val actionColor = when (aiResult.recommendedAction) {
                "STRONG_BUY_LONG", "BUY_LONG" -> LongGreen
                "STRONG_SELL_SHORT", "SELL_SHORT" -> ShortRed
                else -> GoldWarning
            }

            Card(
                modifier = Modifier
                    .fillMaxWidth()
                    .border(1.dp, actionColor, RoundedCornerShape(8.dp)),
                colors = CardDefaults.cardColors(containerColor = DarkSurface)
            ) {
                Column(modifier = Modifier.padding(12.dp)) {
                    Text(
                        text = "RECOMMENDED ACTION: ${aiResult.recommendedAction}",
                        color = actionColor,
                        fontWeight = FontWeight.Bold,
                        fontSize = 15.sp
                    )

                    Spacer(modifier = Modifier.height(8.dp))

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        AiStatItem("Suggested Leverage", "${aiResult.suggestedLeverage}x")
                        AiStatItem("Entry Price", String.format("%.2f", aiResult.suggestedEntryPrice))
                        AiStatItem("Take Profit", String.format("%.2f", aiResult.suggestedTakeProfit))
                        AiStatItem("Stop Loss", String.format("%.2f", aiResult.suggestedStopLoss))
                    }
                }
            }

            Spacer(modifier = Modifier.height(10.dp))

            // 3. Support & Resistance Levels
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                Card(
                    modifier = Modifier.weight(1f),
                    colors = CardDefaults.cardColors(containerColor = DarkSurface)
                ) {
                    Column(modifier = Modifier.padding(10.dp)) {
                        Text("Support Levels", color = LongGreen, fontWeight = FontWeight.Bold, fontSize = 13.sp)
                        Spacer(modifier = Modifier.height(4.dp))
                        Text("S1: ${String.format("%.2f", aiResult.support1)} USDT", color = TextSecondary, fontSize = 12.sp)
                        Text("S2: ${String.format("%.2f", aiResult.support2)} USDT", color = TextSecondary, fontSize = 12.sp)
                    }
                }

                Card(
                    modifier = Modifier.weight(1f),
                    colors = CardDefaults.cardColors(containerColor = DarkSurface)
                ) {
                    Column(modifier = Modifier.padding(10.dp)) {
                        Text("Resistance Levels", color = ShortRed, fontWeight = FontWeight.Bold, fontSize = 13.sp)
                        Spacer(modifier = Modifier.height(4.dp))
                        Text("R1: ${String.format("%.2f", aiResult.resistance1)} USDT", color = TextSecondary, fontSize = 12.sp)
                        Text("R2: ${String.format("%.2f", aiResult.resistance2)} USDT", color = TextSecondary, fontSize = 12.sp)
                    }
                }
            }

            Spacer(modifier = Modifier.height(10.dp))

            // 4. Technical Indicators
            Card(
                modifier = Modifier.fillMaxWidth(),
                colors = CardDefaults.cardColors(containerColor = DarkSurface)
            ) {
                Column(modifier = Modifier.padding(12.dp)) {
                    Text("Technical Indicators", color = TextPrimary, fontWeight = FontWeight.Bold, fontSize = 14.sp)
                    Spacer(modifier = Modifier.height(6.dp))
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        AiStatItem("RSI (14)", String.format("%.1f", aiResult.rsi))
                        AiStatItem("MACD Signal", aiResult.macdSignal)
                        AiStatItem("Trend", aiResult.trend)
                    }
                }
            }
        } else {
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .height(160.dp)
                    .background(DarkSurface, RoundedCornerShape(8.dp)),
                contentAlignment = Alignment.Center
            ) {
                Text(
                    text = "Tap 'Analyze $selectedSymbol' to run Gemini AI technical analysis.",
                    color = TextMuted,
                    fontSize = 13.sp
                )
            }
        }

        Spacer(modifier = Modifier.height(12.dp))

        // Ask Gemini Custom AI Prompt Input
        Card(
            modifier = Modifier.fillMaxWidth(),
            colors = CardDefaults.cardColors(containerColor = DarkSurface),
            shape = RoundedCornerShape(8.dp)
        ) {
            Column(modifier = Modifier.padding(12.dp)) {
                Text(
                    text = "Ask Gemini AI Futures Assistant",
                    color = TextPrimary,
                    fontWeight = FontWeight.Bold,
                    fontSize = 14.sp
                )
                Spacer(modifier = Modifier.height(6.dp))
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    OutlinedTextField(
                        value = promptInput,
                        onValueChange = { promptInput = it },
                        placeholder = { Text("e.g. What is the optimal stop loss for BTC long?", color = TextMuted) },
                        modifier = Modifier
                            .weight(1f)
                            .testTag("input_ai_prompt"),
                        colors = OutlinedTextFieldDefaults.colors(
                            focusedBorderColor = PurpleAi,
                            unfocusedBorderColor = DarkCardBorder
                        ),
                        singleLine = true
                    )
                    Spacer(modifier = Modifier.width(6.dp))
                    IconButton(
                        onClick = {
                            if (promptInput.isNotBlank()) {
                                onGenerateAnalysis(selectedSymbol, promptInput)
                                promptInput = ""
                            }
                        },
                        modifier = Modifier
                            .background(PurpleAi, RoundedCornerShape(8.dp))
                            .testTag("btn_send_ai")
                    ) {
                        Icon(imageVector = Icons.Default.Send, contentDescription = "Send", tint = TextPrimary)
                    }
                }
            }
        }
    }
}

@Composable
private fun AiStatItem(label: String, value: String) {
    Column(horizontalAlignment = Alignment.CenterHorizontally) {
        Text(text = label, color = TextMuted, fontSize = 10.sp)
        Text(text = value, color = TextSecondary, fontSize = 11.sp, fontWeight = FontWeight.Bold)
    }
}
