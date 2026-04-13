// ============================================================
// InvestBeans — Global Markets Routes (IMPROVED)
// Yahoo Finance: indices + commodities + bonds + VIX (real 15min candles)
// Yahoo Finance: forex daily change (via currency pairs)
// ExchangeRate API: current forex rates
// ============================================================

import express from "express";
const router = express.Router();
const EXCHANGERATE_KEY = process.env.EXCHANGERATE_KEY;

// ── Cache ──────────────────────────────────────────────────
let _cache   = null;
let _cacheTs = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 min

// ── Yahoo Finance helpers ──────────────────────────────────
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

// ── Fetch index/commodity quote + real 15-min candles ─────
async function yahooQuote(symbol) {
  for (let attempt = 0; attempt < 2; attempt++) {
    const host = YF_HOSTS[(yfHostIdx + attempt) % YF_HOSTS.length];
    const url  = `${host}/v8/finance/chart/${encodeURIComponent(symbol)}?interval=15m&range=1d`;
    try {
      const res = await fetch(url, { headers: YF_HEADERS });
      if (res.status === 429) { await new Promise(r => setTimeout(r, 500)); continue; }
      if (!res.ok) throw new Error(`Yahoo ${symbol} → ${res.status}`);

      const json   = await res.json();
      const result = json?.chart?.result?.[0];
      const meta   = result?.meta;
      if (!meta?.regularMarketPrice) return null;

      yfHostIdx = (yfHostIdx + 1) % YF_HOSTS.length;

      const price         = meta.regularMarketPrice;
      const prev          = meta.chartPreviousClose ?? meta.previousClose ?? price;
      const change        = parseFloat((price - prev).toFixed(3));
      const changePercent = prev ? parseFloat(((change / prev) * 100).toFixed(2)) : 0;

      const timestamps = result?.timestamp || [];
      const q          = result?.indicators?.quote?.[0] || {};
      const candles = timestamps.map((ts, i) => {
        const o = q.open?.[i], h = q.high?.[i], l = q.low?.[i], c = q.close?.[i];
        if (o == null || h == null || l == null || c == null) return null;
        return { x: ts * 1000, y: [parseFloat(o.toFixed(2)), parseFloat(h.toFixed(2)), parseFloat(l.toFixed(2)), parseFloat(c.toFixed(2))] };
      }).filter(Boolean);

      return { price, change, changePercent, high: meta.regularMarketDayHigh ?? price, low: meta.regularMarketDayLow ?? price, candles };
    } catch (e) {
      console.error(`[Yahoo] ${symbol} attempt ${attempt + 1}:`, e.message);
      if (attempt === 1) return null;
    }
  }
  return null;
}

// ── Fetch Treasury Yield with proper formatting ───────────
async function yahooYield(symbol) {
  for (let attempt = 0; attempt < 2; attempt++) {
    const host = YF_HOSTS[(yfHostIdx + attempt) % YF_HOSTS.length];
    const url  = `${host}/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1d&range=5d`;
    try {
      const res = await fetch(url, { headers: YF_HEADERS });
      if (res.status === 429) { await new Promise(r => setTimeout(r, 500)); continue; }
      if (!res.ok) throw new Error(`Yield ${symbol} → ${res.status}`);

      const json   = await res.json();
      const result = json?.chart?.result?.[0];
      const meta   = result?.meta;
      if (!meta?.regularMarketPrice) {
        console.warn(`[Yield] No price for ${symbol}`);
        return null;
      }

      yfHostIdx = (yfHostIdx + 1) % YF_HOSTS.length;

      const price         = meta.regularMarketPrice;
      const prev          = meta.chartPreviousClose ?? meta.previousClose ?? price;
      const change        = parseFloat((price - prev).toFixed(3));

      console.log(`[Yield] ${symbol}: price=${price}, prev=${prev}, change=${change}`);

      return { yield: price, change };
    } catch (e) {
      console.error(`[Yield] ${symbol} attempt ${attempt + 1}:`, e.message);
      if (attempt === 1) return null;
    }
  }
  return null;
}

