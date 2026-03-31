/**
 * EducationUnlockPage.tsx
 * Route: /education/unlock/:categoryId
 *
 * Paywall page with THREE distinct payment options:
 *   1. E-Books Access  → /plans/foundation/checkout  (₹111)
 *   2. Video Tutorials → /plans/command/checkout     (₹888)
 *   3. Full Suite      → /plans/edge/checkout        (₹99)
 *
 * Routes mirror PlanCards.tsx pattern: navigate('/plans/:planId/checkout')
 * If user IS already subscribed → redirects to detail page automatically.
 */

import React, { useEffect, useState } from 'react';
import Layout from '@/components/Layout';
import { useParams, useNavigate } from 'react-router-dom';
import { useTheme } from '@/controllers/Themecontext';
import { useAuth } from '@/controllers/AuthContext';

// ── SVG Icons ─────────────────────────────────────────────────────────────────

const SvgBack = () => (
  <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="15 18 9 12 15 6" />
  </svg>
);
const SvgLock = () => (
  <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
);
const SvgCheck = () => (
  <svg viewBox="0 0 24 24" fill="none" className="w-3.5 h-3.5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);
const SvgBook = () => (
  <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
  </svg>
);
const SvgVideo = () => (
  <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="23 7 16 12 23 17 23 7" /><rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
  </svg>
);
const SvgAward = () => (
  <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="8" r="7" /><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88" />
  </svg>
);
const SvgShield = () => (
  <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  </svg>
);
const SvgZap = () => (
  <svg viewBox="0 0 24 24" fill="none" className="w-3.5 h-3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
  </svg>
);
const SvgArrowRight = () => (
  <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
  </svg>
);
const SvgDownload = () => (
  <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" />
  </svg>
);
const SvgRefresh = () => (
  <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="23 4 23 10 17 10" /><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
  </svg>
);
const SvgStar = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  </svg>
);

// ── Category display names ─────────────────────────────────────────────────────

const CATEGORY_NAMES: Record<string, string> = {
  'financial-ebooks':        'Financial E-books',
  'financial-tutorials':     'Financial Tutorials',
  'financial-certifications':'Financial Certifications',
  'nonfinancial-ebooks':     'Non-Financial E-books',
  'nonfinancial-tutorials':  'Non-Financial Tutorials',
};

// ── Three Payment Plans
//    IDs map directly to /plans/:planId/checkout (same routing as PlanCards.tsx)
// ─────────────────────────────────────────────────────────────────────────────

const PAYMENT_OPTIONS = [
  {
    id:           'foundation',           // → /plans/foundation/checkout
    label:        'E-Books Access',
    tagline:      'Read at your own pace',
    badge:        'Best for Readers',
    popular:      false,
    price:        '₹111',
    unit:         'per year',
    color:        '#22c55e',
    colorDim:     'rgba(34,197,94,0.12)',
    colorBorder:  'rgba(34,197,94,0.30)',
    SvgIcon:      SvgBook,
    features: [
      '3 Financial E-books (480+ pages)',
      '2 Non-Financial E-books (345 pages)',
      'PDF downloads for offline reading',
      'Lifetime access after purchase',
      'New books added every month',
    ],
    cta: 'Get E-Books Access',
    note: 'One-time annual payment · Razorpay secured',
  },
  {
    id:           'command',              // → /plans/command/checkout
    label:        'Video Tutorials',
    tagline:      'Learn by watching & doing',
    badge:        'Most Popular',
    popular:      true,
    price:        '₹888',
    unit:         'per month',
    color:        '#3B82F6',
    colorDim:     'rgba(59,130,246,0.12)',
    colorBorder:  'rgba(59,130,246,0.30)',
    SvgIcon:      SvgVideo,
    features: [
      '3 Financial Tutorial Videos (3h 15m)',
      '2 Non-Financial Tutorials (1h 12m)',
      'HD streaming on any device',
      'Downloadable lesson notes',
      'New video sessions each month',
    ],
    cta: 'Get Video Access',
    note: 'Billed monthly · Cancel anytime',
  },
  {
    id:           'edge',                 // → /plans/edge/checkout
    label:        'Full Learning Suite',
    tagline:      'Everything, unlocked',
    badge:        'Best Value',
    popular:      false,
    price:        '₹99',
    unit:         'per month',
    color:        '#8B5CF6',
    colorDim:     'rgba(139,92,246,0.12)',
    colorBorder:  'rgba(139,92,246,0.30)',
    SvgIcon:      SvgAward,
    features: [
      'All E-books + Video Tutorials',
      '3 Verified Certification Programs',
      'Priority support & Q&A access',
      'Early access to all new content',
      'Exclusive market webinars',
    ],
    cta: 'Get Full Access',
    note: 'Billed monthly · 7-day refund guarantee',
  },
];

