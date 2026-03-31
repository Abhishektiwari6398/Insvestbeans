import { Facebook, Twitter, Linkedin, Instagram } from "lucide-react";
import { useTheme } from "@/controllers/Themecontext"

const Footer = () => {
  const { theme } = useTheme();
  const isLight = theme === "light";

  // ── Theme-aware class helpers ───────────────────────────────────────────
  const footerBg = isLight
    ? "bg-[#FCFDFE] text-[#041421] shadow-sm border-b border-slate-200/85  py-16 relative overflow-hidden"
    : "bg-[#041421] text-white shadow-lg border-t border-[#0b314d]/55  py-16 relative overflow-hidden";

  const blob1 = isLight
    ? "absolute top-0 left-0 w-96 h-96 bg-blue-200/30 rounded-full blur-3xl"
    : "absolute top-0 left-0 w-96 h-96 bg-[#0A3656]/8 rounded-full blur-3xl";

  const blob2 = isLight
    ? "absolute bottom-0 right-0 w-96 h-96 bg-indigo-200/25 rounded-full blur-3xl"
    : "absolute bottom-0 right-0 w-96 h-96 bg-[#0A3656]/8 rounded-full blur-3xl";

  const disclaimerText = isLight
    ? "text-sm md:text-base text-left leading-relaxed text-slate-700"
    : "text-sm md:text-base text-left leading-relaxed text-white/90";

  const hrCls = isLight
    ? "border-slate-200 mt-4"
    : "border-white/20 mt-4";

  const taglineCls = isLight
    ? "text-sm text-slate-800 leading-relaxed mb-6 max-w-md"
    : "text-sm text-white/85 leading-relaxed mb-6 max-w-md";

  const socialBtnCls = isLight
    ? "w-10 h-10 bg-white hover:bg-[#0A3656] rounded-xl flex items-center justify-center transition-all hover:scale-110 text-slate-500 hover:text-white shadow-sm border border-slate-200 hover:border-[#0A3656] hover:shadow-md hover:shadow-blue-200/50"
    : "w-10 h-10 bg-white/10 hover:bg-[#0A3656] rounded-lg flex items-center justify-center transition-all hover:scale-110";

  const sectionHeadingCls = isLight
    ? "text-sm font-bold mb-5 text-[#0A3656] uppercase tracking-widest"
    : "text-lg font-semibold mb-4 text-[#9bc1da]";

  const linkCls = isLight
    ? "text-slate-800 hover:text-[#0A3656] transition-all hover:translate-x-1 inline-block text-sm font-medium"
    : "text-white/80 hover:text-white hover:text-[#9bc1da] transition-all hover:translate-x-1 inline-block";

  const borderTopCls = isLight
    ? "border-t border-slate-200 pt-8"
    : "border-t border-white/10 pt-8";

  const copyrightCls = isLight
    ? "text-center text-sm text-slate-800"
    : "text-center text-sm text-white/80";

  return (
    <footer className={footerBg}>
      <div className={blob1}></div>
      <div className={blob2}></div>

      {/* Disclaimer Section */}
      <div className="container mx-auto px-6 mb-6 relative z-15">
        <div className={isLight ? "bg-slate-50/80 border border-slate-200 rounded-2xl px-5 py-4 mb-4" : ""}>
          <p className={disclaimerText}>
            <span className="font-bold text-[#0A3656] dark:text-[#74A8C9]">Disclaimer:</span> InvestBeans provides educational content only and does not offer personalized investment advice.
            All trading and investing decisions are the sole responsibility of the individual.
            Investments in financial markets are subject to risk, and past performance does not indicate future results.
          </p>
        </div>
        {!isLight && <hr className={hrCls} />}
      </div>

      <div className="container mx-auto px-6 relative z-15">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-10">
          <div className="md:col-span-2">
            <div className="mb-4">
              <img
                src={isLight ? "/images/investbeans logo-03.png" : "/images/logo2.svg"}
                alt="InvestBeans Logo"
                className={`h-10 w-auto object-contain ${!isLight ? "filter contrast-125" : ""}`}
              />
            </div>
            <p className={taglineCls}>
              Your trusted source for market insights, analysis, and investment wisdom.
              Empowering investors with data-driven decisions since 2024.
            </p>
            <div className="flex gap-4">
              
              <a href="#" className={socialBtnCls}><Twitter className="w-5 h-5" /></a>
              <a href="https://www.linkedin.com/company/investbeans/?viewAsMember=true" className={socialBtnCls}><Linkedin className="w-5 h-5" /></a>
              <a href="https://www.instagram.com/investbeans?igsh=emowanMybzRyN2tm" className={socialBtnCls}><Instagram className="w-5 h-5" /></a>
            </div>
          </div>

          <div>
            <h3 className={sectionHeadingCls}>Quick Links</h3>
            <ul className="space-y-3 text-sm">
              <li><a href="/" className={linkCls}>Home</a></li>
              <li><a href="/markets" className={linkCls}>Segments</a></li>
              <li><a href="/dashboard" className={linkCls}>Dashboard</a></li>
              <li><a href="/global" className={linkCls}>Global</a></li>
              <li><a href="/domestic" className={linkCls}>Domestics</a></li>
              <li><a href="/pricing" className={linkCls}>Pricing</a></li>
            </ul>
          </div>

          <div>
            <h3 className={sectionHeadingCls}>Resources</h3>
            <ul className="space-y-3 text-sm">
              <li><a href="/blogs" className={linkCls}>Blog</a></li>
              <li><a href="/help-center" className={linkCls}>Help Center</a></li>
              <li><a href="/privacy-policy" className={linkCls}>Privacy Policy</a></li>
              <li><a href="/terms-of-service" className={linkCls}>Terms of Service</a></li>
            </ul>
          </div>
        </div>

        <div className={borderTopCls}>
  <p className={copyrightCls}>
    © 2024 InvestBeans. All rights reserved. 
    Crafted and powered by{" "}
    <a
      href="https://www.strategixworks.com/"
      target="_blank"
      rel="noopener noreferrer"
      className="font-bold tracking-wide hover:underline transition-all duration-200 text-[#0A3656] dark:text-[#74A8C9] "
    >
      Strategix
    </a> — Delivering intelligent digital solutions.
  </p>
</div>
      </div>
    </footer>
  );
};

export default Footer;