import React, { useState, useEffect } from "react";
import { useAuth } from "@/controllers/AuthContext";
import { useTheme } from "@/controllers/Themecontext";
import {
  getAllBeans,
  deleteBean,
  BeanOfWisdom,
} from "@/services/beanOfWisdomService";
import {
  Loader2, Edit3, Trash2, X, Coffee,
} from "lucide-react";
import BeansOfWisdomForm from "@/components/BeansOfWisdomForm";

/* ── Animations ── */
const StyleInjector = () => {
  useEffect(() => {
    if (document.getElementById("bow-pub-styles")) return;
    const s = document.createElement("style");
    s.id = "bow-pub-styles";
    s.textContent = `
      @keyframes bow-in {
        from { opacity:0; transform:translateY(10px); }
        to   { opacity:1; transform:translateY(0); }
      }
      @keyframes bow-rule {
        from { transform:scaleX(0); }
        to   { transform:scaleX(1); }
      }
      @keyframes bow-pulse {
        0%,100% { opacity:1; } 50% { opacity:.3; }
      }
      .bow-in  { animation: bow-in 0.45s cubic-bezier(.22,.68,0,1.1) both; }
      .bow-d1  { animation-delay:.04s; }
      .bow-d2  { animation-delay:.12s; }
      .bow-d3  { animation-delay:.20s; }
      .bow-d4  { animation-delay:.28s; }
      .bow-rule-anim { transform-origin:left; animation: bow-rule .55s .2s cubic-bezier(.22,.68,0,1.1) both; }
      .bow-dot { animation: bow-pulse 2.2s ease-in-out infinite; }
    `;
    document.head.appendChild(s);
  }, []);
  return null;
};

function weekLabel() {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 1);
  const wk = Math.ceil(((now.getTime() - start.getTime()) / 86400000 + start.getDay() + 1) / 7);
  return `Week ${wk} · ${now.getFullYear()}`;
}

