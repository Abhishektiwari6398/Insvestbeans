"use client";

import { useState, useEffect } from "react";
import { useTheme } from "@/controllers/Themecontext";
import { useAuth } from "@/controllers/AuthContext";
import Layout from "@/components/Layout";
import { useNavigate } from "react-router-dom";
import {
  Check, X, Sparkles, BookOpen, Lightbulb,
  GraduationCap, Globe, TrendingUp, Zap, Shield, Star,
  CheckCircle, Clock, RefreshCw,
  ChevronDown, ChevronUp, Phone, MessageCircle,
} from "lucide-react";

// ─────────────────────────────────────────────────────────────────────────────
//  UserSubscription type
// ─────────────────────────────────────────────────────────────────────────────
interface UserSubscription {
  plan:          string;
  status:        string;
  endDate:       string;
  daysRemaining: number;
}

function daysText(days: number): string {
  if (days <= 0)  return "Expires today";
  if (days === 1) return "1 day left";
  if (days <= 30) return `${days} days left`;
  const months = Math.floor(days / 30);
  const rem    = days % 30;
  if (rem === 0) return `${months} month${months > 1 ? "s" : ""} left`;
  return `${months}m ${rem}d left`;
}

// ─────────────────────────────────────────────────────────────────────────────
//  DATA
// ─────────────────────────────────────────────────────────────────────────────

const PLANS = [
  {
    id:              "foundation",
    color:           "#22c55e",
    colorLight:      "#22c55e",
    colorDark:       "#4ade80",
    colorDim:        "rgba(34,197,94,0.12)",
    colorDimDark:    "rgba(74,222,128,0.14)",
    colorBorder:     "rgba(34,197,94,0.30)",
    colorBorderDark: "rgba(74,222,128,0.34)",
    emoji:    "🟢",
    badge:    "For Beginners",
    name:     "Foundation",
    tagline:  "Build Your Market Foundation",
    quote:    "Learn markets with structured knowledge before risking capital",
    price:    "₹111",
    unit:     "per course / PDF",
    cta:      "Start Learning",
    icon:     BookOpen,
    popular:  false,
    benefits: [
      "Understand how financial markets actually work",
      "Learn investing and trading from first principles",
      "Structured financial learning through curated e-books",
      "Certification programs for practical understanding",
      "Build confidence before entering active trading",
      "Develop disciplined financial thinking",
    ],
    valueNote: "Ideal for beginners starting their financial journey.",
  },
  // {
  //   id:              "command",
  //   color:           "#3b82f6",
  //   colorLight:      "#3b82f6",
  //   colorDark:       "#60a5fa",
  //   colorDim:        "rgba(59,130,246,0.12)",
  //   colorDimDark:    "rgba(96,165,250,0.14)",
  //   colorBorder:     "rgba(59,130,246,0.30)",
  //   colorBorderDark: "rgba(96,165,250,0.34)",
  //   emoji:    "🔵",
  //   badge:    "Most Popular",
  //   name:     "Command",
  //   tagline:  "Take Command of Market Data",
  //   quote:    "Monitor markets through exclusive dashboards built for decision clarity",
  //   price:    "₹888",
  //   unit:     "per month",
  //   cta:      "Access Dashboards",
  //   icon:     BarChart3,
  //   popular:  true,
  //   benefits: [
  //     "Track Indian and global markets in one unified workspace",
  //     "Exclusive equity, commodity, and currency dashboards",
  //     "Visual market intelligence for faster understanding",
  //     "Bharat, Global & ETF strategic dashboards",
  //     "Reduce information noise with structured data views",
  //     "Designed for active market participants",
  //   ],
  //   valueNote: "Best for traders who want clarity without complexity.",
  // },
  {
    id:              "edge",
    color:           "#a855f7",
    colorLight:      "#a855f7",
    colorDark:       "#c084fc",
    colorDim:        "rgba(168,85,247,0.12)",
    colorDimDark:    "rgba(192,132,252,0.14)",
    colorBorder:     "rgba(168,85,247,0.30)",
    colorBorderDark: "rgba(192,132,252,0.34)",
    emoji:    "🟣",
    badge:    "For Serious Investors",
    name:     "Edge",
    tagline:  "Where Insight Becomes Advantage",
    quote:    "Research-backed intelligence to understand market movements deeper",
    price:    "₹99",
    unit:     "per month",
    cta:      "Get The Edge",
    icon:     Lightbulb,
    popular:  false,
    benefits: [
      "Research-driven analysis across domestic and global markets",
      "InvestBeans event-based market insights",
      "IPO research and opportunity interpretation",
      "Understand the 'why' behind market movements",
      "Early access to research publications",
      "Built for serious investors and decision makers",
    ],
    valueNote: "For traders seeking an informed market edge.",
  },
];

