/**
 * EducationDetailView.tsx
 * Route: /education/:categoryId
 *
 * "Start Learning" detail page for each education category.
 * Shows full content list, sourced-style data (Angel One layout),
 * with lock gates on premium items.
 */

import React, { useState } from 'react';
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
  <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" /><polygon points="10 8 16 12 10 16 10 8" />
  </svg>
);
const SvgBook = () => (
  <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
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
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  </svg>
);
const SvgUsers = () => (
  <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);
const SvgChart = () => (
  <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" />
  </svg>
);
const SvgDownload = () => (
  <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" />
  </svg>
);

// ── Content Data (Angel One style — rich mock data) ───────────────────────────

const CATEGORY_DATA: Record<string, any> = {
  'financial-ebooks': {
    title: 'Financial E-books',
    tag: 'Financial',
    isPaid: true,
    accent: '#3B82F6',
    accentGrad: 'linear-gradient(135deg,#3B82F6,#4F46E5)',
    description: 'Curated financial guides written by market experts. From equity basics to advanced portfolio theory — available as downloadable PDFs.',
    stats: { learners: '4,200+', rating: '4.9', reviews: '312', duration: '480 pages total' },
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
        title: 'Module 1: Fundamentals of Equity Investing',
        pages: 120, level: 'Beginner', isPaid: false,
        description: "A complete beginner's guide to stock markets, Demat accounts, how IPOs work, and the basics of equity valuation.",
        chapters: [
          { title: 'What is the Stock Market?', pages: '1–18', free: true },
          { title: 'Opening a Demat & Trading Account', pages: '19–32', free: true },
          { title: 'Understanding Sensex & Nifty', pages: '33–52', free: true },
          { title: 'How to Read a Stock Quote', pages: '53–74', free: false },
          { title: 'Basics of Equity Valuation (P/E, P/B)', pages: '75–98', free: false },
          { title: 'Investing vs. Trading', pages: '99–120', free: false },
        ],
      },
      {
        title: 'Module 2: Advanced Portfolio Management',
        pages: 200, level: 'Advanced', isPaid: true,
        description: 'Deep-dive into Modern Portfolio Theory, asset allocation strategies, rebalancing, and building a wealth compounding machine.',
        chapters: [
          { title: 'Modern Portfolio Theory Explained', pages: '1–28', free: false },
          { title: 'Asset Allocation: Equity vs Debt vs Gold', pages: '29–60', free: false },
          { title: 'Systematic Investment Planning (SIP)', pages: '61–88', free: false },
          { title: 'Portfolio Rebalancing Strategies', pages: '89–120', free: false },
          { title: 'Tax Harvesting & LTCG Optimization', pages: '121–158', free: false },
          { title: 'Building a ₹1 Crore Portfolio', pages: '159–200', free: false },
        ],
      },
      {
        title: 'Module 3: Global Markets Decoded',
        pages: 160, level: 'Intermediate', isPaid: true,
        description: "Understand how US Fed rate decisions, China's economy, and global commodity prices impact Indian equity and currency markets.",
        chapters: [
          { title: 'US Federal Reserve & Indian Markets', pages: '1–30', free: false },
          { title: 'Dollar-Rupee Dynamics', pages: '31–58', free: false },
          { title: 'Crude Oil & Its Impact on India', pages: '59–90', free: false },
          { title: 'FII/DII Flow Analysis', pages: '91–120', free: false },
          { title: 'China Risk & Emerging Market Rotation', pages: '121–160', free: false },
        ],
      },
    ],
  },

  'financial-tutorials': {
    title: 'Financial Tutorials',
    tag: 'Financial',
    isPaid: false,
    accent: '#10B981',
    accentGrad: 'linear-gradient(135deg,#10B981,#059669)',
    description: 'HD video tutorials covering chart reading, technical analysis, options trading, and more — taught by practicing traders.',
    stats: { learners: '9,800+', rating: '4.8', reviews: '741', duration: '3h 15m total' },
    instructor: { name: 'Rajiv Menon & Team', role: 'NSE Certified Technical Analyst', avatar: '📈' },
    whatYouLearn: [
      'Read candlestick charts and identify patterns',
      'Use RSI, MACD, Bollinger Bands in real trades',
      'Understand options Greeks: Delta, Theta, Gamma',
      'Execute a systematic trading plan',
      'Backtest strategies on historical data',
      'Manage risk with stop-losses and position sizing',
    ],
    modules: [
      {
        title: 'Video 1: How to Read a Balance Sheet',
        pages: '18 min', level: 'Beginner', isPaid: false,
        description: 'Demystify the three financial statements — balance sheet, P&L, and cash flow — and learn to spot healthy vs. stressed companies.',
        chapters: [
          { title: 'What is a Balance Sheet?', pages: '0:00–3:20', free: true },
          { title: 'Assets, Liabilities & Equity Explained', pages: '3:20–8:45', free: true },
          { title: 'Reading the P&L Statement', pages: '8:45–14:00', free: true },
          { title: 'Cash Flow Analysis', pages: '14:00–18:00', free: true },
        ],
      },
      {
        title: 'Video 2: Technical Analysis Masterclass',
        pages: '45 min', level: 'Intermediate', isPaid: false,
        description: 'A comprehensive session on chart patterns, moving averages, and momentum indicators used by Angel One & Zerodha traders.',
        chapters: [
          { title: 'Introduction to Candlestick Charts', pages: '0:00–8:00', free: true },
          { title: 'Support & Resistance Levels', pages: '8:00–18:30', free: true },
          { title: 'Moving Averages (SMA, EMA)', pages: '18:30–28:00', free: true },
          { title: 'RSI & MACD Indicators', pages: '28:00–38:00', free: true },
          { title: 'Live Trade Example', pages: '38:00–45:00', free: true },
        ],
      },
      {
        title: 'Video 3: Options Trading Explained',
        pages: '32 min', level: 'Advanced', isPaid: false,
        description: 'Everything you need to understand Call and Put options, Option Chain reading, and basic strategies like Covered Call & Bull Spread.',
        chapters: [
          { title: 'What are Options? Call vs Put', pages: '0:00–7:00', free: true },
          { title: 'Option Chain Reading (NSE Format)', pages: '7:00–15:00', free: true },
          { title: 'Greeks: Delta, Theta, IV', pages: '15:00–24:00', free: true },
          { title: 'Covered Call & Bull Spread Strategy', pages: '24:00–32:00', free: true },
        ],
      },
    ],
  },

  'financial-certifications': {
    title: 'Financial Certifications',
    tag: 'Financial',
    isPaid: true,
    accent: '#D4A843',
    accentGrad: 'linear-gradient(135deg,#D4A843,#F59E0B)',
    description: 'Earn InvestBeans-verified certificates that demonstrate real financial market knowledge to employers, clients, and peers.',
    stats: { learners: '1,400+', rating: '4.9', reviews: '198', duration: '17 weeks total' },
    instructor: { name: 'Dr. Priya Sharma', role: 'PhD Finance, IIM Alumni', avatar: '🎓' },
    whatYouLearn: [
      'Analyze equities using DCF and comparable analysis',
      'Structure a diversified mutual fund portfolio',
      'Understand SEBI regulations and investor protection',
      'Model options payoffs and risk scenarios',
      'Build an investment thesis for any stock',
      'Pass NISM/NCFM-equivalent assessments',
    ],
    modules: [
      {
        title: 'Cert 1: Certified Equity Analyst',
        pages: '6 weeks', level: 'Intermediate', isPaid: true,
        description: 'A structured 6-week program to master equity research — fundamental analysis, valuation, and portfolio construction.',
        chapters: [
          { title: 'Week 1: Financial Statement Analysis', pages: 'Week 1', free: false },
          { title: 'Week 2: Valuation Methods (DCF, P/E)', pages: 'Week 2', free: false },
          { title: 'Week 3: Sector & Industry Analysis', pages: 'Week 3', free: false },
          { title: 'Week 4: Building an Investment Thesis', pages: 'Week 4', free: false },
          { title: 'Week 5: Portfolio Construction', pages: 'Week 5', free: false },
          { title: 'Week 6: Final Assessment + Certificate', pages: 'Week 6', free: false },
        ],
      },
      {
        title: 'Cert 2: Options & Derivatives Professional',
        pages: '8 weeks', level: 'Advanced', isPaid: true,
        description: 'For traders who want to master F&O — futures pricing, options strategies, and risk management.',
        chapters: [
          { title: 'Week 1-2: Futures Pricing & Hedging', pages: 'Week 1–2', free: false },
          { title: 'Week 3-4: Options Strategies', pages: 'Week 3–4', free: false },
          { title: 'Week 5-6: Greeks & Volatility', pages: 'Week 5–6', free: false },
          { title: 'Week 7-8: Live Markets + Exam', pages: 'Week 7–8', free: false },
        ],
      },
      {
        title: 'Cert 3: Personal Finance Essentials',
        pages: '3 weeks', level: 'Beginner', isPaid: true,
        description: 'The essential personal finance certificate — budgeting, insurance, mutual funds, and tax planning simplified.',
        chapters: [
          { title: 'Week 1: Budgeting & Emergency Funds', pages: 'Week 1', free: false },
          { title: 'Week 2: Mutual Funds & SIPs', pages: 'Week 2', free: false },
          { title: 'Week 3: Insurance & Tax Planning', pages: 'Week 3', free: false },
        ],
      },
    ],
  },

  'nonfinancial-ebooks': {
    title: 'Non-Financial E-books',
    tag: 'Non-Financial',
    isPaid: true,
    accent: '#8B5CF6',
    accentGrad: 'linear-gradient(135deg,#8B5CF6,#7C3AED)',
    description: 'Curated books on behavioral economics, psychology of money, and mindset — the human edge that separates great investors from average ones.',
    stats: { learners: '2,100+', rating: '4.7', reviews: '187', duration: '345 pages total' },
    instructor: { name: 'InvestBeans Editorial', role: 'Behavioral Finance Researchers', avatar: '🧠' },
    whatYouLearn: [
      'Understand cognitive biases that hurt investor returns',
      'Build decision-making frameworks under uncertainty',
      'Develop long-term wealth habits from first principles',
      'Learn from legendary traders psychological routines',
      'Master the art of probabilistic thinking',
      'Control FOMO and panic-driven financial decisions',
    ],
    modules: [
      {
        title: 'Book 1: The Psychology of Money',
        pages: 95, level: 'All Levels', isPaid: true,
        description: "Inspired by Morgan Housel's principles — how behavior, not intelligence, determines financial success.",
        chapters: [
          { title: 'Chapter 1: No One is Crazy', pages: '1–12', free: false },
          { title: 'Chapter 2: Luck & Risk', pages: '13–24', free: false },
          { title: 'Chapter 3: The Power of Compounding', pages: '25–44', free: false },
          { title: 'Chapter 4: Wealth vs. Rich', pages: '45–62', free: false },
          { title: 'Chapter 5: Save Without a Reason', pages: '63–80', free: false },
          { title: 'Chapter 6: Room for Error', pages: '81–95', free: false },
        ],
      },
      {
        title: 'Book 2: Thinking in Bets',
        pages: 140, level: 'Intermediate', isPaid: true,
        description: "How poker champion Annie Duke's probabilistic thinking framework applies directly to investment decision-making.",
        chapters: [
          { title: 'Chapter 1: Life is Poker, Not Chess', pages: '1–20', free: false },
          { title: 'Chapter 2: Resulting Bias', pages: '21–50', free: false },
          { title: 'Chapter 3: Wanna Bet?', pages: '51–80', free: false },
          { title: 'Chapter 4: Truth-Seeking Groups', pages: '81–110', free: false },
          { title: 'Chapter 5: Temporal Discounting', pages: '111–140', free: false },
        ],
      },
    ],
  },

  'nonfinancial-tutorials': {
    title: 'Non-Financial Tutorials',
    tag: 'Non-Financial',
    isPaid: false,
    accent: '#F43F5E',
    accentGrad: 'linear-gradient(135deg,#F43F5E,#E11D48)',
    description: 'Video tutorials on investor mindset, time management, focus, and productivity habits that complement your trading journey.',
    stats: { learners: '6,200+', rating: '4.6', reviews: '453', duration: '1h 12m total' },
    instructor: { name: 'Ananya Krishnan', role: 'Executive Coach & Trader', avatar: '🎯' },
    whatYouLearn: [
      'Build a daily routine aligned with market hours',
      'Manage trading anxiety and emotional discipline',
      'Use journaling to improve decision-making',
      'Create a distraction-free workspace for deep work',
      'Sleep, exercise, and focus habits of top traders',
      'Build accountability systems for consistent growth',
    ],
    modules: [
      {
        title: 'Video 1: Building an Investor Mindset',
        pages: '22 min', level: 'Beginner', isPaid: false,
        description: 'How to think long-term in a short-term world — the psychological foundation every investor needs before buying a single stock.',
        chapters: [
          { title: 'Why Most Investors Lose Money', pages: '0:00–5:30', free: true },
          { title: 'The Long-Term Compounding Mindset', pages: '5:30–13:00', free: true },
          { title: 'Daily Habits of Successful Investors', pages: '13:00–22:00', free: true },
        ],
      },
      {
        title: 'Video 2: Managing Risk Psychologically',
        pages: '30 min', level: 'Intermediate', isPaid: false,
        description: 'Learn to separate your identity from your trades, handle losses without panic, and stay process-focused not outcome-focused.',
        chapters: [
          { title: 'Loss Aversion & Why We Hold Losers', pages: '0:00–8:00', free: true },
          { title: 'Building Emotional Resilience', pages: '8:00–18:00', free: true },
          { title: 'The Pre-Mortem Technique for Trades', pages: '18:00–30:00', free: true },
        ],
      },
    ],
  },
};

