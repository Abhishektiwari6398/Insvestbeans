// src/components/CleanChart.tsx
// Lightweight Charts v5 — tall classic look, no watermark, tight candles

import {
  useEffect, useRef, useState, useCallback,
} from 'react';
import {
  createChart,
  CandlestickSeries,
  ColorType,
  type IChartApi,
  type ISeriesApi,
  type CandlestickSeriesOptions,
} from 'lightweight-charts';
import { TrendingUp, TrendingDown, Loader2, Clock } from 'lucide-react';
import { useTheme } from '@/controllers/Themecontext';

// ── Types ─────────────────────────────────────────────────────────
interface CandlePoint {
  x: number;                              // ms
  y: [number, number, number, number];    // [open, high, low, close]
}
interface CleanChartProps {
  name: string; symbol: string;
  price: number; change: number; changePercent: number;
  high: number; low: number; isPositive: boolean;
  candles?: CandlePoint[];
  historyUrl?: string;
}
type Period = '1D' | '1W' | '1M' | '3M' | '1Y';
const PERIODS: Period[] = ['1D', '1W', '1M', '3M', '1Y'];
// Delay labels — Yahoo Finance ke same (CBOE/CBOT disclaimer match)
const DELAY_LABEL: Record<Period, string> = {
  '1D': 'CBOE · ~15 min delayed · 5 min bars',
  '1W': '~15 min delayed · 30 min bars',
  '1M': 'End-of-day · daily bars',
  '3M': 'End-of-day · daily bars',
  '1Y': 'End-of-day · monthly bars',
};
// Auto-refresh interval for live periods (15 minutes in ms)
const AUTO_REFRESH_MS = 15 * 60 * 1000;
// VITE_API_URL is like http://localhost:8000/api/v1 — strip /api/v1 for root, add back for kite routes
const _BASE_RAW = (import.meta as any).env?.VITE_API_URL || 'http://localhost:8000/api/v1';
const API_BASE  = _BASE_RAW.replace(/\/api\/v1\/?$/, '');

// ── Helpers ───────────────────────────────────────────────────────
function calcChange(candles: CandlePoint[]) {
  if (candles.length < 2) return { change: 0, changePercent: 0 };
  const start = candles[0].y[0], end = candles[candles.length - 1].y[3];
  const chg = end - start;
  return { change: chg, changePercent: (chg / start) * 100 };
}

function generateFallback(
  price: number, high: number, low: number,
  changePercent: number, isPositive: boolean, count = 60
): CandlePoint[] {
  const STEP = 15 * 60 * 1000;
  const now  = Date.now();
  const range = high - low || price * 0.02;
  let cur = isPositive ? price - (price * Math.abs(changePercent) / 100) : price + (price * Math.abs(changePercent) / 100);
  const vol = range / count;
  const result: CandlePoint[] = [];
  for (let i = 0; i < count; i++) {
    const p = i / (count - 1);
    cur = cur + ((isPositive ? p * 0.6 : -p * 0.6) + (Math.random() - 0.47) * 0.5 + Math.sin(p * Math.PI * 2.5) * 0.15) * vol * 0.8;
    cur = Math.max(low * 0.99, Math.min(high * 1.01, cur));
    const wick = vol * (0.3 + Math.random() * 0.9);
    const body = vol * (0.2 + Math.random() * 0.7);
    const open = cur, close = cur + (Math.random() > 0.5 ? 1 : -1) * body;
    result.push({
      x: now - (count - 1 - i) * STEP,
      y: [+open.toFixed(2), +(Math.max(open, close) + Math.random() * wick * 0.5).toFixed(2),
          +(Math.min(open, close) - Math.random() * wick * 0.5).toFixed(2), +close.toFixed(2)],
    });
  }
  const last = result[result.length - 1];
  last.y[3] = price; last.y[1] = Math.max(last.y[1], price); last.y[2] = Math.min(last.y[2], price);
  return result;
}

function toLWC(candles: CandlePoint[]) {
  const seen = new Set<number>();
  return candles
    .map(c => ({
      time:  Math.floor(c.x / 1000) as unknown as import('lightweight-charts').Time,
      open: c.y[0], high: c.y[1], low: c.y[2], close: c.y[3],
    }))
    .filter(c => { const t = c.time as unknown as number; if (seen.has(t)) return false; seen.add(t); return true; })
    .sort((a, b) => (a.time as unknown as number) - (b.time as unknown as number));
}

