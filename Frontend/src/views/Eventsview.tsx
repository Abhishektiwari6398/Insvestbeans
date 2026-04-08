/**
 * EventsView.tsx — Terminal Trading Design (v4)
 *
 * Design: TradingView + Angelone + Zerodha Kite dark terminal aesthetic
 * - IBM Plex Mono for data labels, Outfit for headings
 * - Deep navy background, teal accent, red/green impact colors
 * - Dense sidebar filter + main event feed layout
 * - Live ticker bar, blinking status dots, accordion 5-section cards
 *
 * ALL hooks, logic, data mapping UNCHANGED from v3.
 * Only visual layer replaced.
 */

import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { useTheme } from "@/controllers/Themecontext";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import {
  Calendar, Globe, Flag, Clock, Megaphone, AlertCircle,
  TrendingUp, Landmark, BarChart2, Umbrella, BookOpen,
  RefreshCw, Zap, Activity, ExternalLink, Target,
  ChevronDown, ChevronUp, TrendingDown, Minus,
  DollarSign, Lightbulb, Eye, SlidersHorizontal,
  Radio, ArrowUpRight, ArrowDownRight,
} from "lucide-react";

// ─── API base ─────────────────────────────────────────────────────────────────
const _ROOT = (import.meta.env.VITE_API_URL || "http://localhost:8000").replace(/\/api\/v1\/?$/, "");
const API   = `${_ROOT}/api/v1`;

// ─── Types ────────────────────────────────────────────────────────────────────
type Region   = "india" | "global";
type Section  = "events" | "holidays";
type Category = "monetary" | "budget" | "earnings" | "economic" | "policy" | "holiday" | "geopolitical";

interface ApiEvent {
  date: string; region: string; title: string; impact: "High" | "Medium" | "Low";
  whatHappened?: string; whyItMatters?: string;
  marketImpact?: "bullish" | "bearish" | "mixed";
  impactTerm?: "short" | "medium" | "long" | "short-medium";
  whoAffected?: { assets: string[]; sectors: string[] };
  investbeansInsight?: string;
}

interface MarketEvent {
  id: string; date: string; title: string; description: string;
  region: Region; category: Category; impact: "High" | "Medium" | "Low"; source: "api" | "static";
  whatHappened?: string; whyItMatters?: string;
  marketImpact?: "bullish" | "bearish" | "mixed";
  impactTerm?: "short" | "medium" | "long" | "short-medium";
  whoAffected?: { assets: string[]; sectors: string[] };
  investbeansInsight?: string;
}

interface MacroSnapshot { usdInr?: number; vix?: number; }

interface BannerInsight {
  _id: string; title: string; description: string;
  investBeansInsight: {
    summary: string; marketSignificance: string; impactArea: string;
    stocksImpacted?: string; shortTermView: string; longTermView: string;
    keyRisk: string; impactScore: number;
  };
  sentiment: "positive" | "negative" | "neutral"; category: string;
  marketType: "domestic" | "global" | "commodities";
  credits: { source: string; author?: string; url?: string };
  readTime: string; publishedAt: string;
}

// ─── Static fallbacks ─────────────────────────────────────────────────────────
const INDIA_HOLIDAYS_STATIC: MarketEvent[] = [
  { id:"h-in-01", date:"2025-01-26", title:"Republic Day", description:"NSE & BSE closed.", region:"india", category:"holiday", impact:"Medium", source:"static" },
  { id:"h-in-02", date:"2025-02-26", title:"Mahashivratri", description:"NSE & BSE closed.", region:"india", category:"holiday", impact:"Low", source:"static" },
  { id:"h-in-03", date:"2025-03-14", title:"Holi", description:"NSE & BSE closed.", region:"india", category:"holiday", impact:"Low", source:"static" },
  { id:"h-in-04", date:"2025-03-31", title:"Id-Ul-Fitr (Eid)", description:"NSE & BSE closed.", region:"india", category:"holiday", impact:"Low", source:"static" },
  { id:"h-in-05", date:"2025-04-10", title:"Shri Ram Navami", description:"NSE & BSE closed.", region:"india", category:"holiday", impact:"Low", source:"static" },
  { id:"h-in-06", date:"2025-04-14", title:"Dr. Ambedkar Jayanti", description:"NSE & BSE closed.", region:"india", category:"holiday", impact:"Low", source:"static" },
  { id:"h-in-07", date:"2025-04-18", title:"Good Friday", description:"NSE & BSE closed.", region:"india", category:"holiday", impact:"Low", source:"static" },
  { id:"h-in-08", date:"2025-05-01", title:"Maharashtra Day", description:"BSE closed. NSE open.", region:"india", category:"holiday", impact:"Low", source:"static" },
  { id:"h-in-09", date:"2025-08-15", title:"Independence Day", description:"NSE & BSE closed.", region:"india", category:"holiday", impact:"Medium", source:"static" },
  { id:"h-in-10", date:"2025-08-27", title:"Ganesh Chaturthi", description:"NSE & BSE closed.", region:"india", category:"holiday", impact:"Low", source:"static" },
  { id:"h-in-11", date:"2025-10-02", title:"Gandhi Jayanti / Dussehra", description:"NSE & BSE closed.", region:"india", category:"holiday", impact:"Medium", source:"static" },
  { id:"h-in-12", date:"2025-10-20", title:"Diwali — Laxmi Puja", description:"NSE & BSE closed. Special Muhurat Trading after market hours.", region:"india", category:"holiday", impact:"High", source:"static" },
  { id:"h-in-13", date:"2025-10-21", title:"Diwali — Balipratipada", description:"NSE & BSE closed.", region:"india", category:"holiday", impact:"Low", source:"static" },
  { id:"h-in-14", date:"2025-11-05", title:"Guru Nanak Jayanti", description:"NSE & BSE closed.", region:"india", category:"holiday", impact:"Low", source:"static" },
  { id:"h-in-15", date:"2025-12-25", title:"Christmas", description:"NSE & BSE closed.", region:"india", category:"holiday", impact:"Low", source:"static" },
  { id:"h-in-16", date:"2026-01-26", title:"Republic Day 2026", description:"NSE & BSE closed.", region:"india", category:"holiday", impact:"Medium", source:"static" },
  { id:"h-in-17", date:"2026-02-14", title:"Maha Shivratri 2026", description:"NSE & BSE closed (tentative).", region:"india", category:"holiday", impact:"Low", source:"static" },
  { id:"h-in-18", date:"2026-03-04", title:"Holi 2026", description:"NSE & BSE closed (tentative).", region:"india", category:"holiday", impact:"Low", source:"static" },
];

