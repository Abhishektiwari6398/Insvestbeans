// USMarketsChart.tsx
// Dedicated chart for United States Markets
// Symbols: ^DJI (Dow Jones), ^GSPC (S&P 500), ^IXIC (Nasdaq)
// IST Timings: 7:00 PM – 1:30 AM IST (Summer/DST) | 8:30 PM – 3:00 AM IST (Winter)

import CleanChart from "@/components/CleanChart";
import { useGlobalMarkets } from "@/hooks/useGlobalMarkets";
import { IndexQuote } from "@/services/globalMarkets/types";
import {
  TrendingUp, TrendingDown, BarChart3, Clock, AlertTriangle,
  AlertCircle, RefreshCw, ExternalLink,
} from "lucide-react";
import { useState, useCallback, useEffect, useRef } from "react";
import { useTheme } from "@/controllers/Themecontext";

// ── Backend base URL ──────────────────────────────────────────────
const API_BASE = (import.meta.env.VITE_API_URL as string) || "http://localhost:8000";

// ── Period tab definitions ────────────────────────────────────────
const PERIODS = ["1D","5D","1M","6M","YTD","1Y","5Y","MAX"] as const;
type Period = typeof PERIODS[number];

// ── IST Timings (from user-provided reference) ────────────────────
const US_IST_TIMINGS = {
  summer: { open: "7:00 PM IST", close: "1:30 AM IST", label: "Summer/DST" },
  winter: { open: "8:00 PM IST", close: "2:30 AM IST", label: "Winter/EST"   },
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

// ── Check if US market is currently open ─────────────────────────
function isUSMarketOpen(): { status: "open" | "pre" | "closed"; istTime: string } {
  const now = new Date();
  const fmt = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York", hour: "2-digit", minute: "2-digit",
    hour12: false, weekday: "short",
  }).formatToParts(now);
  const weekday = fmt.find(p => p.type === "weekday")?.value ?? "";
  if (weekday === "Sat" || weekday === "Sun") return { status: "closed", istTime: nowIST() };
  const h  = parseInt(fmt.find(p => p.type === "hour")?.value   ?? "0");
  const mn = parseInt(fmt.find(p => p.type === "minute")?.value ?? "0");
  const mins = h * 60 + mn;
  if (mins >= 570 && mins < 960) return { status: "open",   istTime: nowIST() }; // 9:30–16:00 ET
  if (mins >= 540 && mins < 570) return { status: "pre",    istTime: nowIST() }; // 9:00–9:30 pre
  return { status: "closed", istTime: nowIST() };
}

function nowIST(): string {
  return new Intl.DateTimeFormat("en-IN", {
    timeZone: "Asia/Kolkata", hour: "2-digit", minute: "2-digit", hour12: true,
  }).format(new Date());
}

// ── Is currently DST in NY? ───────────────────────────────────────
function isNYSummerDST(): boolean {
  const offset = getUTCOffset("America/New_York");
  return offset === -4; // EDT = UTC-4 (summer), EST = UTC-5 (winter)
}

// ── Theme helpers ─────────────────────────────────────────────────
const useIL = () => { const { theme } = useTheme(); return theme === "light"; };
const tx = {
  card:   (l: boolean) => l ? "bg-white border border-gray-100 shadow-sm" : "bg-[#0c1821] border border-[#1a2d3f]",
  t1:     (l: boolean) => l ? "text-gray-900"   : "text-[#e2ecf4]",
  t2:     (l: boolean) => l ? "text-gray-500"   : "text-[#5a7a92]",
  t3:     (l: boolean) => l ? "text-gray-400"   : "text-[#3d5f78]",
  header: (l: boolean) => l ? "bg-gray-50 border-gray-100" : "bg-[#081017] border-[#1a2d3f]",
  row:    (l: boolean) => l ? "hover:bg-gray-50/60 border-b border-gray-50" : "hover:bg-white/[0.02] border-b border-[#111e28]",
};

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  const l = useIL();
  return <div className={`rounded-xl ${tx.card(l)} ${className}`}>{children}</div>;
}

