// src/components/CleanChart.tsx
// Lightweight Charts v5 — pure display component
// Parent (MktSelector) owns period state + history fetch.
// CleanChart just renders whatever candles it receives.

import { useEffect, useRef, useState } from 'react';
import {
  createChart, CandlestickSeries, ColorType,
  type IChartApi, type ISeriesApi, type CandlestickSeriesOptions,
} from 'lightweight-charts';
import { TrendingUp, TrendingDown, AlertTriangle } from 'lucide-react';
import { useTheme } from '@/controllers/Themecontext';

// ── Types ──────────────────────────────────────────────────────────
interface CandlePoint {
  x: number;                              // ms epoch
  y: [number, number, number, number];    // [open, high, low, close]
}

interface CleanChartProps {
  name:          string;
  symbol:        string;
  price:         number;
  change:        number;
  changePercent: number;
  high:          number;
  low:           number;
  isPositive:    boolean;
  candles?:      CandlePoint[];
  // period is passed from parent so we can configure axis + delay label correctly
  period?:       string;
}

// ── Delay/description label per period ────────────────────────────
// Matches the Yahoo Finance disclaimer convention exactly.
const DELAY_LABEL: Record<string, string> = {
  '1D':  '~15 min delayed · 2 min bars',
  '5D':  '~15 min delayed · 15 min bars',
  '1M':  'End-of-day · daily bars',
  '6M':  'End-of-day · daily bars',
  'YTD': 'End-of-day · daily bars',
  '1Y':  'End-of-day · weekly bars',
  '5Y':  'End-of-day · weekly bars',
  'MAX': 'End-of-day · monthly bars',
};

// ── Bar spacing per period ─────────────────────────────────────────
// Controls how wide each candle looks. More candles = smaller spacing.
//   1D  → ~195 bars (2-min candles for 1 day)    → very tight
//   5D  → ~130 bars                               → tight
//   1M  → ~21 bars                                → comfy
//   6M  → ~126 bars                               → tight
//   YTD → varies                                  → medium
//   1Y  → ~52 bars (weekly)                       → wide
//   5Y  → ~260 bars (weekly)                      → tight
//   MAX → ~120–600 bars (monthly)                 → widest
const BAR_SPACING: Record<string, number> = {
  '1D':  3,
  '5D':  4,
  '1M':  12,
  '6M':  5,
  'YTD': 7,
  '1Y':  14,
  '5Y':  4,
  'MAX': 18,
};

// ── Helpers ────────────────────────────────────────────────────────

// Derive change/% from first open → last close of the candle set
function calcChange(candles: CandlePoint[]) {
  if (candles.length < 2) return { change: 0, changePercent: 0 };
  const start = candles[0].y[0];
  const end   = candles[candles.length - 1].y[3];
  const chg   = end - start;
  return { change: chg, changePercent: (chg / start) * 100 };
}

// Procedural fallback candles — shown when market is closed or data sparse
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
  // Pin last candle close to real price
  const last = result[result.length - 1];
  last.y[3] = price;
  last.y[1] = Math.max(last.y[1], price);
  last.y[2] = Math.min(last.y[2], price);
  return result;
}

// Convert CandlePoint[] → lightweight-charts format, dedup + sort timestamps
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

// ── Chart colour palettes ─────────────────────────────────────────
const C = {
  dark: {
    bg:        '#0e2038',
    grid:      'rgba(255,255,255,0.05)',
    text:      'rgba(148,163,184,0.9)',
    cross:     'rgba(148,163,184,0.25)',
    crossLbl:  '#1e3a5f',
    up:        '#26a69a',
    down:      '#ef5350',
  },
  light: {
    bg:        '#ffffff',
    grid:      'rgba(226,232,240,0.7)',
    text:      'rgba(100,116,139,0.9)',
    cross:     'rgba(100,116,139,0.3)',
    crossLbl:  '#475569',
    up:        '#26a69a',
    down:      '#ef5350',
  },
};

