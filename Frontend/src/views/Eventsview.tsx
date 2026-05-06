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
import { useAuth } from "@/controllers/AuthContext";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import AdminEventForm from "@/components/AdminEventForm";
import {
  Calendar, Globe, Flag, Clock, Megaphone, AlertCircle,
  TrendingUp, Landmark, BarChart2, Umbrella, BookOpen,
  RefreshCw, Zap, Activity, ExternalLink, Target,
  ChevronDown, ChevronUp, TrendingDown, Minus,
  DollarSign, Eye, SlidersHorizontal,
  Radio, ArrowUpRight, ArrowDownRight,
} from "lucide-react";

// ─── API base ─────────────────────────────────────────────────────────────────
const _ROOT = (import.meta.env.VITE_API_URL || "http://localhost:8000").replace(/\/api\/v1\/?$/, "");
const API = `${_ROOT}/api/v1`;

// ─── Types ────────────────────────────────────────────────────────────────────
type Region = "india" | "global";
type Section = "events" | "holidays";
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
  sourceUrl?: string;
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
  { id: "h-in-01", date: "2025-01-26", title: "Republic Day", description: "NSE & BSE closed.", region: "india", category: "holiday", impact: "Medium", source: "static" },
  { id: "h-in-02", date: "2025-02-26", title: "Mahashivratri", description: "NSE & BSE closed.", region: "india", category: "holiday", impact: "Low", source: "static" },
  { id: "h-in-03", date: "2025-03-14", title: "Holi", description: "NSE & BSE closed.", region: "india", category: "holiday", impact: "Low", source: "static" },
  { id: "h-in-04", date: "2025-03-31", title: "Id-Ul-Fitr (Eid)", description: "NSE & BSE closed.", region: "india", category: "holiday", impact: "Low", source: "static" },
  { id: "h-in-05", date: "2025-04-10", title: "Shri Ram Navami", description: "NSE & BSE closed.", region: "india", category: "holiday", impact: "Low", source: "static" },
  { id: "h-in-06", date: "2025-04-14", title: "Dr. Ambedkar Jayanti", description: "NSE & BSE closed.", region: "india", category: "holiday", impact: "Low", source: "static" },
  { id: "h-in-07", date: "2025-04-18", title: "Good Friday", description: "NSE & BSE closed.", region: "india", category: "holiday", impact: "Low", source: "static" },
  { id: "h-in-08", date: "2025-05-01", title: "Maharashtra Day", description: "BSE closed. NSE open.", region: "india", category: "holiday", impact: "Low", source: "static" },
  { id: "h-in-09", date: "2025-08-15", title: "Independence Day", description: "NSE & BSE closed.", region: "india", category: "holiday", impact: "Medium", source: "static" },
  { id: "h-in-10", date: "2025-08-27", title: "Ganesh Chaturthi", description: "NSE & BSE closed.", region: "india", category: "holiday", impact: "Low", source: "static" },
  { id: "h-in-11", date: "2025-10-02", title: "Gandhi Jayanti / Dussehra", description: "NSE & BSE closed.", region: "india", category: "holiday", impact: "Medium", source: "static" },
  { id: "h-in-12", date: "2025-10-20", title: "Diwali — Laxmi Puja", description: "NSE & BSE closed. Special Muhurat Trading after market hours.", region: "india", category: "holiday", impact: "High", source: "static" },
  { id: "h-in-13", date: "2025-10-21", title: "Diwali — Balipratipada", description: "NSE & BSE closed.", region: "india", category: "holiday", impact: "Low", source: "static" },
  { id: "h-in-14", date: "2025-11-05", title: "Guru Nanak Jayanti", description: "NSE & BSE closed.", region: "india", category: "holiday", impact: "Low", source: "static" },
  { id: "h-in-15", date: "2025-12-25", title: "Christmas", description: "NSE & BSE closed.", region: "india", category: "holiday", impact: "Low", source: "static" },
  { id: "h-in-16", date: "2026-01-26", title: "Republic Day 2026", description: "NSE & BSE closed.", region: "india", category: "holiday", impact: "Medium", source: "static" },
  { id: "h-in-17", date: "2026-02-14", title: "Maha Shivratri 2026", description: "NSE & BSE closed (tentative).", region: "india", category: "holiday", impact: "Low", source: "static" },
  { id: "h-in-18", date: "2026-03-04", title: "Holi 2026", description: "NSE & BSE closed (tentative).", region: "india", category: "holiday", impact: "Low", source: "static" },
];

const GLOBAL_HOLIDAYS_STATIC: MarketEvent[] = [
  { id: "h-gl-01", date: "2025-01-01", title: "New Year's Day", description: "NYSE, NASDAQ, LSE, Euronext all closed.", region: "global", category: "holiday", impact: "Medium", source: "static" },
  { id: "h-gl-02", date: "2025-01-20", title: "Martin Luther King Jr. Day", description: "NYSE & NASDAQ closed.", region: "global", category: "holiday", impact: "Low", source: "static" },
  { id: "h-gl-03", date: "2025-02-17", title: "Presidents' Day (US)", description: "NYSE & NASDAQ closed.", region: "global", category: "holiday", impact: "Low", source: "static" },
  { id: "h-gl-04", date: "2025-04-18", title: "Good Friday", description: "NYSE, NASDAQ, LSE, Euronext all closed.", region: "global", category: "holiday", impact: "Medium", source: "static" },
  { id: "h-gl-05", date: "2025-04-21", title: "Easter Monday", description: "LSE & Euronext closed. NYSE open.", region: "global", category: "holiday", impact: "Low", source: "static" },
  { id: "h-gl-06", date: "2025-05-05", title: "Early May Bank Holiday (UK)", description: "LSE closed.", region: "global", category: "holiday", impact: "Low", source: "static" },
  { id: "h-gl-07", date: "2025-05-26", title: "Memorial Day (US)", description: "NYSE & NASDAQ closed.", region: "global", category: "holiday", impact: "Low", source: "static" },
  { id: "h-gl-08", date: "2025-07-04", title: "US Independence Day", description: "NYSE & NASDAQ closed.", region: "global", category: "holiday", impact: "Medium", source: "static" },
  { id: "h-gl-09", date: "2025-09-01", title: "Labor Day (US)", description: "NYSE & NASDAQ closed.", region: "global", category: "holiday", impact: "Low", source: "static" },
  { id: "h-gl-10", date: "2025-11-27", title: "Thanksgiving Day (US)", description: "NYSE & NASDAQ closed.", region: "global", category: "holiday", impact: "Low", source: "static" },
  { id: "h-gl-11", date: "2025-12-25", title: "Christmas Day", description: "NYSE, NASDAQ, LSE, Euronext all closed.", region: "global", category: "holiday", impact: "Medium", source: "static" },
  { id: "h-gl-12", date: "2025-12-26", title: "Boxing Day", description: "LSE & Euronext closed.", region: "global", category: "holiday", impact: "Low", source: "static" },
  { id: "h-gl-13", date: "2026-01-01", title: "New Year's Day 2026", description: "All major global exchanges closed.", region: "global", category: "holiday", impact: "Medium", source: "static" },
  { id: "h-gl-14", date: "2026-01-19", title: "MLK Day 2026", description: "NYSE & NASDAQ closed.", region: "global", category: "holiday", impact: "Low", source: "static" },
  { id: "h-gl-15", date: "2026-02-16", title: "Presidents' Day 2026", description: "NYSE & NASDAQ closed.", region: "global", category: "holiday", impact: "Low", source: "static" },
  { id: "h-gl-16", date: "2026-04-03", title: "Good Friday 2026", description: "NYSE, NASDAQ, LSE, Euronext all closed.", region: "global", category: "holiday", impact: "Medium", source: "static" },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const MONTHS_FULL = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
function parseDate(s: string) { return new Date(s + "T00:00:00"); }
function isPast(d: string) { return parseDate(d) < new Date(new Date().setHours(0, 0, 0, 0)); }
function isToday(d: string) {
  const t = new Date(); const p = parseDate(d);
  return p.getDate() === t.getDate() && p.getMonth() === t.getMonth() && p.getFullYear() === t.getFullYear();
}
function daysUntil(d: string) {
  const diff = parseDate(d).getTime() - new Date(new Date().setHours(0, 0, 0, 0)).getTime();
  return Math.ceil(diff / 86400000);
}
function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const h = Math.floor(diff / 3600000); const d = Math.floor(diff / 86400000);
  if (h < 1) return "Just now"; if (h < 24) return `${h}h ago`;
  if (d < 7) return `${d}d ago`;
  return new Date(dateStr).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
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
    pageBg: "#070e1a",
    panelBg: "#040810",
    cardBg: "#0c1a2e",
    cardHover: "#0f1e35",
    elevated: "#070e1a",
    border: "rgba(30,58,95,0.5)",
    borderBright: "rgba(30,58,95,0.8)",
    accent: "#5194F6",
    accentDim: "rgba(81,148,246,0.12)",
    accentBorder: "rgba(81,148,246,0.25)",
    green: "#22c55e",
    greenDim: "rgba(34,197,94,0.12)",
    red: "#ef4444",
    redDim: "rgba(239,68,68,0.12)",
    amber: "#f59e0b",
    amberDim: "rgba(245,158,11,0.12)",
    blue: "#5194F6",
    blueDim: "rgba(81,148,246,0.12)",
    purple: "#8b5cf6",
    purpleDim: "rgba(139,92,246,0.12)",
    textPrimary: "#ffffff",
    textSecond: "#94a3b8",
    textMuted: "#64748b",
    textTiny: "#475569",
    tickerBg: "#040810",
  },
  light: {
    pageBg: "#f0f7fe",
    panelBg: "#ffffff",
    cardBg: "#ffffff",
    cardHover: "#f8fafc",
    elevated: "#f1f5f9",
    border: "#e2e8f0",
    borderBright: "#cbd5e1",
    accent: "#5194F6",
    accentDim: "rgba(81,148,246,0.08)",
    accentBorder: "rgba(81,148,246,0.25)",
    green: "#16a34a",
    greenDim: "rgba(22,163,74,0.08)",
    red: "#dc2626",
    redDim: "rgba(220,38,38,0.08)",
    amber: "#d97706",
    amberDim: "rgba(217,119,6,0.08)",
    blue: "#5194F6",
    blueDim: "rgba(81,148,246,0.08)",
    purple: "#7c3aed",
    purpleDim: "rgba(124,58,237,0.08)",
    textPrimary: "#0f172a",
    textSecond: "#334155",
    textMuted: "#64748b",
    textTiny: "#94a3b8",
    tickerBg: "#0d1117",
  },
};

