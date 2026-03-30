/**
 * EducationUnlockPage.tsx
 * Route: /education/unlock/:categoryId
 *
 * Paywall page that gates premium education content.
 * Shows if user is NOT subscribed; redirects to checkout if they choose a plan.
 * If user IS subscribed, redirects back to the detail page automatically.
 */

import React, { useEffect } from 'react';
import Layout from '@/components/Layout';
import { useParams, useNavigate } from 'react-router-dom';
import { useTheme } from '@/controllers/Themecontext';
import { useAuth } from '@/controllers/AuthContext';

// ── SVG Icons ─────────────────────────────────────────────────────────────────

const SvgLock = () => (
  <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
);
const SvgCheck = () => (
  <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);
const SvgBack = () => (
  <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="15 18 9 12 15 6" />
  </svg>
);
const SvgBook = () => (
  <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
  </svg>
);
const SvgVideo = () => (
  <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="23 7 16 12 23 17 23 7" /><rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
  </svg>
);
const SvgAward = () => (
  <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="8" r="7" /><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88" />
  </svg>
);
const SvgShield = () => (
  <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
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
const SvgRefresh = () => (
  <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="23 4 23 10 17 10" /><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
  </svg>
);

// ── Category display names ─────────────────────────────────────────────────────

const CATEGORY_NAMES: Record<string, string> = {
  'financial-ebooks':       'Financial E-books',
  'financial-tutorials':    'Financial Tutorials',
  'financial-certifications':'Financial Certifications',
  'nonfinancial-ebooks':    'Non-Financial E-books',
  'nonfinancial-tutorials': 'Non-Financial Tutorials',
};

// ── Foundation plan benefits ───────────────────────────────────────────────────

const PLAN_BENEFITS = [
  { icon: SvgBook,    text: 'All 3 Financial E-books (480+ pages)' },
  { icon: SvgVideo,   text: 'All Tutorial Videos (Financial & Non-Financial)' },
  { icon: SvgAward,   text: '3 Verified Certifications' },
  { icon: SvgDownload,text: 'PDF downloads for offline reading' },
  { icon: SvgShield,  text: 'Non-Financial mindset & psychology books' },
  { icon: SvgRefresh, text: 'New content added every month' },
];

// ── Testimonials ──────────────────────────────────────────────────────────────

const TESTIMONIALS = [
  {
    name: 'Rohit Agarwal',
    role: 'Retail Investor, Delhi',
    avatar: 'RA',
    text: 'The equity analyst cert gave me the confidence to analyze stocks myself instead of relying on tips.',
    stars: 5,
  },
  {
    name: 'Priya Nair',
    role: 'Software Engineer, Bangalore',
    avatar: 'PN',
    text: 'I read all 3 e-books in 2 weeks. My portfolio has outperformed the Nifty by 12% since.',
    stars: 5,
  },
  {
    name: 'Arjun Shah',
    role: 'MBA Student, Mumbai',
    avatar: 'AS',
    text: "Best ₹111 I've spent. The psychology of money book alone changed how I think about wealth.",
    stars: 5,
  },
];

// ── Main Component ────────────────────────────────────────────────────────────

const EducationUnlockPage = () => {
  const { categoryId } = useParams<{ categoryId: string }>();
  const { theme } = useTheme();
  const { user } = useAuth();
  const navigate = useNavigate();
  const isLight = theme === 'light';

  const isSubscriber = user?.hasSubscription && user?.subscription?.status === 'active';
  const categoryName = CATEGORY_NAMES[categoryId || ''] || 'Premium Content';

  // If already subscribed, redirect to the detail page
  useEffect(() => {
    if (isSubscriber && categoryId) {
      navigate(`/education/${categoryId}`, { replace: true });
    }
  }, [isSubscriber, categoryId, navigate]);

  // Colors
  const pageBg = isLight
    ? 'linear-gradient(160deg,#f5f4f0 0%,#f8fbff 45%,#f5f4f0 100%)'
    : 'linear-gradient(160deg,#0c1a2e 0%,#0e2038 45%,#0b1825 100%)';
  const cardBg   = isLight ? '#ffffff' : 'rgba(15,24,41,1)';
  const border   = isLight ? 'rgba(226,232,240,0.9)' : 'rgba(255,255,255,0.08)';
  const textPri  = isLight ? '#0f172a' : '#fff';
  const textMut  = isLight ? '#6b7280' : 'rgba(148,163,184,0.9)';
  const shadow   = isLight ? '0 8px 40px rgba(0,0,0,0.07)' : '0 8px 40px rgba(0,0,0,0.5)';

  return (
    <Layout>
      <div className="min-h-screen" style={{ background: pageBg }}>

        {/* Back button */}
        <div className="container mx-auto px-6 pt-8">
          <button
            onClick={() => navigate(categoryId ? `/education/${categoryId}` : '/education')}
            className="inline-flex items-center gap-1.5 text-sm font-medium mb-8 transition-all hover:opacity-70"
            style={{ color: '#5194F6' }}>
            <SvgBack /> Back to {categoryName}
          </button>
        </div>

        <div className="container mx-auto px-6 pb-16">
          <div className="max-w-5xl mx-auto">

            {/* ── HEADER ──────────────────────────────────────────────── */}
            <div className="text-center mb-12">
              {/* Lock icon */}
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-5"
                style={{
                  background: 'linear-gradient(135deg,rgba(81,148,246,0.15),rgba(81,148,246,0.08))',
                  border: '1px solid rgba(81,148,246,0.30)',
                  color: '#5194F6',
                }}>
                <SvgLock />
              </div>

              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-4"
                style={{ background: 'rgba(81,148,246,0.10)', border: '1px solid rgba(81,148,246,0.20)' }}>
                <span className="text-xs font-semibold text-[#5194F6]">Premium Content</span>
              </div>

              <h1 className="text-3xl md:text-4xl font-black mb-3 leading-tight" style={{ color: textPri }}>
                Unlock <span style={{
                  background: 'linear-gradient(135deg,#5194F6,#7ab8fa)',
                  WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                }}>{categoryName}</span>
              </h1>
              <p className="text-base max-w-xl mx-auto" style={{ color: textMut }}>
                Get full access to premium educational content with the Foundation Plan. Cancel anytime.
              </p>
            </div>

            {/* ── MAIN GRID: Plan card + benefits ─────────────────────── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">

              {/* Foundation Plan Card */}
              <div className="rounded-2xl overflow-hidden" style={{
                background: cardBg, border: `2px solid rgba(34,197,94,0.35)`,
                boxShadow: `0 0 0 4px rgba(34,197,94,0.06), ${shadow}`,
              }}>
                {/* Green top bar */}
                <div className="h-1.5" style={{ background: 'linear-gradient(135deg,#22c55e,#4ade80)' }} />

                <div className="p-7">
                  {/* Badge */}
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold mb-5"
                    style={{ background: 'rgba(34,197,94,0.12)', color: '#22c55e', border: '1px solid rgba(34,197,94,0.25)' }}>
                    ✦ Recommended for Beginners
                  </div>

                  <h2 className="text-2xl font-black mb-1" style={{ color: textPri }}>Foundation Plan</h2>
                  <p className="text-sm mb-5" style={{ color: textMut }}>Build Your Market Foundation</p>

                  {/* Pricing */}
                  <div className="flex items-baseline gap-2 mb-1">
                    <span className="text-4xl font-black" style={{ color: textPri }}>₹111</span>
                    <span className="text-base font-medium" style={{ color: textMut }}>/month</span>
                  </div>
                  <p className="text-xs mb-6" style={{ color: textMut }}>₹111 per course / PDF • Cancel anytime</p>

                  {/* Benefits list */}
                  <div className="space-y-3 mb-7">
                    {PLAN_BENEFITS.map(({ icon: Icon, text }) => (
                      <div key={text} className="flex items-center gap-3 text-sm" style={{ color: textMut }}>
                        <div className="w-7 h-7 rounded-lg flex-shrink-0 flex items-center justify-center"
                          style={{ background: 'rgba(34,197,94,0.10)', color: '#22c55e' }}>
                          <Icon />
                        </div>
                        {text}
                      </div>
                    ))}
                  </div>

                  {/* CTA */}
                  {user ? (
                    <button
                      onClick={() => navigate('/plans/foundation/checkout')}
                      className="w-full py-3.5 rounded-xl text-sm font-black text-white transition-all hover:opacity-90 hover:-translate-y-0.5 shadow-lg"
                      style={{ background: 'linear-gradient(135deg,#22c55e,#16a34a)', boxShadow: '0 4px 16px rgba(34,197,94,0.35)' }}>
                      🔓 Unlock Now — ₹111/month
                    </button>
                  ) : (
                    <div className="space-y-2">
                      <button
                        onClick={() => navigate('/signup')}
                        className="w-full py-3.5 rounded-xl text-sm font-black text-white transition-all hover:opacity-90 hover:-translate-y-0.5"
                        style={{ background: 'linear-gradient(135deg,#22c55e,#16a34a)', boxShadow: '0 4px 16px rgba(34,197,94,0.35)' }}>
                        Create Free Account
                      </button>
                      <button
                        onClick={() => navigate('/signin')}
                        className="w-full py-2 rounded-xl text-sm font-semibold transition-all"
                        style={{ background: 'transparent', border: `1px solid ${border}`, color: textMut }}>
                        Already have an account? Sign in
                      </button>
                    </div>
                  )}

                  {/* Trust signals */}
                  <div className="flex items-center justify-center gap-4 mt-4">
                    <span className="flex items-center gap-1 text-xs" style={{ color: textMut }}>
                      <SvgShield /> Secure payment
                    </span>
                    <span className="w-1 h-1 rounded-full" style={{ background: textMut }} />
                    <span className="text-xs" style={{ color: textMut }}>Cancel anytime</span>
                    <span className="w-1 h-1 rounded-full" style={{ background: textMut }} />
                    <span className="text-xs" style={{ color: textMut }}>7-day refund</span>
                  </div>
                </div>
              </div>

              {/* What's included + Testimonials */}
              <div className="flex flex-col gap-5">

                {/* What's included */}
                <div className="rounded-2xl p-6" style={{ background: cardBg, border: `1px solid ${border}` }}>
                  <h3 className="text-base font-bold mb-4" style={{ color: textPri }}>Everything included</h3>
                  <div className="space-y-3">
                    {[
                      { label: '3 Financial E-books', val: '480+ pages', color: '#3B82F6' },
                      { label: '3 Financial Tutorials', val: '3h 15m video', color: '#10B981' },
                      { label: '3 Certification Programs', val: '17 weeks', color: '#D4A843' },
                      { label: '2 Non-Financial E-books', val: '235 pages', color: '#8B5CF6' },
                      { label: '2 Non-Financial Tutorials', val: '52 min video', color: '#F43F5E' },
                    ].map(item => (
                      <div key={item.label} className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-sm" style={{ color: textMut }}>
                          <div className="w-1.5 h-1.5 rounded-full" style={{ background: item.color }} />
                          {item.label}
                        </div>
                        <span className="text-xs font-semibold" style={{ color: textPri }}>{item.val}</span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 pt-4 flex items-center justify-between" style={{ borderTop: `1px solid ${border}` }}>
                    <span className="text-sm font-bold" style={{ color: textPri }}>Total value</span>
                    <div className="text-right">
                      <p className="text-xs line-through" style={{ color: textMut }}>₹1200/mo</p>
                      <p className="text-base font-black" style={{ color: '#22c55e' }}>₹111/mo</p>
                    </div>
                  </div>
                </div>

                {/* Testimonials */}
                <div className="rounded-2xl p-6" style={{ background: cardBg, border: `1px solid ${border}` }}>
                  <h3 className="text-base font-bold mb-4" style={{ color: textPri }}>What learners say</h3>
                  <div className="space-y-4">
                    {TESTIMONIALS.map(t => (
                      <div key={t.name} className="flex gap-3">
                        <div className="w-9 h-9 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold text-white"
                          style={{ background: 'linear-gradient(135deg,#5194F6,#3a7de0)' }}>
                          {t.avatar}
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <p className="text-sm font-semibold" style={{ color: textPri }}>{t.name}</p>
                            <div className="flex gap-0.5">
                              {Array(t.stars).fill(0).map((_, i) => <SvgStar key={i} />)}
                            </div>
                          </div>
                          <p className="text-xs leading-relaxed" style={{ color: textMut }}>{t.text}</p>
                          <p className="text-[10px] mt-1" style={{ color: textMut }}>{t.role}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            </div>

            {/* ── FAQ ──────────────────────────────────────────────────── */}
            <div className="rounded-2xl p-7" style={{ background: cardBg, border: `1px solid ${border}` }}>
              <h3 className="text-base font-bold mb-5 text-center" style={{ color: textPri }}>Frequently Asked Questions</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {[
                  { q: 'Can I cancel anytime?', a: 'Yes, cancel at any time from your account settings. No questions asked.' },
                  { q: 'Is there a refund policy?', a: 'We offer a 7-day full refund if you\'re not satisfied with the content.' },
                  { q: 'Will content be updated?', a: 'Yes! We add new e-books, tutorials, and course materials every month.' },
                  { q: 'Do I get a certificate?', a: 'Yes, all certification programs come with a verifiable InvestBeans certificate.' },
                  { q: 'Can I download content offline?', a: 'Yes, PDFs and e-books can be downloaded. Videos are accessible online.' },
                  { q: 'Is this SEBI-certified?', a: 'Our instructors are SEBI-registered analysts. Content follows SEBI guidelines.' },
                ].map(({ q, a }) => (
                  <div key={q}>
                    <p className="text-sm font-semibold mb-1" style={{ color: textPri }}>{q}</p>
                    <p className="text-xs leading-relaxed" style={{ color: textMut }}>{a}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Bottom CTA */}
            <div className="text-center mt-8">
              <button
                onClick={() => navigate('/plans/foundation/checkout')}
                className="inline-flex items-center gap-2 px-10 py-3.5 rounded-xl text-sm font-black text-white transition-all hover:opacity-90 hover:-translate-y-0.5"
                style={{ background: 'linear-gradient(135deg,#5194F6,#3a7de0)', boxShadow: '0 4px 20px rgba(81,148,246,0.35)' }}>
                🔓 Start with Foundation Plan — ₹111/month
              </button>
              <p className="text-xs mt-3" style={{ color: textMut }}>
                Powered by Razorpay · 7-day refund · Cancel anytime
              </p>
            </div>

          </div>
        </div>
      </div>
    </Layout>
  );
};

export default EducationUnlockPage;