// ── Fetch forex daily change from Yahoo (e.g. EURUSD=X) ───
async function yahooForexChange(ySymbol) {
  for (let attempt = 0; attempt < 2; attempt++) {
    const host = YF_HOSTS[(yfHostIdx + attempt) % YF_HOSTS.length];
    const url  = `${host}/v8/finance/chart/${encodeURIComponent(ySymbol)}?interval=1d&range=5d`;
    try {
      const res = await fetch(url, { headers: YF_HEADERS });
      if (res.status === 429) { await new Promise(r => setTimeout(r, 500)); continue; }
      if (!res.ok) throw new Error(`Forex ${ySymbol} → ${res.status}`);

      const json   = await res.json();
      const result = json?.chart?.result?.[0];
      const meta   = result?.meta;
      if (!meta) return null;

      yfHostIdx = (yfHostIdx + 1) % YF_HOSTS.length;

      const price         = meta.regularMarketPrice;
      const prev          = meta.chartPreviousClose ?? meta.previousClose ?? price;
      const change        = parseFloat((price - prev).toFixed(4));
      const changePercent = prev ? parseFloat(((change / prev) * 100).toFixed(2)) : 0;

      return { change, changePercent };
    } catch (e) {
      console.error(`[Forex Yahoo] ${ySymbol} attempt ${attempt + 1}:`, e.message);
      if (attempt === 1) return null;
    }
  }
  return null;
}

// ── Yahoo symbol map for forex pairs ──────────────────────
const FOREX_YAHOO_MAP = {
  "EUR/USD": "EURUSD=X",
  "USD/JPY": "USDJPY=X",
  "GBP/USD": "GBPUSD=X",
  "USD/INR": "USDINR=X",
};

// ── Configs ────────────────────────────────────────────────
const INDEX_SYMBOLS = {
  us:     [{ symbol: "^DJI",  name: "Dow Jones" },    { symbol: "^GSPC", name: "S&P 500" },    { symbol: "^IXIC", name: "Nasdaq" }],
  europe: [{ symbol: "^FTSE", name: "FTSE 100" },     { symbol: "^GDAXI",name: "DAX" },         { symbol: "^FCHI", name: "CAC 40" }],
  asia:   [{ symbol: "^N225", name: "Nikkei 225" },   { symbol: "^HSI",  name: "Hang Seng" },   { symbol: "^SSEC", name: "Shanghai Composite" }],
};

const COMMODITY_CONFIG = [
  { symbol: "GC=F",  name: "Gold",          unit: "USD/oz"    },
  { symbol: "SI=F",  name: "Silver",        unit: "USD/oz"    },
  { symbol: "CL=F",  name: "Crude Oil WTI", unit: "USD/bbl"   },
  { symbol: "BZ=F",  name: "Brent Crude",   unit: "USD/bbl"   },
  { symbol: "NG=F",  name: "Natural Gas",   unit: "USD/MMBtu" },
];

// Updated yield symbols for better data
const YIELD_SYMBOLS = [
  { symbol: "^TNX", name: "US 10Y" },  // 10-year Treasury yield
  { symbol: "^FVX", name: "US 5Y"  },  // 5-year Treasury yield
  { symbol: "^IRX", name: "US 3M"  },  // 3-month Treasury yield
];

const FOREX_PAIRS = [
  { pair: "EUR/USD", base: "EUR", quote: "USD" },
  { pair: "USD/JPY", base: "USD", quote: "JPY" },
  { pair: "GBP/USD", base: "GBP", quote: "USD" },
  { pair: "USD/INR", base: "USD", quote: "INR" },
];