// ── FAQ Data ──────────────────────────────────────────────────────────────────

const FAQ = [
  { q: 'Can I cancel anytime?',           a: 'Yes — cancel at any time from your account settings with no questions asked.' },
  { q: 'Is there a refund policy?',       a: 'We offer a 7-day full refund if you\'re not satisfied with the content quality.' },
  { q: 'Will content be updated?',        a: 'Yes. New e-books, tutorial sessions, and course materials are added every month.' },
  { q: 'Do I get a certificate?',         a: 'Certifications are included in the Full Learning Suite (Edge plan).' },
  { q: 'Can I download content offline?', a: 'PDFs and e-books can be downloaded. Videos are streamed (offline coming soon).' },
  { q: 'Is this SEBI-compliant?',         a: 'Our instructors are SEBI-registered analysts. Content follows SEBI guidelines.' },
];

// ── Main Component ────────────────────────────────────────────────────────────

const EducationUnlockPage = () => {
  const { categoryId }  = useParams<{ categoryId: string }>();
  const { theme }       = useTheme();
  const { user }        = useAuth();
  const navigate        = useNavigate();
  const isLight         = theme === 'light';

  const isSubscriber  = user?.hasSubscription && user?.subscription?.status === 'active';
  const categoryName  = CATEGORY_NAMES[categoryId || ''] || 'Premium Content';

  // If already subscribed → redirect to detail page
  useEffect(() => {
    if (isSubscriber && categoryId) {
      navigate(`/education/${categoryId}`, { replace: true });
    }
  }, [isSubscriber, categoryId, navigate]);

  // Theme tokens
  const pageBg  = isLight ? 'linear-gradient(160deg,#f5f4f0 0%,#f8fbff 45%,#f5f4f0 100%)' : 'linear-gradient(160deg,#0c1a2e 0%,#0e2038 45%,#0b1825 100%)';
  const cardBg  = isLight ? '#ffffff' : 'rgba(15,24,41,1)';
  const border  = isLight ? 'rgba(226,232,240,0.9)' : 'rgba(255,255,255,0.08)';
  const textPri = isLight ? '#0f172a' : '#fff';
  const textMut = isLight ? '#6b7280' : 'rgba(148,163,184,0.9)';
  const textFnt = isLight ? '#9ca3af' : 'rgba(148,163,184,0.6)';

  // Navigate following PlanCards routing pattern: /plans/:planId/checkout
  const handleCta = (planId: string) => {
    navigate(`/pricing/${planId}/checkout`);
  };

  return (
    <Layout>
      <div className="min-h-screen" style={{ background: pageBg }}>

        {/* Back */}
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

            {/* ── HEADER ─────────────────────────────────────────────── */}
            <div className="text-center mb-14">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-5"
                style={{
                  background: 'linear-gradient(135deg,rgba(81,148,246,0.15),rgba(81,148,246,0.08))',
                  border: '1px solid rgba(81,148,246,0.30)', color: '#5194F6',
                }}>
                <SvgLock />
              </div>

              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-4"
                style={{ background: 'rgba(81,148,246,0.10)', border: '1px solid rgba(81,148,246,0.20)' }}>
                <SvgZap />
                <span className="text-xs font-semibold text-[#5194F6]">Premium Content</span>
              </div>

              <h1 className="text-3xl md:text-4xl font-black mb-3 leading-tight" style={{ color: textPri }}>
                Unlock{' '}
                <span style={{ background: 'linear-gradient(135deg,#5194F6,#7ab8fa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                  {categoryName}
                </span>
              </h1>
              <p className="text-base max-w-xl mx-auto" style={{ color: textMut }}>
                Choose the access level that suits you. All plans route through our secure Razorpay checkout.
              </p>
            </div>

            {/* ── THREE PAYMENT OPTION CARDS ───────────────────────── */}
            {/* Mirrors PlanCards.tsx structure — 3 plans, each CTA → /plans/:planId/checkout */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-14">
              {PAYMENT_OPTIONS.map((plan) => {
                const Icon = plan.SvgIcon;

                // Card styling — popular plan gets enhanced border
                const cardBorder = plan.popular
                  ? `2px solid ${plan.color}`
                  : isLight ? '1.5px solid rgba(4,20,33,0.10)' : '1.5px solid rgba(124,166,194,0.20)';
                const cardShadow = plan.popular
                  ? `0 20px 60px ${plan.colorDim}, 0 4px 20px rgba(0,0,0,0.1)`
                  : isLight ? '0 6px 24px rgba(4,20,33,0.07)' : '0 4px 24px rgba(0,0,0,0.3)';
                const bg = plan.popular
                  ? (isLight ? 'linear-gradient(145deg,#FCFDFE,#f0f7ff)' : 'linear-gradient(145deg,#0f1f3d,#0d1a35)')
                  : cardBg;

                return (
                  <div
                    key={plan.id}
                    className="rounded-2xl overflow-hidden flex flex-col relative transition-all duration-300 hover:-translate-y-1"
                    style={{ background: bg, border: cardBorder, boxShadow: cardShadow }}>

                    {/* Popular badge */}
                    {plan.popular && (
                      <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-0 z-10">
                        <div className="inline-flex items-center gap-1.5 px-4 py-1 rounded-b-xl text-xs font-black text-white"
                          style={{ background: `linear-gradient(135deg,${plan.color},${plan.color}cc)` }}>
                          <SvgStar /> {plan.badge}
                        </div>
                      </div>
                    )}

                    {/* Color accent bar */}
                    <div className="h-1.5 w-full" style={{ background: `linear-gradient(90deg,${plan.color},${plan.color}88)` }} />

                    <div className="p-6 flex flex-col flex-1">
                      {/* Icon + badge row */}
                      <div className="flex items-start justify-between mb-5">
                        <div className="w-12 h-12 rounded-2xl flex items-center justify-center"
                          style={{ background: plan.colorDim, color: plan.color, border: `1px solid ${plan.colorBorder}` }}>
                          <Icon />
                        </div>
                        {!plan.popular && (
                          <span className="text-[11px] font-bold px-2.5 py-1 rounded-full"
                            style={{ background: plan.colorDim, color: plan.color, border: `1px solid ${plan.colorBorder}` }}>
                            {plan.badge}
                          </span>
                        )}
                      </div>

                      {/* Name + tagline */}
                      <h3 className="text-lg font-black mb-0.5" style={{ color: textPri }}>{plan.label}</h3>
                      <p className="text-xs mb-4" style={{ color: textMut }}>{plan.tagline}</p>

                      {/* Price */}
                      <div className="flex items-baseline gap-1.5 mb-1">
                        <span className="text-3xl font-black" style={{ color: textPri }}>{plan.price}</span>
                        <span className="text-sm font-medium" style={{ color: textMut }}>{plan.unit}</span>
                      </div>
                      <p className="text-[10px] mb-5" style={{ color: textFnt }}>{plan.note}</p>

                      {/* Feature list */}
                      <div className="space-y-2.5 mb-6 flex-1">
                        {plan.features.map((f) => (
                          <div key={f} className="flex items-start gap-2.5 text-sm" style={{ color: textMut }}>
                            <div className="w-5 h-5 rounded-md flex-shrink-0 flex items-center justify-center mt-0.5"
                              style={{ background: plan.colorDim, color: plan.color }}>
                              <SvgCheck />
                            </div>
                            {f}
                          </div>
                        ))}
                      </div>

                      {/* CTA — same pattern as PlanCards.tsx: navigate('/plans/:planId/checkout') */}
                      {user ? (
                        <button
                          onClick={() => handleCta(plan.id)}
                          className="w-full py-3 rounded-xl text-sm font-black text-white transition-all hover:opacity-90 hover:-translate-y-0.5 flex items-center justify-center gap-2"
                          style={{
                            background: plan.popular
                              ? `linear-gradient(135deg,${plan.color},${plan.color}cc)`
                              : plan.colorDim,
                            color: plan.popular ? '#fff' : plan.color,
                            border: plan.popular ? 'none' : `1.5px solid ${plan.colorBorder}`,
                            boxShadow: plan.popular ? `0 6px 20px ${plan.colorDim}` : 'none',
                          }}>
                          {plan.cta}
                          <SvgArrowRight />
                        </button>
                      ) : (
                        <div className="space-y-2">
                          <button
                            onClick={() => navigate('/signup')}
                            className="w-full py-3 rounded-xl text-sm font-black text-white transition-all hover:opacity-90"
                            style={{ background: `linear-gradient(135deg,${plan.color},${plan.color}cc)` }}>
                            Create Free Account
                          </button>
                          <button
                            onClick={() => navigate('/signin')}
                            className="w-full py-2 rounded-xl text-xs font-semibold transition-all"
                            style={{ background: 'transparent', border: `1px solid ${border}`, color: textMut }}>
                            Already have an account?
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* ── WHAT'S INCLUDED — summary table ─────────────────── */}
            <div className="rounded-2xl overflow-hidden mb-10" style={{ background: cardBg, border: `1px solid ${border}` }}>
              <div className="px-6 py-4 flex items-center gap-2" style={{
                borderBottom: `1px solid ${border}`,
                background: isLight ? 'rgba(81,148,246,0.05)' : 'rgba(81,148,246,0.08)',
              }}>
                <SvgStar />
                <h3 className="text-sm font-bold" style={{ color: textPri }}>Everything Included — At a Glance</h3>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-3">
                  {[
                    { label: '3 Financial E-books',         val: '480+ pages',   color: '#3B82F6' },
                    { label: '2 Non-Financial E-books',     val: '345 pages',    color: '#8B5CF6' },
                    { label: '3 Financial Tutorial Videos', val: '3h 15m',       color: '#10B981' },
                    { label: '2 Non-Financial Tutorials',   val: '1h 12m',       color: '#F43F5E' },
                    { label: '3 Certification Programs',    val: '17 weeks',     color: '#D4A843' },
                    { label: 'PDF Downloads',               val: 'All E-books',  color: '#6B7280' },
                  ].map(item => (
                    <div key={item.label} className="flex items-center justify-between py-1.5" style={{
                      borderBottom: `1px solid ${isLight ? 'rgba(226,232,240,0.6)' : 'rgba(255,255,255,0.05)'}`,
                    }}>
                      <div className="flex items-center gap-2.5 text-sm" style={{ color: textMut }}>
                        <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: item.color }} />
                        {item.label}
                      </div>
                      <span className="text-xs font-semibold" style={{ color: textPri }}>{item.val}</span>
                    </div>
                  ))}
                </div>

                {/* Value comparison */}
                <div className="mt-5 pt-4 flex items-center justify-between" style={{ borderTop: `1px solid ${border}` }}>
                  <span className="text-sm font-bold" style={{ color: textPri }}>Total content value</span>
                  <div className="text-right">
                    <p className="text-xs line-through" style={{ color: textFnt }}>₹2,400/yr</p>
                    <p className="text-base font-black" style={{ color: '#22c55e' }}>From ₹99/mo</p>
                  </div>
                </div>
              </div>
            </div>

            {/* ── TRUST SIGNALS ────────────────────────────────────── */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-10">
              {[
                { icon: <SvgShield />, label: 'Secure Payment', sub: 'Powered by Razorpay' },
                { icon: <SvgRefresh />, label: 'Cancel Anytime', sub: 'No lock-in period' },
                { icon: <SvgCheck />, label: '7-Day Refund',   sub: 'No questions asked' },
                { icon: <SvgDownload />, label: 'PDF Downloads', sub: 'All e-books included' },
              ].map(({ icon, label, sub }) => (
                <div key={label} className="rounded-xl p-3.5 flex flex-col items-center text-center gap-1.5" style={{
                  background: isLight ? 'rgba(13,37,64,0.03)' : 'rgba(255,255,255,0.04)',
                  border: isLight ? '1px solid rgba(13,37,64,0.08)' : '1px solid rgba(255,255,255,0.07)',
                }}>
                  <span style={{ color: '#5194F6' }}>{icon}</span>
                  <p className="text-xs font-bold" style={{ color: textPri }}>{label}</p>
                  <p className="text-[10px]" style={{ color: textFnt }}>{sub}</p>
                </div>
              ))}
            </div>

            {/* ── FAQ ──────────────────────────────────────────────── */}
            <div className="rounded-2xl p-7" style={{ background: cardBg, border: `1px solid ${border}` }}>
              <h3 className="text-sm font-bold mb-5 text-center uppercase tracking-wider" style={{ color: textPri }}>
                Frequently Asked Questions
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {FAQ.map(({ q, a }) => (
                  <div key={q}>
                    <p className="text-sm font-semibold mb-1" style={{ color: textPri }}>{q}</p>
                    <p className="text-xs leading-relaxed" style={{ color: textMut }}>{a}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* ── BOTTOM CTA ───────────────────────────────────────── */}
            <div className="text-center mt-10">
              <button
                onClick={() => handleCta('foundation')}
                className="inline-flex items-center gap-2 px-10 py-3.5 rounded-xl text-sm font-black text-white transition-all hover:opacity-90 hover:-translate-y-0.5"
                style={{ background: 'linear-gradient(135deg,#5194F6,#3a7de0)', boxShadow: '0 4px 20px rgba(81,148,246,0.35)' }}>
                🔓 Get Started — Plans from ₹99/month
                <SvgArrowRight />
              </button>
              <p className="text-xs mt-3" style={{ color: textFnt }}>
                Powered by Razorpay · 7-day refund · Cancel anytime
              </p>
              <p className="text-xs mt-1" style={{ color: textFnt }}>
                Need help?{' '}
                <a href="mailto:support@investbeans.com" style={{ color: '#5194F6' }}>
                  support@investbeans.com
                </a>
              </p>
            </div>

          </div>
        </div>
      </div>
    </Layout>
  );
};

export default EducationUnlockPage;