// Feature comparison table data
const COMPARISON_SECTIONS = [
  {
    icon: GraduationCap,
    title: "Learning & Courses",
    color: "#22c55e",
    rows: [
      { label: "Financial E-Books",         foundation: true,  edge: false },
      { label: "Non-Financial E-Books",      foundation: true,  edge: false },
      { label: "Certification Programs",     foundation: true,  edge: false },
      { label: "Structured Learning Access", foundation: true,  edge: false },
    ],
  },
  {
    icon: TrendingUp,
    title: "Research & Insights",
    color: "#a855f7",
    rows: [
      { label: "Domestic Market Research",    foundation: false, edge: true },
      { label: "Global Market Research",       foundation: false, edge: true },
      { label: "Event-Based Research Reports", foundation: false, edge: true },
      { label: "IPO Research & Insights",      foundation: false, edge: true },
      { label: "Research Publications Access", foundation: false, edge: true },
      { label: "Early Research Updates",       foundation: false, edge: true },
    ],
  },
  {
    icon: Shield,
    title: "Member Experience",
    color: "#f59e0b",
    rows: [
      { label: "Dedicated Member Access",      foundation: true,  edge: true  },
      { label: "Priority Updates",             foundation: false, edge: true, edgeLabel: "Priority" },
      { label: "Platform Enhancements Access", foundation: true,  edge: true  },
    ],
  },
];

