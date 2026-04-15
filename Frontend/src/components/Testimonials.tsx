"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  Star, X, Quote,
  Plus, Edit3, Trash2, Loader2,
  ChevronLeft, ChevronRight,
} from "lucide-react";
import { useTheme } from "@/controllers/Themecontext";
import { useAuth } from "@/controllers/AuthContext";
import {
  getAllTestimonials,
  getMyTestimonial,
  deleteTestimonial,
  Testimonial as ApiTestimonial,
} from "@/services/Testimonialservice";
import TestimonialForm from "@/components/Testimonialform";
import { useToast, ToastContainer } from "@/components/ui/ToastTestimonial";

// ─────────────────────────────────────────────────────────────────────────────
//  Types
// ─────────────────────────────────────────────────────────────────────────────
interface Testimonial {
  id: string;
  _id?: string;
  name: string;
  role: string;
  company: string;
  avatar: string;
  rating: number;
  preview: string;
  fullText: string;
  date: string;
  source: string;
  tag: string;
  userId?: string;
}

function toUnified(t: ApiTestimonial): Testimonial {
  return {
    id: t._id,
    _id: t._id,
    name: t.name,
    role: t.role || "",
    company: t.company || "",
    avatar: t.avatar || t.name?.slice(0, 2).toUpperCase() || "??",
    rating: t.rating,
    preview: t.preview,
    fullText: t.fullText,
    date: new Date(t.createdAt).toLocaleDateString("en-IN", {
      year: "numeric", month: "long", day: "numeric",
    }),
    source: t.source || "InvestBeans",
    tag: t.tag || "General",
    userId: t.user?._id,
  };
}

// ─── Stars ─────────────────────────────────────────────────────────────────
function Stars({ rating, size = 16, isLight }: { rating: number; size?: number; isLight: boolean }) {
  return (
    <div style={{ display: "flex", gap: "3px" }}>
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i} size={size}
          style={{
            fill: i < rating ? "#F59E0B" : isLight ? "rgba(13,37,64,0.12)" : "rgba(255,255,255,0.15)",
            color: i < rating ? "#F59E0B" : isLight ? "rgba(13,37,64,0.12)" : "rgba(255,255,255,0.15)",
          }}
        />
      ))}
    </div>
  );
}

// ─── Small icon-only action button ─────────────────────────────────────────
function ActionIcon({
  icon: Icon, color, bg, border: borderStyle, title, onClick, loading,
}: {
  icon: any; color: string; bg: string; border: string;
  title: string; onClick: (e: React.MouseEvent) => void; loading?: boolean;
}) {
  const [hov, setHov] = useState(false);
  return (
    <button
      title={title}
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        width: "30px", height: "30px", borderRadius: "50%",
        border: borderStyle,
        background: hov ? color : bg,
        color: hov ? "#fff" : color,
        display: "flex", alignItems: "center", justifyContent: "center",
        cursor: "pointer", transition: "all 0.18s ease", flexShrink: 0,
      }}
    >
      {loading
        ? <Loader2 size={13} style={{ animation: "spin 1s linear infinite" }} />
        : <Icon size={13} strokeWidth={2.2} />}
    </button>
  );
}

