import { createClient } from "npm:@supabase/supabase-js@2.45.4";
import { hmac } from "node:crypto";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const MEXC_API_BASE = "https://api.mexc.com";

interface SettingsRow {
  api_key: string | null;
  api_secret: string | null;
}

async function getSettings(supabase: any): Promise<SettingsRow> {
  const { data, error } = await supabase
    .from("settings")
    .select("api_key, api_secret")
    .eq("id", 1)
    .maybeSingle();
  if (error) throw new Error(`Failed to load settings: ${error.message}`);
  return data ?? { api_key: null, api_secret: null };
}

function sign(queryString: string, secret: string): string {
  return hmac("sha256", secret).update(queryString).digest("hex");
}

function buildSignedQuery(params: Record<string, string>, secret: string): string {
  const sorted = Object.keys(params).sort();
  const queryString = sorted
    .map((k) => `${encodeURIComponent(k)}=${encodeURIComponent(params[k])}`)
    .join("&");
  const signature = sign(queryString, secret);
  return `${queryString}&signature=${signature}`;
}

async function mexcRequest(
  method: string,
  endpoint: string,
  apiKey: string,
  apiSecret: string,
  params?: Record<string, string>,
): Promise<any> {
  const allParams: Record<string, string> = {
    ...params,
    timestamp: Date.now().toString(),
  };
  const signedQuery = buildSignedQuery(allParams, apiSecret);
  const url = `${MEXC_API_BASE}${endpoint}?${signedQuery}`;

  const response = await fetch(url, {
    method,
    headers: {
      "X-MEXC-APIKEY": apiKey,
      "Content-Type": "application/x-www-form-urlencoded",
    },
  });

  const text = await response.text();
  let body: any;
  try {
    body = JSON.parse(text);
  } catch {
    body = text;
  }

  if (!response.ok) {
    const msg = typeof body === "object" ? body.msg || body.message || text : text;
    return { error: msg, status: response.status };
  }
  return body;
}

