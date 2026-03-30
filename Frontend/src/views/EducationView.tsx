import React, { useState, useEffect, useRef } from 'react';
import Layout from '@/components/Layout';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '@/controllers/Themecontext';
import { Lock, ChevronRight, ArrowRight, Star } from 'lucide-react';
import {  useSearchParams } from 'react-router-dom';


// ── SVG Icons (custom, brand-specific) ───────────────────────────────────────

const SvgBook = () => (
  <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
  </svg>
);
const SvgUsers = () => (
  <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);
const SvgCertificate = () => (
  <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="8" r="6" /><path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11" />
  </svg>
);
const SvgStar = () => (
  <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  </svg>
);
const SvgTrending = () => (
  <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" /><polyline points="17 6 23 6 23 12" />
  </svg>
);
const SvgPlay = () => (
  <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" /><polygon points="10 8 16 12 10 16 10 8" />
  </svg>
);
const SvgAward = () => (
  <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="8" r="7" /><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88" />
  </svg>
);
const SvgBrain = () => (
  <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96-.46 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 4.44-1.14z" />
    <path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96-.46 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-4.44-1.14z" />
  </svg>
);
const SvgZap = () => (
  <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
  </svg>
);

// ── Data ──────────────────────────────────────────────────────────────────────

const financialItems = [
  {
    id: 'financial-ebooks', SvgIcon: SvgBook, title: 'E-books', tag: 'Financial',
    description: 'In-depth financial guides, market deep-dives, and comprehensive investment references curated by InvestBeans experts.',
    isPaid: true,
    items: [
      { title: 'Fundamentals of Equity Investing', meta: '120 pages', level: 'Beginner' },
      { title: 'Advanced Portfolio Management',    meta: '200 pages', level: 'Advanced' },
      { title: 'Global Markets Decoded',           meta: '160 pages', level: 'Intermediate' },
    ],
    accent: 'from-blue-500 to-indigo-600', accentRaw: '#3B82F6', iconColor: '#60A5FA',
    detailId: 'financial-ebooks',
  },
  {
    id: 'financial-tutorials', SvgIcon: SvgPlay, title: 'Tutorials', tag: 'Financial',
    description: 'Step-by-step video walkthroughs on reading charts, fundamental analysis, options strategies, and more.',
    isPaid: false,
    items: [
      { title: 'How to Read a Balance Sheet',    meta: '18 min', level: 'Beginner' },
      { title: 'Technical Analysis Masterclass', meta: '45 min', level: 'Intermediate' },
      { title: 'Options Trading Explained',      meta: '32 min', level: 'Advanced' },
    ],
    accent: 'from-emerald-500 to-teal-600', accentRaw: '#10B981', iconColor: '#34D399',
    detailId: 'financial-tutorials',
  },
  {
    id: 'financial-certifications', SvgIcon: SvgAward, title: 'Certifications', tag: 'Financial',
    description: 'Earn verifiable InvestBeans certificates that validate your financial market knowledge and trading skills.',
    isPaid: true,
    items: [
      { title: 'Certified Equity Analyst',           meta: '6 weeks', level: 'Intermediate' },
      { title: 'Options & Derivatives Professional', meta: '8 weeks', level: 'Advanced' },
      { title: 'Personal Finance Essentials',        meta: '3 weeks', level: 'Beginner' },
    ],
    accent: 'from-amber-500 to-orange-600', accentRaw: '#D4A843', iconColor: '#F59E0B',
    detailId: 'financial-certifications',
  },
];

const nonFinancialItems = [
  {
    id: 'nonfinancial-ebooks', SvgIcon: SvgBook, title: 'E-books', tag: 'Non-Financial',
    description: 'Books on productivity, behavioral economics, decision-making, and the mindset needed to become a better investor.',
    isPaid: true,
    items: [
      { title: 'The Psychology of Money',      meta: '95 pages',  level: 'All Levels' },
      { title: 'Thinking in Bets',             meta: '140 pages', level: 'Intermediate' },
      { title: 'Habits of Successful Traders', meta: '110 pages', level: 'Beginner' },
    ],
    accent: 'from-purple-500 to-violet-600', accentRaw: '#8B5CF6', iconColor: '#A78BFA',
    detailId: 'nonfinancial-ebooks',
  },
  {
    id: 'nonfinancial-tutorials', SvgIcon: SvgPlay, title: 'Tutorials', tag: 'Non-Financial',
    description: 'Video tutorials on mindset, time management, productivity tools, and life skills that complement your investing journey.',
    isPaid: false,
    items: [
      { title: 'Building an Investor Mindset',  meta: '22 min', level: 'Beginner' },
      { title: 'Managing Risk Psychologically', meta: '30 min', level: 'Intermediate' },
      { title: 'Productivity for Traders',      meta: '20 min', level: 'All Levels' },
    ],
    accent: 'from-rose-500 to-pink-600', accentRaw: '#F43F5E', iconColor: '#FB7185',
    detailId: 'nonfinancial-tutorials',
  },
];

