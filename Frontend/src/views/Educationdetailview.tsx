/**
 * EducationDetailView.tsx
 * Route: /education/:categoryId
 *
 * Book-reader layout: sticky Table of Contents sidebar + chapter content area.
 * Premium modules are gated with <RequireSubscription>.
 */

import React, { useState, useRef, useEffect } from 'react';
import Layout from '@/components/Layout';
import { useParams, useNavigate } from 'react-router-dom';
import { useTheme } from '@/controllers/Themecontext';
import { useAuth } from '@/controllers/AuthContext';
import RequireSubscription from '@/components/RequireSubscription';

// ── SVG Icons ─────────────────────────────────────────────────────────────────

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
const SvgChevronRight = () => (
  <svg viewBox="0 0 24 24" fill="none" className="w-3.5 h-3.5" stroke="currentColor" strokeWidth="2">
    <polyline points="9 18 15 12 9 6" />
  </svg>
);
const SvgDownload = () => (
  <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" />
  </svg>
);
const SvgBookOpen = () => (
  <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
    <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
  </svg>
);
const SvgListChecks = () => (
  <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <line x1="10" y1="6" x2="21" y2="6" /><line x1="10" y1="12" x2="21" y2="12" /><line x1="10" y1="18" x2="21" y2="18" />
    <polyline points="3 6 4 7 6 5" /><polyline points="3 12 4 13 6 11" /><polyline points="3 18 4 19 6 17" />
  </svg>
);

// ── Full Content Dataset ───────────────────────────────────────────────────────

