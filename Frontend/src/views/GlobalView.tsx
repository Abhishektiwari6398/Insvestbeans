
import Layout from "@/components/Layout";
import TradingViewModal from "@/components/Tradingviewmodal";
import { USMarketsChart }       from "@/components/Usmarketschart";
import { EuropeanMarketsChart } from "@/components/Europeanmarketschart";
import { AsiaPacificMarketsChart } from "@/components/Asiapacificmarketschart";
import { useGlobalMarkets } from "@/hooks/useGlobalMarkets";
import { IndexQuote, BondYield, RegionSummary, CandlePoint } from "@/services/globalMarkets/types";
import {
  TrendingUp, TrendingDown, Activity, Globe, Clock, MapPin,
  RefreshCw, AlertCircle, BarChart3, LineChart, Landmark,
  Menu, X, ChevronRight, AlertTriangle, ExternalLink,
} from "lucide-react";
import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { useLocation } from "react-router-dom";
import { useTheme } from "@/controllers/Themecontext";

// ── Backend base URL ──────────────────────────────────────────────
const API_BASE = (import.meta.env.VITE_API_URL as string) || "http://localhost:8000";

// ── Period tab definitions ────────────────────────────────────────
const PERIODS = [
  { key: "1D",  label: "1D"  },
  { key: "5D",  label: "5D"  },
  { key: "1M",  label: "1M"  },
  { key: "6M",  label: "6M"  },
  { key: "YTD", label: "YTD" },
  { key: "1Y",  label: "1Y"  },
  { key: "5Y",  label: "5Y"  },
  { key: "MAX", label: "MAX" },
] as const;
type Period = typeof PERIODS[number]["key"];

// ── Market Hours ──────────────────────────────────────────────────
interface MktInfo { name: string; short: string; flag: string; code: string; tz: string; localTime: string; openUTC: number; closeUTC: number; color: string; }
const MARKETS: MktInfo[] = [
  { name:"Tokyo (TSE)",       short:"Tokyo",     flag:"🇯🇵", code:"JP", tz:"JST (UTC+9)",    localTime:"09:00–15:00", openUTC:0,   closeUTC:360,  color:"#e74c3c" },
  { name:"Shanghai (SSE)",    short:"Shanghai",  flag:"🇨🇳", code:"CN", tz:"CST (UTC+8)",    localTime:"09:30–15:00", openUTC:90,  closeUTC:420,  color:"#f39c12" },
  { name:"Hong Kong (HKEX)",  short:"HK",        flag:"🇭🇰", code:"HK", tz:"HKT (UTC+8)",    localTime:"09:15–16:00", openUTC:75,  closeUTC:480,  color:"#e67e22" },
  { name:"India (NSE/BSE)",   short:"India",     flag:"🇮🇳", code:"IN", tz:"IST (UTC+5:30)", localTime:"09:15–15:30", openUTC:225, closeUTC:600,  color:"#27ae60" },
  { name:"Frankfurt (XETRA)", short:"Frankfurt", flag:"🇩🇪", code:"DE", tz:"CET/CEST",       localTime:"09:00–17:30", openUTC:480, closeUTC:990,  color:"#2980b9" },
  { name:"London (LSE)",      short:"London",    flag:"🇬🇧", code:"GB", tz:"GMT/BST",        localTime:"08:00–16:30", openUTC:480, closeUTC:990,  color:"#8e44ad" },
  { name:"NYSE / NASDAQ",     short:"New York",  flag:"🇺🇸", code:"US", tz:"EST/EDT",        localTime:"09:30–16:00", openUTC:870, closeUTC:1260, color:"#2563eb" },
];

// DST-aware market open check using Intl
const MKT_TZ: Record<string, string> = {
  "JP": "Asia/Tokyo",
  "CN": "Asia/Shanghai",
  "HK": "Asia/Hong_Kong",
  "IN": "Asia/Kolkata",
  "DE": "Europe/Berlin",
  "GB": "Europe/London",
  "US": "America/New_York",
};
// localTime strings like "09:30–16:00"
function mktSt(m: MktInfo): "open"|"pre"|"closed" {
  const now = new Date();
  const tz = MKT_TZ[m.code];
  if (!tz) return "closed";
  const parts = new Intl.DateTimeFormat("en-US", {
    hour: "2-digit", minute: "2-digit", hour12: false,
    weekday: "short", timeZone: tz,
  }).formatToParts(now);
  const weekday = parts.find(p => p.type === "weekday")?.value ?? "";
  if (weekday === "Sat" || weekday === "Sun") return "closed";
  const h = parseInt(parts.find(p => p.type === "hour")?.value ?? "0");
  const mn = parseInt(parts.find(p => p.type === "minute")?.value ?? "0");
  const localMins = h * 60 + mn;
  // Parse localTime "09:15–15:30"
  const [openStr, closeStr] = m.localTime.split("–");
  const [oh, om] = openStr.split(":").map(Number);
  const [ch, cm] = closeStr.split(":").map(Number);
  const openMin = oh * 60 + om;
  const closeMin = ch * 60 + cm;
  if (localMins >= openMin && localMins < closeMin) return "open";
  if (localMins >= openMin - 30 && localMins < openMin) return "pre";
  return "closed";
}

function localNow(m: MktInfo): string {
  const tzMap: Record<string,string> = {
    "JST (UTC+9)":    "Asia/Tokyo",
    "CST (UTC+8)":    "Asia/Shanghai",
    "HKT (UTC+8)":    "Asia/Hong_Kong",
    "IST (UTC+5:30)": "Asia/Kolkata",
    "CET (UTC+1)":    "Europe/Berlin",
    "GMT (UTC+0)":    "Europe/London",
    "EST (UTC-5)":    "America/New_York",
  };
  const tz = tzMap[m.tz];
  if (!tz) return "--:--";
  const parts = new Intl.DateTimeFormat("en-US", { hour: "2-digit", minute: "2-digit", hour12: false, timeZone: tz }).formatToParts(new Date());
  const h = parts.find(p => p.type === "hour")?.value ?? "00";
  const mn = parts.find(p => p.type === "minute")?.value ?? "00";
  return `${h.padStart(2,"0")}:${mn.padStart(2,"0")}`;
}