const stats = [
  { SvgIcon: SvgBook,        label: 'Resources',     value: '120+' },
  { SvgIcon: SvgUsers,       label: 'Learners',       value: '18K+' },
  { SvgIcon: SvgCertificate, label: 'Certifications', value: '3'    },
  { SvgIcon: SvgStar,        label: 'Avg Rating',     value: '4.8★' },
];

const levelStyle: Record<string, { bg: string; text: string }> = {
  Beginner:     { bg: 'rgba(16,185,129,0.12)',  text: '#34D399' },
  Intermediate: { bg: 'rgba(245,158,11,0.12)',  text: '#FBBF24' },
  Advanced:     { bg: 'rgba(239,68,68,0.12)',   text: '#F87171' },
  'All Levels': { bg: 'rgba(148,163,184,0.12)', text: '#94A3B8' },
};

// ── Sidebar nav config ────────────────────────────────────────────────────────

const NAV_ITEMS = [
  { key: 'financial',     label: 'Financial',       SvgIcon: SvgTrending, color: '#3B82F6',  isParent: true  },
  { key: 'fin-ebooks',    label: 'E-books',          SvgIcon: SvgBook,    color: '#60A5FA',  isParent: false, parentKey: 'financial' },
  { key: 'fin-tutorials', label: 'Tutorials',        SvgIcon: SvgPlay,    color: '#34D399',  isParent: false, parentKey: 'financial' },
  { key: 'fin-certs',     label: 'Certifications',   SvgIcon: SvgAward,   color: '#F59E0B',  isParent: false, parentKey: 'financial' },
  { key: 'nonfinancial',  label: 'Non-Financial',    SvgIcon: SvgBrain,   color: '#8B5CF6',  isParent: true  },
  { key: 'nonfin-ebooks', label: 'E-books',          SvgIcon: SvgBook,    color: '#A78BFA',  isParent: false, parentKey: 'nonfinancial' },
  { key: 'nonfin-tuts',   label: 'Tutorials',        SvgIcon: SvgPlay,    color: '#FB7185',  isParent: false, parentKey: 'nonfinancial' },
];

// Sub-item → card mapping
const NAV_TO_CARD: Record<string, string> = {
  'fin-ebooks':    'financial-ebooks',
  'fin-tutorials': 'financial-tutorials',
  'fin-certs':     'financial-certifications',
  'nonfin-ebooks': 'nonfinancial-ebooks',
  'nonfin-tuts':   'nonfinancial-tutorials',
};

// ── ItemRow ───────────────────────────────────────────────────────────────────

function ItemRow({ title, meta, level, accentRaw, isLight }: {
  title: string; meta: string; level: string; accentRaw: string; isLight: boolean;
}) {
  const ls = levelStyle[level] ?? levelStyle['All Levels'];
  return (
    <div className="flex items-center justify-between py-3 group transition-all"
      style={{ borderBottom: isLight ? '1px solid rgba(226,232,240,0.8)' : '1px solid rgba(255,255,255,0.06)' }}>
      <div className="flex items-center gap-2.5 min-w-0">
        <div className="w-1.5 h-1.5 rounded-full flex-shrink-0 transition-all duration-300 group-hover:scale-125"
          style={{ background: accentRaw }} />
        <span className="text-sm font-medium truncate"
          style={{ color: isLight ? '#374151' : 'rgba(255,255,255,0.80)' }}>{title}</span>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0 ml-2">
        <span className="text-xs" style={{ color: isLight ? '#9ca3af' : 'rgba(148,163,184,0.8)' }}>{meta}</span>
        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold"
          style={{ background: ls.bg, color: ls.text }}>{level}</span>
      </div>
    </div>
  );
}

// ── LearnCard ─────────────────────────────────────────────────────────────────

