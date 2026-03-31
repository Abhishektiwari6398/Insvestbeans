/**
 * CheckoutPage.tsx
 * Route: /plans/:planId/checkout
 *
 * ✅ Production-ready Razorpay checkout page
 *
 * Flow:
 *   PricingPlan/PlanCards → navigate("/plans/command/checkout")
 *   → User sees order summary
 *   → handlePayment():
 *       1. GET /api/v1/getKey          → Razorpay publishable key
 *       2. POST /api/v1/payment/process → Create Razorpay order (saves userId/planId in notes)
 *       3. Razorpay modal opens
 *       4. User pays
 *       5. Razorpay POSTs to callback_url → backend verifies + creates Subscription
 *       6. Backend redirects to /paymentsuccess?reference=pay_xxx
 *
 * Requires in index.html (public/):
 *   <script src="https://checkout.razorpay.com/v1/checkout.js"></script>
 */

import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/controllers/AuthContext";
import { useTheme } from "@/controllers/Themecontext";
import axios from "axios";
import Layout from "@/components/Layout";
import {
  BookOpen, BarChart3, Lightbulb, Check,
  ArrowLeft, Lock, Zap, Clock,
} from "lucide-react";

// ─── Plan config — single source of truth ─────────────────────────────────────
// Keep in sync with: PlanCards.tsx, Pricingplan.tsx, paymentController.js PLAN_CONFIG
const PLAN_DATA: Record<string, {
  label:       string;
  color:       string;
  colorDim:    string;
  colorBorder: string;
  icon:        React.ElementType;
  price:       number;       // in rupees (integer)
  priceDisplay: string;
  unit:        string;
  durationDays: number;
  tagline:     string;
  features:    string[];
}> = {
  foundation: {
    label:       "Foundation",
    color:       "#0A3656",
    colorDim:    "rgba(10,54,86,0.12)",
    colorBorder: "rgba(10,54,86,0.30)",
    icon:        BookOpen,
    price:       111,
    priceDisplay: "₹111",
    unit:        "per course / PDF",
    durationDays: 365,
    tagline:     "Build Your Market Foundation",
    features: [
      "Financial E-Books access",
      "Non-Financial E-Books",
      "Certification Programs",
      "Structured Learning Access",
      "Dedicated Member Access",
      "Platform Enhancements",
    ],
  },
  command: {
    label:       "Command",
    color:       "#12466e",
    colorDim:    "rgba(18,70,110,0.14)",
    colorBorder: "rgba(18,70,110,0.34)",
    icon:        BarChart3,
    price:       888,
    priceDisplay: "₹888",
    unit:        "per month",
    durationDays: 30,
    tagline:     "Take Command of Market Data",
    features: [
      "Equity Dashboard — Domestic",
      "Equity Dashboard — Global",
      "Commodities Dashboard",
      "Currency Dashboard",
      "Bharat & Global Dashboards",
      "ETF Dashboard",
      "Research & Insights access",
      "IPO Research & Insights",
      "Event-Based Research Reports",
    ],
  },
  edge: {
    label:       "Edge",
    color:       "#1d5b87",
    colorDim:    "rgba(29,91,135,0.14)",
    colorBorder: "rgba(29,91,135,0.34)",
    icon:        Lightbulb,
    price:       99,
    priceDisplay: "₹99",
    unit:        "per month",
    durationDays: 30,
    tagline:     "Where Insight Becomes Advantage",
    features: [
      "Domestic Market Research",
      "Global Market Research",
      "Event-Based Research Reports",
      "IPO Research & Insights",
      "Research Publications Access",
      "Early Research Updates",
      "InvestBeans Insights page",
    ],
  },
};