function PctTag({ v }: { v: number }) {
  const l = useIL(); const g = v >= 0;
  return (
    <span className={`inline-flex items-center gap-0.5 font-bold rounded-md text-xs px-1.5 py-1 ${
      g ? l ? "bg-emerald-50 text-emerald-700" : "bg-emerald-900/20 text-emerald-400"
        :     l ? "bg-red-50 text-red-600"     : "bg-red-900/20 text-red-400"
    }`}>
      {g ? <TrendingUp className="w-2.5 h-2.5"/> : <TrendingDown className="w-2.5 h-2.5"/>}
      {g ? "+" : ""}{v.toFixed(2)}%
    </span>
  );
}

// ══════════════════════════════════════════════════════════════════
// US MARKETS CHART
// ══════════════════════════════════════════════════════════════════
interface USMarketsChartProps {
  markets:     IndexQuote[];
  onChart:     (sym: string, name: string) => void;
  autoSym?:    string;
  regionSummary?: React.ReactNode;
}

export function USMarketsChart({ markets, onChart, autoSym, regionSummary }: USMarketsChartProps) {
  const l = useIL();

  const [sel, setSel]             = useState(0);
  const [period, setPeriod]       = useState<Period>("1D");
  const [chartCandles, setChartCandles] = useState<any[]>([]);
  const [chartLoading, setChartLoading] = useState(false);
  const [fetchError,   setFetchError]   = useState(false);
  const fetchIdRef = useRef(0);
  const lastFetchRef = useRef("");

  // ── Market status ──────────────────────────────────────────────
  const [mktStatus, setMktStatus] = useState(isUSMarketOpen());
  useEffect(() => {
    const t = setInterval(() => setMktStatus(isUSMarketOpen()), 60_000);
    return () => clearInterval(t);
  }, []);

  const isDST = isNYSummerDST();
  const timing = isDST ? US_IST_TIMINGS.summer : US_IST_TIMINGS.winter;

  // ── Auto-select symbol from URL state ─────────────────────────
  useEffect(() => {
    if (!autoSym) return;
    const idx = markets.findIndex(m => m.symbol === autoSym);
    if (idx >= 0) setSel(idx);
  }, [autoSym, markets]);

  // ── Reset candles when switching market ───────────────────────
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
      lastFetchRef.current = `${symbol}_${p}`;
    } catch (e) {
      if (id !== fetchIdRef.current) return;
      console.error(`[USMarketsChart] fetch failed ${symbol} ${p}:`, e);
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
      <BarChart3 className={`w-8 h-8 mx-auto mb-2 ${tx.t3(l)}`}/>
      <p className={`text-sm ${tx.t2(l)}`}>No US market data</p>
    </Card>
  );

  const s = markets[sel];
  const isPos = s.changePercent >= 0;

  // ── Status pill styling ────────────────────────────────────────
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
                {m.name}
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

        {/* ── Top bar: IST timing + status + TradingView ── */}
        <div className={`flex items-center justify-between px-4 py-2 border-b ${tx.header(l)} border-b`}>
          <div className="flex items-center gap-2 flex-wrap">
            {/* Delay badge */}
            <div className={`flex items-center gap-1 px-2 py-0.5 rounded-md border text-[9px] font-bold uppercase tracking-wide
              ${l ? "bg-amber-50 border-amber-200 text-amber-700" : "bg-amber-900/10 border-amber-700/30 text-amber-500"}`}>
              <AlertTriangle className="w-2.5 h-2.5"/>
              <span>Delayed 15 min</span>
            </div>
            {/* Market status */}
            <span className={`text-[9px] font-black px-2 py-0.5 rounded-full border uppercase tracking-wide ${statusStyle[mktStatus.status]}`}>
              {statusLabel[mktStatus.status]}
            </span>
            {/* IST timing */}
            <div className={`flex items-center gap-1 text-[9px] font-semibold ${tx.t3(l)}`}>
              <Clock className="w-2.5 h-2.5"/>
              <span>
                🇺🇸 NYSE/NASDAQ — {timing.open} – {timing.close}
                <span className={`ml-1 ${l ? "text-gray-400" : "text-[#3d5f78]"}`}>({timing.label})</span>
              </span>
            </div>
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
            // tzOffset={getUTCOffset("America/New_York")}
            exchangeTimezone="America/New_York"
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

export default USMarketsChart;