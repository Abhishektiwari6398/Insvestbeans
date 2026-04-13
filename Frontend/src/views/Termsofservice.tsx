import React, { useEffect, useRef, useState } from 'react';
import Layout from '@/components/Layout';
import { useTheme } from '@/controllers/Themecontext';
import { Link } from 'react-router-dom';

/* ─────────────────────────────────────────────
   Reveal helper
───────────────────────────────────────────── */
const useReveal = () => {
  const ref = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (!ref.current) return;
    const el = ref.current;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => { if (e.isIntersecting) { el.classList.add('ib-revealed'); observer.unobserve(el); } });
      },
      { threshold: 0.08 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  return ref;
};

const Reveal: React.FC<{ className?: string; delay?: number } & React.HTMLAttributes<HTMLDivElement>> = ({
  className = '', delay = 0, children, ...rest
}) => {
  const ref = useReveal();
  return (
    <div ref={ref} style={{ transitionDelay: `${delay}ms` }}
      className={`opacity-0 translate-y-6 ib-reveal will-change-transform ${className}`} {...rest}>
      {children}
    </div>
  );
};

const GlobalStyles = () => (
  <style>{`
    .ib-reveal { transition: opacity 700ms ease, transform 700ms ease; }
    .ib-revealed { opacity: 1 !important; transform: translateY(0) !important; }
    .no-scrollbar::-webkit-scrollbar { display: none; }
    .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
    header, nav.site-header, .site-header { display: none !important; }
    @media (prefers-reduced-motion: reduce) {
      .ib-reveal { opacity: 1 !important; transform: none !important; }
    }
  `}</style>
);

