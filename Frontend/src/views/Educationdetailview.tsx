/**
 * EducationDetailView.tsx  — Subscription-gated version
 *
 * Lock logic:
 *  - mod.isPaid === false  → hamesha open (sabke liye)
 *  - mod.isPaid === true   → sirf subscribers + admin ko open
 *  - Not logged in         → click pe /signin redirect
 *  - Logged in, no sub     → click pe /pricing redirect
 *  - Subscribed / Admin    → full access, download button active
 *
 * Secure kyun:
 *  - Locked modules ka content (pdfUrl) DOM mein exist hi nahi karta
 *  - Blurred placeholder dikhta hai — actual data nahi
 *  - Inspect tools mein kuch nahi milega
 */

import React, { useState, useRef, useEffect } from 'react';
import Layout from '@/components/Layout';
import { useParams, useNavigate } from 'react-router-dom';
import { useTheme } from '@/controllers/Themecontext';
import { useAuth } from '@/controllers/AuthContext';
import { useSubscription } from '@/hooks/useSubscription';   // ← NEW
import CATEGORY_DATA from '@/data/CATEGORY_DATA_real';

// ── SVG Icons ───────────────────────────────────────────────────────────────
const SvgBack = () => (
  <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="15 18 9 12 15 6" />
  </svg>
);
const SvgPlay = () => (
  <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" /><polygon points="10 8 16 12 10 16 10 8" />
  </svg>
);
const SvgBook = () => (
  <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
  </svg>
);
const SvgClock = () => (
  <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
  </svg>
);
const SvgLock = () => (
  <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
);
const SvgLockSm = () => (
  <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
);
const SvgCheck = () => (
  <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);
const SvgStar = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5 text-yellow-400">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  </svg>
);
const SvgDownload = () => (
  <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" />
  </svg>
);
const SvgShield = () => (
  <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    <polyline points="9 12 11 14 15 10" />
  </svg>
);
const SvgFileText = () => (
  <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="16" y1="13" x2="8" y2="13" />
    <line x1="16" y1="17" x2="8" y2="17" />
    <polyline points="10 9 9 9 8 9" />
  </svg>
);
const SvgCrown = () => (
  <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 4l3 12h14l3-12-6 7-4-7-4 7-6-7z" />
    <line x1="5" y1="20" x2="19" y2="20" />
  </svg>
);

// ── Level style map ─────────────────────────────────────────────────────────
const levelStyleMap: Record<string, { bg: string; text: string }> = {
  Beginner:     { bg: 'rgba(16,185,129,0.12)',  text: '#34D399' },
  Intermediate: { bg: 'rgba(245,158,11,0.12)',  text: '#FBBF24' },
  Advanced:     { bg: 'rgba(239,68,68,0.12)',   text: '#F87171' },
  'All Levels': { bg: 'rgba(148,163,184,0.12)', text: '#94A3B8' },
};

// ══════════════════════════════════════════════════════════════════════════
// LOCKED MODULE CARD — locked module ke liye placeholder
// DOM mein pdfUrl, title details ya koi sensitive data NAHI hoga
// ══════════════════════════════════════════════════════════════════════════

