// Frontend/src/views/Commoditiesview.tsx
// ✅ ZERO icons — text/symbol indicators only
// ✅ 100% real data — Kite MCX (INR live) + Yahoo Finance + AMFI + CFTC COT + EIA
// ✅ 5 tabs: Domestic Commodities | Domestic ETFs | Global Commodities | Global ETFs | Intelligence Layer
// ✅ CleanChart candlestick in every card
// ✅ Full PDF spec coverage

import Layout from "@/components/Layout";
import { useTheme } from "@/controllers/Themecontext";
import { useEffect, useState, useCallback } from "react";
import { useLocation } from "react-router-dom";
import CleanChart from "@/components/CleanChart";

const BASE = (import.meta as any).env?.VITE_API_URL || "http://localhost:8000/api/v1";
const ROOT = BASE.replace(/\/api\/v1\/?$/, "");

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────
interface Quote {
  price: number; prev: number; change: number; changePct: number;
  high: number; low: number; volume: number; currency: string; name: string;
  candles?: { x: number; y: [number, number, number, number] }[];
  inrPrice?: number; inrHigh?: number; inrLow?: number;
}
interface FuturesCurve { type: string; spread: number; color: string; desc: string; }
interface OITrend      { signal: string; color: string; desc: string; trend?: string; }
interface PCR          { pcr: number; sentiment: string; color: string; }
interface COT          { netSpeculative: number; sentiment: string; speculativeLong: number; speculativeShort: number; openInterest: number; reportDate?: string; }
interface ClientPos    { retail: number; hni: number; institutional: number; retailBias: string; hniBias: string; }
interface CycleStage   { label: string; color: string; desc: string; }
interface Seasonal     { Q1: string; Q2: string; Q3: string; Q4: string; best: string; worst: string; }

interface DomesticItem {
  id: string; name: string; flag: string; symbol: string; unit: string; exchange: string;
  importDep: string; correlation: number; seasonal: Seasonal; quote: Quote | null;
  futuresCurve?: FuturesCurve; oiTrend?: OITrend; pcr?: PCR;
  clientPositioning?: ClientPos; cycleStage?: CycleStage; cot?: COT | null;
  basisSpread?: number; dayVolatility?: number; maxDrawdown1Y?: number;
  eventSensitivity?: string[];
  dataSource?: "kite-mcx" | "yahoo-converted";
  openInterest?: number;
}
interface ETFItem {
  id: string; name: string; symbol: string; type: string; category: string;
  expenseRatio: number; benchmark: string; sipSuitable: boolean;
  hedgeEfficiency?: number; allocationBucket?: string; quote: Quote | null;
  nav?: number; premiumDiscount?: number; trackingError?: number;
  rollingReturn1Y?: number; rollingReturn3Y?: number;
  aum?: string; bidAskSpread?: number; liquidityScore?: number;
  allocationSuitability?: { conservative: string; balanced: string; aggressive: string };
}
interface GlobalItem {
  id: string; name: string; flag: string; symbol: string; unit: string;
  exchange: string; cat: string; quote: Quote | null;
  relativeStrength?: number;
  dxyCorrelation?: number;
  cot?: { netSpeculative: number; sentiment: string; openInterest: number } | null;
}
interface GlobalETF {
  id: string; name: string; symbol: string; type: string; category: string;
  exchange: string; expenseRatio: number; aum: string; inception?: string; benchmark?: string;
  quote: Quote | null;
  relativeStrength?: number; maxDrawdown?: number;
  institutionalOwnership?: string; trackingEfficiency?: number; sharpeProxy?: number;
}
interface MacroItem { id: string; name: string; symbol: string; unit: string; quote: Quote | null; }
interface Regime {
  label: string; color: string; emoji: string; desc: string;
  strategy: Record<string, string>; vix: number; yieldCurve: number; y10: number; dxyChange: number;
}
interface HedgeSignal { condition: string; signal: string; action: string; color: string; severity: string; }
interface AllocBucket { label: string; emoji: string; items: string[]; color: string; range: string; desc: string; }
interface EIA { usCrudeInventory: number; inventoryChange: string; rigCount: number; brentWtiSpread: number | null; opecOutput: number; opecCapacityUse: string; }
interface Intelligence {
  regime: Regime;
  geopoliticalRisk: { score: number; label: string; color: string };
  hedgeSignals: HedgeSignal[];
  allocationFramework: Record<string, AllocBucket>;
  eia: EIA;
  macroDrivers: { usCPI: string; fedRateExpectation: string; rbiRate: string; usdInr: number; indianCPI: string };
  silverInflowHistory: { month: string; inflow: number }[];
  goldInflowHistory?: { month: string; inflow: number }[];
  cotSummary: Record<string, { sentiment: string; netSpec: number } | null>;
}
interface AllData {
  domestic: DomesticItem[]; global: GlobalItem[];
  domesticEtfs: ETFItem[]; globalEtfs: GlobalETF[];
  macro: MacroItem[]; intelligence: Intelligence; updatedAt: string;
}
type TabId = "domestic" | "dom-etfs" | "global" | "global-etfs" | "intelligence";

// ─────────────────────────────────────────────────────────────────────────────
// FORMATTERS
// ─────────────────────────────────────────────────────────────────────────────
const fmt    = (n: number | null | undefined, d = 2) =>
  n != null ? n.toLocaleString("en-US", { minimumFractionDigits: d, maximumFractionDigits: d }) : "—";
const fmtINR = (n: number | null | undefined) =>
  n != null ? `₹${n.toLocaleString("en-IN")}` : "—";
const fmtV   = (v: number) => {
  if (!v) return "—";
  if (v >= 1e9) return `${(v / 1e9).toFixed(1)}B`;
  if (v >= 1e6) return `${(v / 1e6).toFixed(1)}M`;
  if (v >= 1e3) return `${(v / 1e3).toFixed(1)}K`;
  return v.toFixed(0);
};
const fmtBig = (n: number) => {
  const a = Math.abs(n);
  if (a >= 1e5) return `${(a / 1e5).toFixed(1)}L`;
  if (a >= 1e3) return `${(a / 1e3).toFixed(1)}K`;
  return a.toFixed(0);
};

// ─────────────────────────────────────────────────────────────────────────────
// THEME
// ─────────────────────────────────────────────────────────────────────────────
const useIL = () => { const { theme } = useTheme(); return theme === "light"; };

const BG    = (l: boolean) => l ? "bg-[#f0f7fe]"   : "bg-[#070e1a]";
const CARD  = (l: boolean) => l ? "bg-white border border-slate-200 shadow-sm" : "bg-[#0c1a2e] border border-[#1e3a5f]/50";
const CARD2 = (l: boolean) => l ? "bg-slate-50 border border-slate-200" : "bg-[#070e1a] border border-[#1e3a5f]/30";
const SB    = (l: boolean) => l ? "bg-white border-r border-slate-200" : "bg-[#070e1a] border-r border-[#1e3a5f]/40";
const TB    = (l: boolean) => l ? "bg-white/96 border-b border-slate-200 backdrop-blur-sm" : "bg-[#040810]/96 border-b border-[#1e3a5f]/50 backdrop-blur-sm";
const T1    = (l: boolean) => l ? "text-slate-900" : "text-white";
const T2    = (l: boolean) => l ? "text-slate-500" : "text-slate-400";
const T3    = (l: boolean) => l ? "text-slate-400" : "text-slate-500";
const DIV   = (l: boolean) => l ? "border-slate-200" : "border-[#1e3a5f]/40";
const posBadge = "bg-emerald-500/15 text-emerald-400 border border-emerald-500/20";
const negBadge = "bg-red-500/15 text-red-400 border border-red-500/20";