const GLOBAL_HOLIDAYS_STATIC: MarketEvent[] = [
  { id:"h-gl-01", date:"2025-01-01", title:"New Year's Day", description:"NYSE, NASDAQ, LSE, Euronext all closed.", region:"global", category:"holiday", impact:"Medium", source:"static" },
  { id:"h-gl-02", date:"2025-01-20", title:"Martin Luther King Jr. Day", description:"NYSE & NASDAQ closed.", region:"global", category:"holiday", impact:"Low", source:"static" },
  { id:"h-gl-03", date:"2025-02-17", title:"Presidents' Day (US)", description:"NYSE & NASDAQ closed.", region:"global", category:"holiday", impact:"Low", source:"static" },
  { id:"h-gl-04", date:"2025-04-18", title:"Good Friday", description:"NYSE, NASDAQ, LSE, Euronext all closed.", region:"global", category:"holiday", impact:"Medium", source:"static" },
  { id:"h-gl-05", date:"2025-04-21", title:"Easter Monday", description:"LSE & Euronext closed. NYSE open.", region:"global", category:"holiday", impact:"Low", source:"static" },
  { id:"h-gl-06", date:"2025-05-05", title:"Early May Bank Holiday (UK)", description:"LSE closed.", region:"global", category:"holiday", impact:"Low", source:"static" },
  { id:"h-gl-07", date:"2025-05-26", title:"Memorial Day (US)", description:"NYSE & NASDAQ closed.", region:"global", category:"holiday", impact:"Low", source:"static" },
  { id:"h-gl-08", date:"2025-07-04", title:"US Independence Day", description:"NYSE & NASDAQ closed.", region:"global", category:"holiday", impact:"Medium", source:"static" },
  { id:"h-gl-09", date:"2025-09-01", title:"Labor Day (US)", description:"NYSE & NASDAQ closed.", region:"global", category:"holiday", impact:"Low", source:"static" },
  { id:"h-gl-10", date:"2025-11-27", title:"Thanksgiving Day (US)", description:"NYSE & NASDAQ closed.", region:"global", category:"holiday", impact:"Low", source:"static" },
  { id:"h-gl-11", date:"2025-12-25", title:"Christmas Day", description:"NYSE, NASDAQ, LSE, Euronext all closed.", region:"global", category:"holiday", impact:"Medium", source:"static" },
  { id:"h-gl-12", date:"2025-12-26", title:"Boxing Day", description:"LSE & Euronext closed.", region:"global", category:"holiday", impact:"Low", source:"static" },
  { id:"h-gl-13", date:"2026-01-01", title:"New Year's Day 2026", description:"All major global exchanges closed.", region:"global", category:"holiday", impact:"Medium", source:"static" },
  { id:"h-gl-14", date:"2026-01-19", title:"MLK Day 2026", description:"NYSE & NASDAQ closed.", region:"global", category:"holiday", impact:"Low", source:"static" },
  { id:"h-gl-15", date:"2026-02-16", title:"Presidents' Day 2026", description:"NYSE & NASDAQ closed.", region:"global", category:"holiday", impact:"Low", source:"static" },
  { id:"h-gl-16", date:"2026-04-03", title:"Good Friday 2026", description:"NYSE, NASDAQ, LSE, Euronext all closed.", region:"global", category:"holiday", impact:"Medium", source:"static" },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const MONTHS_FULL = ["January","February","March","April","May","June","July","August","September","October","November","December"];
function parseDate(s: string) { return new Date(s + "T00:00:00"); }
function isPast(d: string) { return parseDate(d) < new Date(new Date().setHours(0,0,0,0)); }
function isToday(d: string) {
  const t = new Date(); const p = parseDate(d);
  return p.getDate()===t.getDate() && p.getMonth()===t.getMonth() && p.getFullYear()===t.getFullYear();
}
function daysUntil(d: string) {
  const diff = parseDate(d).getTime() - new Date(new Date().setHours(0,0,0,0)).getTime();
  return Math.ceil(diff / 86400000);
}
function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const h = Math.floor(diff / 3600000); const d = Math.floor(diff / 86400000);
  if (h < 1) return "Just now"; if (h < 24) return `${h}h ago`;
  if (d < 7) return `${d}d ago`;
  return new Date(dateStr).toLocaleDateString("en-IN", { day:"numeric", month:"short" });
}
function mapRegion(r: string): Region { return r.toLowerCase().includes("india") ? "india" : "global"; }
function inferCategory(title: string): Category {
  const t = title.toLowerCase();
  if (/cpi|inflation|gdp|payroll|pmi|trade balance|jobs report|retail sales/.test(t)) return "economic";
  if (/fomc|rbi|mpc|ecb|boj|boe|monetary policy|rate decision|jackson hole|fed funds/.test(t)) return "monetary";
  if (/budget|fiscal/.test(t)) return "budget";
  if (/earnings|results|q[1-4]\s+fy/.test(t)) return "earnings";
  if (/gst|policy|regulation/.test(t)) return "policy";
  return "economic";
}
function buildDescription(e: ApiEvent): string {
  if (e.whatHappened) return e.whatHappened;
  const cat = inferCategory(e.title);
  if (cat === "monetary") return `${e.region} central bank rate decision — tracked for rate direction and currency impact.`;
  if (cat === "economic") return `${e.region} macro data release — high-frequency indicator watched by institutional investors.`;
  return `${e.region} policy event — expect elevated volatility around announcement.`;
}

// ─── Design tokens — Trading Terminal ─────────────────────────────────────────
// Light/dark variants
const T = {
  dark: {
    pageBg:       "#07111b",
    panelBg:      "#0c1821",
    cardBg:       "#0f1e2d",
    cardHover:    "#131c2a",
    elevated:     "#141c27",
    border:       "#1a2d3f",
    borderBright: "#243348",
    accent:       "#74A8C9",
    accentDim:    "rgba(116,168,201,0.12)",
    accentBorder: "rgba(116,168,201,0.30)",
    green:        "#00d084",
    greenDim:     "rgba(0,208,132,0.1)",
    red:          "#ff4757",
    redDim:       "rgba(255,71,87,0.1)",
    amber:        "#ffa825",
    amberDim:     "rgba(255,168,37,0.1)",
    blue:         "#3d9aff",
    blueDim:      "rgba(61,154,255,0.1)",
    purple:       "#a78bfa",
    purpleDim:    "rgba(167,139,250,0.1)",
    textPrimary:  "#e2e8f0",
    textSecond:   "#a0b4c8",
    textMuted:    "#6b8aaa",
    textTiny:     "#4a6680",
    tickerBg:     "#080b10",
  },
  light: {
    pageBg:       "#f5f4f0",
    panelBg:      "#ffffff",
    cardBg:       "#ffffff",
    cardHover:    "#f7f9fc",
    elevated:     "#f0f4f8",
    border:       "#dde3ec",
    borderBright: "#c8d3e0",
    accent:       "#0A3656",
    accentDim:    "rgba(10,54,86,0.08)",
    accentBorder: "rgba(10,54,86,0.25)",
    green:        "#0ab066",
    greenDim:     "rgba(10,176,102,0.08)",
    red:          "#e8334a",
    redDim:       "rgba(232,51,74,0.08)",
    amber:        "#d97706",
    amberDim:     "rgba(217,119,6,0.08)",
    blue:         "#2563eb",
    blueDim:      "rgba(37,99,235,0.08)",
    purple:       "#7c3aed",
    purpleDim:    "rgba(124,58,237,0.08)",
    textPrimary:  "#0f172a",
    textSecond:   "#1e293b",
    textMuted:    "#475569",
    textTiny:     "#64748b",
    tickerBg:     "#0d1117",
  },
};

// ─── Category config ──────────────────────────────────────────────────────────
const CAT_CONFIG: Record<Category, { icon: React.ElementType; label: string; colorKey: string }> = {
  monetary:    { icon: TrendingUp,  label: "Monetary",    colorKey: "blue"   },
  budget:      { icon: Landmark,    label: "Budget",      colorKey: "purple" },
  earnings:    { icon: BarChart2,   label: "Earnings",    colorKey: "green"  },
  economic:    { icon: Activity,    label: "Economic",    colorKey: "blue"   },
  policy:      { icon: BookOpen,    label: "Policy",      colorKey: "amber"  },
  holiday:     { icon: Umbrella,    label: "Holiday",     colorKey: "textMuted" },
  geopolitical:{ icon: Globe,       label: "Geopolitical",colorKey: "red"    },
};
const IMP_CONFIG = {
  High:   { label: "HIGH",   bar: 3 },
  Medium: { label: "MED",    bar: 2 },
  Low:    { label: "LOW",    bar: 1 },
};
const MI_CONFIG = {
  bullish: { icon: ArrowUpRight,   label: "BULLISH",  colorKey: "green"  },
  bearish: { icon: ArrowDownRight, label: "BEARISH",  colorKey: "red"    },
  mixed:   { icon: Minus,          label: "MIXED",    colorKey: "amber"  },
};
const ASSET_COLOR: Record<string, string> = {
  "Equity":      "#74A8C9",
  "Bonds":       "#a78bfa",
  "Forex":       "#ffa825",
  "Commodities": "#00d084",
};

