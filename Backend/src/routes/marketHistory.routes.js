import express from "express";
const router = express.Router();

const YF_HOSTS = [
  "https://query1.finance.yahoo.com",
  "https://query2.finance.yahoo.com",
];
let yfHostIdx = 0;

const YF_HEADERS = {
  "User-Agent":      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  "Accept":          "application/json, text/plain, */*",
  "Accept-Language": "en-US,en;q=0.9",
  "Accept-Encoding": "gzip, deflate, br",
  "Origin":          "https://finance.yahoo.com",
  "Referer":         "https://finance.yahoo.com/",
  "Cache-Control":   "no-cache",
};

// ─────────────────────────────────────────────────────────────────────────────
// PERIOD_PARAMS — matches Yahoo Finance's exact tab set:
//   1D | 5D | 1M | 6M | YTD | 1Y | 5Y | MAX
//
// KEY DISTINCTION:
//   "interval" = size of each individual candle bar
//   "range"    = how far back in time we fetch data
//
// Yahoo Finance's free/unofficial API returns 15-min DELAYED data for
// US equities. This is their policy — it cannot be bypassed without a
// paid provider (Twelve Data Pro, Polygon.io, etc.).
// We expose `dataDelayMinutes` in every response so the frontend can
// show a "Prices delayed 15 min" disclaimer (standard industry practice).
// ─────────────────────────────────────────────────────────────────────────────
const PERIOD_PARAMS = {
  // KEY      interval   range     candles you get        Yahoo Finance tab
  "1D":  { interval: "2m",   range: "1d"  },  // ~195 bars  → "1D"  tab
  "5D":  { interval: "15m",  range: "5d"  },  // ~130 bars  → "5D"  tab
  "1M":  { interval: "1d",   range: "1mo" },  // ~21 bars   → "1M"  tab
  "6M":  { interval: "1d",   range: "6mo" },  // ~126 bars  → "6M"  tab
  "YTD": { interval: "1d",   range: "ytd" },  // varies     → "YTD" tab
  "1Y":  { interval: "1wk",  range: "1y"  },  // ~52 bars   → "1Y"  tab  ← was "1mo" (only 12 bars — wrong)
  "5Y":  { interval: "1wk",  range: "5y"  },  // ~260 bars  → "5Y"  tab  ← was "3mo" (only 20 bars — too sparse)
  "MAX": { interval: "1mo",  range: "max" },  // all-time   → "MAX" tab
};

// ─────────────────────────────────────────────────────────────────────────────
// CACHE TTL per period — intraday TTL is short (60s) so our server-side
// cache doesn't add meaningfully to Yahoo's inherent 15-min delay.
// Longer periods change slowly so longer TTLs are safe.
// ─────────────────────────────────────────────────────────────────────────────
const CACHE_TTL = {
  "1D":   60  * 1000,         // 60 sec  — intraday: minimize added delay
  "5D":   2   * 60 * 1000,   //  2 min
  "1M":   30  * 60 * 1000,   // 30 min
  "6M":   60  * 60 * 1000,   //  1 hr
  "YTD":  60  * 60 * 1000,   //  1 hr
  "1Y":   60  * 60 * 1000,   //  1 hr
  "5Y":   60  * 60 * 1000,   //  1 hr
  "MAX":  6   * 60 * 60 * 1000, // 6 hr — historical, almost never changes
};

// Yahoo's free API delays intraday data by 15 minutes for US equities.
// We surface this so the frontend can show a disclaimer.
const DATA_DELAY_MINUTES = 15;

// Per-period cache: key = "SYMBOL_PERIOD"
const _historyCache = new Map();

