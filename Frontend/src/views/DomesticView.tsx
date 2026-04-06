// Frontend/src/views/DomesticView.tsx
// Production · Zerodha/Groww style · All real Kite Connect data · No sample data

import Layout from "@/components/Layout";
import { useKiteTicks, type KiteTick } from "@/hooks/useKiteTicks";
import {
  TrendingUp, TrendingDown, RefreshCw, BarChart3,
  LineChart, Percent, ArrowUpDown, Info, Wifi,
  WifiOff, BookOpen, PieChart, Building2, ExternalLink,
  Package, ChevronRight, Home, Menu, X, AlertCircle,
  Clock, Activity, FileText, Calculator, DollarSign,
  ShieldCheck, Layers, Send, ChevronDown, ChevronUp,
  Search, Star, Globe2, Zap,
} from "lucide-react";
import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useTheme } from "@/controllers/Themecontext";
import {
  createChart, CandlestickSeries, ColorType, HistogramSeries,
  type IChartApi, type ISeriesApi,
} from "lightweight-charts";

// ── Constants ────────────────────────────────────────────────────
const BASE = import.meta.env.VITE_API_URL || "http://localhost:8000/api/v1";
const ROOT = BASE.replace(/\/api\/v1\/?$/, "");


const SECTOR_INDICES = [
  { name: "Nifty IT",          key: "NSE:NIFTY IT",          sym: "NIFTY IT",          token: 258529 },
  { name: "Nifty Bank",        key: "NSE:NIFTY BANK",        sym: "NIFTY BANK",        token: 260105 },
  { name: "Nifty Auto",        key: "NSE:NIFTY AUTO",        sym: "NIFTY AUTO",        token: 258049 },
  { name: "Nifty Pharma",      key: "NSE:NIFTY PHARMA",      sym: "NIFTY PHARMA",      token: 259849 },
  { name: "Nifty Fin Service", key: "NSE:NIFTY FIN SERVICE", sym: "NIFTY FIN SERVICE", token: 261889 },
  { name: "Nifty FMCG",        key: "NSE:NIFTY FMCG",        sym: "NIFTY FMCG",        token: 258537 },
  { name: "Nifty Metal",       key: "NSE:NIFTY METAL",       sym: "NIFTY METAL",       token: 259337 },
  { name: "Nifty Energy",      key: "NSE:NIFTY ENERGY",      sym: "NIFTY ENERGY",      token: 258409 },
  { name: "Nifty Realty",      key: "NSE:NIFTY REALTY",      sym: "NIFTY REALTY",      token: 260361 },
  { name: "Nifty PSU Bank",    key: "NSE:NIFTY PSU BANK",    sym: "NIFTY PSU BANK",    token: 260649 },
];

// ── Instruments ──────────────────────────────────────────────────
const INDICES = [
  { name:"Nifty 50",       key:"NSE:NIFTY 50",          sym:"NIFTY 50",          ex:"NSE", token:256265  },
  { name:"Sensex",         key:"BSE:SENSEX",             sym:"SENSEX",            ex:"BSE", token:265     },
  { name:"Bank Nifty",     key:"NSE:NIFTY BANK",         sym:"NIFTY BANK",        ex:"NSE", token:260105  },
  { name:"Nifty Auto",     key:"NSE:NIFTY AUTO",         sym:"NIFTY AUTO",        ex:"NSE", token:258049  },
  { name:"Nifty Pharma",   key:"NSE:NIFTY PHARMA",       sym:"NIFTY PHARMA",      ex:"NSE", token:259849  },
  // { name:"Nifty IT",       key:"NSE:NIFTY IT",           sym:"NIFTY IT",          ex:"NSE", token:258529  },
  { name:"Nifty Metal",    key:"NSE:NIFTY METAL",        sym:"NIFTY METAL",       ex:"NSE", token:259337  },
  // { name:"Nifty Realty",   key:"NSE:NIFTY REALTY",       sym:"NIFTY REALTY",      ex:"NSE", token:260361  },
  // { name:"Nifty Energy",   key:"NSE:NIFTY ENERGY",       sym:"NIFTY ENERGY",      ex:"NSE", token:258409  },
  // { name:"Nifty FMCG",     key:"NSE:NIFTY FMCG",         sym:"NIFTY FMCG",        ex:"NSE", token:258537  },
  { name:"Nifty Fin Svc",  key:"NSE:NIFTY FIN SERVICE",  sym:"NIFTY FIN SERVICE", ex:"NSE", token:261889  },
  // { name:"Nifty PSU Bank", key:"NSE:NIFTY PSU BANK",     sym:"NIFTY PSU BANK",    ex:"NSE", token:260649  },
  { name:"India VIX",      key:"NSE:INDIA VIX",          sym:"INDIA VIX",         ex:"NSE", token:264969  },
];
const STOCKS = [
  { key:"NSE:RELIANCE",   sym:"RELIANCE",   name:"Reliance Industries", token:738561   },
  { key:"NSE:TCS",        sym:"TCS",        name:"Tata Consultancy",    token:2953217  },
  { key:"NSE:HDFCBANK",   sym:"HDFCBANK",   name:"HDFC Bank",           token:341249   },
  { key:"NSE:INFY",       sym:"INFY",       name:"Infosys",             token:408065   },
  { key:"NSE:ICICIBANK",  sym:"ICICIBANK",  name:"ICICI Bank",          token:1270529  },
  { key:"NSE:WIPRO",      sym:"WIPRO",      name:"Wipro",               token:969473   },
  { key:"NSE:HINDUNILVR", sym:"HINDUNILVR", name:"HUL",                 token:356865   },
  { key:"NSE:ITC",        sym:"ITC",        name:"ITC Ltd",             token:424961   },
];
// ── Search catalogue (top NSE stocks for autocomplete) ──────────
const SEARCH_CATALOGUE = [
  // Nifty 50 majors
  { sym:"RELIANCE",   name:"Reliance Industries",         token:738561,   ex:"NSE" },
  { sym:"TCS",        name:"Tata Consultancy Services",   token:2953217,  ex:"NSE" },
  { sym:"HDFCBANK",   name:"HDFC Bank",                   token:341249,   ex:"NSE" },
  { sym:"INFY",       name:"Infosys",                     token:408065,   ex:"NSE" },
  { sym:"ICICIBANK",  name:"ICICI Bank",                  token:1270529,  ex:"NSE" },
  { sym:"WIPRO",      name:"Wipro",                       token:969473,   ex:"NSE" },
  { sym:"HINDUNILVR", name:"Hindustan Unilever",          token:356865,   ex:"NSE" },
  { sym:"ITC",        name:"ITC Ltd",                     token:424961,   ex:"NSE" },
  { sym:"SBIN",       name:"State Bank of India",         token:779521,   ex:"NSE" },
  { sym:"BAJFINANCE", name:"Bajaj Finance",               token:81153,    ex:"NSE" },
  { sym:"KOTAKBANK",  name:"Kotak Mahindra Bank",         token:492033,   ex:"NSE" },
  { sym:"AXISBANK",   name:"Axis Bank",                   token:1510401,  ex:"NSE" },
  { sym:"LT",         name:"Larsen & Toubro",             token:2939649,  ex:"NSE" },
  { sym:"ASIANPAINT", name:"Asian Paints",                token:60417,    ex:"NSE" },
  { sym:"MARUTI",     name:"Maruti Suzuki",               token:2815745,  ex:"NSE" },
  { sym:"SUNPHARMA",  name:"Sun Pharmaceutical",          token:857857,   ex:"NSE" },
  { sym:"TATAMOTORS", name:"Tata Motors",                 token:884737,   ex:"NSE" },
  { sym:"TITAN",      name:"Titan Company",               token:897537,   ex:"NSE" },
  { sym:"NESTLEIND",  name:"Nestle India",                token:4598529,  ex:"NSE" },
  { sym:"ULTRACEMCO", name:"UltraTech Cement",            token:2952193,  ex:"NSE" },
  { sym:"POWERGRID",  name:"Power Grid Corp",             token:3834113,  ex:"NSE" },
  { sym:"NTPC",       name:"NTPC",                        token:2977281,  ex:"NSE" },
  { sym:"ONGC",       name:"Oil & Natural Gas Corp",      token:633601,   ex:"NSE" },
  { sym:"COALINDIA",  name:"Coal India",                  token:5215745,  ex:"NSE" },
  { sym:"ADANIENT",   name:"Adani Enterprises",           token:25,       ex:"NSE" },
  { sym:"ADANIPORTS", name:"Adani Ports",                 token:3861249,  ex:"NSE" },
  { sym:"JSWSTEEL",   name:"JSW Steel",                   token:3001089,  ex:"NSE" },
  { sym:"TATASTEEL",  name:"Tata Steel",                  token:895745,   ex:"NSE" },
  { sym:"HINDALCO",   name:"Hindalco Industries",         token:348929,   ex:"NSE" },
  { sym:"BAJAJFINSV", name:"Bajaj Finserv",               token:4268801,  ex:"NSE" },
  { sym:"DRREDDY",    name:"Dr. Reddy's Laboratories",    token:225537,   ex:"NSE" },
  { sym:"CIPLA",      name:"Cipla",                       token:177665,   ex:"NSE" },
  { sym:"DIVISLAB",   name:"Divi's Laboratories",         token:2800641,  ex:"NSE" },
  { sym:"APOLLOHOSP", name:"Apollo Hospitals",            token:157441,   ex:"NSE" },
  { sym:"HEROMOTOCO", name:"Hero MotoCorp",               token:345089,   ex:"NSE" },
  { sym:"EICHERMOT",  name:"Eicher Motors",               token:232961,   ex:"NSE" },
  { sym:"TECHM",      name:"Tech Mahindra",               token:3465729,  ex:"NSE" },
  { sym:"HCLTECH",    name:"HCL Technologies",            token:1850625,  ex:"NSE" },
  { sym:"INDUSINDBK", name:"IndusInd Bank",               token:1346049,  ex:"NSE" },
  { sym:"M&M",        name:"Mahindra & Mahindra",         token:519937,   ex:"NSE" },
  { sym:"GRASIM",     name:"Grasim Industries",           token:315394,   ex:"NSE" },
  { sym:"BRITANNIA",  name:"Britannia Industries",        token:140033,   ex:"NSE" },
  { sym:"SHREECEM",   name:"Shree Cement",                token:3566337,  ex:"NSE" },
  { sym:"BPCL",       name:"BPCL",                        token:134657,   ex:"NSE" },
  { sym:"IOC",        name:"Indian Oil Corp",             token:415745,   ex:"NSE" },
  { sym:"TATACONSUM", name:"Tata Consumer Products",      token:878593,   ex:"NSE" },
  { sym:"BAJAJ-AUTO", name:"Bajaj Auto",                  token:4267265,  ex:"NSE" },
  { sym:"VEDL",       name:"Vedanta",                     token:784129,   ex:"NSE" },
  { sym:"ZOMATO",     name:"Zomato",                      token:5215745,  ex:"NSE" },
  { sym:"PAYTM",      name:"One97 Comm (Paytm)",          token:5552641,  ex:"NSE" },
  { sym:"NYKAA",      name:"FSN E-Commerce (Nykaa)",      token:7458561,  ex:"NSE" },
  { sym:"DMART",      name:"Avenue Supermarts",           token:4598529,  ex:"NSE" },
  { sym:"IRFC",       name:"IRFC",                        token:2675713,  ex:"NSE" },
  { sym:"IRCTC",      name:"IRCTC",                       token:3484417,  ex:"NSE" },
  { sym:"HAL",        name:"Hindustan Aeronautics",       token:2513665,  ex:"NSE" },
  { sym:"BEL",        name:"Bharat Electronics",          token:212865,   ex:"NSE" },
  { sym:"YESBANK",    name:"Yes Bank",                    token:3050241,  ex:"NSE" },
  { sym:"PNB",        name:"Punjab National Bank",        token:2730497,  ex:"NSE" },
  // Indices
  { sym:"NIFTY 50",   name:"Nifty 50 Index",             token:256265,   ex:"NSE" },
  { sym:"SENSEX",     name:"BSE Sensex",                  token:265,      ex:"BSE" },
  { sym:"NIFTY BANK", name:"Bank Nifty Index",            token:260105,   ex:"NSE" },
  { sym:"NIFTY AUTO", name:"Nifty Auto Index",            token:258049,   ex:"NSE" },
  { sym:"NIFTY PHARMA",name:"Nifty Pharma Index",         token:259849,   ex:"NSE" },
];

const ALL_INSTR = [
  ...INDICES.map(i => ({ key:i.key, sym:i.sym, token:i.token })),
  ...STOCKS.map(s => ({ key:s.key, sym:s.sym, token:s.token })),
];
const NAV_SECTIONS = [
  { id: "overview",       label: "Overview",          icon: Home        },
  { id: "breadth",        label: "Market Breadth",    icon: BarChart3   },
  { id: "indices",        label: "Major Indices",      icon: BarChart3   },
  { id: "sectors",        label: "Sectors",            icon: PieChart    },
  { id: "stocks",         label: "Top Stocks",         icon: TrendingUp  },
  { id: "gainers",        label: "Gainers / Losers",   icon: Activity    },
  { id: "depth",          label: "Market Depth",       icon: ArrowUpDown },
  { id: "options",        label: "F&O / PCR",          icon: Layers      },
  { id: "fii-dii",        label: "FII / DII",          icon: Building2   },
  { id: "historical",     label: "Historical Data",    icon: BookOpen    },
  { id: "corporate",      label: "Corporate Actions",  icon: Building2   },
  { id: "macro",          label: "Macro Indicators",   icon: Globe2      },
];

// ── Helpers ───────────────────────────────────────────────────────
const fmt  = (n?: number | null, d = 2) =>
  n != null ? n.toLocaleString("en-IN", { minimumFractionDigits: d, maximumFractionDigits: d }) : "—";
const fmtV = (v?: number | null) => {
  if (v == null) return "—";
  if (v === 0) return "0";
  if (v >= 1e7) return `${(v/1e7).toFixed(2)} Cr`;
  if (v >= 1e5) return `${(v/1e5).toFixed(2)} L`;
  if (v >= 1e3) return `${(v/1e3).toFixed(1)}K`;
  return v.toFixed(0);
};
const getPct = (t?: KiteTick | null) =>
  t?.ohlc?.close && t.last_price
    ? ((t.last_price - t.ohlc.close) / t.ohlc.close) * 100 : null;
const getChg = (t?: KiteTick | null) =>
  t?.ohlc?.close && t.last_price ? t.last_price - t.ohlc.close : null;
const up = (v?: number | null) => (v ?? 0) >= 0;

// ── Theme helpers ─────────────────────────────────────────────────
const useIL = () => { const { theme } = useTheme(); return theme === "light"; };

const tx = {
  bg:      (l:boolean) => l ? "bg-[#f0f7fe]"    : "bg-[#070e1a]",
  card:    (l:boolean) => l ? "bg-white border border-slate-200 shadow-sm" : "bg-[#0c1a2e] border border-[#1e3a5f]/50",
  header:  (l:boolean) => l ? "bg-slate-50 border-b border-slate-200"      : "bg-[#070e1a] border-b border-[#1e3a5f]/40",
  row:     (l:boolean) => l ? "hover:bg-slate-50/60 border-b border-slate-100" : "hover:bg-white/[0.02] border-b border-[#1e3a5f]/30",
  sidebar: (l:boolean) => l ? "bg-white border-r border-slate-200" : "bg-[#070e1a] border-r border-[#1e3a5f]/40",
  topbar:  (l:boolean) => l ? "bg-white/96 border-b border-slate-200 backdrop-blur-sm" : "bg-[#040810]/96 border-b border-[#1e3a5f]/50 backdrop-blur-sm",
  t1:      (l:boolean) => l ? "text-slate-900"  : "text-white",
  t2:      (l:boolean) => l ? "text-slate-500"  : "text-slate-400",
  t3:      (l:boolean) => l ? "text-slate-400"  : "text-slate-500",
  tab:     (l:boolean, active:boolean) => active
    ? "bg-[#5194F6] text-white border-transparent"
    : l ? "bg-white text-slate-600 border-slate-200 hover:border-slate-300"
        : "bg-[#0c1a2e] text-slate-400 border-[#1e3a5f]/50 hover:bg-[#0c1a2e] hover:text-white",
  pill:    (l:boolean, g:boolean) => g
    ? l ? "bg-emerald-50 text-emerald-700" : "bg-emerald-500/15 text-emerald-400"
    :     l ? "bg-red-50 text-red-600"     : "bg-red-500/15 text-red-400",
};

// ── Hooks ──────────────────────────────────────────────────────────
function useThrottledTicks(raw: Record<string,KiteTick>, ms = 2000) {
  const [disp, setDisp] = useState<Record<string,KiteTick>>({});
  const buf = useRef<Record<string,KiteTick>>({});
  useEffect(() => { buf.current = { ...buf.current, ...raw }; }, [raw]);
  useEffect(() => {
    const id = setInterval(() => setDisp(p => ({ ...p, ...buf.current })), ms);
    return () => clearInterval(id);
  }, [ms]);
  return disp;
}

// Fast 400ms throttle — for ticker bar only (needs to feel live)
function useFastTicks(raw: Record<string,KiteTick>) {
  return useThrottledTicks(raw, 400);
}

function useFlash(val?: number | null) {
  const [f, setF] = useState<"up"|"dn"|null>(null);
  const prev = useRef<number|undefined>(undefined);
  useEffect(() => {
    if (val == null || prev.current == null) { prev.current = val ?? undefined; return; }
    if (val > prev.current) { setF("up"); setTimeout(()=>setF(null),700); }
    if (val < prev.current) { setF("dn"); setTimeout(()=>setF(null),700); }
    prev.current = val;
  }, [val]);
  return f;
}

function useAPI<T>(url: string, deps: any[] = []) {
  const [data,    setData]    = useState<T|null>(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string|null>(null);
  const [meta,    setMeta]    = useState<any>(null);   // full raw JSON response
  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const r = await fetch(`${BASE}${url}`);
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const j = await r.json();
      if (j.status === "error") throw new Error(j.message ?? "API error");
      setData(j.data ?? j);   // data = j.data (array/object) or full j
      setMeta(j);             // meta = full raw response (has j.meta, j.source etc.)
    } catch (e:any) { setError(e.message); }
    finally { setLoading(false); }
  }, [url]);
  useEffect(() => { load(); }, deps);
  return { data, loading, error, meta, refresh: load };
}

// ── Primitives ────────────────────────────────────────────────────
function Card({ children, className="" }: { children:React.ReactNode; className?:string }) {
  const l = useIL();
  return <div className={`rounded-xl ${tx.card(l)} ${className}`}>{children}</div>;
}

function Skel({ h="h-8", w="w-full" }: { h?:string; w?:string }) {
  const l = useIL();
  return <div className={`${h} ${w} rounded-lg animate-pulse ${l?"bg-slate-100":"bg-[#0c1a2e]/60"}`}/>;
}

function PctTag({ p, sm=false }: { p?:number|null; sm?:boolean }) {
  const l = useIL();
  if (p==null) return <span className={`text-xs ${tx.t3(l)}`}>—</span>;
  const g = p>=0;
  return (
    <span className={`inline-flex items-center gap-0.5 font-bold rounded-md ${sm?"text-[10px] px-1 py-0.5":"text-xs px-1.5 py-1"} ${tx.pill(l,g)}`}>
      {g?<TrendingUp className="w-2.5 h-2.5"/>:<TrendingDown className="w-2.5 h-2.5"/>}
      {g?"+":""}{p.toFixed(2)}%
    </span>
  );
}

function FlashPrice({ val, cls="" }: { val?:number|null; cls?:string }) {
  const f = useFlash(val);
  const l = useIL();
  if (val==null) return <span className={`${tx.t3(l)} ${cls}`}>—</span>;
  return (
    <span className={`transition-colors duration-500 ${cls} ${f==="up"?"text-emerald-500":f==="dn"?"text-red-500":tx.t1(l)}`}>
      ₹{fmt(val)}
    </span>
  );
}