/* ─────────────────────────────────────────────
   DATA
───────────────────────────────────────────── */
const tabs = [
  { id: 'terms', label: 'Terms & Conditions', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2' },
  { id: 'risk',  label: 'Risk Disclosure',    icon: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z' },
];

const termsSections = [
  { num: '1', title: 'General Terms', gradient: 'from-blue-500 to-indigo-600', points: ['By accessing InvestBeans ("the Platform"), you agree to abide by these Terms & Conditions.', 'InvestBeans provides research insights, market commentary, dashboards, and educational content.', 'InvestBeans is currently in the process of obtaining SEBI Research Analyst registration. Until registration is granted, all content remains informational and educational in nature.'] },
  { num: '2', title: 'Nature of Services', gradient: 'from-purple-500 to-violet-600', highlight: { color: 'amber', text: 'InvestBeans does NOT handle client funds, execute trades, provide Portfolio Management Services (PMS), or guarantee or assure returns in any form.' }, points: ['All communications are research-driven insights — not personalised investment advice.'] },
  { num: '3', title: 'User Responsibility', gradient: 'from-cyan-500 to-blue-600', points: ['Users are solely responsible for evaluating risks, making final investment decisions, and ensuring their actions comply with applicable laws.', 'Users must verify the accuracy of any data before acting on it.', 'Subscription plans are non-transferable and for individual use only.'] },
  { num: '4', title: 'Subscriptions & Payments', gradient: 'from-emerald-500 to-teal-600', points: ['Subscription plans are non-transferable.', 'Prices are subject to change without prior notice.', 'Refunds, if applicable, will follow the Refund & Cancellation Policy available on the website.', 'Accepted modes: UPI, bank transfers, and verified online payment gateways.'] },
  { num: '5', title: 'Data & Privacy', gradient: 'from-pink-500 to-rose-600', points: ['InvestBeans collects only essential user information required to operate the platform.', 'Data is stored securely using encryption and access controls.', 'We do not sell or share personal information without explicit user consent.'] },
  { num: '6', title: 'Restrictions', gradient: 'from-amber-500 to-orange-600', listPrefix: 'Users must not:', points: ['Misuse the platform or attempt to breach system security.', 'Copy, distribute, or resell proprietary research or dashboards.', 'Use insights for unauthorised commercial activity.', 'Share account access with any third party.'] },
  { num: '7', title: 'Intellectual Property', gradient: 'from-blue-500 to-cyan-600', points: ['All content, tools, graphics, brand names, and dashboards on InvestBeans remain the intellectual property of the platform.', 'Unauthorised copying, scraping, or distribution is strictly prohibited.', 'You may use content for personal, non-commercial educational purposes only.'] },
  { num: '8', title: 'Limitation of Liability', gradient: 'from-slate-500 to-slate-600', highlight: { color: 'red', text: 'Total liability under any circumstance shall not exceed the subscription amount paid by the user.' }, points: ['InvestBeans shall not be liable for trading losses, market disruptions, data delays or inaccuracies, third-party system failures, or force majeure events.'] },
  { num: '9', title: 'Modifications', gradient: 'from-violet-500 to-purple-600', points: ['We reserve the right to modify these Terms at any time without prior notice.', 'Continued usage of the platform implies acceptance of any updated terms.'] },
  { num: '10', title: 'Governing Law', gradient: 'from-indigo-500 to-blue-600', points: ['These Terms are governed by the laws of India.', 'Any disputes shall be handled under the exclusive jurisdiction of courts in the applicable city.'] },
];

const riskSections = [
  { num: '1', title: 'Market Risk', gradient: 'from-red-500 to-rose-600', icon: 'M13 7h8m0 0v8m0-8l-8 8-4-4-6 6', text: 'Financial markets involve volatility and uncertainty. Prices can move unfavorably, resulting in partial or complete loss of invested capital.' },
  { num: '2', title: 'No Guarantee of Returns', gradient: 'from-amber-500 to-orange-600', icon: 'M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636', text: 'InvestBeans does not guarantee profit, minimum returns, capital safety, or accuracy of forecasts. Past performance does not guarantee future results.', bullets: ['Profit', 'Minimum returns', 'Capital safety', 'Accuracy of forecasts'] },
  { num: '3', title: 'Derivatives Risk', gradient: 'from-purple-500 to-violet-600', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z', text: 'Trading in futures and options carries high leverage and risk. Losses may exceed initial capital in extreme market conditions.' },
  { num: '4', title: 'Data & System Risk', gradient: 'from-cyan-500 to-blue-600', icon: 'M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4', text: 'Market data may experience delays, interruptions, inaccuracies, or network failures that may impact the applicability of insights.' },
  { num: '5', title: 'Educational Nature of Content', gradient: 'from-emerald-500 to-teal-600', icon: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253', text: 'All content is intended for educational and informational purposes only. Users must consult certified financial professionals before making any investment decisions.' },
  { num: '6', title: 'Personal Risk Profile', gradient: 'from-blue-500 to-indigo-600', icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z', text: 'InvestBeans insights may not be suitable for all investors. Users must assess their risk tolerance, investment horizon, financial goals, and capital allocation strategy before acting.' },
  { num: '7', title: 'Third-Party Tools', gradient: 'from-slate-500 to-slate-600', icon: 'M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14', text: 'InvestBeans is not responsible for losses arising from third-party tools, platforms, or brokers accessed through or alongside our platform.' },
  { num: '8', title: 'Regulatory Compliance', gradient: 'from-violet-500 to-purple-600', icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z', text: 'InvestBeans adheres to compliance best practices. However, regulatory guidelines may evolve, requiring process updates without prior notice.' },
];

/* ─────────────────────────────────────────────
   COMPONENT
───────────────────────────────────────────── */
export default function TermsOfService() {
  const [activeTab, setActiveTab] = useState<'terms' | 'risk'>('terms');
  const { theme } = useTheme();
  const isLight = theme === 'light';

  // ── Token helpers following DomesticView pattern ──────────────────
  const t1 = isLight ? 'text-gray-900'  : 'text-white';
  const t2 = isLight ? 'text-gray-600'  : 'text-white/70';
  const t3 = isLight ? 'text-gray-400'  : 'text-white/50';
  const t4 = isLight ? 'text-gray-500'  : 'text-white/55';

  const sectionCard = isLight
    ? 'border border-gray-100 bg-white hover:border-gray-200 hover:shadow-md'
    : 'border border-white/10 bg-white/4 hover:bg-white/6 hover:border-white/18';

  const riskCard = isLight
    ? 'border border-gray-100 bg-white hover:border-gray-200 hover:shadow-md'
    : 'border border-white/10 bg-white/4 hover:bg-white/6 hover:border-white/18';

  return (
    <Layout>
      <GlobalStyles />
      <div className={`min-h-screen ${isLight ? 'bg-[#f5f4f0] text-gray-900' : 'bg-slate-950 text-white'}`}>

        {/* ── HERO ─────────────────────────────────────── */}
        <div className={`relative overflow-hidden ${isLight ? 'bg-gradient-to-br from-[#f0f6ff] via-[#f8fbff] to-[#eef4fd]' : 'bg-[radial-gradient(circle_at_top,_rgba(81,140,255,0.18),_transparent_55%)]'}`}>
          <div className="absolute inset-0 pointer-events-none">
            <div className={`absolute inset-x-0 top-0 h-64 bg-gradient-to-b blur-3xl ${isLight ? 'from-blue-100/30 via-transparent to-transparent' : 'from-blue-500/10 via-transparent to-transparent'}`} />
            <div className={`absolute -top-20 right-10 w-72 h-72 blur-[120px] rounded-full ${isLight ? 'bg-purple-100/30' : 'bg-purple-500/10'}`} />
            <div className={`absolute top-10 left-1/3 w-80 h-80 blur-[140px] rounded-full ${isLight ? 'bg-blue-100/20' : 'bg-cyan-400/12'}`} />
          </div>

          <div className="relative z-10 container mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 pt-8 pb-12 sm:pt-12 sm:pb-16">
            {/* Back */}
            <div className="mb-8">
              <button
                type="button"
                onClick={() => window.history.back()}
                className={`inline-flex items-center gap-1.5 text-sm font-medium transition-colors ${isLight ? 'text-gray-400 hover:text-gray-700' : 'text-white/50 hover:text-white/90'}`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back
              </button>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6">
              <div className="space-y-3">
                <span className={`inline-flex items-center gap-2 text-xs uppercase tracking-[0.5em] ${isLight ? 'text-blue-500' : 'text-blue-200/80'}`}>
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                  Legal
                </span>
                <h1 className={`text-3xl sm:text-5xl font-black leading-tight ${t1}`}>
                  Legal Documents
                </h1>
                <p className={`text-sm max-w-md ${isLight ? 'text-gray-500' : 'text-blue-100/60'}`}>
                  Effective Date: February 5, 2026 &nbsp;·&nbsp; Entity: InvestBeans (Registered Proprietorship)
                </p>
              </div>

              {/* Tab switcher */}
              <div className={`flex gap-2 p-1 rounded-2xl self-start sm:self-auto flex-shrink-0 ${isLight ? 'bg-gray-100 border border-gray-200' : 'bg-white/5 border border-white/10'}`}>
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id as 'terms' | 'risk')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap ${
                      activeTab === tab.id
                        ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/25'
                        : isLight
                          ? 'text-gray-500 hover:text-gray-800'
                          : 'text-white/50 hover:text-white/80'
                    }`}
                  >
                    <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={tab.icon} />
                    </svg>
                    <span className="hidden sm:inline">{tab.label}</span>
                    <span className="sm:hidden">{tab.id === 'terms' ? 'T&C' : 'Risk'}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ── MAIN CONTENT ─────────────────────────────── */}
        <div className="container mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-10 sm:py-14">

          {/* ══ TERMS & CONDITIONS ══ */}
          {activeTab === 'terms' && (
            <div className="space-y-5">
              {/* Intro banner */}
              <Reveal>
                <div className={`relative overflow-hidden rounded-[24px] p-5 sm:p-7 ${isLight ? 'border border-blue-100 bg-blue-50' : 'border border-blue-400/20 bg-gradient-to-br from-blue-600/15 to-indigo-600/10'}`}>
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(99,102,241,0.08),_transparent_60%)] pointer-events-none" />
                  <div className="relative flex items-start gap-4">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 ${isLight ? 'bg-blue-100 border border-blue-200' : 'bg-blue-500/20 border border-blue-400/30'}`}>
                      <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <p className={`text-sm leading-relaxed ${t2}`}>
                      By accessing InvestBeans, you agree to abide by these Terms & Conditions. InvestBeans provides research insights, market commentary, dashboards, and educational content. All use of the platform is governed by the terms below.
                    </p>
                  </div>
                </div>
              </Reveal>

              {termsSections.map((sec, idx) => (
                <Reveal key={sec.num} delay={idx * 50}>
                  <div className={`relative overflow-hidden rounded-[24px] transition-all duration-300 p-5 sm:p-7 ${sectionCard}`}>
                    <div className="flex items-start gap-4">
                      {/* Number badge */}
                      <div className={`flex-shrink-0 w-9 h-9 rounded-xl bg-gradient-to-br ${sec.gradient} flex items-center justify-center text-white text-sm font-bold shadow-lg`}>
                        {sec.num}
                      </div>
                      <div className="flex-1 min-w-0 space-y-3">
                        <h2 className={`text-base sm:text-lg font-bold ${t1}`}>{sec.title}</h2>

                        {(sec as any).listPrefix && (
                          <p className={`text-sm ${t4}`}>{(sec as any).listPrefix}</p>
                        )}

                        {(sec as any).highlight && (
                          <div className={`flex items-start gap-2.5 rounded-xl px-4 py-3 ${
                            (sec as any).highlight.color === 'amber'
                              ? isLight ? 'bg-amber-50 border border-amber-200' : 'bg-amber-500/10 border border-amber-400/25'
                              : isLight ? 'bg-red-50 border border-red-200' : 'bg-red-500/10 border border-red-400/25'
                          }`}>
                            <svg className={`w-4 h-4 flex-shrink-0 mt-0.5 ${(sec as any).highlight.color === 'amber' ? 'text-amber-500' : 'text-red-500'}`}
                              fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                            <p className={`text-xs leading-relaxed ${
                              (sec as any).highlight.color === 'amber'
                                ? isLight ? 'text-amber-700' : 'text-amber-300/80'
                                : isLight ? 'text-red-700' : 'text-red-300/80'
                            }`}>
                              {(sec as any).highlight.text}
                            </p>
                          </div>
                        )}

                        <ul className="space-y-2">
                          {sec.points.map((pt, pi) => (
                            <li key={pi} className={`flex items-start gap-2.5 text-sm leading-relaxed ${t2}`}>
                              <span className={`w-1.5 h-1.5 rounded-full bg-gradient-to-br ${sec.gradient} flex-shrink-0 mt-2`} />
                              {pt}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                </Reveal>
              ))}

              {/* Contact card */}
              <Reveal delay={termsSections.length * 50}>
                <div className={`rounded-[24px] p-5 sm:p-7 ${isLight ? 'border border-gray-100 bg-white shadow-sm' : 'border border-white/10 bg-white/4'}`}>
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div className="space-y-2">
                      <h2 className={`text-base sm:text-lg font-bold ${t1}`}>Contact Information</h2>
                      <p className={`text-sm ${t4}`}>For questions about these Terms, reach us at:</p>
                      <div className="flex flex-col sm:flex-row gap-3 pt-1">
                        <a href="mailto:legal@investbeans.com"
                          className={`inline-flex items-center gap-2 text-sm transition-colors ${isLight ? 'text-blue-500 hover:text-blue-700' : 'text-blue-300 hover:text-blue-200'}`}>
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                          </svg>
                          legal@investbeans.com
                        </a>
                        <a href="mailto:support@investbeans.com"
                          className={`inline-flex items-center gap-2 text-sm transition-colors ${isLight ? 'text-blue-500 hover:text-blue-700' : 'text-blue-300 hover:text-blue-200'}`}>
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
                          </svg>
                          support@investbeans.com
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              </Reveal>
            </div>
          )}

          {/* ══ RISK DISCLOSURE ══ */}
          {activeTab === 'risk' && (
            <div className="space-y-5">
              {/* Intro banner */}
              <Reveal>
                <div className={`relative overflow-hidden rounded-[24px] p-5 sm:p-7 ${isLight ? 'border border-amber-200 bg-amber-50' : 'border border-amber-400/25 bg-gradient-to-br from-amber-500/10 to-orange-500/5'}`}>
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(245,158,11,0.06),_transparent_60%)] pointer-events-none" />
                  <div className="relative flex items-start gap-4">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 ${isLight ? 'bg-amber-100 border border-amber-200' : 'bg-amber-500/20 border border-amber-400/30'}`}>
                      <svg className="w-5 h-5 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                    </div>
                    <p className={`text-sm leading-relaxed ${isLight ? 'text-amber-800' : 'text-amber-200/70'}`}>
                      This Risk Disclosure is an integral part of the Terms & Conditions. Please read it carefully before using InvestBeans. All market activity carries inherent risk — understanding these risks is essential to responsible participation.
                    </p>
                  </div>
                </div>
              </Reveal>

              <div className="grid sm:grid-cols-2 gap-4">
                {riskSections.map((sec, idx) => (
                  <Reveal key={sec.num} delay={idx * 60}>
                    <div className={`relative overflow-hidden rounded-[24px] transition-all duration-300 p-5 h-full ${riskCard}`}>
                      {/* top accent line */}
                      <div className={`absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r ${sec.gradient} rounded-t-[24px]`} />
                      <div className="flex items-start gap-3 mb-3">
                        <div className={`flex-shrink-0 w-9 h-9 rounded-xl bg-gradient-to-br ${sec.gradient} flex items-center justify-center shadow-lg`}>
                          <svg className="w-[18px] h-[18px] text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={sec.icon} />
                          </svg>
                        </div>
                        <div>
                          <span className={`text-[10px] uppercase tracking-[0.35em] bg-gradient-to-r ${sec.gradient} bg-clip-text text-transparent font-semibold`}>
                            {String(idx + 1).padStart(2, '0')}
                          </span>
                          <h3 className={`text-sm sm:text-base font-bold leading-tight ${t1}`}>{sec.title}</h3>
                        </div>
                      </div>
                      <p className={`text-xs sm:text-sm leading-relaxed ${t2}`}>{sec.text}</p>
                      {(sec as any).bullets && (
                        <div className="mt-3 grid grid-cols-2 gap-1.5">
                          {(sec as any).bullets.map((b: string, bi: number) => (
                            <div key={bi} className="flex items-center gap-1.5">
                              <svg className="w-3 h-3 text-red-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                              <span className={`text-xs ${t3}`}>{b}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </Reveal>
                ))}
              </div>
            </div>
          )}

          {/* ── FOOTER ACKNOWLEDGMENT ───────────────────── */}
          <Reveal className="mt-10">
            <div className={`relative overflow-hidden rounded-[28px] p-6 sm:p-8 text-center ${isLight ? 'border border-blue-100 bg-gradient-to-br from-blue-50 to-indigo-50' : 'border border-white/10 bg-gradient-to-br from-blue-600/25 to-indigo-600/15'}`}>
              <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_top,_rgba(99,102,241,0.25),_transparent_60%)] pointer-events-none" />
              <div className="relative space-y-3">
                <p className={`text-xs uppercase tracking-[0.5em] ${isLight ? 'text-blue-400' : 'text-blue-200/60'}`}>Acknowledgment</p>
                <p className={`text-sm max-w-2xl mx-auto leading-relaxed ${t2}`}>
                  By using InvestBeans, you acknowledge that you have read, understood, and agree to be bound by these Terms of Service and Risk Disclosure. We recommend saving a copy of these documents for your records.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
                  <Link to="/help-center"
                    className={`inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-sm font-medium transition-all ${isLight ? 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 shadow-sm' : 'bg-white/8 border border-white/15 text-white/80 hover:bg-white/12'}`}>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Help Center
                  </Link>
                  <a href="mailto:legal@investbeans.com"
                    className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-500 text-white text-sm font-semibold hover:scale-[1.02] transition-all shadow-lg shadow-blue-500/25">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    Legal Queries
                  </a>
                </div>
              </div>
            </div>
          </Reveal>

        </div>
      </div>
    </Layout>
  );
}