function LockedModuleCard({
  idx, data, isLight, cardBg, border, textPrimary, textMuted, textFaint, onUnlock,
}: any) {
  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{
        background: cardBg,
        border: `1px solid ${border}`,
        boxShadow: isLight ? '0 2px 20px rgba(0,0,0,0.04)' : 'none',
        opacity: 0.85,
      }}
    >
      <div className="h-0.5 w-full" style={{ background: data.accentGrad }} />

      <div className="px-6 py-8 flex flex-col items-center text-center gap-4">
        {/* Lock icon */}
        <div
          className="w-14 h-14 rounded-2xl flex items-center justify-center"
          style={{
            background: `${data.accent}12`,
            border: `1px solid ${data.accent}25`,
            color: data.accent,
          }}
        >
          <SvgLock />
        </div>

        {/* Blurred fake title bars — no real text in DOM */}
        <div className="w-full space-y-2">
          <div
            className="h-4 rounded mx-auto"
            style={{ width: '65%', background: isLight ? 'rgba(0,0,0,0.07)' : 'rgba(255,255,255,0.07)' }}
          />
          <div
            className="h-3 rounded mx-auto"
            style={{ width: '45%', background: isLight ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.04)' }}
          />
        </div>

        <p className="text-sm" style={{ color: textFaint }}>
          This content is for subscribers only
        </p>

        {/* CTA */}
        <button
          onClick={onUnlock}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90 hover:-translate-y-0.5"
          style={{
            background: data.accentGrad,
            boxShadow: `0 4px 16px ${data.accent}30`,
          }}
        >
          <SvgCrown /> Unlock Access
        </button>

        <p className="text-[11px]" style={{ color: textFaint }}>
          Subscribe to get full access to all {data.stats.modules} {data.contentType === 'ebook' ? 'PDFs' : 'videos'}
        </p>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════
// PDF MODULE CARD
// ══════════════════════════════════════════════════════════════════════════

function PdfModuleCard({
  mod, idx, data, isLight, cardBg, border, ls,
  textPrimary, textMuted, textFaint, locked, onUnlock,
}: any) {
  const handleDownload = () => {
    if (locked) { onUnlock(); return; }
    const publicUrl = `https://vhutfmztepdlgkqejpvh.supabase.co/storage/v1/object/public/Investbeans/${mod.pdfUrl}`;
    window.open(publicUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="rounded-2xl overflow-hidden" style={{
      background: cardBg, border: `1px solid ${border}`,
      boxShadow: isLight ? '0 2px 20px rgba(0,0,0,0.05)' : 'none',
    }}>
      <div className="h-0.5 w-full" style={{ background: data.accentGrad }} />

      {/* Header */}
      <div className="px-6 pt-6 pb-4">
        <div className="flex items-start justify-between gap-4 mb-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: `${data.accent}15`, color: data.accent }}>
              <SvgFileText />
            </div>
            <div>
              <h3 className="text-lg font-bold leading-snug" style={{ color: textPrimary }}>{mod.title}</h3>
              <p className="text-sm italic" style={{ color: data.accent, opacity: 0.85 }}>{mod.subtitle}</p>
            </div>
          </div>
          <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
            <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full"
              style={{ background: ls.bg, color: ls.text }}>{mod.level}</span>
            {mod.isPaid ? (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                style={{ background: 'rgba(81,148,246,0.12)', color: '#5194F6' }}>PREMIUM</span>
            ) : (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                style={{ background: 'rgba(16,185,129,0.12)', color: '#34D399' }}>FREE</span>
            )}
          </div>
        </div>
        <p className="text-sm leading-relaxed" style={{ color: textMuted }}>{mod.description}</p>

        {mod.highlights && (
          <div className="flex flex-wrap gap-2 mt-3">
            {mod.highlights.map((h: string, j: number) => (
              <span key={j} className="text-[11px] px-2.5 py-1 rounded-full"
                style={{ background: isLight ? `${data.accent}08` : `${data.accent}12`, color: data.accent, border: `1px solid ${data.accent}20` }}>
                {h}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="mx-6" style={{ height: 1, background: `linear-gradient(90deg,${data.accent}15,transparent)` }} />

      {/* Preview topics */}
      {mod.previewTopics && (
        <div className="px-6 py-4">
          <p className="text-[10px] font-bold uppercase tracking-widest mb-3" style={{ color: textFaint }}>
            What's inside
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-y-2 gap-x-4">
            {mod.previewTopics.map((topic: string, j: number) => (
              <div key={j} className="flex items-start gap-2">
                <div className="w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                  style={{ background: `${data.accent}15`, color: data.accent }}>
                  <SvgCheck />
                </div>
                <span className="text-xs leading-relaxed" style={{ color: textMuted }}>{topic}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mx-6" style={{ height: 1, background: `linear-gradient(90deg,${data.accent}15,transparent)` }} />

      {/* Download CTA */}
      <div className="px-6 py-5">
        <div className="space-y-2">
          <button
            onClick={handleDownload}
            className="w-full py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2.5 transition-all hover:opacity-90 hover:-translate-y-0.5"
            style={locked ? {
              background: isLight ? 'rgba(81,148,246,0.08)' : 'rgba(81,148,246,0.12)',
              color: '#5194F6',
              border: '1.5px solid rgba(81,148,246,0.30)',
            } : {
              background: isLight ? `${data.accent}12` : `${data.accent}18`,
              color: data.accent,
              border: `1.5px solid ${data.accent}35`,
            }}
          >
            {locked ? (
              <><SvgLock /> Unlock to Download PDF</>
            ) : (
              <><SvgDownload /> Download Full PDF</>
            )}
          </button>
          <p className="text-[11px] text-center flex items-center justify-center gap-1" style={{ color: textFaint }}>
            <SvgShield /> {locked ? 'Subscribe to access this PDF' : 'Secure download · Subscriber only'}
          </p>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════
// VIDEO / CERTIFICATION MODULE CARD
// ══════════════════════════════════════════════════════════════════════════

function ModuleCard({
  mod, idx, data, isLight, cardBg, border, ls,
  textPrimary, textMuted, textFaint, locked, isSubscriber, onUnlock, navigate,
}: any) {
  const isVideo = data.contentType === 'video';
  const handleWatch = () => {
    if (locked) { onUnlock(); return; }
    if (mod.videoUrl) window.open(mod.videoUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="rounded-2xl overflow-hidden" style={{
      background: cardBg, border: `1px solid ${border}`,
      boxShadow: isLight ? '0 2px 20px rgba(0,0,0,0.05)' : 'none',
    }}>
      <div className="h-0.5 w-full" style={{ background: data.accentGrad }} />
      <div className="px-6 pt-6 pb-4">
        <div className="flex items-start justify-between gap-4 mb-3">
          <div>
            <h3 className="text-lg font-bold leading-snug mb-1" style={{ color: textPrimary }}>{mod.title}</h3>
            <p className="text-sm italic" style={{ color: data.accent, opacity: 0.85 }}>{mod.subtitle}</p>
          </div>
          <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
            <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full"
              style={{ background: ls.bg, color: ls.text }}>{mod.level}</span>
            <span className="text-xs flex items-center gap-1" style={{ color: textFaint }}>
              <SvgClock /> {mod.pages}
            </span>
          </div>
        </div>
        <p className="text-sm leading-relaxed" style={{ color: textMuted }}>{mod.description}</p>
      </div>

      <div className="mx-6 mb-0" style={{ height: 1, background: `linear-gradient(90deg,${data.accent}25,transparent)` }} />

      <div className="px-6 pb-5 pt-4">
        <p className="text-[10px] font-bold uppercase tracking-widest mb-3" style={{ color: textFaint }}>
          {isVideo ? 'Segments' : 'Chapters'}
        </p>
        <div className="space-y-0">
          {mod.chapters?.map((ch: any, j: number) => {
            const chLocked = !ch.free && locked;
            return (
              <div key={j} className="flex items-center gap-3 py-2.5"
                style={{ borderBottom: j < mod.chapters.length - 1 ? `1px solid ${isLight ? 'rgba(226,232,240,0.6)' : 'rgba(255,255,255,0.05)'}` : 'none' }}>
                <div className="w-7 h-7 rounded-lg flex-shrink-0 flex items-center justify-center text-[11px] font-black"
                  style={{
                    background: chLocked ? (isLight ? 'rgba(226,232,240,0.7)' : 'rgba(255,255,255,0.06)') : `${data.accent}18`,
                    color: chLocked ? textFaint : data.accent,
                  }}>
                  {chLocked ? <SvgLockSm /> : (isVideo ? <SvgPlay /> : (j + 1))}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate" style={{ color: chLocked ? textFaint : textPrimary, opacity: chLocked ? 0.65 : 1 }}>
                    {ch.title}
                  </p>
                </div>
                <span className="text-xs flex-shrink-0 tabular-nums font-mono" style={{ color: textFaint }}>{ch.ref}</span>
                {ch.free && (
                  <span className="text-[9px] font-black px-2 py-0.5 rounded-full flex-shrink-0"
                    style={{ background: 'rgba(16,185,129,0.12)', color: '#34D399' }}>FREE</span>
                )}
                {chLocked && (
                  <button
                    onClick={onUnlock}
                    className="text-[9px] font-black px-2 py-0.5 rounded-full flex-shrink-0"
                    style={{ background: 'rgba(81,148,246,0.12)', color: '#5194F6', border: '1px solid rgba(81,148,246,0.20)' }}>
                    UNLOCK
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {!locked && (
        <div className="mx-6 mb-5">
          <button
            onClick={handleWatch}
            className="w-full py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all hover:opacity-80"
            style={{ background: isLight ? `${data.accent}10` : `${data.accent}15`, color: data.accent, border: `1px solid ${data.accent}25` }}>
            {isVideo ? <><SvgPlay /> Watch Now</> : <><SvgDownload /> Download PDF</>}
          </button>
        </div>
      )}

      {locked && (
        <div className="mx-6 mb-5">
          <button
            onClick={onUnlock}
            className="w-full py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all hover:opacity-80 text-white"
            style={{ background: data.accentGrad }}>
            <SvgLockSm /> Unlock to Access
          </button>
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ══════════════════════════════════════════════════════════════════════════

const EducationDetailView: React.FC = () => {
  const { categoryId }          = useParams<{ categoryId: string }>();
  const navigate                = useNavigate();
  const { theme }               = useTheme();
  const { user, isAdmin }       = useAuth();
  const { isSubscriber, loading: subLoading } = useSubscription();   // ← Real sub check
  const isLight                 = theme === 'light';

  // hasAccess = admin OR active subscriber
  const hasAccess = isAdmin || isSubscriber;

  const data = CATEGORY_DATA[categoryId || ''];

  // ── Unlock handler — login check → pricing ────────────────────────────────
  const handleUnlock = () => {
    if (!user) {
      // Login nahi — signin pe bhejo, wapas is page pe return
      navigate('/signin', { state: { from: `/education/${categoryId}` } });
    } else {
      // Login hai but subscription nahi
      navigate('/pricing');
    }
  };

  // ── Theme tokens ──────────────────────────────────────────────────────────
  const pageBg      = isLight ? '#f8fafc' : '#0d1117';
  const cardBg      = isLight ? '#ffffff' : '#161b22';
  const border      = isLight ? 'rgba(226,232,240,0.8)' : 'rgba(255,255,255,0.08)';
  const textPrimary = isLight ? '#0f172a' : '#f1f5f9';
  const textMuted   = isLight ? '#64748b' : '#94a3b8';
  const textFaint   = isLight ? '#94a3b8' : '#475569';

  // ── Sticky TOC ────────────────────────────────────────────────────────────
  const moduleRefs  = useRef<(HTMLDivElement | null)[]>([]);
  const [activeModule, setActiveModule] = useState(0);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const idx = moduleRefs.current.indexOf(entry.target as HTMLDivElement);
            if (idx !== -1) setActiveModule(idx);
          }
        });
      },
      { threshold: 0.3 }
    );
    moduleRefs.current.forEach((ref) => { if (ref) observer.observe(ref); });
    return () => observer.disconnect();
  }, [data]);

  if (!data) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen">
          <p style={{ color: textMuted }}>Category not found.</p>
        </div>
      </Layout>
    );
  }

  const isEbook = data.contentType === 'ebook';
  const ls = levelStyleMap[data.modules?.[0]?.level] ?? levelStyleMap['Beginner'];

  // Subscription loading state — skeleton dikhao
  if (subLoading) {
    return (
      <Layout>
        <div style={{ background: pageBg, minHeight: '100vh' }}>
          <div className="max-w-7xl mx-auto px-4 py-8">
            <div className="animate-pulse space-y-6">
              <div className="h-8 w-32 rounded-xl" style={{ background: isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.06)' }} />
              <div className="h-48 rounded-2xl" style={{ background: isLight ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.04)' }} />
              <div className="h-64 rounded-2xl" style={{ background: isLight ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.04)' }} />
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div style={{ background: pageBg, minHeight: '100vh' }}>
        <div className="max-w-7xl mx-auto px-4 py-8">

          {/* Back button */}
          <button
            onClick={() => navigate('/education')}
            className="flex items-center gap-1.5 text-sm mb-6 transition-colors hover:opacity-70"
            style={{ color: textMuted }}>
            <SvgBack /> Back to Education
          </button>

          {/* Hero */}
          <div className="rounded-2xl p-8 mb-8 relative overflow-hidden"
            style={{ background: cardBg, border: `1px solid ${border}` }}>
            <div className="absolute inset-0 pointer-events-none"
              style={{ background: `radial-gradient(ellipse at 0% 0%, ${data.accent}12, transparent 60%)` }} />
            <div className="relative z-10 flex flex-col md:flex-row md:items-start gap-6">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xs font-bold px-2.5 py-1 rounded-full"
                    style={{ background: `${data.accent}15`, color: data.accent, border: `1px solid ${data.accent}30` }}>
                    {data.tag}
                  </span>
                  <span className="text-xs" style={{ color: textFaint }}>
                    {data.stats.modules} {isEbook ? 'PDFs' : 'Sessions'}
                  </span>
                  {/* Subscription status badge */}
                  {isAdmin ? (
                    <span className="text-xs font-bold px-2.5 py-1 rounded-full"
                      style={{ background: 'rgba(168,85,247,0.12)', color: '#a855f7', border: '1px solid rgba(168,85,247,0.25)' }}>
                      🛡️ Admin Access
                    </span>
                  ) : isSubscriber ? (
                    <span className="text-xs font-bold px-2.5 py-1 rounded-full"
                      style={{ background: 'rgba(34,197,94,0.12)', color: '#22c55e', border: '1px solid rgba(34,197,94,0.25)' }}>
                      ✓ Premium Active
                    </span>
                  ) : (
                    <button
                      onClick={handleUnlock}
                      className="text-xs font-bold px-2.5 py-1 rounded-full transition-all hover:opacity-80"
                      style={{ background: 'rgba(81,148,246,0.12)', color: '#5194F6', border: '1px solid rgba(81,148,246,0.25)' }}>
                      🔒 Subscribe to Unlock All
                    </button>
                  )}
                </div>
                <h1 className="text-3xl font-bold mb-2" style={{ color: textPrimary }}>{data.title}</h1>
                <p className="text-sm leading-relaxed mb-4" style={{ color: textMuted }}>{data.description}</p>
                <div className="flex flex-wrap items-center gap-4 text-sm">
                  <span className="flex items-center gap-1" style={{ color: textMuted }}>
                    <SvgStar /> <b style={{ color: textPrimary }}>{data.stats.rating}</b>
                    <span style={{ color: textFaint }}>({data.stats.reviews} reviews)</span>
                  </span>
                  <span className="flex items-center gap-1" style={{ color: textMuted }}>
                    <SvgClock /> {data.stats.duration}
                  </span>
                </div>
              </div>
              <div className="flex-shrink-0 flex items-center gap-3 px-4 py-3 rounded-xl"
                style={{ background: isLight ? `${data.accent}08` : `${data.accent}12`, border: `1px solid ${data.accent}20` }}>
                <span className="text-2xl">{data.instructor.avatar}</span>
                <div>
                  <p className="text-sm font-semibold" style={{ color: textPrimary }}>{data.instructor.name}</p>
                  <p className="text-xs" style={{ color: textMuted }}>{data.instructor.role}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Body — Sidebar TOC + Module cards */}
          <div className="flex gap-6 items-start">

            {/* Sticky TOC sidebar */}
            <aside className="hidden lg:flex flex-col gap-1 w-56 flex-shrink-0 sticky top-24">
              <p className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: textFaint }}>
                {isEbook ? 'Books' : 'Sessions'}
              </p>
              {data.modules.map((mod: any, i: number) => {
                const modLocked = data.isPaid && mod.isPaid && !hasAccess;
                return (
                  <button key={i}
                    onClick={() => {
                      if (modLocked) { handleUnlock(); return; }
                      moduleRefs.current[i]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }}
                    className="text-left text-xs px-3 py-2 rounded-lg transition-all truncate flex items-center gap-1.5"
                    style={{
                      background: activeModule === i ? `${data.accent}15` : 'transparent',
                      color: activeModule === i ? data.accent : modLocked ? textFaint : textMuted,
                      border: activeModule === i ? `1px solid ${data.accent}30` : '1px solid transparent',
                      opacity: modLocked ? 0.6 : 1,
                    }}>
                    {modLocked && <SvgLockSm />}
                    <span className="truncate">{mod.title}</span>
                  </button>
                );
              })}

              {/* Sidebar upgrade CTA */}
              {!hasAccess && (
                <button
                  onClick={handleUnlock}
                  className="mt-3 w-full py-2 rounded-xl text-xs font-bold text-white transition-all hover:opacity-90"
                  style={{ background: data.accentGrad }}>
                  🔓 Unlock All
                </button>
              )}
            </aside>

            {/* Module cards */}
            <div className="flex-1 flex flex-col gap-6">
              {data.modules.map((mod: any, i: number) => {
                // ── Access check per module ────────────────────────────────
                // mod.isPaid === false → always accessible (free module)
                // mod.isPaid === true  → needs hasAccess
                const modLocked = data.isPaid && mod.isPaid && !hasAccess;

                return (
                  <div key={i} ref={(el) => (moduleRefs.current[i] = el)}>
                    {modLocked ? (
                      // ── LOCKED: Sirf placeholder dikhao — koi real data DOM mein nahi ──
                      <LockedModuleCard
                        idx={i}
                        data={data}
                        isLight={isLight}
                        cardBg={cardBg}
                        border={border}
                        textPrimary={textPrimary}
                        textMuted={textMuted}
                        textFaint={textFaint}
                        onUnlock={handleUnlock}
                      />
                    ) : isEbook ? (
                      // ── UNLOCKED EBOOK ────────────────────────────────────────────────
                      <PdfModuleCard
                        mod={mod} idx={i} data={data}
                        isLight={isLight} cardBg={cardBg} border={border}
                        ls={levelStyleMap[mod.level] ?? levelStyleMap['Beginner']}
                        textPrimary={textPrimary} textMuted={textMuted} textFaint={textFaint}
                        locked={false}
                        onUnlock={handleUnlock}
                      />
                    ) : (
                      // ── UNLOCKED VIDEO / CERT ─────────────────────────────────────────
                      <ModuleCard
                        mod={mod} idx={i} data={data}
                        isLight={isLight} cardBg={cardBg} border={border}
                        ls={levelStyleMap[mod.level] ?? levelStyleMap['Beginner']}
                        textPrimary={textPrimary} textMuted={textMuted} textFaint={textFaint}
                        locked={false}
                        isSubscriber={isSubscriber}
                        onUnlock={handleUnlock}
                        navigate={navigate}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default EducationDetailView;