// ─── Hooks (UNCHANGED from v3) ────────────────────────────────────────────────
function useMarketEvents() {
  const [apiEvents,   setApiEvents]   = useState<MarketEvent[]>([]);
  const [macro,       setMacro]       = useState<MacroSnapshot>({});
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState<string | null>(null);
  const [lastFetched, setLastFetched] = useState<Date | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const res  = await fetch(`${API}/markets/global`, { credentials: "include" });
      if (!res.ok) throw new Error(`Server ${res.status}`);
      const data = await res.json();
      const raw: ApiEvent[] = Array.isArray(data?.events) ? data.events : [];
      const events: MarketEvent[] = raw.map((e, i) => ({
        id: `api-${i}`, date: e.date, title: e.title, description: buildDescription(e),
        region: mapRegion(e.region), category: inferCategory(e.title),
        impact: (e.impact as any) ?? "Medium", source: "api",
        whatHappened: e.whatHappened, whyItMatters: e.whyItMatters,
        marketImpact: e.marketImpact, impactTerm: e.impactTerm,
        whoAffected: e.whoAffected, investbeansInsight: e.investbeansInsight,
      }));
      setApiEvents(events);
      setMacro({
        usdInr: data?.forex?.find((f: any) => f.pair === "USD/INR")?.rate,
        vix:    data?.vix?.value,
      });
      setLastFetched(new Date());
    } catch (err: any) {
      setError(err.message || "Network error");
    } finally { setLoading(false); }
  }, []);
  useEffect(() => { fetchData(); }, [fetchData]);
  return { apiEvents, macro, loading, error, refresh: fetchData, lastFetched };
}

function useInsightBanner() {
  const [insight, setInsight] = useState<BannerInsight | null>(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true); setError(null);
      try {
        const res  = await fetch(`${API}/insights/events-banner`, { credentials: "include" });
        if (!res.ok) throw new Error(`${res.status}`);
        const json = await res.json();
        if (!cancelled) setInsight(json?.data ?? null);
      } catch (e: any) {
        if (!cancelled) setError(e.message ?? "failed");
      } finally { if (!cancelled) setLoading(false); }
    })();
    return () => { cancelled = true; };
  }, []);
  return { insight, loading, error };
}

function useKiteHolidays() {
  const [indiaHolidays, setIndiaHolidays] = useState<MarketEvent[]>(INDIA_HOLIDAYS_STATIC);
  const [fromApi,       setFromApi]       = useState(false);
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const year = new Date().getFullYear();
        const res  = await fetch(`${API}/kite/holidays?year=${year}`, { credentials: "include" });
        if (!res.ok) return;
        const json = await res.json();
        if (json?.status !== "success" || !Array.isArray(json?.data)) return;
        const mapped: MarketEvent[] = json.data
          .filter((h: any) => h.date && h.reason)
          .map((h: any, i: number) => ({
            id: `kite-h-${i}`, date: h.date, title: h.reason,
            description: "NSE & BSE closed — official Kite/Zerodha trading holiday calendar.",
            region: "india" as Region, category: "holiday" as Category,
            impact: "Medium" as const, source: "api" as const,
          }));
        if (!cancelled && mapped.length > 0) { setIndiaHolidays(mapped); setFromApi(true); }
      } catch { /* static fallback */ }
    })();
    return () => { cancelled = true; };
  }, []);
  return { indiaHolidays, fromApi };
}

