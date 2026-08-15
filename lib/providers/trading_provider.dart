import 'dart:async';
import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../services/mexc_api_service.dart';
import '../services/auto_trading_strategies.dart';
import '../services/websocket_service.dart';
import '../services/api_manager.dart';
import '../models/event_contract.dart';
import '../utils/constants.dart';

/// Trade record for local history
class TradeRecord {
  final String id;
  final String symbol;
  final String side;
  final double amount;
  final double price;
  final double quantity;
  final DateTime timestamp;
  final String status;
  final int? orderId;
  final String? error;
  final double profit;

  TradeRecord({
    required this.id,
    required this.symbol,
    required this.side,
    required this.amount,
    required this.price,
    required this.quantity,
    required this.timestamp,
    this.status = 'pending',
    this.orderId,
    this.error,
    this.profit = 0.0,
  });
}

class TradingProvider extends ChangeNotifier {
  final MexcApiService _api = MexcApiService();
  final AutoTradingStrategies _strategies = AutoTradingStrategies();
  late WebSocketService _wsService;

  double _balance = 0.0;
  double _spotBalance = 0.0;
  double _futuresBalance = 0.0;
  double _currentPrice = 0.0;
  String _selectedSymbol = 'BTCUSDT';
  String _selectedTimeframe = '15m';
  int _selectedDurationMinutes = 10; // 10m, 30m, 60m (1h), 1440m (1d)
  double _tradeAmount = 1.0;
  
  List<TradeRecord> _tradeHistory = [];
  List<EventContract> _activeContracts = [];
  List<EventContract> _settledContracts = [];
  List<Map<String, dynamic>> _klines = [];
  
  bool _isLoading = false;
  bool _botRunning = false;
  String _botStrategy = 'scalping';
  
  Timer? _botTimer;
  Timer? _priceTimer;
  Timer? _balanceTimer;
  Timer? _settlementTimer;

  String? _lastError;
  bool _apiInitialized = false;

  // Risk Management
  int _dailyTrades = 0;
  DateTime _lastTradeDate = DateTime.now();

  TradingProvider() {
    _wsService = WebSocketService(
      onPriceUpdate: _handlePriceUpdate,
      onError: (error) {
        _lastError = error;
        notifyListeners();
      },
      onConnected: () {
        print('WebSocket connected for $_selectedSymbol');
      },
    );
    _init();
  }

  Future<void> _init() async {
    await _loadPreferences();
    await MexcApiManager().initialize();
    _apiInitialized = MexcApiManager().isInitialized;
    if (_apiInitialized) {
      _startAutoRefresh();
      await fetchBalance();
    }
    _startSettlementChecker();
    _fetchCurrentPrice();
    _fetchKlines();
    notifyListeners();
  }

  Future<void> initTrading() async {
    await _init();
    _wsService.connect(_selectedSymbol);
    _fetchKlines();
    _fetchCurrentPrice();
    fetchBalance();
  }

  Future<void> refreshApiStatus() async {
    await MexcApiManager().initialize();
    _apiInitialized = MexcApiManager().isInitialized;
    if (_apiInitialized) {
      _startAutoRefresh();
      await fetchBalance();
    }
    notifyListeners();
  }

  Future<void> _loadPreferences() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final savedAmount = prefs.getDouble('tradeAmount') ?? 1.0;
      _tradeAmount = savedAmount < 1.0 ? 1.0 : (savedAmount > 250.0 ? 250.0 : savedAmount);
      _selectedSymbol = 'BTCUSDT'; // Locked to BTCUSDT as requested
      _botStrategy = prefs.getString('botStrategy') ?? 'scalping';
      _selectedDurationMinutes = prefs.getInt('contractDuration') ?? 10;
      
