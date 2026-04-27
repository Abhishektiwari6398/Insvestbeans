// src/components/KiteChart.tsx
// Same visual design as CleanChart — but data comes from Kite/Zerodha API
// Used on the Domestic tab in BharatPulse section

import { useEffect, useRef, useState, useCallback } from 'react';
import {
  createChart,
  CandlestickSeries,
  ColorType,
  type IChartApi,
  type ISeriesApi,
  type CandlestickSeriesOptions,
} from 'lightweight-charts';
import { TrendingUp, TrendingDown, Loader2, Clock, RefreshCw } from 'lucide-react';
import { useTheme } from '@/controllers/Themecontext';

// ── Types ──────────────────────────────────────────────────────────
interface CandlePoint {
  x: number;
  y: [number, number, number, number]; // [open, high, low, close]
}

type Period = '1D' | '1W' | '1M' | '3M' | '1Y';
const PERIODS: Period[] = ['1D', '1W', '1M', '3M', '1Y'];

const DELAY_LABEL: Record<Period, string> = {
  '1D': 'Zerodha · 5 min bars · Today',
  '1W': 'Zerodha · 30 min bars · Last 5 days',
  '1M': 'Zerodha · Daily bars · Last 1 month',
  '3M': 'Zerodha · Daily bars · Last 3 months',
  '1Y': 'Zerodha · Daily bars · Last 1 year',
};

// ── IST Time Formatter helpers ────────────────────────────────────
const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000; // UTC+5:30
const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

function toISTDate(utcSeconds: number) {
  return new Date(utcSeconds * 1000 + IST_OFFSET_MS);
}

function formatISTTime(utcSeconds: number): string {
  const d = toISTDate(utcSeconds);
  return `${d.getUTCHours().toString().padStart(2,'0')}:${d.getUTCMinutes().toString().padStart(2,'0')}`;
}

function formatISTDay(utcSeconds: number): string {
  const d = toISTDate(utcSeconds);
  return `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]}`;
}

/**
 * TradingView-style smart tick formatter factory.
 * Returns a stateful formatter that detects boundary changes (day/week/month/year)
 * and shows the right label — exactly like Zerodha/TradingView.
 *
 *   1D  → HH:MM every bar; session open (09:15) shows "DD MMM"
 *   1W  → day boundary → "DD MMM"; same day → "HH:MM"
 *   1M  → week boundary → "DD MMM"
 *   3M  → month boundary → "MMM"; week boundary → "DD"
 *   1Y  → month boundary → "MMM"; year change → "MMM 'YY"
 */
