#!/usr/bin/env python3
"""
MEXC Spot Auto-Trading Bot - Main Entry Point
This wrapper enables the bot to run on mobile devices via Kivy/Buildozer
"""

import sys
from src.main import main

if __name__ == '__main__':
    sys.argv.append('--gui')  # Force GUI mode for mobile
    main()