// ── DST-aware UTC offset for a given IANA timezone (in hours) ────────
// Returns e.g. -4 for America/New_York in summer (EDT), -5 in winter (EST)
// +2 for Europe/Berlin in summer (CEST), +1 in winter (CET)
function getUTCOffset(ianaZone: string): number {
  const now = new Date();
  const fmt = (tz: string) =>
    new Intl.DateTimeFormat("en-US", {
      timeZone: tz, hour: "numeric", minute: "numeric", hour12: false,
    }).format(now);
  const toMins = (s: string) => {
    const parts = s.split(":");
    return parseInt(parts[0]) * 60 + parseInt(parts[1] ?? "0");
  };
  let diff = toMins(fmt(ianaZone)) - toMins(fmt("UTC"));
  if (diff > 720)  diff -= 1440;
  if (diff < -720) diff += 1440;
  return diff / 60;
}

// Per-symbol IANA timezone for correct DST-aware X-axis labels
const SYMBOL_TZ: Record<string, string> = {
  "^DJI":      "America/New_York",
  "^GSPC":     "America/New_York",
  "^IXIC":     "America/New_York",
  "^FTSE":     "Europe/London",
  "^GDAXI":    "Europe/Berlin",
  "^FCHI":     "Europe/Paris",
  "^N225":     "Asia/Tokyo",
  "^HSI":      "Asia/Hong_Kong",
  "000001.SS": "Asia/Shanghai",
  "^NSEI":     "Asia/Kolkata",
  "^BSESN":    "Asia/Kolkata",
};

function getSymbolTzOffset(symbol: string): number {
  const tz = SYMBOL_TZ[symbol];
  return tz ? getUTCOffset(tz) : 0;
}

const NAV_SECTIONS = [
  { id:"section-hours",   label:"Market Hours",   icon: Globe     },
  { id:"section-us",      label:"US Markets",      icon: BarChart3 },
  { id:"section-bonds",   label:"Bonds & VIX",     icon: Landmark  },
  { id:"section-europe",  label:"Europe",          icon: LineChart },
  { id:"section-asia",    label:"Asia Pacific",    icon: Activity  },
  { id:"section-events",  label:"Events Calendar", icon: MapPin    },
];

function jumpTo(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior:"smooth", block:"start" });
}

// ── Theme tokens ──────────────────────────────────────────────────
const useIL = () => { const { theme } = useTheme(); return theme === "light"; };
const tx = {
  bg:      (l:boolean) => l ? "bg-[#f5f4f0]"   : "bg-[#07111b]",
  card:    (l:boolean) => l ? "bg-white border border-gray-100 shadow-sm" : "bg-[#0c1821] border border-[#1a2d3f]",
  header:  (l:boolean) => l ? "bg-gray-50 border-b border-gray-100"       : "bg-[#081017] border-b border-[#1a2d3f]",
  row:     (l:boolean) => l ? "hover:bg-gray-50/60 border-b border-gray-50" : "hover:bg-white/[0.02] border-b border-[#111e28]",
  sidebar: (l:boolean) => l ? "bg-white border-r border-gray-100" : "bg-[#07111b] border-r border-[#1a2d3f]",
  topbar:  (l:boolean) => l ? "bg-white/95 border-b border-gray-100 backdrop-blur-sm" : "bg-[#07111b]/95 border-b border-[#1a2d3f] backdrop-blur-sm",
  t1:      (l:boolean) => l ? "text-gray-900"   : "text-[#e2ecf4]",
  t2:      (l:boolean) => l ? "text-gray-500"   : "text-[#5a7a92]",
  t3:      (l:boolean) => l ? "text-gray-400"   : "text-[#3d5f78]",
  pill:    (l:boolean, g:boolean) => g
    ? l ? "bg-emerald-50 text-emerald-700" : "bg-emerald-900/20 text-emerald-400"
    :     l ? "bg-red-50 text-red-600"     : "bg-red-900/20 text-red-400",
};

// ── Primitives ────────────────────────────────────────────────────
function Card({ children, className="" }: { children:React.ReactNode; className?:string }) {
  const l = useIL();
  return <div className={`rounded-xl ${tx.card(l)} ${className}`}>{children}</div>;
}

function Skel({ h="h-8" }: { h?:string }) {
  const l = useIL();
  return <div className={`${h} w-full rounded-lg animate-pulse ${l?"bg-gray-100":"bg-[#1a2d3f]/60"}`}/>;
}

function PctTag({ v }: { v: number }) {
  const l = useIL();
  const g = v >= 0;
  return (
    <span className={`inline-flex items-center gap-0.5 font-bold rounded-md text-xs px-1.5 py-1 ${tx.pill(l,g)}`}>
      {g ? <TrendingUp className="w-2.5 h-2.5"/> : <TrendingDown className="w-2.5 h-2.5"/>}
      {g?"+":""}{v.toFixed(2)}%
    </span>
  );
}