async function fetchYahooHistory(symbol, period) {
  const { interval, range } = PERIOD_PARAMS[period];

  for (let attempt = 0; attempt < 2; attempt++) {
    const host = YF_HOSTS[(yfHostIdx + attempt) % YF_HOSTS.length];
    const url  = `${host}/v8/finance/chart/${encodeURIComponent(symbol)}?interval=${interval}&range=${range}`;

    try {
      const res = await fetch(url, { headers: YF_HEADERS });

      if (res.status === 429) {
        console.warn(`[History] 429 on attempt ${attempt + 1} for ${symbol}`);
        await new Promise(r => setTimeout(r, 600));
        continue;
      }
      if (!res.ok) throw new Error(`Yahoo ${res.status}`);

      const json   = await res.json();
      const result = json?.chart?.result?.[0];
      if (!result) throw new Error("No result in Yahoo response");

      const meta       = result.meta;
      const timestamps = result.timestamp || [];
      const q          = result.indicators?.quote?.[0] || {};

      const candles = timestamps
        .map((ts, i) => {
          const o = q.open?.[i];
          const h = q.high?.[i];
          const l = q.low?.[i];
          const c = q.close?.[i];
          if (o == null || h == null || l == null || c == null) return null;
          // Decimal precision based on price magnitude
          const dp = c > 1000 ? 2 : c > 10 ? 3 : 4;
          return {
            x: ts * 1000,   // ms epoch for frontend charting libs
            y: [
              parseFloat(o.toFixed(dp)),
              parseFloat(h.toFixed(dp)),
              parseFloat(l.toFixed(dp)),
              parseFloat(c.toFixed(dp)),
            ],
          };
        })
        .filter(Boolean);

      yfHostIdx = (yfHostIdx + 1) % YF_HOSTS.length;

      console.log(`[History] ${symbol} ${period} (${interval}/${range}): ${candles.length} candles fetched`);

      return {
        symbol,
        period,
        interval,
        range,
        candles,
        // Surface the delay so frontend shows a disclaimer
        dataDelayMinutes: DATA_DELAY_MINUTES,
        meta: {
          price:         meta.regularMarketPrice,
          previousClose: meta.chartPreviousClose ?? meta.previousClose,
          high:          meta.regularMarketDayHigh,
          low:           meta.regularMarketDayLow,
          currency:      meta.currency,
          timezone:      meta.timezone,
          exchangeName:  meta.exchangeName,
        },
      };
    } catch (e) {
      console.error(`[History] ${symbol} ${period} attempt ${attempt + 1}:`, e.message);
      if (attempt === 1) throw e;
    }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/v1/markets/history/:symbol?period=1D
// Valid periods: 1D | 5D | 1M | 6M | YTD | 1Y | 5Y | MAX
// Default: 1D
// ─────────────────────────────────────────────────────────────────────────────
router.get("/history/:symbol", async (req, res) => {
  const symbol = decodeURIComponent(req.params.symbol);
  const period = (req.query.period || "1D").toUpperCase();

  if (!PERIOD_PARAMS[period]) {
    return res.status(400).json({
      error: `Invalid period. Valid values: ${Object.keys(PERIOD_PARAMS).join(", ")}`,
    });
  }

  const cacheKey = `${symbol}_${period}`;
  const cached   = _historyCache.get(cacheKey);
  if (cached && Date.now() - cached.ts < CACHE_TTL[period]) {
    console.log(`[History] Cache hit: ${cacheKey}`);
    return res.json({ ...cached.data, fromCache: true });
  }

  try {
    console.log(`[History] Fetching ${symbol} ${period} from Yahoo...`);
    const data = await fetchYahooHistory(symbol, period);
    _historyCache.set(cacheKey, { data, ts: Date.now() });
    res.json(data);
  } catch (err) {
    console.error(`[History] Failed ${symbol} ${period}:`, err.message);
    // Return stale cache rather than a hard error — better UX
    if (cached) {
      console.log(`[History] Returning stale cache for ${cacheKey}`);
      return res.json({ ...cached.data, stale: true });
    }
    res.status(500).json({ error: "Failed to fetch history", detail: err.message });
  }
});

export default router;