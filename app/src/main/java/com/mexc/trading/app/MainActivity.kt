package com.nor.mexc.trading

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.security.crypto.EncryptedSharedPreferences
import androidx.security.crypto.MasterKey
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import okhttp3.*
import javax.crypto.Mac
import javax.crypto.spec.SecretKeySpec

class MainActivity : ComponentActivity() {
    private var livePrice by mutableStateOf("0.00")
    private var connectionStatus by mutableStateOf("Disconnected")
    private var apiKey by mutableStateOf("")
    private var secretKey by mutableStateOf("")
    private var tradeAmount by mutableStateOf("10")

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        val masterKey = MasterKey.Builder(applicationContext)
            .setKeyScheme(MasterKey.KeyScheme.AES256_GCM)
            .build()

        val securePrefs = EncryptedSharedPreferences.create(
            applicationContext,
            "mexc_secure_prefs",
            masterKey,
            EncryptedSharedPreferences.PrefKeyEncryptionScheme.AES256_SIV,
            EncryptedSharedPreferences.PrefValueEncryptionScheme.AES256_GCM
        )

        apiKey = securePrefs.getString("api_key", "") ?: ""
        secretKey = securePrefs.getString("secret_key", "") ?: ""

        connectWebSocket()

        setContent {
            MaterialTheme {
                Surface(
                    modifier = Modifier.fillMaxSize(),
                    color = Color(0xFF121212)
                ) {
                    TradingScreen(
                        livePrice = livePrice,
                        connectionStatus = connectionStatus,
                        apiKey = apiKey,
                        secretKey = secretKey,
                        tradeAmount = tradeAmount,
                        onApiKeyChange = { apiKey = it },
                        onSecretKeyChange = { secretKey = it },
                        onTradeAmountChange = { tradeAmount = it },
                        onSaveKeys = {
                            securePrefs.edit()
                                .putString("api_key", apiKey)
                                .putString("secret_key", secretKey)
                                .apply()
                        },
                        onExecuteTrade = { side ->
                            executeOrder(side, tradeAmount)
                        }
                    )
                }
            }
        }
    }

    private fun connectWebSocket() {
        val client = OkHttpClient()
        val request = Request.Builder()
            .url("wss://wbs.mexc.com/ws")
            .build()

        client.newWebSocket(request, object : WebSocketListener() {
            override fun onOpen(webSocket: WebSocket, response: Response) {
                connectionStatus = "Connected"
                val subscribeMsg = "{\"method\":\"SUBSCRIPTION\",\"params\":[\"spot@public.deals.v3.api@BTCUSDT\"]}"
                webSocket.send(subscribeMsg)
            }

            override fun onMessage(webSocket: WebSocket, text: String) {
                if (text.contains("p")) {
                    val priceMatch = "\"p\":\"([0-9.]+)\"".toRegex().find(text)
                    priceMatch?.groupValues?.get(1)?.let { price ->
                        livePrice = price
                    }
                }
            }

            override fun onFailure(webSocket: WebSocket, t: Throwable, response: Response?) {
                connectionStatus = "Error: ${t.localizedMessage}"
            }
        })
    }

    private fun hmacSha256(data: String, secret: String): String {
        val sha256HMAC = Mac.getInstance("HmacSHA256")
        val secretKeySpec = SecretKeySpec(secret.toByteArray(), "HmacSHA256")
        sha256HMAC.init(secretKeySpec)
        val hash = sha256HMAC.doFinal(data.toByteArray())
        return hash.joinToString("") { "%02x".format(it) }
    }

    private fun executeOrder(side: String, amount: String) {
        // High Speed Order Dispatcher
        kotlinx.coroutines.CoroutineScope(Dispatchers.IO).launch {
            val timestamp = System.currentTimeMillis()
            val queryString = "symbol=BTCUSDT&side=$side&type=MARKET&quantity=$amount&timestamp=$timestamp"
            val signature = hmacSha256(queryString, secretKey)
            // Implementation for MEXC REST API Call goes here
        }
    }
}

@Composable
fun TradingScreen(
    livePrice: String,
    connectionStatus: String,
    apiKey: String,
    secretKey: String,
    tradeAmount: String,
    onApiKeyChange: (String) -> Unit,
    onSecretKeyChange: (String) -> Unit,
    onTradeAmountChange: (String) -> Unit,
    onSaveKeys: () -> Unit,
    onExecuteTrade: (String) -> Unit
) {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        Text("MEXC Event Futures Bot", color = Color.White, fontSize = 20.sp, fontWeight = FontWeight.Bold)
        Spacer(modifier = Modifier.height(8.dp))
        Text("Status: $connectionStatus", color = if (connectionStatus == "Connected") Color.Green else Color.Red)
        Spacer(modifier = Modifier.height(16.dp))

        Box(
            modifier = Modifier
                .fillMaxWidth()
                .background(Color(0xFF1E1E1E), RoundedCornerShape(12.dp))
                .padding(24.dp),
            contentAlignment = Alignment.Center
        ) {
            Column(horizontalAlignment = Alignment.CenterHorizontally) {
                Text("BTC/USDT Live Price", color = Color.Gray, fontSize = 14.sp)
                Text("\$$livePrice", color = Color.Yellow, fontSize = 32.sp, fontWeight = FontWeight.Bold)
            }
        }

        Spacer(modifier = Modifier.height(16.dp))

        OutlinedTextField(
            value = apiKey,
            onValueChange = onApiKeyChange,
            label = { Text("MEXC API Key", color = Color.White) },
            visualTransformation = PasswordVisualTransformation(),
            modifier = Modifier.fillMaxWidth(),
            colors = OutlinedTextFieldDefaults.colors(focusedBorderColor = Color.Blue)
        )

        Spacer(modifier = Modifier.height(8.dp))

        OutlinedTextField(
            value = secretKey,
            onValueChange = onSecretKeyChange,
            label = { Text("MEXC Secret Key", color = Color.White) },
            visualTransformation = PasswordVisualTransformation(),
            modifier = Modifier.fillMaxWidth(),
            colors = OutlinedTextFieldDefaults.colors(focusedBorderColor = Color.Blue)
        )

        Spacer(modifier = Modifier.height(8.dp))

        OutlinedTextField(
            value = tradeAmount,
            onValueChange = onTradeAmountChange,
            label = { Text("Trade Amount (USDT)", color = Color.White) },
            modifier = Modifier.fillMaxWidth()
        )

        Spacer(modifier = Modifier.height(8.dp))

        Button(onClick = onSaveKeys, modifier = Modifier.fillMaxWidth()) {
            Text("Save Encrypted Keys")
        }

        Spacer(modifier = Modifier.height(24.dp))

        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
            Button(
                onClick = { onExecuteTrade("BUY") },
                colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF00C853)),
                modifier = Modifier
                    .weight(1f)
                    .height(56.dp)
            ) {
                Text("CALL (صعود)", fontSize = 18.sp, fontWeight = FontWeight.Bold)
            }

            Spacer(modifier = Modifier.width(16.dp))

            Button(
                onClick = { onExecuteTrade("SELL") },
                colors = ButtonDefaults.buttonColors(containerColor = Color(0xDDF44336)),
                modifier = Modifier
                    .weight(1f)
                    .height(56.dp)
            ) {
                Text("PUT (هبوط)", fontSize = 18.sp, fontWeight = FontWeight.Bold)
            }
        }
    }
}
