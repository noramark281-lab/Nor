import 'package:sqflite/sqflite.dart';
import 'package:path/path.dart';
import '../models/event_contract.dart';

class DatabaseService {
  static final DatabaseService _instance = DatabaseService._internal();
  factory DatabaseService() => _instance;
  DatabaseService._internal();

  static Database? _database;

  Future<Database> get database async {
    if (_database != null) return _database!;
    _database = await _initDB();
    return _database!;
  }

  Future<Database> _initDB() async {
    String path = join(await getDatabasesPath(), 'trading_history.db');
    return await openDatabase(
      path,
      version: 1,
      onCreate: (db, version) async {
        await db.execute('''
          CREATE TABLE history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            symbol TEXT,
            side TEXT,
            amount REAL,
            durationMinutes INTEGER,
            expiryTime TEXT,
            status TEXT,
            payoutPercent REAL
          )
        ''');
      },
    );
  }

  Future<void> insertTrade(EventContract contract) async {
    final db = await database;
    await db.insert('history', {
      'symbol': contract.symbol,
      'side': contract.side,
      'amount': contract.amount,
      'durationMinutes': contract.durationMinutes,
      'expiryTime': contract.expiryTime.toIso8601String(),
      'status': contract.status,
      'payoutPercent': contract.payoutPercent,
    });
  }

  Future<List<EventContract>> getTradeHistory() async {
    final db = await database;
    final List<Map<String, dynamic>> maps = await db.query('history', orderBy: 'id DESC');

    return List.generate(maps.length, (i) {
      return EventContract(
        symbol: maps[i]['symbol'],
        side: maps[i]['side'],
        amount: maps[i]['amount'],
        durationMinutes: maps[i]['durationMinutes'],
        expiryTime: DateTime.parse(maps[i]['expiryTime']),
        status: maps[i]['status'],
        payoutPercent: maps[i]['payoutPercent'],
      );
    });
  }
}
