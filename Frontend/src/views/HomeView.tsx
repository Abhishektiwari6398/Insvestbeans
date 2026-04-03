import Layout from "@/components/Layout";
import Hero from "@/components/Hero";
import axios from "axios";
import { useState, useEffect, useMemo } from "react";
import type { UserSubscription } from "./PlanCards";
import { Activity, TrendingUp } from "lucide-react";
import { useAuth } from "@/controllers/AuthContext";
import { useTheme } from "@/controllers/Themecontext";
import { useNavigate } from "react-router-dom";
import StockWidget from "./StockWidget";
import TradingViewWidget from "@/components/TradingViewWidget";
import KiteChart from "@/components/Kitechart";
import StockHeatmapWidget from "@/components/Stockheatmapwidget";
import DecodeMarket from "./DecodeMarket";
import BeansOfWisdomView from "./BeansOfWisdom";
import IPOSection from "./Iposection";
import TestimonialsPage from "@/components/Testimonials";
import Subscribeview from "./Subscribeview";
import PlanCards from "./PlanCards";
import TVDataStamp from "@/components/Tvdatastamp";

type ActiveTab = "domestic" | "global";
type HomeViewProps = { activeTab: ActiveTab; onChangeTab: (tab: ActiveTab) => void };

const HomeView = ({ activeTab, onChangeTab }: HomeViewProps) => {
  const { isAuthenticated } = useAuth();
  const { subscriptions: userSubscriptions } = useUserSubscriptions(isAuthenticated);
  const { theme } = useTheme();
  const navigate = useNavigate();
  const isLight = theme === "light";

  const GOLD = "#0A3656";
  const OCEAN = "#1F5F89";
  const SKY = "#74A8C9";

  const pageBg = isLight
    ? "linear-gradient(180deg, #FCFDFE 0%, #F2F7FB 38%, #EAF2F8 72%, #FCFDFE 100%)"
    : "linear-gradient(180deg, #041421 0%, #072134 24%, #0A3656 52%, #1F5F89 68%, #062334 84%, #041421 100%)";

  const goldBadge = isLight
    ? { background: "rgba(252,253,254,0.94)", border: "1px solid rgba(4,20,33,0.10)", boxShadow: "0 2px 10px rgba(4,20,33,0.06)" }
    : { background: "linear-gradient(135deg, rgba(10,54,86,0.24), rgba(31,95,137,0.24))", border: "1px solid rgba(128,180,210,0.26)", boxShadow: "0 4px 18px rgba(4,20,33,0.30)" };

  const headingCls = isLight ? "text-[#041421]" : "text-slate-100";
  const subTextCls = isLight ? "text-[#36556d]" : "text-slate-300";

  const cardBg = isLight ? "#FCFDFE" : "rgba(8,31,49,0.58)";
  const cardBorder = isLight
    ? "1px solid rgba(4,20,33,0.10)"
    : "1px solid rgba(124,166,194,0.28)";

  const sectionWrapBg = isLight
    ? "rgba(252,253,254,0.90)"
    : "rgba(8,31,49,0.58)";
  const sectionWrapBorder = isLight
    ? "1px solid rgba(4,20,33,0.08)"
    : "1px solid rgba(124,166,194,0.25)";
  const sectionTopLine = isLight
    ? "linear-gradient(90deg,transparent,rgba(31,95,137,0.28),transparent)"
    : "linear-gradient(90deg,transparent,rgba(116,168,201,0.38),transparent)";

  const tabContainerBg = isLight
    ? "rgba(252,253,254,0.96)"
    : "rgba(6,27,43,0.72)";
  const tabContainerBorder = isLight
    ? "1px solid rgba(4,20,33,0.10)"
    : "1px solid rgba(124,166,194,0.25)";
  const tabInactiveCls = isLight ? "#35566f" : "#8db2cc";

  const widgetBorder = isLight
    ? "1px solid rgba(4,20,33,0.12)"
    : "1px solid rgba(124,166,194,0.25)";

  const sectionPanelStyle = {
    background: sectionWrapBg,
    border: sectionWrapBorder,
    boxShadow: isLight
      ? "0 8px 28px rgba(4,20,33,0.08)"
      : "0 14px 44px rgba(0,0,0,0.32), inset 0 1px 0 rgba(148,194,220,0.08)",
    backdropFilter: "blur(10px)",
  } as const;

  const emailInputBg = isLight ? "rgba(252,253,254,0.98)" : "rgba(6,27,43,0.72)";
  const emailInputBorder = isLight ? "1px solid rgba(4,20,33,0.11)" : "1px solid rgba(124,166,194,0.26)";
  const emailInputText = isLight ? "#041421" : "#e2eef7";

  const checkoutHandler = async (amount: number) => {
    const API_URL = import.meta.env.VITE_API_URL;
    const { data: keyData } = await axios.get(`${API_URL}/getKey`);
    const { data: orderData } = await axios.post(`${API_URL}/payment/process`, { amount });
    const options = {
      key: keyData.key, amount, currency: "INR", name: "InvestBeans",
      order_id: orderData.order.id, callback_url: `${API_URL}/paymentVerification`,
      prefill: { name: "InvestBeans", email: "InvestBeans@example.com", contact: "9999999999" },
      theme: { color: "#0A3656" },
    };
    // @ts-ignore
    new Razorpay(options).open();
  };
  function useUserSubscriptions(isAuthenticated: boolean) {
    const [subscriptions, setSubscriptions] = useState<UserSubscription[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
      // Guest users ke liye fetch mat karo
      if (!isAuthenticated) { setSubscriptions([]); return; }

      const API = import.meta.env.VITE_API_URL || "";

      const fetchSubs = async () => {
        setLoading(true);
        try {
          // GET /api/v1/subscriptions/my — user ki active + recently expired subs
          const res = await fetch(`${API}/subscriptions/my`, {
            credentials: "include",
            headers: { Authorization: `Bearer ${localStorage.getItem("accessToken") || ""}` },
          });

          if (!res.ok) throw new Error("fetch failed");

          const data = await res.json();
          // data.subscriptions = array of { plan, status, endDate, daysRemaining }
          setSubscriptions(data.subscriptions || []);
        } catch (e) {
          // Fail silently — worst case cards show without status
          console.warn("Could not fetch subscriptions:", e);
          setSubscriptions([]);
        } finally {
          setLoading(false);
        }
      };

      fetchSubs();
    }, [isAuthenticated]);

    return { subscriptions, loading };
  }

  return (
    // <Layout>
      <div style={{ background: pageBg, minHeight: "100vh", color: isLight ? "#041421" : "#f1f5f9", position: "relative", overflow: "hidden" }}>
        {!isLight && (
          <>
            <div
              style={{
                position: "absolute",
                top: "-180px",
                left: "52%",
                transform: "translateX(-50%)",
                width: "1100px",
                height: "620px",
                borderRadius: "50%",
                background: "radial-gradient(ellipse, rgba(31,95,137,0.34) 0%, rgba(10,54,86,0.12) 38%, rgba(10,54,86,0.00) 72%)",
                filter: "blur(28px)",
                pointerEvents: "none",
                zIndex: 0,
              }}
            />
            <div
              style={{
                position: "absolute",
                top: "140px",
                right: "-180px",
                width: "560px",
                height: "560px",
                borderRadius: "50%",
                background: "radial-gradient(circle, rgba(116,168,201,0.20) 0%, rgba(31,95,137,0.08) 55%, transparent 75%)",
                filter: "blur(32px)",
                pointerEvents: "none",
                zIndex: 0,
              }}
            />
            <div
              style={{
                position: "absolute",
                inset: 0,
                backgroundImage: "radial-gradient(circle, rgba(148,179,201,0.11) 1px, transparent 1px)",
                backgroundSize: "44px 44px",
                opacity: 0.12,
                pointerEvents: "none",
                zIndex: 0,
              }}
            />
          </>
        )}

        <div style={{ position: "relative", zIndex: 1 }}>
          {/* <Hero /> */}

          <div className="container mx-auto px-6 py-16">


            {/* ── Live Dashboard ──────────────────────────────────────────── */}
            {/* <section className="mb-20 rounded-3xl p-5 md:p-7" style={sectionPanelStyle}>
              <div>
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-10">
                  <div className="mb-6 md:mb-0">
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg mb-4" style={goldBadge}>
                      <Activity className="w-4 h-4" style={{ color: isLight ? OCEAN : SKY }} />
                      <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: isLight ? OCEAN : SKY }}>
                        {activeTab === "domestic" ? "Market Live" : "Live Data"}
                      </span>
                    </div>
                    <h2 className={`text-4xl md:text-5xl font-bold mb-2 ${headingCls}`}>
                      {activeTab === "domestic" ? "BharatPulse" : "Live Dashboard"}
                    </h2>
                    <p className={subTextCls}>
                      {activeTab === "domestic"
                        ? "Navigate Bharat's markets with live data, sharp analytics, and smart insights."
                        : "Real-time market data and interactive charts at your fingertips."}
                    </p>
                  </div>

                  <div className="flex gap-1 p-1 rounded-xl"
                    style={{ background: tabContainerBg, border: tabContainerBorder }}>
                    {(["domestic", "global"] as const).map((tab) => (
                      <button key={tab} onClick={() => onChangeTab(tab)}
                        className="px-5 py-2 rounded-lg text-sm font-medium transition-all capitalize"
                        style={activeTab === tab
                          ? { background: GOLD, color: "#ffffff" }
                          : { color: tabInactiveCls }}>
                        {tab}
                      </button>
                    ))}
                  </div>
                </div>



                <div className="w-full mb-8 overflow-hidden rounded-2xl" style={{ border: widgetBorder, boxShadow: isLight ? "0 10px 30px rgba(4,20,33,0.10)" : "0 10px 36px rgba(0,0,0,0.42)" }}>
                  {activeTab === "domestic" ? (
                    <KiteChart height="600px" />
                  ) : (
                    <TradingViewWidget mode={activeTab} theme={isLight ? "light" : "dark"} height="600px" />
                  )}
                 
                  <TVDataStamp mode={activeTab} type="chart" isLight={isLight} />
                </div>


                <div className="mb-8">
                  <h3 className={`text-2xl font-bold mb-6 text-center ${headingCls}`}>Market Heatmap</h3>
                  <div className="w-full rounded-t-2xl overflow-hidden" style={{ border: widgetBorder, borderBottom: "none", boxShadow: isLight ? "0 10px 30px rgba(4,20,33,0.10)" : "0 10px 36px rgba(0,0,0,0.42)" }}>
                    <div className="h-[600px]">
                      <StockHeatmapWidget dataSource={activeTab === "domestic" ? "SENSEX" : "World"} />
                    </div>
                  </div>
                  <div className="w-full rounded-b-2xl overflow-hidden" style={{ border: widgetBorder, borderTop: "none" }}>
                    <TVDataStamp
                      mode={activeTab}
                      type="heatmap"
                      isLight={isLight}
                    />
                  </div>
                </div>
              </div>
            </section> */}
            {/* ── Decode Market ────────────────────────────────────────────── */}
            {/* <section className="mt-12 rounded-3xl p-5 md:p-7" style={sectionPanelStyle}>
              <DecodeMarket activeTab={activeTab} />
            </section> */}
            {/* ── IPO Section ─────────────────────────────────────────────── */}
            {/* <section className="mt-2"><IPOSection /></section> */}



            {/* ── Beans of Wisdom ──────────────────────────────────────────── */}
            {/* <section className="mt-12 rounded-3xl p-5 md:p-7" style={sectionPanelStyle}>
              <BeansOfWisdomView />
            </section> */}
                {/* ── Testimonials ─────────────────────────────────────────────── */}
                {/* <div className="mt-14 rounded-3xl p-5 md:p-7" style={sectionPanelStyle}>
              <TestimonialsPage />
            </div> */}
            {/* ═══════════════════════════════════════════════════════════════
              PRICING PLANS SECTION
          ═══════════════════════════════════════════════════════════════ */}
            {/* <section className="mt-16 mb-8 rounded-3xl p-5 md:p-7" style={sectionPanelStyle}>

             
              <div className="text-center mb-4"> */}

             
                {/* <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg mb-5" style={goldBadge}>
                  <TrendingUp className="w-4 h-4" style={{ color: isLight ? OCEAN : SKY }} />
                  <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: isLight ? OCEAN : SKY }}>
                    Pricing Plans
                  </span>
                </div> */}

           
                {/* <h2
                  className={`text-4xl md:text-5xl font-extrabold mb-4 leading-tight tracking-tight ${headingCls}`}
                >
                  Invest Smarter,{" "}
                  <span style={{ color: isLight ? OCEAN : SKY }}>
                    Choose Your Plan
                  </span>
                </h2>

             
                <p className={`text-base max-w-xl mx-auto leading-relaxed ${subTextCls}`}>
                  From market basics to pro-level dashboards — pick the plan that
                  powers your investing journey.
                </p>
              </div> */}

        

              {/* ── Plan Cards ── */}
              {/* <PlanCards
                isLight={isLight}
                userSubscriptions={userSubscriptions}
                onCta={(planId: string) => navigate(`/plans/${planId}/checkout`)}
              /> */}

            {/* </section> */}


            {/* ── Newsletter ───────────────────────────────────────────────── */}
            {/* <div className="mt-14 rounded-2xl px-6 py-5 sm:px-10 sm:py-6" style={sectionPanelStyle}>
              <Subscribeview
                sectionWrapBg={sectionWrapBg}
                sectionWrapBorder={sectionWrapBorder}
                sectionTopLine={sectionTopLine}
                glow1="transparent"
                headingCls={headingCls}
                subTextCls={subTextCls}
                GOLD={GOLD}
                emailInputBg={emailInputBg}
                emailInputBorder={emailInputBorder}
                emailInputText={emailInputText}
              />
            </div> */}

          </div>
        </div>
      </div>
    // </Layout>
  );
};

export default HomeView;