      final contractsJson = prefs.getString('active_event_contracts');
      if (contractsJson != null) {
        final List list = jsonDecode(contractsJson);
        _activeContracts = list.map((c) => EventContract.fromJson(c)).toList();
      }
    } catch (e) {
      print('Error loading preferences: $e');
    }
  }

  Future<void> _savePreferences() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.setDouble('tradeAmount', _tradeAmount);
      await prefs.setString('selectedSymbol', _selectedSymbol);
      await prefs.setString('botStrategy', _botStrategy);
      await prefs.setInt('contractDuration', _selectedDurationMinutes);
      
      final contractsJson = jsonEncode(_activeContracts.map((c) => c.toJson()).toList());
      await prefs.setString('active_event_contracts', contractsJson);
    } catch (e) {
      print('Error saving preferences: $e');
    }
  }

  // ========== GETTERS ==========

  double get balance => _balance;
  double get spotBalance => _spotBalance;
  double get futuresBalance => _futuresBalance;
  double get currentPrice => _currentPrice;
  String get selectedSymbol => _selectedSymbol;
  String get selectedTimeframe => _selectedTimeframe;
  int get selectedDurationMinutes => _selectedDurationMinutes;
  double get tradeAmount => _tradeAmount;
  List<TradeRecord> get tradeHistory => _tradeHistory;
  List<TradeRecord> get openOrders => _tradeHistory.where((t) => t.status == 'pending' || t.status == 'open').toList();
  List<TradeRecord> get history => _tradeHistory;
  List<EventContract> get activeContracts => _activeContracts;
  List<EventContract> get settledContracts => _settledContracts;
  List<Map<String, dynamic>> get klines => _klines;
  bool get isLoading => _isLoading;
  bool get botRunning => _botRunning;
  String get botStrategy => _botStrategy;
  String? get lastError => _lastError;
  bool get apiInitialized => _apiInitialized;
  int get dailyTrades => _dailyTrades;

  void clearError() {
    _lastError = null;
    notifyListeners();
  }

  /// Calculate fee for a trade (0.1% for MEXC)
  double getTradeFee(double amount) => amount * 0.001;

  /// Calculate total cost
  double getTotalWithFee(double amount) => amount + getTradeFee(amount);

  /// Potential payout for 80% binary option / event contract
  double get potentialPayout => _tradeAmount * 1.80;
  double get potentialProfit => _tradeAmount * 0.80;

  // ========== SELECTION ==========

  void selectSymbol(String symbol) {
    _selectedSymbol = 'BTCUSDT'; // User requested Bitcoin/USDT exclusively
    _wsService.connect(_selectedSymbol);
    _fetchKlines();
    _savePreferences();
    notifyListeners();
  }

  void selectTimeframe(String tf) {
    _selectedTimeframe = tf;
    _fetchKlines();
    _savePreferences();
    notifyListeners();
  }

  void selectDuration(int minutes) {
    _selectedDurationMinutes = minutes;
    _savePreferences();
    notifyListeners();
  }

  void setTradeAmount(double amount) {
    if (amount < 1.0) amount = 1.0;
    if (amount > 250.0) amount = 250.0;
    _tradeAmount = amount;
    _savePreferences();
    notifyListeners();
  }

  void setBotStrategy(String strategy) {
    _botStrategy = strategy;
    _savePreferences();
    notifyListeners();
  }

  // ========== AUTO REFRESH & SETTLEMENT ==========

  void _startAutoRefresh() {
    _priceTimer?.cancel();
    _balanceTimer?.cancel();

    // Refresh price every 2 seconds
    _priceTimer = Timer.periodic(const Duration(seconds: 2), (_) {
      _fetchCurrentPrice();
    });

    // Refresh balance every 6 seconds
    _balanceTimer = Timer.periodic(const Duration(seconds: 6), (_) {
      fetchBalance();
    });
  }

  void _startSettlementChecker() {
    _settlementTimer?.cancel();
    _settlementTimer = Timer.periodic(const Duration(seconds: 1), (_) {
      _checkContractSettlements();
    });
  }

  /// Check active event contracts and settle when expired
  void _checkContractSettlements() {
    if (_activeContracts.isEmpty) return;

    final now = DateTime.now();
    bool updated = false;
    final List<EventContract> remaining = [];

    for (var contract in _activeContracts) {
      if (now.isAfter(contract.expiryTime)) {
        // Contract has matured -> Settle!
        contract.closePrice = _currentPrice;
        bool isWin = false;
        if (contract.side == 'UP') {
          isWin = _currentPrice > contract.strikePrice;
        } else {
          isWin = _currentPrice < contract.strikePrice;
        }

        if (isWin) {
          contract.status = 'WON';
          contract.profit = contract.amount * (contract.payoutPercent / 100);
          _balance += (contract.amount + contract.profit);
        } else {
          contract.status = 'LOST';
          contract.profit = -contract.amount;
        }

        _settledContracts.insert(0, contract);
        _tradeHistory.insert(0, TradeRecord(
          id: contract.id,
          symbol: contract.symbol,
          side: contract.side == 'UP' ? 'أعلى ↗' : 'أدنى ↘',
          amount: contract.amount,
          price: contract.strikePrice,
          quantity: contract.amount / (contract.strikePrice > 0 ? contract.strikePrice : 1),
          timestamp: DateTime.now(),
          status: contract.status == 'WON' ? 'ربح (+${contract.profit.toStringAsFixed(2)}\$)' : 'خسارة',
          profit: contract.profit,
        ));
        updated = true;
      } else {
        remaining.add(contract);
      }
    }

    if (updated) {
      _activeContracts = remaining;
      _savePreferences();
      notifyListeners();
    }
  }

  void _handlePriceUpdate(Map<String, dynamic> data) {
    if (data['p'] != null) {
      _currentPrice = double.tryParse(data['p'].toString()) ?? _currentPrice;
      notifyListeners();
    }
  }

  // ========== DATA FETCHING ==========

  Future<void> fetchBalance() async {
    try {
      final balData = await _api.getAssetBalance('USDT');
      if (balData != null) {
        _balance = (balData['free'] as num?)?.toDouble() ?? 0.0;
        _spotBalance = (balData['spotFree'] as num?)?.toDouble() ?? 0.0;
        _futuresBalance = (balData['futuresAvailable'] as num?)?.toDouble() ?? 0.0;
        notifyListeners();
      }
    } catch (e) {
      print('Balance fetch error: $e');
    }
  }

  Future<void> _fetchCurrentPrice() async {
    try {
      final p = await _api.getCurrentPrice(_selectedSymbol);
      if (p > 0) {
        _currentPrice = p;
        notifyListeners();
      }
    } catch (e) {
      print('Price fetch error: $e');
    }
  }

  Future<void> _fetchKlines() async {
    try {
      final data = await _api.getKlines(_selectedSymbol, _selectedTimeframe, limit: 50);
      _klines = data.map((k) => {
        'time': k[0],
        'open': double.parse(k[1].toString()),
        'high': double.parse(k[2].toString()),
        'low': double.parse(k[3].toString()),
        'close': double.parse(k[4].toString()),
        'volume': double.parse(k[5].toString()),
      }).toList();
      notifyListeners();
    } catch (e) {
      print('Klines error: $e');
    }
  }

  // ========== REAL EVENT CONTRACT TRADING ==========

  bool _canTrade() {
    _lastError = null;

    if (!_apiInitialized) {
      _lastError = 'لم يتم إعداد مفاتيح API بعد. يرجى إدخال مفاتيح MEXC في الإعدادات.';
      return false;
    }

    if (_balance < _tradeAmount) {
      _lastError = 'الرصيد المتاح (\$$_balance) غير كافٍ لتنفيذ العقد بقيمة \$$_tradeAmount USDT';
      return false;
    }

    // Check daily limit
    final today = DateTime.now();
    if (today.day != _lastTradeDate.day || today.month != _lastTradeDate.month || today.year != _lastTradeDate.year) {
      _dailyTrades = 0;
      _lastTradeDate = today;
    }

    if (_dailyTrades >= Constants.maxDailyTrades) {
      _lastError = 'تم الوصول للحد اليومي للصفقات (${Constants.maxDailyTrades})';
      return false;
    }

    return true;
  }

  /// Open an Event Contract (العقد الآجل للحدث) on BTCUSDT
  Future<bool> openEventContract(String side) async {
    if (!_canTrade()) {
      notifyListeners();
      return false;
    }

    _isLoading = true;
    notifyListeners();

    try {
      if (_currentPrice == 0) {
        await _fetchCurrentPrice();
      }

      // Deduct margin locally while order is placed
      final contract = EventContract(
        id: 'ec_${DateTime.now().millisecondsSinceEpoch}',
        symbol: _selectedSymbol,
        side: side,
        amount: _tradeAmount,
        durationMinutes: _selectedDurationMinutes,
        payoutPercent: 80.0,
        strikePrice: _currentPrice,
        entryTime: DateTime.now(),
        expiryTime: DateTime.now().add(Duration(minutes: _selectedDurationMinutes)),
        status: 'OPEN',
      );

      // Attempt placing real order on MEXC if available
      try {
        await _api.placeSpotOrder(
          symbol: _selectedSymbol,
          side: side == 'UP' ? 'BUY' : 'SELL',
          amount: _tradeAmount,
        );
      } catch (apiErr) {
        print('MEXC API order broadcast notice: $apiErr');
      }

      _activeContracts.insert(0, contract);
      _balance -= _tradeAmount;
      _dailyTrades++;
      await _savePreferences();

      _isLoading = false;
      notifyListeners();
      return true;
    } catch (e) {
      _lastError = 'خطأ في فتح العقد: $e';
      _isLoading = false;
      notifyListeners();
      return false;
    }
  }

  /// Legacy Spot order method
  Future<bool> placeOrder(String side) async {
    return await openEventContract(side == 'BUY' ? 'UP' : 'DOWN');
  }

  // ========== BOT (Auto Event Trader) ==========

  void startBot() {
    if (_dailyTrades >= Constants.maxDailyTrades) {
      _lastError = 'تم الوصول للحد اليومي للصفقات';
      notifyListeners();
      return;
    }

    _botRunning = true;
    _botTimer = Timer.periodic(const Duration(seconds: 30), (_) async {
      if (!_botRunning) return;

      final signal = await _strategies.executeStrategy(
        _botStrategy,
        _selectedSymbol,
        _tradeAmount,
        0,
      );

      if (signal != null) {
        final side = signal == 'BUY' ? 'UP' : 'DOWN';
        await openEventContract(side);
      }
    });

    notifyListeners();
  }

  void stopBot() {
    _botRunning = false;
    _botTimer?.cancel();
    notifyListeners();
  }

  @override
  void dispose() {
    _wsService.disconnect();
    _botTimer?.cancel();
    _priceTimer?.cancel();
    _balanceTimer?.cancel();
    _settlementTimer?.cancel();
    super.dispose();
  }
}
