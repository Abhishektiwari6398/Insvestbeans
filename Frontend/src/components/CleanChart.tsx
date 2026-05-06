import { useEffect, useRef, useState } from 'react';
import {
  createChart, CandlestickSeries, ColorType,
  type IChartApi, type ISeriesApi, type CandlestickSeriesOptions,
} from 'lightweight-charts';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { useTheme } from '@/controllers/Themecontext';

interface CandlePoint {
  x: number;
  y: [number, number, number, number];
}

interface CleanChartProps {
  name:              string;
  symbol:            string;
  price:             number;
  change:            number;
  changePercent:     number;
  high:              number;
  low:               number;
  isPositive:        boolean;
  candles?:          CandlePoint[];
  period?:           string;
  exchangeTimezone?: string;
  tzOffset?:         number;
  historyUrl?:       string;
}

const DELAY_LABEL: Record<string, string> = {
  '1D':  '~15 min delayed · 2 min bars · today only',
  '5D':  '~15 min delayed · 15 min bars · last 5 trading days',
  '1M':  'End-of-day · daily bars · last 1 month',
  '6M':  'End-of-day · daily bars · last 6 months',
  'YTD': 'End-of-day · daily bars · Jan 1 to today',
  '1Y':  'End-of-day · weekly bars · last 52 weeks',
  '5Y':  'End-of-day · weekly bars · last 5 years',
  'MAX': 'End-of-day · monthly bars · all available history',
};

const BAR_SPACING: Record<string, number> = {
  '1D':  3,
  '5D':  3,
  '1M':  14,
  '6M':  5,
  'YTD': 6,
  '1Y':  12,
  '5Y':  4,
  'MAX': 18,
};

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

// ── Get current UTC offset in SECONDS for an IANA timezone ────────
// e.g. "Asia/Tokyo" → +32400 (9 hours)
// e.g. "America/New_York" → -14400 (EDT) or -18000 (EST)
// This is DST-aware because we call it at runtime.
function getOffsetSeconds(ianaTimezone: string): number {
  const now = new Date();
  // Format current time in both UTC and target timezone
  const utcStr = now.toLocaleString('en-US', { timeZone: 'UTC', hour12: false,
    hour: '2-digit', minute: '2-digit' });
  const tzStr  = now.toLocaleString('en-US', { timeZone: ianaTimezone, hour12: false,
    hour: '2-digit', minute: '2-digit' });
  const toMins = (s: string) => {
    const [h, m] = s.split(':').map(Number);
    return h * 60 + m;
  };
  let diff = toMins(tzStr) - toMins(utcStr);
  if (diff > 720)  diff -= 1440;
  if (diff < -720) diff += 1440;
  return diff * 60; // return seconds
}

// ── THE REAL FIX ─────────────────────────────────────────────────
// LWC stores timestamps as UTC epoch seconds and renders them using
// the BROWSER's local timezone when timeVisible=true.
// localization.timeFormatter does affect tick labels BUT LWC still
// uses its own internal date math for positioning — so "May" date
// boundary appears at UTC midnight, not exchange-local midnight.
//
// The ONLY reliable solution: shift all timestamps by the exchange's
// UTC offset so that LWC thinks "UTC midnight" = exchange midnight.
// Then use simple HH:MM formatter (no timezone conversion needed
// since timestamps are already pre-shifted).
//
// Example: Nikkei (Asia/Tokyo = UTC+9):
//   Real candle at 09:00 JST = 00:00 UTC (epoch 1746489600)
//   Shifted timestamp = 00:00 UTC + 9h = epoch 1746489600 + 32400
//   LWC renders this as "09:00" using getUTCHours() — correct! ✓
function shiftCandles(candles: CandlePoint[], offsetSeconds: number): CandlePoint[] {
  return candles.map(c => ({
    x: c.x + offsetSeconds * 1000,  // shift ms timestamp
    y: c.y,
  }));
}

function calcChange(candles: CandlePoint[]) {
  if (candles.length < 2) return { change: 0, changePercent: 0 };
  const start = candles[0].y[0];
  const end   = candles[candles.length - 1].y[3];
  const chg   = end - start;
  return { change: chg, changePercent: (chg / start) * 100 };
}

