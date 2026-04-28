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
  // tzOffset in hours from UTC — e.g. -5 for EST (US), +1 for CET (Europe), +8 for CST (Asia)
  // This is used to convert UTC epoch timestamps → exchange local time on X-axis
  tzOffset?:     number;
  // when provided, CleanChart fetches its own history when user changes period
  historyUrl?:   string;
}

// ── Delay/description label per period ────────────────────────────
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

// ── Bar spacing per period ─────────────────────────────────────────
// 5D has 15-min bars × 5 days = ~130 bars → small spacing needed
// 1M has ~21 daily bars → wider spacing for readability
// 1Y has ~52 weekly bars → comfortable spacing
const BAR_SPACING: Record<string, number> = {
  '1D':  3,   // ~195 × 2-min bars
  '5D':  3,   // ~130 × 15-min bars across 5 days
  '1M':  14,  // ~21 daily bars — wide spacing, dates clearly readable
  '6M':  5,   // ~126 daily bars
  'YTD': 6,   // varies — daily bars
  '1Y':  12,  // ~52 weekly bars — "Apr '25" labels need space
  '5Y':  4,   // ~260 weekly bars
  'MAX': 18,  // ~50+ monthly bars — "Apr 2024" labels need most space
};

// ── Month names for X-axis date labels ────────────────────────────
const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

