import React, { useEffect, useRef, useState } from 'react';
import Layout from '@/components/Layout';
import { useTheme } from '@/controllers/Themecontext';
import { Link } from 'react-router-dom';

/* ─────────────────────────────────────────────
   Reveal helper (matches TeamView pattern)
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
      { threshold: 0.1 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  return ref;
};

const Reveal: React.FC<{ className?: string; delay?: number } & React.HTMLAttributes<HTMLDivElement>> = ({ className = '', delay = 0, children, ...rest }) => {
  const ref = useReveal();
  return (
    <div ref={ref} style={{ transitionDelay: `${delay}ms` }} className={`opacity-0 translate-y-6 ib-reveal will-change-transform ${className}`} {...rest}>
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
    header, nav.site-header, 
    @media (prefers-reduced-motion: reduce) {
      .ib-reveal { opacity: 1 !important; transform: none !important; }
    }
  `}</style>
);

/* ─────────────────────────────────────────────
   DATA — from FAQs document
───────────────────────────────────────────── */
const categories = [
  { id: 'org', label: 'Organisation & Regulatory', icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4' },
  { id: 'research', label: 'Research & Advisory', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
  { id: 'risk', label: 'Risk Management', icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z' },
  { id: 'data', label: 'Data & Technology', icon: 'M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4' },
  { id: 'insights', label: 'Portfolio & Insights', icon: 'M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z' },
  { id: 'edu', label: 'Education', icon: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253' },
  { id: 'payment', label: 'Payment & Subscriptions', icon: 'M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z' },
  { id: 'privacy', label: 'Privacy & Security', icon: 'M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z' },
  { id: 'reg', label: 'Regulatory Disclosures', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2' },
];

const faqs: Record<string, { id: string; q: string; a: string; disclaimer?: string }[]> = {
  org: [
    { id: 'o1', q: 'What is the legal status of InvestBeans?', a: 'InvestBeans operates as a registered proprietorship in India, offering research insights and educational content with full compliance to regulatory standards.', disclaimer: 'This does not constitute a registered investment advisory service.' },
    { id: 'o2', q: 'Is InvestBeans SEBI registered?', a: 'We are currently in the process of obtaining SEBI Research Analyst registration. Until approval, all content is strictly educational and informational in nature.', disclaimer: 'No activity is conducted that requires SEBI registration until approval is granted.' },
    { id: 'o3', q: 'What is your compliance framework?', a: 'Our compliance policies include ethical communication, transparent disclosures, conflict management, and avoidance of misleading or unverified claims.', disclaimer: 'Compliance procedures are aligned with industry guidelines and do not replace regulatory requirements.' },
  ],
  research: [
    { id: 'r1', q: 'What type of research does InvestBeans provide?', a: 'We offer technical, sectoral, and behavioural research insights based on structured analysis and risk-modelling frameworks.', disclaimer: 'Research insights are not investment guarantees.' },
    { id: 'r2', q: 'Do you provide buy/sell/hold recommendations?', a: 'Yes — only as research insights, including entry ranges, risk parameters, and exit triggers. Final decisions rest fully with the investor.', disclaimer: 'Past performance does not guarantee future results.' },
    { id: 'r3', q: 'Do you offer derivatives insights?', a: 'Yes, but only for users with appropriate risk profiles, focusing on risk-defined strategies.', disclaimer: 'Derivatives involve substantial risk and may lead to capital loss.' },
  ],
  risk: [
    { id: 'ri1', q: 'How does InvestBeans manage risk in research insights?', a: 'We incorporate stop-loss levels, volatility checks, sector diversification, and event-based adjustments into all research outputs.', disclaimer: 'Risk controls reduce risk but cannot eliminate it.' },
    { id: 'ri2', q: 'Do you guarantee profits?', a: 'No. We do not offer guaranteed, assured, or fixed returns under any circumstances whatsoever.', disclaimer: 'All market investments are subject to market risks.' },
    { id: 'ri3', q: 'Do you manage client funds?', a: 'No. InvestBeans does not offer PMS, fund management, or execute trades on behalf of clients.', disclaimer: 'The user retains full control of trading and financial decisions.' },
  ],
  data: [
    { id: 'd1', q: 'What data sources do you use?', a: 'We use industry-standard data feeds, global indicators, charting systems, and market screening tools to power our research.', disclaimer: 'Data may have delays as per exchange guidelines.' },
    { id: 'd2', q: 'Is the Beans Dashboard real-time?', a: 'The dashboard uses delayed feeds suitable for analysis but not for rapid trading decisions. It is designed as a research and learning tool.', disclaimer: 'Dashboard content is for informational purposes only.' },
  ],
  insights: [
    { id: 'i1', q: 'Do you offer personalised portfolio reviews?', a: 'Yes. Reviews include risk exposure, sector balance, allocation structure, and corrective recommendations tailored to your goals.', disclaimer: 'Portfolio views are educational and not personalised investment advice.' },
    { id: 'i2', q: 'How are insights delivered?', a: 'Insights are shared through email, WhatsApp (registered users), dashboard alerts, or website panels depending on your subscription.', disclaimer: 'Users must verify information before acting on it.' },
  ],
  edu: [
    { id: 'e1', q: 'What educational modules do you offer?', a: 'We provide structured learning covering trading psychology, finance basics, commodities, forex, and technical analysis — from beginner to advanced.', disclaimer: 'Educational content does not constitute market advice.' },
    { id: 'e2', q: 'Are advanced programs paid?', a: 'Yes. Some modules fall under paid learning offerings with detailed curriculum, live sessions, and downloadable resources.', disclaimer: 'Purchasing educational content does not assure profitability.' },
  ],
  payment: [
    { id: 'p1', q: 'What are the payment modes?', a: 'We accept UPI, bank transfers, and verified online payment gateways. All transactions are processed securely.', disclaimer: 'Payments do not guarantee returns or profits.' },
    { id: 'p2', q: 'Do you offer refunds?', a: 'Refunds are handled in accordance with our documented Refund & Cancellation Policy available on the website.', disclaimer: 'Refund approval is not guaranteed in all cases.' },
  ],
  privacy: [
    { id: 'pr1', q: 'How do you protect client data?', a: 'We employ encrypted systems, secure servers, and restricted-access protocols to safeguard all user information and account data.', disclaimer: 'No digital system is completely risk-free.' },
  ],
  reg: [
    { id: 're1', q: 'Do you disclose conflicts of interest?', a: 'Yes. Any equity positions or potential conflicts are disclosed as required to maintain full transparency with our users.', disclaimer: 'Disclosures aim to maintain transparency but do not eliminate all risks.' },
    { id: 're2', q: 'Do you earn brokerage or commissions?', a: 'No. InvestBeans does not accept rebates or commissions from brokers or third parties. We maintain an independent research model.', disclaimer: 'We maintain an independent research model.' },
  ],
};

/* ─────────────────────────────────────────────
   COMPONENT
───────────────────────────────────────────── */
export default function HelpCenter() {
  const { theme } = useTheme();
  const isLight = theme === 'light';
  const [activeCategory, setActiveCategory] = useState('org');
  const [searchQuery, setSearchQuery] = useState('');
  const [openFaq, setOpenFaq] = useState<string | null>(null);

  // Flatten all FAQs for search
  const allFaqs = Object.entries(faqs).flatMap(([catId, items]) =>
    items.map((f) => ({ ...f, catId }))
  );

  const searchResults = searchQuery.trim().length > 1
    ? allFaqs.filter((f) => {
      const q = searchQuery.toLowerCase();
      const catLabel = categories.find(c => c.id === f.catId)?.label?.toLowerCase() || '';
      return (
        f.q.toLowerCase().includes(q) ||
        f.a.toLowerCase().includes(q) ||
        catLabel.includes(q)
      );
    })
    : null;

  const activeFaqs = searchResults ?? faqs[activeCategory] ?? [];

  return (
    <Layout>
      <GlobalStyles />
      <div className={`min-h-screen ${isLight ? "bg-[#f5f4f0] text-gray-900" : "bg-slate-950 text-white"}`}>

        {/* ── HERO ─────────────────────────────────────── */}
        <div className={`relative overflow-hidden ${isLight ? "bg-gradient-to-br from-[#f0f6ff] via-[#f8fbff] to-[#eef4fd]" : "bg-[radial-gradient(circle_at_top,_rgba(81,140,255,0.20),_transparent_55%)]"}`}>
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute inset-x-0 top-0 h-64 bg-gradient-to-b from-blue-500/10 via-transparent to-transparent blur-3xl" />
            <div className="absolute -top-20 right-10 w-72 h-72 bg-purple-500/10 blur-[120px] rounded-full" />
            <div className="absolute top-10 left-1/3 w-80 h-80 bg-cyan-400/15 blur-[140px] rounded-full" />
          </div>

          <div className="relative z-10 container mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 pt-8 pb-12 sm:pt-12 sm:pb-16">
            {/* Back */}
            <div className="mb-8">
              <button
                type="button"
                onClick={() => window.history.back()}
                className={`inline-flex items-center gap-1.5 text-sm font-medium transition-colors ${isLight ? "text-gray-400 hover:text-gray-700" : "text-white/50 hover:text-white/90"}`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back
              </button>
            </div>

            <div className="text-center space-y-4 mb-10">
              <span className={`inline-flex items-center gap-2 text-xs uppercase tracking-[0.5em] ${isLight ? "text-blue-500" : "text-blue-200/80"}`}>
                <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                Support
              </span>
              <h1 className={`text-3xl sm:text-5xl font-black leading-tight ${isLight ? "text-gray-900" : "text-white"}`}>
                How can we help you?
              </h1>
              <p className={`text-sm sm:text-base max-w-xl mx-auto ${isLight ? "text-gray-500" : "text-blue-100/70"}`}>
                Browse categories or search our knowledge base for answers.
              </p>
            </div>

            {/* Search bar */}
            <div className="relative max-w-xl mx-auto">
              <svg
                className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 z-10 pointer-events-none ${isLight ? "text-gray-400" : "text-blue-200"}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setOpenFaq(null); }}
                placeholder="Search questions..."
                className={`w-full pl-12 pr-4 py-3.5 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-400/30 transition-all text-sm sm:text-base ${isLight ? "bg-white border border-gray-200 text-gray-800 placeholder-gray-400 focus:border-blue-400 shadow-sm" : "bg-white/10 border border-white/20 text-white placeholder-white/40 focus:border-blue-400/60 focus:bg-white/12 backdrop-blur-xl"}`}
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className={`absolute right-4 top-1/2 -translate-y-1/2 transition-colors ${isLight ? "text-gray-300 hover:text-gray-600" : "text-white/40 hover:text-white/80"}`}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* ── QUICK CONTACT STRIP ──────────────────────── */}
        <div className={`border-y backdrop-blur-sm ${isLight ? "border-gray-100 bg-white" : "border-white/8 bg-white/3"}`}>
          <div className="container mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-sm">
              <div className={`flex flex-wrap justify-center sm:justify-start items-center gap-4 sm:gap-6 ${isLight ? "text-gray-500" : "text-white/60"}`}>
                <span className="flex items-center gap-1.5">
                  <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  support@investbeans.com
                </span>
                <span className="flex items-center gap-1.5">
                  <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Mon–Fri, 9 AM – 6 PM IST
                </span>
                <span className="flex items-center gap-1.5">
                  <svg className="w-4 h-4 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  Response within 6–12 hrs
                </span>
              </div>
              <a
                href="mailto:support@investbeans.com"
                className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-500 text-white text-sm font-semibold hover:scale-[1.02] transition-all shadow-lg shadow-blue-900/30 whitespace-nowrap"
              >
                Email Support
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </a>
            </div>
          </div>
        </div>

        {/* ── MAIN ─────────────────────────────────────── */}
        <div className="container mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-10 sm:py-14">

          {/* Search results badge */}
          {searchResults !== null && (
            <Reveal className="mb-6">
              <p className={`text-sm ${isLight ? "text-gray-400" : "text-white/50"}`}>
                {searchResults.length > 0
                  ? `${searchResults.length} result${searchResults.length !== 1 ? 's' : ''} for "${searchQuery}"`
                  : `No results found for "${searchQuery}" — try a different keyword.`}
              </p>
            </Reveal>
          )}

          <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">

            {/* ── SIDEBAR CATEGORIES ── */}
            {!searchResults && (
              <aside className="lg:w-64 flex-shrink-0">
                <Reveal>
                  <div className="lg:sticky lg:top-6">
                    <p className={`text-xs uppercase tracking-[0.4em] mb-3 px-1 ${isLight ? "text-gray-400" : "text-white/40"}`}>Categories</p>

                    {/* Mobile: horizontal scroll */}
                    <div className="flex lg:hidden overflow-x-auto no-scrollbar gap-2 pb-1">
                      {categories.map((cat) => (
                        <button
                          key={cat.id}
                          type="button"
                          onClick={() => { setActiveCategory(cat.id); setOpenFaq(null); }}
                          className={`flex-shrink-0 flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium transition-all ${activeCategory === cat.id
                              ? 'bg-blue-500/20 border border-blue-400/40 text-blue-300'
                              : isLight
                                ? 'bg-white border border-gray-200 text-gray-500 hover:text-gray-800 hover:border-gray-300 shadow-sm'
                                : 'bg-white/5 border border-white/10 text-white/60 hover:text-white/90 hover:bg-white/8'
                            }`}
                        >
                          <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={cat.icon} />
                          </svg>
                          {cat.label}
                        </button>
                      ))}
                    </div>

                    {/* Desktop: vertical list */}
                    <div className="hidden lg:flex flex-col gap-1">
                      {categories.map((cat) => (
                        <button
                          key={cat.id}
                          type="button"
                          onClick={() => { setActiveCategory(cat.id); setOpenFaq(null); }}
                          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all text-left ${activeCategory === cat.id
                              ? isLight ? 'bg-blue-50 border border-blue-200 text-blue-600' : 'bg-blue-500/20 border border-blue-400/30 text-blue-300'
                              : isLight ? 'text-gray-500 hover:text-gray-800 hover:bg-gray-100' : 'text-white/55 hover:text-white/90 hover:bg-white/5'
                            }`}
                        >
                          <svg className={`w-4 h-4 flex-shrink-0 ${activeCategory === cat.id ? 'text-blue-400' : 'text-white/30'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={cat.icon} />
                          </svg>
                          <span className="leading-snug">{cat.label}</span>
                          {activeCategory === cat.id && (
                            <span className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-400 flex-shrink-0" />
                          )}
                        </button>
                      ))}

                      {/* Privacy Policy Link */}
                      <div className={`mt-4 pt-4 border-t ${isLight ? 'border-gray-200' : 'border-white/10'}`}>
                        <Link
                          to="/privacy-policy"
                          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all text-left ${isLight
                              ? 'text-gray-500 hover:text-blue-600 hover:bg-blue-50 border border-dashed border-gray-200 hover:border-blue-200'
                              : 'text-white/50 hover:text-blue-300 hover:bg-blue-500/10 border border-dashed border-white/10 hover:border-blue-400/30'
                            }`}
                        >
                          <svg className="w-4 h-4 flex-shrink-0 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          <span className="leading-snug">Privacy Policy</span>
                          <svg className="w-3 h-3 ml-auto flex-shrink-0 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                          </svg>
                        </Link>
                      </div>
                    </div>
                  </div>
                </Reveal>
              </aside>
            )}

            {/* ── FAQ PANEL ── */}
            <div className={`flex-1 min-w-0 ${searchResults ? 'lg:col-span-full' : ''}`}>
              {!searchResults && (
                <Reveal className="mb-5">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${isLight ? "bg-blue-50 border border-blue-200" : "bg-blue-500/20 border border-blue-400/30"}`}>
                      <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={categories.find(c => c.id === activeCategory)?.icon || ''} />
                      </svg>
                    </div>
                    <div>
                      <h2 className={`text-lg font-bold leading-tight ${isLight ? "text-gray-900" : "text-white"}`}>
                        {categories.find(c => c.id === activeCategory)?.label}
                      </h2>
                      <p className={`text-xs ${isLight ? "text-gray-400" : "text-white/40"}`}>{activeFaqs.length} question{activeFaqs.length !== 1 ? 's' : ''}</p>
                    </div>
                  </div>
                </Reveal>
              )}

              <div className="space-y-3">
                {(activeFaqs as any[]).map((faq, idx) => (
                  <Reveal key={faq.id} delay={idx * 60}>
                    <div className={`rounded-2xl border transition-all duration-300 overflow-hidden ${openFaq === faq.id
                        ? isLight ? 'border-blue-300 bg-blue-50' : 'border-blue-400/30 bg-white/7'
                        : isLight ? 'border-gray-200 bg-white hover:border-gray-300 shadow-sm' : 'border-white/10 bg-white/4 hover:border-white/20 hover:bg-white/6'
                      }`}>
                      <button
                        type="button"
                        onClick={() => setOpenFaq(openFaq === faq.id ? null : faq.id)}
                        className="w-full flex items-start justify-between gap-3 px-5 py-4 text-left"
                      >
                        <span className={`text-sm sm:text-base font-medium leading-snug transition-colors ${openFaq === faq.id ? (isLight ? "text-gray-900" : "text-white") : (isLight ? "text-gray-700" : "text-white/80")}`}>
                          {faq.q}
                        </span>
                        <span className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center transition-all mt-0.5 ${openFaq === faq.id ? (isLight ? 'bg-blue-100 rotate-180' : 'bg-blue-500/30 rotate-180') : (isLight ? 'bg-gray-100' : 'bg-white/8')
                          }`}>
                          <svg className={`w-3.5 h-3.5 ${isLight ? "text-gray-400" : "text-white/60"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </span>
                      </button>

                      {openFaq === faq.id && (
                        <div className={`px-5 pb-5 space-y-3 border-t pt-4 ${isLight ? "border-gray-100" : "border-white/8"}`}>
                          <p className={`text-sm leading-relaxed ${isLight ? "text-gray-600" : "text-white/70"}`}>{faq.a}</p>
                          {faq.disclaimer && (
                            <div className={`flex items-start gap-2 rounded-xl px-3 py-2.5 ${isLight ? "bg-amber-50 border border-amber-200" : "bg-amber-500/8 border border-amber-400/20"}`}>
                              <svg className="w-3.5 h-3.5 text-amber-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                              </svg>
                              <p className={`text-xs italic leading-relaxed ${isLight ? "text-amber-700" : "text-amber-300/80"}`}>Disclaimer: {faq.disclaimer}</p>
                            </div>
                          )}
                          {/* Show category if in search mode */}
                          {searchResults && (
                            <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg bg-blue-500/10 border border-blue-400/20">
                              <svg className="w-3 h-3 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={categories.find(c => c.id === (faq as any).catId)?.icon || ''} />
                              </svg>
                              <span className="text-[10px] text-blue-300 uppercase tracking-wider">
                                {categories.find(c => c.id === (faq as any).catId)?.label}
                              </span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </Reveal>
                ))}

                {activeFaqs.length === 0 && searchResults !== null && (
                  <Reveal>
                    <div className="text-center py-16 space-y-3">
                      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mx-auto ${isLight ? "bg-gray-100 border border-gray-200" : "bg-white/5 border border-white/10"}`}>
                        <svg className="w-7 h-7 text-white/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                      </div>
                      <p className={`text-sm ${isLight ? "text-gray-400" : "text-white/50"}`}>No results found. Try different keywords or email us directly.</p>
                    </div>
                  </Reveal>
                )}
              </div>
            </div>
          </div>

          {/* ── RISK DISCLOSURE SUMMARY ────────────────── */}
          <Reveal className="mt-14">
            <div className={`relative overflow-hidden rounded-[28px] p-6 sm:p-8 ${isLight ? "border border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50" : "border border-amber-400/20 bg-gradient-to-br from-amber-500/8 to-orange-500/5"}`}>
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(245,158,11,0.08),_transparent_60%)] pointer-events-none" />
              <div className="relative">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-400/30 flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                  <div>
                    <p className={`text-xs uppercase tracking-[0.4em] text-white font-semibold`}>Important</p>
                    <h3 className={`text-base font-bold text-amber-400`}>Key Risk Disclosures</h3>
                  </div>
                </div>
                <div className={`grid sm:grid-cols-2 gap-3 text-xs leading-relaxed ${isLight ? "text-gray-500" : "text-white/60"}`}>
                  {[
                    'InvestBeans does not guarantee profits, minimum returns, or capital safety.',
                    'All content is strictly educational and informational in nature.',
                    'InvestBeans is in the process of obtaining SEBI Research Analyst registration.',
                    'Past performance does not guarantee future results.',
                    'Users are solely responsible for their investment decisions.',
                    'InvestBeans does not manage funds, execute trades, or offer PMS services.',
                  ].map((item, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400/60 flex-shrink-0 mt-1.5" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Reveal>

          {/* ── STILL NEED HELP CTA ────────────────────── */}
          <Reveal className="mt-8">
            <div className={`relative overflow-hidden rounded-[20px] p-5 sm:p-7 text-center ${isLight ? "border border-blue-100 bg-gradient-to-br from-blue-50 to-indigo-50" : "border border-white/10 bg-gradient-to-br from-blue-600/30 to-indigo-600/20"}`}>
              <div className="absolute inset-0 opacity-30 bg-[radial-gradient(circle_at_top,_rgba(99,102,241,0.4),_transparent_60%)] pointer-events-none" />
              <div className="relative space-y-3">
                <p className={`text-xs uppercase tracking-[0.5em] ${isLight ? "text-blue-400" : "text-blue-200/60"}`}>Need more help?</p>
                <h2 className={`text-xl sm:text-2xl font-bold ${isLight ? "text-gray-900" : "text-white"}`}>Still have questions?</h2>
                <p className={`text-xs max-w-sm mx-auto ${isLight ? "text-gray-500" : "text-white/60"}`}>
                  Can't find what you're looking for? Our support team is ready to assist you personally.
                </p>
                <div className="flex flex-col sm:flex-row gap-2 justify-center pt-1">
                  <a
                    href="mailto:support@investbeans.com"
                    className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-500 text-white font-semibold text-sm hover:scale-[1.02] transition-all shadow-lg shadow-blue-900/40"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    Email Us
                  </a>
                  <a
                    href="https://wa.me/+917838285293"
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all ${isLight ? "bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 shadow-sm" : "bg-white/8 border border-white/15 text-white hover:bg-white/12"}`}
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                    </svg>
                    WhatsApp Us
                  </a>
                </div>
                <p className={`text-xs pt-1 ${isLight ? "text-gray-400" : "text-white/35"}`}>Average response time: 6–12 hours</p>
              </div>
            </div>
          </Reveal>


        </div>
      </div>
    </Layout>
  );
}