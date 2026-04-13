import React, { useState } from 'react';
import Layout from '@/components/Layout';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTheme } from '@/controllers/Themecontext';
import { useAuth } from '@/controllers/AuthContext';
import { useSubscription } from '@/hooks/useSubscription';   // ← NEW
import { Lock, ChevronRight, Crown } from 'lucide-react';

// ─────────────────────────────────────────────────────────────────────────────
// SVG ICONS (unchanged)
// ─────────────────────────────────────────────────────────────────────────────

const SvgBook = ({ className = 'w-5 h-5' }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className} stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
  </svg>
);
const SvgPlay = ({ className = 'w-5 h-5' }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className} stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <polygon points="10 8 16 12 10 16 10 8" />
  </svg>
);
const SvgAward = ({ className = 'w-5 h-5' }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className} stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="8" r="7" />
    <polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88" />
  </svg>
);
const SvgTrending = ({ className = 'w-5 h-5' }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className} stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
    <polyline points="17 6 23 6 23 12" />
  </svg>
);
const SvgBrain = ({ className = 'w-5 h-5' }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className} stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96-.46 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 4.44-1.14z" />
    <path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96-.46 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-4.44-1.14z" />
  </svg>
);
const SvgZap = ({ className = 'w-4 h-4' }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
  </svg>
);
const SvgShield = ({ className = 'w-3.5 h-3.5' }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    <polyline points="9 12 11 14 15 10" />
  </svg>
);
const SvgUsers = ({ className = 'w-4 h-4' }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className} stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);
const SvgBarChart = ({ className = 'w-4 h-4' }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className} stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="20" x2="18" y2="10" />
    <line x1="12" y1="20" x2="12" y2="4" />
    <line x1="6" y1="20" x2="6" y2="14" />
  </svg>
);
const SvgCheckCircle = ({ className = 'w-4 h-4' }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
    <polyline points="22 4 12 14.01 9 11.01" />
  </svg>
);
const SvgLock = ({ className = 'w-3.5 h-3.5' }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
);
const SvgStar = ({ className = 'w-3 h-3' }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  </svg>
);

// ─────────────────────────────────────────────────────────────────────────────
// COURSE DATA
// FREE_PREVIEW_COUNT = kitne items free mein dikhenge (baaki sab locked)
// ─────────────────────────────────────────────────────────────────────────────

const FREE_PREVIEW_COUNT = 2; // first 2 items free dikhenge har card mein

const financialItems = [
  {
    id: 'financial-ebooks',
    SvgIcon: SvgBook,
    title: 'E-books',
    tag: 'Financial',
    description: 'Official NISM workbooks and financial guides — the same study material used by finance professionals across India.',
    isPaid: true,
    freeCount: 6,
    totalCount: 40,
    items: [
      { title: 'NISM V-A — MFD Workbook (Nov 2025)',       meta: 'Free',    level: 'Beginner',  isFreePreview: true  },
      { title: 'NISM Series V-A — Hindi Edition',          meta: 'Free',    level: 'Beginner',  isFreePreview: true  },
      { title: 'NISM Series VIII — Equity Derivatives',    meta: 'Premium', level: 'Advanced',  isFreePreview: false },
    ],
    accent: 'from-blue-500 to-indigo-600', accentRaw: '#3B82F6', iconColor: '#60A5FA',
    detailId: 'financial-ebooks',
  },
  {
    id: 'financial-tutorials',
    SvgIcon: SvgPlay,
    title: 'Tutorials',
    tag: 'Financial',
    description: 'Step-by-step video walkthroughs on reading charts, fundamental analysis, options strategies, and more.',
    isPaid: true,        // ← tutorials bhi ab gated hain (sirf 2 free)
    freeCount: 2,
    totalCount: 5,
    items: [
      { title: 'How to Read a Balance Sheet',    meta: '18 min', level: 'Beginner',     isFreePreview: true  },
      { title: 'Technical Analysis Masterclass', meta: '45 min', level: 'Intermediate', isFreePreview: true  },
      { title: 'Options Trading Explained',      meta: '32 min', level: 'Advanced',     isFreePreview: false },
    ],
    accent: 'from-emerald-500 to-teal-600', accentRaw: '#10B981', iconColor: '#34D399',
    detailId: 'financial-tutorials',
  },
  {
    id: 'financial-certifications',
    SvgIcon: SvgAward,
    title: 'Certifications',
    tag: 'Financial',
    description: 'Structured combo programs combining multiple NISM exams — study week-by-week, earn verifiable InvestBeans certificates.',
    isPaid: true,
    freeCount: 0,
    totalCount: 3,
    items: [
      { title: 'Certificate I — Mutual Fund Expert',         meta: '4 weeks', level: 'Beginner',     isFreePreview: true  },
      { title: 'Certificate II — Equity & Derivatives Pro',  meta: '6 weeks', level: 'Advanced',     isFreePreview: false },
      { title: 'Certificate III — Compliance & AML',         meta: '5 weeks', level: 'Intermediate', isFreePreview: false },
    ],
    accent: 'from-amber-500 to-orange-600', accentRaw: '#D4A843', iconColor: '#F59E0B',
    detailId: 'financial-certifications',
  },
];