function LearnCard({ id, SvgIcon, title, tag, description, isPaid, items, accent, accentRaw, iconColor, detailId, isLight, onStartLearning, onUnlock }: any) {
  const isFinancial = tag === 'Financial';
  return (
    <div
      id={id}
      className="rounded-2xl overflow-hidden flex flex-col transition-all duration-300 hover:-translate-y-1"
      style={{
        background: isLight ? 'rgba(255,255,255,0.98)' : 'rgba(255,255,255,0.04)',
        border: isLight ? '1px solid rgba(226,232,240,0.9)' : '1px solid rgba(255,255,255,0.08)',
        boxShadow: isLight ? '0 2px 16px rgba(0,0,0,0.05)' : 'none',
        scrollMarginTop: '140px',
      }}
      onMouseEnter={e => (e.currentTarget.style.borderColor = `${accentRaw}55`)}
      onMouseLeave={e => (e.currentTarget.style.borderColor = isLight ? 'rgba(226,232,240,0.9)' : 'rgba(255,255,255,0.08)')}>

      <div className={`h-1 w-full bg-gradient-to-r ${accent}`} />

      <div className="p-5 flex flex-col flex-1">
        <div className="flex items-start justify-between mb-4">
          <div className="w-11 h-11 rounded-xl flex items-center justify-center"
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
            {isPaid ? (
              <span className="flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full"
                style={{ background: 'rgba(81,148,246,0.12)', color: '#5194F6', border: '1px solid rgba(81,148,246,0.25)' }}>
                <Lock className="w-2.5 h-2.5" /> Premium
              </span>
            ) : (
              <span className="flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full"
                style={{ background: 'rgba(16,185,129,0.12)', color: '#34D399', border: '1px solid rgba(16,185,129,0.25)' }}>
                <Star className="w-2.5 h-2.5" /> Free
              </span>
            )}
          </div>
        </div>

        <h3 className="text-lg font-bold mb-1.5 leading-snug"
          style={{ color: isLight ? '#0f172a' : '#fff' }}>{title}</h3>
        <p className="text-sm leading-relaxed mb-5"
          style={{ color: isLight ? '#6b7280' : 'rgba(148,163,184,0.9)' }}>{description}</p>

        <div className="flex-1 mb-5">
          {items.map((item: any) => (
            <ItemRow key={item.title} title={item.title} meta={item.meta}
              level={item.level} accentRaw={accentRaw} isLight={isLight} />
          ))}
        </div>

        {isPaid ? (
          <button
            onClick={() => onUnlock(detailId)}
            className={`w-full py-2.5 rounded-xl text-sm font-bold text-white bg-gradient-to-r ${accent} hover:opacity-90 transition-all flex items-center justify-center gap-2 group/btn`}>
            <Lock className="w-3.5 h-3.5" /> Unlock Access
            <ChevronRight className="w-4 h-4 group-hover/btn:translate-x-0.5 transition-transform" />
          </button>
        ) : (
          <button
            onClick={() => onStartLearning(detailId)}
            className={`w-full py-2.5 rounded-xl text-sm font-bold text-white bg-gradient-to-r ${accent} hover:opacity-90 transition-all flex items-center justify-center gap-2 group/btn`}>
            Start Learning
            <ChevronRight className="w-4 h-4 group-hover/btn:translate-x-0.5 transition-transform" />
          </button>
        )}
      </div>
    </div>
  );
}

// ── EducationView ─────────────────────────────────────────────────────────────

