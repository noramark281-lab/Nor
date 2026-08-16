#!/bin/bash

# MEXC Trading Bot Setup Script
# This script helps set up the development environment

echo "╔════════════════════════════════════════════════════════════╗"
echo "║  MEXC Spot Auto-Trading Bot - Setup Script                 ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check Python version
echo -e "${YELLOW}Checking Python version...${NC}"
python_version=$(python3 --version 2>&1 | awk '{print $2}')
echo "Python version: $python_version"

# Check if Python 3.8+
if ! python3 -c 'import sys; exit(0 if sys.version_info >= (3, 8) else 1)'; then
    echo -e "${RED}Error: Python 3.8+ required${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Python version OK${NC}"
echo ""

# Create virtual environment
echo -e "${YELLOW}Creating virtual environment...${NC}"
if [ ! -d ".venv" ]; then
    python3 -m venv .venv
    echo -e "${GREEN}✓ Virtual environment created${NC}"
else
    echo -e "${GREEN}✓ Virtual environment already exists${NC}"
fi

# Activate virtual environment
echo -e "${YELLOW}Activating virtual environment...${NC}"
source .venv/bin/activate || . .venv/Scripts/activate

echo -e "${GREEN}✓ Virtual environment activated${NC}"
echo ""

# Upgrade pip
echo -e "${YELLOW}Upgrading pip...${NC}"
pip install --upgrade pip setuptools wheel

echo -e "${GREEN}✓ pip upgraded${NC}"
echo ""

# Install dependencies
echo -e "${YELLOW}Installing dependencies...${NC}"
pip install -r requirements.txt

# Install optional dependencies for GUI
echo ""
echo -e "${YELLOW}Installing GUI dependencies...${NC}"
pip install kivy kivy-garden
garden install matplotlib

echo -e "${GREEN}✓ Dependencies installed${NC}"
echo ""

# Create configuration file
echo -e "${YELLOW}Setting up configuration...${NC}"
if [ ! -f "config.json" ]; then
    python3 src/main.py --create-config
    echo -e "${GREEN}✓ Configuration file created at config.json${NC}"
    echo ""
    echo -e "${YELLOW}⚠️  IMPORTANT: Edit config.json and add your MEXC API credentials${NC}"
else
    echo -e "${GREEN}✓ Configuration file already exists${NC}"
fi

echo ""
echo -e "${GREEN}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║  Setup Complete!                                           ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo "Next steps:"
echo "1. Edit config.json with your MEXC API key and secret"
echo "2. Run GUI mode: python src/main.py --gui"
echo "3. Or run CLI mode: python src/main.py --cli"
echo "4. Or run test mode: python src/main.py --test"
echo ""
echo "For help: python src/main.py --help"
echo ""