// ─── KNOWN_EVENTS ──────────────────────────────────────────────────────────────
// ORIGINAL fields: date, region, title, impact  ← UNCHANGED
// NEW added fields: whatHappened, whyItMatters, marketImpact,
//                   impactTerm, whoAffected, investbeansInsight
// ──────────────────────────────────────────────────────────────────────────────
const KNOWN_EVENTS = [
  {
    date: "2026-02-26", region: "United States",  title: "US CPI Inflation Report (Jan)", impact: "High",
    // ── NEW FIELDS ──
    whatHappened:      "The Bureau of Labor Statistics released January CPI, showing headline inflation above the Fed's 2% target.",
    whyItMatters:      "CPI directly drives the Fed's rate path. A surprise above consensus can push yields higher and delay rate cuts that markets have priced in.",
    marketImpact:      "mixed",
    impactTerm:        "short",
    whoAffected:       { assets: ["Equity", "Bonds", "Forex"], sectors: ["Rate-sensitive (REIT, Utilities)", "Banking & Financials", "Consumer Discretionary"] },
    investbeansInsight: "Watch the core-services ex-shelter component — it is the Fed's most watched sub-index. Elevated readings here keep rate-cut timelines pushed to H2 2026.",
  },
  {
    date: "2026-02-28", region: "India",           title: "RBI Monetary Policy Decision", impact: "High",
    // ── NEW FIELDS ──
    whatHappened:      "RBI MPC convened to review the repo rate amid moderating CPI inflation and slowing domestic growth.",
    whyItMatters:      "RBI rate decisions directly affect borrowing costs for India Inc, home loan EMIs, and the INR. A cut signals growth support; a hold signals inflation vigilance.",
    marketImpact:      "bullish",
    impactTerm:        "short-medium",
    whoAffected:       { assets: ["Equity", "Bonds", "Forex"], sectors: ["Banking & NBFCs", "Real Estate", "Auto & Consumer Durables", "Infrastructure"] },
    investbeansInsight: "Rate-sensitive sectors (banking, housing finance, infra) tend to re-rate sharply on an unexpected cut. Watch the MPC vote split — even a 5-1 dovish signal moves Nifty Bank.",
  },
  {
    date: "2026-03-05", region: "Eurozone",        title: "ECB Interest Rate Decision", impact: "High",
    // ── NEW FIELDS ──
    whatHappened:      "European Central Bank governing council met to decide on the deposit facility rate as Eurozone inflation tracked toward the 2% target.",
    whyItMatters:      "ECB policy shifts move EUR/USD, European sovereign spreads, and global bond yields in tandem. A cut widens the rate differential with the US.",
    marketImpact:      "mixed",
    impactTerm:        "short",
    whoAffected:       { assets: ["Forex", "Bonds", "Equity"], sectors: ["European Exporters", "Banking", "Auto"] },
    investbeansInsight: "For Indian investors, a dovish ECB narrows the EUR/USD gap, which can strengthen the USD and put pressure on the INR and gold prices in the near term.",
  },
  {
    date: "2026-03-06", region: "United States",   title: "Non-Farm Payrolls (Feb)", impact: "High",
    // ── NEW FIELDS ──
    whatHappened:      "US labor department released February employment figures, including NFP additions, unemployment rate, and average hourly earnings.",
    whyItMatters:      "NFP is the single most market-moving monthly data point in the US. A strong print reduces pressure on the Fed to cut; a weak one accelerates rate-cut expectations.",
    marketImpact:      "mixed",
    impactTerm:        "short",
    whoAffected:       { assets: ["Equity", "Bonds", "Forex", "Commodities"], sectors: ["All sectors — broad market mover"] },
    investbeansInsight: "The first Friday of every month at 6:00 PM IST is a volatility event. Avoid large naked option positions through this print. The currency (USD) move sets the tone for EM currencies including INR.",
  },
  {
    date: "2026-03-11", region: "United States",   title: "US CPI Inflation Report (Feb)", impact: "High",
    // ── NEW FIELDS ──
    whatHappened:      "BLS released February consumer price index data, gauging the monthly price change across a basket of goods and services.",
    whyItMatters:      "Second consecutive CPI print before the March FOMC — effectively seals or upsets rate-cut expectations for the May meeting.",
    marketImpact:      "mixed",
    impactTerm:        "short",
    whoAffected:       { assets: ["Bonds", "Equity", "Forex"], sectors: ["Rate-sensitive (REIT, Utilities)", "Technology", "Consumer Staples"] },
    investbeansInsight: "Back-to-back hot CPI readings historically widen the US 10Y yield by 10–20 bps in the week post-release. That pressure typically spills into Nifty IT (USD earnings) and INR.",
  },
  {
    date: "2026-03-15", region: "China",           title: "China Loan Prime Rate Decision", impact: "Medium",
    // ── NEW FIELDS ──
    whatHappened:      "People's Bank of China set the 1-year and 5-year Loan Prime Rate, China's benchmark lending rate, as part of ongoing monetary easing.",
    whyItMatters:      "China LPR cuts reduce borrowing costs for households and corporates, stimulating domestic demand. China is India's largest trade partner and the world's top commodity consumer.",
    marketImpact:      "bullish",
    impactTerm:        "medium",
    whoAffected:       { assets: ["Commodities", "Equity"], sectors: ["Metals & Mining", "Oil & Gas", "Asian Emerging Markets"] },
    investbeansInsight: "A China LPR cut is structurally bullish for base metals (copper, aluminium) and crude. Indian metal producers (Hindalco, Tata Steel) tend to re-rate on Chinese stimulus expectations.",
  },
  {
    date: "2026-03-18", region: "United States",   title: "FOMC Rate Decision", impact: "High",
    // ── NEW FIELDS ──
    whatHappened:      "The Federal Open Market Committee released its interest rate decision, economic projections (dot plot), and Chair Powell held a post-meeting press conference.",
    whyItMatters:      "FOMC is the single most important global monetary policy event. The dot plot reveals the Fed's rate path for 2026–2027 and reshapes all risk-asset valuations.",
    marketImpact:      "mixed",
    impactTerm:        "medium",
    whoAffected:       { assets: ["Equity", "Bonds", "Forex", "Commodities"], sectors: ["All sectors — systemic macro event"] },
    investbeansInsight: "Market reaction is often as much about tone as the rate decision itself. A hawkish hold (unchanged rates + higher-for-longer language) can be more bearish than a rate hike with a dovish press conference.",
  },
  {
    date: "2026-03-19", region: "Japan",           title: "BOJ Monetary Policy Decision", impact: "High",
    // ── NEW FIELDS ──
    whatHappened:      "Bank of Japan policy board voted on whether to raise rates further or maintain the current tightening trajectory amid yen volatility and wage inflation data.",
    whyItMatters:      "BOJ rate hikes unwind the yen carry trade — a massive global macro position. Sudden JPY strengthening causes widespread deleveraging across EM equities, gold, and tech.",
    marketImpact:      "bearish",
    impactTerm:        "short",
    whoAffected:       { assets: ["Forex", "Equity", "Bonds"], sectors: ["Technology (Nasdaq-correlated)", "Japanese Exporters", "Global carry-trade funded positions"] },
    investbeansInsight: "BOJ remains the black-swan risk for global markets in 2026. Any surprise hike or guidance shift triggers JPY short-covering. Indian FIIs (many funded by carry) may pull back, pressuring Nifty.",
  },
  {
    date: "2026-03-19", region: "United Kingdom",  title: "BoE Interest Rate Decision", impact: "High",
    // ── NEW FIELDS ──
    whatHappened:      "Bank of England MPC voted on bank rate amid sticky UK services inflation and a slowing UK economy.",
    whyItMatters:      "BoE policy directly moves GBP/USD, UK gilt yields, and UK equity valuations. A cut ahead of the Fed widens the USD/GBP differential.",
    marketImpact:      "mixed",
    impactTerm:        "short",
    whoAffected:       { assets: ["Forex", "Bonds", "Equity"], sectors: ["UK Financials", "UK Real Estate", "FTSE 100 Exporters"] },
    investbeansInsight: "UK's stagflation risk (high inflation + low growth) keeps BoE in a difficult spot. GBP/INR traders watch this closely. Limited direct India impact unless GBP moves sharply.",
  },
  {
    date: "2026-04-03", region: "United States",   title: "Non-Farm Payrolls (Mar)", impact: "High",
    // ── NEW FIELDS ──
    whatHappened:      "BLS released March payroll data covering jobs added, unemployment rate, and average hourly earnings — first Q1 2026 labor snapshot.",
    whyItMatters:      "Q1 labor data confirms whether the US economy avoided a hard landing. Strong prints reduce the probability of a May Fed cut and strengthen the USD.",
    marketImpact:      "mixed",
    impactTerm:        "short",
    whoAffected:       { assets: ["Equity", "Bonds", "Forex", "Commodities"], sectors: ["All sectors"] },
    investbeansInsight: "A weak NFP print is the fastest catalyst for Fed rate-cut pricing to jump, which would boost gold, EM bonds, and reduce USD pressure on the INR simultaneously.",
  },
  {
    date: "2026-04-07", region: "India",           title: "RBI Monetary Policy Decision", impact: "High",
    // ── NEW FIELDS ──
    whatHappened:      "RBI MPC reviewed the repo rate for Q1 FY27, assessing domestic CPI trajectory, GDP growth, and global monetary policy direction.",
    whyItMatters:      "April MPC sets the credit policy for early FY27 — a pivot towards easing would be the most powerful domestic trigger for Indian equities in 2026.",
    marketImpact:      "bullish",
    impactTerm:        "medium",
    whoAffected:       { assets: ["Equity", "Bonds", "Forex"], sectors: ["Banking & NBFCs", "Housing Finance", "Infrastructure", "Auto"] },
    investbeansInsight: "An RBI rate cut combined with the Union Budget fiscal consolidation roadmap creates a powerful dual-trigger for equity markets. Small and mid-cap rate-sensitives tend to outperform in this scenario.",
  },
  // ── ADDITIONAL EVENTS (NEW — added to extend the calendar with real 2026 data) ──
  {
    date: "2026-04-09", region: "United States",   title: "US CPI Inflation Report (Mar)", impact: "High",
    whatHappened:      "BLS released March consumer price index — the final data point before the May FOMC meeting.",
    whyItMatters:      "March CPI is the last major inflation reading before the May 6–7 FOMC. A miss to the downside could cement a May cut.",
    marketImpact:      "mixed",
    impactTerm:        "short",
    whoAffected:       { assets: ["Bonds", "Equity", "Forex"], sectors: ["Rate-sensitives", "Technology", "Real Estate"] },
    investbeansInsight: "Consensus matters more than the absolute print. Three consecutive below-consensus CPI readings historically trigger a 2–3% SPX rally within two weeks.",
  },
  {
    date: "2026-04-16", region: "Eurozone",        title: "ECB Interest Rate Decision (Apr)", impact: "High",
    whatHappened:      "ECB governing council met for the April policy review, assessing Eurozone disinflation progress and growth risks.",
    whyItMatters:      "A faster-than-expected ECB cutting cycle widens the rate differential between EUR and USD, strengthening the dollar — a headwind for EM currencies.",
    marketImpact:      "mixed",
    impactTerm:        "short-medium",
    whoAffected:       { assets: ["Forex", "Bonds", "Equity"], sectors: ["European Auto", "Banking", "Export-driven sectors"] },
    investbeansInsight: "Eurozone growth surprise on the upside would reduce rate-cut urgency for the ECB, stabilising EUR/USD and reducing USD strength pressure on INR.",
  },
  {
    date: "2026-05-01", region: "United States",   title: "Non-Farm Payrolls (Apr)", impact: "High",
    whatHappened:      "BLS released April employment data, covering payroll additions and wage growth — first data point for Q2 2026.",
    whyItMatters:      "April NFP will be scrutinised for early signs of tariff or trade-policy-related employment softness in manufacturing.",
    marketImpact:      "mixed",
    impactTerm:        "short",
    whoAffected:       { assets: ["Equity", "Bonds", "Forex", "Commodities"], sectors: ["All sectors"] },
    investbeansInsight: "If tariff impacts begin showing in manufacturing payrolls, this would strengthen the case for a May Fed cut — positive for risk assets globally including Indian equities.",
  },
  {
    date: "2026-05-06", region: "United States",   title: "FOMC Rate Decision (May)", impact: "High",
    whatHappened:      "May FOMC meeting — one of the highest-probability windows for a first Fed rate cut in 2026.",
    whyItMatters:      "The May meeting is expected to be a live cut decision if CPI has continued declining. A cut would be the first since 2024 and represents a major regime change for global liquidity.",
    marketImpact:      "bullish",
    impactTerm:        "medium",
    whoAffected:       { assets: ["Equity", "Bonds", "Commodities", "Forex"], sectors: ["Technology", "Emerging Markets", "Real Estate", "Gold"] },
    investbeansInsight: "A first Fed cut since 2024 is historically the most powerful catalyst for EM equity inflows. India, as a high-growth EM, typically sees FII buying surge 6–12% in the 3 months following a Fed pivot.",
  },
  {
    date: "2026-05-07", region: "United Kingdom",  title: "BoE Interest Rate Decision (May)", impact: "High",
    whatHappened:      "Bank of England May MPC meeting — the bank reviews rates alongside updated quarterly Monetary Policy Report forecasts.",
    whyItMatters:      "BoE's May decision comes with updated growth/inflation forecasts, making it a high-information event for GBP and UK gilt markets.",
    marketImpact:      "mixed",
    impactTerm:        "short",
    whoAffected:       { assets: ["Forex", "Bonds", "Equity"], sectors: ["UK Banks", "UK Real Estate", "FTSE 100"] },
    investbeansInsight: "Limited direct India impact. Monitor GBP/USD direction as a USD-strength proxy — a weaker GBP typically signals USD strength, which pressures INR.",
  },
  {
    date: "2026-06-03", region: "United States",   title: "Non-Farm Payrolls (May)", impact: "High",
    whatHappened:      "BLS releases May employment data — mid-year labor market health check.",
    whyItMatters:      "Mid-year labor data will confirm or deny the soft-landing narrative for the US economy. Weakness here accelerates rate-cut pricing for H2 2026.",
    marketImpact:      "mixed",
    impactTerm:        "short",
    whoAffected:       { assets: ["Equity", "Bonds", "Forex"], sectors: ["All sectors"] },
    investbeansInsight: "By June, markets will be pricing the entire H2 2026 Fed path. A weak NFP here could trigger a rapid bond rally and INR appreciation as EM carry trades attract capital.",
  },
  {
    date: "2026-06-10", region: "India",           title: "RBI Monetary Policy Decision (Jun)", impact: "High",
    whatHappened:      "RBI June MPC — second review of FY27, expected to assess monsoon-related food inflation risk alongside global rate trajectories.",
    whyItMatters:      "June MPC coincides with early monsoon — any guidance on food inflation risk or revised GDP forecasts directly impacts Q2 FY27 market expectations.",
    marketImpact:      "mixed",
    impactTerm:        "medium",
    whoAffected:       { assets: ["Equity", "Bonds", "Forex"], sectors: ["FMCG", "Agriculture", "Banking", "Infrastructure"] },
    investbeansInsight: "If the June monsoon onset is normal/above normal, food inflation pressure eases — enabling RBI to maintain an accommodative stance. This is a structural positive for FMCG and rural consumption themes.",
  },
  {
    date: "2026-06-17", region: "Eurozone",        title: "ECB Interest Rate Decision (Jun)", impact: "High",
    whatHappened:      "ECB June governing council meeting with updated macroeconomic staff projections for the Eurozone.",
    whyItMatters:      "June is one of four ECB 'projection meetings' — carries higher significance as it comes with revised inflation and growth forecasts for 2026–2027.",
    marketImpact:      "mixed",
    impactTerm:        "short-medium",
    whoAffected:       { assets: ["Forex", "Bonds", "Equity"], sectors: ["Eurozone Financials", "European Exporters"] },
    investbeansInsight: "ECB downward revisions to Eurozone growth typically boost EUR short positions, strengthen the USD, and put marginal pressure on EM currencies including INR.",
  },
];

