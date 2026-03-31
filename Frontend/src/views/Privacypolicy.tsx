import React, { useState, useEffect, useRef } from 'react';
import { useTheme } from '@/controllers/Themecontext';
import Header from '@/components/Header';

const sections = [
  { id: 'regulatory',    num: '01', title: 'Regulatory Position & SEBI Disclaimer' },
  { id: 'collection',   num: '02', title: 'Information We Collect' },
  { id: 'usage',        num: '03', title: 'How We Use Your Data' },
  { id: 'legal-basis',  num: '04', title: 'Legal Basis for Processing' },
  { id: 'sharing',      num: '05', title: 'Sharing & Disclosure' },
  { id: 'retention',    num: '06', title: 'Data Retention' },
  { id: 'security',     num: '07', title: 'Security Measures' },
  { id: 'rights',       num: '08', title: 'Your Rights' },
  { id: 'cookies',      num: '09', title: 'Cookies & Tracking' },
  { id: 'transfers',    num: '10', title: 'Cross-Border Transfers' },
  { id: 'third-party',  num: '11', title: 'Third-Party Links' },
  { id: 'children',     num: '12', title: "Children's Privacy" },
  { id: 'grievance',    num: '13', title: 'Grievance Officer' },
  { id: 'liability',    num: '14', title: 'Limitation of Liability' },
  { id: 'updates',      num: '15', title: 'Policy Updates' },
  { id: 'contact',      num: '16', title: 'Contact Us' },
];

