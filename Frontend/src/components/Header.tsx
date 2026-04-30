"use client";

import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/controllers/AuthContext";
import React, { useEffect, useRef, useState, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Menu, X, ChevronDown, User, LogOut, Shield, ChevronRight,
  TrendingUp, TrendingDown,
  Sun, Moon, Flame, Package, Globe, Activity, Lightbulb,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useGlobalMarkets } from "@/hooks/useGlobalMarkets";
import { useTheme } from '@/controllers/Themecontext';
import { useKiteTicks } from "@/hooks/useKiteTicks";

// ─── Hook: smooth hover dropdown (no blink) ───────────────────────────────────
function useHoverDropdown(closeDelay = 250) {
  const [open, setOpen] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const enter = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    setOpen(true);
  }, []);

  const leave = useCallback(() => {
    timer.current = setTimeout(() => setOpen(false), closeDelay);
  }, [closeDelay]);

  const toggle = useCallback(() => setOpen((s) => !s), []);
  const close = useCallback(() => setOpen(false), []);

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    []
  );

  return { open, setOpen, enter, leave, toggle, close };
}

// ─── Indian Indices — live via WebSocket ─────────────────────────────────────
const KITE_TICKER_SYMS = [
  { key: "NSE:NIFTY 50", label: "Nifty 50", flag: "🇮🇳" },
  { key: "BSE:SENSEX", label: "Sensex", flag: "🇮🇳" },
  { key: "NSE:NIFTY BANK", label: "Nifty Bank", flag: "🇮🇳" },
  { key: "NSE:NIFTY AUTO", label: "Nifty Auto", flag: "🇮🇳" },

];

interface IndianTick {
  key: string; label: string; flag: string;
  price?: string; change?: number;
}