// ─── LiveTicker bar ───────────────────────────────────────────────────────────
const LiveTickerBar: React.FC<{ macro: MacroSnapshot; eventCount: number; upcomingCount: number; isLight: boolean }> = ({ macro, eventCount, upcomingCount, isLight }) => {
  const bg         = isLight ? "#1a2535"   : "#080b10";
  const borderCol  = isLight ? "#2e3f56"   : "#1a2535";
  const labelCol   = isLight ? "#7a9ab8"   : "#3d5168";
  const dividerCol = isLight ? "#2e3f56"   : "#1a2535";
  const accentCol  = isLight ? "#0A3656"   : "#74A8C9";
  const valueCol   = isLight ? "#e2f0ff"   : "#e2e8f0";
  const greenCol   = isLight ? "#00d084"   : "#00d084";

  const items = [
    { label: "USD/INR",  value: macro.usdInr ? macro.usdInr.toFixed(2) : "—",    color: valueCol },
    { label: "VIX",      value: macro.vix ? macro.vix.toFixed(2) : "—",           color: macro.vix ? (macro.vix < 20 ? greenCol : macro.vix < 30 ? "#ffa825" : "#ff4757") : valueCol },
    { label: "EVENTS",   value: String(eventCount),                                color: accentCol },
    { label: "UPCOMING", value: String(upcomingCount),                             color: greenCol  },
    { label: "CALENDAR", value: "NSE · BSE · NYSE · LSE",                          color: labelCol  },
    { label: "DATA",     value: "Yahoo Finance · RBI · FOMC · ECB",                color: labelCol  },
  ];
  return (
    <div style={{
      background: bg, borderBottom: `1px solid ${borderCol}`,
      padding: "0 20px", height: 32,
      display: "flex", alignItems: "center", gap: 0,
      overflow: "hidden",
    }}>
      {/* Live pulse */}
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginRight: 20, flexShrink: 0 }}>
        <span style={{
          width: 6, height: 6, borderRadius: "50%", background: accentCol,
          boxShadow: "0 0 0 0 rgba(116,168,201,0.4)",
          animation: "tickerPulse 2s infinite",
        }} />
        <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.16em", color: accentCol, fontFamily: "'IBM Plex Mono', monospace", textTransform: "uppercase" }}>
          LIVE
        </span>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 0, overflowX: "auto", scrollbarWidth: "none" }}>
        {items.map((item, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, paddingRight: 20, marginRight: 20, borderRight: `1px solid ${dividerCol}`, flexShrink: 0, whiteSpace: "nowrap" }}>
            <span style={{ fontSize: 9, letterSpacing: "0.12em", color: labelCol, fontFamily: "'IBM Plex Mono', monospace", textTransform: "uppercase" }}>{item.label}</span>
            <span style={{ fontSize: 11, fontWeight: 600, color: item.color, fontFamily: "'IBM Plex Mono', monospace" }}>{item.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

// ─── InsightTerminalBox ───────────────────────────────────────────────────────
const InsightTerminalBox: React.FC<{ isLight: boolean; tk: typeof T.dark }> = ({ isLight, tk }) => {
  const { insight, loading, error } = useInsightBanner();

  if (loading) return (
    <div style={{
      background: tk.cardBg, border: `1px solid ${tk.border}`,
      borderRadius: 10, padding: "14px 18px", marginBottom: 16,
    }}>
      <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
        <div style={{ width: 6, height: 6, borderRadius: "50%", background: tk.accent, animation: "tickerPulse 1.5s infinite" }} />
        <div style={{ height: 10, width: 120, borderRadius: 4, background: tk.border }} />
        <div style={{ height: 10, width: 200, borderRadius: 4, background: tk.border, marginLeft: "auto" }} />
      </div>
    </div>
  );

  if (!insight || error) return (
    <div style={{
      background: tk.cardBg, border: `1px dashed ${tk.border}`,
      borderRadius: 10, padding: "12px 18px", marginBottom: 16,
      display: "flex", alignItems: "center", gap: 10,
    }}>
      <Radio size={12} color={tk.textMuted} />
      <span style={{ fontSize: 11, color: tk.textMuted, fontFamily: "'IBM Plex Mono', monospace" }}>
        {error ? "SIGNAL LOST — CHECK CONNECTION" : "NO INSIGHTS QUEUED — CHECK BACK SOON"}
      </span>
    </div>
  );

  const ibi = insight.investBeansInsight;
  const scoreColor = ibi.impactScore >= 7 ? tk.red : ibi.impactScore >= 4 ? tk.amber : tk.green;
  const sentColors = {
    positive: { c: tk.green, bg: tk.greenDim },
    negative: { c: tk.red,   bg: tk.redDim   },
    neutral:  { c: tk.textSecond, bg: tk.elevated },
  };
  const sc = sentColors[insight.sentiment] ?? sentColors.neutral;

  return (
    <div style={{
      background: tk.cardBg, border: `1px solid ${tk.accentBorder}`,
      borderRadius: 10, overflow: "hidden", marginBottom: 16,
      position: "relative",
    }}>
      {/* top accent line */}
      <div style={{ height: 2, background: `linear-gradient(90deg, ${tk.accent}, transparent)` }} />
      <div style={{ padding: "12px 18px" }}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
          <div style={{
            width: 30, height: 30, borderRadius: 8, flexShrink: 0,
            background: tk.accentDim, border: `1px solid ${tk.accentBorder}`,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <Megaphone size={13} color={tk.accent} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 6, marginBottom: 6 }}>
              <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.18em", color: tk.accent, fontFamily: "'IBM Plex Mono', monospace", textTransform: "uppercase" }}>
                INVESTBEANS INSIGHT
              </span>
              <span style={{
                fontSize: 9, fontWeight: 700, padding: "2px 7px", borderRadius: 3,
                background: sc.bg, color: sc.c,
                fontFamily: "'IBM Plex Mono', monospace", letterSpacing: "0.1em",
              }}>
                {insight.sentiment.toUpperCase()}
              </span>
              <span style={{
                fontSize: 9, padding: "2px 7px", borderRadius: 3,
                background: `${scoreColor}18`, color: scoreColor,
                fontFamily: "'IBM Plex Mono', monospace", letterSpacing: "0.08em", marginLeft: "auto",
              }}>
                IMPACT {ibi.impactScore}/10
              </span>
            </div>
            <h3 style={{ fontSize: 13, fontWeight: 600, color: tk.textPrimary, margin: "0 0 5px", lineHeight: 1.4, fontFamily: "'Outfit', sans-serif" }}>
              {insight.title}
            </h3>
            <p style={{ fontSize: 11.5, color: tk.textSecond, margin: "0 0 8px", lineHeight: 1.65 }}>
              {ibi.summary}
            </p>
            {ibi.shortTermView && (
              <div style={{
                display: "inline-flex", alignItems: "flex-start", gap: 6,
                padding: "5px 10px", borderRadius: 6, marginRight: 8,
                background: tk.accentDim, border: `1px solid ${tk.accentBorder}`,
              }}>
                <Target size={9} color={tk.accent} style={{ flexShrink: 0, marginTop: 2 }} />
                <span style={{ fontSize: 10.5, lineHeight: 1.5, color: tk.textSecond }}>
                  <span style={{ color: tk.accent, fontWeight: 600 }}>Near-term: </span>
                  {ibi.shortTermView.length > 90 ? ibi.shortTermView.slice(0, 90) + "…" : ibi.shortTermView}
                </span>
              </div>
            )}
            {ibi.keyRisk && (
              <div style={{
                display: "inline-flex", alignItems: "flex-start", gap: 6,
                padding: "5px 10px", borderRadius: 6,
                background: tk.redDim, border: `1px solid rgba(255,71,87,0.2)`,
              }}>
                <AlertCircle size={9} color={tk.red} style={{ flexShrink: 0, marginTop: 2 }} />
                <span style={{ fontSize: 10.5, lineHeight: 1.5, color: tk.textSecond }}>
                  <span style={{ color: tk.red, fontWeight: 600 }}>Risk: </span>
                  {ibi.keyRisk.length > 80 ? ibi.keyRisk.slice(0, 80) + "…" : ibi.keyRisk}
                </span>
              </div>
            )}
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 8 }}>
              <span style={{ fontSize: 10, color: tk.textMuted, fontFamily: "'IBM Plex Mono', monospace" }}>
                {insight.credits.source} · {timeAgo(insight.publishedAt)} · {insight.readTime}
              </span>
              {insight.credits.url && (
                <a href={insight.credits.url} target="_blank" rel="noopener noreferrer"
                  style={{
                    marginLeft: "auto", display: "inline-flex", alignItems: "center", gap: 4,
                    fontSize: 10, fontWeight: 600, color: tk.accent, textDecoration: "none",
                    fontFamily: "'IBM Plex Mono', monospace",
                  }}>
                  SOURCE <ExternalLink size={9} />
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── ImpactMeter ──────────────────────────────────────────────────────────────
const ImpactMeter: React.FC<{ impact: "High" | "Medium" | "Low"; tk: typeof T.dark }> = ({ impact, tk }) => {
  const bars = IMP_CONFIG[impact].bars ?? IMP_CONFIG[impact].bar;
  const color = impact === "High" ? tk.red : impact === "Medium" ? tk.amber : tk.textMuted;
  return (
    <div style={{ display: "flex", gap: 2, alignItems: "center" }}>
      {[1,2,3].map(i => (
        <div key={i} style={{
          width: 3, height: i <= bars ? 10 : 6,
          borderRadius: 2,
          background: i <= bars ? color : tk.border,
          alignSelf: "flex-end",
          transition: "all 0.2s",
        }} />
      ))}
    </div>
  );
};

// ─── EventTerminalCard ────────────────────────────────────────────────────────
const EventTerminalCard: React.FC<{ event: MarketEvent; isLight: boolean; tk: typeof T.dark; idx: number }> = ({ event, isLight, tk, idx }) => {
  const [expanded, setExpanded] = useState(false);
  const past = isPast(event.date);
  const today_ = isToday(event.date);
  const days = daysUntil(event.date);
  const catCfg = CAT_CONFIG[event.category] ?? CAT_CONFIG.economic;
  const Icon = catCfg.icon;
  const catColor = (tk as any)[catCfg.colorKey] ?? tk.accent;
  const d = parseDate(event.date);
  const hasDetail = !!(event.whatHappened || event.whyItMatters || event.marketImpact || event.whoAffected || event.investbeansInsight);
  const miCfg = event.marketImpact ? MI_CONFIG[event.marketImpact] : null;
  const MiIcon = miCfg?.icon ?? Minus;
  const miColor = miCfg ? (tk as any)[miCfg.colorKey] : tk.textMuted;

  // Countdown badge
  const countdownEl = !past && (
    today_
      ? <span style={{ fontSize: 9, fontWeight: 700, padding: "2px 7px", borderRadius: 3, background: `${tk.green}18`, color: tk.green, fontFamily: "'IBM Plex Mono', monospace", letterSpacing: "0.1em" }}>TODAY</span>
      : days <= 7
      ? <span style={{ fontSize: 9, fontWeight: 700, padding: "2px 7px", borderRadius: 3, background: tk.amberDim, color: tk.amber, fontFamily: "'IBM Plex Mono', monospace" }}>{days}D</span>
      : null
  );

  return (
    <div
      style={{
        background: past ? "transparent" : expanded ? tk.cardHover : tk.cardBg,
        border: `1px solid ${past ? tk.textTiny : expanded ? tk.borderBright : tk.border}`,
        borderRadius: 8,
        opacity: past ? 0.5 : 1,
        transition: "all 0.15s",
        animation: `fadeSlideIn 0.25s ease both`,
        animationDelay: `${idx * 0.04}s`,
        overflow: "hidden",
      }}
    >
      {/* ── Main row ─────────────────────────────────────────── */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "52px 1fr auto",
          gap: 0,
          cursor: hasDetail ? "pointer" : "default",
        }}
        onClick={() => hasDetail && setExpanded(p => !p)}
      >
        {/* Date column */}
        <div style={{
          display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
          padding: "12px 0",
          borderRight: `1px solid ${tk.border}`,
          background: past ? "transparent" : `${catColor}08`,
        }}>
          <span style={{ fontSize: 20, fontWeight: 700, lineHeight: 1, color: past ? tk.textMuted : catColor, fontFamily: "'IBM Plex Mono', monospace" }}>
            {String(d.getDate()).padStart(2, "0")}
          </span>
          <span style={{ fontSize: 8, fontWeight: 600, letterSpacing: "0.12em", marginTop: 2, color: tk.textMuted, fontFamily: "'IBM Plex Mono', monospace", textTransform: "uppercase" }}>
            {MONTHS[d.getMonth()]}
          </span>
          <span style={{ fontSize: 8, color: tk.textTiny, fontFamily: "'IBM Plex Mono', monospace" }}>
            {d.getFullYear()}
          </span>
        </div>

        {/* Content column */}
        <div style={{ padding: "10px 14px", minWidth: 0 }}>
          {/* Header row */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 5, flexWrap: "wrap" }}>
            <div style={{
              width: 22, height: 22, borderRadius: 5, flexShrink: 0,
              display: "flex", alignItems: "center", justifyContent: "center",
              background: `${catColor}15`,
            }}>
              <Icon size={11} color={catColor} />
            </div>
            <span style={{ fontSize: 13, fontWeight: 600, color: tk.textPrimary, lineHeight: 1.3, flex: 1, minWidth: 0, fontFamily: "'Outfit', sans-serif" }}>
              {event.title}
            </span>
            {countdownEl}
            {event.source === "api" && (
              <span style={{
                fontSize: 8, fontWeight: 700, padding: "2px 6px", borderRadius: 3, letterSpacing: "0.14em",
                background: tk.accentDim, color: tk.accent, border: `1px solid ${tk.accentBorder}`,
                fontFamily: "'IBM Plex Mono', monospace",
              }}>LIVE</span>
            )}
          </div>

          {/* Tags row */}
          <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 6 }}>
            {/* Category */}
            <span style={{
              fontSize: 9, padding: "2px 7px", borderRadius: 3,
              background: `${catColor}12`, color: catColor,
              fontFamily: "'IBM Plex Mono', monospace", letterSpacing: "0.08em", fontWeight: 600,
            }}>
              {catCfg.label.toUpperCase()}
            </span>

            {/* Market impact */}
            {miCfg && (
              <span style={{
                fontSize: 9, padding: "2px 7px", borderRadius: 3, letterSpacing: "0.08em", fontWeight: 600,
                background: `${miColor}12`, color: miColor,
                fontFamily: "'IBM Plex Mono', monospace",
                display: "inline-flex", alignItems: "center", gap: 3,
              }}>
                <MiIcon size={8} />
                {miCfg.label}
              </span>
            )}

            {/* Impact term */}
            {event.impactTerm && (
              <span style={{
                fontSize: 9, padding: "2px 7px", borderRadius: 3,
                background: tk.elevated, color: tk.textSecond,
                fontFamily: "'IBM Plex Mono', monospace",
              }}>
                {event.impactTerm.toUpperCase()}
              </span>
            )}

            {/* Status */}
            {past
              ? <span style={{ fontSize: 9, color: tk.textMuted, marginLeft: "auto", fontFamily: "'IBM Plex Mono', monospace" }}>COMPLETED</span>
              : <span style={{ display: "inline-flex", alignItems: "center", gap: 4, marginLeft: "auto" }}>
                  <span style={{ width: 5, height: 5, borderRadius: "50%", background: tk.green, boxShadow: `0 0 0 2px ${tk.greenDim}`, animation: "tickerPulse 2s infinite" }} />
                  <span style={{ fontSize: 9, color: tk.green, fontFamily: "'IBM Plex Mono', monospace", fontWeight: 600 }}>UPCOMING</span>
                </span>
            }
          </div>

          {/* Description — short */}
          {!expanded && event.description && (
            <p style={{ fontSize: 11, color: tk.textMuted, margin: "6px 0 0", lineHeight: 1.6, overflow: "hidden", textOverflow: "ellipsis", display: "-webkit-box", WebkitLineClamp: 1, WebkitBoxOrient: "vertical" as any }}>
              {event.description}
            </p>
          )}
        </div>

        {/* Right — impact meter + chevron */}
        <div style={{
          display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
          padding: "0 14px", gap: 8, borderLeft: `1px solid ${tk.border}`,
        }}>
          <ImpactMeter impact={event.impact} tk={tk} />
          <span style={{ fontSize: 8, color: IMP_CONFIG[event.impact] ? (event.impact === "High" ? tk.red : event.impact === "Medium" ? tk.amber : tk.textMuted) : tk.textMuted, fontFamily: "'IBM Plex Mono', monospace", fontWeight: 700 }}>
            {IMP_CONFIG[event.impact]?.label}
          </span>
          {hasDetail && (
            <div style={{
              width: 20, height: 20, borderRadius: 4,
              background: expanded ? tk.accentDim : tk.elevated,
              border: `1px solid ${expanded ? tk.accentBorder : tk.border}`,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              {expanded ? <ChevronUp size={11} color={tk.accent} /> : <ChevronDown size={11} color={tk.textMuted} />}
            </div>
          )}
        </div>
      </div>

      {/* ── Expanded 5-section panel ──────────────────────────── */}
      {expanded && hasDetail && (
        <div style={{ borderTop: `1px solid ${tk.border}` }}>

          {/* 1 — What Happened */}
          {event.whatHappened && (
            <div style={{ padding: "12px 18px 12px 18px", borderBottom: `1px solid ${tk.border}`, background: tk.elevated }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 7 }}>
                <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.14em", color: tk.accent, fontFamily: "'IBM Plex Mono', monospace" }}>01 — WHAT HAPPENED</span>
                <Eye size={10} color={tk.accent} />
              </div>
              <p style={{ fontSize: 12, color: tk.textSecond, margin: 0, lineHeight: 1.7 }}>{event.whatHappened}</p>
            </div>
          )}

          {/* 2 — Why It Matters */}
          {event.whyItMatters && (
            <div style={{ padding: "12px 18px", borderBottom: `1px solid ${tk.border}` }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 7 }}>
                <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.14em", color: tk.purple, fontFamily: "'IBM Plex Mono', monospace" }}>02 — WHY IT MATTERS</span>
                <Zap size={10} color={tk.purple} />
              </div>
              <p style={{ fontSize: 12, color: tk.textSecond, margin: 0, lineHeight: 1.7 }}>{event.whyItMatters}</p>
            </div>
          )}

          {/* 3 — Market Impact */}
          {event.marketImpact && (
            <div style={{ padding: "12px 18px", borderBottom: `1px solid ${tk.border}`, background: tk.elevated }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.14em", color: miColor, fontFamily: "'IBM Plex Mono', monospace" }}>03 — MARKET IMPACT</span>
                <MiIcon size={10} color={miColor} />
              </div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {miCfg && (
                  <span style={{
                    fontSize: 11, fontWeight: 700, padding: "4px 12px", borderRadius: 5,
                    background: `${miColor}15`, color: miColor,
                    display: "inline-flex", alignItems: "center", gap: 5,
                    fontFamily: "'IBM Plex Mono', monospace", letterSpacing: "0.08em",
                  }}>
                    <MiIcon size={10} /> {miCfg.label}
                  </span>
                )}
                {event.impactTerm && (
                  <span style={{
                    fontSize: 11, fontWeight: 600, padding: "4px 12px", borderRadius: 5,
                    background: tk.elevated, color: tk.textSecond,
                    fontFamily: "'IBM Plex Mono', monospace",
                    border: `1px solid ${tk.border}`,
                  }}>
                    {event.impactTerm.toUpperCase()} TERM
                  </span>
                )}
              </div>
            </div>
          )}

          {/* 4 — Who Is Affected */}
          {event.whoAffected && (event.whoAffected.assets.length > 0 || event.whoAffected.sectors.length > 0) && (
            <div style={{ padding: "12px 18px", borderBottom: `1px solid ${tk.border}` }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.14em", color: tk.blue, fontFamily: "'IBM Plex Mono', monospace" }}>04 — WHO IS AFFECTED</span>
                <DollarSign size={10} color={tk.blue} />
              </div>
              {event.whoAffected.assets.length > 0 && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginBottom: 8 }}>
                  {event.whoAffected.assets.map(a => {
                    const ac = ASSET_COLOR[a] ?? tk.blue;
                    return (
                      <span key={a} style={{
                        fontSize: 10, fontWeight: 700, padding: "3px 10px", borderRadius: 4,
                        background: `${ac}14`, color: ac, fontFamily: "'IBM Plex Mono', monospace",
                        letterSpacing: "0.06em",
                      }}>{a.toUpperCase()}</span>
                    );
                  })}
                </div>
              )}
              {event.whoAffected.sectors.length > 0 && (
                <p style={{ fontSize: 11.5, color: tk.textSecond, margin: 0, lineHeight: 1.7 }}>
                  {event.whoAffected.sectors.join("  ·  ")}
                </p>
              )}
            </div>
          )}

          {/* 5 — InvestBeans Take */}
          {event.investbeansInsight && (
            <div style={{
              padding: "12px 18px",
              background: isLight ? `${tk.accentDim}` : `linear-gradient(135deg, rgba(116,168,201,0.06), transparent)`,
              borderTop: `1px solid ${tk.accentBorder}`,
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 7 }}>
                <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.14em", color: tk.accent, fontFamily: "'IBM Plex Mono', monospace" }}>05 — INVESTBEANS TAKE</span>
                <Lightbulb size={10} color={tk.accent} />
                <span style={{
                  fontSize: 8, padding: "1px 6px", borderRadius: 3, marginLeft: 4,
                  background: tk.accentDim, color: tk.textMuted,
                  fontFamily: "'IBM Plex Mono', monospace", letterSpacing: "0.08em",
                }}>GUIDANCE · NOT ADVICE</span>
              </div>
              <p style={{ fontSize: 12, color: isLight ? tk.textPrimary : "#9bc1da", margin: 0, lineHeight: 1.75, fontStyle: "italic" }}>
                {event.investbeansInsight}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ─── Main EventsView ──────────────────────────────────────────────────────────
const EventsView: React.FC = () => {
  const { theme }  = useTheme();
  const isLight    = theme === "light";
  const tk         = isLight ? T.light : T.dark;

  const [searchParams, setSearchParams] = useSearchParams();
  const [region,   setRegion]   = useState<Region>((searchParams.get("region")  as Region)  ?? "india");
  const [section,  setSection]  = useState<Section>((searchParams.get("section") as Section) ?? "events");
  const [selMonth, setSelMonth] = useState<number | null>(null);
  const [sideOpen, setSideOpen] = useState(true);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  useEffect(() => {
    setRegion((searchParams.get("region")  as Region)  ?? "india");
    setSection((searchParams.get("section") as Section) ?? "events");
    setSelMonth(null);
  }, [searchParams]);

  const { apiEvents, macro, loading, error, refresh, lastFetched } = useMarketEvents();
  const { indiaHolidays, fromApi: holidaysFromApi } = useKiteHolidays();

  const handleTab = (r: Region, s: Section) => {
    setRegion(r); setSection(s); setSelMonth(null);
    setSearchParams({ region: r, section: s });
  };

  const sourceEvents = useMemo<MarketEvent[]>(() => {
    if (section === "holidays") return region === "india" ? indiaHolidays : GLOBAL_HOLIDAYS_STATIC;
    return apiEvents.filter(e => e.region === region);
  }, [section, region, apiEvents, indiaHolidays]);

  const availableMonths = useMemo(() => {
    const s = new Set(sourceEvents.map(e => parseDate(e.date).getMonth()));
    return Array.from(s).sort((a, b) => a - b);
  }, [sourceEvents]);

  const filteredEvents = useMemo<MarketEvent[]>(() => {
    let evts = sourceEvents;
    if (selMonth !== null) evts = evts.filter(e => parseDate(e.date).getMonth() === selMonth);
    const up   = evts.filter(e => !isPast(e.date)).sort((a, b) => parseDate(a.date).getTime() - parseDate(b.date).getTime());
    const past = evts.filter(e =>  isPast(e.date)).sort((a, b) => parseDate(b.date).getTime() - parseDate(a.date).getTime());
    return [...up, ...past];
  }, [sourceEvents, selMonth]);

  const grouped = useMemo(() => {
    const map = new Map<string, { label: string; events: MarketEvent[] }>();
    for (const e of filteredEvents) {
      const d = parseDate(e.date);
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      if (!map.has(key)) map.set(key, { label: `${MONTHS_FULL[d.getMonth()]} ${d.getFullYear()}`, events: [] });
      map.get(key)!.events.push(e);
    }
    return map;
  }, [filteredEvents]);

  const upcomingCount = filteredEvents.filter(e => !isPast(e.date)).length;
  const pastCount     = filteredEvents.filter(e => isPast(e.date)).length;
  const highCount     = filteredEvents.filter(e => e.impact === "High").length;

  const btnStyle = (active: boolean): React.CSSProperties => ({
    display: "flex", alignItems: "center", gap: 6,
    padding: "7px 14px", borderRadius: 6,
    fontSize: 11, fontWeight: 600, cursor: "pointer",
    letterSpacing: "0.04em",
    border: `1px solid ${active ? tk.accentBorder : tk.border}`,
    background: active ? tk.accentDim : "transparent",
    color: active ? tk.accent : tk.textSecond,
    transition: "all 0.15s",
    fontFamily: "'IBM Plex Mono', monospace",
    whiteSpace: "nowrap",
  });

  const sectionBtnStyle = (active: boolean): React.CSSProperties => ({
    flex: 1, padding: "7px 0", borderRadius: 5, fontSize: 10, fontWeight: 700,
    cursor: "pointer", letterSpacing: "0.1em", textTransform: "uppercase" as const,
    border: "none", transition: "all 0.15s",
    background: active ? (isLight ? tk.accent : tk.accentDim) : "transparent",
    color: active ? (isLight ? "#fff" : tk.accent) : tk.textMuted,
    fontFamily: "'IBM Plex Mono', monospace",
  });

  return (
    <>
      <Header />

      {/* ── Global styles ──────────────────────────────────────── */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600;700&family=Outfit:wght@400;500;600;700;800&display=swap');
        @keyframes tickerPulse {
          0%   { box-shadow: 0 0 0 0 rgba(116,168,201,0.5); opacity:1; }
          70%  { box-shadow: 0 0 0 6px rgba(116,168,201,0);  opacity:0.8; }
          100% { box-shadow: 0 0 0 0 rgba(116,168,201,0);   opacity:1; }
        }
        @keyframes fadeSlideIn {
          from { opacity:0; transform:translateY(6px); }
          to   { opacity:1; transform:translateY(0); }
        }
        @keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width:4px; height:4px; }
        ::-webkit-scrollbar-track { background:transparent; }
        ::-webkit-scrollbar-thumb { background:${tk.border}; border-radius:2px; }

        /* Desktop: show sidebar toggle, hide mobile drawer button */
        @media (min-width: 768px) {
          .desktop-filter-btn { display: flex !important; }
          .mobile-filter-btn  { display: none !important; }
          .mobile-filter-drawer { display: none !important; }
          .desktop-sidebar    { display: block !important; }
        }
        /* Mobile: hide sidebar, show drawer button */
        @media (max-width: 767px) {
          .desktop-filter-btn { display: none !important; }
          .mobile-filter-btn  { display: flex !important; }
          .desktop-sidebar    { display: none !important; }
        }
        /* Mobile: force single column grid */
        @media (max-width: 767px) {
          .events-main-grid { flex-direction: column !important; }
        }
      `}</style>

      <div style={{ minHeight: "100vh", background: tk.pageBg, fontFamily: "'Outfit', sans-serif" }}>

        {/* ── Live Ticker ─────────────────────────────────────── */}
        <LiveTickerBar macro={macro} eventCount={filteredEvents.length} upcomingCount={upcomingCount} isLight={isLight} />

        {/* ── Page header ─────────────────────────────────────── */}
        <div style={{
          background: tk.panelBg, borderBottom: `1px solid ${tk.border}`,
          padding: "14px 20px",
          display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap",
        }}>
          {/* LEFT: icon + title — always flush left */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginRight: "auto" }}>
            <div style={{
              width: 32, height: 32, borderRadius: 8,
              background: tk.accentDim, border: `1px solid ${tk.accentBorder}`,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <Calendar size={15} color={tk.accent} />
            </div>
            <div>
              <h1 style={{ fontSize: 16, fontWeight: 700, color: tk.textPrimary, margin: 0, lineHeight: 1.2, fontFamily: "'Outfit', sans-serif" }}>
                Market Calendar
              </h1>
              <span style={{ fontSize: 9, color: tk.textMuted, fontFamily: "'IBM Plex Mono', monospace", letterSpacing: "0.1em" }}>
                EVENTS & HOLIDAYS
              </span>
            </div>

            {/* Stats pills — next to title */}
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginLeft: 12 }}>
              <div style={{
                padding: "4px 12px", borderRadius: 5,
                background: tk.greenDim, border: `1px solid ${tk.green}30`,
                display: "flex", alignItems: "center", gap: 6,
              }}>
                <span style={{ fontSize: 9, color: tk.green, fontFamily: "'IBM Plex Mono', monospace", fontWeight: 700 }}>↑</span>
                <span style={{ fontSize: 10, color: tk.green, fontFamily: "'IBM Plex Mono', monospace" }}>{upcomingCount} UPCOMING</span>
              </div>
              <div style={{
                padding: "4px 12px", borderRadius: 5,
                background: tk.redDim, border: `1px solid ${tk.red}25`,
                display: "flex", alignItems: "center", gap: 6,
              }}>
                <span style={{ fontSize: 10, color: tk.red, fontFamily: "'IBM Plex Mono', monospace" }}>{highCount} HIGH IMPACT</span>
              </div>
            </div>
          </div>

          {/* RIGHT: time + refresh + filter */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            {lastFetched && (
              <span style={{
                fontSize: 9, color: tk.textMuted, fontFamily: "'IBM Plex Mono', monospace",
                display: "flex", alignItems: "center", gap: 5,
              }}>
                <Clock size={9} color={tk.textMuted} />
                {lastFetched.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
              </span>
            )}
            <button onClick={refresh} disabled={loading} style={{
              display: "flex", alignItems: "center", gap: 5,
              fontSize: 9, fontWeight: 700, padding: "5px 12px", borderRadius: 5,
              border: `1px solid ${tk.border}`, cursor: loading ? "not-allowed" : "pointer",
              background: loading ? tk.elevated : "transparent",
              color: tk.accent, opacity: loading ? 0.5 : 1, transition: "all 0.15s",
              fontFamily: "'IBM Plex Mono', monospace", letterSpacing: "0.1em",
            }}>
              <RefreshCw size={10} style={{ animation: loading ? "spin 1s linear infinite" : "none" }} />
              REFRESH
            </button>
            {/* Desktop: toggle sidebar */}
            <button onClick={() => setSideOpen(p => !p)} style={{
              display: "flex", alignItems: "center", gap: 5,
              fontSize: 9, fontWeight: 700, padding: "5px 12px", borderRadius: 5,
              border: `1px solid ${sideOpen ? tk.accentBorder : tk.border}`,
              background: sideOpen ? tk.accentDim : "transparent",
              color: sideOpen ? tk.accent : tk.textSecond,
              cursor: "pointer", transition: "all 0.15s",
              fontFamily: "'IBM Plex Mono', monospace", letterSpacing: "0.1em",
              // hide on mobile, show on desktop
              display: "none" as any,
            }} className="desktop-filter-btn">
              <SlidersHorizontal size={10} />
              FILTER
            </button>
            {/* Mobile: open drawer */}
            <button onClick={() => setMobileFilterOpen(p => !p)} style={{
              display: "flex", alignItems: "center", gap: 5,
              fontSize: 9, fontWeight: 700, padding: "5px 12px", borderRadius: 5,
              border: `1px solid ${mobileFilterOpen ? tk.accentBorder : tk.border}`,
              background: mobileFilterOpen ? tk.accentDim : "transparent",
              color: mobileFilterOpen ? tk.accent : tk.textSecond,
              cursor: "pointer", transition: "all 0.15s",
              fontFamily: "'IBM Plex Mono', monospace", letterSpacing: "0.1em",
            }} className="mobile-filter-btn">
              <SlidersHorizontal size={10} />
              FILTER
            </button>
          </div>
        </div>

        {/* ── Mobile Filter Drawer ─────────────────────────────── */}
        {mobileFilterOpen && (
          <div className="mobile-filter-drawer" style={{
            background: tk.panelBg,
            borderBottom: `1px solid ${tk.border}`,
            padding: "16px 20px",
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "16px 24px",
          }}>
            {/* Region */}
            <div>
              <span style={{ fontSize: 8, fontWeight: 700, letterSpacing: "0.18em", color: tk.textMuted, fontFamily: "'IBM Plex Mono', monospace", display: "block", marginBottom: 8 }}>
                REGION
              </span>
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                <button style={btnStyle(region === "india")} onClick={() => { handleTab("india", section); }}>
                  <Flag size={11} /> INDIA
                </button>
                <button style={btnStyle(region === "global")} onClick={() => { handleTab("global", section); }}>
                  <Globe size={11} /> GLOBAL
                </button>
              </div>
            </div>

            {/* View */}
            <div>
              <span style={{ fontSize: 8, fontWeight: 700, letterSpacing: "0.18em", color: tk.textMuted, fontFamily: "'IBM Plex Mono', monospace", display: "block", marginBottom: 8 }}>
                VIEW
              </span>
              <div style={{ display: "flex", gap: 3, padding: 3, borderRadius: 7, background: tk.elevated, border: `1px solid ${tk.border}` }}>
                <button style={sectionBtnStyle(section === "events")} onClick={() => handleTab(region, "events")}>EVENTS</button>
                <button style={sectionBtnStyle(section === "holidays")} onClick={() => handleTab(region, "holidays")}>HOLIDAYS</button>
              </div>
            </div>

            {/* Month */}
            <div style={{ gridColumn: "1 / -1" }}>
              <span style={{ fontSize: 8, fontWeight: 700, letterSpacing: "0.18em", color: tk.textMuted, fontFamily: "'IBM Plex Mono', monospace", display: "block", marginBottom: 8 }}>
                MONTH
              </span>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                <button style={btnStyle(selMonth === null)} onClick={() => setSelMonth(null)}>ALL</button>
                {availableMonths.map(m => (
                  <button key={m} style={btnStyle(selMonth === m)} onClick={() => setSelMonth(m)}>
                    {MONTHS[m].toUpperCase()}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── Main layout ─────────────────────────────────────── */}
        <div style={{
          display: "flex",
          alignItems: "flex-start",
          minHeight: "calc(100vh - 120px)",
        }} className="events-main-grid">

          {/* ── LEFT SIDEBAR ─────────────────────────────────── */}
          {sideOpen && (
            <div className="desktop-sidebar" style={{
              background: tk.panelBg,
              borderRight: `1px solid ${tk.border}`,
              padding: "18px 14px",
              position: "sticky", top: 64,
              height: "calc(100vh - 64px)",
              overflowY: "auto",
              flexShrink: 0,
              width: 220,
              alignSelf: "flex-start",
            }}>

              {/* Region */}
              <div style={{ marginBottom: 20 }}>
                <span style={{ fontSize: 8, fontWeight: 700, letterSpacing: "0.18em", color: tk.textMuted, fontFamily: "'IBM Plex Mono', monospace", display: "block", marginBottom: 8 }}>
                  REGION
                </span>
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  <button style={btnStyle(region === "india")} onClick={() => handleTab("india", section)}>
                    <Flag size={11} /> INDIA
                  </button>
                  <button style={btnStyle(region === "global")} onClick={() => handleTab("global", section)}>
                    <Globe size={11} /> GLOBAL
                  </button>
                </div>
              </div>

              {/* Section */}
              <div style={{ marginBottom: 20 }}>
                <span style={{ fontSize: 8, fontWeight: 700, letterSpacing: "0.18em", color: tk.textMuted, fontFamily: "'IBM Plex Mono', monospace", display: "block", marginBottom: 8 }}>
                  VIEW
                </span>
                <div style={{
                  display: "flex", gap: 3, padding: 3, borderRadius: 7,
                  background: tk.elevated, border: `1px solid ${tk.border}`,
                }}>
                  <button style={sectionBtnStyle(section === "events")} onClick={() => handleTab(region, "events")}>
                    EVENTS
                  </button>
                  <button style={sectionBtnStyle(section === "holidays")} onClick={() => handleTab(region, "holidays")}>
                    HOLIDAYS
                  </button>
                </div>
              </div>

              {/* Month filter */}
              <div style={{ marginBottom: 20 }}>
                <span style={{ fontSize: 8, fontWeight: 700, letterSpacing: "0.18em", color: tk.textMuted, fontFamily: "'IBM Plex Mono', monospace", display: "block", marginBottom: 8 }}>
                  MONTH
                </span>
                <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                  <button
                    style={btnStyle(selMonth === null)}
                    onClick={() => setSelMonth(null)}
                  >
                    ALL MONTHS
                  </button>
                  {availableMonths.map(m => (
                    <button
                      key={m}
                      style={btnStyle(selMonth === m)}
                      onClick={() => setSelMonth(m)}
                    >
                      {MONTHS[m].toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>

              {/* Stats */}
              <div style={{ marginBottom: 20 }}>
                <span style={{ fontSize: 8, fontWeight: 700, letterSpacing: "0.18em", color: tk.textMuted, fontFamily: "'IBM Plex Mono', monospace", display: "block", marginBottom: 8 }}>
                  STATS
                </span>
                {[
                  { label: "Total", value: filteredEvents.length, color: tk.textSecond },
                  { label: "Upcoming", value: upcomingCount, color: tk.green },
                  { label: "Past", value: pastCount, color: tk.textMuted },
                  { label: "High Impact", value: highCount, color: tk.red },
                ].map(s => (
                  <div key={s.label} style={{
                    display: "flex", justifyContent: "space-between", alignItems: "center",
                    padding: "5px 0", borderBottom: `1px solid ${tk.border}`,
                  }}>
                    <span style={{ fontSize: 10, color: tk.textMuted, fontFamily: "'IBM Plex Mono', monospace" }}>{s.label}</span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: s.color, fontFamily: "'IBM Plex Mono', monospace" }}>{s.value}</span>
                  </div>
                ))}
              </div>

              {/* Macro */}
              {(macro.usdInr || macro.vix) && (
                <div>
                  <span style={{ fontSize: 8, fontWeight: 700, letterSpacing: "0.18em", color: tk.textMuted, fontFamily: "'IBM Plex Mono', monospace", display: "block", marginBottom: 8 }}>
                    MACRO
                  </span>
                  {macro.usdInr && (
                    <div style={{ display: "flex", justifyContent: "space-between", padding: "5px 0", borderBottom: `1px solid ${tk.border}` }}>
                      <span style={{ fontSize: 9, color: tk.textMuted, fontFamily: "'IBM Plex Mono', monospace" }}>USD/INR</span>
                      <span style={{ fontSize: 11, fontWeight: 700, color: tk.amber, fontFamily: "'IBM Plex Mono', monospace" }}>{macro.usdInr.toFixed(2)}</span>
                    </div>
                  )}
                  {macro.vix && (
                    <div style={{ display: "flex", justifyContent: "space-between", padding: "5px 0" }}>
                      <span style={{ fontSize: 9, color: tk.textMuted, fontFamily: "'IBM Plex Mono', monospace" }}>VIX</span>
                      <span style={{ fontSize: 11, fontWeight: 700, fontFamily: "'IBM Plex Mono', monospace",
                        color: macro.vix < 20 ? tk.green : macro.vix < 30 ? tk.amber : tk.red,
                      }}>{macro.vix.toFixed(2)}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ── MAIN FEED ──────────────────────────────────────── */}
          <div style={{ flex: 1, minWidth: 0, padding: "18px 20px", overflowY: "auto" }}>

            {/* Error banner */}
            {error && section === "events" && !loading && (
              <div style={{
                display: "flex", alignItems: "center", gap: 10,
                padding: "10px 14px", borderRadius: 7, marginBottom: 14,
                background: tk.redDim, border: `1px solid rgba(255,71,87,0.25)`,
              }}>
                <AlertCircle size={13} color={tk.red} />
                <span style={{ fontSize: 11, color: tk.red, fontFamily: "'IBM Plex Mono', monospace", flex: 1 }}>
                  SIGNAL LOST — {error}
                </span>
                <button onClick={refresh} style={{
                  fontSize: 9, fontWeight: 700, color: tk.accent,
                  background: "none", border: "none", cursor: "pointer",
                  fontFamily: "'IBM Plex Mono', monospace",
                }}>RETRY</button>
              </div>
            )}

            {/* Loading */}
            {loading && section === "events" && (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "80px 0" }}>
                <div style={{
                  width: 40, height: 40, borderRadius: 10,
                  background: tk.accentDim, border: `1px solid ${tk.accentBorder}`,
                  display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 14,
                }}>
                  <RefreshCw size={18} color={tk.accent} style={{ animation: "spin 1s linear infinite" }} />
                </div>
                <span style={{ fontSize: 11, color: tk.accent, fontFamily: "'IBM Plex Mono', monospace", letterSpacing: "0.14em" }}>FETCHING LIVE DATA…</span>
                <span style={{ fontSize: 9, color: tk.textMuted, fontFamily: "'IBM Plex Mono', monospace", marginTop: 4 }}>YAHOO FINANCE · RBI · FOMC · ECB</span>
              </div>
            )}

            {/* Empty state */}
            {!loading && grouped.size === 0 && (
              <div style={{
                display: "flex", flexDirection: "column", alignItems: "center",
                padding: "80px 0", textAlign: "center",
                border: `1px dashed ${tk.border}`, borderRadius: 10,
              }}>
                <Calendar size={28} color={tk.textMuted} style={{ marginBottom: 12 }} />
                <span style={{ fontSize: 12, color: tk.textMuted, fontFamily: "'IBM Plex Mono', monospace" }}>NO DATA — TRY A DIFFERENT FILTER</span>
              </div>
            )}

            {/* Event groups */}
            {!loading && Array.from(grouped.values()).map(({ label, events }) => {
              const nUp   = events.filter(e => !isPast(e.date)).length;
              const nPast = events.filter(e =>  isPast(e.date)).length;
              return (
                <div key={label} style={{ marginBottom: 28 }}>
                  {/* Month header */}
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                    <div style={{
                      padding: "4px 12px 4px 10px", borderRadius: 5,
                      background: tk.elevated, border: `1px solid ${tk.border}`,
                      display: "flex", alignItems: "center", gap: 7,
                    }}>
                      <span style={{ width: 5, height: 5, borderRadius: "50%", background: tk.accent, flexShrink: 0 }} />
                      <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.18em", color: tk.textSecond, fontFamily: "'IBM Plex Mono', monospace", textTransform: "uppercase" }}>
                        {label}
                      </span>
                    </div>
                    <div style={{ display: "flex", gap: 5 }}>
                      {nUp > 0 && (
                        <span style={{ fontSize: 8, padding: "2px 7px", borderRadius: 3, background: tk.greenDim, color: tk.green, fontFamily: "'IBM Plex Mono', monospace", fontWeight: 700 }}>
                          {nUp} UPCOMING
                        </span>
                      )}
                      {nPast > 0 && (
                        <span style={{ fontSize: 8, padding: "2px 7px", borderRadius: 3, background: tk.elevated, color: tk.textMuted, fontFamily: "'IBM Plex Mono', monospace" }}>
                          {nPast} PAST
                        </span>
                      )}
                    </div>
                    <div style={{ flex: 1, height: 1, background: tk.border }} />
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                    {events.map((e, i) => (
                      <EventTerminalCard key={e.id} event={e} isLight={isLight} tk={tk} idx={i} />
                    ))}
                  </div>
                </div>
              );
            })}

            {/* Footer note */}
            {!loading && grouped.size > 0 && (
              <div style={{
                marginTop: 32, padding: "12px 16px", borderRadius: 7,
                background: tk.elevated, border: `1px solid ${tk.border}`,
                display: "flex", alignItems: "flex-start", gap: 10,
              }}>
                <Zap size={11} color={tk.accent} style={{ marginTop: 1, flexShrink: 0 }} />
                <span style={{ fontSize: 10, color: tk.textMuted, lineHeight: 1.7, fontFamily: "'IBM Plex Mono', monospace" }}>
                  Events sourced from Yahoo Finance, RBI, FOMC, ECB calendars
                  {holidaysFromApi ? " · India holidays live from Kite API" : " · India holidays from static NSE/BSE calendar"}.
                  Not SEBI-registered. Not investment advice.
                </span>
              </div>
            )}

            <div style={{ height: 60 }} />
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default EventsView;