const nonFinancialItems = [
  {
    id: 'nonfinancial-ebooks',
    SvgIcon: SvgBook,
    title: 'E-books',
    tag: 'Non-Financial',
    description: 'Books on productivity, behavioral economics, decision-making, and the mindset needed to become a better investor.',
    isPaid: true,
    freeCount: 0,
    totalCount: 10,
    items: [
      { title: 'The Psychology of Money',      meta: '95 pages',  level: 'All Levels',  isFreePreview: true  },
      { title: 'Thinking in Bets',             meta: '140 pages', level: 'Intermediate', isFreePreview: true  },
      { title: 'Habits of Successful Traders', meta: '110 pages', level: 'Beginner',    isFreePreview: false },
    ],
    accent: 'from-purple-500 to-violet-600', accentRaw: '#8B5CF6', iconColor: '#A78BFA',
    detailId: 'nonfinancial-ebooks',
  },
  {
    id: 'nonfinancial-tutorials',
    SvgIcon: SvgPlay,
    title: 'Tutorials',
    tag: 'Non-Financial',
    description: 'Video tutorials on mindset, time management, productivity tools, and life skills that complement your investing journey.',
    isPaid: true,
    freeCount: 2,
    totalCount: 5,
    items: [
      { title: 'Building an Investor Mindset',  meta: '22 min', level: 'Beginner',     isFreePreview: true  },
      { title: 'Managing Risk Psychologically', meta: '30 min', level: 'Intermediate', isFreePreview: true  },
      { title: 'Productivity for Traders',      meta: '20 min', level: 'All Levels',   isFreePreview: false },
    ],
    accent: 'from-rose-500 to-pink-600', accentRaw: '#F43F5E', iconColor: '#FB7185',
    detailId: 'nonfinancial-tutorials',
  },
];

const levelStyle: Record<string, { bg: string; text: string }> = {
  Beginner:     { bg: 'rgba(16,185,129,0.12)',  text: '#34D399' },
  Intermediate: { bg: 'rgba(245,158,11,0.12)',  text: '#FBBF24' },
  Advanced:     { bg: 'rgba(239,68,68,0.12)',   text: '#F87171' },
  'All Levels': { bg: 'rgba(148,163,184,0.12)', text: '#94A3B8' },
};

// ─────────────────────────────────────────────────────────────────────────────
// SIDEBAR NAV CONFIG (unchanged)
// ─────────────────────────────────────────────────────────────────────────────

const NAV_ITEMS = [
  { key: 'financial',     label: 'Financial',     SvgIcon: SvgTrending, color: '#3B82F6', isParent: true  },
  { key: 'fin-ebooks',    label: 'E-books',        SvgIcon: SvgBook,     color: '#60A5FA', isParent: false, parentKey: 'financial' },
  { key: 'fin-tutorials', label: 'Tutorials',      SvgIcon: SvgPlay,     color: '#34D399', isParent: false, parentKey: 'financial' },
  { key: 'fin-certs',     label: 'Certifications', SvgIcon: SvgAward,    color: '#F59E0B', isParent: false, parentKey: 'financial' },
  { key: 'nonfinancial',  label: 'Non-Financial',  SvgIcon: SvgBrain,    color: '#8B5CF6', isParent: true  },
  { key: 'nonfin-ebooks', label: 'E-books',        SvgIcon: SvgBook,     color: '#A78BFA', isParent: false, parentKey: 'nonfinancial' },
  { key: 'nonfin-tuts',   label: 'Tutorials',      SvgIcon: SvgPlay,     color: '#FB7185', isParent: false, parentKey: 'nonfinancial' },
];

const NAV_TO_CARD: Record<string, string> = {
  'fin-ebooks':    'financial-ebooks',
  'fin-tutorials': 'financial-tutorials',
  'fin-certs':     'financial-certifications',
  'nonfin-ebooks': 'nonfinancial-ebooks',
  'nonfin-tuts':   'nonfinancial-tutorials',
};

// ─────────────────────────────────────────────────────────────────────────────
// INLINE LOCKED ROW — locked items ke liye (DOM mein text nahi hoga)
// ─────────────────────────────────────────────────────────────────────────────

function LockedItemRow({
  accentRaw, isLight, onUnlock,
}: { accentRaw: string; isLight: boolean; onUnlock: () => void }) {
  return (
    <div
      className="flex items-center justify-between py-2.5"
      style={{ borderBottom: isLight ? '1px solid rgba(226,232,240,0.7)' : '1px solid rgba(255,255,255,0.06)' }}
    >
      <div className="flex items-center gap-2.5">
        <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: 'rgba(148,163,184,0.4)' }} />
        {/* Blurred placeholder — actual title DOM mein nahi hai */}
        <div
          className="h-3 rounded"
          style={{
            width: `${90 + Math.random() * 60}px`,
            background: isLight ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.06)',
          }}
        />
      </div>
      <button
        onClick={onUnlock}
        className="flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full flex-shrink-0 ml-2 transition-all hover:opacity-80"
        style={{
          background: 'rgba(81,148,246,0.12)',
          color: '#5194F6',
          border: '1px solid rgba(81,148,246,0.25)',
        }}
      >
        <Lock className="w-2.5 h-2.5" /> Unlock
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ITEM ROW — visible items
// ─────────────────────────────────────────────────────────────────────────────

