// Backend/src/routes/kite.routes.js  ← REPLACE existing
import express from "express";
import crypto  from "crypto";
import axios   from "axios";
import fs      from "fs";
import path    from "path";
import { fileURLToPath } from "url";
import { kiteWS } from "../utils/kiteWebSocket.js";
import { autoLoginKite } from "../utils/kiteAutoLogin.js";

const __dirname  = path.dirname(fileURLToPath(import.meta.url));
const ENV_PATH   = path.resolve(__dirname, "../../.env");

const router     = express.Router();
const API_KEY    = process.env.KITE_API_KEY;
const API_SECRET = process.env.KITE_API_SECRET;

// ✅ FIX: autoLoginKite process.env.KITE_ACCESS_TOKEN update karta hai
// headers() ab runtime pe fresh token read karta hai — stale nahi hoga
const getToken = () => process.env.KITE_ACCESS_TOKEN || "";
let ACCESS_TOKEN = getToken(); // backward compat ke liye (callback mein use hota hai)

const headers = () => ({
  "X-Kite-Version": "3",
  Authorization: `token ${API_KEY}:${getToken()}`,
});

// Helper: build ?i=X&i=Y query string (Kite requires repeated params)
const symQS = (syms) => syms.map(s => `i=${encodeURIComponent(s)}`).join("&");

// Helper: update .env file so token survives backend restarts
function saveTokenToEnv(token) {
  try {
    let content = fs.existsSync(ENV_PATH) ? fs.readFileSync(ENV_PATH, "utf8") : "";
    if (content.includes("KITE_ACCESS_TOKEN=")) {
      content = content.replace(/^KITE_ACCESS_TOKEN=.*/m, `KITE_ACCESS_TOKEN=${token}`);
    } else {
      content += `\nKITE_ACCESS_TOKEN=${token}`;
    }
    fs.writeFileSync(ENV_PATH, content, "utf8");
    console.log("✅ Token saved to .env automatically");
  } catch (e) {
    console.warn("⚠️  Could not auto-save to .env:", e.message);
  }
}

// ── LOGIN ─────────────────────────────────────────────────────────
router.get("/login", (req, res) => {
  if (!API_KEY) return res.status(500).send("❌ KITE_API_KEY not set");
  res.redirect(`https://kite.zerodha.com/connect/login?v=3&api_key=${API_KEY}`);
});

// ── CALLBACK ──────────────────────────────────────────────────────
router.get("/callback", async (req, res) => {
  const { request_token, status } = req.query;
  if (status !== "success" || !request_token)
    return res.status(400).send(`<h2 style="color:red">❌ Login failed: ${status}</h2>`);

  try {
    const checksum = crypto.createHash("sha256")
      .update(API_KEY + request_token + API_SECRET).digest("hex");

    const r = await axios.post(
      "https://api.kite.trade/session/token",
      new URLSearchParams({ api_key: API_KEY, request_token, checksum }),
      { headers: { "X-Kite-Version": "3", "Content-Type": "application/x-www-form-urlencoded" } }
    );

    ACCESS_TOKEN = r.data.data.access_token;
    process.env.KITE_ACCESS_TOKEN = ACCESS_TOKEN; // ✅ process.env update karo
    const user   = r.data.data;
    console.log(`\n✅ NEW TOKEN: ${ACCESS_TOKEN}\n`);

    // Auto-save to .env + reconnect WebSocket
    saveTokenToEnv(ACCESS_TOKEN);
    kiteWS.updateToken(ACCESS_TOKEN);

    res.send(`<!DOCTYPE html>
<html><head><meta charset="UTF-8"><title>Login Success</title>
<style>
  * { margin:0; padding:0; box-sizing:border-box; font-family:'Segoe UI',sans-serif; }
  body { background:#0a1826; min-height:100vh; display:flex; align-items:center; justify-content:center; }
  .card { background:#0c1821; border:1px solid #1a2d3f; border-radius:16px; padding:40px; max-width:520px; width:90%; }
  h2 { color:#16a34a; font-size:20px; margin-bottom:8px; }
  p { color:#5a7a92; font-size:13px; margin-bottom:16px; }
  .token-box { background:#081017; border:1px solid #1a2d3f; border-radius:10px; padding:16px; margin:16px 0; word-break:break-all; font-family:monospace; font-size:12px; color:#4ade80; }
  .badge { display:inline-flex; align-items:center; gap:6px; background:#16a34a20; border:1px solid #16a34a40; color:#4ade80; font-size:12px; font-weight:700; padding:6px 12px; border-radius:8px; margin:4px 2px; }
  .warn { color:#f59e0b; font-size:12px; margin-top:16px; padding:12px; background:#f59e0b10; border:1px solid #f59e0b30; border-radius:8px; }
  .close-btn { margin-top:24px; width:100%; padding:12px; background:#16a34a; color:white; border:none; border-radius:10px; font-weight:700; cursor:pointer; font-size:14px; }
  .close-btn:hover { background:#15803d; }
</style></head>
<body><div class="card">
  <h2>✅ Login Successful</h2>
  <p>Welcome, <strong style="color:#c0d8ea">${user.user_name}</strong> (${user.user_id})</p>
  <div style="display:flex;flex-wrap:wrap;gap:4px;margin-bottom:16px">
    <span class="badge">✅ Token Saved</span>
    <span class="badge">🔌 WebSocket Live</span>
    <span class="badge">📁 .env Updated</span>
  </div>
  <p style="color:#3d5f78;font-size:11px;margin-bottom:4px">New Access Token (auto-saved to .env):</p>
  <div class="token-box">${ACCESS_TOKEN}</div>
  <div class="warn">⏰ Token expires at 6:00 AM IST tomorrow.<br>
  If you set up KITE_TOTP_SECRET in .env, it auto-refreshes daily — no manual login needed.</div>
  <button class="close-btn" onclick="window.close()">Close & Go Back to Dashboard</button>
</div></body></html>`);
  } catch (err) {
    console.error("❌ Token exchange failed:", err?.response?.data);
    res.status(500).send(`<h2>❌ ${JSON.stringify(err?.response?.data)}</h2>`);
  }
});

// ── STATUS ────────────────────────────────────────────────────────
router.get("/status", (req, res) => {
  res.json({
    ws_connected:  kiteWS.isConnected(),
    has_token:     !!ACCESS_TOKEN,
    api_key_set:   !!API_KEY,
    token_preview: ACCESS_TOKEN ? ACCESS_TOKEN.slice(0, 8) + "…" : "NOT SET",
    instruments:   Object.keys(kiteWS.getLastTicks()).length,
  });
});