// ─── Testimonial Card ─────────────────────────────────────────────────────
function TestimonialCard({
  t, onClick, isMobile, isLight, onDelete, onEdit, canEdit, canDelete, deleting,
}: {
  t: Testimonial; onClick: () => void; isMobile: boolean; isLight: boolean;
  onDelete?: () => void; onEdit?: () => void;
  canEdit?: boolean; canDelete?: boolean; deleting?: boolean;
}) {
  const [hovered, setHovered] = useState(false);

  const cardBg     = isLight ? "rgba(255,255,255,0.97)" : "rgba(10,30,52,0.82)";
  const cardBorder = hovered && !isMobile
    ? "#1F5F89"
    : isLight ? "rgba(4,20,33,0.09)" : "rgba(124,166,194,0.18)";
  const cardShadow = hovered && !isMobile
    ? isLight ? "0 8px 28px rgba(10,54,86,0.13)" : "0 8px 28px rgba(0,0,0,0.40)"
    : isLight ? "0 2px 10px rgba(0,0,0,0.04)" : "0 2px 12px rgba(0,0,0,0.25)";
  const textColor  = isLight ? "#374151" : "rgba(214,228,240,0.92)";
  const nameColor  = isLight ? "#0f172a" : "#e2eef7";
  const metaColor  = isLight ? "#94a3b8" : "rgba(148,163,184,0.85)";
  const avatarBg   = isLight ? "rgba(31,95,137,0.10)" : "rgba(31,95,137,0.28)";

  return (
    <div
      onMouseEnter={() => !isMobile && setHovered(true)}
      onMouseLeave={() => !isMobile && setHovered(false)}
      onClick={onClick}
      style={{
        background: cardBg,
        borderRadius: "14px",
        border: `1px solid ${cardBorder}`,
        boxShadow: cardShadow,
        padding: isMobile ? "20px 18px" : "16px 18px",
        transition: "all 0.20s ease",
        transform: hovered && !isMobile ? "translateY(-3px)" : "translateY(0)",
        display: "flex", flexDirection: "column" as const, gap: "12px",
        // Desktop: fixed marquee width. Mobile: fill the swipe slot
        width: isMobile ? "100%" : "300px",
        minHeight: isMobile ? "200px" : undefined,
        flexShrink: 0,
        boxSizing: "border-box" as const,
        cursor: "pointer",
        position: "relative" as const,
      }}
    >
      {/* Top: Stars + action icons */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <Stars rating={t.rating} size={isMobile ? 15 : 13} isLight={isLight} />
        {(canEdit || canDelete) && t._id && (
          <div style={{ display: "flex", gap: "5px" }} onClick={e => e.stopPropagation()}>
            {canEdit && (
              <ActionIcon icon={Edit3} title="Edit your review" color="#1F5F89"
                bg="rgba(31,95,137,0.10)" border="1px solid rgba(31,95,137,0.30)"
                onClick={(e) => { e.stopPropagation(); onEdit?.(); }} />
            )}
            {canDelete && (
              <ActionIcon icon={Trash2} title="Delete review" color="#ef4444"
                bg="rgba(239,68,68,0.08)" border="1px solid rgba(239,68,68,0.28)"
                onClick={(e) => { e.stopPropagation(); onDelete?.(); }} loading={deleting} />
            )}
          </div>
        )}
      </div>

      {/* Review text */}
      <p style={{
        margin: 0,
        fontSize: isMobile ? "14px" : "13px",
        color: textColor, lineHeight: 1.65,
        display: "-webkit-box",
        WebkitLineClamp: isMobile ? 4 : 3,
        WebkitBoxOrient: "vertical" as any,
        overflow: "hidden",
      }}>
        "{t.preview}"
      </p>

      {/* Author row */}
      <div style={{ display: "flex", alignItems: "center", gap: "9px", marginTop: "2px" }}>
        <div style={{
          width: isMobile ? "36px" : "32px", height: isMobile ? "36px" : "32px",
          borderRadius: "50%", flexShrink: 0,
          background: avatarBg, display: "flex", alignItems: "center",
          justifyContent: "center", fontSize: "11px", fontWeight: 700, color: "#1F5F89",
        }}>
          {t.avatar}
        </div>
        <div style={{ minWidth: 0, flex: 1 }}>
          <p style={{ margin: 0, fontSize: isMobile ? "13px" : "12px", fontWeight: 700, color: nameColor, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {t.name}
          </p>
          <p style={{ margin: "1px 0 0", fontSize: "11px", color: metaColor, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {[t.role, t.company].filter(Boolean).join(" · ") || t.source}
          </p>
        </div>
        <span style={{
          fontSize: "10px", fontWeight: 600, color: "#1F5F89",
          background: isLight ? "rgba(31,95,137,0.08)" : "rgba(31,95,137,0.22)",
          borderRadius: "20px", padding: "2px 8px", flexShrink: 0, whiteSpace: "nowrap",
        }}>
          {t.tag}
        </span>
      </div>
    </div>
  );
}

// ─── Full-review Modal ─────────────────────────────────────────────────────
function Modal({ t, onClose, isLight, isMobile }: { t: Testimonial; onClose: () => void; isLight: boolean; isMobile?: boolean }) {
  const modalBg      = isLight ? "#ffffff" : "linear-gradient(160deg,#0d1f38 0%,#0c1a2e 100%)";
  const modalBorder  = isLight ? "1px solid rgba(226,232,240,0.8)" : "1px solid rgba(255,255,255,0.1)";
  const titleColor   = isLight ? "#0f172a" : "white";
  const metaColor    = isLight ? "#94a3b8" : "rgba(148,163,184,1)";
  const dividerColor = isLight ? "rgba(226,232,240,0.8)" : "rgba(255,255,255,0.08)";
  const bodyColor    = isLight ? "#475569" : "rgba(226,232,240,1)";
  const avatarBg     = isLight ? "rgba(10,54,86,0.10)" : "rgba(10,54,86,0.24)";
  const closeBtnBg   = isLight ? "rgba(226,232,240,0.6)" : "rgba(255,255,255,0.1)";
  const closeBtnColor = isLight ? "#64748b" : "rgba(203,213,225,1)";

  return (
    <div
      style={{
        position: isMobile ? "absolute" : "fixed",
        inset: 0,
        zIndex: 9999,
        display: "flex",
        alignItems: isMobile ? "flex-start" : "center",
        justifyContent: "center",
        padding: isMobile ? "12px" : "16px",
        background: "rgba(0,0,0,0.65)",
        backdropFilter: "blur(8px)",
        overflowY: isMobile ? "auto" : undefined,
      }}
      onClick={onClose}
    >
      <div
        style={{ width: "100%", maxWidth: "640px", maxHeight: "90vh", borderRadius: "24px", overflow: "hidden", overflowY: "auto", background: modalBg, border: modalBorder, boxShadow: "0 32px 80px rgba(0,0,0,0.35)", position: "relative", marginTop: isMobile ? "8px" : undefined }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "2px", background: "linear-gradient(90deg,transparent,rgba(10,54,86,0.50),transparent)" }} />
        <div style={{ padding: "32px 28px 28px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "24px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
              <div style={{ width: "52px", height: "52px", borderRadius: "50%", background: avatarBg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "18px", fontWeight: 800, color: "#1F5F89" }}>
                {t.avatar}
              </div>
              <div>
                <p style={{ margin: 0, fontSize: "18px", fontWeight: 800, color: titleColor }}>{t.name}</p>
                <p style={{ margin: "3px 0 0", fontSize: "13px", color: metaColor }}>{[t.role, t.company].filter(Boolean).join(" · ")}</p>
              </div>
            </div>
            <button onClick={onClose} style={{ width: "36px", height: "36px", borderRadius: "50%", border: "none", background: closeBtnBg, color: closeBtnColor, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <X size={16} />
            </button>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "20px", flexWrap: "wrap" }}>
            <Stars rating={t.rating} size={18} isLight={isLight} />
            <span style={{ fontSize: "11px", fontWeight: 600, textTransform: "uppercase" as const, letterSpacing: "0.05em", color: "#1F5F89", background: "rgba(31,95,137,0.12)", borderRadius: "20px", padding: "3px 10px" }}>{t.tag}</span>
            <span style={{ fontSize: "12px", color: metaColor }}>{t.date} · {t.source}</span>
          </div>
          <div style={{ height: "1px", background: dividerColor, marginBottom: "20px" }} />
          {t.fullText.split("\n\n").map((para, i) => (
            <p key={i} style={{ margin: "0 0 16px", fontSize: "15px", lineHeight: 1.8, color: bodyColor, fontStyle: "italic" }}>{para}</p>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────
export default function TestimonialsPage() {
  const { theme } = useTheme();
  const isLight = theme === "light";
  const { user, isAdmin, loading: authLoading } = useAuth();
  const isLoggedIn = !!user;

  const [index, setIndex] = useState(0);
  const [modal, setModal] = useState<Testimonial | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  // Touch swipe
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);

  // API state
  const [apiTestimonials, setApiTestimonials] = useState<Testimonial[]>([]);
  const [myTestimonial, setMyTestimonial] = useState<ApiTestimonial | null>(null);
  const [loadingApi, setLoadingApi] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Form
  const [formOpen, setFormOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<ApiTestimonial | null>(null);
  const { toasts, toast, removeToast } = useToast();

  // Only real API reviews — no static/dummy data
  const allTestimonials = apiTestimonials;

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  useEffect(() => { fetchAll(); }, []);
  useEffect(() => {
    if (isLoggedIn) fetchMine();
    else setMyTestimonial(null);
  }, [isLoggedIn]);

  const fetchAll = async () => {
    try {
      setLoadingApi(true);
      const data = await getAllTestimonials();
      setApiTestimonials(data.map(toUnified));
    } catch { /* silent fail */ } finally {
      setLoadingApi(false);
    }
  };

  const fetchMine = async () => {
    try { setMyTestimonial(await getMyTestimonial()); }
    catch { setMyTestimonial(null); }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this review?")) return;
    try {
      setDeletingId(id);
      await deleteTestimonial(id);
      setApiTestimonials(prev => prev.filter(t => t._id !== id));
      if (myTestimonial?._id === id) setMyTestimonial(null);
      toast.success("Review deleted successfully.");
    } catch (err: any) {
      toast.error(err.message || "Failed to delete review.");
    } finally { setDeletingId(null); }
  };

  const handleFormSuccess = (updated: ApiTestimonial) => {
    const unified = toUnified(updated);
    setApiTestimonials(prev => {
      const idx = prev.findIndex(t => t._id === updated._id);
      if (idx >= 0) {
        const copy = [...prev]; copy[idx] = unified;
        toast.success("Review updated successfully.");
        return copy;
      }
      toast.success("Review posted! Thank you for your feedback.");
      return [unified, ...prev];
    });
    setMyTestimonial(updated);
    setEditTarget(null);
  };

  const openCreate = () => { setEditTarget(null); setFormOpen(true); };
  const openEdit = (t: Testimonial) => {
    setEditTarget({
      _id: t._id!, user: { _id: t.userId!, name: t.name, email: "" },
      name: t.name, role: t.role, company: t.company, avatar: t.avatar,
      rating: t.rating, preview: t.preview, fullText: t.fullText,
      tag: t.tag, source: t.source, createdAt: "",
    });
    setFormOpen(true);
  };

  // ── Carousel ──────────────────────────────────────────────────────────────
  const perPage  = isMobile ? 1 : 2;
  const totalDots = Math.max(1, Math.ceil(allTestimonials.length / perPage));
  const visible  = allTestimonials.slice(index * perPage, index * perPage + perPage);

  const prev = useCallback(() => setIndex(i => (i - 1 + allTestimonials.length) % allTestimonials.length), [allTestimonials.length]);
  const next = useCallback(() => setIndex(i => (i + 1) % allTestimonials.length), [allTestimonials.length]);

  useEffect(() => { setIndex(0); }, [allTestimonials.length]);

  // Auto-advance on mobile only
  useEffect(() => {
    if (!isMobile || allTestimonials.length === 0) return;
    const id = setInterval(next, 4500);
    return () => clearInterval(id);
  }, [next, isMobile, allTestimonials.length]);

  // ── Touch swipe (mobile) ──────────────────────────────────────────────────
  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null || touchStartY.current === null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    const dy = e.changedTouches[0].clientY - touchStartY.current;
    if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 35) {
      dx < 0 ? next() : prev();
    }
    touchStartX.current = null;
    touchStartY.current = null;
  };

  // ── Button visibility logic ───────────────────────────────────────────────
  // ● Not logged in           → soft prompt text only
  // ● Logged in, no review    → "Write a Review" button
  // ● Logged in, has review   → "Edit My Review" button  (no duplicate create)
  // ● Admin                   → no top button; delete icon shows on each card
  const userAlreadyPosted = !!myTestimonial;
  const showWriteBtn = isLoggedIn && !isAdmin && !userAlreadyPosted && !authLoading;
  const showEditBtn  = isLoggedIn && !isAdmin &&  userAlreadyPosted && !!myTestimonial && !authLoading;

  // Theme tokens
  const headingColor    = isLight ? "#041421" : "#E8EDF5";
  const subHeadingColor = isLight ? "#4f6a80" : "rgba(255,255,255,0.50)";
  const badgeBg         = isLight ? "rgba(31,95,137,0.08)" : "rgba(31,95,137,0.22)";
  const badgeBorder     = isLight ? "1px solid rgba(31,95,137,0.20)" : "1px solid rgba(124,166,194,0.28)";
  const dotActive       = isLight ? "#0A3656" : "#74A8C9";
  const dotInactive     = isLight ? "rgba(203,213,225,0.7)" : "rgba(255,255,255,0.18)";

  // Desktop marquee: split into two rows
  const half = Math.ceil(allTestimonials.length / 2);
  const row1 = allTestimonials.slice(0, half);
  const row2 = allTestimonials.slice(half);

  // Fade edge colors matching the parent panel bg
  const fadeL = isLight
    ? "linear-gradient(to right, rgba(252,253,254,0.96) 0%, transparent 100%)"
    : "linear-gradient(to right, rgba(8,31,49,0.92) 0%, transparent 100%)";
  const fadeR = isLight
    ? "linear-gradient(to left, rgba(252,253,254,0.96) 0%, transparent 100%)"
    : "linear-gradient(to left, rgba(8,31,49,0.92) 0%, transparent 100%)";

  const marqueeCSS = `
    @keyframes marquee-left  { from { transform: translateX(0); } to { transform: translateX(-50%); } }
    @keyframes marquee-right { from { transform: translateX(-50%); } to { transform: translateX(0); } }
    @keyframes spin { to { transform: rotate(360deg); } }
  `;

  const renderMarqueeRow = (items: Testimonial[], direction: "left" | "right") => {
    if (items.length === 0) return null;
    const doubled = [...items, ...items];
    return (
      <div style={{ overflow: "hidden", width: "100%" }}>
        <div
          style={{
            display: "flex", gap: "14px", width: "max-content",
            animation: `marquee-${direction} ${Math.max(20, items.length * 7)}s linear infinite`,
          }}
          onMouseEnter={e => (e.currentTarget.style.animationPlayState = "paused")}
          onMouseLeave={e => (e.currentTarget.style.animationPlayState = "running")}
        >
          {doubled.map((t, i) => {
            const isMyCard  = !!t._id && t.userId === user?._id;
            const isApiCard = !!t._id;
            return (
              <TestimonialCard
                key={`${t.id}-${i}`} t={t}
                isMobile={false} isLight={isLight}
                onClick={() => setModal(t)}
                canEdit={isLoggedIn && isMyCard && !isAdmin}
                canDelete={isAdmin && isApiCard}
                onEdit={() => openEdit(t)}
                onDelete={() => handleDelete(t._id!)}
                deleting={deletingId === t._id}
              />
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <section
      id="testimonials"
      style={{ background: "transparent", padding: isMobile ? "36px 0 32px" : "48px 0 40px", overflow: "hidden", position: "relative" as const }}
    >
      <style>{marqueeCSS}</style>

      {/* ── Header ── */}
      <div style={{ textAlign: "center", marginBottom: isMobile ? "24px" : "32px", padding: "0 20px" }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: "7px", background: badgeBg, border: badgeBorder, borderRadius: "100px", padding: "5px 14px", marginBottom: "12px" }}>
          <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#1F5F89" }} />
          <span style={{ fontSize: "11px", fontWeight: 600, color: "#1F5F89", letterSpacing: "0.06em", textTransform: "uppercase" }}>User Reviews</span>
        </div>
        <h2 style={{ margin: "0 0 8px", fontSize: isMobile ? "22px" : "clamp(24px,3.5vw,36px)", fontWeight: 800, color: headingColor, letterSpacing: "-0.02em", lineHeight: 1.15 }}>
        The InvestBeans Experience, in Their Words
        </h2>
        <p style={{ margin: "0 auto 16px", fontSize: isMobile ? "13px" : "15px", color: subHeadingColor, maxWidth: "420px", lineHeight: 1.6 }}>
        Why Investors Trust InvestBeans
        </p>

        {/* Auth-aware CTA */}
        {!authLoading && (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "10px", flexWrap: "wrap" }}>
            {showWriteBtn && (
              <button
                onClick={openCreate}
                style={{ display: "inline-flex", alignItems: "center", gap: "7px", padding: "9px 20px", borderRadius: "10px", fontSize: "13px", fontWeight: 700, background: "linear-gradient(135deg,#0A3656,#1F5F89)", border: "none", color: "#fff", cursor: "pointer", boxShadow: "0 4px 14px rgba(10,54,86,0.28)" }}
              >
                <Plus size={15} /> Write a Review
              </button>
            )}
            {showEditBtn && (
              <button
                onClick={() => openEdit(toUnified(myTestimonial!))}
                style={{ display: "inline-flex", alignItems: "center", gap: "7px", padding: "9px 20px", borderRadius: "10px", fontSize: "13px", fontWeight: 700, background: "transparent", border: "1px solid #1F5F89", color: "#1F5F89", cursor: "pointer" }}
              >
                <Edit3 size={14} /> Edit My Review
              </button>
            )}
          </div>
        )}
      </div>

      {/* ── Loading ── */}
      {loadingApi && (
        <div style={{ display: "flex", justifyContent: "center", padding: "40px" }}>
          <Loader2 size={26} style={{ color: "#1F5F89", animation: "spin 1s linear infinite" }} />
        </div>
      )}

      {/* ── Empty state ── */}
      {!loadingApi && allTestimonials.length === 0 && (
        <div style={{ textAlign: "center", padding: "40px 20px", color: subHeadingColor }}>
          <Quote size={36} style={{ color: "#1F5F89", opacity: 0.3, display: "block", margin: "0 auto 10px" }} />
          <p style={{ margin: 0, fontSize: "14px" }}>No reviews yet. Be the first to share your experience!</p>
        </div>
      )}

      {/* ════════════════════════════════════════
          MOBILE: Single-card finger swipe
      ════════════════════════════════════════ */}
      {!loadingApi && allTestimonials.length > 0 && isMobile && (
        <div style={{ padding: "0 16px" }}>
          {/* Swipe area */}
          <div
            onTouchStart={onTouchStart}
            onTouchEnd={onTouchEnd}
            style={{ position: "relative" as const, userSelect: "none" as const }}
          >
           
            {/* Card — animated slide */}
            <div style={{ overflow: "hidden", borderRadius: "14px" }}>
              <div
                style={{
                  display: "flex",
                  transition: "transform 0.35s cubic-bezier(0.25,0.46,0.45,0.94)",
                  transform: `translateX(-${index * 100}%)`,
                  willChange: "transform",
                }}
              >
                {allTestimonials.map(t => {
                  const isMyCard  = !!t._id && t.userId === user?._id;
                  const isApiCard = !!t._id;
                  return (
                    <div key={t.id} style={{ minWidth: "100%", boxSizing: "border-box" as const }}>
                      <TestimonialCard
                        t={t} isMobile={true} isLight={isLight}
                        onClick={() => setModal(t)}
                        canEdit={isLoggedIn && isMyCard && !isAdmin}
                        canDelete={isAdmin && isApiCard}
                        onEdit={() => openEdit(t)}
                        onDelete={() => handleDelete(t._id!)}
                        deleting={deletingId === t._id}
                      />
                    </div>
                  );
                })}
              </div>
            </div>

          </div>

          {/* Dots */}
          {allTestimonials.length > 1 && (
            <div style={{ display: "flex", justifyContent: "center", gap: "6px", marginTop: "16px", alignItems: "center" }}>
              {allTestimonials.map((_, i) => (
                <button
                  key={i} onClick={() => setIndex(i)}
                  style={{
                    width: i === index ? "20px" : "7px", height: "7px",
                    borderRadius: "100px", border: "none", padding: 0, cursor: "pointer",
                    background: i === index ? dotActive : dotInactive,
                    transition: "all 0.3s ease",
                  }}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* ════════════════════════════════════════
          DESKTOP: Dual-row infinite marquee
      ════════════════════════════════════════ */}
      {!loadingApi && allTestimonials.length > 0 && !isMobile && (
        <div style={{ position: "relative" as const, display: "flex", flexDirection: "column" as const, gap: "14px" }}>
          {/* Left + right fade masks */}
          <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: "80px", zIndex: 2, pointerEvents: "none", background: fadeL }} />
          <div style={{ position: "absolute", right: 0, top: 0, bottom: 0, width: "80px", zIndex: 2, pointerEvents: "none", background: fadeR }} />

          {renderMarqueeRow(row1.length > 0 ? row1 : allTestimonials, "left")}
          {row2.length > 0 && renderMarqueeRow(row2, "right")}
        </div>
      )}

      {modal && <Modal t={modal} onClose={() => setModal(null)} isLight={isLight} isMobile={isMobile} />}

      <TestimonialForm
        isOpen={formOpen}
        onClose={() => { setFormOpen(false); setEditTarget(null); }}
        onSuccess={handleFormSuccess}
        existing={editTarget}
      />

      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </section>
  );
}