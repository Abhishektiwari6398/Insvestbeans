import { useState, useEffect } from "react";
import { Sparkles, TrendingUp, Plus, ArrowLeft } from "lucide-react";
import InsightCard from "@/components/InsightCard";
import AdminInsightForm from "@/components/AdminInsightForm";
import InsightModal from "@/components/InsightModal";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useAuth } from "@/controllers/AuthContext";
import api from "@/api/axios";
import { toggleInsightLike } from "@/services/insightService";
import { useTheme } from "@/controllers/Themecontext";
import { useNavigate, useParams } from "react-router-dom";

type ActiveTab = "domestic" | "global" | "commodities";

interface InsightData {
  _id: string; title: string; description: string; investBeansInsight: string;
  sentiment: "positive" | "negative" | "neutral"; category: string;
  marketType: "domestic" | "global" | "commodities"; views: number; likes: number; isLiked: boolean;
  readTime: string; isPublished: boolean; publishedAt: string;
  author: { _id: string; name: string; email: string };
  credits: { source: string; author?: string; url?: string; publishedDate?: string };
}

const tabConfig: Record<ActiveTab, { badge: { color: string; bg: string; border: string }; label: string; heading: string; sub: string }> = {
  domestic: {
    badge: { color: "#34d399", bg: "rgba(52,211,153,0.07)", border: "rgba(52,211,153,0.18)" },
    label: "Domestic Market Insights",
    heading: "Indian Markets",
    sub: "Analysis of NSE, BSE, and sectoral performance",
  },
  global: {
    badge: { color: "#60a5fa", bg: "rgba(96,165,250,0.07)", border: "rgba(96,165,250,0.18)" },
    label: "Global Market Insights",
    heading: "International Markets",
    sub: "Global economic trends and their impact on investments",
  },
  commodities: {
    badge: { color: "#f59e0b", bg: "rgba(245,158,11,0.07)", border: "rgba(245,158,11,0.18)" },
    label: "Commodities Insights",
    heading: "Commodities Markets",
    sub: "Gold, silver, crude oil, and other commodity trends",
  },
};

// Tab labels shown in the switcher
const TABS: { key: ActiveTab; label: string }[] = [
  { key: "domestic", label: "Domestic" },
  { key: "global", label: "Global" },
  { key: "commodities", label: "Commodities" },
];

