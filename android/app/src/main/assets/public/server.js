// server.ts
import express from "express";
import path from "path";
import crypto from "crypto";
import dotenv from "dotenv";
dotenv.config();
var app = express();
var PORT = 3e3;
app.use(express.json({ limit: "10mb" }));
var botState = {
  running: false,
  symbol: "BTCUSDT",
  strategy: "MEXC Event Futures - High Speed Momentum",
  timeframe: "15m",
  tradeAmount: 5,
  tradesCount: 0,
  pnlUsdt: 0,
  logs: [
    `[${(/* @__PURE__ */ new Date()).toLocaleTimeString("ar-EG")}] \u062A\u0645 \u062A\u062C\u0647\u064A\u0632 \u0645\u062D\u0631\u0643 \u0627\u0644\u062A\u062F\u0627\u0648\u0644 \u0627\u0644\u0622\u0644\u064A \u0639\u0644\u0649 MEXC.`
  ],
  lastTradeTime: (/* @__PURE__ */ new Date()).toLocaleTimeString("ar-EG")
};
var MEXC_BASE_URL = "https://contract.mexc.com";
function getMexcKeys() {
  const apiKey = process.env.MEXC_API_KEY;
  const secretKey = process.env.MEXC_SECRET_KEY;
  if (!apiKey || !secretKey) {
    return null;
  }
  return { apiKey, secretKey };
}
function sign(params, secretKey) {
  return crypto.createHmac("sha256", secretKey).update(params).digest("hex");
}
async function mexcFuturesGet(endpoint, secretKey) {
  const timestamp = Date.now();
  const queryString = `timestamp=${timestamp}`;
  const signature = sign(queryString, secretKey);
  const url = `${MEXC_BASE_URL}/api/v1/private${endpoint}?${queryString}&signature=${signature}`;
  const response = await fetch(url, {
    method: "GET",
    headers: {
      "X-MEXC-APIKEY": process.env.MEXC_API_KEY
    }
  });
  if (!response.ok) {
    const text = await response.text();
    let errorMsg = `HTTP ${response.status}`;
    try {
      const json = JSON.parse(text);
      errorMsg = json.msg || json.message || errorMsg;
    } catch (e) {
      errorMsg = text;
    }
    throw new Error(errorMsg);
  }
  return response.json();
}
async function mexcFuturesPost(endpoint, bodyParams, secretKey) {
  const timestamp = Date.now();
  const paramEntries = Object.entries(bodyParams);
  const paramStr = paramEntries.map(([k, v]) => `${k}=${encodeURIComponent(v)}`).join("&");
  const queryString = `${paramStr}&timestamp=${timestamp}`;
  const signature = sign(queryString, secretKey);
  const url = `${MEXC_BASE_URL}/api/v1/private${endpoint}?timestamp=${timestamp}&signature=${signature}`;
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "X-MEXC-APIKEY": process.env.MEXC_API_KEY,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(bodyParams)
  });
  if (!response.ok) {
    const text = await response.text();
    let errorMsg = `HTTP ${response.status}`;
    try {
      const json = JSON.parse(text);
      errorMsg = json.msg || json.message || errorMsg;
    } catch (e) {
      errorMsg = text;
    }
    throw new Error(errorMsg);
  }
  return response.json();
}
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: (/* @__PURE__ */ new Date()).toISOString() });
});
app.get("/api/mexc/tickers", async (req, res) => {
  try {
    const symbols = ["BTCUSDT", "ETHUSDT", "SOLUSDT"];
    const tickers = [];
    for (const symbol of symbols) {
      try {
        const res2 = await fetch(`https://contract.mexc.com/api/v1/contract/detail/${symbol}`);
        if (res2.ok) {
          const data = await res2.json();
          if (data.success && data.data) {
            const d = data.data;
            tickers.push({
              symbol,
              name: `${symbol.replace("USDT", "")} Event Futures`,
              price: parseFloat(d.lastPrice || "0"),
              change24h: parseFloat(d.chgRate || "0") * 100,
              high24h: parseFloat(d.high24Price || "0"),
              low24h: parseFloat(d.low24Price || "0"),
              yieldRate: 80
            });
            continue;
          }
        }
      } catch (e) {
      }
    }
    if (tickers.length === 0) {
      return res.json({
        tickers: [
          { symbol: "BTCUSDT", name: "Bitcoin Event Futures", price: 0, change24h: 0, high24h: 0, low24h: 0, yieldRate: 80, error: "\u062A\u0639\u0630\u0631 \u062C\u0644\u0628 \u0627\u0644\u0623\u0633\u0639\u0627\u0631 \u0627\u0644\u062D\u0642\u064A\u0642\u064A\u0629" },
          { symbol: "ETHUSDT", name: "Ethereum Event Futures", price: 0, change24h: 0, high24h: 0, low24h: 0, yieldRate: 80, error: "\u062A\u0639\u0630\u0631 \u062C\u0644\u0628 \u0627\u0644\u0623\u0633\u0639\u0627\u0631 \u0627\u0644\u062D\u0642\u064A\u0642\u064A\u0629" },
          { symbol: "SOLUSDT", name: "Solana Event Futures", price: 0, change24h: 0, high24h: 0, low24h: 0, yieldRate: 80, error: "\u062A\u0639\u0630\u0631 \u062C\u0644\u0628 \u0627\u0644\u0623\u0633\u0639\u0627\u0631 \u0627\u0644\u062D\u0642\u064A\u0642\u064A\u0629" }
        ]
      });
    }
    res.json({ tickers, source: "MEXC Live" });
  } catch (err) {
    res.status(500).json({ tickers: [], error: err.message });
  }
});
app.get("/api/mexc/account", async (req, res) => {
  try {
    const keys = getMexcKeys();
    if (!keys) {
      return res.json({
        success: false,
        error: "\u0644\u0645 \u064A\u062A\u0645 \u062A\u0643\u0648\u064A\u0646 \u0645\u0641\u0627\u062A\u064A\u062D API MEXC. \u064A\u0631\u062C\u0649 \u0625\u0636\u0627\u0641\u0629 MEXC_API_KEY \u0648 MEXC_SECRET_KEY \u0641\u064A \u0625\u0639\u062F\u0627\u062F\u0627\u062A \u0627\u0644\u0645\u0634\u0631\u0648\u0639.",
        hasKeys: false,
        usdtBalance: 0,
        futuresBalance: 0,
        status: "\u063A\u064A\u0631 \u0645\u062A\u0635\u0644 - \u0645\u0641\u0627\u062A\u064A\u062D API \u063A\u064A\u0631 \u0645\u0647\u064A\u0623\u0629"
      });
    }
    try {
      const accountData = await mexcFuturesGet("/account/assets", keys.secretKey);
      if (!accountData || !accountData.success || accountData.code !== 0) {
        return res.json({
          success: false,
          error: accountData?.message || accountData?.msg || "\u0641\u0634\u0644 \u0641\u064A \u062C\u0644\u0628 \u0628\u064A\u0627\u0646\u0627\u062A \u0627\u0644\u062D\u0633\u0627\u0628",
          details: accountData,
          usdtBalance: 0,
          futuresBalance: 0,
          status: "\u062E\u0637\u0623 \u0641\u064A API MEXC"
        });
      }
      let usdtBalance = 0;
      let futuresEquity = 0;
      let totalCashBalance = 0;
      const assets = accountData.data || [];
      for (const asset of assets) {
        if (asset.currency === "USDT") {
          usdtBalance = parseFloat(asset.availableBalance || "0");
          futuresEquity = parseFloat(asset.equity || "0");
          totalCashBalance = parseFloat(asset.cashBalance || "0");
        }
      }
      res.json({
        success: true,
        hasKeys: true,
        usdtBalance,
        futuresEquity,
        cashBalance: totalCashBalance,
        allAssets: assets,
        status: "\u0645\u062A\u0635\u0644 \u0628\u0640 MEXC Futures API - \u0631\u0635\u064A\u062F \u062D\u0642\u064A\u0642\u064A",
        source: "contract.mexc.com/api/v1/private/account/assets"
      });
    } catch (err) {
      console.error("MEXC Futures API Error:", err.message);
      return res.json({
        success: false,
        error: err.message,
        usdtBalance: 0,
        futuresBalance: 0,
        status: "\u062E\u0637\u0623 \u0641\u064A \u0627\u0644\u0627\u062A\u0635\u0627\u0644 \u0628\u0640 MEXC Futures API",
        hasKeys: true
      });
    }
  } catch (err) {
    console.error("Account endpoint error:", err);
    res.status(500).json({
      success: false,
      error: "\u062E\u0637\u0623 \u0641\u064A \u0627\u0644\u062E\u0627\u062F\u0645",
      details: err.message
    });
  }
});
app.post("/api/mexc/trade", async (req, res) => {
  try {
    const { symbol, side, amount, leverage } = req.body;
    const keys = getMexcKeys();
    if (!keys) {
      return res.status(400).json({
        success: false,
        error: "\u0645\u0641\u0627\u062A\u064A\u062D API \u063A\u064A\u0631 \u0645\u0647\u064A\u0623\u0629 \u0644\u0644\u062A\u062F\u0627\u0648\u0644 \u0627\u0644\u062D\u0642\u064A\u0642\u064A"
      });
    }
    if (!symbol || !side || !amount) {
      return res.status(400).json({
        success: false,
        error: "\u0628\u064A\u0627\u0646\u0627\u062A \u0627\u0644\u0635\u0641\u0642\u0629 \u063A\u064A\u0631 \u0645\u0643\u062A\u0645\u0644\u0629: symbol, side, amount \u0645\u0637\u0644\u0648\u0628\u0629"
      });
    }
    const positionType = side === "UP" ? 1 : 2;
    const qty = parseFloat(amount);
    try {
      const orderParams = {
        symbol,
        leverage: (leverage || "10").toString(),
        positionType: positionType.toString(),
        openType: "1",
        // isolated margin
        quantity: qty.toString(),
        orderType: "1",
        // limit
        price: "0"
        // market-like (will need to get current price)
      };
      const orderData = await mexcFuturesPost("/order/submit", orderParams, keys.secretKey);
      if (!orderData || !orderData.success) {
        throw new Error(orderData?.msg || orderData?.message || "\u0641\u0634\u0644 \u062A\u0646\u0641\u064A\u0630 \u0627\u0644\u0635\u0641\u0642\u0629");
      }
      botState.logs.unshift(`[${(/* @__PURE__ */ new Date()).toLocaleTimeString("ar-EG")}] \u2705 \u0635\u0641\u0642\u0629 \u062D\u0642\u064A\u0642\u064A\u0629: ${side === "UP" ? "Long" : "Short"} \u0628\u0645\u0628\u0644\u063A ${qty} \u0639\u0644\u0649 ${symbol}`);
      botState.tradesCount += 1;
      botState.lastTradeTime = (/* @__PURE__ */ new Date()).toLocaleTimeString("ar-EG");
      res.json({
        success: true,
        orderId: orderData.data?.orderId || orderData.data?.id || Date.now().toString(),
        symbol,
        type: side,
        amount: qty,
        leverage: leverage || 10,
        message: "\u062A\u0645 \u062A\u0646\u0641\u064A\u0630 \u0627\u0644\u0635\u0641\u0642\u0629 \u0627\u0644\u062D\u0642\u064A\u0642\u064A\u0629 \u0628\u0646\u062C\u0627\u062D \u0639\u0644\u0649 \u0645\u0646\u0635\u0629 MEXC Futures",
        details: orderData.data
      });
    } catch (err) {
      console.error("MEXC Futures Order Error:", err.message);
      throw new Error(`\u0641\u0634\u0644 \u062A\u0646\u0641\u064A\u0630 \u0627\u0644\u0635\u0641\u0642\u0629 \u0639\u0644\u0649 MEXC: ${err.message}`);
    }
  } catch (err) {
    console.error("MEXC trade error:", err);
    botState.logs.unshift(`[${(/* @__PURE__ */ new Date()).toLocaleTimeString("ar-EG")}] \u274C \u062E\u0637\u0623: ${err.message}`);
    res.status(500).json({
      success: false,
      error: err.message || "\u0641\u0634\u0644 \u062A\u0646\u0641\u064A\u0630 \u0627\u0644\u0635\u0641\u0642\u0629"
    });
  }
});
app.get("/api/bot/status", (req, res) => {
  res.json(botState);
});
app.post("/api/bot/start", (req, res) => {
  botState.running = true;
  const time = (/* @__PURE__ */ new Date()).toLocaleTimeString("ar-EG");
  botState.logs.unshift(`[${time}] \u{1F680} \u062A\u0645 \u062A\u0634\u063A\u064A\u0644 \u0628\u0648\u062A \u0627\u0644\u062A\u062F\u0627\u0648\u0644 \u0627\u0644\u0622\u0644\u064A`);
  res.json({ success: true, running: true });
});
app.post("/api/bot/stop", (req, res) => {
  botState.running = false;
  const time = (/* @__PURE__ */ new Date()).toLocaleTimeString("ar-EG");
  botState.logs.unshift(`[${time}] \u{1F6D1} \u062A\u0645 \u0625\u064A\u0642\u0627\u0641 \u0628\u0648\u062A \u0627\u0644\u062A\u062F\u0627\u0648\u0644 \u0627\u0644\u0622\u0644\u064A`);
  res.json({ success: true, running: false });
});
app.post("/api/github/trigger-build", async (req, res) => {
  try {
    const token = process.env.TOKEN_NOR || process.env.GITHUB_TOKEN;
    const repoOwner = "noramark281-lab";
    const repoName = "Nor";
    if (!token) {
      return res.json({
        success: true,
        message: "\u0644\u0627 \u064A\u0648\u062C\u062F \u062A\u0648\u0643\u0646 GitHub \u0645\u062A\u0627\u062D. \u0627\u0644\u0628\u0646\u0627\u0621 \u064A\u0639\u0645\u0644 \u062A\u0644\u0642\u0627\u0626\u064A\u0627\u064B \u0639\u0646\u062F push."
      });
    }
    const triggerUrl = `https://api.github.com/repos/${repoOwner}/${repoName}/actions/workflows/main.yml/dispatches`;
    const ghRes = await fetch(triggerUrl, {
      method: "POST",
      headers: {
        "Accept": "application/vnd.github+json",
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ ref: "main" })
    });
    if (ghRes.ok) {
      res.json({ success: true, message: "\u062A\u0645 \u0625\u0631\u0633\u0627\u0644 \u0623\u0645\u0631 \u0627\u0644\u0628\u0646\u0627\u0621 \u0644\u0640 GitHub Actions" });
    } else {
      res.json({
        success: false,
        message: "\u0641\u0634\u0644 \u0625\u0631\u0633\u0627\u0644 \u0623\u0645\u0631 \u0627\u0644\u0628\u0646\u0627\u0621",
        details: await ghRes.text()
      });
    }
  } catch (err) {
    res.json({ success: false, error: err.message });
  }
});
async function startServer() {
  if (process.env.NODE_ENV === "production") {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  } else {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  }
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}
startServer();
//# sourceMappingURL=server.js.map