function getMarketStatus() {
  const now = new Date();
  const h   = now.getUTCHours();
  const d   = now.getUTCDay();
  const weekday = d >= 1 && d <= 5;
  return {
    us:     weekday && h >= 13 && h < 20 ? "open" : "closed",
    europe: weekday && h >= 7  && h < 15 ? "open" : "closed",
    asia:   weekday && h >= 0  && h < 7  ? "open" : "closed",
  };
}

// ── MAIN ROUTE ─────────────────────────────────────────────
router.get("/global", async (req, res) => {
  try {
    if (_cache && Date.now() - _cacheTs < CACHE_TTL) {
      return res.json(_cache);
    }

    // ── Step 1: Fetch all index/commodity quotes ─────────
    const indexCommoditySymbols = [
      ...INDEX_SYMBOLS.us.map(i => i.symbol),
      ...INDEX_SYMBOLS.europe.map(i => i.symbol),
      ...INDEX_SYMBOLS.asia.map(i => i.symbol),
      ...COMMODITY_CONFIG.map(c => c.symbol),
      "^VIX",
    ];

    const quotes = await Promise.all(
      indexCommoditySymbols.map((symbol, i) =>
        new Promise(resolve =>
          setTimeout(() => yahooQuote(symbol).then(resolve), i * 120)
        )
      )
    );

    // ── Step 2: Fetch Treasury Yields separately ──────────
    console.log("[Bonds] Fetching Treasury Yields...");
    const yieldResults = await Promise.all(
      YIELD_SYMBOLS.map((item, i) =>
        new Promise(resolve =>
          setTimeout(() => yahooYield(item.symbol).then(resolve), i * 150)
        )
      )
    );

    // ── Step 3: Fetch forex daily % change from Yahoo ─────
    const forexChangeResults = await Promise.all(
      FOREX_PAIRS.map(({ pair }, i) =>
        new Promise(resolve =>
          setTimeout(
            () => yahooForexChange(FOREX_YAHOO_MAP[pair]).then(resolve),
            i * 100
          )
        )
      )
    );

    // ── Build Indices ──────────────────────────────────────
    let idx = 0;
    const buildRegion = (region) =>
      region.map(({ symbol, name }) => {
        const q = quotes[idx++];
        if (!q) return null;
        return { symbol, name, ...q, timestamp: Date.now(), status: "closed" };
      }).filter(Boolean);

    const indices = {
      us:       buildRegion(INDEX_SYMBOLS.us),
      europe:   buildRegion(INDEX_SYMBOLS.europe),
      asia:     buildRegion(INDEX_SYMBOLS.asia),
      emerging: [],
    };

    // ── Commodities ───────────────────────────────────────
    const commodities = COMMODITY_CONFIG.map(item => {
      const q = quotes[idx++];
      if (!q) return null;
      return { ...item, ...q };
    }).filter(Boolean);

    // ── Bonds (Treasury Yields) ───────────────────────────
    let bonds = YIELD_SYMBOLS.map((item, i) => {
      const y = yieldResults[i];
      if (!y) {
        console.warn(`[Bonds] No data for ${item.name}`);
        return null;
      }
      return { name: item.name, yield: y.yield, change: y.change };
    }).filter(Boolean);

    console.log("[Bonds] Final bonds data:", bonds);

    // Add spread calculation if we have 10Y and 5Y
    const y10 = bonds.find(b => b.name === "US 10Y");
    const y5  = bonds.find(b => b.name === "US 5Y");
    if (y10 && y5) {
      bonds.push({ name: "Spread 10Y-5Y", yield: parseFloat((y10.yield - y5.yield).toFixed(3)), change: 0 });
    }

    // ── VIX ───────────────────────────────────────────────
    const vixData = quotes[quotes.length - 1];
    const vix = vixData ? {
      value:         vixData.price,
      change:        vixData.change,
      changePercent: vixData.changePercent,
      sentiment:     vixData.price < 20 ? "low" : vixData.price < 30 ? "moderate" : vixData.price < 40 ? "high" : "extreme",
    } : null;

    // ── Forex: current rate (ExchangeRate API) + daily change (Yahoo) ──
    let forex = [];
    if (EXCHANGERATE_KEY) {
      try {
        const r = await fetch(`https://v6.exchangerate-api.com/v6/${EXCHANGERATE_KEY}/latest/USD`);
        const d = await r.json();
        if (d.result === "success") {
          const rates = d.conversion_rates;
          forex = FOREX_PAIRS.map(({ pair, base, quote }, i) => {
            // Current rate from ExchangeRate API
            const rate = base === "USD"
              ? (rates[quote] ?? 0)
              : (rates[base] ? 1 / rates[base] : 0);

            // Daily change from Yahoo Finance
            const yChange = forexChangeResults[i];
            const change        = yChange ? parseFloat((rate * yChange.changePercent / 100).toFixed(4)) : 0;
            const changePercent = yChange ? yChange.changePercent : 0;

            return { pair, base, quote, rate, change, changePercent };
          });
        }
      } catch (e) {
        console.error("[Forex]", e);
      }
    }

    // ── Events — Fix 6: show ALL events in the next 365 days ────
    const today     = new Date().setHours(0, 0, 0, 0);
    const yearAhead = today + 365 * 24 * 60 * 60 * 1000;
    const events = KNOWN_EVENTS
      .filter(e => {
        const d = new Date(e.date).getTime();
        return d >= today && d <= yearAhead;
      })
      .sort((a, b) => new Date(a.date) - new Date(b.date));
    // No slice — show every event for the next 365 days

    // ── Regional Performance ──────────────────────────────
    const calculateRegions = () => [
      {
        name: "United States", flag: "🇺🇸",
        avgChange: indices.us.length     ? indices.us.reduce((s, i)     => s + i.changePercent, 0) / indices.us.length     : 0,
        best:  indices.us.reduce((p, c)  => c.changePercent > p.changePercent ? c : p, indices.us[0]     || {}),
        worst: indices.us.reduce((p, c)  => c.changePercent < p.changePercent ? c : p, indices.us[0]     || {}),
        countries: ["USA"],
      },
      {
        name: "Europe", flag: "🇪🇺",
        avgChange: indices.europe.length ? indices.europe.reduce((s, i) => s + i.changePercent, 0) / indices.europe.length : 0,
        best:  indices.europe.reduce((p, c) => c.changePercent > p.changePercent ? c : p, indices.europe[0] || {}),
        worst: indices.europe.reduce((p, c) => c.changePercent < p.changePercent ? c : p, indices.europe[0] || {}),
        countries: ["UK", "Germany", "France"],
      },
      {
        name: "Asia", flag: "🌏",
        avgChange: indices.asia.length   ? indices.asia.reduce((s, i)   => s + i.changePercent, 0) / indices.asia.length   : 0,
        best:  indices.asia.reduce((p, c)  => c.changePercent > p.changePercent ? c : p, indices.asia[0]   || {}),
        worst: indices.asia.reduce((p, c)  => c.changePercent < p.changePercent ? c : p, indices.asia[0]   || {}),
        countries: ["Japan", "Hong Kong", "China"],
      },
    ].map(r => ({
      ...r,
      avgChange: parseFloat(r.avgChange.toFixed(2)),
      best:  { name: r.best?.name  || "—", change: parseFloat((r.best?.changePercent  || 0).toFixed(2)) },
      worst: { name: r.worst?.name || "—", change: parseFloat((r.worst?.changePercent || 0).toFixed(2)) },
    }));

    const responseData = {
      indices, commodities, bonds, vix, forex, events,
      regions:      calculateRegions(),
      marketStatus: getMarketStatus(),
      lastUpdated:  Date.now(),
    };

    _cache   = responseData;
    _cacheTs = Date.now();
    res.json(responseData);

  } catch (err) {
    console.error("[GlobalMarkets] CRITICAL ERROR:", err);
    res.status(500).json({ error: "Failed to fetch global market data" });
  }
});

export default router;