async function mexcPublic(endpoint: string): Promise<any> {
  const response = await fetch(`${MEXC_API_BASE}${endpoint}`);
  const text = await response.text();
  let body: any;
  try {
    body = JSON.parse(text);
  } catch {
    body = text;
  }
  if (!response.ok) {
    return { error: `MEXC API error: ${response.status}`, status: response.status };
  }
  return body;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const url = new URL(req.url);
    const action = url.searchParams.get("action") || url.pathname.split("/").pop();

    // ====== PUBLIC ENDPOINTS (no API key needed) ======
    if (action === "price") {
      const symbol = url.searchParams.get("symbol") || "BTCUSDT";
      const data = await mexcPublic(`/api/v3/ticker/price?symbol=${symbol}`);
      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "ticker24h") {
      const symbol = url.searchParams.get("symbol") || "BTCUSDT";
      const data = await mexcPublic(`/api/v3/ticker/24hr?symbol=${symbol}`);
      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "klines") {
      const symbol = url.searchParams.get("symbol") || "BTCUSDT";
      const interval = url.searchParams.get("interval") || "1m";
      const limit = url.searchParams.get("limit") || "50";
      const data = await mexcPublic(
        `/api/v3/klines?symbol=${symbol}&interval=${interval}&limit=${limit}`,
      );
      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "exchangeInfo") {
      const data = await mexcPublic("/api/v3/exchangeInfo");
      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ====== SIGNED ENDPOINTS (require API key) ======
    const settings = await getSettings(supabase);

    if (!settings.api_key || !settings.api_secret) {
      return new Response(
        JSON.stringify({ error: "لم يتم إعداد مفاتيح API بعد. اذهب إلى الإعدادات." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const apiKey = settings.api_key;
    const apiSecret = settings.api_secret;

    if (action === "account") {
      const data = await mexcRequest("GET", "/api/v3/account", apiKey, apiSecret);
      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "balance") {
      const asset = url.searchParams.get("asset") || "USDT";
      const account = await mexcRequest("GET", "/api/v3/account", apiKey, apiSecret);
      if (account.error) {
        return new Response(JSON.stringify(account), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      let balance = 0;
      let locked = 0;
      for (const bal of account.balances || []) {
        if (bal.asset === asset) {
          balance = parseFloat(bal.free) || 0;
          locked = parseFloat(bal.locked) || 0;
          break;
        }
      }
      return new Response(
        JSON.stringify({ asset, free: balance, locked, total: balance + locked }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    if (action === "allBalances") {
      const account = await mexcRequest("GET", "/api/v3/account", apiKey, apiSecret);
      if (account.error) {
        return new Response(JSON.stringify(account), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const balances = (account.balances || [])
        .filter((b: any) => parseFloat(b.free) > 0 || parseFloat(b.locked) > 0)
        .map((b: any) => ({
          asset: b.asset,
          free: parseFloat(b.free) || 0,
          locked: parseFloat(b.locked) || 0,
          total: (parseFloat(b.free) || 0) + (parseFloat(b.locked) || 0),
        }));
      return new Response(JSON.stringify(balances), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "openOrders") {
      const symbol = url.searchParams.get("symbol");
      const params: Record<string, string> = {};
      if (symbol) params.symbol = symbol;
      const data = await mexcRequest("GET", "/api/v3/openOrders", apiKey, apiSecret, params);
      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "orderHistory") {
      const symbol = url.searchParams.get("symbol") || "BTCUSDT";
      const data = await mexcRequest("GET", "/api/v3/allOrders", apiKey, apiSecret, {
        symbol,
        limit: "50",
      });
      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "placeOrder") {
      const body = await req.json();
      const symbol = body.symbol;
      const side = body.side;
      const amount = parseFloat(body.amount);
      const MAX_TRADE = 1.0;

      if (!symbol || !side) {
        return new Response(JSON.stringify({ error: "symbol and side required" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (amount > MAX_TRADE) {
        return new Response(
          JSON.stringify({ error: `الحد الأقصى للصفقة $${MAX_TRADE}` }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }

      const data = await mexcRequest("POST", "/api/v3/order", apiKey, apiSecret, {
        symbol,
        side,
        type: "MARKET",
        quoteOrderQty: amount.toFixed(2),
      });

      if (!data.error) {
        await supabase.from("trades").insert({
          symbol,
          side,
          amount,
          price: parseFloat(data.fills?.[0]?.price || "0"),
          quantity: parseFloat(data.executedQty || "0"),
          status: "filled",
          order_id: data.orderId?.toString(),
        });
      }

      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "cancelOrder") {
      const symbol = url.searchParams.get("symbol");
      const orderId = url.searchParams.get("orderId");
      if (!symbol || !orderId) {
        return new Response(JSON.stringify({ error: "symbol and orderId required" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const data = await mexcRequest("DELETE", "/api/v3/order", apiKey, apiSecret, {
        symbol,
        orderId,
      });
      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "botTrade") {
      const body = await req.json();
      const symbol = body.symbol;
      const side = body.side;
      const amount = parseFloat(body.amount);
      const strategy = body.strategy || "scalping";
      const MAX_TRADE = 1.0;

      if (amount > MAX_TRADE) {
        return new Response(
          JSON.stringify({ error: `الحد الأقصى $${MAX_TRADE}` }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }

      const data = await mexcRequest("POST", "/api/v3/order", apiKey, apiSecret, {
        symbol,
        side,
        type: "MARKET",
        quoteOrderQty: amount.toFixed(2),
      });

      if (!data.error) {
        await supabase.from("bot_trades").insert({
          symbol,
          side,
          amount,
          price: parseFloat(data.fills?.[0]?.price || "0"),
          strategy,
          status: "executed",
          order_id: data.orderId?.toString(),
        });
      }

      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(
      JSON.stringify({ error: `Unknown action: ${action}` }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message || "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