// ─── Main Component ───────────────────────────────────────────────────────────
export default function CheckoutPage() {
  const { planId }                     = useParams<{ planId: string }>();
  const { user, isAuthenticated }      = useAuth();
  const { theme }                      = useTheme();
  const navigate                       = useNavigate();
  const isLight                        = theme === "light";
  const [loading, setLoading]          = useState(false);
  const [error, setError]              = useState<string | null>(null);

  const plan = PLAN_DATA[planId || ""];

  // ✅ VITE_API_URL should be: https://api.investbeans.com/api/v1
  // Do NOT add trailing slash in .env
  const API  = import.meta.env.VITE_API_URL || "";

  // ── Guard: must be logged in ───────────────────────────────────────────────
  useEffect(() => {
    if (!isAuthenticated) {
      navigate(`/signin?redirect=/plans/${planId}/checkout`);
    }
  }, [isAuthenticated, planId, navigate]);

  // ── Theme tokens ──────────────────────────────────────────────────────────
  const pageBg  = isLight
    ? "linear-gradient(160deg,#f5f4f0 0%,#f8fbff 50%,#f5f4f0 100%)"
    : "linear-gradient(160deg,#060e1a 0%,#0a1628 50%,#060e1a 100%)";
  const cardBg  = isLight ? "#ffffff"                 : "#0f1829";
  const cardBg2 = isLight ? "#f8fafc"                 : "#0a1220";
  const border  = isLight ? "rgba(226,232,240,0.9)"   : "rgba(255,255,255,0.07)";
  const text    = isLight ? "#0f172a"                 : "#e2e8f0";
  const muted   = isLight ? "#64748b"                 : "#64748b";
  const shadow  = isLight
    ? "0 8px 40px rgba(0,0,0,0.07), 0 2px 8px rgba(0,0,0,0.04)"
    : "0 8px 40px rgba(0,0,0,0.5)";

  // ── Invalid planId guard ──────────────────────────────────────────────────
  if (!plan) {
    return (
      <Layout>
        <div style={{ padding: "80px 20px", textAlign: "center" }}>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: text }}>Plan not found</h2>
          <button
            onClick={() => navigate("/pricing")}
            style={{
              marginTop: 16, padding: "10px 24px", borderRadius: 10,
              background: "#12466e", color: "white", border: "none",
              fontSize: 13, fontWeight: 600, cursor: "pointer",
            }}
          >
            ← Back to plans
          </button>
        </div>
      </Layout>
    );
  }

  const PlanIcon = plan.icon;

  // ── Payment handler ───────────────────────────────────────────────────────
  const handlePayment = async () => {
    if (!user) { navigate("/signin"); return; }
    setLoading(true);
    setError(null);

    try {
      // Step 1 — Get Razorpay publishable key from backend
      const { data: keyData } = await axios.get(`${API}/getKey`, {
        withCredentials: true,
      });

      // Step 2 — Create Razorpay order on backend
      // Backend saves userId, planId, durationDays in order.notes
      // These are used in paymentVerification to create the Subscription
      const { data: orderData } = await axios.post(
        `${API}/payment/process`,
        {
          amount:       plan.price,         // rupees — backend × 100 → paise
          userId:       user._id,
          planId:       planId,
          durationDays: plan.durationDays,
        },
        { withCredentials: true }
      );

      if (!orderData.success || !orderData.order?.id) {
        throw new Error(orderData.message || "Could not create order");
      }

      // Step 3 — Open Razorpay modal
      const options = {
        key:         keyData.key,
        amount:      plan.price * 100,   // paise (Razorpay needs this for display)
        currency:    "INR",
        name:        "InvestBeans",
        description: `${plan.label} Plan — ${plan.tagline}`,
        image:       "/logo.png",         // optional: your logo
        order_id:    orderData.order.id,

        // ✅ FIX: Was `${API}/api/v1/paymentVerification`
        // If VITE_API_URL = "https://api.investbeans.com/api/v1"
        // then correct is: `${API}/paymentVerification`
        // (NOT adding /api/v1 again — it's already in the base URL)
        callback_url: `${API}/paymentVerification`,

        // redirect: true ensures Razorpay POSTs to callback_url
        // (instead of calling handler function)
        redirect: true,

        prefill: {
          name:    user.name || user.displayName || "",
          email:   user.email || "",
          contact: user.phone || "",
        },
        theme:  { color: plan.color },
        modal: {
          ondismiss: () => setLoading(false),
          escape:    true,
        },
      };

      // window.Razorpay is loaded from CDN in index.html
      // @ts-ignore
      if (typeof window.Razorpay === "undefined") {
        throw new Error("Razorpay SDK not loaded. Please check your internet connection.");
      }

      // @ts-ignore
      const rzp = new window.Razorpay(options);

      rzp.on("payment.failed", (resp: any) => {
        console.error("Razorpay payment.failed:", resp.error);
        setError(
          resp.error?.description ||
          "Payment failed. Please try a different payment method."
        );
        setLoading(false);
      });

      rzp.open();

    } catch (e: any) {
      console.error("CheckoutPage handlePayment error:", e);
      setError(
        e?.response?.data?.message ||
        e?.message ||
        "Payment could not be started. Please try again."
      );
      setLoading(false);
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <Layout>
      <div style={{ background: pageBg, minHeight: "100vh", padding: "36px 16px 60px" }}>
        <div style={{ maxWidth: 540, margin: "0 auto" }}>

          {/* ── Back button ── */}
          <button
            onClick={() => navigate("/pricing")}
            style={{
              display: "flex", alignItems: "center", gap: 6,
              background: "none", border: "none", cursor: "pointer",
              color: muted, fontSize: 13, fontWeight: 600,
              marginBottom: 28, padding: 0,
            }}
          >
            <ArrowLeft size={14} /> Back to plans
          </button>

          {/* ── Main card ── */}
          <div style={{
            background: cardBg, border: `1px solid ${border}`,
            borderRadius: 24, padding: "28px 24px", boxShadow: shadow,
          }}>

            {/* Plan header */}
            <div style={{
              display: "flex", alignItems: "center", gap: 14,
              paddingBottom: 20, marginBottom: 20,
              borderBottom: `1px solid ${border}`,
            }}>
              <div style={{
                width: 52, height: 52, borderRadius: 16, flexShrink: 0,
                background: plan.colorDim, border: `1.5px solid ${plan.colorBorder}`,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <PlanIcon size={22} color={plan.color} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 20, fontWeight: 800, color: text, letterSpacing: "-0.02em" }}>
                  {plan.label} Plan
                </div>
                <div style={{ fontSize: 12, color: muted, marginTop: 2 }}>
                  {plan.tagline}
                </div>
              </div>
              <div style={{ textAlign: "right", flexShrink: 0 }}>
                <div style={{
                  fontSize: 30, fontWeight: 900, color: plan.color,
                  lineHeight: 1, letterSpacing: "-0.03em",
                }}>
                  {plan.priceDisplay}
                </div>
                <div style={{ fontSize: 11, color: muted, marginTop: 2 }}>{plan.unit}</div>
              </div>
            </div>

            {/* Duration chip */}
            <div style={{
              display: "flex", alignItems: "center", gap: 8,
              background: plan.colorDim, border: `1px solid ${plan.colorBorder}`,
              borderRadius: 12, padding: "10px 14px", marginBottom: 20,
            }}>
              <Clock size={14} color={plan.color} />
              <span style={{ fontSize: 13, fontWeight: 600, color: plan.color }}>
                {plan.durationDays === 365 ? "1 year access" : `${plan.durationDays} days access`}
              </span>
              <span style={{
                fontSize: 11, color: plan.color, opacity: 0.7, marginLeft: "auto",
              }}>
                Activates instantly
              </span>
            </div>

            {/* Features */}
            <div style={{ marginBottom: 22 }}>
              <div style={{
                fontSize: 10, fontWeight: 700, color: muted,
                textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 12,
              }}>
                What you get
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {plan.features.map((f, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{
                      width: 18, height: 18, borderRadius: "50%", flexShrink: 0,
                      background: plan.colorDim, border: `1px solid ${plan.colorBorder}`,
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                      <Check size={10} strokeWidth={3} color={plan.color} />
                    </div>
                    <span style={{ fontSize: 13, color: text, lineHeight: 1.4 }}>{f}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Billing to */}
            {user && (
              <div style={{
                background: cardBg2, border: `1px solid ${border}`,
                borderRadius: 12, padding: "12px 16px", marginBottom: 22,
              }}>
                <div style={{
                  fontSize: 10, fontWeight: 700, color: muted,
                  textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 8,
                }}>
                  Billing to
                </div>
                <div style={{ fontSize: 13, fontWeight: 600, color: text }}>
                  {user.name || user.displayName || "—"}
                </div>
                <div style={{ fontSize: 12, color: muted, marginTop: 2 }}>{user.email}</div>
              </div>
            )}

            {/* Error message */}
            {error && (
              <div style={{
                background: "rgba(239,68,68,0.08)",
                border: "1px solid rgba(239,68,68,0.2)",
                borderRadius: 10, padding: "10px 14px", marginBottom: 16,
                fontSize: 13, color: "#dc2626",
              }}>
                {error}
              </div>
            )}

            {/* ── Pay button ── */}
            <button
              onClick={handlePayment}
              disabled={loading}
              style={{
                width: "100%", padding: "15px 0", borderRadius: 14,
                background: loading
                  ? `${plan.color}70`
                  : `linear-gradient(135deg,${plan.color},${plan.color}bb)`,
                border: "none", color: "white",
                fontSize: 15, fontWeight: 800, letterSpacing: "0.01em",
                cursor: loading ? "not-allowed" : "pointer",
                transition: "all 0.2s",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                boxShadow: loading ? "none" : `0 6px 20px ${plan.colorDim}`,
              }}
              onMouseEnter={e => {
                if (!loading)
                  (e.currentTarget as HTMLButtonElement).style.transform = "translateY(-1px)";
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLButtonElement).style.transform = "translateY(0)";
              }}
            >
              {loading ? (
                <>
                  <div style={{
                    width: 16, height: 16, borderRadius: "50%",
                    border: "2px solid rgba(255,255,255,0.3)",
                    borderTopColor: "white",
                    animation: "spin 0.8s linear infinite",
                  }} />
                  Opening payment…
                </>
              ) : (
                <>
                  <Zap size={16} />
                  Pay {plan.priceDisplay} · Activate {plan.label}
                </>
              )}
            </button>

            {/* Security note */}
            <div style={{
              display: "flex", alignItems: "center", justifyContent: "center",
              gap: 5, marginTop: 12,
            }}>
              <Lock size={11} color={muted} />
              <span style={{ fontSize: 11, color: muted }}>
                Secured by Razorpay · 256-bit SSL
              </span>
            </div>
          </div>

          {/* Fine print */}
          <p style={{
            fontSize: 11, color: muted, textAlign: "center",
            marginTop: 16, lineHeight: 1.6,
          }}>
            Subscription activates instantly after payment.
            Your access will appear in your profile within seconds.
          </p>
        </div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </Layout>
  );
}