function makeTickFormatter(period: Period) {
  let prevDay   = -1;
  let prevMonth = -1;
  let prevYear  = -1;
  let prevWeek  = -1;

  const isoWeek = (d: Date): number => {
    const tmp = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
    const dayNum = tmp.getUTCDay() || 7;
    tmp.setUTCDate(tmp.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(tmp.getUTCFullYear(), 0, 1));
    return Math.ceil((((tmp.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  };

  return (utcSec: number): string => {
    const d     = toISTDate(utcSec);
    const day   = d.getUTCDate();
    const month = d.getUTCMonth();
    const year  = d.getUTCFullYear();
    const week  = isoWeek(d);
    const hh    = d.getUTCHours();
    const mm    = d.getUTCMinutes();

    if (period === '1D') {
      // Session open → show date; rest → show time
      if (hh === 9 && mm === 15) { prevDay = day; return `${day} ${MONTHS[month]}`; }
      return formatISTTime(utcSec);
    }

    if (period === '1W') {
      // New day → show "DD MMM"; same day → show "HH:MM"
      if (day !== prevDay) { prevDay = day; return `${day} ${MONTHS[month]}`; }
      return formatISTTime(utcSec);
    }

    if (period === '1M') {
      // New week → show "DD MMM"
      if (week !== prevWeek) { prevWeek = week; return `${day} ${MONTHS[month]}`; }
      return '';
    }

    if (period === '3M') {
      // New month → show "MMM"; new week → show "DD"
      if (month !== prevMonth) { prevMonth = month; prevWeek = week; return MONTHS[month]; }
      if (week !== prevWeek)   { prevWeek = week; return `${day}`; }
      return '';
    }

    // 1Y: new month → "MMM"; year change → "MMM 'YY"
    if (month !== prevMonth) {
      prevMonth = month;
      if (year !== prevYear) { prevYear = year; return `${MONTHS[month]} '${String(year).slice(2)}`; }
      return MONTHS[month];
    }
    return '';
  };
}

// Domestic symbols available from Kite (matching kite_routes.js TOKEN_MAP)
export interface KiteSymbolConfig {
  key: string;       // API symbol key e.g. "NIFTY 50"
  label: string;     // Display name e.g. "Nifty 50"
  exchange?: string; // "NSE" | "BSE"
}

export const DOMESTIC_SYMBOLS: KiteSymbolConfig[] = [
  // ── Broad Indices ────────────────────────────────────────────────
  { key: 'NIFTY 50',          label: 'Nifty 50',       exchange: 'NSE' },
  { key: 'SENSEX',            label: 'Sensex',          exchange: 'BSE' },
  { key: 'NIFTY BANK',        label: 'Bank Nifty',      exchange: 'NSE' },
  { key: 'NIFTY LARGEMID250', label: 'LargeMid 250',    exchange: 'NSE' },
  // { key: 'NIFTY MIDCAP 100',  label: 'Midcap 100',      exchange: 'NSE' },
  // { key: 'NIFTY SMLCAP 100',  label: 'Smallcap 100',    exchange: 'NSE' },
  // ── Sector Indices ───────────────────────────────────────────────
  { key: 'NIFTY AUTO',        label: 'Nifty Auto',      exchange: 'NSE' },
  { key: 'NIFTY PHARMA',      label: 'Nifty Pharma',    exchange: 'NSE' },
  { key: 'NIFTY METAL',       label: 'Nifty Metal',     exchange: 'NSE' },
  // { key: 'NIFTY REALTY',      label: 'Nifty Realty',    exchange: 'NSE' },
  // { key: 'NIFTY IND DEFENCE', label: 'Nifty Defence',   exchange: 'NSE' },
  // { key: 'NIFTY IT',          label: 'Nifty IT',        exchange: 'NSE' },
  { key: 'NIFTY FIN SERVICE', label: 'Nifty FinServ',   exchange: 'NSE' },
  // { key: 'NIFTY FMCG',        label: 'Nifty FMCG',      exchange: 'NSE' },
  // { key: 'NIFTY ENERGY',      label: 'Nifty Energy',    exchange: 'NSE' },
  // { key: 'NIFTY PSU BANK',    label: 'Nifty PSU Bank',  exchange: 'NSE' },
  // ── Top Stocks ───────────────────────────────────────────────────
  { key: 'RELIANCE',          label: 'Reliance',        exchange: 'NSE' },
  { key: 'TCS',               label: 'TCS',             exchange: 'NSE' },
  { key: 'HDFCBANK',          label: 'HDFC Bank',       exchange: 'NSE' },
  { key: 'INFY',              label: 'Infosys',         exchange: 'NSE' },
];

// ── Default symbol: SENSEX ────────────────────────────────────────
const DEFAULT_SYMBOL = DOMESTIC_SYMBOLS.find(s => s.key === 'SENSEX') ?? DOMESTIC_SYMBOLS[0];

const AUTO_REFRESH_MS = 5 * 60 * 1000; // 5 min for intraday

const _BASE_RAW = (import.meta as any).env?.VITE_API_URL || 'http://localhost:8000/api/v1';
const API_BASE  = _BASE_RAW.replace(/\/api\/v1\/?$/, '');

// ── Chart colours ──────────────────────────────────────────────────
const C = {
  dark: {
    bg: '#0e2038', grid: 'rgba(255,255,255,0.05)', text: 'rgba(148,163,184,0.9)',
    cross: 'rgba(148,163,184,0.25)', crossLbl: '#1e3a5f',
    up: '#26a69a', down: '#ef5350',
  },
  light: {
    bg: '#ffffff', grid: 'rgba(226,232,240,0.7)', text: 'rgba(100,116,139,0.9)',
    cross: 'rgba(100,116,139,0.3)', crossLbl: '#475569',
    up: '#26a69a', down: '#ef5350',
  },
};

function toLWC(candles: CandlePoint[]) {
  const seen = new Set<number>();
  return candles
    .map(c => ({
      time:  Math.floor(c.x / 1000) as unknown as import('lightweight-charts').Time,
      open: c.y[0], high: c.y[1], low: c.y[2], close: c.y[3],
    }))
    .filter(c => {
      const t = c.time as unknown as number;
      if (seen.has(t)) return false;
      seen.add(t); return true;
    })
    .sort((a, b) => (a.time as unknown as number) - (b.time as unknown as number));
}

function calcStats(candles: CandlePoint[]) {
  if (candles.length < 2) return { change: 0, changePct: 0, high: 0, low: 0 };
  const open  = candles[0].y[0];
  const close = candles[candles.length - 1].y[3];
  const chg   = close - open;
  return {
    change:    chg,
    changePct: (chg / open) * 100,
    high:      Math.max(...candles.map(c => c.y[1])),
    low:       Math.min(...candles.map(c => c.y[2])),
  };
}

// ══════════════════════════════════════════════════════════════════
const KiteChart = ({ height = '600px' }: { height?: string }) => {
  const { theme } = useTheme();
  const dark = theme === 'dark';
  const col  = dark ? C.dark : C.light;

  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef     = useRef<IChartApi | null>(null);
  const seriesRef    = useRef<ISeriesApi<'Candlestick'> | null>(null);
  // ── Abort controller ref — cancels stale in-flight requests ────
  const abortRef     = useRef<AbortController | null>(null);

  const [period,    setPeriod]    = useState<Period>('1D');
  const [symbol,    setSymbol]    = useState<KiteSymbolConfig>(DEFAULT_SYMBOL);
  const [candles,   setCandles]   = useState<CandlePoint[]>([]);
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState<string | null>(null);
  const [lastFetch, setLastFetch] = useState<Date | null>(null);
  const [stats,     setStats]     = useState({ change: 0, changePct: 0, high: 0, low: 0, price: 0 });

  // ── Search state ─────────────────────────────────────────────────
  const [searchQ,       setSearchQ]       = useState('');
  const [searchResults, setSearchResults] = useState<KiteSymbolConfig[]>([]);
  const [searchOpen,    setSearchOpen]    = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Fetch candles from Kite backend ─────────────────────────────
  const fetchCandles = useCallback(async (sym: KiteSymbolConfig, p: Period) => {
    // Cancel any previous in-flight request
    if (abortRef.current) abortRef.current.abort();
    abortRef.current = new AbortController();
    const signal = abortRef.current.signal;

    setLoading(true);
    setError(null);
    // Clear stale data immediately so old chart doesn't show on new symbol
    setCandles([]);
    setStats({ change: 0, changePct: 0, high: 0, low: 0, price: 0 });

    try {
      const url = `${API_BASE}/api/v1/kite/markets/history/${encodeURIComponent(sym.key)}?period=${p}`;
      const r   = await fetch(url, { signal });
      if (!r.ok) throw new Error(`Server ${r.status}`);
      const data = await r.json();

      // kite_routes.js returns { status, candles: [{x, y:[o,h,l,c]}] }
      const raw: CandlePoint[] = (data.candles || []).map((c: any) => ({
        x: c.x,
        y: c.y as [number, number, number, number],
      }));

      if (raw.length < 2) throw new Error('No data');

      setCandles(raw);
      setLastFetch(new Date());

      const s = calcStats(raw);
      setStats({ ...s, price: raw[raw.length - 1].y[3] });
    } catch (e: any) {
      // Ignore abort errors — these are intentional cancellations
      if (e?.name === 'AbortError') return;
      setError(e.message || 'Failed to load');
    } finally {
      if (!signal.aborted) setLoading(false);
    }
  }, []);

  useEffect(() => { fetchCandles(symbol, period); }, [symbol, period, fetchCandles]);

  // ── Search: debounced fetch from /kite/search-instruments ───────
  useEffect(() => {
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    if (!searchOpen) return;
    if (!searchQ.trim()) {
      // No query → fetch popular symbols
      setSearchLoading(true);
      fetch(`${API_BASE}/api/v1/kite/search-instruments`)
        .then(r => r.json())
        .then(d => setSearchResults(d.results ?? []))
        .catch(() => setSearchResults([]))
        .finally(() => setSearchLoading(false));
      return;
    }
    searchTimerRef.current = setTimeout(() => {
      setSearchLoading(true);
      fetch(`${API_BASE}/api/v1/kite/search-instruments?q=${encodeURIComponent(searchQ.toUpperCase())}`)
        .then(r => r.json())
        .then(d => setSearchResults(d.results ?? []))
        .catch(() => setSearchResults([]))
        .finally(() => setSearchLoading(false));
    }, 280);
    return () => { if (searchTimerRef.current) clearTimeout(searchTimerRef.current); };
  }, [searchQ, searchOpen]);

  // ── Close search dropdown on outside click ───────────────────────
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setSearchOpen(false);
        setSearchQ('');
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // ── Auto-refresh for intraday ────────────────────────────────────
  useEffect(() => {
    if (period !== '1D' && period !== '1W') return;
    const id = setInterval(() => fetchCandles(symbol, period), AUTO_REFRESH_MS);
    return () => clearInterval(id);
  }, [symbol, period, fetchCandles]);

  // ── Create chart ─────────────────────────────────────────────────
  useEffect(() => {
    if (!containerRef.current) return;
    if (chartRef.current) { chartRef.current.remove(); chartRef.current = null; seriesRef.current = null; }

    const chart = createChart(containerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: col.bg },
        textColor:  col.text,
        fontFamily: "'Inter', system-ui, sans-serif",
        fontSize:   11,
      },
      grid: {
        vertLines: { visible: false },
        horzLines: { color: col.grid, style: 1 },
      },
      crosshair: {
        mode: 1,
        vertLine: { color: col.cross, labelBackgroundColor: col.crossLbl, width: 1, style: 1 },
        horzLine: { color: col.cross, labelBackgroundColor: col.crossLbl, width: 1, style: 1 },
      },
      rightPriceScale: { borderVisible: false, scaleMargins: { top: 0.08, bottom: 0.06 }, minimumWidth: 62 },
      timeScale: {
        borderVisible:   false,
        timeVisible:     period === '1D' || period === '1W',
        secondsVisible:  false,
        fixLeftEdge:     true,
        fixRightEdge:    true,
        // rightOffset: 0,
        barSpacing:      period === '1Y' ? 14 : period === '1D' ? 5 : 8,
        rightOffset:     2,
        minimumBarSpacing: 3,
        // ✅ Smart TradingView-style tick formatter — boundary-aware, IST-corrected
        tickMarkFormatter: makeTickFormatter(period),
      },
      // ✅ FIX Issue 4: Crosshair tooltip also shows IST
      localization: {
        timeFormatter: (utcSec: number) => {
          if (period === '1D' || period === '1W') {
            const d = toISTDate(utcSec);
            const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
            return `${d.getUTCDate()} ${months[d.getUTCMonth()]} ${formatISTTime(utcSec)} IST`;
          }
          return formatISTDay(utcSec);
        },
      },
      handleScroll: { mouseWheel: false, pressedMouseMove: true, horzTouchDrag: true },
      handleScale:  { mouseWheel: false, pinch: false },
      autoSize:     false,
      watermark:    { visible: false },
    });

    const series = chart.addSeries(CandlestickSeries, {
      upColor: col.up, downColor: col.down,
      borderVisible: false, wickUpColor: col.up, wickDownColor: col.down,
    } as Partial<CandlestickSeriesOptions>);

    chartRef.current  = chart;
    seriesRef.current = series;

    if (candles.length > 0) {
      series.setData(toLWC(candles));
      chart.timeScale().fitContent();
    }

    // Set initial size then watch for container resize
    const applySize = () => {
      if (!containerRef.current) return;
      chart.applyOptions({
        width:  containerRef.current.clientWidth,
        height: containerRef.current.clientHeight,
      });
    };
    applySize();
    const ro = new ResizeObserver(applySize);
    ro.observe(containerRef.current);

    return () => { ro.disconnect(); chart.remove(); chartRef.current = null; seriesRef.current = null; };
  }, [dark]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Push data updates to chart ───────────────────────────────────
  useEffect(() => {
    if (!seriesRef.current || !chartRef.current || !candles.length) return;
    seriesRef.current.setData(toLWC(candles));
    chartRef.current.timeScale().fitContent();
    // setTimeout(() => {
    //   chart.timeScale().fitContent();
    // }, 0);

    const isIntraday = period === '1D' || period === '1W';
    chartRef.current.applyOptions({
      timeScale: {
        timeVisible: isIntraday,
        secondsVisible: false,
        barSpacing: period === '1Y' ? 14 : period === '1D' ? 5 : 8,
        // ✅ Re-create smart formatter on every period change (stateful, boundary-aware)
        tickMarkFormatter: makeTickFormatter(period),
      },
      // ✅ FIX: Re-apply crosshair tooltip formatter on period change
      localization: {
        timeFormatter: (utcSec: number) => {
          if (isIntraday) {
            const d = toISTDate(utcSec);
            const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
            return `${d.getUTCDate()} ${months[d.getUTCMonth()]} ${formatISTTime(utcSec)} IST`;
          }
          return formatISTDay(utcSec);
        },
      },
    });
  }, [candles, period]);

  // ── Countdown to next refresh ────────────────────────────────────
  const [nextRefreshIn, setNextRefreshIn] = useState('');
  useEffect(() => {
    if ((period !== '1D' && period !== '1W') || !lastFetch) { setNextRefreshIn(''); return; }
    const tick = () => {
      const rem = Math.max(0, AUTO_REFRESH_MS - (Date.now() - lastFetch.getTime()));
      const m = Math.floor(rem / 60_000);
      const s = Math.floor((rem % 60_000) / 1_000);
      setNextRefreshIn(`Next refresh in ${m}:${s.toString().padStart(2, '0')}`);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [period, lastFetch]);

  // ── Style tokens ─────────────────────────────────────────────────
  const cardBg     = dark ? 'bg-[#0e2038] border-white/8'           : 'bg-white border-slate-200';
  const nameCls    = dark ? 'text-slate-500'                         : 'text-slate-400';
  const priceCls   = dark ? 'text-slate-100'                         : 'text-slate-900';
  const hlCls      = dark ? 'bg-white/5 border-white/8 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-700';
  const footBg     = dark ? 'bg-white/2 border-white/5 text-slate-600' : 'bg-slate-50/60 border-slate-100 text-slate-400';
  const btnActive  = dark ? 'bg-slate-100 text-slate-900 shadow-md'  : 'bg-slate-900 text-white shadow-md';
  const btnDefault = dark ? 'bg-white/6 text-slate-400 border border-white/8 hover:bg-white/12'
                          : 'bg-slate-100 text-slate-600 border border-slate-200 hover:bg-slate-200';
  const symActive  = dark ? 'bg-[#1F5F89] text-white border-[#1F5F89]'
                          : 'bg-[#0A3656] text-white border-[#0A3656]';
  const symDefault = dark ? 'bg-white/5 text-slate-400 border border-white/10 hover:bg-white/10'
                          : 'bg-slate-100 text-slate-600 border border-slate-200 hover:bg-slate-200';

  const isPos = stats.changePct >= 0;

  return (
    <div
      className={`rounded-2xl border shadow-sm overflow-hidden transition-all ${cardBg}`}
      style={{ width: '100%' }}
    >
      {/* ── Kill lightweight-charts TradingView watermark completely ── */}
      <style>{`
        .lwc-wrap a[href*="tradingview"],
        .lwc-wrap a[href*="lightweight"],
        .lwc-wrap a { display: none !important; pointer-events: none !important; }
        .lwc-wrap canvas + div a,
        .lwc-wrap > div > div:last-child { display: none !important; }
      `}</style>

      {/* ── Symbol search bar — replaces scroll-pill buttons ─────── */}
      <div className="px-3 sm:px-5 pt-3 pb-0">
        <div className="relative mb-3" ref={searchRef}>
          {/* Search input */}
          <div
            className={`flex items-center gap-2 px-3 py-2 rounded-xl border cursor-text ${
              dark
                ? 'bg-white/5 border-white/10 text-slate-200'
                : 'bg-slate-50 border-slate-200 text-slate-800'
            }`}
            onClick={() => setSearchOpen(true)}
          >
            {/* Search icon */}
            <svg className="w-3.5 h-3.5 flex-shrink-0 opacity-50" fill="none" viewBox="0 0 16 16">
              <circle cx="7" cy="7" r="4.5" stroke="currentColor" strokeWidth="1.5"/>
              <path d="M11 11l2.5 2.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
            <input
              className="flex-1 bg-transparent outline-none text-xs font-medium placeholder-current opacity-60 min-w-0"
              placeholder={`Search — ${symbol.label}`}
              value={searchQ}
              onChange={e => { setSearchQ(e.target.value); setSearchOpen(true); }}
              onFocus={() => setSearchOpen(true)}
            />
            {/* Current active symbol badge */}
            <span className={`flex-shrink-0 text-[9px] font-bold px-1.5 py-0.5 rounded ${symActive}`}>
              {symbol.exchange}
            </span>
          </div>

          {/* Dropdown */}
          {searchOpen && (
            <div className={`absolute left-0 right-0 top-full mt-1 rounded-xl border shadow-xl z-50 max-h-80 overflow-y-auto ${
              dark ? 'bg-[#0e2038] border-white/10' : 'bg-white border-slate-200'
            }`}>
              {searchLoading && (
                <div className={`px-3 py-2 text-xs ${dark ? 'text-slate-500' : 'text-slate-400'}`}>
                  Searching…
                </div>
              )}
              {!searchLoading && searchResults.length === 0 && (
                <div className={`px-3 py-2 text-xs ${dark ? 'text-slate-500' : 'text-slate-400'}`}>
                  No results
                </div>
              )}
              {!searchLoading && searchResults.length > 0 && (
                <>
                  <div className={`sticky top-0 px-3 pt-2 pb-1 text-[9px] font-bold uppercase tracking-wider flex justify-between ${
                    dark ? 'bg-[#0e2038] text-slate-500' : 'bg-white text-slate-400'
                  }`}>
                    <span>{searchQ ? `Results for "${searchQ}"` : 'Popular'}</span>
                    <span>{searchResults.length} found</span>
                  </div>
                  {searchResults.map(s => (
                    <button
                      key={s.key}
                      className={`w-full flex items-center gap-2 px-3 py-2 text-left transition-colors ${
                        symbol.key === s.key
                          ? (dark ? 'bg-[#1F5F89]/60' : 'bg-[#0A3656]/10')
                          : (dark ? 'hover:bg-white/5' : 'hover:bg-slate-50')
                      }`}
                      onClick={() => {
                        setSymbol(s);
                        setSearchOpen(false);
                        setSearchQ('');
                      }}
                    >
                      <span className={`text-[9px] font-bold px-1 py-0.5 rounded flex-shrink-0 ${
                        dark ? 'bg-white/8 text-slate-400' : 'bg-slate-100 text-slate-500'
                      }`}>{s.exchange}</span>
                      <span className={`text-xs font-semibold truncate ${dark ? 'text-slate-200' : 'text-slate-800'}`}>
                        {s.label}
                      </span>
                      <span className={`text-[9px] ml-1 flex-shrink-0 ${dark ? 'text-slate-600' : 'text-slate-300'}`}>
                        {s.key !== s.label ? s.key : ''}
                      </span>
                      {symbol.key === s.key && (
                        <span className="ml-auto text-[9px] text-emerald-400 flex-shrink-0">✓</span>
                      )}
                    </button>
                  ))}
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Header: name + price + H/L ──────────────────────────── */}
      <div className="px-3 sm:px-6 pb-0">
        <h3 className={`text-[10px] sm:text-[11px] font-bold uppercase tracking-widest mb-1.5 ${nameCls}`}>
          {symbol.exchange && <span className="mr-1 opacity-60">{symbol.exchange}:</span>}
          {symbol.label}
          <span className="ml-2 text-[9px] font-semibold px-1.5 py-0.5 rounded" style={{
            background: dark ? 'rgba(34,197,94,0.12)' : 'rgba(34,197,94,0.1)',
            color: '#22c55e', border: '1px solid rgba(34,197,94,0.25)',
          }}>
            Zerodha Live
          </span>
        </h3>

        <div className="flex items-start justify-between mb-2">
          <div>
            {stats.price > 0 ? (
              <>
                {/* Smaller price on mobile so it doesn't overflow */}
                <div className={`text-2xl sm:text-4xl md:text-5xl font-black tracking-tight leading-none mb-1 ${priceCls}`}>
                  {stats.price.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
                <div className={`flex items-center gap-1 text-xs sm:text-base font-bold ${isPos ? 'text-emerald-500' : 'text-red-500'}`}>
                  {isPos ? <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5" /> : <TrendingDown className="w-4 h-4 sm:w-5 sm:h-5" />}
                  <span>
                    {stats.change > 0 ? '+' : ''}{stats.change.toFixed(2)}&nbsp;
                    ({stats.changePct > 0 ? '+' : ''}{stats.changePct.toFixed(2)}%)
                  </span>
                </div>
              </>
            ) : (
              <div className={`text-2xl font-bold ${nameCls}`}>
                {loading ? 'Loading…' : error ? '—' : '—'}
              </div>
            )}
          </div>

          {stats.high > 0 && (
            <div className="text-right text-[10px] sm:text-xs leading-relaxed space-y-1 ml-2 flex-shrink-0">
              <div className={`px-1.5 py-0.5 rounded border ${hlCls}`}>
                H: <span className="font-semibold">{stats.high.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
              </div>
              <div className={`px-1.5 py-0.5 rounded border ${hlCls}`}>
                L: <span className="font-semibold">{stats.low.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
              </div>
            </div>
          )}
        </div>

        {/* ── Period buttons ─────────────────────────────────────── */}
        <div className="flex items-center gap-1 mb-2 sm:mb-5">
          {PERIODS.map(p => (
            <button key={p}
              onClick={() => setPeriod(p)}
              disabled={loading}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all disabled:opacity-60 ${period === p ? btnActive : btnDefault}`}>
              {p}
            </button>
          ))}
          {loading && <Loader2 className="w-3.5 h-3.5 ml-1 animate-spin text-slate-400" />}
          <button
            onClick={() => fetchCandles(symbol, period)}
            disabled={loading}
            className={`ml-auto px-2 py-1 rounded-lg text-xs font-bold transition-all disabled:opacity-60 ${btnDefault}`}
            title="Refresh"
          >
            <RefreshCw className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* ── Chart canvas — responsive height ────────────────────── */}
      {error ? (
        <div className="flex flex-col items-center justify-center h-40 sm:h-48 gap-3">
          <span className={`text-sm ${nameCls}`}>⚠️ {error}</span>
          <button
            onClick={() => fetchCandles(symbol, period)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold ${btnDefault}`}>
            Retry
          </button>
        </div>
      ) : (
        <div
          className={`transition-opacity duration-200 ${loading ? 'opacity-30' : 'opacity-100'}`}
          style={{ height: 'clamp(220px, 55vw, 340px)' }}
        >
          {/* lwc-wrap class used by CSS above to kill watermark anchor */}
          <div ref={containerRef} className="lwc-wrap" style={{ width: '100%', height: '100%' }} />
        </div>
      )}

      {/* ── Footer ──────────────────────────────────────────────── */}
      <div className={`flex flex-col gap-0.5 px-3 sm:px-5 py-2 text-[10px] border-t ${footBg}`}>
        {/* Row 1: source label + refresh timer */}
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1">
            📊 <span className="hidden xs:inline">{DELAY_LABEL[period]}</span>
            <span className="xs:hidden">{period === '1D' ? '5m bars · 9:30–15:30' : DELAY_LABEL[period]}</span>
          </span>
          <span className="flex items-center gap-1.5">
            {nextRefreshIn && (
              <span className="flex items-center gap-1 text-amber-500/80">
                <Clock className="w-2.5 h-2.5" />{nextRefreshIn}
              </span>
            )}
            {lastFetch && !nextRefreshIn && (
              <span className="flex items-center gap-1">
                <Clock className="w-2.5 h-2.5" />
                {Math.round((Date.now() - lastFetch.getTime()) / 60_000)}m ago
              </span>
            )}
          </span>
        </div>
        {/* Row 2: powered by */}
        <div className={`text-[9px] opacity-50 ${dark ? 'text-slate-500' : 'text-slate-400'}`}>
          Powered by Zerodha
        </div>
      </div>
    </div>
  );
};

export default KiteChart;