import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mexc_event_trader_app/main.dart';

void main() {
  testWidgets('App launches without error', (WidgetTester tester) async {
    await tester.pumpWidget(const MyApp());
    expect(find.byType(MaterialApp), findsOneWidget);
  });
}
