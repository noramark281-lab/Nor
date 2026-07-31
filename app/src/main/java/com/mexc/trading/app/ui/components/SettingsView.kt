package com.mexc.trading.app.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.Lock
import androidx.compose.material.icons.filled.Warning
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.text.input.VisualTransformation
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.mexc.trading.app.data.model.AppLanguage
import com.mexc.trading.app.data.model.MexcApiCredentials
import com.mexc.trading.app.data.model.TradingMode
import com.mexc.trading.app.ui.theme.*

@Composable
fun SettingsView(
    credentials: MexcApiCredentials,
    tradingMode: TradingMode,
    language: AppLanguage,
    onSaveCredentials: (apiKey: String, secretKey: String) -> Unit,
    onSetTradingMode: (TradingMode) -> Unit,
    onSetLanguage: (AppLanguage) -> Unit,
    modifier: Modifier = Modifier
) {
    var apiKeyText by remember(credentials) { mutableStateOf(credentials.apiKey) }
    var secretKeyText by remember(credentials) { mutableStateOf(credentials.secretKey) }
    var showSecret by remember { mutableStateOf(false) }
    val scrollState = rememberScrollState()

    Column(
        modifier = modifier
            .fillMaxSize()
            .background(DarkCanvas)
            .padding(12.dp)
            .verticalScroll(scrollState)
    ) {
        // API Connection Status Banner
        Card(
            modifier = Modifier.fillMaxWidth(),
            colors = CardDefaults.cardColors(containerColor = DarkSurface),
            shape = RoundedCornerShape(8.dp)
        ) {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(12.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                Icon(
                    imageVector = if (credentials.isValidated) Icons.Default.CheckCircle else Icons.Default.Warning,
                    contentDescription = "Status",
                    tint = if (credentials.isValidated) LongGreen else GoldWarning,
                    modifier = Modifier.size(24.dp)
                )
                Spacer(modifier = Modifier.width(10.dp))
                Column {
                    Text(
                        text = if (credentials.isValidated) "MEXC API Connected & Validated" else "MEXC API Not Configured / Paper Mode",
                        color = TextPrimary,
                        fontWeight = FontWeight.Bold,
                        fontSize = 14.sp
                    )
                    Text(
                        text = if (credentials.isValidated) "Live API order execution active" else "Running in safe Paper Trading simulation mode",
                        color = TextMuted,
                        fontSize = 11.sp
                    )
                }
            }
        }

        Spacer(modifier = Modifier.height(12.dp))

        // API Key Setup Form
        Card(
            modifier = Modifier.fillMaxWidth(),
            colors = CardDefaults.cardColors(containerColor = DarkSurface),
            shape = RoundedCornerShape(8.dp)
        ) {
            Column(modifier = Modifier.padding(16.dp)) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Icon(imageVector = Icons.Default.Lock, contentDescription = "API", tint = CyanAccent)
                    Spacer(modifier = Modifier.width(8.dp))
                    Text(
                        text = "MEXC Futures API Credentials",
                        color = TextPrimary,
                        fontWeight = FontWeight.Bold,
                        fontSize = 16.sp
                    )
                }

                Spacer(modifier = Modifier.height(12.dp))

                OutlinedTextField(
                    value = apiKeyText,
                    onValueChange = { apiKeyText = it },
                    label = { Text("MEXC API Key") },
                    modifier = Modifier
                        .fillMaxWidth()
                        .testTag("input_api_key"),
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedBorderColor = CyanAccent,
                        unfocusedBorderColor = DarkCardBorder
                    ),
                    singleLine = true
                )

                Spacer(modifier = Modifier.height(8.dp))

                OutlinedTextField(
                    value = secretKeyText,
                    onValueChange = { secretKeyText = it },
                    label = { Text("MEXC Secret Key") },
                    modifier = Modifier
                        .fillMaxWidth()
                        .testTag("input_secret_key"),
                    visualTransformation = if (showSecret) VisualTransformation.None else PasswordVisualTransformation(),
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedBorderColor = CyanAccent,
                        unfocusedBorderColor = DarkCardBorder
                    ),
                    singleLine = true
                )

                Spacer(modifier = Modifier.height(12.dp))

                Button(
                    onClick = { onSaveCredentials(apiKeyText, secretKeyText) },
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(44.dp)
                        .testTag("btn_save_credentials"),
                    colors = ButtonDefaults.buttonColors(containerColor = CyanAccent),
                    shape = RoundedCornerShape(6.dp)
                ) {
                    Text("Validate & Save Credentials", color = DarkCanvas, fontWeight = FontWeight.Bold)
                }
            }
        }

        Spacer(modifier = Modifier.height(12.dp))

        // Trading Mode Switch
        Card(
            modifier = Modifier.fillMaxWidth(),
            colors = CardDefaults.cardColors(containerColor = DarkSurface),
            shape = RoundedCornerShape(8.dp)
        ) {
            Column(modifier = Modifier.padding(16.dp)) {
                Text(
                    text = "Trading Execution Mode",
                    color = TextPrimary,
                    fontWeight = FontWeight.Bold,
                    fontSize = 15.sp
                )
                Spacer(modifier = Modifier.height(8.dp))
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    Box(
                        modifier = Modifier
                            .weight(1f)
                            .background(
                                if (tradingMode == TradingMode.SIMULATION) CyanAccentContainer else DarkCanvas,
                                RoundedCornerShape(6.dp)
                            )
                            .clickable { onSetTradingMode(TradingMode.SIMULATION) }
                            .padding(vertical = 10.dp),
                        contentAlignment = Alignment.Center
                    ) {
                        Text(
                            text = "Simulation Mode (Paper)",
                            color = if (tradingMode == TradingMode.SIMULATION) CyanAccent else TextMuted,
                            fontWeight = FontWeight.Bold,
                            fontSize = 12.sp
                        )
                    }

                    Box(
                        modifier = Modifier
                            .weight(1f)
                            .background(
                                if (tradingMode == TradingMode.LIVE) LongGreenContainer else DarkCanvas,
                                RoundedCornerShape(6.dp)
                            )
                            .clickable { onSetTradingMode(TradingMode.LIVE) }
                            .padding(vertical = 10.dp),
                        contentAlignment = Alignment.Center
                    ) {
                        Text(
                            text = "Live MEXC API Mode",
                            color = if (tradingMode == TradingMode.LIVE) LongGreen else TextMuted,
                            fontWeight = FontWeight.Bold,
                            fontSize = 12.sp
                        )
                    }
                }
            }
        }

        Spacer(modifier = Modifier.height(12.dp))

        // Language Switcher (Arabic / English)
        Card(
            modifier = Modifier.fillMaxWidth(),
            colors = CardDefaults.cardColors(containerColor = DarkSurface),
            shape = RoundedCornerShape(8.dp)
        ) {
            Column(modifier = Modifier.padding(16.dp)) {
                Text(
                    text = "App Language / اللغة",
                    color = TextPrimary,
                    fontWeight = FontWeight.Bold,
                    fontSize = 15.sp
                )
                Spacer(modifier = Modifier.height(8.dp))
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    Box(
                        modifier = Modifier
                            .weight(1f)
                            .background(
                                if (language == AppLanguage.ARABIC) CyanAccentContainer else DarkCanvas,
                                RoundedCornerShape(6.dp)
                            )
                            .clickable { onSetLanguage(AppLanguage.ARABIC) }
                            .padding(vertical = 10.dp),
                        contentAlignment = Alignment.Center
                    ) {
                        Text(
                            text = "العربية (Arabic)",
                            color = if (language == AppLanguage.ARABIC) CyanAccent else TextMuted,
                            fontWeight = FontWeight.Bold,
                            fontSize = 13.sp
                        )
                    }

                    Box(
                        modifier = Modifier
                            .weight(1f)
                            .background(
                                if (language == AppLanguage.ENGLISH) CyanAccentContainer else DarkCanvas,
                                RoundedCornerShape(6.dp)
                            )
                            .clickable { onSetLanguage(AppLanguage.ENGLISH) }
                            .padding(vertical = 10.dp),
                        contentAlignment = Alignment.Center
                    ) {
                        Text(
                            text = "English",
                            color = if (language == AppLanguage.ENGLISH) CyanAccent else TextMuted,
                            fontWeight = FontWeight.Bold,
                            fontSize = 13.sp
                        )
                    }
                }
            }
        }
    }
}