const CATEGORY_DATA: Record<string, any> = {
  'financial-ebooks': {
    title: 'Financial E-books', tag: 'Financial', isPaid: true,
    accent: '#3B82F6', accentGrad: 'linear-gradient(135deg,#3B82F6,#4F46E5)',
    contentType: 'ebook',
    description: 'Curated financial guides written by market experts. From equity basics to advanced portfolio theory — available as downloadable PDFs.',
    stats: { rating: '4.9', reviews: '312', duration: '480 pages total', modules: 3 },
    instructor: { name: 'InvestBeans Research Team', role: 'CFA & SEBI-Registered Analysts', avatar: '📊' },
    whatYouLearn: [
      'Understand how equity markets and Sensex/Nifty work',
      'Build and manage a diversified investment portfolio',
      'Read balance sheets, P&L statements, and cash flows',
      'Analyze global macro trends affecting Indian markets',
      'Evaluate risk-reward for different asset classes',
      'Apply Warren Buffett and Charlie Munger principles',
    ],
    modules: [
      {
        title: 'Book I — Fundamentals of Equity Investing', subtitle: 'Your first step into the markets',
        pages: 120, level: 'Beginner', isPaid: false,
        description: "A complete beginner's guide to stock markets, Demat accounts, how IPOs work, and the basics of equity valuation. No prior knowledge needed.",
        chapters: [
          { title: 'What is the Stock Market?',                  ref: 'pp. 1–18',   free: true  },
          { title: 'Opening a Demat & Trading Account',          ref: 'pp. 19–32',  free: true  },
          { title: 'Understanding Sensex & Nifty 50',            ref: 'pp. 33–52',  free: true  },
          { title: 'How to Read a Stock Quote',                   ref: 'pp. 53–74',  free: false },
          { title: 'Equity Valuation Basics (P/E, P/B, EV/EBITDA)', ref: 'pp. 75–98', free: false },
          { title: 'Investing vs. Trading — What\'s Right for You', ref: 'pp. 99–120', free: false },
        ],
      },
      {
        title: 'Book II — Advanced Portfolio Management', subtitle: 'Build wealth that compounds',
        pages: 200, level: 'Advanced', isPaid: true,
        description: 'Deep-dive into Modern Portfolio Theory, asset allocation strategies, rebalancing, and building a wealth compounding machine that works across market cycles.',
        chapters: [
          { title: 'Modern Portfolio Theory Explained',          ref: 'pp. 1–28',    free: false },
          { title: 'Asset Allocation: Equity vs Debt vs Gold',   ref: 'pp. 29–60',   free: false },
          { title: 'Systematic Investment Planning (SIP)',        ref: 'pp. 61–88',   free: false },
          { title: 'Portfolio Rebalancing Strategies',           ref: 'pp. 89–120',  free: false },
          { title: 'Tax Harvesting & LTCG Optimization',         ref: 'pp. 121–158', free: false },
          { title: 'Building a ₹1 Crore Portfolio from Scratch', ref: 'pp. 159–200', free: false },
        ],
      },
      {
        title: 'Book III — Global Markets Decoded', subtitle: 'Think beyond Nifty',
        pages: 160, level: 'Intermediate', isPaid: true,
        description: "Understand how US Fed rate decisions, China's growth, and global commodity prices ripple through Indian equity and currency markets.",
        chapters: [
          { title: 'US Federal Reserve & Indian Markets',      ref: 'pp. 1–30',    free: false },
          { title: 'Dollar-Rupee Dynamics Explained',          ref: 'pp. 31–58',   free: false },
          { title: 'Crude Oil Prices & India\'s Economy',      ref: 'pp. 59–90',   free: false },
          { title: 'FII/DII Flow Analysis & What It Signals',  ref: 'pp. 91–120',  free: false },
          { title: 'China Risk & Emerging Market Rotation',    ref: 'pp. 121–160', free: false },
        ],
      },
    ],
  },

  'financial-tutorials': {
    title: 'Financial Tutorials', tag: 'Financial', isPaid: false,
    accent: '#10B981', accentGrad: 'linear-gradient(135deg,#10B981,#059669)',
    contentType: 'video',
    description: 'HD video tutorials covering chart reading, technical analysis, options trading — taught by practicing traders with NSE certifications.',
    stats: { rating: '4.8', reviews: '741', duration: '3h 15m total', modules: 3 },
    instructor: { name: 'Rajiv Menon & Team', role: 'NSE Certified Technical Analyst', avatar: '📈' },
    whatYouLearn: [
      'Read candlestick charts and identify key patterns',
      'Use RSI, MACD, and Bollinger Bands in real trades',
      'Understand options Greeks: Delta, Theta, Gamma, Vega',
      'Execute a systematic, rule-based trading plan',
      'Backtest strategies on NSE historical data',
      'Manage risk with stop-losses and position sizing',
    ],
    modules: [
      {
        title: 'Session 1 — How to Read a Balance Sheet', subtitle: 'Decode any listed company in 18 minutes',
        pages: '18 min', level: 'Beginner', isPaid: false,
        description: 'Demystify the three financial statements — balance sheet, P&L, and cash flow — and learn to spot healthy vs. stressed companies at a glance.',
        chapters: [
          { title: 'What is a Balance Sheet?',            ref: '0:00–3:20',  free: true },
          { title: 'Assets, Liabilities & Equity',        ref: '3:20–8:45',  free: true },
          { title: 'Reading the P&L Statement',           ref: '8:45–14:00', free: true },
          { title: 'Cash Flow Analysis — The Truth Test', ref: '14:00–18:00',free: true },
        ],
      },
      {
        title: 'Session 2 — Technical Analysis Masterclass', subtitle: 'Charts, patterns, and momentum',
        pages: '45 min', level: 'Intermediate', isPaid: false,
        description: 'A comprehensive session on chart patterns, moving averages, and momentum indicators used by active traders on Zerodha and Angel One.',
        chapters: [
          { title: 'Introduction to Candlestick Charts',       ref: '0:00–8:00',  free: true },
          { title: 'Support & Resistance — The Foundation',    ref: '8:00–18:30', free: true },
          { title: 'Moving Averages (SMA, EMA)',               ref: '18:30–28:00',free: true },
          { title: 'RSI, MACD & Momentum Indicators',         ref: '28:00–38:00',free: true },
          { title: 'Live Trade Walkthrough on NSE Chart',      ref: '38:00–45:00',free: true },
        ],
      },
      {
        title: 'Session 3 — Options Trading Explained', subtitle: 'Calls, puts, and strategies',
        pages: '32 min', level: 'Advanced', isPaid: false,
        description: 'Everything you need to understand Call and Put options, Option Chain reading on NSE, and basic strategies like Covered Call and Bull Spread.',
        chapters: [
          { title: 'What are Options? Call vs Put Decoded',  ref: '0:00–7:00',  free: true },
          { title: 'Reading the NSE Option Chain',           ref: '7:00–15:00', free: true },
          { title: 'Greeks: Delta, Theta, IV Explained',     ref: '15:00–24:00',free: true },
          { title: 'Covered Call & Bull Spread in Practice', ref: '24:00–32:00',free: true },
        ],
      },
    ],
  },

  'financial-certifications': {
    title: 'Financial Certifications', tag: 'Financial', isPaid: true,
    accent: '#D4A843', accentGrad: 'linear-gradient(135deg,#D4A843,#F59E0B)',
    contentType: 'certification',
    description: 'Earn InvestBeans-verified certificates that demonstrate real financial market knowledge to employers, clients, and peers.',
    stats: { rating: '4.9', reviews: '198', duration: '17 weeks total', modules: 3 },
    instructor: { name: 'Dr. Priya Sharma', role: 'PhD Finance, IIM Alumni', avatar: '🎓' },
    whatYouLearn: [
      'Analyze equities using DCF and comparable analysis',
      'Structure a diversified mutual fund portfolio',
      'Understand SEBI regulations and investor protection',
      'Model options payoffs and risk scenarios in Excel',
      'Build an investment thesis for any listed stock',
      'Pass NISM/NCFM-equivalent assessments confidently',
    ],
    modules: [
      {
        title: 'Certificate I — Certified Equity Analyst', subtitle: '6-week structured program',
        pages: '6 weeks', level: 'Intermediate', isPaid: true,
        description: 'Master equity research — fundamental analysis, DCF valuation, and portfolio construction — in a structured 6-week program with a final exam.',
        chapters: [
          { title: 'Week 1: Financial Statement Analysis',        ref: 'Week 1', free: false },
          { title: 'Week 2: Valuation Methods (DCF, P/E, P/B)',  ref: 'Week 2', free: false },
          { title: 'Week 3: Sector & Industry Analysis',         ref: 'Week 3', free: false },
          { title: 'Week 4: Building an Investment Thesis',      ref: 'Week 4', free: false },
          { title: 'Week 5: Portfolio Construction',             ref: 'Week 5', free: false },
          { title: 'Week 6: Final Assessment + Certificate',     ref: 'Week 6', free: false },
        ],
      },
      {
        title: 'Certificate II — Options & Derivatives Professional', subtitle: '8-week advanced program',
        pages: '8 weeks', level: 'Advanced', isPaid: true,
        description: 'For traders who want to master F&O — futures pricing, multi-leg options strategies, risk management, and the live markets assessment.',
        chapters: [
          { title: 'Weeks 1–2: Futures Pricing & Hedging',   ref: 'Week 1–2', free: false },
          { title: 'Weeks 3–4: Options Strategy Toolkit',    ref: 'Week 3–4', free: false },
          { title: 'Weeks 5–6: Greeks & Volatility Surfaces', ref: 'Week 5–6', free: false },
          { title: 'Weeks 7–8: Live Markets Exam',           ref: 'Week 7–8', free: false },
        ],
      },
      {
        title: 'Certificate III — Personal Finance Essentials', subtitle: 'The foundations everyone needs',
        pages: '3 weeks', level: 'Beginner', isPaid: true,
        description: 'The essential personal finance certificate — budgeting, insurance, mutual funds, and tax planning, simplified into a 3-week structured program.',
        chapters: [
          { title: 'Week 1: Budgeting & Emergency Funds',  ref: 'Week 1', free: false },
          { title: 'Week 2: Mutual Funds & SIP Strategy',  ref: 'Week 2', free: false },
          { title: 'Week 3: Insurance & Tax Planning',     ref: 'Week 3', free: false },
        ],
      },
    ],
  },

  'nonfinancial-ebooks': {
    title: 'Non-Financial E-books', tag: 'Non-Financial', isPaid: true,
    accent: '#8B5CF6', accentGrad: 'linear-gradient(135deg,#8B5CF6,#7C3AED)',
    contentType: 'ebook',
    description: 'Curated books on behavioral economics, psychology of money, and mindset — the human edge that separates great investors from average ones.',
    stats: { rating: '4.7', reviews: '187', duration: '345 pages total', modules: 2 },
    instructor: { name: 'InvestBeans Editorial', role: 'Behavioral Finance Researchers', avatar: '🧠' },
    whatYouLearn: [
      'Understand cognitive biases that silently hurt returns',
      'Build decision-making frameworks under uncertainty',
      'Develop long-term wealth habits from first principles',
      'Learn from legendary traders\' psychological routines',
      'Master the art of probabilistic thinking',
      'Control FOMO and panic-driven financial decisions',
    ],
    modules: [
      {
        title: 'Book I — The Psychology of Money', subtitle: 'Why behavior beats intelligence',
        pages: 95, level: 'All Levels', isPaid: true,
        description: "Inspired by Morgan Housel's principles — how behavior, not intelligence, ultimately determines who builds lasting wealth and who doesn't.",
        chapters: [
          { title: 'Chapter 1: No One is Crazy',           ref: 'pp. 1–12',  free: false },
          { title: 'Chapter 2: Luck, Risk & Their Roles',  ref: 'pp. 13–24', free: false },
          { title: 'Chapter 3: The Power of Compounding',  ref: 'pp. 25–44', free: false },
          { title: 'Chapter 4: Wealth vs. Rich',           ref: 'pp. 45–62', free: false },
          { title: 'Chapter 5: Save Without a Reason',     ref: 'pp. 63–80', free: false },
          { title: 'Chapter 6: Room for Error',            ref: 'pp. 81–95', free: false },
        ],
      },
      {
        title: 'Book II — Thinking in Bets', subtitle: 'Probabilistic thinking for investors',
        pages: 140, level: 'Intermediate', isPaid: true,
        description: "How poker champion Annie Duke's probabilistic thinking framework applies directly to investment decision-making and trade management.",
        chapters: [
          { title: 'Chapter 1: Life is Poker, Not Chess',   ref: 'pp. 1–20',    free: false },
          { title: 'Chapter 2: The Resulting Bias Trap',    ref: 'pp. 21–50',   free: false },
          { title: 'Chapter 3: Wanna Bet? (Making Offers)', ref: 'pp. 51–80',   free: false },
          { title: 'Chapter 4: Truth-Seeking Groups',       ref: 'pp. 81–110',  free: false },
          { title: 'Chapter 5: Temporal Discounting',       ref: 'pp. 111–140', free: false },
        ],
      },
    ],
  },

  'nonfinancial-tutorials': {
    title: 'Non-Financial Tutorials', tag: 'Non-Financial', isPaid: false,
    accent: '#F43F5E', accentGrad: 'linear-gradient(135deg,#F43F5E,#E11D48)',
    contentType: 'video',
    description: 'Video tutorials on investor mindset, time management, focus, and productivity habits that complement your trading journey.',
    stats: { rating: '4.6', reviews: '453', duration: '1h 12m total', modules: 2 },
    instructor: { name: 'Ananya Krishnan', role: 'Executive Coach & Trader', avatar: '🎯' },
    whatYouLearn: [
      'Build a daily routine aligned with market hours',
      'Manage trading anxiety and emotional discipline',
      'Use trade journaling to accelerate decision-making',
      'Create a distraction-free workspace for deep work',
      'Sleep, exercise, and focus habits of top traders',
      'Build accountability systems for consistent growth',
    ],
    modules: [
      {
        title: 'Session 1 — Building an Investor Mindset', subtitle: 'Think long-term in a short-term world',
        pages: '22 min', level: 'Beginner', isPaid: false,
        description: 'How to think long-term in a short-term world — the psychological foundation every investor needs before putting a single rupee to work.',
        chapters: [
          { title: 'Why Most Retail Investors Lose Money',       ref: '0:00–5:30',  free: true },
          { title: 'The Long-Term Compounding Mindset',          ref: '5:30–13:00', free: true },
          { title: 'Daily Habits of Successful Investors',       ref: '13:00–22:00',free: true },
        ],
      },
      {
        title: 'Session 2 — Managing Risk Psychologically', subtitle: 'Stay process-focused, not outcome-focused',
        pages: '30 min', level: 'Intermediate', isPaid: false,
        description: 'Separate your identity from your trades, handle losses without panic, and stay process-focused — not distracted by short-term outcomes.',
        chapters: [
          { title: 'Loss Aversion & Why We Hold Losers',     ref: '0:00–8:00',  free: true },
          { title: 'Building Emotional Resilience for Trading', ref: '8:00–18:00', free: true },
          { title: 'The Pre-Mortem Technique for Every Trade', ref: '18:00–30:00',free: true },
        ],
      },
    ],
  },
};

