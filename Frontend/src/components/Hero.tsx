'use client';

import { useState, useEffect } from "react";
import { TrendingUp, TrendingDown } from "lucide-react";
import { useTheme } from "@/controllers/Themecontext";



// ─── Mini Sparkline SVG ──────────────────────────────────────────────────────
const Sparkline = ({ positive, color }) => {
  const pts = positive
    ? [0, 32, 8, 28, 16, 30, 24, 22, 32, 18, 40, 14, 48, 16, 56, 10, 64, 8, 72, 4]
    : [0, 4, 8, 8, 16, 6, 24, 14, 32, 18, 40, 22, 48, 20, 56, 28, 64, 30, 72, 34];
  let d = `M${pts[0]},${pts[1]}`;
  for (let i = 2; i < pts.length; i += 2) {
    const cx = pts[i - 2] + (pts[i] - pts[i - 2]) / 2;
    d += ` C${cx},${pts[i - 1]} ${cx},${pts[i + 1]} ${pts[i]},${pts[i + 1]}`;
  }
  const gradId = `sg-${positive ? "up" : "dn"}-${color.replace('#', '')}`;
  return (
    <svg viewBox="0 0 72 40" className="w-full h-7" preserveAspectRatio="none">
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.35" />
          <stop offset="100%" stopColor={color} stopOpacity="0.0" />
        </linearGradient>
      </defs>
      <path d={d + ` L72,40 L0,40 Z`} fill={`url(#${gradId})`} />
      <path d={d} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
};

// ─── 3D Gold Brick SVG Icon ──────────────────────────────────────────────────
const GoldBrickIcon = ({ size = 36 }) => (
  <svg width={size} height={Math.round(size * 0.75)} viewBox="0 0 48 36" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="goldTop" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#f5d978" /><stop offset="100%" stopColor="#d4a017" /></linearGradient>
      <linearGradient id="goldFront" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#e8b820" /><stop offset="100%" stopColor="#9a6e00" /></linearGradient>
      <linearGradient id="goldSide" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stopColor="#c49a10" /><stop offset="100%" stopColor="#7a5200" /></linearGradient>
    </defs>
    <polygon points="6,8 42,8 46,2 10,2" fill="url(#goldTop)" />
    <polygon points="6,8 42,8 42,30 6,30" fill="url(#goldFront)" />
    <polygon points="42,8 46,2 46,24 42,30" fill="url(#goldSide)" />
    <polygon points="6,8 42,8 46,2 10,2" fill="none" stroke="#f7e080" strokeWidth="0.6" opacity="0.7" />
    <rect x="10" y="11" width="18" height="3" rx="1.5" fill="white" opacity="0.18" />
    <line x1="10" y1="19" x2="38" y2="19" stroke="#7a5200" strokeWidth="0.7" opacity="0.5" />
    <line x1="10" y1="24" x2="38" y2="24" stroke="#7a5200" strokeWidth="0.7" opacity="0.35" />
    <polygon points="6,8 42,8 42,30 6,30" fill="none" stroke="#9a6e00" strokeWidth="0.8" />
    <polygon points="42,8 46,2 46,24 42,30" fill="none" stroke="#7a5200" strokeWidth="0.8" />
    <polygon points="6,8 42,8 46,2 10,2" fill="none" stroke="#c49a10" strokeWidth="0.8" />
  </svg>
);

// ─── 3D Silver Brick SVG Icon ────────────────────────────────────────────────
const SilverBrickIcon = ({ size = 36 }) => (
  <svg width={size} height={Math.round(size * 0.75)} viewBox="0 0 48 36" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="silverTop" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#e8eef4" /><stop offset="100%" stopColor="#9db0c0" /></linearGradient>
      <linearGradient id="silverFront" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#c8d8e4" /><stop offset="100%" stopColor="#607080" /></linearGradient>
      <linearGradient id="silverSide" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stopColor="#8090a0" /><stop offset="100%" stopColor="#445060" /></linearGradient>
    </defs>
    <polygon points="6,8 42,8 46,2 10,2" fill="url(#silverTop)" />
    <polygon points="6,8 42,8 42,30 6,30" fill="url(#silverFront)" />
    <polygon points="42,8 46,2 46,24 42,30" fill="url(#silverSide)" />
    <polygon points="6,8 42,8 46,2 10,2" fill="none" stroke="#ddeaf2" strokeWidth="0.6" opacity="0.8" />
    <rect x="10" y="11" width="18" height="3" rx="1.5" fill="white" opacity="0.28" />
    <line x1="10" y1="19" x2="38" y2="19" stroke="#445060" strokeWidth="0.7" opacity="0.5" />
    <line x1="10" y1="24" x2="38" y2="24" stroke="#445060" strokeWidth="0.7" opacity="0.35" />
    <polygon points="6,8 42,8 42,30 6,30" fill="none" stroke="#607080" strokeWidth="0.8" />
    <polygon points="42,8 46,2 46,24 42,30" fill="none" stroke="#445060" strokeWidth="0.8" />
    <polygon points="6,8 42,8 46,2 10,2" fill="none" stroke="#8090a0" strokeWidth="0.8" />
  </svg>
);

// ─── Data Sources ─────────────────────────────────────────────────────────────
// Indices (Nifty50, Sensex, VIX)  → Kite /ohlc  (NSE / BSE)
// GIFT NIFTY                      → Kite /quote  (NSE_IFSC near-month futures)
//                                   via backend /api/v1/kite/gift-nifty
// Gold & Silver                   → Kite /quote  (MCX near-month futures)
//                                   via backend /api/v1/kite/commodities
// FII vs DII                      → NSE API      via backend /api/v1/kite/fii-dii
// USD / INR                       → Yahoo Finance (existing global endpoint)

const KITE_BHARAT_SYMBOLS = [
  "NSE:NIFTY 50",
  "BSE:SENSEX",
  "NSE:INDIA VIX",
];

// ─── Helper: fetch Kite OHLC/quote ──────────────────────────────────────────
async function fetchKiteQuote(API, symbols) {
  try {
    const qs = symbols.map(s => `i=${encodeURIComponent(s)}`).join("&");
    // Try OHLC first (lighter), fallback to full quote
    let r = await fetch(`${API}/kite/ohlc?${qs}`);
    if (!r.ok) r = await fetch(`${API}/kite/quote?${qs}`);
    const json = await r.json();
    return json?.data || {};
  } catch (_) {
    return {};
  }
}

// ─── SENSEX vs NIFTY Card ───────────────────────────────────────────────────
const SensexNiftyCard = ({ cardBg, cardBorder, cardShadow, isLight, sensex, nifty }) => {
  const fmtVal = (v) => v ? v.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "···";
  const fmtChg = (pct) => pct != null ? `${pct >= 0 ? "+" : ""}${pct.toFixed(2)}%` : "···";
  const sensexPos = (sensex?.chg ?? 0) >= 0;
  const niftyPos = (nifty?.chg ?? 0) >= 0;

  return (
    <div style={{ background: cardBg, border: cardBorder, boxShadow: cardShadow, backdropFilter: "blur(12px)" }} className="rounded-2xl relative overflow-hidden group hover:border-blue-400/30 hover:-translate-y-0.5 transition-all duration-300 cursor-pointer md:p-3">
      <div className="md:hidden">
        <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 3, background: isLight ? "#0A3656" : "#1F5F89", borderRadius: "8px 0 0 8px" }} />
        <div style={{ padding: "10px 10px 10px 14px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
            <span style={{ fontSize: "8px", fontWeight: 900, letterSpacing: "0.12em", textTransform: "uppercase", color: isLight ? "#0A3656" : "#74A8C9" }}>SENSEX · NIFTY 50</span>
            <span style={{ fontSize: "7px", fontWeight: 600, color: "#0ea5e9", background: "rgba(14,165,233,0.1)", border: "1px solid rgba(14,165,233,0.25)", borderRadius: 3, padding: "1px 4px", whiteSpace: "nowrap" }}>via Kite</span>
          </div>
          {[
            { label: "SENSEX", val: fmtVal(sensex?.price), chg: fmtChg(sensex?.chg), pos: sensexPos },
            { label: "NIFTY 50", val: fmtVal(nifty?.price), chg: fmtChg(nifty?.chg), pos: niftyPos },
          ].map(row => (
            <div key={row.label} style={{ display: "flex", flexDirection: "column", marginBottom: 6 }}>
              <span style={{ fontSize: "8px", fontWeight: 700, color: isLight ? "#1f455f" : "rgba(255,255,255,0.5)", marginBottom: 2 }}>{row.label}</span>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontSize: "13px", fontWeight: 800, color: isLight ? "#041421" : "#fff", letterSpacing: "-0.02em" }}>{row.val}</span>
                <span style={{ fontSize: "9px", fontWeight: 700, flexShrink: 0, color: row.pos ? "#22c55e" : "#ef4444", background: row.pos ? "rgba(34,197,94,0.12)" : "rgba(239,68,68,0.12)", border: `1px solid ${row.pos ? "rgba(34,197,94,0.25)" : "rgba(239,68,68,0.25)"}`, borderRadius: 4, padding: "1px 4px" }}>{row.chg}</span>
              </div>
            </div>
          ))}
          <div style={{ marginTop: 6, display: "flex", flexDirection: "column", gap: 3 }}>
            {[sensexPos, niftyPos].map((pos, i) => (
              <div key={i} style={{ height: 3, borderRadius: 99, background: isLight ? "rgba(0,0,0,0.08)" : "rgba(255,255,255,0.08)", overflow: "hidden" }}>
                <div style={{ width: `${pos ? 72 : 40}%`, height: "100%", borderRadius: 99, background: pos ? "linear-gradient(90deg,#22c55e,#86efac)" : "linear-gradient(90deg,#ef4444,#fca5a5)" }} />
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="hidden md:block">
        <div className="flex items-center justify-between mb-1.5">
          <div className="flex items-center gap-1.5">
            <span style={{ width: 7, height: 7, borderRadius: "50%", background: isLight ? "#0A3656" : "#74A8C9", display: "inline-block", boxShadow: isLight ? "0 0 6px rgba(10,54,86,0.45)" : "0 0 6px rgba(116,168,201,0.45)" }} />
            <span style={{ fontSize: "11px", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.12em", color: isLight ? "#1f455f" : "#ffffff" }}>SENSEX vs NIFTY 50</span>
          </div>
          <span style={{ fontSize: "8px", fontWeight: 600, color: "#0ea5e9", background: "rgba(14,165,233,0.1)", border: "1px solid rgba(14,165,233,0.25)", borderRadius: 4, padding: "1px 5px", whiteSpace: "nowrap" }}>via Kite</span>
        </div>
        <div className="space-y-1.5 mb-2">
          {[
            { label: "Sensex", val: fmtVal(sensex?.price), chg: fmtChg(sensex?.chg), pos: sensexPos },
            { label: "Nifty 50", val: fmtVal(nifty?.price), chg: fmtChg(nifty?.chg), pos: niftyPos },
          ].map(row => (
            <div key={row.label} className="flex items-center justify-between">
              <span className={`text-sm font-medium ${isLight ? "text-navy/70" : "text-white/70"}`}>{row.label}</span>
              <div className="flex items-center gap-1.5">
                <span className={`text-base md:text-lg font-bold ${isLight ? "text-navy" : "text-white"}`}>{row.val}</span>
                <span className={`flex items-center gap-0.5 text-xs font-semibold ${row.pos ? "text-emerald-400" : "text-red-400"}`}>
                  {row.pos ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />} {row.chg}
                </span>
              </div>
            </div>
          ))}
        </div>
        <Sparkline positive={sensexPos} color="#22c55e" />
      </div>
    </div>
  );
};

// ─── FII vs DII Card ────────────────────────────────────────────────────────
const FiiDiiCard = ({ cardBg, cardBorder, cardShadow, isLight, fiiNet, diiNet, fiiDate }) => {
  // fiiNet < 0 → selling, diiNet > 0 → buying (values in Crores)
  // null means data unavailable (VPS IP blocked by NSE) — show placeholder instead of blank
  const loading = false; // never block render
  const dataUnavailable = fiiNet == null && diiNet == null;
  const absFii = Math.abs(fiiNet ?? 0);
  const absDii = Math.abs(diiNet ?? 0);
  const total = absFii + absDii || 1;
  const fiiPct = Math.round((absFii / total) * 100);
  const diiPct = 100 - fiiPct;
  // ── BUG FIX: derive buying/selling direction from actual net values ──
  const fiiBuying = (fiiNet ?? 0) >= 0;
  const diiBuying = (diiNet ?? 0) >= 0;
  const fiiBarGrad = fiiBuying ? "linear-gradient(90deg,#22c55e,#86efac)" : "linear-gradient(90deg,#ef4444,#f87171)";
  const diiBarGrad = diiBuying ? "linear-gradient(90deg,#a855f7,#22c55e)" : "linear-gradient(90deg,#f87171,#ef4444)";
  const fiiValueColor = fiiBuying ? "#4ade80" : "#f87171";
  const diiValueColor = diiBuying ? "#4ade80" : "#f87171";

  // Format: e.g. -1240.5 → "−₹1,240 Cr"  |  +1980.2 → "+₹1,980 Cr"
  const fmt = (v) => {
    if (v == null) return "···";
    const sign = v < 0 ? "−" : "+";
    return `${sign}₹${Math.abs(v).toLocaleString("en-IN", { maximumFractionDigits: 0 })} Cr`;
  };

  const fiiLabel = fmt(fiiNet);
  const diiLabel = fmt(diiNet);
  const dateLabel = fiiDate ? `As of ${fiiDate}` : "";
  return (
    <div style={{ background: cardBg, border: cardBorder, boxShadow: cardShadow, backdropFilter: "blur(12px)" }} className="rounded-2xl relative overflow-hidden group hover:border-blue-400/30 hover:-translate-y-0.5 transition-all duration-300 cursor-pointer md:p-3">
      <div className="md:hidden" style={{ padding: "10px 10px 10px 14px", position: "relative" }}>
        <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 3, background: isLight ? "#0A3656" : "#1F5F89", borderRadius: "8px 0 0 8px" }} />
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
          <span style={{ fontSize: "8px", fontWeight: 900, letterSpacing: "0.12em", textTransform: "uppercase", color: isLight ? "#0A3656" : "#74A8C9" }}>FII · DII FLOW</span>
          <span style={{ fontSize: "7px", fontWeight: 600, color: "#f59e0b", background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.25)", borderRadius: 3, padding: "1px 4px", whiteSpace: "nowrap" }}>via NSE</span>
        </div>
        {dataUnavailable ? (
          <div style={{ padding: "8px 4px", textAlign: "center" }}>
            <div style={{ fontSize: "9px", color: isLight ? "rgba(4,20,33,0.4)" : "rgba(255,255,255,0.35)", fontWeight: 600, marginBottom: 3 }}>DATA UPDATING</div>
            <div style={{ fontSize: "8px", color: isLight ? "rgba(4,20,33,0.3)" : "rgba(255,255,255,0.25)" }}>NSE data temporarily unavailable</div>
            <div style={{ fontSize: "8px", color: isLight ? "#0A3656" : "#74A8C9", marginTop: 4, fontWeight: 600 }}>Auto-refreshes every 5 min</div>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 5, marginBottom: 8 }}>
            <div style={{ background: fiiBuying ? "rgba(34,197,94,0.08)" : "rgba(239,68,68,0.08)", border: `1px solid ${fiiBuying ? "rgba(34,197,94,0.2)" : "rgba(239,68,68,0.2)"}`, borderRadius: 8, padding: "5px 8px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div>
                <div style={{ fontSize: "8px", fontWeight: 700, color: fiiBuying ? "rgba(34,197,94,0.7)" : "rgba(239,68,68,0.7)", marginBottom: 1 }}>FII {fiiBuying ? "BUY" : "SELL"}</div>
                <div style={{ fontSize: "8px", color: fiiBuying ? "rgba(34,197,94,0.6)" : "rgba(239,68,68,0.6)" }}>{fiiBuying ? "inflow" : "outflow"}</div>
              </div>
              <div style={{ fontSize: "12px", fontWeight: 800, color: fiiValueColor }}>{fiiLabel}</div>
            </div>
            <div style={{ background: diiBuying ? "rgba(34,197,94,0.08)" : "rgba(239,68,68,0.08)", border: `1px solid ${diiBuying ? "rgba(34,197,94,0.2)" : "rgba(239,68,68,0.2)"}`, borderRadius: 8, padding: "5px 8px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div>
                <div style={{ fontSize: "8px", fontWeight: 700, color: diiBuying ? "rgba(34,197,94,0.7)" : "rgba(239,68,68,0.7)", marginBottom: 1 }}>DII {diiBuying ? "BUY" : "SELL"}</div>
                <div style={{ fontSize: "8px", color: diiBuying ? "rgba(34,197,94,0.6)" : "rgba(239,68,68,0.6)" }}>{diiBuying ? "inflow" : "outflow"}</div>
              </div>
              <div style={{ fontSize: "12px", fontWeight: 800, color: diiValueColor }}>{diiLabel}</div>
            </div>
          </div>
        )}
        <div style={{ height: 5, borderRadius: 99, overflow: "hidden", display: "flex", gap: 2 }}>
          <div style={{ width: `${fiiPct}%`, background: fiiBarGrad, borderRadius: 99 }} />
          <div style={{ flex: 1, background: diiBarGrad, borderRadius: 99 }} />
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
          <span style={{ fontSize: "8px", color: fiiBuying ? "rgba(74,222,128,0.8)" : "rgba(248,113,113,0.8)", fontWeight: 600 }}>{fiiPct}% {fiiBuying ? "buying" : "selling"}</span>
          <span style={{ fontSize: "8px", color: diiBuying ? "rgba(74,222,128,0.8)" : "rgba(248,113,113,0.8)", fontWeight: 600 }}>{diiPct}% {diiBuying ? "buying" : "selling"}</span>
        </div>
        {dateLabel && (
          <div style={{ fontSize: "8px", marginTop: 6, color: isLight ? "rgba(4,20,33,0.35)" : "rgba(255,255,255,0.30)", fontWeight: 500 }}>
            {dateLabel}
          </div>
        )}
      </div>
      <div className="hidden md:block">
        <div className="flex items-center justify-between mb-1.5">
          <div className="flex items-center gap-1.5">
            <span style={{ width: 7, height: 7, borderRadius: "50%", background: isLight ? "#0A3656" : "#74A8C9", display: "inline-block", boxShadow: isLight ? "0 0 6px rgba(10,54,86,0.45)" : "0 0 6px rgba(116,168,201,0.45)" }} />
            <span style={{ fontSize: "11px", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.12em", color: isLight ? "#1f455f" : "#ffffff" }}>FII vs DII</span>
          </div>
          <span style={{ fontSize: "8px", fontWeight: 600, color: "#f59e0b", background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.25)", borderRadius: 4, padding: "1px 5px", whiteSpace: "nowrap" }}>via NSE</span>
        </div>
        {dataUnavailable ? (
          <div className="flex flex-col items-center justify-center py-4 gap-1">
            <span className={`text-[10px] font-semibold ${isLight ? "text-navy/40" : "text-white/35"}`}>DATA UPDATING</span>
            <span className={`text-[9px] ${isLight ? "text-navy/30" : "text-white/25"}`}>NSE data temporarily unavailable</span>
            <span className={`text-[9px] font-semibold ${isLight ? "text-[#0A3656]/60" : "text-[#74A8C9]/60"}`}>Auto-refreshes every 5 min</span>
          </div>
        ) : (<>
          <div className="flex justify-between items-end mb-2">
            <div><div className={`text-[11px] font-semibold mb-1 ${isLight ? "text-navy/50" : "text-white/40"}`}>FII</div><div className={`text-base md:text-lg font-bold ${fiiBuying ? "text-emerald-400" : "text-red-400"}`}>{fiiLabel}</div></div>
            <div className="text-right"><div className={`text-[11px] font-semibold mb-1 ${isLight ? "text-navy/50" : "text-white/40"}`}>DII</div><div className={`text-base md:text-lg font-bold ${diiBuying ? "text-emerald-400" : "text-red-400"}`}>{diiLabel}</div></div>
          </div>
          <div className="h-2.5 rounded-full overflow-hidden flex" style={{ background: isLight ? "rgba(0,0,0,0.08)" : "rgba(255,255,255,0.08)" }}>
            <div style={{ width: `${fiiPct}%`, background: fiiBarGrad, borderRadius: "999px 0 0 999px" }} />
            <div style={{ width: `${diiPct}%`, background: diiBarGrad, borderRadius: "0 999px 999px 0" }} />
          </div>
          <div className="flex justify-between mt-1.5">
            <span className={`text-[10px] font-semibold ${fiiBuying ? "text-emerald-400/80" : "text-red-400/80"}`}>{`${fiiPct}% ${fiiBuying ? "buying" : "selling"}`}</span>
            <span className={`text-[10px] font-semibold ${diiBuying ? "text-emerald-400/80" : "text-red-400/80"}`}>{`${diiPct}% ${diiBuying ? "buying" : "selling"}`}</span>
          </div>
          {dateLabel && <div className={`text-[9px] mt-1.5 ${isLight ? "text-navy/35" : "text-white/30"}`}>{dateLabel}</div>}
        </>)}
      </div>
    </div>
  );
};

// ─── India VIX Card ─────────────────────────────────────────────────────────
const IndiaVixCard = ({ cardBg, cardBorder, cardShadow, isLight, vixData }) => {
  const vix = vixData?.price ?? 13.42;
  const vixChange = vixData?.chg ?? -3.10;
  const sliderPct = Math.min(100, Math.max(0, ((vix - 10) / 30) * 100));
  const fearLabel = vix < 15 ? "Low" : vix < 20 ? "Moderate" : "High";
  const fearColor = vix < 15 ? "#22c55e" : vix < 20 ? "#f59e0b" : "#ef4444";
  return (
    <div style={{ background: cardBg, border: cardBorder, boxShadow: cardShadow, backdropFilter: "blur(12px)" }} className="rounded-2xl relative overflow-hidden group hover:border-blue-400/30 hover:-translate-y-0.5 transition-all duration-300 cursor-pointer md:p-3">
      <div className="md:hidden" style={{ padding: "10px 10px 10px 14px", position: "relative" }}>
        <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 3, background: fearColor, borderRadius: "8px 0 0 8px" }} />
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
          <span style={{ fontSize: "8px", fontWeight: 900, letterSpacing: "0.12em", textTransform: "uppercase", color: isLight ? "#0A3656" : "#74A8C9" }}>INDIA VIX</span>
          <span style={{ fontSize: "7px", fontWeight: 600, color: "#0ea5e9", background: "rgba(14,165,233,0.1)", border: "1px solid rgba(14,165,233,0.25)", borderRadius: 3, padding: "1px 4px", whiteSpace: "nowrap" }}>via Kite</span>
        </div>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 8, gap: 4 }}>
          <span style={{ fontSize: "26px", fontWeight: 900, color: isLight ? "#041421" : "#fff", letterSpacing: "-0.04em", lineHeight: 1, flexShrink: 0 }}>{vix.toFixed ? vix.toFixed(2) : vix}</span>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4, minWidth: 0 }}>
            <span style={{ fontSize: "10px", fontWeight: 700, color: vixChange < 0 ? "#f87171" : "#4ade80", whiteSpace: "nowrap" }}>
              {vixChange < 0 ? "▼ " : "▲ +"}{Math.abs(vixChange).toFixed(2)}%
            </span>
            <span style={{ fontSize: "8px", fontWeight: 800, padding: "2px 5px", borderRadius: 4, background: `${fearColor}20`, color: fearColor, border: `1px solid ${fearColor}40`, whiteSpace: "nowrap" }}>{fearLabel} Fear</span>
          </div>
        </div>
        <div style={{ position: "relative", height: 6, borderRadius: 99, overflow: "hidden", background: "linear-gradient(90deg,#22c55e,#84cc16,#f59e0b,#ef4444)" }}>
          <div style={{ position: "absolute", top: "50%", transform: "translateY(-50%)", left: `calc(${sliderPct}% - 5px)`, width: 10, height: 10, background: "#fff", borderRadius: "50%", boxShadow: "0 0 0 2px rgba(0,0,0,0.2)" }} />
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 3 }}>
          <span style={{ fontSize: "8px", color: "rgba(34,197,94,0.7)", fontWeight: 600 }}>Low Fear</span>
          <span style={{ fontSize: "8px", color: "rgba(239,68,68,0.7)", fontWeight: 600 }}>High Fear</span>
        </div>
      </div>
      <div className="hidden md:block">
        <div className="flex items-center justify-between mb-1.5">
          <div className="flex items-center gap-1.5">
            <span style={{ width: 7, height: 7, borderRadius: "50%", background: isLight ? "#0A3656" : "#74A8C9", display: "inline-block", boxShadow: isLight ? "0 0 6px rgba(10,54,86,0.45)" : "0 0 6px rgba(116,168,201,0.45)" }} />
            <span style={{ fontSize: "11px", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.12em", color: isLight ? "#1f455f" : "#ffffff" }}>INDIA VIX</span>
          </div>
          <span style={{ fontSize: "8px", fontWeight: 600, color: "#0ea5e9", background: "rgba(14,165,233,0.1)", border: "1px solid rgba(14,165,233,0.25)", borderRadius: 4, padding: "1px 5px", whiteSpace: "nowrap" }}>via Kite</span>
        </div>
        <div className="flex items-end justify-between mb-1.5">
          <span className={`text-lg md:text-xl font-extrabold tracking-tight ${isLight ? "text-navy" : "text-white"}`}>{vix.toFixed ? vix.toFixed(2) : vix}</span>
          <div className="flex flex-col items-end gap-1">
            <span className={`flex items-center gap-1 font-bold text-sm ${vixChange < 0 ? "text-red-400" : "text-emerald-400"}`}>
              {vixChange < 0 ? <TrendingDown className="w-3.5 h-3.5" /> : <TrendingUp className="w-3.5 h-3.5" />} {vixChange >= 0 ? "+" : ""}{vixChange.toFixed ? vixChange.toFixed(2) : vixChange}%
            </span>
            <span className="text-[10px] md:text-[11px] font-bold px-2 py-0.5 rounded-full" style={{ background: `${fearColor}22`, color: fearColor, border: `1px solid ${fearColor}44` }}>Market Fear: {fearLabel}</span>
          </div>
        </div>
        <div className="relative h-2.5 rounded-full overflow-hidden" style={{ background: "linear-gradient(90deg,#22c55e,#84cc16,#f59e0b,#ef4444)" }}>
          <div className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-white rounded-full shadow-md border-2 border-slate-300 transition-all duration-700" style={{ left: `calc(${sliderPct}% - 8px)` }} />
        </div>
        <div className="flex justify-between mt-1">
          <span className="text-[9px] text-emerald-400/70">Low Fear</span>
          <span className="text-[9px] text-red-400/70">High Fear</span>
        </div>
      </div>
    </div>
  );
};

// ─── GIFT NIFTY Card ─────────────────────────────────────────────────────────
const GiftNiftyCard = ({ cardBg, cardBorder, cardShadow, isLight, liveGiftNifty, liveGiftChange }) => {
  const price = liveGiftNifty ?? null;
  const change = liveGiftChange ?? null;
  const pos = (change ?? 0) >= 0;
  const displayPrice = price ? price.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "···";
  const displayChange = change != null ? `${pos ? "▲ +" : "▼ "}${Math.abs(change).toFixed(2)}%` : "···";
  // Show "Opening Indicated" only outside Indian market hours (9:15 AM – 3:30 PM IST)
  const isMarketOpen = (() => {
    const now = new Date();
    const istMinutes = (now.getUTCHours() * 60 + now.getUTCMinutes() + 330) % (24 * 60);
    return istMinutes >= 555 && istMinutes < 930; // 9:15 = 555min, 15:30 = 930min
  })();
  const sentiment = change == null ? "Loading…" : isMarketOpen ? "" : (pos ? "Positive Opening Indicated" : "Negative Opening Indicated");
  return (
    <div style={{ background: cardBg, border: cardBorder, boxShadow: cardShadow, backdropFilter: "blur(12px)" }} className="rounded-2xl relative overflow-hidden group hover:border-blue-400/30 hover:-translate-y-0.5 transition-all duration-300 cursor-pointer md:p-3">
      <div className="md:hidden" style={{ position: "relative" }}>
        <div style={{ height: 3, background: isLight ? "#0A3656" : "#1F5F89", borderRadius: "8px 8px 0 0" }} />
        <div style={{ padding: "8px 10px 0 10px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
            <span style={{ fontSize: "8px", fontWeight: 900, letterSpacing: "0.12em", textTransform: "uppercase", color: isLight ? "#0A3656" : "#74A8C9" }}>GIFT NIFTY</span>
            <span style={{ fontSize: "7px", fontWeight: 600, color: "#0ea5e9", background: "rgba(14,165,233,0.1)", border: "1px solid rgba(14,165,233,0.25)", borderRadius: 3, padding: "1px 4px", whiteSpace: "nowrap" }}>via Kite</span>
          </div>
          <div style={{ fontSize: "20px", fontWeight: 900, color: isLight ? "#041421" : "#fff", letterSpacing: "-0.03em", lineHeight: 1 }}>{displayPrice}</div>
          <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 4, marginBottom: 2, overflow: "hidden", minWidth: 0 }}>
            <span style={{ fontSize: "9px", fontWeight: 700, color: pos ? "#4ade80" : "#f87171", flexShrink: 0 }}>{displayChange}</span>
            <span style={{ fontSize: "7px", color: isLight ? "rgba(13,37,64,0.45)" : "rgba(255,255,255,0.4)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", minWidth: 0 }}>{sentiment}</span>
          </div>
        </div>
        <Sparkline positive={pos} color={isLight ? "#0A3656" : "#1F5F89"} />
      </div>
      <div className="hidden md:block">
        <div className="flex items-center justify-between mb-1.5">
          <div className="flex items-center gap-1.5">
            <span style={{ width: 7, height: 7, borderRadius: "50%", background: isLight ? "#0A3656" : "#74A8C9", display: "inline-block", boxShadow: isLight ? "0 0 6px rgba(10,54,86,0.45)" : "0 0 6px rgba(116,168,201,0.45)" }} />
            <span style={{ fontSize: "11px", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.12em", color: isLight ? "#1f455f" : "#ffffff" }}>GIFT NIFTY</span>
          </div>
          <span style={{ fontSize: "8px", fontWeight: 600, color: "#0ea5e9", background: "rgba(14,165,233,0.1)", border: "1px solid rgba(14,165,233,0.25)", borderRadius: 4, padding: "1px 5px", whiteSpace: "nowrap" }}>via Kite</span>
        </div>
        <div className="flex items-end justify-between mb-1">
          <div>
            <div className={`text-lg md:text-xl font-extrabold tracking-tight ${isLight ? "text-navy" : "text-white"}`}>{displayPrice}</div>
            <div className="flex items-center gap-1 mt-1">
              {pos ? <TrendingUp className="w-3.5 h-3.5 text-emerald-400" /> : <TrendingDown className="w-3.5 h-3.5 text-red-400" />}
              <span className={`font-bold text-sm ${pos ? "text-emerald-400" : "text-red-400"}`}>{displayChange}</span>
            </div>
          </div>
        </div>
        <div className={`text-[11px] font-medium mb-2 ${isLight ? "text-navy/50" : "text-white/40"}`}>{sentiment}</div>
        <Sparkline positive={pos} color={isLight ? "#0A3656" : "#1F5F89"} />
      </div>
    </div>
  );
};

// ─── USD/INR Card ────────────────────────────────────────────────────────────
// Mirrors Domestic page MacroSection exactly:
//   rate → toFixed(4)  e.g. ₹85.8210
//   change_pct → toFixed(3)  e.g. +0.592%
const UsdInrCard = ({ cardBg, cardBorder, cardShadow, isLight, liveValue, liveChange, source = "kite-cds" }) => {
  const rate = liveValue ?? null;
  const changeVal = liveChange ?? null;
  const pos = (changeVal ?? 0) >= 0;
  // rate displayed with 4 decimal places — same as Domestic MacroSection
  const rateDisplay = rate != null ? (rate.toFixed ? rate.toFixed(4) : String(rate)) : "···";
  // change_pct displayed with 3 decimal places — same as Domestic MacroSection
  const changeDisplay = changeVal != null
    ? `${pos ? "▲ +" : "▼ "}${Math.abs(changeVal).toFixed(3)}%`
    : "···";
  const changePlain = changeVal != null
    ? `${pos ? "+" : ""}${changeVal.toFixed(3)}%`
    : "···";
  const sliderPct = rate != null ? Math.min(100, Math.max(0, ((rate - 82) / 28) * 100)) : 50;
  // Source badge label
  const sourceLabel = source === "kite-cds" ? "via Kite CDS"
    : source === "nse-cd" || source === "nse-cd2" ? "via NSE"
      : "via Yahoo Finance";
  const sourceBadgeColor = source?.startsWith("kite") ? "#0ea5e9"
    : source?.startsWith("nse") ? "#f59e0b"
      : "#6366f1";
  const sourceBadgeBg = source?.startsWith("kite") ? "rgba(14,165,233,0.1)"
    : source?.startsWith("nse") ? "rgba(245,158,11,0.1)"
      : "rgba(99,102,241,0.1)";
  const sourceBadgeBorder = source?.startsWith("kite") ? "rgba(14,165,233,0.25)"
    : source?.startsWith("nse") ? "rgba(245,158,11,0.25)"
      : "rgba(99,102,241,0.25)";
  return (
    <div style={{ background: cardBg, border: cardBorder, boxShadow: cardShadow, backdropFilter: "blur(12px)" }} className="rounded-2xl relative overflow-hidden group hover:border-blue-400/30 hover:-translate-y-0.5 transition-all duration-300 cursor-pointer md:p-3">
      <div className="md:hidden" style={{ padding: "10px 10px 10px 14px", position: "relative" }}>
        <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 3, background: isLight ? "#0A3656" : "#1F5F89", borderRadius: "8px 0 0 8px" }} />
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 5 }}>
          <span style={{ fontSize: "8px", fontWeight: 900, letterSpacing: "0.12em", textTransform: "uppercase", color: isLight ? "#0A3656" : "#74A8C9" }}>USD / INR</span>
          <span style={{ fontSize: "7px", fontWeight: 600, color: sourceBadgeColor, background: sourceBadgeBg, border: `1px solid ${sourceBadgeBorder}`, borderRadius: 3, padding: "1px 4px", whiteSpace: "nowrap" }}>{sourceLabel}</span>
        </div>
        <div style={{ display: "flex", alignItems: "baseline", gap: 3, marginBottom: 4 }}>
          <span style={{ fontSize: "11px", fontWeight: 700, color: isLight ? "rgba(13,37,64,0.5)" : "rgba(255,255,255,0.4)" }}>₹</span>
          <span style={{ fontSize: "20px", fontWeight: 900, color: isLight ? "#041421" : "#fff", letterSpacing: "-0.03em", lineHeight: 1 }}>{rateDisplay}</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 8 }}>
          <span style={{ fontSize: "9px", fontWeight: 700, color: pos ? "#4ade80" : "#f87171", flexShrink: 0 }}>
            {changeDisplay}
          </span>
          <span style={{ fontSize: "8px", fontWeight: 600, color: "#06b6d4", background: "rgba(6,182,212,0.1)", border: "1px solid rgba(6,182,212,0.25)", borderRadius: 3, padding: "1px 5px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "90px" }}>
            {changeVal == null ? "Loading…" : pos ? "Weakening" : "Strengthening"}
          </span>
        </div>
        <div style={{ position: "relative", height: 5, borderRadius: 99, overflow: "hidden", background: "linear-gradient(90deg,#3b82f6,#06b6d4,#f59e0b,#ef4444)" }}>
          <div style={{ position: "absolute", top: "50%", transform: "translateY(-50%)", left: `calc(${sliderPct}% - 5px)`, width: 10, height: 10, background: "#fff", borderRadius: "50%", boxShadow: "0 0 0 2px rgba(0,0,0,0.2)" }} />
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 3 }}>
          <span style={{ fontSize: "8px", color: "rgba(59,130,246,0.7)", fontWeight: 600 }}>₹82</span>
          <span style={{ fontSize: "8px", color: "rgba(239,68,68,0.7)", fontWeight: 600 }}>₹110</span>
        </div>
      </div>
      <div className="hidden md:block">
        <div className="flex items-center justify-between mb-1.5">
          <div className="flex items-center gap-1.5">
            <span style={{ width: 7, height: 7, borderRadius: "50%", background: isLight ? "#0A3656" : "#74A8C9", display: "inline-block", boxShadow: isLight ? "0 0 6px rgba(10,54,86,0.45)" : "0 0 6px rgba(116,168,201,0.45)" }} />
            <span style={{ fontSize: "11px", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.12em", color: isLight ? "#1f455f" : "#ffffff" }}>USD / INR</span>
          </div>
          <span style={{ fontSize: "8px", fontWeight: 600, color: sourceBadgeColor, background: sourceBadgeBg, border: `1px solid ${sourceBadgeBorder}`, borderRadius: 4, padding: "1px 5px", whiteSpace: "nowrap" }}>{sourceLabel}</span>
        </div>
        <div className="flex items-end justify-between mb-2">
          <div>
            <div className={`text-lg md:text-xl font-extrabold tracking-tight tabular-nums ${isLight ? "text-navy" : "text-white"}`}>
              ₹{rateDisplay}
            </div>
            <div className="flex items-center gap-1 mt-1">
              {pos ? <TrendingUp className="w-3.5 h-3.5 text-emerald-400" /> : <TrendingDown className="w-3.5 h-3.5 text-red-400" />}
              <span className={`font-bold text-sm ${pos ? "text-emerald-400" : "text-red-400"}`}>
                {changePlain}
              </span>
            </div>
          </div>
        </div>
        <div className={`text-[11px] font-medium mb-2 ${isLight ? "text-navy/50" : "text-white/40"}`}>
          {changeVal == null ? "Loading…" : pos ? "Rupee Weakening" : "Rupee Strengthening"}
        </div>
        <div className="relative h-2.5 rounded-full overflow-hidden" style={{ background: "linear-gradient(90deg,#3b82f6,#06b6d4,#f59e0b,#ef4444)" }}>
          <div className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-white rounded-full shadow-md border-2 border-slate-300 transition-all duration-700" style={{ left: `calc(${sliderPct}% - 8px)` }} />
        </div>
        <div className="flex justify-between mt-1">
          <span className="text-[9px] text-[#7fb1cf]/80">₹82</span>
          <span className="text-[9px] text-red-400/70">₹110</span>
        </div>
      </div>
    </div>
  );
};