// ── INDEX TOKENS DEBUG — visit /api/v1/kite/index-tokens ─────────
// Dikhata hai ki Kite instruments API se kaun sa token mila har index ke liye
router.get("/index-tokens", async (req, res) => {
  try {
    const map = await getNSEIndexTokens();
    res.json({ status: "success", count: Object.keys(map).length, tokens: map });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
});

// ── MANUAL AUTO-LOGIN TRIGGER ────────────────────────────────────
// Visit: /api/v1/kite/refresh-token to manually refresh token
router.get("/refresh-token", async (req, res) => {
  try {
    console.log("🔄 Manual token refresh triggered...");
    const token = await autoLoginKite();
    if (token) {
      res.json({ status: "success", message: "Token refreshed", token: token.slice(0, 8) + "…" });
    } else {
      res.status(500).json({ status: "error", message: "Auto-login failed — check server logs" });
    }
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
});

// ── QUOTE (full price + depth) ────────────────────────────────────
router.get("/quote", async (req, res) => {
  try {
    const syms = [].concat(req.query.i || []);
    const r    = await axios.get(`https://api.kite.trade/quote?${symQS(syms)}`, { headers: headers() });
    res.json(r.data);
  } catch (err) {
    res.status(err?.response?.status || 500).json(err?.response?.data || { status: "error", message: err.message });
  }
});

// ── OHLC ──────────────────────────────────────────────────────────
router.get("/ohlc", async (req, res) => {
  try {
    const syms = [].concat(req.query.i || []);
    try {
      const r = await axios.get(`https://api.kite.trade/ohlc?${symQS(syms)}`, { headers: headers() });
      return res.json(r.data);
    } catch (_) {
      const r = await axios.get(`https://api.kite.trade/quote?${symQS(syms)}`, { headers: headers() });
      const data = {};
      for (const [k, v] of Object.entries(r.data.data || {})) {
        data[k] = { instrument_token: v.instrument_token, last_price: v.last_price, ohlc: v.ohlc };
      }
      res.json({ status: "success", data });
    }
  } catch (err) {
    res.status(err?.response?.status || 500).json(err?.response?.data || { status: "error", message: err.message });
  }
});

// ── HISTORICAL CANDLES ────────────────────────────────────────────
router.get("/historical", async (req, res) => {
  try {
    const { token, interval, from, to } = req.query;
    if (!token || !interval) return res.status(400).json({ error: "token and interval required" });

    const toDate   = to   || new Date().toISOString().split("T")[0];
    const fromDate = from || (() => {
      const d = new Date();
      if (interval === "day")             d.setFullYear(d.getFullYear() - 1);
      else if (interval.includes("minute")) d.setDate(d.getDate() - 7);
      else                                  d.setDate(d.getDate() - 30);
      return d.toISOString().split("T")[0];
    })();

    const r = await axios.get(
      `https://api.kite.trade/instruments/historical/${token}/${interval}`,
      { headers: headers(), params: { from: fromDate, to: toDate } }
    );

    const candles = (r.data?.data?.candles || []).map(([time, open, high, low, close, volume]) => ({
      x: new Date(time).getTime(),
      y: [open, high, low, close],
      volume,
    }));

    res.json({ status: "success", candles });
  } catch (err) {
    res.status(err?.response?.status || 500).json(err?.response?.data || { status: "error", message: err.message });
  }
});

// ── NSE INDEX TOKEN CACHE (auto-discovered from Kite instruments API) ────────
// Kite ka /instruments endpoint publicly accessible hai — tokens kabhi nahi badalte for indices
let _indexTokenCache = {};
let _indexTokenTs    = 0;
const INDEX_TOKEN_TTL = 6 * 60 * 60 * 1000; // 6 hours

// Stocks ke liye hardcoded — ye indices nahi hain, instruments API mein alag segment mein hain
const STOCK_TOKEN_MAP = {
  "RELIANCE":  738561,  "TCS":       2953217, "HDFCBANK":  341249,
  "INFY":      408065,  "ICICIBANK": 1270529, "WIPRO":     969473,
  "HINDUNILVR":356865,  "ITC":       424961,  "SENSEX":    265,
};

// ── HARDCODED FALLBACK INDEX TOKENS ──────────────────────────────────────────
// Agar instruments API fail ho (expired token / network issue), ye fallback use hoga.
// NSE index tokens NEVER change — ye permanent hain.
const NSE_INDEX_FALLBACK = {
  // Canonical names (as used in frontend)
  "NIFTY 50":          256265,
  "NIFTY BANK":        260105,
  "NIFTY LARGEMID250": 288009,
  "NIFTY MIDCAP 100":  258801,
  "NIFTY SMLCAP 100":  259329,
  "INDIA VIX":         264969,
  "NIFTY IT":          258529,
  "NIFTY AUTO":        258049,
  "NIFTY PHARMA":      259849,
  "NIFTY METAL":       259337,
  "NIFTY REALTY":      260361,
  "NIFTY IND DEFENCE": 300265,
  "NIFTY FIN SERVICE": 261889,
  "NIFTY FMCG":        258537,
  "NIFTY ENERGY":      258409,
  "NIFTY PSU BANK":    260649,
};

// ── SYMBOL ALIAS MAP ──────────────────────────────────────────────────────────
// Kite instruments CSV mein kuch index names alag hain (spaces, abbreviations differ).
// Frontend jo symbol bhejta hai usse Kite ke actual tradingsymbol pe map karo.
// Key   = frontend se aane wala symbol (uppercase)
// Value = Kite instruments CSV ka exact tradingsymbol (uppercase)
const SYMBOL_ALIAS = {
  "NIFTY MIDCAP 100":  "NIFTY MID100",        // Kite CSV: "NIFTY MID100"
  "NIFTY SMLCAP 100":  "NIFTY SMLCAP100",     // Kite CSV: "NIFTY SMLCAP100"
  "NIFTY LARGEMID250": "NIFTY LARGEMID 250",  // Kite CSV: "NIFTY LARGEMID 250"
  "NIFTY IND DEFENCE": "NIFTY INDIA DEFENCE", // Kite CSV: "NIFTY INDIA DEFENCE"
  "NIFTY FIN SERVICE": "NIFTY FIN SERVICES",  // Kite CSV: "NIFTY FIN SERVICES"
};

async function getNSEIndexTokens() {
  // Always seed fallback first — ensures all tokens exist even if API call fails
  if (Object.keys(_indexTokenCache).length === 0) {
    _indexTokenCache = { ...NSE_INDEX_FALLBACK };
    console.log("📦 NSE index tokens seeded from hardcoded fallback");
  }

  // Return cache if fresh (TTL not expired)
  if (Date.now() - _indexTokenTs < INDEX_TOKEN_TTL) {
    return _indexTokenCache;
  }

  try {
    console.log("🔍 Fetching NSE index tokens from Kite instruments API...");
    const r = await axios.get("https://api.kite.trade/instruments", {
      headers: headers(),
      timeout: 15000,
      responseType: "text",
    });

    const lines   = r.data.split("\n").filter(l => l.trim());
    const hdrs    = lines[0].split(",");
    const tokenIdx   = hdrs.indexOf("instrument_token");
    const symbolIdx  = hdrs.indexOf("tradingsymbol");
    const segmentIdx = hdrs.indexOf("segment");

    // Start with fallback so we always have all known tokens
    const map = { ...NSE_INDEX_FALLBACK };
    for (const line of lines.slice(1)) {
      const cols = line.split(",");
      const seg  = cols[segmentIdx]?.trim();
      if (seg !== "NSE-INDICES") continue;
      const sym = cols[symbolIdx]?.trim().toUpperCase();
      const tok = parseInt(cols[tokenIdx]);
      if (sym && !isNaN(tok)) map[sym] = tok;
    }

    _indexTokenCache = map;
    _indexTokenTs    = Date.now();
    console.log(`✅ NSE index tokens loaded: ${Object.keys(map).length} indices`);
    return _indexTokenCache;

  } catch (err) {
    console.warn("⚠️  Could not fetch index tokens from Kite instruments API:", err.message);
    console.log("📦 Using hardcoded fallback NSE tokens");
    // Reset TTL so we don't hammer API on every request
    _indexTokenTs = Date.now();
    return _indexTokenCache;
  }
}

// ── MARKETS/HISTORY for CleanChart ───────────────────────────────
router.get("/markets/history/:symbol", async (req, res) => {
  const { symbol } = req.params;
  const period     = req.query.period || "1D";

  const PERIOD_MAP = {
    "1D": { interval: "5minute",  days: 5   }, // 5 days covers weekends & holidays
    "1W": { interval: "30minute", days: 10  }, // 10 days for a full trading week
    "1M": { interval: "day",      days: 30  },
    "3M": { interval: "day",      days: 90  },
    "1Y": { interval: "day",      days: 365 },
  };

  const symUpper = symbol.toUpperCase();
  // Apply alias — some frontend symbol names differ from Kite CSV tradingsymbols
  const symResolved = SYMBOL_ALIAS[symUpper] || symUpper;

  // 1. Check stocks first (fast, no API call)
  let token = STOCK_TOKEN_MAP[symUpper] || STOCK_TOKEN_MAP[symResolved];

  // 2. If not a stock, look up from Kite instruments (auto-discovers ALL NSE indices)
  // Try both original name and resolved alias
  if (!token) {
    const indexMap = await getNSEIndexTokens();
    token = indexMap[symUpper] || indexMap[symResolved];
  }

  // 3. If still not found, try hardcoded fallback directly (belt+suspenders)
  if (!token) token = NSE_INDEX_FALLBACK[symUpper] || NSE_INDEX_FALLBACK[symResolved];

  if (!token) return res.status(404).json({ status: "error", message: `Unknown symbol: ${symbol}. Tried: ${symUpper}, ${symResolved}` });

  const cfg = PERIOD_MAP[period] || PERIOD_MAP["1D"];

  const toDate   = new Date().toISOString().split("T")[0];
  const fromDate = (() => { const d = new Date(); d.setDate(d.getDate() - cfg.days); return d.toISOString().split("T")[0]; })();

  try {
    const r = await axios.get(
      `https://api.kite.trade/instruments/historical/${token}/${cfg.interval}`,
      { headers: headers(), params: { from: fromDate, to: toDate } }
    );
    const rawCandles = (r.data?.data?.candles || []).map(([time, open, high, low, close, volume]) => ({
      x: new Date(time).getTime(), y: [open, high, low, close], volume,
    }));

    // For 1D: filter to only the last trading session (most recent date) using IST
    // IST = UTC+5:30 (330 minutes ahead of UTC)
    // Zerodha timestamps are IST — comparing via UTC .toISOString() gives wrong dates
    let candles = rawCandles;
    if (period === "1D" && rawCandles.length > 0) {
      const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000; // 5h30m in ms

      // Helper: get "YYYY-MM-DD" in IST for a given UTC epoch ms
      const toISTDate = (ms) => new Date(ms + IST_OFFSET_MS).toISOString().slice(0, 10);

      // Find the most recent trading date present in the data
      const lastDate = toISTDate(rawCandles[rawCandles.length - 1].x);

      // Market hours: 9:15 AM IST = 03:45 UTC, 3:30 PM IST = 10:00 UTC
      const MARKET_OPEN_IST_MINUTES  = 9  * 60 + 15; // 555 min from midnight IST
      const MARKET_CLOSE_IST_MINUTES = 15 * 60 + 30; // 930 min from midnight IST

      candles = rawCandles.filter(c => {
        if (toISTDate(c.x) !== lastDate) return false;
        // Candle time in minutes from midnight IST
        const istMs      = c.x + IST_OFFSET_MS;
        const istMinutes = ((istMs / 60000) % (24 * 60) + 24 * 60) % (24 * 60); // 0–1439
        return istMinutes >= MARKET_OPEN_IST_MINUTES && istMinutes <= MARKET_CLOSE_IST_MINUTES;
      });
    }

    res.json({ status: "success", candles });
  } catch (err) {
    res.status(err?.response?.status || 500).json(err?.response?.data || { status: "error", message: err.message });
  }
});

// ── INSTRUMENTS LIST ──────────────────────────────────────────────
router.get("/instruments", async (req, res) => {
  try {
    const r = await axios.get("https://api.kite.trade/instruments", { headers: headers() });
    res.set("Content-Type", "text/csv");
    res.send(r.data);
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
});

// ── F&O INSTRUMENTS (NFO) ─────────────────────────────────────────
// KEY FIX: Kite NFO CSV has EMPTY `name` field — filter by tradingsymbol.startsWith()
router.get("/instruments/:exchange", async (req, res) => {
  try {
    const r = await axios.get(
      `https://api.kite.trade/instruments/${req.params.exchange}`,
      { headers: headers() }
    );
    res.set("Content-Type", "text/csv");
    res.send(r.data);
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
});

router.get("/fo/instruments", async (req, res) => {
  try {
    const name   = (req.query.name || "NIFTY").toString().toUpperCase();
    const type   = (req.query.type || "").toString().toUpperCase();
    const expiry = (req.query.expiry || "").toString();

    const r = await axios.get("https://api.kite.trade/instruments/NFO", { headers: headers(), responseType: "text" });
    const lines = r.data.split("\n").filter(l => l.trim());
    const hdrs  = lines[0].split(",").map(h => h.trim());

    const toObj = (line) => {
      const v = line.split(",");
      const o = {};
      hdrs.forEach((h, i) => { o[h] = (v[i] ?? "").trim(); });
      return o;
    };

    // Kite NFO CSV has EMPTY `name` column — must use tradingsymbol prefix
    const allMatching = lines.slice(1)
      .map(toObj)
      .filter(o => o.tradingsymbol && o.tradingsymbol.startsWith(name));

    const expiries   = [...new Set(allMatching.map(o => o.expiry).filter(Boolean))].sort();
    const nearExpiry = expiries[0] ?? "";
    const selExpiry  = expiry || nearExpiry;
    let   items      = allMatching.filter(o => o.expiry === selExpiry);
    if (type) items  = items.filter(o => o.instrument_type === type);

    res.json({
      status: "success",
      data:   items.slice(0, 500),
      meta:   { expiries, current_expiry: nearExpiry, selected_expiry: selExpiry, total: items.length },
    });
  } catch (err) {
    console.error("F&O instruments error:", err?.message);
    res.status(err?.response?.status || 500).json({ status: "error", message: err.message });
  }
});


// ── NSE CORPORATE ACTIONS PROXY ───────────────────────────────────
let _nseSession = { cookies: "", ts: 0 };

// Rotate UAs to reduce VPS IP detection on production
const NSE_USER_AGENTS = [
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36",
];
let _uaIdx = 0;
const getUA = () => NSE_USER_AGENTS[(_uaIdx++) % NSE_USER_AGENTS.length];
const NSE_UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";
const NSE_COMMON = {
  "User-Agent": NSE_UA, "Accept-Language": "en-IN,en-US;q=0.9,en;q=0.8",
  "Accept-Encoding": "gzip, deflate, br", "DNT": "1", "Connection": "keep-alive",
  "sec-ch-ua": '"Chromium";v="124", "Google Chrome";v="124", "Not-A.Brand";v="99"',
  "sec-ch-ua-mobile": "?0", "sec-ch-ua-platform": '"Windows"',
};

// ─────────────────────────────────────────────────────────────────
// ✅ FIX: Universal NSE array extractor
// NSE API response shapes vary: { data: [...] } or { data: { NIFTY: [...] } }
// or { NIFTY: [...] } or plain [...]. This handles all formats.
// ─────────────────────────────────────────────────────────────────
function extractNseRows(raw) {
  // Shape 1: direct array
  if (Array.isArray(raw)) return raw;
  // Shape 2: { data: [...] }
  if (Array.isArray(raw?.data)) return raw.data;
  // Shape 3: { data: { NIFTY: [...], NIFTY500: [...], ... } }
  // Shape 4: { NIFTY: [...], NIFTY_BANK: [...], ... }
  const src = (raw?.data && typeof raw.data === "object" && !Array.isArray(raw.data))
    ? raw.data
    : (typeof raw === "object" && raw !== null ? raw : null);
  if (src) {
    // Try well-known NSE index keys first
    for (const key of ["NIFTY", "NIFTY500", "NIFTY_500", "FO", "FNO", "NIFTY50", "NIFTY_100", "ALL"]) {
      if (Array.isArray(src[key]) && src[key].length > 0) return src[key];
    }
    // Fall back to first array value found
    const anyArr = Object.values(src).find(v => Array.isArray(v) && v.length > 0);
    if (anyArr) return anyArr;
  }
  return [];
}

function mergeCookies(existing, incoming = []) {
  const map = {};
  existing.split(";").forEach(c => { const [k,...v]=c.trim().split("="); if(k) map[k.trim()]=v.join("=").trim(); });
  incoming.forEach(c => { const [k,...v]=c.split(";")[0].trim().split("="); if(k) map[k.trim()]=v.join("=").trim(); });
  return Object.entries(map).filter(([k])=>k).map(([k,v])=>`${k}=${v}`).join("; ");
}

async function refreshNseSession() {
  console.log("🔄 Refreshing NSE session...");
  const ua = getUA();
  const dynamicCommon = { ...NSE_COMMON, "User-Agent": ua };

  const r1 = await axios.get("https://www.nseindia.com/", {
    timeout: 15000,
    headers: { ...dynamicCommon, Accept: "text/html,application/xhtml+xml,*/*;q=0.8", "Cache-Control": "no-cache",
      "sec-fetch-dest": "document", "sec-fetch-mode": "navigate", "sec-fetch-site": "none", "Upgrade-Insecure-Requests": "1" },
  });
  let cookies = mergeCookies("", r1.headers["set-cookie"] || []);
  await new Promise(r => setTimeout(r, 1200));

  // ✅ FIX: Try multiple warmup pages — NSE changes URLs, single URL causes 404 spam
  // These pages warm up the NSE session so subsequent API calls work on VPS/production
  const WARMUP_PAGES = [
    "https://www.nseindia.com/market-data/live-equity-market",
    "https://www.nseindia.com/market-data/most-active-securities",
    "https://www.nseindia.com/market-data/top-gainers-losers",
    "https://www.nseindia.com/get-quotes/equity?symbol=RELIANCE",
  ];

  for (const wUrl of WARMUP_PAGES) {
    try {
      const r2 = await axios.get(wUrl, {
        timeout: 10000,
        headers: {
          ...dynamicCommon,
          Accept:                   "text/html,application/xhtml+xml,*/*;q=0.8",
          Referer:                  "https://www.nseindia.com/",
          Cookie:                   cookies,
          "sec-fetch-dest":         "document",
          "sec-fetch-mode":         "navigate",
          "sec-fetch-site":         "same-origin",
          "Upgrade-Insecure-Requests": "1",
        },
      });
      cookies = mergeCookies(cookies, r2.headers["set-cookie"] || []);
      console.log(`  ✅ NSE warmup OK: ${wUrl}`);
      break; // First success is enough
    } catch (e) {
      console.warn(`  NSE warmup failed [${wUrl.split("/").pop()}]:`, e.message);
    }
  }

  await new Promise(r => setTimeout(r, 600));
  _nseSession = { cookies, ts: Date.now() };
  return cookies;
}

async function getNseSession(forceRefresh = false) {
  const CACHE_MS = 6 * 60 * 1000;
  if (!forceRefresh && _nseSession.cookies && Date.now() - _nseSession.ts < CACHE_MS) return _nseSession.cookies;
  return refreshNseSession();
}

// ── Shared NSE request helper with standard headers ───────────────
function nseApiHeaders(cookies, referer) {
  const ua = getUA();
  return {
    ...NSE_COMMON,
    "User-Agent":       ua,
    Accept:             "application/json, text/plain, */*",
    Referer:            referer,
    Cookie:             cookies,
    "sec-fetch-dest":   "empty",
    "sec-fetch-mode":   "cors",
    "sec-fetch-site":   "same-origin",
    "X-Requested-With": "XMLHttpRequest",
  };
}

// ─────────────────────────────────────────────────────────────────
// CORPORATE ACTIONS
//
// Tier 1: NSE session-based API  (warmup already working ✅)
//         — fresh session + 1 auto-retry on 401/403
// Tier 2: BSE public API         (no session needed)
// Tier 3: Stale cache            (never return empty if we had data before)
// ─────────────────────────────────────────────────────────────────
const _corpCache  = { data: null, source: "", ts: 0 };
const CORP_CACHE_MS = 30 * 60 * 1000; // 30 min

const CORP_UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";

// ── Tier 1: NSE session API ───────────────────────────────────────
async function fetchNseSessionCA(cookies) {
  const today    = new Date();
  const pad      = n => String(n).padStart(2, "0");
  const fmt      = d => `${pad(d.getDate())}-${pad(d.getMonth() + 1)}-${d.getFullYear()}`;
  const toDate   = fmt(today);
  const fromD    = new Date(today); fromD.setDate(today.getDate() - 30);
  const fromDate = fmt(fromD);

  const r = await axios.get(
    `https://www.nseindia.com/api/corporates-corporateActions?index=equities&from_date=${fromDate}&to_date=${toDate}`,
    {
      timeout: 15000,
      headers: nseApiHeaders(
        cookies,
        "https://www.nseindia.com/companies-listing/corporate-filings-actions"
      ),
    }
  );
  const raw = r.data;
  return Array.isArray(raw) ? raw : (raw?.data ?? raw?.body ?? []);
}

// ── Tier 2: BSE public API ────────────────────────────────────────
async function fetchBseCorpActions() {
  const r = await axios.get(
    "https://api.bseindia.com/BseIndiaAPI/api/CorporateAction/w?scripcode=&segment=0&strCat=-1&strPrevDate=&strScrip=&strSearch=P&strToDate=&strType=C&report=CORPACTALL",
    {
      timeout: 12000,
      headers: {
        "User-Agent": CORP_UA,
        Accept:       "application/json",
        Referer:      "https://www.bseindia.com/",
        Origin:       "https://www.bseindia.com",
      },
    }
  );
  const items = r.data?.Table ?? r.data?.data ?? r.data ?? [];
  return (Array.isArray(items) ? items : []).slice(0, 150).map(i => ({
    symbol:      i.SCRIP_CD  || "",
    companyName: i.COMP_NAME || "",
    subject:     i.PURPOSE   || "",
    exDate:      i.EX_DATE   || "",
    recordDate:  i.REC_DATE  || "",
    remarks:     i.REMARKS   || "",
    series:      i.SERIES    || "",
    source:      "BSE",
  }));
}

// ── GET /api/v1/kite/nse/corporate-actions ────────────────────────
router.get("/nse/corporate-actions", async (req, res) => {
  const forceRefresh = req.query.refresh === "1";
  const errors = [];

  // Serve fresh cache
  if (!forceRefresh && _corpCache.data?.length > 0 && Date.now() - _corpCache.ts < CORP_CACHE_MS) {
    return res.json({
      status: "success", data: _corpCache.data,
      source: _corpCache.source, cached: true, count: _corpCache.data.length,
    });
  }

  // ── Tier 1: NSE session API (attempt 1 — existing session) ──
  try {
    const cookies = await getNseSession();
    await new Promise(r => setTimeout(r, 400));
    const data = await fetchNseSessionCA(cookies);
    if (data.length > 0) {
      _corpCache.data = data; _corpCache.source = "NSE"; _corpCache.ts = Date.now();
      console.log(`✅ Corporate actions from NSE session: ${data.length} records`);
      return res.json({ status: "success", data, source: "NSE", count: data.length });
    }
    errors.push("NSE session attempt 1: 0 records");
  } catch (err) {
    const status = err?.response?.status;
    errors.push(`NSE session attempt 1: ${status ?? err.message}`);
    console.warn(`⚠️  NSE CA attempt 1 [${status ?? err.message}] — retrying with fresh session...`);

    // Auto-retry with a brand-new session on 401 / 403
    if (status === 401 || status === 403 || !status) {
      try {
        _nseSession = { cookies: "", ts: 0 };                     // force refresh
        await new Promise(r => setTimeout(r, 1500));
        const fresh = await getNseSession(true);
        await new Promise(r => setTimeout(r, 800));
        const data  = await fetchNseSessionCA(fresh);
        if (data.length > 0) {
          _corpCache.data = data; _corpCache.source = "NSE"; _corpCache.ts = Date.now();
          console.log(`✅ Corporate actions from NSE (retry): ${data.length} records`);
          return res.json({ status: "success", data, source: "NSE", count: data.length });
        }
        errors.push("NSE session retry: 0 records");
      } catch (e2) {
        errors.push(`NSE session retry: ${e2?.response?.status ?? e2.message}`);
        console.warn("⚠️  NSE CA retry also failed:", e2.message);
      }
    }
  }

  // ── Tier 2: BSE ──
  try {
    const data = await fetchBseCorpActions();
    if (data.length > 0) {
      _corpCache.data = data; _corpCache.source = "BSE"; _corpCache.ts = Date.now();
      console.log(`✅ Corporate actions from BSE fallback: ${data.length} records`);
      return res.json({ status: "success", data, source: "BSE", count: data.length });
    }
    errors.push("BSE: 0 records");
  } catch (err) {
    errors.push(`BSE: ${err?.response?.status ?? err.message}`);
    console.error("❌ BSE CA:", err.message);
  }

  // ── Tier 3: Stale cache ──
  if (_corpCache.data?.length > 0) {
    console.warn("⚠️  Serving stale corporate actions cache");
    return res.json({
      status: "success", data: _corpCache.data,
      source: _corpCache.source, cached: true, stale: true, count: _corpCache.data.length,
    });
  }

  console.error("❌ All corporate action tiers failed:", errors);
  return res.status(503).json({
    status: "error",
    message: "All corporate action sources temporarily unavailable",
    errors,
    data:  [],
  });
});

router.get("/corporate-actions", (req, res) => {
  res.json({ status: "success", data: [], note: "Use /kite/nse/corporate-actions" });
});



const YF_HEADERS_LIVE = {
  "User-Agent":      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  "Accept":          "application/json, text/plain, */*",
  "Accept-Language": "en-US,en;q=0.9",
  "Origin":          "https://finance.yahoo.com",
  "Referer":         "https://finance.yahoo.com/",
  "Cache-Control":   "no-cache",
};

/**
 * Fetch a single Yahoo Finance symbol.
 * Returns { price, changePct, currency } or throws.
 */
async function fetchYahooSymbol(symbol) {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1d&range=2d`;
  const r   = await axios.get(url, { headers: YF_HEADERS_LIVE, timeout: 10000 });
  const meta = r.data?.chart?.result?.[0]?.meta;
  if (!meta?.regularMarketPrice) throw new Error(`Yahoo: no price for ${symbol}`);
  const price     = meta.regularMarketPrice;
  const prevClose = meta.chartPreviousClose ?? meta.previousClose ?? price;
  const changePct = prevClose ? ((price - prevClose) / prevClose) * 100 : 0;
  return { price, changePct, currency: meta.currency ?? "USD" };
}


// ─────────────────────────────────────────────────────────────────────────────
// 1.  FII / DII  —  live from NSE API
//     GET /api/v1/kite/fii-dii
//
//  ROOT CAUSE OF PRODUCTION 500:
//  NSE's fiidiiTradeReact API actively blocks datacenter/VPS IPs (AWS, DO, etc.)
//  because they detect server-originated requests via IP reputation + missing
//  browser fingerprint. Localhost works because residential IPs are trusted.
//
//  FIX — 5-tier strategy:
//  TIER 0: moneycontrol.com public JSON  — no session, works from any IP ✅
//  TIER 1: NSE  (existing session)
//  TIER 2: NSE  (fresh session + different UA)
//  TIER 3: BSE  fallback (no session, but sometimes blocks VPS too)
//  TIER 4: Stale cache   — NEVER return 500 if we have any prior data
//  TIER 5: Static placeholder — return 200 with null values, not 500
// ─────────────────────────────────────────────────────────────────────────────
const _fiiDiiCache = { data: null, ts: 0 };

// ── TIER 0: MoneyControl public API — works from VPS/datacenter IPs ──────────
// ✅ FIX: Added multiple MC endpoint attempts + robust shape parsing
// MC sometimes returns HTML (blocked) or different JSON shapes
async function fetchFiiDiiFromMoneyControl() {
  const MC_ENDPOINTS = [
    "https://www.moneycontrol.com/stocks/marketstats/fii_dii_activity/index.php?type=json",
    "https://www.moneycontrol.com/get-data/fii-dii-activity.json",
  ];

  const MC_HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    "Accept":     "application/json, text/plain, */*",
    "Referer":    "https://www.moneycontrol.com/",
    "Origin":     "https://www.moneycontrol.com",
  };

  let raw = null;
  for (const url of MC_ENDPOINTS) {
    try {
      const r = await axios.get(url, { timeout: 10000, headers: MC_HEADERS });
      // Reject HTML responses (MC returns HTML when endpoint is blocked/moved)
      if (typeof r.data === "string" && r.data.trim().startsWith("<")) {
        console.warn("[FII-DII MC] Endpoint returned HTML (blocked):", url);
        continue;
      }
      raw = r.data;
      break;
    } catch (e) {
      console.warn("[FII-DII MC] Endpoint failed:", url, e.message);
    }
  }

  if (!raw) throw new Error("MC: all endpoints failed or returned HTML");

  const parse = (v) => parseFloat(String(v ?? "0").replace(/,/g, "")) || 0;

  // ── Shape A: array [ { category: "FII", buyValue, sellValue, netValue, date }, ... ]
  if (Array.isArray(raw)) {
    const fiiRow = raw.find((d) => /FII|FPI/i.test(d.category ?? d.Category ?? ""));
    const diiRow = raw.find((d) => /\bDII\b/i.test(d.category ?? d.Category ?? ""));
    if (!fiiRow && !diiRow) throw new Error("MC array: no FII/DII rows found");
    return {
      fii: fiiRow ? {
        buy:  parse(fiiRow.buyValue  ?? fiiRow.buy_value  ?? fiiRow.BuyValue  ?? fiiRow.Purchases),
        sell: parse(fiiRow.sellValue ?? fiiRow.sell_value ?? fiiRow.SellValue ?? fiiRow.Sales),
        net:  parse(fiiRow.netValue  ?? fiiRow.net_value  ?? fiiRow.NetValue  ?? fiiRow.Net),
        date: fiiRow.date ?? fiiRow.Date ?? fiiRow.tradeDate ?? null,
      } : null,
      dii: diiRow ? {
        buy:  parse(diiRow.buyValue  ?? diiRow.buy_value  ?? diiRow.BuyValue  ?? diiRow.Purchases),
        sell: parse(diiRow.sellValue ?? diiRow.sell_value ?? diiRow.SellValue ?? diiRow.Sales),
        net:  parse(diiRow.netValue  ?? diiRow.net_value  ?? diiRow.NetValue  ?? diiRow.Net),
        date: diiRow.date ?? diiRow.Date ?? diiRow.tradeDate ?? null,
      } : null,
      source: "MoneyControl",
    };
  }

  // ── Shape B: { FII: { buy, sell, net, date }, DII: {...} }
  const fii = raw?.FII ?? raw?.fii ?? raw?.["FII/FPI"] ?? raw?.fpi;
  const dii = raw?.DII ?? raw?.dii;
  if (fii || dii) {
    return {
      fii: fii ? {
        buy:  parse(fii.buy  ?? fii.buyValue  ?? fii.Purchases),
        sell: parse(fii.sell ?? fii.sellValue ?? fii.Sales),
        net:  parse(fii.net  ?? fii.netValue  ?? fii.Net),
        date: fii.date ?? null,
      } : null,
      dii: dii ? {
        buy:  parse(dii.buy  ?? dii.buyValue  ?? dii.Purchases),
        sell: parse(dii.sell ?? dii.sellValue ?? dii.Sales),
        net:  parse(dii.net  ?? dii.netValue  ?? dii.Net),
        date: dii.date ?? null,
      } : null,
      source: "MoneyControl",
    };
  }

  // ── Shape C: { data: [ ... ] } wrapper
  if (Array.isArray(raw?.data)) {
    const rows = raw.data;
    const fiiRow = rows.find(d => /FII|FPI/i.test(d.category ?? d.Category ?? ""));
    const diiRow = rows.find(d => /\bDII\b/i.test(d.category ?? d.Category ?? ""));
    if (fiiRow || diiRow) {
      return {
        fii: fiiRow ? { buy: parse(fiiRow.buyValue), sell: parse(fiiRow.sellValue), net: parse(fiiRow.netValue), date: fiiRow.date ?? null } : null,
        dii: diiRow ? { buy: parse(diiRow.buyValue), sell: parse(diiRow.sellValue), net: parse(diiRow.netValue), date: diiRow.date ?? null } : null,
        source: "MoneyControl",
      };
    }
  }

  throw new Error("MC: unexpected response shape — " + JSON.stringify(raw).slice(0, 120));
}

// ── Fallback: BSE also publishes FII/DII activity ──────────────────────────
async function fetchFiiDiiFromBse() {
  const today = new Date();
  const pad = n => String(n).padStart(2, "0");
  const fmt = d => `${d.getFullYear()}${pad(d.getMonth()+1)}${pad(d.getDate())}`;
  const toDate = fmt(today);
  const fromD = new Date(today); fromD.setDate(fromD.getDate() - 3);
  const fromDate = fmt(fromD);

  const r = await axios.get(
    `https://api.bseindia.com/BseIndiaAPI/api/FiidiiFY/w?dtFrom=${fromDate}&dtTo=${toDate}&Etype=0`,
    { timeout: 10000, headers: { "User-Agent": NSE_UA, Accept: "application/json",
        Referer: "https://www.bseindia.com/", Origin: "https://www.bseindia.com" } }
  );
  const rows = r.data?.Table ?? r.data?.data ?? r.data ?? [];
  if (!Array.isArray(rows) || rows.length === 0) throw new Error("BSE FII-DII: no data");

  const parse = (v) => parseFloat(String(v ?? "0").replace(/,/g, "")) || 0;
  const fiiRow = rows.find(d => /FII|FPI/i.test(d.CATEGORY ?? d.category ?? ""));
  const diiRow = rows.find(d => /\bDII\b/i.test(d.CATEGORY ?? d.category ?? ""));

  return {
    fii: { buy:  fiiRow ? parse(fiiRow.PURCHASES_VALUE  ?? fiiRow.buyValue)  : null,
           sell: fiiRow ? parse(fiiRow.SALES_VALUE       ?? fiiRow.sellValue) : null,
           net:  fiiRow ? parse(fiiRow.NET_INVESTMENT     ?? fiiRow.netValue)  : null,
           date: fiiRow?.DATE ?? fiiRow?.date ?? null },
    dii: { buy:  diiRow ? parse(diiRow.PURCHASES_VALUE  ?? diiRow.buyValue)  : null,
           sell: diiRow ? parse(diiRow.SALES_VALUE       ?? diiRow.sellValue) : null,
           net:  diiRow ? parse(diiRow.NET_INVESTMENT     ?? diiRow.netValue)  : null,
           date: diiRow?.DATE ?? diiRow?.date ?? null },
    source: "BSE",
  };
}

router.get("/fii-dii", async (req, res) => {
  // Serve cache if fresh (5 min)
  if (_fiiDiiCache.data && Date.now() - _fiiDiiCache.ts < 5 * 60 * 1000) {
    return res.json({ status: "success", data: _fiiDiiCache.data, cached: true });
  }

  const fetchFromNse = async (cookies) => {
    const ua = getUA();
    const r = await axios.get("https://www.nseindia.com/api/fiidiiTradeReact", {
      timeout: 12000,
      headers: {
        ...NSE_COMMON,
        "User-Agent":       ua,
        Accept:             "application/json, text/plain, */*",
        Referer:            "https://www.nseindia.com/market-data/institutional-trading",
        Cookie:             cookies,
        "sec-fetch-dest":   "empty",
        "sec-fetch-mode":   "cors",
        "sec-fetch-site":   "same-origin",
        "X-Requested-With": "XMLHttpRequest",
      },
    });
    const rows = Array.isArray(r.data) ? r.data : (r.data?.data ?? []);
    if (!rows.length) throw new Error("NSE FII-DII: empty response");
    const parse = (v) => parseFloat(String(v ?? "0").replace(/,/g, "")) || 0;
    const fiiRow = rows.find((d) => /FII|FPI/i.test(d.category));
    const diiRow = rows.find((d) => /\bDII\b/i.test(d.category));
    return {
      fii: { buy: fiiRow ? parse(fiiRow.buyValue)  : null,
             sell: fiiRow ? parse(fiiRow.sellValue) : null,
             net:  fiiRow ? parse(fiiRow.netValue)  : null,
             date: fiiRow?.date ?? null },
      dii: { buy: diiRow ? parse(diiRow.buyValue)  : null,
             sell: diiRow ? parse(diiRow.sellValue) : null,
             net:  diiRow ? parse(diiRow.netValue)  : null,
             date: diiRow?.date ?? null },
      source: "NSE",
    };
  };

  async function fetchFiiDiiFromBsePublic() {
    const today = new Date();
    const dd = String(today.getDate()).padStart(2,'0');
    const mm = String(today.getMonth()+1).padStart(2,'0');
    const yyyy = today.getFullYear();
    const r = await axios.get(
      `https://www.bseindia.com/markets/equity/EQReports/fii_dii_data.aspx`,
      { timeout: 10000, headers: { 
        "User-Agent": NSE_UA, 
        "Referer": "https://www.bseindia.com/",
        "Accept": "text/html,*/*"
      }}
    );
    // Parse response... (BSE HTML page, requires parsing)
  }
  // ── TIER 0: MoneyControl — VPS-friendly, no IP blocking ────────────────────
  try {
    const data = await fetchFiiDiiFromMoneyControl();
    _fiiDiiCache.data = data;
    _fiiDiiCache.ts   = Date.now();
    console.log("[FII-DII] ✅ MoneyControl success (VPS-safe)");
    return res.json({ status: "success", data });
  } catch (err0) {
    console.warn("[FII-DII] MoneyControl failed:", err0.message, "— trying NSE direct");
  }

  // ── TIER 1: NSE (attempt 1 with existing session) ──────────────────────────
  try {
    const cookies = await getNseSession();
    const data    = await fetchFromNse(cookies);
    _fiiDiiCache.data = data;
    _fiiDiiCache.ts   = Date.now();
    console.log("[FII-DII] ✅ NSE success");
    return res.json({ status: "success", data });
  } catch (err) {
    console.warn("[FII-DII] Attempt 1 (NSE) failed:", err.message);
  }

  // ── TIER 2: NSE (attempt 2 with fresh session — different UA) ──────────────
  try {
    _nseSession.cookies = "";
    _nseSession.ts      = 0;
    await new Promise((r) => setTimeout(r, 1500));
    const fresh = await getNseSession(true);
    await new Promise((r) => setTimeout(r, 1000));
    const data = await fetchFromNse(fresh);
    _fiiDiiCache.data = data;
    _fiiDiiCache.ts   = Date.now();
    console.log("[FII-DII] ✅ NSE fresh session success");
    return res.json({ status: "success", data });
  } catch (err2) {
    console.warn("[FII-DII] Attempt 2 (NSE fresh session) failed:", err2.message);
  }

  // ── TIER 3: BSE fallback ────────────────────────────────────────────────────
  try {
    const data = await fetchFiiDiiFromBse();
    _fiiDiiCache.data = data;
    _fiiDiiCache.ts   = Date.now();
    console.log("[FII-DII] ✅ BSE fallback success");
    return res.json({ status: "success", data });
  } catch (err3) {
    console.warn("[FII-DII] BSE fallback failed:", err3.message);
  }

  // ── TIER 4: Stale cache — serve old data rather than 500 ───────────────────
  if (_fiiDiiCache.data) {
    const staleAge = Math.round((Date.now() - _fiiDiiCache.ts) / 60000);
    console.warn(`[FII-DII] All live sources failed — serving stale cache (${staleAge} min old)`);
    return res.json({ status: "success", data: _fiiDiiCache.data, stale: true, staleMinutes: staleAge });
  }

  // ── TIER 5: Static placeholder — NEVER return 500 to frontend ──────────────
  console.error("[FII-DII] ❌ All tiers failed — returning null placeholder (no 500)");
  return res.json({
    status: "success",
    data: {
      fii: { buy: null, sell: null, net: null, date: null },
      dii: { buy: null, sell: null, net: null, date: null },
      source: "unavailable",
    },
    unavailable: true,
    message: "FII-DII data temporarily unavailable. NSE/BSE block VPS IPs intermittently. Will auto-recover.",
  });
});


// ─────────────────────────────────────────────────────────────────────────────
// 2.  GIFT NIFTY  —  Kite NSE_IFSC first,  Yahoo Finance fallback
//     GET /api/v1/kite/gift-nifty
//
// Primary:  Kite /quote for NSE_IFSC near-month NIFTY futures
// Fallback: Yahoo ^NSEI  (Nifty 50 spot — best publicly available proxy)
// ─────────────────────────────────────────────────────────────────────────────
const _giftMeta  = { symbol: null, ts: 0 };
const _giftCache = { data: null,   ts: 0 };

async function resolveGiftNiftySymbol() {
  const FOUR_H = 4 * 60 * 60 * 1000;
  if (_giftMeta.symbol && Date.now() - _giftMeta.ts < FOUR_H) return _giftMeta.symbol;

  console.log("[GIFT NIFTY] Fetching NSE_IFSC instrument list…");
  const r     = await axios.get("https://api.kite.trade/instruments/NSE_IFSC", {
    headers: headers(), timeout: 15000, responseType: "text",
  });
  const today = new Date().toISOString().split("T")[0];
  const lines = r.data.split("\n");
  const hdrs  = lines[0].split(",").map((h) => h.trim());
  const col   = (row, name) => row[hdrs.indexOf(name)]?.trim() ?? "";

  const contracts = lines
    .slice(1).filter((l) => l.trim())
    .map((l) => {
      const p = l.split(",");
      return { symbol: col(p, "tradingsymbol"), expiry: col(p, "expiry"), type: col(p, "instrument_type") };
    })
    .filter((c) => c.type === "FUT" && /^NIFTY[^A-Z]/i.test(c.symbol) && c.expiry >= today)
    .sort((a, b) => a.expiry.localeCompare(b.expiry));

  if (!contracts.length) throw new Error("No active GIFT NIFTY contracts on NSE_IFSC");
  console.log(`[GIFT NIFTY] Resolved → ${contracts[0].symbol} (expiry: ${contracts[0].expiry})`);
  _giftMeta.symbol = contracts[0].symbol;
  _giftMeta.ts     = Date.now();
  return _giftMeta.symbol;
}

router.get("/gift-nifty", async (req, res) => {
  // 30-second cache
  if (_giftCache.data && Date.now() - _giftCache.ts < 30 * 1000) {
    return res.json({ status: "success", data: _giftCache.data, cached: true });
  }

  // ── Try Kite NSE_IFSC first ───────────────────────────────────────────────
  try {
    const sym        = await resolveGiftNiftySymbol();
    const kiteSymbol = `NSE_IFSC:${sym}`;
    const r          = await axios.get(
      `https://api.kite.trade/quote?i=${encodeURIComponent(kiteSymbol)}`,
      { headers: headers(), timeout: 8000 }
    );
    const q = r.data?.data?.[kiteSymbol];
    if (!q) throw new Error(`No data for ${kiteSymbol} — plan may not include NSE_IFSC`);

    const lastPrice = q.last_price;
    const prevClose = q.ohlc?.close ?? null;
    const changePct = q.change != null ? q.change
      : (lastPrice && prevClose ? ((lastPrice - prevClose) / prevClose) * 100 : null);

    const data = { symbol: sym, last_price: lastPrice, change_percent: changePct, ohlc: q.ohlc, source: "kite" };
    _giftCache.data = data;
    _giftCache.ts   = Date.now();
    return res.json({ status: "success", data });

  } catch (kiteErr) {
    // 403 = not subscribed to NSE_IFSC; any other error → try Yahoo
    console.warn(`[GIFT NIFTY] Kite failed (${kiteErr.message}) — falling back to Yahoo ^NSEI`);
    _giftMeta.symbol = null; // force re-resolve next time

    try {
      const { price, changePct } = await fetchYahooSymbol("^NSEI");
      const data = {
        symbol:         "NIFTY 50 (Yahoo proxy)",
        last_price:     price,
        change_percent: changePct,
        source:         "yahoo",
      };
      _giftCache.data = data;
      _giftCache.ts   = Date.now();
      return res.json({ status: "success", data });
    } catch (yahooErr) {
      console.error("[GIFT NIFTY] Yahoo fallback also failed:", yahooErr.message);
      if (_giftCache.data) {
        return res.json({ status: "success", data: _giftCache.data, stale: true });
      }
      return res.status(500).json({ status: "error", message: yahooErr.message });
    }
  }
});


// ─────────────────────────────────────────────────────────────────────────────
// 3.  COMMODITIES  —  Gold & Silver  —  3-tier priority
//     GET /api/v1/kite/commodities
//
//  Priority 1:  kiteWS.getMCXTicks()  — WebSocket, always real-time (sub-second)
//               Gold tick key  = "MCX:GOLD",  price is natively ₹/10g
//               Silver tick key = "MCX:SILVER", price is natively ₹/kg
//
//  Priority 2:  Kite REST /quote for MCX near-month futures  (60-second cache)
//               Uses tradingsymbol prefix filter + excludes MINI/PETAL/GUINEA/TEN
//               Percentage change = q.net_change (NOT q.change — that's absolute)
//
//  Fallback:    Yahoo Finance GC=F + SI=F with live USDINR=X
//               Gold:   (GC=F ÷ 31.1035) × 10 × USDINR × GOLD_DUTY  → ₹/10g
//               Silver: SI=F × 32.1507   × USDINR × SILVER_DUTY       → ₹/kg
//               Duty factors: Gold ~18% (15% customs + 3% GST)
//                             Silver ~13% (10% customs + 3% GST)
// ─────────────────────────────────────────────────────────────────────────────

// Indian import duty factors (MCX prices include these; Yahoo prices don't)
const GOLD_DUTY_FACTOR   = 1.18;  // 15% customs + 3% GST (approx)
const SILVER_DUTY_FACTOR = 1.13;  // 10% customs + 3% GST (approx)

const _mcxMeta  = { gold: null, silver: null, ts: 0 };
const _mcxCache = { data: null, ts: 0 };

async function resolveMcxSymbols() {
  const FOUR_H = 4 * 60 * 60 * 1000;
  if (_mcxMeta.gold && _mcxMeta.silver && Date.now() - _mcxMeta.ts < FOUR_H) {
    return { gold: _mcxMeta.gold, silver: _mcxMeta.silver };
  }

  console.log("[MCX] Fetching MCX instrument list…");
  const r     = await axios.get("https://api.kite.trade/instruments/MCX", {
    headers: headers(), timeout: 15000, responseType: "text",
  });
  const today = new Date().toISOString().split("T")[0];
  const lines = r.data.split("\n");
  const hdrs  = lines[0].split(",").map((h) => h.trim());
  const col   = (row, name) => row[hdrs.indexOf(name)]?.trim() ?? "";

  const parsed = lines.slice(1).filter((l) => l.trim()).map((l) => {
    const p = l.split(",");
    return {
      symbol:  col(p, "tradingsymbol"),
      name:    col(p, "name").toUpperCase(),
      expiry:  col(p, "expiry"),
      type:    col(p, "instrument_type"),
    };
  }).filter((c) => c.type === "FUT" && c.expiry >= today);

  // ── Gold: match tradingsymbol starting with "GOLD" but exclude variants ──
  // GOLDM = mini (100g), GOLDPETAL (1g), GOLDGUINEA (8g), GOLDTENTH/TEN (10g)
  // Standard GOLD (1kg lot) is quoted in ₹/10g — this is what we want
  const goldContracts = parsed
    .filter((c) =>
      c.symbol.startsWith("GOLD") &&
      !c.symbol.startsWith("GOLDM")       &&   // Mini
      !c.symbol.includes("PETAL")         &&   // Petal
      !c.symbol.includes("GUINEA")        &&   // Guinea
      !c.symbol.includes("TEN")           &&   // TEN
      !c.symbol.includes("MICRO")
    )
    .sort((a, b) => a.expiry.localeCompare(b.expiry));

  // ── Silver: match tradingsymbol starting with "SILVER" but exclude SILVERM (mini) ──
  const silverContracts = parsed
    .filter((c) =>
      c.symbol.startsWith("SILVER") &&
      !c.symbol.startsWith("SILVERM")     &&   // Mini
      !c.symbol.includes("MICRO")
    )
    .sort((a, b) => a.expiry.localeCompare(b.expiry));

  if (!goldContracts.length || !silverContracts.length) {
    throw new Error("MCX GOLD or SILVER standard contracts not found");
  }

  _mcxMeta.gold   = goldContracts[0].symbol;
  _mcxMeta.silver = silverContracts[0].symbol;
  _mcxMeta.ts     = Date.now();
  console.log(`[MCX] Gold → ${_mcxMeta.gold} | Silver → ${_mcxMeta.silver}`);
  return { gold: _mcxMeta.gold, silver: _mcxMeta.silver };
}

// ── Yahoo fallback — with import duty factors so price matches MCX reality ──
async function commoditiesFromYahoo() {
  console.log("[MCX] Falling back to Yahoo Finance (GC=F, SI=F, USDINR=X)…");

  const [goldRes, silverRes, fxRes] = await Promise.allSettled([
    fetchYahooSymbol("GC=F"),
    fetchYahooSymbol("SI=F"),
    fetchYahooSymbol("USDINR=X"),
  ]);

  const gold   = goldRes.status   === "fulfilled" ? goldRes.value   : null;
  const silver = silverRes.status === "fulfilled" ? silverRes.value : null;
  const fx     = fxRes.status     === "fulfilled" ? fxRes.value     : null;
  const usdInr = fx?.price ?? 86;

  // GC=F: USD/troy-oz → ₹/10g (MCX standard, including duty premium)
  // Formula: (price_usd / 31.1035g_per_oz) × 10g × USDINR × duty_factor
  const goldPer10g = gold?.price
    ? Math.round((gold.price / 31.1035) * 10 * usdInr * GOLD_DUTY_FACTOR)
    : null;

  // SI=F: USD/troy-oz → ₹/kg (MCX standard, including duty premium)
  // Formula: price_usd × 32.1507oz_per_kg × USDINR × duty_factor
  const silverPerKg = silver?.price
    ? Math.round(silver.price * 32.1507 * usdInr * SILVER_DUTY_FACTOR)
    : null;

  return {
    gold: goldPer10g != null ? {
      symbol:         "GC=F",
      price_per_10g:  goldPer10g,
      change_percent: gold?.changePct ?? null,
      source:         "yahoo",
      note:           "International price converted to INR with duty estimate",
    } : null,
    silver: silverPerKg != null ? {
      symbol:         "SI=F",
      price_per_kg:   silverPerKg,
      change_percent: silver?.changePct ?? null,
      source:         "yahoo",
      note:           "International price converted to INR with duty estimate",
    } : null,
  };
}

router.get("/commodities", async (req, res) => {
  const CACHE_TTL = 15 * 1000; // 15-second cache — WebSocket is primary anyway

  if (_mcxCache.data && Date.now() - _mcxCache.ts < CACHE_TTL) {
    return res.json({ status: "success", data: _mcxCache.data, cached: true });
  }

  // ═══════════════════════════════════════════════════════════════════
  // PRIORITY 1: kiteWS WebSocket ticks (real-time, already subscribed)
  // ═══════════════════════════════════════════════════════════════════
  const wsTicks = kiteWS.getMCXTicks();
  const wsGold   = wsTicks["MCX:GOLD"];
  const wsSilver = wsTicks["MCX:SILVER"];

  if (wsGold?.last_price > 0 && wsSilver?.last_price > 0) {
    const wsAge = Math.max(
      Date.now() - (wsGold.ts   ?? 0),
      Date.now() - (wsSilver.ts ?? 0)
    );

    // Only use WebSocket if data is fresh (under 5 minutes)
    if (wsAge < 5 * 60 * 1000) {
      const prevGold   = wsGold.ohlc?.close   ?? wsGold.last_price;
      const prevSilver = wsSilver.ohlc?.close ?? wsSilver.last_price;

      const result = {
        gold: {
          symbol:         wsGold.symbol ?? "MCX:GOLD",
          price_per_10g:  Math.round(wsGold.last_price),
          change_percent: wsGold.change != null && wsGold.change !== 0
            ? +wsGold.change.toFixed(2)
            : prevGold > 0
              ? +(((wsGold.last_price - prevGold) / prevGold) * 100).toFixed(2)
              : null,
          ohlc:   wsGold.ohlc ?? null,
          oi:     wsGold.oi   ?? 0,
          source: "kite-ws",
        },
        silver: {
          symbol:         wsSilver.symbol ?? "MCX:SILVER",
          price_per_kg:   Math.round(wsSilver.last_price),
          change_percent: wsSilver.change != null && wsSilver.change !== 0
            ? +wsSilver.change.toFixed(2)
            : prevSilver > 0
              ? +(((wsSilver.last_price - prevSilver) / prevSilver) * 100).toFixed(2)
              : null,
          ohlc:   wsSilver.ohlc ?? null,
          oi:     wsSilver.oi   ?? 0,
          source: "kite-ws",
        },
      };

      _mcxCache.data = result;
      _mcxCache.ts   = Date.now();
      console.log(`[MCX] WebSocket: Gold ₹${result.gold.price_per_10g}/10g | Silver ₹${result.silver.price_per_kg}/kg`);
      return res.json({ status: "success", data: result });
    }
    console.warn(`[MCX] WebSocket data is stale (${Math.round(wsAge / 1000)}s) — trying REST`);
  }

  // ═══════════════════════════════════════════════════════════════════
  // PRIORITY 2: Kite REST API /quote (reliable but needs token)
  // ═══════════════════════════════════════════════════════════════════
  try {
    const { gold: goldSym, silver: silverSym } = await resolveMcxSymbols();
    const kiteGold   = `MCX:${goldSym}`;
    const kiteSilver = `MCX:${silverSym}`;

    const r   = await axios.get(
      `https://api.kite.trade/quote?${symQS([kiteGold, kiteSilver])}`,
      { headers: headers(), timeout: 8000 }
    );
    const raw = r.data?.data ?? {};

    if (!raw[kiteGold] && !raw[kiteSilver]) {
      throw new Error("Kite returned no MCX quote data — MCX segment may not be in plan");
    }

    const extract = (sym) => {
      const q = raw[sym];
      if (!q) return null;
      const price     = q.last_price;
      const prevClose = q.ohlc?.close ?? null;
      // Kite REST: use net_change (%) first, fallback to manual calc from ohlc.close
      const changePct = q.net_change != null
        ? q.net_change
        : (price && prevClose ? ((price - prevClose) / prevClose) * 100 : null);
      return {
        price,
        change_percent: changePct != null ? +changePct.toFixed(2) : null,
        ohlc:           q.ohlc ?? null,
        oi:             q.oi   ?? 0,
      };
    };

    const goldData   = extract(kiteGold);
    const silverData = extract(kiteSilver);

    let result = {
      gold: goldData ? {
        symbol:         goldSym,
        price_per_10g:  Math.round(goldData.price),   // MCX: natively ₹/10g
        change_percent: goldData.change_percent,
        ohlc:           goldData.ohlc,
        oi:             goldData.oi,
        source:         "kite-rest",
      } : null,
      silver: silverData ? {
        symbol:         silverSym,
        price_per_kg:   Math.round(silverData.price), // MCX: natively ₹/kg
        change_percent: silverData.change_percent,
        ohlc:           silverData.ohlc,
        oi:             silverData.oi,
        source:         "kite-rest",
      } : null,
    };

    // If one metal is missing, fill from Yahoo
    if (!result.gold || !result.silver) {
      console.warn("[MCX] Partial Kite data — filling gaps with Yahoo");
      const yahoo = await commoditiesFromYahoo().catch(() => ({}));
      if (!result.gold   && yahoo.gold)   result.gold   = yahoo.gold;
      if (!result.silver && yahoo.silver) result.silver = yahoo.silver;
    }

    _mcxCache.data = result;
    _mcxCache.ts   = Date.now();
    console.log(`[MCX] REST: Gold ₹${result.gold?.price_per_10g}/10g | Silver ₹${result.silver?.price_per_kg}/kg (${goldSym} / ${silverSym})`);
    return res.json({ status: "success", data: result });

  } catch (kiteErr) {
    // 403 / no MCX access / token expired → full Yahoo fallback
    console.warn(`[MCX Commodities] Kite failed (${kiteErr.message}) — using Yahoo Finance`);
    _mcxMeta.gold   = null;
    _mcxMeta.silver = null;

    try {
      const data = await commoditiesFromYahoo();
      if (!data.gold && !data.silver) throw new Error("Yahoo returned no data");
      _mcxCache.data = data;
      _mcxCache.ts   = Date.now();
      console.log(`[MCX] Yahoo: Gold ₹${data.gold?.price_per_10g}/10g | Silver ₹${data.silver?.price_per_kg}/kg`);
      return res.json({ status: "success", data });
    } catch (yahooErr) {
      console.error("[MCX Commodities] Yahoo fallback also failed:", yahooErr.message);
      if (_mcxCache.data) {
        return res.json({ status: "success", data: _mcxCache.data, stale: true });
      }
      return res.status(500).json({ status: "error", message: yahooErr.message });
    }
  }
});


// ─────────────────────────────────────────────────────────────────────────────
// INDIA VIX
// GET /api/v1/kite/vix
// Priority: WebSocket tick → Kite REST → null (never fake data)
// ─────────────────────────────────────────────────────────────────────────────
router.get("/vix", async (req, res) => {
  // 1. WebSocket (real-time, already subscribed to token 264969)
  const tick = kiteWS.getVixTick?.() ?? kiteWS.getLastTicks()["NSE:INDIA VIX"];
  if (tick?.last_price > 0) {
    const prevClose = tick.ohlc?.close ?? tick.last_price;
    return res.json({
      status: "success",
      data: {
        last_price: tick.last_price,
        change_pct: prevClose > 0 ? ((tick.last_price - prevClose) / prevClose) * 100 : 0,
        change_abs: tick.change ?? (tick.last_price - prevClose),
        ohlc:       tick.ohlc ?? null,
        source:     "kite-ws",
      },
    });
  }

  // 2. Kite REST fallback
  try {
    const r = await axios.get(
      `https://api.kite.trade/quote?i=${encodeURIComponent("NSE:INDIA VIX")}`,
      { headers: headers(), timeout: 8000 }
    );
    const q = r.data?.data?.["NSE:INDIA VIX"];
    if (q?.last_price > 0) {
      const prevClose = q.ohlc?.close ?? q.last_price;
      return res.json({
        status: "success",
        data: {
          last_price: q.last_price,
          change_pct: prevClose > 0 ? ((q.last_price - prevClose) / prevClose) * 100 : 0,
          change_abs: q.net_change ?? (q.last_price - prevClose),
          ohlc:       q.ohlc ?? null,
          source:     "kite-rest",
        },
      });
    }
  } catch (e) {
    console.warn("[VIX] Kite REST failed:", e.message);
  }

  // 3. Not available — return null shape (no fake data)
  return res.json({ status: "success", data: null });
});


// ─────────────────────────────────────────────────────────────────────────────
// MARKET BREADTH — Advance / Decline / Unchanged + 52-week H/L counts
// GET /api/v1/kite/market-breadth
//
// Source: NSE /api/allIndices → A/D for NIFTY 500 (powers nseindia.com/market-data/advance)
// 52W H/L: NSE /api/equity-stockIndices?index=NIFTY%20500
// Cache: 60 seconds
// ─────────────────────────────────────────────────────────────────────────────
const _breadthCache = { data: null, ts: 0 };

async function fetchMarketBreadth(cookies) {
  // NSE allIndices — powers the /market-data/advance page
  const r1 = await axios.get("https://www.nseindia.com/api/allIndices", {
    timeout: 12000,
    headers: nseApiHeaders(cookies, "https://www.nseindia.com/market-data/live-equity-market"),
  });

  // ✅ FIX: Use extractNseRows which handles { data: [...] } or { data: { NIFTY: [...] } }
  const indicesRaw = r1.data;
  // allIndices always returns { data: [ ...index objects... ] }
  const indices = Array.isArray(indicesRaw?.data)
    ? indicesRaw.data
    : extractNseRows(indicesRaw);

  // Prefer NIFTY 500 (most stocks), fall back to NIFTY 50, then first available
  const nifty500 = indices.find(i =>
    /NIFTY\s*500/i.test(i.indexSymbol ?? i.key ?? i.index ?? "")
  );
  const nifty50 = indices.find(i =>
    /^NIFTY\s*50$/i.test(i.indexSymbol ?? i.key ?? i.index ?? "")
  );
  const src = nifty500 ?? nifty50 ?? indices[0];

  const advances  = src?.advances  ?? src?.advances_count  ?? null;
  const declines  = src?.declines  ?? src?.declines_count  ?? null;
  const unchanged = src?.unchanged ?? src?.unchanged_count ?? null;
  const total     = (Number(advances) || 0) + (Number(declines) || 0) + (Number(unchanged) || 0);
  const adRatio   = advances && declines
    ? (Number(advances) / Number(declines)).toFixed(2)
    : null;

  // 52-week H/L counts from NIFTY 500 equity-stockIndices endpoint
  let hh52 = null, ll52 = null;
  try {
    const r2 = await axios.get(
      "https://www.nseindia.com/api/equity-stockIndices?index=NIFTY%20500",
      {
        timeout: 12000,
        headers: nseApiHeaders(cookies, "https://www.nseindia.com/market-data/live-equity-market"),
      }
    );
    // ✅ FIX: Use extractNseRows for robust parsing
    const stocks = Array.isArray(r2.data?.data) ? r2.data.data : extractNseRows(r2.data);
    // Filter out the index summary row itself
    const equities = stocks.filter(s =>
      s.symbol && s.symbol !== "NIFTY 500" && (s.series === "EQ" || s.priority === 1)
    );
    hh52 = equities.filter(s => {
      if (s.nearWKH) return true;
      const ltp = s.lastPrice ?? s.last_price ?? 0;
      const hi  = s.yearHigh  ?? s.year_high  ?? 0;
      return hi > 0 && ltp >= hi * 0.99;
    }).length || null;
    ll52 = equities.filter(s => {
      if (s.nearWKL) return true;
      const ltp = s.lastPrice ?? s.last_price ?? 0;
      const lo  = s.yearLow   ?? s.year_low   ?? 0;
      return lo > 0 && ltp <= lo * 1.01;
    }).length || null;
  } catch (e) {
    console.warn("[Breadth] 52-week count failed:", e.message);
  }

  return {
    advances:  advances  != null ? Number(advances)  : null,
    declines:  declines  != null ? Number(declines)  : null,
    unchanged: unchanged != null ? Number(unchanged) : null,
    total:     total > 0 ? total : null,
    ad_ratio:  adRatio,
    high_52w:  hh52,
    low_52w:   ll52,
    index:     src?.indexSymbol ?? src?.index ?? "NIFTY 500",
    source:    "NSE",
  };
}

router.get("/market-breadth", async (req, res) => {
  if (_breadthCache.data && Date.now() - _breadthCache.ts < 60_000) {
    return res.json({ status: "success", data: _breadthCache.data, cached: true });
  }

  try {
    const cookies = await getNseSession();
    const data    = await fetchMarketBreadth(cookies);
    _breadthCache.data = data;
    _breadthCache.ts   = Date.now();
    return res.json({ status: "success", data });
  } catch (err) {
    console.warn("[Breadth] Attempt 1 failed:", err.message);
    try {
      _nseSession.cookies = ""; _nseSession.ts = 0;
      const fresh = await getNseSession(true);
      const data  = await fetchMarketBreadth(fresh);
      _breadthCache.data = data;
      _breadthCache.ts   = Date.now();
      return res.json({ status: "success", data });
    } catch (err2) {
      console.warn("[Breadth] Attempt 2 failed:", err2.message);
      if (_breadthCache.data) {
        return res.json({ status: "success", data: _breadthCache.data, stale: true });
      }
      return res.json({
        status: "success",
        data: { advances: null, declines: null, unchanged: null, total: null, ad_ratio: null, high_52w: null, low_52w: null, source: "unavailable" },
        unavailable: true,
      });
    }
  }
});


// ─────────────────────────────────────────────────────────────────────────────
// TOP GAINERS & LOSERS  (Cash Market)
// GET /api/v1/kite/gainers-losers
// Source: NSE /api/live-analysis-variations (powers nseindia.com/market-data/advance page)
// Cache: 60 seconds
// ─────────────────────────────────────────────────────────────────────────────
const _gainersCache = { data: null, ts: 0 };

// async function fetchGainersLosers(cookies) {
//   const [gRes, lRes] = await Promise.allSettled([
//     axios.get("https://www.nseindia.com/api/live-analysis-variations?index=gainers", {
//       timeout: 12000,
//       headers: nseApiHeaders(cookies, "https://www.nseindia.com/market-data/top-gainers-losers"),
//     }),
//     axios.get("https://www.nseindia.com/api/live-analysis-variations?index=loosers", {
//       timeout: 12000,
//       headers: nseApiHeaders(cookies, "https://www.nseindia.com/market-data/top-gainers-losers"),
//     }),
//   ]);

//   // ✅ FIX: extractNseRows handles all NSE response shapes
//   // Previously: raw?.data ?? raw?.NIFTY ?? array — fails when data is { NIFTY: [...] }
//   const parseRows = (res) => {
//     if (res.status !== "fulfilled") return [];
//     const raw  = res.value?.data;
//     const rows = extractNseRows(raw);
//     return rows.slice(0, 20).map(r => ({
//       symbol:     r.symbol      ?? r.stock      ?? "",
//       last_price: parseFloat(r.lastPrice   ?? r.ltp      ?? "0") || 0,
//       change_pct: parseFloat(r.pChange     ?? r.changePct ?? r.perChange ?? "0") || 0,
//       change_abs: parseFloat(r.change      ?? r.netChange  ?? "0") || 0,
//       volume:     parseInt(r.totalTradedVolume ?? r.volume ?? "0", 10) || 0,
//     })).filter(r => r.symbol && r.last_price > 0);
//   };

//   return {
//     gainers: parseRows(gRes),
//     losers:  parseRows(lRes),
//     source:  "NSE",
//   };
// }
async function fetchGainersLosers(cookies) {
  const [gRes, lRes] = await Promise.allSettled([
    axios.get("https://www.nseindia.com/api/live-analysis-variations?index=gainers", {
      timeout: 12000,
      headers: nseApiHeaders(cookies, "https://www.nseindia.com/market-data/top-gainers-losers"),
    }),
    axios.get("https://www.nseindia.com/api/live-analysis-variations?index=loosers", {
      timeout: 12000,
      headers: nseApiHeaders(cookies, "https://www.nseindia.com/market-data/top-gainers-losers"),
    }),
  ]);

  const parseRows = (res) => {
    if (res.status !== "fulfilled") return [];
    const raw  = res.value?.data;
    const rows = extractNseRows(raw);
    return rows.slice(0, 20).map(r => ({
      symbol:     r.symbol      ?? r.stock      ?? "",
      last_price: parseFloat(r.lastPrice   ?? r.ltp       ?? "0") || 0,
      change_pct: parseFloat(r.pChange     ?? r.changePct ?? r.perChange ?? "0") || 0,
      change_abs: parseFloat(r.change      ?? r.netChange  ?? "0") || 0,
      volume:     parseInt(r.totalTradedVolume ?? r.volume ?? "0", 10) || 0,
    }))
    // ✅ FIX: Don't filter on last_price > 0 — use change_pct threshold instead
    // NSE sends 0.00 prices in after-hours; symbol presence is enough
    .filter(r => r.symbol && (r.last_price > 0 || Math.abs(r.change_pct) > 0));
  };

  let gainers = parseRows(gRes);
  let losers  = parseRows(lRes);

  // ✅ NEW: If both empty (market closed / IP blocked), fall back to
  // equity-stockIndices which has prev-session data sorted by pChange
  if (gainers.length === 0 && losers.length === 0) {
    console.warn("[Gainers-Losers] live-analysis-variations returned empty — using NIFTY 500 fallback");
    const fallback = await axios.get(
      "https://www.nseindia.com/api/equity-stockIndices?index=NIFTY%20500",
      { timeout: 12000, headers: nseApiHeaders(cookies, "https://www.nseindia.com/market-data/live-equity-market") }
    );
    const allStocks = extractNseRows(fallback.data)
      .filter(s => s.symbol && s.symbol !== "NIFTY 500" && (s.series === "EQ" || s.priority === 1))
      .map(r => ({
        symbol:     r.symbol,
        last_price: parseFloat(r.lastPrice ?? "0") || 0,
        change_pct: parseFloat(r.pChange   ?? "0") || 0,
        change_abs: parseFloat(r.change    ?? "0") || 0,
        volume:     parseInt(r.totalTradedVolume ?? "0", 10) || 0,
      }))
      .filter(r => r.last_price > 0);

    const sorted = [...allStocks].sort((a, b) => b.change_pct - a.change_pct);
    gainers = sorted.filter(r => r.change_pct > 0).slice(0, 20);
    losers  = sorted.filter(r => r.change_pct < 0).reverse().slice(0, 20);
  }

  return { gainers, losers, source: "NSE" };
}

router.get("/gainers-losers", async (req, res) => {
  if (_gainersCache.data && Date.now() - _gainersCache.ts < 60_000) {
    return res.json({ status: "success", data: _gainersCache.data, cached: true });
  }

  try {
    const cookies = await getNseSession();
    const data    = await fetchGainersLosers(cookies);
    // Only throw if the fallback also produced nothing — let partial results through
if (!data.gainers && !data.losers) throw new Error("Empty response after extraction");
    _gainersCache.ts   = Date.now();
    console.log(`[Gainers-Losers] ✅ NSE: ${data.gainers.length} gainers, ${data.losers.length} losers`);
    return res.json({ status: "success", data });
  } catch (err) {
    console.warn("[Gainers-Losers] Attempt 1 failed:", err.message);
    try {
      _nseSession.cookies = ""; _nseSession.ts = 0;
      const fresh = await getNseSession(true);
      const data  = await fetchGainersLosers(fresh);
      _gainersCache.data = data;
      _gainersCache.ts   = Date.now();
      console.log(`[Gainers-Losers] ✅ NSE (fresh session): ${data.gainers.length} gainers`);
      return res.json({ status: "success", data });
    } catch (err2) {
      console.warn("[Gainers-Losers] Attempt 2 failed:", err2.message);
      if (_gainersCache.data) return res.json({ status: "success", data: _gainersCache.data, stale: true });
      return res.json({ status: "success", data: { gainers: [], losers: [], source: "unavailable" }, unavailable: true });
    }
  }
});


// ─────────────────────────────────────────────────────────────────────────────
// MOST ACTIVE STOCKS  (by Volume + by Value)
// GET /api/v1/kite/most-active
//
// Primary:  NSE /api/live-analysis-volume
// Fallback: NSE /api/equity-stockIndices?index=NIFTY%20500 sorted by volume
//           (used when primary returns 404 — NSE sometimes changes endpoints)
// Cache: 60 seconds
// ─────────────────────────────────────────────────────────────────────────────
const _activeCache = { data: null, ts: 0 };

async function fetchMostActive(cookies) {
  let raw = null;

  // ✅ FIX: Primary endpoint with 404 fallback
  try {
    const r = await axios.get("https://www.nseindia.com/api/live-analysis-volume", {
      timeout: 12000,
      headers: nseApiHeaders(cookies, "https://www.nseindia.com/market-data/most-active-securities"),
    });
    raw = r.data;
  } catch (e) {
    if (e?.response?.status === 404 || e?.response?.status === 403) {
      // ✅ FIX FALLBACK: Use NIFTY 500 index stocks and sort by volume
      console.warn(`[MostActive] Primary endpoint failed (${e.response?.status}) — using NIFTY 500 fallback`);
      const r2 = await axios.get(
        "https://www.nseindia.com/api/equity-stockIndices?index=NIFTY%20500",
        {
          timeout: 12000,
          headers: nseApiHeaders(cookies, "https://www.nseindia.com/market-data/live-equity-market"),
        }
      );
      raw = r2.data;
    } else {
      throw e;
    }
  }

  // ✅ FIX: extractNseRows handles all NSE response shapes
  const rows = extractNseRows(raw);

  const byVolume = rows
    .map(r => ({
      symbol:     r.symbol     ?? r.stock    ?? "",
      last_price: parseFloat(r.lastPrice   ?? r.ltp      ?? "0") || 0,
      change_pct: parseFloat(r.pChange     ?? r.changePct ?? "0") || 0,
      volume:     parseInt(r.totalTradedVolume ?? r.totalTradedVol ?? r.volume ?? "0", 10) || 0,
      value:      parseFloat(r.totalTradedValue ?? r.totalTradedVal ?? r.turnover ?? "0") || 0,
    }))
    .filter(r => r.symbol && r.volume > 0)
    .sort((a, b) => b.volume - a.volume)
    .slice(0, 20);

  // By value: sort the same set by value descending
  const byValue = [...byVolume]
    .sort((a, b) => b.value - a.value)
    .slice(0, 20);

  return { by_volume: byVolume, by_value: byValue, source: "NSE" };
}

router.get("/most-active", async (req, res) => {
  if (_activeCache.data && Date.now() - _activeCache.ts < 60_000) {
    return res.json({ status: "success", data: _activeCache.data, cached: true });
  }

  try {
    const cookies = await getNseSession();
    const data    = await fetchMostActive(cookies);
    _activeCache.data = data;
    _activeCache.ts   = Date.now();
    console.log(`[MostActive] ✅ NSE: ${data.by_volume.length} stocks`);
    return res.json({ status: "success", data });
  } catch (err) {
    console.warn("[MostActive] Attempt 1 failed:", err.message);
    try {
      _nseSession.cookies = ""; _nseSession.ts = 0;
      const fresh = await getNseSession(true);
      const data  = await fetchMostActive(fresh);
      _activeCache.data = data;
      _activeCache.ts   = Date.now();
      console.log(`[MostActive] ✅ NSE (fresh session): ${data.by_volume.length} stocks`);
      return res.json({ status: "success", data });
    } catch (err2) {
      console.warn("[MostActive] Attempt 2 failed:", err2.message);
      if (_activeCache.data) return res.json({ status: "success", data: _activeCache.data, stale: true });
      return res.json({ status: "success", data: { by_volume: [], by_value: [], source: "unavailable" }, unavailable: true });
    }
  }
});


// ─────────────────────────────────────────────────────────────────────────────
// PCR + MAX PAIN  (NIFTY / BANKNIFTY)
// GET /api/v1/kite/pcr-maxpain?name=NIFTY
//
// Algorithm:
//   1. Fetch NFO instrument list for given name (near expiry)
//   2. Batch-quote all CE + PE strikes via Kite /quote (up to 500)
//   3. PCR = Total Put OI / Total Call OI
//   4. Max Pain = strike where total option buyer loss is minimised
//      (equivalently: where option seller P&L is maximised)
//
// Cache: 3 minutes — OI updates on the exchange every few minutes
// ─────────────────────────────────────────────────────────────────────────────
const _pcrCache = {};

router.get("/pcr-maxpain", async (req, res) => {
  const name = ((req.query.name ?? "NIFTY")).toString().toUpperCase();
  const cacheKey = name;

  if (_pcrCache[cacheKey]?.data && Date.now() - _pcrCache[cacheKey].ts < 3 * 60_000) {
    return res.json({ status: "success", data: _pcrCache[cacheKey].data, cached: true });
  }

  try {
    // Step 1: Instruments
    const instrRes = await axios.get("https://api.kite.trade/instruments/NFO", {
      headers: headers(), responseType: "text", timeout: 15000,
    });
    const lines = instrRes.data.split("\n").filter(l => l.trim());
    const hdrs  = lines[0].split(",");
    const toObj = (line) => {
      const v = line.split(","), o = {};
      hdrs.forEach((h, i) => { o[h] = (v[i] ?? "").trim(); });
      return o;
    };

    const today     = new Date().toISOString().split("T")[0];
    const allItems  = lines.slice(1).map(toObj).filter(o => o.tradingsymbol?.startsWith(name));
    const expiries  = [...new Set(allItems.map(o => o.expiry).filter(e => e >= today))].sort();
    const nearExp   = expiries[0];
    if (!nearExp) throw new Error(`No active expiry found for ${name}`);

    const contracts = allItems.filter(o =>
      o.expiry === nearExp &&
      (o.instrument_type === "CE" || o.instrument_type === "PE") &&
      parseFloat(o.strike) > 0
    );

    if (contracts.length === 0) throw new Error("No CE/PE contracts found");

    // Step 2: Batch quote (Kite allows up to 500 per request)
    const symbols = contracts.slice(0, 500).map(c => `NFO:${c.tradingsymbol}`);
    const qRes    = await axios.get(
      `https://api.kite.trade/quote?${symbols.map(s => `i=${encodeURIComponent(s)}`).join("&")}`,
      { headers: headers(), timeout: 20000 }
    );
    const quotes = qRes.data?.data ?? {};

    // Step 3: Aggregate OI by strike
    const strikeMap = {}; // strike → { ce_oi, pe_oi, ce_ltp, pe_ltp }
    contracts.forEach(c => {
      const strike = parseFloat(c.strike);
      if (!strikeMap[strike]) strikeMap[strike] = { ce_oi: 0, pe_oi: 0, ce_ltp: 0, pe_ltp: 0 };
      const q = quotes[`NFO:${c.tradingsymbol}`];
      if (!q) return;
      const oi  = q.oi          ?? 0;
      const ltp = q.last_price  ?? 0;
      if (c.instrument_type === "CE") {
        strikeMap[strike].ce_oi  += oi;
        strikeMap[strike].ce_ltp  = ltp;
      } else {
        strikeMap[strike].pe_oi  += oi;
        strikeMap[strike].pe_ltp  = ltp;
      }
    });

    const strikes = Object.keys(strikeMap).map(Number).sort((a, b) => a - b);
    let totalCeOI = 0, totalPeOI = 0;
    strikes.forEach(s => {
      totalCeOI += strikeMap[s].ce_oi;
      totalPeOI += strikeMap[s].pe_oi;
    });

    const pcr = totalCeOI > 0 ? +(totalPeOI / totalCeOI).toFixed(3) : null;

    // Step 4: Max Pain — strike where total buyer loss is maximised (seller wins most)
    let maxPain = null;
    if (strikes.length > 0) {
      let minLoss = Infinity;
      for (const testStrike of strikes) {
        let totalLoss = 0;
        for (const s of strikes) {
          const ceValue = Math.max(0, testStrike - s);
          const peValue = Math.max(0, s - testStrike);
          totalLoss += (strikeMap[s].ce_oi * ceValue) + (strikeMap[s].pe_oi * peValue);
        }
        if (totalLoss < minLoss) { minLoss = totalLoss; maxPain = testStrike; }
      }
    }

    // Highest OI strikes
    const sortedByCeOI = [...strikes].sort((a, b) => strikeMap[b].ce_oi - strikeMap[a].ce_oi);
    const sortedByPeOI = [...strikes].sort((a, b) => strikeMap[b].pe_oi - strikeMap[a].pe_oi);

    const data = {
      name,
      expiry:         nearExp,
      pcr,
      max_pain:       maxPain,
      total_ce_oi:    totalCeOI,
      total_pe_oi:    totalPeOI,
      top_ce_strikes: sortedByCeOI.slice(0, 5).map(s => ({ strike: s, oi: strikeMap[s].ce_oi, ltp: strikeMap[s].ce_ltp })),
      top_pe_strikes: sortedByPeOI.slice(0, 5).map(s => ({ strike: s, oi: strikeMap[s].pe_oi, ltp: strikeMap[s].pe_ltp })),
      strike_data:    strikes.map(s => ({ strike: s, ce_oi: strikeMap[s].ce_oi, pe_oi: strikeMap[s].pe_oi, ce_ltp: strikeMap[s].ce_ltp, pe_ltp: strikeMap[s].pe_ltp })),
      source:         "kite-nfo",
    };

    _pcrCache[cacheKey] = { data, ts: Date.now() };
    return res.json({ status: "success", data });

  } catch (err) {
    console.error("[PCR-MaxPain] Error:", err.message);
    if (_pcrCache[cacheKey]?.data) {
      return res.json({ status: "success", data: _pcrCache[cacheKey].data, stale: true });
    }
    return res.json({
      status: "success",
      data: { name, pcr: null, max_pain: null, total_ce_oi: 0, total_pe_oi: 0, top_ce_strikes: [], top_pe_strikes: [], strike_data: [], source: "unavailable" },
      unavailable: true,
      message: err.message,
    });
  }
});


// ─────────────────────────────────────────────────────────────────────────────
// MACRO INDICATORS
// GET /api/v1/kite/macro
//
// Data sources:
//   INR/USD          → Yahoo Finance USDINR=X  (live, ~15s delay)
//   10Y Bond Yield   → Yahoo Finance IN10YT=RR → NSE G-Sec (fallback chain)
//   RBI Repo Rate    → Env variable KITE_RBI_REPO_RATE
//   CPI Inflation    → World Bank API (latest annual figure)
//   GDP Growth       → World Bank API (latest annual figure)
//
// Cache: 15 minutes for macro data (changes daily/quarterly at most)
// INR/USD: 60-second cache (exchange-rate updated more frequently)
// ─────────────────────────────────────────────────────────────────────────────
const _macroCache = { data: null, ts: 0, fxTs: 0 };

async function fetchWorldBankIndicator(indicator) {
  // World Bank open data API — returns latest value for India
  const r = await axios.get(
    `https://api.worldbank.org/v2/country/IN/indicator/${indicator}?format=json&mrv=1&gapfill=Y`,
    { timeout: 10000 }
  );
  // Response is an array: [meta, [dataArray]]
  const arr = Array.isArray(r.data) ? r.data[1] : null;
  if (!arr?.length) return null;
  const latest = arr.find(d => d.value !== null);
  return latest ? { value: latest.value, date: latest.date } : null;
}

async function fetchRbiRepoRate() {
  // Try env variable first (operator should keep this updated after RBI meetings)
  if (process.env.KITE_RBI_REPO_RATE) {
    return parseFloat(process.env.KITE_RBI_REPO_RATE);
  }
  // No reliable free live API for RBI policy rate
  return null;
}

// ✅ FIX: Bond yield now uses Yahoo Finance IN10YT=RR as primary
// NSE /api/governmentSecurities was returning 404 — Yahoo is more reliable
async function fetchBondYield10Y(cookies) {
  // ── Primary: Yahoo Finance — India 10Y Government Bond Yield ──
  try {
    const yf = await fetchYahooSymbol("IN10YT=RR");
    if (yf?.price > 0) {
      console.log(`[Macro] Bond yield from Yahoo: ${yf.price.toFixed(4)}%`);
      return +yf.price.toFixed(4);
    }
  } catch (e) {
    console.warn("[Macro] Bond yield Yahoo failed:", e.message);
  }

  // ── Fallback: NSE G-Sec API (try multiple endpoint variants) ──
  const NSE_GSEC_ENDPOINTS = [
    "https://www.nseindia.com/api/governmentSecurities",
    "https://www.nseindia.com/api/gb-securities",
    "https://www.nseindia.com/api/bonds-debt",
  ];

  for (const endpoint of NSE_GSEC_ENDPOINTS) {
    try {
      const r = await axios.get(endpoint, {
        timeout: 8000,
        headers: nseApiHeaders(cookies, "https://www.nseindia.com/market-data/government-securities"),
      });
      const rows = Array.isArray(r.data?.data) ? r.data.data
        : Array.isArray(r.data)                 ? r.data
        : extractNseRows(r.data);

      if (!rows.length) continue;

      // Find bond nearest to 10Y maturity
      const now          = new Date();
      const tenYrTarget  = new Date(now);
      tenYrTarget.setFullYear(now.getFullYear() + 10);

      let closest = null, minDiff = Infinity;
      for (const b of rows) {
        const mat = b.maturityDate ?? b.maturity ?? b.MaturityDate ?? "";
        if (!mat) continue;
        const matDate = new Date(mat);
        if (isNaN(matDate.getTime())) continue;
        const diff = Math.abs(matDate - tenYrTarget);
        if (diff < minDiff) { minDiff = diff; closest = b; }
      }

      const yld = closest
        ? parseFloat(closest.yield ?? closest.ytm ?? closest.Yield ?? closest.couponRate ?? "0")
        : 0;

      if (yld > 0) {
        console.log(`[Macro] Bond yield from NSE ${endpoint.split("/").pop()}: ${yld.toFixed(4)}%`);
        return +yld.toFixed(4);
      }
    } catch (e) {
      // Suppress 404s — only log non-404 errors
      if (e?.response?.status !== 404) {
        console.warn(`[Macro] Bond yield NSE ${endpoint.split("/").pop()} failed:`, e.message);
      }
    }
  }

  return null;
}

router.get("/macro", async (req, res) => {
  // INR/USD has its own 60s cache; other macro data cached 15 min
  const fxCacheValid   = _macroCache.data?.inr_usd && Date.now() - _macroCache.fxTs < 60_000;
  const macroCacheValid = _macroCache.data && Date.now() - _macroCache.ts < 15 * 60_000;

  if (macroCacheValid && fxCacheValid) {
    return res.json({ status: "success", data: _macroCache.data, cached: true });
  }

  const results = { ...(_macroCache.data ?? {}) };

  // INR/USD — always refresh if stale (60s)
  if (!fxCacheValid) {
    try {
      const fx = await fetchYahooSymbol("USDINR=X");
      results.inr_usd = fx.price
        ? { rate: +fx.price.toFixed(4), change_pct: +fx.changePct.toFixed(3), source: "yahoo" }
        : null;
      _macroCache.fxTs = Date.now();
    } catch (_) {
      results.inr_usd = _macroCache.data?.inr_usd ?? null;
    }
  }

  // If only FX was stale and macro data is still valid, return early
  if (macroCacheValid) {
    _macroCache.data = { ..._macroCache.data, inr_usd: results.inr_usd };
    return res.json({ status: "success", data: _macroCache.data });
  }

  // Fetch all macro data in parallel
  const [repoRes, cpiRes, gdpRes] = await Promise.allSettled([
    fetchRbiRepoRate(),
    fetchWorldBankIndicator("FP.CPI.TOTL.ZG"),   // CPI inflation annual %
    fetchWorldBankIndicator("NY.GDP.MKTP.KD.ZG"), // GDP growth annual %
  ]);

  results.rbi_repo_rate = repoRes.status === "fulfilled" ? repoRes.value : (_macroCache.data?.rbi_repo_rate ?? null);
  results.cpi = cpiRes.status === "fulfilled" && cpiRes.value
    ? { value: +cpiRes.value.value.toFixed(2), year: cpiRes.value.date, source: "worldbank" }
    : (_macroCache.data?.cpi ?? null);
  results.gdp = gdpRes.status === "fulfilled" && gdpRes.value
    ? { value: +gdpRes.value.value.toFixed(2), year: gdpRes.value.date, source: "worldbank" }
    : (_macroCache.data?.gdp ?? null);

  // Bond yield — Yahoo primary, NSE fallback
  try {
    const cookies = await getNseSession();
    const yld = await fetchBondYield10Y(cookies);
    results.bond_yield_10y = yld;
  } catch (_) {
    results.bond_yield_10y = _macroCache.data?.bond_yield_10y ?? null;
  }

  _macroCache.data = results;
  _macroCache.ts   = Date.now();
  return res.json({ status: "success", data: results });
});


// ─────────────────────────────────────────────────────────────────────────────
// INDIA TRADING HOLIDAYS
// GET /api/v1/kite/holidays?year=YYYY
//
// Primary:  Kite Connect API  /api/holidays/:year  (requires valid access token)
// Fallback: Hardcoded NSE/BSE static list for 2025 and 2026
// Cache:    15 minutes
// ─────────────────────────────────────────────────────────────────────────────

const INDIA_HOLIDAYS_STATIC_2025 = [
  { date: "2025-01-26", reason: "Republic Day" },
  { date: "2025-02-26", reason: "Mahashivratri" },
  { date: "2025-03-14", reason: "Holi" },
  { date: "2025-03-31", reason: "Id-Ul-Fitr (Eid)" },
  { date: "2025-04-10", reason: "Shri Ram Navami" },
  { date: "2025-04-14", reason: "Dr. Ambedkar Jayanti" },
  { date: "2025-04-18", reason: "Good Friday" },
  { date: "2025-05-01", reason: "Maharashtra Day" },
  { date: "2025-08-15", reason: "Independence Day" },
  { date: "2025-08-27", reason: "Ganesh Chaturthi" },
  { date: "2025-10-02", reason: "Gandhi Jayanti / Dussehra" },
  { date: "2025-10-20", reason: "Diwali — Laxmi Puja" },
  { date: "2025-10-21", reason: "Diwali — Balipratipada" },
  { date: "2025-11-05", reason: "Guru Nanak Jayanti" },
  { date: "2025-12-25", reason: "Christmas" },
];

const INDIA_HOLIDAYS_STATIC_2026 = [
  { date: "2026-01-26", reason: "Republic Day" },
  { date: "2026-02-14", reason: "Maha Shivratri" },
  { date: "2026-03-04", reason: "Holi" },
  { date: "2026-03-20", reason: "Id-Ul-Fitr (Eid) — tentative" },
  { date: "2026-03-30", reason: "Ram Navami" },
  { date: "2026-04-03", reason: "Good Friday" },
  { date: "2026-04-14", reason: "Dr. Ambedkar Jayanti" },
  { date: "2026-05-01", reason: "Maharashtra Day" },
  { date: "2026-08-15", reason: "Independence Day" },
  { date: "2026-09-15", reason: "Ganesh Chaturthi" },
  { date: "2026-10-02", reason: "Gandhi Jayanti / Dussehra" },
  { date: "2026-11-08", reason: "Diwali — Laxmi Puja" },
  { date: "2026-11-09", reason: "Diwali — Balipratipada" },
  { date: "2026-11-24", reason: "Guru Nanak Jayanti" },
  { date: "2026-12-25", reason: "Christmas" },
];

const INDIA_HOL_BY_YEAR  = { 2025: INDIA_HOLIDAYS_STATIC_2025,  2026: INDIA_HOLIDAYS_STATIC_2026  };
const _indiaHolCache     = {};

router.get("/holidays", async (req, res) => {
  const year = parseInt(req.query.year) || new Date().getFullYear();

  // Serve from cache (15 min)
  if (_indiaHolCache[year] && Date.now() - _indiaHolCache[year].ts < 15 * 60_000) {
    return res.json({ status: "success", data: _indiaHolCache[year].data, cached: true });
  }

  // Try Kite API first (needs valid access token)
  const token = getToken();
  if (token && API_KEY) {
    try {
      const r = await axios.get(
        `https://api.kite.trade/api/holidays/${year}`,
        { headers: headers(), timeout: 8000 }
      );
      const tradingHols = r.data?.data?.trading ?? [];
      if (Array.isArray(tradingHols) && tradingHols.length > 0) {
        const mapped = tradingHols.map(h => ({
          date:   h.date,
          reason: h.description ?? h.reason ?? h.name ?? "Market Holiday",
        }));
        _indiaHolCache[year] = { data: mapped, ts: Date.now() };
        console.log(`[IndiaHolidays] Kite API: ${mapped.length} holidays for ${year}`);
        return res.json({ status: "success", data: mapped });
      }
    } catch (err) {
      console.warn(`[IndiaHolidays] Kite API failed (${err?.response?.status ?? err.message}) — using static`);
    }
  }

  // Static fallback
  const staticList = INDIA_HOL_BY_YEAR[year] ?? [];
  _indiaHolCache[year] = { data: staticList, ts: Date.now() };
  console.log(`[IndiaHolidays] Static: ${staticList.length} holidays for ${year}`);
  return res.json({ status: "success", data: staticList, source: "static" });
});


// ─────────────────────────────────────────────────────────────────────────────
// GLOBAL MARKET HOLIDAYS
// GET /api/v1/kite/global-holidays?year=YYYY
//
// Primary:  Nager.Date free public API (no key needed) — US + UK holidays
// Fallback: Hardcoded static list for 2025 and 2026
// Cache:    6 hours
// ─────────────────────────────────────────────────────────────────────────────

const GLOBAL_HOLIDAYS_STATIC_2025 = [
  { date: "2025-01-01", name: "New Year's Day",             description: "NYSE, NASDAQ, LSE, Euronext all closed." },
  { date: "2025-01-20", name: "Martin Luther King Jr. Day", description: "NYSE & NASDAQ closed." },
  { date: "2025-02-17", name: "Presidents' Day (US)",       description: "NYSE & NASDAQ closed." },
  { date: "2025-04-18", name: "Good Friday",                description: "NYSE, NASDAQ, LSE, Euronext all closed." },
  { date: "2025-04-21", name: "Easter Monday",              description: "LSE & Euronext closed. NYSE open." },
  { date: "2025-05-05", name: "Early May Bank Holiday (UK)",description: "LSE closed." },
  { date: "2025-05-26", name: "Memorial Day (US)",          description: "NYSE & NASDAQ closed." },
  { date: "2025-07-04", name: "US Independence Day",        description: "NYSE & NASDAQ closed." },
  { date: "2025-09-01", name: "Labor Day (US)",             description: "NYSE & NASDAQ closed." },
  { date: "2025-11-27", name: "Thanksgiving Day (US)",      description: "NYSE & NASDAQ closed." },
  { date: "2025-12-25", name: "Christmas Day",              description: "NYSE, NASDAQ, LSE, Euronext all closed." },
  { date: "2025-12-26", name: "Boxing Day",                 description: "LSE & Euronext closed." },
];

const GLOBAL_HOLIDAYS_STATIC_2026 = [
  { date: "2026-01-01", name: "New Year's Day",             description: "All major global exchanges closed." },
  { date: "2026-01-19", name: "Martin Luther King Jr. Day", description: "NYSE & NASDAQ closed." },
  { date: "2026-02-16", name: "Presidents' Day (US)",       description: "NYSE & NASDAQ closed." },
  { date: "2026-04-03", name: "Good Friday",                description: "NYSE, NASDAQ, LSE, Euronext all closed." },
  { date: "2026-04-06", name: "Easter Monday",              description: "LSE & Euronext closed." },
  { date: "2026-05-04", name: "Early May Bank Holiday (UK)",description: "LSE closed." },
  { date: "2026-05-25", name: "Memorial Day (US)",          description: "NYSE & NASDAQ closed." },
  { date: "2026-07-04", name: "US Independence Day",        description: "NYSE & NASDAQ closed." },
  { date: "2026-09-07", name: "Labor Day (US)",             description: "NYSE & NASDAQ closed." },
  { date: "2026-11-26", name: "Thanksgiving Day (US)",      description: "NYSE & NASDAQ closed." },
  { date: "2026-12-25", name: "Christmas Day",              description: "NYSE, NASDAQ, LSE, Euronext all closed." },
  { date: "2026-12-28", name: "Boxing Day (observed)",      description: "LSE & Euronext closed." },
];

const GLOBAL_HOL_BY_YEAR = { 2025: GLOBAL_HOLIDAYS_STATIC_2025, 2026: GLOBAL_HOLIDAYS_STATIC_2026 };
const _globalHolCache    = {};

router.get("/global-holidays", async (req, res) => {
  const year = parseInt(req.query.year) || new Date().getFullYear();

  // Serve from cache (6 hours)
  if (_globalHolCache[year] && Date.now() - _globalHolCache[year].ts < 6 * 60 * 60_000) {
    return res.json({ status: "success", data: _globalHolCache[year].data, cached: true });
  }

  // Try Nager.Date free public API — fetches US + UK public holidays, no API key needed
  try {
    const [usRes, gbRes] = await Promise.allSettled([
      axios.get(`https://date.nager.at/api/v3/PublicHolidays/${year}/US`, { timeout: 8000 }),
      axios.get(`https://date.nager.at/api/v3/PublicHolidays/${year}/GB`, { timeout: 8000 }),
    ]);

    const seen   = new Set();
    const merged = [];

    // Major US market holidays we care about
    const US_KEYS = [
      "New Year", "Martin Luther King", "Presidents", "Memorial",
      "Independence", "Labor Day", "Thanksgiving", "Christmas",
    ];
    // Major UK/global holidays
    const GB_KEYS = ["New Year", "Good Friday", "Easter Monday", "Early May", "Christmas", "Boxing"];

    for (const [res, keys] of [[usRes, US_KEYS], [gbRes, GB_KEYS]]) {
      if (res.status !== "fulfilled") continue;
      const hols = Array.isArray(res.value?.data) ? res.value.data : [];
      for (const h of hols) {
        if (!h.date || seen.has(h.date)) continue;
        const name = h.name || h.localName || "";
        const isRelevant = keys.some(k => name.toLowerCase().includes(k.toLowerCase()));
        if (!isRelevant) continue;
        seen.add(h.date);
        merged.push({ date: h.date, name });
      }
    }

    if (merged.length > 0) {
      merged.sort((a, b) => a.date.localeCompare(b.date));
      _globalHolCache[year] = { data: merged, ts: Date.now() };
      console.log(`[GlobalHolidays] Nager.Date API: ${merged.length} holidays for ${year}`);
      return res.json({ status: "success", data: merged });
    }
  } catch (err) {
    console.warn(`[GlobalHolidays] Nager.Date API failed (${err.message}) — using static`);
  }

  // Static fallback
  const staticList = GLOBAL_HOL_BY_YEAR[year] ?? [];
  _globalHolCache[year] = { data: staticList, ts: Date.now() };
  console.log(`[GlobalHolidays] Static: ${staticList.length} holidays for ${year}`);
  return res.json({ status: "success", data: staticList, source: "static" });
});


export default router;