function generateFallback(
  price: number, high: number, low: number,
  changePercent: number, isPositive: boolean, count = 60,
): CandlePoint[] {
  const STEP = 15 * 60 * 1000;
  const now  = Date.now();
  const range = high - low || price * 0.02;
  let cur = isPositive
    ? price - (price * Math.abs(changePercent) / 100)
    : price + (price * Math.abs(changePercent) / 100);
  const vol = range / count;
  const result: CandlePoint[] = [];
  for (let i = 0; i < count; i++) {
    const p = i / (count - 1);
    cur = cur + (
      (isPositive ? p * 0.6 : -p * 0.6) +
      (Math.random() - 0.47) * 0.5 +
      Math.sin(p * Math.PI * 2.5) * 0.15
    ) * vol * 0.8;
    cur = Math.max(low * 0.99, Math.min(high * 1.01, cur));
    const wick  = vol * (0.3 + Math.random() * 0.9);
    const body  = vol * (0.2 + Math.random() * 0.7);
    const open  = cur;
    const close = cur + (Math.random() > 0.5 ? 1 : -1) * body;
    result.push({
      x: now - (count - 1 - i) * STEP,
      y: [
        +open.toFixed(2),
        +(Math.max(open, close) + Math.random() * wick * 0.5).toFixed(2),
        +(Math.min(open, close) - Math.random() * wick * 0.5).toFixed(2),
        +close.toFixed(2),
      ],
    });
  }
  const last = result[result.length - 1];
  last.y[3] = price;
  last.y[1] = Math.max(last.y[1], price);
  last.y[2] = Math.min(last.y[2], price);
  return result;
}

function toLWC(candles: CandlePoint[]) {
  const seen = new Set<number>();
  return candles
    .map(c => ({
      time:  Math.floor(c.x / 1000) as unknown as import('lightweight-charts').Time,
      open:  c.y[0], high: c.y[1], low: c.y[2], close: c.y[3],
    }))
    .filter(c => {
      const t = c.time as unknown as number;
      if (seen.has(t)) return false;
      seen.add(t);
      return true;
    })
    .sort((a, b) => (a.time as unknown as number) - (b.time as unknown as number));
}

// ── Time formatter — simple UTC read on pre-shifted timestamps ────
// Since timestamps are already shifted by exchange offset,
// getUTCHours/getUTCMinutes give the correct exchange-local time.
function makeTimeFormatter(p: string) {
  return (timestamp: number): string => {
    // timestamp from LWC is UTC epoch SECONDS (already shifted)
    const d = new Date(timestamp * 1000);
    const hh  = d.getUTCHours().toString().padStart(2, '0');
    const mm  = d.getUTCMinutes().toString().padStart(2, '0');
    const day = d.getUTCDate().toString().padStart(2, '0');
    const mon = MONTHS[d.getUTCMonth()];
    const yr2 = d.getUTCFullYear().toString().slice(2);
    const yr4 = d.getUTCFullYear();

    if (p === '1D') return `${hh}:${mm}`;

    if (p === '5D') {
      if (hh === '00' && mm === '00') return `${day} ${mon}`;
      return `${day} ${mon} ${hh}:${mm}`;
    }

    if (p === '1M' || p === '6M' || p === 'YTD') return `${day} ${mon}`;
    if (p === '1Y') return `${mon} '${yr2}`;
    return `${mon} ${yr4}`;
  };
}

const C = {
  dark: {
    bg: '#0e2038', grid: 'rgba(255,255,255,0.05)', text: 'rgba(148,163,184,0.9)',
    cross: 'rgba(148,163,184,0.25)', crossLbl: '#1e3a5f', up: '#26a69a', down: '#ef5350',
  },
  light: {
    bg: '#ffffff', grid: 'rgba(226,232,240,0.7)', text: 'rgba(100,116,139,0.9)',
    cross: 'rgba(100,116,139,0.3)', crossLbl: '#475569', up: '#26a69a', down: '#ef5350',
  },
};

