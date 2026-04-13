import { useState, useEffect } from "react";
import { X, Lightbulb } from "lucide-react";
import { Label } from "@/components/ui/label";
import api from "@/api/axios";
import { useTheme } from "@/controllers/Themecontext";

interface StructuredInsight {
  summary: string;
  marketSignificance: string;
  impactArea: string;
  stocksImpacted: string;
  shortTermView: string;
  longTermView: string;
  keyRisk: string;
  impactScore: number;
}

interface InsightData {
  _id?: string;
  title: string;
  description: string;
  investBeansInsight: StructuredInsight;
  sentiment: string;
  category: string;
  marketType: string;
  credits: { source: string; author?: string; url?: string };
}

interface AdminInsightFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (isEdit: boolean) => void;
  editingInsight?: Partial<InsightData>;
}

const EMPTY_INSIGHT: StructuredInsight = {
  summary: "",
  marketSignificance: "",
  impactArea: "",
  stocksImpacted: "",
  shortTermView: "",
  longTermView: "",
  keyRisk: "",
  impactScore: 5,
};

// ─────────────────────────────────────────────────────────────────────────────
// InsightField is defined at MODULE level (outside AdminInsightForm).
// This is the fix for the cursor-jumping bug: when a component is defined
// inside another component's render, React treats it as a new component type
// on every render, unmounts+remounts the textarea, and the cursor is lost.
// ─────────────────────────────────────────────────────────────────────────────
interface FieldProps {
  label: string;
  hint: string;
  value: string;
  onChange: (val: string) => void;
  required?: boolean;
  rows?: number;
  maxLen?: number;
  sectionAccent: string;
  sectionHint: string;
  inputClass: string;
  inputStyle: React.CSSProperties;
}

const InsightField = ({
  label, hint, value, onChange,
  required = false, rows = 2, maxLen = 500,
  sectionAccent, sectionHint, inputClass, inputStyle,
}: FieldProps) => (
  <div>
    <div className="flex items-baseline justify-between mb-1">
      <Label className="text-xs font-semibold" style={{ color: sectionAccent }}>
        {label}{required && <span className="text-[#5194F6] ml-0.5">*</span>}
      </Label>
      <span className="text-[10px]" style={{ color: sectionHint }}>{hint}</span>
    </div>
    <textarea
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={hint}
      required={required}
      maxLength={maxLen}
      rows={rows}
      className={`${inputClass} resize-none`}
      style={inputStyle}
    />
  </div>
);

// ─────────────────────────────────────────────────────────────────────────────

