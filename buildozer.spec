[app]

# Title of application
title = MEXC Trading Bot

# Package name
package.name = mexc_trading_bot

# Package domain
package.domain = org.mexc

# Source directory
source.dir = .

# Source include patterns
source.include_exts = py,png,jpg,kv,atlas,json

# Version
version = 1.0.0

# Android API level
android.api = 31

# Minimum Android API level
android.minapi = 21

# Permissions
android.permissions = INTERNET,ACCESS_NETWORK_STATE

# Features
android.features = android.hardware.internet

# Orientation
orientation = portrait

# Fullscreen
fullscreen = 1

# Requirements
requirements = python3,kivy,requests,websocket-client,feedparser

# Icon
#icon.filename = %(source.dir)s/data/icon.png

# Presplash
#presplash.filename = %(source.dir)s/data/presplash.png

[buildozer]

# Log level (0 = error only, 1 = info, 2 = debug)
log_level = 2

# Display warnings
warn_on_root = 1
