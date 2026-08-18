import 'dart:async';
import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../models/trading_pair.dart';
import '../services/mexc_api_service.dart';

class MarketProvider extends ChangeNotifier {
  final List<TradingPair> _pairs = [];
  List<TradingPair> _filteredPairs = [];
  bool _isLoading = false;
  String? _errorMessage;
  String _searchQuery = '';
  int _categoryIndex = 0; // 0=All, 1=Favorites, 2=Spot, 3=Futures, 4=Hot
  List<String> _favorites = [];
  Timer? _timer;

  List<TradingPair> get pairs => List.unmodifiable(_pairs);
  List<TradingPair> get filteredPairs => List.unmodifiable(_filteredPairs);
  bool get isLoading => _isLoading;
  String? get errorMessage => _errorMessage;
  String get searchQuery => _searchQuery;
  int get categoryIndex => _categoryIndex;
  List<String> get favorites => List.unmodifiable(_favorites);

  static const List<String> kCategories = [
    'الكل',
    'المفضلة',
    'سبوت',
    'عقود مستديمة',
    'الأكثر تداولاً',
  ];

  MarketProvider() {
    _loadFavorites();
    startAutoRefresh();
  }

  Future<void> _loadFavorites() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      _favorites = prefs.getStringList('market_favorites') ?? [];
      notifyListeners();
    } catch (e) {
      debugPrint('MarketProvider: _loadFavorites error: $e');
    }
  }

  Future<void> toggleFavorite(String symbol) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      if (_favorites.contains(symbol)) {
        _favorites.remove(symbol);
      } else {
        _favorites.add(symbol);
      }
      await prefs.setStringList('market_favorites', _favorites);
      _applyFilter();
      notifyListeners();
    } catch (e) {
      debugPrint('MarketProvider: toggleFavorite error: $e');
    }
  }

  bool isFavorite(String symbol) => _favorites.contains(symbol);

  void setSearchQuery(String query) {
    _searchQuery = query;
    _applyFilter();
    notifyListeners();
  }

  void setCategoryIndex(int index) {
    _categoryIndex = index;
    _applyFilter();
    notifyListeners();
  }

  void _applyFilter() {
    List<TradingPair> result = _pairs;

    // Category filter
    if (_categoryIndex == 1) {
      // Favorites
      result = result.where((p) => _favorites.contains(p.symbol)).toList();
    } else if (_categoryIndex == 4) {
      // Hot - highest volume
      result = result.toList()..sort((a, b) => b.volume24h.compareTo(a.volume24h));
      result = result.take(20).toList();
    }
    // Spot and Futures categories are all pairs for now (MEXC v1 all futures)
    else if (_categoryIndex == 2) {
      // Spot - filter for spot pairs (no _USDT suffix, or specific logic)
      // For now, all are futures on this endpoint, show all
      result = result;
    } else if (_categoryIndex == 3) {
      // Perpetual - all futures pairs
      result = result;
    }

    // Search filter
    if (_searchQuery.isNotEmpty) {
      final q = _searchQuery.toLowerCase();
      result = result.where((p) {
        final sym = p.symbol.toLowerCase();
        final base = p.base.toLowerCase();
        final quote = p.quote.toLowerCase();
        return sym.contains(q) || base.contains(q) || quote.contains(q);
      }).toList();
    }

    _filteredPairs = result;
  }

  Future<void> loadMarketData() async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();
    try {
      final pairs = await MexcApiService().getMarketInfo();
      _pairs.clear();
      _pairs.addAll(pairs);
      _applyFilter();
      _errorMessage = null;
    } catch (e) {
      _errorMessage = 'فشل تحميل بيانات السوق: $e';
      debugPrint('MarketProvider error: $e');
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  void startAutoRefresh() {
    _timer?.cancel();
    _timer = Timer.periodic(const Duration(seconds: 30), (_) => loadMarketData());
  }

  void stopAutoRefresh() {
    _timer?.cancel();
  }

  void refresh() => loadMarketData();

  @override
  void dispose() {
    _timer?.cancel();
    super.dispose();
  }
}