export default function BeansOfWisdomView() {
  const { isAdmin, loading: authLoading } = useAuth();
  const { theme } = useTheme();
  const isLight = theme === "light";

  const [bean, setBean]                   = useState<BeanOfWisdom | null>(null);
  const [loading, setLoading]             = useState(true);
  const [error, setError]                 = useState<string | null>(null);
  const [showEditForm, setShowEditForm]   = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => { fetchBeans(); }, []);

  const fetchBeans = async () => {
    try {
      setLoading(true); setError(null);
      const beans = await getAllBeans();
      setBean(beans && beans.length > 0 ? beans[0] : null);
    } catch (err: any) {
      setError(err.message || "Failed to fetch beans");
    } finally { setLoading(false); }
  };

  const handleDelete = async () => {
    if (!bean?._id || !isAdmin) return;
    if (!window.confirm("Delete this wisdom?")) return;
    try {
      setDeleteLoading(true); setError(null);
      await deleteBean(bean._id);
      setBean(null);
    } catch (err: any) {
      setError(err.message || "Failed to delete");
    } finally { setDeleteLoading(false); }
  };

  const handleFormSuccess = () => { fetchBeans(); setShowEditForm(false); };

  /* ── Tokens ── */
  const accentHex   = "#0A3656";
  const accentLight = isLight ? "#0A3656" : "#74A8C9";

  const headingClr  = isLight ? "#041421"                 : "#ffffff";
  const subClr      = isLight ? "#36556d"                 : "rgba(203,213,225,1)";

  const pubBg       = isLight ? "#F7FAFB"                 : "#07192A";
  const ink         = isLight ? "#0A1E2C"                 : "#E8F0F5";
  const inkMid      = isLight ? "#36556d"                 : "rgba(155,193,218,0.85)";
  const rule        = isLight ? "rgba(4,20,33,.10)"       : "rgba(124,166,194,.15)";
  const pullBg      = isLight ? "rgba(10,54,86,.05)"      : "rgba(10,54,86,.38)";

  const gradL  = `linear-gradient(90deg,${accentLight},rgba(127,177,207,.5),transparent)`;
  const gradR  = `linear-gradient(90deg,transparent,rgba(127,177,207,.5),${accentLight})`;

  const errBg  = isLight ? "rgba(254,242,242,1)"          : "rgba(220,38,38,.10)";
  const errBdr = isLight ? "1px solid rgba(254,202,202,.8)" : "1px solid rgba(239,68,68,.5)";
  const errClr = isLight ? "#dc2626"                      : "rgba(252,165,165,1)";
  const spinClr = accentLight;
  const emptyClr = isLight ? "#94a3b8"                   : "rgba(148,163,184,1)";

  const pubFont  = "'Georgia','Times New Roman',serif";
  const sansFont = "system-ui,-apple-system,sans-serif";

  /* ── Loading ── */
  if (authLoading || loading) return (
    <section className="py-6 lg:py-10 px-4 sm:px-6 md:px-10 lg:px-12">
      <div className="flex items-center justify-center py-16 gap-3">
        <Loader2 className="w-4 h-4 animate-spin" style={{ color: spinClr }} />
        <p className="text-xs font-medium tracking-widest uppercase" style={{ color: emptyClr, fontFamily: sansFont }}>
          Brewing your weekly wisdom…
        </p>
      </div>
    </section>
  );

  /* ── Empty ── */
  if (!bean) return (
    <section className="py-6 lg:py-10 px-4 sm:px-6 md:px-10 lg:px-12">
      <div className="text-center py-16">
        <Coffee className="w-8 h-8 mx-auto mb-3 opacity-30" style={{ color: spinClr }} />
        <p className="text-xs tracking-widest uppercase" style={{ color: emptyClr, fontFamily: sansFont }}>
          No wisdom this week yet.
        </p>
      </div>
    </section>
  );

  return (
    <>
      <StyleInjector />

      <section id="beans-of-wisdom" className="py-6 lg:py-10 px-4 sm:px-6 md:px-10 lg:px-12">

        {/* ═══════════════════════════════════════
            ORIGINAL SECTION HEADING — unchanged
        ═══════════════════════════════════════ */}
        <div className="bow-in bow-d1 mb-4 lg:mb-7 text-center">
          <div className="flex items-center justify-center gap-2 mb-1.5">
            <div className="w-1 h-4 rounded-full" style={{ background: accentLight }} />
            <span
              className="text-xs font-bold tracking-[0.2em] uppercase"
              style={{ color: accentLight, fontFamily: sansFont }}
            >
              Weekly Edition
            </span>
            <div className="w-1 h-4 rounded-full" style={{ background: accentLight }} />
          </div>

          <h2
            className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-extrabold tracking-tight leading-none"
            style={{ color: headingClr }}
          >
            Beans of{" "}
            <span style={{ color: accentLight }}>Wisdom</span>
          </h2>

          <p className="text-sm mt-2 max-w-md mx-auto" style={{ color: subClr }}>
            Curated market insight, delivered every week.
          </p>

          {isAdmin && (
            <div className="flex items-center justify-center gap-2.5 mt-4">
              <button
                onClick={() => setShowEditForm(true)}
                className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-bold text-white rounded-xl transition-colors shadow-sm"
                style={{ background: accentHex, fontFamily: sansFont }}
              >
                <Edit3 className="w-3.5 h-3.5" /> Edit
              </button>
              <button
                onClick={handleDelete} disabled={deleteLoading}
                className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-bold rounded-xl transition-colors disabled:opacity-40"
                style={{ color: "#ef4444", border: "1px solid rgba(239,68,68,.4)", fontFamily: sansFont }}
              >
                <Trash2 className="w-3.5 h-3.5" />
                {deleteLoading ? "Deleting…" : "Delete"}
              </button>
            </div>
          )}
        </div>

        {/* Error */}
        {error && (
          <div
            className="mb-4 flex items-start gap-2 rounded-lg p-3 text-xs"
            style={{ background: errBg, border: errBdr, color: errClr, fontFamily: sansFont }}
          >
            <p className="flex-1">{error}</p>
            <button onClick={() => setError(null)}><X className="w-3.5 h-3.5" /></button>
          </div>
        )}

        {/* ═══════════════════════════════════════
            PUBLICATION STRIP
        ═══════════════════════════════════════ */}
        <div className="bow-in bow-d2 overflow-hidden" style={{ background: pubBg, fontFamily: pubFont }}>

          {/* Top rule */}
          <div style={{ height: 3, background: gradL }} />

          {/* Meta strip */}
          <div
            className="flex items-center justify-between px-4 sm:px-6 lg:px-8 py-1.5"
            style={{ borderBottom: `1px solid ${rule}`, fontFamily: sansFont }}
          >
            <div className="flex items-center gap-2">
              <span className="bow-dot inline-block w-1.5 h-1.5 rounded-full" style={{ background: accentLight }} />
              <span className="text-[9px] font-bold tracking-[0.22em] uppercase" style={{ color: inkMid }}>
                Today's Wisdom
              </span>
            </div>
            <span className="text-[9px] tracking-[0.14em] uppercase" style={{ color: inkMid, opacity: .5 }}>
              {weekLabel()}
            </span>
          </div>

          {/* ═══════════════════════════════════════
              MOBILE — single column, all content visible
          ═══════════════════════════════════════ */}
          <div className="lg:hidden flex flex-col">

            {/* 1. Headline + rule + subtitle */}
            <div className="px-4 py-4" style={{ borderBottom: `1px solid ${rule}` }}>
              <h3
                className="font-extrabold leading-[1.12] tracking-tight mb-2"
                style={{ color: ink, fontSize: "clamp(16px, 5vw, 22px)" }}
              >
                {bean.title}
              </h3>
              <div
                className="bow-rule-anim mb-3"
                style={{ height: 2, width: 28, background: accentLight, borderRadius: 1 }}
              />
              {bean.subtitle && (
                <p style={{ color: inkMid, fontSize: 12, lineHeight: 1.7 }}>
                  {bean.subtitle}
                </p>
              )}
              {/* Tags */}
              {bean.tags && bean.tags.length > 0 && (
                <div className="flex gap-1.5 flex-wrap mt-3">
                  {bean.tags.map((tag, i) => (
                    <span
                      key={i}
                      style={{
                        fontSize: 9, fontFamily: sansFont, letterSpacing: ".04em",
                        color: accentLight, border: `1px solid ${accentLight}`,
                        padding: "2px 7px",
                      }}
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* 2. Key Principle */}
            {bean.keyPrinciple && (
              <div
                className="px-4 py-3"
                style={{ borderLeft: `3px solid ${accentLight}`, background: pullBg, borderBottom: `1px solid ${rule}` }}
              >
                <p
                  className="font-bold uppercase mb-1.5"
                  style={{ fontSize: 8, color: accentLight, fontFamily: sansFont, letterSpacing: ".22em" }}
                >
                  Key Principle
                </p>
                <p
                  className="font-extrabold leading-snug"
                  style={{ color: ink, fontSize: 14 }}
                >
                  {bean.keyPrinciple}
                </p>
              </div>
            )}

            {/* 3. Description / Section */}
            {bean.description && (
              <div className="px-4 py-3" style={{ borderBottom: `1px solid ${rule}` }}>
                {bean.sectionTitle && (
                  <p
                    className="font-bold uppercase mb-1.5"
                    style={{ fontSize: 8, color: accentLight, fontFamily: sansFont, letterSpacing: ".22em" }}
                  >
                    {bean.sectionTitle}
                  </p>
                )}
                <p style={{ color: inkMid, fontSize: 12, lineHeight: 1.75 }}>
                  {bean.description}
                </p>
              </div>
            )}

            {/* 4. Insight Text */}
            {bean.insightText && (
              <div className="px-4 py-3" style={{ borderBottom: `1px solid ${rule}` }}>
                <p
                  className="font-bold uppercase mb-1.5"
                  style={{ fontSize: 8, color: accentLight, fontFamily: sansFont, letterSpacing: ".22em" }}
                >
                  {bean.insightTag || "Investment Strategy"}
                </p>
                <p style={{ color: inkMid, fontSize: 12, lineHeight: 1.75 }}>
                  {bean.insightText}
                </p>
              </div>
            )}

            {/* 5. Quote */}
            {bean.quote && (
              <div
                className="px-4 py-3 flex items-start gap-2"
                style={{ background: pullBg }}
              >
                <span style={{ color: accentLight, fontSize: 22, lineHeight: 0.9, opacity: 0.7, fontFamily: pubFont }}>
                  "
                </span>
                <p
                  className="flex-1 italic"
                  style={{ color: inkMid, fontSize: 12, lineHeight: 1.7 }}
                >
                  {bean.quote}
                </p>
              </div>
            )}
          </div>

          {/* ═══════════════════════════════════════
              DESKTOP — 3-column newspaper
          ═══════════════════════════════════════ */}
          <div
            className="hidden lg:grid"
            style={{ gridTemplateColumns: "1fr 1px 1.6fr 1px 1fr" }}
          >
            {/* COL 1 */}
            <div className="bow-in bow-d2 px-7 py-6 flex flex-col justify-between">
              <div>
                <h3
                  className="text-[1.85rem] font-extrabold leading-[1.08] tracking-tight mb-3"
                  style={{ color: ink }}
                >
                  {bean.title}
                </h3>
                <div
                  className="bow-rule-anim mb-4"
                  style={{ height: 2, width: 30, background: accentLight, borderRadius: 1 }}
                />
                {bean.subtitle && (
                  <p className="text-[12.5px] leading-[1.78]" style={{ color: inkMid }}>
                    {bean.subtitle}
                  </p>
                )}
              </div>
              {bean.tags && bean.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-5">
                  {bean.tags.map((tag, i) => (
                    <span
                      key={i}
                      style={{
                        fontSize: 10, fontFamily: sansFont, letterSpacing: ".05em",
                        color: accentLight, border: `1px solid ${accentLight}`,
                        padding: "2px 7px",
                      }}
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div style={{ background: rule }} />

            {/* COL 2 */}
            <div className="bow-in bow-d3 px-8 py-6 flex flex-col gap-5">
              {bean.keyPrinciple && (
                <div
                  style={{
                    borderLeft: `3px solid ${accentLight}`,
                    background: pullBg,
                    padding: "12px 18px",
                  }}
                >
                  <p
                    className="font-bold tracking-[.22em] uppercase mb-2"
                    style={{ fontSize: 9, color: accentLight, fontFamily: sansFont }}
                  >
                    Key Principle
                  </p>
                  <p
                    className="text-xl font-extrabold leading-snug tracking-tight"
                    style={{ color: ink }}
                  >
                    {bean.keyPrinciple}
                  </p>
                </div>
              )}

              {bean.description && (
                <div>
                  {bean.sectionTitle && (
                    <p
                      className="font-bold tracking-[.22em] uppercase mb-2"
                      style={{ fontSize: 9, color: accentLight, fontFamily: sansFont }}
                    >
                      {bean.sectionTitle}
                    </p>
                  )}
                  <p className="text-[13px] leading-[1.85]" style={{ color: inkMid }}>
                    {bean.description}
                  </p>
                </div>
              )}

              {bean.quote && (
                <>
                  <div style={{ height: 1, background: rule }} />
                  <p className="text-[13.5px] italic leading-[1.85]" style={{ color: inkMid }}>
                    <span style={{ color: accentLight, fontSize: "1.5em", lineHeight: .7, verticalAlign: "middle" }}>"</span>
                    {" "}{bean.quote}{" "}
                    <span style={{ color: accentLight, fontSize: "1.5em", lineHeight: .7, verticalAlign: "middle" }}>"</span>
                  </p>
                </>
              )}
            </div>

            <div style={{ background: rule }} />

            {/* COL 3 */}
            <div className="bow-in bow-d4 px-7 py-6 flex flex-col gap-4">
              {bean.insightText && (
                <>
                  <p
                    className="font-bold tracking-[.22em] uppercase"
                    style={{ fontSize: 9, color: accentLight, fontFamily: sansFont }}
                  >
                    {bean.insightTag || "Investment Strategy"}
                  </p>
                  <div style={{ height: 1, background: rule }} />
                  <p className="text-[12.5px] leading-[1.85]" style={{ color: inkMid }}>
                    {bean.insightText}
                  </p>
                </>
              )}
            </div>
          </div>

          {/* Footer strip */}
          <div
            className="flex items-center justify-between px-4 sm:px-6 lg:px-8 py-1.5"
            style={{ borderTop: `1px solid ${rule}`, fontFamily: sansFont }}
          >
            <span className="text-[9px] tracking-[.15em] uppercase" style={{ color: inkMid, opacity: .45 }}>
              Curated market insight
            </span>

            {/* {isAdmin && (
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowEditForm(true)}
                  className="flex items-center gap-1 text-[10px] font-bold tracking-wide uppercase transition-opacity hover:opacity-60"
                  style={{ color: accentLight }}
                >
                  <Edit3 className="w-2.5 h-2.5" /> Edit
                </button>
                <span style={{ color: rule }}>·</span>
                <button
                  onClick={handleDelete} disabled={deleteLoading}
                  className="flex items-center gap-1 text-[10px] font-bold tracking-wide uppercase transition-opacity hover:opacity-60 disabled:opacity-30"
                  style={{ color: "#ef4444" }}
                >
                  <Trash2 className="w-2.5 h-2.5" />
                  {deleteLoading ? "Deleting…" : "Delete"}
                </button>
              </div>
            )} */}

            <span className="text-[9px] tracking-[.15em] uppercase" style={{ color: inkMid, opacity: .45 }}>
              InvestBeans
            </span>
          </div>

          {/* Bottom rule */}
          <div style={{ height: 3, background: gradR }} />
        </div>

        {isAdmin && (
          <BeansOfWisdomForm
            isOpen={showEditForm}
            onClose={() => setShowEditForm(false)}
            bean={bean}
            onSuccess={handleFormSuccess}
          />
        )}
      </section>
    </>
  );
}