function useIndianTicker(): IndianTick[] {
  const _API = (import.meta.env.VITE_API_URL || "http://localhost:8000").replace(/\/api\/v1\/?$/, "");
  const API = `${_API}/api/v1`;

  // Shared WebSocket — same connection as DomesticView
  const { ticks: wsTicks } = useKiteTicks();

  // One-time REST seed for instant display before WS warms up
  const [seed, setSeed] = useState<Record<string, { price: number; change: number }>>({});
  useEffect(() => {
    const qs = KITE_TICKER_SYMS.map(s => `i=${encodeURIComponent(s.key)}`).join("&");
    fetch(`${API}/kite/ohlc?${qs}`)
      .then(r => r.ok ? r.json() : fetch(`${API}/kite/quote?${qs}`).then(r2 => r2.json()))
      .then(json => {
        const raw = json?.data || {};
        const map: Record<string, { price: number; change: number }> = {};
        KITE_TICKER_SYMS.forEach(sym => {
          const d = raw[sym.key]; if (!d) return;
          const price = d.last_price ?? d.ohlc?.close ?? null;
          const prev = d.ohlc?.close ?? null;
          const chg = d.change != null ? d.change : price && prev ? ((price - prev) / prev) * 100 : 0;
          if (price != null) map[sym.key] = { price, change: chg ?? 0 };
        });
        setSeed(map);
      })
      .catch(() => { });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return KITE_TICKER_SYMS.map(sym => {
    const ws = wsTicks[sym.key];
    if (ws?.last_price) {
      const prev = ws.ohlc?.close ?? null;
      const chg = ws.change != null && ws.change !== 0 ? ws.change
        : prev && ws.last_price ? ((ws.last_price - prev) / prev) * 100 : 0;
      return { ...sym, price: ws.last_price.toLocaleString("en-IN", { maximumFractionDigits: 2 }), change: chg };
    }
    const r = seed[sym.key];
    return r ? { ...sym, price: r.price.toLocaleString("en-IN", { maximumFractionDigits: 2 }), change: r.change } : { ...sym };
  });
}


const TICKER_CSS = `
@keyframes mktTicker {
  from { transform: translateX(0); }
  to   { transform: translateX(-50%); }
}

.mkt-ticker-strip {
  display: inline-flex;
  align-items: center;
  width: max-content;
  will-change: transform;
  animation: mktTicker 55s linear infinite;
  backface-visibility: hidden;
  transform: translateZ(0);
}

.mkt-ticker-strip:hover {
  animation-play-state: paused;
}
`;
function injectTickerCSS() {
  if (document.getElementById("mkt-ticker-style")) return;
  const el = document.createElement("style");
  el.id = "mkt-ticker-style";
  el.textContent = TICKER_CSS;
  document.head.appendChild(el);

}


function useThrottledMarkets<T extends { symbol?: string; name: string }>(
  live: T[], ms = 400
): T[] {
  const buf = useRef<T[]>(live);
  const [disp, setDisp] = useState<T[]>(live);


  useEffect(() => { buf.current = live; });

  useEffect(() => {
    const id = setInterval(() => {
      setDisp(prev => {
        const next = buf.current;
        if (prev.length !== next.length) return [...next];
        const changed = next.some((item, i) =>
          (item as any).value !== (prev[i] as any).value ||
          (item as any).change !== (prev[i] as any).change
        );
        return changed ? [...next] : prev;
      });
    }, ms);
    return () => clearInterval(id);
  }, [ms]);

  return disp;
}


interface TickerItem {
  symbol: string; name: string; value: string;
  change: string; isPositive: boolean;
  route: "/domestic" | "/global"; flag: string;
  _half: "a" | "b";
}

const TickerStrip = React.memo(({
  items, isLight, onNavigate,
}: {
  items: TickerItem[];
  isLight: boolean;
  onNavigate: (route: string) => void;
}) => (
  <div className="mkt-ticker-strip">
    {items.map((market) => (
      <div
        key={`${market.symbol || market.name}-${market._half}`}
        onClick={() => onNavigate(market.route)}
        title={`View on ${market.route === "/domestic" ? "Domestic" : "Global"} Markets`}

        className="flex items-center gap-4 whitespace-nowrap group hover:opacity-75 transition-opacity cursor-pointer"
        style={{ padding: "0 6px", minWidth: "220px", flexShrink: 0 }}
      >
        <div className="flex items-center gap-2">
          {market.flag && (
            <span className="text-xs opacity-70">{market.flag}</span>
          )}
          <span
            className="text-sm font-medium transition-colors group-hover:text-[#1F5F89]"
            style={{ color: isLight ? "rgba(4,20,33,0.72)" : "rgba(255,255,255,0.70)" }}
          >
            {market.name}
          </span>

          <span
            className="font-bold text-sm"
            style={{
              color: isLight ? "#041421" : "rgba(255,255,255,0.92)",
              display: "inline-block",
              minWidth: "90px",
              textAlign: "right",
            }}
          >
            {market.value}
          </span>
        </div>
        {/* FIX 3c: fixed-width on change badge — same principle */}
        <div
          className={`flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${market.isPositive
              ? isLight
                ? "bg-emerald-100 text-emerald-700 border border-emerald-300/60"
                : "bg-emerald-500/20 text-emerald-300 border border-emerald-400/30"
              : isLight
                ? "bg-red-100 text-red-700 border border-red-300/60"
                : "bg-red-500/20 text-red-300 border border-red-400/30"
            }`}
          style={{ minWidth: "68px", justifyContent: "center" }}
        >
          {market.isPositive ? (
            <TrendingUp className="w-3 h-3" />
          ) : (
            <TrendingDown className="w-3 h-3" />
          )}
          {market.change}
        </div>
        <span style={{ opacity: 0.25, fontSize: 10, color: isLight ? "#36556d" : "#fff" }}>•</span>
      </div>
    ))}
  </div>
));

const MarketTickerInline = React.memo(() => {
  const { data } = useGlobalMarkets();
  const { theme } = useTheme();
  const isLight = theme === "light";
  const navigate = useNavigate();

  // FIX 2: inject CSS exactly once on mount — <style> completely removed from JSX
  useEffect(() => { injectTickerCSS(); }, []);

  // ── Indian data from Kite WebSocket ──────────────────────────────────────
  const indianItems = useIndianTicker();

  // ── Global data from existing hook ───────────────────────────────────────
  const globalMarkets = [
    ...(data?.indices.us || []),
    ...(data?.indices.europe || []),
    ...(data?.indices.asia || []),
  ].map((market) => ({
    symbol: market.symbol,
    name: market.name,
    value: market.price.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
    change: `${market.changePercent > 0 ? "+" : ""}${market.changePercent.toFixed(2)}%`,
    isPositive: market.changePercent >= 0,
    route: "/global" as const,
    flag: "",
  }));

  // ── Merge: Indian first, then Global ─────────────────────────────────────
  const indianFormatted = indianItems.map(item => ({
    symbol: item.key,
    name: item.label,
    value: item.price ?? "···",
    change: item.change != null
      ? `${item.change >= 0 ? "+" : ""}${item.change.toFixed(2)}%`
      : "···",
    isPositive: (item.change ?? 0) >= 0,
    route: "/domestic" as const,
    flag: item.flag,
  }));

  // Throttled display — absorbs rapid WS ticks, flushes every 400ms.
  // Thanks to the memo-guarded setDisp in useThrottledMarkets, this only
  // triggers a re-render of TickerStrip when prices actually change.
  const allMarkets = useThrottledMarkets([...indianFormatted, ...globalMarkets]);

  // FIX 5: stable keys via _half field — never index-based
  // FIX 4: doubled is built regardless of allMarkets.length — strip container
  // is always mounted so the CSS animation is never interrupted
  const doubled: TickerItem[] = [
    ...allMarkets.map(m => ({ ...m, _half: "a" as const })),
    ...allMarkets.map(m => ({ ...m, _half: "b" as const })),
  ];

  // Memoised navigate callback — prevents TickerStrip re-render when
  // MarketTickerInline re-renders due to WS ticks (stable reference)
  const handleNavigate = useCallback((route: string) => navigate(route), [navigate]);

  return (
    // FIX 4: outer container is ALWAYS rendered — animation host never unmounts
    <div style={{ overflow: "hidden", width: "100%" }}>
      {/* TickerStrip is React.memo — only re-renders when doubled/isLight/handleNavigate change */}
      {doubled.length > 0 && (
        <TickerStrip items={doubled} isLight={isLight} onNavigate={handleNavigate} />
      )}
    </div>
  );
});

// ─── Shared dropdown pieces ────────────────────────────────────────────────────
const DropSection = ({ label, theme }: { label: string; theme: "dark" | "light" }) => (
  <p className={`text-[10px] font-bold uppercase tracking-widest px-3 pt-2 pb-0.5 ${theme === "light" ? "text-navy/45" : "text-white/40"
    }`}>{label}</p>
);

const DropLink = ({
  to,
  onClick,
  children,
  theme,
}: {
  to: string;
  onClick?: () => void;
  children: React.ReactNode;
  theme: "dark" | "light";
}) => (
  <DropdownMenuItem asChild>
    <Link
      to={to}
      onClick={onClick}
      className="block px-3 py-1.5 rounded-md text-[13px] font-medium transition cursor-pointer"
      style={{ color: theme === "light" ? "rgba(4,20,33,0.84)" : "rgba(200,223,248,0.84)" }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLElement).style.color = "#1F5F89";
        (e.currentTarget as HTMLElement).style.background = "rgba(10,54,86,0.10)";
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLElement).style.color = theme === "light" ? "rgba(4,20,33,0.84)" : "rgba(200,223,248,0.84)";
        (e.currentTarget as HTMLElement).style.background = "transparent";
      }}
    >
      {children}
    </Link>
  </DropdownMenuItem>
);