function SecHead({ id, icon:Icon, title, sub, live=false }: {
  id:string; icon:any; title:string; sub?:string; live?:boolean;
}) {
  const l = useIL();
  return (
    <div id={id} className="flex items-center gap-3 mb-5 scroll-mt-24">
      <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 bg-[#5194F6]/10">
        <Icon className="w-4 h-4 text-[#5194F6]"/>
      </div>
      <div className="flex items-center gap-2 flex-1 min-w-0">
        <h2 className={`font-black text-base tracking-tight ${tx.t1(l)}`}>{title}</h2>
        {live && (
          <span className="flex items-center gap-1 text-[9px] font-black px-1.5 py-0.5 rounded bg-emerald-500 text-white tracking-wider">
            <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse"/>LIVE
          </span>
        )}
        {sub && <span className={`text-[11px] truncate hidden sm:block ${tx.t3(l)}`}>{sub}</span>}
      </div>
      <div className={`h-px flex-1 max-w-24 ${l?"bg-slate-200":"bg-[#1e3a5f]/40"}`}/>
    </div>
  );
}

function KiteBanner({ msg }: { msg:string }) {
  const l = useIL();
  return (
    <div className={`mb-4 px-4 py-3 rounded-xl border flex flex-col sm:flex-row sm:items-center gap-3 ${l?"bg-amber-50 border-amber-200":"bg-amber-500/10 border-amber-500/20"}`}>
      <div className="flex items-center gap-2 flex-1">
        <Info className={`w-4 h-4 shrink-0 ${l?"text-amber-600":"text-amber-400"}`}/>
        <p className={`text-xs font-medium ${l?"text-amber-700":"text-amber-300"}`}>{msg}</p>
      </div>
      <a href={`${ROOT}/api/v1/kite/login`}
        className="shrink-0 flex items-center gap-1.5 text-xs font-bold px-4 py-2 rounded-lg bg-[#5194F6] text-white hover:bg-[#4080e0] transition-colors">
        <Wifi className="w-3.5 h-3.5"/>Login with Kite
      </a>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
// TICKER BAR
// ══════════════════════════════════════════════════════════════════
function TickerItem({ tick, sym }: { tick?:KiteTick; sym:string }) {
  const f = useFlash(tick?.last_price);
  const l = useIL();
  const p = getPct(tick);
  return (
    <div className={`flex items-center gap-2 px-4 h-full border-r shrink-0 ${l?"border-slate-100":"border-[#1e3a5f]/40"}`}>
      <span className={`text-[10px] font-black tracking-wider ${tx.t3(l)}`}>{sym}</span>
      <span className={`text-[11px] font-bold tabular-nums transition-colors duration-400 ${f==="up"?"text-emerald-500":f==="dn"?"text-red-500":tx.t1(l)}`}>
        {tick?.last_price!=null ? fmt(tick.last_price) : "···"}
      </span>
      {p!=null && <span className={`text-[10px] font-bold ${p>=0?"text-emerald-500":"text-red-500"}`}>{p>=0?"▲":"▼"}{Math.abs(p).toFixed(2)}%</span>}
    </div>
  );
}

function TickerBar({ rawTicks }: { rawTicks:any }) {
  const l    = useIL();
  // Use fast 400ms throttle so prices update visually without animation stutter
  const ticks = useFastTicks(rawTicks);
  const live  = ALL_INSTR.filter(i => ticks[i.key]?.last_price!=null);
  if (!live.length) return null;
  // Build items list once (stable for animation), updates come via tick props
  const items = [...live, ...live];
  return (
    <div className={`overflow-hidden border-b select-none ${l?"bg-white border-slate-200":"bg-[#040810] border-[#1e3a5f]/50"}`} style={{ height:34 }}>
      <style>{`@keyframes tkS{from{transform:translateX(0)}to{transform:translateX(-50%)}}.tk-s{display:flex;width:max-content;animation:tkS 55s linear infinite;align-items:center;height:100%}.tk-s:hover{animation-play-state:paused}`}</style>
      <div className="tk-s">{items.map((it,i) => <TickerItem key={i} tick={ticks[it.key]} sym={it.sym}/>)}</div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
// SIDEBAR
// ══════════════════════════════════════════════════════════════════
function NiftyMini({ tick }: { tick:KiteTick }) {
  const f = useFlash(tick.last_price);
  const p = getPct(tick);
  return <p className={`text-base font-black tabular-nums transition-colors duration-500 ${f==="up"?"text-emerald-500":f==="dn"?"text-red-500":up(p)?"text-emerald-600":"text-red-500"}`}>{fmt(tick.last_price)}</p>;
}

function SideNav({ active, onSelect, ticks, connected }: {
  active:string; onSelect:(id:string)=>void; ticks:any; connected:boolean;
}) {
  const l = useIL();
  return (
    <div className="flex flex-col h-full py-3">
      <p className={`text-[9px] font-black uppercase tracking-widest px-4 mb-1 ${tx.t3(l)}`}>Navigate</p>
      <nav className="flex-1 space-y-px px-2 overflow-y-auto">
        {NAV_SECTIONS.map(s => (
          <button key={s.id}
            onClick={() => { onSelect(s.id); document.getElementById(s.id)?.scrollIntoView({ behavior:"smooth", block:"start" }); }}
            className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold transition-all text-left ${
              active===s.id
                ? l?"bg-[#5194F6]/10 text-[#5194F6] border-l-2 border-[#5194F6] font-bold":"bg-[#5194F6]/10 text-[#5194F6] border-l-2 border-[#5194F6]"
                : l?"text-slate-500 hover:bg-slate-50 hover:text-slate-800":"text-slate-400 hover:bg-[#0c1a2e] hover:text-white"
            }`}>
            <s.icon className="w-3.5 h-3.5 shrink-0"/>
            <span className="truncate">{s.label}</span>
            {active===s.id && <ChevronRight className="w-3 h-3 ml-auto shrink-0"/>}
          </button>
        ))}
      </nav>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
// CANDLESTICK CHART COMPONENT
// ══════════════════════════════════════════════════════════════════
interface Candle { x:number; y:[number,number,number,number]; volume?:number }
type Period = "1D"|"1W"|"1M"|"3M"|"1Y";
const PERIODS: Period[] = ["1D","1W","1M","3M","1Y"];
const P_INTERVAL: Record<Period,string> = { "1D":"5minute","1W":"30minute","1M":"day","3M":"day","1Y":"day" };
const P_DAYS:     Record<Period,number> = { "1D":1,"1W":7,"1M":30,"3M":90,"1Y":365 };
const P_LABEL:    Record<Period,string> = { "1D":"5m candles","1W":"30m candles","1M":"EOD · daily candles","3M":"EOD · daily candles","1Y":"EOD · daily candles" };

function CandleChart({ token, height=300, showControls=true, defaultPeriod="1D", liveTick }: {
  token:number; height?:number; showControls?:boolean; defaultPeriod?:Period; liveTick?:KiteTick;
}) {
  const [period, setPeriod] = useState<Period>(defaultPeriod);
  const [candles, setCandles] = useState<Candle[]>([]);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState<string|null>(null);
  const [lastFetch, setLastFetch] = useState<Date|null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef     = useRef<IChartApi|null>(null);
  const cSerRef      = useRef<ISeriesApi<"Candlestick">|null>(null);
  const vSerRef      = useRef<ISeriesApi<"Histogram">|null>(null);

  const { theme } = useTheme();
  const dark = theme !== "light";
  const l    = !dark;

  const fetchData = useCallback(async (p:Period) => {
    setLoading(true); setError(null);
    try {
      const to   = new Date().toISOString().split("T")[0];
      const from = (() => { const d=new Date(); d.setDate(d.getDate()-P_DAYS[p]); return d.toISOString().split("T")[0]; })();
      const res  = await fetch(`${BASE}/kite/historical?token=${token}&interval=${P_INTERVAL[p]}&from=${from}&to=${to}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const j   = await res.json();
      const cs: Candle[] = j.candles || [];
      if (!cs.length) throw new Error("No data");
      setCandles(cs); setLastFetch(new Date());
    } catch(e:any) { setError(e.message); setCandles([]); }
    finally { setLoading(false); }
  }, [token]);

  useEffect(() => { fetchData(period); }, [period, fetchData]);

  // Create chart
  useEffect(() => {
    if (!containerRef.current) return;
    if (chartRef.current) { chartRef.current.remove(); chartRef.current=null; cSerRef.current=null; vSerRef.current=null; }

    const bg   = dark ? "#0c1a2e" : "#ffffff";
    const grid = dark ? "rgba(30,58,95,0.3)" : "rgba(0,0,0,0.04)";
    const text = dark ? "rgba(144,164,184,0.7)"  : "rgba(80,100,120,0.9)";
    const chartH = showControls ? height - 80 : height;

    const chart = createChart(containerRef.current, {
      autoSize: false,
      width:  containerRef.current.clientWidth || 600,
      height: chartH,
      layout: { background:{ type:ColorType.Solid, color:bg }, textColor:text, fontFamily:"'JetBrains Mono',monospace", fontSize:10, attributionLogo:false },
      grid:   { vertLines:{ visible:false }, horzLines:{ color:grid, style:1 } },
      crosshair: {
        mode:1,
        vertLine:{ color:"rgba(81,148,246,0.25)", labelBackgroundColor:dark?"#0c1a2e":"#dbeafe", width:1, style:1 },
        horzLine:{ color:"rgba(81,148,246,0.25)", labelBackgroundColor:dark?"#0c1a2e":"#dbeafe", width:1, style:1 },
      },
      rightPriceScale: { borderVisible:false, scaleMargins:{ top:0.06, bottom:0.18 }, minimumWidth:70 },
      timeScale: { borderVisible:false, timeVisible:period==="1D"||period==="1W", secondsVisible:false, fixLeftEdge:true, fixRightEdge:true, barSpacing:9, rightOffset:4 },
      handleScroll: { mouseWheel:false, pressedMouseMove:true, horzTouchDrag:true },
      handleScale:  { mouseWheel:false, pinch:false },
    });

    const cSer = chart.addSeries(CandlestickSeries, {
      upColor:"#16a34a", downColor:"#dc2626", borderVisible:false, wickUpColor:"#16a34a", wickDownColor:"#dc2626",
    });
    const vSer = chart.addSeries(HistogramSeries, { priceFormat:{ type:"volume" }, priceScaleId:"vol" });
    chart.priceScale("vol").applyOptions({ scaleMargins:{ top:0.85, bottom:0 } });

    chartRef.current  = chart;
    cSerRef.current   = cSer;
    vSerRef.current   = vSer;

    const ro = new ResizeObserver(() => {
      if (containerRef.current && chartRef.current) {
        chartRef.current.applyOptions({ autoSize:false, width:containerRef.current.clientWidth });
      }
    });
    ro.observe(containerRef.current);
    return () => { ro.disconnect(); try { chart.remove(); } catch(_){} chartRef.current=null; cSerRef.current=null; vSerRef.current=null; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dark]);

  // ── Live tick update: update last candle close on every WebSocket tick (1D only) ──
  useEffect(() => {
    if (!liveTick?.last_price || !cSerRef.current || period !== "1D" || candles.length === 0) return;
    const last = candles[candles.length - 1];
    if (!last) return;
    const t = Math.floor(last.x / 1000) as any;
    try {
      cSerRef.current.update({
        time:  t,
        open:  last.y[0],
        high:  Math.max(last.y[1], liveTick.last_price),
        low:   Math.min(last.y[2], liveTick.last_price),
        close: liveTick.last_price,
      });
      // Also update volume bar colour
      if (vSerRef.current && last.volume != null) {
        vSerRef.current.update({
          time:  t,
          value: last.volume,
          color: liveTick.last_price >= last.y[0] ? "rgba(22,163,74,0.35)" : "rgba(220,38,38,0.35)",
        });
      }
    } catch (_) {}
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [liveTick?.last_price]);

  // Push candles
  useEffect(() => {
    if (!cSerRef.current || !vSerRef.current || !candles.length) return;
    const seen = new Set<number>();
    const rows = candles
      .map(c => ({ time:Math.floor(c.x/1000) as any, o:c.y[0], h:c.y[1], l:c.y[2], cl:c.y[3], v:c.volume??0 }))
      .filter(c => { const tt=c.time as number; if(seen.has(tt)) return false; seen.add(tt); return true; })
      .sort((a,b) => (a.time as number)-(b.time as number));
    cSerRef.current.setData(rows.map(r => ({ time:r.time, open:r.o, high:r.h, low:r.l, close:r.cl })));
    vSerRef.current.setData(rows.map(r => ({ time:r.time, value:r.v, color:r.cl>=r.o?"rgba(22,163,74,0.35)":"rgba(220,38,38,0.35)" })));
    chartRef.current?.timeScale().fitContent();
    chartRef.current?.applyOptions({ timeScale:{ timeVisible:period==="1D"||period==="1W" } });
  }, [candles, period]);

  return (
    <div>
      {showControls && (
        <div className={`flex items-center gap-2 px-4 py-3 border-b ${l?"border-slate-100":"border-[#1e3a5f]/50"}`}>
          <div className="flex gap-1.5">
            {PERIODS.map(p => (
              <button key={p} onClick={() => setPeriod(p)} disabled={loading}
                className={`px-2.5 py-1 rounded-md text-[11px] font-bold border transition-all disabled:opacity-60 ${
                  period===p
                    ? "bg-[#5194F6] text-white border-transparent"
                    : l?"bg-white text-slate-500 border-slate-200 hover:border-gray-300":"bg-[#0c1a2e] text-slate-400 border-[#1e3a5f]/50 hover:border-[#1e3a5f]"
                }`}>{p}</button>
            ))}
          </div>
          {loading && <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#5194F6] ml-1"/>}
          {error && <span className="text-[10px] text-red-500 ml-1">⚠ {error}</span>}
          {lastFetch && !error && (() => {
            const now = new Date();
            const mins = now.getHours() * 60 + now.getMinutes();
            const mktOpen = mins >= 555 && mins < 930; // 9:15 AM to 3:30 PM
            if (mktOpen) {
              return <span className={`text-[10px] ml-auto hidden sm:block ${l?"text-slate-400":"text-slate-500"}`}>{P_LABEL[period]} · Updated {lastFetch.toLocaleTimeString("en-IN",{hour:"2-digit",minute:"2-digit",hour12:true})}</span>;
            } else {
              return <span className={`text-[10px] ml-auto hidden sm:block ${l?"text-slate-400":"text-slate-500"}`}>{P_LABEL[period]} · <span className={l?"text-amber-500":"text-amber-400"}>Market closed</span> · Data as of {lastFetch.toLocaleTimeString("en-IN",{hour:"2-digit",minute:"2-digit",hour12:true})}</span>;
            }
          })()}
        </div>
      )}
      <div className={`relative transition-opacity ${loading?"opacity-40":"opacity-100"}`} style={{ height:showControls?height-80:height }}>
        <div ref={containerRef} style={{ width:"100%", height:"100%" }}/>
        {!candles.length && !loading && (
          <div className={`absolute inset-0 flex flex-col items-center justify-center gap-3 text-sm ${l?"text-slate-400":"text-slate-400"}`}>
            <span>{error ? `⚠ ${error}` : "Fetching chart data…"}</span>
            <button
              onClick={() => fetchData(period)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-bold transition-all ${l?"bg-white border-slate-200 text-slate-600 hover:bg-slate-50":"bg-[#0c1a2e] border-[#1e3a5f]/50 text-slate-400 hover:border-[#1e3a5f]"}`}>
              <RefreshCw className="w-3 h-3"/> Retry
            </button>
          </div>
        )}
      </div>
    </div>
  );
}


// ══════════════════════════════════════════════════════════════════
// SEARCH — Search any NSE/BSE stock or index
// ══════════════════════════════════════════════════════════════════
function SearchResultCard({ item, onClose, rawTicks }: {
  item: typeof SEARCH_CATALOGUE[0];
  onClose: () => void;
  rawTicks: Record<string, KiteTick>;
}) {
  const l    = useIL();
  const ticks = useFastTicks(rawTicks);
  const key  = item.ex + ":" + item.sym;
  const tick = ticks[key] as KiteTick | undefined;
  const f    = useFlash(tick?.last_price);
  const p    = getPct(tick);
  const c    = getChg(tick);

  // Fetch live quote if no WebSocket tick
  const [quote, setQuote] = useState<any>(null);
  useEffect(() => {
    if (tick?.last_price) return;
    fetch(BASE + "/kite/quote?i=" + encodeURIComponent(key))
      .then(r => r.json())
      .then(j => { if (j.status === "success") setQuote(j.data?.[key]); })
      .catch(() => {});
  }, [key, !!tick?.last_price]);

  const livePrice = tick?.last_price ?? quote?.last_price ?? 0;
  const ohlc      = tick?.ohlc ?? quote?.ohlc ?? null;
  const pct       = tick ? p : (ohlc?.close && livePrice ? ((livePrice - ohlc.close) / ohlc.close) * 100 : null);
  const chg       = tick ? c : (ohlc?.close && livePrice ? livePrice - ohlc.close : null);
  const isPos     = (pct ?? 0) >= 0;

  return (
    <div className={`rounded-2xl border shadow-lg overflow-hidden mb-6 ${tx.card(l)}`}>
      {/* Header */}
      <div className={`flex items-start justify-between px-5 pt-4 pb-3 border-b ${l?"border-slate-100":"border-[#1e3a5f]/50"}`}>
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className={`text-[9px] font-black uppercase tracking-widest ${tx.t3(l)}`}>{item.sym} · {item.ex}</span>
            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${l?"bg-blue-50 text-blue-600 border-blue-200":"bg-[#5194F6]/12 text-[#5194F6] border-[#5194F6]/25"}`}>SEARCH RESULT</span>
          </div>
          <p className={`text-sm font-bold mb-2 ${tx.t2(l)}`}>{item.name}</p>
          {livePrice > 0 ? (
            <>
              <p className={`text-4xl font-black tabular-nums leading-none transition-colors duration-500 ${f==="up"?"text-emerald-500":f==="dn"?"text-red-500":tx.t1(l)}`}>
                ₹{fmt(livePrice)}
              </p>
              {chg != null && pct != null && (
                <div className={`flex items-center gap-2 mt-1.5`}>
                  {isPos ? <TrendingUp className="w-4 h-4 text-emerald-500"/> : <TrendingDown className="w-4 h-4 text-red-500"/>}
                  <span className={`text-sm font-bold tabular-nums ${isPos?"text-emerald-600":"text-red-500"}`}>
                    {chg >= 0 ? "+" : ""}{fmt(chg)}  ({pct >= 0 ? "+" : ""}{pct.toFixed(2)}%)
                  </span>
                </div>
              )}
            </>
          ) : (
            <><Skel h="h-10" w="w-48"/><div className="mt-2"><Skel h="h-5" w="w-36"/></div></>
          )}
        </div>
        <div className="flex flex-col items-end gap-2">
          {ohlc && (
            <div className="flex flex-col gap-1">
              <div className={`flex items-center gap-2 px-2.5 py-1 rounded-lg border text-xs ${l?"bg-emerald-50 border-emerald-100":"bg-emerald-500/10 border-emerald-500/20"}`}>
                <span className={tx.t3(l)}>H</span><span className="font-bold text-emerald-600 tabular-nums">₹{fmt(ohlc.high)}</span>
              </div>
              <div className={`flex items-center gap-2 px-2.5 py-1 rounded-lg border text-xs ${l?"bg-red-50 border-red-100":"bg-red-500/10 border-red-500/20"}`}>
                <span className={tx.t3(l)}>L</span><span className="font-bold text-red-600 tabular-nums">₹{fmt(ohlc.low)}</span>
              </div>
            </div>
          )}
          <button onClick={onClose}
            className={`p-1.5 rounded-lg border transition-colors ${l?"bg-white border-slate-200 hover:bg-slate-50":"bg-[#0c1a2e] border-[#1e3a5f]/50 hover:bg-[#0a1a2e]"}`}>
            <X className={`w-4 h-4 ${tx.t2(l)}`}/>
          </button>
        </div>
      </div>

      {/* Chart — same CandleChart as Major Indices */}
      <CandleChart key={item.token} token={item.token} height={320} liveTick={tick}/>

      {/* OHLCV row */}
      {ohlc && (
        <div className={`grid grid-cols-3 sm:grid-cols-6 border-t ${l?"border-slate-100":"border-[#1e3a5f]/50"}`}>
          {[
            { label:"Open",   val:ohlc.open,       cls:tx.t1(l) },
            { label:"High",   val:ohlc.high,       cls:"text-emerald-600" },
            { label:"Low",    val:ohlc.low,        cls:"text-red-500" },
            { label:"Close",  val:ohlc.close,      cls:tx.t1(l) },
            { label:"LTP",    val:livePrice,       cls:"text-blue-600" },
            { label:"Volume", raw:fmtV(tick?.volume ?? quote?.volume) },
          ].map((s, i) => (
            <div key={s.label} className={`text-center py-3 ${i>0?(l?"border-l border-slate-100":"border-l border-[#1e3a5f]/50"):""} ${l?"bg-slate-50":"bg-[#070e1a]"}`}>
              <p className={`text-[9px] font-black uppercase tracking-widest mb-1 ${tx.t3(l)}`}>{s.label}</p>
              <p className={`text-xs font-black tabular-nums ${s.cls ?? tx.t1(l)}`}>
                {s.raw ?? (s.val!=null && s.val > 0 ? "₹"+fmt(s.val) : "—")}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function SearchBar({ rawTicks, onResult }: {
  rawTicks: Record<string, KiteTick>;
  onResult: (item: typeof SEARCH_CATALOGUE[0] | null) => void;
}) {
  const l = useIL();
  const [query, setQuery]         = useState("");
  const [open,  setOpen]          = useState(false);
  const [searching, setSearching] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropRef  = useRef<HTMLDivElement>(null);

  // Filter from catalogue
  const suggestions = useMemo(() => {
    if (query.length < 1) return [];
    const q = query.toUpperCase();
    return SEARCH_CATALOGUE.filter(s =>
      s.sym.toUpperCase().includes(q) || s.name.toUpperCase().includes(q)
    ).slice(0, 8);
  }, [query]);

  // Close on outside click
  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (dropRef.current && !dropRef.current.contains(e.target as Node) &&
          inputRef.current && !inputRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const handleSelect = (item: typeof SEARCH_CATALOGUE[0]) => {
    setQuery(item.sym);
    setOpen(false);
    onResult(item);
  };

  // Try unknown symbol via API if not in catalogue
  const handleSearch = async () => {
    if (!query.trim()) { onResult(null); return; }
    const exactMatch = SEARCH_CATALOGUE.find(s => s.sym.toUpperCase() === query.toUpperCase().trim());
    if (exactMatch) { handleSelect(exactMatch); return; }
    // Try live quote for unknown symbol
    setSearching(true);
    try {
      const sym = query.toUpperCase().trim();
      const r   = await fetch(BASE + "/kite/quote?i=" + encodeURIComponent("NSE:" + sym));
      const j   = await r.json();
      if (j.status === "success" && j.data?.["NSE:" + sym]) {
        onResult({ sym, name: sym, token: j.data["NSE:" + sym].instrument_token ?? 0, ex: "NSE" });
        setOpen(false);
      } else {
        alert("Symbol not found: " + sym);
      }
    } catch { alert("Could not search. Check connection."); }
    finally { setSearching(false); }
  };

  return (
    <div className="relative flex-1 max-w-[160px] sm:max-w-xs" ref={dropRef as any}>
      <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border transition-all ${
        l ? "bg-slate-50 border-slate-200 focus-within:border-[#5194F6] focus-within:bg-white"
          : "bg-[#0c1a2e] border-[#1e3a5f]/50 focus-within:border-[#5194F6] focus-within:bg-[#0c1a2e]"
      }`}>
        <Search className={`w-3.5 h-3.5 shrink-0 ${tx.t3(l)}`}/>
        <input
          ref={inputRef}
          value={query}
          onChange={e => { setQuery(e.target.value); setOpen(true); }}
          onKeyDown={e => { if (e.key === "Enter") handleSearch(); if (e.key === "Escape") { setOpen(false); setQuery(""); onResult(null); } }}
          onFocus={() => query.length > 0 && setOpen(true)}
          placeholder="Search stocks, indices…"
          className={`flex-1 bg-transparent text-xs font-bold outline-none placeholder:font-normal w-full min-w-0 ${tx.t1(l)}`}
        />
        {searching && <RefreshCw className="w-3 h-3 animate-spin text-[#5194F6] shrink-0"/>}
        {query && !searching && (
          <button onClick={() => { setQuery(""); setOpen(false); onResult(null); }}>
            <X className={`w-3 h-3 ${tx.t3(l)}`}/>
          </button>
        )}
      </div>
      {/* Dropdown */}
      {open && suggestions.length > 0 && (
        <div className={`absolute top-full left-0 right-0 mt-1 rounded-xl border shadow-xl z-50 overflow-hidden ${l?"bg-white border-slate-200":"bg-[#0c1a2e] border-[#1e3a5f]/50"}`}>
          {suggestions.map(s => {
            const key  = s.ex + ":" + s.sym;
            const tick = rawTicks[key] as KiteTick | undefined;
            const pct  = getPct(tick);
            return (
              <button key={s.sym} onMouseDown={() => handleSelect(s)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 text-xs transition-colors ${l?"hover:bg-slate-50":"hover:bg-white/[0.04]"}`}>
                <div className="text-left">
                  <p className={`font-black ${tx.t1(l)}`}>{s.sym}</p>
                  <p className={`text-[10px] ${tx.t3(l)}`}>{s.name}</p>
                </div>
                <div className="text-right tabular-nums shrink-0 ml-3">
                  {tick?.last_price != null ? (
                    <>
                      <p className={`font-bold ${tx.t1(l)}`}>₹{fmt(tick.last_price)}</p>
                      {pct != null && <p className={`text-[10px] font-bold ${pct>=0?"text-emerald-500":"text-red-500"}`}>{pct>=0?"+":""}{pct.toFixed(2)}%</p>}
                    </>
                  ) : <span className={tx.t3(l)}>···</span>}
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
// OVERVIEW — 6 mini cards
// ══════════════════════════════════════════════════════════════════
function IdxCard({ idx, tick }: { idx:typeof INDICES[0]; tick?:KiteTick }) {
  const f = useFlash(tick?.last_price);
  const l = useIL();
  const p = getPct(tick);
  return (
    <Card className="px-3 py-3 hover:shadow-md transition-shadow cursor-default">
      <p className={`text-[9px] font-black uppercase tracking-widest mb-1 truncate ${tx.t3(l)}`}>{idx.name}</p>
      {tick?.last_price!=null ? (
        <>
          <p className={`text-sm font-black tabular-nums transition-colors duration-500 ${f==="up"?"text-emerald-500":f==="dn"?"text-red-500":tx.t1(l)}`}>{fmt(tick.last_price)}</p>
          <PctTag p={p} sm/>
        </>
      ) : <><Skel h="h-4" w="w-20"/><div className="mt-1"><Skel h="h-4" w="w-14"/></div></>}
    </Card>
  );
}

// ══════════════════════════════════════════════════════════════════
// MAJOR INDICES CHART SECTION
// ══════════════════════════════════════════════════════════════════
function IndicesSection({ ticks, connected }: any) {
  const l   = useIL();
  const [sel, setSel] = useState(0);
  const idx  = INDICES[sel];
  const tick = ticks[idx.key] as KiteTick|undefined;
  const p    = getPct(tick);
  const c    = getChg(tick);
  const f    = useFlash(tick?.last_price);

  return (
    <section className="mb-8">
      <SecHead id="indices" icon={BarChart3} title="Major Indices" sub="OHLCV Candlestick · Historical · Live" live={connected}/>
      {/* Index tabs */}
      <div className="flex gap-2 mb-4 overflow-x-auto pb-1 scrollbar-none -mx-1 px-1">
        {INDICES.map((m,i) => {
          const tk = ticks[m.key] as KiteTick|undefined;
          const pp = getPct(tk);
    
          return (
            <div key={m.key} className="relative shrink-0 group">
              <button onClick={() => setSel(i)}
                className={`flex flex-col items-start px-3 py-2 pr-7 rounded-lg text-xs font-bold transition-all border w-full ${
                  sel===i
                    ? "bg-[#5194F6] text-white border-transparent"
                    : l?"bg-white text-slate-600 border-slate-200 hover:border-[#5194F6]/40":"bg-[#0c1a2e] text-slate-400 border-[#1e3a5f]/50 hover:border-[#5194F6]/40"
                }`}>
                <span className="font-black text-[11px]">{m.name}</span>
                <span className={`text-[10px] tabular-nums mt-0.5 ${sel===i?"opacity-80":up(pp)?"text-emerald-500":"text-red-500"}`}>
                  {tk?.last_price!=null ? `${fmt(tk.last_price)}  ${pp!=null?(pp>=0?"+":"")+pp.toFixed(2)+"%":""}` : "···"}
                </span>
              </button>
             
            </div>
          );
        })}
      </div>

      <Card className="overflow-hidden">
        {/* Price header */}
        <div className={`flex items-start justify-between px-5 pt-4 pb-3 border-b ${l?"border-slate-100":"border-[#1e3a5f]/50"}`}>
          <div>
            <p className={`text-[10px] font-bold uppercase tracking-widest mb-1 ${tx.t3(l)}`}>{idx.sym} · {idx.ex}</p>
            {tick?.last_price!=null ? (
              <>
                <p className={`text-3xl sm:text-4xl font-black tabular-nums leading-none transition-colors duration-500 ${f==="up"?"text-emerald-500":f==="dn"?"text-red-500":tx.t1(l)}`}>{fmt(tick.last_price)}</p>
                {c!=null&&p!=null&&(
                  <div className="flex items-center gap-2 mt-1.5">
                    {up(c) ? <TrendingUp className="w-4 h-4 text-emerald-500"/> : <TrendingDown className="w-4 h-4 text-red-500"/>}
                    <span className={`text-sm font-bold tabular-nums ${up(c)?"text-emerald-600":"text-red-500"}`}>
                      {c>=0?"+":""}{fmt(c)}  ({p>=0?"+":""}{p.toFixed(2)}%)
                    </span>
                  </div>
                )}
              </>
            ) : <><Skel h="h-10" w="w-48"/><div className="mt-2"><Skel h="h-5" w="w-36"/></div></>}
          </div>
          {tick?.ohlc && (
            <div className="flex-col gap-1 shrink-0 hidden xs:flex sm:flex">
              <div className={`flex items-center gap-2 px-2.5 py-1 rounded-lg border text-xs ${l?"bg-emerald-50 border-emerald-100":"bg-emerald-500/10 border-emerald-500/20"}`}>
                <span className={tx.t3(l)}>H</span><span className="font-bold text-emerald-600 tabular-nums">₹{fmt(tick.ohlc.high)}</span>
              </div>
              <div className={`flex items-center gap-2 px-2.5 py-1 rounded-lg border text-xs ${l?"bg-red-50 border-red-100":"bg-red-500/10 border-red-500/20"}`}>
                <span className={tx.t3(l)}>L</span><span className="font-bold text-red-600 tabular-nums">₹{fmt(tick.ohlc.low)}</span>
              </div>
            </div>
          )}
        </div>

        {/* Chart — tick passed so last candle updates live */}
        <CandleChart key={idx.token} token={idx.token} height={typeof window !== "undefined" && window.innerWidth < 640 ? 240 : 340} liveTick={tick}/>

        {/* OHLCV row */}
        <div className={`grid grid-cols-3 sm:grid-cols-6 border-t ${l?"border-slate-100":"border-[#1e3a5f]/50"}`}>
          {[
            { label:"Open",   val:tick?.ohlc?.open,  cls:tx.t1(l) },
            { label:"High",   val:tick?.ohlc?.high,  cls:"text-emerald-600" },
            { label:"Low",    val:tick?.ohlc?.low,   cls:"text-red-500" },
            { label:"Close",  val:tick?.ohlc?.close, cls:tx.t1(l) },
            { label:"LTP",    val:tick?.last_price,  cls:"text-blue-600" },
            { label:"Volume", raw:fmtV(tick?.volume) },
          ].map((s,i) => (
            <div key={s.label} className={`text-center py-3 ${i>0?(l?"border-l border-slate-100":"border-l border-[#1e3a5f]/50"):""} ${l?"bg-slate-50":"bg-[#070e1a]"}`}>
              <p className={`text-[9px] font-black uppercase tracking-widest mb-1 ${tx.t3(l)}`}>{s.label}</p>
              <p className={`text-xs font-black tabular-nums ${s.cls ?? tx.t1(l)}`}>
                {s.raw ?? (s.val!=null?`₹${fmt(s.val)}`:"—")}
              </p>
            </div>
          ))}
        </div>
      </Card>
    </section>
  );
}

// ══════════════════════════════════════════════════════════════════
// TOP STOCKS
// ══════════════════════════════════════════════════════════════════
function StockRow({ s, tick, last, maxVol }: { s:typeof STOCKS[0]; tick?:KiteTick; last:boolean; maxVol:number }) {
  const f   = useFlash(tick?.last_price);
  const p   = getPct(tick);
  const l   = useIL();
  const vol = tick?.volume ?? null;
  const nseUrl = `https://www.nseindia.com/get-quotes/equity?symbol=${encodeURIComponent(s.sym)}`;
  return (
    <div
      onClick={() => window.open(nseUrl, "_blank")}
      className={`grid grid-cols-3 sm:grid-cols-10 items-center px-3 sm:px-5 cursor-pointer ${!last?(l?"border-b border-slate-100":"border-b border-[#1e3a5f]/30"):""} ${l?"hover:bg-slate-50/60":"hover:bg-white/[0.015]"}`}>
      <div className="col-span-1 sm:col-span-2 flex items-center gap-1.5 sm:gap-2 py-1.5 sm:py-3">
        <div className={`w-6 h-6 sm:w-7 sm:h-7 rounded-md flex items-center justify-center text-[9px] font-black shrink-0 ${tx.pill(l,up(p))}`}>{s.sym.slice(0,2)}</div>
        <div className="min-w-0">
          <p className={`font-bold text-[11px] sm:text-xs truncate ${tx.t1(l)}`}>{s.sym}</p>
          <p className={`text-[10px] truncate hidden sm:block ${tx.t3(l)}`}>{s.name}</p>
        </div>
      </div>
      <div className={`text-right text-xs sm:text-sm font-black tabular-nums transition-colors duration-500 ${f==="up"?"text-emerald-500":f==="dn"?"text-red-500":tx.t1(l)}`}>
        {tick?.last_price!=null ? `₹${fmt(tick.last_price)}` : <Skel h="h-4" w="w-16"/>}
      </div>
      <div className={`text-right text-xs tabular-nums hidden sm:block ${tx.t2(l)}`}>{tick?.ohlc?.open!=null?`₹${fmt(tick.ohlc.open)}`:"—"}</div>
      <div className="text-right text-xs tabular-nums text-emerald-600 font-semibold hidden sm:block">{tick?.ohlc?.high!=null?`₹${fmt(tick.ohlc.high)}`:"—"}</div>
      <div className="text-right text-xs tabular-nums text-red-500 font-semibold hidden sm:block">{tick?.ohlc?.low!=null?`₹${fmt(tick.ohlc.low)}`:"—"}</div>
      <div className={`text-right text-xs tabular-nums hidden md:block ${tx.t2(l)}`}>{tick?.ohlc?.close!=null?`₹${fmt(tick.ohlc.close)}`:"—"}</div>
      <div className="text-right py-1.5 sm:py-3 hidden sm:block">
        <p className={`text-xs tabular-nums ${vol != null && vol > 0 ? tx.t2(l) : tx.t3(l)}`}>
          {vol != null ? fmtV(vol) : "—"}
        </p>
        {vol != null && (
          <div className={`mt-1 h-1 rounded-full overflow-hidden ${l?"bg-slate-100":"bg-[#1e3a5f]"}`}>
            <div className="h-full bg-blue-400/60 rounded-full transition-all duration-700" style={{ width:maxVol>0&&vol>0?`${(vol/maxVol)*100}%`:"2%" }}/>
          </div>
        )}
      </div>
      <div className="text-right py-1.5 sm:py-3"><PctTag p={p} sm/></div>
      {/* NSE link icon */}
      <div className="hidden sm:flex justify-end py-1.5 sm:py-3">
        <a href={nseUrl} target="_blank" rel="noopener noreferrer"
          onClick={e => e.stopPropagation()}
          title={`View ${s.sym} on NSE`}
          className={`inline-flex items-center justify-center w-5 h-5 rounded opacity-30 hover:opacity-100 transition-opacity text-[#5194F6]`}>
          <ExternalLink className="w-3 h-3"/>
        </a>
      </div>
    </div>
  );
}

function StocksSection({ ticks }: { ticks:any }) {
  const l      = useIL();
  const maxVol = useMemo(() => Math.max(...STOCKS.map(s => ticks[s.key]?.volume??0), 1), [ticks]);
  return (
    <section className="mb-8">
      <SecHead id="stocks" icon={LineChart} title="Top Stocks" sub="Live OHLCV · Volume Bars" live/>
      <Card className="overflow-hidden">
        <div className={`grid grid-cols-3 sm:grid-cols-10 px-3 sm:px-5 py-2.5 text-[9px] font-black uppercase tracking-widest ${tx.header(l)} ${tx.t3(l)}`}>
          <div className="col-span-1 sm:col-span-2">Symbol</div>
          <div className="text-right">LTP</div>
          <div className="text-right hidden sm:block">Open</div>
          <div className="text-right text-emerald-600 hidden sm:block">High</div>
          <div className="text-right text-red-500 hidden sm:block">Low</div>
          <div className="text-right hidden md:block">Prev Close</div>
          <div className="text-right hidden sm:block">Volume</div>
          <div className="text-right">Chg%</div>
          <div className="hidden sm:block"></div>
        </div>
        {STOCKS.map((s,i) => <StockRow key={s.key} s={s} tick={ticks[s.key]} last={i===STOCKS.length-1} maxVol={maxVol}/>)}
      </Card>
    </section>
  );
}

// ══════════════════════════════════════════════════════════════════
// MARKET DEPTH
// ══════════════════════════════════════════════════════════════════
function DepthCard({ sym, ticks }: { sym:string; ticks:any }) {
  const l    = useIL();
  const tick = ticks[sym] as KiteTick|undefined;
  const name = sym.split(":")[1];
  return (
    <Card className="overflow-hidden">
      <div className={`px-4 py-3 border-b ${l?"border-slate-100":"border-[#1e3a5f]/50"}`}>
        <div className="flex items-center justify-between mb-1">
          <span className={`font-black text-sm ${tx.t1(l)}`}>{name}</span>
          <PctTag p={getPct(tick)} sm/>
        </div>
        <FlashPrice val={tick?.last_price} cls="text-lg font-black tabular-nums"/>
        {tick?.depth && (
          <div className="flex gap-4 mt-1">
            <span className="text-[10px] text-emerald-600 font-bold">Buy: {fmtV(tick.buy_quantity)}</span>
            <span className="text-[10px] text-red-500 font-bold">Sell: {fmtV(tick.sell_quantity)}</span>
          </div>
        )}
      </div>
      {tick?.depth ? (
        <>
          <div className={`grid grid-cols-3 px-3 py-1.5 text-[9px] font-black uppercase tracking-widest ${tx.header(l)} ${tx.t3(l)}`}>
            <span>Bid Qty</span><span className="text-center">Price</span><span className="text-right">Ask Qty</span>
          </div>
          {Array.from({length:5}).map((_,i) => {
            const b = tick.depth!.buy[i];
            const a = tick.depth!.sell[i];
            const mx = Math.max(...tick.depth!.buy.map(x=>x.quantity),...tick.depth!.sell.map(x=>x.quantity),1);
            return (
              <div key={i} className={`grid grid-cols-3 px-3 py-1.5 text-xs relative ${i<4?(l?"border-b border-slate-100":"border-b border-[#1e3a5f]/30"):""} ${l?"hover:bg-slate-50/60":"hover:bg-white/[0.015]"}`}>
                <div className="absolute inset-y-0 left-0 bg-emerald-500/6" style={{ width:`${(b?b.quantity/mx:0)*33}%` }}/>
                <div className="absolute inset-y-0 right-0 bg-red-500/6"    style={{ width:`${(a?a.quantity/mx:0)*33}%` }}/>
                <span className="text-emerald-600 font-bold tabular-nums z-10 relative">{b?b.quantity.toLocaleString("en-IN"):"—"}</span>
                <span className={`text-center font-mono z-10 relative ${tx.t1(l)}`}>{b?`₹${fmt(b.price)}`:a?`₹${fmt(a.price)}`:"—"}</span>
                <span className="text-right text-red-500 font-bold tabular-nums z-10 relative">{a?a.quantity.toLocaleString("en-IN"):"—"}</span>
              </div>
            );
          })}
        </>
      ) : (
        <div className="p-4 space-y-2">
          {[...Array(5)].map((_,i) => <Skel key={i} h="h-7"/>)}
          <p className={`text-center text-xs mt-2 ${tx.t3(l)}`}>{tick?"Full mode data loading…":"Waiting for WebSocket…"}</p>
        </div>
      )}
    </Card>
  );
}

function DepthSection({ ticks }: { ticks:any }) {
  const l = useIL();
  const DEFAULT_SYMS = ["NSE:RELIANCE","NSE:TCS","NSE:HDFCBANK"];
  const [selected, setSelected] = useState<string[]>(DEFAULT_SYMS);
  const [searchVal, setSearchVal] = useState("");

  const allStockKeys = STOCKS.map(s => s.key);
  const filtered = searchVal.length > 0
    ? allStockKeys.filter(k => k.toLowerCase().includes(searchVal.toLowerCase()))
    : allStockKeys;

  const handleAdd = (sym: string) => {
    if (!selected.includes(sym)) {
      setSelected(prev => [...prev.slice(-2), sym]); // keep max 3
    }
    setSearchVal("");
  };

  return (
    <section className="mb-8">
      <SecHead id="depth" icon={ArrowUpDown} title="Market Depth" sub="Level 2 Order Book · 5 Best Bids & Asks" live/>
      {/* Search/Select for stocks */}
      <div className={`flex items-center gap-2 mb-3 p-3 rounded-xl border ${tx.card(l)}`}>
        <Search className={`w-3.5 h-3.5 shrink-0 ${tx.t3(l)}`}/>
        <input
          value={searchVal}
          onChange={e => setSearchVal(e.target.value)}
          placeholder="Search stock to view depth (e.g. INFY, WIPRO)…"
          className={`flex-1 bg-transparent text-xs font-bold outline-none placeholder:font-normal ${tx.t1(l)}`}
        />
        {searchVal && (
          <button onClick={() => setSearchVal("")}><X className={`w-3.5 h-3.5 ${tx.t3(l)}`}/></button>
        )}
      </div>
      {/* Dropdown suggestions */}
      {searchVal.length > 0 && filtered.length > 0 && (
        <div className={`mb-3 rounded-xl border overflow-hidden ${l?"bg-white border-slate-200":"bg-[#0c1a2e] border-[#1e3a5f]/50"}`}>
          {filtered.slice(0,6).map(sym => (
            <button key={sym} onClick={() => handleAdd(sym)}
              className={`w-full text-left px-4 py-2.5 text-xs font-bold transition-colors ${l?"hover:bg-slate-50":"hover:bg-white/[0.04]"} ${tx.t1(l)}`}>
              {sym.split(":")[1]}
            </button>
          ))}
        </div>
      )}
      {/* Selected chips */}
      <div className="flex gap-2 mb-3 flex-wrap">
        {selected.map(sym => (
          <div key={sym} className={`flex items-center gap-1.5 px-3 py-1 rounded-lg border text-xs font-bold ${l?"bg-blue-50 border-blue-200 text-blue-700":"bg-blue-900/20 border-[#5194F6]/25 text-blue-400"}`}>
            {sym.split(":")[1]}
            <button onClick={() => setSelected(prev => prev.filter(s => s !== sym))}><X className="w-3 h-3"/></button>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {selected.map(s => <DepthCard key={s} sym={s} ticks={ticks}/>)}
      </div>
    </section>
  );
}

// ══════════════════════════════════════════════════════════════════
// F&O INSTRUMENTS + OPTIONS CHAIN
// ══════════════════════════════════════════════════════════════════
function OptionsSection({ ticks }: { ticks:any }) {
  const l    = useIL();
  const spot = ticks["NSE:NIFTY 50"]?.last_price as number|undefined;
  const ATM  = spot ? Math.round(spot/100)*100 : null;

  // F&O instruments from backend
  const [foName,   setFoName]   = useState("NIFTY");
  const [foExpiry, setFoExpiry] = useState("");

  const { data: foData, loading: foLoad, error: foErr, meta: foMeta, refresh: foRefresh } = useAPI<any>(
    `/kite/fo/instruments?name=${foName}${foExpiry ? `&expiry=${foExpiry}` : ""}`,
    [foName, foExpiry]
  );

  const foItems:    any[]   = Array.isArray(foData) ? foData : [];
  const foExpiries: string[] = foMeta?.meta?.expiries ?? [];
  const curExpiry:  string   = foMeta?.meta?.current_expiry ?? "";

  // Options chain strikes
  const strikes = useMemo(() => {
    const calls = foItems.filter(i => i.instrument_type === "CE");
    const puts  = foItems.filter(i => i.instrument_type === "PE");
    const allStrikes = [...new Set([
      ...calls.map(c => Number(c.strike)),
      ...puts.map(p => Number(p.strike)),
    ])].sort((a,b) => a-b);
    if (ATM) {
      const nearest = allStrikes.reduce((a, b) => Math.abs(b-ATM) < Math.abs(a-ATM) ? b : a, allStrikes[0] || ATM);
      const idx     = allStrikes.indexOf(nearest);
      return allStrikes.slice(Math.max(0, idx-10), idx+11);
    }
    return allStrikes.slice(0, 30);
  }, [foItems, ATM, foName]);

  // Futures list
  const futures = useMemo(() => foItems.filter(i => i.instrument_type === "FUT"), [foItems]);

  // Live quotes
  const [liveQuotes, setLiveQuotes] = useState<Record<string,any>>({});
  const [quotesLoading, setQuotesLoading] = useState(false);

  useEffect(() => {
    if (strikes.length === 0 || foItems.length === 0) return;
    const symbols: string[] = [];
    strikes.forEach(strike => {
      const ce = foItems.find((x:any) => x.instrument_type==="CE" && Number(x.strike)===strike);
      const pe = foItems.find((x:any) => x.instrument_type==="PE" && Number(x.strike)===strike);
      if (ce?.tradingsymbol) symbols.push("NFO:" + ce.tradingsymbol);
      if (pe?.tradingsymbol) symbols.push("NFO:" + pe.tradingsymbol);
    });
    futures.slice(0,5).forEach((f:any) => { symbols.push("NFO:" + f.tradingsymbol); });
    if (symbols.length === 0) return;
    setQuotesLoading(true);
    const qs = symbols.map(s => "i=" + encodeURIComponent(s)).join("&");
    fetch(BASE + "/kite/quote?" + qs)
      .then(r => r.json())
      .then(j => { if (j.status === "success" && j.data) setLiveQuotes(j.data); })
      .catch(() => {})
      .finally(() => setQuotesLoading(false));
  }, [strikes.join(","), foItems.length]);

  const FO_NAMES = ["NIFTY","BANKNIFTY","FINNIFTY","MIDCPNIFTY"];
  return (
    <section className="mb-8">
      <SecHead id="options" icon={Layers} title="F&O Instruments" sub={`Options Chain & Futures · Kite Connect \`/instruments/NFO\``}/>

      {/* Controls Row 1 — Index name + Expiry + Refresh */}
      <div className="flex items-center gap-2 mb-2 overflow-x-auto scrollbar-none pb-1 flex-nowrap">
        {FO_NAMES.map(n => (
          <button key={n} onClick={() => { setFoName(n); setFoExpiry(""); }}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all shrink-0 ${
              foName===n ? "bg-[#5194F6] text-white border-transparent"
                : l?"bg-white text-slate-600 border-slate-200":"bg-[#0c1a2e] text-slate-400 border-[#1e3a5f]/50"
            }`}>{n}</button>
        ))}
        <div className={`w-px h-5 shrink-0 ${l?"bg-slate-200":"bg-[#1e3a5f]"}`}/>
        {foExpiries.length > 0 && (
          <select value={foExpiry || curExpiry} onChange={e => setFoExpiry(e.target.value)}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-bold border shrink-0 ${l?"bg-white text-slate-600 border-slate-200":"bg-[#0c1a2e] text-slate-400 border-[#1e3a5f]/50"}`}>
            {foExpiries.map(e => <option key={e} value={e}>{e}</option>)}
          </select>
        )}
        <div className={`w-px h-5 shrink-0 ${l?"bg-slate-200":"bg-[#1e3a5f]"}`}/>
        <button onClick={foRefresh}
          className={`px-2.5 py-1.5 rounded-lg border flex items-center shrink-0 ${l?"bg-white text-slate-600 border-slate-200":"bg-[#0c1a2e] text-slate-400 border-[#1e3a5f]/50"}`}>
          <RefreshCw className={`w-3.5 h-3.5 ${foLoad?"animate-spin":""}`}/>
        </button>
      </div>

      {foErr && (
        <div className={`mb-3 px-4 py-3 rounded-xl border flex items-center gap-2 text-xs ${l?"bg-red-50 border-red-200 text-red-600":"bg-red-500/10 border-red-500/20 text-red-400"}`}>
          <AlertCircle className="w-3.5 h-3.5 shrink-0"/>{foErr}
        </div>
      )}

      {foLoad ? (
        <Card className="p-4 space-y-2">{[...Array(6)].map((_,i) => <Skel key={i} h="h-9"/>)}</Card>
      ) : (
        /* ── OPTIONS CHAIN ── */
        <Card className="overflow-x-auto">
          <div className="min-w-[520px]">
            <div className={`flex items-center justify-between px-5 py-3 border-b ${l?"bg-blue-50 border-blue-100":"bg-blue-900/10 border-blue-800/20"}`}>
              <div className="flex items-center gap-3">
                {spot && <span className={`text-xs font-bold ${l?"text-blue-700":"text-blue-300"}`}>Spot ₹{fmt(spot)}</span>}
                {ATM  && <span className={`text-xs font-bold px-2 py-0.5 rounded ${l?"bg-blue-100 text-blue-700":"bg-[#5194F6]/20 text-[#5194F6]"}`}>ATM {ATM}</span>}
                <span className={`text-[10px] ${tx.t3(l)}`}>{foName} · {foExpiry || curExpiry}</span>
              </div>
              <span className={`text-[10px] hidden sm:block ${tx.t3(l)}`}>{foItems.length} instruments loaded</span>
            </div>
            <div className={`grid grid-cols-7 px-5 py-2.5 text-[9px] font-black uppercase tracking-widest ${tx.header(l)} ${tx.t3(l)}`}>
              <div className="text-emerald-600">Call OI</div>
              <div className="text-right text-emerald-600">Call Vol</div>
              <div className="text-right text-emerald-600">Call LTP</div>
              <div className="text-center">Strike</div>
              <div className="text-red-500">Put LTP</div>
              <div className="text-right text-red-500">Put Vol</div>
              <div className="text-right text-red-500">Put OI</div>
            </div>
            {quotesLoading && (
              <div className={`px-5 py-2 text-[10px] font-bold flex items-center gap-2 ${l?"text-blue-600":"text-blue-400"}`}>
                <RefreshCw className="w-3 h-3 animate-spin"/> Fetching live quotes...
              </div>
            )}
            {strikes.length === 0 ? (
              <div className={`p-8 text-center text-sm ${tx.t2(l)}`}>
                <Layers className="w-10 h-10 mx-auto mb-3 opacity-20"/>
                No instruments loaded — select expiry above
              </div>
            ) : strikes.map((strike,i) => {
              const isATM = strike === ATM;
              const cInst = foItems.find((x:any) => x.instrument_type==="CE" && Number(x.strike)===strike);
              const pInst = foItems.find((x:any) => x.instrument_type==="PE" && Number(x.strike)===strike);
              const cKey  = cInst ? "NFO:" + cInst.tradingsymbol : null;
              const pKey  = pInst ? "NFO:" + pInst.tradingsymbol : null;
              const cWS   = cKey ? ticks[cKey]      : undefined;
              const pWS   = pKey ? ticks[pKey]      : undefined;
              const cQ    = cKey ? liveQuotes[cKey] : undefined;
              const pQ    = pKey ? liveQuotes[pKey] : undefined;
              const cLTP  = cWS?.last_price || cQ?.last_price || 0;
              const pLTP  = pWS?.last_price || pQ?.last_price || 0;
              const cOI   = cWS?.oi         || cQ?.oi         || 0;
              const pOI   = pWS?.oi         || pQ?.oi         || 0;
              const cVol  = cWS?.volume     || cQ?.volume     || 0;
              const pVol  = pWS?.volume     || pQ?.volume     || 0;
              return (
                <div key={strike} className={`grid grid-cols-7 px-5 py-2 text-xs items-center
                  ${isATM ? (l?"bg-amber-50":"bg-amber-900/10") : ""}
                  ${i < strikes.length-1 ? (l?"border-b border-slate-100":"border-b border-[#1e3a5f]/30") : ""}
                  ${l?"hover:bg-slate-50/60":"hover:bg-white/[0.015]"}`}>
                  <span className="text-emerald-700 font-bold">{cOI > 0 ? fmtV(cOI) : <span className={`text-[10px] ${tx.t3(l)}`}>—</span>}</span>
                  <span className={`text-right ${tx.t2(l)}`}>{cVol > 0 ? fmtV(cVol) : "—"}</span>
                  <span className="text-right text-emerald-600 font-bold">
                    {cLTP > 0 ? "₹" + fmt(cLTP) : <span className={`text-[10px] ${tx.t3(l)}`}>₹0.00</span>}
                  </span>
                  <div className={`text-center font-black text-sm ${isATM?"text-amber-600":tx.t1(l)}`}>
                    {isATM && <span className="mr-1 text-[9px] bg-amber-400 text-white rounded px-1">ATM</span>}
                    {strike}
                  </div>
                  <span className="text-red-600 font-bold">
                    {pLTP > 0 ? "₹" + fmt(pLTP) : <span className={`text-[10px] ${tx.t3(l)}`}>₹0.00</span>}
                  </span>
                  <span className={`text-right ${tx.t2(l)}`}>{pVol > 0 ? fmtV(pVol) : "—"}</span>
                  <span className="text-right text-red-700 font-bold">{pOI > 0 ? fmtV(pOI) : <span className={`text-[10px] ${tx.t3(l)}`}>—</span>}</span>
                </div>
              );
            })}
          </div>
        </Card>

      )}
    </section>
  );
}

// ══════════════════════════════════════════════════════════════════
// HISTORICAL DATA — Candlestick chart + table toggle
// ══════════════════════════════════════════════════════════════════
function HistoricalSection() {
  const l = useIL();
  const SYMS = [
    { label:"Nifty 50",    token:256265  },
    { label:"Sensex",      token:265     },
    { label:"Bank Nifty",  token:260105  },
   
    { label:"Nifty Auto",  token:258049  },
    { label:"Nifty Pharma",token:259849  },
    { label:"Nifty Metal", token:259337  },
    { label:"Nifty Energy",token:258409  },
    { label:"Nifty FMCG",  token:258537  },
    { label:"Nifty Realty",token:260361  },
    { label:"Reliance",    token:738561  },
    { label:"TCS",         token:2953217 },
    { label:"HDFC Bank",   token:341249  },
    { label:"Infosys",     token:408065  },
    { label:"ICICI Bank",  token:1270529 },
    { label:"Wipro",       token:969473  },
    { label:"HUL",         token:356865  },
    { label:"ITC",         token:424961  },
  ];
  const IVLS = [
    { label:"5m",  val:"5minute"  },
    { label:"15m", val:"15minute" },
    { label:"1h",  val:"60minute" },
    { label:"1d",  val:"day"      },
  ];

  const [sym, setSym] = useState(SYMS[0]);
  const [ivl, setIvl] = useState("day");

  const { data, loading, error, refresh } = useAPI<any>(
    `/kite/historical?token=${sym.token}&interval=${ivl}`,
    [sym.token, ivl]
  );

  const candles: Candle[] = useMemo(() => data?.candles ?? [], [data]);
  const rows    = useMemo(() => [...candles].reverse().slice(0,30), [candles]);

  return (
    <section className="mb-8">
      <SecHead id="historical" icon={BookOpen} title="Historical Data" sub="OHLCV · Table · All Stocks & Indices"/>

      {/* Row 1: symbol buttons — full scrollable row */}
      <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pb-1 mb-2 flex-nowrap">
        {SYMS.map(s => (
          <button key={s.token} onClick={() => setSym(s)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all shrink-0 ${
              sym.token===s.token
                ? "bg-[#5194F6] text-white border-transparent"
                : l?"bg-white text-slate-600 border-slate-200":"bg-[#0c1a2e] text-slate-400 border-[#1e3a5f]/50"
            }`}>{s.label}</button>
        ))}
      </div>

      {/* Row 2: interval + refresh — no chart toggle */}
      <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pb-1 mb-3 flex-nowrap">
        {IVLS.map(iv => (
          <button key={iv.val} onClick={() => setIvl(iv.val)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all shrink-0 ${
              ivl===iv.val
                ? "bg-[#d97706] text-white border-transparent"
                : l?"bg-white text-slate-600 border-slate-200":"bg-[#0c1a2e] text-slate-400 border-[#1e3a5f]/50"
            }`}>{iv.label}</button>
        ))}
        <button onClick={refresh} className={`px-2.5 py-1.5 rounded-lg border flex items-center shrink-0 ${l?"bg-white text-slate-600 border-slate-200":"bg-[#0c1a2e] text-slate-400 border-[#1e3a5f]/50"}`}>
          <RefreshCw className={`w-3.5 h-3.5 ${loading?"animate-spin":""}`}/>
        </button>
      </div>

      {error && (
        <div className={`px-4 py-3 rounded-xl border mb-3 flex items-center gap-2 text-xs ${l?"bg-red-50 border-red-200 text-red-600":"bg-red-500/10 border-red-500/20 text-red-400"}`}>
          <AlertCircle className="w-3.5 h-3.5 shrink-0"/>{error}
        </div>
      )}

      <Card className="overflow-hidden">
        <div className={`grid grid-cols-6 px-5 py-2.5 text-[9px] font-black uppercase tracking-widest ${tx.header(l)} ${tx.t3(l)}`}>
          <div>Date</div><div className="text-right">Open</div><div className="text-right text-emerald-600">High</div>
          <div className="text-right text-red-500">Low</div><div className="text-right">Close</div><div className="text-right">Volume</div>
        </div>
        {loading
          ? <div className="p-4 space-y-2">{[...Array(8)].map((_,i) => <Skel key={i} h="h-9"/>)}</div>
          : rows.length===0
            ? <div className={`p-8 text-center text-sm ${tx.t2(l)}`}>No data available</div>
            : rows.map((c,i) => {
                const o=c.y?.[0], h=c.y?.[1], lo=c.y?.[2], cl=c.y?.[3];
                const isu=(cl??0)>=(o??0);
                return (
                  <div key={i} className={`grid grid-cols-6 px-5 py-2.5 items-center ${i<rows.length-1?(l?"border-b border-slate-100":"border-b border-[#1e3a5f]/30"):""} ${l?"hover:bg-slate-50/60":"hover:bg-white/[0.015]"}`}>
                    <div className={`text-xs font-semibold flex items-center gap-1.5 ${tx.t2(l)}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${isu?"bg-emerald-500":"bg-red-500"}`}/>
                      {c.x ? new Date(c.x).toLocaleDateString("en-IN",{day:"numeric",month:"short"}) : "—"}
                    </div>
                    <div className={`text-right text-xs tabular-nums ${tx.t1(l)}`}>₹{fmt(o)}</div>
                    <div className="text-right text-xs tabular-nums text-emerald-600 font-semibold">₹{fmt(h)}</div>
                    <div className="text-right text-xs tabular-nums text-red-500 font-semibold">₹{fmt(lo)}</div>
                    <div className={`text-right text-xs tabular-nums font-bold ${isu?"text-emerald-600":"text-red-500"}`}>₹{fmt(cl)}</div>
                    <div className={`text-right text-xs tabular-nums ${tx.t3(l)}`}>{fmtV(c.volume)}</div>
                  </div>
                );
              })
        }
      </Card>
    </section>
  );
}

// ══════════════════════════════════════════════════════════════════
// CORPORATE ACTIONS — Real NSE data via backend proxy
// ══════════════════════════════════════════════════════════════════
const CORP_TYPES = ["All","Dividend","Bonus","Split","Buyback","Rights"] as const;
type CorpType = typeof CORP_TYPES[number];

function CorporateSection() {
  const l = useIL();
  const [filter, setFilter] = useState<CorpType>("All");
  const [expanded, setExpanded] = useState<number|null>(null);

  const { data, loading, error, meta, refresh } = useAPI<any[]>("/kite/nse/corporate-actions", []);
  const source: string = meta?.source ?? "";

  const actions: any[] = Array.isArray(data) ? data : [];

  const filtered = useMemo(() => {
    if (filter === "All") return actions;
    return actions.filter(a => {
      const s = (a.subject || a.purpose || "").toLowerCase();
      return s.includes(filter.toLowerCase());
    });
  }, [actions, filter]);

  const typeColor = (subject: string) => {
    const s = (subject || "").toLowerCase();
    if (s.includes("dividend")) return l ? "bg-emerald-50 text-emerald-700" : "bg-emerald-500/15 text-emerald-400";
    if (s.includes("bonus"))    return l ? "bg-blue-50 text-blue-700"       : "bg-[#5194F6]/12 text-[#5194F6]";
    if (s.includes("split"))    return l ? "bg-amber-50 text-amber-700"     : "bg-amber-900/20 text-amber-400";
    if (s.includes("buyback"))  return l ? "bg-purple-50 text-purple-700"   : "bg-purple-500/15 text-purple-400";
    return l ? "bg-slate-50 text-slate-600" : "bg-gray-800/30 text-slate-400";
  };

  return (
    <section className="mb-8">
      <SecHead id="corporate" icon={Building2} title="Corporate Actions"
        sub={source ? `${source} · Dividend · Bonus · Split · Buyback` : "NSE/BSE · Dividend · Bonus · Split · Buyback"}/>

      {/* Filter tabs */}
      <div className="flex flex-wrap gap-2 mb-3 items-center">
        {CORP_TYPES.map(t => (
          <button key={t} onClick={() => setFilter(t)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
              filter === t
                ? "bg-[#5194F6] text-white border-transparent"
                : l ? "bg-white text-slate-600 border-slate-200" : "bg-[#0c1a2e] text-slate-400 border-[#1e3a5f]/50"
            }`}>{t}</button>
        ))}
        {source && (
          <span className={`text-[10px] font-black px-2 py-0.5 rounded border ${
            source === "NSE"
              ? l?"bg-blue-50 text-blue-700 border-blue-200":"bg-[#5194F6]/10 text-[#5194F6] border-[#5194F6]/25"
              : l?"bg-orange-50 text-orange-700 border-orange-200":"bg-orange-900/15 text-orange-400 border-orange-800/30"
          }`}>via {source}</span>
        )}
        <button onClick={refresh}
          className={`px-2.5 py-1.5 rounded-lg border flex items-center ml-auto transition-all ${l?"bg-white text-slate-600 border-slate-200":"bg-[#0c1a2e] text-slate-400 border-[#1e3a5f]/50"}`}>
          <RefreshCw className={`w-3.5 h-3.5 ${loading?"animate-spin":""}`}/>
        </button>
      </div>

      {error && (
        <div className={`mb-3 px-4 py-3 rounded-xl border flex items-start gap-2 text-xs ${l?"bg-amber-50 border-amber-200 text-amber-700":"bg-amber-500/10 border-amber-500/20 text-amber-400"}`}>
          <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5"/>
          <div>
            <p className="font-bold">NSE &amp; BSE blocked the request ({error})</p>
            <p className="mt-0.5 opacity-80">Both exchanges use Akamai bot protection. Click retry — it may work after a fresh session. Or visit directly:</p>
            <div className="flex gap-2 mt-2">
              {[["NSE","https://www.nseindia.com/companies-listing/corporate-filings-actions"],
                ["BSE","https://www.bseindia.com/corporates/corporate_act.html"]].map(([nm,url]) => (
                <a key={nm} href={url} target="_blank" rel="noreferrer"
                  className={`inline-flex items-center gap-1 font-bold px-2 py-1 rounded border ${l?"bg-blue-50 text-blue-700 border-blue-200":"bg-[#5194F6]/12 text-[#5194F6] border-[#5194F6]/25"}`}>
                  <ExternalLink className="w-3 h-3"/>{nm}
                </a>
              ))}
              <button onClick={refresh} className={`inline-flex items-center gap-1 font-bold px-2 py-1 rounded border ${l?"bg-white text-gray-700 border-slate-200":"bg-[#0c1a2e] text-white border-[#1e3a5f]/50"}`}>
                <RefreshCw className={`w-3 h-3 ${loading?"animate-spin":""}`}/>Retry
              </button>
            </div>
          </div>
        </div>
      )}

      <Card className="overflow-x-auto">
        <div className={`grid grid-cols-5 px-4 sm:px-5 py-2 text-[9px] font-black uppercase tracking-widest ${tx.header(l)} ${tx.t3(l)}`}>
          <div className="col-span-2">Symbol / Company</div>
          <div>Action</div>
          <div className="text-right">Ex-Date</div>
          <div className="text-right">Record Date</div>
        </div>
        <div className="overflow-y-auto" style={{maxHeight:"400px"}}>
        {loading ? (
          <div className="p-4 space-y-2">{[...Array(6)].map((_,i) => <Skel key={i} h="h-10"/>)}</div>
        ) : filtered.length === 0 ? (
          <div className={`p-10 text-center ${tx.t2(l)}`}>
            <Building2 className="w-10 h-10 mx-auto mb-3 opacity-20"/>
            <p className="text-sm font-bold">No corporate actions found</p>
            <p className="text-xs mt-1">
              {error ? "Unable to fetch data from NSE" : "No events match the selected filter"}
            </p>
            <div className="flex justify-center gap-3 mt-5 flex-wrap">
              {[["NSE","https://www.nseindia.com/companies-listing/corporate-filings-actions"],
                ["BSE","https://www.bseindia.com/corporates/corporate_act.html"]].map(([nm,url]) => (
                <a key={nm} href={url} target="_blank" rel="noreferrer"
                  className={`inline-flex items-center gap-1.5 text-xs font-bold px-4 py-2 rounded-lg border transition-colors ${l?"bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100":"bg-[#5194F6]/10 text-[#5194F6] border-[#5194F6]/25 hover:bg-[#5194F6]/20"}`}>
                  <ExternalLink className="w-3 h-3"/>{nm} Corporate Actions
                </a>
              ))}
            </div>
          </div>
        ) : (
          filtered.map((a: any, i: number) => (
            <div key={i}>
              <div
                onClick={() => setExpanded(expanded === i ? null : i)}
                className={`grid grid-cols-5 px-4 sm:px-5 py-2 items-center cursor-pointer
                  ${i < filtered.length-1 ? (l?"border-b border-slate-100":"border-b border-[#1e3a5f]/30") : ""}
                  ${l?"hover:bg-slate-50/60":"hover:bg-white/[0.015]"}`}>
                <div className="col-span-2">
                  <p className={`font-bold text-xs ${tx.t1(l)}`}>{a.symbol ?? a.comp ?? "—"}</p>
                  <p className={`text-[10px] truncate ${tx.t3(l)}`}>{a.series ? `Series: ${a.series}` : a.companyName ?? ""}</p>
                </div>
                <div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${typeColor(a.subject ?? a.purpose ?? "")}`}>
                    {(a.subject ?? a.purpose ?? "—").split("-")[0].trim().slice(0,22)}
                  </span>
                  {a.remarks && <p className={`text-[9px] mt-0.5 truncate max-w-[140px] ${tx.t3(l)}`}>{a.remarks}</p>}
                </div>
                <div className={`text-right text-xs tabular-nums font-semibold ${tx.t1(l)}`}>{a.exDate ?? a.exDividendDate ?? "—"}</div>
                <div className={`text-right text-xs tabular-nums flex items-center justify-end gap-1 ${tx.t2(l)}`}>
                  {a.recordDate ?? "—"}
                  {expanded === i
                    ? <ChevronUp className="w-3 h-3 shrink-0"/>
                    : <ChevronDown className="w-3 h-3 shrink-0"/>}
                </div>
              </div>
              {expanded === i && (
                <div className={`px-4 sm:px-5 py-3 grid grid-cols-2 sm:grid-cols-4 gap-2 ${l?"bg-slate-50 border-b border-slate-100":"bg-[#070e1a] border-b border-[#1e3a5f]/50"}`}>
                  {[
                    ["Symbol",      a.symbol],
                    ["Series",      a.series],
                    ["Face Value",  a.faceVal ? `₹${a.faceVal}` : null],
                    ["Ex-Date",     a.exDate],
                    ["Record Date", a.recordDate],
                    ["BC Start",    a.bcStartDate !== "-" ? a.bcStartDate : null],
                    ["BC End",      a.bcEndDate   !== "-" ? a.bcEndDate   : null],
                    ["Remarks",     a.remarks],
                  ].filter(([,v]) => v).map(([label, val]) => (
                    <div key={label as string} className={`rounded-lg border px-3 py-2 ${l?"bg-white border-slate-100":"bg-[#0c1a2e] border-[#1e3a5f]/50"}`}>
                      <p className={`text-[9px] font-black uppercase tracking-wider mb-0.5 ${tx.t3(l)}`}>{label as string}</p>
                      <p className={`text-xs font-bold ${tx.t1(l)}`}>{val as string}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))
        )}
        </div>
        {filtered.length > 0 && (
          <div className={`px-5 py-2 text-[10px] border-t ${l?"border-slate-100 text-slate-400":"border-[#1e3a5f]/50 text-slate-500"}`}>
            {filtered.length} actions · scroll to see all
          </div>
        )}
      </Card>
    </section>
  );
}

// ══════════════════════════════════════════════════════════════════
// PORTFOLIO
// ══════════════════════════════════════════════════════════════════
// ══════════════════════════════════════════════════════════════════
// PORTFOLIO — uses EXACT Kite Connect API field names:
// tradingsymbol, exchange, quantity, average_price, last_price,
// close_price, pnl (total), day_change, day_change_percentage, isin, product
// ══════════════════════════════════════════════════════════════════
function PortfolioRow({ h, last }: { h:any; last:boolean }) {
  const f = useFlash(h.livePrice);
  const l = useIL();

  // h.pnl         = net P&L from Kite (avg_price * qty vs current value)
  // h.pnlPct      = calculated from invested vs current
  // h.livePrice   = WebSocket LTP if available, else Kite's last_price
  // h.day_change_percentage = Kite's own day % change from close

  return (
    <div className={`grid grid-cols-9 items-center px-4 sm:px-5 py-3 ${!last?(l?"border-b border-slate-100":"border-b border-[#1e3a5f]/30"):""} ${l?"hover:bg-slate-50/60":"hover:bg-white/[0.015]"}`}>
      {/* Stock name + exchange */}
      <div className="col-span-2">
        <p className={`font-bold text-xs ${tx.t1(l)}`}>{h.tradingsymbol}</p>
        <p className={`text-[10px] ${tx.t3(l)}`}>{h.exchange} · {h.product} · {h.quantity} qty</p>
      </div>

      {/* Avg buy price */}
      <div className={`text-right text-xs tabular-nums ${tx.t2(l)}`}>
        ₹{fmt(h.average_price)}
      </div>

      {/* Live LTP with flash */}
      <div className={`text-right text-sm font-bold tabular-nums transition-colors duration-500 ${f==="up"?"text-emerald-500":f==="dn"?"text-red-500":tx.t1(l)}`}>
        ₹{fmt(h.livePrice)}
      </div>

      {/* Prev close (Kite: close_price field) */}
      <div className={`text-right text-xs tabular-nums hidden sm:block ${tx.t3(l)}`}>
        ₹{fmt(h.close_price)}
      </div>

      {/* Invested amount */}
      <div className={`text-right text-xs tabular-nums hidden sm:block ${tx.t2(l)}`}>
        ₹{fmtV(h.invested)}
      </div>

      {/* Current value */}
      <div className={`text-right text-xs tabular-nums hidden md:block ${tx.t1(l)}`}>
        ₹{fmtV(h.current)}
      </div>

      {/* Total P&L (Kite's h.pnl when using last_price, else recalculated from livePrice) */}
      <div className="text-right">
        <p className={`text-xs font-bold tabular-nums ${h.computedPnl>=0?"text-emerald-600":"text-red-500"}`}>
          {h.computedPnl>=0?"+":""}₹{fmtV(Math.abs(h.computedPnl))}
        </p>
        <p className={`text-[10px] ${h.pnlPct>=0?"text-emerald-500":"text-red-400"}`}>
          {h.pnlPct>=0?"+":""}{h.pnlPct.toFixed(2)}%
        </p>
      </div>

      {/* Day change % — Kite provides day_change_percentage directly */}
      <div className="text-right">
        <PctTag p={h.day_change_percentage ?? null} sm/>
        {h.day_change != null && (
          <p className={`text-[10px] tabular-nums mt-0.5 ${h.day_change>=0?"text-emerald-500":"text-red-400"}`}>
            {h.day_change>=0?"+":""}₹{fmt(h.day_change,2)}
          </p>
        )}
      </div>
    </div>
  );
}

function PortfolioSection({ ticks }: { ticks:any }) {
  const l = useIL();
  const { data, loading, error, refresh } = useAPI<any[]>("/kite/portfolio/holdings", []);

  // Kite response: { status:"success", data: [...holdings] }
  // useAPI extracts j.data — so `data` is the raw array
  const raw: any[] = useMemo(() => Array.isArray(data) ? data : [], [data]);

  const holdings = useMemo(() => raw.map(h => {
    // Use h.exchange from Kite (can be NSE or BSE)
    const wsKey    = `${h.exchange}:${h.tradingsymbol}`;
    // Live price: WebSocket tick > Kite's last_price (from REST). Never fallback to avg_price for display.
    const livePrice = ticks[wsKey]?.last_price ?? h.last_price;
    const invested  = h.average_price * h.quantity;
    const current   = livePrice * h.quantity;
    // computedPnl: if WebSocket has live price, recalculate; else use Kite's pnl
    const computedPnl = ticks[wsKey]?.last_price != null
      ? current - invested
      : h.pnl ?? (current - invested);
    const pnlPct  = invested > 0 ? (computedPnl / invested) * 100 : 0;
    return { ...h, livePrice, invested, current, computedPnl, pnlPct };
  }), [raw, ticks]);

  // Summary using Kite's pnl for accuracy
  const totInv = holdings.reduce((a,h) => a + h.invested, 0);
  const totCur = holdings.reduce((a,h) => a + h.current,  0);
  const totPnL = totCur - totInv;
  const totPct = totInv > 0 ? (totPnL / totInv) * 100 : 0;
  // Day P&L from Kite's day_change field
  const totDayPnL = holdings.reduce((a,h) => a + ((h.day_change ?? 0) * h.quantity), 0);

  const isAuth = !!error && /403|401|token|unauthorized|invalid/i.test(error);
  const isErr  = !!error && !isAuth;

  return (
    <section className="mb-8">
      <SecHead id="portfolio" icon={PieChart} title="Portfolio / Holdings" sub="Live P&L · Kite Connect `/portfolio/holdings`"/>
      {isAuth && <KiteBanner msg="Session expired — please login again to Zerodha Kite"/>}
      {isErr && (
        <div className={`mb-4 px-4 py-3 rounded-xl border flex items-center gap-2 text-xs ${l?"bg-red-50 border-red-200 text-red-600":"bg-red-500/10 border-red-500/20 text-red-400"}`}>
          <AlertCircle className="w-3.5 h-3.5 shrink-0"/>{error}
          <button onClick={refresh} className="ml-auto underline">Retry</button>
        </div>
      )}

      {holdings.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-2 mb-4">
          {[
            { label:"Invested",    val:`₹${fmtV(totInv)}`,                                            cls:tx.t1(l) },
            { label:"Current Val", val:`₹${fmtV(totCur)}`,                                            cls:tx.t1(l) },
            { label:"Total P&L",   val:`${totPnL>=0?"+":""}₹${fmtV(Math.abs(totPnL))}`,              cls:totPnL>=0?"text-emerald-600":"text-red-500" },
            { label:"Returns",     val:`${totPct>=0?"+":""}${totPct.toFixed(2)}%`,                    cls:totPct>=0?"text-emerald-600":"text-red-500" },
            { label:"Today's P&L", val:`${totDayPnL>=0?"+":""}₹${fmtV(Math.abs(totDayPnL))}`,       cls:totDayPnL>=0?"text-emerald-600":"text-red-500" },
          ].map(s => (
            <Card key={s.label} className="px-3 py-2.5">
              <p className={`text-[9px] font-black uppercase tracking-widest mb-1 ${tx.t3(l)}`}>{s.label}</p>
              <p className={`text-base font-black ${s.cls}`}>{s.val}</p>
            </Card>
          ))}
        </div>
      )}

      <Card className="overflow-x-auto">
        <div className={`grid grid-cols-9 px-4 sm:px-5 py-2.5 text-[9px] font-black uppercase tracking-widest ${tx.header(l)} ${tx.t3(l)}`}>
          <div className="col-span-2">Stock</div>
          <div className="text-right">Avg Cost</div>
          <div className="text-right">LTP</div>
          <div className="text-right hidden sm:block">Prev Close</div>
          <div className="text-right hidden sm:block">Invested</div>
          <div className="text-right hidden md:block">Current</div>
          <div className="text-right">P&amp;L</div>
          <div className="text-right">Day Chg</div>
        </div>
        {loading
          ? <div className="p-4 space-y-2">{[...Array(4)].map((_,i) => <Skel key={i} h="h-14"/>)}</div>
          : holdings.length === 0
            ? <div className={`p-10 text-center ${tx.t2(l)}`}>
                <PieChart className="w-10 h-10 mx-auto mb-3 opacity-20"/>
                <p className="text-sm font-bold">No holdings found</p>
                <p className="text-xs mt-1 opacity-70">Your Zerodha demat account has 0 holdings</p>
              </div>
            : holdings.map((h,i) => <PortfolioRow key={`${h.exchange}:${h.tradingsymbol}`} h={h} last={i===holdings.length-1}/>)
        }
      </Card>
    </section>
  );
}

// ══════════════════════════════════════════════════════════════════
// MUTUAL FUNDS
// ══════════════════════════════════════════════════════════════════
// ══════════════════════════════════════════════════════════════════
// MUTUAL FUNDS — uses EXACT Kite Connect API field names:
// /mf/holdings: { folio, fund, tradingsymbol, average_price, last_price, pnl, quantity, last_price_date, pledged_quantity }
// /mf/sips:     { sip_id, fund, tradingsymbol, status, frequency, instalment_amount, next_instalment, completed_instalments, pending_instalments }
// ══════════════════════════════════════════════════════════════════
function MFSection() {
  const l = useIL();
  const [tab, setTab] = useState<"holdings"|"sips">("holdings");

  const { data: holdData, loading: hLoad, error: hErr, refresh: hRefresh } = useAPI<any[]>("/kite/mf/holdings", []);
  const { data: sipData,  loading: sLoad, error: sErr,  refresh: sRefresh } = useAPI<any[]>("/kite/mf/sips",     []);

  // Kite /mf/holdings returns array directly via j.data
  // Each item: { folio, fund, tradingsymbol, average_price, last_price, pnl, quantity, last_price_date, pledged_quantity }
  const holdings: any[] = useMemo(() => Array.isArray(holdData) ? holdData : [], [holdData]);
  const sips:     any[] = useMemo(() => Array.isArray(sipData)  ? sipData  : [], [sipData]);

  // Kite already gives us pnl per holding. Use it directly.
  const stats = useMemo(() => {
    const inv    = holdings.reduce((a,h) => a + (h.average_price * h.quantity), 0);
    const cur    = holdings.reduce((a,h) => a + (h.last_price    * h.quantity), 0);
    // Use Kite's own pnl field if available, otherwise calculate
    const kitePnl = holdings.every(h => h.pnl != null)
      ? holdings.reduce((a,h) => a + (h.pnl ?? 0), 0)
      : cur - inv;
    const pct = inv > 0 ? (kitePnl / inv) * 100 : 0;
    return { inv, cur, pnl: kitePnl, pct };
  }, [holdings]);

  const isAuthH = !!hErr && /403|401|token|unauthorized|invalid/i.test(hErr);
  const isAuthS = !!sErr && /403|401|token|unauthorized|invalid/i.test(sErr);

  return (
    <section className="mb-8">
      <SecHead id="mf" icon={Package} title="Mutual Funds" sub="MF Holdings & SIPs · Kite Connect `/mf/holdings` + `/mf/sips`"/>

      {(isAuthH || isAuthS) && <KiteBanner msg="Session expired — please login again to view mutual funds"/>}

      {/* Holdings summary cards */}
      {holdings.length > 0 && tab === "holdings" && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
          {[
            { label:"Invested",    val:`₹${fmtV(stats.inv)}`,                                       cls:tx.t1(l) },
            { label:"Current NAV", val:`₹${fmtV(stats.cur)}`,                                       cls:tx.t1(l) },
            { label:"Total P&L",   val:`${stats.pnl>=0?"+":""}₹${fmtV(Math.abs(stats.pnl))}`,      cls:stats.pnl>=0?"text-emerald-600":"text-red-500" },
            { label:"Returns",     val:`${stats.pct>=0?"+":""}${stats.pct.toFixed(2)}%`,             cls:stats.pct>=0?"text-emerald-600":"text-red-500" },
          ].map(s => (
            <Card key={s.label} className="px-3 py-2.5">
              <p className={`text-[9px] font-black uppercase tracking-widest mb-1 ${tx.t3(l)}`}>{s.label}</p>
              <p className={`text-sm font-black ${s.cls}`}>{s.val}</p>
            </Card>
          ))}
        </div>
      )}

      {/* Holdings / SIPs tab */}
      <div className="flex gap-2 mb-3">
        {(["holdings","sips"] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold border transition-all ${tab===t?"bg-[#5194F6] text-white border-transparent":l?"bg-white text-slate-600 border-slate-200":"bg-[#0c1a2e] text-slate-400 border-[#1e3a5f]/50"}`}>
            {t==="holdings" ? `Holdings ${holdings.length>0?`(${holdings.length})`:""}` : `Active SIPs ${sips.length>0?`(${sips.length})`:""}`}
          </button>
        ))}
        <button onClick={tab==="holdings"?hRefresh:sRefresh}
          className={`px-2.5 py-1.5 rounded-lg border flex items-center transition-all ${l?"bg-white text-slate-600 border-slate-200":"bg-[#0c1a2e] text-slate-400 border-[#1e3a5f]/50"}`}>
          <RefreshCw className={`w-3.5 h-3.5 ${(hLoad||sLoad)?"animate-spin":""}`}/>
        </button>
      </div>

      {/* ── HOLDINGS TABLE ── */}
      {tab === "holdings" && (
        <Card className="overflow-x-auto">
          <div className={`grid grid-cols-6 px-4 sm:px-5 py-2.5 text-[9px] font-black uppercase tracking-widest ${tx.header(l)} ${tx.t3(l)}`}>
            <div className="col-span-2">Fund Name</div>
            <div className="text-right">Units</div>
            <div className="text-right">Avg NAV</div>
            <div className="text-right">Cur NAV</div>
            <div className="text-right">P&amp;L</div>
          </div>
          {hLoad
            ? <div className="p-4 space-y-2">{[...Array(3)].map((_,i) => <Skel key={i} h="h-14"/>)}</div>
            : holdings.length === 0
              ? <div className={`p-10 text-center ${tx.t2(l)}`}>
                  <Package className="w-10 h-10 mx-auto mb-3 opacity-20"/>
                  <p className="text-sm font-bold">No MF holdings found</p>
                  <p className="text-xs mt-1 opacity-70">No mutual fund investments in your Zerodha account</p>
                </div>
              : holdings.map((h: any, i: number) => {
                  // Use Kite's pnl field directly — it's the authoritative value
                  const pnl    = h.pnl ?? ((h.last_price - h.average_price) * h.quantity);
                  const inv    = h.average_price * h.quantity;
                  const pnlPct = inv > 0 ? (pnl / inv) * 100 : 0;
                  return (
                    <div key={i} className={`grid grid-cols-6 px-4 sm:px-5 py-3 items-center ${i<holdings.length-1?(l?"border-b border-slate-100":"border-b border-[#1e3a5f]/30"):""} ${l?"hover:bg-slate-50/60":"hover:bg-white/[0.015]"}`}>
                      <div className="col-span-2">
                        {/* Kite field: h.fund (fund name), NOT h.fund_name */}
                        <p className={`font-bold text-xs truncate pr-2 ${tx.t1(l)}`} title={h.fund}>
                          {h.fund ?? h.tradingsymbol}
                        </p>
                        {/* Kite field: h.folio (folio number), NOT h.folio_no */}
                        <p className={`text-[10px] ${tx.t3(l)}`}>
                          {h.folio ? `Folio: ${h.folio}` : h.tradingsymbol}
                          {h.pledged_quantity > 0 && <span className="ml-1 text-amber-500">· Pledged: {h.pledged_quantity}</span>}
                        </p>
                      </div>
                      <div className={`text-right text-xs tabular-nums font-semibold ${tx.t1(l)}`}>{fmt(h.quantity, 3)}</div>
                      <div className={`text-right text-xs tabular-nums ${tx.t2(l)}`}>₹{fmt(h.average_price)}</div>
                      <div className="text-right">
                        <p className={`text-xs tabular-nums font-bold ${tx.t1(l)}`}>₹{fmt(h.last_price)}</p>
                        {h.last_price_date && <p className={`text-[9px] ${tx.t3(l)}`}>{h.last_price_date}</p>}
                      </div>
                      <div className="text-right">
                        {/* Use Kite's pnl directly */}
                        <p className={`text-xs font-bold ${pnl>=0?"text-emerald-600":"text-red-500"}`}>
                          {pnl>=0?"+":""}₹{fmtV(Math.abs(pnl))}
                        </p>
                        <p className={`text-[10px] ${pnlPct>=0?"text-emerald-500":"text-red-400"}`}>
                          {pnlPct>=0?"+":""}{pnlPct.toFixed(2)}%
                        </p>
                      </div>
                    </div>
                  );
                })
          }
        </Card>
      )}

      {/* ── SIPs TABLE ── */}
      {tab === "sips" && (
        <Card className="overflow-x-auto">
          <div className={`grid grid-cols-6 px-4 sm:px-5 py-2.5 text-[9px] font-black uppercase tracking-widest ${tx.header(l)} ${tx.t3(l)}`}>
            <div className="col-span-2">Fund Name</div>
            <div className="text-right">Amount</div>
            <div className="text-right">Frequency</div>
            <div className="text-right">Next Date</div>
            <div className="text-right">Status</div>
          </div>
          {sLoad
            ? <div className="p-4 space-y-2">{[...Array(3)].map((_,i) => <Skel key={i} h="h-14"/>)}</div>
            : sips.length === 0
              ? <div className={`p-10 text-center ${tx.t2(l)}`}>
                  <Package className="w-10 h-10 mx-auto mb-3 opacity-20"/>
                  <p className="text-sm font-bold">No active SIPs</p>
                  <p className="text-xs mt-1">Start a SIP on Zerodha Coin to see them here</p>
                </div>
              : sips.map((s: any, i: number) => (
                  <div key={s.sip_id ?? i} className={`grid grid-cols-6 px-4 sm:px-5 py-3 items-center ${i<sips.length-1?(l?"border-b border-slate-100":"border-b border-[#1e3a5f]/30"):""} ${l?"hover:bg-slate-50/60":"hover:bg-white/[0.015]"}`}>
                    <div className="col-span-2">
                      {/* Kite field: s.fund (fund name) */}
                      <p className={`font-bold text-xs truncate pr-2 ${tx.t1(l)}`} title={s.fund}>{s.fund ?? s.tradingsymbol}</p>
                      <p className={`text-[10px] ${tx.t3(l)}`}>
                        Done: {s.completed_instalments ?? 0}
                        {s.pending_instalments > 0 && s.pending_instalments !== 9999 && ` · Left: ${s.pending_instalments}`}
                        {s.pending_instalments === -1 && " · Until cancelled"}
                      </p>
                    </div>
                    <div className={`text-right text-xs font-bold tabular-nums ${tx.t1(l)}`}>₹{fmtV(s.instalment_amount)}</div>
                    <div className={`text-right text-xs capitalize ${tx.t2(l)}`}>{s.frequency}</div>
                    <div className={`text-right text-xs tabular-nums ${tx.t2(l)}`}>{s.next_instalment ?? "—"}</div>
                    <div className="text-right">
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                        s.status === "ACTIVE"
                          ? l?"bg-emerald-100 text-emerald-700":"bg-emerald-500/15 text-emerald-400"
                          : s.status === "PAUSED"
                            ? l?"bg-amber-100 text-amber-700":"bg-amber-500/15 text-amber-400"
                            : l?"bg-slate-100 text-slate-500":"bg-gray-800/40 text-slate-400"
                      }`}>{s.status}</span>
                    </div>
                  </div>
                ))
          }
        </Card>
      )}
    </section>
  );
}

// ══════════════════════════════════════════════════════════════════
// ORDERS — Last 7 days orders via /kite/orders
// ══════════════════════════════════════════════════════════════════
const ORDER_STATUS_COLORS: Record<string,(l:boolean)=>string> = {
  COMPLETE:  (l) => l?"bg-emerald-100 text-emerald-700":"bg-emerald-500/15 text-emerald-400",
  OPEN:      (l) => l?"bg-blue-100 text-blue-700":"bg-[#5194F6]/15 text-[#5194F6]",
  REJECTED:  (l) => l?"bg-red-100 text-red-600":"bg-red-500/15 text-red-400",
  CANCELLED: (l) => l?"bg-slate-100 text-slate-500":"bg-gray-800/40 text-slate-400",
  TRIGGER_PENDING: (l) => l?"bg-amber-100 text-amber-700":"bg-amber-500/15 text-amber-400",
};

function OrderRow({ o, last }: { o:any; last:boolean }) {
  const l      = useIL();
  const isBuy  = o.transaction_type === "BUY";
  const sc     = ORDER_STATUS_COLORS[o.status] ?? ((l:boolean) => l?"bg-slate-100 text-slate-500":"bg-gray-800/30 text-slate-400");
  const ts     = o.order_timestamp ? new Date(o.order_timestamp).toLocaleString("en-IN",{day:"2-digit",month:"short",hour:"2-digit",minute:"2-digit",hour12:true}) : "—";

  return (
    <div className={`grid grid-cols-4 sm:grid-cols-8 items-center px-3 sm:px-5 py-2 sm:py-3 text-xs
      ${!last?(l?"border-b border-slate-100":"border-b border-[#1e3a5f]/30"):""}
      ${l?"hover:bg-slate-50/60":"hover:bg-white/[0.015]"}`}>
      {/* Symbol + type */}
      <div className="col-span-2">
        <div className="flex items-center gap-1 sm:gap-1.5 flex-wrap">
          <span className={`font-black text-[11px] sm:text-xs ${tx.t1(l)}`}>{o.tradingsymbol}</span>
          <span className={`text-[9px] font-black px-1.5 py-0.5 rounded ${isBuy
            ? l?"bg-emerald-100 text-emerald-700":"bg-emerald-500/15 text-emerald-400"
            : l?"bg-red-100 text-red-600":"bg-red-500/15 text-red-400"}`}>
            {o.transaction_type}
          </span>
        </div>
        <p className={`text-[10px] mt-0.5 ${tx.t3(l)}`}>{o.exchange} · {o.product}</p>
      </div>

      {/* Qty */}
      <div className={`text-right tabular-nums font-semibold ${tx.t1(l)}`}>{o.quantity ?? "—"}</div>

      {/* Price — hidden sm, show on mobile too for 4-col */}
      <div className={`text-right tabular-nums hidden sm:block ${tx.t2(l)}`}>
        {o.average_price > 0 ? `₹${fmt(o.average_price)}` : o.price > 0 ? `₹${fmt(o.price)}` : "MKT"}
      </div>

      {/* Amount */}
      <div className={`text-right tabular-nums hidden sm:block ${tx.t2(l)}`}>
        {o.average_price > 0 && o.quantity > 0 ? `₹${fmtV(o.average_price * o.quantity)}` : "—"}
      </div>

      {/* Variety */}
      <div className={`text-right hidden md:block ${tx.t3(l)}`}>{o.variety}</div>

      {/* Timestamp */}
      <div className={`text-right text-[10px] hidden sm:block ${tx.t3(l)}`}>{ts}</div>

      {/* Status */}
      <div className="text-right">
        <span className={`text-[9px] sm:text-[10px] font-bold px-1.5 sm:px-2 py-0.5 rounded ${sc(l)}`}>{o.status}</span>
        {o.status_message && o.status !== "COMPLETE" && (
          <p className={`text-[9px] mt-0.5 truncate max-w-[80px] sm:max-w-[100px] ml-auto ${tx.t3(l)}`} title={o.status_message}>{o.status_message}</p>
        )}
      </div>
    </div>
  );
}

function OrdersSection() {
  const l = useIL();
  const [statusFilter, setStatusFilter] = useState<string>("All");
  const [txFilter,    setTxFilter]     = useState<string>("All");

  const { data, loading, error, refresh } = useAPI<any[]>("/kite/orders", []);

  const orders: any[] = useMemo(() => Array.isArray(data) ? data : [], [data]);

  const filtered = useMemo(() => {
    return orders
      .filter(o => statusFilter === "All" || o.status === statusFilter)
      .filter(o => txFilter    === "All" || o.transaction_type === txFilter)
      .sort((a,b) => new Date(b.order_timestamp||0).getTime() - new Date(a.order_timestamp||0).getTime());
  }, [orders, statusFilter, txFilter]);

  const statusCounts = useMemo(() => {
    const c: Record<string,number> = {};
    orders.forEach(o => { c[o.status] = (c[o.status]||0)+1; });
    return c;
  }, [orders]);

  const isAuth = !!error && /403|401|token|unauthorized|invalid/i.test(error);

  return (
    <section className="mb-8">
      <SecHead id="orders" icon={FileText} title="Orders" sub="Last 7 days · Kite Connect `/orders`"/>

      {isAuth && <KiteBanner msg="Session expired — please login again to view orders"/>}

      {/* Summary pills */}
      {orders.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-3">
          {Object.entries(statusCounts).map(([st, cnt]) => {
            const sc = ORDER_STATUS_COLORS[st] ?? ((l:boolean) => l?"bg-slate-100 text-slate-500":"bg-gray-800/30 text-slate-400");
            return (
              <span key={st} className={`text-[10px] font-bold px-2.5 py-1 rounded-lg ${sc(l)}`}>
                {st}: {cnt}
              </span>
            );
          })}
        </div>
      )}

      {/* Filters — single scrollable row, NEVER wraps */}
      <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pb-1 mb-3 flex-nowrap">
        {["All","COMPLETE","OPEN","REJECTED","CANCELLED"].map(s => (
          <button key={s} onClick={() => setStatusFilter(s)}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-bold border transition-all shrink-0 ${
              statusFilter===s ? "bg-[#5194F6] text-white border-transparent"
                : l?"bg-white text-slate-600 border-slate-200":"bg-[#0c1a2e] text-slate-400 border-[#1e3a5f]/50"
            }`}>{s}</button>
        ))}
        <div className={`w-px h-5 shrink-0 mx-0.5 ${l?"bg-slate-200":"bg-[#1e3a5f]"}`}/>
        {["All","BUY","SELL"].map(t => (
          <button key={t} onClick={() => setTxFilter(t)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all shrink-0 ${
              txFilter===t
                ? t==="BUY" ? "bg-emerald-600 text-white border-transparent"
                  : t==="SELL" ? "bg-red-600 text-white border-transparent"
                  : "bg-[#5194F6] text-white border-transparent"
                : l?"bg-white text-slate-600 border-slate-200":"bg-[#0c1a2e] text-slate-400 border-[#1e3a5f]/50"
            }`}>{t}</button>
        ))}
        <button onClick={refresh}
          className={`px-2.5 py-1.5 rounded-lg border flex items-center shrink-0 ${l?"bg-white text-slate-600 border-slate-200":"bg-[#0c1a2e] text-slate-400 border-[#1e3a5f]/50"}`}>
          <RefreshCw className={`w-3.5 h-3.5 ${loading?"animate-spin":""}`}/>
        </button>
      </div>

      {!isAuth && error && (
        <div className={`mb-3 px-4 py-3 rounded-xl border flex items-center gap-2 text-xs ${l?"bg-red-50 border-red-200 text-red-600":"bg-red-500/10 border-red-500/20 text-red-400"}`}>
          <AlertCircle className="w-3.5 h-3.5 shrink-0"/>{error}
          <button onClick={refresh} className="ml-auto underline">Retry</button>
        </div>
      )}

      <Card className="overflow-hidden">
        <div className={`grid grid-cols-4 sm:grid-cols-8 px-3 sm:px-5 py-2.5 text-[9px] font-black uppercase tracking-widest ${tx.header(l)} ${tx.t3(l)}`}>
          <div className="col-span-2">Symbol</div>
          <div className="text-right">Qty</div>
          <div className="text-right hidden sm:block">Price</div>
          <div className="text-right hidden sm:block">Amount</div>
          <div className="text-right hidden md:block">Variety</div>
          <div className="text-right hidden sm:block">Time</div>
          <div className="text-right">Status</div>
        </div>
        {loading ? (
          <div className="p-4 space-y-2">{[...Array(5)].map((_,i) => <Skel key={i} h="h-14"/>)}</div>
        ) : filtered.length === 0 ? (
          <div className={`p-10 text-center ${tx.t2(l)}`}>
            <FileText className="w-10 h-10 mx-auto mb-3 opacity-20"/>
            <p className="text-sm font-bold">No orders found</p>
            <p className="text-xs mt-1">
              {orders.length > 0 ? "No orders match current filters" : "No orders placed in the last 7 days"}
            </p>
          </div>
        ) : (
          filtered.map((o,i) => <OrderRow key={o.order_id ?? i} o={o} last={i===filtered.length-1}/>)
        )}
      </Card>
    </section>
  );
}

// ══════════════════════════════════════════════════════════════════
// MARGIN CALCULATOR — User margins + Order margin calculator
// ══════════════════════════════════════════════════════════════════
const EXCHANGES   = ["NSE","BSE","NFO","CDS","MCX"] as const;
const PRODUCTS    = ["CNC","MIS","NRML"] as const;
const ORDER_TYPES = ["MARKET","LIMIT","SL","SL-M"] as const;
const VARIETIES   = ["regular","amo","co","iceberg","auction"] as const;

function MarginSection() {
  const l = useIL();

  // Available user margins
  const { data: umData, loading: umLoad, error: umErr, refresh: umRefresh } = useAPI<any>("/kite/user/margins", []);

  // Calculator form
  const [form, setForm]     = useState({
    exchange: "NSE", tradingsymbol: "", transaction_type: "BUY",
    variety: "regular", product: "CNC", order_type: "MARKET",
    quantity: "", price: "", trigger_price: "",
  });
  const [result,   setResult]   = useState<any>(null);
  const [calcLoad, setCalcLoad] = useState(false);
  const [calcErr,  setCalcErr]  = useState<string|null>(null);

  const equity    = umData?.equity    ?? null;
  const commodity = umData?.commodity ?? null;
  const isAuthUM  = !!umErr && /403|401|token|unauthorized|invalid/i.test(umErr);

  const handleCalc = async () => {
    if (!form.tradingsymbol.trim() || !form.quantity) {
      setCalcErr("Symbol and Quantity are required"); return;
    }
    setCalcLoad(true); setCalcErr(null); setResult(null);
    try {
      const r = await fetch(`${BASE}/kite/margins/orders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify([{
          exchange:         form.exchange,
          tradingsymbol:    form.tradingsymbol.toUpperCase().trim(),
          transaction_type: form.transaction_type,
          variety:          form.variety,
          product:          form.product,
          order_type:       form.order_type,
          quantity:         Number(form.quantity),
          price:            Number(form.price)         || 0,
          trigger_price:    Number(form.trigger_price) || 0,
        }]),
      });
      const j = await r.json();
      if (!r.ok || j.status === "error") throw new Error(j.message ?? `HTTP ${r.status}`);
      setResult(j.data?.[0] ?? null);
    } catch (e:any) { setCalcErr(e.message); }
    finally { setCalcLoad(false); }
  };

  const InpCls = `w-full px-3 py-2 rounded-lg border text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-[#5194F6] transition-all ${
    l ? "bg-white border-slate-200 text-slate-800 placeholder:text-slate-400"
      : "bg-[#0c1a2e] border-[#1e3a5f]/50 text-white placeholder:text-slate-500"
  }`;
  const SelCls = `w-full px-3 py-2 rounded-lg border text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-[#5194F6] transition-all ${
    l ? "bg-white border-slate-200 text-slate-800"
      : "bg-[#0c1a2e] border-[#1e3a5f]/50 text-white"
  }`;

  return (
    <section className="mb-8">
      <SecHead id="margins" icon={Calculator} title="Margin Calculator" sub="Available Cash · Order Margin · Charges Breakdown"/>

      {/* ── Available Margins ── */}
      <div className="mb-5">
        <div className="flex items-center justify-between mb-3">
          <p className={`text-xs font-black uppercase tracking-widest ${tx.t3(l)}`}>Available Margins</p>
          <button onClick={umRefresh}
            className={`px-2.5 py-1.5 rounded-lg border flex items-center gap-1.5 text-xs ${l?"bg-white text-slate-600 border-slate-200":"bg-[#0c1a2e] text-slate-400 border-[#1e3a5f]/50"}`}>
            <RefreshCw className={`w-3 h-3 ${umLoad?"animate-spin":""}`}/> Refresh
          </button>
        </div>

        {isAuthUM && <KiteBanner msg="Session expired — please login again to view margins"/>}

        {umLoad ? (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[...Array(4)].map((_,i) => <Skel key={i} h="h-16"/>)}
          </div>
        ) : (equity || commodity) ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[["Equity", equity], ["Commodity", commodity]].filter(([,d]) => d).map(([seg, d]: any) => (
              <Card key={seg} className="overflow-hidden">
                <div className={`px-4 py-2.5 border-b flex items-center justify-between ${l?"border-slate-100 bg-slate-50":"border-[#1e3a5f]/50 bg-[#070e1a]"}`}>
                  <span className={`text-xs font-black uppercase tracking-wider ${tx.t1(l)}`}>{seg}</span>
                  {d.enabled ? (
                    <span className={`text-[9px] font-black px-1.5 py-0.5 rounded ${l?"bg-emerald-100 text-emerald-700":"bg-emerald-500/15 text-emerald-400"}`}>ENABLED</span>
                  ) : (
                    <span className={`text-[9px] font-black px-1.5 py-0.5 rounded ${l?"bg-red-100 text-red-600":"bg-red-500/15 text-red-400"}`}>DISABLED</span>
                  )}
                </div>
                <div className="p-3 grid grid-cols-2 gap-2">
                  {[
                    { label:"Net",           val: d.net,                          cls:"text-emerald-500 text-base font-black" },
                    { label:"Cash",          val: d.available?.cash,              cls:tx.t1(l)+" text-sm font-bold" },
                    { label:"Collateral",    val: d.available?.collateral,        cls:tx.t1(l) },
                    { label:"Intraday Payin",val: d.available?.intraday_payin,   cls:tx.t1(l) },
                    { label:"Debits Used",   val: d.utilised?.debits,             cls:"text-red-500" },
                    { label:"Span",          val: d.utilised?.span,               cls:tx.t2(l) },
                    { label:"Exposure",      val: d.utilised?.exposure,           cls:tx.t2(l) },
                    { label:"Option Premium",val: d.utilised?.option_premium,    cls:tx.t2(l) },
                  ].map(({ label, val, cls }) => val != null ? (
                    <div key={label} className={`rounded-lg border px-3 py-2 ${l?"bg-slate-50 border-slate-100":"bg-[#0c1a2e] border-[#1e3a5f]/50"}`}>
                      <p className={`text-[9px] font-black uppercase tracking-wider mb-1 ${tx.t3(l)}`}>{label}</p>
                      <p className={`tabular-nums text-xs ${cls}`}>₹{fmt(val)}</p>
                    </div>
                  ) : null)}
                </div>
              </Card>
            ))}
          </div>
        ) : !isAuthUM && !umLoad && (
          <Card className="p-6 text-center">
            <ShieldCheck className={`w-8 h-8 mx-auto mb-2 opacity-30 ${tx.t3(l)}`}/>
            <p className={`text-sm font-bold ${tx.t2(l)}`}>No margin data available</p>
          </Card>
        )}
      </div>

      {/* ── Order Margin Calculator ── */}
      <Card className="overflow-hidden">
        <div className={`px-4 sm:px-5 py-3 border-b flex items-center gap-2 ${tx.header(l)}`}>
          <DollarSign className="w-4 h-4 text-[#5194F6]"/>
          <span className={`text-sm font-black ${tx.t1(l)}`}>Order Margin Calculator</span>
          <span className={`text-[10px] ml-1 ${tx.t3(l)}`}>Kite Connect POST `/margins/orders`</span>
        </div>
        <div className="p-4 sm:p-5">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 mb-4">
            {/* Symbol */}
            <div className="sm:col-span-2">
              <label className={`block text-[10px] font-black uppercase tracking-wider mb-1.5 ${tx.t3(l)}`}>Symbol *</label>
              <input
                value={form.tradingsymbol}
                onChange={e => setForm(f => ({ ...f, tradingsymbol: e.target.value.toUpperCase() }))}
                placeholder="e.g. INFY, RELIANCE"
                className={InpCls}
              />
            </div>

            {/* Exchange */}
            <div>
              <label className={`block text-[10px] font-black uppercase tracking-wider mb-1.5 ${tx.t3(l)}`}>Exchange</label>
              <select value={form.exchange} onChange={e => setForm(f => ({ ...f, exchange: e.target.value }))} className={SelCls}>
                {EXCHANGES.map(e => <option key={e}>{e}</option>)}
              </select>
            </div>

            {/* Transaction Type */}
            <div>
              <label className={`block text-[10px] font-black uppercase tracking-wider mb-1.5 ${tx.t3(l)}`}>Buy / Sell</label>
              <select value={form.transaction_type} onChange={e => setForm(f => ({ ...f, transaction_type: e.target.value }))} className={SelCls}>
                <option value="BUY">BUY</option>
                <option value="SELL">SELL</option>
              </select>
            </div>

            {/* Product */}
            <div>
              <label className={`block text-[10px] font-black uppercase tracking-wider mb-1.5 ${tx.t3(l)}`}>Product</label>
              <select value={form.product} onChange={e => setForm(f => ({ ...f, product: e.target.value }))} className={SelCls}>
                {PRODUCTS.map(p => <option key={p}>{p}</option>)}
              </select>
            </div>

            {/* Order Type */}
            <div>
              <label className={`block text-[10px] font-black uppercase tracking-wider mb-1.5 ${tx.t3(l)}`}>Order Type</label>
              <select value={form.order_type} onChange={e => setForm(f => ({ ...f, order_type: e.target.value }))} className={SelCls}>
                {ORDER_TYPES.map(o => <option key={o}>{o}</option>)}
              </select>
            </div>

            {/* Variety */}
            <div>
              <label className={`block text-[10px] font-black uppercase tracking-wider mb-1.5 ${tx.t3(l)}`}>Variety</label>
              <select value={form.variety} onChange={e => setForm(f => ({ ...f, variety: e.target.value }))} className={SelCls}>
                {VARIETIES.map(v => <option key={v}>{v}</option>)}
              </select>
            </div>

            {/* Quantity */}
            <div>
              <label className={`block text-[10px] font-black uppercase tracking-wider mb-1.5 ${tx.t3(l)}`}>Quantity *</label>
              <input
                type="number" min="1" value={form.quantity}
                onChange={e => setForm(f => ({ ...f, quantity: e.target.value }))}
                placeholder="e.g. 10"
                className={InpCls}
              />
            </div>

            {/* Price */}
            <div>
              <label className={`block text-[10px] font-black uppercase tracking-wider mb-1.5 ${tx.t3(l)}`}>Price <span className={tx.t3(l)}>(0 = MARKET)</span></label>
              <input
                type="number" min="0" step="0.05" value={form.price}
                onChange={e => setForm(f => ({ ...f, price: e.target.value }))}
                placeholder="0"
                className={InpCls}
              />
            </div>

            {/* Trigger Price */}
            {(form.order_type === "SL" || form.order_type === "SL-M") && (
              <div>
                <label className={`block text-[10px] font-black uppercase tracking-wider mb-1.5 ${tx.t3(l)}`}>Trigger Price</label>
                <input
                  type="number" min="0" step="0.05" value={form.trigger_price}
                  onChange={e => setForm(f => ({ ...f, trigger_price: e.target.value }))}
                  placeholder="0"
                  className={InpCls}
                />
              </div>
            )}
          </div>

          {calcErr && (
            <div className={`mb-3 px-3 py-2.5 rounded-lg border flex items-center gap-2 text-xs ${l?"bg-red-50 border-red-200 text-red-600":"bg-red-500/10 border-red-500/20 text-red-400"}`}>
              <AlertCircle className="w-3.5 h-3.5 shrink-0"/>{calcErr}
            </div>
          )}

          <button
            onClick={handleCalc} disabled={calcLoad}
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-xs font-black bg-[#5194F6] text-white hover:bg-[#4080e0] transition-colors disabled:opacity-60">
            {calcLoad ? <RefreshCw className="w-3.5 h-3.5 animate-spin"/> : <Send className="w-3.5 h-3.5"/>}
            {calcLoad ? "Calculating…" : "Calculate Margin"}
          </button>

          {/* Result */}
          {result && (
            <div className="mt-5">
              <div className={`rounded-xl border p-4 ${l?"bg-emerald-50 border-emerald-200":"bg-emerald-500/8 border-emerald-500/15"}`}>
                <p className={`text-[10px] font-black uppercase tracking-widest mb-3 ${l?"text-emerald-700":"text-emerald-400"}`}>
                  Margin Required · {result.tradingsymbol} · {result.exchange}
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
                  {[
                    { label:"Total Margin", val: result.total,          cls:"text-emerald-600 text-base font-black" },
                    { label:"SPAN",         val: result.span,           cls:tx.t1(l)+" font-bold" },
                    { label:"Exposure",     val: result.exposure,       cls:tx.t1(l) },
                    { label:"VAR",          val: result.var,            cls:tx.t1(l) },
                    { label:"Leverage",     val: null, raw: result.leverage ? `${result.leverage}x` : null, cls:"text-blue-500 font-bold" },
                    { label:"Opt Premium",  val: result.option_premium, cls:tx.t2(l) },
                    { label:"Additional",   val: result.additional,     cls:tx.t2(l) },
                    { label:"Cash Credit",  val: result.cash,           cls:"text-emerald-600" },
                  ].map(({ label, val, raw, cls }) => (
                    <div key={label} className={`rounded-lg border px-3 py-2 ${l?"bg-white border-slate-100":"bg-[#0c1a2e] border-[#1e3a5f]/50"}`}>
                      <p className={`text-[9px] font-black uppercase tracking-wider mb-1 ${tx.t3(l)}`}>{label}</p>
                      <p className={`tabular-nums text-xs ${cls}`}>
                        {raw ?? (val != null && val !== 0 ? `₹${fmt(val)}` : "—")}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Charges breakdown */}
                {result.charges && (
                  <>
                    <p className={`text-[10px] font-black uppercase tracking-widest mb-2 ${tx.t3(l)}`}>Charges Breakdown</p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                      {[
                        { label:"Total Charges",     val: result.charges.total,                     cls:"text-red-500 font-bold" },
                        { label:"Brokerage",         val: result.charges.brokerage,                 cls:tx.t1(l) },
                        { label:`${(result.charges.transaction_tax_type??'STT').toUpperCase()} / CTT`,
                                                     val: result.charges.transaction_tax,           cls:tx.t2(l) },
                        { label:"Exch Turnover",     val: result.charges.exchange_turnover_charge,  cls:tx.t2(l) },
                        { label:"SEBI Charge",       val: result.charges.sebi_turnover_charge,      cls:tx.t2(l) },
                        { label:"Stamp Duty",        val: result.charges.stamp_duty,                cls:tx.t2(l) },
                        { label:"GST Total",         val: result.charges.gst?.total,                cls:tx.t2(l) },
                      ].map(({ label, val, cls }) => val != null ? (
                        <div key={label} className={`rounded-lg border px-3 py-2 ${l?"bg-white border-slate-100":"bg-[#0c1a2e] border-[#1e3a5f]/50"}`}>
                          <p className={`text-[9px] font-black uppercase tracking-wider mb-1 ${tx.t3(l)}`}>{label}</p>
                          <p className={`tabular-nums text-xs ${cls}`}>₹{fmt(val, 4)}</p>
                        </div>
                      ) : null)}
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </Card>
    </section>
  );
}

function BreadthVixSection({ ticks }: { ticks: any }) {
  const l = useIL();
  const { data: bdData, loading: bdLoad, refresh: bdRefresh } = useAPI<any>("/kite/market-breadth", []);
  const bd = bdData as any;

  // ── Auto-refresh every 30 seconds for live breadth data ──
  useEffect(() => {
    const id = setInterval(() => bdRefresh(), 30_000);
    return () => clearInterval(id);
  }, [bdRefresh]);
 
  // India VIX from WebSocket (token 264969, subscribed in kiteWebSocket.js)
  const vixTick = ticks["NSE:INDIA VIX"] as KiteTick | undefined;
  const vixPct  = getPct(vixTick);
 
  // Volatility state label
  const vixState = !vixTick?.last_price ? null
    : vixTick.last_price < 13 ? { label: "Calm",     cls: "text-emerald-500" }
    : vixTick.last_price < 20 ? { label: "Normal",   cls: "text-blue-400"    }
    : vixTick.last_price < 30 ? { label: "Elevated", cls: "text-amber-400"   }
    :                           { label: "Panic",     cls: "text-red-500"     };
 
  const advances  = bd?.advances  ?? null;
  const declines  = bd?.declines  ?? null;
  const unchanged = bd?.unchanged ?? null;
  const total     = advances != null && declines != null ? (advances + declines + (unchanged ?? 0)) : null;
  const advPct    = total ? (advances / total) * 100 : null;
 
  // Market mood
  const adRatio = advances && declines ? advances / declines : null;
  const mood =
    !adRatio   ? null
    : adRatio > 1.5 ? { label: "Risk-On",  cls: l ? "text-emerald-700" : "text-emerald-400", bg: l ? "bg-emerald-50 border-emerald-200" : "bg-emerald-500/10 border-emerald-500/20" }
    : adRatio < 0.7 ? { label: "Risk-Off", cls: l ? "text-red-600"     : "text-red-400",     bg: l ? "bg-red-50 border-red-200"         : "bg-red-500/10 border-red-500/20"         }
    :                 { label: "Neutral",  cls: l ? "text-slate-600"    : "text-slate-400",   bg: l ? "bg-slate-50 border-slate-200"     : "bg-[#1e3a5f]/60 border-[#1e3a5f]/50"     };

  // ── Box definition array — easy to extend ──
  const BREADTH_BOXES = [
    {
      label:   "Market Mood",
      href:    "https://www.nseindia.com/market-data/live-market-indices",
      content: mood
        ? <p className={`text-xl font-black ${mood.cls}`}>{mood.label}</p>
        : <p className={`text-sm font-bold ${tx.t3(l)}`}>—</p>,
      sub:     bd?.ad_ratio ? `A/D ratio ${bd.ad_ratio}` : null,
      bg:      mood?.bg ?? tx.card(l),
    },
    {
      label:   "Advances",
      href:    "https://www.nseindia.com/market-data/live-equity-market",
      content: <p className="text-2xl font-black text-emerald-500 tabular-nums">{advances ?? "—"}</p>,
      sub:     advPct != null ? `${advPct.toFixed(1)}% of total` : null,
      bg:      tx.card(l),
    },
    {
      label:   "Declines",
      href:    "https://www.nseindia.com/market-data/live-equity-market",
      content: <p className="text-2xl font-black text-red-500 tabular-nums">{declines ?? "—"}</p>,
      sub:     total && declines != null ? `${((declines/total)*100).toFixed(1)}% of total` : null,
      bg:      tx.card(l),
    },
    {
      label:   "Unchanged",
      href:    "https://www.nseindia.com/market-data/live-equity-market",
      content: <p className={`text-2xl font-black tabular-nums ${tx.t2(l)}`}>{unchanged ?? "—"}</p>,
      sub:     null,
      bg:      tx.card(l),
    },
    {
      label:   "52W High",
      href:    "https://www.nseindia.com/market-data/52-week-high-equity-market",
      content: <p className="text-2xl font-black text-emerald-600 tabular-nums">{bd?.high_52w ?? "—"}</p>,
      sub:     "Stocks at new high",
      bg:      tx.card(l),
    },
    {
      label:   "52W Low",
      href:    "https://www.nseindia.com/market-data/52-week-low-equity-market",
      content: <p className="text-2xl font-black text-red-600 tabular-nums">{bd?.low_52w ?? "—"}</p>,
      sub:     "Stocks at new low",
      bg:      tx.card(l),
    },
  ];

  return (
    <section className="mb-8">
      <SecHead id="breadth" icon={BarChart3} title="Market Breadth & Volatility"
        sub="Advance · Decline · India VIX · 52-Week H/L" live/>

      {/* ── Breadth Boxes — single scrollable row, all clickable ── */}
      <div className="flex gap-4 mb-3 overflow-x-auto pb-1 scrollbar-none">
        {BREADTH_BOXES.map(box => (
          <a key={box.label}
            href={box.href}
            target="_blank"
            rel="noreferrer"
            className={`flex-none flex flex-col items-center justify-center text-center px-9 py-8 rounded-xl border cursor-pointer hover:opacity-80 active:scale-[0.98] transition-all min-w-[110px] ${box.bg}`}>
            <p className={`text-[9px] font-black uppercase tracking-widest mb-1.5 ${tx.t3(l)}`}>{box.label}</p>
            {bdLoad ? <Skel h="h-7" w="w-16"/> : box.content}
            {!bdLoad && box.sub && (
              <p className={`text-[10px] mt-1 ${tx.t3(l)}`}>{box.sub}</p>
            )}
            {bdLoad && <RefreshCw className={`w-3 h-3 mt-1 animate-spin ${tx.t3(l)}`}/>}
          </a>
        ))}
      </div>
 
      {/* A/D Progress bar */}
      {advPct != null && (
        <div className={`mb-3 rounded-xl overflow-hidden border px-4 py-3 ${tx.card(l)}`}>
          <div className="flex items-center justify-between mb-1.5 text-[10px] font-bold">
            <span className="text-emerald-500">▲ {advances} Advances ({advPct.toFixed(1)}%)</span>
            <span className={tx.t3(l)}>Total: {total}</span>
            <span className="text-red-500">{declines} Declines ▼</span>
          </div>
          <div className={`h-2 rounded-full overflow-hidden flex ${l ? "bg-red-200" : "bg-red-900/30"}`}>
            <div className="h-full bg-emerald-500 rounded-l-full transition-all duration-700" style={{ width: `${advPct}%` }}/>
            {unchanged && total ? (
              <div className={`h-full ${l ? "bg-gray-300" : "bg-gray-600"}`} style={{ width: `${(unchanged / total) * 100}%` }}/>
            ) : null}
          </div>
        </div>
      )}
 
      {/* India VIX */}
      <div className={`rounded-xl border overflow-hidden ${tx.card(l)}`}>
        <div className={`flex items-center justify-between px-4 py-3 border-b ${l ? "border-slate-100" : "border-[#1e3a5f]/50"}`}>
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-400"/>
            <span className={`font-black text-sm ${tx.t1(l)}`}>India VIX</span>
            <span className="text-[9px] font-black text-amber-400 bg-amber-400/10 border border-amber-400/20 px-1.5 py-0.5 rounded">VOLATILITY INDEX</span>
          </div>
          {vixState && (
            <span className={`text-xs font-black ${vixState.cls}`}>{vixState.label}</span>
          )}
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-5 divide-x divide-y sm:divide-y-0">
          {[
            { label: "VIX",        val: vixTick?.last_price,         fmt: (v: number) => v.toFixed(2),                   cls: vixPct != null && vixPct >= 0 ? "text-red-500" : "text-emerald-500" },
            { label: "Change",     val: vixPct,                      fmt: (v: number) => `${v >= 0 ? "+" : ""}${v.toFixed(2)}%`, cls: vixPct != null && vixPct >= 0 ? "text-red-500" : "text-emerald-500" },
            { label: "Open",       val: vixTick?.ohlc?.open,         fmt: (v: number) => v.toFixed(2),                   cls: tx.t1(l) },
            { label: "High",       val: vixTick?.ohlc?.high,         fmt: (v: number) => v.toFixed(2),                   cls: "text-red-500" },
            { label: "Prev Close", val: vixTick?.ohlc?.close,        fmt: (v: number) => v.toFixed(2),                   cls: tx.t2(l) },
          ].map((cell, i) => (
            <div key={cell.label} className={`${l ? "divide-gray-100" : "divide-[#1a2f4a]"} text-center py-3 px-2`}>
              <p className={`text-[9px] font-black uppercase tracking-widest mb-1 ${tx.t3(l)}`}>{cell.label}</p>
              <p className={`font-black tabular-nums text-sm ${cell.cls}`}>
                {cell.val != null ? cell.fmt(cell.val) : "—"}
              </p>
            </div>
          ))}
        </div>
        <div className={`px-4 py-2 text-[10px] border-t ${l ? "border-slate-100 text-slate-400" : "border-[#1e3a5f]/50 text-slate-500"}`}>
          VIX &lt;13: Calm · 13–20: Normal · 20–30: Elevated · &gt;30: Panic · Source: NSE via Kite WebSocket (token 264969)
        </div>
      </div>
    </section>
  );
}
 
 
// ── SECTOR PERFORMANCE DASHBOARD ─────────────────────────────────────────────
function SectorSection({ ticks }: { ticks: any }) {
  const l = useIL();

  // REST fallback quotes for sectors missing from WebSocket
  const [restQuotes, setRestQuotes] = useState<Record<string, any>>({});
  useEffect(() => {
    // Fetch REST quotes for all sector indices — fills gap when WS ticks missing
    const keys = SECTOR_INDICES.map(s => "i=" + encodeURIComponent(s.key)).join("&");
    fetch(`${BASE}/kite/quote?${keys}`)
      .then(r => r.json())
      .then(j => { if (j.status === "success" && j.data) setRestQuotes(j.data); })
      .catch(() => {});
    // Refresh every 30s
    const id = setInterval(() => {
      fetch(`${BASE}/kite/quote?${keys}`)
        .then(r => r.json())
        .then(j => { if (j.status === "success" && j.data) setRestQuotes(j.data); })
        .catch(() => {});
    }, 30_000);
    return () => clearInterval(id);
  }, []);

  const sectors = SECTOR_INDICES.map(s => {
    // Priority: live WS tick → REST quote fallback
    const wsTick = ticks[s.key] as KiteTick | undefined;
    const rq     = restQuotes[s.key];
    // Merge: prefer WS last_price, fall back to REST
    const tick: KiteTick | undefined = wsTick?.last_price != null
      ? wsTick
      : rq
        ? { ...rq, symbol: s.key, instrument_token: s.token, tradable: true, mode: "quote" as const }
        : undefined;
    const pct = getPct(tick);
    return { ...s, tick, pct };
  });

  // Sort by % change (best first), nulls last
  const sorted = [...sectors].sort((a, b) => {
    if (a.pct == null && b.pct == null) return 0;
    if (a.pct == null) return 1;
    if (b.pct == null) return -1;
    return b.pct - a.pct;
  });
  const topSec = sorted.find(s => s.pct != null);
  const botSec = [...sorted].reverse().find(s => s.pct != null);
 
  // Max absolute pct for bar scaling
  const maxAbs = Math.max(...sectors.map(s => Math.abs(s.pct ?? 0)), 1);
 
  return (
    <section className="mb-8">
      <SecHead id="sectors" icon={PieChart} title="Sector Performance"
        sub="10 NSE Sectoral Indices · Live 1D Change" live/>
 
      {/* Top / Bottom chips */}
      <div className="flex flex-wrap gap-2 mb-3">
        {topSec && topSec.pct != null && (
          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-bold ${l ? "bg-emerald-50 border-emerald-200 text-emerald-700" : "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"}`}>
            <TrendingUp className="w-3 h-3"/>Top: {topSec.name} {topSec.pct >= 0 ? "+" : ""}{topSec.pct.toFixed(2)}%
          </div>
        )}
        {botSec && botSec.pct != null && (
          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-bold ${l ? "bg-red-50 border-red-200 text-red-600" : "bg-red-500/10 border-red-500/20 text-red-400"}`}>
            <TrendingDown className="w-3 h-3"/>Lagging: {botSec.name} {botSec.pct >= 0 ? "+" : ""}{botSec.pct.toFixed(2)}%
          </div>
        )}
      </div>
 
      <Card className="overflow-hidden">
        {/* Header — 5 cols: Sector | Value | Change | Vol | Link */}
        <div className={`grid grid-cols-12 px-4 sm:px-5 py-2.5 text-[9px] font-black uppercase tracking-widest ${tx.header(l)} ${tx.t3(l)}`}>
          <div className="col-span-4">Sector</div>
          <div className="col-span-3 text-right">Value</div>
          <div className="col-span-3 text-right">Change</div>
          <div className="col-span-1 text-right hidden sm:block">Vol</div>
          <div className="col-span-1 text-right"></div>
        </div>
        {sorted.map((s, i) => {
          const isPos  = (s.pct ?? 0) >= 0;
          const barPct = s.pct != null ? (Math.abs(s.pct) / maxAbs) * 100 : 0;
          const chg    = getChg(s.tick);
          const vol    = s.tick?.volume;
          // NSE sector-specific stocks page
          const nseUrl = `https://www.nseindia.com/market-data/live-equity-market?symbol=${encodeURIComponent(s.sym)}`;
          return (
            <div key={s.key}
              className={`grid grid-cols-12 px-4 sm:px-5 py-3 items-center relative overflow-hidden
              ${i < sorted.length - 1 ? (l ? "border-b border-slate-100" : "border-b border-[#1e3a5f]/30") : ""}
              ${l ? "hover:bg-slate-50/60" : "hover:bg-white/[0.015]"}`}>
              {/* Background bar */}
              <div
                className={`absolute top-0 bottom-0 ${isPos ? "bg-emerald-500/5" : "bg-red-500/5"}`}
                style={{ left: 0, width: `${barPct * 0.5}%` }}
              />
              {/* Sector name — clickable */}
              <div className="col-span-4 relative z-10 cursor-pointer" onClick={() => window.open(nseUrl, "_blank")}>
                <p className={`font-bold text-xs truncate ${tx.t1(l)}`}>{s.name}</p>
                <p className={`text-[10px] ${tx.t3(l)} hidden sm:block`}>{s.sym}</p>
              </div>
              {/* Value / LTP */}
              <div className={`col-span-3 text-right text-sm font-black tabular-nums relative z-10 ${tx.t1(l)}`}>
                {s.tick?.last_price != null
                  ? fmt(s.tick.last_price, 2)
                  : <span className={`text-xs ${tx.t3(l)}`}>—</span>}
              </div>
              {/* Change % + abs */}
              <div className="col-span-3 text-right relative z-10">
                {s.pct != null ? (
                  <>
                    <p className={`text-xs font-bold tabular-nums ${isPos ? "text-emerald-500" : "text-red-500"}`}>
                      {isPos ? "+" : ""}{s.pct.toFixed(2)}%
                    </p>
                    {chg != null && (
                      <p className={`text-[10px] tabular-nums ${isPos ? "text-emerald-400" : "text-red-400"}`}>
                        {chg >= 0 ? "+" : ""}{fmt(chg)}
                      </p>
                    )}
                  </>
                ) : <span className={`text-xs ${tx.t3(l)}`}>—</span>}
              </div>
              {/* Volume — indices don't have volume via Kite quote mode */}
              <div className={`col-span-1 text-right text-xs tabular-nums relative z-10 hidden sm:block ${tx.t3(l)}`}>
                {vol != null && vol > 0 ? fmtV(vol) : <span className="text-[10px]">N/A</span>}
              </div>
              {/* External link */}
              <div className="col-span-1 text-right relative z-10">
                <a href={nseUrl} target="_blank" rel="noopener noreferrer"
                  onClick={e => e.stopPropagation()}
                  title={`View ${s.name} stocks on NSE`}
                  className={`inline-flex items-center justify-center w-5 h-5 rounded opacity-40 hover:opacity-100 transition-opacity ${l?"text-[#5194F6]":"text-[#5194F6]"}`}>
                  <ExternalLink className="w-3 h-3"/>
                </a>
              </div>
            </div>
          );
        })}
      </Card>
    </section>
  );
}
 
 
// ── TOP GAINERS / LOSERS & MOST ACTIVE ───────────────────────────────────────
function GainersLosersSection() {
  const l = useIL();
  const [tab, setTab] = useState<"gainers" | "losers" | "active">("gainers");
 
  const { data: glData, loading: glLoad, error: glErr, refresh: glRefresh } = useAPI<any>("/kite/gainers-losers", []);
  const { data: maData, loading: maLoad, error: maErr, refresh: maRefresh } = useAPI<any>("/kite/most-active",    []);
 
  const gainers: any[] = glData?.gainers ?? [];
  const losers:  any[] = glData?.losers  ?? [];
  const byVol:   any[] = maData?.by_volume ?? [];
  const byVal:   any[] = maData?.by_value  ?? [];
 
  const rows = tab === "gainers" ? gainers : tab === "losers" ? losers : byVol;
  const isAvailable = tab === "active"
    ? (maData && !maErr)
    : (glData && !glErr);
 
  const loading = tab === "active" ? maLoad : glLoad;
 
  const StockLine = ({ r, rank }: { r: any; rank: number }) => {
    // Support multiple possible field names from different API responses
    const symbol   = r.symbol || r.tradingsymbol || r.sym || "—";
    const name     = r.meta?.company_name || r.companyName || r.name || "";
    const ltp      = r.last_price ?? r.ltp ?? r.lastPrice ?? 0;
    const changePct= r.change_pct ?? r.pChange ?? r.changePercent ?? r.perChange ?? 0;
    const vol      = r.volume ?? r.totalTradedVolume ?? r.totalTradedValue ?? 0;
    const isPos    = (changePct ?? 0) >= 0;
    const nseUrl   = `https://www.nseindia.com/get-quotes/equity?symbol=${encodeURIComponent(symbol)}`;
    return (
      <div
        onClick={() => window.open(nseUrl, "_blank")}
        className={`grid grid-cols-12 items-center px-4 sm:px-5 py-3 text-xs cursor-pointer
        ${rank < rows.length - 1 ? (l ? "border-b border-slate-100" : "border-b border-[#1e3a5f]/30") : ""}
        ${l ? "hover:bg-slate-50/60" : "hover:bg-white/[0.015]"}`}>
        <span className={`col-span-1 text-[10px] font-black text-center shrink-0 ${tx.t3(l)}`}>{rank + 1}</span>
        <div className="col-span-4 min-w-0">
          <p className={`font-black truncate ${tx.t1(l)}`}>{symbol}</p>
          {name && <p className={`text-[10px] truncate ${tx.t3(l)}`}>{name}</p>}
        </div>
        <span className={`col-span-3 tabular-nums font-bold text-right ${tx.t1(l)}`}>{ltp > 0 ? `₹${fmt(ltp)}` : "—"}</span>
        <span className={`col-span-2 tabular-nums font-bold text-right ${isPos ? "text-emerald-500" : "text-red-500"}`}>
          {isPos ? "+" : ""}{changePct != null ? changePct.toFixed(2) : "—"}%
        </span>
        <span className={`col-span-2 tabular-nums text-right hidden sm:block ${tx.t3(l)}`}>{fmtV(vol)}</span>
      </div>
    );
  };
 
  return (
    <section className="mb-8">
      <SecHead id="gainers" icon={TrendingUp} title="Gainers · Losers · Most Active"
        sub="NSE Cash Market · Real-time from NSE API"/>
 
      {/* Tab controls */}
      <div className="flex items-center gap-2 mb-3 flex-wrap">
        {(["gainers", "losers", "active"] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all capitalize ${
              tab === t
                ? t === "gainers" ? "bg-emerald-600 text-white border-transparent"
                  : t === "losers" ? "bg-red-600 text-white border-transparent"
                  : "bg-[#5194F6] text-white border-transparent"
                : l ? "bg-white text-slate-600 border-slate-200" : "bg-[#0c1a2e] text-slate-400 border-[#1e3a5f]/50"
            }`}>
            {t === "gainers" ? "▲ Top Gainers" : t === "losers" ? "▼ Top Losers" : "⚡ Most Active"}
          </button>
        ))}
        <button onClick={tab === "active" ? maRefresh : glRefresh}
          className={`px-2.5 py-1.5 rounded-lg border flex items-center ml-auto ${l ? "bg-white text-slate-600 border-slate-200" : "bg-[#0c1a2e] text-slate-400 border-[#1e3a5f]/50"}`}>
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`}/>
        </button>
      </div>
 
      <Card className="overflow-hidden">
        {/* By-Value subheader for most active */}
        {tab === "active" && (
          <div className={`px-4 sm:px-5 py-2 text-[10px] border-b ${l ? "border-slate-100 text-slate-400" : "border-[#1e3a5f]/50 text-slate-500"}`}>
            By Volume (sorted) · Top 20 NSE stocks
          </div>
        )}
 
        <div className={`grid grid-cols-12 px-4 sm:px-5 py-2.5 text-[9px] font-black uppercase tracking-widest ${tx.header(l)} ${tx.t3(l)}`}>
          <div className="col-span-1">#</div>
          <div className="col-span-4">Symbol</div>
          <div className="col-span-3 text-right">LTP</div>
          <div className="col-span-2 text-right">Change %</div>
          <div className="col-span-2 text-right hidden sm:block">Volume</div>
        </div>
 
        {loading ? (
          <div className="p-4 space-y-2">{[...Array(8)].map((_, i) => <Skel key={i} h="h-10"/>)}</div>
        ) : !isAvailable ? (
          <div className={`p-8 text-center ${tx.t2(l)}`}>
            <Activity className="w-10 h-10 mx-auto mb-3 opacity-20"/>
            <p className="text-sm font-bold">NSE data temporarily unavailable</p>
            <p className="text-xs mt-1 opacity-70">NSE API blocks VPS IPs intermittently. Data will auto-recover.</p>
          </div>
        ) : rows.length === 0 ? (
          <div className={`p-8 text-center text-sm ${tx.t2(l)}`}>
            {tab === "gainers" ? "No gainers data yet — market may be closed" : tab === "losers" ? "No losers data yet" : "No active stocks data"}
          </div>
        ) : rows.map((r: any, i: number) => <StockLine key={r.symbol + i} r={r} rank={i}/>)}
      </Card>
 
      {/* By-value sublist for most active */}
      {tab === "active" && byVal.length > 0 && (
        <div className="mt-3">
          <p className={`text-[10px] font-black uppercase tracking-widest mb-2 ${tx.t3(l)}`}>By Traded Value</p>
          <Card className="overflow-hidden">
            <div className={`grid grid-cols-12 px-4 sm:px-5 py-2.5 text-[9px] font-black uppercase tracking-widest ${tx.header(l)} ${tx.t3(l)}`}>
              <div className="col-span-1">#</div><div className="col-span-4">Symbol</div>
              <div className="col-span-3 text-right">LTP</div><div className="col-span-2 text-right">Chg%</div>
              <div className="col-span-2 text-right hidden sm:block">Value</div>
            </div>
            {byVal.slice(0, 10).map((r: any, i: number) => {
              const symbol   = r.symbol || r.tradingsymbol || r.sym || "—";
              const name     = r.meta?.company_name || r.companyName || r.name || "";
              const ltp      = r.last_price ?? r.ltp ?? 0;
              const changePct= r.change_pct ?? r.pChange ?? r.changePercent ?? 0;
              const isPos    = (changePct ?? 0) >= 0;
              const nseUrl   = `https://www.nseindia.com/get-quotes/equity?symbol=${encodeURIComponent(symbol)}`;
              return (
                <div key={symbol + i}
                  onClick={() => window.open(nseUrl, "_blank")}
                  className={`grid grid-cols-12 px-4 sm:px-5 py-3 items-center text-xs cursor-pointer
                  ${i < 9 ? (l ? "border-b border-slate-100" : "border-b border-[#1e3a5f]/30") : ""}
                  ${l ? "hover:bg-slate-50/60" : "hover:bg-white/[0.015]"}`}>
                  <span className={`col-span-1 text-[10px] font-black ${tx.t3(l)}`}>{i + 1}</span>
                  <div className="col-span-4 min-w-0">
                    <p className={`font-black truncate ${tx.t1(l)}`}>{symbol}</p>
                    {name && <p className={`text-[10px] truncate ${tx.t3(l)}`}>{name}</p>}
                  </div>
                  <div className={`col-span-3 text-right font-bold tabular-nums ${tx.t1(l)}`}>{ltp > 0 ? `₹${fmt(ltp)}` : "—"}</div>
                  <div className={`col-span-2 text-right font-bold tabular-nums ${isPos ? "text-emerald-500" : "text-red-500"}`}>
                    {isPos ? "+" : ""}{changePct?.toFixed(2) ?? "—"}%
                  </div>
                  <div className={`col-span-2 text-right hidden sm:block tabular-nums ${tx.t3(l)}`}>{fmtV(r.value * 1e5)}</div>
                </div>
              );
            })}
          </Card>
        </div>
      )}
    </section>
  );
}
 
 
// ── FII / DII INSTITUTIONAL ACTIVITY ─────────────────────────────────────────
function FiiDiiSection() {
  const l = useIL();
  const { data, loading, error, refresh, meta } = useAPI<any>("/kite/fii-dii", []);
 
  const fii    = data?.fii ?? null;
  const dii    = data?.dii ?? null;
  const source = data?.source ?? meta?.source ?? null;
  const date   = fii?.date ?? dii?.date ?? null;
 
  const Row = ({ label, val, cls }: { label: string; val: number | null; cls?: string }) => (
    <div className={`text-center py-3 ${l ? "border-l border-slate-100 first:border-0" : "border-l border-[#1e3a5f]/30 first:border-0"}`}>
      <p className={`text-[9px] font-black uppercase tracking-widest mb-1 ${tx.t3(l)}`}>{label}</p>
      <p className={`text-sm font-black tabular-nums ${cls ?? tx.t1(l)}`}>
        {val != null ? `₹${fmtV(val)}Cr` : "—"}
      </p>
    </div>
  );
 
  return (
    <section className="mb-8">
      <SecHead id="fii-dii" icon={Building2} title="FII / DII Activity"
        sub={`Institutional Flows · ${source ?? "NSE"}${date ? ` · ${date}` : ""}`}/>
 
      {loading && <Card className="p-4 space-y-2">{[...Array(2)].map((_, i) => <Skel key={i} h="h-14"/>)}</Card>}
 
      {!loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* FII */}
          <Card className="overflow-hidden">
            <div className={`px-4 py-2.5 border-b flex items-center justify-between ${tx.header(l)}`}>
              <span className={`text-xs font-black uppercase tracking-wide ${tx.t1(l)}`}>FII / FPI</span>
              {fii?.net != null && (
                <span className={`text-xs font-black ${fii.net >= 0 ? "text-emerald-500" : "text-red-500"}`}>
                  Net {fii.net >= 0 ? "+" : ""}₹{fmtV(fii.net)}Cr
                </span>
              )}
            </div>
            <div className="grid grid-cols-3">
              <Row label="Buy"  val={fii?.buy}  cls="text-emerald-500"/>
              <Row label="Sell" val={fii?.sell} cls="text-red-500"/>
              <Row label="Net"  val={fii?.net}  cls={fii?.net != null && fii.net >= 0 ? "text-emerald-600" : "text-red-600"}/>
            </div>
          </Card>
 
          {/* DII */}
          <Card className="overflow-hidden">
            <div className={`px-4 py-2.5 border-b flex items-center justify-between ${tx.header(l)}`}>
              <span className={`text-xs font-black uppercase tracking-wide ${tx.t1(l)}`}>DII</span>
              {dii?.net != null && (
                <span className={`text-xs font-black ${dii.net >= 0 ? "text-emerald-500" : "text-red-500"}`}>
                  Net {dii.net >= 0 ? "+" : ""}₹{fmtV(dii.net)}Cr
                </span>
              )}
            </div>
            <div className="grid grid-cols-3">
              <Row label="Buy"  val={dii?.buy}  cls="text-emerald-500"/>
              <Row label="Sell" val={dii?.sell} cls="text-red-500"/>
              <Row label="Net"  val={dii?.net}  cls={dii?.net != null && dii.net >= 0 ? "text-emerald-600" : "text-red-600"}/>
            </div>
          </Card>
        </div>
      )}
 
      {error && !data && (
        <div className={`mt-2 px-4 py-3 rounded-xl border flex items-center gap-2 text-xs ${l ? "bg-amber-50 border-amber-200 text-amber-700" : "bg-amber-500/10 border-amber-500/20 text-amber-400"}`}>
          <AlertCircle className="w-3.5 h-3.5 shrink-0"/>
          NSE/BSE blocked the request. Data will auto-recover. <button onClick={refresh} className="ml-auto underline">Retry</button>
        </div>
      )}
 
      <div className={`mt-2 text-[10px] ${tx.t3(l)}`}>
        Source: {source ?? "NSE/MoneyControl"} · Updated daily post-market · Values in ₹ Crore (net ± = direction of flow)
      </div>
    </section>
  );
}
 
 
// ── PCR + MAX PAIN WIDGET  (add this inside or after OptionsSection) ──────────
function PcrMaxPainWidget({ ticks }: { ticks: any }) {
  const l    = useIL();
  const [name, setName] = useState<"NIFTY" | "BANKNIFTY">("NIFTY");
 
  const { data, loading, error, refresh } = useAPI<any>(`/kite/pcr-maxpain?name=${name}`, [name]);
 
  const spot    = name === "NIFTY"
    ? (ticks["NSE:NIFTY 50"]?.last_price as number | undefined)
    : (ticks["NSE:NIFTY BANK"]?.last_price as number | undefined);
 
  const pcr      = data?.pcr      ?? null;
  const maxPain  = data?.max_pain ?? null;
  const expiry   = data?.expiry   ?? null;
  const totalCE  = data?.total_ce_oi ?? 0;
  const totalPE  = data?.total_pe_oi ?? 0;
  const topCE    = data?.top_ce_strikes ?? [];
  const topPE    = data?.top_pe_strikes ?? [];
 
  // PCR state interpretation
  const pcrState =
    !pcr              ? null
    : pcr > 1.5       ? { label: "Bullish (Oversold puts)", cls: "text-emerald-500" }
    : pcr < 0.7       ? { label: "Bearish (Oversold calls)", cls: "text-red-500" }
    : pcr >= 0.7 && pcr <= 1.0 ? { label: "Neutral / Cautious", cls: "text-amber-400" }
    :                  { label: "Slightly Bullish", cls: "text-emerald-400" };
 
  return (
    <Card className="overflow-hidden mb-4">
      {/* Header */}
      <div className={`flex items-center gap-3 px-5 py-3 border-b ${tx.header(l)}`}>
        <Layers className="w-4 h-4 text-[#5194F6]"/>
        <span className={`font-black text-sm ${tx.t1(l)}`}>PCR · Max Pain</span>
        <div className="flex gap-1.5 ml-2">
          {(["NIFTY", "BANKNIFTY"] as const).map(n => (
            <button key={n} onClick={() => setName(n)}
              className={`px-2.5 py-1 rounded-md text-[11px] font-bold border transition-all ${name === n ? "bg-[#5194F6] text-white border-transparent" : l ? "bg-white text-slate-500 border-slate-200" : "bg-[#0c1a2e] text-slate-400 border-[#1e3a5f]/50"}`}>
              {n}
            </button>
          ))}
        </div>
        {expiry && <span className={`text-[10px] ml-auto ${tx.t3(l)}`}>Expiry: {expiry}</span>}
        <button onClick={refresh}>
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""} ${tx.t3(l)}`}/>
        </button>
      </div>
 
      {loading ? (
        <div className="p-4 space-y-2">{[...Array(3)].map((_, i) => <Skel key={i} h="h-8"/>)}</div>
      ) : error && !data ? (
        <div className={`p-4 text-xs ${tx.t2(l)}`}>⚠ {error}</div>
      ) : (
        <>
          {/* Summary row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 divide-x">
            {[
              { label: "PCR (Put/Call OI)", val: pcr != null ? pcr.toFixed(3) : "—",  cls: pcrState?.cls ?? tx.t1(l) },
              { label: "Max Pain Strike",   val: maxPain ?? "—",                        cls: "text-amber-500 font-black" },
              { label: "Spot vs Max Pain",  val: spot && maxPain ? (spot > maxPain ? `Spot above (${fmt(spot - maxPain, 0)} pts)` : `Spot below (${fmt(maxPain - spot, 0)} pts)`) : "—", cls: spot && maxPain && spot > maxPain ? "text-emerald-500" : "text-red-500" },
              { label: "Total Put OI",      val: fmtV(totalPE),                         cls: "text-red-500" },
            ].map((cell, i) => (
              <div key={cell.label} className={`text-center py-3 px-2 ${l ? "divide-gray-50" : "divide-[#0f1e32]"}`}>
                <p className={`text-[9px] font-black uppercase tracking-widest mb-1 ${tx.t3(l)}`}>{cell.label}</p>
                <p className={`text-sm font-black tabular-nums ${cell.cls}`}>{cell.val}</p>
              </div>
            ))}
          </div>
 
          {pcrState && (
            <div className={`px-5 py-2 border-t text-xs flex items-center gap-2 ${l ? "border-slate-100 bg-slate-50" : "border-[#1e3a5f]/50 bg-[#070e1a]"}`}>
              <span className={`font-bold ${pcrState.cls}`}>● {pcrState.label}</span>
              <span className={`${tx.t3(l)}`}>· PCR &gt;1.0 = more puts = bullish sentiment · Max Pain = gravity for expiry price</span>
            </div>
          )}
 
          {/* Top OI strikes */}
          {(topCE.length > 0 || topPE.length > 0) && (
            <div className="grid grid-cols-2 gap-px border-t">
              {/* Top Call OI */}
              <div>
                <div className={`px-4 py-1.5 text-[9px] font-black uppercase tracking-widest text-emerald-600 ${l ? "bg-emerald-50/60" : "bg-emerald-900/10"}`}>
                  Highest Call OI (Resistance)
                </div>
                {topCE.slice(0, 5).map((s: any, i: number) => (
                  <div key={s.strike} className={`flex items-center justify-between px-4 py-1.5 text-xs ${i < 4 ? (l ? "border-b border-slate-100" : "border-b border-[#1e3a5f]/30") : ""}`}>
                    <span className={`font-bold ${tx.t1(l)}`}>{s.strike}</span>
                    <span className="text-emerald-600 tabular-nums">{fmtV(s.oi)}</span>
                  </div>
                ))}
              </div>
              {/* Top Put OI */}
              <div className={`border-l ${l ? "border-slate-100" : "border-[#1e3a5f]/50"}`}>
                <div className={`px-4 py-1.5 text-[9px] font-black uppercase tracking-widest text-red-500 ${l ? "bg-red-50/60" : "bg-red-900/10"}`}>
                  Highest Put OI (Support)
                </div>
                {topPE.slice(0, 5).map((s: any, i: number) => (
                  <div key={s.strike} className={`flex items-center justify-between px-4 py-1.5 text-xs ${i < 4 ? (l ? "border-b border-slate-100" : "border-b border-[#1e3a5f]/30") : ""}`}>
                    <span className={`font-bold ${tx.t1(l)}`}>{s.strike}</span>
                    <span className="text-red-500 tabular-nums">{fmtV(s.oi)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </Card>
  );
}
 
 
// ── MACRO INDICATORS ──────────────────────────────────────────────────────────
function MacroSection() {
  const l = useIL();
  const { data, loading, error, refresh } = useAPI<any>("/kite/macro", []);
 
  const inrUsd     = data?.inr_usd      ?? null;
  const rbiRate    = data?.rbi_repo_rate ?? null;
  const cpi        = data?.cpi          ?? null;
  const gdp        = data?.gdp          ?? null;
  const bondYield  = data?.bond_yield_10y ?? null;
 
  const cards = [
    {
      label:   "INR / USD",
      val:     inrUsd?.rate    != null ? `₹${inrUsd.rate.toFixed(4)}` : "—",
      sub:     inrUsd?.change_pct != null ? `${inrUsd.change_pct >= 0 ? "+" : ""}${inrUsd.change_pct.toFixed(3)}% today` : null,
      cls:     inrUsd?.change_pct != null && inrUsd.change_pct >= 0 ? "text-red-500" : "text-emerald-500",  // INR weakening = red
      source:  "Yahoo Finance",
    },
    {
      label:   "10Y Bond Yield",
      val:     bondYield != null ? `${bondYield.toFixed(3)}%` : "—",
      sub:     "Government Securities",
      cls:     tx.t1(l),
      source:  "NSE G-Sec",
    },
    {
      label:   "RBI Repo Rate",
      val:     rbiRate != null ? `${rbiRate.toFixed(2)}%` : "—",
      sub:     rbiRate != null ? "Current policy rate" : "Set KITE_RBI_REPO_RATE in .env",
      cls:     tx.t1(l),
      source:  "RBI",
    },
    {
      label:   "CPI Inflation",
      val:     cpi?.value != null ? `${cpi.value.toFixed(2)}%` : "—",
      sub:     cpi?.year  != null ? `FY ${cpi.year}` : null,
      cls:     cpi?.value != null && cpi.value > 6 ? "text-red-500" : cpi?.value != null && cpi.value < 4 ? "text-emerald-500" : tx.t1(l),
      source:  "World Bank",
    },
    {
      label:   "GDP Growth",
      val:     gdp?.value != null ? `${gdp.value.toFixed(2)}%` : "—",
      sub:     gdp?.year  != null ? `FY ${gdp.year}` : null,
      cls:     gdp?.value != null && gdp.value >= 6 ? "text-emerald-500" : tx.t1(l),
      source:  "World Bank",
    },
  ];
 
  return (
    <section className="mb-8">
      <SecHead id="macro" icon={Globe2} title="Macro Indicators"
        sub="INR/USD · RBI Rate · CPI · GDP · Bond Yield"/>
 
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 mb-2">
        {loading
          ? [...Array(5)].map((_, i) => <Skel key={i} h="h-20"/>)
          : cards.map(c => (
            <Card key={c.label} className="px-3 py-3">
              <div className="flex items-start justify-between gap-1 mb-1">
                <p className={`text-[9px] font-black uppercase tracking-widest ${tx.t3(l)}`}>{c.label}</p>
                <span className={`text-[8px] font-bold px-1 py-0.5 rounded border shrink-0 ${l ? "bg-slate-50 text-slate-400 border-slate-100" : "bg-[#0c1a2e] text-slate-500 border-[#1e3a5f]/50"}`}>
                  {c.source}
                </span>
              </div>
              <p className={`text-lg font-black tabular-nums leading-tight ${c.cls}`}>{c.val}</p>
              {c.sub && <p className={`text-[10px] mt-0.5 ${tx.t3(l)}`}>{c.sub}</p>}
            </Card>
          ))}
      </div>
 
      {error && !data && (
        <div className={`px-4 py-3 rounded-xl border flex items-center gap-2 text-xs ${l ? "bg-amber-50 border-amber-200 text-amber-700" : "bg-amber-500/10 border-amber-500/20 text-amber-400"}`}>
          <AlertCircle className="w-3.5 h-3.5 shrink-0"/>Some macro data unavailable — using cached values where possible.
          <button onClick={refresh} className="ml-auto underline">Retry</button>
        </div>
      )}
 
      <div className={`mt-1 text-[10px] ${tx.t3(l)}`}>
        INR/USD: live (Yahoo). Bond yield: NSE G-Sec. CPI/GDP: World Bank annual data. RBI rate: set KITE_RBI_REPO_RATE env var.
      </div>
    </section>
  );
}
 
 
// ── MARKET STATUS WIDGET ──────────────────────────────────────────────────────
// (Add this as a small footer widget within the main render or as a Card in overview)
function MarketStatusWidget({ connected }: { connected: boolean }) {
  const l   = useIL();
  const [now, setNow] = useState(new Date());
  useEffect(() => { const id = setInterval(() => setNow(new Date()), 5000); return () => clearInterval(id); }, []);
 
  const mins     = now.getHours() * 60 + now.getMinutes();
  const isOpen   = mins >= 555 && mins < 930;     // 9:15 AM – 3:30 PM IST
  const isPreOpen = mins >= 540 && mins < 555;    // 9:00 AM – 9:15 AM
  const openAt   = "9:15 AM";
  const closeAt  = "3:30 PM";
 
  const day   = now.getDay();
  const isWeekend = day === 0 || day === 6;
 
  const status = isWeekend ? "Weekend" : isOpen ? "Open" : isPreOpen ? "Pre-Open" : "Closed";
  const statusCls =
    isOpen     ? l ? "text-emerald-700 bg-emerald-50 border-emerald-200"   : "text-emerald-400 bg-emerald-500/10 border-emerald-500/20"
    : isPreOpen ? l ? "text-amber-700 bg-amber-50 border-amber-200"        : "text-amber-400 bg-amber-900/15 border-amber-800/30"
    :             l ? "text-slate-500 bg-slate-50 border-slate-100"           : "text-slate-400 bg-[#0c1a2e]/40 border-[#1e3a5f]/50";
 
  return (
    <div className={`flex flex-wrap items-center gap-3 px-4 py-3 rounded-xl border mb-5 text-xs ${l ? "bg-slate-50 border-slate-100" : "bg-[#0c1a2e] border-[#1e3a5f]/50"}`}>
      <span className={`flex items-center gap-1.5 font-bold px-2.5 py-1 rounded border ${statusCls}`}>
        <span className={`w-1.5 h-1.5 rounded-full ${isOpen ? "bg-emerald-500 animate-pulse" : isPreOpen ? "bg-amber-400 animate-pulse" : "bg-gray-400"}`}/>
        {status}
      </span>
      <span className={`${tx.t2(l)}`}>NSE/BSE · {openAt} – {closeAt} IST · Mon–Fri</span>
      <span className={`${tx.t3(l)} hidden sm:inline`}>Settlement: T+1 · Live ticks: {connected ? "✓ Connected" : "○ Disconnected"}</span>
      <span className={`ml-auto tabular-nums font-mono ${tx.t3(l)}`}>
        {now.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true })} IST
      </span>
    </div>
  );
}
// ══════════════════════════════════════════════════════════════════
// MAIN
// ══════════════════════════════════════════════════════════════════
export default function DomesticView() {
  const l   = useIL();
  const [now, setNow]           = useState(new Date());
  const [activeNav, setActiveNav] = useState("overview");
  const [sidebar, setSidebar]   = useState(false);
  const [searchResult, setSearchResult] = useState<typeof SEARCH_CATALOGUE[0] | null>(null);

  const { ticks: rawTicks, connected, wsError } = useKiteTicks();
  const ticks = useThrottledTicks(rawTicks, 2000);
  const instrCount = useMemo(() => Object.keys(ticks).length, [ticks]);

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const ids = NAV_SECTIONS.map(s => s.id);
    const h = () => {
      for (const id of [...ids].reverse()) {
        const el = document.getElementById(id);
        if (el && el.getBoundingClientRect().top <= 120) { setActiveNav(id); break; }
      }
    };
    window.addEventListener("scroll", h, { passive:true });
    return () => window.removeEventListener("scroll", h);
  }, []);

  const mktOpen = (() => { const m=now.getHours()*60+now.getMinutes(); return m>=555&&m<930; })();

  return (
    <Layout>
      <style>{`
        html{scroll-behavior:smooth}
        .scrollbar-none::-webkit-scrollbar{display:none}
        .scrollbar-none{-ms-overflow-style:none;scrollbar-width:none}
        @media(max-width:480px){
          .xs\\:flex{display:flex}
        }
      `}</style>
      <div className={`min-h-screen ${tx.bg(l)}`}>

        <TickerBar rawTicks={rawTicks}/>

        {/* Top bar */}
        <div className={`sticky top-0 z-20 ${tx.topbar(l)}`}>
          <div className="max-w-[1600px] mx-auto px-4 sm:px-6 py-2 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <button className="lg:hidden p-1.5 rounded-lg border transition-colors"
                style={{ borderColor:l?"#e2e8f0":"#1e3a5f", background:l?"#f9fafb":"rgba(12,26,46,0.6)" }}
                onClick={() => setSidebar(v=>!v)}>
                {sidebar ? <X className={`w-4 h-4 ${tx.t1(l)}`}/> : <Menu className={`w-4 h-4 ${tx.t1(l)}`}/>}
              </button>
              <span className={`text-[9px] font-black px-2 py-1 rounded-md border ${
                mktOpen&&connected
                  ? l?"bg-emerald-50 border-emerald-200 text-emerald-700":"bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                  : l?"bg-slate-50 border-slate-100 text-slate-400":"bg-[#1e3a5f]/40 border-[#1e3a5f]/50 text-slate-500"
              }`}>{mktOpen?(connected?"● LIVE":"○ CONNECTING…"):"MARKET CLOSED"}</span>
              <h1 className={`text-sm font-black hidden sm:block ${tx.t1(l)}`}>
                Indian Markets
              </h1>
            </div>
            {/* ── Search bar ── */}
            <SearchBar rawTicks={rawTicks} onResult={setSearchResult}/>
            <div className="flex items-center gap-2">
              {connected && instrCount>0 && (
                <div className={`flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-md border ${l?"bg-emerald-50 border-emerald-200 text-emerald-700":"bg-emerald-500/10 border-emerald-500/20 text-emerald-400"}`}>
                  <Activity className="w-3 h-3"/>
                  <span className="hidden sm:inline">{instrCount} instruments</span>
                </div>
              )}
              {!connected && (
                <div className={`flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-md border ${l?"bg-red-50 border-red-200 text-red-600":"bg-red-500/10 border-red-500/20 text-red-400"}`}>
                  <WifiOff className="w-3 h-3"/><span className="hidden sm:inline">Disconnected</span>
                </div>
              )}
              <div className={`flex items-center gap-1 text-[10px] ${tx.t3(l)}`}>
                <Clock className="w-3 h-3"/>
                <span className="tabular-nums hidden sm:inline">{now.toLocaleTimeString("en-IN",{hour:"2-digit",minute:"2-digit",second:"2-digit",hour12:true})} IST</span>
              </div>
              {wsError && <span className="text-[10px] text-red-500 hidden md:inline">⚠ {wsError}</span>}
            </div>
          </div>
        </div>

        <div className="max-w-[1600px] mx-auto flex">
          {/* Sidebar — hidden on mobile by default */}
          <aside className={`fixed lg:sticky top-[49px] h-[calc(100vh-49px)] w-52 shrink-0 z-10 transition-transform duration-200 overflow-y-auto ${tx.sidebar(l)} ${sidebar?"translate-x-0":"-translate-x-full lg:translate-x-0"}`}>
            <SideNav active={activeNav} onSelect={id => { setActiveNav(id); setSidebar(false); }} ticks={ticks} connected={connected}/>
          </aside>
          {sidebar && <div className="fixed inset-0 bg-black/50 z-[9] lg:hidden" onClick={() => setSidebar(false)}/>}

          <main className="flex-1 min-w-0 px-4 sm:px-6 lg:px-8 pt-5 pb-12 max-w-5xl">
            {searchResult && (
              <SearchResultCard item={searchResult} onClose={() => setSearchResult(null)} rawTicks={rawTicks}/>
            )}
 
            <MarketStatusWidget connected={connected}/>

            {/* Overview: only show prompt when no stock searched */}
            <div id="overview" className="scroll-mt-24 mb-6">
              {!searchResult && (
                <div className={`flex flex-col items-center justify-center py-10 rounded-2xl border ${tx.card(l)}`}>
                  <Search className={`w-8 h-8 mb-3 opacity-30 ${tx.t3(l)}`}/>
                  <p className={`text-sm font-bold mb-1 ${tx.t1(l)}`}>Search a stock or index to view its chart</p>
                  <p className={`text-xs ${tx.t3(l)}`}>Type in the search bar above — e.g. RELIANCE, TCS, NIFTY 50</p>
                </div>
              )}
            </div>
 
        
            <BreadthVixSection ticks={ticks}/>
 
            
            <IndicesSection ticks={ticks} connected={connected}/>
 
           
            <SectorSection ticks={ticks}/>
 
          
            <StocksSection ticks={ticks}/>
 
           
            <GainersLosersSection/>
 
       
            <DepthSection ticks={ticks}/>
 
     
            <PcrMaxPainWidget ticks={ticks}/>
            <OptionsSection ticks={ticks}/>
 
          
            <FiiDiiSection/>
 
            <HistoricalSection/>
 
        
            <CorporateSection/>
 
          
            <MacroSection/>
          </main>
        </div>
      </div>
    </Layout>
  );
}