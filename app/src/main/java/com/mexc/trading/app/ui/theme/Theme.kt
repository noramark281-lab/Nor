package com.mexc.trading.app.ui.theme

import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.runtime.Composable

private val DarkColorScheme = darkColorScheme(
    primary = CyanAccent,
    onPrimary = DarkCanvas,
    primaryContainer = CyanAccentContainer,
    onPrimaryContainer = TextPrimary,
    secondary = LongGreen,
    onSecondary = DarkCanvas,
    secondaryContainer = LongGreenContainer,
    onSecondaryContainer = TextPrimary,
    tertiary = ShortRed,
    onTertiary = TextPrimary,
    tertiaryContainer = ShortRedContainer,
    background = DarkCanvas,
    onBackground = TextPrimary,
    surface = DarkSurface,
    onSurface = TextPrimary,
    surfaceVariant = DarkSurfaceVariant,
    onSurfaceVariant = TextSecondary,
    outline = DarkCardBorder
)

@Composable
fun MexcTraderTheme(content: @Composable () -> Unit) {
    MaterialTheme(
        colorScheme = DarkColorScheme,
        content = content
    )
}