// ─────────────────────────────────────────────────────────────────────────────
//  PLAN CARD  ← Subscription-aware version
// ─────────────────────────────────────────────────────────────────────────────
function PlanCard({
  plan, isLight, onCta, subscription,
}: {
  plan:          typeof PLANS[0];
  isLight:       boolean;
  onCta:         () => void;
  subscription?: UserSubscription;
}) {
  const Icon = plan.icon;

  const isActive  = subscription?.status === "active" && (subscription?.daysRemaining ?? 0) > 0;
  const isExpired = !!subscription && !isActive;
  const daysLeft  = subscription?.daysRemaining ?? 0;

  const pColor = isLight ? plan.colorLight : plan.colorDark;
  const pDim   = isLight ? plan.colorDim   : plan.colorDimDark;
  const pBdr   = isLight ? plan.colorBorder : plan.colorBorderDark;

  const cardBg = isLight
    ? plan.popular ? "linear-gradient(145deg,#FCFDFE,#f0f7ff)" : "#FCFDFE"
    : plan.popular ? "linear-gradient(145deg,#0f1f3d,#0d1a35)" : "rgba(13,25,45,0.72)";

  const cardBorder = isActive
    ? `2px solid rgba(34,197,94,0.5)`
    : plan.popular
      ? `2px solid ${pColor}`
      : isLight ? "1.5px solid rgba(4,20,33,0.10)" : "1.5px solid rgba(124,166,194,0.20)";

  const cardShadow = isActive
    ? `0 8px 32px rgba(34,197,94,0.15), 0 2px 8px rgba(0,0,0,0.06)`
    : plan.popular
      ? `0 20px 60px ${pDim}, 0 4px 20px rgba(0,0,0,0.1)`
      : isLight ? "0 6px 24px rgba(4,20,33,0.08)" : "0 4px 24px rgba(0,0,0,0.3)";

  const nameColor    = isLight ? "#041421"              : "#e8edf5";
  const taglineColor = isLight ? "rgba(4,20,33,0.70)"  : "rgba(203,213,225,1)";
  const quoteColor   = isLight ? "rgba(4,20,33,0.55)"  : "rgba(148,163,184,1)";
  const benefitColor = isLight ? "rgba(4,20,33,0.78)"  : "rgba(203,213,225,1)";
  const noteColor    = isLight ? "rgba(4,20,33,0.45)"  : "rgba(148,163,184,0.7)";
  const dividerColor = isLight ? "rgba(4,20,33,0.08)"  : "rgba(255,255,255,0.07)";

  const ctaConfig = (() => {
    if (isActive) {
      return {
        label:    "Currently Active",
        icon:     <CheckCircle size={14} />,
        disabled: true,
        bg:       isLight ? "rgba(34,197,94,0.10)" : "rgba(34,197,94,0.15)",
        color:    "#16a34a",
        border:   "1.5px solid rgba(34,197,94,0.30)",
        shadow:   "none",
        cursor:   "default",
      };
    }
    if (isExpired) {
      return {
        label:    "Renew Plan",
        icon:     <RefreshCw size={14} />,
        disabled: false,
        bg:       plan.popular
          ? `linear-gradient(135deg,${pColor},${pColor}cc)`
          : pDim,
        color:    plan.popular ? "#fff" : pColor,
        border:   plan.popular ? "none" : `1.5px solid ${pBdr}`,
        shadow:   plan.popular ? `0 6px 20px ${pDim}` : "none",
        cursor:   "pointer",
      };
    }
    return {
      label:    plan.cta,
      icon:     null,
      disabled: false,
      bg:       plan.popular
        ? `linear-gradient(135deg,${pColor},${pColor}cc)`
        : pDim,
      color:    plan.popular ? "#fff" : pColor,
      border:   plan.popular ? "none" : `1.5px solid ${pBdr}`,
      shadow:   plan.popular ? `0 6px 20px ${pDim}` : "none",
      cursor:   "pointer",
    };
  })();

  return (
    <div
      style={{
        background:    cardBg,
        border:        cardBorder,
        boxShadow:     cardShadow,
        borderRadius:  "24px",
        padding:       "32px 28px",
        position:      "relative",
        display:       "flex",
        flexDirection: "column",
        marginTop:     plan.popular ? "-10px" : "10px",
        marginBottom:  plan.popular ? "10px"  : "0px",
        transition:    "transform 0.2s ease, box-shadow 0.2s ease",
      }}
      onMouseEnter={e => {
        if (!plan.popular && !isActive)
          e.currentTarget.style.transform = "translateY(-4px)";
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform = "translateY(0)";
      }}
    >
      {plan.popular && !isActive && (
        <div style={{
          position: "absolute", top: "-14px", left: "50%",
          transform: "translateX(-50%)",
          background: `linear-gradient(135deg,${pColor},${pColor}99)`,
          color: "#fff", fontSize: "11px", fontWeight: 800,
          padding: "5px 18px", borderRadius: "100px",
          letterSpacing: "0.08em", textTransform: "uppercase",
          boxShadow: `0 4px 16px ${pDim}`,
          whiteSpace: "nowrap",
          display: "flex", alignItems: "center", gap: "5px",
        }}>
          <Star size={10} fill="white" /> Most Popular
        </div>
      )}

      {isActive && (
        <div style={{
          position: "absolute", top: "-14px", left: "50%",
          transform: "translateX(-50%)",
          background: "linear-gradient(135deg,#16a34a,#22c55e)",
          color: "#fff", fontSize: "11px", fontWeight: 800,
          padding: "5px 18px", borderRadius: "100px",
          letterSpacing: "0.08em", textTransform: "uppercase",
          boxShadow: "0 4px 16px rgba(34,197,94,0.35)",
          whiteSpace: "nowrap",
          display: "flex", alignItems: "center", gap: "5px",
        }}>
          <CheckCircle size={10} /> Active Plan
        </div>
      )}

      <div style={{
        display: "flex", justifyContent: "space-between",
        alignItems: "flex-start", marginBottom: "20px",
      }}>
        <div style={{
          width: "48px", height: "48px", borderRadius: "14px",
          background: isActive ? "rgba(34,197,94,0.12)" : pDim,
          border: isActive ? "1.5px solid rgba(34,197,94,0.30)" : `1.5px solid ${pBdr}`,
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <Icon size={22} style={{ color: isActive ? "#16a34a" : pColor }} />
        </div>

        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "4px" }}>
          <span style={{
            fontSize: "10px", fontWeight: 700, letterSpacing: "0.07em",
            textTransform: "uppercase",
            color: isActive ? "#16a34a" : pColor,
            background: isActive ? "rgba(34,197,94,0.10)" : pDim,
            border: isActive ? "1px solid rgba(34,197,94,0.25)" : `1px solid ${pBdr}`,
            borderRadius: "100px", padding: "4px 12px",
          }}>
            {plan.badge}
          </span>

          {isExpired && (
            <span style={{
              fontSize: "10px", fontWeight: 700, letterSpacing: "0.06em",
              textTransform: "uppercase",
              color: "#dc2626",
              background: "rgba(239,68,68,0.10)",
              border: "1px solid rgba(239,68,68,0.25)",
              borderRadius: "100px", padding: "3px 10px",
            }}>
              Expired
            </span>
          )}
        </div>
      </div>

      <h3 style={{
        margin: "0 0 4px", fontSize: "22px", fontWeight: 800,
        color: nameColor, letterSpacing: "-0.02em",
      }}>
        {plan.name}
      </h3>
      <p style={{ margin: "0 0 10px", fontSize: "13px", fontWeight: 600, color: taglineColor }}>
        {plan.tagline}
      </p>
      <p style={{ margin: "0 0 22px", fontSize: "12px", fontStyle: "italic", color: quoteColor, lineHeight: 1.6 }}>
        "{plan.quote}"
      </p>

      <div style={{ height: "1px", background: dividerColor, marginBottom: "22px" }} />

      <div style={{ marginBottom: "22px" }}>
        <span style={{
          fontSize: "36px", fontWeight: 900,
          color: isActive ? "#16a34a" : pColor,
          letterSpacing: "-0.03em", lineHeight: 1,
        }}>
          {plan.price}
        </span>
        <br />
        <span style={{ fontSize: "12px", color: quoteColor, fontWeight: 500 }}>
          {plan.unit}
        </span>
      </div>

      {isActive && (
        <div style={{
          display: "flex", alignItems: "center", gap: "7px",
          background: "rgba(34,197,94,0.08)",
          border: "1px solid rgba(34,197,94,0.20)",
          borderRadius: "10px", padding: "9px 14px",
          marginBottom: "18px",
        }}>
          <Clock size={13} color="#16a34a" />
          <span style={{ fontSize: "12px", fontWeight: 700, color: "#16a34a" }}>
            {daysText(daysLeft)}
          </span>
          <span style={{ fontSize: "11px", color: "#22c55e", marginLeft: "auto", opacity: 0.8 }}>
            Access active
          </span>
        </div>
      )}

      {isExpired && (
        <div style={{
          display: "flex", alignItems: "center", gap: "7px",
          background: "rgba(239,68,68,0.07)",
          border: "1px solid rgba(239,68,68,0.18)",
          borderRadius: "10px", padding: "9px 14px",
          marginBottom: "18px",
        }}>
          <RefreshCw size={13} color="#dc2626" />
          <span style={{ fontSize: "12px", fontWeight: 700, color: "#dc2626" }}>
            Plan expired — renew to restore access
          </span>
        </div>
      )}

      <div style={{
        display: "flex", flexDirection: "column", gap: "10px",
        marginBottom: "24px", flex: 1,
      }}>
        {plan.benefits.map((b, i) => (
          <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: "10px" }}>
            <div style={{
              width: "18px", height: "18px", borderRadius: "50%",
              flexShrink: 0, marginTop: "1px",
              background: isActive ? "rgba(34,197,94,0.12)" : pDim,
              border: isActive ? "1px solid rgba(34,197,94,0.25)" : `1px solid ${pBdr}`,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <Check size={10} strokeWidth={3} style={{ color: isActive ? "#16a34a" : pColor }} />
            </div>
            <span style={{ fontSize: "13px", color: benefitColor, lineHeight: 1.5 }}>
              {b}
            </span>
          </div>
        ))}
      </div>

      <p style={{
        margin: "0 0 20px", fontSize: "11px",
        color: noteColor, fontStyle: "italic", textAlign: "center",
      }}>
        {plan.valueNote}
      </p>

      <button
        onClick={() => !ctaConfig.disabled && onCta()}
        disabled={ctaConfig.disabled}
        style={{
          width: "100%", padding: "14px", borderRadius: "14px",
          fontSize: "14px", fontWeight: 700,
          cursor:     ctaConfig.cursor as any,
          background: ctaConfig.bg,
          color:      ctaConfig.color,
          border:     ctaConfig.border,
          boxShadow:  ctaConfig.shadow,
          transition: "all 0.2s ease",
          letterSpacing: "0.02em",
          display: "flex", alignItems: "center",
          justifyContent: "center", gap: "7px",
          opacity: ctaConfig.disabled ? 0.9 : 1,
        } as React.CSSProperties}
        onMouseEnter={e => {
          if (!ctaConfig.disabled) {
            (e.currentTarget as HTMLButtonElement).style.transform = "translateY(-2px)";
            (e.currentTarget as HTMLButtonElement).style.boxShadow = `0 10px 28px ${pDim}`;
          }
        }}
        onMouseLeave={e => {
          (e.currentTarget as HTMLButtonElement).style.transform = "translateY(0)";
          (e.currentTarget as HTMLButtonElement).style.boxShadow = ctaConfig.shadow;
        }}
      >
        {ctaConfig.icon}
        {ctaConfig.label}
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
//  CHECK / X CELL
// ─────────────────────────────────────────────────────────────────────────────
function Cell({ value, color = "#22c55e", label }: { value: boolean; color?: string; label?: string }) {
  if (value && label) {
    return (
      <div style={{
        margin: "0 auto", textAlign: "center",
        background: `${color}15`, border: `1px solid ${color}35`,
        borderRadius: "20px", padding: "3px 10px", display: "inline-block",
      }}>
        <span style={{ fontSize: "10px", fontWeight: 700, color, letterSpacing: "0.05em", whiteSpace: "nowrap" }}>
          {label}
        </span>
      </div>
    );
  }
  if (value) {
    return (
      <div style={{
        width: "28px", height: "28px", borderRadius: "50%", margin: "0 auto",
        background: `${color}18`, border: `1.5px solid ${color}40`,
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <Check size={13} strokeWidth={3} style={{ color }} />
      </div>
    );
  }
  return (
    <div style={{ width: "28px", height: "28px", margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ width: "14px", height: "2px", background: "rgba(148,163,184,0.3)", borderRadius: "2px" }} />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
//  MOBILE PLAN TAB
// ─────────────────────────────────────────────────────────────────────────────
const PLAN_KEYS = [
  { key: "foundation", name: "Foundation", color: "#22c55e", icon: BookOpen },
  { key: "edge",       name: "Edge",       color: "#a855f7", icon: Lightbulb },
] as const;
type PlanKey = "foundation" | "edge";

// ─────────────────────────────────────────────────────────────────────────────
//  MOBILE COLLAPSIBLE SECTIONS
// ─────────────────────────────────────────────────────────────────────────────
function MobileSections({
  activePlan, activePlanData, isLight, labelColor, divColor,
}: {
  activePlan: PlanKey;
  activePlanData: typeof PLAN_KEYS[0];
  isLight: boolean;
  labelColor: string;
  divColor: string;
}) {
  const [openSections, setOpenSections] = useState<Record<string, boolean>>(
    Object.fromEntries(COMPARISON_SECTIONS.map(s => [s.title, true]))
  );

  const toggleSection = (title: string) =>
    setOpenSections(prev => ({ ...prev, [title]: !prev[title] }));

  return (
    <>
      {COMPARISON_SECTIONS.map((section, si) => {
        const isOpen = openSections[section.title];
        const Icon = section.icon;

        return (
          <div key={section.title} style={{
            borderTop: si > 0 ? `1px solid ${divColor}` : "none",
          }}>
            <button
              onClick={() => toggleSection(section.title)}
              style={{
                width: "100%", display: "flex", alignItems: "center",
                gap: "8px", padding: "12px 20px",
                background: isOpen ? `${section.color}08` : "transparent",
                border: "none", cursor: "pointer",
                transition: "background 0.2s",
              }}
            >
              <div style={{
                width: "26px", height: "26px", borderRadius: "8px", flexShrink: 0,
                background: `${section.color}18`,
                border: `1px solid ${section.color}30`,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <Icon size={13} style={{ color: section.color }} />
              </div>
              <span style={{
                flex: 1, textAlign: "left",
                fontSize: "11px", fontWeight: 700, color: section.color,
                textTransform: "uppercase", letterSpacing: "0.07em",
              }}>
                {section.title}
              </span>
              <div style={{
                width: "22px", height: "22px", borderRadius: "50%", flexShrink: 0,
                background: `${section.color}15`,
                border: `1px solid ${section.color}30`,
                display: "flex", alignItems: "center", justifyContent: "center",
                transition: "transform 0.25s ease",
                transform: isOpen ? "rotate(0deg)" : "rotate(-180deg)",
              }}>
                <ChevronUp size={12} style={{ color: section.color }} />
              </div>
            </button>

            {isOpen && section.rows.map((row, ri) => {
              const val = row[activePlan as keyof typeof row] as boolean;
              const customLabel =
                activePlan === "edge" ? (row as any).edgeLabel : undefined;

              return (
                <div key={ri} style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  padding: "11px 20px 11px 56px",
                  borderTop: `1px solid ${divColor}`,
                  background: isLight ? "rgba(248,250,252,0.5)" : "rgba(255,255,255,0.01)",
                }}>
                  <span style={{ fontSize: "13px", color: labelColor, flex: 1, paddingRight: "12px", lineHeight: 1.4 }}>
                    {row.label}
                  </span>

                  {val ? (
                    customLabel ? (
                      <div style={{
                        background: `${activePlanData.color}15`,
                        border: `1px solid ${activePlanData.color}35`,
                        borderRadius: "20px", padding: "3px 10px", flexShrink: 0,
                      }}>
                        <span style={{ fontSize: "10px", fontWeight: 700, color: activePlanData.color, whiteSpace: "nowrap" }}>
                          {customLabel}
                        </span>
                      </div>
                    ) : (
                      <div style={{
                        width: "26px", height: "26px", borderRadius: "50%", flexShrink: 0,
                        background: `${activePlanData.color}18`,
                        border: `1.5px solid ${activePlanData.color}40`,
                        display: "flex", alignItems: "center", justifyContent: "center",
                      }}>
                        <Check size={12} strokeWidth={3} style={{ color: activePlanData.color }} />
                      </div>
                    )
                  ) : (
                    <div style={{ width: "26px", height: "26px", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <div style={{ width: "12px", height: "2px", background: "rgba(148,163,184,0.25)", borderRadius: "2px" }} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        );
      })}
    </>
  );
}

function MobileCompare({ isLight }: { isLight: boolean }) {
  const [activePlan, setActivePlan] = useState<PlanKey>("foundation");

  const cardBg     = isLight ? "rgba(255,255,255,0.98)" : "rgba(13,30,54,0.7)";
  const border     = isLight ? "1px solid rgba(226,232,240,0.9)" : "1px solid rgba(255,255,255,0.07)";
  const labelColor = isLight ? "#374151" : "rgba(203,213,225,0.85)";
  const divColor   = isLight ? "rgba(226,232,240,0.8)" : "rgba(255,255,255,0.06)";
  const sectionLabelColor = isLight ? "rgba(13,37,64,0.45)" : "rgba(148,163,184,0.6)";

  const activePlanData = PLAN_KEYS.find(p => p.key === activePlan)!;

  return (
    <div>
      <div style={{
        display: "flex", gap: "8px", marginBottom: "20px",
        background: isLight ? "rgba(255,255,255,0.6)" : "rgba(13,30,54,0.5)",
        border, borderRadius: "16px", padding: "6px",
      }}>
        {PLAN_KEYS.map(p => {
          const active = activePlan === p.key;
          const Icon = p.icon;
          return (
            <button
              key={p.key}
              onClick={() => setActivePlan(p.key)}
              style={{
                flex: 1, padding: "10px 6px", borderRadius: "11px",
                border: "none", cursor: "pointer",
                background: active ? p.color : "transparent",
                color: active ? "#fff" : p.color,
                fontWeight: 700, fontSize: "12px",
                transition: "all 0.2s",
                display: "flex", flexDirection: "column", alignItems: "center", gap: "4px",
                boxShadow: active ? `0 4px 14px ${p.color}40` : "none",
              }}
            >
              <Icon size={15} />
              {p.name}
            </button>
          );
        })}
      </div>

      <div style={{
        background: cardBg, border,
        borderRadius: "16px", overflow: "hidden",
        boxShadow: isLight ? "0 4px 24px rgba(0,0,0,0.05), 0 1px 4px rgba(0,0,0,0.03)" : "0 4px 24px rgba(0,0,0,0.3)",
      }}>
        <div style={{
          padding: "16px 20px",
          background: `${activePlanData.color}12`,
          borderBottom: `1px solid ${activePlanData.color}25`,
          display: "flex", alignItems: "center", gap: "10px",
        }}>
          <div style={{
            width: "36px", height: "36px", borderRadius: "10px",
            background: `${activePlanData.color}20`,
            border: `1.5px solid ${activePlanData.color}40`,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            {(() => { const Icon = activePlanData.icon; return <Icon size={18} style={{ color: activePlanData.color }} />; })()}
          </div>
          <div>
            <p style={{ margin: 0, fontSize: "14px", fontWeight: 800, color: activePlanData.color }}>
              {activePlanData.name} Plan
            </p>
            <p style={{ margin: 0, fontSize: "11px", color: sectionLabelColor }}>
              Features included in this plan
            </p>
          </div>
        </div>

        <MobileSections
          activePlan={activePlan}
          activePlanData={activePlanData}
          isLight={isLight}
          labelColor={labelColor}
          divColor={divColor}
        />
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
//  FULL COMPARE TABLE (desktop)
// ─────────────────────────────────────────────────────────────────────────────
function CompareTable({ isLight, headingColor, subColor, tableBg, tableBorder, tableHeadBg, tableHeadColor }: {
  isLight: boolean; headingColor: string; subColor: string;
  tableBg: string; tableBorder: string; tableHeadBg: string; tableHeadColor: string;
}) {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 640);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  return (
    <section style={{ padding: "0 16px 80px", maxWidth: isMobile ? "100%" : "1200px", margin: "0 auto" }}>
      <div style={{ textAlign: "center", marginBottom: "40px" }}>
        <div style={{
          display: "inline-flex", alignItems: "center", gap: "7px",
          background: isLight ? "rgba(13,37,64,0.05)" : "rgba(255,255,255,0.05)",
          border: isLight ? "1px solid rgba(13,37,64,0.1)" : "1px solid rgba(255,255,255,0.08)",
          borderRadius: "100px", padding: "5px 14px", marginBottom: "14px",
        }}>
          <Zap size={12} style={{ color: "#C9A84C" }} />
          <span style={{ fontSize: "11px", fontWeight: 700, color: "#C9A84C", letterSpacing: "0.1em", textTransform: "uppercase" }}>
            Full Feature Breakdown
          </span>
        </div>
        <h2 style={{ margin: "0 0 10px", fontSize: "clamp(22px,3.5vw,34px)", fontWeight: 800, color: headingColor, letterSpacing: "-0.02em" }}>
          Compare All Plans
        </h2>
        <p style={{ margin: 0, fontSize: "14px", color: subColor }}>
          See exactly what's included in each plan before you decide.
        </p>
      </div>

      {isMobile ? (
        <MobileCompare isLight={isLight} />
      ) : (
        <div style={{
          background: tableBg, border: tableBorder, borderRadius: "20px", overflow: "hidden",
          boxShadow: isLight ? "0 8px 40px rgba(13,37,64,0.08)" : "0 8px 40px rgba(0,0,0,0.3)",
          backdropFilter: "blur(12px)",
        }}>
          <div style={{
            display: "grid", gridTemplateColumns: "1.8fr repeat(2, 1fr)",
            padding: "18px 28px", background: tableHeadBg,
            borderBottom: isLight ? "1px solid rgba(13,37,64,0.08)" : "1px solid rgba(255,255,255,0.06)",
          }}>
            <span style={{ fontSize: "11px", fontWeight: 700, color: tableHeadColor, textTransform: "uppercase", letterSpacing: "0.07em" }}>
              Feature
            </span>
            {[
              { name: "Foundation", color: "#22c55e" },
              { name: "Edge",       color: "#a855f7" },
            ].map(p => (
              <div key={p.name} style={{ textAlign: "center" }}>
                <span style={{ fontSize: "12px", fontWeight: 800, color: p.color, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                  {p.name}
                </span>
              </div>
            ))}
          </div>

          <div style={{ padding: "16px 12px" }}>
            {COMPARISON_SECTIONS.map(section => (
              <DesktopComparisonSection key={section.title} section={section} isLight={isLight} />
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
//  DESKTOP COMPARISON SECTION
// ─────────────────────────────────────────────────────────────────────────────
function DesktopComparisonSection({ section, isLight }: { section: typeof COMPARISON_SECTIONS[0]; isLight: boolean }) {
  const [open, setOpen] = useState(true);
  const Icon = section.icon;

  const headerBg    = isLight ? `${section.color}08` : `${section.color}10`;
  const rowBg       = "transparent";
  const rowHoverBg  = isLight ? "rgba(248,250,252,0.9)" : "rgba(255,255,255,0.03)";
  const labelColor  = isLight ? "#374151" : "rgba(203,213,225,0.85)";
  const borderColor = isLight ? "rgba(226,232,240,0.8)" : "rgba(255,255,255,0.06)";

  return (
    <div style={{ marginBottom: "8px" }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          width: "100%", display: "flex", alignItems: "center", gap: "10px",
          padding: "13px 16px", background: headerBg,
          border: `1px solid ${section.color}20`,
          borderRadius: open ? "14px 14px 0 0" : "14px",
          cursor: "pointer",
        }}
      >
        <div style={{
          width: "30px", height: "30px", borderRadius: "9px",
          background: `${section.color}18`, border: `1px solid ${section.color}30`,
          display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
        }}>
          <Icon size={15} style={{ color: section.color }} />
        </div>
        <span style={{ fontSize: "12px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.08em", color: section.color, flex: 1, textAlign: "left" }}>
          {section.title}
        </span>
        {open ? <ChevronUp size={15} style={{ color: section.color }} /> : <ChevronDown size={15} style={{ color: section.color }} />}
      </button>

      {open && (
        <div style={{ border: `1px solid ${section.color}20`, borderTop: "none", borderRadius: "0 0 14px 14px", overflow: "hidden" }}>
          {section.rows.map((row, i) => (
            <div
              key={i}
              style={{
                display: "grid", gridTemplateColumns: "1.8fr repeat(2, 1fr)",
                alignItems: "center", padding: "13px 16px",
                background: rowBg,
                borderTop: i > 0 ? `1px solid ${borderColor}` : "none",
                transition: "background 0.15s",
              }}
              onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.background = rowHoverBg}
              onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.background = rowBg}
            >
              <span style={{ fontSize: "13px", color: labelColor }}>{row.label}</span>
              <Cell value={row.foundation} color="#22c55e" label={(row as any).foundationLabel} />
              <Cell value={row.edge}       color="#a855f7" label={(row as any).edgeLabel} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
//  Subscription hook
// ─────────────────────────────────────────────────────────────────────────────
function useUserSubscriptions(isAuthenticated: boolean) {
  const [subscriptions, setSubscriptions] = useState<UserSubscription[]>([]);

  useEffect(() => {
    if (!isAuthenticated) { setSubscriptions([]); return; }
    const API = import.meta.env.VITE_API_URL || "";
    const fetchSubs = async () => {
      try {
        const res = await fetch(`${API}/subscriptions/my`, {
          credentials: "include",
          headers: { Authorization: `Bearer ${localStorage.getItem("accessToken") || ""}` },
        });
        if (!res.ok) throw new Error("fetch failed");
        const data = await res.json();
        setSubscriptions(data.subscriptions || []);
      } catch (e) {
        console.warn("PricingPlan subscriptions fetch error:", e);
        setSubscriptions([]);
      }
    };
    fetchSubs();
  }, [isAuthenticated]);

  return subscriptions;
}

// ─────────────────────────────────────────────────────────────────────────────
//  MAIN PAGE
// ─────────────────────────────────────────────────────────────────────────────
export default function PricingPlan() {
  const { theme } = useTheme();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const isLight = theme === "light";

  const userSubscriptions = useUserSubscriptions(isAuthenticated);
  const subMap = Object.fromEntries(userSubscriptions.map(s => [s.plan, s]));

  const pageBg = isLight
    ? "linear-gradient(160deg,#f5f4f0 0%,#f8fbff 40%,#f5f4f0 100%)"
    : "linear-gradient(160deg,#060e1a 0%,#0a1628 50%,#060e1a 100%)";

  const headingColor = isLight ? "#0d1b2a" : "#e8edf5";
  const subColor     = isLight ? "rgba(13,37,64,0.55)" : "rgba(148,163,184,1)";

  const tableBg      = isLight ? "rgba(255,255,255,0.8)"      : "rgba(13,30,54,0.6)";
  const tableBorder  = isLight ? "1px solid rgba(13,37,64,0.1)" : "1px solid rgba(255,255,255,0.07)";
  const tableHeadBg  = isLight ? "rgba(13,37,64,0.03)"        : "rgba(255,255,255,0.03)";
  const tableHeadColor = isLight ? "rgba(13,37,64,0.5)"       : "rgba(148,163,184,0.7)";

  const handleCta = (planId: string) => {
    if (!isAuthenticated) {
      navigate("/signin");
    } else {
      navigate(`/plans/${planId}/checkout`);
    }
  };

  // ── Contact constants ────────────────────────────────────────────────────
  const PHONE_NUMBER   = "+917838285293";
  const WA_NUMBER      = "917838285293";
  const WA_MESSAGE     = encodeURIComponent("Hi! I'd like to know more about InvestBeans plans. Can you help me choose the right one?");
  const WA_LINK        = `https://wa.me/${WA_NUMBER}?text=${WA_MESSAGE}`;

  return (
    <Layout>
      <div style={{ background: pageBg, minHeight: "100vh" }}>

        {/* ── Hero Section ─────────────────────────────────────────────── */}
        <section style={{ padding: "56px 16px 40px", textAlign: "center", position: "relative", overflow: "hidden" }}>
          <div style={{
            position: "absolute", top: "-60px", left: "10%", width: "400px", height: "400px",
            borderRadius: "50%", background: "rgba(196,148,30,0.07)", filter: "blur(80px)", pointerEvents: "none",
          }} />
          <div style={{
            position: "absolute", bottom: "-40px", right: "10%", width: "300px", height: "300px",
            borderRadius: "50%", background: "rgba(59,130,246,0.07)", filter: "blur(60px)", pointerEvents: "none",
          }} />

          <div style={{
            display: "inline-flex", alignItems: "center", gap: "7px",
            background: "rgba(196,148,30,0.1)",
            border: "1px solid rgba(196,148,30,0.3)", borderRadius: "100px",
            padding: "6px 16px", marginBottom: "20px",
          }}>
            <Sparkles size={13} style={{ color: "#C9A84C" }} />
            <span style={{ fontSize: "11px", fontWeight: 700, color: "#C9A84C", letterSpacing: "0.1em", textTransform: "uppercase" }}>
              Simple, Transparent Pricing
            </span>
          </div>

          <h1 style={{
            margin: "0 0 16px", fontSize: "clamp(32px,5vw,56px)",
            fontWeight: 900, color: headingColor,
            letterSpacing: "-0.03em", lineHeight: 1.1,
          }}>
            Choose Your{" "}
            <span style={{
              background: "linear-gradient(135deg,#C9A84C,#e8c45a)",
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
            }}>
              InvestBeans Plan
            </span>
          </h1>

          <p style={{
            margin: "0 auto", maxWidth: "520px",
            fontSize: "clamp(14px,2vw,17px)", color: subColor, lineHeight: 1.7,
          }}>
            From foundational learning to live market dashboards and deep research intelligence —
            pick the plan that matches your investing journey.
          </p>
        </section>

        {/* ── Plan Cards ───────────────────────────────────────────────── */}
        <section style={{ padding: "0 16px 72px", maxWidth: "1200px", margin: "0 auto" }}>
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: "24px",
            alignItems: "start",
            paddingTop: "24px",
          }}>
            {PLANS.map(plan => (
              <PlanCard
                key={plan.id}
                plan={plan}
                isLight={isLight}
                onCta={() => handleCta(plan.id)}
                subscription={subMap[plan.id]}
              />
            ))}
          </div>
        </section>

        {/* ── Plan Comparison Table ─────────────────────────────────────── */}
        <CompareTable
          isLight={isLight}
          headingColor={headingColor}
          subColor={subColor}
          tableBg={tableBg}
          tableBorder={tableBorder}
          tableHeadBg={tableHeadBg}
          tableHeadColor={tableHeadColor}
        />

        {/* ── Bottom CTA Banner ─────────────────────────────────────────── */}
        <section style={{ padding: "0 20px 80px", maxWidth: "700px", margin: "0 auto", textAlign: "center" }}>
          <div style={{
            background: isLight
              ? "linear-gradient(135deg,#0d1b2a,#1a3a5c)"
              : "linear-gradient(135deg,#0f1f3d,#0d2a50)",
            borderRadius: "24px", padding: "48px 36px",
            border: "1px solid rgba(196,148,30,0.2)",
            boxShadow: "0 20px 60px rgba(0,0,0,0.25)",
            position: "relative", overflow: "hidden",
          }}>
            <div style={{
              position: "absolute", top: "-40px", right: "-40px",
              width: "200px", height: "200px", borderRadius: "50%",
              background: "rgba(196,148,30,0.12)", filter: "blur(50px)", pointerEvents: "none",
            }} />

            <div style={{
              width: "52px", height: "52px", borderRadius: "16px",
              background: "rgba(196,148,30,0.15)", border: "1.5px solid rgba(196,148,30,0.3)",
              display: "flex", alignItems: "center", justifyContent: "center",
              margin: "0 auto 20px",
            }}>
              <Globe size={24} style={{ color: "#C9A84C" }} />
            </div>

            <h3 style={{ margin: "0 0 12px", fontSize: "24px", fontWeight: 800, color: "#fff", letterSpacing: "-0.02em" }}>
              Not Sure Which Plan to Pick?
            </h3>
            <p style={{ margin: "0 0 28px", fontSize: "14px", color: "rgba(203,213,225,0.8)", lineHeight: 1.7 }}>
              Start with Foundation to build your knowledge base, or get Edge for deep research insights and early market intelligence. You can switch anytime.
            </p>

            <div style={{ display: "flex", gap: "12px", justifyContent: "center", flexWrap: "wrap" }}>

              {/* ── Talk to Us → direct phone call ── */}
              <a
                href={`tel:${PHONE_NUMBER}`}
                style={{
                  padding: "13px 28px", borderRadius: "12px", fontSize: "14px", fontWeight: 700,
                  background: "linear-gradient(135deg,#C4941E,#D4A843)",
                  border: "none", color: "#0d1b2a", cursor: "pointer",
                  boxShadow: "0 4px 16px rgba(196,148,30,0.3)",
                  transition: "all 0.2s",
                  display: "inline-flex", alignItems: "center", gap: "8px",
                  textDecoration: "none",
                }}
                onMouseEnter={e => (e.currentTarget as HTMLAnchorElement).style.transform = "translateY(-2px)"}
                onMouseLeave={e => (e.currentTarget as HTMLAnchorElement).style.transform = "translateY(0)"}
              >
                <Phone size={15} strokeWidth={2.5} />
                Talk to Us
              </a>

              {/* ── Chat on WhatsApp → opens WhatsApp chat ── */}
              <a
                href={WA_LINK}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  padding: "13px 28px", borderRadius: "12px", fontSize: "14px", fontWeight: 600,
                  background: "transparent", border: "1.5px solid rgba(255,255,255,0.15)",
                  color: "rgba(255,255,255,0.9)", cursor: "pointer",
                  transition: "all 0.2s",
                  display: "inline-flex", alignItems: "center", gap: "8px",
                  textDecoration: "none",
                }}
                onMouseEnter={e => {
                  const el = e.currentTarget as HTMLAnchorElement;
                  el.style.borderColor = "#25D366";
                  el.style.color = "#25D366";
                  el.style.background = "rgba(37,211,102,0.08)";
                }}
                onMouseLeave={e => {
                  const el = e.currentTarget as HTMLAnchorElement;
                  el.style.borderColor = "rgba(255,255,255,0.15)";
                  el.style.color = "rgba(255,255,255,0.9)";
                  el.style.background = "transparent";
                }}
              >
                {/* WhatsApp SVG icon */}
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  width="16"
                  height="16"
                >
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
                Chat on WhatsApp
              </a>

            </div>
          </div>
        </section>

      </div>
    </Layout>
  );
}