import { useState, useEffect, useRef, useCallback } from "react";
import { Sparkles, TrendingUp, Plus, CheckCircle, XCircle, X } from "lucide-react";
import InsightCard from "@/components/InsightCard";
import AdminInsightForm from "@/components/AdminInsightForm";
import InsightModal from "@/components/InsightModal";
import { useAuth } from "@/controllers/AuthContext";
import api from "@/api/axios";
import { toggleInsightLike } from "@/services/insightService";
import { useTheme } from "@/controllers/Themecontext";
import { useNavigate } from "react-router-dom";

type ActiveTab = "domestic" | "global" | "commodities";
interface DecodeMarketProps { activeTab: ActiveTab }
interface InsightData {
  _id: string; title: string; description: string;
  investBeansInsight: {
    summary: string; marketSignificance: string; impactArea: string;
    stocksImpacted: string; shortTermView: string; longTermView: string;
    keyRisk: string; impactScore: number;
  };
  sentiment: "positive" | "negative" | "neutral"; category: string;
  marketType: "domestic" | "global" | "commodities"; views: number;
  likes: number; isLiked: boolean; readTime: string;
  isPublished: boolean; publishedAt: string;
  author: { _id: string; name: string; email: string };
  credits: { source: string; author?: string; url?: string; publishedDate?: string };
}

interface ToastState { message: string; type: "success" | "error"; visible: boolean }

const Toast = ({ toast, onClose }: { toast: ToastState; onClose: () => void }) => {
  if (!toast.visible) return null;
  const isSuccess = toast.type === "success";
  return (
    <div
      className="fixed bottom-6 right-4 sm:right-6 z-[9999] flex items-center gap-3 px-4 py-3 rounded-2xl shadow-2xl animate-slide-up"
      style={{
        background: isSuccess ? "rgba(16,185,129,0.12)" : "rgba(239,68,68,0.12)",
        border: isSuccess ? "1px solid rgba(16,185,129,0.35)" : "1px solid rgba(239,68,68,0.35)",
        backdropFilter: "blur(12px)",
        minWidth: 240, maxWidth: 340,
      }}
    >
      {isSuccess
        ? <CheckCircle className="w-5 h-5 flex-shrink-0" style={{ color: "#10b981" }} />
        : <XCircle className="w-5 h-5 flex-shrink-0" style={{ color: "#ef4444" }} />}
      <span className="text-sm font-medium flex-1" style={{ color: isSuccess ? "#10b981" : "#ef4444" }}>
        {toast.message}
      </span>
      <button onClick={onClose} className="flex-shrink-0 opacity-60 hover:opacity-100 transition-opacity">
        <X className="w-4 h-4" style={{ color: isSuccess ? "#10b981" : "#ef4444" }} />
      </button>
    </div>
  );
};

const MAX_HOMEPAGE_CARDS = 4;

