import React, { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Layout from '@/components/Layout';
import WhatWeDo from './Whatwedo';
import { useTheme } from '@/controllers/Themecontext';



const TeamView = () => {
  const { theme } = useTheme();
  const isLight = theme === 'light';
  // simple intersection observer reveal
  const useReveal = () => {
    const ref = useRef<HTMLDivElement | null>(null);
    useEffect(() => {
      if (!ref.current) return;
      const el = ref.current;
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              el.classList.add('ib-revealed');
              observer.unobserve(el);
            }
          });
        },
        { threshold: 0.12 }
      );
      observer.observe(el);
      return () => observer.disconnect();
    }, []);
    return ref;
  };

  const Reveal: React.FC<{ className?: string; delay?: number } & React.HTMLAttributes<HTMLDivElement>> = ({ className = '', delay = 0, children, ...rest }) => {
    const ref = useReveal();
    return (
      <div
        ref={ref}
        style={{ transitionDelay: `${delay}ms` }}
        className={`opacity-0 translate-y-6 ib-reveal will-change-transform ${className}`}
        {...rest}
      >
        {children}
      </div>
    );
  };

  const GlobalRevealStyles = () => (
    <style>{`
      .ib-reveal { transition: opacity 700ms ease, transform 700ms ease; }
      .ib-revealed { opacity: 1 !important; transform: translateY(0) !important; }
      @media (prefers-reduced-motion: reduce) {
        .ib-reveal { transition: none !important; opacity: 1 !important; transform: none !important; }
      }
      html { scroll-behavior: smooth; }
      .no-scrollbar::-webkit-scrollbar { display: none; }
      .no-scrollbar { scrollbar-width: none; }
    
      .line-clamp-2 { overflow: hidden; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; }
    `}</style>
  );

  // state now keyed by member id (string)
  const [expandedBios, setExpandedBios] = useState<Record<string, boolean>>({});
  const [showAllValues, setShowAllValues] = useState(false);
  const [readMoreStory, setReadMoreStory] = useState(false);
  const [readMoreFounder, setReadMoreFounder] = useState(false);
  const [expandedMission, setExpandedMission] = useState(false);
  const [expandedVision, setExpandedVision] = useState(false);
  const [activeSection, setActiveSection] = useState('our-story');
  const pageRef = useRef<HTMLDivElement | null>(null);

  // scrollspy for sticky sub-navigation
  useEffect(() => {
    const ids = [
      'our-story',
      'team-members',
      'mission',
      'core-values',
      'why-us',
      'certifications',
      'join',
    ];
    const elements = ids
      .map((id) => document.getElementById(id))
      .filter(Boolean) as HTMLElement[];
    if (!elements.length) return;

    const spy = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => (a.target as HTMLElement).offsetTop - (b.target as HTMLElement).offsetTop);
        if (visible[0]) {
          setActiveSection((visible[0].target as HTMLElement).id);
        }
      },
      { rootMargin: '-40% 0px -50% 0px', threshold: [0, 0.25, 0.5, 0.75, 1] }
    );

    elements.forEach((el) => spy.observe(el));
    return () => spy.disconnect();
  }, []);

  const toggleBio = (id: string) => {
    setExpandedBios((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  useEffect(() => {
    if (typeof window === 'undefined') return;
    gsap.registerPlugin(ScrollTrigger);
  }, []);

  useEffect(() => {
    if (!pageRef.current) return;

    const ctx = gsap.context(() => {
      gsap.from('.gsap-hero-title', {
        opacity: 0,
        y: 40,
        duration: 1.1,
        ease: 'power3.out',
      });

      gsap.from('.gsap-hero-panel', {
        opacity: 0,
        x: 60,
        duration: 1.2,
        ease: 'power3.out',
        delay: 0.2,
      });

      gsap.utils.toArray<HTMLElement>('.gsap-hero-stat').forEach((stat, idx) => {
        gsap.from(stat, {
          opacity: 0,
          y: 24,
          duration: 0.8,
          ease: 'power2.out',
          delay: 0.4 + idx * 0.08,
        });
      });

      gsap.utils.toArray<HTMLElement>('.gsap-section-card').forEach((card) => {
        gsap.from(card, {
          opacity: 0,
          y: 32,
          duration: 0.9,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: card,
            start: 'top 85%',
          },
        });
      });

      gsap.utils.toArray<HTMLElement>('.gsap-floating-pill').forEach((pill, idx) => {
        gsap.to(pill, {
          y: 4,
          repeat: -1,
          yoyo: true,
          duration: 3 + idx * 0.3,
          ease: 'sine.inOut',
        });
      });
    }, pageRef);

    return () => ctx.revert();
  }, []);

  const teamMembers = [
    {
      id: 'manu-tyagi',
      name: "Manu Tyagi",
      role: "Founder & NISM Certified Research Analyst",
      image: '/images/manu.jpeg',
      shortBio: "NISM-certified Research Analyst with over five years of trading experience in the Indian and U.S. equity markets.",
      bio: "Manu Tyagi, Founder of InvestBeans, is a NISM-certified Research Analyst with over five years of trading experience in the Indian and U.S. equity markets. Backed by a decade of corporate experience with leading multinational organizations, Manu brings strategic insight, analytical depth, and a mission-driven approach to simplifying market complexities.",
      linkedin: '#',
    },
    {
      id: 'mona-tyagi',
      name: "Mona Tyagi",
      role: "Co-Founder & NISM Certified Equity Derivatives Specialist",
      image:
        '/images/Mona.jpeg',
      shortBio: 'MBA in Finance (Gold Medalist) and NISM-certified Equity Derivatives Specialist with over 15 years of experience.',
      bio: 'Mona Tyagi is an NISM-certified Equity Derivatives Specialist and MBA in Finance from APJ Abdul Kalam University, where she graduated as a gold medalist. Beginning her career in 2009 with Mansukh Finance and Securities Ltd as a Derivatives Analyst, she has since developed expertise of over 15 years across commodities, forex, and Indian equity. With over a decade of experience, Mona brings deep market insight, strong risk management skills, and a data-driven approach to investment strategies. At InvestBeans, she empowers traders and investors with actionable research and practical guidance.',
      linkedin: '#',
    },
  ];

  const allValues = [
    { icon: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z", title: 'Integrity', desc: "Always doing the right thing, even when no one's watching", gradient: 'from-blue-500 to-blue-600' },
    { icon: 'M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z', title: 'Transparency', desc: 'Clear communication and complete honesty in every interaction', gradient: 'from-green-500 to-green-600' },
    { icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z', title: 'Client-Centricity', desc: "Prioritizing our learners' and clients' growth over everything else", gradient: 'from-purple-500 to-purple-600' },
    { icon: 'M13 10V3L4 14h7v7l9-11h-7z', title: 'Adaptability', desc: 'Embracing change and aligning with ever-shifting market dynamics', gradient: 'from-orange-500 to-orange-600' },
    { icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z', title: 'Ethics & Accountability', desc: 'Upholding the highest standards in education and guidance', gradient: 'from-red-500 to-red-600' },
    { icon: 'M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z', title: 'Excellence in Service', desc: 'Striving for unmatched quality in every initiative', gradient: 'from-yellow-500 to-yellow-600' },
    { icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z', title: 'Diversity & Inclusion', desc: 'Encouraging participation from all backgrounds', gradient: 'from-indigo-500 to-indigo-600' },
    { icon: 'M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z', title: 'Sustainability', desc: 'Promoting long-term growth over quick, speculative gains', gradient: 'from-teal-500 to-teal-600' },
    { icon: 'M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z', title: 'Trust', desc: 'The most valuable investment we build every day', gradient: 'from-pink-500 to-pink-600' },
  ];

  const heroStats = [
    { label: 'Learners Guided', value: '3.5K+', detail: 'across equities, commodities & forex' },
    { label: 'Workshops Hosted', value: '120+', detail: 'community-led learning sessions' },
    { label: 'Research Hours', value: '18K+', detail: 'spent decoding the markets' },
  ];

  const founderMilestones = [
    { year: '2009', title: 'Derivatives & Commodities', detail: 'Began career at Mansukh Finance as a Derivatives Analyst.' },
    { year: '2014-2019', title: 'Corporate Strategy', detail: 'Led CXO engagements at WNS, DS Group, Radisson & Publicis.' },
    { year: '2020', title: 'Global Market Exposure', detail: 'Active trading across Indian and U.S. equity markets.' },
    { year: '2024', title: 'InvestBeans', detail: 'Transforming WhatsApp knowledge circles into a structured research desk.' },
  ];

  const whyUsPoints = [
    { title: 'Research, Not Noise', desc: 'Structured research and market context that supports informed decision-making.' },
    { title: 'Integrity by Design', desc: 'Transparent communication, realistic framing, and ethics as a non-negotiable.' },
    { title: 'Framework-Driven Learning', desc: 'A consistent system built around market regime, sector leadership, and stock structure.' },
    { title: 'Cross-Market Perspective', desc: 'Equities, commodities, and forex — taught with a unified risk-first approach.' },
    { title: 'Built for Real People', desc: 'Learning tracks built for students, women, self-employed individuals, and working professionals.' },
    { title: 'Discipline That Compounds', desc: 'Practical skill-building in risk management, journaling, and capital protection principles.' },
  ];

  return (
    <Layout>

      <GlobalRevealStyles />

      <div ref={pageRef} className={`min-h-screen ${isLight ? "bg-[#f5f4f0] text-gray-900" : "bg-slate-950/95 text-white"}`}>
        {/* Hero Section */}
        <div className={`relative ${isLight ? "bg-gradient-to-br from-[#f0f6ff] via-[#f8fbff] to-[#eef4fd]" : "bg-[radial-gradient(circle_at_top,_rgba(81,140,255,0.25),_transparent_55%)]"}`}>
          <div className="absolute inset-0 pointer-events-none">
            <div className={`absolute inset-x-0 top-40 h-64 bg-gradient-to-b blur-3xl ${isLight ? "from-blue-100/40 via-transparent to-transparent" : "from-blue-500/10 via-transparent to-transparent"}`}></div>
            <div className={`absolute -bottom-10 right-10 w-72 h-72 blur-[120px] rounded-full ${isLight ? "bg-purple-200/20" : "bg-purple-500/10"}`}></div>
            <div className={`absolute -top-24 left-1/3 w-80 h-80 blur-[140px] rounded-full ${isLight ? "bg-blue-200/30" : "bg-cyan-400/20"}`}></div>
          </div>
          <div className="relative z-10 container mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 pt-3 pb-10 sm:pb-14 lg:pb-16">

            {/* <div className="grid lg:grid-cols-2 gap-8 items-start ">
              <div className="min-w-0 space-y-5 text-center lg:text-left gsap-hero-title ">
                <span className={`inline-flex items-center gap-2 text-xs uppercase tracking-[0.5em] ${isLight ? "text-blue-500" : "text-blue-200/80"}`}>
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span>
                  InvestBeans DNA
                </span>
                <h1  className={`text-3xl sm:text-4xl lg:text-4xl xl:text-5xl font-black leading-tight ${isLight ? "text-blue-600" : "text-white"}`}>
              
                We don’t sell calls.<span  className="block mt-2 xl:text-5xl  ">We build decision-makers.</span>
                </h1>
                
                <h1 className={`text-[18px] sm:text-2xl lg:text-3xl font-black leading-tight ${isLight ? "text-blue-700" : "text-white"}`}>
                “ Baazigar Banein… Sattebaaz Nahi ” 
                </h1>
                <p className={`text-sm sm:text-base lg:textsm   max-w-2xl mx-auto lg:mx-0 ${isLight ? "text-gray-500" : "text-blue-100/90"}`}>
                  We blend research-driven insights, ethical practices, and human mentorship so you can navigate markets with clarity, calm, and conviction.
                </p>
                <div className={`flex flex-wrap justify-center lg:justify-start items-start gap-2 py-1 text-[11px] uppercase tracking-[0.2em] ${isLight ? "text-gray-500" : "text-white/70"}`}>
                  {[['Clarity Over', 'Noise'], ['Discipline Over', 'Emotion'], ['Process Over', 'Predictions']].map(([line1, line2]) => (
                    <span key={line1} className={`gsap-floating-pill inline-flex flex-col items-center justify-center text-center rounded-2xl border px-4 py-2 leading-snug ${isLight ? "border-gray-200 bg-white shadow-sm" : "border-white/25 bg-white/5"}`}>
                      <span>{line1}</span>
                      <span>{line2}</span>
                    </span>
                  ))}
                </div>

              </div>

              <div className="min-w-0 lg:pt-6">
                <div className={`gsap-hero-panel relative rounded-[32px] p-6 sm:p-7 ${isLight ? "bg-white border border-gray-100 shadow-xl" : "border border-white/10 bg-white/5 backdrop-blur-2xl shadow-[0_20px_80px_-40px_rgba(15,23,42,0.8)]"}`}>
                  <div className="absolute -top-6 -right-10 w-18 h-18 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-2xl blur-2xl opacity-30"></div>
                  <div className="relative space-y-5">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-900/50">
                        <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                      </div>
                      <div>
                        <p className={`text-xs uppercase tracking-[0.4em] ${isLight ? "text-gray-400" : "text-white/60"}`}>Founded 2024</p>
                        <p className={`text-base font-semibold ${isLight ? "text-gray-800" : "text-white"}`}>Education & Research Collective</p>
                        <p className={`text-xs mt-0.5 ${isLight ? "text-gray-400" : "text-white/60"}`}>NISM-certified Research Analyst</p>
                      </div>
                    </div>
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-xs font-semibold ${isLight ? "text-emerald-700" : "text-emerald-300"}`}>
                      <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      Ethics-first
                    </span>
                    <div className={`rounded-2xl p-4 ${isLight ? "border border-gray-100 bg-gray-50" : "border border-white/15 bg-white/5"}`}>
                      <p className={`text-xs uppercase tracking-[0.3em] mb-1 ${isLight ? "text-gray-400" : "text-white/60"}`}>Focus</p>
                      <div className={`flex flex-wrap gap-2 text-sm font-semibold ${isLight ? "text-gray-700" : "text-white"}`}>
                        {['Equities', 'Commodities', 'Forex', 'Learn'].map((item) => (
                          <span key={item} className={`px-3 py-1 rounded-full ${isLight ? "bg-white border border-gray-200 text-gray-600 shadow-sm" : "bg-white/10 border border-white/10"}`}>
                            {item}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className={`rounded-2xl p-5 ${isLight ? "border border-blue-100 bg-blue-50" : "border border-white/20 bg-gradient-to-br from-blue-600/20 to-purple-600/10"}`}>
                      <p className={`text-xs uppercase tracking-[0.4em] ${isLight ? "text-blue-400" : "text-white/60"}`}>Promise</p>
                      <p className={`mt-2 text-sm ${isLight ? "text-blue-700" : "text-blue-100/90"}`}>
                        No shortcuts. No noise. Just research-led judgment and disciplined risk thinking.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div> */}
            <div className="grid lg:grid-cols-2 gap-8 items-stretch">

              {/* ── LEFT COLUMN ── */}
              <div className="min-w-0 flex flex-col justify-center space-y-5 text-center lg:text-left gsap-hero-title">
                <span className={`inline-flex items-center gap-2 text-xs uppercase tracking-[0.5em] ${isLight ? "text-blue-500" : "text-blue-200/80"}`}>
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span>
                  InvestBeans DNA
                </span>

                {/* ✅ Single-line headline — no block/break */}
                <h1 className={`text-3xl sm:text-4xl xl:text-5xl font-black leading-tight ${isLight ? "text-blue-600" : "text-white"}`}>
                  We don't sell calls. We build decision-makers.
                </h1>

                <h2 className={`text-[18px] sm:text-2xl lg:text-3xl font-black leading-tight ${isLight ? "text-blue-700" : "text-white"}`}>
                  " Baazigar Banein… Sattebaaz Nahi "
                </h2>

                <p className={`text-sm sm:text-xl max-w-2xl mx-auto lg:mx-0 ${isLight ? "text-gray-500" : "text-blue-100/90"}`}>
                  We blend research-driven insights, ethical practices, and human mentorship so you can navigate markets with clarity, calm, and conviction.
                </p>

                <div className={`flex flex-wrap justify-center lg:justify-start items-start gap-2 py-1 text-[11px] uppercase tracking-[0.2em] ${isLight ? "text-gray-500" : "text-white/70"}`}>
                  {[['Clarity Over', 'Noise'], ['Discipline Over', 'Emotion'], ['Process Over', 'Predictions']].map(([line1, line2]) => (
                    <span
                      key={line1}
                      className={`gsap-floating-pill inline-flex flex-col items-center justify-center text-center rounded-2xl border px-4 py-2 leading-snug ${isLight ? "border-gray-200 bg-white shadow-sm" : "border-white/25 bg-white/5"}`}
                    >
                      <span>{line1}</span>
                      <span>{line2}</span>
                    </span>
                  ))}
                </div>
              </div>

              {/* ── RIGHT COLUMN ── equal height via flex */}
              <div className="min-w-0 flex flex-col lg:pt-6">
                <div className={`gsap-hero-panel relative rounded-[32px] p-6 sm:p-7 flex-1 flex flex-col justify-between ${isLight ? "bg-white border border-gray-100 shadow-xl" : "border border-white/10 bg-white/5 backdrop-blur-2xl shadow-[0_20px_80px_-40px_rgba(15,23,42,0.8)]"}`}>
                  <div className="absolute -top-6 -right-10 w-18 h-18 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-2xl blur-2xl opacity-30"></div>

                  <div className="relative space-y-5">
                    {/* Header row */}
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-900/50">
                        <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                      </div>
                      <div>
                        <p className={`text-xs uppercase tracking-[0.4em] ${isLight ? "text-gray-400" : "text-white/60"}`}>Founded 2024</p>
                        <p className={`text-base font-semibold ${isLight ? "text-gray-800" : "text-white"}`}>Education & Research Collective</p>
                        <p className={`text-xs mt-0.5 ${isLight ? "text-gray-400" : "text-white/60"}`}>NISM-certified Research Analyst</p>
                      </div>
                    </div>

                    {/* Ethics badge */}
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-xs font-semibold ${isLight ? "text-emerald-700" : "text-emerald-300"}`}>
                      <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      Ethics-first
                    </span>

                    {/* Focus row */}
                    <div className={`rounded-2xl p-4 ${isLight ? "border border-gray-100 bg-gray-50" : "border border-white/15 bg-white/5"}`}>
                      <p className={`text-xs uppercase tracking-[0.3em] mb-1 ${isLight ? "text-gray-400" : "text-white/60"}`}>Focus</p>
                      <div className={`flex flex-wrap gap-2 text-sm font-semibold ${isLight ? "text-gray-700" : "text-white"}`}>
                        {['Equities', 'Commodities', 'Forex', 'Learn'].map((item) => (
                          <span key={item} className={`px-3 py-1 rounded-full ${isLight ? "bg-white border border-gray-200 text-gray-600 shadow-sm" : "bg-white/10 border border-white/10"}`}>
                            {item}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Promise row */}
                    <div className={`rounded-2xl p-5 ${isLight ? "border border-blue-100 bg-blue-50" : "border border-white/20 bg-gradient-to-br from-blue-600/20 to-purple-600/10"}`}>
                      <p className={`text-xs uppercase tracking-[0.4em] ${isLight ? "text-blue-400" : "text-white/60"}`}>Promise</p>
                      <p className={`mt-2 text-sm ${isLight ? "text-blue-700" : "text-blue-100/90"}`}>
                        No shortcuts. No noise. Just research-led judgment and disciplined risk thinking.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

            </div>

            {/* Stats hidden for now
            <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {heroStats.map((stat) => (
                <div
                  key={stat.label}
                  className="gsap-hero-stat rounded-3xl border border-white/10 bg-white/5 p-5 sm:p-6 backdrop-blur-xl"
                >
                  <p className="text-xs uppercase tracking-[0.4em] text-white/60">{stat.label}</p>
                  <p className="text-3xl font-bold text-white mt-2">{stat.value}</p>
                  <p className="text-sm text-blue-100/80 mt-1">{stat.detail}</p>
                </div>
              ))}
            </div>
            */}
          </div>
        </div>

        {/* Sticky sub-navigation */}
        <div className={`sticky top-0 z-20 border-b backdrop-blur-lg ${isLight ? "border-gray-100 bg-white/90" : "border-white/10 bg-slate-950/85"}`}>
          <div className="container mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-2 sm:gap-3 py-3" role="tablist" aria-label="About page sections">
              <div className="flex items-center gap-2 sm:gap-3 overflow-x-auto no-scrollbar flex-1">
                {[
                  { href: '#our-story', label: 'Our Story' },
                  { href: '#mission', label: 'Mission & Vission' },
                  { href: '#core-values', label: ' Values' },
                  { href: '#team-members', label: 'Team' },
                  { href: '#why-us', label: 'Why Us' },
                  { href: '#what-we do', label: 'What We Do' },
                  { href: '#certifications', label: 'Trust and Compliance' },
                ].map((item, idx) => (
                  <a
                    key={idx}
                    href={item.href}
                    className={`text-xs sm:text-sm px-3.5 py-1.5 rounded-full border transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 whitespace-nowrap ${activeSection === item.href.replace('#', '')
                        ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white border-transparent shadow-lg shadow-blue-900/30'
                        : isLight
                          ? 'text-gray-500 border-gray-200 hover:text-gray-800 hover:border-gray-300 bg-white'
                          : 'text-white/70 border-white/15 hover:text-white hover:border-white/40'
                      }`}
                    role="tab"
                    aria-selected={activeSection === item.href.replace('#', '')}
                  >
                    {item.label}
                  </a>
                ))}
              </div>
              <button
                type="button"
                className="hidden sm:inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-blue-500 to-indigo-500 px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-blue-500/25 hover:scale-[1.02] transition-all whitespace-nowrap flex-shrink-0"
              >
                Join the Community
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        <div className={`container mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-10 sm:py-14 ${isLight ? "text-gray-900" : "text-slate-100"}`}>
          {/* Our Story Section */}
          <Reveal id="our-story" className="scroll-mt-24 mb-10">
            <div className={`gsap-section-card relative overflow-hidden rounded-[32px] p-6 sm:p-10 ${isLight ? "bg-white border border-gray-100 shadow-xl shadow-gray-100" : "border border-white/10 bg-white text-slate-900 shadow-[0_40px_120px_-60px_rgba(15,23,42,0.5)]"}`}>
              <div className="absolute inset-y-0 right-0 w-1/2 bg-gradient-to-br from-blue-50 to-white pointer-events-none opacity-70"></div>
              <div className="relative">
                <div className="flex items-center gap-3 mb-6">
                  <div className="rounded-2xl bg-blue-100 text-blue-700 w-12 h-12 flex items-center justify-center shadow-inner shadow-blue-200">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.4em] text-slate-500">Origin story</p>
                    <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">From one trader's journey to a trusted research desk</h2>
                  </div>
                </div>

                <div className="grid gap-8 lg:grid-cols-[1fr_1fr]">
                  <div className="space-y-4 text-slate-600 text-sm sm:text-base leading-relaxed">
                    <p>
                      InvestBeans began with the founder’s trading journey — built through self-learning, discipline, and consistent results. As friends and peers started seeking guidance, a small WhatsApp circle formed around market discussions, structured methods, and responsible risk thinking.
                    </p>
                    <p>
                      What started informally soon became a trusted space for tailored strategies and clearer decision-making. Over time, that trust evolved into InvestBeans — an education and research collective designed to help traders and investors navigate markets with confidence, clarity, and conviction.
                    </p>
                    <p>
                      Every cohort receives market structure primers, journaling techniques, and risk frameworks that emphasize judgement over gut feel. We obsess over context, ethics, and sustainability so that every learner can read markets with calm clarity.
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div className="rounded-3xl border border-blue-100 bg-blue-50 p-5">
                      <p className="text-xs uppercase tracking-[0.3em] text-blue-700">We stand for</p>
                      <ul className="mt-4 space-y-3 text-sm text-blue-900">
                        <li className="flex items-start gap-2">
                          <span className="mt-1 w-1.5 h-1.5 rounded-full bg-blue-600"></span>
                          Education before execution
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="mt-1 w-1.5 h-1.5 rounded-full bg-blue-600"></span>
                          Transparency in research and process
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="mt-1 w-1.5 h-1.5 rounded-full bg-blue-600"></span>
                          Risk management as a non-negotiable
                        </li>
                      </ul>
                    </div>
                    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-inner shadow-slate-100">
                      <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Quick facts</p>
                      <ul className="mt-3 space-y-2 text-sm text-slate-600">
                        <li>Founded in 2024 as a research-led learning collective</li>
                        <li>Built for all but especially for students, women, self-employed & private sector professionals</li>
                        <li>Multi-asset literacy: Equities • Commodities • Forex</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Reveal>



          {/* Team Members */}
          <div id="team-members" className="scroll-mt-24 mb-12">
            <div className="text-center mb-10">
              <p className={`text-xs uppercase tracking-[0.5em] ${isLight ? "text-gray-400" : "text-white/60"}`}>Team</p>
              <h2 className={`text-3xl sm:text-4xl font-bold ${isLight ? "text-gray-900" : "text-white"}`}>The minds behind InvestBeans</h2>
              <p className={`text-sm sm:text-base mt-2 ${isLight ? "text-gray-500" : "text-white/70"}`}>Research-led mentors and market practitioners focused on clarity, discipline and structured learning.</p>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
              {teamMembers.map((member, idx) => (
                <Reveal key={member.id} delay={idx * 80} className="gsap-section-card">
                  <div className={`relative overflow-hidden rounded-[28px] p-6 h-full ${isLight ? "bg-white border border-gray-100 shadow-lg" : "border border-white/10 bg-white/5 backdrop-blur-xl"}`}>
                    <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-blue-500/10 pointer-events-none"></div>
                    <div className="relative flex flex-col gap-5">
                      <div className="flex gap-4 items-center">
                        <div className="relative w-20 h-20 rounded-2xl overflow-hidden object-cover ">
                          {member.image ? (
                            <img
                              src={member.image}
                              alt={member.name}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(member.name)}&background=3b82f6&color=ffffff&size=512`;
                              }}
                            />
                          ) : (
                            <div className="w-full h-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-2xl font-bold text-white">
                              {member.name
                                .split(' ')
                                .map((n) => n[0])
                                .join('')}
                            </div>
                          )}
                        </div>
                        <div>
                          <p className={`text-lg font-semibold ${isLight ? "text-gray-900" : "text-white"}`}>{member.name}</p>
                          <p className={`text-sm ${isLight ? "text-gray-500" : "text-white/70"}`}>{member.role}</p>
                        </div>
                      </div>
                      <p id={`bio-${member.id}`} className={`text-sm leading-relaxed ${isLight ? "text-gray-600" : "text-white/80"}`}>
                        {expandedBios[member.id] ? member.bio : member.shortBio}
                      </p>
                      <div className="flex flex-wrap gap-3 items-center">
                        <button
                          type="button"
                          onClick={() => toggleBio(member.id)}
                          className={`inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.25em] transition-colors ${isLight ? "text-gray-400 hover:text-gray-800" : "text-white/70 hover:text-white"}`}
                          aria-expanded={!!expandedBios[member.id]}
                          aria-controls={`bio-${member.id}`}
                        >
                          {expandedBios[member.id] ? 'Show Less' : 'Read More'}
                          <svg className={`w-3 h-3 transition-transform ${expandedBios[member.id] ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </button>
                        <a
                          href={member.linkedin}
                          className={`inline-flex items-center gap-2 text-sm font-medium transition-colors ${isLight ? "text-blue-500 hover:text-blue-700" : "text-blue-200 hover:text-white"}`}
                        >
                          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                          </svg>
                          Connect
                        </a>
                      </div>
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>


          {/* Mission & Vision */}
          <div id="mission" className="scroll-mt-24 mb-12">
            <div className="text-center mb-6">
              <p className={`text-xs uppercase tracking-[0.5em] mb-2 ${isLight ? "text-gray-400" : "text-white/60"}`}>Our Purpose</p>
              <h2 className={`text-3xl sm:text-4xl font-bold ${isLight ? "text-gray-900" : "text-white"}`}>Trust Signals</h2>
              <div className="w-20 h-1 bg-gradient-to-r from-blue-600 to-emerald-500 mx-auto rounded-full mt-3"></div>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:items-stretch">
              <Reveal className="gsap-section-card h-full">
                <div className="relative overflow-hidden rounded-[30px] border border-white/10 bg-gradient-to-br from-blue-600/70 to-blue-800/80 p-6 sm:p-8 text-white shadow-[0_25px_80px_-40px_rgba(37,99,235,0.9)] h-full">
                  <div className="absolute inset-0 opacity-40 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.3),_transparent_60%)]"></div>
                  <div className="relative space-y-4">
                    <p className="text-xs uppercase tracking-[0.5em] text-white/70">Mission</p>
                    <h2 className="text-2xl font-semibold">Empower financial security through clarity and education.</h2>
                    <p className="text-sm text-white/85 leading-relaxed">
                      We help individuals build confidence in the markets through structured learning and research-led frameworks — designed to support disciplined decision-making and sustainable long-term growth at every stage of the journey.
                    </p>
                    <ul className="space-y-2 text-sm text-white/80">
                      <li className="flex gap-2"><span className="mt-1 w-1.5 h-1.5 rounded-full bg-white flex-shrink-0"></span>Structure learning journeys for every risk profile.</li>
                      <li className="flex gap-2"><span className="mt-1 w-1.5 h-1.5 rounded-full bg-white flex-shrink-0"></span>Coach capital protection and risk journaling.</li>
                      <li className="flex gap-2"><span className="mt-1 w-1.5 h-1.5 rounded-full bg-white flex-shrink-0"></span>Deliver mentorship that sticks beyond a webinar.</li>
                    </ul>
                  </div>
                </div>
              </Reveal>

              <Reveal id="vision" className="gsap-section-card h-full">
                <div className="relative overflow-hidden rounded-[30px] border border-white/10 bg-gradient-to-br from-emerald-600/70 to-cyan-600/70 p-6 sm:p-8 text-white shadow-[0_25px_80px_-40px_rgba(16,185,129,0.9)] h-full">
                  <div className="absolute inset-0 opacity-40 bg-[radial-gradient(circle_at_bottom,_rgba(255,255,255,0.25),_transparent_50%)]"></div>
                  <div className="relative space-y-4">
                    <p className="text-xs uppercase tracking-[0.5em] text-white/70">Vision</p>
                    <h2 className="text-2xl font-semibold">Make ethical wealth-building accessible to all.</h2>
                    <p className="text-sm text-white/85 leading-relaxed">
                      We aspire to lead in generational wealth creation through financial literacy, confidence, and long-term resilience — especially for women, youth, and underserved communities.
                    </p>
                    <ul className="space-y-2 text-sm text-white/80">
                      <li className="flex gap-2"><span className="mt-1 w-1.5 h-1.5 rounded-full bg-white flex-shrink-0"></span>Empower women through financial confidence.</li>
                      <li className="flex gap-2"><span className="mt-1 w-1.5 h-1.5 rounded-full bg-white flex-shrink-0"></span>Build financial literacy for the next generation.</li>
                      <li className="flex gap-2"><span className="mt-1 w-1.5 h-1.5 rounded-full bg-white flex-shrink-0"></span>Strengthen resilience against economic shocks.</li>
                    </ul>
                  </div>
                </div>
              </Reveal>
            </div>
          </div>

          {/* Company Values (unchanged content) */}
          {/* Company Values - Connected Circles Design */}
          <Reveal id="core-values" className="scroll-mt-24 mb-8">
            <div className="text-center mb-4">
              <h2 className={`text-2xl sm:text-3xl lg:text-4xl font-bold mb-4 ${isLight ? "text-gray-900" : "text-white"}`}>Our Core Values</h2>
              <div className="w-20 h-1 bg-gradient-to-r from-blue-600 to-purple-600 mx-auto rounded-full"></div>
            </div>

            {/* Mobile View - Vertical List */}
            <div className="block lg:hidden px-4">
              <div className="space-y-6">
                {allValues.slice(0, showAllValues ? undefined : 5).map((value, idx) => (
                  <div key={idx} className="flex items-center gap-4 transition-transform duration-500 hover:translate-x-1">
                    <div className={`relative flex-shrink-0 w-20 h-20 rounded-full bg-gradient-to-br ${value.gradient} flex items-center justify-center shadow-lg`}>
                      <div className="w-16 h-16 rounded-full border-4 border-white/30 flex items-center justify-center">
                        <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={value.icon} />
                        </svg>
                      </div>
                    </div>

                    <div className="flex-1">
                      <h3 className={`text-base font-bold mb-1 ${isLight ? "text-gray-900" : "text-white"}`}>{value.title}</h3>
                      <p className="text-xs text-gray-500 leading-relaxed">{value.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="text-center mt-8">
                <button
                  onClick={() => setShowAllValues(!showAllValues)}
                  type="button"
                  className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-2.5 rounded-full font-semibold text-sm hover:shadow-lg hover:scale-105 transition-all duration-300"
                >
                  <span>{showAllValues ? 'Show Less' : `View All ${allValues.length} Values`}</span>
                  <svg className={`w-4 h-4 transition-transform ${showAllValues ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Desktop View - Connected Circles */}
            <div className="hidden lg:block">
              <div className="relative max-w-6xl mx-auto py-6">
                <div className="flex justify-center items-center gap-8 mb-4">
                  {allValues.slice(0, 5).map((value, idx) => (
                    <div key={idx} className="relative group">
                      {idx < 5 && (
                        <div className="absolute left-1/2 top-full w-0.5 h-12 bg-gradient-to-b from-gray-300 to-transparent -ml-px"></div>
                      )}

                      <div className="flex flex-col items-center">
                        <div className={`relative w-28 h-28 rounded-full bg-gradient-to-br ${value.gradient} flex items-center justify-center shadow-xl group-hover:scale-110 group-hover:shadow-2xl transition-all duration-500 cursor-pointer`}>
                          <div className="w-24 h-24 rounded-full border-4 border-white/30 flex items-center justify-center backdrop-blur-sm">
                            <svg className="w-10 h-10 text-white group-hover:scale-110 transition-transform duration-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={value.icon} />
                            </svg>
                          </div>
                        </div>

                        <div className="mt-3 text-gray-400">
                          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M7 10l5 5 5-5z" />
                          </svg>
                        </div>

                        <div className={`w-4 h-4 rounded-full bg-gradient-to-br ${value.gradient} shadow-md mt-3`}></div>

                        <h3 className={`mt-3 text-sm font-bold text-center max-w-[120px] group-hover:text-blue-600 transition-colors ${isLight ? "text-gray-800" : "text-white"}`}>
                          {value.title}
                        </h3>

                        <p className="mt-2 text-xs text-gray-500 text-center max-w-[140px] leading-relaxed">
                          {value.desc}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="relative h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent mb-6"></div>

                <div className="flex justify-center items-center gap-8">
                  {allValues.slice(5, 9).map((value, idx) => (
                    <div key={idx + 5} className="relative group">
                      <div className="flex flex-col items-center">
                        <div className={`w-4 h-4 rounded-full bg-gradient-to-br ${value.gradient} shadow-md mb-3`}></div>

                        <div className="mb-3 text-gray-400 rotate-180">
                          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M7 10l5 5 5-5z" />
                          </svg>
                        </div>

                        <div className={`relative w-28 h-28 rounded-full bg-gradient-to-br ${value.gradient} flex items-center justify-center shadow-xl group-hover:scale-110 group-hover:shadow-2xl transition-all duration-500 cursor-pointer`}>
                          <div className="w-24 h-24 rounded-full border-4 border-white/30 flex items-center justify-center backdrop-blur-sm">
                            <svg className="w-10 h-10 text-white group-hover:scale-110 transition-transform duration-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={value.icon} />
                            </svg>
                          </div>
                        </div>

                        <h3 className={`mt-3 text-sm font-bold text-center max-w-[120px] group-hover:text-blue-600 transition-colors ${isLight ? "text-gray-800" : "text-white"}`}>
                          {value.title}
                        </h3>

                        <p className="mt-2 text-xs text-gray-500 text-center max-w-[140px] leading-relaxed">
                          {value.desc}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Reveal>

          {/* Why Us Section */}
          <Reveal id="why-us" className="scroll-mt-24 mb-12">
            <div className={`gsap-section-card relative overflow-hidden rounded-[32px] p-6 sm:p-10 ${isLight ? "bg-white border border-gray-100 shadow-xl" : "border border-white/10 bg-white/5 backdrop-blur-2xl"}`}>
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 via-transparent to-blue-500/10"></div>
              <div className="relative">
                <div className="text-center mb-8 space-y-3">
                  <p className={`text-xs uppercase tracking-[0.5em] ${isLight ? "text-gray-400" : "text-white/60"}`}>Why us</p>
                  <h2 className={`text-3xl font-bold ${isLight ? "text-gray-900" : "text-white"}`}>Designed for clarity, not hype.</h2>
                  <p className={`text-sm max-w-3xl mx-auto ${isLight ? "text-gray-500" : "text-white/70"}`}>
                    Research-led education and structured frameworks to help you navigate markets with discipline and confidence.
                  </p>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  {whyUsPoints.map((item, idx) => (
                    <div
                      key={item.title}
                      className={`rounded-2xl p-5 flex gap-4 items-start text-left ${isLight ? "border border-gray-100 bg-gray-50" : "border border-white/10 bg-white/5"}`}
                    >
                      <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-white font-semibold">
                        {idx + 1}
                      </div>
                      <div>
                        <h3 className={`text-base font-semibold ${isLight ? "text-gray-900" : "text-white"}`}>{item.title}</h3>
                        <p className={`text-sm mt-1 ${isLight ? "text-gray-500" : "text-white/70"}`}>{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Reveal>
          <Reveal id='what-we do'>
            <WhatWeDo />
          </Reveal>


          {/* Certifications Section */}
          <Reveal id="certifications" className="scroll-mt-24 mb-12">
            <div className={`gsap-section-card relative overflow-hidden rounded-[32px] p-6 sm:p-10 ${isLight ? "border border-amber-200 bg-gradient-to-br from-amber-50 to-white" : "border border-amber-400/30 bg-gradient-to-br from-amber-900/30 to-slate-800/90"}`}>
              <div className="absolute inset-0 opacity-60 bg-[radial-gradient(circle_at_top,_rgba(251,191,36,0.2),_transparent_65%)]"></div>
              <div className="relative space-y-6">
                <div className="flex flex-wrap items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-amber-500 text-white flex items-center justify-center shadow-lg shadow-amber-200">
                    <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                    </svg>
                  </div>
                  <div>
                    <p className={`text-xs uppercase tracking-[0.4em] ${isLight ? "text-amber-700/80" : "text-amber-300/80"}`}>Trust signals</p>
                    <h2 className={`text-2xl font-bold ${isLight ? "text-amber-900" : "text-amber-100"}`}>Certifications & Governance</h2>
                  </div>
                </div>
                <p className={`text-sm leading-relaxed ${isLight ? "text-amber-800" : "text-amber-100/90"}`}>
                  Our analysts hold <strong>NISM Research Analyst</strong> and <strong>NISM Equity Derivatives</strong> certifications. While InvestBeans is currently in the process
                  of aligning with SEBI registration pathways, we already operate with SEBI-grade documentation, disclosures, and audit trails for every advisory note.
                </p>
                <div className={`rounded-2xl border p-5 text-sm space-y-2 ${isLight ? "border-amber-200 bg-white/80 text-amber-900" : "border-amber-400/30 bg-amber-950/40 text-amber-100"}`}>
                  <p className="font-semibold">What this means for you:</p>
                  <ul className="space-y-2">
                    <li className="flex gap-2">
                      <span className="mt-1 w-1.5 h-1.5 rounded-full bg-amber-500 flex-shrink-0"></span>
                      Ethical screens on all shared research.
                    </li>
                    <li className="flex gap-2">
                      <span className="mt-1 w-1.5 h-1.5 rounded-full bg-amber-500 flex-shrink-0"></span>
                      Transparent risk labeling & scenario matrices.
                    </li>
                    <li className="flex gap-2">
                      <span className="mt-1 w-1.5 h-1.5 rounded-full bg-amber-500 flex-shrink-0"></span>
                      Continuous upskilling roadmap aligned to regulators.
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </Reveal>

          {/* Join Our Mission CTA */}
          <Reveal id="join" className="scroll-mt-24 text-center">
            <div className="gsap-section-card relative overflow-hidden rounded-[32px] border border-white/10 bg-gradient-to-br from-orange-500 to-pink-500 px-6 sm:px-10 py-10 text-white shadow-[0_30px_90px_-40px_rgba(249,115,22,0.8)]">
              <div className="absolute inset-0 opacity-40 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.35),_transparent_60%)]"></div>
              <div className="relative space-y-4">
                <p className="text-xs uppercase tracking-[0.5em] text-white/70">Join us</p>
                <h2 className="text-3xl font-bold">Build disciplined wealth with a community that cares.</h2>
                <p className="text-sm text-white/90 max-w-2xl mx-auto">
                  Cohort-based learning, office-hours, templates, and honest conversations about money. Leave the hype, keep the habits.
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                  <button
                    type="button"
                    className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white text-orange-600 px-6 sm:px-8 py-3 font-semibold shadow-lg shadow-orange-900/30"
                  >
                    Apply for next cohort
                  </button>
                  <button
                    type="button"
                    className="inline-flex items-center justify-center rounded-2xl border border-white/50 px-6 py-3 font-semibold text-white/90"
                  >
                    Talk to us
                  </button>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </Layout>
  );
};

export default TeamView;