export default function PrivacyPolicy() {
  const { theme } = useTheme();
  const isLight = theme === 'light';
  const [active, setActive] = useState('regulatory');
  const observersRef = useRef<IntersectionObserver[]>([]);

  // Scroll-spy
  useEffect(() => {
    observersRef.current.forEach(o => o.disconnect());
    observersRef.current = [];

    sections.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (!el) return;
      const obs = new IntersectionObserver(
        ([entry]) => { if (entry.isIntersecting) setActive(id); },
        { rootMargin: '-20% 0px -70% 0px' }
      );
      obs.observe(el);
      observersRef.current.push(obs);
    });
    return () => observersRef.current.forEach(o => o.disconnect());
  }, []);

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  // ── Design tokens ──────────────────────────────────────────────
  const bg       = isLight ? '#f8f7f3' : '#0e1117';
  const surface  = isLight ? '#ffffff' : '#161b27';
  const border   = isLight ? '#e8e4dc' : '#252d3d';
  const ink      = isLight ? '#1a1714' : '#eef0f4';
  const inkMid   = isLight ? '#5a5550' : '#8b96a8';
  const inkFaint  = isLight ? '#9c9690' : '#4a5568';
  const accent   = '#5194F6';
  const accentDim = isLight ? '#dce9fe' : '#1d2f4a';

  return (
    <div style={{ minHeight: '100vh', background: bg, color: ink, fontFamily: "'Inter', -apple-system, sans-serif" }}>

      {/* Inject fonts */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');

        * { box-sizing: border-box; margin: 0; padding: 0; }

        .pp-toclink {
          display: flex; align-items: center; gap: 10px;
          padding: 8px 12px; cursor: pointer; border: none; background: none;
          text-align: left; width: 100%; transition: all 0.15s; border-radius: 6px;
        }
        .pp-toclink:hover { background: ${isLight ? '#f3f4f6' : 'rgba(255,255,255,0.05)'}; }
        .pp-toclink:hover .pp-toctitle { color: ${ink}; }

        .pp-section { scroll-margin-top: 80px; padding: 40px 0; border-bottom: 1px solid ${border}; }
        .pp-section:last-child { border-bottom: none; }

        .pp-tag {
          display: inline-block; font-size: 11px; font-weight: 600;
          letter-spacing: 0.04em; text-transform: uppercase;
          padding: 2px 8px; border-radius: 4px;
        }

        .pp-notice {
          border-left: 3px solid; padding: 14px 18px; border-radius: 0 8px 8px 0;
          font-size: 14px; line-height: 1.7; margin-top: 16px;
        }

        .pp-table { width: 100%; border-collapse: collapse; font-size: 14px; margin-top: 16px; border-radius: 8px; overflow: hidden; border: 1px solid ${border}; }
        .pp-table th { text-align: left; font-weight: 600; font-size: 11px; letter-spacing: 0.06em;
          text-transform: uppercase; padding: 11px 16px; color: ${inkMid};
          background: ${isLight ? '#f9fafb' : 'rgba(255,255,255,0.03)'};
          border-bottom: 1px solid ${border}; }
        .pp-table td { padding: 12px 16px; border-bottom: 1px solid ${border}; color: ${inkMid}; line-height: 1.6; vertical-align: top; }
        .pp-table tr:last-child td { border-bottom: none; }
        .pp-table tr:hover td { background: ${isLight ? '#f9fafb' : 'rgba(255,255,255,0.02)'}; }

        .pp-contact-row { display: flex; gap: 16px; align-items: center; padding: 13px 0; border-bottom: 1px solid ${border}; }
        .pp-contact-row:last-child { border-bottom: none; }
        .pp-contact-label { font-size: 11px; font-weight: 600; letter-spacing: 0.06em;
          text-transform: uppercase; color: ${inkFaint}; min-width: 80px; }
        .pp-contact-value { font-size: 14px; color: ${ink}; }

        @media (max-width: 900px) {
          .pp-layout { flex-direction: column !important; }
          .pp-toc { display: none !important; }
        }
      `}</style>

      {/* ── Header ───────────────────────────────────────────────── */}
      <Header />

      {/* ── Hero ──────────────────────────────────────────────────── */}
      <div style={{ background: isLight ? '#ffffff' : '#0e1117', borderBottom: `1px solid ${border}` }}>
        <div style={{ maxWidth: 1160, margin: '0 auto', padding: '52px 48px 0' }}>

          {/* Breadcrumb */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 32, fontSize: 13, color: inkFaint }}>
            <span>Legal</span>
            <span style={{ fontSize: 10 }}>›</span>
            <span style={{ color: inkMid, fontWeight: 500 }}>Privacy Policy</span>
          </div>

          {/* Two-col: title left, badges right */}
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: 24, marginBottom: 40 }}>
            <div>
              <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: accent, marginBottom: 12 }}>
                Legal Document
              </p>
              <h1 style={{ fontSize: 'clamp(32px, 4vw, 52px)', fontWeight: 700, lineHeight: 1.1, color: ink, letterSpacing: '-0.025em', marginBottom: 14 }}>
                Privacy Policy
              </h1>
              <p style={{ fontSize: 15, color: inkMid, lineHeight: 1.7, maxWidth: 520 }}>
                InvestBeans is a proprietorship firm providing financial education and market research. This policy explains how we collect, use, and protect your personal data in accordance with Indian law.
              </p>
            </div>

            {/* Compliance badges stacked */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flexShrink: 0 }}>
              {[
                { label: 'DPDP Act, 2023', dot: '#22c55e' },
                { label: 'IT Act, 2000', dot: accent },
                { label: 'IT (SPDI) Rules, 2011', dot: '#a78bfa' },
              ].map(b => (
                <div key={b.label} style={{
                  display: 'inline-flex', alignItems: 'center', gap: 8,
                  padding: '7px 14px', borderRadius: 6,
                  border: `1px solid ${border}`,
                  background: isLight ? '#f9fafb' : 'rgba(255,255,255,0.04)',
                  fontSize: 12, fontWeight: 500, color: inkMid,
                }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: b.dot, flexShrink: 0 }} />
                  {b.label}
                </div>
              ))}
            </div>
          </div>

          {/* Horizontal meta bar — flush to edges, no padding below */}
          <div style={{ display: 'flex', borderTop: `1px solid ${border}` }}>
            {[
              { label: 'Jurisdiction', value: 'India' },
              { label: 'Framework', value: 'DPDP Act 2023 · IT Act 2000 · IT (SPDI) Rules 2011' },
            ].map((item, i) => (
              <div key={i} style={{
                padding: '16px 24px',
                borderRight: i === 0 ? `1px solid ${border}` : 'none',
                flex: i === 0 ? '0 0 180px' : '1',
              }}>
                <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: inkFaint, marginBottom: 5 }}>
                  {item.label}
                </div>
                <div style={{ fontSize: 13, color: inkMid, fontWeight: 500 }}>{item.value}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Layout ────────────────────────────────────────────────── */}
      <div className="pp-layout" style={{ maxWidth: 1160, margin: '0 auto', padding: '0 48px', display: 'flex', gap: 56, alignItems: 'flex-start' }}>

        {/* ── TOC sidebar ─────────────────────────────────────────── */}
        <aside className="pp-toc" style={{
          width: 220, flexShrink: 0, position: 'sticky', top: 80,
          paddingTop: 40, paddingBottom: 40, maxHeight: 'calc(100vh - 80px)', overflowY: 'auto',
        }}>
          <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: inkFaint, marginBottom: 8, paddingLeft: 12 }}>On this page</p>
          <nav>
            {sections.map(({ id, num, title }) => {
              const isActive = active === id;
              return (
                <button key={id} className="pp-toclink" onClick={() => scrollTo(id)}
                  style={{ background: isActive ? (isLight ? '#eff6ff' : 'rgba(81,148,246,0.08)') : 'none' }}>
                  <span className="pp-tocnum" style={{ fontSize: 10, fontWeight: 700, color: isActive ? accent : inkFaint, minWidth: 20, fontVariantNumeric: 'tabular-nums' }}>{num}</span>
                  <span className="pp-toctitle" style={{ fontSize: 13, color: isActive ? (isLight ? accent : '#93c5fd') : inkMid, fontWeight: isActive ? 600 : 400, lineHeight: 1.4 }}>{title}</span>
                </button>
              );
            })}
          </nav>
        </aside>

        {/* ── Main content ────────────────────────────────────────── */}
        <main style={{ flex: 1, minWidth: 0, paddingTop: 40, paddingBottom: 96 }}>

          {/* 01 – Regulatory Position */}
          <section id="regulatory" className="pp-section">
            <SectionHeader num="01" title="Regulatory Position & SEBI Disclaimer" accent={accent} ink={ink} inkFaint={inkFaint} />
            <p style={{ color: inkMid, lineHeight: 1.8, fontSize: 15, marginBottom: 20 }}>
              InvestBeans provides financial education, research insights, and general market information. We do not execute trades on behalf of clients, nor do we hold client funds or securities. Any information shared on our platform is for <strong style={{ color: ink }}>educational and informational purposes only.</strong>
            </p>
            <div className="pp-notice" style={{ borderColor: '#f59e0b', background: isLight ? '#fffbeb' : '#1f1a0e', color: isLight ? '#92400e' : '#fcd34d' }}>
              <strong>SEBI Registration Notice —</strong> We are NISM-certified and are in the process of obtaining SEBI registration. Until such registration is obtained, no content should be construed as investment advice or recommendation under SEBI regulations. Users are advised to consult a SEBI-registered investment advisor before making investment decisions.
            </div>
          </section>

          {/* 02 – Information We Collect */}
          <section id="collection" className="pp-section">
            <SectionHeader num="02" title="Information We Collect" accent={accent} ink={ink} inkFaint={inkFaint} />
            <table className="pp-table">
              <thead>
                <tr>
                  <th style={{ width: '28%' }}>Category</th>
                  <th>Data Points</th>
                  <th style={{ width: '22%' }}>Basis</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><strong style={{ color: ink }}>Personal Data</strong></td>
                  <td>Name, email, phone number, date of birth, risk profile, investment preferences</td>
                  <td><span className="pp-tag" style={{ background: accentDim, color: accent }}>Voluntary</span></td>
                </tr>
                <tr>
                  <td><strong style={{ color: ink }}>Sensitive Personal Data</strong></td>
                  <td>Financial capacity information, account-related data (only when voluntarily shared)</td>
                  <td><span className="pp-tag" style={{ background: isLight ? '#fef9c3' : '#1f1c06', color: isLight ? '#713f12' : '#fde047' }}>Consent Required</span></td>
                </tr>
                <tr>
                  <td><strong style={{ color: ink }}>Non-Personal Data</strong></td>
                  <td>IP address, device and browser details, usage analytics, cookies and tracking data</td>
                  <td><span className="pp-tag" style={{ background: isLight ? '#f0fdf4' : '#0a1f0e', color: isLight ? '#14532d' : '#86efac' }}>Automatic</span></td>
                </tr>
              </tbody>
            </table>
          </section>

          {/* 03 – How We Use Your Data */}
          <section id="usage" className="pp-section">
            <SectionHeader num="03" title="How We Use Your Data" accent={accent} ink={ink} inkFaint={inkFaint} />
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[
                'Deliver and improve our educational content and services',
                'Personalise your experience based on your risk profile and preferences',
                'Send transactional communications, service updates, and newsletters (with opt-out)',
                'Conduct internal analytics to improve platform performance',
                'Comply with legal obligations under Indian law',
                'Prevent fraud and ensure platform security',
              ].map(item => (
                <li key={item} style={{ display: 'flex', gap: 12, alignItems: 'flex-start', fontSize: 15, color: inkMid, lineHeight: 1.6 }}>
                  <span style={{ color: accent, marginTop: 3, flexShrink: 0 }}>→</span>
                  {item}
                </li>
              ))}
            </ul>
          </section>

          {/* 04 – Legal Basis */}
          <section id="legal-basis" className="pp-section">
            <SectionHeader num="04" title="Legal Basis for Processing" accent={accent} ink={ink} inkFaint={inkFaint} />
            <p style={{ color: inkMid, lineHeight: 1.8, fontSize: 15 }}>
              We process personal data under the following lawful bases: your explicit <strong style={{ color: ink }}>consent</strong>; performance of a <strong style={{ color: ink }}>contract</strong> with you; compliance with a <strong style={{ color: ink }}>legal obligation</strong>; and our <strong style={{ color: ink }}>legitimate interests</strong> in operating and improving our services, provided these do not override your fundamental rights.
            </p>
          </section>

          {/* 05 – Sharing */}
          <section id="sharing" className="pp-section">
            <SectionHeader num="05" title="Sharing & Disclosure" accent={accent} ink={ink} inkFaint={inkFaint} />
            <p style={{ color: inkMid, lineHeight: 1.8, fontSize: 15, marginBottom: 20 }}>
              We do not sell your personal data. We may share data with:
            </p>
            <table className="pp-table">
              <thead>
                <tr><th style={{ width: '30%' }}>Recipient</th><th>Purpose</th></tr>
              </thead>
              <tbody>
                {[
                  ['Service Providers', 'Hosting, analytics, payment processing, email delivery (under data processing agreements)'],
                  ['Legal Authorities', 'When required by Indian law, court order, or regulatory authority'],
                  ['Business Transfers', 'In the event of a merger or acquisition (you will be notified)'],
                ].map(([r, p]) => (
                  <tr key={r}><td><strong style={{ color: ink }}>{r}</strong></td><td>{p}</td></tr>
                ))}
              </tbody>
            </table>
          </section>

          {/* 06 – Retention */}
          <section id="retention" className="pp-section">
            <SectionHeader num="06" title="Data Retention" accent={accent} ink={ink} inkFaint={inkFaint} />
            <p style={{ color: inkMid, lineHeight: 1.8, fontSize: 15 }}>
              We retain personal data only for as long as necessary to fulfil the purposes outlined in this Policy or as required by applicable law. Account data is retained for the duration of your account plus a period of up to <strong style={{ color: ink }}>3 years</strong> thereafter. Non-personal and anonymised data may be retained indefinitely.
            </p>
          </section>

          {/* 07 – Security */}
          <section id="security" className="pp-section">
            <SectionHeader num="07" title="Security Measures" accent={accent} ink={ink} inkFaint={inkFaint} />
            <p style={{ color: inkMid, lineHeight: 1.8, fontSize: 15 }}>
              We implement industry-standard technical and organisational measures to protect your data, including TLS encryption in transit, access controls, and regular security reviews. While no system is perfectly secure, we take all reasonable steps to safeguard your information.
            </p>
          </section>

          {/* 08 – Rights */}
          <section id="rights" className="pp-section">
            <SectionHeader num="08" title="Your Rights" accent={accent} ink={ink} inkFaint={inkFaint} />
            <p style={{ color: inkMid, lineHeight: 1.8, fontSize: 15, marginBottom: 20 }}>Under Indian law, including the DPDP Act 2023, you have the right to:</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}>
              {[
                ['Access', 'Request a copy of your personal data'],
                ['Correction', 'Ask us to correct inaccurate data'],
                ['Erasure', 'Request deletion of your data'],
                ['Portability', 'Receive your data in a portable format'],
                ['Withdrawal', 'Withdraw consent at any time'],
                ['Grievance', 'Lodge a complaint with our Grievance Officer'],
              ].map(([title, desc]) => (
                <div key={title} style={{ padding: '16px', background: surface, border: `1px solid ${border}`, borderRadius: 8 }}>
                  <p style={{ fontSize: 13, fontWeight: 600, color: ink, marginBottom: 4 }}>{title}</p>
                  <p style={{ fontSize: 13, color: inkMid, lineHeight: 1.5 }}>{desc}</p>
                </div>
              ))}
            </div>
          </section>

          {/* 09 – Cookies */}
          <section id="cookies" className="pp-section">
            <SectionHeader num="09" title="Cookies & Tracking" accent={accent} ink={ink} inkFaint={inkFaint} />
            <p style={{ color: inkMid, lineHeight: 1.8, fontSize: 15 }}>
              We use essential cookies to operate our services and analytics cookies to understand usage patterns. You can manage cookie preferences via your browser settings. Disabling certain cookies may affect the functionality of our platform.
            </p>
          </section>

          {/* 10 – Transfers */}
          <section id="transfers" className="pp-section">
            <SectionHeader num="10" title="Cross-Border Transfers" accent={accent} ink={ink} inkFaint={inkFaint} />
            <p style={{ color: inkMid, lineHeight: 1.8, fontSize: 15 }}>
              Your data is primarily processed within India. Where service providers are located outside India, we ensure appropriate safeguards are in place in accordance with DPDP Act provisions, including contractual protections equivalent to those afforded under Indian law.
            </p>
          </section>

          {/* 11 – Third Party */}
          <section id="third-party" className="pp-section">
            <SectionHeader num="11" title="Third-Party Links" accent={accent} ink={ink} inkFaint={inkFaint} />
            <p style={{ color: inkMid, lineHeight: 1.8, fontSize: 15 }}>
              Our platform may contain links to broker platforms and external websites. We are not responsible for the privacy practices of third-party sites. We encourage you to review their privacy policies before sharing any data.
            </p>
          </section>

          {/* 12 – Children */}
          <section id="children" className="pp-section">
            <SectionHeader num="12" title="Children's Privacy" accent={accent} ink={ink} inkFaint={inkFaint} />
            <div className="pp-notice" style={{ borderColor: '#ef4444', background: isLight ? '#fef2f2' : '#1a0a0a', color: isLight ? '#991b1b' : '#fca5a5' }}>
              Our services are not directed at individuals under the age of 18. We do not knowingly collect personal data from minors. If we become aware of such collection, we will delete the data without delay.
            </div>
          </section>

          {/* 13 – Grievance */}
          <section id="grievance" className="pp-section">
            <SectionHeader num="13" title="Grievance Officer" accent={accent} ink={ink} inkFaint={inkFaint} />
            <p style={{ color: inkMid, lineHeight: 1.8, fontSize: 15, marginBottom: 20 }}>
              As mandated under the IT Act 2000 and DPDP Act 2023, we have appointed a Grievance Officer. Complaints will be acknowledged within 24 hours and resolved within 30 days.
            </p>
            <div style={{ padding: '8px 20px', background: surface, border: `1px solid ${border}`, borderRadius: 8 }}>
              {[
                ['Name', 'To be updated'],
                ['Email', 'support@investbeans.com'],
                ['Phone', 'To be updated'],
              ].map(([label, value]) => (
                <div key={label} className="pp-contact-row">
                  <span className="pp-contact-label">{label}</span>
                  <span className="pp-contact-value" style={{ color: label === 'Email' ? accent : ink }}>
                    {label === 'Email' ? <a href={`mailto:${value}`} style={{ color: accent, textDecoration: 'none' }}>{value}</a> : value}
                  </span>
                </div>
              ))}
            </div>
          </section>

          {/* 14 – Liability */}
          <section id="liability" className="pp-section">
            <SectionHeader num="14" title="Limitation of Liability" accent={accent} ink={ink} inkFaint={inkFaint} />
            <p style={{ color: inkMid, lineHeight: 1.8, fontSize: 15, marginBottom: 16 }}>
              InvestBeans shall not be liable for any financial losses, trading decisions made by users, or reliance on platform content or AI-generated insights.
            </p>
            <div className="pp-notice" style={{ borderColor: '#ef4444', background: isLight ? '#fef2f2' : '#1a0a0a', color: isLight ? '#991b1b' : '#fca5a5' }}>
              All market participation is at the user's sole risk. Our content does not constitute financial advice.
            </div>
          </section>

          {/* 15 – Updates */}
          <section id="updates" className="pp-section">
            <SectionHeader num="15" title="Policy Updates" accent={accent} ink={ink} inkFaint={inkFaint} />
            <p style={{ color: inkMid, lineHeight: 1.8, fontSize: 15 }}>
              We may revise this Policy to reflect changes in our practices or applicable law. Material changes will be communicated via email or a prominent notice on our website. Continued use of our services after any update constitutes acceptance of the revised Policy.
            </p>
          </section>

          {/* 16 – Contact */}
          <section id="contact" className="pp-section">
            <SectionHeader num="16" title="Contact Us" accent={accent} ink={ink} inkFaint={inkFaint} />
            <p style={{ color: inkMid, lineHeight: 1.8, fontSize: 15, marginBottom: 20 }}>
              For any questions or concerns about this Privacy Policy or our data practices, please reach out.
            </p>
            <div style={{ padding: '8px 20px', background: surface, border: `1px solid ${border}`, borderRadius: 8 }}>
              {[
                ['Entity', 'InvestBeans'],
                ['Email', 'support@investbeans.com'],
                ['Phone', 'To be updated'],
              ].map(([label, value]) => (
                <div key={label} className="pp-contact-row">
                  <span className="pp-contact-label">{label}</span>
                  <span className="pp-contact-value">
                    {label === 'Email' ? <a href={`mailto:${value}`} style={{ color: accent, textDecoration: 'none' }}>{value}</a> : value}
                  </span>
                </div>
              ))}
            </div>
          </section>

        </main>
      </div>

      {/* Footer */}
      <footer style={{ borderTop: `1px solid ${border}`, padding: '24px 48px' }}>
        <div style={{ maxWidth: 1160, margin: '0 auto', display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
          <p style={{ fontSize: 13, color: inkFaint }}>© 2026 InvestBeans. All rights reserved.</p>
          <div style={{ display: 'flex', gap: 24 }}>
            {['Terms of Service', 'Help Center'].map(l => (
              <a key={l} href="#" style={{ fontSize: 13, color: inkFaint, textDecoration: 'none' }}>{l}</a>
            ))}
          </div>
        </div>
      </footer>

    </div>
  );
}

// ── Section header sub-component ─────────────────────────────────
function SectionHeader({ num, title, accent, ink, inkFaint }: {
  num: string; title: string; accent: string; ink: string; inkFaint: string;
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
      <span style={{
        fontSize: 11, fontWeight: 700, color: accent,
        background: `${accent}18`, padding: '3px 8px', borderRadius: 5,
        fontVariantNumeric: 'tabular-nums', letterSpacing: '0.04em',
      }}>{num}</span>
      <h2 style={{ fontSize: 20, fontWeight: 700, color: ink, lineHeight: 1.3, letterSpacing: '-0.015em' }}>{title}</h2>
    </div>
  );
}