// ── Level badge helper ────────────────────────────────────────────────────────

const levelStyle: Record<string, { bg: string; text: string }> = {
  Beginner:     { bg: 'rgba(16,185,129,0.12)',  text: '#34D399' },
  Intermediate: { bg: 'rgba(245,158,11,0.12)',  text: '#FBBF24' },
  Advanced:     { bg: 'rgba(239,68,68,0.12)',   text: '#F87171' },
  'All Levels': { bg: 'rgba(148,163,184,0.12)', text: '#94A3B8' },
};

// ── EducationDetailView ───────────────────────────────────────────────────────

const EducationDetailView = () => {
  const { categoryId } = useParams<{ categoryId: string }>();
  const { theme } = useTheme();
  const { user } = useAuth();
  const navigate = useNavigate();
  const isLight = theme === 'light';
  const [expandedModule, setExpandedModule] = useState<number | null>(0);

  const data = CATEGORY_DATA[categoryId || ''];

  const isSubscriber = user?.hasSubscription && user?.subscription?.status === 'active';

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

  const pageBg = isLight
    ? 'linear-gradient(160deg,#f5f4f0 0%,#f8fbff 45%,#f5f4f0 100%)'
    : 'linear-gradient(160deg,#0c1a2e 0%,#0e2038 45%,#0b1825 100%)';

  const cardBg  = isLight ? '#ffffff' : 'rgba(255,255,255,0.04)';
  const border  = isLight ? 'rgba(226,232,240,0.9)' : 'rgba(255,255,255,0.08)';
  const textPrimary = isLight ? '#0f172a' : '#fff';
  const textMuted   = isLight ? '#6b7280' : 'rgba(148,163,184,0.9)';

  return (
    <Layout>
      <div className="min-h-screen" style={{ background: pageBg }}>

        {/* ── HERO HEADER ────────────────────────────────────────────── */}
        <div className="relative overflow-hidden py-10 md:py-14" style={{
          background: isLight
            ? 'linear-gradient(135deg,#f8fbff 0%,#eef4fd 100%)'
            : 'linear-gradient(135deg,#0a1628 0%,#0c1a2e 100%)',
          borderBottom: isLight ? '1px solid rgba(226,232,240,0.8)' : '1px solid rgba(255,255,255,0.06)',
        }}>
          <div className="absolute top-0 right-0 w-80 h-80 rounded-full blur-[100px] pointer-events-none opacity-50"
            style={{ background: `${data.accent}22` }} />

          <div className="container mx-auto px-6 relative z-10">
            {/* Back button */}
            <button onClick={() => navigate('/education')}
              className="inline-flex items-center gap-1.5 text-sm font-medium mb-6 transition-all hover:opacity-70"
              style={{ color: data.accent }}>
              <SvgBack /> Back to Education
            </button>

            <div className="flex flex-col lg:flex-row gap-8">
              {/* Left: info */}
              <div className="flex-1">
                {/* Tags */}
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

                {/* Stats row */}
                <div className="flex flex-wrap gap-4 mb-5">
                  <span className="flex items-center gap-1.5 text-sm" style={{ color: textMuted }}>
                    <SvgUsers /> <strong style={{ color: textPrimary }}>{data.stats.learners}</strong> learners
                  </span>
                  <span className="flex items-center gap-1.5 text-sm" style={{ color: textMuted }}>
                    <span className="text-yellow-400"><SvgStar /></span>
                    <strong style={{ color: textPrimary }}>{data.stats.rating}</strong>
                    <span>({data.stats.reviews} reviews)</span>
                  </span>
                  <span className="flex items-center gap-1.5 text-sm" style={{ color: textMuted }}>
                    <SvgClock /> {data.stats.duration}
                  </span>
                </div>

                {/* Instructor */}
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full flex items-center justify-center text-lg"
                    style={{ background: `${data.accent}20`, border: `1px solid ${data.accent}30` }}>
                    {data.instructor.avatar}
                  </div>
                  <div>
                    <p className="text-sm font-semibold" style={{ color: textPrimary }}>{data.instructor.name}</p>
                    <p className="text-xs" style={{ color: textMuted }}>{data.instructor.role}</p>
                  </div>
                </div>
              </div>

              {/* Right: CTA card */}
              <div className="lg:w-72 flex-shrink-0">
                <div className="rounded-2xl overflow-hidden sticky top-24" style={{
                  background: cardBg, border: `1px solid ${border}`,
                  boxShadow: isLight ? '0 4px 24px rgba(0,0,0,0.07)' : '0 4px 24px rgba(0,0,0,0.4)',
                }}>
                  {/* Gradient top bar */}
                  <div className="h-1.5 w-full" style={{ background: data.accentGrad }} />
                  <div className="p-5">
                    {data.isPaid ? (
                      <>
                        <p className="text-2xl font-black mb-1" style={{ color: textPrimary }}>₹111<span className="text-sm font-normal ml-1" style={{ color: textMuted }}>/month</span></p>
                        <p className="text-xs mb-4" style={{ color: textMuted }}>Foundation Plan — Unlock all premium content</p>
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
                        <button
                          onClick={() => navigate('/pricing')}
                          className="w-full py-2 rounded-xl text-xs font-medium transition-all"
                          style={{ background: 'transparent', border: `1px solid ${border}`, color: textMuted }}>
                          View all plans
                        </button>
                      </>
                    ) : (
                      <>
                        <p className="text-2xl font-black mb-1" style={{ color: '#34D399' }}>Free</p>
                        <p className="text-xs mb-4" style={{ color: textMuted }}>No subscription required</p>
                        <div className="w-full py-2.5 rounded-xl text-sm font-bold text-center mb-3"
                          style={{ background: 'rgba(16,185,129,0.12)', color: '#34D399', border: '1px solid rgba(16,185,129,0.25)' }}>
                          ✓ Free Access
                        </div>
                      </>
                    )}

                    <div className="mt-3 space-y-1.5">
                      {['Lifetime access after unlock', 'PDF/video download included', 'Certificate on completion', 'Mobile & desktop access'].map(f => (
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

        {/* ── BODY ───────────────────────────────────────────────────── */}
        <div className="container mx-auto px-6 py-10">
          <div className="max-w-3xl">

            {/* What you'll learn */}
            <div className="mb-10 rounded-2xl p-6" style={{ background: cardBg, border: `1px solid ${border}` }}>
              <h2 className="text-lg font-bold mb-4" style={{ color: textPrimary }}>What you'll learn</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                {data.whatYouLearn.map((item: string) => (
                  <div key={item} className="flex items-start gap-2.5 text-sm" style={{ color: textMuted }}>
                    <span className="mt-0.5 flex-shrink-0" style={{ color: data.accent }}><SvgCheck /></span>
                    {item}
                  </div>
                ))}
              </div>
            </div>

            {/* Content modules */}
            <h2 className="text-lg font-bold mb-4" style={{ color: textPrimary }}>Course Content</h2>
            <div className="space-y-3 mb-10">
              {data.modules.map((mod: any, i: number) => {
                const ls = levelStyle[mod.level] ?? levelStyle['All Levels'];
                const isExpanded = expandedModule === i;
                return (
                  <div key={i} className="rounded-2xl overflow-hidden transition-all" style={{
                    background: cardBg, border: `1px solid ${isExpanded ? data.accent + '44' : border}`,
                  }}>
                    {/* Module header */}
                    <button
                      onClick={() => setExpandedModule(isExpanded ? null : i)}
                      className="w-full flex items-center justify-between p-5 text-left gap-3 transition-all">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-xl flex-shrink-0 flex items-center justify-center text-sm font-bold"
                          style={{ background: `${data.accent}18`, color: data.accent }}>
                          {i + 1}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-bold truncate" style={{ color: textPrimary }}>{mod.title}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-xs" style={{ color: textMuted }}>
                              {typeof mod.pages === 'number' ? `${mod.pages} pages` : mod.pages}
                            </span>
                            <span className="w-1 h-1 rounded-full" style={{ background: textMuted }} />
                            <span className="text-[11px] font-semibold px-1.5 py-0.5 rounded-full"
                              style={{ background: ls.bg, color: ls.text }}>{mod.level}</span>
                            {mod.isPaid && !isSubscriber && (
                              <span className="flex items-center gap-0.5 text-[11px] font-semibold"
                                style={{ color: '#5194F6' }}><SvgLock /> Premium</span>
                            )}
                          </div>
                        </div>
                      </div>
                      <span className="flex-shrink-0 transition-transform duration-200" style={{
                        color: textMuted,
                        transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
                      }}>
                        <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4" stroke="currentColor" strokeWidth="2">
                          <polyline points="9 18 15 12 9 6" />
                        </svg>
                      </span>
                    </button>

                    {/* Expanded chapters */}
                    {isExpanded && (
                      <div style={{ borderTop: `1px solid ${border}` }}>
                        <p className="px-5 py-3 text-xs leading-relaxed" style={{ color: textMuted }}>
                          {mod.description}
                        </p>
                        {mod.chapters.map((ch: any, j: number) => {
                          const locked = !ch.free && !isSubscriber && data.isPaid;
                          return (
                            <div key={j}
                              className="flex items-center gap-3 px-5 py-3 transition-all hover:bg-white/5"
                              style={{ borderTop: `1px solid ${border}` }}>
                              <div className="w-6 h-6 rounded-lg flex-shrink-0 flex items-center justify-center"
                                style={{
                                  background: locked ? 'rgba(148,163,184,0.10)' : `${data.accent}15`,
                                  color: locked ? 'rgba(148,163,184,0.5)' : data.accent,
                                }}>
                                {locked ? <SvgLock /> : (data.isPaid ? <SvgBook /> : <SvgPlay />)}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm truncate" style={{
                                  color: locked ? textMuted : textPrimary,
                                  opacity: locked ? 0.6 : 1,
                                }}>
                                  {ch.title}
                                </p>
                              </div>
                              <span className="text-xs flex-shrink-0" style={{ color: textMuted }}>{ch.pages}</span>
                              {ch.free && (
                                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0"
                                  style={{ background: 'rgba(16,185,129,0.12)', color: '#34D399' }}>
                                  FREE
                                </span>
                              )}
                              {locked && (
                                <button
                                  onClick={() => navigate(`/education/unlock/${categoryId}`)}
                                  className="text-[10px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0 transition-all hover:opacity-80"
                                  style={{ background: 'rgba(81,148,246,0.12)', color: '#5194F6', border: '1px solid rgba(81,148,246,0.20)' }}>
                                  UNLOCK
                                </button>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Bottom CTA */}
            {data.isPaid && !isSubscriber && (
              <div className="rounded-2xl p-8 text-center" style={{
                background: `linear-gradient(135deg,${data.accent}12,${data.accent}06)`,
                border: `1px solid ${data.accent}25`,
              }}>
                <p className="text-xl font-bold mb-2" style={{ color: textPrimary }}>Ready to unlock this content?</p>
                <p className="text-sm mb-5" style={{ color: textMuted }}>
                  Get full access to all {data.modules.length} modules with a Foundation Plan subscription.
                </p>
                <button
                  onClick={() => navigate(`/education/unlock/${categoryId}`)}
                  className="inline-flex items-center gap-2 px-8 py-3 rounded-xl font-bold text-sm text-white hover:opacity-90 transition-all hover:-translate-y-0.5"
                  style={{ background: data.accentGrad }}>
                  🔓 Unlock — ₹111/month
                </button>
              </div>
            )}

          </div>
        </div>
      </div>
    </Layout>
  );
};

export default EducationDetailView;