// ─────────────────────────────────────────────────────────────────────────────
// SILVER / GOLD INFLOW CHART (shared component)
// ─────────────────────────────────────────────────────────────────────────────
function InflowChart({ data, l }: { data: { month: string; inflow: number }[]; l: boolean }) {
  const now = new Date();
  const currentYear = now.getFullYear().toString();

  const yearData = data.filter(d => d.month.includes(currentYear));
  const displayData = yearData.length > 0 ? yearData : data.slice(-6);

  // Find max absolute value for scaling
  const maxAbs = Math.max(...displayData.map(d => Math.abs(d.inflow)), 1);
  const HALF_H = 100; // half height above and below x-axis
  const CHART_TOTAL = HALF_H * 2; // total chart area height

  return (
    <div>
      {/* Chart area */}
      <div className="relative" style={{ height: CHART_TOTAL + 4 }}>
        {/* X-axis center line */}
        <div
          className="absolute left-0 right-0"
          style={{
            top: HALF_H,
            height: 1,
            background: l ? "rgba(100,116,139,0.4)" : "rgba(148,163,184,0.25)",
            zIndex: 1,
          }}
        />

        {/* Bars */}
        <div className="absolute inset-0 flex items-stretch gap-1 px-0.5">
          {displayData.map((d, i) => {
            const isPos = d.inflow >= 0;
            const barH = Math.max((Math.abs(d.inflow) / maxAbs) * (HALF_H - 4), 3);
            const label = isPos ? "Inflow" : "Outflow";

            return (
              <div key={i} className="flex-1 relative group" style={{ height: CHART_TOTAL }}>
                {/* Tooltip */}
                <div
                  className="absolute left-1/2 -translate-x-1/2 hidden group-hover:flex flex-col items-center z-20 whitespace-nowrap pointer-events-none"
                  style={{ top: isPos ? HALF_H - barH - 36 : HALF_H + barH + 4 }}
                >
                  <div className="text-[10px] px-2 py-1 rounded-md font-semibold leading-tight"
                    style={{
                      background: isPos ? "rgba(37,99,235,0.92)" : "rgba(220,38,38,0.92)",
                      color: "#fff",
                      boxShadow: "0 2px 8px rgba(0,0,0,0.4)",
                    }}
                  >
                    <div>{d.month}</div>
                    <div>{isPos ? "+" : "−"}₹{Math.abs(d.inflow).toFixed(2)}B</div>
                    <div className="text-[9px] opacity-80">{label}</div>
                  </div>
                  {/* arrow */}
                  <div style={{
                    width: 0, height: 0,
                    borderLeft: "4px solid transparent",
                    borderRight: "4px solid transparent",
                    ...(isPos
                      ? { borderTop: `4px solid ${isPos ? "rgba(37,99,235,0.92)" : "rgba(220,38,38,0.92)"}` }
                      : { borderBottom: `4px solid rgba(220,38,38,0.92)`, order: -1 }
                    ),
                  }} />
                </div>

                {/* Positive bar — grows upward from center */}
                {isPos && (
                  <div
                    className="absolute left-0 right-0 rounded-t"
                    style={{
                      bottom: HALF_H,
                      height: barH,
                      background: "linear-gradient(180deg,#60A5FA,#2563EB)",
                      boxShadow: "0 -2px 8px rgba(96,165,250,0.35)",
                    }}
                  />
                )}

                {/* Negative bar — grows downward from center */}
                {!isPos && (
                  <div
                    className="absolute left-0 right-0 rounded-b"
                    style={{
                      top: HALF_H,
                      height: barH,
                      background: "linear-gradient(180deg,#ef4444,#b91c1c)",
                      boxShadow: "0 2px 8px rgba(239,68,68,0.35)",
                    }}
                  />
                )}
              </div>
            );
          })}
        </div>

        {/* Inflow / Outflow axis labels */}
        <div className="absolute left-0 flex flex-col justify-between pointer-events-none" style={{ top: 2, bottom: 2 }}>
          <span className="text-[9px] font-bold text-blue-400 leading-none">Inflow</span>
          <span className="text-[9px] font-bold text-red-400 leading-none">Outflow</span>
        </div>
      </div>

      {/* Month labels */}
      <div className={`flex justify-between text-[10px] mt-1 mb-2 ${T3(l)}`}>
        <span>{displayData[0]?.month}</span>
        {displayData.length > 2 && <span>{displayData[Math.floor(displayData.length / 2)]?.month}</span>}
        <span>{displayData[displayData.length - 1]?.month}</span>
      </div>

      {/* Legend */}
      <div className={`flex items-center gap-4 text-[10px] ${T3(l)}`}>
        <span className="flex items-center gap-1">
          <span className="inline-block w-2.5 h-2.5 rounded-sm" style={{ background: "linear-gradient(180deg,#60A5FA,#2563EB)" }} />
          Inflow
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block w-2.5 h-2.5 rounded-sm" style={{ background: "linear-gradient(180deg,#ef4444,#b91c1c)" }} />
          Outflow
        </span>
        <span className={`ml-auto text-[9px] opacity-60 ${T3(l)}`}>Source: AMFI India (auto-updated monthly)</span>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// COT BAR
// ─────────────────────────────────────────────────────────────────────────────
function COTBar({ cot, l }: { cot: COT | null; l: boolean }) {
  if (!cot) return <p className={`text-xs ${T3(l)}`}>Loading CFTC data…</p>;
  const total   = (cot.speculativeLong || 0) + (cot.speculativeShort || 0);
  const longPct = total > 0 ? (cot.speculativeLong / total) * 100 : 50;
  const bull    = cot.sentiment === "Bullish";
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between text-xs">
        <span className="font-semibold text-emerald-400">Long {fmtBig(cot.speculativeLong)}</span>
        <span className={`font-bold ${bull ? "text-emerald-400" : "text-red-400"}`}>{cot.sentiment}</span>
        <span className="font-semibold text-red-400">Short {fmtBig(cot.speculativeShort)}</span>
      </div>
      <div className="h-2.5 rounded-full overflow-hidden" style={{ background: l ? "#e2e8f0" : "#070e1a" }}>
        <div
          className="h-full rounded-full"
          style={{ width: `${longPct}%`, background: "linear-gradient(90deg,#22c55e,#3b82f6)" }}
        />
      </div>
      <div className={`flex justify-between text-[10px] ${T3(l)}`}>
        <span>{longPct.toFixed(1)}% long</span>
        <span>Net: {cot.netSpeculative > 0 ? "+" : ""}{fmtBig(cot.netSpeculative)} contracts</span>
        {cot.reportDate && <span>{cot.reportDate}</span>}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// DOMESTIC COMMODITY CARD
// FIX: "Unknown" OI badge removed · H:/L: spacing · COT panel no longer causes gaps
// ─────────────────────────────────────────────────────────────────────────────
function DomesticCard({ item }: { item: DomesticItem }) {
  const l   = useIL();
  const q   = item.quote;
  const pos = (q?.changePct ?? 0) >= 0;
  const [open, setOpen] = useState(false);

  return (
    <div className={`rounded-2xl overflow-hidden ${CARD(l)}`}>
      <div className="p-3">
        {/* Header row */}
        <div className="flex items-start justify-between mb-1.5">
          <div>
            <div className="flex items-center gap-2">
              <p className={`text-xs font-black uppercase tracking-widest ${T3(l)}`}>{item.name}</p>
              {item.dataSource === "kite-mcx" ? (
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  Live MCX
                </span>
              ) : (
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30">
                  Yahoo
                </span>
              )}
            </div>
            <p className={`text-[10px] mt-0.5 ${T3(l)}`}>{item.unit} · {item.exchange}</p>
          </div>
          <div className="flex flex-col items-end gap-1">
            <span className={`px-2 py-0.5 rounded-lg text-xs font-bold ${pos ? posBadge : negBadge}`}>
              {pos ? "▲" : "▼"} {q ? `${pos ? "+" : ""}${q.changePct.toFixed(2)}%` : "—"}
            </span>
            {item.cycleStage && (
              <span
                className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                style={{ color: item.cycleStage.color, background: `${item.cycleStage.color}20` }}
              >
                {item.cycleStage.label}
              </span>
            )}
          </div>
        </div>
        {q ? (
          <>
            {/* Price LEFT + H/L/Vol/OI RIGHT — same row */}
            <div className={`flex items-start justify-between gap-2 pb-2 mb-2 border-b ${DIV(l)}`}>
              {/* LEFT: Price + change */}
              <div className="min-w-0">
                <div className={`text-xl font-black tracking-tight leading-none mb-0.5 ${T1(l)}`}>
                  {item.dataSource === "kite-mcx"
                    ? fmtINR(q.inrPrice)
                    : `$${fmt(q.price)}`}
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-sm font-semibold ${pos ? "text-emerald-400" : "text-red-400"}`}>
                    {pos ? "+" : ""}{q.changePct.toFixed(2)}%
                  </span>
                  {item.dataSource === "kite-mcx" && (
                    <span className={`text-xs ${T3(l)}`}>${fmt(q.price)} USD</span>
                  )}
                </div>
              </div>

              {/* RIGHT: H / L / Vol / OI */}
              <div className="grid grid-cols-2 gap-x-3 gap-y-0.5 text-xs shrink-0">
                <span className={T3(l)}>H: <strong className={T1(l)}>
                  {item.dataSource === "kite-mcx"
                    ? fmtINR(q.inrHigh ?? q.high)
                    : `$${fmt(q.high, 1)}`}
                </strong></span>
                <span className={T3(l)}>Vol: <strong className={T1(l)}>{fmtV(q.volume)}</strong></span>
                <span className={T3(l)}>L: <strong className={T1(l)}>
                  {item.dataSource === "kite-mcx"
                    ? fmtINR(q.inrLow ?? q.low)
                    : `$${fmt(q.low, 1)}`}
                </strong></span>
                {item.openInterest != null && item.openInterest > 0 && (
                  <span className={T3(l)}>OI: <strong className="text-[#5194F6]">{fmtBig(item.openInterest)}</strong></span>
                )}
              </div>
            </div>

       {/* {q ? (
          <>
            
            <div className={`text-xl font-black tracking-tight leading-none mb-0.5 ${T1(l)}`}>
              {item.dataSource === "kite-mcx"
                ? fmtINR(q.inrPrice)
                : `$${fmt(q.price)}`}
            </div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className={`text-sm font-semibold ${pos ? "text-emerald-400" : "text-red-400"}`}>
                {pos ? "+" : ""}{q.changePct.toFixed(2)}%
              </span>
              {item.dataSource === "kite-mcx" && (
                <span className={`text-xs ${T3(l)}`}>${fmt(q.price)} USD</span>
              )}
            </div>

           
            <div className={`pb-2 mb-2 border-b ${DIV(l)}`}>
              <div className="grid grid-cols-2 gap-x-3 gap-y-0.5 text-xs mb-1">
                <span className={T3(l)}>H: <strong className={T1(l)}>
                  {item.dataSource === "kite-mcx"
                    ? fmtINR(q.inrHigh ?? q.high)
                    : `$${fmt(q.high, 1)}`}
                </strong></span>
                <span className={T3(l)}>Vol: <strong className={T1(l)}>{fmtV(q.volume)}</strong></span>
                <span className={T3(l)}>L: <strong className={T1(l)}>
                  {item.dataSource === "kite-mcx"
                    ? fmtINR(q.inrLow ?? q.low)
                    : `$${fmt(q.low, 1)}`}
                </strong></span>
                {item.openInterest != null && item.openInterest > 0 && (
                  <span className={T3(l)}>OI: <strong className="text-[#5194F6]">{fmtBig(item.openInterest)}</strong></span>
                )}
              </div>
            </div> */}

            {/* Signal badges — FIX: skip "Unknown" OI signal */}
            <div className="flex flex-wrap gap-1">
              {item.futuresCurve && item.futuresCurve.type !== "Unknown" && (
                <span
                  className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                  style={{ color: item.futuresCurve.color, background: `${item.futuresCurve.color}20` }}
                >
                  {item.futuresCurve.type}
                </span>
              )}
              {item.oiTrend && item.oiTrend.signal !== "Unknown" && (
                <span
                  className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                  style={{ color: item.oiTrend.color, background: `${item.oiTrend.color}20` }}
                >
                  {item.oiTrend.signal}
                </span>
              )}
              {item.pcr && (
                <span
                  className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                  style={{ color: item.pcr.color, background: `${item.pcr.color}20` }}
                >
                  PCR {item.pcr.pcr} · {item.pcr.sentiment}
                </span>
              )}
            </div>
          </>
        ) : (
          <p className={`text-sm py-3 ${T2(l)}`}>Fetching live data…</p>
        )}
      </div>

      {/* CleanChart */}
      {q && (
        <div className="px-2">
          <CleanChart
            name={item.name}
            symbol={item.symbol}
            price={q.price}
            change={q.change}
            changePercent={q.changePct}
            high={q.high}
            low={q.low}
            isPositive={pos}
            candles={q.candles}
            historyUrl={`${ROOT}/api/v1/markets/history/${encodeURIComponent(item.symbol)}`}
          />
        </div>
      )}

      {/* Expand button */}
      <button
        onClick={() => setOpen(o => !o)}
        className={`w-full flex items-center justify-center gap-1.5 py-2 text-xs font-semibold transition-colors ${l ? "bg-slate-50 text-slate-400 hover:text-slate-600" : "bg-[#070e1a]/50 text-slate-600 hover:text-slate-400"}`}
      >
        ▼ COT · Seasonal · Risk Metrics
      </button>

      {/* ── Detail POPUP modal ── */}
      {open && q && (
        <div
          style={{ position: "fixed", inset: 0, zIndex: 999, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}
          onClick={() => setOpen(false)}
        >
          <div
            style={{ width: "100%", maxWidth: 520, maxHeight: "85vh", overflowY: "auto", borderRadius: 20, background: l ? "#ffffff" : "#0c1a2e", border: l ? "1px solid rgba(226,232,240,0.9)" : "1px solid #1e3a5f", padding: 20, boxShadow: "0 24px 64px rgba(0,0,0,0.5)" }}
            onClick={e => e.stopPropagation()}
          >
            {/* Modal header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <div>
                <p className={`text-xs font-black uppercase tracking-widest ${T3(l)}`}>{item.name}</p>
                <p className={`text-base font-black ${T1(l)}`}>COT · Seasonal · Risk Metrics</p>
              </div>
              <button onClick={() => setOpen(false)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 18, lineHeight: 1 }} className={T3(l)}>✕</button>
            </div>

            <div className="space-y-4">
              {/* COT */}
              {item.cot !== undefined && (
                <div>
                  <p className={`text-[10px] font-bold uppercase tracking-widest mb-2 ${T3(l)}`}>CFTC COT Positioning</p>
                  <COTBar cot={item.cot} l={l} />
                </div>
              )}
              {/* Futures curve detail */}
              {item.futuresCurve && item.futuresCurve.type !== "Unknown" && (
                <div className={`p-3 rounded-xl ${CARD2(l)}`}>
                  <div className="flex items-center justify-between mb-1">
                    <p className={`text-[10px] font-bold uppercase tracking-widest ${T3(l)}`}>Futures Curve</p>
                    <span className="text-xs font-bold" style={{ color: item.futuresCurve.color }}>{item.futuresCurve.type}</span>
                  </div>
                  <p className={`text-xs ${T2(l)}`}>{item.futuresCurve.desc}</p>
                  <p className={`text-sm font-bold mt-1 ${T1(l)}`}>Spread: ${item.futuresCurve.spread >= 0 ? "+" : ""}{item.futuresCurve.spread}</p>
                </div>
              )}
              {/* Risk metrics */}
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: "Day Volatility", val: `${item.dayVolatility?.toFixed(2) ?? "—"}%`, color: "" },
                  { label: "Max DD 1Y",      val: `${item.maxDrawdown1Y ?? "—"}%`,              color: "text-red-400" },
                  { label: "Nifty Corr.",    val: `${(item.correlation ?? 0) > 0 ? "+" : ""}${item.correlation}`, color: (item.correlation ?? 0) > 0 ? "text-emerald-400" : "text-red-400" },
                  { label: "Import Dep.",    val: item.importDep,                               color: "" },
                ].map(m => (
                  <div key={m.label} className={`p-2.5 rounded-xl ${CARD2(l)}`}>
                    <p className={`text-[10px] mb-0.5 ${T3(l)}`}>{m.label}</p>
                    <p className={`text-sm font-bold ${m.color || T1(l)}`}>{m.val}</p>
                  </div>
                ))}
              </div>
              {/* Seasonal */}
              {item.seasonal && (
                <div className="grid grid-cols-2 gap-2">
                  <div className={`p-2.5 rounded-xl ${CARD2(l)}`}>
                    <p className={`text-[10px] ${T3(l)}`}>Best months</p>
                    <p className="text-sm font-bold text-emerald-400 mt-0.5">{item.seasonal.best}</p>
                  </div>
                  <div className={`p-2.5 rounded-xl ${CARD2(l)}`}>
                    <p className={`text-[10px] ${T3(l)}`}>Weak months</p>
                    <p className="text-sm font-bold text-red-400 mt-0.5">{item.seasonal.worst}</p>
                  </div>
                </div>
              )}
              {/* Events */}
              {item.eventSensitivity && item.eventSensitivity.length > 0 && (
                <div>
                  <p className={`text-[10px] font-bold uppercase tracking-widest mb-2 ${T3(l)}`}>Event Sensitivity</p>
                  <div className="flex flex-wrap gap-1.5">
                    {item.eventSensitivity.map(e => (
                      <span key={e} className={`text-[10px] px-2.5 py-1 rounded-full ${CARD2(l)} ${T2(l)}`}>{e}</span>
                    ))}
                  </div>
                </div>
              )}
              {/* Client positioning */}
              {item.clientPositioning && (
                <div className={`p-3 rounded-xl ${CARD2(l)}`}>
                  <p className={`text-[10px] font-bold uppercase tracking-widest mb-2 ${T3(l)}`}>Client Category Positioning</p>
                  <div className="grid grid-cols-3 gap-2 text-center text-xs">
                    {[
                      { label: "Retail",        val: `${item.clientPositioning.retail}%`,        bias: item.clientPositioning.retailBias },
                      { label: "HNI",           val: `${item.clientPositioning.hni}%`,            bias: item.clientPositioning.hniBias },
                      { label: "Institutional", val: `${item.clientPositioning.institutional}%`,  bias: "" },
                    ].map(c => (
                      <div key={c.label}>
                        <p className={T3(l)}>{c.label}</p>
                        <p className={`font-bold ${T1(l)}`}>{c.val}</p>
                        {c.bias && <p className="text-[9px] text-[#5194F6]">{c.bias}</p>}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {/* Basis spread */}
              {item.basisSpread != null && (
                <div className={`flex justify-between items-center text-xs p-2.5 rounded-xl ${CARD2(l)}`}>
                  <span className={T3(l)}>Basis Spread (Spot–Futures)</span>
                  <span className={`font-bold ${T1(l)}`}>≈ {fmtINR(item.basisSpread)}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// DOMESTIC ETF CARD
// ─────────────────────────────────────────────────────────────────────────────
function ETFCard({ item }: { item: ETFItem }) {
  const l   = useIL();
  const q   = item.quote;
  const pos = (q?.changePct ?? 0) >= 0;
  const pdColor = (item.premiumDiscount ?? 0) >= 0 ? "#22c55e" : "#ef4444";

  return (
    <div className={`rounded-2xl overflow-hidden ${CARD(l)}`}>
      <div className="p-3">
        <div className="flex items-start justify-between mb-1.5">
          {/* LEFT: type badge + name + symbol */}
          <div className="min-w-0 flex-1 pr-2">
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: "rgba(81,148,246,0.12)", color: "#5194F6" }}>
              {item.type}
            </span>
            <h3 className={`text-sm font-black mt-1.5 leading-tight ${T1(l)}`}>{item.name}</h3>
            <p className={`text-[10px] mt-0.5 ${T3(l)}`}>{item.symbol} · {item.benchmark}</p>
          </div>
          {/* RIGHT: % badge + H/Vol/L stacked */}
          <div className="flex flex-col items-end gap-1 shrink-0">
            {q && (
              <span className={`px-2 py-0.5 rounded-lg text-xs font-bold ${pos ? posBadge : negBadge}`}>
                {pos ? "▲" : "▼"} {q.changePct.toFixed(2)}%
              </span>
            )}
            {q && (
              <p className={`text-[10px] text-right leading-relaxed ${T3(l)}`}>
                H: <strong className={T1(l)}>₹{fmt(q.high)}</strong>
                <span className="mx-1 opacity-30">·</span>
                Vol: <strong className={T1(l)}>{fmtV(q.volume)}</strong>
                <span className="mx-1 opacity-30">·</span>
                L: <strong className={T1(l)}>₹{fmt(q.low)}</strong>
              </p>
            )}
          </div>
        </div>

        {q ? (
          <>
            {/* NAV vs Market Price */}
            {item.nav != null && (
              <div className={`p-2 rounded-xl mb-1.5 ${CARD2(l)}`}>
                <div className={`flex justify-between text-[10px] mb-1.5 ${T3(l)}`}>
                  <span>AMFI NAV (live)</span>
                  <span>Market Price</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className={`text-base font-black ${T1(l)}`}>₹{fmt(item.nav)}</span>
                  <span
                    className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                    style={{ color: pdColor, background: `${pdColor}20` }}
                  >
                    {(item.premiumDiscount ?? 0) >= 0 ? "+" : ""}{item.premiumDiscount?.toFixed(2)}%
                    {(item.premiumDiscount ?? 0) >= 0 ? " Prem." : " Disc."}
                  </span>
                  <span className={`text-base font-black ${T1(l)}`}>₹{fmt(q.price)}</span>
                </div>
              </div>
            )}

            {/* Metrics grid — compact, consistent sizing */}
            <div className="grid grid-cols-3 gap-1 mb-1.5">
              {[
                { label: "Expense",   val: `${item.expenseRatio}%`,                                          color: "" },
                { label: "AUM",       val: item.aum || "—",                                                  color: "#5194F6" },
                { label: "Track Err", val: item.trackingError != null ? `${item.trackingError.toFixed(2)}%` : "—", color: "" },
                { label: "Liquidity", val: item.liquidityScore != null ? `${item.liquidityScore}/10` : "—",  color: "#22c55e" },
                { label: "1Y Return", val: item.rollingReturn1Y != null ? `${item.rollingReturn1Y.toFixed(1)}%` : "—", color: (item.rollingReturn1Y ?? 0) > 0 ? "#22c55e" : "#ef4444" },
                { label: "3Y Return", val: item.rollingReturn3Y != null ? `${item.rollingReturn3Y.toFixed(1)}%` : "—", color: (item.rollingReturn3Y ?? 0) > 0 ? "#22c55e" : "#ef4444" },
              ].map(m => (
                <div key={m.label} className={`p-1.5 rounded-xl flex flex-col items-center justify-center text-center gap-0.5 min-h-[40px] ${CARD2(l)}`}>
                  <p className={`text-[9px] uppercase tracking-wide font-semibold ${T3(l)}`}>{m.label}</p>
                  <p className={`text-xs font-black ${m.color ? "" : T1(l)}`} style={m.color ? { color: m.color } : undefined}>
                    {m.val}
                  </p>
                </div>
              ))}
            </div>


          </>
        ) : (
          <p className={`text-sm py-3 ${T2(l)}`}>Fetching live data…</p>
        )}
      </div>

      {/* CleanChart */}
      {q && (
        <div className="px-2">
          <CleanChart
            name={item.name}
            symbol={item.symbol}
            price={q.price}
            change={q.change}
            changePercent={q.changePct}
            high={q.high}
            low={q.low}
            isPositive={pos}
            candles={q.candles}
            historyUrl={`${ROOT}/api/v1/markets/history/${encodeURIComponent(item.symbol)}`}
          />
        </div>
      )}

      {/* Tags */}
      {q && (
        <div className="px-3 py-2 flex flex-wrap gap-1.5">
          {item.sipSuitable && (
            <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-400">
              SIP Suitable
            </span>
          )}
          {item.hedgeEfficiency != null && (
            <span className="text-[10px] font-bold px-2.5 py-1 rounded-full" style={{ background: "rgba(81,148,246,0.12)", color: "#5194F6" }}>
              Hedge {item.hedgeEfficiency}/100
            </span>
          )}
          {item.allocationBucket && (
            <span className="text-[10px] font-bold px-2.5 py-1 rounded-full" style={{ background: "rgba(139,92,246,0.12)", color: "#8b5cf6" }}>
              {item.allocationBucket}
            </span>
          )}
          {item.allocationSuitability && (
            <span className={`text-[10px] px-2.5 py-1 rounded-full ${CARD2(l)} ${T3(l)}`}>
              Consv: {item.allocationSuitability.conservative}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// GLOBAL COMMODITY CARD — FIX: H:/L: spacing · TradingView link
// ─────────────────────────────────────────────────────────────────────────────
function GlobalCommCard({ item }: { item: GlobalItem }) {
  const l   = useIL();
  const q   = item.quote;
  const pos = (q?.changePct ?? 0) >= 0;

  // Build TradingView URL from symbol (strip =F suffix for futures)
  const tvSymbol = item.symbol.replace(/=F$/, "").replace(/=X$/, "");
  const tvUrl = `https://www.tradingview.com/symbols/${tvSymbol}/`;

  return (
    <div className={`rounded-2xl overflow-hidden ${CARD(l)}`}>
      <div className="p-3">
        <div className="flex items-start justify-between mb-1.5">
          <div>
            <p className={`text-xs font-black uppercase tracking-widest ${T3(l)}`}>{item.name}</p>
            <p className={`text-[10px] mt-0.5 ${T3(l)}`}>{item.unit} · {item.exchange}</p>
          </div>
          <div className="flex flex-col items-end gap-1">
            <span className={`px-2 py-0.5 rounded-lg text-xs font-bold ${pos ? posBadge : negBadge}`}>
              {pos ? "▲" : "▼"} {q ? `${pos ? "+" : ""}${q.changePct.toFixed(2)}%` : "—"}
            </span>
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: "rgba(81,148,246,0.10)", color: "#5194F6" }}>
              {item.cat}
            </span>
          </div>
        </div>

        {q ? (
          <>
            {/* ── Price LEFT  |  H/L/Vol RIGHT ── */}
            <div className="flex items-start justify-between gap-3 mb-1.5">
              {/* Left: big price + change */}
              <div className="min-w-0">
                <div className={`text-xl font-black tracking-tight leading-none mb-0.5 ${T1(l)}`}>
                  ${fmt(q.price)}
                </div>
                <div className={`text-sm font-semibold ${pos ? "text-emerald-400" : "text-red-400"}`}>
                  {pos ? "+" : ""}{fmt(q.change, 3)} today
                </div>
              </div>
              {/* Right: H / L / Vol stacked */}
              <div className={`shrink-0 text-xs space-y-0.5 text-right ${T3(l)}`}>
                <div>H: <strong className={T1(l)}>{fmt(q.high)}</strong></div>
                <div>L: <strong className={T1(l)}>{fmt(q.low)}</strong></div>
                <div>Vol: <strong className={T1(l)}>{fmtV(q.volume)}</strong></div>
              </div>
            </div>

            {/* Badges + TradingView link */}
            <div className={`pt-1.5 border-t ${DIV(l)}`}>
              <div className="flex flex-wrap gap-1 mb-1.5">
                {item.cot && (
                  <span
                    className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                    style={{
                      color: item.cot.sentiment === "Bullish" ? "#22c55e" : "#ef4444",
                      background: `${item.cot.sentiment === "Bullish" ? "#22c55e" : "#ef4444"}20`,
                    }}
                  >
                    COT: {item.cot.sentiment}
                  </span>
                )}
                {item.relativeStrength != null && (
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${item.relativeStrength > 0 ? "bg-emerald-500/15 text-emerald-400" : "bg-red-500/15 text-red-400"}`}>
                    RS vs S&P {item.relativeStrength > 0 ? "+" : ""}{item.relativeStrength}%
                  </span>
                )}
                {item.dxyCorrelation != null && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: "rgba(99,102,241,0.12)", color: "#6366f1" }}>
                    DXY corr. {item.dxyCorrelation}
                  </span>
                )}
              </div>
              <a
                href={tvUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-block text-[10px] font-bold px-2.5 py-1 rounded-full transition-opacity hover:opacity-80"
                style={{ background: "rgba(81,148,246,0.12)", color: "#5194F6" }}
              >
                View on TradingView ↗
              </a>
            </div>
          </>
        ) : (
          <p className={`text-sm py-3 ${T2(l)}`}>Fetching live data…</p>
        )}
      </div>

      {q && (
        <div className="px-2">
          <CleanChart
            name={item.name}
            symbol={item.symbol}
            price={q.price}
            change={q.change}
            changePercent={q.changePct}
            high={q.high}
            low={q.low}
            isPositive={pos}
            candles={q.candles}
            historyUrl={`${ROOT}/api/v1/markets/history/${encodeURIComponent(item.symbol)}`}
          />
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// GLOBAL ETF CARD
// FIX: H:/L: spacing · remove Est. inception tag · aligned metric boxes · TradingView link
// ─────────────────────────────────────────────────────────────────────────────
function GlobalETFCard({ item }: { item: GlobalETF }) {
  const l   = useIL();
  const q   = item.quote;
  const pos = (q?.changePct ?? 0) >= 0;

  const tvUrl = `https://www.tradingview.com/symbols/${item.exchange}-${item.symbol}/`;

  return (
    <div className={`rounded-2xl overflow-hidden ${CARD(l)}`}>
      <div className="p-3">
        <div className="flex items-start justify-between mb-1.5">
          {/* LEFT: category badge + name + symbol */}
          <div className="min-w-0 flex-1 pr-2">
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: "rgba(81,148,246,0.12)", color: "#5194F6" }}>
              {item.category}
            </span>
            <h3 className={`text-sm font-black mt-1 leading-tight ${T1(l)}`}>{item.name}</h3>
            <p className={`text-[10px] mt-0.5 ${T3(l)}`}>{item.symbol} · {item.exchange}</p>
          </div>
          {/* RIGHT: % badge + H/Vol/L stacked */}
          <div className="flex flex-col items-end gap-1 shrink-0">
            {q && (
              <span className={`px-2 py-0.5 rounded-lg text-xs font-bold ${pos ? posBadge : negBadge}`}>
                {pos ? "▲" : "▼"} {q.changePct.toFixed(2)}%
              </span>
            )}
            {q && (
              <p className={`text-[10px] text-right leading-relaxed ${T3(l)}`}>
                H: <strong className={T1(l)}>${fmt(q.high)}</strong>
                <span className="mx-1 opacity-30">·</span>
                Vol: <strong className={T1(l)}>{fmtV(q.volume)}</strong>
                <span className="mx-1 opacity-30">·</span>
                L: <strong className={T1(l)}>${fmt(q.low)}</strong>
              </p>
            )}
          </div>
        </div>

        {q ? (
          <>
            <div className={`text-xl font-black tracking-tight mb-0.5 ${T1(l)}`}>${fmt(q.price)}</div>
            <div className={`text-sm font-semibold mb-1.5 ${pos ? "text-emerald-400" : "text-red-400"}`}>
              {pos ? "+" : ""}${fmt(q.change)} today
            </div>

            {/* Metric boxes — compact 2x2 grid, equal sizing */}
            <div className="grid grid-cols-2 gap-1.5 mb-1.5">
              {[
                { label: "AUM",       val: `$${item.aum}`,                                          color: "#5194F6" },
                { label: "Expense",   val: `${item.expenseRatio}%`,                                  color: "" },
                { label: "Max DD",    val: item.maxDrawdown != null ? `${item.maxDrawdown}%` : "—",  color: "#ef4444" },
                { label: "Inst. Own", val: item.institutionalOwnership || "—",                       color: "" },
              ].map(m => (
                <div key={m.label} className={`p-1.5 rounded-xl flex flex-col items-center justify-center text-center gap-0.5 min-h-[42px] ${CARD2(l)}`}>
                  <p className={`text-[9px] uppercase tracking-wide font-semibold ${T3(l)}`}>{m.label}</p>
                  <p className={`text-sm font-black ${m.color ? "" : T1(l)}`} style={m.color ? { color: m.color } : undefined}>
                    {m.val}
                  </p>
                </div>
              ))}
            </div>
          </>
        ) : (
          <p className={`text-sm py-3 ${T2(l)}`}>Fetching live data…</p>
        )}
      </div>

      {q && (
        <div className="px-2">
          <CleanChart
            name={item.name}
            symbol={item.symbol}
            price={q.price}
            change={q.change}
            changePercent={q.changePct}
            high={q.high}
            low={q.low}
            isPositive={pos}
            candles={q.candles}
            historyUrl={`${ROOT}/api/v1/markets/history/${encodeURIComponent(item.symbol)}`}
          />
        </div>
      )}

      {/* Tags — FIX: removed "Est." inception tag; kept meaningful badges only */}
      {q && (
        <div className="px-3 py-2 flex flex-wrap gap-1.5">
          {item.relativeStrength != null && (
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${item.relativeStrength > 0 ? "bg-emerald-500/15 text-emerald-400" : "bg-red-500/15 text-red-400"}`}>
              RS vs S&P {item.relativeStrength > 0 ? "+" : ""}{item.relativeStrength}%
            </span>
          )}
          {item.trackingEfficiency != null && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: "rgba(81,148,246,0.12)", color: "#5194F6" }}>
              Track Eff. {item.trackingEfficiency}%
            </span>
          )}
          {item.sharpeProxy != null && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: "rgba(139,92,246,0.12)", color: "#8b5cf6" }}>
              Risk-Adj. {item.sharpeProxy > 0 ? "+" : ""}{item.sharpeProxy}
            </span>
          )}
          {/* TradingView link */}
          <a
            href={tvUrl}
            target="_blank"
            rel="noreferrer"
            className="text-[10px] font-bold px-2 py-0.5 rounded-full transition-opacity hover:opacity-80"
            style={{ background: "rgba(81,148,246,0.12)", color: "#5194F6" }}
          >
            TradingView ↗
          </a>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MACRO CARD (DXY, VIX, US10Y, S&P500, US2Y)
// ─────────────────────────────────────────────────────────────────────────────
function MacroCard({ item }: { item: MacroItem }) {
  const l   = useIL();
  const q   = item.quote;
  const pos = (q?.changePct ?? 0) >= 0;
  return (
    <div className={`rounded-xl p-3 ${CARD(l)}`}>
      <p className={`text-[10px] font-bold uppercase tracking-widest mb-1 ${T3(l)}`}>{item.name}</p>
      <div className={`text-lg font-black ${T1(l)}`}>{q ? fmt(q.price) : "—"}</div>
      {q && <div className={`text-xs font-semibold mt-0.5 ${pos ? "text-emerald-400" : "text-red-400"}`}>
        {pos ? "+" : ""}{q.changePct.toFixed(2)}%
      </div>}
      <p className={`text-[10px] mt-1 ${T3(l)}`}>{item.unit}</p>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SECTION HEADER
// ─────────────────────────────────────────────────────────────────────────────
function SecHead({ title, sub }: { title: string; sub: string }) {
  const l = useIL();
  return (
    <div className="mb-6">
      <h2 className={`text-xl font-black ${T1(l)}`}>{title}</h2>
      {sub && <p className={`text-xs mt-1 ${T2(l)}`}>{sub}</p>}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SHOW MORE BUTTON
// ─────────────────────────────────────────────────────────────────────────────
function ShowMoreBtn({ total, limit, showAll, onToggle }: { total: number; limit: number; showAll: boolean; onToggle: () => void }) {
  const l = useIL();
  if (total <= limit) return null;
  return (
    <div className="flex justify-center mt-2">
      <button
        onClick={onToggle}
        className={`text-xs font-bold px-5 py-2 rounded-xl transition-all border ${
          l
            ? "bg-blue-50 text-blue-600 border-blue-100 hover:bg-blue-100"
            : "bg-[#5194F6]/10 text-[#5194F6] border-[#5194F6]/20 hover:bg-[#5194F6]/20"
        }`}
      >
        {showAll ? `Show Less ▲` : `Show More (${total - limit} more) ▼`}
      </button>
    </div>
  );
}


function Skel({ count, cols, h }: { count: number; cols: string; h: string }) {
  const l = useIL();
  return (
    <div className={`grid grid-cols-1 sm:grid-cols-2 ${cols} gap-5`}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className={`rounded-2xl animate-pulse ${h} ${l ? "bg-slate-100" : "bg-[#0c1a2e]/60"}`} />
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TAB CONFIG
// ─────────────────────────────────────────────────────────────────────────────
const TABS: { id: TabId; label: string }[] = [
  { id: "domestic",     label: "Domestic Commodities" },
  { id: "dom-etfs",     label: "Domestic ETFs" },
  { id: "global",       label: "Global Commodities" },
  { id: "global-etfs",  label: "Global ETFs" },
  { id: "intelligence", label: "Intelligence Layer" },
];

// ─────────────────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────────────────
export default function CommoditiesView() {
  const l        = useIL();
  const location = useLocation();

  const getTabFromURL = (): TabId => {
    try {
      const p = new URLSearchParams(location.search);
      const t = p.get("tab") as TabId;
      return TABS.some(x => x.id === t) ? t : "domestic";
    } catch { return "domestic"; }
  };

  const [tab,     setTab]     = useState<TabId>(getTabFromURL);
  const [data,    setData]    = useState<AllData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);
  const [last,    setLast]    = useState<Date | null>(null);
  const [sidebar, setSidebar] = useState(false);

  // Show More state — 4 cards visible initially per section
  const [showAllDomestic,   setShowAllDomestic]   = useState(false);
  const [showAllDomEtfs,    setShowAllDomEtfs]     = useState(false);
  const [showAllGlobal,     setShowAllGlobal]      = useState(false);
  const [showAllGlobalEtfs, setShowAllGlobalEtfs]  = useState(false);
  const CARDS_LIMIT = 4;

  useEffect(() => { setTab(getTabFromURL()); }, [location.search]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const r = await fetch(`${ROOT}/api/v1/commodities/all`);
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      setData(await r.json());
      setLast(new Date());
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const intel  = data?.intelligence;
  const regime = intel?.regime;
  const eia    = intel?.eia;

  return (
    <Layout>
      <div className={`min-h-screen ${BG(l)}`}>

        {/* ── Top bar ──────────────────────────────────────── */}
        <div className={`sticky top-0 z-10 ${TB(l)}`}>
          <div className="flex items-center gap-3 px-4 sm:px-6 py-3">
            <button
              onClick={() => setSidebar(s => !s)}
              className={`lg:hidden px-2 py-1 rounded-lg text-xs font-bold border ${l ? "border-slate-200 text-slate-500" : "border-[#1e3a5f] text-slate-400"}`}
            >
              {sidebar ? "✕" : "≡"}
            </button>
            <h1 className={`text-sm font-bold ${T1(l)}`}>Commodities & ETFs</h1>
            {regime && (
              <span
                className="text-[10px] font-bold px-2.5 py-1 rounded-full hidden sm:block"
                style={{ color: regime.color, background: `${regime.color}18`, border: `1px solid ${regime.color}30` }}
              >
                {regime.emoji} {regime.label}
              </span>
            )}
            <div className="ml-auto flex items-center gap-2">
              {last && (
                <span className={`hidden sm:flex items-center gap-1 text-[10px] ${T3(l)}`}>
                  Updated {last.toLocaleTimeString()}
                </span>
              )}
              <button
                onClick={load}
                disabled={loading}
                className={`text-xs font-bold px-3 py-1.5 rounded-xl transition-all ${l ? "bg-blue-50 text-blue-600 hover:bg-blue-100" : "bg-[#5194F6]/12 text-[#5194F6] hover:bg-[#5194F6]/20"} disabled:opacity-50`}
              >
                {loading ? "Loading…" : "Refresh"}
              </button>
            </div>
          </div>
        </div>

        <div className="flex">

          {/* ── Sidebar ──────────────────────────────────── */}
          <aside
            className={[
              sidebar ? "fixed inset-y-0 left-0 z-20 w-56 pt-14" : "hidden",
              "lg:sticky lg:top-[52px] lg:h-[calc(100vh-52px)] lg:flex lg:flex-col lg:w-52 shrink-0 overflow-y-auto",
              SB(l),
            ].join(" ")}
          >
            <div className="p-4">
              <p className={`text-[9px] font-black uppercase tracking-widest px-2 mb-3 ${T3(l)}`}>Navigate</p>
              {/* FIX: whitespace-nowrap + smaller font to prevent "Domestic Commodities" wrapping */}
              <nav className="space-y-0.5">
                {TABS.map(t => (
                  <button
                    key={t.id}
                    onClick={() => { setTab(t.id); setSidebar(false); }}
                    className={[
                      "w-full flex items-center justify-between px-3 py-2 rounded-xl text-[12px] font-semibold transition-all whitespace-nowrap",
                      tab === t.id
                        ? "bg-[#5194F6] text-white shadow-lg"
                        : l
                          ? "text-slate-600 hover:bg-slate-50"
                          : "text-slate-400 hover:bg-[#0c1a2e] hover:text-white",
                    ].join(" ")}
                  >
                    <span className="truncate">{t.label}</span>
                    {tab === t.id && <span className="text-[10px] ml-1 shrink-0">›</span>}
                  </button>
                ))}
              </nav>

              {/* Regime mini card */}
              {regime && (
                <div
                  className="mt-5 p-3.5 rounded-2xl"
                  style={{ background: `${regime.color}10`, border: `1px solid ${regime.color}28` }}
                >
                  <p className={`text-[9px] font-black uppercase tracking-widest mb-2 ${T3(l)}`}>Regime</p>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full shrink-0" style={{ background: regime.color }} />
                    <p className="text-xs font-bold" style={{ color: regime.color }}>{regime.label}</p>
                  </div>
                  {intel?.geopoliticalRisk && (
                    <p className="text-[10px] font-semibold mt-1.5" style={{ color: intel.geopoliticalRisk.color }}>
                      GRI {intel.geopoliticalRisk.score} · {intel.geopoliticalRisk.label}
                    </p>
                  )}
                  {regime.vix != null && (
                    <p className={`text-[10px] mt-1 ${T3(l)}`}>VIX {fmt(regime.vix, 1)} · 10Y {fmt(regime.y10, 2)}%</p>
                  )}
                </div>
              )}

              {/* Macro quick stats */}
              {data?.macro && data.macro.some(m => m.quote) && (
                <div className={`mt-3 p-3.5 rounded-2xl ${CARD2(l)}`}>
                  <p className={`text-[9px] font-black uppercase tracking-widest mb-2 ${T3(l)}`}>Macro</p>
                  {data.macro.filter(m => m.quote).map(m => (
                    <div key={m.id} className="flex justify-between text-xs mb-1">
                      <span className={T3(l)}>{m.id.toUpperCase()}</span>
                      <span className={`font-bold ${(m.quote!.changePct ?? 0) >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                        {fmt(m.quote!.price)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </aside>

          {sidebar && (
            <div className="fixed inset-0 bg-black/60 z-[9] lg:hidden" onClick={() => setSidebar(false)} />
          )}

          {/* ── Main ─────────────────────────────────────── */}
          <main className="flex-1 min-w-0 px-4 sm:px-6 lg:px-8 pt-7 pb-16">

            {error && (
              <div
                className="mb-5 p-4 rounded-2xl text-sm"
                style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.22)", color: "#ef4444" }}
              >
                Live data error: {error}
              </div>
            )}

            {/* ══ TAB 1: Domestic Commodities ══ */}
            {tab === "domestic" && (
              <div className="space-y-8">
                <SecHead
                  title="Domestic Commodities (MCX)"
              
                />

                {/* FIX: CSS columns layout — cards reflow naturally when one expands,
                    eliminating the blank space that appeared with CSS grid. */}
                {loading && !data ? (
                  <Skel count={4} cols="lg:grid-cols-2" h="h-[380px]" />
                ) : (() => {
                  const all = (data?.domestic ?? []).filter(item => item.quote !== null);
                  const visible = showAllDomestic ? all : all.slice(0, CARDS_LIMIT);
                  return (
                    <>
                      <div className="columns-1 lg:columns-2 gap-6">
                        {visible.map(item => (
                          <div key={item.id} className="break-inside-avoid mb-6">
                            <DomesticCard item={item} />
                          </div>
                        ))}
                      </div>
                      <ShowMoreBtn total={all.length} limit={CARDS_LIMIT} showAll={showAllDomestic} onToggle={() => setShowAllDomestic(s => !s)} />
                    </>
                  );
                })()}

                {/* Macro Linkage — FIX: cards are now clickable links to data sources */}
                {data && (
                  <div className={`rounded-2xl p-5 ${CARD(l)}`}>
                    <div className="mb-4">
                      <h3 className={`text-base font-black ${T1(l)}`}>Macro Linkage — India Specific</h3>
                      <p className={`text-xs mt-1 ${T2(l)}`}>
                        RBI: {intel?.macroDrivers.rbiRate} · USD/INR: ₹{intel?.macroDrivers.usdInr} · India CPI: {intel?.macroDrivers.indianCPI}
                      </p>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {[
                        {
                          t: "RBI Policy Impact",
                          d: `Rate hikes → stronger INR → lower gold import cost. RBI Rate: ${intel?.macroDrivers.rbiRate}`,
                          href: "https://rbi.org.in/Scripts/BS_PressReleaseDisplay.aspx",
                        },
                        {
                          t: "INR Depreciation Effect",
                          d: `Weak rupee raises MCX prices. USD/INR ~₹${intel?.macroDrivers.usdInr}`,
                          href: "https://finance.yahoo.com/quote/USDINR=X",
                        },
                        {
                          t: "Domestic Inflation",
                          d: `India CPI: ${intel?.macroDrivers.indianCPI}. CPI >5% → higher gold & silver demand.`,
                          href: "https://mospi.gov.in/consumer-price-index",
                        },
                        {
                          t: "Import Dependency",
                          d: "India imports ~90% crude & gold — USD/INR is the most critical MCX pricing factor.",
                          href: "https://www.dgft.gov.in/CP/?opt=trade-statistics",
                        },
                      ].map(i => (
                        <a
                          key={i.t}
                          href={i.href}
                          target="_blank"
                          rel="noreferrer"
                          className={`p-3.5 rounded-xl block cursor-pointer hover:opacity-80 transition-opacity ${CARD2(l)}`}
                        >
                          <div className="flex items-center gap-1.5 mb-1">
                            <p className={`text-sm font-bold ${T1(l)}`}>{i.t}</p>
                            <span className="text-[11px] font-bold" style={{ color: "#5194F6" }}>↗</span>
                          </div>
                          <p className={`text-xs leading-relaxed ${T2(l)}`}>{i.d}</p>
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {/* COT Summary — FIX: reduced vertical padding */}
                {intel?.cotSummary && (
                  <div className={`rounded-2xl p-3 ${CARD(l)}`}>
                    <div className="flex items-center justify-between mb-2">
                      <h3 className={`text-base font-black ${T1(l)}`}>CFTC COT Report Summary</h3>
                     
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {Object.entries(intel.cotSummary).map(([key, val]) =>
                        val ? (
                          <div key={key} className={`p-3 rounded-xl ${CARD2(l)}`}>
                            <p className={`text-[10px] font-bold uppercase tracking-widest mb-1.5 ${T3(l)}`}>{key}</p>
                            <p className="text-xl font-black" style={{ color: val.sentiment === "Bullish" ? "#22c55e" : "#ef4444" }}>
                              {val.sentiment}
                            </p>
                            <p className={`text-xs mt-1 ${T3(l)}`}>Net: {val.netSpec > 0 ? "+" : ""}{fmtBig(val.netSpec)} contracts</p>
                          </div>
                        ) : null
                      )}
                    </div>
                  </div>
                )}

                {/* Macro indicators row */}
                {data?.macro && data.macro.some(m => m.quote) && (
                  <div>
                    <h3 className={`text-sm font-black mb-3 ${T1(l)}`}>Global Macro Indicators</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                      {data.macro.map(item => (
                        <MacroCard key={item.id} item={item} />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ══ TAB 2: Domestic ETFs ══ */}
            {tab === "dom-etfs" && (
              <div className="space-y-8">
                <SecHead
                  title="Domestic ETFs (NSE / BSE)"
                 
                />

                {loading && !data ? (
                  <Skel count={4} cols="lg:grid-cols-2" h="h-[400px]" />
                ) : (() => {
                  const all = (data?.domesticEtfs ?? []).filter(item => item.quote !== null);
                  const visible = showAllDomEtfs ? all : all.slice(0, CARDS_LIMIT);
                  return (
                    <>
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-start">
                        {visible.map(item => (
                          <ETFCard key={item.id} item={item} />
                        ))}
                      </div>
                      <ShowMoreBtn total={all.length} limit={CARDS_LIMIT} showAll={showAllDomEtfs} onToggle={() => setShowAllDomEtfs(s => !s)} />
                    </>
                  );
                })()}

                {/* Silver ETF Inflow chart */}
                {intel?.silverInflowHistory && intel.silverInflowHistory.length > 0 && (
                  <div className={`rounded-2xl p-5 ${CARD(l)}`}>
                    <div className="mb-4 flex items-start justify-between">
                      <div>
                        <h3 className={`text-base font-black ${T1(l)}`}>Silver ETF Monthly Inflows</h3>
                        <p className={`text-xs mt-1 ${T2(l)}`}>
                          Inflow in billion rupees · Source: <a href="https://www.amfiindia.com/research-information" target="_blank" rel="noreferrer" className="underline" style={{ color: "#5194F6" }}>AMFI India ↗</a>
                        </p>
                      </div>
                    </div>
                    <InflowChart data={intel.silverInflowHistory} l={l} />
                  </div>
                )}

                {/* Gold ETF Inflow chart — renders only when backend sends goldInflowHistory */}
                {intel?.goldInflowHistory && intel.goldInflowHistory.length > 0 && (
                  <div className={`rounded-2xl p-5 ${CARD(l)}`}>
                    <div className="mb-4 flex items-start justify-between">
                      <div>
                        <h3 className={`text-base font-black ${T1(l)}`}>Gold ETF Monthly Inflows</h3>
                        <p className={`text-xs mt-1 ${T2(l)}`}>
                          Inflow in billion rupees · Source:{" "}
                          <a href="https://www.amfiindia.com/research-information" target="_blank" rel="noreferrer" className="underline" style={{ color: "#5194F6" }}>
                            AMFI India ↗
                          </a>
                        </p>
                      </div>
                    </div>
                    <InflowChart data={intel.goldInflowHistory} l={l} />
                  </div>
                )}

                {/* ETF Summary table */}
                {data?.domesticEtfs && data.domesticEtfs.length > 0 && (
                  <div className={`rounded-2xl p-5 ${CARD(l)}`}>
                    <h3 className={`text-base font-black mb-4 ${T1(l)}`}>ETF Comparison</h3>
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className={`${T3(l)} text-left`}>
                            <th className="pb-3 font-bold pr-4">ETF</th>
                            <th className="pb-3 font-bold pr-4">NAV</th>
                            <th className="pb-3 font-bold pr-4">Price</th>
                            <th className="pb-3 font-bold pr-4">1Y Return</th>
                            <th className="pb-3 font-bold pr-4">Expense</th>
                            <th className="pb-3 font-bold pr-4">AUM</th>
                            <th className="pb-3 font-bold">SIP</th>
                          </tr>
                        </thead>
                        <tbody className={`divide-y ${DIV(l)}`}>
                          {data.domesticEtfs.filter(e => e.quote).map(e => (
                            <tr key={e.id}>
                              <td className={`py-2.5 pr-4 font-bold ${T1(l)}`}>{e.name}</td>
                              <td className={`py-2.5 pr-4 ${T1(l)}`}>{e.nav ? `₹${fmt(e.nav)}` : "—"}</td>
                              <td className={`py-2.5 pr-4 ${T1(l)}`}>₹{fmt(e.quote!.price)}</td>
                              <td className={`py-2.5 pr-4 font-bold ${(e.rollingReturn1Y ?? 0) >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                                {e.rollingReturn1Y != null ? `${e.rollingReturn1Y >= 0 ? "+" : ""}${e.rollingReturn1Y.toFixed(1)}%` : "—"}
                              </td>
                              <td className={`py-2.5 pr-4 ${T2(l)}`}>{e.expenseRatio}%</td>
                              <td className={`py-2.5 pr-4`} style={{ color: "#5194F6" }}>{e.aum || "—"}</td>
                              <td className={`py-2.5 ${e.sipSuitable ? "text-emerald-400" : T3(l)}`}>
                                {e.sipSuitable ? "Yes" : "No"}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ══ TAB 3: Global Commodities ══ */}
            {tab === "global" && (
              <div className="space-y-8">
                <SecHead
                  title="Global Commodities"
                 
                />
                {loading && !data ? (
                  <Skel count={4} cols="lg:grid-cols-2" h="h-[300px]" />
                ) : (() => {
                  const all = (data?.global ?? []).filter(item => item.quote !== null);
                  const visible = showAllGlobal ? all : all.slice(0, CARDS_LIMIT);
                  return (
                    <>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 items-start">
                        {visible.map(item => (
                          <GlobalCommCard key={item.id} item={item} />
                        ))}
                      </div>
                      <ShowMoreBtn total={all.length} limit={CARDS_LIMIT} showAll={showAllGlobal} onToggle={() => setShowAllGlobal(s => !s)} />
                    </>
                  );
                })()}

                {/* EIA / OPEC detail */}
                {eia && (
                  <div className={`rounded-2xl p-5 ${CARD(l)}`}>
                    <h3 className={`text-base font-black mb-4 ${T1(l)}`}>EIA Crude Inventory · OPEC Output</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                      {[
                        { label: "US Crude Inventory",   val: `${eia.usCrudeInventory}M bbl`, color: "" },
                        { label: "WoW Change",           val: `${eia.inventoryChange}M bbl`,   color: parseFloat(eia.inventoryChange) < 0 ? "#22c55e" : "#ef4444" },
                        { label: "US Rig Count",         val: `${eia.rigCount} rigs`,           color: "" },
                        { label: "OPEC Output",          val: `${eia.opecOutput}M b/d`,         color: "" },
                        { label: "OPEC Capacity Use",    val: eia.opecCapacityUse,              color: "" },
                      ].map(m => (
                        <div key={m.label} className={`p-3.5 rounded-xl ${CARD2(l)}`}>
                          <p className={`text-[10px] mb-1 ${T3(l)}`}>{m.label}</p>
                          <p className={`text-lg font-black ${m.color ? "" : T1(l)}`} style={m.color ? { color: m.color } : undefined}>{m.val}</p>
                        </div>
                      ))}
                    </div>
                    {eia.brentWtiSpread != null && (
                      <div className={`mt-3 flex items-center justify-between px-4 py-3 rounded-xl ${CARD2(l)}`}>
                        <span className={`text-sm ${T2(l)}`}>Brent–WTI Spread</span>
                        <span className={`text-lg font-black ${T1(l)}`}>${fmt(eia.brentWtiSpread ?? 0)}</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Global COT summary */}
                {intel?.cotSummary && (
                  <div className={`rounded-2xl p-5 ${CARD(l)}`}>
                    <h3 className={`text-base font-black mb-4 ${T1(l)}`}>CFTC COT — Global Positioning</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {Object.entries(intel.cotSummary).map(([key, val]) =>
                        val ? (
                          <div key={key} className={`p-4 rounded-xl ${CARD2(l)}`}>
                            <p className={`text-[10px] font-bold uppercase tracking-widest mb-1 ${T3(l)}`}>{key}</p>
                            <p className="text-xl font-black" style={{ color: val.sentiment === "Bullish" ? "#22c55e" : "#ef4444" }}>
                              {val.sentiment}
                            </p>
                            <p className={`text-xs mt-1 ${T3(l)}`}>
                              Net speculative: {val.netSpec > 0 ? "+" : ""}{fmtBig(val.netSpec)} contracts
                            </p>
                          </div>
                        ) : null
                      )}
                    </div>
                  </div>
                )}

                {/* Macro indicators */}
                {data?.macro && (
                  <div>
                    <h3 className={`text-sm font-black mb-3 ${T1(l)}`}>Macro Drivers</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-4">
                      {data.macro.map(item => <MacroCard key={item.id} item={item} />)}
                    </div>
                    {intel?.macroDrivers && (
                      <div className={`p-4 rounded-xl ${CARD(l)}`}>
                        <p className={`text-xs mb-2 ${T3(l)}`}>Fed: {intel.macroDrivers.fedRateExpectation}</p>
                        <p className={`text-xs ${T3(l)}`}>US CPI: {intel.macroDrivers.usCPI} · US 10Y: {fmt(regime?.y10, 2)}%</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* ══ TAB 4: Global ETFs ══ */}
            {tab === "global-etfs" && (
              <div className="space-y-8">
                <SecHead
                  title="Global ETFs (US Markets)"
                
                />

                {loading && !data ? (
                  <Skel count={4} cols="lg:grid-cols-2" h="h-[330px]" />
                ) : (() => {
                  const all = (data?.globalEtfs ?? []).filter(item => item.quote !== null);
                  const visible = showAllGlobalEtfs ? all : all.slice(0, CARDS_LIMIT);
                  return (
                    <>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 items-start">
                        {visible.map(item => (
                          <GlobalETFCard key={item.id} item={item} />
                        ))}
                      </div>
                      <ShowMoreBtn total={all.length} limit={CARDS_LIMIT} showAll={showAllGlobalEtfs} onToggle={() => setShowAllGlobalEtfs(s => !s)} />
                    </>
                  );
                })()}

                {/* Global ETF comparison table */}
                {data?.globalEtfs && data.globalEtfs.length > 0 && (
                  <div className={`rounded-2xl p-5 ${CARD(l)}`}>
                    <h3 className={`text-base font-black mb-4 ${T1(l)}`}>Global ETF Intelligence Panel</h3>
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className={`${T3(l)} text-left`}>
                            <th className="pb-3 font-bold pr-4">ETF</th>
                            <th className="pb-3 font-bold pr-4">Price</th>
                            <th className="pb-3 font-bold pr-4">Today</th>
                            <th className="pb-3 font-bold pr-4">AUM</th>
                            <th className="pb-3 font-bold pr-4">Expense</th>
                            <th className="pb-3 font-bold pr-4">Inst. Own.</th>
                            <th className="pb-3 font-bold pr-4">Max DD</th>
                            <th className="pb-3 font-bold">RS vs S&P</th>
                          </tr>
                        </thead>
                        <tbody className={`divide-y ${DIV(l)}`}>
                          {data.globalEtfs.filter(e => e.quote).map(e => {
                            const pos = (e.quote!.changePct ?? 0) >= 0;
                            return (
                              <tr key={e.id}>
                                <td className={`py-2.5 pr-4 font-bold ${T1(l)}`}>
                                  <a
                                    href={`https://www.tradingview.com/symbols/${e.exchange}-${e.symbol}/`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="hover:underline"
                                    style={{ color: "#5194F6" }}
                                  >
                                    {e.symbol}
                                  </a>
                                  <span className={`ml-1 text-[10px] ${T3(l)}`}>{e.category}</span>
                                </td>
                                <td className={`py-2.5 pr-4 font-bold ${T1(l)}`}>${fmt(e.quote!.price)}</td>
                                <td className={`py-2.5 pr-4 font-bold ${pos ? "text-emerald-400" : "text-red-400"}`}>
                                  {pos ? "+" : ""}{e.quote!.changePct.toFixed(2)}%
                                </td>
                                <td className="py-2.5 pr-4" style={{ color: "#5194F6" }}>${e.aum}</td>
                                <td className={`py-2.5 pr-4 ${T2(l)}`}>{e.expenseRatio}%</td>
                                <td className={`py-2.5 pr-4 ${T2(l)}`}>{e.institutionalOwnership || "—"}</td>
                                <td className="py-2.5 pr-4 text-red-400 font-bold">{e.maxDrawdown != null ? `${e.maxDrawdown}%` : "—"}</td>
                                <td className={`py-2.5 font-bold ${(e.relativeStrength ?? 0) >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                                  {e.relativeStrength != null ? `${e.relativeStrength >= 0 ? "+" : ""}${e.relativeStrength}%` : "—"}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Global Capital Flow Monitor — FIX: fully completed widget with COT + ETF flow data */}
                {intel?.cotSummary && (
                  <div className={`rounded-2xl p-5 ${CARD(l)}`}>
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className={`text-base font-black ${T1(l)}`}>Global Capital Flow Monitor</h3>
                        <p className={`text-xs mt-1 ${T2(l)}`}>CFTC smart-money positioning · Hedge fund net speculative contracts</p>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: "rgba(81,148,246,0.12)", color: "#5194F6" }}>
                        Weekly
                      </span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
                      {Object.entries(intel.cotSummary).map(([key, val]) =>
                        val ? (
                          <div key={key} className={`p-4 rounded-xl ${CARD2(l)}`}>
                            <p className={`text-[10px] font-bold uppercase tracking-widest mb-1 ${T3(l)}`}>{key} — Smart Money</p>
                            <p className="text-lg font-black" style={{ color: val.sentiment === "Bullish" ? "#22c55e" : "#ef4444" }}>
                              {val.sentiment}
                            </p>
                            {/* Net flow bar */}
                            <div className="mt-2 h-1.5 rounded-full overflow-hidden" style={{ background: l ? "#e2e8f0" : "#070e1a" }}>
                              <div
                                className="h-full rounded-full"
                                style={{
                                  width: `${Math.min(Math.abs(val.netSpec) / 5000 * 100, 100)}%`,
                                  background: val.sentiment === "Bullish" ? "#22c55e" : "#ef4444",
                                }}
                              />
                            </div>
                            <p className={`text-[10px] mt-1.5 ${T3(l)}`}>
                              Net: {val.netSpec > 0 ? "+" : ""}{fmtBig(val.netSpec)} contracts
                            </p>
                          </div>
                        ) : null
                      )}
                    </div>
                    {/* Summary row */}
                    {data?.globalEtfs && data.globalEtfs.length > 0 && (
                      <div className={`p-3.5 rounded-xl ${CARD2(l)}`}>
                        <p className={`text-[10px] font-bold uppercase tracking-widest mb-2 ${T3(l)}`}>US-Listed ETF Snapshot</p>
                        <div className="flex flex-wrap gap-3">
                          {data.globalEtfs.filter(e => e.quote).slice(0, 6).map(e => {
                            const ep = (e.quote!.changePct ?? 0) >= 0;
                            return (
                              <div key={e.id} className="flex items-center gap-1.5">
                                <span className={`text-[10px] font-black ${T1(l)}`}>{e.symbol}</span>
                                <span className={`text-[10px] font-bold ${ep ? "text-emerald-400" : "text-red-400"}`}>
                                  {ep ? "+" : ""}{e.quote!.changePct.toFixed(2)}%
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* ══ TAB 5: Intelligence Layer ══ */}
            {tab === "intelligence" && (
              <div className="space-y-6">
                <SecHead
                  title="InvestBeans Intelligence Layer"
                  sub=""
                />

                {/* 1. Cycle Stage */}
                <div className={`rounded-2xl p-5 ${CARD(l)}`}>
                  <h3 className={`text-base font-black mb-1 ${T1(l)}`}>1. Commodity Cycle Stage</h3>
                  <p className={`text-xs mb-4 ${T2(l)}`}>Accumulation → Mark-Up → Distribution → Mark-Down · Derived from intraday momentum & price trend</p>
                  <div className="space-y-2">
                    {(data?.domestic ?? []).filter(c => c.quote && c.cycleStage).map(c => (
                      <div
                        key={c.id}
                        className={`flex items-center justify-between p-3.5 rounded-xl border ${DIV(l)}`}
                        style={{ background: `${c.cycleStage!.color}08` }}
                      >
                        <div className="min-w-0">
                          <p className={`text-sm font-bold ${T1(l)}`}>{c.name}</p>
                          <p className={`text-[11px] mt-0.5 ${T3(l)}`}>{c.cycleStage!.desc}</p>
                        </div>
                        <div className="flex items-center gap-2.5 shrink-0 ml-3">
                          <span className={`text-sm font-semibold ${(c.quote!.changePct ?? 0) >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                            {(c.quote!.changePct ?? 0) >= 0 ? "+" : ""}{c.quote!.changePct?.toFixed(2)}%
                          </span>
                          <span
                            className="text-xs font-bold px-3 py-1 rounded-full"
                            style={{ color: c.cycleStage!.color, background: `${c.cycleStage!.color}20` }}
                          >
                            {c.cycleStage!.label}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 2. Hedge Engine */}
                <div className={`rounded-2xl p-5 ${CARD(l)}`}>
                  <div className="flex items-start justify-between mb-1">
                    <h3 className={`text-base font-black ${T1(l)}`}>2. Hedge Recommendation Engine</h3>
                    <a href="https://finance.yahoo.com/quote/%5EVIX/" target="_blank" rel="noreferrer"
                      className="text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ml-2"
                      style={{ background: "rgba(81,148,246,0.12)", color: "#5194F6" }}>
                      Source: CBOE VIX ↗
                    </a>
                  </div>
                  <p className={`text-xs mb-4 ${T2(l)}`}>Live signals from VIX · DXY direction · US 10Y Yield · S&P 500 momentum</p>
                  <div className="space-y-2">
                    {(intel?.hedgeSignals ?? []).map((s, i) => (
                      <div
                        key={i}
                        className={`p-4 rounded-xl border ${l ? "border-slate-200" : "border-[#1e3a5f]/50"}`}
                        style={{ background: `${s.color}08` }}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-sm font-bold" style={{ color: s.color }}>{s.condition}</p>
                          <span
                            className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                            style={{ color: s.color, background: `${s.color}20` }}
                          >
                            {s.severity}
                          </span>
                        </div>
                        <p className={`text-sm font-semibold ${T1(l)}`}>{s.signal}</p>
                        <p className={`text-xs mt-1 ${T2(l)}`}>→ {s.action}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 3. Allocation Framework */}
                <div className={`rounded-2xl p-5 ${CARD(l)}`}>
                  <div className="flex items-start justify-between mb-1">
                    <h3 className={`text-base font-black ${T1(l)}`}>3. Allocation Framework</h3>
                    <a href="https://www.investopedia.com/terms/a/assetallocation.asp" target="_blank" rel="noreferrer"
                      className="text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ml-2"
                      style={{ background: "rgba(81,148,246,0.12)", color: "#5194F6" }}>
                      Methodology ↗
                    </a>
                  </div>
                  <p className={`text-xs mb-4 ${T2(l)}`}>
                    Dynamically adjusted for: <strong style={{ color: regime?.color }}>{regime?.label}</strong>
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
                    {Object.values(intel?.allocationFramework ?? {}).map(b => (
                      <div
                        key={b.label}
                        className="rounded-xl px-4 py-3 flex items-center gap-3"
                        style={{ background: `${b.color}0e`, border: `1px solid ${b.color}28` }}
                      >
                        <span className="text-3xl shrink-0">{b.emoji}</span>
                        <div className="min-w-0">
                          <p className="text-xs font-bold" style={{ color: b.color }}>{b.label}</p>
                          <p className="text-2xl font-black leading-tight" style={{ color: b.color }}>{b.range}</p>
                          <p className={`text-[10px] mt-0.5 truncate ${T3(l)}`}>{b.items.join(", ")}</p>
                          <p className={`text-[9px] ${T3(l)}`}>{b.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 4. Geopolitical Risk Index */}
                {intel?.geopoliticalRisk && (
                  <div className={`rounded-2xl p-5 ${CARD(l)}`}>
                    <h3 className={`text-base font-black mb-1 ${T1(l)}`}>4. Geopolitical Risk Index (GRI)</h3>
                    <p className={`text-xs mb-4 ${T2(l)}`}>VIX + gold momentum + academic GPR model (Caldara & Iacoviello)</p>
                    <div className="flex items-center gap-6">
                      <div className="text-7xl font-black" style={{ color: intel.geopoliticalRisk.color }}>
                        {intel.geopoliticalRisk.score}
                      </div>
                      <div className="flex-1">
                        <p className="text-xl font-bold mb-1" style={{ color: intel.geopoliticalRisk.color }}>
                          {intel.geopoliticalRisk.label} Risk
                        </p>
                        <p className={`text-xs mb-3 ${T2(l)}`}>Scale: 0 (no risk) → 100 (extreme)</p>
                        <div className="w-full h-3 rounded-full overflow-hidden" style={{ background: l ? "#e2e8f0" : "#070e1a" }}>
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: `${intel.geopoliticalRisk.score}%`,
                              background: `linear-gradient(90deg,#22c55e,${intel.geopoliticalRisk.color})`,
                            }}
                          />
                        </div>
                        <div className={`flex justify-between text-[10px] mt-1 ${T3(l)}`}>
                          <span>0 Low</span><span>50 Moderate</span><span>100 Extreme</span>
                        </div>
                        <div className="flex justify-end mt-1.5">
                          <a
                            href="https://www.matteoiacoviello.com/gpr.htm"
                            target="_blank"
                            rel="noreferrer"
                            className="text-[9px] hover:underline"
                            style={{ color: "#5194F6" }}
                          >
                            Source: Caldara & Iacoviello GPR Model ↗
                          </a>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* 5. Regime Strategy */}
                {regime?.strategy && (
                  <div
                    className="rounded-2xl p-5"
                    style={{ background: `${regime.color}0a`, border: `1px solid ${regime.color}25` }}
                  >
                    <div className="flex items-start justify-between mb-1">
                      <h3 className={`text-base font-black ${T1(l)}`} style={{ color: l ? undefined : "#ffffff" }}>
                        5. {regime.emoji} Regime Strategy: {regime.label}
                      </h3>
                      <a
                        href="https://fred.stlouisfed.org/"
                        target="_blank"
                        rel="noreferrer"
                        className="text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ml-2"
                        style={{ background: "rgba(81,148,246,0.12)", color: "#5194F6" }}
                      >
                        Source: FRED ↗
                      </a>
                    </div>
                    <p className={`text-sm mb-4 ${T2(l)}`}>{regime.desc}</p>
                    <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                      {Object.entries(regime.strategy).map(([asset, rec]) => {
                        const c = rec.startsWith("↑") ? "#22c55e" : rec.startsWith("↓") ? "#ef4444" : "#6366f1";
                        return (
                          <div key={asset} className={`p-3 rounded-xl text-center ${l ? "bg-slate-100" : "bg-black/20"}`}>
                            <p className={`text-[10px] uppercase font-bold mb-1 ${T2(l)}`}>{asset}</p>
                            <p className="text-sm font-black" style={{ color: c }}>{rec}</p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* 6. Macro Drivers Summary */}
                {intel?.macroDrivers && (
                  <div className={`rounded-2xl p-5 ${CARD(l)}`}>
                    <div className="flex items-start justify-between mb-4">
                      <h3 className={`text-base font-black ${T1(l)}`}>6. Macro Drivers Summary</h3>
                      <a href="https://fred.stlouisfed.org/" target="_blank" rel="noreferrer"
                        className="text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ml-2"
                        style={{ background: "rgba(81,148,246,0.12)", color: "#5194F6" }}>
                        Source: FRED / RBI ↗
                      </a>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                      {[
                        { label: "US CPI",    val: intel.macroDrivers.usCPI,    href: "https://www.bls.gov/cpi/" },
                        { label: "Fed Rate",  val: intel.macroDrivers.fedRateExpectation.split("(")[0].trim(), href: "https://www.federalreserve.gov/monetarypolicy/openmarket.htm" },
                        { label: "RBI Rate",  val: intel.macroDrivers.rbiRate,  href: "https://rbi.org.in/" },
                        { label: "USD/INR",   val: intel.macroDrivers.usdInr ? `₹${intel.macroDrivers.usdInr}` : "—", href: "https://finance.yahoo.com/quote/USDINR=X/" },
                        { label: "India CPI", val: intel.macroDrivers.indianCPI, href: "https://mospi.gov.in/consumer-price-index" },
                      ].map(m => (
                        <a key={m.label} href={m.href} target="_blank" rel="noreferrer"
                          className={`p-3.5 rounded-xl flex flex-col items-center justify-center text-center min-h-[64px] hover:opacity-80 transition-opacity ${CARD2(l)}`}>
                          <p className={`text-[9px] uppercase tracking-wide font-semibold mb-1 ${T3(l)}`}>{m.label}</p>
                          <p className={`text-base font-black ${!m.val || m.val === "N/A" ? T3(l) : T1(l)}`}>
                            {m.val && m.val !== "N/A" && m.val !== "null" ? m.val : "Loading…"}
                          </p>
                        </a>
                      ))}
                    </div>
                    <p className={`text-xs mt-3 ${T3(l)}`}>{intel.macroDrivers.fedRateExpectation}</p>
                  </div>
                )}
              </div>
            )}

          </main>
        </div>
      </div>
    </Layout>
  );
}