// ─── Category config ──────────────────────────────────────────────────────────
const CAT_CONFIG: Record<Category, { icon: React.ElementType; label: string; colorKey: string }> = {
  monetary: { icon: TrendingUp, label: "Monetary", colorKey: "blue" },
  budget: { icon: Landmark, label: "Budget", colorKey: "purple" },
  earnings: { icon: BarChart2, label: "Earnings", colorKey: "green" },
  economic: { icon: Activity, label: "Economic", colorKey: "blue" },
  policy: { icon: BookOpen, label: "Policy", colorKey: "amber" },
  holiday: { icon: Umbrella, label: "Holiday", colorKey: "textMuted" },
  geopolitical: { icon: Globe, label: "Geopolitical", colorKey: "red" },
};
const IMP_CONFIG = {
  High: { label: "HIGH", bar: 3 },
  Medium: { label: "MED", bar: 2 },
  Low: { label: "LOW", bar: 1 },
};
const MI_CONFIG = {
  bullish: { icon: ArrowUpRight, label: "BULLISH", colorKey: "green" },
  bearish: { icon: ArrowDownRight, label: "BEARISH", colorKey: "red" },
  mixed: { icon: Minus, label: "MIXED", colorKey: "amber" },
};
const ASSET_COLOR: Record<string, string> = {
  "Equity": "#74A8C9",
  "Bonds": "#a78bfa",
  "Forex": "#ffa825",
  "Commodities": "#00d084",
};

// ─── Hooks (UNCHANGED from v3) ────────────────────────────────────────────────
function useMarketEvents() {
  const [apiEvents, setApiEvents] = useState<MarketEvent[]>([]);
  const [macro, setMacro] = useState<MacroSnapshot>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastFetched, setLastFetched] = useState<Date | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      // ── Fetch DB events + legacy feed IN PARALLEL ──
      // Legacy feed is ONLY used for macro snapshot (USD/INR, VIX) — NOT for events
      // All events come exclusively from DB so deletes are permanent and consistent
      const [adminRes, legacyRes] = await Promise.allSettled([
        fetch(`${API}/admin/events/public`, { credentials: "include" }),
        fetch(`${API}/markets/global`, { credentials: "include" }),
      ]);

      // ── Macro data from legacy feed (USD/INR, VIX only) ──
      if (legacyRes.status === "fulfilled" && legacyRes.value.ok) {
        try {
          const data = await legacyRes.value.json();
          setMacro({
            usdInr: data?.forex?.find((f: any) => f.pair === "USD/INR")?.rate,
            vix: data?.vix?.value,
          });
        } catch { /* ignore macro parse errors */ }
      }

      // ── DB events only — single source of truth ──
      const dbEvents: MarketEvent[] = [];
      if (adminRes.status === "fulfilled" && adminRes.value.ok) {
        const adminData = await adminRes.value.json();
        if (adminData.success && Array.isArray(adminData.data)) {
          for (const e of adminData.data) {
            dbEvents.push({
              id: e.id ?? e._id?.toString() ?? Math.random().toString(36),
              date: e.date,
              title: e.title,
              description: e.description || buildDescription(e),
              region: mapRegion(e.region ?? "india"),
              category: (e.category as Category) ?? inferCategory(e.title),
              impact: (e.impact as any) ?? "Medium",
              source: "api" as const,
              whatHappened: e.whatHappened,
              whyItMatters: e.whyItMatters,
              marketImpact: e.marketImpact,
              impactTerm: e.impactTerm,
              whoAffected: e.whoAffected,
              investbeansInsight: e.investbeansInsight,
              sourceUrl: e.sourceUrl,
            });
          }
        }
      }

      if (dbEvents.length === 0 && adminRes.status !== "fulfilled") {
        throw new Error("Could not load events");
      }
      setApiEvents(dbEvents);
      setLastFetched(new Date());
    } catch (err: any) {
      setError(err.message || "Network error");
    } finally { setLoading(false); }
  }, []);

  // Delete handler — calls backend for DB events, then refreshes
  const handleDelete = useCallback(async (event: MarketEvent): Promise<void> => {
    // Optimistically remove from UI
    setApiEvents(prev => prev.filter(e => e.id !== event.id));

    if (/^[0-9a-f]{24}$/i.test(event.id)) {
      try {
        const token = localStorage.getItem("accessToken");
        const authH: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};
        const res = await fetch(`${API}/admin/events/${event.id}`, {
          method: "DELETE", headers: authH, credentials: "include",
        });
        const data = await res.json();
        if (!data.success) throw new Error(data.message || "Delete failed");
        // No refresh needed — event is gone from DB, won't come back
      } catch (err: any) {
        alert(err.message || "Delete failed");
        fetchData(); // rollback on error
      }
    }
    // For non-DB events: already removed from UI above, no backend call needed
  }, [fetchData]);

  useEffect(() => { fetchData(); }, [fetchData]);
  return { apiEvents, macro, loading, error, refresh: fetchData, lastFetched, handleDelete };
}

function useInsightBanner() {
  const [insight, setInsight] = useState<BannerInsight | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true); setError(null);
      try {
        const res = await fetch(`${API}/insights/events-banner`, { credentials: "include" });
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

// function useKiteHolidays() {
//   const [indiaHolidays, setIndiaHolidays] = useState<MarketEvent[]>(INDIA_HOLIDAYS_STATIC);
//   const [fromApi,       setFromApi]       = useState(false);
//   useEffect(() => {
//     let cancelled = false;
//     (async () => {
//       try {
//         const year = new Date().getFullYear();
//         const res  = await fetch(`${API}/kite/holidays?year=${year}`, { credentials: "include" });
//         if (!res.ok) return;
//         const json = await res.json();
//         if (json?.status !== "success" || !Array.isArray(json?.data)) return;
//         const mapped: MarketEvent[] = json.data
//           .filter((h: any) => h.date && h.reason)
//           .map((h: any, i: number) => ({
//             id: `kite-h-${i}`, date: h.date, title: h.reason,
//             description: "NSE & BSE closed",
//             region: "india" as Region, category: "holiday" as Category,
//             impact: "Medium" as const, source: "api" as const,
//           }));
//         if (!cancelled && mapped.length > 0) { setIndiaHolidays(mapped); setFromApi(true); }
//       } catch { /* static fallback */ }
//     })();
//     return () => { cancelled = true; };
//   }, []);
//   return { indiaHolidays, fromApi };
// }
function useKiteHolidays() {
  const [indiaHolidays, setIndiaHolidays] = useState<MarketEvent[]>(INDIA_HOLIDAYS_STATIC);
  const [fromApi, setFromApi] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const currentYear = new Date().getFullYear();
        const nextYear = currentYear + 1;

        // ✅ Dono saal parallel fetch karo — exactly like useGlobalHolidays
        const [r1, r2] = await Promise.allSettled([
          fetch(`${API}/kite/holidays?year=${currentYear}`, { credentials: "include" }),
          fetch(`${API}/kite/holidays?year=${nextYear}`, { credentials: "include" }),
        ]);

        const holidays: MarketEvent[] = [];
        let idx = 0;

        for (const result of [r1, r2]) {
          if (result.status !== "fulfilled" || !result.value.ok) continue;
          const json = await result.value.json();
          if (json?.status !== "success" || !Array.isArray(json?.data)) continue;

          for (const h of json.data) {
            if (!h.date || !h.reason) continue;
            holidays.push({
              id: `kite-h-${idx++}`,
              date: h.date,
              title: h.reason,
              description: "NSE & BSE closed",
              region: "india" as Region,
              category: "holiday" as Category,
              impact: "Medium" as const,
              source: "api" as const,
            });
          }
        }

        if (!cancelled && holidays.length > 0) {
          setIndiaHolidays(holidays);
          setFromApi(true);
          console.log(`✅ India holidays loaded from Kite API: ${holidays.length}`);
        }
      } catch {
        console.warn("⚠️ Kite holidays API failed — static fallback");
      }
    })();
    return () => { cancelled = true; };
  }, []);

  return { indiaHolidays, fromApi };
}

