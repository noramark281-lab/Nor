import 'dart:convert';
import 'package:web_socket_channel/web_socket_channel.dart';
import '../utils/constants.dart';

class WebSocketService {
  WebSocketChannel? _channel;
  bool _isConnected = false;
  final Function(Map<String, dynamic>) onPriceUpdate;

  WebSocketService({required this.onPriceUpdate});

  void connect(String symbol) {
    if (_isConnected) disconnect();

    final url = Uri.parse(Constants.mexcWebSocket);
    _channel = WebSocketChannel.connect(url);
    _isConnected = true;

    // Subscribe to ticker
    final subscribeMsg = {
      "method": "SUBSCRIPTION",
      "params": ["spot@public.deals.v3.api@$symbol"]
    };
    
    _channel!.sink.add(jsonEncode(subscribeMsg));

    _channel!.stream.listen(
      (message) {
        final data = jsonDecode(message);
        if (data['c'] == 'spot@public.deals.v3.api@$symbol') {
          onPriceUpdate(data['d']);
        }
      },
      onError: (error) {
        print('WebSocket Error: $error');
        _isConnected = false;
        // Auto reconnect logic could go here
      },
      onDone: () {
        print('WebSocket Closed');
        _isConnected = false;
      },
    );
  }

  void disconnect() {
    _channel?.sink.close();
    _isConnected = false;
  }
}
