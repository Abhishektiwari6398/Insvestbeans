// Backend/src/utils/kiteWebSocket.js
// ── UPDATED: India VIX + full sector index coverage ──
// Uses official kiteconnect npm package
// Auto-fetches current MCX contract tokens from Kite instruments API
// so tokens stay valid as contracts roll over each month

import { KiteTicker } from "kiteconnect";
import axios from "axios";

// ─────────────────────────────────────────────────────────────────
// NSE INSTRUMENT TOKEN MAP (static — these never change for indices)
// ─────────────────────────────────────────────────────────────────
export const TOKEN_SYMBOL = {
  // ── NSE Broad Indices ───────────────────────────────────────────
  256265:  "NSE:NIFTY 50",
  260105:  "NSE:NIFTY BANK",
  288009:  "NSE:NIFTY LARGEMID250",
  258801:  "NSE:NIFTY MIDCAP 100",
  259329:  "NSE:NIFTY SMLCAP 100",
  // ── NSE Volatility ──────────────────────────────────────────────
  264969:  "NSE:INDIA VIX",
  // ── NSE Sectoral Indices ────────────────────────────────────────
  258529:  "NSE:NIFTY IT",
  258049:  "NSE:NIFTY AUTO",
  259849:  "NSE:NIFTY PHARMA",
  259337:  "NSE:NIFTY METAL",
  260361:  "NSE:NIFTY REALTY",
  300265:  "NSE:NIFTY IND DEFENCE",
  261889:  "NSE:NIFTY FIN SERVICE",
  258537:  "NSE:NIFTY FMCG",
  258409:  "NSE:NIFTY ENERGY",
  260649:  "NSE:NIFTY PSU BANK",
  // ── BSE Broad Indices ───────────────────────────────────────────
  265:     "BSE:SENSEX",
  // ── NSE Top Stocks ──────────────────────────────────────────────
  738561:  "NSE:RELIANCE",
  2953217: "NSE:TCS",
  341249:  "NSE:HDFCBANK",
  408065:  "NSE:INFY",
  1270529: "NSE:ICICIBANK",
  969473:  "NSE:WIPRO",
  356865:  "NSE:HINDUNILVR",
  424961:  "NSE:ITC",
};

// MCX commodity token map — populated dynamically at runtime
export const MCX_TOKEN_SYMBOL = {};
export const MCX_SYMBOL_TOKEN = {};
export let ACTIVE_TOKEN_SYMBOL = { ...TOKEN_SYMBOL };

export const SYMBOL_TOKEN = Object.fromEntries(
  Object.entries(TOKEN_SYMBOL).map(([k, v]) => [v, Number(k)])
);

// ─────────────────────────────────────────────────────────────────
// MCX COMMODITY CONFIG
// ─────────────────────────────────────────────────────────────────
const MCX_COMMODITY_CONFIG = [
  { tradingSymbol: "GOLD",       displayName: "Gold",        key: "MCX:GOLD",       unit: "₹/10g"   },
  { tradingSymbol: "SILVER",     displayName: "Silver",      key: "MCX:SILVER",     unit: "₹/kg"    },
  { tradingSymbol: "CRUDEOIL",   displayName: "Crude Oil",   key: "MCX:CRUDEOIL",   unit: "₹/bbl"   },
  { tradingSymbol: "NATURALGAS", displayName: "Natural Gas", key: "MCX:NATURALGAS", unit: "₹/mmBtu" },
  { tradingSymbol: "COPPER",     displayName: "Copper",      key: "MCX:COPPER",     unit: "₹/kg"    },
];