// ── Level styles ──────────────────────────────────────────────────────────────

const levelStyle: Record<string, { bg: string; text: string }> = {
  Beginner:     { bg: 'rgba(16,185,129,0.12)',  text: '#34D399' },
  Intermediate: { bg: 'rgba(245,158,11,0.12)',  text: '#FBBF24' },
  Advanced:     { bg: 'rgba(239,68,68,0.12)',   text: '#F87171' },
  'All Levels': { bg: 'rgba(148,163,184,0.12)', text: '#94A3B8' },
};

// ── EducationDetailView ───────────────────────────────────────────────────────

const EducationDetailView = () => {
  const { categoryId } = useParams<{ categoryId: string }>();
  const { theme }      = useTheme();
  const { user }       = useAuth();
  const navigate       = useNavigate();
  const isLight        = theme === 'light';

  const [activeModuleIdx, setActiveModuleIdx] = useState(0);
  const moduleRefs = useRef<(HTMLDivElement | null)[]>([]);

  const data        = CATEGORY_DATA[categoryId || ''];
  const isSubscriber = user?.hasSubscription && user?.subscription?.status === 'active';

  // Scroll to module when ToC entry clicked
  const handleTocClick = (idx: number) => {
    setActiveModuleIdx(idx);
    const el = moduleRefs.current[idx];
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  // Observe which module is in view
  useEffect(() => {
    if (!data) return;
    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const idx = moduleRefs.current.findIndex(r => r === entry.target);
            if (idx !== -1) setActiveModuleIdx(idx);
          }
        });
      },
      { rootMargin: '-30% 0px -60% 0px', threshold: 0 }
    );
    moduleRefs.current.forEach(el => el && observer.observe(el));
    return () => observer.disconnect();
  }, [data]);

  if (!data) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center" style={{ color: isLight ? '#0f172a' : '#fff' }}>
          <div className="text-center">
            <p className="text-2xl font-bold mb-3">Category not found</p>
            <button onClick={() => navigate('/education')}
              className="px-6 py-2 rounded-xl text-sm font-bold text-white"
              style={{ background: 'linear-gradient(135deg,#5194F6,#3a7de0)' }}>
              ← Back to Education
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  // Theme tokens
  const pageBg      = isLight ? 'linear-gradient(160deg,#f5f4f0 0%,#f8fbff 45%,#f5f4f0 100%)' : 'linear-gradient(160deg,#0c1a2e 0%,#0e2038 45%,#0b1825 100%)';
  const cardBg      = isLight ? '#ffffff' : 'rgba(255,255,255,0.04)';
  const tocBg       = isLight ? 'rgba(255,255,255,0.88)' : 'rgba(10,22,40,0.88)';
  const border      = isLight ? 'rgba(226,232,240,0.9)' : 'rgba(255,255,255,0.08)';
  const textPrimary = isLight ? '#0f172a' : '#fff';
  const textMuted   = isLight ? '#6b7280' : 'rgba(148,163,184,0.9)';
  const textFaint   = isLight ? '#9ca3af' : 'rgba(148,163,184,0.55)';

  const contentTypeIcon = data.contentType === 'video' ? <SvgPlay /> : data.contentType === 'certification' ? <span className="text-sm">🎓</span> : <SvgBook />;

  return (
    <Layout>
      <div className="min-h-screen" style={{ background: pageBg }}>

        {/* ── HERO HEADER ─────────────────────────────────────────────── */}
        <div className="relative overflow-hidden py-10 md:py-14" style={{
          background: isLight ? 'linear-gradient(135deg,#f8fbff 0%,#eef4fd 100%)' : 'linear-gradient(135deg,#0a1628 0%,#0c1a2e 100%)',
          borderBottom: isLight ? '1px solid rgba(226,232,240,0.8)' : '1px solid rgba(255,255,255,0.06)',
        }}>
          {/* accent blob */}
          <div className="absolute top-0 right-0 w-96 h-96 rounded-full blur-[120px] pointer-events-none opacity-40"
            style={{ background: `${data.accent}22` }} />

          <div className="container mx-auto px-6 relative z-10">
            {/* Back */}
            <button onClick={() => navigate('/education')}
              className="inline-flex items-center gap-1.5 text-sm font-medium mb-6 transition-all hover:opacity-70"
              style={{ color: data.accent }}>
              <SvgBack /> Back to Learning Hub
            </button>

            <div className="flex flex-col lg:flex-row gap-8">
              {/* Left: meta */}
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-[11px] font-bold px-2.5 py-1 rounded-full"
                    style={{ background: `${data.accent}18`, color: data.accent, border: `1px solid ${data.accent}30` }}>
                    {data.tag}
                  </span>
                  {data.isPaid ? (
                    <span className="flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full"
                      style={{ background: 'rgba(81,148,246,0.12)', color: '#5194F6', border: '1px solid rgba(81,148,246,0.25)' }}>
                      <SvgLock /> Premium
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full"
                      style={{ background: 'rgba(16,185,129,0.12)', color: '#34D399', border: '1px solid rgba(16,185,129,0.25)' }}>
                      <SvgCheck /> Free
                    </span>
                  )}
                </div>

                <h1 className="text-3xl md:text-4xl font-bold mb-3 leading-tight" style={{ color: textPrimary }}>
                  {data.title}
                </h1>
                <p className="text-base leading-relaxed mb-5 max-w-2xl" style={{ color: textMuted }}>
                  {data.description}
                </p>

                {/* Meta row */}
                <div className="flex flex-wrap gap-4 mb-5">
                  <span className="flex items-center gap-1.5 text-sm" style={{ color: textMuted }}>
                    <span className="text-yellow-400"><SvgStar /></span>
                    <strong style={{ color: textPrimary }}>{data.stats.rating}</strong>
                    <span>({data.stats.reviews} reviews)</span>
                  </span>
                  <span className="flex items-center gap-1.5 text-sm" style={{ color: textMuted }}>
                    <span style={{ color: data.accent }}>{contentTypeIcon}</span>
                    {data.stats.duration}
                  </span>
                  <span className="flex items-center gap-1.5 text-sm" style={{ color: textMuted }}>
                    <span style={{ color: data.accent }}><SvgBookOpen /></span>
                    {data.stats.modules} {data.contentType === 'video' ? 'sessions' : data.contentType === 'certification' ? 'certificates' : 'books'}
                  </span>
                </div>

                {/* Instructor */}
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full flex items-center justify-center text-lg flex-shrink-0"
                    style={{ background: `${data.accent}20`, border: `1px solid ${data.accent}30` }}>
                    {data.instructor.avatar}
                  </div>
                  <div>
                    <p className="text-sm font-semibold" style={{ color: textPrimary }}>{data.instructor.name}</p>
                    <p className="text-xs" style={{ color: textMuted }}>{data.instructor.role}</p>
                  </div>
                </div>
              </div>

              {/* Right: CTA card (sticky) */}
              <div className="lg:w-68 xl:w-72 flex-shrink-0">
                <div className="rounded-2xl overflow-hidden sticky top-24" style={{
                  background: cardBg, border: `1px solid ${border}`,
                  boxShadow: isLight ? '0 4px 24px rgba(0,0,0,0.07)' : '0 4px 24px rgba(0,0,0,0.4)',
                }}>
                  <div className="h-1.5 w-full" style={{ background: data.accentGrad }} />
                  <div className="p-5">
                    {data.isPaid ? (
                      <>
                        <p className="text-2xl font-black mb-0.5" style={{ color: textPrimary }}>
                          ₹111 <span className="text-sm font-normal ml-0.5" style={{ color: textMuted }}>/month</span>
                        </p>
                        <p className="text-xs mb-4" style={{ color: textMuted }}>Foundation Plan — All premium content</p>
                        {isSubscriber ? (
                          <div className="w-full py-2.5 rounded-xl text-sm font-bold text-center mb-3"
                            style={{ background: 'rgba(34,197,94,0.12)', color: '#22c55e', border: '1px solid rgba(34,197,94,0.25)' }}>
                            ✓ Already Unlocked
                          </div>
                        ) : (
                          <button
                            onClick={() => navigate('/education/unlock/' + categoryId)}
                            className="w-full py-2.5 rounded-xl text-sm font-bold text-white mb-3 hover:opacity-90 transition-all hover:-translate-y-0.5"
                            style={{ background: data.accentGrad }}>
                            🔓 Unlock Access — ₹111/mo
                          </button>
                        )}
                        <button onClick={() => navigate('/pricing')}
                          className="w-full py-2 rounded-xl text-xs font-medium transition-all"
                          style={{ background: 'transparent', border: `1px solid ${border}`, color: textMuted }}>
                          View all plans →
                        </button>
                      </>
                    ) : (
                      <>
                        <p className="text-2xl font-black mb-0.5" style={{ color: '#34D399' }}>Free</p>
                        <p className="text-xs mb-4" style={{ color: textMuted }}>No subscription required</p>
                        <div className="w-full py-2.5 rounded-xl text-sm font-bold text-center"
                          style={{ background: 'rgba(16,185,129,0.12)', color: '#34D399', border: '1px solid rgba(16,185,129,0.25)' }}>
                          ✓ Open Access
                        </div>
                      </>
                    )}
                    <div className="mt-4 space-y-2">
                      {['Lifetime access after unlock','PDF/video download','Certificate on completion','Mobile & desktop'].map(f => (
                        <div key={f} className="flex items-center gap-2 text-xs" style={{ color: textMuted }}>
                          <span style={{ color: data.accent }}><SvgCheck /></span> {f}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── BOOK READER LAYOUT ──────────────────────────────────────── */}
        <div className="container mx-auto px-4 lg:px-6 py-10">
          <div className="flex gap-7 items-start">

            {/* ── TABLE OF CONTENTS (sticky sidebar) ──────────────────── */}
            <aside className="hidden lg:block w-64 flex-shrink-0 sticky top-24 self-start" style={{
              background: tocBg, border: `1px solid ${border}`,
              borderRadius: 18, backdropFilter: 'blur(16px)', overflow: 'hidden',
            }}>
              {/* ToC header */}
              <div className="px-4 py-3 flex items-center gap-2" style={{
                borderBottom: `1px solid ${border}`,
                background: isLight ? `${data.accent}08` : `${data.accent}12`,
              }}>
                <span style={{ color: data.accent }}><SvgListChecks /></span>
                <p className="text-xs font-bold uppercase tracking-wider" style={{ color: data.accent }}>
                  Table of Contents
                </p>
              </div>

              {/* Module list */}
              <div className="py-2 max-h-[calc(100vh-180px)] overflow-y-auto">
                {data.modules.map((mod: any, i: number) => {
                  const isActive = activeModuleIdx === i;
                  const ls = levelStyle[mod.level] ?? levelStyle['All Levels'];
                  const locked = mod.isPaid && !isSubscriber;
                  return (
                    <div key={i}>
                      {/* Module heading */}
                      <button
                        onClick={() => handleTocClick(i)}
                        className="w-full px-4 py-2.5 flex items-center gap-2.5 text-left transition-all group"
                        style={{
                          background: isActive ? `${data.accent}12` : 'transparent',
                          borderLeft: isActive ? `2px solid ${data.accent}` : '2px solid transparent',
                        }}>
                        <div className="w-5 h-5 rounded-md flex-shrink-0 flex items-center justify-center text-[10px] font-black"
                          style={{ background: isActive ? data.accent : `${data.accent}20`, color: isActive ? '#fff' : data.accent }}>
                          {i + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold leading-snug truncate"
                            style={{ color: isActive ? data.accent : textPrimary }}>
                            {mod.title.split('—')[0].trim()}
                          </p>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="text-[9px] px-1.5 py-0.5 rounded-full font-semibold"
                              style={{ background: ls.bg, color: ls.text }}>{mod.level}</span>
                            {locked && <span style={{ color: '#5194F6' }}><SvgLock /></span>}
                          </div>
                        </div>
                        <SvgChevronRight />
                      </button>
                    </div>
                  );
                })}
              </div>

              {/* ToC footer */}
              {data.isPaid && !isSubscriber && (
                <div className="p-3" style={{ borderTop: `1px solid ${border}` }}>
                  <button
                    onClick={() => navigate(`/education/unlock/${categoryId}`)}
                    className="w-full py-2 rounded-xl text-xs font-bold text-white transition-all hover:opacity-90"
                    style={{ background: data.accentGrad }}>
                    🔓 Unlock All Content
                  </button>
                </div>
              )}
            </aside>

            {/* ── BOOK CONTENT AREA ───────────────────────────────────── */}
            <div className="flex-1 min-w-0 max-w-3xl">

              {/* What you'll learn */}
              <div className="mb-10 rounded-2xl overflow-hidden" style={{
                background: cardBg, border: `1px solid ${border}`,
                boxShadow: isLight ? '0 2px 16px rgba(0,0,0,0.04)' : 'none',
              }}>
                <div className="px-6 py-4 flex items-center gap-2" style={{
                  borderBottom: `1px solid ${border}`,
                  background: isLight ? `${data.accent}06` : `${data.accent}10`,
                }}>
                  <span style={{ color: data.accent }}><SvgBookOpen /></span>
                  <h2 className="text-sm font-bold uppercase tracking-wider" style={{ color: data.accent }}>
                    What You'll Learn
                  </h2>
                </div>
                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2.5">
                  {data.whatYouLearn.map((item: string, i: number) => (
                    <div key={i} className="flex items-start gap-2.5 text-sm" style={{ color: textMuted }}>
                      <span className="mt-0.5 flex-shrink-0" style={{ color: data.accent }}><SvgCheck /></span>
                      {item}
                    </div>
                  ))}
                </div>
              </div>

              {/* ── MODULE CARDS (book chapters) ──────────────────────── */}
              <div className="space-y-8 mb-10">
                {data.modules.map((mod: any, i: number) => {
                  const ls    = levelStyle[mod.level] ?? levelStyle['All Levels'];
                  const locked = mod.isPaid && !isSubscriber;

                  return (
                    <div
                      key={i}
                      ref={el => { moduleRefs.current[i] = el; }}
                      style={{ scrollMarginTop: 100 }}>

                      {/* Book divider line with module number */}
                      <div className="flex items-center gap-3 mb-5">
                        <div className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-black text-white"
                          style={{ background: data.accentGrad }}>
                          {i + 1}
                        </div>
                        <div className="flex-1 h-px" style={{ background: `linear-gradient(90deg,${data.accent}40,transparent)` }} />
                      </div>

                      {/*
                        Premium module → wrap with RequireSubscription (blur mode)
                        Free module    → show normally
                      */}
                      {locked ? (
                        <RequireSubscription
                          mode="blur"
                          title={`${mod.title.split('—')[0].trim()} — Premium`}
                          description="Subscribe to unlock this module and all premium content."
                          ctaText="Unlock Access"
                          ctaHref={`/education/unlock/${categoryId}`}
                          className="rounded-2xl">

                          {/* Module card (will be blurred for non-subscribers) */}
                          <ModuleCard
                            mod={mod} idx={i} data={data} isLight={isLight}
                            cardBg={cardBg} border={border} ls={ls}
                            textPrimary={textPrimary} textMuted={textMuted} textFaint={textFaint}
                            locked={locked} isSubscriber={isSubscriber}
                            categoryId={categoryId} navigate={navigate}
                          />
                        </RequireSubscription>
                      ) : (
                        <ModuleCard
                          mod={mod} idx={i} data={data} isLight={isLight}
                          cardBg={cardBg} border={border} ls={ls}
                          textPrimary={textPrimary} textMuted={textMuted} textFaint={textFaint}
                          locked={locked} isSubscriber={isSubscriber}
                          categoryId={categoryId} navigate={navigate}
                        />
                      )}
                    </div>
                  );
                })}
              </div>

              {/* ── BOTTOM CTA ───────────────────────────────────────── */}
              {data.isPaid && !isSubscriber && (
                <div className="rounded-2xl p-8 text-center" style={{
                  background: `linear-gradient(135deg,${data.accent}10,${data.accent}05)`,
                  border: `1px dashed ${data.accent}30`,
                }}>
                  <div className="w-12 h-12 rounded-xl mx-auto flex items-center justify-center mb-4"
                    style={{ background: `${data.accent}15`, color: data.accent, border: `1px solid ${data.accent}25` }}>
                    <SvgLock />
                  </div>
                  <p className="text-lg font-bold mb-2" style={{ color: textPrimary }}>
                    Unlock the full {data.contentType === 'video' ? 'course' : data.contentType === 'certification' ? 'certification program' : 'library'}
                  </p>
                  <p className="text-sm mb-5 max-w-md mx-auto" style={{ color: textMuted }}>
                    Get full access to all {data.modules.length} {data.contentType === 'video' ? 'sessions' : 'books'} with a Foundation Plan.
                  </p>
                  <button
                    onClick={() => navigate(`/education/unlock/${categoryId}`)}
                    className="inline-flex items-center gap-2 px-8 py-3 rounded-xl font-bold text-sm text-white hover:opacity-90 transition-all hover:-translate-y-0.5"
                    style={{ background: data.accentGrad, boxShadow: `0 4px 20px ${data.accent}35` }}>
                    🔓 Unlock Access — ₹111/month
                  </button>
                </div>
              )}

            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

// ── ModuleCard — the "book chapter" component ─────────────────────────────────

function ModuleCard({ mod, idx, data, isLight, cardBg, border, ls, textPrimary, textMuted, textFaint, locked, isSubscriber, categoryId, navigate }: any) {
  const isVideo = data.contentType === 'video';

  return (
    <div className="rounded-2xl overflow-hidden" style={{
      background: cardBg, border: `1px solid ${border}`,
      boxShadow: isLight ? '0 2px 20px rgba(0,0,0,0.05)' : 'none',
    }}>

      {/* Module accent strip */}
      <div className="h-0.5 w-full" style={{ background: data.accentGrad }} />

      {/* Module header */}
      <div className="px-6 pt-6 pb-4">
        <div className="flex items-start justify-between gap-4 mb-3">
          <div>
            <h3 className="text-lg font-bold leading-snug mb-1" style={{ color: textPrimary }}>
              {mod.title}
            </h3>
            <p className="text-sm italic" style={{ color: data.accent, opacity: 0.85 }}>
              {mod.subtitle}
            </p>
          </div>
          <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
            <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full"
              style={{ background: ls.bg, color: ls.text }}>{mod.level}</span>
            <span className="text-xs flex items-center gap-1" style={{ color: textFaint }}>
              <SvgClock /> {typeof mod.pages === 'number' ? `${mod.pages} pages` : mod.pages}
            </span>
          </div>
        </div>
        <p className="text-sm leading-relaxed" style={{ color: textMuted }}>
          {mod.description}
        </p>
      </div>

      {/* Chapter divider */}
      <div className="mx-6 mb-0" style={{ height: 1, background: `linear-gradient(90deg,${data.accent}25,transparent)` }} />

      {/* Chapter list (book-format table) */}
      <div className="px-6 pb-5 pt-4">
        <p className="text-[10px] font-bold uppercase tracking-widest mb-3" style={{ color: textFaint }}>
          {isVideo ? 'Segments' : 'Chapters'}
        </p>
        <div className="space-y-0">
          {mod.chapters.map((ch: any, j: number) => {
            const chLocked = !ch.free && !isSubscriber && data.isPaid;
            return (
              <div key={j} className="flex items-center gap-3 py-2.5 group transition-all"
                style={{ borderBottom: j < mod.chapters.length - 1 ? `1px solid ${isLight ? 'rgba(226,232,240,0.6)' : 'rgba(255,255,255,0.05)'}` : 'none' }}>

                {/* Chapter number / icon */}
                <div className="w-7 h-7 rounded-lg flex-shrink-0 flex items-center justify-center text-[11px] font-black transition-all"
                  style={{
                    background: chLocked ? (isLight ? 'rgba(226,232,240,0.7)' : 'rgba(255,255,255,0.06)') : `${data.accent}18`,
                    color: chLocked ? textFaint : data.accent,
                  }}>
                  {chLocked ? <SvgLock /> : (isVideo ? <SvgPlay /> : (j + 1))}
                </div>

                {/* Title */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate transition-colors"
                    style={{ color: chLocked ? textFaint : textPrimary, opacity: chLocked ? 0.65 : 1 }}>
                    {ch.title}
                  </p>
                </div>

                {/* Page/time ref */}
                <span className="text-xs flex-shrink-0 tabular-nums font-mono"
                  style={{ color: textFaint }}>{ch.ref}</span>

                {/* Badge */}
                {ch.free && (
                  <span className="text-[9px] font-black px-2 py-0.5 rounded-full flex-shrink-0"
                    style={{ background: 'rgba(16,185,129,0.12)', color: '#34D399', letterSpacing: '0.04em' }}>
                    FREE
                  </span>
                )}
                {chLocked && (
                  <button
                    onClick={() => navigate(`/education/unlock/${categoryId}`)}
                    className="text-[9px] font-black px-2 py-0.5 rounded-full flex-shrink-0 transition-all hover:opacity-80"
                    style={{ background: 'rgba(81,148,246,0.12)', color: '#5194F6', border: '1px solid rgba(81,148,246,0.20)', letterSpacing: '0.04em' }}>
                    UNLOCK
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Download / Access CTA for free unlocked modules */}
      {(!mod.isPaid || isSubscriber) && (
        <div className="mx-6 mb-5">
          <button className="w-full py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all hover:opacity-80"
            style={{
              background: isLight ? `${data.accent}10` : `${data.accent}15`,
              color: data.accent, border: `1px solid ${data.accent}25`,
            }}>
            <SvgDownload /> {isVideo ? 'Watch Now' : 'Download PDF'}
          </button>
        </div>
      )}
    </div>
  );
}

export default EducationDetailView;