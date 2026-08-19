import 'dart:convert';
import 'dart:async';
import 'package:web_socket_channel/web_socket_channel.dart';
import '../utils/constants.dart';

class WebSocketService {
  WebSocketChannel? _channel;
  bool _isConnected = false;
  bool _shouldReconnect = true;
  String? _currentSymbol;
  Timer? _reconnectTimer;
  Timer? _pingTimer;
  int _reconnectAttempts = 0;
  static const int _maxReconnectAttempts = 10;
  static const Duration _reconnectDelay = Duration(seconds: 5);
  static const Duration _pingInterval = Duration(seconds: 30);
  
  final Function(Map<String, dynamic>) onPriceUpdate;
  final Function(String)? onError;
  final Function()? onConnected;

  WebSocketService({
    required this.onPriceUpdate,
    this.onError,
    this.onConnected,
  });

  void connect(String symbol) {
    _currentSymbol = symbol;
    _shouldReconnect = true;
    _connect();
  }

  void _connect() {
    if (_isConnected) disconnect();

    try {
      final url = Uri.parse(Constants.mexcWebSocket);
      _channel = WebSocketChannel.connect(url);
      _isConnected = true;
      _reconnectAttempts = 0;

      // Subscribe to ticker
      final subscribeMsg = {
        "method": "SUBSCRIPTION",
        "params": ["spot@public.deals.v3.api@$_currentSymbol"]
      };
      
      _channel!.sink.add(jsonEncode(subscribeMsg));

      // Start ping timer to keep connection alive
      _pingTimer?.cancel();
      _pingTimer = Timer.periodic(_pingInterval, (_) => _sendPing());

      _channel!.stream.listen(
        (message) {
          _handleMessage(message);
        },
        onError: (error) {
          print('WebSocket Error: $error');
          _isConnected = false;
          onError?.call('WebSocket error: $error');
          _scheduleReconnect();
        },
        onDone: () {
          print('WebSocket Closed');
          _isConnected = false;
          _scheduleReconnect();
        },
      );

      onConnected?.call();
    } catch (e) {
      print('WebSocket connection failed: $e');
      _isConnected = false;
      onError?.call('Connection failed: $e');
      _scheduleReconnect();
    }
  }

  void _handleMessage(dynamic message) {
    try {
      final data = jsonDecode(message);
      // Handle ping/pong
      if (data['ping'] != null) {
        _channel?.sink.add(jsonEncode({'pong': data['ping']}));
        return;
      }
      // Handle price updates
      if (data['c'] == 'spot@public.deals.v3.api@$_currentSymbol') {
        onPriceUpdate(data['d']);
      }
    } catch (e) {
      print('WebSocket message parsing error: $e');
    }
  }

  void _sendPing() {
    if (_isConnected && _channel != null) {
      try {
        _channel!.sink.add(jsonEncode({'ping': DateTime.now().millisecondsSinceEpoch}));
      } catch (e) {
        print('Ping failed: $e');
      }
    }
  }

  void _scheduleReconnect() {
    _pingTimer?.cancel();
    if (!_shouldReconnect) return;
    
    if (_reconnectAttempts >= _maxReconnectAttempts) {
      onError?.call('Max reconnection attempts reached. Please check your connection.');
      return;
    }

    _reconnectAttempts++;
    print('Reconnecting in ${_reconnectDelay.inSeconds}s (attempt $_reconnectAttempts/$_maxReconnectAttempts)');
    
    _reconnectTimer?.cancel();
    _reconnectTimer = Timer(_reconnectDelay, () {
      if (_shouldReconnect) {
        _connect();
      }
    });
  }

  void disconnect() {
    _shouldReconnect = false;
    _reconnectTimer?.cancel();
    _pingTimer?.cancel();
    _channel?.sink.close();
    _isConnected = false;
    _reconnectAttempts = 0;
  }

  bool get isConnected => _isConnected;
}
