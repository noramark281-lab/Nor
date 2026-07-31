package com.mexc.trading.app

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.activity.viewModels
import com.mexc.trading.app.ui.MainScreen
import com.mexc.trading.app.ui.MainViewModel
import com.mexc.trading.app.ui.theme.MexcTraderTheme

class MainActivity : ComponentActivity() {

    private val viewModel: MainViewModel by viewModels()

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        setContent {
            MexcTraderTheme {
                MainScreen(viewModel = viewModel)
            }
        }
    }
}