const DecodeMarketsPage = () => {
  const { tab: tabParam } = useParams<{ tab: string }>();
  const { isAdmin } = useAuth();
  const { theme } = useTheme();
  const isLight = theme === "light";
  const navigate = useNavigate();

  // activeTab is driven by URL param, but we also keep local state so switching
  // tabs updates the URL (and hence the data) without a full page reload.
  const [activeTab, setActiveTab] = useState<ActiveTab>(
    (tabParam as ActiveTab) || "domestic"
  );

  // Sync if user navigates via browser back/forward
  useEffect(() => {
    if (tabParam && tabParam !== activeTab) {
      setActiveTab(tabParam as ActiveTab);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tabParam]);

  const handleTabChange = (newTab: ActiveTab) => {
    setActiveTab(newTab);
    setCurrentPage(1);
    navigate(`/insights/${newTab}`, { replace: true });
  };

  const [insights, setInsights] = useState<InsightData[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const CARDS_PER_PAGE = 12;
  const MAX_PAGES = 4;
  const [selectedInsight, setSelectedInsight] = useState<InsightData | null>(null);
  const [showInsightModal, setShowInsightModal] = useState(false);
  const [showAdminForm, setShowAdminForm] = useState(false);
  const [editingInsight, setEditingInsight] = useState<InsightData | null>(null);
  const [loadingInsight, setLoadingInsight] = useState(false);

  const tab = tabConfig[activeTab] ?? tabConfig.domestic;

  const fetchInsights = async () => {
    try {
      setLoading(true);
      const endpoint = isAdmin ? "/insights/admin/all" : "/insights";
      const response = await api.get(endpoint, { params: { marketType: activeTab, limit: MAX_PAGES * CARDS_PER_PAGE, page: 1 } });
      if (response.data?.success && response.data?.data) {
        setInsights(response.data.data.insights || []);
      } else { setInsights([]); }
    } catch { setInsights([]); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    fetchInsights();
    window.scrollTo({ top: 0, behavior: "smooth" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, isAdmin]);

  const handleReadMore = async (id: string) => {
    const preview = insights.find(i => i._id === id);
    if (preview) setSelectedInsight(preview);
    setShowInsightModal(true); setLoadingInsight(true);
    try {
      const res = await api.get(`/insights/${id}`);
      if (res.data?.success) setSelectedInsight(res.data.data);
    } catch { if (!preview) setShowInsightModal(false); }
    finally { setLoadingInsight(false); }
  };

  const handleLike = async (id: string) => {
    try {
      const res = await toggleInsightLike(id);
      if (!res || typeof res.likes !== "number" || typeof res.isLiked !== "boolean") throw new Error("Invalid response");
      setInsights(prev => prev.map(i => i._id === id ? { ...i, likes: res.likes, isLiked: res.isLiked } : i));
      if (selectedInsight?._id === id) setSelectedInsight({ ...selectedInsight, likes: res.likes, isLiked: res.isLiked });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed";
      alert(msg.includes("401") || msg.includes("login") ? "Please login to like insights" : msg);
      throw err;
    }
  };

  const handleEdit = (insight: InsightData) => { setEditingInsight(insight); setShowAdminForm(true); };
  const handleDelete = async (id: string) => {
    try { await api.delete(`/insights/admin/${id}`); fetchInsights(); }
    catch { alert("Failed to delete insight."); }
  };
  const handleFormSuccess = () => { fetchInsights(); setEditingInsight(null); };

  // Styling helpers (mirrors HomeView palette)
  const GOLD = "#0A3656";
  const tabContainerBg = isLight ? "rgba(252,253,254,0.96)" : "rgba(6,27,43,0.72)";
  const tabContainerBorder = isLight ? "1px solid rgba(4,20,33,0.10)" : "1px solid rgba(124,166,194,0.25)";
  const tabInactiveColor = isLight ? "#35566f" : "#8db2cc";

  return (
    <div className={`min-h-screen ${isLight ? "bg-[#f0f7fe]" : "bg-[#101528]"}`}>

      <Header />

      {/* Ambient glows */}
      <div
        className="fixed top-0 right-0 w-[min(500px,80vw)] h-[min(500px,80vw)] rounded-full blur-[100px] pointer-events-none -z-10"
        style={{ background: "radial-gradient(circle,rgba(212,168,67,0.05) 0%,transparent 70%)" }}
      />
      <div
        className="fixed bottom-0 left-0 w-[min(400px,70vw)] h-[min(400px,70vw)] rounded-full blur-[80px] pointer-events-none -z-10"
        style={{ background: "radial-gradient(circle,rgba(56,189,248,0.04) 0%,transparent 70%)" }}
      />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-12">

        {/* ── Top bar: Back (left) + Tabs top-right ──────────────────────── */}
        <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
          <button
            onClick={() => {
              navigate("/");
              setTimeout(() => {
                document.getElementById("decode-markets")?.scrollIntoView({ behavior: "smooth", block: "start" });
              }, 100);
            }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all hover:opacity-80"
            style={{
              background: isLight ? "rgba(13,37,64,0.06)" : "rgba(81,148,246,0.08)",
              border: isLight ? "1px solid rgba(13,37,64,0.12)" : "1px solid rgba(81,148,246,0.2)",
              color: isLight ? "rgba(13,37,64,0.7)" : "rgba(203,213,225,1)",
            }}
          >
            <ArrowLeft className="w-4 h-4" /> Back
          </button>

          {/* Admin create button only */}
          {isAdmin && (
            <button
              onClick={() => { setEditingInsight(null); setShowAdminForm(true); }}
              className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90 shadow-lg"
              style={{ background: "linear-gradient(135deg,#22c55e,#16a34a)" }}
            >
              <Plus className="w-4 h-4" /> Create Insight
            </button>
          )}
        </div>

        {/* ── Page header ─────────────────────────────────────────────────── */}
        <div className="relative text-center mb-6 sm:mb-8">
          <div
            className="inline-flex items-center gap-2 px-3 py-1.5 sm:px-4 sm:py-2 rounded-full mb-4 sm:mb-5"
            style={{ background: "rgba(81,148,246,0.1)", border: "1px solid rgba(81,148,246,0.2)" }}
          >
            <Sparkles className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-[#5194F6]" />
            <span className="text-[11px] sm:text-xs font-semibold text-[#5194F6] uppercase tracking-wide">Market Intelligence</span>
          </div>

          {/* Heading row: heading centered, tab switcher floated right */}
          <div className="relative flex items-center justify-center">
            <h1 className={`text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-3 sm:mb-4 leading-tight ${isLight ? "text-navy" : "text-white"}`}>
              Decode the{" "}
              <span style={{ background: "linear-gradient(135deg,#5194F6,#7eb8ff)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                Market
              </span>
            </h1>

            {/* Tab Switcher — absolute right, vertically centred with heading */}
            <div
              className="absolute right-0 top-1/2 -translate-y-1/2 flex gap-1 p-1 rounded-xl hidden sm:flex"
              style={{ background: tabContainerBg, border: tabContainerBorder }}
            >
              {TABS.map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => handleTabChange(key)}
                  className="px-4 sm:px-5 py-2 rounded-lg text-sm font-medium transition-all capitalize"
                  style={
                    activeTab === key
                      ? { background: GOLD, color: "#ffffff" }
                      : { color: tabInactiveColor }
                  }
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Tab switcher for mobile (below heading) */}
          <div
            className="flex sm:hidden gap-1 p-1 rounded-xl justify-center mt-1 mb-3"
            style={{ background: tabContainerBg, border: tabContainerBorder }}
          >
            {TABS.map(({ key, label }) => (
              <button
                key={key}
                onClick={() => handleTabChange(key)}
                className="px-4 py-2 rounded-lg text-sm font-medium transition-all capitalize"
                style={
                  activeTab === key
                    ? { background: GOLD, color: "#ffffff" }
                    : { color: tabInactiveColor }
                }
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* ── Active tab sub-header pill ───────────────────────────────────── */}
        <div className="flex flex-col items-center gap-1.5 mb-5 sm:mb-6">
          <div
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs sm:text-sm font-medium"
            style={{ color: tab.badge.color, background: tab.badge.bg, border: `1px solid ${tab.badge.border}` }}
          >
            <TrendingUp className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            {tab.label}
          </div>
          <h2 className={`text-xl sm:text-2xl font-bold mt-1 ${isLight ? "text-navy" : "text-white"}`}>
            {tab.heading}
          </h2>
          <p className="text-slate-400 text-xs sm:text-sm">{tab.sub}</p>
        </div>

        {/* ── Cards / Empty / Loading ─────────────────────────────────────── */}
        {loading ? (
          <div className="text-center py-16 sm:py-24">
            <div
              className="inline-block animate-spin rounded-full h-12 w-12"
              style={{ border: "2px solid rgba(212,168,67,0.15)", borderTopColor: "#5194F6" }}
            />
            <p className="mt-4 text-slate-400 text-sm">Loading insights...</p>
          </div>
        ) : insights.length === 0 ? (
          <div className="text-center py-16 sm:py-24">
            <p className="text-slate-400 mb-4 text-sm sm:text-base">No insights available at the moment.</p>
            {isAdmin && (
              <button
                onClick={() => { setEditingInsight(null); setShowAdminForm(true); }}
                className="inline-flex items-center gap-2 px-5 sm:px-6 py-2.5 sm:py-3 rounded-xl text-sm font-semibold text-white"
                style={{ background: "linear-gradient(135deg,#5194F6,#3a7de8)" }}
              >
                <Plus className="w-4 h-4" /> Create First Insight
              </button>
            )}
          </div>
        ) : (() => {
          const totalPages = Math.min(MAX_PAGES, Math.ceil(insights.length / CARDS_PER_PAGE));
          const pageInsights = insights.slice((currentPage - 1) * CARDS_PER_PAGE, currentPage * CARDS_PER_PAGE);
          return (
            <>
              {/* Results count */}
              <p className="text-slate-400 text-xs sm:text-sm mb-5 sm:mb-6">
                Showing{" "}
                <span className="text-[#5194F6] font-semibold">
                  {(currentPage - 1) * CARDS_PER_PAGE + 1}–{Math.min(currentPage * CARDS_PER_PAGE, insights.length)}
                </span>{" "}
                of <span className="text-[#5194F6] font-semibold">{insights.length}</span> insights
              </p>

              {/* 3-col grid (all breakpoints ≥ md) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                {pageInsights.map(insight => (
                  <InsightCard key={insight._id} insight={insight} isAdmin={isAdmin}
                    onReadMore={handleReadMore} onLike={handleLike} onEdit={handleEdit} onDelete={handleDelete} />
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-10">
                  {/* Prev */}
                  <button
                    disabled={currentPage === 1}
                    onClick={() => { setCurrentPage(p => p - 1); window.scrollTo({ top: 0, behavior: "smooth" }); }}
                    className="px-3 py-2 rounded-lg text-sm font-medium transition-all disabled:opacity-30 hover:opacity-80"
                    style={{
                      background: isLight ? "rgba(13,37,64,0.06)" : "rgba(81,148,246,0.08)",
                      border: isLight ? "1px solid rgba(13,37,64,0.12)" : "1px solid rgba(81,148,246,0.2)",
                      color: isLight ? "rgba(13,37,64,0.7)" : "rgba(203,213,225,1)",
                    }}
                  >
                    ← Prev
                  </button>

                  {/* Page numbers */}
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                    <button
                      key={page}
                      onClick={() => { setCurrentPage(page); window.scrollTo({ top: 0, behavior: "smooth" }); }}
                      className="w-9 h-9 rounded-lg text-sm font-semibold transition-all"
                      style={
                        currentPage === page
                          ? { background: "#0A3656", color: "#ffffff", boxShadow: "0 2px 8px rgba(10,54,86,0.35)" }
                          : {
                              background: isLight ? "rgba(13,37,64,0.06)" : "rgba(81,148,246,0.08)",
                              border: isLight ? "1px solid rgba(13,37,64,0.12)" : "1px solid rgba(81,148,246,0.2)",
                              color: isLight ? "rgba(13,37,64,0.7)" : "rgba(203,213,225,1)",
                            }
                      }
                    >
                      {page}
                    </button>
                  ))}

                  {/* Next */}
                  <button
                    disabled={currentPage === totalPages}
                    onClick={() => { setCurrentPage(p => p + 1); window.scrollTo({ top: 0, behavior: "smooth" }); }}
                    className="px-3 py-2 rounded-lg text-sm font-medium transition-all disabled:opacity-30 hover:opacity-80"
                    style={{
                      background: isLight ? "rgba(13,37,64,0.06)" : "rgba(81,148,246,0.08)",
                      border: isLight ? "1px solid rgba(13,37,64,0.12)" : "1px solid rgba(81,148,246,0.2)",
                      color: isLight ? "rgba(13,37,64,0.7)" : "rgba(203,213,225,1)",
                    }}
                  >
                    Next →
                  </button>
                </div>
              )}
            </>
          );
        })()}
      </div>

      <InsightModal
        isOpen={showInsightModal}
        onClose={() => { setShowInsightModal(false); setSelectedInsight(null); setLoadingInsight(false); }}
        insight={selectedInsight}
        loading={loadingInsight}
      />
      <AdminInsightForm
        isOpen={showAdminForm}
        onClose={() => { setShowAdminForm(false); setEditingInsight(null); }}
        onSuccess={handleFormSuccess}
        editingInsight={editingInsight}
      />

      <Footer />
    </div>
  );
};

export default DecodeMarketsPage;