function SecHead({ id, icon:Icon, title, sub }: { id:string; icon:any; title:string; sub?:string }) {
  const l = useIL();
  return (
    <div id={id} className="flex items-center gap-3 mb-5 scroll-mt-24">
      <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 bg-[#0A3656]/20 border border-[#0A3656]/30 dark:bg-[#74A8C9]/10 dark:border-[#74A8C9]/20">
        <Icon className="w-4 h-4 text-[#0A3656] dark:text-[#74A8C9]"/>
      </div>
      <div className="flex items-center gap-2 flex-1 min-w-0">
        <h2 className={`font-extrabold text-base tracking-tight ${l?"text-gray-900":"text-white"}`}>{title}</h2>
        {sub && <span className={`text-[11px] truncate hidden sm:block ${tx.t3(l)}`}>{sub}</span>}
      </div>
      <div className={`h-px flex-1 max-w-24 ${l?"bg-gray-100":"bg-[#1a2d3f]"}`}/>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
// SIDEBAR
// ══════════════════════════════════════════════════════════════════
function SideNav({ active, onSelect, usMarkets, euMarkets, asMarkets, refreshing, onRefresh, lastUpdated }: {
  active:string; onSelect:(id:string)=>void;
  usMarkets:IndexQuote[]; euMarkets:IndexQuote[]; asMarkets:IndexQuote[];
  refreshing:boolean; onRefresh:()=>void; lastUpdated:number|null;
}) {
  const l = useIL();
  const ago = (ts:number) => { const s=Math.floor((Date.now()-ts)/1000); if(s<60) return `${s}s ago`; return `${Math.floor(s/60)}m ago`; };
  const [openGroups, setOpenGroups] = useState<Record<string,boolean>>({ "🇺🇸 US": false, "🇪🇺 Europe": false, "🌏 Asia": false });

  return (
    <div className="flex flex-col h-full py-1.5 ">
      <nav className="space-y-px px-2 mt-3">
        {NAV_SECTIONS.map(s => (
          <button key={s.id}
            onClick={() => { onSelect(s.id); jumpTo(s.id); }}
            className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold transition-all text-left ${
              active===s.id
                ? l?"bg-[#0A3656]/10 text-[#0A3656] border-l-2 border-[#0A3656] font-bold":"bg-[#74A8C9]/10 text-[#74A8C9] border-l-2 border-[#74A8C9]"
                : l?"text-gray-500 hover:bg-gray-50 hover:text-gray-800":"text-[#5a7a92] hover:bg-white/[0.03] hover:text-[#c0d8ea]"
            }`}>
            <s.icon className="w-3.5 h-3.5 shrink-0"/>
            <span className="truncate">{s.label}</span>
            {active===s.id && <ChevronRight className="w-3 h-3 ml-auto shrink-0"/>}
          </button>
        ))}
      </nav>

      <div className={`shrink-0 border-t px-3 py-3 mt-auto ${l?"border-gray-100":"border-[#1a2d3f]"}`}>
        <button onClick={onRefresh} disabled={refreshing}
          className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-[11px] font-bold text-white disabled:opacity-50 bg-[#0A3656] hover:bg-[#072a42] transition-colors">
          <RefreshCw className={`w-3 h-3 ${refreshing?"animate-spin":""}`}/> Refresh
        </button>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
// MARKET HOURS SECTION
// ══════════════════════════════════════════════════════════════════
function MktHoursSection() {
  const l = useIL();
  const [, tick] = useState(0);
  useEffect(() => { const t = setInterval(() => tick(n=>n+1), 60_000); return () => clearInterval(t); }, []);

  return (
    <div id="section-hours" className="scroll-mt-24 mb-8">
      <SecHead id="section-hours-h" icon={Globe} title="World Market Hours"/>
      <Card className="overflow-hidden">
        <div className={`flex lg:grid lg:grid-cols-7 overflow-x-auto scrollbar-none divide-x ${l?"divide-gray-100":"divide-[#1a2d3f]"}`}>
          {MARKETS.map(m => {
            const st = mktSt(m);
            const isOpen = st==="open", isPre = st==="pre";
            return (
              <div key={m.name}
                className={`flex-shrink-0 w-[108px] sm:w-auto flex flex-col items-center px-2 py-2.5 text-center border-b lg:border-b-0 ${
                  isOpen ? l?"bg-emerald-50/60":"bg-emerald-900/10"
                  : isPre ? l?"bg-amber-50/50":"bg-amber-900/10" : ""
                } ${l?"border-gray-100":"border-[#1a2d3f]"}`}>

                <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-1.5 overflow-hidden border
                  ${isOpen ? "border-emerald-500/40 ring-1 ring-emerald-500/20"
                  : isPre  ? "border-amber-500/40 ring-1 ring-amber-500/20"
                  : l      ? "border-gray-200"
                           : "border-white/15"}`}>
                  <img
                    src={`https://flagcdn.com/w40/${m.code.toLowerCase()}.png`}
                    srcSet={`https://flagcdn.com/w80/${m.code.toLowerCase()}.png 2x`}
                    alt={m.short}
                    width={40}
                    height={30}
                    style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                    onError={(e) => {
                      const t = e.currentTarget.parentElement;
                      if (t) t.innerHTML = `<span class="market-flag">${m.flag}</span>`;
                    }}
                  />
                </div>

                <p className={`text-[11px] font-extrabold leading-none mb-0.5 ${l?"text-gray-800":"text-white"}`}>{m.short}</p>
                <p className={`text-[9px] font-medium mb-1.5 leading-tight ${l?"text-gray-500":"text-[#7a9ab5]"}`}>{m.tz}</p>

                <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-full uppercase tracking-wide mb-1.5 ${
                  isOpen ? "bg-emerald-500/25 text-emerald-300 border border-emerald-500/40" :
                  isPre  ? "bg-amber-500/25 text-amber-300 border border-amber-500/40" :
                  l      ? "bg-gray-100 text-gray-600 border border-gray-200" : "bg-white/10 text-[#8ab0cc] border border-white/15"
                }`}>{isOpen?"● OPEN":isPre?"◐ PRE":"CLOSED"}</span>

                <p className={`text-[13px] font-black tabular-nums leading-none ${isOpen?"text-emerald-400":isPre?"text-amber-400":l?"text-gray-700":"text-[#9ec4dc]"}`}>{localNow(m)}</p>
                <p className={`text-[8px] mt-0.5 font-medium ${l?"text-gray-400":"text-[#5a7a92]"}`}>{m.localTime}</p>
                <div className="h-0.5 w-full rounded-full mt-2" style={{ background: isOpen?m.color:isPre?"#f59e0b":l?"#e5e7eb":"rgba(255,255,255,0.07)", opacity: isOpen?1:0.35 }}/>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
// MARKET SELECTOR
// ══════════════════════════════════════════════════════════════════
function MktSelector({ sectionId, navId, title, markets, icon, onChart, autoSym, regionSummary }: {
  sectionId:string; navId:string; title:string; markets:IndexQuote[]; icon?:any;
  onChart:(sym:string, name:string)=>void; autoSym?:string;
  regionSummary?: React.ReactNode;
}) {
  const l = useIL();
  const [sel, setSel]           = useState(0);
  const [period, setPeriod]     = useState<Period>("1D");
  const [chartCandles, setChartCandles]   = useState<CandlePoint[]>([]);
  const [chartLoading, setChartLoading]   = useState(false);
  const [fetchError,   setFetchError]     = useState(false);
  const fetchIdRef = useRef(0);
  // Track last fetched symbol+period so we never overwrite with stale 1D candles
  const lastFetchRef = useRef<string>("");

  useEffect(() => {
    if (!autoSym) return;
    const i = markets.findIndex(m => m.symbol === autoSym);
    if (i !== -1) setSel(i);
  }, [autoSym, markets]);

  // Only seed candles from markets[sel] when the selected market changes (not on every markets re-render)
  // This prevents overwriting 5D/1M/etc candles with 1D data when parent re-renders
  const prevSelRef = useRef(-1);
  useEffect(() => {
    if (prevSelRef.current === sel) return; // sel didn't actually change
    prevSelRef.current = sel;
    lastFetchRef.current = "";  // reset so next fetchCandles always wins
    setChartCandles(markets[sel]?.candles ?? []);
    setPeriod("1D");  // reset to 1D when switching market
  }, [sel]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchCandles = useCallback(async (symbol: string, p: Period) => {
    const id = ++fetchIdRef.current;
    const key = `${symbol}_${p}`;
    setChartLoading(true);
    setFetchError(false);
    try {
      const res = await fetch(
        `${API_BASE}/markets/history/${encodeURIComponent(symbol)}?period=${p}`
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      if (id !== fetchIdRef.current) return;
      setChartCandles(json.candles ?? []);
      lastFetchRef.current = key;  // mark what's now displayed
    } catch (e) {
      if (id !== fetchIdRef.current) return;
      console.error(`[MktSelector] history fetch failed ${symbol} ${p}:`, e);
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
    <div id={sectionId} className="mb-8 scroll-mt-24">
      <SecHead id={navId} icon={icon||BarChart3} title={title}/>
      <Card className="py-10 text-center">
        <Activity className={`w-8 h-8 mx-auto mb-2 ${tx.t3(l)}`}/><p className={`text-sm ${tx.t2(l)}`}>No data</p>
      </Card>
    </div>
  );

  const s = markets[sel];
  const isPos = s.changePercent >= 0;

  return (
    <div id={sectionId} className="mb-8 scroll-mt-24">
      <SecHead id={navId} icon={icon||BarChart3} title={title} sub={`${markets.length} indices`}/>

      {/* ── Market pill buttons ─────────────────────────────────── */}
      <div className="flex items-center gap-2 mb-4 overflow-x-auto pb-1 scrollbar-none -mx-1 px-1">
        {markets.map((m, i) => {
          const pos = m.changePercent >= 0, active = sel===i;
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
                <span className={`text-[10px] font-bold ${active?"opacity-90":pos?"text-emerald-500":"text-red-500"}`}>
                  {pos?"+":""}{m.changePercent.toFixed(2)}%
                </span>
              </span>
            </button>
          );
        })}
      </div>

      {/* ── Chart card ──────────────────────────────────────────── */}
      <Card className="overflow-hidden">

        {/* ── Top bar: delay badge LEFT · Open TradingView RIGHT ── */}
        <div className={`flex items-center justify-between px-4 py-2 border-b ${l?"border-gray-100":"border-[#1a2d3f]"}`}>
          <div className={`flex items-center gap-1 px-2 py-0.5 rounded-md border text-[9px] font-bold uppercase tracking-wide
            ${l
              ? "bg-amber-50 border-amber-200 text-amber-700"
              : "bg-amber-900/10 border-amber-700/30 text-amber-500"
            }`}>
            <AlertTriangle className="w-2.5 h-2.5"/>
            <span>Delayed 15 min</span>
          </div>
          <button
            onClick={e => { e.stopPropagation(); onChart(s.symbol, s.name); }}
            className="flex items-center gap-1 text-[11px] font-bold text-[#0A3656] dark:text-[#74A8C9] hover:underline"
          >
            Open TradingView <ExternalLink className="w-3 h-3"/>
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
              ${l
                ? "bg-red-50 border-red-200 text-red-700"
                : "bg-red-900/10 border-red-800/30 text-red-400"
              }`}>
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
            // tzOffset={getSymbolTzOffset(s.symbol)}
            exchangeTimezone={SYMBOL_TZ[s.symbol] ?? "UTC"}
          />
        </div>

        {/* ── Footer strip: delay info LEFT · period tabs RIGHT ── */}
        <div className={`px-4 py-2 flex items-center justify-between ${tx.t3(l)} text-[10px] border-t ${l?"border-gray-100":"border-[#1a2d3f]"}`}>
          {/* Left — lock/delay label */}
          <span className="hidden md:block flex items-center gap-1 shrink-0">
            <Clock className="w-3 h-3"/>
            Prices delayed 15 min · Yahoo Finance
          </span>
          <span className="hidden md:block flex items-center gap-1 shrink-0">
           
            2 minute candle bar
          </span>

          {/* Right — period tabs */}
          <div className="flex items-center gap-0.5">
            {PERIODS.map(({ key, label }) => (
              <button
                key={key}
                onClick={e => { e.stopPropagation(); setPeriod(key); }}
                className={`px-2 py-0.5 rounded-md text-[11px] font-bold transition-all shrink-0 ${
                  period === key
                    ? isPos
                      ? "bg-emerald-500/15 text-emerald-500 border border-emerald-500/30"
                      : "bg-red-500/15 text-red-500 border border-red-500/30"
                    : l
                      ? "text-gray-500 hover:bg-gray-100 border border-transparent"
                      : "text-[#5a7a92] hover:bg-white/[0.05] border border-transparent"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {regionSummary && <div className="mt-4">{regionSummary}</div>}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
// VIX colours
// ══════════════════════════════════════════════════════════════════
const VIX_S: Record<string,{bg:string;tc:string}> = {
  low:      { bg:"bg-emerald-500/10 border-emerald-500/30", tc:"text-emerald-400" },
  moderate: { bg:"bg-amber-500/10 border-amber-500/30",     tc:"text-amber-400"   },
  high:     { bg:"bg-orange-500/10 border-orange-500/30",   tc:"text-orange-400"  },
  extreme:  { bg:"bg-red-500/10 border-red-500/30",         tc:"text-red-400"     },
};

// ══════════════════════════════════════════════════════════════════
// MAIN
// ══════════════════════════════════════════════════════════════════
export default function GlobalView() {
  const l         = useIL();
  const [now, setNow]         = useState(new Date());
  const [activeNav, setActive]= useState("section-hours");
  const [sidebar,  setSidebar]= useState(false);
  const location  = useLocation();

  const { data, loading, error, lastUpdated, refresh } = useGlobalMarkets();
  const [refreshing, setRefreshing] = useState(false);
  const [modalOpen,  setModalOpen]  = useState(false);
  const [modalSym,   setModalSym]   = useState("");
  const [modalName,  setModalName]  = useState("");
  const [tickerSym,  setTickerSym]  = useState<string|null>(null);
  const scrollDone = useRef(false);

  useEffect(() => { const id = setInterval(() => setNow(new Date()), 1000); return () => clearInterval(id); }, []);

  useEffect(() => {
    const id = new URLSearchParams(location.search).get("scrollTo");
    if (id) setTimeout(() => jumpTo(id), 400);
  }, [location.search]);

  useEffect(() => {
    const st = location.state as {symbol?:string}|null;
    if (st?.symbol) { setTickerSym(st.symbol); window.history.replaceState({},""); }
  }, []);

  useEffect(() => {
    const ids = NAV_SECTIONS.map(s=>s.id);
    const h = () => {
      for (const id of [...ids].reverse()) {
        const el = document.getElementById(id);
        if (el && el.getBoundingClientRect().top <= 120) { setActive(id); break; }
      }
    };
    window.addEventListener("scroll", h, { passive:true });
    return () => window.removeEventListener("scroll", h);
  }, []);

  const isLoading = loading==="idle"||loading==="loading";
  const usM  = useMemo(()=>data?.indices?.us     || [], [data?.indices?.us]);
  const euM  = useMemo(()=>data?.indices?.europe || [], [data?.indices?.europe]);
  const asM  = useMemo(()=>data?.indices?.asia   || [], [data?.indices?.asia]);
  const bnds = useMemo(()=>data?.bonds           || [], [data?.bonds]);
  const regs = useMemo(()=>data?.regions         || [], [data?.regions]);

  // ── FIX: Filter events to next 365 days from today ───────────────
  const evts = useMemo(() => {
    const all = data?.events || [];
    const today     = new Date(); today.setHours(0,0,0,0);
    const yearAhead = new Date(); yearAhead.setDate(today.getDate()+365); yearAhead.setHours(23,59,59,999);
    return all
      .filter(ev => {
        const d = new Date(ev.date);
        return !isNaN(d.getTime()) && d >= today && d <= yearAhead;
      })
      .sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [data?.events]);

  const doRefresh = async () => {
    setRefreshing(true);
    try { await refresh(); } catch(e){console.error(e);} finally { setRefreshing(false); }
  };
  const openChart = (sym:string, name:string) => { setModalSym(sym); setModalName(name); setModalOpen(true); };

  return (
    <Layout>
      <style>{`
        html{scroll-behavior:smooth}
        .scrollbar-none::-webkit-scrollbar{display:none}
        .scrollbar-none{-ms-overflow-style:none;scrollbar-width:none}
        .market-flag {
          font-family: "Segoe UI Emoji", "Apple Color Emoji", "Noto Color Emoji", "Android Emoji", "EmojiSymbols", sans-serif;
          font-style: normal;
          font-weight: normal;
          display: inline-block;
          font-size: 22px;
          line-height: 1;
          -webkit-text-stroke: 0;
          text-rendering: optimizeLegibility;
        }
        .event-card-link:hover { opacity: 0.85; }
      `}</style>
      <div className={`min-h-screen ${tx.bg(l)}`}>

        {/* ── Sticky Top Bar ── */}
        <div className={`sticky top-0 z-20 ${tx.topbar(l)}`}>
          <div className="max-w-[1600px] mx-auto px-4 sm:px-6 py-2 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <button className="lg:hidden p-1.5 rounded-lg border transition-colors"
                style={{ borderColor:l?"#e5e7eb":"#1a2d3f", background:l?"#f9fafb":"rgba(255,255,255,0.03)" }}
                onClick={() => setSidebar(v=>!v)}>
                {sidebar ? <X className={`w-4 h-4 ${tx.t1(l)}`}/> : <Menu className={`w-4 h-4 ${tx.t1(l)}`}/>}
              </button>
              <span className={`text-[9px] font-black px-2 py-1 rounded-md border ${
                l?"bg-[#0A3656]/10 border-[#0A3656]/30 text-[#0A3656]":"bg-[#74A8C9]/10 border-[#74A8C9]/25 text-[#74A8C9]"
              }`}>● LIVE</span>
              <h1 className={`text-sm font-black hidden sm:block ${tx.t1(l)}`}>
                Global Markets
              </h1>
            </div>
            <div className="flex items-center gap-2">
              <span className={`hidden md:flex items-center gap-1 text-[9px] font-bold px-2 py-1 rounded-md border
                ${l
                  ? "bg-amber-50 border-amber-200 text-amber-700"
                  : "bg-amber-900/10 border-amber-700/30 text-amber-500"
                }`}>
                <AlertTriangle className="w-2.5 h-2.5"/>
                Prices delayed 15 min
              </span>
              {error && <span className={`text-[10px] text-red-500 hidden md:inline`}>⚠ {error}</span>}
              <button onClick={doRefresh} disabled={refreshing||isLoading}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold text-white disabled:opacity-50 bg-[#0A3656] hover:bg-[#072a42] transition-colors">
                <RefreshCw className={`w-3 h-3 ${refreshing?"animate-spin":""}`}/> <span className="hidden sm:inline">Refresh</span>
              </button>
              <div className={`flex items-center gap-1 text-[10px] ${tx.t3(l)}`}>
                <Clock className="w-3 h-3"/>
                <span className="tabular-nums hidden sm:inline">{now.toLocaleTimeString("en-IN",{hour:"2-digit",minute:"2-digit",second:"2-digit",hour12:true})} IST</span>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-[1600px] mx-auto flex">
          {/* Sidebar */}
          <aside className={`fixed lg:sticky top-[49px] h-[calc(100vh-49px)] w-52 shrink-0 z-10 transition-transform duration-200 overflow-y-auto ${tx.sidebar(l)} ${sidebar?"translate-x-0":"-translate-x-full lg:translate-x-0"}`}>
            <SideNav
              active={activeNav} onSelect={id => { setActive(id); setSidebar(false); }}
              usMarkets={usM} euMarkets={euM} asMarkets={asM}
              refreshing={refreshing} onRefresh={doRefresh} lastUpdated={lastUpdated??null}
            />
          </aside>
          {sidebar && <div className="fixed inset-0 bg-black/50 z-[9] lg:hidden" onClick={() => setSidebar(false)}/>}

          {/* Main */}
          <main className="flex-1 min-w-0 px-4 sm:px-6 lg:px-8 pt-6 pb-12 max-w-5xl">

            {error && (
              <div className={`flex items-start gap-3 p-4 mb-6 rounded-xl border text-sm ${l?"bg-red-50 border-red-200":"bg-red-900/10 border-red-800/30"}`}>
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0 text-red-500"/>
                <span className={l?"text-red-700":"text-red-400"}>{error}</span>
              </div>
            )}

            <MktHoursSection/>

            {/* ── US Markets ───────────────────────────────────────── */}
            <div id="section-us" className="mb-8 scroll-mt-24">
              <SecHead id="section-us-h" icon={BarChart3} title="United States Markets" sub={`${usM.length} indices`}/>
              {isLoading
                ? <div className={`h-96 rounded-xl animate-pulse ${l?"bg-gray-100":"bg-[#1a2d3f]/40"}`}/>
                : <USMarketsChart
                    markets={usM}
                    onChart={openChart}
                    autoSym={tickerSym ?? undefined}
                    regionSummary={
                      <div>
                        {regs.filter(r=>r.name==="United States").map((r:RegionSummary) => {
                          const p = r.avgChange>=0;
                          return (
                            <Card key={r.name} className="overflow-hidden mb-4">
                              <div className="h-0.5" style={{ background: p?"linear-gradient(to right,#0A3656,transparent)":"linear-gradient(to right,#dc2626,transparent)" }}/>
                              <div className="p-4">
                                <div className="flex items-start justify-between mb-3">
                                  <div className="flex items-center gap-2">
                                    <span className="text-2xl">{r.flag}</span>
                                    <div>
                                      <p className={`font-extrabold text-sm ${tx.t1(l)}`}>{r.name} — Regional Summary</p>
                                      <p className={`text-[11px] mt-0.5 ${tx.t3(l)}`}>{r.countries.join(", ")}</p>
                                    </div>
                                  </div>
                                  <span className={`text-base font-black ${p?"text-emerald-500":"text-red-500"}`}>{p?"+":""}{r.avgChange.toFixed(2)}%</span>
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                  <div className={`flex justify-between items-center px-2.5 py-2 rounded-lg border ${l?"bg-emerald-50 border-emerald-100":"bg-emerald-900/10 border-emerald-800/20"}`}>
                                    <span className={`text-xs ${tx.t3(l)}`}>Best</span>
                                    <span className={`text-xs font-bold ${l?"text-emerald-700":"text-emerald-400"}`}>{r.best.name} ({r.best.change.toFixed(2)}%)</span>
                                  </div>
                                  <div className={`flex justify-between items-center px-2.5 py-2 rounded-lg border ${l?"bg-red-50 border-red-100":"bg-red-900/10 border-red-800/20"}`}>
                                    <span className={`text-xs ${tx.t3(l)}`}>Worst</span>
                                    <span className={`text-xs font-bold ${l?"text-red-700":"text-red-400"}`}>{r.worst.name} ({r.worst.change.toFixed(2)}%)</span>
                                  </div>
                                </div>
                              </div>
                            </Card>
                          );
                        })}
                        {/* Bonds & VIX under US section */}
                        <div id="section-bonds" className="scroll-mt-24">
                          <SecHead id="section-bonds-h" icon={Landmark} title="Bonds & Volatility"/>
                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                            <Card className="overflow-hidden">
                              <div className={`px-4 py-3 border-b ${l?"bg-gray-50 border-gray-100":"bg-[#081017] border-[#1a2d3f]"}`}>
                                <p className={`text-[10px] font-black uppercase tracking-widest ${tx.t3(l)}`}>Treasury Yields</p>
                              </div>
                              {isLoading ? <div className="p-4 space-y-2"><Skel h="h-10"/><Skel h="h-10"/><Skel h="h-10"/></div> :
                               bnds.length>0 ? (
                                <div className={`divide-y ${l?"divide-gray-50":"divide-[#111e28]"}`}>
                                  {bnds.map((b:BondYield, i:number) => {
                                    const p = b.change>=0;
                                    return (
                                      <div key={i} className={`flex items-center justify-between px-4 py-3 ${tx.row(l)}`}>
                                        <div>
                                          <p className={`font-bold text-sm ${tx.t1(l)}`}>{b.name}</p>
                                          <p className={`text-[11px] font-semibold mt-0.5 ${p?"text-emerald-500":"text-red-500"}`}>{p?"+":""}{b.change.toFixed(3)}%</p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                          <span className={`text-xl font-black ${tx.t1(l)}`}>{b.yield.toFixed(3)}%</span>
                                          {p ? <TrendingUp className="w-4 h-4 text-emerald-500"/> : <TrendingDown className="w-4 h-4 text-red-500"/>}
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              ) : <p className={`p-8 text-center text-sm ${tx.t2(l)}`}>Unavailable</p>}
                            </Card>
                            <Card>
                              <div className={`px-4 py-3 border-b ${l?"bg-gray-50 border-gray-100":"bg-[#081017] border-[#1a2d3f]"}`}>
                                <p className={`text-[10px] font-black uppercase tracking-widest ${tx.t3(l)}`}>CBOE VIX — Volatility Index</p>
                              </div>
                              {isLoading ? <div className="p-6"><Skel h="h-32"/></div> :
                               data?.vix ? (() => {
                                const v = data.vix;
                                const vs = VIX_S[v.sentiment] || VIX_S.low;
                                const p = v.change>=0;
                                return (
                                  <div className={`m-4 rounded-xl border p-6 flex flex-col items-center gap-2 ${vs.bg}`}>
                                    <p className={`text-[10px] font-bold uppercase tracking-widest ${tx.t3(l)}`}>VIX Index</p>
                                    <div className={`text-5xl font-black ${tx.t1(l)}`}>{v.value.toFixed(2)}</div>
                                    <p className={`font-bold text-sm ${p?"text-emerald-500":"text-red-500"}`}>{p?"+":""}{v.change.toFixed(2)} ({v.changePercent.toFixed(2)}%)</p>
                                    <span className={`px-4 py-1.5 rounded-full text-[11px] font-black uppercase tracking-widest border ${vs.bg} ${vs.tc}`}>{v.sentiment.toUpperCase()} VOLATILITY</span>
                                  </div>
                                );
                               })() : <p className={`p-8 text-center text-sm ${tx.t2(l)}`}>VIX unavailable</p>}
                            </Card>
                          </div>
                        </div>
                      </div>
                    }
                  />
              }
            </div>

            {/* ── European Markets ─────────────────────────────────── */}
            <div id="section-europe" className="mb-8 scroll-mt-24">
              <SecHead id="section-europe-h" icon={LineChart} title="European Markets" sub={`${euM.length} indices`}/>
              {isLoading
                ? <div className={`h-96 rounded-xl animate-pulse ${l?"bg-gray-100":"bg-[#1a2d3f]/40"}`}/>
                : <EuropeanMarketsChart
                    markets={euM}
                    onChart={openChart}
                    autoSym={tickerSym ?? undefined}
                    regionSummary={
                      regs.filter(r=>r.name==="Europe").map((r:RegionSummary) => {
                        const p = r.avgChange>=0;
                        return (
                          <Card key={r.name} className="overflow-hidden">
                            <div className="h-0.5" style={{ background: p?"linear-gradient(to right,#0A3656,transparent)":"linear-gradient(to right,#dc2626,transparent)" }}/>
                            <div className="p-4">
                              <div className="flex items-start justify-between mb-3">
                                <div className="flex items-center gap-2">
                                  <span className="text-2xl">{r.flag}</span>
                                  <div>
                                    <p className={`font-extrabold text-sm ${tx.t1(l)}`}>{r.name} — Regional Summary</p>
                                    <p className={`text-[11px] mt-0.5 ${tx.t3(l)}`}>{r.countries.join(", ")}</p>
                                  </div>
                                </div>
                                <span className={`text-base font-black ${p?"text-emerald-500":"text-red-500"}`}>{p?"+":""}{r.avgChange.toFixed(2)}%</span>
                              </div>
                              <div className="grid grid-cols-2 gap-2">
                                <div className={`flex justify-between items-center px-2.5 py-2 rounded-lg border ${l?"bg-emerald-50 border-emerald-100":"bg-emerald-900/10 border-emerald-800/20"}`}>
                                  <span className={`text-xs ${tx.t3(l)}`}>Best</span>
                                  <span className={`text-xs font-bold ${l?"text-emerald-700":"text-emerald-400"}`}>{r.best.name} ({r.best.change.toFixed(2)}%)</span>
                                </div>
                                <div className={`flex justify-between items-center px-2.5 py-2 rounded-lg border ${l?"bg-red-50 border-red-100":"bg-red-900/10 border-red-800/20"}`}>
                                  <span className={`text-xs ${tx.t3(l)}`}>Worst</span>
                                  <span className={`text-xs font-bold ${l?"text-red-700":"text-red-400"}`}>{r.worst.name} ({r.worst.change.toFixed(2)}%)</span>
                                </div>
                              </div>
                            </div>
                          </Card>
                        );
                      })[0] || null
                    }
                  />
              }
            </div>

            {/* ── Asia Pacific Markets ─────────────────────────────── */}
            <div id="section-asia" className="mb-8 scroll-mt-24">
              <SecHead id="section-asia-h" icon={Globe} title="Asia Pacific Markets" sub={`${asM.length} indices`}/>
              {isLoading
                ? <div className={`h-96 rounded-xl animate-pulse ${l?"bg-gray-100":"bg-[#1a2d3f]/40"}`}/>
                : <AsiaPacificMarketsChart
                    markets={asM}
                    onChart={openChart}
                    autoSym={tickerSym ?? undefined}
                    regionSummary={
                      regs.filter(r=>r.name==="Asia").map((r:RegionSummary) => {
                        const p = r.avgChange>=0;
                        return (
                          <Card key={r.name} className="overflow-hidden">
                            <div className="h-0.5" style={{ background: p?"linear-gradient(to right,#0A3656,transparent)":"linear-gradient(to right,#dc2626,transparent)" }}/>
                            <div className="p-4">
                              <div className="flex items-start justify-between mb-3">
                                <div className="flex items-center gap-2">
                                  <span className="text-2xl">{r.flag}</span>
                                  <div>
                                    <p className={`font-extrabold text-sm ${tx.t1(l)}`}>{r.name} — Regional Summary</p>
                                    <p className={`text-[11px] mt-0.5 ${tx.t3(l)}`}>{r.countries.join(", ")}</p>
                                  </div>
                                </div>
                                <span className={`text-base font-black ${p?"text-emerald-500":"text-red-500"}`}>{p?"+":""}{r.avgChange.toFixed(2)}%</span>
                              </div>
                              <div className="grid grid-cols-2 gap-2">
                                <div className={`flex justify-between items-center px-2.5 py-2 rounded-lg border ${l?"bg-emerald-50 border-emerald-100":"bg-emerald-900/10 border-emerald-800/20"}`}>
                                  <span className={`text-xs ${tx.t3(l)}`}>Best</span>
                                  <span className={`text-xs font-bold ${l?"text-emerald-700":"text-emerald-400"}`}>{r.best.name} ({r.best.change.toFixed(2)}%)</span>
                                </div>
                                <div className={`flex justify-between items-center px-2.5 py-2 rounded-lg border ${l?"bg-red-50 border-red-100":"bg-red-900/10 border-red-800/20"}`}>
                                  <span className={`text-xs ${tx.t3(l)}`}>Worst</span>
                                  <span className={`text-xs font-bold ${l?"text-red-700":"text-red-400"}`}>{r.worst.name} ({r.worst.change.toFixed(2)}%)</span>
                                </div>
                              </div>
                            </div>
                          </Card>
                        );
                      })[0] || null
                    }
                  />
              }
            </div>

            {/* ── FIX: Events Calendar — next 365 days, clickable ── */}
            {evts.length > 0 && (
              <div className="mb-8">
                <SecHead id="section-events" icon={Activity} title="Global Events Calendar"
                 />
               
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {evts.map((ev: any, i: number) => {
                    const impCls: Record<string,{bg:string;tc:string}> = {
                      High:   { bg:l?"bg-red-50 border-red-200":"bg-red-900/10 border-red-800/20",            tc:l?"text-red-700":"text-red-400"     },
                      Medium: { bg:l?"bg-amber-50 border-amber-200":"bg-amber-900/10 border-amber-800/20",    tc:l?"text-amber-700":"text-amber-400" },
                      Low:    { bg:l?"bg-emerald-50 border-emerald-200":"bg-emerald-900/10 border-emerald-800/20", tc:l?"text-emerald-700":"text-emerald-400" },
                    };
                    const s = impCls[ev.impact] || impCls.Low;
                    const d = new Date(ev.date);
                    const ds = isNaN(d.getTime())
                      ? ev.date
                      : d.toLocaleDateString("en-IN", { day:"2-digit", month:"short", year:"numeric" });

                    // ── Link to Yahoo Finance calendar ──
                    const evDate = !isNaN(d.getTime()) ? d.toISOString().split("T")[0] : "";
                    const eventUrl = ev.url ||
                      (evDate
                        ? `https://finance.yahoo.com/calendar/?day=${evDate}`
                        : `https://finance.yahoo.com/calendar/`);

                    return (
                      // ── FIX: Entire card is now a clickable link ──────────
                      <a
                        key={i}
                        href={eventUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="event-card-link block no-underline transition-opacity"
                        title={`View on Yahoo Finance: ${ev.title}`}
                      >
                        <Card className="p-3.5 cursor-pointer hover:shadow-md transition-shadow">
                          <div className="flex items-center gap-2 flex-wrap mb-2">
                            <span className={`px-2 py-0.5 text-[10px] font-extrabold rounded-full border ${s.bg} ${s.tc}`}>
                              {ev.impact}
                            </span>
                            <span className={`px-2 py-0.5 text-[10px] font-semibold rounded-full border ${l?"bg-gray-50 text-gray-600 border-gray-100":"bg-white/5 text-[#5a7a92] border-[#1a2d3f]"}`}>
                              {ev.region}
                            </span>
                            <span className={`ml-auto text-xs ${tx.t3(l)}`}>{ds}</span>
                          </div>
                          <div className="flex items-start justify-between gap-2">
                            <p className={`font-semibold text-sm leading-snug ${tx.t1(l)}`}>{ev.title}</p>
                            {/* ── FIX: External link icon shows clickability ── */}
                            <ExternalLink className={`w-3 h-3 shrink-0 mt-0.5 ${tx.t3(l)}`}/>
                          </div>
                          {(ev.actual || ev.forecast) && (
                            <div className="flex gap-3 mt-2">
                              {ev.forecast && (
                                <span className={`text-[10px] ${tx.t3(l)}`}>
                                  Forecast: <span className="font-bold">{ev.forecast}</span>
                                </span>
                              )}
                              {ev.actual && (
                                <span className={`text-[10px] font-bold ${ev.actual >= ev.forecast ? "text-emerald-500" : "text-red-500"}`}>
                                  Actual: {ev.actual}
                                </span>
                              )}
                            </div>
                          )}
                        </Card>
                      </a>
                    );
                  })}
                </div>
              </div>
            )}

          </main>
        </div>
      </div>

      <TradingViewModal isOpen={modalOpen} onClose={()=>setModalOpen(false)} symbol={modalSym} name={modalName}/>
    </Layout>
  );
}