const EducationView = () => {
  const { theme } = useTheme();
  const navigate = useNavigate();
  const isLight = theme === 'light';

  const [searchParams] = useSearchParams();
  const sectionParam = searchParams.get('section');

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

  const handleStartLearning = (detailId: string) => {
    navigate(`/education/${detailId}`);
  };

  const handleUnlock = (detailId: string) => {
    navigate(`/education/unlock/${detailId}`);
  };

  // colors
  const pageBg = isLight
    ? 'linear-gradient(160deg,#f5f4f0 0%,#f8fbff 45%,#f5f4f0 100%)'
    : 'linear-gradient(160deg,#0c1a2e 0%,#0e2038 45%,#0b1825 100%)';
  const sidebarBg = isLight ? 'rgba(255,255,255,0.85)' : 'rgba(10,22,40,0.85)';
  const sidebarBorder = isLight ? 'rgba(226,232,240,0.9)' : 'rgba(255,255,255,0.07)';

  return (
    <Layout>
      <div className="min-h-screen" style={{ background: pageBg }}>

        {/* ── HERO ─────────────────────────────────────────────────────── */}
        <section className="relative overflow-hidden pt-12 pb-8 md:pt-16 md:pb-10" style={{
          background: isLight
            ? 'linear-gradient(135deg,#f8fbff 0%,#f0f6ff 50%,#eef4fd 100%)'
            : 'linear-gradient(135deg,#0a1628 0%,#0e2038 50%,#0c1a2e 100%)',
          borderBottom: isLight ? '1px solid rgba(226,232,240,0.8)' : '1px solid rgba(255,255,255,0.06)',
        }}>
          {/* blobs */}
          <div className="absolute top-0 right-0 w-96 h-96 rounded-full blur-[120px] pointer-events-none"
            style={{ background: 'radial-gradient(circle,rgba(81,148,246,0.10) 0%,transparent 70%)' }} />
          <div className="absolute bottom-0 left-0 w-72 h-72 rounded-full blur-[100px] pointer-events-none"
            style={{ background: 'radial-gradient(circle,rgba(59,130,246,0.08) 0%,transparent 70%)' }} />

          <div className="container mx-auto px-6 relative z-10">
            {/* badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-5"
              style={{ background: 'rgba(81,148,246,0.10)', border: '1px solid rgba(81,148,246,0.20)' }}>
              <SvgZap />
              <span className="text-xs font-medium text-[#5194F6]">InvestBeans Learning Hub</span>
            </div>

            <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-8">
              {/* title */}
              <div className="max-w-2xl">
                <h1 className="text-4xl md:text-5xl font-bold leading-tight mb-4"
                  style={{ color: isLight ? '#0f172a' : '#fff' }}>
                  Level Up Your{' '}
                  <span style={{
                    background: 'linear-gradient(135deg,#5194F6,#7ab8fa)',
                    WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                  }}>Knowledge</span>
                </h1>
                <p className="text-base md:text-lg leading-relaxed"
                  style={{ color: isLight ? '#6b7280' : 'rgba(148,163,184,0.9)' }}>
                  From financial fundamentals to personal growth — everything you need to become a sharper, more confident investor.
                </p>
              </div>

              {/* stats — SVG icons */}
              <div className="flex flex-wrap gap-3 lg:flex-shrink-0">
                {stats.map(({ SvgIcon, label, value }) => (
                  <div key={label} className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl" style={{
                    background: isLight ? 'rgba(13,37,64,0.05)' : 'rgba(255,255,255,0.05)',
                    border: isLight ? '1px solid rgba(13,37,64,0.10)' : '1px solid rgba(255,255,255,0.10)',
                  }}>
                    <span className="text-[#5194F6]"><SvgIcon /></span>
                    <div>
                      <p className="text-base font-bold leading-none" style={{ color: isLight ? '#0f172a' : '#fff' }}>{value}</p>
                      <p className="text-[11px] mt-0.5" style={{ color: isLight ? '#9ca3af' : 'rgba(148,163,184,0.8)' }}>{label}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── MOBILE TAB BAR (horizontal scroll, shown < lg) ───────────── */}
        <div className="lg:hidden sticky top-[68px] z-30 backdrop-blur-md overflow-x-auto scrollbar-hide" style={{
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
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                    nav.isParent ? 'text-[11px] font-bold' : ''
                  }`}
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

        {/* ── BODY: sidebar + content ───────────────────────────────────── */}
        <div className="container mx-auto px-4 lg:px-6 py-8">
          <div className="flex gap-7">

            {/* ── VERTICAL SIDEBAR (desktop only) ─────────────────────── */}
            <aside className="hidden lg:flex flex-col gap-1 w-52 flex-shrink-0 sticky top-24 self-start"
              style={{
                background: sidebarBg,
                border: `1px solid ${sidebarBorder}`,
                borderRadius: 18,
                padding: '16px 12px',
                backdropFilter: 'blur(16px)',
                height: 'fit-content',
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
                    className={`flex items-center gap-2.5 w-full text-left transition-all rounded-xl ${
                      nav.isParent ? 'mt-2 first:mt-0' : 'pl-4'
                    }`}
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
                        color: isActive
                          ? nav.color
                          : nav.isParent
                            ? (isLight ? '#0f172a' : '#e2e8f0')
                            : (isLight ? 'rgba(13,37,64,0.60)' : 'rgba(148,163,184,0.8)'),
                        fontSize: nav.isParent ? 13 : 12,
                      }}>
                      {nav.label}
                    </span>
                    {isActive && <div className="ml-auto w-1.5 h-1.5 rounded-full" style={{ background: nav.color }} />}
                  </button>
                );
              })}

              {/* Sidebar bottom CTA */}
              <div className="mt-4 pt-4" style={{ borderTop: isLight ? '1px solid rgba(226,232,240,0.8)' : '1px solid rgba(255,255,255,0.07)' }}>
                <button
                  onClick={() => navigate('/plans/foundation/checkout')}
                  className="w-full py-2.5 rounded-xl text-xs font-bold text-white transition-all hover:opacity-90"
                  style={{ background: 'linear-gradient(135deg,#5194F6,#3a7de0)' }}>
                  🔓 Unlock Premium
                </button>
              </div>
            </aside>

            {/* ── MAIN CONTENT ─────────────────────────────────────────── */}
            <div className="flex-1 min-w-0">

              {/* Tab header */}
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
                    {activeTab === 'financial' ? 'Financial' : 'Non-Financial'}
                  </h2>
                  <p className="text-sm" style={{ color: isLight ? '#9ca3af' : 'rgba(148,163,184,0.8)' }}>
                    {activeTab === 'financial'
                      ? 'Master markets, analysis & investment strategies'
                      : 'Mindset, psychology & personal growth for investors'}
                  </p>
                </div>
                {/* Desktop tab switcher — inside content area */}
                <div className="ml-auto hidden md:flex items-center gap-2">
                  {(['financial', 'nonfinancial'] as const).map(tab => (
                    <button
                      key={tab}
                      onClick={() => { setActiveTab(tab); setActiveNavKey(tab); }}
                      className="px-4 py-2 rounded-full text-sm font-semibold transition-all"
                      style={activeTab === tab
                        ? { background: tab === 'financial' ? 'rgba(59,130,246,0.15)' : 'rgba(139,92,246,0.15)',
                            color: tab === 'financial' ? '#60A5FA' : '#A78BFA',
                            border: `1px solid ${tab === 'financial' ? 'rgba(59,130,246,0.30)' : 'rgba(139,92,246,0.30)'}` }
                        : { background: isLight ? 'rgba(13,37,64,0.05)' : 'rgba(255,255,255,0.05)',
                            color: isLight ? 'rgba(13,37,64,0.55)' : 'rgba(148,163,184,0.8)',
                            border: isLight ? '1px solid rgba(13,37,64,0.08)' : '1px solid rgba(255,255,255,0.07)' }}>
                      {tab === 'financial' ? '📈 Financial' : '🧠 Non-Financial'}
                    </button>
                  ))}
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
                    onStartLearning={handleStartLearning}
                    onUnlock={handleUnlock}
                  />
                ))}
              </div>

              {/* CTA Banner */}
              <div className="relative rounded-2xl overflow-hidden p-8 md:p-10 text-center mt-12" style={{
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
                    Join <strong style={{ color: isLight ? '#0f172a' : '#fff' }}>18,000+</strong> investors growing their knowledge with InvestBeans' curated content.
                  </p>
                  <div className="flex flex-wrap items-center justify-center gap-3">
                    <button
                      onClick={() => navigate('/education/financial-tutorials')}
                      className="inline-flex items-center gap-2 px-7 py-3 rounded-xl font-bold text-sm text-white hover:shadow-xl transition-all hover:-translate-y-0.5 group"
                      style={{ background: 'linear-gradient(135deg,#5194F6,#3a7de0)' }}>
                      Browse Free Resources
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                    </button>
                    <button
                      onClick={() => navigate('/plans/foundation/checkout')}
                      className="inline-flex items-center gap-2 px-7 py-3 rounded-xl font-bold text-sm transition-all hover:-translate-y-0.5"
                      style={{
                        background: isLight ? 'rgba(13,37,64,0.06)' : 'rgba(255,255,255,0.07)',
                        border: isLight ? '1px solid rgba(13,37,64,0.12)' : '1px solid rgba(255,255,255,0.12)',
                        color: isLight ? '#0f172a' : '#fff',
                      }}>
                      🔓 Unlock Premium
                    </button>
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