// ══════════════════════════════════════════════════════════════════
// COMPONENT
// ══════════════════════════════════════════════════════════════════
const CleanChart = ({
  name, symbol, price, change, changePercent,
  high, low, isPositive,
  candles: propCandles,
  period = '1D',
}: CleanChartProps) => {
  const { theme } = useTheme();
  const dark = theme === 'dark';
  const col  = dark ? C.dark : C.light;

  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef     = useRef<IChartApi | null>(null);
  const seriesRef    = useRef<ISeriesApi<'Candlestick'> | null>(null);

  // Derived display values — computed from candles so they match the selected period
  const [chartData,  setChartData]  = useState<CandlePoint[]>([]);
  const [isFallback, setFallback]   = useState(false);
  const [pChange,    setPChange]     = useState(change);
  const [pChangePct, setPChangePct]  = useState(changePercent);
  const [pHigh,      setPHigh]       = useState(high);
  const [pLow,       setPLow]        = useState(low);

  // ── Sync candles from parent ───────────────────────────────────
  // Whenever parent fetches a new period, it passes new candles down.
  // We update chart data here and recompute the header stats.
  useEffect(() => {
    const src = propCandles;
    if (src && src.length >= 3) {
      setChartData(src);
      setFallback(false);
      // Derive period-accurate change from actual candle data
      const { change: ch, changePercent: cp } = calcChange(src);
      setPChange(ch);
      setPChangePct(cp);
      setPHigh(Math.max(...src.map(k => k.y[1])));
      setPLow(Math.min(...src.map(k => k.y[2])));
    } else {
      // Sparse or missing data — show procedural fallback
      const fb = generateFallback(price, high, low, changePercent, isPositive);
      setChartData(fb);
      setFallback(true);
      setPChange(change);
      setPChangePct(changePercent);
      setPHigh(high);
      setPLow(low);
    }
  }, [propCandles]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Period-driven axis config ──────────────────────────────────
  const timeVisible = period === '1D' || period === '5D'; // show HH:MM for intraday
  const barSpacing  = BAR_SPACING[period] ?? 6;

  // ── Create lightweight-charts instance ────────────────────────
  // Re-runs only on theme change (dark/light) — not on data/period change
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
      },
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

    return () => {
      ro.disconnect();
      chart.remove();
      chartRef.current  = null;
      seriesRef.current = null;
    };
  }, [dark]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Update chart whenever data or period changes ──────────────
  useEffect(() => {
    if (!seriesRef.current || !chartRef.current || !chartData.length) return;
    seriesRef.current.setData(toLWC(chartData));
    chartRef.current.timeScale().fitContent();
    // Apply period-specific axis settings immediately
    chartRef.current.applyOptions({
      timeScale: { timeVisible, barSpacing },
    });
  }, [chartData, period, timeVisible, barSpacing]);

  const isPos       = pChangePct >= 0;
  const delayLabel  = DELAY_LABEL[period] ?? '~15 min delayed';

  // ── Styling tokens ────────────────────────────────────────────
  const cardBg   = dark ? 'bg-[#0e2038] border-white/[0.08]'    : 'bg-white border-slate-200';
  const nameCls  = dark ? 'text-slate-500'                       : 'text-slate-400';
  const priceCls = dark ? 'text-slate-100'                       : 'text-slate-900';
  const hlCls    = dark ? 'bg-white/5 border-white/[0.08] text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-700';
  const footBg   = dark ? 'bg-white/[0.02] border-white/[0.05] text-slate-600' : 'bg-slate-50/60 border-slate-100 text-slate-400';

  return (
    <div className={`rounded-2xl border shadow-sm overflow-hidden transition-all ${cardBg}`}>

      {/* ── Header: index name + price + period H/L ─────────────── */}
      <div className="px-6 pt-5 pb-4">
        <h3 className={`text-[11px] font-bold uppercase tracking-widest mb-3 ${nameCls}`}>
          {name}
        </h3>

        <div className="flex items-start justify-between">
          <div>
            {/* Live price — always shows current real-time price from parent */}
            <div className={`text-4xl sm:text-5xl font-black tracking-tight leading-none mb-2 ${priceCls}`}>
              {price.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>

            {/* Change for the selected period — recalculated from candle data */}
            <div className={`flex items-center gap-2 text-base font-bold ${isPos ? 'text-emerald-500' : 'text-red-500'}`}>
              {isPos ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
              <span>
                {pChange > 0 ? '+' : ''}{pChange.toFixed(2)}
                &nbsp;({pChangePct > 0 ? '+' : ''}{pChangePct.toFixed(2)}%)
              </span>
            </div>
          </div>

          {/* Period High / Low — also derived from candle data */}
          <div className="text-right text-xs leading-relaxed space-y-1">
            <div className={`px-2 py-1 rounded border ${hlCls}`}>
              H:&nbsp;<span className="font-semibold">
                {pHigh.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
              </span>
            </div>
            <div className={`px-2 py-1 rounded border ${hlCls}`}>
              L:&nbsp;<span className="font-semibold">
                {pLow.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Candlestick chart — edge-to-edge ─────────────────────── */}
      <div style={{ height: 280 }}>
        <div ref={containerRef} style={{ width: '100%', height: '100%' }} />
      </div>

      {/* ── Footer: data source + delay info ─────────────────────── */}
      <div className={`flex items-center justify-between px-5 py-2.5 text-[10px] border-t ${footBg}`}>
        <span className="flex items-center gap-1">
          {isFallback ? (
            '🔒 Estimated shape · market closed or no data'
          ) : (
            <>
              <AlertTriangle className="w-2.5 h-2.5 text-amber-500 shrink-0" />
              {delayLabel}
            </>
          )}
        </span>
        {!isFallback && (
          <span className={`font-semibold ${dark ? 'text-amber-500/70' : 'text-amber-600/80'}`}>
            Yahoo Finance
          </span>
        )}
      </div>
    </div>
  );
};

export default CleanChart;