const DropBtn = ({
  onClick,
  children,
  theme,
}: {
  onClick: () => void;
  children: React.ReactNode;
  theme: "dark" | "light";
}) => (
  <DropdownMenuItem asChild>
    <button
      onClick={onClick}
      className="w-full text-left px-3 py-1.5 text-[13px] rounded-md font-medium transition cursor-pointer"
      style={{ color: theme === "light" ? "rgba(4,20,33,0.84)" : "rgba(200,223,248,0.84)" }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLElement).style.color = "#1F5F89";
        (e.currentTarget as HTMLElement).style.background = "rgba(10,54,86,0.10)";
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLElement).style.color = theme === "light" ? "rgba(4,20,33,0.84)" : "rgba(200,223,248,0.84)";
        (e.currentTarget as HTMLElement).style.background = "transparent";
      }}
    >
      {children}
    </button>
  </DropdownMenuItem>
);

// ── Commodity tab link — goes to /markets?tab=TAB_ID ──────────────────────────
const CommodityTabLink = ({
  to,
  icon: Icon,
  label,
  desc,
  onClick,
  theme,
}: {
  to: string;
  icon: React.ElementType;
  label: string;
  desc: string;
  onClick?: () => void;
  theme: "dark" | "light";
}) => {
  const navigate = useNavigate();
  return (
    <DropdownMenuItem asChild >
      <button
        onClick={() => { onClick?.(); navigate(to); }}
        className="w-full text-left px-3 py-2 rounded-md transition cursor-pointer flex items-center gap-2.5"
        style={{ color: theme === "light" ? "rgba(4,20,33,0.84)" : "rgba(200,223,248,0.84)" }}
        onMouseEnter={e => {
          (e.currentTarget as HTMLElement).style.color = "#1F5F89";
          (e.currentTarget as HTMLElement).style.background = "rgba(10,54,86,0.10)";
        }}
        onMouseLeave={e => {
          (e.currentTarget as HTMLElement).style.color = theme === "light" ? "rgba(4,20,33,0.84)" : "rgba(200,223,248,0.84)";
          (e.currentTarget as HTMLElement).style.background = "transparent";
        }}
      >
        <div className="w-6 h-6 rounded-md flex items-center justify-center shrink-0"
          style={{ background: "rgba(10,54,86,0.12)" }}>
          <Icon className="w-3.5 h-3.5" style={{ color: "#1F5F89" }} />
        </div>
        <div className="min-w-0">
          <p className="text-[13px] font-medium leading-none">{label}</p>
          <p className="text-[10px] mt-0.5 opacity-60 truncate">{desc}</p>
        </div>
      </button>
    </DropdownMenuItem>
  );
};

// ─── Desktop nav item wrapper — handles hover without blink ───────────────────
const NavItem = ({
  label,
  dd,
  children,
  theme,
  href,
}: {
  label: string;
  dd: ReturnType<typeof useHoverDropdown>;
  children: React.ReactNode;
  theme: "dark" | "light";
  href?: string;
}) => {
  const navigate = useNavigate();
  return (
    <li onMouseEnter={dd.enter} onMouseLeave={dd.leave}>
      <DropdownMenu open={dd.open} onOpenChange={dd.setOpen} modal={false}>
        <DropdownMenuTrigger asChild>
          <button
            className="text-[13.5px] font-medium transition-colors px-2 py-1 rounded-md flex items-center gap-0.5 focus:outline-none whitespace-nowrap"
            style={{ color: theme === "light" ? "#041421" : "#c8dff8" }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = "#1F5F89"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = theme === "light" ? "#041421" : "#c8dff8"; }}
            onClick={() => {
              if (href) { dd.close(); navigate(href); }
              else dd.toggle();
            }}
          >
            {label}
            <ChevronDown
              className={`w-3.5 h-3.5 opacity-60 transition-transform duration-200 ml-0.5 ${dd.open ? "rotate-180" : ""}`}
              onMouseDown={(e) => { e.stopPropagation(); dd.toggle(); }}
            />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="start"
          sideOffset={5}
          onMouseEnter={dd.enter}   
          onMouseLeave={dd.leave}
          onCloseAutoFocus={(e) => e.preventDefault()}
          // onOpenAutoFocus={(e) => e.preventDefault()}
          className={`p-1.5 rounded-xl shadow-lg border backdrop-blur-xl ${theme === "light"
              ? "bg-white/96 text-navy ring-1 ring-black/[0.07] border-slate-200/80"
              : "bg-[#101528]/98 text-white ring-1 ring-[#1C3656]/70 border-[#1C3656]/50"
            }`}
        >
          {children}
        </DropdownMenuContent>
      </DropdownMenu>
    </li>
  );
};

