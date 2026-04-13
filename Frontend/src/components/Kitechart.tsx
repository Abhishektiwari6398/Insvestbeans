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
  '1D': 'Zerodha · 5 min bars',
  '1W': 'Zerodha · 30 min bars',
  '1M': 'Zerodha · daily bars',
  '3M': 'Zerodha · daily bars',
  '1Y': 'Zerodha · daily bars',
};

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
  const [symbol,    setSymbol]    = useState<KiteSymbolConfig>(DOMESTIC_SYMBOLS[0]);
  const [candles,   setCandles]   = useState<CandlePoint[]>([]);
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState<string | null>(null);
  const [lastFetch, setLastFetch] = useState<Date | null>(null);
  const [stats,     setStats]     = useState({ change: 0, changePct: 0, high: 0, low: 0, price: 0 });

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
        fontSize:   12,
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
      rightPriceScale: { borderVisible: false, scaleMargins: { top: 0.06, bottom: 0.04 }, minimumWidth: 72 },
      timeScale: {
        borderVisible: false,
        timeVisible:   period === '1D' || period === '1W',
        secondsVisible: false,
        fixLeftEdge:   true,
        fixRightEdge:  true,
        barSpacing:    period === '1Y' ? 18 : 10,
        rightOffset:   3,
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
    chartRef.current.applyOptions({
      timeScale: { timeVisible: period === '1D' || period === '1W' },
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

      {/* ── Symbol selector — horizontal scroll on mobile ─────── */}
      <div className="px-4 sm:px-5 pt-4 pb-0">
        <div
          className="flex gap-1.5 mb-3 overflow-x-auto pb-1"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {DOMESTIC_SYMBOLS.map(s => (
            <button
              key={s.key}
              onClick={() => setSymbol(s)}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all flex-shrink-0 ${symbol.key === s.key ? symActive : symDefault}`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Header: name + price + H/L ──────────────────────────── */}
      <div className="px-4 sm:px-6 pb-0">
        <h3 className={`text-[11px] font-bold uppercase tracking-widest mb-2 ${nameCls}`}>
          {symbol.exchange && <span className="mr-1 opacity-60">{symbol.exchange}:</span>}
          {symbol.label}
          <span className="ml-2 text-[9px] font-semibold px-1.5 py-0.5 rounded" style={{
            background: dark ? 'rgba(34,197,94,0.12)' : 'rgba(34,197,94,0.1)',
            color: '#22c55e', border: '1px solid rgba(34,197,94,0.25)',
          }}>
            Zerodha Live
          </span>
        </h3>

        <div className="flex items-start justify-between mb-3">
          <div>
            {stats.price > 0 ? (
              <>
                {/* Smaller price on mobile so it doesn't overflow */}
                <div className={`text-3xl sm:text-4xl md:text-5xl font-black tracking-tight leading-none mb-1.5 ${priceCls}`}>
                  {stats.price.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
                <div className={`flex items-center gap-1.5 text-sm sm:text-base font-bold ${isPos ? 'text-emerald-500' : 'text-red-500'}`}>
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
            <div className="text-right text-xs leading-relaxed space-y-1 ml-2">
              <div className={`px-2 py-1 rounded border ${hlCls}`}>
                H: <span className="font-semibold">{stats.high.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
              </div>
              <div className={`px-2 py-1 rounded border ${hlCls}`}>
                L: <span className="font-semibold">{stats.low.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
              </div>
            </div>
          )}
        </div>

        {/* ── Period buttons ─────────────────────────────────────── */}
        <div className="flex items-center gap-1.5 mb-3 sm:mb-5">
          {PERIODS.map(p => (
            <button key={p}
              onClick={() => setPeriod(p)}
              disabled={loading}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all disabled:opacity-60 ${period === p ? btnActive : btnDefault}`}>
              {p}
            </button>
          ))}
          {loading && <Loader2 className="w-4 h-4 ml-2 animate-spin text-slate-400" />}
          <button
            onClick={() => fetchCandles(symbol, period)}
            disabled={loading}
            className={`ml-auto px-2 py-1.5 rounded-lg text-xs font-bold transition-all disabled:opacity-60 ${btnDefault}`}
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
          style={{ height: 'clamp(180px, 45vw, 280px)' }}
        >
          {/* lwc-wrap class used by CSS above to kill watermark anchor */}
          <div ref={containerRef} className="lwc-wrap" style={{ width: '100%', height: '100%' }} />
        </div>
      )}

      {/* ── Footer ──────────────────────────────────────────────── */}
      <div className={`flex items-center justify-between px-4 sm:px-5 py-2 text-[10px] border-t ${footBg}`}>
        <span>📊 {DELAY_LABEL[period]}</span>
        <span className="flex items-center gap-2">
          {nextRefreshIn && (
            <span className="flex items-center gap-1 text-amber-500/80">
              <Clock className="w-2.5 h-2.5" />{nextRefreshIn}
            </span>
          )}
          {lastFetch && !nextRefreshIn && (
            <span className="flex items-center gap-1">
              <Clock className="w-2.5 h-2.5" />
              Updated {Math.round((Date.now() - lastFetch.getTime()) / 60_000)}m ago
            </span>
          )}
          <span className={`ml-1 opacity-60 ${dark ? 'text-slate-500' : 'text-slate-400'}`}>
            Powered by Zerodha
          </span>
        </span>
      </div>
    </div>
  );
};

export default KiteChart;