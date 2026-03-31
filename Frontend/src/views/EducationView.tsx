import React, { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '@/controllers/Themecontext';
import { Lock, ChevronRight, Star } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';

// ── SVG Icons (sidebar / cards) ───────────────────────────────────────────────

const SvgBook = () => (
  <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
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
const SvgTrending = () => (
  <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" /><polyline points="17 6 23 6 23 12" />
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
const SvgLayers = () => (
  <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="12 2 2 7 12 12 22 7 12 2" />
    <polyline points="2 17 12 22 22 17" />
    <polyline points="2 12 12 17 22 12" />
  </svg>
);
const SvgShieldCheck = () => (
  <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    <polyline points="9 12 11 14 15 10" />
  </svg>
);

// ── Hero-only pill icons (larger, cleaner) ────────────────────────────────────

const IconResources = () => (
  <svg viewBox="0 0 28 28" fill="none" width="18" height="18" xmlns="http://www.w3.org/2000/svg">
    <rect x="4" y="3" width="14" height="18" rx="2.5" stroke="currentColor" strokeWidth="1.7" fill="none"/>
    <rect x="8" y="6" width="14" height="18" rx="2.5" stroke="currentColor" strokeWidth="1.7" fill="none" opacity="0.4"/>
    <line x1="7" y1="9" x2="15" y2="9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    <line x1="7" y1="12" x2="15" y2="12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    <line x1="7" y1="15" x2="12" y2="15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);
const IconModules = () => (
  <svg viewBox="0 0 28 28" fill="none" width="18" height="18" xmlns="http://www.w3.org/2000/svg">
    <rect x="3" y="3" width="9" height="9" rx="2" stroke="currentColor" strokeWidth="1.7" fill="none"/>
    <rect x="16" y="3" width="9" height="9" rx="2" stroke="currentColor" strokeWidth="1.7" fill="none"/>
    <rect x="3" y="16" width="9" height="9" rx="2" stroke="currentColor" strokeWidth="1.7" fill="none"/>
    <rect x="16" y="16" width="9" height="9" rx="2" stroke="currentColor" strokeWidth="1.7" fill="none" opacity="0.45"/>
    <circle cx="20.5" cy="20.5" r="2" fill="currentColor" opacity="0.5"/>
  </svg>
);
const IconCert = () => (
  <svg viewBox="0 0 28 28" fill="none" width="18" height="18" xmlns="http://www.w3.org/2000/svg">
    <circle cx="14" cy="11" r="6" stroke="currentColor" strokeWidth="1.7" fill="none"/>
    <path d="M10 17.5 L8 25 L14 22 L20 25 L18 17.5" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" fill="none"/>
    <path d="M11.5 11 L13 12.8 L16.5 9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);
const IconShield = () => (
  <svg viewBox="0 0 28 28" fill="none" width="18" height="18" xmlns="http://www.w3.org/2000/svg">
    <path d="M14 3 L24 7 L24 15 C24 20 19 24 14 26 C9 24 4 20 4 15 L4 7 Z" stroke="currentColor" strokeWidth="1.7" fill="none" strokeLinejoin="round"/>
    <path d="M10 14 L12.5 16.5 L18 11" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

// ── Stat pills config ─────────────────────────────────────────────────────────

const STAT_PILLS = [
  { Icon: IconResources, value: '120+', label: 'Resources',      accent: '#5194F6', bg: 'rgba(81,148,246,0.10)',  border: 'rgba(81,148,246,0.22)'  },
  { Icon: IconModules,   value: '8',    label: 'Modules',        accent: '#10B981', bg: 'rgba(16,185,129,0.10)', border: 'rgba(16,185,129,0.22)'  },
  { Icon: IconCert,      value: '3',    label: 'Certifications', accent: '#D4A843', bg: 'rgba(212,168,67,0.10)', border: 'rgba(212,168,67,0.22)'  },
  { Icon: IconShield,    value: '100%', label: 'Expert-Vetted',  accent: '#8B5CF6', bg: 'rgba(139,92,246,0.10)', border: 'rgba(139,92,246,0.22)'  },
];

// ── Hero SVG Illustration ─────────────────────────────────────────────────────

const HeroIllustration = ({ isLight }: { isLight: boolean }) => (
  <svg
    viewBox="0 0 480 340"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="w-full h-full"
    style={{ maxWidth: 480 }}
  >
    <defs>
      <radialGradient id="glow1" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="#5194F6" stopOpacity="0.18"/>
        <stop offset="100%" stopColor="#5194F6" stopOpacity="0"/>
      </radialGradient>
      <radialGradient id="glow2" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="#8B5CF6" stopOpacity="0.15"/>
        <stop offset="100%" stopColor="#8B5CF6" stopOpacity="0"/>
      </radialGradient>
      <radialGradient id="glow3" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="#10B981" stopOpacity="0.18"/>
        <stop offset="100%" stopColor="#10B981" stopOpacity="0"/>
      </radialGradient>
      <linearGradient id="cardGrad" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor={isLight ? '#ffffff' : '#0e2038'}/>
        <stop offset="100%" stopColor={isLight ? '#f0f6ff' : '#0a1628'}/>
      </linearGradient>
      <linearGradient id="barBlue" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stopColor="#5194F6"/>
        <stop offset="100%" stopColor="#7ab8fa"/>
      </linearGradient>
      <linearGradient id="barGreen" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stopColor="#10B981"/>
        <stop offset="100%" stopColor="#34D399"/>
      </linearGradient>
      <linearGradient id="barAmber" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stopColor="#F59E0B"/>
        <stop offset="100%" stopColor="#FCD34D"/>
      </linearGradient>
      <linearGradient id="chartLine" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stopColor="#5194F6"/>
        <stop offset="60%" stopColor="#8B5CF6"/>
        <stop offset="100%" stopColor="#10B981"/>
      </linearGradient>
      <filter id="shadow" x="-10%" y="-10%" width="120%" height="130%">
        <feDropShadow dx="0" dy="4" stdDeviation="8"
          floodColor={isLight ? '#0a1628' : '#000'} floodOpacity="0.12"/>
      </filter>
      <filter id="softShadow" x="-5%" y="-5%" width="110%" height="120%">
        <feDropShadow dx="0" dy="2" stdDeviation="4" floodColor="#10B981" floodOpacity="0.35"/>
      </filter>
    </defs>

    {/* Ambient glows */}
    <ellipse cx="120" cy="120" rx="100" ry="90" fill="url(#glow1)" opacity="0.7"/>
    <ellipse cx="360" cy="200" rx="90" ry="80" fill="url(#glow2)" opacity="0.6"/>
    <ellipse cx="300" cy="90" rx="70" ry="60" fill="url(#glow3)" opacity="0.5"/>

    {/* ── CARD 1 — Learning Progress ─────────────────────────────────── */}
    <rect x="20" y="30" width="260" height="175" rx="16" fill="url(#cardGrad)"
      stroke={isLight ? 'rgba(81,148,246,0.22)' : 'rgba(81,148,246,0.18)'} strokeWidth="1.2" filter="url(#shadow)"/>
    {/* top accent */}
    <rect x="20" y="30" width="260" height="4" rx="2" fill="url(#barBlue)"/>

    {/* Card 1 icon */}
    <rect x="36" y="50" width="28" height="28" rx="8"
      fill="rgba(81,148,246,0.14)" stroke="rgba(81,148,246,0.28)" strokeWidth="1"/>
    <rect x="42" y="56" width="9" height="12" rx="1.5" fill="none" stroke="#5194F6" strokeWidth="1.4"/>
    <rect x="45" y="54" width="9" height="12" rx="1.5" fill="none" stroke="#7ab8fa" strokeWidth="1.2" opacity="0.55"/>
    <line x1="44" y1="60" x2="49" y2="60" stroke="#5194F6" strokeWidth="1" strokeLinecap="round"/>
    <line x1="44" y1="63" x2="49" y2="63" stroke="#5194F6" strokeWidth="1" strokeLinecap="round"/>

    <text x="74" y="60" fontFamily="system-ui,sans-serif" fontSize="11" fontWeight="700"
      fill={isLight ? '#0f172a' : '#ffffff'} letterSpacing="0.3">Learning Progress</text>
    <text x="74" y="72" fontFamily="system-ui,sans-serif" fontSize="9"
      fill={isLight ? '#9ca3af' : 'rgba(148,163,184,0.65)'}>3 modules active</text>

    {/* Progress bars */}
    {([
      { label: 'Technical Analysis',    pct: 78, grad: 'url(#barBlue)',  y: 100 },
      { label: 'Fundamental Research',  pct: 52, grad: 'url(#barGreen)', y: 122 },
      { label: 'Options Strategy',      pct: 31, grad: 'url(#barAmber)', y: 144 },
    ] as { label: string; pct: number; grad: string; y: number }[]).map(({ label, pct, grad, y }) => (
      <g key={label}>
        <text x="36" y={y - 4} fontFamily="system-ui,sans-serif" fontSize="8.5"
          fill={isLight ? '#6b7280' : 'rgba(148,163,184,0.75)'}>{label}</text>
        <rect x="36" y={y} width="222" height="6" rx="3"
          fill={isLight ? 'rgba(226,232,240,0.6)' : 'rgba(255,255,255,0.07)'}/>
        <rect x="36" y={y} width={222 * pct / 100} height="6" rx="3" fill={grad}/>
        <text x="264" y={y + 5.5} fontFamily="system-ui,sans-serif" fontSize="8" fontWeight="700"
          fill={isLight ? '#374151' : 'rgba(255,255,255,0.65)'} textAnchor="end">{pct}%</text>
      </g>
    ))}

    {/* Bottom badges */}
    <rect x="36" y="168" width="88" height="22" rx="11"
      fill="rgba(16,185,129,0.12)" stroke="rgba(16,185,129,0.28)" strokeWidth="1"/>
    <circle cx="49" cy="179" r="4" fill="#10B981" opacity="0.85"/>
    <text x="57" y="183" fontFamily="system-ui,sans-serif" fontSize="8.5" fontWeight="700"
      fill="#10B981">2 Completed</text>

    <rect x="136" y="168" width="82" height="22" rx="11"
      fill="rgba(81,148,246,0.10)" stroke="rgba(81,148,246,0.22)" strokeWidth="1"/>
    <text x="177" y="183" fontFamily="system-ui,sans-serif" fontSize="8.5" fontWeight="600"
      fill="#5194F6" textAnchor="middle">120+ Resources</text>

    {/* ── CARD 2 — Market Mastery Chart ──────────────────────────────── */}
    <rect x="198" y="158" width="262" height="158" rx="16" fill="url(#cardGrad)"
      stroke={isLight ? 'rgba(139,92,246,0.20)' : 'rgba(139,92,246,0.18)'} strokeWidth="1.2" filter="url(#shadow)"/>
    <rect x="198" y="158" width="262" height="4" rx="2" fill="url(#barAmber)"/>

    {/* Card 2 icon */}
    <rect x="214" y="177" width="28" height="28" rx="8"
      fill="rgba(139,92,246,0.14)" stroke="rgba(139,92,246,0.28)" strokeWidth="1"/>
    <polyline points="220,200 224,194 229,197 234,187 238,190"
      stroke="#8B5CF6" strokeWidth="1.7" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
    <polyline points="235,187 238,187 238,190"
      stroke="#8B5CF6" strokeWidth="1.5" fill="none" strokeLinecap="round"/>

    <text x="252" y="186" fontFamily="system-ui,sans-serif" fontSize="11" fontWeight="700"
      fill={isLight ? '#0f172a' : '#ffffff'}>Market Mastery</text>
    <text x="252" y="198" fontFamily="system-ui,sans-serif" fontSize="9"
      fill={isLight ? '#9ca3af' : 'rgba(148,163,184,0.65)'}>Skill growth over time</text>

    {/* Chart area */}
    <rect x="214" y="212" width="230" height="72" rx="10"
      fill={isLight ? 'rgba(226,232,240,0.20)' : 'rgba(255,255,255,0.03)'}
      stroke={isLight ? 'rgba(226,232,240,0.55)' : 'rgba(255,255,255,0.06)'} strokeWidth="1"/>

    {/* Grid */}
    {([226, 238, 250, 262] as number[]).map(y => (
      <line key={y} x1="222" y1={y} x2="436" y2={y}
        stroke={isLight ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.04)'}
        strokeWidth="0.8" strokeDasharray="4,3"/>
    ))}

    {/* Area fill */}
    <path d="M222,277 L250,262 L278,255 L306,246 L334,240 L362,230 L390,220 L418,210 L436,202 L436,278 L222,278 Z"
      fill="url(#chartLine)" opacity="0.09"/>

    {/* Chart line */}
    <path d="M222,277 L250,262 L278,255 L306,246 L334,240 L362,230 L390,220 L418,210 L436,202"
      stroke="url(#chartLine)" strokeWidth="2.2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>

    {/* End dot */}
    <circle cx="436" cy="202" r="7" fill="rgba(16,185,129,0.18)"/>
    <circle cx="436" cy="202" r="4" fill="#10B981" filter="url(#softShadow)"/>

    {/* X labels */}
    {(['Jan','Mar','May','Jul','Sep'] as string[]).map((m, i) => (
      <text key={m} x={222 + i * 53} y="290" fontFamily="system-ui,sans-serif" fontSize="7.5"
        fill={isLight ? '#9ca3af' : 'rgba(148,163,184,0.5)'} textAnchor="middle">{m}</text>
    ))}

    {/* ── FLOATING BADGE — SEBI Aligned ──────────────────────────────── */}
    <rect x="298" y="12" width="162" height="46" rx="23"
      fill={isLight ? '#ffffff' : '#0e2038'}
      stroke="rgba(81,148,246,0.25)" strokeWidth="1.2" filter="url(#shadow)"/>
    <rect x="314" y="22" width="24" height="24" rx="7"
      fill="rgba(212,168,67,0.15)" stroke="rgba(212,168,67,0.30)" strokeWidth="1"/>
    {/* Award cup */}
    <path d="M320,26 L320,34 L330,34 L330,26 Z" fill="none" stroke="#D4A843" strokeWidth="1.3" strokeLinejoin="round"/>
    <path d="M317.5,28 C317.5,28 316,28 316,30.5 C316,33 318,33 320,33"
      fill="none" stroke="#D4A843" strokeWidth="1.2" strokeLinecap="round"/>
    <path d="M332.5,28 C332.5,28 334,28 334,30.5 C334,33 332,33 330,33"
      fill="none" stroke="#D4A843" strokeWidth="1.2" strokeLinecap="round"/>
    <line x1="323" y1="34" x2="327" y2="38" stroke="#D4A843" strokeWidth="1.2" strokeLinecap="round"/>
    <line x1="321" y1="38" x2="329" y2="38" stroke="#D4A843" strokeWidth="1.2" strokeLinecap="round"/>
    <text x="346" y="30" fontFamily="system-ui,sans-serif" fontSize="9" fontWeight="800"
      fill={isLight ? '#0f172a' : '#fff'} letterSpacing="0.2">SEBI Aligned</text>
    <text x="346" y="43" fontFamily="system-ui,sans-serif" fontSize="8"
      fill={isLight ? '#9ca3af' : 'rgba(148,163,184,0.7)'}>Expert-vetted content</text>

    {/* ── FLOATING PILL — Free Access ────────────────────────────────── */}
    <rect x="22" y="224" width="84" height="28" rx="14"
      fill="rgba(16,185,129,0.12)" stroke="rgba(16,185,129,0.28)" strokeWidth="1"/>
    <circle cx="38" cy="238" r="5" fill="rgba(16,185,129,0.25)"/>
    <circle cx="38" cy="238" r="2.5" fill="#10B981"/>
    <text x="48" y="242" fontFamily="system-ui,sans-serif" fontSize="9" fontWeight="700"
      fill="#10B981">Free Access</text>

    {/* ── FLOATING PILL — Expert Vetted ──────────────────────────────── */}
    <rect x="22" y="262" width="112" height="28" rx="14"
      fill="rgba(139,92,246,0.12)" stroke="rgba(139,92,246,0.26)" strokeWidth="1"/>
    <text x="78" y="280" fontFamily="system-ui,sans-serif" fontSize="9" fontWeight="700"
      fill="#8B5CF6" textAnchor="middle">100% Expert-Vetted</text>

    {/* Decorative dots */}
    {([
      [172, 40], [182, 56], [166, 62],
      [452, 138], [462, 154], [446, 160],
    ] as [number, number][]).map(([cx, cy], i) => (
      <circle key={i} cx={cx} cy={cy} r="2.2"
        fill={i < 3 ? 'rgba(81,148,246,0.32)' : 'rgba(139,92,246,0.32)'}/>
    ))}
  </svg>
);

// ── Course Data ───────────────────────────────────────────────────────────────

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

const levelStyle: Record<string, { bg: string; text: string }> = {
  Beginner:     { bg: 'rgba(16,185,129,0.12)',  text: '#34D399' },
  Intermediate: { bg: 'rgba(245,158,11,0.12)',  text: '#FBBF24' },
  Advanced:     { bg: 'rgba(239,68,68,0.12)',   text: '#F87171' },
  'All Levels': { bg: 'rgba(148,163,184,0.12)', text: '#94A3B8' },
};

// ── Sidebar nav ───────────────────────────────────────────────────────────────

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

// ── ItemRow ───────────────────────────────────────────────────────────────────

function ItemRow({ title, meta, level, accentRaw, isLight }: {
  title: string; meta: string; level: string; accentRaw: string; isLight: boolean;
}) {
  const ls = levelStyle[level] ?? levelStyle['All Levels'];
  return (
    <div className="flex items-center justify-between py-2.5 group"
      style={{ borderBottom: isLight ? '1px solid rgba(226,232,240,0.8)' : '1px solid rgba(255,255,255,0.06)' }}>
      <div className="flex items-center gap-2.5 min-w-0">
        <div className="w-1.5 h-1.5 rounded-full flex-shrink-0 transition-all duration-300 group-hover:scale-150"
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
      className="rounded-2xl overflow-hidden flex flex-col transition-all duration-300 hover:-translate-y-1 group"
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

  const handleStartLearning = (detailId: string) => navigate(`/education/${detailId}`);
  const handleUnlock        = (detailId: string) => navigate(`/education/unlock/${detailId}`);

  const pageBg = isLight
    ? 'linear-gradient(160deg,#f5f4f0 0%,#f8fbff 45%,#f5f4f0 100%)'
    : 'linear-gradient(160deg,#0c1a2e 0%,#0e2038 45%,#0b1825 100%)';
  const sidebarBg     = isLight ? 'rgba(255,255,255,0.85)' : 'rgba(10,22,40,0.85)';
  const sidebarBorder = isLight ? 'rgba(226,232,240,0.9)' : 'rgba(255,255,255,0.07)';

  return (
    <Layout>
      <div className="min-h-screen" style={{ background: pageBg }}>

        {/* ══════════════════════════════════════════════════════════════
            HERO — redesigned: SVG illustration replaces stat card grid
        ══════════════════════════════════════════════════════════════ */}
        <section
          className="relative overflow-hidden pt-12 pb-10 md:pt-16 md:pb-14"
          style={{
            background: isLight
              ? 'linear-gradient(135deg,#f8fbff 0%,#f0f6ff 50%,#eef4fd 100%)'
              : 'linear-gradient(135deg,#0a1628 0%,#0e2038 50%,#0c1a2e 100%)',
            borderBottom: isLight ? '1px solid rgba(226,232,240,0.8)' : '1px solid rgba(255,255,255,0.06)',
          }}
        >
          {/* Ambient blobs */}
          <div className="absolute top-0 left-1/3 w-96 h-96 rounded-full blur-[120px] pointer-events-none opacity-50"
            style={{ background: 'radial-gradient(circle,rgba(81,148,246,0.13) 0%,transparent 70%)' }} />
          <div className="absolute bottom-0 right-10 w-72 h-72 rounded-full blur-[100px] pointer-events-none opacity-40"
            style={{ background: 'radial-gradient(circle,rgba(139,92,246,0.11) 0%,transparent 70%)' }} />

          <div className="container mx-auto px-6 relative z-10">
            <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-8 xl:gap-12">

              {/* ── LEFT: text + tab pills + stat pills ──────────────── */}
              <div className="flex flex-col max-w-2xl">

                {/* Badge */}
                <div
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-5 self-start"
                  style={{ background: 'rgba(81,148,246,0.10)', border: '1px solid rgba(81,148,246,0.20)' }}
                >
                  <SvgZap />
                  <span className="text-xs font-semibold text-[#5194F6]">InvestBeans Learning Hub</span>
                </div>

                {/* Heading */}
                <h1
                  className="text-4xl md:text-5xl font-bold leading-tight mb-4"
                  style={{ color: isLight ? '#0f172a' : '#fff' }}
                >
                  Learn to Invest{' '}
                  <span style={{
                    background: 'linear-gradient(135deg,#5194F6,#7ab8fa)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                  }}>
                    Smarter
                  </span>
                </h1>

                <p
                  className="text-base md:text-lg leading-relaxed mb-6 max-w-lg"
                  style={{ color: isLight ? '#6b7280' : 'rgba(148,163,184,0.9)' }}
                >
                  Structured courses on financial markets, technical analysis, and investor
                  psychology — all in one place.
                </p>

                {/* Tab pills */}
                <div className="flex flex-wrap gap-2 mb-7">
                  {[
                    { label: '📈 Financial',     tab: 'financial'    as const },
                    { label: '🧠 Non-Financial', tab: 'nonfinancial' as const },
                  ].map(({ label, tab }) => (
                    <button
                      key={tab}
                      onClick={() => { setActiveTab(tab); setActiveNavKey(tab); }}
                      className="px-4 py-2 rounded-full text-sm font-semibold transition-all"
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
                          }}
                    >
                      {label}
                    </button>
                  ))}
                </div>

                {/* Stat pills row */}
                {/* <div className="flex flex-wrap gap-2">
                  {STAT_PILLS.map(({ Icon, value, label, accent, bg, border }) => (
                    <div
                      key={label}
                      className="flex items-center gap-2 px-3 py-2 rounded-xl transition-all duration-200 hover:-translate-y-0.5"
                      style={{ background: bg, border: `1px solid ${border}` }}
                    >
                      <div
                        className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                        style={{ color: accent }}
                      >
                        <Icon />
                      </div>
                      <div>
                        <p className="text-sm font-black leading-none"
                          style={{ color: isLight ? '#0f172a' : '#fff' }}>
                          {value}
                        </p>
                        <p className="text-[10px] font-semibold leading-none mt-0.5"
                          style={{ color: accent }}>
                          {label}
                        </p>
                      </div>
                    </div>
                  ))}
                </div> */}

              </div>

              {/* ── RIGHT: SVG Illustration (desktop only) ───────────── */}
              <div className="hidden xl:flex items-center justify-center flex-shrink-0 w-[460px]">
                <HeroIllustration isLight={isLight} />
              </div>

            </div>
          </div>
        </section>

        {/* ── MOBILE TAB BAR ───────────────────────────────────────────── */}
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
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${nav.isParent ? 'font-bold' : ''}`}
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

        {/* ── BODY ─────────────────────────────────────────────────────── */}
        <div className="container mx-auto px-4 lg:px-6 py-8">
          <div className="flex gap-7">

            {/* ── SIDEBAR ─────────────────────────────────────────────── */}
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

              {/* Sidebar CTA */}
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
                      ? 'Master markets, analysis & investment strategies'
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
                    Curated financial and mindset content — built for investors who want to think, not just trade.
                  </p>
                  <div className="flex flex-wrap items-center justify-center gap-3">
                    <button
                      onClick={() => navigate('/education/financial-tutorials')}
                      className="inline-flex items-center gap-2 px-7 py-3 rounded-xl font-bold text-sm text-white hover:shadow-xl transition-all hover:-translate-y-0.5 group"
                      style={{ background: 'linear-gradient(135deg,#5194F6,#3a7de0)' }}>
                      Browse Free Resources
                      <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
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