// ─────────────────────────────────────────────────────────────────
// FETCH MCX INSTRUMENT TOKENS
// ─────────────────────────────────────────────────────────────────
export async function fetchMCXTokens(apiKey, accessToken) {
  if (!apiKey || !accessToken) {
    console.warn("⚠️  fetchMCXTokens: missing credentials, skipping");
    return;
  }

  try {
    console.log("🔍 Fetching MCX instrument tokens from Kite...");

    const res = await axios.get("https://api.kite.trade/instruments/MCX", {
      headers: {
        "X-Kite-Version": "3",
        "Authorization": `token ${apiKey}:${accessToken}`,
      },
      timeout: 10000,
    });

    const lines   = res.data.split("\n").filter(l => l.trim());
    const headers = lines[0].split(",");
    const today   = new Date();
    today.setHours(0, 0, 0, 0);

    const instruments = lines.slice(1).map(line => {
      const cols = line.split(",");
      return {
        instrument_token: parseInt(cols[0]),
        tradingsymbol:    cols[2],
        expiry:           cols[5] ? new Date(cols[5]) : null,
        instrument_type:  cols[9],
        segment:          cols[10],
      };
    }).filter(i =>
      i.instrument_type === "FUT" &&
      i.expiry instanceof Date &&
      !isNaN(i.expiry.getTime()) &&
      i.expiry >= today
    );

    Object.keys(MCX_TOKEN_SYMBOL).forEach(k => delete MCX_TOKEN_SYMBOL[k]);
    Object.keys(MCX_SYMBOL_TOKEN).forEach(k => delete MCX_SYMBOL_TOKEN[k]);

    let foundCount = 0;
    for (const cfg of MCX_COMMODITY_CONFIG) {
      const contracts = instruments.filter(i =>
        i.tradingsymbol.startsWith(cfg.tradingSymbol) &&
        !i.tradingsymbol.includes("MINI") &&
        !i.tradingsymbol.includes("MICRO") &&
        !i.tradingsymbol.includes("PETAL") &&
        !i.tradingsymbol.includes("GUINEA") &&
        !i.tradingsymbol.includes("TEN")
      );

      if (contracts.length === 0) {
        console.warn(`⚠️  No MCX contracts found for ${cfg.tradingSymbol}`);
        continue;
      }

      contracts.sort((a, b) => a.expiry - b.expiry);
      const near = contracts[0];

      MCX_TOKEN_SYMBOL[near.instrument_token] = cfg.key;
      MCX_SYMBOL_TOKEN[cfg.key] = near.instrument_token;

      console.log(`✅ MCX ${cfg.tradingSymbol}: token=${near.instrument_token} symbol=${near.tradingsymbol} expiry=${near.expiry.toISOString().slice(0,10)}`);
      foundCount++;
    }

    Object.assign(ACTIVE_TOKEN_SYMBOL, TOKEN_SYMBOL, MCX_TOKEN_SYMBOL);
    console.log(`✅ MCX tokens loaded: ${foundCount}/${MCX_COMMODITY_CONFIG.length} commodities`);
    return MCX_TOKEN_SYMBOL;

  } catch (err) {
    console.error("❌ fetchMCXTokens failed:", err.message);

    const FALLBACK_TOKENS = {
      225177: "MCX:GOLD",
      234230: "MCX:SILVER",
      239545: "MCX:CRUDEOIL",
      253577: "MCX:NATURALGAS",
      231288: "MCX:COPPER",
    };

    Object.assign(MCX_TOKEN_SYMBOL, FALLBACK_TOKENS);
    Object.assign(MCX_SYMBOL_TOKEN, Object.fromEntries(
      Object.entries(FALLBACK_TOKENS).map(([k, v]) => [v, Number(k)])
    ));
    Object.assign(ACTIVE_TOKEN_SYMBOL, TOKEN_SYMBOL, FALLBACK_TOKENS);

    console.warn("⚠️  Using fallback MCX tokens — prices may be stale after contract rollover");
    return FALLBACK_TOKENS;
  }
}

// ─────────────────────────────────────────────────────────────────
// TOKEN LISTS
// ─────────────────────────────────────────────────────────────────

// All NSE/BSE index tokens — subscribed in quote mode
const INDEX_TOKENS = [
  // Broad
  256265,  // NIFTY 50
  260105,  // NIFTY BANK
  265,     // SENSEX
  288009,  // NIFTY LARGEMID250
  258801,  // NIFTY MIDCAP 100
  259329,  // NIFTY SMLCAP 100
  // Volatility
  264969,  // INDIA VIX
  // Sectoral
  258529,  // NIFTY IT
  258049,  // NIFTY AUTO
  259849,  // NIFTY PHARMA
  259337,  // NIFTY METAL
  260361,  // NIFTY REALTY
  300265,  // NIFTY IND DEFENCE
  261889,  // NIFTY FIN SERVICE
  258537,  // NIFTY FMCG
  258409,  // NIFTY ENERGY
  260649,  // NIFTY PSU BANK
];

const STOCK_TOKENS = [738561, 2953217, 341249, 408065, 1270529, 969473, 356865, 424961];
const BASE_TOKENS  = [...INDEX_TOKENS, ...STOCK_TOKENS];

function getMCXTokenList() {
  return Object.keys(MCX_TOKEN_SYMBOL).map(Number).filter(Boolean);
}

// ─────────────────────────────────────────────────────────────────
// KiteWebSocketManager
// ─────────────────────────────────────────────────────────────────
export class KiteWebSocketManager {
  constructor() {
    this.ticker    = null;
    this.io        = null;
    this.lastTicks = {};
    this.connected = false;
    this.apiKey    = null;
    this.token     = null;
  }

  attachSocketIO(io) {
    this.io = io;
    console.log("✅ Socket.IO attached to KiteWebSocketManager");
  }

