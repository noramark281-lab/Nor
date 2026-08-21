import React, { useState } from 'react';
import { 
  FileCode, 
  Check, 
  Copy, 
  Download, 
  Terminal, 
  Layers, 
  ShieldAlert, 
  CheckCircle2, 
  FolderTree, 
  Cpu, 
  Sparkles,
  Smartphone,
  ExternalLink,
  Code2
} from 'lucide-react';
import { Language } from '../types';
import { translations } from '../utils/translations';

interface ProjectDiagnosticsFixerProps {
  lang: Language;
}

export const ProjectDiagnosticsFixer: React.FC<ProjectDiagnosticsFixerProps> = ({ lang }) => {
  const t = translations[lang];
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'flutter' | 'capacitor' | 'github_actions' | 'mexc_spec'>('flutter');

  const copyToClipboard = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const flutterDartCode = `// lib/services/mexc_event_futures_service.dart
import 'dart:convert';
import 'package:crypto/crypto.dart';
import 'package:http/http.dart' as http;

class MexcEventFuturesService {
  final String apiKey;
  final String secretKey;
  final String baseUrl;

  MexcEventFuturesService({
    required this.apiKey,
    required this.secretKey,
    this.baseUrl = 'https://contract.mexc.com',
  });

  /// Generate official MEXC HMAC SHA256 signature
  String _generateSignature(String timestamp, String method, String requestPath, [Map<String, dynamic>? params]) {
    String paramStr = '';
    if (params != null && params.isNotEmpty) {
      final sortedKeys = params.keys.toList()..sort();
      paramStr = sortedKeys.map((k) => '$k=\${params[k]}').join('&');
    }
    final signStr = '\$timestamp\$method\$requestPath\$paramStr';
    final hmac = Hmac(sha256, utf8.encode(secretKey));
    final digest = hmac.convert(utf8.encode(signStr));
    return digest.toString();
  }

  /// Get real-time ticker for BTC_USDT Event Futures
  Future<Map<String, dynamic>> getTicker(String symbol) async {
    final uri = Uri.parse('\$baseUrl/api/v1/contract/ticker?symbol=\$symbol');
    final response = await http.get(uri);
    if (response.statusCode == 200) {
      return json.decode(response.body);
    }
    throw Exception('Failed to load MEXC ticker');
  }

  /// Execute binary event contract order (CALL / PUT)
  Future<Map<String, dynamic>> placeEventOrder({
    required String symbol,
    required String direction, // 'CALL' or 'PUT'
    required double stakeAmount,
    required int durationMinutes, // 10 or 30
    required double strikePrice,
  }) async {
    final timestamp = DateTime.now().millisecondsSinceEpoch.toString();
    final path = '/api/v1/contract/event/order';
    final payload = {
      'symbol': symbol,
      'side': direction == 'CALL' ? 1 : 2,
      'amount': stakeAmount,
      'duration': durationMinutes,
      'strike': strikePrice,
      'timestamp': timestamp,
    };

    final signature = _generateSignature(timestamp, 'POST', path, payload);

    final response = await http.post(
      Uri.parse('\$baseUrl\$path'),
      headers: {
        'Content-Type': 'application/json',
        'ApiKey': apiKey,
        'Request-Time': timestamp,
        'Signature': signature,
      },
      body: json.encode(payload),
    );

    return json.decode(response.body);
  }
}`;

  const githubWorkflowCode = `# .github/workflows/build-apk.yml
name: Build Android APK for MEXC Event Trader

on:
  push:
    branches: [ main, master ]
  workflow_dispatch:

jobs:
  build:
    name: Build Flutter Release APK
    runs-on: ubuntu-latest
    steps:
      - name: Checkout Code
        uses: actions/checkout@v4

      - name: Set up Java 17
        uses: actions/setup-java@v3
        with:
          distribution: 'zulu'
          java-version: '17'

      - name: Set up Flutter
        uses: subosito/flutter-action@v2
        with:
          flutter-version: '3.22.x'
          channel: 'stable'
          cache: true

      - name: Install Dependencies
        run: flutter pub get

      - name: Build Release APK
        run: flutter build apk --release --split-per-abi

      - name: Upload Artifact
        uses: actions/upload-artifact@v4
        with:
          name: mexc-event-trader-apk
          path: build/app/outputs/flutter-apk/app-arm64-v8a-release.apk`;

  const capacitorConfigCode = `// capacitor.config.json
{
  "appId": "com.mexc.eventfutures.autotrader",
  "appName": "MEXC Event Futures Trader",
  "webDir": "dist",
  "bundledWebRuntime": false,
  "server": {
    "cleartext": true,
    "androidScheme": "https"
  },
  "plugins": {
    "SplashScreen": {
      "launchShowDuration": 2000,
      "backgroundColor": "#0B0E14"
    },
    "StatusBar": {
      "style": "DARK",
      "backgroundColor": "#0B0E14"
    }
  }
}`;

  const mexcEndpointsGuide = `# MEXC Event Futures API Integration Guide

## 1. REST Endpoints:
- Base Contract URL: https://contract.mexc.com
- Public Ticker: GET /api/v1/contract/ticker?symbol=BTC_USDT
- Candlesticks: GET /api/v1/contract/kline/BTC_USDT?interval=Min5&limit=50
- Order Execution: POST /api/v1/contract/order/create

## 2. Authentication Headers:
- ApiKey: Your MEXC API Key
- Request-Time: Epoch millisecond timestamp
- Signature: Hex encoded HMAC-SHA256(secretKey, timestamp + method + path + params)

## 3. WebSocket Real-Time Topics:
- WSS Host: wss://contract.mexc.com/ws
- Subscription: {"method": "sub.ticker", "param": {"symbol": "BTC_USDT"}}
- Candlestick stream: {"method": "sub.kline", "param": {"symbol": "BTC_USDT", "interval": "Min5"}}`;

  const downloadFile = (filename: string, content: string) => {
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* 1. PDF Analysis & Architectural Resolution Summary */}
      <div className="bg-slate-900/90 rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between gap-3 bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
              <FolderTree className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                <span>{t.diagHeader}</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono font-bold border border-emerald-500/30">
                  Fixed & Resolved
                </span>
              </h2>
              <p className="text-xs text-slate-400">{t.diagSubtitle}</p>
            </div>
          </div>
        </div>

        {/* Audit Cards Grid */}
        <div className="p-4 sm:p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-slate-950/80 rounded-xl p-4 border border-slate-800/80 space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-emerald-400">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>{t.conflictTitle}</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              {t.conflictDesc}
            </p>
            <div className="text-[11px] text-slate-500 font-mono pt-1">
              ✓ Clean separation of Flutter Dart modules & React/Capacitor bundle.
            </div>
          </div>

          <div className="bg-slate-950/80 rounded-xl p-4 border border-slate-800/80 space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-cyan-400">
              <CheckCircle2 className="w-4 h-4 text-cyan-400" />
              <span>{t.apiFixTitle}</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              {t.apiFixDesc}
            </p>
            <div className="text-[11px] text-slate-500 font-mono pt-1">
              ✓ Fixed endpoint routes, HMAC SHA256 headers, and contract payload structure.
            </div>
          </div>
        </div>
      </div>

      {/* 2. Code Snippets & Exporters Hub */}
      <div className="bg-slate-900/90 rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
        {/* Navigation Sub-Tabs */}
        <div className="p-3 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2 bg-slate-950/80">
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              onClick={() => setActiveTab('flutter')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold font-mono transition-all ${
                activeTab === 'flutter'
                  ? 'bg-indigo-600 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              Flutter Service (Dart)
            </button>
            <button
              onClick={() => setActiveTab('capacitor')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold font-mono transition-all ${
                activeTab === 'capacitor'
                  ? 'bg-cyan-600 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              Capacitor Android Config
            </button>
            <button
              onClick={() => setActiveTab('github_actions')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold font-mono transition-all ${
                activeTab === 'github_actions'
                  ? 'bg-emerald-600 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              GitHub Actions (.yml)
            </button>
            <button
              onClick={() => setActiveTab('mexc_spec')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold font-mono transition-all ${
                activeTab === 'mexc_spec'
                  ? 'bg-teal-600 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              MEXC Contract Spec
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                const currentContent = activeTab === 'flutter' ? flutterDartCode 
                  : activeTab === 'capacitor' ? capacitorConfigCode 
                  : activeTab === 'github_actions' ? githubWorkflowCode 
                  : mexcEndpointsGuide;
                copyToClipboard(activeTab, currentContent);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold border border-slate-700 transition-all"
            >
              {copiedId === activeTab ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-indigo-400" />}
              <span>{copiedId === activeTab ? t.copiedToast : (lang === 'ar' ? 'نسخ الكود' : 'Copy Code')}</span>
            </button>

            <button
              onClick={() => {
                const filename = activeTab === 'flutter' ? 'mexc_event_futures_service.dart'
                  : activeTab === 'capacitor' ? 'capacitor.config.json'
                  : activeTab === 'github_actions' ? 'build-apk.yml'
                  : 'mexc_endpoints_guide.md';
                const content = activeTab === 'flutter' ? flutterDartCode
                  : activeTab === 'capacitor' ? capacitorConfigCode
                  : activeTab === 'github_actions' ? githubWorkflowCode
                  : mexcEndpointsGuide;
                downloadFile(filename, content);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow transition-all"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{lang === 'ar' ? 'تنزيل الملف' : 'Download File'}</span>
            </button>
          </div>
        </div>

        {/* Code Display Area */}
        <div className="p-4 bg-slate-950">
          <pre className="text-xs font-mono text-slate-300 overflow-x-auto p-4 rounded-xl bg-slate-900 border border-slate-800/80 leading-relaxed max-h-[460px]">
            {activeTab === 'flutter' && flutterDartCode}
            {activeTab === 'capacitor' && capacitorConfigCode}
            {activeTab === 'github_actions' && githubWorkflowCode}
            {activeTab === 'mexc_spec' && mexcEndpointsGuide}
          </pre>
        </div>
      </div>
    </div>
  );
};
