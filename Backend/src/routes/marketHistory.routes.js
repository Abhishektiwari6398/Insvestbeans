import express from "express";
const router = express.Router();

const YF_HOSTS = [
  "https://query1.finance.yahoo.com",
  "https://query2.finance.yahoo.com",
];
let yfHostIdx = 0;

const YF_HEADERS = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  "Accept": "application/json, text/plain, */*",
  "Accept-Language": "en-US,en;q=0.9",
  "Accept-Encoding": "gzip, deflate, br",
  "Origin": "https://finance.yahoo.com",
  "Referer": "https://finance.yahoo.com/",
  "Cache-Control": "no-cache",
};

// Period → Yahoo interval + range params (INCREASED for more candles)
const PERIOD_PARAMS = {
  "1D":  { interval: "5m",   range: "1d"  },   // 5-min candles (more data points)
  "1W":  { interval: "30m",  range: "5d"  },   // 30-min candles (more data points)
  "1M":  { interval: "1d",   range: "1mo" },   // daily candles, 1 month
  "3M":  { interval: "1d",   range: "3mo" },   // daily candles, 3 months
  "1Y":  { interval: "1mo",  range: "1y"  }, 
  "2Y":  { interval: "1mo",  range: "2y"  },   // 24 monthly bars
"5Y":  { interval: "3mo",  range: "5y"  },  // weekly candles, 1 year
};

// Per-period cache: key = "SYMBOL_PERIOD"
const _historyCache = new Map();
const CACHE_TTL = {
  "1D":  5  * 60 * 1000,   // 5 min  (intraday refreshes often)
  "1W":  15 * 60 * 1000,   // 15 min
  "1M":  30 * 60 * 1000,   // 30 min
  "3M":  60 * 60 * 1000,   // 1 hr
  "1Y":  60 * 60 * 1000,   // 1 hr
  "2Y":  60 * 60 * 1000,   // 1 hr
  "5Y":  60 * 60 * 1000,   // 1 hr
};

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
          // Round based on price magnitude
          const dp = c > 1000 ? 2 : c > 10 ? 3 : 4;
          return {
            x: ts * 1000,
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

      console.log(`[History] ${symbol} ${period}: Fetched ${candles.length} candles`);

      return {
        symbol,
        period,
        interval,
        candles,
        meta: {
          price:          meta.regularMarketPrice,
          previousClose:  meta.chartPreviousClose ?? meta.previousClose,
          high:           meta.regularMarketDayHigh,
          low:            meta.regularMarketDayLow,
          currency:       meta.currency,
        },
      };
    } catch (e) {
      console.error(`[History] ${symbol} ${period} attempt ${attempt + 1}:`, e.message);
      if (attempt === 1) throw e;
    }
  }
}

// GET /api/v1/markets/history/:symbol?period=1D
router.get("/history/:symbol", async (req, res) => {
  const symbol = decodeURIComponent(req.params.symbol);
  const period = (req.query.period || "1D").toUpperCase();

  if (!PERIOD_PARAMS[period]) {
    return res.status(400).json({ error: `Invalid period. Use: ${Object.keys(PERIOD_PARAMS).join(", ")}` });
  }

  const cacheKey = `${symbol}_${period}`;
  const cached   = _historyCache.get(cacheKey);
  if (cached && Date.now() - cached.ts < CACHE_TTL[period]) {
    console.log(`[History] Cache hit: ${cacheKey}`);
    return res.json(cached.data);
  }

  try {
    console.log(`[History] Fetching ${symbol} ${period} from Yahoo...`);
    const data = await fetchYahooHistory(symbol, period);
    _historyCache.set(cacheKey, { data, ts: Date.now() });
    res.json(data);
  } catch (err) {
    console.error(`[History] Failed ${symbol} ${period}:`, err.message);
    // Return cached stale data if available
    if (cached) {
      console.log(`[History] Returning stale cache for ${cacheKey}`);
      return res.json(cached.data);
    }
    res.status(500).json({ error: "Failed to fetch history", detail: err.message });
  }
});

export default router;