function useGlobalHolidays() {
  const [globalHolidays, setGlobalHolidays] = useState<MarketEvent[]>(GLOBAL_HOLIDAYS_STATIC);
  const [fromApi, setFromApi] = useState(false);
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const currentYear = new Date().getFullYear();
        const nextYear = currentYear + 1;
        const [r1, r2] = await Promise.allSettled([
          fetch(`${API}/kite/global-holidays?year=${currentYear}`, { credentials: "include" }),
          fetch(`${API}/kite/global-holidays?year=${nextYear}`, { credentials: "include" }),
        ]);
        const holidays: MarketEvent[] = [];
        let idx = 0;
        for (const result of [r1, r2]) {
          if (result.status !== "fulfilled" || !result.value.ok) continue;
          const json = await result.value.json();
          if (json?.status !== "success" || !Array.isArray(json?.data)) continue;
          for (const h of json.data) {
            if (!h.date) continue;
            const title = h.name || h.reason || "Market Holiday";
            holidays.push({
              id: `global-h-${idx++}`, date: h.date, title,
              description: h.description || "Global market holiday.",
              region: "global" as Region, category: "holiday" as Category,
              impact: "Medium" as const, source: "api" as const,
            });
          }
        }
        if (!cancelled && holidays.length > 0) { setGlobalHolidays(holidays); setFromApi(true); }
      } catch { /* static fallback */ }
    })();
    return () => { cancelled = true; };
  }, []);
  return { globalHolidays, fromApi };
}