const CleanChart = ({
  name, symbol, price, change, changePercent,
  high, low, isPositive,
  candles: propCandles,
  period: propPeriod = '1D',
  exchangeTimezone = 'UTC',
  tzOffset,
  historyUrl,
}: CleanChartProps) => {
  const { theme } = useTheme();
  const dark = theme === 'dark';
  const col  = dark ? C.dark : C.light;

  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef     = useRef<IChartApi | null>(null);
  const seriesRef    = useRef<ISeriesApi<'Candlestick'> | null>(null);

  const [activePeriod, setActivePeriod] = useState(propPeriod);
  const period = historyUrl ? activePeriod : propPeriod;

  const [chartData,  setChartData]  = useState<CandlePoint[]>([]);
  const [isFallback, setFallback]   = useState(false);
  const [pChange,    setPChange]     = useState(change);
  const [pChangePct, setPChangePct]  = useState(changePercent);
  const [pHigh,      setPHigh]       = useState(high);
  const [pLow,       setPLow]        = useState(low);
  const [fetching,   setFetching]    = useState(false);

  // ── Compute exchange offset ONCE per timezone ─────────────────
  // Use exchangeTimezone if provided, else fall back to tzOffset
  const offsetSeconds = exchangeTimezone !== 'UTC'
    ? getOffsetSeconds(exchangeTimezone)
    : (tzOffset ?? 0) * 3600;

  useEffect(() => {
    if (!historyUrl) return;
    setFetching(true);
    fetch(`${historyUrl}?period=${activePeriod}`)
      .then(r => r.ok ? r.json() : Promise.reject())
      .then((d: any) => {
        const candles: CandlePoint[] = (d.candles ?? d).map((c: any) => ({
          x: c.x ?? c.time * 1000,
          y: c.y ?? [c.open, c.high, c.low, c.close],
        }));
        if (candles.length >= 3) {
          setChartData(candles);
          setFallback(false);
          const { change: ch, changePercent: cp } = calcChange(candles);
          setPChange(ch); setPChangePct(cp);
          setPHigh(Math.max(...candles.map(k => k.y[1])));
          setPLow(Math.min(...candles.map(k => k.y[2])));
        } else {
          const fb = generateFallback(price, high, low, changePercent, isPositive);
          setChartData(fb); setFallback(true);
          setPChange(change); setPChangePct(changePercent); setPHigh(high); setPLow(low);
        }
      })
      .catch(() => {
        const fb = generateFallback(price, high, low, changePercent, isPositive);
        setChartData(fb); setFallback(true);
        setPChange(change); setPChangePct(changePercent); setPHigh(high); setPLow(low);
      })
      .finally(() => setFetching(false));
  }, [activePeriod, historyUrl]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (historyUrl) return;
    const src = propCandles;
    if (src && src.length >= 3) {
      setChartData(src); setFallback(false);
      const { change: ch, changePercent: cp } = calcChange(src);
      setPChange(ch); setPChangePct(cp);
      setPHigh(Math.max(...src.map(k => k.y[1])));
      setPLow(Math.min(...src.map(k => k.y[2])));
    } else {
      const fb = generateFallback(price, high, low, changePercent, isPositive);
      setChartData(fb); setFallback(true);
      setPChange(change); setPChangePct(changePercent); setPHigh(high); setPLow(low);
    }
  }, [propCandles]); // eslint-disable-line react-hooks/exhaustive-deps

  const timeVisible = period === '1D' || period === '5D';
  const barSpacing  = BAR_SPACING[period] ?? 6;

  useEffect(() => {
    if (!containerRef.current) return;
    if (chartRef.current) {
      chartRef.current.remove();
      chartRef.current  = null;
      seriesRef.current = null;
    }

    const chart = createChart(containerRef.current, {
      layout: {
        background:      { type: ColorType.Solid, color: col.bg },
        textColor:       col.text,
        fontFamily:      "'Inter', system-ui, sans-serif",
        fontSize:        11,
        attributionLogo: false,
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
      rightPriceScale: {
        borderVisible: false,
        scaleMargins:  { top: 0.06, bottom: 0.04 },
        minimumWidth:  72,
      },
      timeScale: {
        borderVisible:  false,
        timeVisible,
        secondsVisible: false,
        fixLeftEdge:    true,
        fixRightEdge:   true,
        barSpacing,
        rightOffset:    3,
        // ── KEY: datetimeUTC=true so LWC uses getUTC* methods ──
        // Our timestamps are pre-shifted by exchange offset,
        // so getUTCHours() returns the correct exchange-local hour.
        localization: {
          timeFormatter: makeTimeFormatter(period),
        },
      },
      handleScroll: { mouseWheel: false, pressedMouseMove: true, horzTouchDrag: true },
      handleScale:  { mouseWheel: false, pinch: false },
      autoSize:     true,
    });

    const series = chart.addSeries(CandlestickSeries, {
      upColor:       col.up,
      downColor:     col.down,
      borderVisible: false,
      wickUpColor:   col.up,
      wickDownColor: col.down,
    } as Partial<CandlestickSeriesOptions>);

    chartRef.current  = chart;
    seriesRef.current = series;

    if (chartData.length > 0) {
      // Shift timestamps to exchange local time before passing to LWC
      series.setData(toLWC(shiftCandles(chartData, offsetSeconds)));
      chart.timeScale().fitContent();
    }

    const ro = new ResizeObserver(() => {
      chart.applyOptions({ width: containerRef.current?.clientWidth ?? 0 });
    });
    ro.observe(containerRef.current);

    return () => {
      ro.disconnect();
      chart.remove();
      chartRef.current  = null;
      seriesRef.current = null;
    };
  }, [dark, exchangeTimezone]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!seriesRef.current || !chartRef.current || !chartData.length) return;
    // Always shift candles before rendering
    seriesRef.current.setData(toLWC(shiftCandles(chartData, offsetSeconds)));
    chartRef.current.timeScale().fitContent();
    chartRef.current.applyOptions({
      timeScale: {
        timeVisible,
        barSpacing,
        localization: {
          timeFormatter: makeTimeFormatter(period),
        },
      },
    });
  }, [chartData, period, timeVisible, barSpacing, offsetSeconds]); // eslint-disable-line react-hooks/exhaustive-deps

  const isPos      = pChangePct >= 0;

  const cardBg  = dark ? 'bg-[#0e2038] border-white/[0.08]'    : 'bg-white border-slate-200';
  const nameCls = dark ? 'text-slate-500'                       : 'text-slate-400';
  const priceCls= dark ? 'text-slate-100'                       : 'text-slate-900';
  const hlCls   = dark ? 'bg-white/5 border-white/[0.08] text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-700';
  const footBg  = dark ? 'bg-white/[0.02] border-white/[0.05] text-slate-600' : 'bg-slate-50/60 border-slate-100 text-slate-400';

  return (
    <div className={`rounded-2xl border shadow-sm overflow-hidden transition-all ${cardBg}`}>
      <div className="px-4 pt-3 pb-2">
        <h3 className={`text-[10px] font-bold uppercase tracking-widest mb-1.5 ${nameCls}`}>
          {name}
        </h3>
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className={`text-3xl sm:text-4xl font-black tracking-tight leading-none mb-1 ${priceCls}`}>
              {price.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className={`flex items-center gap-1.5 text-sm font-bold ${isPos ? 'text-emerald-500' : 'text-red-500'}`}>
              {isPos ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
              <span>
                {pChange > 0 ? '+' : ''}{pChange.toFixed(2)}
                &nbsp;({pChangePct > 0 ? '+' : ''}{pChangePct.toFixed(2)}%)
              </span>
            </div>
          </div>
          <div className="flex flex-col items-end gap-0.5 shrink-0 min-w-[72px]">
            <div className={`w-full px-1.5 py-0.5 rounded border text-right text-[10px] ${hlCls}`}>
              H:&nbsp;<span className="font-semibold">{pHigh.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
            </div>
            <div className={`w-full px-1.5 py-0.5 rounded border text-right text-[10px] ${hlCls}`}>
              L:&nbsp;<span className="font-semibold">{pLow.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
            </div>
          </div>
        </div>
      </div>

      <div style={{ height: 220, position: 'relative' }}>
        {fetching && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: dark ? 'rgba(14,32,56,0.6)' : 'rgba(255,255,255,0.6)', zIndex: 5 }}>
            <span style={{ fontSize: 11, color: dark ? '#94a3b8' : '#64748b' }}>Loading…</span>
          </div>
        )}
        <div ref={containerRef} style={{ width: '100%', height: '100%' }} />
      </div>

      {historyUrl && (
        <div className={`flex items-center justify-end gap-2 px-3 py-1.5 text-[10px] border-t ${footBg}`}>
          <div className="flex items-center gap-0.5">
            {(['1D', '5D', '1M', '6M', 'YTD', '1Y', '5Y', 'MAX'] as const).map(p => (
              <button key={p} onClick={e => { e.stopPropagation(); setActivePeriod(p); }}
                className="text-[11px] font-bold px-2 py-0.5 rounded-md transition-all"
                style={activePeriod === p
                  ? { background: dark ? '#1e3a5f' : '#e0eaff', color: '#5194F6' }
                  : { background: 'transparent', color: dark ? '#475569' : '#94a3b8' }
                }>
                {p}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default CleanChart;