function ItemRow({ title, meta, level, accentRaw, isLight }: {
  title: string; meta: string; level: string; accentRaw: string; isLight: boolean;
}) {
  const ls = levelStyle[level] ?? levelStyle['All Levels'];
  const isFree = meta === 'Free';
  return (
    <div className="flex items-center justify-between py-2.5 group"
      style={{ borderBottom: isLight ? '1px solid rgba(226,232,240,0.7)' : '1px solid rgba(255,255,255,0.06)' }}>
      <div className="flex items-center gap-2.5 min-w-0">
        <div className="w-1.5 h-1.5 rounded-full flex-shrink-0 transition-all duration-300 group-hover:scale-150"
          style={{ background: accentRaw }} />
        <span className="text-sm font-medium truncate"
          style={{ color: isLight ? '#374151' : 'rgba(255,255,255,0.80)' }}>{title}</span>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0 ml-2">
        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold"
          style={isFree
            ? { background: 'rgba(16,185,129,0.12)', color: '#34D399' }
            : { color: isLight ? '#9ca3af' : 'rgba(148,163,184,0.7)', fontSize: 11 }}>
          {meta}
        </span>
        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold"
          style={{ background: ls.bg, color: ls.text }}>{level}</span>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// LOCKED COUNT BADGE — "X more locked" indicator
// ─────────────────────────────────────────────────────────────────────────────

function LockedCountBadge({
  count, isLight, onUnlock,
}: { count: number; isLight: boolean; onUnlock: () => void }) {
  if (count <= 0) return null;
  return (
    <button
      onClick={onUnlock}
      className="w-full flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-semibold mt-2 transition-all hover:opacity-80"
      style={{
        background: isLight ? 'rgba(81,148,246,0.06)' : 'rgba(81,148,246,0.08)',
        border: '1px dashed rgba(81,148,246,0.30)',
        color: '#5194F6',
      }}
    >
      <Lock className="w-3 h-3" />
      +{count} more locked — Subscribe to unlock
    </button>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// LEARN CARD
// ─────────────────────────────────────────────────────────────────────────────

function LearnCard({
  id, SvgIcon, title, tag, description, isPaid, freeCount, totalCount,
  items, accent, accentRaw, iconColor, detailId,
  isLight, isAdmin, isSubscriber, hasAccess,
  onStartLearning, onUnlock,
}: any) {
  const isFinancial = tag === 'Financial';

  // Items ko split karo — free preview vs locked
  const freeItems   = items.filter((it: any) => it.isFreePreview);
  const lockedItems = items.filter((it: any) => !it.isFreePreview);
  const lockedCount = isPaid && !hasAccess ? lockedItems.length : 0;

  return (
    <div
      id={id}
      className="rounded-2xl overflow-hidden flex flex-col transition-all duration-300 hover:-translate-y-1 group"
      style={{
        background: isLight ? 'rgba(255,255,255,0.98)' : 'rgba(255,255,255,0.04)',
        border: isLight ? '1px solid rgba(226,232,240,0.9)' : '1px solid rgba(255,255,255,0.08)',
        boxShadow: isLight ? '0 2px 20px rgba(0,0,0,0.05)' : 'none',
        scrollMarginTop: '140px',
      }}
      onMouseEnter={e => (e.currentTarget.style.borderColor = `${accentRaw}55`)}
      onMouseLeave={e => (e.currentTarget.style.borderColor = isLight ? 'rgba(226,232,240,0.9)' : 'rgba(255,255,255,0.08)')}>

      {/* Top accent gradient line */}
      <div className={`h-1 w-full bg-gradient-to-r ${accent}`} />

      <div className="p-5 flex flex-col flex-1">
        {/* Card header */}
        <div className="flex items-start justify-between mb-4">
          <div className="w-11 h-11 rounded-xl flex items-center justify-center transition-transform duration-300 group-hover:scale-105"
            style={{ background: `${accentRaw}18`, border: `1px solid ${accentRaw}30`, color: iconColor }}>
            <SvgIcon />
          </div>
          <div className="flex flex-col items-end gap-1.5">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold"
              style={isFinancial
                ? { background: 'rgba(59,130,246,0.12)', color: '#60A5FA' }
                : { background: 'rgba(139,92,246,0.12)', color: '#A78BFA' }}>
              {tag}
            </span>
            {isAdmin && isPaid ? (
              <span className="flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full"
                style={{ background: 'rgba(168,85,247,0.12)', color: '#a855f7', border: '1px solid rgba(168,85,247,0.25)' }}>
                <SvgShield /> Admin
              </span>
            ) : isSubscriber && isPaid ? (
              <span className="flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full"
                style={{ background: 'rgba(34,197,94,0.12)', color: '#22c55e', border: '1px solid rgba(34,197,94,0.25)' }}>
                ✓ Unlocked
              </span>
            ) : isPaid ? (
              <span className="flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full"
                style={{ background: 'rgba(81,148,246,0.12)', color: '#5194F6', border: '1px solid rgba(81,148,246,0.25)' }}>
                <SvgLock /> Premium
              </span>
            ) : (
              <span className="flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full"
                style={{ background: 'rgba(16,185,129,0.12)', color: '#34D399', border: '1px solid rgba(16,185,129,0.25)' }}>
                <SvgStar /> Free
              </span>
            )}
          </div>
        </div>

        {totalCount > 0 && (
          <div className="flex items-center gap-2 mb-3">
            <span className="text-[11px] px-2 py-0.5 rounded-full"
              style={{ background: `${accentRaw}10`, color: accentRaw, border: `1px solid ${accentRaw}20` }}>
              {totalCount} {title === 'Certifications' ? 'Programs' : title === 'Tutorials' ? 'Videos' : 'PDFs'}
            </span>
            {freeCount > 0 && (
              <span className="text-[11px] px-2 py-0.5 rounded-full"
                style={{ background: 'rgba(16,185,129,0.10)', color: '#34D399', border: '1px solid rgba(16,185,129,0.20)' }}>
                {freeCount} Free
              </span>
            )}
          </div>
        )}

        <h3 className="text-lg font-bold mb-1.5 leading-snug"
          style={{ color: isLight ? '#0f172a' : '#fff' }}>{title}</h3>
        <p className="text-sm leading-relaxed mb-5"
          style={{ color: isLight ? '#6b7280' : 'rgba(148,163,184,0.9)' }}>{description}</p>

        {/* Items list — free preview visible, locked items hidden */}
        <div className="flex-1 mb-3">
          {/* Free preview items — hamesha visible */}
          {freeItems.map((item: any) => (
            <ItemRow
              key={item.title}
              title={item.title}
              meta={item.meta}
              level={item.level}
              accentRaw={accentRaw}
              isLight={isLight}
            />
          ))}

          {/* Locked items — sirf tab dikhao jab access nahi hai */}
          {isPaid && !hasAccess && lockedItems.map((_: any, idx: number) => (
            <LockedItemRow
              key={`locked-${idx}`}
              accentRaw={accentRaw}
              isLight={isLight}
              onUnlock={() => onUnlock(detailId)}
            />
          ))}

          {/* Jab access hai to locked items bhi normal dikhao */}
          {hasAccess && lockedItems.map((item: any) => (
            <ItemRow
              key={item.title}
              title={item.title}
              meta={item.meta}
              level={item.level}
              accentRaw={accentRaw}
              isLight={isLight}
            />
          ))}
        </div>

        {/* CTA button */}
        {hasAccess ? (
          <button
            onClick={() => onStartLearning(detailId)}
            className={`w-full py-2.5 rounded-xl text-sm font-bold text-white bg-gradient-to-r ${accent} hover:opacity-90 transition-all flex items-center justify-center gap-2 group/btn`}>
            {isAdmin ? '🛡️ Open as Admin' : isPaid ? '📖 Open Library' : '▶ Start Learning'}
            <ChevronRight className="w-4 h-4 group-hover/btn:translate-x-0.5 transition-transform" />
          </button>
        ) : (
          <button
            onClick={() => onUnlock(detailId)}
            className={`w-full py-2.5 rounded-xl text-sm font-bold text-white bg-gradient-to-r ${accent} hover:opacity-90 transition-all flex items-center justify-center gap-2 group/btn`}>
            <Crown className="w-3.5 h-3.5" /> Unlock Full Access
            <ChevronRight className="w-4 h-4 group-hover/btn:translate-x-0.5 transition-transform" />
          </button>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// HERO RIGHT PANEL (unchanged from original)
// ─────────────────────────────────────────────────────────────────────────────

function HeroRightPanel({ isLight }: { isLight: boolean }) {
  const cardBase = {
    background: isLight ? 'rgba(255,255,255,0.85)' : 'rgba(255,255,255,0.05)',
    backdropFilter: 'blur(20px)',
    border: isLight ? '1px solid rgba(226,232,240,0.9)' : '1px solid rgba(255,255,255,0.10)',
    borderRadius: 16,
  };

  const stats = [
    { icon: <SvgBook className="w-5 h-5" />,    label: 'NISM PDFs',       value: '40+', color: '#3B82F6', glow: 'rgba(59,130,246,0.15)'  },
    { icon: <SvgPlay className="w-5 h-5" />,    label: 'Video Tutorials', value: '10',  color: '#10B981', glow: 'rgba(16,185,129,0.15)'  },
    { icon: <SvgAward className="w-5 h-5" />,   label: 'Certifications',  value: '3',   color: '#D4A843', glow: 'rgba(212,168,67,0.15)'  },
    { icon: <SvgUsers className="w-5 h-5" />,   label: 'Active Learners', value: '12k+',color: '#8B5CF6', glow: 'rgba(139,92,246,0.15)'  },
  ];

  return (
    <div className="hidden xl:flex flex-col items-center justify-center relative w-[420px] flex-shrink-0">
      <div className="absolute top-4 right-8 w-32 h-32 rounded-full blur-[60px] pointer-events-none"
        style={{ background: 'rgba(81,148,246,0.18)' }} />
      <div className="absolute bottom-4 left-4 w-24 h-24 rounded-full blur-[50px] pointer-events-none"
        style={{ background: 'rgba(212,168,67,0.14)' }} />

      <div className="relative w-full rounded-2xl overflow-hidden p-5" style={cardBase}>
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse at 80% 20%, rgba(81,148,246,0.08), transparent 60%)' }} />

        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center"
            style={{ background: 'rgba(81,148,246,0.15)', color: '#5194F6' }}>
            <SvgBarChart className="w-4 h-4" />
          </div>
          <div>
            <p className="text-xs font-bold" style={{ color: isLight ? '#0f172a' : '#fff' }}>Learning Dashboard</p>
            <p className="text-[10px]" style={{ color: isLight ? '#9ca3af' : '#475569' }}>InvestBeans Hub</p>
          </div>
          <div className="ml-auto flex items-center gap-1 px-2 py-1 rounded-full"
            style={{ background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.2)' }}>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[9px] font-bold text-emerald-400">LIVE</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-4">
          {stats.map((s, i) => (
            <div key={i} className="rounded-xl p-3 flex items-start gap-2.5 transition-all hover:scale-[1.02]"
              style={{ background: s.glow, border: `1px solid ${s.color}22` }}>
              <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ background: `${s.color}18`, color: s.color }}>
                {s.icon}
              </div>
              <div>
                <p className="text-base font-black leading-none" style={{ color: s.color }}>{s.value}</p>
                <p className="text-[10px] mt-0.5 leading-tight" style={{ color: isLight ? '#6b7280' : '#94a3b8' }}>{s.label}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="rounded-xl p-3"
          style={{ background: isLight ? 'rgba(59,130,246,0.04)' : 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.12)' }}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-semibold" style={{ color: isLight ? '#0f172a' : '#fff' }}>
              📈 Most Popular — NISM V-A MFD
            </span>
            <span className="text-[10px] font-bold text-emerald-400">Free</span>
          </div>
          <div className="w-full h-1.5 rounded-full overflow-hidden"
            style={{ background: isLight ? 'rgba(59,130,246,0.15)' : 'rgba(255,255,255,0.08)' }}>
            <div className="h-full rounded-full" style={{ width: '78%', background: 'linear-gradient(90deg,#3B82F6,#60A5FA)' }} />
          </div>
          <p className="text-[9px] mt-1.5" style={{ color: isLight ? '#9ca3af' : '#475569' }}>78% of learners start here</p>
        </div>
      </div>

      <div className="flex items-center gap-3 mt-4 w-full px-2">
        <div className="flex-1 rounded-xl px-4 py-2.5 flex items-center gap-2.5"
          style={{ background: isLight ? 'rgba(212,168,67,0.08)' : 'rgba(212,168,67,0.10)', border: '1px solid rgba(212,168,67,0.20)' }}>
          <SvgAward className="w-4 h-4" style={{ color: '#D4A843' } as any} />
          <div>
            <p className="text-[10px] font-bold" style={{ color: '#D4A843' }}>Certificate Programs</p>
            <p className="text-[9px]" style={{ color: isLight ? '#9ca3af' : '#64748b' }}>Earn in 4–6 weeks</p>
          </div>
        </div>
        <div className="flex-1 rounded-xl px-4 py-2.5 flex items-center gap-2.5"
          style={{ background: isLight ? 'rgba(16,185,129,0.08)' : 'rgba(16,185,129,0.10)', border: '1px solid rgba(16,185,129,0.20)' }}>
          <SvgCheckCircle className="w-4 h-4" style={{ color: '#10B981' } as any} />
          <div>
            <p className="text-[10px] font-bold" style={{ color: '#10B981' }}>Free to Start</p>
            <p className="text-[9px]" style={{ color: isLight ? '#9ca3af' : '#64748b' }}>No card required</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN — EducationView
// ─────────────────────────────────────────────────────────────────────────────

const EducationView = () => {
  const { theme }          = useTheme();
  const navigate           = useNavigate();
  const { user, isAdmin }  = useAuth();
  const { isSubscriber }   = useSubscription();   // ← Real subscription check
  const isLight            = theme === 'light';

  // hasAccess = admin OR active subscriber
  const hasAccess = isAdmin || isSubscriber;

  const [searchParams]   = useSearchParams();
  const sectionParam     = searchParams.get('section');

  const [activeTab, setActiveTab] = useState<'financial' | 'nonfinancial'>(
    sectionParam === 'nonfinancial' ? 'nonfinancial' : 'financial'
  );
  const [activeNavKey, setActiveNavKey] = useState(
    sectionParam === 'nonfinancial' ? 'nonfinancial' : 'financial'
  );

  const currentItems = activeTab === 'financial' ? financialItems : nonFinancialItems;

  const handleNavClick = (key: string, isParent: boolean, parentKey?: string) => {
    setActiveNavKey(key);
    if (isParent) {
      setActiveTab(key as 'financial' | 'nonfinancial');
    } else if (parentKey) {
      setActiveTab(parentKey as 'financial' | 'nonfinancial');
      const cardId = NAV_TO_CARD[key];
      if (cardId) {
        setTimeout(() => {
          const el = document.getElementById(cardId);
          if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 80);
      }
    }
  };

  const handleStartLearning = (detailId: string) => navigate(`/education/${detailId}`);

  // ── Lock handler — login check → pricing check ────────────────────────────
  const handleUnlock = (_detailId: string) => {
    if (!user) {
      // Login nahi hai → signin pe bhejo (wapas education pe return karo)
      navigate('/signin', { state: { from: '/education' } });
    } else {
      // Login hai but subscription nahi → pricing pe bhejo
      navigate('/pricing');
    }
  };

  const pageBg        = isLight
    ? 'linear-gradient(160deg,#f5f4f0 0%,#f8fbff 45%,#f5f4f0 100%)'
    : 'linear-gradient(160deg,#0c1a2e 0%,#0e2038 45%,#0b1825 100%)';
  const sidebarBg     = isLight ? 'rgba(255,255,255,0.85)' : 'rgba(10,22,40,0.85)';
  const sidebarBorder = isLight ? 'rgba(226,232,240,0.9)' : 'rgba(255,255,255,0.07)';

  return (
    <Layout>
      <div className="min-h-screen" style={{ background: pageBg }}>

        {/* ── HERO ─────────────────────────────────────────────────────────────── */}
        <section
          className="relative overflow-hidden pt-12 pb-10 md:pt-16 md:pb-14"
          style={{
            background: isLight
              ? 'linear-gradient(135deg,#f8fbff 0%,#f0f6ff 50%,#eef4fd 100%)'
              : 'linear-gradient(135deg,#0a1628 0%,#0e2038 50%,#0c1a2e 100%)',
            borderBottom: isLight ? '1px solid rgba(226,232,240,0.8)' : '1px solid rgba(255,255,255,0.06)',
          }}>

          <div className="absolute top-0 left-1/4 w-96 h-96 rounded-full blur-[120px] pointer-events-none opacity-50"
            style={{ background: 'radial-gradient(circle,rgba(81,148,246,0.14) 0%,transparent 70%)' }} />
          <div className="absolute bottom-0 right-20 w-64 h-64 rounded-full blur-[90px] pointer-events-none opacity-40"
            style={{ background: 'radial-gradient(circle,rgba(139,92,246,0.12) 0%,transparent 70%)' }} />
          <div className="absolute top-10 right-1/3 w-40 h-40 rounded-full blur-[70px] pointer-events-none opacity-30"
            style={{ background: 'radial-gradient(circle,rgba(212,168,67,0.12) 0%,transparent 70%)' }} />

          <div className="container mx-auto px-6 relative z-10">
            <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-8 xl:gap-16">

              <div className="flex flex-col max-w-xl">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-5 self-start"
                  style={{ background: 'rgba(81,148,246,0.10)', border: '1px solid rgba(81,148,246,0.20)' }}>
                  <SvgZap />
                  <span className="text-xs font-semibold text-[#5194F6]">InvestBeans Learning Hub</span>
                </div>

                <h1 className="text-4xl md:text-5xl font-extrabold leading-tight mb-4"
                  style={{ color: isLight ? '#0f172a' : '#fff' }}>
                  Learn to Invest{' '}
                  <span style={{
                    background: 'linear-gradient(135deg,#5194F6,#7ab8fa)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                  }}>
                    Smarter
                  </span>
                </h1>

                <p className="text-base md:text-lg leading-relaxed mb-6 max-w-lg"
                  style={{ color: isLight ? '#6b7280' : 'rgba(148,163,184,0.9)' }}>
                  Official NISM workbooks, video tutorials, and certificate programs — all in one place for serious investors.
                </p>

                <div className="flex flex-wrap gap-2.5 mb-6">
                  {[
                    { icon: '📄', text: '40+ Free & Premium PDFs' },
                    { icon: '🎥', text: '10 Video Tutorials' },
                    { icon: '🏆', text: '3 Certificate Programs' },
                  ].map((h, i) => (
                    <div key={i} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium"
                      style={{
                        background: isLight ? 'rgba(13,37,64,0.05)' : 'rgba(255,255,255,0.06)',
                        border: isLight ? '1px solid rgba(13,37,64,0.08)' : '1px solid rgba(255,255,255,0.08)',
                        color: isLight ? '#374151' : '#94a3b8',
                      }}>
                      <span>{h.icon}</span> {h.text}
                    </div>
                  ))}
                </div>

                <div className="flex gap-2">
                  {[
                    { label: '📈 Financial',     tab: 'financial'    as const },
                    { label: '🧠 Non-Financial', tab: 'nonfinancial' as const },
                  ].map(({ label, tab }) => (
                    <button
                      key={tab}
                      onClick={() => { setActiveTab(tab); setActiveNavKey(tab); }}
                      className="px-5 py-2 rounded-full text-sm font-semibold transition-all hover:scale-105"
                      style={activeTab === tab
                        ? {
                            background: tab === 'financial' ? 'rgba(59,130,246,0.15)' : 'rgba(139,92,246,0.15)',
                            color: tab === 'financial' ? '#60A5FA' : '#A78BFA',
                            border: `1px solid ${tab === 'financial' ? 'rgba(59,130,246,0.30)' : 'rgba(139,92,246,0.30)'}`,
                          }
                        : {
                            background: isLight ? 'rgba(13,37,64,0.05)' : 'rgba(255,255,255,0.05)',
                            color: isLight ? 'rgba(13,37,64,0.55)' : 'rgba(148,163,184,0.8)',
                            border: isLight ? '1px solid rgba(13,37,64,0.08)' : '1px solid rgba(255,255,255,0.07)',
                          }}>
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <HeroRightPanel isLight={isLight} />
            </div>
          </div>
        </section>

        {/* ── MOBILE TAB BAR ────────────────────────────────────────────────── */}
        <div className="lg:hidden sticky top-[68px] z-30 backdrop-blur-md overflow-x-auto scrollbar-hide"
          style={{
            background: isLight ? 'rgba(245,244,240,0.96)' : 'rgba(10,22,40,0.94)',
            borderBottom: isLight ? '1px solid rgba(226,232,240,0.8)' : '1px solid rgba(255,255,255,0.07)',
          }}>
          <div className="flex gap-2 px-4 py-3 w-max">
            {NAV_ITEMS.map(nav => {
              const isActive = activeNavKey === nav.key;
              return (
                <button
                  key={nav.key}
                  onClick={() => handleNavClick(nav.key, nav.isParent, (nav as any).parentKey)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs whitespace-nowrap transition-all ${nav.isParent ? 'font-bold' : 'font-semibold'}`}
                  style={isActive
                    ? { background: `${nav.color}20`, color: nav.color, border: `1px solid ${nav.color}40` }
                    : {
                        background: isLight ? 'rgba(13,37,64,0.05)' : 'rgba(255,255,255,0.05)',
                        color: isLight ? 'rgba(13,37,64,0.60)' : 'rgba(148,163,184,0.8)',
                        border: isLight ? '1px solid rgba(13,37,64,0.08)' : '1px solid rgba(255,255,255,0.07)',
                      }}>
                  <span style={{ color: isActive ? nav.color : undefined }}><nav.SvgIcon /></span>
                  {nav.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* ── BODY ──────────────────────────────────────────────────────────── */}
        <div className="container mx-auto px-4 lg:px-6 py-8">
          <div className="flex gap-7 items-start">

            {/* ── SIDEBAR ───────────────────────────────────────────────────── */}
            <aside className="hidden lg:flex flex-col gap-1 w-52 flex-shrink-0 sticky top-24 self-start"
              style={{
                background: sidebarBg,
                border: `1px solid ${sidebarBorder}`,
                borderRadius: 18,
                padding: '16px 12px',
                backdropFilter: 'blur(16px)',
                minHeight:500,
              }}>
              <p className="text-[10px] font-bold uppercase tracking-widest mb-2 px-2"
                style={{ color: isLight ? 'rgba(13,37,64,0.35)' : 'rgba(148,163,184,0.4)' }}>
                Categories
              </p>

              {NAV_ITEMS.map(nav => {
                const isActive = activeNavKey === nav.key;
                return (
                  <button
                    key={nav.key}
                    onClick={() => handleNavClick(nav.key, nav.isParent, (nav as any).parentKey)}
                    className={`flex items-center gap-2.5 w-full text-left transition-all rounded-xl ${nav.isParent ? 'mt-2 first:mt-0' : 'pl-4'}`}
                    style={{
                      padding: nav.isParent ? '9px 10px' : '7px 10px',
                      background: isActive ? `${nav.color}18` : 'transparent',
                      border: isActive ? `1px solid ${nav.color}30` : '1px solid transparent',
                    }}>
                    <span style={{ color: isActive ? nav.color : isLight ? 'rgba(13,37,64,0.40)' : 'rgba(148,163,184,0.5)' }}>
                      <nav.SvgIcon />
                    </span>
                    <span className={`text-sm transition-all ${nav.isParent ? 'font-bold' : 'font-medium'}`}
                      style={{
                        color: isActive ? nav.color : nav.isParent ? (isLight ? '#0f172a' : '#e2e8f0') : (isLight ? 'rgba(13,37,64,0.60)' : 'rgba(148,163,184,0.8)'),
                        fontSize: nav.isParent ? 13 : 12,
                      }}>
                      {nav.label}
                    </span>
                    {isActive && <div className="ml-auto w-1.5 h-1.5 rounded-full" style={{ background: nav.color }} />}
                  </button>
                );
              })}

              {/* Spacer — pushes CTA to bottom */}
              <div className="flex-1" />

              {/* Sidebar CTA */}
              <div className="mt-4 pt-4" style={{ borderTop: isLight ? '1px solid rgba(226,232,240,0.8)' : '1px solid rgba(255,255,255,0.07)' }}>
                {isAdmin ? (
                  <div className="w-full py-2.5 rounded-xl text-xs font-bold text-center"
                    style={{ background: 'rgba(168,85,247,0.10)', color: '#a855f7', border: '1px solid rgba(168,85,247,0.25)' }}>
                    🛡️ Admin Access
                  </div>
                ) : isSubscriber ? (
                  <div className="w-full py-2.5 rounded-xl text-xs font-bold text-center"
                    style={{ background: 'rgba(34,197,94,0.10)', color: '#22c55e', border: '1px solid rgba(34,197,94,0.25)' }}>
                    ✓ Premium Active
                  </div>
                ) : (
                  <button
                    onClick={() => handleUnlock('')}
                    className="w-full py-2.5 rounded-xl text-xs font-bold text-white transition-all hover:opacity-90 hover:scale-[1.02]"
                    style={{ background: 'linear-gradient(135deg,#5194F6,#3a7de0)' }}>
                    🔓 Unlock Premium
                  </button>
                )}
              </div>
            </aside>

            {/* ── MAIN CONTENT ──────────────────────────────────────────────── */}
            <div className="flex-1 min-w-0">

              {/* Section header */}
              <div className="flex items-center gap-3 mb-7">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{
                    background: activeTab === 'financial' ? 'rgba(59,130,246,0.15)' : 'rgba(139,92,246,0.15)',
                    border: activeTab === 'financial' ? '1px solid rgba(59,130,246,0.30)' : '1px solid rgba(139,92,246,0.30)',
                    color: activeTab === 'financial' ? '#60A5FA' : '#A78BFA',
                  }}>
                  {activeTab === 'financial' ? <SvgTrending /> : <SvgBrain />}
                </div>
                <div>
                  <h2 className="text-2xl font-bold" style={{ color: isLight ? '#0f172a' : '#fff' }}>
                    {activeTab === 'financial' ? 'Financial Learning' : 'Non-Financial Learning'}
                  </h2>
                  <p className="text-sm" style={{ color: isLight ? '#9ca3af' : 'rgba(148,163,184,0.8)' }}>
                    {activeTab === 'financial'
                      ? 'Official NISM workbooks, video tutorials & certificate programs'
                      : 'Mindset, psychology & personal growth for investors'}
                  </p>
                </div>
              </div>

              {/* Cards grid */}
              <div className={`grid grid-cols-1 ${
                activeTab === 'financial' ? 'md:grid-cols-2 lg:grid-cols-3' : 'md:grid-cols-2'
              } gap-5`}>
                {currentItems.map(item => (
                  <LearnCard
                    key={item.id}
                    {...item}
                    isLight={isLight}
                    isAdmin={isAdmin}
                    isSubscriber={isSubscriber}
                    hasAccess={!item.isPaid || hasAccess}   // ← Access control
                    onStartLearning={handleStartLearning}
                    onUnlock={handleUnlock}
                  />
                ))}
              </div>

              {/* Bottom CTA Banner */}
              <div className="relative rounded-2xl overflow-hidden p-8 md:p-10 text-center mt-12"
                style={{
                  background: isLight ? 'linear-gradient(135deg,#edf5fe,#dce8f7)' : '#101528',
                  border: isLight ? '1px solid rgba(13,37,64,0.10)' : '1px solid rgba(81,148,246,0.20)',
                }}>
                <div className="absolute inset-0 pointer-events-none"
                  style={{ background: 'radial-gradient(ellipse at 50% 0%,rgba(81,148,246,0.12) 0%,transparent 60%)' }} />
                <div className="relative z-10">
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-4"
                    style={{ background: 'rgba(81,148,246,0.10)', border: '1px solid rgba(81,148,246,0.20)' }}>
                    <SvgZap />
                    <span className="text-xs font-semibold text-[#5194F6]">Start Today</span>
                  </div>
                  <h2 className="text-2xl md:text-3xl font-bold mb-3" style={{ color: isLight ? '#0f172a' : '#fff' }}>
                    Ready to Start Learning?
                  </h2>
                  <p className="mb-7 max-w-xl mx-auto text-sm md:text-base"
                    style={{ color: isLight ? 'rgba(13,37,64,0.55)' : 'rgba(148,163,184,0.9)' }}>
                    Curated financial and mindset content — built for investors who want to think, not just trade.
                  </p>
                  <div className="flex flex-wrap items-center justify-center gap-3">
                    <button
                      onClick={() => navigate('/education/financial-tutorials')}
                      className="inline-flex items-center gap-2 px-7 py-3 rounded-xl font-bold text-sm text-white hover:shadow-xl transition-all hover:-translate-y-0.5 group"
                      style={{ background: 'linear-gradient(135deg,#5194F6,#3a7de0)' }}>
                      ▶ Browse Free Tutorials
                      <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                    </button>
                    {!hasAccess && (
                      <button
                        onClick={() => handleUnlock('')}
                        className="inline-flex items-center gap-2 px-7 py-3 rounded-xl font-bold text-sm transition-all hover:-translate-y-0.5"
                        style={{
                          background: isLight ? 'rgba(13,37,64,0.06)' : 'rgba(255,255,255,0.07)',
                          border: isLight ? '1px solid rgba(13,37,64,0.12)' : '1px solid rgba(255,255,255,0.12)',
                          color: isLight ? '#0f172a' : '#fff',
                        }}>
                        🔓 Unlock Premium
                      </button>
                    )}
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>

      </div>
    </Layout>
  );
};

export default EducationView;