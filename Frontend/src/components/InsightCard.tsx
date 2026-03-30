import { TrendingUp, TrendingDown, Eye, Edit, Trash2, ThumbsUp, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { useTheme } from "@/controllers/Themecontext";

interface InsightCardProps {
  insight: {
    _id: string;
    title: string;
    description: string;
    sentiment?: "positive" | "negative" | "neutral";
    views?: number;
    likes?: number;
    isLiked?: boolean;
    category?: string;
    publishedAt?: string;
    readTime?: string;
  };
  isAdmin?: boolean;
  compact?: boolean;
  onReadMore: (id: string) => void;
  onLike?: (id: string) => Promise<void>;
  onEdit?: (insight: unknown) => void;
  onDelete?: (id: string) => void;
}

const InsightCard = ({
  insight,
  isAdmin = false,
  compact = false,
  onReadMore,
  onLike,
  onEdit,
  onDelete,
}: InsightCardProps) => {
  const { theme } = useTheme();
  const isLight = theme === "light";

  const {
    _id, title, description,
    sentiment = "neutral",
    views = 0, likes = 0,
    isLiked = false,
    category = "Market Analysis",
    publishedAt, readTime,
  } = insight;

  const [liked, setLiked] = useState(isLiked);
  const [likeCount, setLikeCount] = useState(likes);
  const [isLiking, setIsLiking] = useState(false);

  useEffect(() => { setLiked(isLiked); setLikeCount(likes); }, [isLiked, likes]);

  const getSentimentStyle = () => {
    switch (sentiment) {
      case "positive":
        return {
          borderAccent: "rgba(52,211,153,0.25)",
          badge: { color: "#16a34a", background: "rgba(52,211,153,0.1)", border: "1px solid rgba(52,211,153,0.25)" },
          icon: <TrendingUp className="w-3.5 h-3.5" />,
        };
      case "negative":
        return {
          borderAccent: "rgba(251,113,133,0.25)",
          badge: { color: "#dc2626", background: "rgba(251,113,133,0.1)", border: "1px solid rgba(251,113,133,0.25)" },
          icon: <TrendingDown className="w-3.5 h-3.5" />,
        };
      default:
        return {
          borderAccent: "rgba(31,95,137,0.25)",
          badge: { color: "#1F5F89", background: "rgba(31,95,137,0.1)", border: "1px solid rgba(31,95,137,0.25)" },
          icon: <Eye className="w-3.5 h-3.5" />,
        };
    }
  };

  const s = getSentimentStyle();

  const cardBg = isLight
    ? "linear-gradient(145deg,rgba(255,255,255,0.95) 0%,rgba(237,245,254,0.97) 100%)"
    : "linear-gradient(145deg,rgba(15,22,40,0.97) 0%,rgba(10,15,30,0.99) 100%)";
  const cardBorder = `1px solid ${s.borderAccent}`;
  const cardShadow = isLight ? "0 4px 20px rgba(13,37,64,0.08)" : "0 4px 24px rgba(0,0,0,0.35)";
  const hoverGlow = isLight
    ? "radial-gradient(ellipse at top right,rgba(31,95,137,0.08) 0%,transparent 60%)"
    : "radial-gradient(ellipse at top right,rgba(31,95,137,0.12) 0%,transparent 60%)";

  const categoryBg     = isLight ? "rgba(31,95,137,0.07)"  : "rgba(31,95,137,0.14)";
  const categoryBorder = isLight ? "1px solid rgba(31,95,137,0.18)" : "1px solid rgba(31,95,137,0.24)";
  const categoryColor  = isLight ? "#1F5F89" : "rgba(129,174,249,1)";
  const titleColor     = isLight ? "#0d1b2a" : "white";
  const descColor      = isLight ? "rgba(13,37,64,0.6)" : "rgba(148,163,184,1)";
  const dividerColor   = isLight ? "rgba(31,95,137,0.10)" : "rgba(31,95,137,0.14)";
  const metaColor      = isLight ? "rgba(13,37,64,0.45)" : "rgba(100,116,139,1)";
  const statsColor     = isLight ? "rgba(13,37,64,0.5)" : "rgba(100,116,139,1)";
  const likedColor     = "#1F5F89";

  const formatTimestamp = (iso: string) => {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return iso;
    return `${d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })} · ${d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true })}`;
  };

  const handleLike = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!onLike || isLiking) return;
    setIsLiking(true);
    const prev = { liked, likeCount };
    setLiked(!liked); setLikeCount(liked ? likeCount - 1 : likeCount + 1);
    try { await onLike(_id); }
    catch { setLiked(prev.liked); setLikeCount(prev.likeCount); alert("Failed to update like. Please try again."); }
    finally { setIsLiking(false); }
  };

  return (
    <div
      className="group relative overflow-hidden rounded-2xl transition-all duration-400 hover:-translate-y-1 hover:shadow-2xl animate-slide-up active:scale-[0.98] h-full flex flex-col"
      style={{ background: cardBg, border: cardBorder, boxShadow: cardShadow }}
    >
      {/* Hover glow */}
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none rounded-2xl"
        style={{ background: hoverGlow }}
      />

      {/* Blue left accent strip */}
      <div
        className="absolute left-0 top-0 bottom-0 w-[3px] rounded-l-2xl"
        style={{ background: "linear-gradient(180deg,#0A3656,#1F5F89,rgba(116,168,201,0.35))" }}
      />

      {/* Mobile top accent */}
      <div
        className="absolute top-0 left-[3px] right-0 h-[1.5px] sm:hidden rounded-tr-2xl"
        style={{ background: "linear-gradient(90deg,rgba(31,95,137,0.5),transparent)" }}
      />

      {/*
       * Padding: slightly reduced from original (p-5 pl-6 instead of p-6/7 pl-7/8)
       * so 2×2 grid fits in one screen — card style & proportions unchanged
       */}
      <div className="relative z-10 p-5 pl-6 sm:p-5 sm:pl-7 flex flex-col flex-1">

        {/* Category + Sentiment */}
        <div className="flex items-center justify-between gap-2 mb-3 flex-wrap flex-shrink-0">
          <span
            className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium"
            style={{ background: categoryBg, border: categoryBorder, color: categoryColor }}
          >
            {category}
          </span>
          <span
            className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium capitalize"
            style={s.badge}
          >
            {s.icon}{sentiment}
          </span>
        </div>

        {/* Title */}
        <h3
          className="text-base sm:text-lg font-bold mb-2 leading-snug line-clamp-2 transition-colors duration-300 group-hover:text-[#1F5F89] flex-shrink-0"
          style={{ color: titleColor }}
        >
          {title}
        </h3>

        {/* Description — 3 lines like Image 2 */}
        <p
          className="mb-3 leading-relaxed text-sm flex-shrink-0"
          style={{
            color: descColor,
            display: "-webkit-box",
            WebkitLineClamp: 3,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {description}
        </p>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Timestamp */}
        <div
          className="flex items-center gap-2 text-[11px] mb-2.5 pt-2 flex-wrap flex-shrink-0"
          style={{ borderTop: `1px solid ${dividerColor}`, color: metaColor }}
        >
          <div className="flex items-center gap-1">
            <Clock className="w-3 h-3" style={{ color: "rgba(31,95,137,0.55)" }} />
            <span>{publishedAt ? formatTimestamp(publishedAt) : "Date not available"}</span>
          </div>
          {readTime && (
            <>
              <span className="opacity-40">·</span>
              <span>{readTime}</span>
            </>
          )}
        </div>

        {/* Stats + Actions */}
        <div className="flex flex-col gap-2 flex-shrink-0">
          {/* Views & Likes */}
          <div className="flex items-center gap-3 text-[11px]" style={{ color: statsColor }}>
            <div className="flex items-center gap-1">
              <Eye className="w-3.5 h-3.5" />
              <span>{views.toLocaleString()} views</span>
            </div>
            <button
              onClick={handleLike}
              className="flex items-center gap-1 transition-colors hover:opacity-80"
              style={{ color: liked ? likedColor : statsColor }}
            >
              <ThumbsUp className={`w-3.5 h-3.5 ${liked ? "fill-current" : ""}`} />
              <span>{likeCount.toLocaleString()} likes</span>
            </button>
          </div>

          {/* Buttons */}
          <div className="flex gap-2">
            <button
              onClick={() => onReadMore(_id)}
              className="flex-1 inline-flex items-center justify-center rounded-full font-semibold transition-all duration-300 hover:opacity-90 hover:shadow-lg active:scale-95 px-4 py-2 text-sm"
              style={{
                background: "linear-gradient(135deg,#0A3656,#1F5F89)",
                color: "white",
                boxShadow: "0 2px 10px rgba(31,95,137,0.3)",
              }}
            >
              View Details
            </button>

            {isAdmin && onEdit && onDelete && (
              <>
                <Button
                  onClick={(e) => { e.stopPropagation(); onEdit(insight); }}
                  variant="outline"
                  size="icon"
                  className={`flex-shrink-0 h-8 w-8 ${isLight
                    ? "border-[#1F5F89]/15 bg-white text-[#1F5F89]/60 hover:bg-[#1F5F89]/8 hover:text-[#1F5F89] hover:border-[#1F5F89]/35"
                    : "border-[#1F5F89]/15 bg-[#1F5F89]/5 text-slate-400 hover:bg-[#1F5F89]/12 hover:text-[#1F5F89] hover:border-[#1F5F89]/30"
                  }`}
                >
                  <Edit className="w-3.5 h-3.5" />
                </Button>
                <Button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (window.confirm("Delete this insight?")) onDelete(_id);
                  }}
                  variant="outline"
                  size="icon"
                  className={`flex-shrink-0 h-8 w-8 ${isLight
                    ? "border-navy/10 bg-white/60 text-navy/50 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-300"
                    : "border-white/10 bg-white/4 text-slate-400 hover:bg-rose-500/10 hover:text-rose-400 hover:border-rose-500/25"
                  }`}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default InsightCard;