// ─── Touch device detection ───────────────────────────────────────────────────
function isTouchDevice() {
  return window.matchMedia("(hover: none) and (pointer: coarse)").matches;
}

// ─── Header ───────────────────────────────────────────────────────────────────
const Header = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();
  const isLight = theme === "light";

  function scrollToSection(id: string) {
    if (location.pathname === "/team") {
      document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }
    navigate("/team");
    setTimeout(() => {
      document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 120);
  }

  const { isAuthenticated, signOut, user, isAdmin, showToast } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Desktop dropdowns — each has its own smooth hover state
  const about = useHoverDropdown();
  const segments = useHoverDropdown();
  const commodities = useHoverDropdown();
  const dashboards = useHoverDropdown();
  const learn = useHoverDropdown();
  const events = useHoverDropdown();
  const help = useHoverDropdown();
  const userMenu = useHoverDropdown();

  // Mobile accordions
  const [mobileAboutOpen, setMobileAboutOpen] = useState(false);
  const [mobileSegmentsOpen, setMobileSegmentsOpen] = useState(false);
  const [mobileCommodOpen, setMobileCommodOpen] = useState(false);
  const [mobileDashboardsOpen, setMobileDashboardsOpen] = useState(false);
  const [mobileLearnOpen, setMobileLearnOpen] = useState(false);
  const [mobileEventsOpen, setMobileEventsOpen] = useState(false);
  const [mobileHelpOpen, setMobileHelpOpen] = useState(false);

  const closeMobile = () => setIsMobileMenuOpen(false);

  // const getUserInitials = () => {
  //   if (!user?.name) return "U";
  //   const names = user.name.split(" ");
  //   return names.length >= 2
  //     ? `${names[0][0]}${names[1][0]}`.toUpperCase()
  //     : user.name.substring(0, 2).toUpperCase();
  // };
  const getUserInitials = () => {
    const fullName =
      user?.name ||
   
      user?.email ||
      "";
  
    if (!fullName.trim()) return "U";
  
    const cleanName = fullName.trim();
  
    // CamelCase split: InvestBeans -> Invest Beans
    const words = cleanName
      .replace(/([a-z])([A-Z])/g, "$1 $2")
      .split(/\s+/);
  
    // 2+ words => first letters
    if (words.length >= 2) {
      return `${words[0][0]}${words[1][0]}`.toUpperCase();
    }
  
    // Single word => first 2 letters
    return cleanName.substring(0, 2).toUpperCase();
  };
  const handleSignOut = async () => {
    await signOut(() => {
      showToast("Logged out successfully. See you soon!", "success");
      setTimeout(() => navigate("/"), 1000);
    });
  };

  // ── Mobile accordion component ──────────────────────────────────────────────
  const MobileAccordion = ({
    label,
    isOpen,
    toggle,
    children,
  }: {
    label: string;
    isOpen: boolean;
    toggle: () => void;
    children: React.ReactNode;
  }) => (
    <li className="rounded-md overflow-hidden">
      <button
        onClick={toggle}
        className="w-full flex items-center justify-between font-medium py-3 px-3 rounded-md transition-colors"
        style={{ color: isLight ? "#041421" : "#c8dff8" }}
        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = "#1F5F89"; }}
        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = isLight ? "#041421" : "#c8dff8"; }}
      >
        <span>{label}</span>
        <ChevronDown
          className={`w-4 h-4 transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`}
        />
      </button>
      <div
        className={`overflow-hidden transition-[max-height,opacity] duration-200 ease-in-out ${isOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
          }`}
      >
        <div
          className={`rounded-md border px-2 py-2 space-y-0.5 mb-1 ${isLight
              ? "bg-slate-100 border-slate-200"
              : "bg-[#1C3656]/40 border-[#1C3656]/70"
            }`}
        >
          {children}
        </div>
      </div>
    </li>
  );

  const MobileLink = ({ to, children }: { to: string; children: React.ReactNode }) => (
    <Link
      to={to}
      className="block font-medium py-2 px-3 rounded-md text-sm transition-colors"
      style={{ color: isLight ? "rgba(4,20,33,0.82)" : "rgba(200,223,248,0.90)" }}
      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = "#1F5F89"; }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = isLight ? "rgba(4,20,33,0.82)" : "rgba(200,223,248,0.90)"; }}
      onClick={closeMobile}
    >
      {children}
    </Link>
  );

  const MobileSectionLabel = ({ label }: { label: string }) => (
    <p
      className={`text-[10px] font-bold uppercase tracking-widest px-3 pt-2 pb-0.5 ${isLight ? "text-navy/40" : "text-white/30"
        }`}
    >
      {label}
    </p>
  );

  const MobileScrollBtn = ({ id, children }: { id: string; children: React.ReactNode }) => (
    <button
      onClick={() => { scrollToSection(id); closeMobile(); }}
      className="block font-medium py-2 px-3 rounded-md w-full text-left text-sm transition-colors"
      style={{ color: isLight ? "rgba(4,20,33,0.82)" : "rgba(200,223,248,0.90)" }}
      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = "#1F5F89"; }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = isLight ? "rgba(4,20,33,0.82)" : "rgba(200,223,248,0.90)"; }}
    >
      {children}
    </button>
  );

  // ── Theme-aware class helpers ─────────────────────────────────────────────
  const headerBg = isLight
    ? "bg-[#FCFDFE] text-[#041421] shadow-sm border-b border-slate-200/85"
    : "bg-[#041421] text-white shadow-lg border-b border-[#0b314d]/55";

  const tickerBg = isLight
    ? "bg-[#FCFDFE] py-1.5 sm:py-2.5 border-b border-slate-200/85"
    : "bg-[#03111d] py-1.5 sm:py-2.5 border-b border-[#0b314d]/45";

  const mobileBg = isLight
    ? "md:hidden bg-[#FCFDFE] border-t border-slate-200/85"
    : "md:hidden bg-[#041421]/95 border-t border-[#0b314d]/50";

  const userBtnCls = isLight
    ? "p-2.5 rounded-full bg-[#0A3656]/8 hover:bg-[#0A3656]/15 transition-all"
    : "p-2.5 rounded-full bg-[#0A3656]/60 hover:bg-[#0A3656] text-[#9bc1da] transition-all border border-[#0A3656]";

  const userIconCls = isLight ? "text-[#041421]" : "text-[#9bc1da]";

  const dropdownContentCls = isLight
    ? "min-w-[160px] p-2 bg-[#FCFDFE]/96 text-[#041421] rounded-xl shadow-lg ring-1 ring-black/[0.07] border border-slate-200/80 backdrop-blur-xl"
    : "min-w-[160px] p-2 bg-[#041421]/96 text-white rounded-xl shadow-2xl ring-1 ring-[#2a5a7d]/45 border border-[#2a5a7d]/42 backdrop-blur-xl";

  // ── Commodities tab definitions (matching CommoditiesView tabs) ───────────
  const COMMODITY_TABS = [
    { id: "domestic", label: "Domestic Commodities", desc: "MCX · Gold · Silver · Crude · NatGas · Copper", icon: Flame },
    { id: "dom-etfs", label: "Domestic ETFs", desc: "NSE/BSE · AMFI NAV · Gold & Silver ETFs", icon: Package },
    { id: "global", label: "Global Commodities", desc: "CME · COMEX · LME · COT · EIA · OPEC", icon: Globe },
    { id: "global-etfs", label: "Global ETFs", desc: "GLD · SLV · USO · DBC · TIP · PDBC", icon: Activity },
    { id: "intelligence", label: "Intelligence Layer", desc: "Regime · Hedge Engine · Allocation", icon: Lightbulb },
  ];

  return (
    <div className="sticky top-0 z-50">
      {/* ── Market Ticker Bar ── */}
      <div className={tickerBg}>
        <MarketTickerInline />
      </div>

      <header className={`${headerBg} ${isLight ? "backdrop-blur-sm" : ""}`}>
        <nav className="container mx-auto px-3 sm:px-4 md:px-6 py-2 flex items-center justify-between min-h-[52px] sm:min-h-[56px]">

          {/* ── Left: logo + nav ──────────────────────────────────────────── */}
          <div className="flex items-center gap-1.5 sm:gap-3 md:gap-5">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden transition-colors p-1.5 sm:p-2 rounded-md"
              style={{ color: isLight ? "#1e3a5f" : "#c8dff8" }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = "#1F5F89"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = isLight ? "#1e3a5f" : "#c8dff8"; }}
              aria-label="Toggle menu"
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>

            <Link to="/" className="flex items-center shrink-0">
              <div className="relative inline-flex items-center shrink-0">
                <img
                  src={isLight ? "/images/investbeans logo-03.png" : "/images/Untitled-6-04.png"}
                  alt="InvestBeans Logo"
                  className={`h-9 sm:h-9 w-auto max-w-[168px] sm:max-w-[180px] md:max-w-none object-contain relative -top-0.5 transition-all ${!isLight ? " contrast-[1.5]" : ""
                    }`}
                />

              </div>
            </Link>

            {/* Desktop nav list */}
            <ul className="hidden md:flex items-center gap-0.5">

              {/* 1. ABOUT */}
              <NavItem label="About" dd={about} theme={theme} href="/team">
                <div className="min-w-[260px]">
                  <DropBtn theme={theme} onClick={() => { scrollToSection("our-story"); about.close(); }}>Our Story</DropBtn>
                  <DropBtn theme={theme} onClick={() => { scrollToSection("mission"); about.close(); }}>Mission, Vision & Values</DropBtn>
                  <DropBtn theme={theme} onClick={() => { scrollToSection("team-members"); about.close(); }}>Team</DropBtn>
                  <DropBtn theme={theme} onClick={() => { scrollToSection("why-us"); about.close(); }}>Why Us</DropBtn>
                  <DropBtn theme={theme} onClick={() => { scrollToSection("what-we-do"); about.close(); }}>What We Do</DropBtn>
                  <DropBtn theme={theme} onClick={() => { scrollToSection("certifications"); about.close(); }}>Trust and Compliance</DropBtn>
                </div>
              </NavItem>

              {/* 2. SEGMENTS */}
              <NavItem label="Segments" dd={segments} theme={theme}>
                <div className="min-w-[200px]">
                  <DropSection label="Equity" theme={theme} />
                  <DropLink to="/domestic" onClick={segments.close} theme={theme}>Domestic</DropLink>
                  <DropLink to="/global" onClick={segments.close} theme={theme}>Global</DropLink>
                  <DropdownMenuSeparator className="my-1" />
                  <DropSection label="Commodity" theme={theme} />
                  <DropLink to="/markets?tab=domestic" onClick={segments.close} theme={theme}>Domestic</DropLink>
                  <DropLink to="/markets?tab=global" onClick={segments.close} theme={theme}>Global</DropLink>
                  <DropLink to="/currency" onClick={segments.close} theme={theme}>Currency</DropLink>
                </div>
              </NavItem>



              {/* 4. LEARN */}
              <NavItem label="Learn" dd={learn} theme={theme} href="/education">
                <div className="min-w-[180px]">
                  <DropBtn theme={theme} onClick={() => { learn.close(); navigate("/education?section=financial"); }}>Financial</DropBtn>
                  <DropBtn theme={theme} onClick={() => { learn.close(); navigate("/education?section=nonfinancial"); }}>Non-Financial</DropBtn>
                </div>
              </NavItem>

              {/* 5. EVENTS */}
              <NavItem label="Events" dd={events} theme={theme} href="/events">
                <div className="min-w-[175px]">
                  <DropBtn theme={theme} onClick={() => { events.close(); navigate("/events?region=india"); }}>India Events</DropBtn>
                  <DropBtn theme={theme} onClick={() => { events.close(); navigate("/events?region=global"); }}>Global Events</DropBtn>
                  <DropdownMenuSeparator className="my-1" />
                  <DropBtn theme={theme} onClick={() => { events.close(); navigate("/events?section=holidays"); }}>Market Holidays</DropBtn>
                </div>
              </NavItem>

              {/* 6. IPO */}
              <li>
                <Link
                  to="/ipos"
                  className="text-[13.5px] font-medium transition-colors px-2 py-1 rounded-md whitespace-nowrap"
                  style={{ color: isLight ? "#041421" : "#c8dff8" }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = "#1F5F89"; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = isLight ? "#041421" : "#c8dff8"; }}
                >IPO</Link>
              </li>

              {/* 7. BLOGS */}
              <li>
                <Link
                  to="/blogs"
                  className="text-[13.5px] font-medium transition-colors px-2 py-1 rounded-md whitespace-nowrap"
                  style={{ color: isLight ? "#041421" : "#c8dff8" }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = "#1F5F89"; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = isLight ? "#041421" : "#c8dff8"; }}
                >Blogs</Link>
              </li>

              {/* 8. HELP */}
              <li>
                <Link
                  to="/help-center"
                  className="text-[13.5px] font-medium transition-colors px-2 py-1 rounded-md whitespace-nowrap"
                  style={{ color: isLight ? "#041421" : "#c8dff8" }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = "#1F5F89"; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = isLight ? "#041421" : "#c8dff8"; }}
                >Help</Link>
              </li>

            </ul>
          </div>

          {/* ── Right: theme toggle + user menu ──────────────────────────── */}
          <div className="flex items-center gap-1.5 sm:gap-2 md:gap-3">

            <button
              onClick={toggleTheme}
              aria-label={isLight ? "Switch to dark mode" : "Switch to light mode"}
              className={`relative flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-full transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-[#0A3656]/40 ${isLight
                  ? "bg-slate-100 hover:bg-slate-200 text-navy shadow-sm border border-slate-300"
                  : "bg-[#1C3656]/60 hover:bg-[#1C3656] text-[#9bc1da] border border-[#1C3656]"
                }`}
            >
              {isLight ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
            </button>

            {isAuthenticated && user ? (
              <li
                onMouseEnter={() => { if (!isTouchDevice()) userMenu.enter(); }}
                onMouseLeave={() => { if (!isTouchDevice()) userMenu.leave(); }}
                className="list-none"
              >
                <DropdownMenu open={userMenu.open} onOpenChange={userMenu.setOpen} modal={false}>
                  <DropdownMenuTrigger asChild>
                    <button
                      onPointerDown={(e) => {
                        if (e.pointerType === "touch") {
                          e.preventDefault();
                          userMenu.toggle();
                        }
                      }}
                      onClick={() => { if (!isTouchDevice()) userMenu.toggle(); }}
                      className={`relative flex items-center gap-3 p-1.5 rounded-full transition-all focus:outline-none focus:ring-2 focus:ring-[#0A3656]/40 ${isLight ? "hover:bg-navy/8" : "hover:bg-[#1C3656]/60"
                        }`}
                    >
                      {isAdmin && (
                        <span style={{
                          position: "absolute", top: 0, right: 0,
                          width: 16, height: 16, borderRadius: "50%",
                          background: "linear-gradient(135deg,#f59e0b,#d97706)",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          zIndex: 10,
                          border: `2px solid ${isLight ? "white" : "#101528"}`,
                          boxShadow: "0 2px 6px rgba(245,158,11,0.5)",
                        }}>
                          <Shield size={8} color="white" />
                        </span>
                      )}
                      <Avatar className={`h-9 w-9 border-2 ring-2 ${isLight ? "border-slate-300 ring-slate-200" : "border-[#1C3656] ring-[#0A3656]/20"}`}>
                        <AvatarImage src={user?.image} alt={user.name} className="object-cover" />
                        <AvatarFallback className="bg-gradient-to-br from-[#0A3656] to-[#1F5F89] text-white font-semibold">
                          {getUserInitials()}
                        </AvatarFallback>
                      </Avatar>
                      <span className={`hidden md:block text-sm font-medium max-w-[150px] truncate ${isLight ? "text-navy" : "text-white"}`}>
                        {user.name}
                      </span>
                      <ChevronDown className={`hidden md:block w-4 h-4 ${isLight ? "text-navy/60" : "text-white"}`} />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="end"
                    sideOffset={8}
                    onPointerDownOutside={(e) => {
                      if (isTouchDevice()) { e.preventDefault(); userMenu.close(); }
                    }}
                    onInteractOutside={(e) => {
                      if (isTouchDevice()) { e.preventDefault(); userMenu.close(); }
                    }}
                    className={`min-w-[240px] p-2 rounded-xl shadow-xl ring-1 ${isLight ? "bg-white text-navy ring-black/10" : "bg-[#0f1829] text-white ring-white/10"}`}
                  >
                    <div className={`px-3 py-3 border-b ${isLight ? "border-gray-200" : "border-white/10"}`}>
                      <div className="flex items-center gap-3 mb-2">
                        <Avatar className="h-10 w-10 border-2 border-gray-200">
                          <AvatarImage src={user?.image} alt={user.name} className="object-cover" />
                          <AvatarFallback className="bg-gradient-to-br from-[#0A3656] to-[#1F5F89] text-white font-semibold text-sm">
                            {getUserInitials()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-semibold ${isLight ? "text-black" : "text-white"} truncate`}>{user.name}</p>
                          <p className={`text-xs ${isLight ? "text-black" : "text-white"} truncate`}>{user.email}</p>
                        </div>
                      </div>
                      {isAdmin && (
                        <div className="flex items-center gap-1.5 bg-gradient-to-r from-yellow-50 to-amber-50 border border-yellow-200 text-yellow-700 px-2.5 py-1.5 rounded-lg mt-2">
                          <Shield size={14} className="text-yellow-600" />
                          <span className="text-xs font-bold">Admin Access</span>
                        </div>
                      )}
                    </div>

                    {isAdmin && (
                      <>
                        <DropdownMenuSeparator className={`my-1 ${isLight ? "bg-gray-200" : "bg-white/10"}`} />
                        <DropdownMenuItem asChild>
                          <button
                            onClick={() => { userMenu.close(); navigate(import.meta.env.VITE_ADMIN_ROUTE || "/x7-panel"); }}
                            style={{
                              display: "flex", alignItems: "center", gap: 8,
                              width: "100%", padding: "8px 12px", borderRadius: 8,
                              fontSize: 13, fontWeight: 700, cursor: "pointer",
                              border: "none",
                              background: "linear-gradient(135deg,rgba(245,158,11,0.10),rgba(217,119,6,0.06))",
                              color: "#b45309",
                            }}
                          >
                            <div style={{ width: 22, height: 22, borderRadius: 6, background: "rgba(245,158,11,0.18)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                              <Shield size={12} color="#d97706" />
                            </div>
                            Admin Dashboard
                          </button>
                        </DropdownMenuItem>
                      </>
                    )}

                    <DropdownMenuSeparator className={`my-1 ${isLight ? "bg-gray-200" : "bg-white/10"}`} />
                    <DropdownMenuItem asChild>
                      <button
                        onClick={() => { userMenu.close(); handleSignOut(); }}
                        className="flex items-center gap-2 w-full px-3 py-2 rounded-md text-sm font-medium hover:bg-destructive/10 text-destructive transition"
                      >
                        <LogOut className="w-4 h-4" /> Logout
                      </button>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </li>
            ) : (
              <>
                <div className="hidden md:block">
                  <li onMouseEnter={userMenu.enter} onMouseLeave={userMenu.leave} className="list-none">
                    <DropdownMenu open={userMenu.open} onOpenChange={userMenu.setOpen} modal={false}>
                      <DropdownMenuTrigger asChild>
                        <button onClick={userMenu.toggle} className={userBtnCls}>
                          <User className={`w-5 h-5 ${userIconCls}`} />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" sideOffset={8} className={dropdownContentCls}>
                        <DropdownMenuItem asChild>
                          <Link to="/signin" className="block px-3 py-2 rounded-md text-sm font-medium hover:bg-[#1F5F89]/10 hover:text-[#1F5F89] transition" onClick={userMenu.close}>
                            Login
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link to="/signup" className="block px-3 py-2 rounded-md text-sm font-medium hover:bg-[#1F5F89]/10 hover:text-[#1F5F89] transition" onClick={userMenu.close}>
                            Sign up
                          </Link>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </li>
                </div>
                <div className="md:hidden">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className={userBtnCls}>
                        <User className={`w-5 h-5 ${userIconCls}`} />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" sideOffset={8} className={dropdownContentCls}>
                      <DropdownMenuItem asChild>
                        <Link to="/signin" className="block px-3 py-2 rounded-md text-sm font-medium hover:bg-[#1F5F89]/10 hover:text-[#1F5F89] transition">Login</Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link to="/signup" className="block px-3 py-2 rounded-md text-sm font-medium hover:bg-[#1F5F89]/10 hover:text-[#1F5F89] transition">Sign up</Link>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </>
            )}
          </div>
        </nav>

        {/* ── Mobile Menu ───────────────────────────────────────────────────────── */}
        {isMobileMenuOpen && (
          <div className={mobileBg}>
            <div className="container mx-auto px-4 py-4">
              <ul className="space-y-1">

                <MobileAccordion label="About" isOpen={mobileAboutOpen} toggle={() => setMobileAboutOpen(s => !s)}>
                  <MobileScrollBtn id="our-story">Our Story</MobileScrollBtn>
                  <MobileScrollBtn id="mission">Mission, Vision & Values</MobileScrollBtn>
                  <MobileScrollBtn id="team-members">Team</MobileScrollBtn>
                  <MobileScrollBtn id="why-us">Why Us</MobileScrollBtn>
                  <MobileScrollBtn id="what-we-do">What We Do</MobileScrollBtn>
                  <MobileScrollBtn id="certifications">Trust and Compliance</MobileScrollBtn>
                </MobileAccordion>

                <MobileAccordion label="Segments" isOpen={mobileSegmentsOpen} toggle={() => setMobileSegmentsOpen(s => !s)}>
                  <MobileSectionLabel label="Equity" />
                  <MobileLink to="/domestic">Domestic</MobileLink>
                  <MobileLink to="/global">Global</MobileLink>
                  <MobileSectionLabel label="Commodity" />
                  <MobileLink to="/markets?tab=domestic">Domestic</MobileLink>
                  <MobileLink to="/markets?tab=global">Global</MobileLink>
                  <MobileLink to="/currency">Currency</MobileLink>
                </MobileAccordion>


                <MobileAccordion label="Learn" isOpen={mobileLearnOpen} toggle={() => setMobileLearnOpen(s => !s)}>
                  <MobileLink to="/education?section=financial">Financial</MobileLink>
                  <MobileLink to="/education?section=nonfinancial">Non-Financial</MobileLink>
                </MobileAccordion>

                <MobileAccordion label="Events" isOpen={mobileEventsOpen} toggle={() => setMobileEventsOpen(s => !s)}>
                  <MobileLink to="/events?region=india">India Events</MobileLink>
                  <MobileLink to="/events?region=global">Global Events</MobileLink>
                  <MobileLink to="/events?section=holidays">Market Holidays</MobileLink>
                </MobileAccordion>

                <li>
                  <Link
                    to="/ipos"
                    className="block font-medium py-3 px-3 rounded-md transition-colors"
                    style={{ color: isLight ? "rgba(4,20,33,0.90)" : "#c8dff8" }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = "#1F5F89"; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = isLight ? "rgba(4,20,33,0.90)" : "#c8dff8"; }}
                    onClick={closeMobile}
                  >IPO</Link>
                </li>

                <li>
                  <Link
                    to="/blogs"
                    className="block font-medium py-3 px-3 rounded-md transition-colors"
                    style={{ color: isLight ? "rgba(4,20,33,0.90)" : "#c8dff8" }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = "#1F5F89"; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = isLight ? "rgba(4,20,33,0.90)" : "#c8dff8"; }}
                    onClick={closeMobile}
                  >Blogs</Link>
                </li>
                <li>
                  <Link
                    to="/help-center"
                    className="block font-medium py-3 px-3 rounded-md transition-colors"
                    style={{ color: isLight ? "rgba(4,20,33,0.90)" : "#c8dff8" }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = "#1F5F89"; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = isLight ? "rgba(4,20,33,0.90)" : "#c8dff8"; }}
                    onClick={closeMobile}
                  >Help</Link>
                </li>
                {/*                      
                <MobileAccordion label="Help" isOpen={mobileHelpOpen} toggle={() => setMobileHelpOpen(s => !s)}>
                  <MobileLink to="/help-center">FAQs</MobileLink>
                  <MobileLink to="/help-center">Contact Us</MobileLink>
                </MobileAccordion> */}

                {isAuthenticated && (
                  <li className="pt-3">
                    <Button
                      onClick={() => { handleSignOut(); closeMobile(); }}
                      className={`w-full font-semibold transition-all shadow-sm ${isLight
                          ? "bg-navy text-white hover:bg-navy/80"
                          : "bg-[#1C3656] text-[#9bc1da] border border-[#0A3656]/30 hover:bg-[#0A3656] hover:text-white"
                        }`}
                    >
                      Log out
                    </Button>
                  </li>
                )}
              </ul>
            </div>
          </div>
        )}
      </header>
    </div>
  );
};

export default Header;