
import CleanChart from "@/components/CleanChart";
import { IndexQuote } from "@/services/globalMarkets/types";
import {
  TrendingUp, TrendingDown, Globe, Clock, AlertTriangle,
  AlertCircle, RefreshCw, ExternalLink,
} from "lucide-react";
import { useState, useCallback, useEffect, useRef } from "react";
import { useTheme } from "@/controllers/Themecontext";

const API_BASE = (import.meta.env.VITE_API_URL as string) || "http://localhost:8000";

const PERIODS = ["1D","5D","1M","6M","YTD","1Y","5Y","MAX"] as const;
type Period = typeof PERIODS[number];
const JAPAN_HOLIDAYS_2026 = [
    "2026-01-01","2026-01-12","2026-02-11","2026-02-23",
    "2026-03-20","2026-04-29","2026-05-03","2026-05-04",
    "2026-05-05","2026-05-06","2026-07-20","2026-08-11",
    "2026-09-21","2026-09-22","2026-09-23","2026-10-12",
    "2026-11-03","2026-11-23","2026-12-23",
    // 2025 holidays bhi add karo
    "2025-01-01","2025-02-11","2025-03-20","2025-04-29",
    "2025-05-03","2025-05-04","2025-05-05","2025-05-06",
  ];

// ── IST timings per symbol (from user-provided reference) ────────
// Note: All Asia timings are fixed (no DST in Japan/HK/China/India)
const ASIA_IST_TIMINGS: Record<string, { open: string; close: string; note?: string; flag: string; label: string }> = {
  "^N225":      { open: "5:30 AM IST", close: "12:00 PM IST",  flag: "🇯🇵", label: "Nikkei 225 (TSE)" },
  "^HSI":       { open: "7:00 AM IST", close: "1:30 PM IST",   flag: "🇭🇰", label: "Hang Seng (HKEX)" },
  "000001.SS":  { open: "6:30 AM IST",  close: "12:30 PM IST", note: "incl. lunch break",   flag: "🇨🇳", label: "Shanghai (SSE)" },
  "^NSEI":      { open: "9:15 AM IST",  close: "3:30 PM IST",  note: "no DST",              flag: "🇮🇳", label: "Nifty 50 (NSE)" },
  "^BSESN":     { open: "9:15 AM IST",  close: "3:30 PM IST",  note: "no DST",              flag: "🇮🇳", label: "Sensex (BSE)" },
};

// ── Default fallback for unknown Asia symbols ─────────────────────
const ASIA_DEFAULT = { open: "5:30 AM IST", close: "3:30 PM IST", flag: "🌏", label: "Asia Pacific" };

// ── Per-symbol timezone map ───────────────────────────────────────
const SYMBOL_TZ: Record<string, string> = {
  "^N225":     "Asia/Tokyo",
  "^HSI":      "Asia/Hong_Kong",
  "000001.SS": "Asia/Shanghai",
  "^NSEI":     "Asia/Kolkata",
  "^BSESN":    "Asia/Kolkata",
};

// ── DST-aware UTC offset helper ───────────────────────────────────
function getUTCOffset(ianaZone: string): number {
  const now = new Date();
  const toMins = (s: string) => {
    const p = s.split(":"); return parseInt(p[0]) * 60 + parseInt(p[1] ?? "0");
  };
  const fmt = (tz: string) =>
    new Intl.DateTimeFormat("en-US", { timeZone: tz, hour: "numeric", minute: "numeric", hour12: false }).format(now);
  let diff = toMins(fmt(ianaZone)) - toMins(fmt("UTC"));
  if (diff > 720) diff -= 1440;
  if (diff < -720) diff += 1440;
  return diff / 60;
}