// ─── Gold vs Silver Card ─────────────────────────────────────────────────────
const GoldSilverCard = ({ cardBg, cardBorder, cardShadow, isLight, liveGold, liveGoldChange, liveSilver, liveSilverChange, goldSource, silverSource }) => {
  const gold = liveGold ?? null; const silver = liveSilver ?? null;
  const goldChg = liveGoldChange ?? null; const silverChg = liveSilverChange ?? null;
  const goldPos = (goldChg ?? 0) >= 0; const silverPos = (silverChg ?? 0) >= 0;
  // Gold is ₹/10g (integers from MCX), Silver is ₹/kg (integers from MCX) — no decimals needed for Indian MCX
  const fmtPrice = (v) => v ? `₹${Math.round(v).toLocaleString("en-IN")}` : "···";
  const fmtChg = (v, pos) => v != null ? `${pos ? "▲ +" : "▼ "}${Math.abs(v).toFixed(2)}%` : "···";
  const srcLabel = (src) => src === "kite-ws" ? "Live MCX" : src === "kite-rest" ? "MCX REST" : src === "yahoo" ? "Yahoo Finance" : null;
  const srcColor = (src) => src === "kite-ws" ? "#22c55e" : src === "kite-rest" ? (isLight ? "#0A3656" : "#74A8C9") : "#6366f1";
  return (
    <div style={{ background: cardBg, border: cardBorder, boxShadow: cardShadow, backdropFilter: "blur(12px)" }} className="rounded-2xl relative overflow-hidden group hover:border-blue-400/30 hover:-translate-y-0.5 transition-all duration-300 cursor-pointer md:p-3">
      <div className="md:hidden" style={{ padding: "10px", position: "relative" }}>
        <div style={{ position: "absolute", top: 0, right: 0, width: 40, height: 40, background: isLight ? "rgba(37,99,235,0.06)" : "rgba(59,130,246,0.08)", borderRadius: "0 8px 0 40px" }} />
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 7 }}>
          <span style={{ fontSize: "8px", fontWeight: 900, letterSpacing: "0.12em", textTransform: "uppercase", color: isLight ? "#0A3656" : "#74A8C9" }}>GOLD · SILVER</span>
          {(goldSource || silverSource) && (
            <span style={{ fontSize: "7px", fontWeight: 600, color: srcColor(goldSource || silverSource), background: `${srcColor(goldSource || silverSource)}18`, border: `1px solid ${srcColor(goldSource || silverSource)}30`, borderRadius: 3, padding: "1px 4px", whiteSpace: "nowrap" }}>
              {srcLabel(goldSource || silverSource)}
            </span>
          )}
        </div>
        {[
          { Icon: GoldBrickIcon, label: "Gold", price: fmtPrice(gold), chg: fmtChg(goldChg, goldPos), pos: goldPos, bar: "linear-gradient(90deg,#C9A84C,#f5d78e)", barW: "72%" },
          { Icon: SilverBrickIcon, label: "Silver", price: fmtPrice(silver), chg: fmtChg(silverChg, silverPos), pos: silverPos, bar: "linear-gradient(90deg,#94a3b8,#cbd5e1)", barW: "58%" },
        ].map(({ Icon, label, price, chg, pos, bar, barW }) => (
          <div key={label}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                <Icon size={20} />
                <span style={{ fontSize: "10px", fontWeight: 700, color: isLight ? "#1f455f" : "rgba(255,255,255,0.7)" }}>{label}</span>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: "13px", fontWeight: 800, color: isLight ? "#041421" : "#fff" }}>{price}</div>
                <div style={{ fontSize: "8px", fontWeight: 700, color: pos ? "#4ade80" : "#f87171" }}>{chg}</div>
              </div>
            </div>
            <div style={{ height: 3, borderRadius: 99, overflow: "hidden", marginBottom: 6, background: isLight ? "rgba(0,0,0,0.06)" : "rgba(255,255,255,0.06)" }}>
              <div style={{ width: barW, height: "100%", borderRadius: 99, background: bar }} />
            </div>
          </div>
        ))}
      </div>
      <div className="hidden md:block">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-1.5">
            <span style={{ width: 7, height: 7, borderRadius: "50%", background: isLight ? "#0A3656" : "#74A8C9", display: "inline-block", boxShadow: isLight ? "0 0 6px rgba(10,54,86,0.45)" : "0 0 6px rgba(116,168,201,0.45)" }} />
            <span style={{ fontSize: "11px", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.12em", color: isLight ? "#1f455f" : "#ffffff" }}>GOLD vs SILVER</span>
          </div>
          {/* Source badge — shows data origin */}
          {(goldSource || silverSource) && (
            <span style={{
              fontSize: "9px", fontWeight: 700, padding: "2px 7px", borderRadius: 6,
              background: `${srcColor(goldSource || silverSource)}18`,
              color: srcColor(goldSource || silverSource),
              border: `1px solid ${srcColor(goldSource || silverSource)}30`,
            }}>
              {srcLabel(goldSource || silverSource)}
            </span>
          )}
        </div>
        <div className="space-y-2">
          {[
            { Icon: GoldBrickIcon, label: "Gold", price: fmtPrice(gold), chg: fmtChg(goldChg, goldPos), pos: goldPos, bar: "linear-gradient(90deg,#C9A84C,#f5d78e)", barW: "72%", unit: "per 10g" },
            { Icon: SilverBrickIcon, label: "Silver", price: fmtPrice(silver), chg: fmtChg(silverChg, silverPos), pos: silverPos, bar: "linear-gradient(90deg,#94a3b8,#cbd5e1)", barW: "58%", unit: "per kg" },
          ].map(({ Icon, label, price, chg, pos, bar, barW, unit }) => (
            <div key={label}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Icon size={28} />
                  <div>
                    <span className={`font-semibold text-sm ${isLight ? "text-navy/80" : "text-white/80"}`}>{label}</span>
                    <span style={{ display: "block", fontSize: "9px", color: isLight ? "rgba(30,58,95,0.4)" : "rgba(255,255,255,0.35)", fontWeight: 600 }}>{unit}</span>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className={`text-base md:text-lg font-bold ${isLight ? "text-navy" : "text-white"}`}>{price}</span>
                  {pos ? <TrendingUp className="w-4 h-4 text-emerald-400 flex-shrink-0" /> : <TrendingDown className="w-4 h-4 text-red-400 flex-shrink-0" />}
                  <span className={`text-xs font-bold ${pos ? "text-emerald-400" : "text-red-400"}`}>{chg}</span>
                </div>
              </div>
              <div className="h-1.5 rounded-full overflow-hidden mt-1" style={{ background: isLight ? "rgba(0,0,0,0.08)" : "rgba(255,255,255,0.08)" }}>
                <div style={{ width: barW, background: bar, borderRadius: 999, height: "100%", transition: "width 1s ease" }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ─── US Stat Card ────────────────────────────────────────────────────────────
// TradingView URLs for US stat cards
const TV_URLS: Record<string, string> = {
  "NASDAQ": "https://www.tradingview.com/symbols/NASDAQ-IXIC/",
  "Dow Jones": "https://www.tradingview.com/symbols/DJ-DJI/",
  "USD / INR": "https://www.tradingview.com/symbols/USDINR/",
  "Gold": "https://www.tradingview.com/symbols/COMEX-GC1!/",
};

const USStatCard = ({ label, value, absPrice, absPricePrefix, positive, cardBg, cardBorder, cardShadow, isLight }) => {
  const isUp = positive === true; const isDown = positive === false;
  const color = isUp ? "#22c55e" : isDown ? "#ef4444" : (isLight ? "#0A3656" : "#74A8C9");
  const loading = value === "..." || value === "N/A";
  const tvUrl = TV_URLS[label];

  // Format absolute price based on magnitude
  const fmtAbsPrice = (v, prefix) => {
    if (v == null) return null;
    const n = Number(v);
    if (isNaN(n)) return null;
    const formatted = n >= 10000
      ? n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
      : n >= 100
        ? n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
        : n.toFixed(4);
    return `${prefix ?? ""}${formatted}`;
  };

  const priceDisplay = fmtAbsPrice(absPrice, absPricePrefix ?? "");

  return (
    <div style={{ background: cardBg, border: cardBorder, boxShadow: cardShadow, backdropFilter: "blur(12px)" }}
      className={`rounded-2xl p-3 sm:p-3 relative overflow-hidden group hover:border-blue-400/30 hover:-translate-y-0.5 transition-all duration-300 flex flex-col ${tvUrl ? "cursor-pointer" : ""}`}
      onClick={() => tvUrl && window.open(tvUrl, "_blank", "noopener,noreferrer")}>
      <div className="flex items-center gap-1.5 mb-1.5">
        <span style={{ width: 7, height: 7, borderRadius: "50%", background: isLight ? "#0A3656" : "#74A8C9", display: "inline-block", boxShadow: isLight ? "0 0 6px rgba(10,54,86,0.45)" : "0 0 6px rgba(116,168,201,0.45)" }} />
        <span style={{ fontSize: "10px", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.10em", color: isLight ? "#1f455f" : "#ffffff" }}>{label}</span>
      </div>
      <div className="flex-1 mb-3">
        {/* Absolute price — primary large number */}
        {priceDisplay && !loading && (
          <div className={`text-lg sm:text-xl font-extrabold tracking-tight mb-0.5 ${isLight ? "text-navy" : "text-white"}`}>
            {priceDisplay}
          </div>
        )}
        {/* Percentage change */}
        <div className="flex items-center gap-1">
          {!loading && (isUp ? <TrendingUp className="w-3 h-3 flex-shrink-0" style={{ color }} /> : isDown ? <TrendingDown className="w-3 h-3 flex-shrink-0" style={{ color }} /> : null)}
          <div className="font-bold text-sm" style={{ color: loading ? (isLight ? "#64748b" : "#94a3b8") : color }}>
            {loading ? "—" : value}
          </div>
        </div>
        <div className={`text-[10px] sm:text-[11px] mt-0.5 ${isLight ? "text-navy/40" : "text-white/35"}`}>Today's change</div>
      </div>
      <Sparkline positive={isUp} color={color} />
      {tvUrl && <div style={{ fontSize: "10px", marginTop: "6px", color: isLight ? "#0A3656" : "#74A8C9", opacity: 0.85, fontWeight: 600 }}>View on TradingView →</div>}
    </div>
  );
};

// ─── Main Hero Component ────────────────────────────────────────────────────
const Hero = () => {
  const [activeTab, setActiveTab] = useState("bharat");
  const { theme } = useTheme();
  const isLight = theme === "light";
  const API = import.meta.env.VITE_API_URL || "http://localhost:8000";

  const [usData, setUsData] = useState({
    nasdaq: "...", usdInr: "...", gold: "...", dow: "...",
    nasdaqPos: null, usdInrPos: null, goldPos: null, dowPos: null,
    usdInrRate: 84,
    // Absolute prices for display
    nasdaqPrice: null, goldPrice: null, dowPrice: null, usdInrAbsPrice: null,
  });

  const [bharatData, setBharatData] = useState({
    sensex: null,        // { price, chg }
    nifty50: null,       // { price, chg }
    indiaVix: null,      // { price, chg }
    giftNifty: null,     // from Kite NSE_IFSC
    giftNiftyChange: null,
    usdInr: null,
    usdInrChange: null,
    usdInrSource: null,  // "kite-cds" | "nse-cd" | "yahoo"
    goldInr: null,       // MCX Gold ₹/10g — Kite WS > Kite REST > Yahoo
    goldChange: null,
    goldSource: null,    // "kite-ws" | "kite-rest" | "yahoo"
    silverInr: null,     // MCX Silver ₹/kg — Kite WS > Kite REST > Yahoo
    silverChange: null,
    silverSource: null,
    fiiNet: null,        // FII net in Crores (negative = selling)
    diiNet: null,        // DII net in Crores (positive = buying)
    fiiDate: null,       // "DD-Mon-YYYY" from NSE
  });

  // ── Helper: parse ohlc/quote response into { price, chg } ────────────────
  const parseKiteItem = (data, symbol) => {
    const item = data[symbol];
    if (!item) return null;
    const price = item.last_price ?? item.ohlc?.close ?? null;
    // Kite quote endpoint provides change% directly (net_change is absolute, change is %)
    // Kite OHLC endpoint: ohlc.close = previous day's close → compute manually
    const prevClose = item.ohlc?.close ?? null;
    const chg = (item.change != null && item.change !== 0)
      ? item.change                                           // quote endpoint — direct %
      : (price && prevClose && prevClose !== price)
        ? ((price - prevClose) / prevClose) * 100             // OHLC fallback
        : null;
    return { price, chg };
  };

  // ── Fetch Kite live data for Bharat indices (Nifty50, Sensex, VIX) ─────────
  useEffect(() => {
    const symbols = ["NSE:NIFTY 50", "BSE:SENSEX", "NSE:INDIA VIX"];

    const load = async () => {
      const data = await fetchKiteQuote(API, symbols);
      setBharatData(prev => ({
        ...prev,
        nifty50: parseKiteItem(data, "NSE:NIFTY 50") ?? prev.nifty50,
        sensex: parseKiteItem(data, "BSE:SENSEX") ?? prev.sensex,
        indiaVix: parseKiteItem(data, "NSE:INDIA VIX") ?? prev.indiaVix,
      }));
    };
    load();
    const interval = setInterval(load, 30000);
    return () => clearInterval(interval);
  }, [API]);

  // ── Fetch US global + Yahoo-based USD/INR + Gold (for US Stats tab) ───────
  // useEffect(() => {
  //   fetch(`${API}/markets/global`)
  //     .then(r => r.json())
  //     .then(data => {
  //       const us    = data?.indices?.us   || [];
  //       const forex = data?.forex          || [];
  //       const comms = data?.commodities    || [];
  //       const nasdaq  = us.find(m => m.symbol === "^IXIC");
  //       const dow     = us.find(m => m.symbol === "^DJI");
  //       const usdinr  = forex.find(m => m.pair === "USD/INR");
  //       const gold    = comms.find(m => m.symbol === "GC=F");
  //       const fmt = (v) => `${v >= 0 ? "+" : ""}${v.toFixed(2)}%`;
  //       setUsData({
  //         nasdaq:    nasdaq ? fmt(nasdaq.changePercent)                    : "N/A",
  //         usdInr:    usdinr?.changePercent != null ? fmt(usdinr.changePercent) : "N/A",
  //         gold:      gold   ? fmt(gold.changePercent)                      : "N/A",
  //         dow:       dow    ? fmt(dow.changePercent)                       : "N/A",
  //         nasdaqPos: nasdaq ? nasdaq.changePercent >= 0                    : null,
  //         usdInrPos: usdinr?.changePercent != null ? usdinr.changePercent >= 0 : null,
  //         goldPos:   gold   ? gold.changePercent >= 0                      : null,
  //         dowPos:    dow    ? dow.changePercent >= 0                       : null,
  //         usdInrRate: usdinr?.rate ? Number(usdinr.rate)                   : 84,
  //       });

  //       // USD/INR for the Bharat card
  //       setBharatData(prev => ({
  //         ...prev,
  //         usdInr:      usdinr?.rate       ?? prev.usdInr,
  //         usdInrChange: usdinr?.changePercent ?? prev.usdInrChange,
  //       }));
  //     })
  //     .catch(() => {});
  // }, [API]);
  useEffect(() => {
    fetch(`${API}/markets/global`)
      .then(r => r.json())
      .then(data => {
        const us = data?.indices?.us || [];
        const comms = data?.commodities || [];

        const nasdaq = us.find(m => m.symbol === "^IXIC");
        const dow = us.find(m => m.symbol === "^DJI");
        const gold = comms.find(m => m.symbol === "GC=F");

        const fmt = (v) => `${v >= 0 ? "+" : ""}${v.toFixed(2)}%`;

        setUsData({
          nasdaq: nasdaq ? fmt(nasdaq.changePercent) : "N/A",
          gold: gold ? fmt(gold.changePercent) : "N/A",
          dow: dow ? fmt(dow.changePercent) : "N/A",

          nasdaqPos: nasdaq ? nasdaq.changePercent >= 0 : null,
          goldPos: gold ? gold.changePercent >= 0 : null,
          dowPos: dow ? dow.changePercent >= 0 : null,

          // Absolute prices
          nasdaqPrice: nasdaq?.price ?? null,
          goldPrice: gold?.price ?? null,
          dowPrice: dow?.price ?? null,

          // ❌ USDINR removed from here
          usdInr: "N/A",
          usdInrPos: null,
          usdInrRate: null,
          usdInrAbsPrice: null,
        });
      })
      .catch(() => { });
  }, [API]);

  // ── USD/INR — dedicated accurate route (Kite CDS futures → NSE → Yahoo) ───
  // Uses Kite CDS USDINR near-month futures: exact same % change as Zerodha/NSE
  useEffect(() => {
    const load = async () => {
      try {
        const r = await fetch(`${API}/kite/usdinr`);
        const json = await r.json();
        const fx = json?.data;
        if (!fx) return;

        const fmt = (v: number) => `${v >= 0 ? "+" : ""}${v.toFixed(2)}%`;

        // US Stats card
        // ✅ FIX: rate=0 aur change_pct=null dono guard karo
        setUsData(prev => ({
          ...prev,
          usdInr: fx.change_pct != null ? fmt(fx.change_pct) : prev.usdInr,
          usdInrPos: fx.change_pct != null ? fx.change_pct >= 0 : prev.usdInrPos,
          usdInrRate: (fx.rate && fx.rate > 0) ? fx.rate : prev.usdInrRate,
          usdInrAbsPrice: (fx.rate && fx.rate > 0) ? fx.rate : prev.usdInrAbsPrice,
        }));

        // Bharat card USD/INR widget
        // ✅ FIX: rate=0 reject karo (CDS band hone pe 0 aata hai) — prev value rakhho
        setBharatData(prev => ({
          ...prev,
          usdInr: (fx.rate && fx.rate > 0) ? fx.rate : prev.usdInr,
          usdInrChange: (fx.change_pct != null) ? fx.change_pct : prev.usdInrChange,
          usdInrSource: fx.source ?? prev.usdInrSource,
        }));
      } catch (_) { }
    };
    load();
    // NSE CDS is open 9:00–17:00 IST; refresh every 30s
    const t = setInterval(load, 30000);
    return () => clearInterval(t);
  }, [API]);

  // ── GIFT NIFTY — Kite NSE_IFSC near-month futures ───────────────────────
  useEffect(() => {
    const load = async () => {
      try {
        const r = await fetch(`${API}/kite/gift-nifty`);
        const json = await r.json();
        if (json.status === "success" && json.data?.last_price) {
          setBharatData(prev => ({
            ...prev,
            giftNifty: json.data.last_price ?? prev.giftNifty,
            giftNiftyChange: json.data.change_percent ?? prev.giftNiftyChange,
          }));
        }
      } catch (_) { }
    };
    load();
    const t = setInterval(load, 30000);
    return () => clearInterval(t);
  }, [API]);

  // ── Gold & Silver — MCX Kite (most accurate: actual Indian MCX futures) ────
  // Priority: Kite WebSocket → Kite REST → Yahoo fallback (all in backend)
  // /commodities route uses MCX near-month futures — REAL Indian market price
  useEffect(() => {
    const load = async () => {
      try {
        const r = await fetch(`${API}/kite/commodities`);
        const json = await r.json();
        if (json.status === "success" && json.data) {
          const { gold, silver } = json.data;
          setBharatData(prev => ({
            ...prev,
            goldInr: gold?.price_per_10g ?? prev.goldInr,
            goldChange: gold?.change_percent ?? prev.goldChange,
            goldSource: gold?.source ?? "kite-mcx",
            silverInr: silver?.price_per_kg ?? prev.silverInr,
            silverChange: silver?.change_percent ?? prev.silverChange,
            silverSource: silver?.source ?? "kite-mcx",
          }));
        }
      } catch (_) { }
    };
    load();
    // MCX market hours: refresh every 30s during market, 5min otherwise
    const t = setInterval(load, 30000);
    return () => clearInterval(t);
  }, [API]);

  // ── FII vs DII — NSE API via backend ────────────────────────────────────
  useEffect(() => {
    const load = async () => {
      try {
        const r = await fetch(`${API}/kite/fii-dii`);
        const json = await r.json();
        if (json.status === "success" && json.data) {
          const { fii, dii } = json.data;
          setBharatData(prev => ({
            ...prev,
            fiiNet: fii?.net ?? prev.fiiNet,
            diiNet: dii?.net ?? prev.diiNet,
            fiiDate: fii?.date ?? prev.fiiDate,
          }));
        }
      } catch (_) { }
    };
    load();
    const t = setInterval(load, 5 * 60 * 1000);   // NSE updates a few times/day
    return () => clearInterval(t);
  }, [API]);

  // ── Theme tokens ─────────────────────────────────────────────────────────
  const sectionStyle = isLight
    ? { background: "linear-gradient(180deg, #FCFDFE 0%, #F2F7FB 40%, #EAF2F8 70%, #FCFDFE 100%)" }
    : { background: "linear-gradient(180deg, #041421 0%, #072134 28%, #0A3656 54%, #1F5F89 68%, #062334 82%, #041421 100%)" };
  const sectionCls = isLight
    ? "text-slate-900 pt-4 pb-4 md:pt-6 md:pb-4 relative overflow-hidden"
    : "text-white pt-4 pb-4 md:pt-6 md:pb-4 relative overflow-hidden";
  const cardBg = isLight ? "#FCFDFE" : "rgba(8,31,49,0.58)";
  const cardBorder = isLight ? "1px solid rgba(4,20,33,0.11)" : "1px solid rgba(124,166,194,0.28)";
  const cardShadow = isLight
    ? "0 4px 16px rgba(4,20,33,0.08), 0 12px 28px rgba(4,20,33,0.06)"
    : "0 10px 34px rgba(0,0,0,0.44), inset 0 1px 0 rgba(148,194,220,0.08)";
  const tabWrapStyle = isLight
    ? { display: "inline-flex", alignItems: "center", gap: 4, background: "#FCFDFE", border: "1px solid rgba(4,20,33,0.10)", borderRadius: 10, padding: 4, boxShadow: "0 1px 6px rgba(4,20,33,0.06)" } as const
    : { display: "inline-flex", alignItems: "center", gap: 4, background: "rgba(8,31,49,0.62)", border: "1px solid rgba(124,166,194,0.30)", borderRadius: 10, padding: 4, boxShadow: "0 2px 12px rgba(0,0,0,0.34)" } as const;
  const activeTabStyle = { background: "linear-gradient(135deg,#0A3656,#1F5F89)", color: "#fff", fontWeight: 600, border: "none", boxShadow: "0 2px 8px rgba(10,54,86,0.50)" } as const;
  const inactiveTabStyle = isLight
    ? { background: "transparent", color: "#35566f", fontWeight: 500, border: "none", boxShadow: "none" }
    : { background: "transparent", color: "#90b4ce", fontWeight: 500, border: "none", boxShadow: "none" };
  const inactiveHoverStyle = isLight
    ? { background: "rgba(4,20,33,0.06)", color: "#041421", border: "none", boxShadow: "none" }
    : { background: "rgba(124,166,194,0.22)", color: "#d4e3ef", border: "none", boxShadow: "none" };

  return (
    <section className={sectionCls} style={sectionStyle}>
      {/* Ambient glow — top center */}
      <div style={{
        position: "absolute", top: "-25%", left: "50%", transform: "translateX(-50%)",
        width: "900px", height: "700px", borderRadius: "50%",
        background: isLight
          ? "radial-gradient(ellipse, rgba(31,95,137,0.11) 0%, transparent 66%)"
          : "radial-gradient(ellipse, rgba(31,95,137,0.34) 0%, rgba(10,54,86,0.16) 36%, rgba(20,40,80,0.04) 55%, transparent 72%)",
        pointerEvents: "none", zIndex: 0,
      }} />
      {/* Ambient glow — left edge (dark only) */}
      {!isLight && <div style={{
        position: "absolute", top: "20%", left: "-8%",
        width: "400px", height: "500px", borderRadius: "50%",
        background: "radial-gradient(ellipse, rgba(31,95,137,0.12) 0%, transparent 70%)",
        pointerEvents: "none", zIndex: 0, filter: "blur(40px)",
      }} />}
      {/* Ambient glow — right edge (dark only) */}
      {!isLight && <div style={{
        position: "absolute", top: "40%", right: "-5%",
        width: "350px", height: "400px", borderRadius: "50%",
        background: "radial-gradient(ellipse, rgba(16,185,129,0.04) 0%, transparent 70%)",
        pointerEvents: "none", zIndex: 0, filter: "blur(40px)",
      }} />}

      <div className="container mx-auto px-4 sm:px-6 relative z-10">
        <div className="max-w-5xl mx-auto text-center animate-fade-in">

          {/* Professional badge */}
          <div className="flex justify-center mb-2 md:mb-3">
            <span style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              padding: "6px 16px", borderRadius: 20,
              fontSize: 11, fontWeight: 600, letterSpacing: "0.06em",
              textTransform: "uppercase" as const,
              background: isLight ? "rgba(252,253,254,0.92)" : "rgba(10,54,86,0.24)",
              color: isLight ? "#1F5F89" : "#9bc1da",
              border: isLight ? "1px solid rgba(4,20,33,0.10)" : "1px solid rgba(128,180,210,0.24)",
              boxShadow: isLight ? "0 1px 5px rgba(4,20,33,0.05)" : "0 2px 8px rgba(0,0,0,0.22)",
            }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#22c55e", display: "inline-block", boxShadow: "0 0 8px rgba(34,197,94,0.6)" }} />
              Live Market Intelligence
            </span>
          </div>

          <h1
            key={theme}
            className="font-extrabold tracking-tight mb-2 px-2"
            style={{
              fontSize: "clamp(1.3rem, 3.5vw, 2.6rem)",
              lineHeight: 1.1,
              color: isLight ? "#041421" : "#e8edf5",
            }}
          >
            Where Vision Meets Values
          </h1>
          {/* ── Coming Soon badge ── */}
          <div style={{ marginTop: 10, marginBottom: 8 }}>
            <span style={{
              display: "inline-flex", alignItems: "center", gap: 7,
              padding: "4px 12px 4px 6px", borderRadius: 99,
              background: isLight ? "rgba(31,95,137,0.07)" : "rgba(10,54,86,0.55)",
              border: isLight ? "1px solid rgba(31,95,137,0.18)" : "1px solid rgba(128,180,210,0.22)",
            }}>
              <span style={{
                display: "inline-flex", alignItems: "center", gap: 4,
                background: isLight ? "rgba(31,95,137,0.14)" : "rgba(31,95,137,0.55)",
                border: isLight ? "1px solid rgba(31,95,137,0.20)" : "1px solid rgba(128,180,210,0.28)",
                borderRadius: 99, padding: "2px 8px",
                fontSize: 9, fontWeight: 800, letterSpacing: "0.09em", textTransform: "uppercase" as const,
                color: isLight ? "#1F5F89" : "#9bc1da",
              }}>
                <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#f59e0b", display: "inline-block", boxShadow: "0 0 6px rgba(245,158,11,0.8)" }} />
                Coming Soon
              </span>
              <span style={{ fontSize: 11, fontWeight: 500, color: isLight ? "#35566f" : "#7aa3be" }}>
                Daily Research Reports
              </span>
            </span>
          </div>

          {/* ── Subtitle ── */}
          <p
            className="mx-auto max-w-2xl"
            style={{
              fontSize: "clamp(0.75rem, 1.3vw, 0.95rem)",
              lineHeight: 1.5,
              letterSpacing: "0.01em",
              color: isLight ? "#35566f" : "#94a3b8",
              marginBottom: 0,
            }}>
            Daily research-backed stock insights —{" "}
            <span style={{
              color: isLight ? "#1F5F89" : "#9bc1da",
              fontWeight: 600,
            }}>
              where every pick is powered by analysis
            </span>
            , not assumptions.
          </p>



          {/* Divider + Tab Switcher */}
          <div className="flex flex-col items-center" style={{ marginTop: 12 }}>
            <div style={{
              width: 36, height: 2, borderRadius: 1,
              background: isLight ? "rgba(31,95,137,0.28)" : "rgba(128,180,210,0.30)",
              marginBottom: 12,
            }} />
            <div style={tabWrapStyle}>
              {["bharat", "us"].map((key) => {
                const active = activeTab === key;
                return (
                  <button key={key} onClick={() => setActiveTab(key)}
                    style={{ ...(active ? activeTabStyle : inactiveTabStyle), display: "flex", flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, padding: "8px 18px", borderRadius: 8, cursor: "pointer", transition: "all 0.15s ease", outline: "none", whiteSpace: "nowrap" }}
                    onMouseEnter={e => { if (!active) Object.assign(e.currentTarget.style, inactiveHoverStyle); }}
                    onMouseLeave={e => { if (!active) Object.assign(e.currentTarget.style, inactiveTabStyle); }}>
                    <span style={{ fontSize: 14, lineHeight: 1 }}>{key === "bharat" ? "🇮🇳" : "🇺🇸"}</span>
                    <span style={{ fontSize: 13, lineHeight: 1, fontWeight: active ? 600 : 500 }}>{key === "bharat" ? "Bharat Stats" : "US Stats"}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* ── Mobile-only card overflow fix ── */}
          <style>{`
            @media (max-width: 640px) {
              .hero-stat-grid > * {
                min-width: 0;
                overflow: hidden;
                box-sizing: border-box;
              }
            }
          `}</style>

          {/* ── BHARAT grid ── */}
          {activeTab === "bharat" && (
            <div className="hero-stat-grid mt-4 md:mt-5 grid grid-cols-2 lg:grid-cols-3 gap-2 md:gap-3 max-w-5xl mx-auto px-1 sm:px-0">
              <SensexNiftyCard cardBg={cardBg} cardBorder={cardBorder} cardShadow={cardShadow} isLight={isLight}
                sensex={bharatData.sensex} nifty={bharatData.nifty50} />
              <FiiDiiCard cardBg={cardBg} cardBorder={cardBorder} cardShadow={cardShadow} isLight={isLight}
                fiiNet={bharatData.fiiNet} diiNet={bharatData.diiNet} fiiDate={bharatData.fiiDate} />
              <IndiaVixCard cardBg={cardBg} cardBorder={cardBorder} cardShadow={cardShadow} isLight={isLight}
                vixData={bharatData.indiaVix} />
              <GiftNiftyCard cardBg={cardBg} cardBorder={cardBorder} cardShadow={cardShadow} isLight={isLight}
                liveGiftNifty={bharatData.giftNifty} liveGiftChange={bharatData.giftNiftyChange} />
              <UsdInrCard cardBg={cardBg} cardBorder={cardBorder} cardShadow={cardShadow} isLight={isLight}
                liveValue={bharatData.usdInr ?? usData.usdInrRate}
                liveChange={bharatData.usdInrChange} />
              <GoldSilverCard cardBg={cardBg} cardBorder={cardBorder} cardShadow={cardShadow} isLight={isLight}
                liveGold={bharatData.goldInr} liveGoldChange={bharatData.goldChange}
                liveSilver={bharatData.silverInr} liveSilverChange={bharatData.silverChange}
                goldSource={bharatData.goldSource} silverSource={bharatData.silverSource} />
            </div>
          )}

          {/* ── US grid ── */}
          {activeTab === "us" && (
            <div className="hero-stat-grid mt-4 md:mt-5 grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3 max-w-5xl mx-auto px-1 sm:px-0 items-stretch">
              <USStatCard label="NASDAQ" value={usData.nasdaq} absPrice={usData.nasdaqPrice} positive={usData.nasdaqPos} cardBg={cardBg} cardBorder={cardBorder} cardShadow={cardShadow} isLight={isLight} />
              <USStatCard label="Dow Jones" value={usData.dow} absPrice={usData.dowPrice} positive={usData.dowPos} cardBg={cardBg} cardBorder={cardBorder} cardShadow={cardShadow} isLight={isLight} />
              <USStatCard label="USD / INR"
                value={(() => {
                  const v = usData.usdInr;
                  return v && v !== "N/A" ? v : (bharatData.usdInrChange != null ? `${bharatData.usdInrChange >= 0 ? "+" : ""}${bharatData.usdInrChange.toFixed(2)}%` : "N/A");
                })()}
                absPrice={usData.usdInrAbsPrice ?? bharatData.usdInr}
                absPricePrefix="₹"
                positive={usData.usdInrPos ?? (bharatData.usdInrChange != null ? bharatData.usdInrChange >= 0 : null)}
                cardBg={cardBg} cardBorder={cardBorder} cardShadow={cardShadow} isLight={isLight} />
              <USStatCard label="Gold"
                value={usData.gold}
                absPrice={usData.goldPrice}
                absPricePrefix=""
                positive={usData.goldPos}
                cardBg={cardBg} cardBorder={cardBorder} cardShadow={cardShadow} isLight={isLight} />
            </div>
          )}

        </div>
      </div>
    </section>
  );
};

export default Hero;