const AdminInsightForm = ({ isOpen, onClose, onSuccess, editingInsight }: AdminInsightFormProps) => {
  const { theme } = useTheme();
  const isLight = theme === "light";

  const emptyMeta = {
    title: "", description: "",
    creditSource: "", creditAuthor: "", creditUrl: "",
    sentiment: "neutral", category: "", marketType: "domestic",
  };

  const [meta, setMeta] = useState(emptyMeta);
  const [insight, setInsight] = useState<StructuredInsight>({ ...EMPTY_INSIGHT });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (editingInsight) {
      setMeta({
        title:        editingInsight.title || "",
        description:  editingInsight.description || "",
        creditSource: editingInsight.credits?.source || "",
        creditAuthor: editingInsight.credits?.author || "",
        creditUrl:    editingInsight.credits?.url || "",
        sentiment:    editingInsight.sentiment || "neutral",
        category:     editingInsight.category || "",
        marketType:   editingInsight.marketType || "domestic",
      });
      const ibi = editingInsight.investBeansInsight;
      setInsight(ibi && typeof ibi === "object" ? { ...EMPTY_INSIGHT, ...ibi } : { ...EMPTY_INSIGHT });
    } else {
      setMeta(emptyMeta);
      setInsight({ ...EMPTY_INSIGHT });
    }
    setError("");
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editingInsight, isOpen]);

  const setM = (key: string, val: string) => setMeta(p => ({ ...p, [key]: val }));
  const setI = (key: keyof StructuredInsight, val: string | number) =>
    setInsight(p => ({ ...p, [key]: val }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      if (!meta.title.trim())                 throw new Error("Title is required");
      if (!meta.description.trim())           throw new Error("Description is required");
      if (!insight.summary.trim())            throw new Error("Summary is required");
      if (!insight.marketSignificance.trim()) throw new Error("Market Significance is required");
      if (!insight.impactArea.trim())         throw new Error("Impact Area is required");
      if (!insight.shortTermView.trim())      throw new Error("Short-Term View is required");
      if (!insight.longTermView.trim())       throw new Error("Long-Term View is required");
      if (!insight.keyRisk.trim())            throw new Error("Key Risk is required");
      if (!meta.creditSource.trim())          throw new Error("Credit source is required");
      if (!meta.category.trim())              throw new Error("Category is required");

      const payload = {
        title:       meta.title.trim(),
        description: meta.description.trim(),
        investBeansInsight: {
          summary:            insight.summary.trim(),
          marketSignificance: insight.marketSignificance.trim(),
          impactArea:         insight.impactArea.trim(),
          stocksImpacted:     insight.stocksImpacted.trim(),
          shortTermView:      insight.shortTermView.trim(),
          longTermView:       insight.longTermView.trim(),
          keyRisk:            insight.keyRisk.trim(),
          impactScore:        Number(insight.impactScore),
        },
        credits: {
          source: meta.creditSource.trim(),
          author: meta.creditAuthor.trim(),
          url:    meta.creditUrl.trim(),
        },
        sentiment:  meta.sentiment,
        category:   meta.category.trim(),
        marketType: meta.marketType,
      };

      const isEdit = !!editingInsight?._id;
      if (isEdit) {
        await api.put(`/insights/admin/${editingInsight._id}`, payload);
      } else {
        await api.post("/insights/admin/create", payload);
      }
      onSuccess(isEdit);
      onClose();
    } catch (err: unknown) {
      let msg = "Failed to save insight.";
      if (err instanceof Error) msg = err.message;
      else if (err && typeof err === "object" && "response" in err) {
        const r = (err as any).response?.data?.message;
        if (r) msg = r;
      }
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  // ── Theme tokens ──────────────────────────────────────────────────────────
  const modalBg        = isLight ? "linear-gradient(160deg,#f0f7fe 0%,#e8f2fd 100%)" : "linear-gradient(160deg,#101528 0%,#0d1221 100%)";
  const modalBorder    = isLight ? "1px solid rgba(13,37,64,0.12)" : "1px solid rgba(81,148,246,0.18)";
  const blueTopLine    = "linear-gradient(90deg,transparent,rgba(81,148,246,0.55),transparent)";
  const headerBg       = isLight ? "rgba(232,242,253,0.97)" : "rgba(28,54,86,0.97)";
  const headerBorder   = isLight ? "1px solid rgba(13,37,64,0.08)" : "1px solid rgba(81,148,246,0.12)";
  const titleColor     = isLight ? "#0d1b2a" : "white";
  const closeBg        = isLight ? "rgba(13,37,64,0.06)" : "rgba(28,54,86,0.45)";
  const closeColor     = isLight ? "rgba(13,37,64,0.45)" : "rgba(148,163,184,1)";
  const inputBg        = isLight ? "rgba(255,255,255,0.85)" : "rgba(28,54,86,0.45)";
  const inputBorder    = isLight ? "1px solid rgba(13,37,64,0.15)" : "1px solid rgba(81,148,246,0.22)";
  const inputColor     = isLight ? "#0d1b2a" : "white";
  const inputStyle     = { background: inputBg, border: inputBorder, color: inputColor };
  const focusRing      = isLight ? "focus:ring-blue-300/40" : "focus:ring-[#5194F6]/40";
  const inputClass     = `w-full px-3 py-2 text-sm rounded-xl placeholder:text-slate-400 focus:outline-none focus:ring-2 ${focusRing} transition-all`;
  const labelColor     = isLight ? "rgba(13,37,64,0.75)" : "rgba(203,213,225,1)";
  const labelOptColor  = isLight ? "rgba(13,37,64,0.45)" : "rgba(100,116,139,1)";
  const sectionAccent  = isLight ? "#3a7de8" : "rgba(129,174,249,1)";
  const sectionHint    = isLight ? "rgba(13,37,64,0.38)" : "rgba(100,116,139,1)";
  const ibiBlockBg     = isLight ? "rgba(81,148,246,0.04)" : "rgba(81,148,246,0.05)";
  const ibiBlockBorder = isLight ? "1px solid rgba(81,148,246,0.20)" : "1px solid rgba(81,148,246,0.22)";
  const creditBg       = isLight ? "rgba(81,148,246,0.04)" : "rgba(81,148,246,0.06)";
  const creditBorder   = isLight ? "1px solid rgba(81,148,246,0.18)" : "1px solid rgba(81,148,246,0.18)";
  const errorBg        = isLight ? "rgba(251,113,133,0.06)" : "rgba(251,113,133,0.08)";
  const errorBorder    = isLight ? "1px solid rgba(251,113,133,0.25)" : "1px solid rgba(251,113,133,0.2)";
  const errorColor     = isLight ? "#be123c" : "rgba(251,113,133,1)";
  const footerBg       = isLight ? "rgba(232,242,253,0.98)" : "rgba(13,18,33,0.98)";
  const footerBorder   = isLight ? "1px solid rgba(13,37,64,0.08)" : "1px solid rgba(81,148,246,0.12)";
  const cancelBg       = isLight ? "rgba(13,37,64,0.06)" : "rgba(81,148,246,0.08)";
  const cancelBorder   = isLight ? "1px solid rgba(13,37,64,0.12)" : "1px solid rgba(81,148,246,0.22)";
  const cancelColor    = isLight ? "rgba(13,37,64,0.65)" : "rgba(203,213,225,1)";
  const charColor      = isLight ? "rgba(13,37,64,0.35)" : "rgba(100,116,139,1)";
  // const optBg          = "#101528";
  const optBg          = isLight ? "#ffffff" : "#101528";
  const optColor       = isLight ? "#0d1b2a" : "#ffffff";

  const scoreColor = insight.impactScore >= 8 ? "#ef4444"
    : insight.impactScore >= 6 ? "#f59e0b"
    : insight.impactScore >= 4 ? "#5194F6"
    : "#10b981";

  // Shared style props for all InsightField instances
  const fp = { sectionAccent, sectionHint, inputClass, inputStyle };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto animate-fade-in"
      style={{ background: "rgba(0,0,0,0.65)", backdropFilter: "blur(8px)" }}
    >
      <div className="min-h-screen flex items-center justify-center p-4 sm:p-6">
        <div
          className="relative w-full max-w-2xl rounded-2xl my-8 overflow-hidden shadow-2xl"
          style={{ background: modalBg, border: modalBorder, boxShadow: "0 25px 60px rgba(0,0,0,0.35)" }}
        >
          <div className="absolute top-0 left-0 right-0 h-px" style={{ background: blueTopLine }} />

          {/* HEADER */}
          <div className="sticky top-0 z-10 px-5 py-4" style={{ background: headerBg, borderBottom: headerBorder }}>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold" style={{ color: titleColor }}>
                {editingInsight ? "Edit Insight" : "Create New Insight"}
              </h2>
              <button onClick={onClose} className="p-2 rounded-full hover:opacity-80 transition-colors"
                style={{ background: closeBg, color: closeColor }}>
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* FORM */}
          <form onSubmit={handleSubmit} className="p-5 space-y-4 max-h-[calc(100vh-120px)] overflow-y-auto">

            {error && (
              <div className="p-3 rounded-xl text-sm" style={{ background: errorBg, border: errorBorder, color: errorColor }}>
                {error}
              </div>
            )}

            {/* News Title */}
            <div>
              <Label className="text-xs font-semibold mb-1.5 block" style={{ color: labelColor }}>
                News Title <span className="text-[#5194F6]">*</span>
              </Label>
              <input
                value={meta.title}
                onChange={e => setM("title", e.target.value)}
                placeholder="Enter the news headline"
                required maxLength={200}
                className={inputClass} style={{ ...inputStyle, height: 42 }}
              />
            </div>

            {/* Card Preview Description */}
            <div>
              <Label className="text-xs font-semibold mb-1.5 block" style={{ color: labelColor }}>
                Card Preview Description <span className="text-[#5194F6]">*</span>
              </Label>
              <textarea
                value={meta.description}
                onChange={e => setM("description", e.target.value)}
                placeholder="Short description shown on the card (1–2 lines)"
                required maxLength={1000} rows={2}
                className={`${inputClass} resize-none`} style={inputStyle}
              />
              <p className="text-[10px] mt-0.5 text-right" style={{ color: charColor }}>
                {meta.description.length}/1000
              </p>
            </div>

            {/* InvestBeans Insight block */}
            <div className="rounded-2xl p-4 space-y-4" style={{ background: ibiBlockBg, border: ibiBlockBorder }}>

              {/* Block heading — no subtitle */}
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg" style={{ background: "linear-gradient(135deg,#5194F6,#3a7de0)" }}>
                  <Lightbulb className="w-3.5 h-3.5 text-white" />
                </div>
                <h3 className="text-sm font-bold" style={{ color: titleColor }}>InvestBeans Insight</h3>
              </div>

              <InsightField label="Summary"            hint="1–2 lines explaining the news"        value={insight.summary}            onChange={v => setI("summary", v)}            required rows={2} maxLen={500} {...fp} />
              <InsightField label="Market Significance" hint="Why it matters"                       value={insight.marketSignificance} onChange={v => setI("marketSignificance", v)} required rows={2} maxLen={600} {...fp} />
              <InsightField label="Impact Area"         hint="Sector / Industry"                    value={insight.impactArea}         onChange={v => setI("impactArea", v)}         required rows={1} maxLen={300} {...fp} />
              <InsightField label="Stocks Impacted"     hint="e.g. RELIANCE, TCS, HDFC (optional)" value={insight.stocksImpacted}     onChange={v => setI("stocksImpacted", v)}              rows={2} maxLen={500} {...fp} />
              <InsightField label="Short-Term View"     hint="Trading implication"                  value={insight.shortTermView}      onChange={v => setI("shortTermView", v)}      required rows={2} maxLen={600} {...fp} />
              <InsightField label="Long-Term View"      hint="Structural impact"                    value={insight.longTermView}       onChange={v => setI("longTermView", v)}       required rows={2} maxLen={600} {...fp} />
              <InsightField label="Key Risk"            hint="Possible downside"                    value={insight.keyRisk}            onChange={v => setI("keyRisk", v)}            required rows={2} maxLen={500} {...fp} />

              {/* Impact Score */}
              <div>
                <div className="flex items-baseline justify-between mb-2">
                  <Label className="text-xs font-semibold" style={{ color: sectionAccent }}>
                    Impact Score <span className="text-[#5194F6]">*</span>
                  </Label>
                  <span className="text-[10px]" style={{ color: sectionHint }}>
                    How strongly the news affects the market
                  </span>
                </div>
                <div className="flex items-center gap-4">
                  <div
                    className="flex-shrink-0 w-14 h-14 rounded-2xl flex flex-col items-center justify-center font-bold"
                    style={{
                      background: isLight ? "rgba(255,255,255,0.8)" : "rgba(13,19,36,0.7)",
                      border: `2px solid ${scoreColor}`,
                      color: scoreColor,
                    }}
                  >
                    <span className="text-xl leading-none">{insight.impactScore}</span>
                    <span className="text-[9px] font-normal mt-0.5" style={{ color: sectionHint }}>/10</span>
                  </div>
                  <div className="flex-1">
                    <input
                      type="range" min={1} max={10} step={1}
                      value={insight.impactScore}
                      onChange={e => setI("impactScore", parseInt(e.target.value))}
                      className="w-full accent-[#5194F6] cursor-pointer"
                    />
                    <div className="flex justify-between text-[9px] mt-1" style={{ color: sectionHint }}>
                      <span>Low (1)</span>
                      <span style={{ color: scoreColor, fontWeight: 600 }}>
                        {insight.impactScore >= 8 ? "🔴 High Impact"
                          : insight.impactScore >= 6 ? "🟡 Medium-High"
                          : insight.impactScore >= 4 ? "🔵 Moderate"
                          : "🟢 Low Impact"}
                      </span>
                      <span>High (10)</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Credits */}
            <div className="p-3.5 rounded-xl" style={{ background: creditBg, border: creditBorder }}>
              <h3 className="text-xs font-semibold text-[#5194F6] flex items-center gap-1.5 mb-3">
                <span className="w-1 h-3.5 rounded-full inline-block" style={{ background: "#5194F6" }} />
                Credits & Source
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <Label className="text-xs mb-1 block" style={{ color: labelColor }}>
                    Source <span className="text-[#5194F6]">*</span>
                  </Label>
                  <input value={meta.creditSource} onChange={e => setM("creditSource", e.target.value)}
                    placeholder="e.g. Bloomberg" required className={inputClass} style={{ ...inputStyle, height: 38 }} />
                </div>
                <div>
                  <Label className="text-xs mb-1 block" style={{ color: labelOptColor }}>Author (optional)</Label>
                  <input value={meta.creditAuthor} onChange={e => setM("creditAuthor", e.target.value)}
                    placeholder="Author name" className={inputClass} style={{ ...inputStyle, height: 38 }} />
                </div>
                <div>
                  <Label className="text-xs mb-1 block" style={{ color: labelOptColor }}>URL <span className="text-[#5194F6]">*</span> </Label>
                  <input type="url" value={meta.creditUrl} onChange={e => setM("creditUrl", e.target.value)}
                    placeholder="https://example.com" className={inputClass} style={{ ...inputStyle, height: 38 }} />
                </div>
              </div>
            </div>

            {/* Category / Market / Sentiment */}
            {/* <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <Label className="text-xs font-semibold mb-1.5 block" style={{ color: labelColor }}>
                  Category <span className="text-[#5194F6]">*</span>
                </Label>
                <input value={meta.category} onChange={e => setM("category", e.target.value)}
                  placeholder="e.g. Technology" required className={inputClass} style={{ ...inputStyle, height: 42 }} />
              </div>
              <div>
                <Label className="text-xs font-semibold mb-1.5 block" style={{ color: labelColor }}>
                  Market Type <span className="text-[#5194F6]">*</span>
                </Label>
                <select value={meta.marketType} onChange={e => setM("marketType", e.target.value)}
                  className={inputClass} style={{ ...inputStyle, height: 42 }}>
                  <option value="domestic"    style={{ background: optBg }}>Domestic</option>
                  <option value="global"      style={{ background: optBg }}>Global</option>
                  <option value="commodities" style={{ background: optBg }}>Commodities</option>
                </select>
              </div>
              <div>
                <Label className="text-xs font-semibold mb-1.5 block" style={{ color: labelColor }}>
                  Sentiment <span className="text-[#5194F6]">*</span>
                </Label>
                <select value={meta.sentiment} onChange={e => setM("sentiment", e.target.value)}
                  className={inputClass} style={{ ...inputStyle, height: 42 }}>
                  <option value="positive" style={{ background: optBg }}>Positive</option>
                  <option value="negative" style={{ background: optBg }}>Negative</option>
                  <option value="neutral"  style={{ background: optBg }}>Neutral</option>
                </select>
              </div>
            </div> */}.
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <Label className="text-xs font-semibold mb-1.5 block" style={{ color: labelColor }}>
                  Category <span className="text-[#5194F6]">*</span>
                </Label>
                <input value={meta.category} onChange={e => setM("category", e.target.value)}
                  placeholder="e.g. Technology" required className={inputClass} style={{ ...inputStyle, height: 42 }} />
              </div>
              <div>
                <Label className="text-xs font-semibold mb-1.5 block" style={{ color: labelColor }}>
                  Market Type <span className="text-[#5194F6]">*</span>
                </Label>
                <select value={meta.marketType} onChange={e => setM("marketType", e.target.value)}
                  className={inputClass} style={{ ...inputStyle, height: 42, color: optColor }}>
                  <option value="domestic"    style={{ background: optBg, color: optColor }}>Domestic</option>
                  <option value="global"      style={{ background: optBg, color: optColor }}>Global</option>
                  <option value="commodities" style={{ background: optBg, color: optColor }}>Commodities</option>
                </select>
              </div>
              <div>
                <Label className="text-xs font-semibold mb-1.5 block" style={{ color: labelColor }}>
                  Sentiment <span className="text-[#5194F6]">*</span>
                </Label>
                <select value={meta.sentiment} onChange={e => setM("sentiment", e.target.value)}
                  className={inputClass} style={{ ...inputStyle, height: 42, color: optColor }}>
                  <option value="positive" style={{ background: optBg, color: optColor }}>Positive</option>
                  <option value="negative" style={{ background: optBg, color: optColor }}>Negative</option>
                  <option value="neutral"  style={{ background: optBg, color: optColor }}>Neutral</option>
                </select>
              </div>
            </div>
 

            {/* Footer */}
            <div className="flex gap-3 pt-3 sticky bottom-0 -mx-5 px-5 pb-4"
              style={{ background: footerBg, borderTop: footerBorder, marginTop: "8px" }}>
              <button type="button" onClick={onClose} disabled={loading}
                className="flex-1 h-11 rounded-xl text-sm font-semibold transition-all disabled:opacity-50 hover:opacity-80"
                style={{ background: cancelBg, border: cancelBorder, color: cancelColor }}>
                Cancel
              </button>
              <button type="submit" disabled={loading}
                className="flex-1 h-11 rounded-xl text-sm font-semibold transition-all hover:opacity-90 disabled:opacity-60"
                style={{ background: "linear-gradient(135deg,#5194F6,#3a7de8)", color: "white" }}>
                {loading ? "Saving..." : editingInsight ? "Update Insight" : "Create Insight"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AdminInsightForm;