// ── Check if a specific Asia market is open ───────────────────────
function isAsiaMarketOpen(symbol: string): "open" | "pre" | "closed" {
  const tzMap: Record<string, { tz: string; openH: number; openM: number; closeH: number; closeM: number }> = {
    "^N225":     { tz: "Asia/Tokyo",     openH: 9,  openM: 0,  closeH: 15, closeM: 30 },
    "^HSI":      { tz: "Asia/Hong_Kong", openH: 9,  openM: 30, closeH: 16, closeM: 0  },
    "000001.SS": { tz: "Asia/Shanghai",  openH: 9,  openM: 30, closeH: 15, closeM: 0  },
    "^NSEI":     { tz: "Asia/Kolkata",   openH: 9,  openM: 15, closeH: 15, closeM: 30 },
    "^BSESN":    { tz: "Asia/Kolkata",   openH: 9,  openM: 15, closeH: 15, closeM: 30 },
  };
  if (symbol === "^N225") {
    const today = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Tokyo" }); // YYYY-MM-DD
    if (JAPAN_HOLIDAYS_2026.includes(today)) return "closed";
  }
  const cfg = tzMap[symbol];
  if (!cfg) return "closed";
  const now = new Date();
  const fmt = new Intl.DateTimeFormat("en-US", {
    timeZone: cfg.tz, hour: "2-digit", minute: "2-digit",
    hour12: false, weekday: "short",
  }).formatToParts(now);
  const weekday = fmt.find(p => p.type === "weekday")?.value ?? "";
  if (weekday === "Sat" || weekday === "Sun") return "closed";
  const h  = parseInt(fmt.find(p => p.type === "hour")?.value   ?? "0");
  const mn = parseInt(fmt.find(p => p.type === "minute")?.value ?? "0");
  const mins = h * 60 + mn;
  const openMin  = cfg.openH  * 60 + cfg.openM;
  const closeMin = cfg.closeH * 60 + cfg.closeM;
  if (mins >= openMin && mins < closeMin) return "open";
  if (mins >= openMin - 30 && mins < openMin) return "pre";
  return "closed";
}

// ── Theme helpers ─────────────────────────────────────────────────
const useIL = () => { const { theme } = useTheme(); return theme === "light"; };
const tx = {
  card:   (l: boolean) => l ? "bg-white border border-gray-100 shadow-sm" : "bg-[#0c1821] border border-[#1a2d3f]",
  t1:     (l: boolean) => l ? "text-gray-900"   : "text-[#e2ecf4]",
  t2:     (l: boolean) => l ? "text-gray-500"   : "text-[#5a7a92]",
  t3:     (l: boolean) => l ? "text-gray-400"   : "text-[#3d5f78]",
  header: (l: boolean) => l ? "bg-gray-50 border-gray-100" : "bg-[#081017] border-[#1a2d3f]",
};

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  const l = useIL();
  return <div className={`rounded-xl ${tx.card(l)} ${className}`}>{children}</div>;
}


// ══════════════════════════════════════════════════════════════════
// ASIA PACIFIC MARKETS CHART
// ══════════════════════════════════════════════════════════════════
interface AsiaPacificMarketsChartProps {
  markets:        IndexQuote[];
  onChart:        (sym: string, name: string) => void;
  autoSym?:       string;
  regionSummary?: React.ReactNode;
}