// ── Chart theme ───────────────────────────────────────────────────
const C = {
  dark: {
    bg:        '#0e2038',
    grid:      'rgba(255,255,255,0.05)',
    text:      'rgba(148,163,184,0.9)',
    cross:     'rgba(148,163,184,0.25)',
    crossLbl:  '#1e3a5f',
    priceLine: 'rgba(148,163,184,0.2)',
    up:        '#26a69a',
    down:      '#ef5350',
  },
  light: {
    bg:        '#ffffff',
    grid:      'rgba(226,232,240,0.7)',
    text:      'rgba(100,116,139,0.9)',
    cross:     'rgba(100,116,139,0.3)',
    crossLbl:  '#475569',
    priceLine: 'rgba(100,116,139,0.2)',
    up:        '#26a69a',
    down:      '#ef5350',
  },
};

// ═══════════════════════════════════════════════════════════════════
const CleanChart = ({
  name, symbol, price, change, changePercent,
  high, low, isPositive, candles: initCandles,
  historyUrl,
}: CleanChartProps) => {
  const { theme } = useTheme();
  const dark = theme === 'dark';
  const col  = dark ? C.dark : C.light;

  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef     = useRef<IChartApi | null>(null);
  const seriesRef    = useRef<ISeriesApi<'Candlestick'> | null>(null);

  const [period,    setPeriod]    = useState<Period>('1D');
  const [chartData, setChartData] = useState<CandlePoint[]>([]);
  const [loading,   setLoading]   = useState(false);
  const [isFallback, setFallback] = useState(false);
  const [lastFetch, setLastFetch] = useState<Date | null>(null);

  const [pChange,  setPChange]  = useState(change);
  const [pChangePct, setPChangePct] = useState(changePercent);
  const [pHigh, setPHigh]  = useState(high);
  const [pLow,  setPLow]   = useState(low);

  // ── Fetch ─────────────────────────────────────────────────────
  const fetch_ = useCallback(async (p: Period) => {
    setLoading(true);
    try {
      const url = historyUrl
        ? `${historyUrl}?period=${p}`
        : `${API_BASE}/api/v1/markets/history/${encodeURIComponent(symbol)}?period=${p}`;
      const r = await fetch(url);
      if (!r.ok) throw new Error(`${r.status}`);
      const d = await r.json();
      const c: CandlePoint[] = d.candles || [];
      if (c.length >= 3) {
        setChartData(c); setFallback(false); setLastFetch(new Date());
        const { change: ch, changePercent: cp } = calcChange(c);
        setPChange(ch); setPChangePct(cp);
        setPHigh(Math.max(...c.map(k => k.y[1]))); setPLow(Math.min(...c.map(k => k.y[2])));
      } else throw new Error('sparse');
    } catch {
      const fb = (initCandles && initCandles.length >= 3)
        ? initCandles : generateFallback(price, high, low, changePercent, isPositive);
      setChartData(fb); setFallback(true);
      setPChange(change); setPChangePct(changePercent); setPHigh(high); setPLow(low);
    } finally { setLoading(false); }
  }, [symbol, price, high, low, changePercent, isPositive, initCandles, change]);

  useEffect(() => { fetch_(period); }, [period, fetch_]);

  // ── Auto-refresh every 15 min for intraday periods ───────────
  useEffect(() => {
    if (period !== '1D' && period !== '1W') return;
    const id = setInterval(() => { fetch_(period); }, AUTO_REFRESH_MS);
    return () => clearInterval(id);
  }, [period, fetch_]);

  // ── Create LWC instance ──────────────────────────────────────
  useEffect(() => {
    if (!containerRef.current) return;

    if (chartRef.current) { chartRef.current.remove(); chartRef.current = null; seriesRef.current = null; }

    const chart = createChart(containerRef.current, {
      // ── NO WATERMARK ──────────────────────────────────────────
      layout: {
        background:       { type: ColorType.Solid, color: col.bg },
        textColor:        col.text,
        fontFamily:       "'Inter', system-ui, sans-serif",
        fontSize:         11,
        attributionLogo:  false,   // hides the "17" TradingView watermark
      },
      // ── GRID ─────────────────────────────────────────────────
      grid: {
        vertLines: { visible: false },
        horzLines: { color: col.grid, style: 1 },
      },
      // ── CROSSHAIR ────────────────────────────────────────────
      crosshair: {
        mode: 1,
        vertLine: { color: col.cross, labelBackgroundColor: col.crossLbl, width: 1, style: 1 },
        horzLine: { color: col.cross, labelBackgroundColor: col.crossLbl, width: 1, style: 1 },
      },
      // ── PRICE SCALE ──────────────────────────────────────────
      rightPriceScale: {
        borderVisible:  false,
        scaleMargins:   { top: 0.06, bottom: 0.04 },
        minimumWidth:   72,
      },
      // ── TIME SCALE ───────────────────────────────────────────
      timeScale: {
        borderVisible:  false,
        timeVisible:    period === '1D' || period === '1W',
        secondsVisible: false,
        fixLeftEdge:    true,
        fixRightEdge:   true,
        // Yahoo Finance jaisi tight candles — 1D/1W mein zyada candles hain to spacing kam
        barSpacing: period === '1D' ? 4
                  : period === '1W' ? 5
                  : period === '1M' ? 8
                  : period === '3M' ? 6
                  : 16,  // 1Y — monthly, kam bars, zyada spacing
        rightOffset: 3,
      },
      // ── INTERACTION ──────────────────────────────────────────
      handleScroll: { mouseWheel: false, pressedMouseMove: true, horzTouchDrag: true },
      handleScale:  { mouseWheel: false, pinch: false },
      autoSize:     true,
    });

    const series = chart.addSeries(CandlestickSeries, {
      upColor:      col.up,
      downColor:    col.down,
      borderVisible: false,
      wickUpColor:   col.up,
      wickDownColor: col.down,
    } as Partial<CandlestickSeriesOptions>);

    chartRef.current  = chart;
    seriesRef.current = series;

    if (chartData.length > 0) {
      series.setData(toLWC(chartData));
      chart.timeScale().fitContent();
    }

    const ro = new ResizeObserver(() => {
      chart.applyOptions({ width: containerRef.current?.clientWidth ?? 0 });
    });
    ro.observe(containerRef.current);

    return () => { ro.disconnect(); chart.remove(); chartRef.current = null; seriesRef.current = null; };
  }, [dark]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Data update ──────────────────────────────────────────────
  useEffect(() => {
    if (!seriesRef.current || !chartRef.current || !chartData.length) return;
    seriesRef.current.setData(toLWC(chartData));
    chartRef.current.timeScale().fitContent();
    chartRef.current.applyOptions({ timeScale: { timeVisible: period === '1D' || period === '1W' } });
  }, [chartData, period]);

  // ── Period button — stop propagation so modal doesn't open ───
  const handlePeriod = (e: React.MouseEvent, p: Period) => {
    e.stopPropagation(); e.preventDefault();
    if (p !== period) setPeriod(p);
  };

  const isPos = pChangePct >= 0;

  // ── Next-refresh countdown (1D / 1W only) ────────────────────
  const [nextRefreshIn, setNextRefreshIn] = useState<string>('');
  useEffect(() => {
    if ((period !== '1D' && period !== '1W') || !lastFetch || isFallback) { setNextRefreshIn(''); return; }
    const tick = () => {
      const elapsed = Date.now() - lastFetch.getTime();
      const remaining = Math.max(0, AUTO_REFRESH_MS - elapsed);
      const m = Math.floor(remaining / 60_000);
      const s = Math.floor((remaining % 60_000) / 1_000);
      setNextRefreshIn(`Next refresh in ${m}:${s.toString().padStart(2,'0')}`);
    };
    tick();
    const id = setInterval(tick, 1_000);
    return () => clearInterval(id);
  }, [period, lastFetch, isFallback]);

  const dataAgoLabel = (): string => {
    if (!lastFetch || isFallback) return '';
    const diff = Math.round((Date.now() - lastFetch.getTime()) / 60_000);
    const delay = (period === '1D' || period === '1W') ? 15 : 0;
    const total = diff + delay;
    if (total < 1)  return 'just now';
    if (total < 60) return `${total} min ago`;
    return `${Math.floor(total / 60)}h ${total % 60}m ago`;
  };

  // ── UI ───────────────────────────────────────────────────────
  const cardBg   = dark ? 'bg-[#0e2038] border-white/8'     : 'bg-white border-slate-200';
  const nameCls  = dark ? 'text-slate-500'                   : 'text-slate-400';
  const priceCls = dark ? 'text-slate-100'                   : 'text-slate-900';
  const hlCls    = dark ? 'bg-white/5 border-white/8 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-700';
  const footBg   = dark ? 'bg-white/2 border-white/5 text-slate-600' : 'bg-slate-50/60 border-slate-100 text-slate-400';
  const btnActive  = dark ? 'bg-slate-100 text-slate-900 shadow-md'  : 'bg-slate-900 text-white shadow-md';
  const btnDefault = dark ? 'bg-white/6 text-slate-400 border border-white/8 hover:bg-white/12'
                          : 'bg-slate-100 text-slate-600 border border-slate-200 hover:bg-slate-200';

  return (
    <div className={`rounded-2xl border shadow-sm overflow-hidden transition-all ${cardBg}`}>

      {/* ── Header: name + price + H/L ──────────────────────── */}
      <div className="px-6 pt-5 pb-0">
        <h3 className={`text-[11px] font-bold uppercase tracking-widest mb-3 ${nameCls}`}>{name}</h3>

        <div className="flex items-start justify-between mb-4">
          <div>
            <div className={`text-4xl sm:text-5xl font-black tracking-tight leading-none mb-2 ${priceCls}`}>
              {price.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className={`flex items-center gap-2 text-base font-bold ${isPos ? 'text-emerald-500' : 'text-red-500'}`}>
              {isPos ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
              <span>
                {pChange > 0 ? '+' : ''}{pChange.toFixed(2)}&nbsp;
                ({pChangePct > 0 ? '+' : ''}{pChangePct.toFixed(2)}%)
              </span>
            </div>
          </div>
          <div className={`text-right text-xs leading-relaxed space-y-1`}>
            <div className={`px-2 py-1 rounded border ${hlCls}`}>
              H: <span className="font-semibold">{pHigh.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
            </div>
            <div className={`px-2 py-1 rounded border ${hlCls}`}>
              L: <span className="font-semibold">{pLow.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
            </div>
          </div>
        </div>

        {/* ── Period buttons ─────────────────────────────────── */}
        <div className="flex items-center gap-1.5 mb-5 flex-wrap">
          {PERIODS.map(p => (
            <button key={p}
              onClick={e => handlePeriod(e, p)}
              onMouseDown={e => e.stopPropagation()}
              disabled={loading}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all disabled:opacity-60 ${period === p ? btnActive : btnDefault}`}>
              {p}
            </button>
          ))}
          {loading && <Loader2 className="w-4 h-4 ml-2 animate-spin text-slate-400" />}
        </div>
      </div>

      {/* ── Chart — edge-to-edge, tall ────────────────────────── */}
      <div className={`transition-opacity duration-200 ${loading ? 'opacity-30' : 'opacity-100'}`}
        style={{ height: 280 }}>
        <div ref={containerRef} style={{ width: '100%', height: '100%' }} />
      </div>

      {/* ── Footer ───────────────────────────────────────────── */}
      <div className={`flex items-center justify-between px-5 py-2.5 text-[10px] border-t ${footBg}`}>
        <span>
          {isFallback
            ? '🔒 Estimated shape · market closed'
            : `⏱ ${DELAY_LABEL[period]}`}
        </span>
        <span className="flex items-center gap-2">
          {!isFallback && nextRefreshIn && (
            <span className="flex items-center gap-1 text-amber-500/80">
              <Clock className="w-2.5 h-2.5" />{nextRefreshIn}
            </span>
          )}
          {!isFallback && lastFetch && !nextRefreshIn && (
            <span className="flex items-center gap-1">
              <Clock className="w-2.5 h-2.5" />
              Data ~{dataAgoLabel()}
            </span>
          )}
        </span>
      </div>
    </div>
  );
};

export default CleanChart;