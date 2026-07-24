/*
# Create trading tables (single-tenant, no auth)

1. New Tables
- `settings` — stores MEXC API key/secret (encrypted client-side) and trading preferences
  - `id` (int, primary key, always 1 for single-tenant)
  - `api_key` (text, nullable — encrypted)
  - `api_secret` (text, nullable — encrypted)
  - `trade_amount` (numeric, default 1.0)
  - `selected_symbol` (text, default 'BTCUSDT')
  - `bot_strategy` (text, default 'scalping')
  - `bot_running` (boolean, default false)
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)
- `trades` — trade history records
  - `id` (uuid, primary key)
  - `symbol` (text, not null)
  - `side` (text, not null — BUY or SELL)
  - `amount` (numeric, not null)
  - `price` (numeric, not null)
  - `quantity` (numeric, default 0)
  - `status` (text, default 'filled')
  - `order_id` (text, nullable)
  - `error` (text, nullable)
  - `created_at` (timestamptz)
- `bot_trades` — bot-executed trade records
  - `id` (uuid, primary key)
  - `symbol` (text, not null)
  - `side` (text, not null)
  - `amount` (numeric, not null)
  - `price` (numeric, not null)
  - `strategy` (text, not null)
  - `status` (text, default 'executed')
  - `order_id` (text, nullable)
  - `error` (text, nullable)
  - `created_at` (timestamptz)

2. Security
- Enable RLS on all tables.
- Allow anon + authenticated CRUD because this is a single-tenant app with no sign-in.
*/

CREATE TABLE IF NOT EXISTS settings (
  id int PRIMARY KEY DEFAULT 1,
  api_key text,
  api_secret text,
  trade_amount numeric DEFAULT 1.0,
  selected_symbol text DEFAULT 'BTCUSDT',
  bot_strategy text DEFAULT 'scalping',
  bot_running boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT single_row CHECK (id = 1)
);

ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_settings" ON settings;
CREATE POLICY "anon_select_settings" ON settings FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_settings" ON settings;
CREATE POLICY "anon_insert_settings" ON settings FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_settings" ON settings;
CREATE POLICY "anon_update_settings" ON settings FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_settings" ON settings;
CREATE POLICY "anon_delete_settings" ON settings FOR DELETE
  TO anon, authenticated USING (true);

CREATE TABLE IF NOT EXISTS trades (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  symbol text NOT NULL,
  side text NOT NULL,
  amount numeric NOT NULL,
  price numeric NOT NULL,
  quantity numeric DEFAULT 0,
  status text DEFAULT 'filled',
  order_id text,
  error text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE trades ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_trades" ON trades;
CREATE POLICY "anon_select_trades" ON trades FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_trades" ON trades;
CREATE POLICY "anon_insert_trades" ON trades FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_trades" ON trades;
CREATE POLICY "anon_update_trades" ON trades FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_trades" ON trades;
CREATE POLICY "anon_delete_trades" ON trades FOR DELETE
  TO anon, authenticated USING (true);

CREATE TABLE IF NOT EXISTS bot_trades (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  symbol text NOT NULL,
  side text NOT NULL,
  amount numeric NOT NULL,
  price numeric NOT NULL,
  strategy text NOT NULL,
  status text DEFAULT 'executed',
  order_id text,
  error text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE bot_trades ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_bot_trades" ON bot_trades;
CREATE POLICY "anon_select_bot_trades" ON bot_trades FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_bot_trades" ON bot_trades;
CREATE POLICY "anon_insert_bot_trades" ON bot_trades FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_bot_trades" ON bot_trades;
CREATE POLICY "anon_update_bot_trades" ON bot_trades FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_bot_trades" ON bot_trades;
CREATE POLICY "anon_delete_bot_trades" ON bot_trades FOR DELETE
  TO anon, authenticated USING (true);

CREATE INDEX IF NOT EXISTS idx_trades_created_at ON trades (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_bot_trades_created_at ON bot_trades (created_at DESC);