export function AsiaPacificMarketsChart({ markets, onChart, autoSym, regionSummary }: AsiaPacificMarketsChartProps) {
  const l = useIL();

  const [sel, setSel]                   = useState(0);
  const [period, setPeriod]             = useState<Period>("1D");
  const [chartCandles, setChartCandles] = useState<any[]>([]);
  const [chartLoading, setChartLoading] = useState(false);
  const [fetchError,   setFetchError]   = useState(false);
  const fetchIdRef = useRef(0);

  const [mktStatus, setMktStatus] = useState<"open"|"pre"|"closed">("closed");
  useEffect(() => {
    const sym = markets[sel]?.symbol ?? "";
    setMktStatus(isAsiaMarketOpen(sym));
    const t = setInterval(() => setMktStatus(isAsiaMarketOpen(markets[sel]?.symbol ?? "")), 60_000);
    return () => clearInterval(t);
  }, [sel, markets]);

  useEffect(() => {
    if (!autoSym) return;
    const idx = markets.findIndex(m => m.symbol === autoSym);
    if (idx >= 0) setSel(idx);
  }, [autoSym, markets]);

  useEffect(() => {
    setChartCandles(markets[sel]?.candles ?? []);
    setPeriod("1D");
  }, [sel]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchCandles = useCallback(async (symbol: string, p: Period) => {
    const id = ++fetchIdRef.current;
    setChartLoading(true); setFetchError(false);
    try {
      const res = await fetch(`${API_BASE}/markets/history/${encodeURIComponent(symbol)}?period=${p}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      if (id !== fetchIdRef.current) return;
      setChartCandles(json.candles ?? []);
    } catch (e) {
      if (id !== fetchIdRef.current) return;
      console.error(`[AsiaPacificMarketsChart] fetch failed ${symbol} ${p}:`, e);
      setFetchError(true);
    } finally {
      if (id === fetchIdRef.current) setChartLoading(false);
    }
  }, []);

  useEffect(() => {
    const sym = markets[sel]?.symbol;
    if (!sym) return;
    fetchCandles(sym, period);
  }, [sel, period, fetchCandles]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!markets.length) return (
    <Card className="py-10 text-center">
      <Globe className={`w-8 h-8 mx-auto mb-2 ${tx.t3(l)}`}/>
      <p className={`text-sm ${tx.t2(l)}`}>No Asia Pacific market data</p>
    </Card>
  );

  const s        = markets[sel];
  const isPos    = s.changePercent >= 0;
  const symTz    = SYMBOL_TZ[s.symbol] ?? "Asia/Tokyo";
  const timingInfo = ASIA_IST_TIMINGS[s.symbol] ?? ASIA_DEFAULT;

  const statusStyle = {
    open:   "bg-emerald-500/20 text-emerald-400 border-emerald-500/40",
    pre:    "bg-amber-500/20 text-amber-400 border-amber-500/40",
    closed: l ? "bg-gray-100 text-gray-600 border-gray-200" : "bg-white/10 text-[#8ab0cc] border-white/15",
  };
  const statusLabel = { open: "● OPEN", pre: "◐ PRE", closed: "CLOSED" };

  return (
    <div>
     

      {/* ── Market pill buttons ──────────────────────────────────── */}
      <div className="flex items-center gap-2 mb-4 overflow-x-auto pb-1 scrollbar-none -mx-1 px-1">
        {markets.map((m, i) => {
          const pos = m.changePercent >= 0, active = sel === i;
          return (
            <button key={m.symbol} onClick={() => setSel(i)}
              className={`px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all border shrink-0 ${
                active
                  ? "bg-[#0A3656] text-white border-transparent shadow-md"
                  : l ? "bg-white text-gray-600 border-gray-200 hover:border-gray-300"
                      : "bg-[#0a1826] text-[#5a7a92] border-[#1a2d3f] hover:border-[#2a4a62] hover:text-[#c0d8ea]"
              }`}>
              <span className="flex items-center gap-1.5">
                {(ASIA_IST_TIMINGS[m.symbol]?.flag ?? "🌏")} {m.name}
                <span className={`text-[10px] font-bold ${active ? "opacity-90" : pos ? "text-emerald-500" : "text-red-500"}`}>
                  {pos ? "+" : ""}{m.changePercent.toFixed(2)}%
                </span>
              </span>
            </button>
          );
        })}
      </div>

      {/* ── Chart card ──────────────────────────────────────────── */}
      <Card className="overflow-hidden">

        {/* ── Top bar ─────────────────────────────────────────────── */}
        <div className={`flex items-center justify-between px-4 py-2 border-b ${tx.header(l)} border-b`}>
          <div className="flex items-center gap-2 flex-wrap">
            <div className={`flex items-center gap-1 px-2 py-0.5 rounded-md border text-[9px] font-bold uppercase tracking-wide
              ${l ? "bg-amber-50 border-amber-200 text-amber-700" : "bg-amber-900/10 border-amber-700/30 text-amber-500"}`}>
              <AlertTriangle className="w-2.5 h-2.5"/>
              <span>Delayed 15 min</span>
            </div>
            <span className={`text-[9px] font-black px-2 py-0.5 rounded-full border uppercase tracking-wide ${statusStyle[mktStatus]}`}>
              {statusLabel[mktStatus]}
            </span>
            {/* <div className={`flex items-center gap-1 text-[9px] font-semibold ${tx.t3(l)}`}>
              <Clock className="w-2.5 h-2.5"/>
              <span>
                {timingInfo.flag} {timingInfo.label} — {timingInfo.open} – {timingInfo.close} IST
                {timingInfo.note && <span className={`ml-1 italic ${l ? "text-gray-400" : "text-[#3d5f78]"}`}>({timingInfo.note})</span>}
              </span>
            </div> */}
          </div>
          <button
            onClick={e => { e.stopPropagation(); onChart(s.symbol, s.name); }}
            className="flex items-center gap-1 text-[11px] font-bold text-[#0A3656] dark:text-[#74A8C9] hover:underline shrink-0">
            TradingView <ExternalLink className="w-3 h-3"/>
          </button>
        </div>

        {/* ── Chart area ────────────────────────────────────────── */}
        <div
          onClick={() => onChart(s.symbol, s.name)}
          className="cursor-pointer relative"
          title="Tap to open full TradingView chart"
        >
          {chartLoading && (
            <div className={`absolute inset-0 z-10 flex items-center justify-center rounded-b-xl
              ${l ? "bg-white/70" : "bg-[#07111b]/70"} backdrop-blur-[2px]`}>
              <div className="flex flex-col items-center gap-2">
                <RefreshCw className={`w-5 h-5 animate-spin ${l ? "text-[#0A3656]" : "text-[#74A8C9]"}`}/>
                <span className={`text-[10px] font-bold uppercase tracking-widest ${tx.t3(l)}`}>
                  Loading {period} chart…
                </span>
              </div>
            </div>
          )}
          {fetchError && !chartLoading && (
            <div className={`mx-4 mt-3 flex items-center gap-2 px-3 py-2 rounded-lg border text-[10px] font-semibold
              ${l ? "bg-red-50 border-red-200 text-red-700" : "bg-red-900/10 border-red-800/30 text-red-400"}`}>
              <AlertCircle className="w-3 h-3 shrink-0"/>
              Could not load {period} data — showing last available chart.
            </div>
          )}
          <CleanChart
            symbol={s.symbol}
            name={s.name}
            price={s.price}
            change={s.change}
            changePercent={s.changePercent}
            high={s.high}
            low={s.low}
            isPositive={isPos}
            candles={chartCandles}
            period={period}
            // tzOffset={getUTCOffset(symTz)}
            exchangeTimezone={symTz}
          />
        </div>

        {/* ── Footer: delay info + period tabs ─────────────────── */}
        <div className={`px-4 py-2 flex items-center justify-between ${tx.t3(l)} text-[10px] border-t ${l ? "border-gray-100" : "border-[#1a2d3f]"}`}>
          <span className="hidden md:flex items-center gap-1 shrink-0">
            <Clock className="w-3 h-3"/>
            Prices delayed 15 min · Yahoo Finance
          </span>
          <div className="flex items-center gap-0.5">
            {PERIODS.map(p => (
              <button
                key={p}
                onClick={e => { e.stopPropagation(); setPeriod(p); }}
                className={`px-2 py-0.5 rounded-md text-[11px] font-bold transition-all shrink-0 ${
                  period === p
                    ? isPos
                      ? "bg-emerald-500/15 text-emerald-500 border border-emerald-500/30"
                      : "bg-red-500/15 text-red-500 border border-red-500/30"
                    : l
                      ? "text-gray-500 hover:bg-gray-100 border border-transparent"
                      : "text-[#5a7a92] hover:bg-white/[0.05] border border-transparent"
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {regionSummary && <div className="mt-4">{regionSummary}</div>}
    </div>
  );
}

export default AsiaPacificMarketsChart;