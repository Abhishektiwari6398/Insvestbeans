// PlanCards.tsx
// ✅ Features:
//   - Colors match Pricingplan.tsx (green/blue/purple)
//   - Active plan → "Active" badge + days remaining + CTA disabled
//   - Expired plan → "Expired" badge + "Renew Plan" CTA
//   - Never purchased → normal CTA

import { Check, Star, BookOpen, BarChart3, Lightbulb, CheckCircle, Clock, RefreshCw } from "lucide-react";

// ─── Types ─────────────────────────────────────────────────────────────────────
export interface UserSubscription {
  plan:         string;   // "foundation" | "command" | "edge"
  status:       string;   // "active" | "expired" | etc.
  endDate:      string;   // ISO date string
  daysRemaining: number;
}

interface PlanCardsProps {
  isLight?:          boolean;
  onCta:             (planId: string) => void;
  userSubscriptions?: UserSubscription[];  // pass from parent after API fetch
}

// ─── Plan Data ─────────────────────────────────────────────────────────────────
const PLANS = [
  {
    id:           "foundation",
    // ✅ Colors matching Pricingplan.tsx
    color:        "#22c55e",
    colorLight:   "#22c55e",
    colorDark:    "#4ade80",
    colorDim:     "rgba(34,197,94,0.12)",
    colorDimDark: "rgba(74,222,128,0.14)",
    colorBorder:  "rgba(34,197,94,0.30)",
    colorBorderDark: "rgba(74,222,128,0.34)",
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
  //   id:           "command",
  //   color:        "#3b82f6",
  //   colorLight:   "#3b82f6",
  //   colorDark:    "#60a5fa",
  //   colorDim:     "rgba(59,130,246,0.12)",
  //   colorDimDark: "rgba(96,165,250,0.14)",
  //   colorBorder:  "rgba(59,130,246,0.30)",
  //   colorBorderDark: "rgba(96,165,250,0.34)",
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
    id:           "edge",
    color:        "#a855f7",
    colorLight:   "#a855f7",
    colorDark:    "#c084fc",
    colorDim:     "rgba(168,85,247,0.12)",
    colorDimDark: "rgba(192,132,252,0.14)",
    colorBorder:  "rgba(168,85,247,0.30)",
    colorBorderDark: "rgba(192,132,252,0.34)",
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

// ─── Helper: days remaining text ───────────────────────────────────────────────
function daysText(days: number): string {
  if (days <= 0)  return "Expires today";
  if (days === 1) return "1 day left";
  if (days <= 7)  return `${days} days left`;
  if (days <= 30) return `${days} days left`;
  const months = Math.floor(days / 30);
  const rem    = days % 30;
  if (rem === 0) return `${months} month${months > 1 ? "s" : ""} left`;
  return `${months}m ${rem}d left`;
}

// ─── Single Plan Card ──────────────────────────────────────────────────────────
function PlanCard({
  plan,
  isLight = true,
  onCta,
  subscription,
}: {
  plan:          typeof PLANS[0];
  isLight?:      boolean;
  onCta:         (planId: string) => void;
  subscription?: UserSubscription;
}) {
  const Icon = plan.icon;

  // Subscription state
  const isActive  = subscription?.status === "active" && (subscription?.daysRemaining ?? 0) > 0;
  const isExpired = subscription && !isActive;
  const daysLeft  = subscription?.daysRemaining ?? 0;

  const pColor = isLight ? plan.colorLight : plan.colorDark;
  const pDim   = isLight ? plan.colorDim   : plan.colorDimDark;
  const pBdr   = isLight ? plan.colorBorder : plan.colorBorderDark;

  // Card background
  const cardBg = isLight
    ? plan.popular ? "linear-gradient(145deg,#FCFDFE,#f0f7ff)" : "#FCFDFE"
    : plan.popular ? "linear-gradient(145deg,#0f1f3d,#0d1a35)" : "rgba(13,25,45,0.72)";

  // Active plan → green tint border
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

  const nameColor    = isLight ? "#041421" : "#e8edf5";
  const taglineColor = isLight ? "rgba(4,20,33,0.70)" : "rgba(203,213,225,1)";
  const quoteColor   = isLight ? "rgba(4,20,33,0.55)" : "rgba(148,163,184,1)";
  const benefitColor = isLight ? "rgba(4,20,33,0.78)" : "rgba(203,213,225,1)";
  const noteColor    = isLight ? "rgba(4,20,33,0.45)" : "rgba(148,163,184,0.7)";
  const dividerColor = isLight ? "rgba(4,20,33,0.08)" : "rgba(255,255,255,0.07)";

  // ── CTA config based on subscription state ────────────────────────────────
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
        background:   cardBg,
        border:       cardBorder,
        boxShadow:    cardShadow,
        borderRadius: "24px",
        padding:      "32px 28px",
        position:     "relative",
        display:      "flex",
        flexDirection: "column",
        marginTop:    plan.popular ? "-10px" : "10px",
        marginBottom: plan.popular ? "10px"  : "0px",
        transition:   "transform 0.2s ease, box-shadow 0.2s ease",
      }}
      onMouseEnter={e => {
        if (!plan.popular && !isActive)
          e.currentTarget.style.transform = "translateY(-4px)";
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform = "translateY(0)";
      }}
    >
      {/* ── Most Popular badge ── */}
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

      {/* ── ACTIVE plan badge (replaces Most Popular) ── */}
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

      {/* ── Icon + Badge row ── */}
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

        {/* Plan badge (right side) */}
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

          {/* Expired tag */}
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

      {/* ── Name + Tagline + Quote ── */}
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

      {/* ── Divider ── */}
      <div style={{ height: "1px", background: dividerColor, marginBottom: "22px" }} />

      {/* ── Price row ── */}
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

      {/* ── Active: days remaining pill ── */}
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

      {/* ── Expired: renewal notice ── */}
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

      {/* ── Benefits ── */}
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

      {/* ── Value note ── */}
      <p style={{
        margin: "0 0 20px", fontSize: "11px",
        color: noteColor, fontStyle: "italic", textAlign: "center",
      }}>
        {plan.valueNote}
      </p>

      {/* ── CTA Button ── */}
      <button
        onClick={() => !ctaConfig.disabled && onCta(plan.id)}
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
        }}
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

// ─── Main Export ───────────────────────────────────────────────────────────────
export default function PlanCards({
  isLight = true,
  onCta,
  userSubscriptions = [],
}: PlanCardsProps) {
  // Build a quick lookup: planId → subscription object
  const subMap = userSubscriptions.reduce<Record<string, UserSubscription>>(
    (acc, sub) => { acc[sub.plan] = sub; return acc; },
    {}
  );

  return (
    <>
      <style>{`
        @media (max-width: 640px) {
          .plan-cards-grid {
            grid-template-columns: 1fr !important;
            padding: 16px 12px !important;
            gap: 20px !important;
          }
          .plan-cards-grid > * {
            margin-top: 10px !important;
            margin-bottom: 0px !important;
            width: 100% !important;
            box-sizing: border-box !important;
          }
        }
      `}</style>
    <div
      className="plan-cards-grid"
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
        gap: "24px",
        alignItems: "start",
        padding: "24px 16px",
        maxWidth: "1200px",
        margin: "0 auto",
      }}>
      {PLANS.map(plan => (
        <PlanCard
          key={plan.id}
          plan={plan}
          isLight={isLight}
          onCta={onCta}
          subscription={subMap[plan.id]}
        />
      ))}
    </div>
    </>
  );
}