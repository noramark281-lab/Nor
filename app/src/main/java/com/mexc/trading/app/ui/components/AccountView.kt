package com.mexc.trading.app.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Refresh
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.mexc.trading.app.data.model.AccountAsset
import com.mexc.trading.app.ui.theme.*

@Composable
fun AccountView(
    account: AccountAsset,
    onResetBalance: () -> Unit,
    modifier: Modifier = Modifier
) {
    val scrollState = rememberScrollState()
    val isPnlPositive = account.unrealizedPnL >= 0
    val pnlColor = if (isPnlPositive) LongGreen else ShortRed

    Column(
        modifier = modifier
            .fillMaxSize()
            .background(DarkCanvas)
            .padding(12.dp)
            .verticalScroll(scrollState)
    ) {
        // Equity Summary Card
        Card(
            modifier = Modifier.fillMaxWidth(),
            colors = CardDefaults.cardColors(containerColor = DarkSurface),
            shape = RoundedCornerShape(8.dp)
        ) {
            Column(modifier = Modifier.padding(16.dp)) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = "MEXC Futures Wallet Equity",
                        color = TextMuted,
                        fontSize = 13.sp,
                        fontWeight = FontWeight.Medium
                    )

                    Button(
                        onClick = onResetBalance,
                        colors = ButtonDefaults.buttonColors(containerColor = DarkCanvas),
                        shape = RoundedCornerShape(6.dp),
                        contentPadding = PaddingValues(horizontal = 8.dp, vertical = 4.dp),
                        modifier = Modifier.testTag("btn_reset_balance")
                    ) {
                        Icon(
                            imageVector = Icons.Default.Refresh,
                            contentDescription = "Reset",
                            tint = CyanAccent,
                            modifier = Modifier.size(16.dp)
                        )
                        Spacer(modifier = Modifier.width(4.dp))
                        Text("Reset Simulation", color = CyanAccent, fontSize = 11.sp)
                    }
                }

                Spacer(modifier = Modifier.height(8.dp))
                Text(
                    text = "${String.format("%.2f", account.equity)} ${account.currency}",
                    color = TextPrimary,
                    fontSize = 26.sp,
                    fontWeight = FontWeight.Bold
                )

                Spacer(modifier = Modifier.height(12.dp))
                Divider(color = DarkCardBorder)
                Spacer(modifier = Modifier.height(12.dp))

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    AccStatItem("Available Balance", "${String.format("%.2f", account.availableBalance)} USDT")
                    AccStatItem("Position Margin", "${String.format("%.2f", account.positionMargin)} USDT")
                    AccStatItem("Frozen Balance", "${String.format("%.2f", account.frozenBalance)} USDT")
                }
            }
        }

        Spacer(modifier = Modifier.height(12.dp))

        // Unrealized PnL Details Card
        Card(
            modifier = Modifier.fillMaxWidth(),
            colors = CardDefaults.cardColors(containerColor = DarkSurface),
            shape = RoundedCornerShape(8.dp)
        ) {
            Column(modifier = Modifier.padding(16.dp)) {
                Text(
                    text = "Total Unrealized PnL",
                    color = TextMuted,
                    fontSize = 13.sp
                )
                Spacer(modifier = Modifier.height(6.dp))
                val sign = if (isPnlPositive) "+" else ""
                Text(
                    text = "$sign${String.format("%.2f", account.unrealizedPnL)} USDT (${sign}${String.format("%.2f", account.unrealizedPnLPercent)}%)",
                    color = pnlColor,
                    fontSize = 20.sp,
                    fontWeight = FontWeight.Bold
                )
            }
        }

        Spacer(modifier = Modifier.height(12.dp))

        // Risk & Account Safety Stats
        Card(
            modifier = Modifier.fillMaxWidth(),
            colors = CardDefaults.cardColors(containerColor = DarkSurface),
            shape = RoundedCornerShape(8.dp)
        ) {
            Column(modifier = Modifier.padding(16.dp)) {
                Text(
                    text = "Account Risk Overview",
                    color = TextPrimary,
                    fontWeight = FontWeight.Bold,
                    fontSize = 15.sp
                )
                Spacer(modifier = Modifier.height(8.dp))
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    val marginRatio = if (account.equity > 0) (account.positionMargin / account.equity) * 100 else 0.0
                    AccStatItem("Margin Usage Ratio", String.format("%.1f%%", marginRatio))
                    AccStatItem("Account Status", if (marginRatio < 60) "SAFE" else "WARNING")
                    AccStatItem("Default Leverage", "20x Cross")
                }
            }
        }
    }
}

@Composable
private fun AccStatItem(label: String, value: String) {
    Column {
        Text(text = label, color = TextMuted, fontSize = 11.sp)
        Text(text = value, color = TextSecondary, fontSize = 12.sp, fontWeight = FontWeight.Bold)
    }
}