const DecodeMarket = ({ activeTab }: DecodeMarketProps) => {
  const { isAdmin } = useAuth();
  const { theme } = useTheme();
  const isLight = theme === "light";
  const navigate = useNavigate();

  const [insights, setInsights] = useState<InsightData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedInsight, setSelectedInsight] = useState<InsightData | null>(null);
  const [showInsightModal, setShowInsightModal] = useState(false);
  const [showAdminForm, setShowAdminForm] = useState(false);
  const [editingInsight, setEditingInsight] = useState<InsightData | null>(null);
  const [loadingInsight, setLoadingInsight] = useState(false);
  const [toast, setToast] = useState<ToastState>({ message: "", type: "success", visible: false });
  const hasFetchedRef = useRef(false);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = useCallback((message: string, type: "success" | "error" = "success") => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast({ message, type, visible: true });
    toastTimer.current = setTimeout(() => setToast(p => ({ ...p, visible: false })), 3500);
  }, []);

  const hideToast = () => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast(p => ({ ...p, visible: false }));
  };

  const fetchInsights = async () => {
    try {
      setLoading(true);
      const endpoint = isAdmin ? "/insights/admin/all" : "/insights";
      const response = await api.get(endpoint, {
        params: { marketType: activeTab, limit: MAX_HOMEPAGE_CARDS + 1, page: 1 },
      });
      if (response.data?.success && response.data?.data) {
        setInsights(response.data.data.insights || []);
      } else { setInsights([]); }
    } catch { setInsights([]); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    if (!hasFetchedRef.current || activeTab) { fetchInsights(); hasFetchedRef.current = true; }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, isAdmin]);

  const handleReadMore = async (id: string) => {
    const preview = insights.find(i => i._id === id);
    if (preview) setSelectedInsight(preview);
    setShowInsightModal(true);
    setLoadingInsight(true);
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
      showToast(msg.includes("401") || msg.includes("login") ? "Please login to like insights" : msg, "error");
      throw err;
    }
  };

  const handleEdit = (insight: InsightData) => { setEditingInsight(insight); setShowAdminForm(true); };

  const handleDelete = async (id: string) => {
    try {
      await api.delete(`/insights/admin/${id}`);
      await fetchInsights();
      showToast("Insight deleted successfully", "success");
    } catch { showToast("Failed to delete insight", "error"); }
  };

  const handleFormSuccess = async (isEdit: boolean) => {
    await fetchInsights();
    setEditingInsight(null);
    showToast(isEdit ? "Insight updated successfully" : "Insight created successfully", "success");
  };

  const visibleInsights = insights.slice(0, MAX_HOMEPAGE_CARDS);
  const hasMore = insights.length > MAX_HOMEPAGE_CARDS;

  const tabConfig = {
    domestic: {
      badge: { color: "#34d399", bg: "rgba(52,211,153,0.07)", border: "rgba(52,211,153,0.18)" },
      label: "Domestic Market Insights", heading: "Indian Markets",
      sub: "Overview of Indian markets and sectoral performance ",
    },
    global: {
      badge: { color: "#7fb1cf", bg: "rgba(127,177,207,0.10)", border: "rgba(127,177,207,0.24)" },
      label: "Global Market Insights", heading: "International Markets",
      sub: "Global economic trends and their impact on investments",
    },
    commodities: {
      badge: { color: "#f59e0b", bg: "rgba(245,158,11,0.07)", border: "rgba(245,158,11,0.18)" },
      label: "Commodities Insights", heading: "Commodities Markets",
      sub: "Gold, silver, crude oil, and other commodity trends",
    },
  };

  const tab = tabConfig[activeTab];

  return (
    <section id="decode-markets" className="relative overflow-hidden py-5 sm:py-6">

      <Toast toast={toast} onClose={hideToast} />

      {/* Ambient glows */}
      <div className="absolute top-0 right-0 w-[min(450px,80vw)] h-[min(450px,80vw)] rounded-full blur-[120px] pointer-events-none"
        style={{ background: "radial-gradient(circle,rgba(10,54,86,0.10) 0%,transparent 70%)" }} />
      <div className="absolute bottom-0 left-0 w-[min(350px,70vw)] h-[min(350px,70vw)] rounded-full blur-[100px] pointer-events-none"
        style={{ background: "radial-gradient(circle,rgba(127,177,207,0.10) 0%,transparent 70%)" }} />

      <div className="relative z-10 px-4 sm:px-6 lg:px-8">

        {/* ── Section header ── */}
        <div className="text-center mb-3 sm:mb-4 relative">
          {isAdmin && (
            <div className="hidden sm:flex absolute top-1/2 right-0 -translate-y-1/2">
              <button
                onClick={() => { setEditingInsight(null); setShowAdminForm(true); }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90 shadow-lg"
                style={{ background: "linear-gradient(135deg,#22c55e,#16a34a)" }}
              >
                <Plus className="w-4 h-4" /> Create Insight
              </button>
            </div>
          )}

          <div
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full mb-2"
            style={{
              background: isLight ? "rgba(10,54,86,0.10)" : "rgba(116,168,201,0.12)",
              border: isLight ? "1px solid rgba(10,54,86,0.22)" : "1px solid rgba(116,168,201,0.22)",
            }}
          >
            <Sparkles className="w-3 h-3 text-[#0A3656] dark:text-[#74A8C9]" />
            <span className="text-[11px] font-semibold text-[#0A3656] dark:text-[#74A8C9] uppercase tracking-wide">
              Market Intelligence
            </span>
          </div>

          <h2 className={`text-2xl sm:text-3xl md:text-4xl font-bold mb-1.5 leading-tight ${isLight ? "text-slate-900" : "text-white"}`}>
            Decode the{" "}
            <span className="text-[#0A3656] dark:text-[#9bc1da]">Market</span>
          </h2>

          <p className="text-slate-400 text-sm max-w-2xl mx-auto leading-relaxed">
            Expert insights and analysis to help you understand market movements and make informed investment decisions
          </p>
        </div>

        {/* Mobile admin button */}
        {isAdmin && (
          <div className="flex justify-center mb-3 sm:hidden">
            <button
              onClick={() => { setEditingInsight(null); setShowAdminForm(true); }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white"
              style={{ background: "linear-gradient(135deg,#22c55e,#16a34a)" }}
            >
              <Plus className="w-4 h-4" /> Create Insight
            </button>
          </div>
        )}

        {/* ── Sub-header ── */}
        <div className="flex flex-col items-center gap-1.5 mb-3 sm:mb-4">
          <div
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium"
            style={{ color: tab.badge.color, background: tab.badge.bg, border: `1px solid ${tab.badge.border}` }}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            {tab.label}
          </div>
          <div className="text-center">
            <h3 className={`text-lg font-bold mb-0.5 ${isLight ? "text-navy" : "text-white"}`}>
              {tab.heading}
            </h3>
            <p className="text-slate-400 text-xs">{tab.sub}</p>
          </div>
        </div>

        {/* ── Cards ── */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <div
              className="animate-spin rounded-full h-10 w-10"
              style={{
                border: isLight ? "2px solid rgba(10,54,86,0.15)" : "2px solid rgba(116,168,201,0.15)",
                borderTopColor: isLight ? "#0A3656" : "#74A8C9",
              }}
            />
            <p className="mt-3 text-slate-400 text-sm">Loading insights...</p>
          </div>
        ) : insights.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12">
            <p className="text-slate-400 mb-4 text-sm">No insights available at the moment.</p>
            {isAdmin && (
              <button
                onClick={() => { setEditingInsight(null); setShowAdminForm(true); }}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white"
                style={{ background: "#0A3656" }}
              >
                <Plus className="w-4 h-4" /> Create First Insight
              </button>
            )}
          </div>
        ) : (
          /*
           * Big card style (Image 2) — 2-column grid
           * compact=false keeps full card size
           * gap reduced (gap-3) so 2×2 grid fits without scrolling
           */
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            {visibleInsights.map(insight => (
              <InsightCard
                key={insight._id}
                insight={insight}
                isAdmin={isAdmin}
                compact={false}
                onReadMore={handleReadMore}
                onLike={handleLike}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}

        {/* ── Load More ── */}
        {hasMore && insights.length > 0 && (
          <div className="mt-4 text-center">
            <button
              onClick={() => navigate(`/insights/${activeTab}`)}
              className="inline-flex items-center gap-2 px-8 py-2.5 rounded-full text-sm font-semibold transition-all active:scale-95"
              style={{
                color: isLight ? "#0A3656" : "#74A8C9",
                background: isLight ? "rgba(10,54,86,0.08)" : "rgba(116,168,201,0.10)",
                border: isLight ? "1px solid rgba(10,54,86,0.24)" : "1px solid rgba(116,168,201,0.24)",
              }}
            >
              Load More <TrendingUp className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
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
        onSuccess={(isEdit) => handleFormSuccess(isEdit)}
        editingInsight={editingInsight}
      />
    </section>
  );
};

export default DecodeMarket;