// ── Helpers ────────────────────────────────────────────────────────

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
  period: propPeriod = '1D',
  tzOffset = 0,
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

  // ── Fetch history when period changes (only if historyUrl provided) ──
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
          setPChange(ch);
          setPChangePct(cp);
          setPHigh(Math.max(...candles.map(k => k.y[1])));
          setPLow(Math.min(...candles.map(k => k.y[2])));
        } else {
          const fb = generateFallback(price, high, low, changePercent, isPositive);
          setChartData(fb);
          setFallback(true);
          setPChange(change); setPChangePct(changePercent); setPHigh(high); setPLow(low);
        }
      })
      .catch(() => {
        const fb = generateFallback(price, high, low, changePercent, isPositive);
        setChartData(fb);
        setFallback(true);
        setPChange(change); setPChangePct(changePercent); setPHigh(high); setPLow(low);
      })
      .finally(() => setFetching(false));
  }, [activePeriod, historyUrl]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Sync candles from parent (when historyUrl not provided) ──
  useEffect(() => {
    if (historyUrl) return;
    const src = propCandles;
    if (src && src.length >= 3) {
      setChartData(src);
      setFallback(false);
      const { change: ch, changePercent: cp } = calcChange(src);
      setPChange(ch);
      setPChangePct(cp);
      setPHigh(Math.max(...src.map(k => k.y[1])));
      setPLow(Math.min(...src.map(k => k.y[2])));
    } else {
      const fb = generateFallback(price, high, low, changePercent, isPositive);
      setChartData(fb);
      setFallback(true);
      setPChange(change);
      setPChangePct(changePercent);
      setPHigh(high);
      setPLow(low);
    }
  }, [propCandles]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Derived chart config ───────────────────────────────────────
  // timeVisible = true for 1D and 5D so LWC renders time component on axis
  // For daily/weekly/monthly periods it's false — only date labels needed
  const timeVisible = period === '1D' || period === '5D';
  const barSpacing  = BAR_SPACING[period] ?? 6;

  // ── FIX: Convert tzOffset (hours) → seconds for LWC localization ──
  // LWC timestamps are UTC epoch seconds. We shift them by tzOffset so
  // that the displayed labels show the EXCHANGE's local time, not UTC.
  // Example: US market (EST = UTC-5): tzOffset = -5
  //   A candle at 14:30 UTC becomes 09:30 EST on the X-axis ✓
  // Example: Europe (CET = UTC+1): tzOffset = +1
  //   A candle at 08:00 UTC becomes 09:00 CET on the X-axis ✓
  // Example: Asia (CST = UTC+8): tzOffset = +8
  //   A candle at 01:30 UTC becomes 09:30 CST on the X-axis ✓
  const tzOffsetSeconds = Math.round(tzOffset * 3600);

  // ── timeFormatter: formats each X-axis tick label ─────────────
  // We add tzOffsetSeconds to the raw UTC timestamp before formatting,
  // then use getUTC* methods (which read the shifted value as-is).
  // This avoids the browser's local timezone interfering with display.
  //
  // FORMAT GUIDE (what user expects to see):
  //   1D  → "09:30"               (HH:MM exchange local time only)
  //   5D  → "28 Apr 09:30"        (Date + Time — spans multiple days)
  //   1M  → "28 Apr"              (Day + Month — daily bars)
  //   6M  → "28 Apr"              (Day + Month — daily bars)
  //   YTD → "28 Apr"              (Day + Month — daily bars)
  //   1Y  → "Apr '25"             (Month + Short Year — weekly bars)
  //   5Y  → "Apr 2024"            (Month + Full Year — weekly bars)
  //   MAX → "Apr 2024"            (Month + Full Year — monthly bars)
  const makeTimeFormatter = (p: string) => (timestamp: number) => {
    // timestamp from LWC is UTC epoch seconds
    // Shift to exchange local time by adding tzOffset
    const localMs = (timestamp + tzOffsetSeconds) * 1000;
    const d = new Date(localMs);

    const day = d.getUTCDate().toString().padStart(2, '0');
    const mon = MONTHS[d.getUTCMonth()];
    const hh  = d.getUTCHours().toString().padStart(2, '0');
    const mm  = d.getUTCMinutes().toString().padStart(2, '0');
    const yr2 = d.getUTCFullYear().toString().slice(2);
    const yr4 = d.getUTCFullYear();

    if (p === '1D') {
      // ── Intraday 1D: only time, no date (single day chart) ──
      // e.g. "09:30", "10:15", "15:45"
      return `${hh}:${mm}`;
    }

    if (p === '5D') {
      // ── 5D: Date + Time — user needs to see WHICH day + what time ──
      // e.g. "28 Apr 09:30", "29 Apr 14:00"
      // Only show time label on non-midnight ticks to reduce clutter
      const isSessionOpen = !(hh === '00' && mm === '00');
      if (isSessionOpen) {
        return `${day} ${mon} ${hh}:${mm}`;
      }
      // midnight tick → just show the date
      return `${day} ${mon}`;
    }

    if (p === '1M' || p === '6M' || p === 'YTD') {
      // ── Daily bars: show "28 Apr" — user needs exact date ──
      // e.g. "01 Apr", "15 Apr", "28 Apr"
      return `${day} ${mon}`;
    }

    if (p === '1Y') {
      // ── 1Y weekly bars: "Apr '25" — month + short year ──
      // e.g. "Jan '25", "Apr '25", "Oct '25"
      return `${mon} '${yr2}`;
    }

    // ── 5Y / MAX: "Apr 2024" — month + full year for clarity ──
    // e.g. "Jan 2022", "Jun 2023", "Apr 2026"
    return `${mon} ${yr4}`;
  };

  // ── Create lightweight-charts instance ────────────────────────
  // Re-runs only on theme change (dark/light)
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
        // ── FIX: Use exchange timezone offset to display correct local time ──
        localization: {
          timeFormatter: makeTimeFormatter(period),
        },
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
    // ── FIX: Re-apply correct timeFormatter every time period changes ──
    chartRef.current.applyOptions({
      timeScale: {
        timeVisible,
        barSpacing,
        localization: {
          timeFormatter: makeTimeFormatter(period),
        },
      },
    });
  }, [chartData, period, timeVisible, barSpacing]); // eslint-disable-line react-hooks/exhaustive-deps

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
            {/* Live price */}
            <div className={`text-4xl sm:text-5xl font-black tracking-tight leading-none mb-2 ${priceCls}`}>
              {price.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>

            {/* Change for the selected period */}
            <div className={`flex items-center gap-2 text-base font-bold ${isPos ? 'text-emerald-500' : 'text-red-500'}`}>
              {isPos ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
              <span>
                {pChange > 0 ? '+' : ''}{pChange.toFixed(2)}
                &nbsp;({pChangePct > 0 ? '+' : ''}{pChangePct.toFixed(2)}%)
              </span>
            </div>
          </div>

          {/* Period High / Low */}
          <div className="flex flex-col items-end gap-1 text-xs leading-relaxed shrink-0 min-w-[90px]">
            <div className={`w-full px-2 py-1 rounded border text-right ${hlCls}`}>
              H:&nbsp;<span className="font-semibold">
                {pHigh.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
              </span>
            </div>
            <div className={`w-full px-2 py-1 rounded border text-right ${hlCls}`}>
              L:&nbsp;<span className="font-semibold">
                {pLow.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Candlestick chart ─────────────────────────────────────── */}
      <div style={{ height: 280, position: 'relative' }}>
        {fetching && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: dark ? 'rgba(14,32,56,0.6)' : 'rgba(255,255,255,0.6)', zIndex: 5, borderRadius: 0 }}>
            <span style={{ fontSize: 11, color: dark ? '#94a3b8' : '#64748b' }}>Loading…</span>
          </div>
        )}
        <div ref={containerRef} style={{ width: '100%', height: '100%' }} />
      </div>

      {/* ── Period selector (only when historyUrl provided) ──────── */}
      {historyUrl && (
        <div className={`flex items-center gap-1 px-4 py-2 border-t flex-wrap ${dark ? 'border-white/[0.05]' : 'border-slate-100'}`}>
          {(['1D', '5D', '1M', '6M', 'YTD', '1Y', '5Y', 'MAX'] as const).map(p => (
            <button
              key={p}
              onClick={() => setActivePeriod(p)}
              className="text-[11px] font-bold px-2.5 py-1 rounded-lg transition-all"
              style={activePeriod === p
                ? { background: dark ? '#1e3a5f' : '#e0eaff', color: '#5194F6' }
                : { background: 'transparent', color: dark ? '#475569' : '#94a3b8' }
              }
            >
              {p}
            </button>
          ))}
        </div>
      )}

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