// ─── LiveTicker bar ───────────────────────────────────────────────────────────
const LiveTickerBar: React.FC<{ macro: MacroSnapshot; eventCount: number; upcomingCount: number; isLight: boolean }> = ({ macro, eventCount, upcomingCount, isLight }) => {
  // Light mode: visible dark-navy bar; dark mode: near-black
  const bg = isLight ? "#1e3a5f" : "#080b10";
  const borderCol = isLight ? "#2d5a8e" : "#1a2535";
  const labelCol = isLight ? "#93c5fd" : "#4d6a82";
  const dividerCol = isLight ? "#2d5a8e" : "#1e3248";
  const accentCol = "#74A8C9";
  const valueCol = isLight ? "#ffffff" : "#e2e8f0";
  const greenCol = "#00d084";

  const items = [
    { label: "EVENTS", value: String(eventCount), color: accentCol },
    { label: "UPCOMING", value: String(upcomingCount), color: greenCol },
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
    negative: { c: tk.red, bg: tk.redDim },
    neutral: { c: tk.textSecond, bg: tk.elevated },
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
      {[1, 2, 3].map(i => (
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

// ─── Constants ────────────────────────────────────────────────────────────────
const ASSETS_LIST = ["Equity", "Commodities", "Forex", "Bonds"];
const ASSET_PILL_COLOR: Record<string, { c: string; bg: string }> = {
  Equity: { c: "#74A8C9", bg: "rgba(116,168,201,0.15)" },
  Commodities: { c: "#00d084", bg: "rgba(0,208,132,0.12)" },
  Forex: { c: "#ffa825", bg: "rgba(255,168,37,0.12)" },
  Bonds: { c: "#a78bfa", bg: "rgba(167,139,250,0.12)" },
};

// ─── AdminFullEventModal — Complete Create / Edit modal ──────────────────────
// isCreate=true → POST new event
// isCreate=false + event → PUT full edit of existing DB event
const AdminFullEventModal: React.FC<{
  tk: typeof T.dark; isLight: boolean;
  event?: MarketEvent | null;   // null = create new
  onSaved: () => void;
  onClose: () => void;
}> = ({ tk, isLight, event, onSaved, onClose }) => {
  const isCreate = !event;

  // ── Basic fields ──
  const [title, setTitle] = useState(event?.title ?? "");
  const [date, setDate] = useState(event?.date ?? new Date().toISOString().slice(0, 10));
  const [region, setRegion] = useState<"india" | "global">(event?.region ?? "india");
  const [impact, setImpact] = useState<"High" | "Medium" | "Low">(event?.impact ?? "Medium");
  const [description, setDescription] = useState(event?.description ?? "");
  const [whatHappened, setWhatHappened] = useState(event?.whatHappened ?? "");
  const [sourceUrl, setSourceUrl] = useState(event?.sourceUrl ?? "");
  const [investbeansInsight, setInvestbeansInsight] = useState(event?.investbeansInsight ?? "");

  // ── Market Impact ──
  const [marketImpact, setMarketImpact] = useState(event?.marketImpact ?? "");
  const [impactTerm, setImpactTerm] = useState(event?.impactTerm ?? "");

  // ── Who Affected ──
  const [asset, setAsset] = useState<string>((event?.whoAffected?.assets ?? [])[0] ?? "");
  const [sectors, setSectors] = useState<string>(
    Array.isArray(event?.whoAffected?.sectors)
      ? event!.whoAffected!.sectors.join(", ")
      : (event?.whoAffected?.sectors as any as string) ?? ""
  );

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const wc = (s: string) => s.trim().split(/\s+/).filter(Boolean).length;
  const sectorWC = wc(sectors);
  const insightWC = wc(investbeansInsight);

  // Close on Escape
  useEffect(() => {
    const fn = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  }, [onClose]);

  const inp: React.CSSProperties = {
    width: "100%", padding: "8px 10px", borderRadius: 6, fontSize: 12,
    border: `1px solid ${tk.border}`,
    background: isLight ? "#fff" : "#050d1c",
    color: tk.textPrimary, outline: "none", fontFamily: "inherit",
    boxSizing: "border-box", transition: "border-color 0.15s",
  };
  const lbl: React.CSSProperties = {
    fontSize: 9, fontWeight: 700, color: tk.textMuted,
    letterSpacing: "0.12em", textTransform: "uppercase",
    display: "block", marginBottom: 5,
  };
  const pill = (active: boolean, ac: string, abg: string): React.CSSProperties => ({
    padding: "4px 12px", borderRadius: 5, fontSize: 10, fontWeight: 700,
    cursor: "pointer", border: `1px solid ${active ? ac : tk.border}`,
    background: active ? abg : "transparent",
    color: active ? ac : tk.textMuted, transition: "all 0.1s",
    whiteSpace: "nowrap" as const,
  });
  const sectionCard: React.CSSProperties = {
    background: isLight ? "#f8fafc" : "#060d1c",
    border: `1px solid ${tk.border}`, borderRadius: 8,
    padding: "14px 14px", marginBottom: 12,
  };
  const sectionTitle = (color: string, num: string, label: string) => (
    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
      <span style={{
        fontSize: 8, fontWeight: 800, letterSpacing: "0.2em",
        color, fontFamily: "'IBM Plex Mono', monospace",
      }}>{num}</span>
      <div style={{ flex: 1, height: 1, background: `${color}30` }} />
      <span style={{ fontSize: 9, fontWeight: 700, color, letterSpacing: "0.1em", textTransform: "uppercase" }}>{label}</span>
    </div>
  );

  const MI_OPTS = [
    { val: "bullish", label: "▲ BULLISH", c: tk.green, bg: tk.greenDim },
    { val: "bearish", label: "▼ BEARISH", c: tk.red, bg: tk.redDim },
    { val: "mixed", label: "— MIXED", c: tk.amber, bg: tk.amberDim },
  ];
  const TERM_OPTS = [
    { val: "short", label: "SHORT" },
    { val: "medium", label: "MEDIUM" },
    { val: "long", label: "LONG" },
    { val: "short-medium", label: "SHORT-MED" },
  ];
  const IMPACT_OPTS: Array<{ val: "High" | "Medium" | "Low"; c: string }> = [
    { val: "High", c: tk.red },
    { val: "Medium", c: tk.amber },
    { val: "Low", c: tk.green },
  ];

  const handleSave = async () => {
    setError("");
    if (!title.trim()) return setError("Title is required.");
    if (!date) return setError("Date is required.");
    if (sectorWC > 70) return setError("Sectors must be ≤70 words.");
    if (insightWC > 300) return setError("InvestBeans Insight must be ≤300 words.");

    setSaving(true);
    try {
      const token = localStorage.getItem("accessToken");
      const authH: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};
      const body = {
        title: title.trim(),
        date,
        region,
        impact,
        description: description.trim(),
        whatHappened: whatHappened.trim(),
        sourceUrl: sourceUrl.trim(),
        investbeansInsight: investbeansInsight.trim(),
        marketImpact,
        impactTerm,
        whoAffected: { assets: asset ? [asset] : [], sectors: sectors.trim() },
      };

      let res: Response;
      if (isCreate) {
        // POST — create new event
        res = await fetch(`${API}/admin/events`, {
          method: "POST",
          headers: { "Content-Type": "application/json", ...authH },
          credentials: "include",
          body: JSON.stringify(body),
        });
      } else {
        // PUT — full replace of existing event
        res = await fetch(`${API}/admin/events/${event!.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json", ...authH },
          credentials: "include",
          body: JSON.stringify(body),
        });
      }

      const data = await res.json();
      if (!data.success) throw new Error(data.message || "Save failed");
      onSaved();
    } catch (err: any) {
      setError(err.message || "Save failed. Please try again.");
    } finally { setSaving(false); }
  };

  return (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 1000,
        display: "flex", alignItems: "flex-start", justifyContent: "center",
        background: "rgba(4,8,16,0.85)",
        backdropFilter: "blur(4px)",
        overflowY: "auto",
        padding: "32px 16px 64px",
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: "100%", maxWidth: 620,
          background: isLight ? "#ffffff" : "#070e1a",
          border: `1px solid ${tk.accentBorder}`,
          borderRadius: 14,
          overflow: "hidden",
          boxShadow: "0 32px 80px rgba(0,0,0,0.7)",
          animation: "fadeSlideIn 0.2s ease both",
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* ── Modal Header ── */}
        <div style={{
          height: 3,
          background: `linear-gradient(90deg, ${tk.accent}, #8b5cf6, ${tk.accent})`,
        }} />
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "16px 20px",
          borderBottom: `1px solid ${tk.border}`,
          background: isLight ? "#f8fafc" : "#040810",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{
              width: 32, height: 32, borderRadius: 8,
              background: tk.accentDim, border: `1px solid ${tk.accentBorder}`,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <Calendar size={14} color={tk.accent} />
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: tk.textPrimary, fontFamily: "'Outfit', sans-serif" }}>
                {isCreate ? "Create New Event" : "Edit Event"}
              </div>
              <div style={{ fontSize: 10, color: tk.textMuted, fontFamily: "'IBM Plex Mono', monospace", letterSpacing: "0.1em" }}>
                {isCreate ? "ADD TO MARKET CALENDAR" : `EDITING · ${event?.date}`}
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              width: 30, height: 30, borderRadius: 7, cursor: "pointer",
              border: `1px solid ${tk.border}`, background: "transparent",
              color: tk.textMuted, fontSize: 16, display: "flex",
              alignItems: "center", justifyContent: "center", transition: "all 0.12s",
            }}
          >×</button>
        </div>

        {/* ── Scrollable Body ── */}
        <div style={{ padding: "20px", overflowY: "auto", maxHeight: "calc(100vh - 220px)" }}>

          {/* Error banner */}
          {error && (
            <div style={{
              display: "flex", alignItems: "center", gap: 8, padding: "10px 14px",
              borderRadius: 7, marginBottom: 14,
              background: tk.redDim, border: `1px solid rgba(239,68,68,0.3)`,
            }}>
              <AlertCircle size={13} color={tk.red} />
              <span style={{ fontSize: 11, color: tk.red }}>{error}</span>
            </div>
          )}

          {/* ── SECTION 1: Basic Info ── */}
          <div style={sectionCard}>
            {sectionTitle(tk.accent, "01", "Basic Info")}

            {/* Title */}
            <div style={{ marginBottom: 12 }}>
              <span style={lbl}>Event Title *</span>
              <input
                style={inp}
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="e.g. RBI Monetary Policy Decision (Jun)"
                maxLength={200}
              />
            </div>

            {/* Date + Region row */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12 }}>
              <div>
                <span style={lbl}>Date *</span>
                <input
                  type="date"
                  style={{ ...inp, colorScheme: isLight ? "light" : "dark" }}
                  value={date}
                  onChange={e => setDate(e.target.value)}
                />
              </div>
              <div>
                <span style={lbl}>Region *</span>
                <div style={{ display: "flex", gap: 6, paddingTop: 2 }}>
                  {(["india", "global"] as const).map(r => (
                    <button key={r} type="button" onClick={() => setRegion(r)}
                      style={pill(region === r, tk.accent, tk.accentDim)}>
                      {r === "india" ? "🇮🇳 INDIA" : "🌍 GLOBAL"}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Impact Level */}
            <div style={{ marginBottom: 12 }}>
              <span style={lbl}>Impact Level</span>
              <div style={{ display: "flex", gap: 6 }}>
                {IMPACT_OPTS.map(o => (
                  <button key={o.val} type="button" onClick={() => setImpact(o.val)}
                    style={pill(impact === o.val, o.c, `${o.c}18`)}>
                    {o.val.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            {/* Description */}
            <div>
              <span style={lbl}>Description <span style={{ fontWeight: 400, textTransform: "none", letterSpacing: 0, color: tk.textTiny }}>(brief summary)</span></span>
              <textarea
                style={{ ...inp, resize: "none", minHeight: 56, lineHeight: "1.6" }}
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="e.g. RBI June MPC — second review of FY27, expected to assess monsoon-related food inflation risk."
                maxLength={400}
              />
            </div>
          </div>

          {/* ── SECTION 2: What Happened + Source ── */}
          <div style={sectionCard}>
            {sectionTitle(tk.blue, "02", "What Happened & Source")}

            <div style={{ marginBottom: 12 }}>
              <span style={lbl}>What Happened <span style={{ fontWeight: 400, textTransform: "none", letterSpacing: 0, color: tk.textTiny }}>(max 2 lines)</span></span>
              <textarea
                style={{ ...inp, resize: "none", minHeight: 52, lineHeight: "1.6" }}
                value={whatHappened}
                onChange={e => setWhatHappened(e.target.value)}
                placeholder="e.g. RBI held rates steady at 6.25%, citing persistent core inflation and global uncertainty."
                maxLength={500}
              />
            </div>

            <div>
              <span style={lbl}>Source URL <span style={{ fontWeight: 400, textTransform: "none", letterSpacing: 0, color: tk.textTiny }}>(optional)</span></span>
              <input
                style={inp}
                value={sourceUrl}
                onChange={e => setSourceUrl(e.target.value)}
                placeholder="https://www.rbi.org.in/..."
                type="url"
              />
            </div>
          </div>

          {/* ── SECTION 3: Market Impact ── */}
          <div style={sectionCard}>
            {sectionTitle(tk.green, "03", "Market Impact")}

            <div style={{ marginBottom: 12 }}>
              <span style={lbl}>Direction</span>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                <button type="button" onClick={() => setMarketImpact("")}
                  style={pill(marketImpact === "", tk.textMuted, "rgba(100,116,139,0.15)")}>— NONE</button>
                {MI_OPTS.map(o => (
                  <button key={o.val} type="button" onClick={() => setMarketImpact(o.val)}
                    style={pill(marketImpact === o.val, o.c, o.bg)}>{o.label}</button>
                ))}
              </div>
            </div>

            <div>
              <span style={lbl}>Time Horizon</span>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                <button type="button" onClick={() => setImpactTerm("")}
                  style={pill(impactTerm === "", tk.textMuted, "rgba(100,116,139,0.15)")}>— NONE</button>
                {TERM_OPTS.map(o => (
                  <button key={o.val} type="button" onClick={() => setImpactTerm(o.val)}
                    style={pill(impactTerm === o.val, tk.accent, tk.accentDim)}>{o.label}</button>
                ))}
              </div>
            </div>
          </div>

          {/* ── SECTION 4: Who Is Affected ── */}
          <div style={sectionCard}>
            {sectionTitle("#74A8C9", "04", "Who Is Affected")}

            <div style={{ marginBottom: 12 }}>
              <span style={lbl}>Asset Class <span style={{ fontWeight: 400, textTransform: "none", letterSpacing: 0, color: tk.textTiny }}>(select one)</span></span>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {ASSETS_LIST.map(a => {
                  const { c, bg } = ASSET_PILL_COLOR[a];
                  return (
                    <button key={a} type="button"
                      onClick={() => setAsset(prev => prev === a ? "" : a)}
                      style={pill(asset === a, c, bg)}>
                      {a.toUpperCase()}
                    </button>
                  );
                })}
              </div>
              {asset && (
                <span style={{ fontSize: 9, color: tk.textMuted, marginTop: 5, display: "block" }}>
                  ✓ {asset} selected ·{" "}
                  <span style={{ color: tk.accent, cursor: "pointer" }} onClick={() => setAsset("")}>clear</span>
                </span>
              )}
            </div>

            <div>
              <span style={lbl}>
                Key Sectors{" "}
                <span style={{ fontWeight: 400, textTransform: "none", letterSpacing: 0, color: sectorWC > 70 ? tk.red : tk.textTiny }}>
                  {sectorWC}/70 words
                </span>
              </span>
              <textarea
                style={{ ...inp, resize: "none", minHeight: 48, lineHeight: "1.6", borderColor: sectorWC > 70 ? tk.red : tk.border }}
                value={sectors}
                onChange={e => setSectors(e.target.value)}
                placeholder="e.g. Banking & NBFCs · Housing Finance · Auto Sector"
                maxLength={600}
              />
            </div>
          </div>

          {/* ── SECTION 5: InvestBeans Insight ── */}
          <div style={sectionCard}>
            {sectionTitle(tk.purple, "05", "InvestBeans Insight")}
            <div>
              <span style={lbl}>
                Analysis / Insight{" "}
                <span style={{ fontWeight: 400, textTransform: "none", letterSpacing: 0, color: insightWC > 300 ? tk.red : tk.textTiny }}>
                  {insightWC}/300 words
                </span>
              </span>
              <textarea
                style={{ ...inp, resize: "none", minHeight: 80, lineHeight: "1.6", borderColor: insightWC > 300 ? tk.red : tk.border }}
                value={investbeansInsight}
                onChange={e => setInvestbeansInsight(e.target.value)}
                placeholder="Your market analysis and insight for this event…"
                maxLength={2000}
              />
            </div>
          </div>

        </div>

        {/* ── Footer / Action Buttons ── */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "14px 20px",
          borderTop: `1px solid ${tk.border}`,
          background: isLight ? "#f8fafc" : "#040810",
          gap: 10,
        }}>
          <span style={{ fontSize: 10, color: tk.textMuted, fontFamily: "'IBM Plex Mono', monospace" }}>
            {isCreate ? "NEW EVENT" : `EDITING ${event?.id?.slice(0, 8)}…`}
          </span>
          <div style={{ display: "flex", gap: 8 }}>
            <button
              type="button" onClick={onClose}
              style={{
                padding: "8px 20px", borderRadius: 7, fontSize: 12, fontWeight: 600,
                border: `1px solid ${tk.border}`, background: "transparent",
                color: tk.textMuted, cursor: "pointer",
              }}
            >Cancel</button>
            <button
              type="button"
              disabled={saving || sectorWC > 70 || insightWC > 300}
              onClick={handleSave}
              style={{
                padding: "8px 24px", borderRadius: 7, fontSize: 12, fontWeight: 700,
                border: "none",
                background: (saving || sectorWC > 70 || insightWC > 300) ? tk.border : tk.accent,
                color: "#fff", cursor: saving ? "not-allowed" : "pointer",
                opacity: saving ? 0.7 : 1, transition: "all 0.15s",
                display: "flex", alignItems: "center", gap: 6,
              }}
            >
              {saving
                ? <><RefreshCw size={11} style={{ animation: "spin 1s linear infinite" }} /> Saving…</>
                : isCreate ? "✦ Create Event" : "✓ Save Changes"
              }
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── EventTerminalCard ────────────────────────────────────────────────────────
const EventTerminalCard: React.FC<{
  event: MarketEvent; isLight: boolean; tk: typeof T.dark; idx: number; section: Section;
  isAdmin?: boolean; onRefresh?: () => void; onEdit?: (event: MarketEvent) => void;
  onDelete?: (event: MarketEvent) => void;
}> = ({ event, isLight, tk, idx, section, isAdmin, onRefresh, onEdit, onDelete }) => {
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
  // Only real DB events (MongoDB 24-char hex ObjectId) can be enriched by admin
  // Legacy fallback events have ids like "api-0", "api-5" — no backend record to PATCH
  const isDbEvent = /^[0-9a-f]{24}$/i.test(event.id);

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
        opacity: past ? 0.55 : 1,
        transition: "all 0.15s",
        animation: `fadeSlideIn 0.25s ease both`,
        animationDelay: `${idx * 0.04}s`,
        overflow: "hidden",
        maxWidth: section === "holidays" ? 640 : "100%",
      }}
    >
      {/* ── Main row ─────────────────────────────────────────── */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: section === "holidays" ? "44px 1fr" : "44px 1fr auto",
          gap: 0,
          cursor: hasDetail ? "pointer" : "default",
        }}
        onClick={() => hasDetail && setExpanded(p => !p)}
      >
        {/* Date column */}
        <div style={{
          display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
          padding: "10px 0",
          borderRight: `1px solid ${tk.border}`,
          background: past ? "transparent" : `${catColor}08`,
          minWidth: 44, flexShrink: 0,
        }}>
          <span style={{ fontSize: 16, fontWeight: 700, lineHeight: 1, color: past ? tk.textMuted : catColor }}>
            {String(d.getDate()).padStart(2, "0")}
          </span>
          <span style={{ fontSize: 7, fontWeight: 600, letterSpacing: "0.08em", marginTop: 2, color: tk.textMuted, textTransform: "uppercase" }}>
            {MONTHS[d.getMonth()]}
          </span>
          <span style={{ fontSize: 7, color: tk.textTiny }}>
            {d.getFullYear()}
          </span>
        </div>

        {/* Content column */}
        <div style={{ padding: "9px 10px", minWidth: 0, overflow: "hidden" }}>
          {/* Title row */}
          <div style={{ display: "flex", alignItems: "flex-start", gap: 6, marginBottom: 3, flexWrap: "nowrap" }}>
            <div style={{
              width: 18, height: 18, borderRadius: 4, flexShrink: 0, marginTop: 1,
              display: "flex", alignItems: "center", justifyContent: "center",
              background: `${catColor}15`,
            }}>
              <Icon size={9} color={catColor} />
            </div>
            <span style={{
              fontSize: 12, fontWeight: 600, color: tk.textPrimary, lineHeight: 1.35,
              flex: 1, minWidth: 0, wordBreak: "break-word",
            }}>
              {event.title}
            </span>
          </div>

          {/* Countdown badge on its own line on mobile */}
          {countdownEl && (
            <div style={{ marginBottom: 3, marginLeft: 24 }}>{countdownEl}</div>
          )}

          {/* Description — max 2 lines */}
          {event.description && (
            <p style={{
              fontSize: 10, color: tk.textMuted, margin: "2px 0 0 24px", lineHeight: 1.55,
              overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical" as any, wordBreak: "break-word",
            }}>
              {event.description}
            </p>
          )}

          {/* Admin-set category badges — shown in collapsed view */}
          {(event.marketImpact || event.impactTerm || (event.whoAffected?.assets?.length ?? 0) > 0) && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: 5, marginLeft: 24 }}>
              {event.marketImpact && (() => {
                const c = event.marketImpact === "bullish" ? tk.green : event.marketImpact === "bearish" ? tk.red : tk.amber;
                return (
                  <span style={{
                    fontSize: 8, fontWeight: 700, padding: "2px 6px", borderRadius: 3,
                    background: `${c}15`, color: c, letterSpacing: "0.04em", whiteSpace: "nowrap"
                  }}>
                    {event.marketImpact.toUpperCase()}
                  </span>
                );
              })()}
              {event.impactTerm && (
                <span style={{
                  fontSize: 8, fontWeight: 600, padding: "2px 6px", borderRadius: 3,
                  background: tk.elevated, color: tk.textSecond, border: `1px solid ${tk.border}`, whiteSpace: "nowrap"
                }}>
                  {event.impactTerm.replace("-", " ").toUpperCase()}
                </span>
              )}
              {(event.whoAffected?.assets ?? []).map(a => {
                const ac = ASSET_COLOR[a] ?? tk.blue;
                return (
                  <span key={a} style={{
                    fontSize: 8, fontWeight: 700, padding: "2px 6px", borderRadius: 3,
                    background: `${ac}14`, color: ac, letterSpacing: "0.04em", whiteSpace: "nowrap"
                  }}>
                    {a.toUpperCase()}
                  </span>
                );
              })}
            </div>
          )}
        </div>

        {/* Right column — UPCOMING/PAST status + chevron + admin edit — hidden for holidays */}
        {section !== "holidays" && (
          <div style={{
            display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
            padding: "0 10px", gap: 6, borderLeft: `1px solid ${tk.border}`,
            minWidth: 60, flexShrink: 0,
          }}>
            {/* Status — events section only */}
            {section === "events" && (
              past
                ? <span style={{ fontSize: 8, color: tk.textMuted, fontWeight: 600 }}>PAST</span>
                : <span style={{ display: "inline-flex", alignItems: "center", gap: 3 }}>
                  <span style={{ width: 4, height: 4, borderRadius: "50%", background: tk.green, animation: "tickerPulse 2s infinite", flexShrink: 0 }} />
                  <span style={{ fontSize: 8, color: tk.green, fontWeight: 600 }}>UPCOMING</span>
                </span>
            )}
            {/* Chevron — centered */}
            {hasDetail && (
              <div style={{
                width: 22, height: 22, borderRadius: 4,
                background: expanded ? tk.accentDim : tk.elevated,
                border: `1px solid ${expanded ? tk.accentBorder : tk.border}`,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                {expanded ? <ChevronUp size={11} color={tk.accent} /> : <ChevronDown size={11} color={tk.textMuted} />}
              </div>
            )}
            {/* Source link — LIVE badge only for events, never for holidays */}
            {/* ✅ FIX 3: section !== "holidays" check added to hide LIVE badge on holidays */}
            {!hasDetail && event.source === "api" && section !== "holidays" && (
              <span style={{ fontSize: 8, color: tk.accent, fontWeight: 600 }}>LIVE</span>
            )}

            {/* ── Admin actions — edit + delete for ALL non-holiday events ── */}
            {isAdmin && event.category !== "holiday" && (
              <>
                {/* Edit — only meaningful for DB events, but show for all so admin can enrich */}
                <button
                  title="Edit Event"
                  onClick={e => { e.stopPropagation(); onEdit?.(event); }}
                  style={{
                    width: 24, height: 24, borderRadius: 5, cursor: "pointer",
                    background: "transparent", border: `1px solid ${tk.border}`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    transition: "all 0.12s",
                  }}
                  onMouseEnter={e => {
                    (e.currentTarget as HTMLButtonElement).style.background = tk.accentDim;
                    (e.currentTarget as HTMLButtonElement).style.borderColor = tk.accentBorder;
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLButtonElement).style.background = "transparent";
                    (e.currentTarget as HTMLButtonElement).style.borderColor = tk.border;
                  }}
                >
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none"
                    stroke={tk.accent} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                  </svg>
                </button>
                {/* Delete — shown for ALL events; DB events get backend delete, legacy just hide locally */}
                <button
                  title="Delete Event"
                  onClick={async (ev) => {
                    ev.stopPropagation();
                    if (!confirm(`Delete "${event.title}"?`)) return;
                    onDelete?.(event);
                  }}
                  style={{
                    width: 24, height: 24, borderRadius: 5, cursor: "pointer",
                    background: "transparent", border: `1px solid ${tk.border}`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    transition: "all 0.12s",
                  }}
                  onMouseEnter={e => {
                    (e.currentTarget as HTMLButtonElement).style.background = "rgba(239,68,68,0.12)";
                    (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(239,68,68,0.4)";
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLButtonElement).style.background = "transparent";
                    (e.currentTarget as HTMLButtonElement).style.borderColor = tk.border;
                  }}
                >
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none"
                    stroke={tk.red} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="3 6 5 6 21 6" />
                    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                    <path d="M10 11v6M14 11v6" />
                    <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                  </svg>
                </button>
              </>
            )}
          </div>
        )}
      </div>

      {/* ── Expanded panel ──────────────────────────────────── */}
      {expanded && hasDetail && (
        <div style={{ borderTop: `1px solid ${tk.border}` }}>

          {/* 1 — What Happened (max 2 lines) */}
          {event.whatHappened && (
            <div style={{ padding: "12px 18px", borderBottom: `1px solid ${tk.border}`, background: tk.elevated }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 7 }}>
                <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.14em", color: tk.accent }}>01 — WHAT HAPPENED</span>
                <Eye size={10} color={tk.accent} />
              </div>
              <p style={{
                fontSize: 12, color: tk.textSecond, margin: 0, lineHeight: 1.7,
                overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" as any,
              }}>
                {event.whatHappened}
              </p>
            </div>
          )}

          {/* 2 — Market Impact */}
          {event.marketImpact && (
            <div style={{ padding: "12px 18px", borderBottom: `1px solid ${tk.border}`, background: tk.elevated }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.14em", color: miColor }}>02 — MARKET IMPACT</span>
                <MiIcon size={10} color={miColor} />
              </div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {miCfg && (
                  <span style={{
                    fontSize: 11, fontWeight: 700, padding: "4px 12px", borderRadius: 5,
                    background: `${miColor}15`, color: miColor,
                    display: "inline-flex", alignItems: "center", gap: 5,
                  }}>
                    <MiIcon size={10} /> {miCfg.label}
                  </span>
                )}
                {event.impactTerm && (
                  <span style={{
                    fontSize: 11, fontWeight: 600, padding: "4px 12px", borderRadius: 5,
                    background: tk.elevated, color: tk.textSecond,
                    border: `1px solid ${tk.border}`,
                  }}>
                    {event.impactTerm.toUpperCase()} TERM
                  </span>
                )}
              </div>
            </div>
          )}

          {/* 3 — Who Is Affected */}
          {event.whoAffected && (event.whoAffected.assets.length > 0 || event.whoAffected.sectors.length > 0) && (
            <div style={{ padding: "12px 18px", borderBottom: `1px solid ${tk.border}` }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.14em", color: tk.blue }}>03 — WHO IS AFFECTED</span>
                <DollarSign size={10} color={tk.blue} />
              </div>
              {event.whoAffected.assets.length > 0 && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginBottom: event.whoAffected.sectors.length > 0 ? 8 : 0 }}>
                  {event.whoAffected.assets.map(a => {
                    const ac = ASSET_COLOR[a] ?? tk.blue;
                    return (
                      <span key={a} style={{
                        fontSize: 10, fontWeight: 700, padding: "3px 10px", borderRadius: 4,
                        background: `${ac}14`, color: ac, letterSpacing: "0.06em",
                      }}>{a.toUpperCase()}</span>
                    );
                  })}
                </div>
              )}
              {event.whoAffected.sectors.length > 0 && (
                <p style={{
                  fontSize: 11.5, color: tk.textSecond, margin: 0, lineHeight: 1.7,
                  overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical" as any,
                }}>
                  {event.whoAffected.sectors.join("  ·  ")}
                </p>
              )}
            </div>
          )}

          {/* 4 — InvestBeans Insight */}
          {event.investbeansInsight && (
            <div style={{ padding: "12px 18px", borderBottom: `1px solid ${tk.border}`, background: tk.elevated }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.14em", color: tk.purple }}>04 — INVESTBEANS INSIGHT</span>
                <Zap size={10} color={tk.purple} />
              </div>
              <p style={{
                fontSize: 11.5, color: tk.textSecond, margin: 0, lineHeight: 1.75,
                padding: "8px 12px", borderRadius: 6,
                background: `${tk.purple}0d`,
                border: `1px solid ${tk.purple}22`,
              }}>
                {event.investbeansInsight}
              </p>
            </div>
          )}

          {/* Source link — always shown when expanded */}
          <div style={{
            padding: "8px 18px", background: tk.elevated, borderTop: `1px solid ${tk.border}`,
            display: "flex", alignItems: "center", gap: 8,
          }}>
            <ExternalLink size={10} color={tk.accent} />
            <a
              href={event.sourceUrl || `https://www.rbi.org.in/`}
              target="_blank" rel="noopener noreferrer"
              style={{ fontSize: 10, fontWeight: 600, color: tk.accent, textDecoration: "none", letterSpacing: "0.06em" }}
              onClick={e => e.stopPropagation()}
            >
              SOURCE ↗
            </a>
          </div>
        </div>
      )}

    </div>
  );
};

// ─── Main EventsView ──────────────────────────────────────────────────────────
const EventsView: React.FC = () => {
  const { theme } = useTheme();
  const { isAdmin } = useAuth();
  const isLight = theme === "light";
  const tk = isLight ? T.light : T.dark;

  const [searchParams, setSearchParams] = useSearchParams();
  const [region, setRegion] = useState<Region>((searchParams.get("region") as Region) ?? "india");
  const [section, setSection] = useState<Section>((searchParams.get("section") as Section) ?? "events");
  const [selMonth, setSelMonth] = useState<string | null>(null);
  const [sideOpen, setSideOpen] = useState(true);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);
  // const [sentimentFilter, setSentimentFilter] = useState<"all" | "bullish" | "mixed" | "bearish">("all");
  const [sentimentFilter, setSentimentFilter] = useState<"all" | "High" | "Medium" | "Low">("all");

  // Admin modal state — null=closed, undefined=create new, MarketEvent=edit existing
  const [adminModal, setAdminModal] = useState<MarketEvent | null | undefined>(undefined);
  const adminModalOpen = adminModal !== undefined;

  useEffect(() => {
    setRegion((searchParams.get("region") as Region) ?? "india");
    setSection((searchParams.get("section") as Section) ?? "events");
    setSelMonth(null);
  }, [searchParams]);

  const { apiEvents, macro, loading, error, refresh, lastFetched, handleDelete } = useMarketEvents();
  const { indiaHolidays, fromApi: holidaysFromApi } = useKiteHolidays();
  const { globalHolidays, fromApi: globalHolidaysFromApi } = useGlobalHolidays();

  const handleTab = (r: Region, s: Section) => {
    setRegion(r); setSection(s); setSelMonth(null);
    setSearchParams({ region: r, section: s });
  };

  const sourceEvents = useMemo<MarketEvent[]>(() => {
    if (section === "holidays") return region === "india" ? indiaHolidays : globalHolidays;
    return apiEvents.filter(e => e.region === region);
  }, [section, region, apiEvents, indiaHolidays, globalHolidays]);

  const availableMonths = useMemo(() => {
    const map = new Map<string, string>(); // key → label
    for (const e of sourceEvents) {
      const d = parseDate(e.date);
      // ✅ FIX 4b: Pad month with 0 so "2026-01" sorts before "2026-09" correctly
      const key = `${d.getFullYear()}-${String(d.getMonth()).padStart(2, "0")}`;
      if (!map.has(key)) map.set(key, `${MONTHS[d.getMonth()]} ${d.getFullYear()}`);
    }
    return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, [sourceEvents]);

  const filteredEvents = useMemo<MarketEvent[]>(() => {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const futureLimit = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);
    const isHolidaySection = section === "holidays";

    let evts = sourceEvents.filter(e => {
      const d = parseDate(e.date);
      // Holidays: show only upcoming (today onwards), up to 365 days future
      if (isHolidaySection) return d >= todayStart && d <= futureLimit;
      // Events: show if date >= 2 calendar days ago AND <= 365 days future
      const twoDaysAgo = new Date(todayStart);
      twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
      if (d < twoDaysAgo) return false;        // older than 2 days → hide
      if (d > futureLimit) return false;       // more than 365 days ahead → hide
      return true;
    });

    if (selMonth !== null) {
      evts = evts.filter(e => {
        const d = parseDate(e.date);
        // ✅ FIX 4c: Use padded key to match availableMonths format
        return `${d.getFullYear()}-${String(d.getMonth()).padStart(2, "0")}` === selMonth;
      });
    }

    if (!isHolidaySection && sentimentFilter !== "all") {
      evts = evts.filter(e => e.impact === sentimentFilter);
    }

    const up = evts.filter(e => !isPast(e.date)).sort((a, b) => parseDate(a.date).getTime() - parseDate(b.date).getTime());
    const past = evts.filter(e => isPast(e.date)).sort((a, b) => parseDate(b.date).getTime() - parseDate(a.date).getTime());
    return [...up, ...past];
  }, [sourceEvents, selMonth, sentimentFilter, section]);

  const grouped = useMemo(() => {
    const map = new Map<string, { label: string; events: MarketEvent[] }>();
    // ✅ FIX 4: filteredEvents is already sorted (upcoming first by date, past by desc date)
    // Build map in that order — Map preserves insertion order
    for (const e of filteredEvents) {
      const d = parseDate(e.date);
      const key = `${d.getFullYear()}-${String(d.getMonth()).padStart(2, "0")}`;
      if (!map.has(key)) map.set(key, { label: `${MONTHS_FULL[d.getMonth()]} ${d.getFullYear()}`, events: [] });
      map.get(key)!.events.push(e);
    }
    // Sort the map keys so months always appear in chronological order
    const sorted = new Map(
      Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0]))
    );
    return sorted;
  }, [filteredEvents]);

  const upcomingCount = filteredEvents.filter(e => !isPast(e.date)).length;
  const pastCount = filteredEvents.filter(e => isPast(e.date)).length;
  const highCount = filteredEvents.filter(e => e.impact === "High").length;

  const btnStyle = (active: boolean): React.CSSProperties => ({
    display: "flex", alignItems: "center", gap: 6,
    padding: "7px 14px", borderRadius: 8,
    fontSize: 12, fontWeight: 600, cursor: "pointer",
    letterSpacing: "0.01em",
    border: `1px solid ${active ? tk.accentBorder : tk.border}`,
    background: active ? tk.accentDim : "transparent",
    color: active ? tk.accent : tk.textSecond,
    transition: "all 0.15s",
    whiteSpace: "nowrap",
  });

  const sectionBtnStyle = (active: boolean): React.CSSProperties => ({
    flex: 1, padding: "6px 0", borderRadius: 6, fontSize: 11, fontWeight: 600,
    cursor: "pointer", letterSpacing: "0.02em",
    border: "none", transition: "all 0.15s",
    background: active ? (isLight ? tk.accent : tk.accentDim) : "transparent",
    color: active ? (isLight ? "#fff" : tk.accent) : tk.textMuted,
  });

  return (
    <>
      <Header />

      {/* ── Global styles ──────────────────────────────────────── */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
        @keyframes tickerPulse {
          0%   { box-shadow: 0 0 0 0 rgba(81,148,246,0.5); opacity:1; }
          70%  { box-shadow: 0 0 0 6px rgba(81,148,246,0);  opacity:0.8; }
          100% { box-shadow: 0 0 0 0 rgba(81,148,246,0);   opacity:1; }
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
          .desktop-filter-btn { display: none !important; }
          .mobile-filter-btn  { display: none !important; }
          .mobile-filter-drawer { display: none !important; }
          .desktop-sidebar    { display: block !important; }
          .events-page-header { flex-wrap: nowrap !important; }
        }
        /* Mobile: hide sidebar, show drawer button */
        @media (max-width: 767px) {
          .desktop-filter-btn { display: none !important; }
          .mobile-filter-btn  { display: flex !important; }
          .desktop-sidebar    { display: none !important; }
          .events-outer-pad   { padding: 0 !important; }
          .events-main-grid   { flex-direction: column !important; padding: 0 !important; }
          .events-feed        { padding: 12px 10px !important; }
          .events-page-header { padding: 10px 12px !important; gap: 8px !important; flex-wrap: wrap !important; }
          .events-header-right { flex-wrap: wrap !important; gap: 6px !important; }
          .sentiment-pills button { padding: 4px 8px !important; font-size: 10px !important; }
          .events-page-header h1 { font-size: 14px !important; }
          .events-date-refresh  { display: none !important; }
          /* ✅ FIX: ensure create event + filter buttons always visible on mobile */
          .events-page-header > div:first-child { flex-wrap: wrap; gap: 6px; }
        }
        /* Small mobile */
        @media (max-width: 480px) {
          .events-feed { padding: 10px 8px !important; }
          .events-page-header { padding: 8px 10px !important; }
          .sentiment-pills { display: none !important; }
        }
        /* Card grid — always single column on mobile */
        @media (max-width: 640px) {
          .event-card-grid { grid-template-columns: 40px 1fr auto !important; }
          .event-card-date-num { font-size: 14px !important; }
          .event-card-title { font-size: 11px !important; }
          .event-expanded-pad { padding: 10px 12px !important; }
          .admin-inline-pad { padding: 12px !important; }
        }
      `}</style>

      <div style={{ minHeight: "100vh", background: tk.pageBg, fontFamily: "'Inter', sans-serif" }}>

        {/* ── Live Ticker ─────────────────────────────────────── */}
        <LiveTickerBar macro={macro} eventCount={filteredEvents.length} upcomingCount={upcomingCount} isLight={isLight} />

        {/* ── Page header ─────────────────────────────────────── */}
        <div style={{
          background: tk.panelBg, borderBottom: `1px solid ${tk.border}`,
          padding: "14px 20px",
          display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap",
        }} className="events-page-header">
          {/* LEFT: icon + title + date + refresh */}
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{
              width: 32, height: 32, borderRadius: 8,
              background: tk.accentDim, border: `1px solid ${tk.accentBorder}`,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <Calendar size={15} color={tk.accent} />
            </div>
            <div>
              <h1 style={{ fontSize: 16, fontWeight: 700, color: tk.textPrimary, margin: 0, lineHeight: 1.2 }}>
                Market Calendar
              </h1>
              <span style={{ fontSize: 9, color: tk.textMuted, letterSpacing: "0.1em" }}>
                EVENTS & HOLIDAYS
              </span>
            </div>
            {/* Date (today's date) + Refresh — hidden on mobile */}
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginLeft: 16 }} className="events-date-refresh">
              <span style={{
                fontSize: 11, color: tk.textMuted,
                display: "flex", alignItems: "center", gap: 5,
                padding: "5px 10px", borderRadius: 6,
                border: `1px solid ${tk.border}`, background: tk.elevated,
              }}>
                <Calendar size={10} color={tk.textMuted} />
                {new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
              </span>
              <button onClick={refresh} disabled={loading} style={{
                display: "flex", alignItems: "center", gap: 5,
                fontSize: 11, fontWeight: 600, padding: "5px 12px", borderRadius: 6,
                border: `1px solid ${tk.border}`, cursor: loading ? "not-allowed" : "pointer",
                background: loading ? tk.elevated : "transparent",
                color: tk.accent, opacity: loading ? 0.5 : 1, transition: "all 0.15s",
              }}>
                <RefreshCw size={11} style={{ animation: loading ? "spin 1s linear infinite" : "none" }} />
                REFRESH
              </button>
            </div>
            {/* ✅ FIX 1: Admin — Create Event button moved OUTSIDE events-date-refresh so it shows on mobile */}
            {isAdmin && section === "events" && (
              <button
                onClick={() => setAdminModal(null)}
                style={{
                  display: "flex", alignItems: "center", gap: 5,
                  fontSize: 11, fontWeight: 700, padding: "5px 14px", borderRadius: 6,
                  border: `1px solid ${tk.accentBorder}`,
                  background: tk.accent,
                  color: "#fff", cursor: "pointer", transition: "all 0.15s",
                  letterSpacing: "0.04em", whiteSpace: "nowrap",
                }}
              >
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
                CREATE EVENT
              </button>
            )}
          </div>

          {/* RIGHT: Sentiment filter + desktop sidebar toggle */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginLeft: "auto", flexWrap: "wrap" }} className="events-header-right">
            {/* Sentiment filter pills */}
            {section === "events" && (
              <div style={{ display: "flex", gap: 4, padding: "3px", borderRadius: 8, background: tk.elevated, border: `1px solid ${tk.border}` }} className="sentiment-pills">
                {(["all", "High", "Medium", "Low"] as const).map(s => {
                  const colors: Record<string, string> = { High: tk.red, Medium: tk.amber, Low: tk.green, all: tk.accent };
                  const active = sentimentFilter === s;
                  return (
                    <button key={s} onClick={() => setSentimentFilter(s)} style={{
                      padding: "5px 12px", borderRadius: 6, fontSize: 11, fontWeight: 600,
                      cursor: "pointer", border: "none", transition: "all 0.15s",
                      background: active ? (s === "all" ? tk.accentDim : `${colors[s]}18`) : "transparent",
                      color: active ? (s === "all" ? tk.accent : colors[s]) : tk.textMuted,
                    }}>
                      {s === "all" ? "All" : s}
                    </button>
                  );
                })}
              </div>
            )}
            {/* Desktop sidebar toggle — hidden on desktop, CSS class controls visibility */}
            <button onClick={() => setSideOpen(p => !p)} style={{
              display: "flex", alignItems: "center", gap: 5,
              fontSize: 11, fontWeight: 600, padding: "5px 12px", borderRadius: 6,
              border: `1px solid ${sideOpen ? tk.accentBorder : tk.border}`,
              background: sideOpen ? tk.accentDim : "transparent",
              color: sideOpen ? tk.accent : tk.textSecond,
              cursor: "pointer", transition: "all 0.15s",
            }} className="desktop-filter-btn">
              <SlidersHorizontal size={11} />
              FILTER
            </button>
            {/* Mobile drawer toggle */}
            <button onClick={() => setMobileFilterOpen(p => !p)} style={{
              display: "flex", alignItems: "center", gap: 5,
              fontSize: 11, fontWeight: 600, padding: "5px 12px", borderRadius: 6,
              border: `1px solid ${mobileFilterOpen ? tk.accentBorder : tk.border}`,
              background: mobileFilterOpen ? tk.accentDim : "transparent",
              color: mobileFilterOpen ? tk.accent : tk.textSecond,
              cursor: "pointer", transition: "all 0.15s",
            }} className="mobile-filter-btn">
              <SlidersHorizontal size={11} />
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
            {/* India */}
            <div>
              <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.16em", color: tk.textMuted, display: "block", marginBottom: 8 }}>INDIA</span>
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                <button style={sectionBtnStyle(region === "india" && section === "events")} onClick={() => { handleTab("india", "events"); setMobileFilterOpen(false); }}>Events</button>
                <button style={sectionBtnStyle(region === "india" && section === "holidays")} onClick={() => { handleTab("india", "holidays"); setMobileFilterOpen(false); }}>Holidays</button>
              </div>
            </div>
            {/* Global — Events + Holidays */}
            <div>
              <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.16em", color: tk.textMuted, display: "block", marginBottom: 8 }}>GLOBAL</span>
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                <button style={sectionBtnStyle(region === "global" && section === "events")} onClick={() => { handleTab("global", "events"); setMobileFilterOpen(false); }}>Events</button>
                <button style={sectionBtnStyle(region === "global" && section === "holidays")} onClick={() => { handleTab("global", "holidays"); setMobileFilterOpen(false); }}>Holidays</button>
              </div>
            </div>
            {/* Month — dropdown */}
            <div style={{ gridColumn: "1 / -1" }}>
              <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.16em", color: tk.textMuted, display: "block", marginBottom: 8 }}>MONTH</span>
              <select
                value={selMonth ?? ""}
                onChange={e => { setSelMonth(e.target.value === "" ? null : e.target.value); setMobileFilterOpen(false); }}
                style={{
                  width: "100%", padding: "7px 10px", borderRadius: 8, fontSize: 12, fontWeight: 600,
                  border: `1px solid ${selMonth !== null ? tk.accentBorder : tk.border}`,
                  background: selMonth !== null ? tk.accentDim : (isLight ? "#fff" : "#060d1c"),
                  color: selMonth !== null ? tk.accent : tk.textSecond,
                  cursor: "pointer", outline: "none", appearance: "none" as any,
                  WebkitAppearance: "none" as any,
                  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2364748b' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E")`,
                  backgroundRepeat: "no-repeat",
                  backgroundPosition: "right 10px center",
                  paddingRight: 30,
                }}
              >
                <option value="">ALL MONTHS</option>
                {availableMonths.map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </div>
          </div>
        )}

        {/* ── Main layout ─────────────────────────────────────── */}
        <div style={{ padding: "0 24px" }} className="events-outer-pad">
          <div style={{
            display: "flex",
            alignItems: "flex-start",
            minHeight: "calc(100vh - 120px)",
            maxWidth: 1400,
            margin: "0 auto",
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

                {/* REGION — with inline Events/Holidays sub-tabs */}
                <div style={{ marginBottom: 20 }}>
                  <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.16em", color: tk.textMuted, display: "block", marginBottom: 8 }}>
                    REGION
                  </span>

                  {/* INDIA */}
                  <div style={{ marginBottom: 6 }}>
                    <button
                      onClick={() => handleTab("india", section)}
                      style={{
                        width: "100%", display: "flex", alignItems: "center", gap: 8,
                        padding: "8px 12px", borderRadius: 8, fontSize: 12, fontWeight: 600,
                        cursor: "pointer", transition: "all 0.15s", textAlign: "left",
                        border: `1px solid ${region === "india" ? tk.accentBorder : tk.border}`,
                        background: region === "india" ? tk.accentDim : "transparent",
                        color: region === "india" ? tk.accent : tk.textSecond,
                      }}
                    >
                      <Flag size={12} /> INDIA
                    </button>
                    {region === "india" && (
                      <div style={{ display: "flex", gap: 3, padding: "4px 4px 0", marginTop: 3 }}>
                        <button style={sectionBtnStyle(section === "events")} onClick={() => handleTab("india", "events")}>Events</button>
                        <button style={sectionBtnStyle(section === "holidays")} onClick={() => handleTab("india", "holidays")}>Holidays</button>
                      </div>
                    )}
                  </div>

                  {/* GLOBAL — Events + Holidays */}
                  <div>
                    <button
                      onClick={() => handleTab("global", section)}
                      style={{
                        width: "100%", display: "flex", alignItems: "center", gap: 8,
                        padding: "8px 12px", borderRadius: 8, fontSize: 12, fontWeight: 600,
                        cursor: "pointer", transition: "all 0.15s", textAlign: "left",
                        border: `1px solid ${region === "global" ? tk.accentBorder : tk.border}`,
                        background: region === "global" ? tk.accentDim : "transparent",
                        color: region === "global" ? tk.accent : tk.textSecond,
                      }}
                    >
                      <Globe size={12} /> GLOBAL
                    </button>
                    {region === "global" && (
                      <div style={{ display: "flex", gap: 3, padding: "4px 4px 0", marginTop: 3 }}>
                        <button style={sectionBtnStyle(section === "events")} onClick={() => handleTab("global", "events")}>Events</button>
                        <button style={sectionBtnStyle(section === "holidays")} onClick={() => handleTab("global", "holidays")}>Holidays</button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Month filter — dropdown */}
                <div style={{ marginBottom: 20 }}>
                  <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.16em", color: tk.textMuted, display: "block", marginBottom: 8 }}>
                    MONTH
                  </span>
                  <select
                    value={selMonth ?? ""}
                    onChange={e => setSelMonth(e.target.value === "" ? null : e.target.value)}
                    style={{
                      width: "100%", padding: "7px 10px", borderRadius: 8, fontSize: 12, fontWeight: 600,
                      border: `1px solid ${selMonth !== null ? tk.accentBorder : tk.border}`,
                      background: selMonth !== null ? tk.accentDim : (isLight ? "#fff" : "#060d1c"),
                      color: selMonth !== null ? tk.accent : tk.textSecond,
                      cursor: "pointer", outline: "none", appearance: "none" as any,
                      WebkitAppearance: "none" as any,
                      backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2364748b' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E")`,
                      backgroundRepeat: "no-repeat",
                      backgroundPosition: "right 10px center",
                      paddingRight: 30,
                    }}
                  >
                    <option value="">ALL MONTHS</option>
                    {availableMonths.map(([key, label]) => (
                      <option key={key} value={key}>{label}</option>
                    ))}
                  </select>
                </div>

              </div>
            )}

            {/* ── MAIN FEED ──────────────────────────────────────── */}
            <div style={{ flex: 1, minWidth: 0, padding: "18px 20px", overflowY: "auto" }} className="events-feed">

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
                        <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.18em", color: tk.textSecond, textTransform: "uppercase" }}>
                          {label}
                        </span>
                      </div>
                      <div style={{ flex: 1, height: 1, background: tk.border }} />
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                      {events.map((e, i) => (
                        <EventTerminalCard
                          key={e.id} event={e} isLight={isLight} tk={tk} idx={i} section={section}
                          isAdmin={isAdmin}
                          onRefresh={refresh}
                          onEdit={isAdmin ? (ev) => setAdminModal(ev) : undefined}
                          onDelete={isAdmin ? handleDelete : undefined}
                        />
                      ))}
                    </div>
                  </div>
                );
              })}

              {/* Footer note */}
              {/* {!loading && grouped.size > 0 && (
              <div style={{
                marginTop: 32, padding: "12px 16px", borderRadius: 7,
                background: tk.elevated, border: `1px solid ${tk.border}`,
                display: "flex", alignItems: "flex-start", gap: 10,
              }}>
                <Zap size={11} color={tk.accent} style={{ marginTop: 1, flexShrink: 0 }} />
                <span style={{ fontSize: 10, color: tk.textMuted, lineHeight: 1.7, fontFamily: "'IBM Plex Mono', monospace" }}>
                  Events sourced from Yahoo Finance, RBI, FOMC, ECB calendars
                  {holidaysFromApi ? " · India holidays live from Kite API" : " · India holidays from static NSE/BSE calendar"}
                  {globalHolidaysFromApi ? " · Global holidays live from Nager.Date API" : " · Global holidays from static calendar"}.
                  Not SEBI-registered. Not investment advice.
                </span>
              </div>
            )} */}

              <div style={{ height: 60 }} />
            </div>
          </div>
        </div>
      </div>
      {/* ── Admin Full Event Modal (Create / Edit) ── */}
      {adminModalOpen && (
        <AdminFullEventModal
          tk={tk}
          isLight={isLight}
          event={adminModal ?? undefined}
          onSaved={() => { setAdminModal(undefined); refresh(); }}
          onClose={() => setAdminModal(undefined)}
        />
      )}

      <Footer />

    </>
  );
};

export default EventsView;