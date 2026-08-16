#!/usr/bin/env python
"""
Setup script for MEXC Spot Auto-Trading Bot
Enables: pip install -e .
"""

from setuptools import setup, find_packages

with open("BOT_README.md", "r", encoding="utf-8") as fh:
    long_description = fh.read()

with open("requirements.txt", "r", encoding="utf-8") as fh:
    requirements = [line.strip() for line in fh if line.strip() and not line.startswith("#")]

setup(
    name="mexc-spot-bot",
    version="1.0.0",
    author="MEXC Trading Bot",
    author_email="support@mexc-bot.dev",
    description="Automated spot trading bot for MEXC crypto exchange",
    long_description=long_description,
    long_description_content_type="text/markdown",
    url="https://github.com/yourusername/Nor",
    packages=find_packages(),
    classifiers=[
        "Programming Language :: Python :: 3",
        "Programming Language :: Python :: 3.8",
        "Programming Language :: Python :: 3.9",
        "Programming Language :: Python :: 3.10",
        "Programming Language :: Python :: 3.11",
        "License :: OSI Approved :: MIT License",
        "Operating System :: OS Independent",
        "Development Status :: 4 - Beta",
        "Environment :: Console",
        "Environment :: X11 Applications :: GTK",
        "Intended Audience :: Developers",
        "Intended Audience :: Financial and Insurance Industry",
        "Topic :: Office/Business :: Financial :: Investment",
        "Topic :: Software :: Libraries :: Python Modules",
    ],
    python_requires=">=3.8",
    install_requires=requirements,
    entry_points={
        "console_scripts": [
            "mexc-bot=src.main:main",
        ],
    },
    keywords="mexc crypto trading bot automation",
    project_urls={
        "Bug Reports": "https://github.com/yourusername/Nor/issues",
        "Documentation": "https://github.com/yourusername/Nor/blob/main/BOT_README.md",
        "Source Code": "https://github.com/yourusername/Nor",
    },
)