  connect(apiKey, accessToken) {
    this.apiKey = apiKey;
    this.token  = accessToken;

    if (!apiKey || !accessToken) {
      console.warn("⚠️  KiteWS: missing credentials — skipping connect");
      return;
    }

    if (this.ticker) {
      try { this.ticker.disconnect(); } catch (_) {}
    }

    console.log("🔌 Connecting KiteTicker...");
    this.ticker = new KiteTicker({ api_key: apiKey, access_token: accessToken });
    this.ticker.autoReconnect(true, 50, 5);

    this.ticker.on("connect", async () => {
      console.log("✅ KiteTicker CONNECTED");
      this.connected = true;

      await fetchMCXTokens(apiKey, accessToken);

      const mcxTokens = getMCXTokenList();
      const allTokens = [...BASE_TOKENS, ...mcxTokens];

      this.ticker.subscribe(allTokens);

      // Full mode for stocks + MCX (OHLC + OI + depth)
      this.ticker.setMode(this.ticker.modeFull,  [...STOCK_TOKENS, ...mcxTokens]);
      // Quote mode for indices (includes OHLC + change, no depth)
      this.ticker.setMode(this.ticker.modeQuote, INDEX_TOKENS);

      console.log(`📡 Subscribed ${allTokens.length} instruments (${INDEX_TOKENS.length} indices + ${STOCK_TOKENS.length} stocks + ${mcxTokens.length} MCX)`);
    });

    this.ticker.on("ticks", (ticks) => {
      if (!ticks?.length) return;
      ticks.forEach(tick => {
        const symbol = ACTIVE_TOKEN_SYMBOL[tick.instrument_token];
        if (!symbol) return;

        this.lastTicks[symbol] = {
          symbol,
          instrument_token: tick.instrument_token,
          exchange:      symbol.split(":")[0],
          tradable:      tick.tradable,
          mode:          tick.mode,
          last_price:    tick.last_price,
          last_quantity: tick.last_quantity,
          avg_price:     tick.average_price,
          volume:        tick.volume         ?? 0,
          buy_quantity:  tick.buy_quantity   ?? 0,
          sell_quantity: tick.sell_quantity  ?? 0,
          oi:            tick.oi             ?? 0,
          oi_day_high:   tick.oi_day_high    ?? 0,
          oi_day_low:    tick.oi_day_low     ?? 0,
          change:        tick.change         ?? 0,
          ohlc:          tick.ohlc           ?? undefined,
          depth:         tick.depth          ?? undefined,
          ts:            Date.now(),
        };
      });

      if (this.io) this.io.emit("kite:ticks", this.lastTicks);
    });

    this.ticker.on("order_update", (order) => {
      console.log("📋 Order update:", order.order_id, order.status);
      if (this.io) this.io.emit("kite:order_update", order);
    });

    this.ticker.on("error",       (err) => { console.error("❌ KiteTicker error:", err); this.connected = false; });
    this.ticker.on("disconnect",  ()    => { console.log("🔌 KiteTicker disconnected"); this.connected = false; });
    this.ticker.on("reconnect",   (c)   => { console.log(`🔄 Reconnecting... attempt ${c}`); });
    this.ticker.on("noreconnect", ()    => { console.error("❌ Max reconnect attempts reached"); });

    this.ticker.connect();
  }

  updateToken(accessToken) { this.token = accessToken; this.connect(this.apiKey, accessToken); }
  disconnect()             { try { this.ticker?.disconnect(); } catch(_) {} this.ticker = null; this.connected = false; }
  getLastTicks()           { return this.lastTicks; }

  getMCXTicks() {
    return Object.fromEntries(
      Object.entries(this.lastTicks).filter(([k]) => k.startsWith("MCX:"))
    );
  }

  /** Returns all sector index ticks keyed by "NSE:NIFTY IT" etc. */
  getSectorTicks() {
    const SECTOR_KEYS = [
      "NSE:NIFTY IT",          "NSE:NIFTY AUTO",        "NSE:NIFTY PHARMA",
      "NSE:NIFTY METAL",       "NSE:NIFTY REALTY",      "NSE:NIFTY IND DEFENCE",
      "NSE:NIFTY FIN SERVICE", "NSE:NIFTY FMCG",        "NSE:NIFTY ENERGY",
      "NSE:NIFTY PSU BANK",    "NSE:NIFTY LARGEMID250", "NSE:NIFTY MIDCAP 100",
      "NSE:NIFTY SMLCAP 100",
    ];
    return Object.fromEntries(
      SECTOR_KEYS.map(k => [k, this.lastTicks[k]]).filter(([, v]) => v)
    );
  }

  /** Returns India VIX tick */
  getVixTick() { return this.lastTicks["NSE:INDIA VIX"] ?? null; }

  isConnected() { return this.connected; }
}

export const kiteWS = new KiteWebSocketManager();