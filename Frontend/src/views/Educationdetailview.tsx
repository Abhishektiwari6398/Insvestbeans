/**
 * EducationDetailView.tsx — v4 (mobile-responsive + PDF raw upload fix)
 *
 * FIXES in this version:
 *  1. Full mobile responsiveness — Galaxy Note 3 (360px) and all small screens
 *     - Sidebar TOC hidden on mobile, replaced with horizontal scrollable pill list
 *     - Hero card stacks vertically on mobile
 *     - All cards use mobile-first padding (px-4 md:px-6)
 *     - Admin toolbar wraps on small screens
 *     - Modals are full-height scroll on mobile
 *     - Pagination numbers hidden on mobile (prev/next only)
 *  2. PDF downloads full file (not just page 1) — controller uses resource_type: raw
 *     The URL for Cloudinary raw uploads is /raw/upload/... not /image/upload/...
 *     resolvePdfUrl now forces /raw/upload/ for Cloudinary PDFs
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import Layout from '@/components/Layout';
import { useParams, useNavigate } from 'react-router-dom';
import { useTheme } from '@/controllers/Themecontext';
import { useAuth } from '@/controllers/AuthContext';
import { useSubscription } from '@/hooks/useSubscription';
import { useEducation } from '@/hooks/useEducation';
import {
  addCertModulePdf as apiAddCertPdf,
  deleteCertModulePdf as apiDeleteCertPdf,
} from '@/services/api/educationApi';

// ── Constants ─────────────────────────────────────────────────────────────────
const ITEMS_PER_PAGE = 10;

// ── Resolve PDF URL ────────────────────────────────────────────────────────────
// Cloudinary raw uploads use /raw/upload/ path.
// If the URL mistakenly has /image/upload/, replace it — this handles
// any PDFs that were accidentally uploaded as images in a previous version.
function resolvePdfUrl(pdfUrl: string): string {
  if (!pdfUrl) return '';
  if (pdfUrl.startsWith('http')) {
    // Fix any Cloudinary image URLs that should be raw (old bad uploads)
    if (pdfUrl.includes('cloudinary.com') && pdfUrl.includes('/image/upload/')) {
      return pdfUrl.replace('/image/upload/', '/raw/upload/fl_attachment/');
    }
    // Cloudinary raw uploads — add fl_attachment so browser downloads without 401
    if (pdfUrl.includes('cloudinary.com') && pdfUrl.includes('/raw/upload/')) {
      // Avoid double-adding
      if (!pdfUrl.includes('fl_attachment')) {
        return pdfUrl.replace('/raw/upload/', '/raw/upload/fl_attachment/');
      }
    }
    return pdfUrl;
  }
  // Legacy Supabase path
  return `https://vhutfmztepdlgkqejpvh.supabase.co/storage/v1/object/public/Investbeans/${pdfUrl}`;
}

// ── Level badge styles ────────────────────────────────────────────────────────
const levelStyleMap: Record<string, { bg: string; text: string }> = {
  Beginner:     { bg: 'rgba(16,185,129,0.12)',  text: '#34D399' },
  Intermediate: { bg: 'rgba(245,158,11,0.12)',  text: '#FBBF24' },
  Advanced:     { bg: 'rgba(239,68,68,0.12)',   text: '#F87171' },
  'All Levels': { bg: 'rgba(148,163,184,0.12)', text: '#94A3B8' },
};

// ════════════════════════════════════════════════════════════════════════
// SVG ICONS
// ════════════════════════════════════════════════════════════════════════
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
const SvgClock = () => (
  <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
  </svg>
);
const SvgLock = () => (
  <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
);
const SvgLockSm = () => (
  <svg viewBox="0 0 24 24" fill="none" className="w-3.5 h-3.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
);
const SvgCheck = () => (
  <svg viewBox="0 0 24 24" fill="none" className="w-3.5 h-3.5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);
const SvgDownload = () => (
  <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" />
  </svg>
);
const SvgShield = () => (
  <svg viewBox="0 0 24 24" fill="none" className="w-3.5 h-3.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /><polyline points="9 12 11 14 15 10" />
  </svg>
);
const SvgFileText = () => (
  <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" />
    <line x1="16" y1="17" x2="8" y2="17" />
  </svg>
);
const SvgCrown = () => (
  <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 4l3 12h14l3-12-6 7-4-7-4 7-6-7z" /><line x1="5" y1="20" x2="19" y2="20" />
  </svg>
);
const SvgUpload = () => (
  <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" />
    <line x1="12" y1="3" x2="12" y2="15" />
  </svg>
);
const SvgLink = () => (
  <svg viewBox="0 0 24 24" fill="none" className="w-3.5 h-3.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
  </svg>
);

// ════════════════════════════════════════════════════════════════════════
// PDF FILE PICKER
// ════════════════════════════════════════════════════════════════════════
function PdfFilePicker({ currentPdfUrl, pdfFile, setPdfFile, isLight, border, textPrimary, textMuted, textFaint }: any) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState('');

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 50 * 1024 * 1024) {
      setError(`Too large (${(file.size / 1024 / 1024).toFixed(1)} MB). Max 50 MB.`);
      setPdfFile(null);
      return;
    }
    setError('');
    setPdfFile(file);
  };

  const resolvedUrl = resolvePdfUrl(currentPdfUrl || '');

  return (
    <div className="flex flex-col gap-2">
      <label className="text-[11px] font-bold uppercase tracking-wide" style={{ color: textMuted }}>
        PDF File (max 50 MB)
      </label>
      {resolvedUrl && !pdfFile && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs"
          style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.20)' }}>
          <SvgFileText />
          <span className="truncate flex-1" style={{ color: '#34D399' }}>PDF saved on Cloudinary</span>
          <a href={resolvedUrl} target="_blank" rel="noopener noreferrer"
            className="font-bold flex-shrink-0" style={{ color: '#34D399' }}>View ↗</a>
        </div>
      )}
      {pdfFile && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs"
          style={{ background: 'rgba(81,148,246,0.08)', border: '1px solid rgba(81,148,246,0.20)' }}>
          <SvgFileText />
          <span className="truncate flex-1" style={{ color: '#5194F6' }}>
            {pdfFile.name} ({(pdfFile.size / 1024 / 1024).toFixed(2)} MB)
          </span>
          <button onClick={() => { setPdfFile(null); if (inputRef.current) inputRef.current.value = ''; }}
            className="font-bold flex-shrink-0" style={{ color: '#f87171' }}>✕</button>
        </div>
      )}
      <button type="button" onClick={() => inputRef.current?.click()}
        className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all hover:opacity-80"
        style={{ background: isLight ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.07)', color: textPrimary, border: `1px solid ${border}` }}>
        <SvgUpload /> {currentPdfUrl && !pdfFile ? 'Replace PDF' : 'Upload PDF'}
      </button>
      <input ref={inputRef} type="file" accept="application/pdf" className="hidden" onChange={handleFile} />
      {error && <p className="text-xs" style={{ color: '#f87171' }}>{error}</p>}
      <p className="text-[11px]" style={{ color: textFaint }}>PDF uploaded to Cloudinary as raw file (full multi-page).</p>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════
// SHARED MODAL INPUT
// ════════════════════════════════════════════════════════════════════════
function ModalField({ label, field, type = 'text', rows = 0, placeholder = '', form, setForm, isLight, border, textPrimary, textMuted }: any) {
  const inputStyle = { background: isLight ? '#f8fafc' : '#0d1117', border: `1px solid ${border}`, color: textPrimary };
  const cls = "rounded-xl px-3 py-2 text-sm outline-none w-full";
  return (
    <div className="flex flex-col gap-1">
      <label className="text-[11px] font-bold uppercase tracking-wide" style={{ color: textMuted }}>{label}</label>
      {rows > 0
        ? <textarea rows={rows} value={form[field] ?? ''} placeholder={placeholder} onChange={e => setForm((f: any) => ({ ...f, [field]: e.target.value }))} className={`${cls} resize-none`} style={inputStyle} />
        : <input type={type} value={form[field] ?? ''} placeholder={placeholder} onChange={e => setForm((f: any) => ({ ...f, [field]: e.target.value }))} className={cls} style={inputStyle} />
      }
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════
// LOCKED MODULE CARD
// ════════════════════════════════════════════════════════════════════════
function LockedModuleCard({ data, isLight, cardBg, border, textFaint, onUnlock }: any) {
  return (
    <div className="rounded-2xl overflow-hidden" style={{ background: cardBg, border: `1px solid ${border}`, opacity: 0.85 }}>
      <div className="h-0.5 w-full" style={{ background: data.accentGrad }} />
      <div className="px-4 py-8 flex flex-col items-center text-center gap-4">
        <div className="w-12 h-12 rounded-2xl flex items-center justify-center"
          style={{ background: `${data.accent}12`, border: `1px solid ${data.accent}25`, color: data.accent }}>
          <SvgLock />
        </div>
        <div className="w-full space-y-2">
          <div className="h-4 rounded mx-auto" style={{ width: '65%', background: isLight ? 'rgba(0,0,0,0.07)' : 'rgba(255,255,255,0.07)' }} />
          <div className="h-3 rounded mx-auto" style={{ width: '45%', background: isLight ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.04)' }} />
        </div>
        <p className="text-sm" style={{ color: textFaint }}>Subscribers only</p>
        <button onClick={onUnlock}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white"
          style={{ background: data.accentGrad }}>
          <SvgCrown /> Unlock Access
        </button>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════
// PDF MODULE CARD — mobile-first
// ════════════════════════════════════════════════════════════════════════
function PdfModuleCard({ mod, data, isLight, cardBg, border, ls, textPrimary, textMuted, textFaint, locked, onUnlock }: any) {
  const handleDownload = () => {
    if (locked) { onUnlock(); return; }
    const url = resolvePdfUrl(mod.pdfUrl);
    if (url) window.open(url, '_blank', 'noopener,noreferrer');
    else alert('No PDF available yet. Admin needs to upload a PDF for this module.');
  };

  return (
    <div className="rounded-2xl overflow-hidden" style={{ background: cardBg, border: `1px solid ${border}`, boxShadow: isLight ? '0 2px 20px rgba(0,0,0,0.05)' : 'none' }}>
      <div className="h-0.5 w-full" style={{ background: data.accentGrad }} />

      {/* Header */}
      <div className="px-4 md:px-6 pt-5 pb-4">
        {/* Mobile: stack icon + title, badges to right */}
        <div className="flex items-start gap-3 mb-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
            style={{ background: `${data.accent}15`, color: data.accent }}><SvgFileText /></div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <h3 className="text-base md:text-lg font-bold leading-snug" style={{ color: textPrimary }}>{mod.title}</h3>
                <p className="text-xs md:text-sm italic mt-0.5" style={{ color: data.accent, opacity: 0.85 }}>{mod.subtitle}</p>
              </div>
              <div className="flex flex-col items-end gap-1 flex-shrink-0">
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full whitespace-nowrap"
                  style={{ background: ls.bg, color: ls.text }}>{mod.level}</span>
                {mod.isPaid
                  ? <span className="text-[9px] font-bold px-2 py-0.5 rounded-full" style={{ background: 'rgba(81,148,246,0.12)', color: '#5194F6' }}>PREMIUM</span>
                  : <span className="text-[9px] font-bold px-2 py-0.5 rounded-full" style={{ background: 'rgba(16,185,129,0.12)', color: '#34D399' }}>FREE</span>
                }
              </div>
            </div>
          </div>
        </div>
        <p className="text-sm leading-relaxed" style={{ color: textMuted }}>{mod.description}</p>
        {mod.highlights?.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-3">
            {mod.highlights.map((h: string, j: number) => (
              <span key={j} className="text-[10px] px-2 py-0.5 rounded-full"
                style={{ background: isLight ? `${data.accent}08` : `${data.accent}12`, color: data.accent, border: `1px solid ${data.accent}20` }}>{h}</span>
            ))}
          </div>
        )}
      </div>

      {mod.previewTopics?.length > 0 && (
        <>
          <div className="mx-4 md:mx-6" style={{ height: 1, background: `linear-gradient(90deg,${data.accent}15,transparent)` }} />
          <div className="px-4 md:px-6 py-4">
            <p className="text-[10px] font-bold uppercase tracking-widest mb-3" style={{ color: textFaint }}>What's inside</p>
            {/* Mobile: 1 col, desktop: 2 col */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-2 gap-x-4">
              {mod.previewTopics.map((topic: string, j: number) => (
                <div key={j} className="flex items-start gap-2">
                  <div className="w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                    style={{ background: `${data.accent}15`, color: data.accent }}><SvgCheck /></div>
                  <span className="text-xs leading-relaxed" style={{ color: textMuted }}>{topic}</span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      <div className="mx-4 md:mx-6" style={{ height: 1, background: `linear-gradient(90deg,${data.accent}15,transparent)` }} />
      <div className="px-4 md:px-6 py-4">
        <button onClick={handleDownload}
          className="w-full py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all hover:opacity-90"
          style={locked
            ? { background: isLight ? 'rgba(81,148,246,0.08)' : 'rgba(81,148,246,0.12)', color: '#5194F6', border: '1.5px solid rgba(81,148,246,0.30)' }
            : { background: isLight ? `${data.accent}12` : `${data.accent}18`, color: data.accent, border: `1.5px solid ${data.accent}35` }}>
          {locked ? <><SvgLock /> Unlock to Download</> : <><SvgDownload /> Download Full PDF</>}
        </button>
        <p className="text-[11px] text-center flex items-center justify-center gap-1 mt-2" style={{ color: textFaint }}>
          <SvgShield /> {locked ? 'Subscribe to access' : 'Secure download · Full PDF'}
        </p>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════
// VIDEO MODULE CARD — mobile-first
// • No "Watch Now" button — each segment row is individually clickable
// • Each segment has its own videoUrl (paid/free)
// • Highlights and previewTopics displayed
// ════════════════════════════════════════════════════════════════════════
function ModuleCard({ mod, data, isLight, cardBg, border, ls, textPrimary, textMuted, textFaint, locked, hasAccess, onUnlock }: any) {
  const handleSegmentClick = (ch: any) => {
    // Segment is locked if: it's marked paid (!ch.free) AND user has no access
    const chLocked = !ch.free && !hasAccess;
    if (chLocked) { onUnlock(); return; }
    const url = ch.videoUrl || mod.videoUrl || '';
    if (url) window.open(url, '_blank', 'noopener,noreferrer');
    else alert('No video URL set for this segment yet.');
  };

  return (
    <div className="rounded-2xl overflow-hidden" style={{ background: cardBg, border: `1px solid ${border}`, boxShadow: isLight ? '0 2px 20px rgba(0,0,0,0.05)' : 'none' }}>
      <div className="h-0.5 w-full" style={{ background: data.accentGrad }} />
      <div className="px-4 md:px-6 pt-5 pb-4">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="min-w-0">
            <h3 className="text-base md:text-lg font-bold leading-snug" style={{ color: textPrimary }}>{mod.title}</h3>
            <p className="text-xs md:text-sm italic mt-0.5" style={{ color: data.accent, opacity: 0.85 }}>{mod.subtitle}</p>
          </div>
          <div className="flex flex-col items-end gap-1 flex-shrink-0">
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full whitespace-nowrap"
              style={{ background: ls.bg, color: ls.text }}>{mod.level}</span>
            {mod.isPaid
              ? <span className="text-[9px] font-bold px-2 py-0.5 rounded-full" style={{ background: 'rgba(81,148,246,0.12)', color: '#5194F6' }}>PREMIUM</span>
              : <span className="text-[9px] font-bold px-2 py-0.5 rounded-full" style={{ background: 'rgba(16,185,129,0.12)', color: '#34D399' }}>FREE</span>
            }
          </div>
        </div>
        <p className="text-sm leading-relaxed" style={{ color: textMuted }}>{mod.description}</p>

        {/* Highlights */}
        {mod.highlights?.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-3">
            {mod.highlights.map((h: string, j: number) => (
              <span key={j} className="text-[10px] px-2 py-0.5 rounded-full"
                style={{ background: isLight ? `${data.accent}08` : `${data.accent}12`, color: data.accent, border: `1px solid ${data.accent}20` }}>{h}</span>
            ))}
          </div>
        )}
      </div>

      {/* Preview Topics */}
      {mod.previewTopics?.length > 0 && (
        <>
          <div className="mx-4 md:mx-6" style={{ height: 1, background: `linear-gradient(90deg,${data.accent}15,transparent)` }} />
          <div className="px-4 md:px-6 py-4">
            <p className="text-[10px] font-bold uppercase tracking-widest mb-3" style={{ color: textFaint }}>What's inside</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-2 gap-x-4">
              {mod.previewTopics.map((topic: string, j: number) => (
                <div key={j} className="flex items-start gap-2">
                  <div className="w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                    style={{ background: `${data.accent}15`, color: data.accent }}><SvgCheck /></div>
                  <span className="text-xs leading-relaxed" style={{ color: textMuted }}>{topic}</span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Segments — each row is clickable, opens its own videoUrl */}
      {mod.chapters?.length > 0 && (
        <>
          <div className="mx-4 md:mx-6" style={{ height: 1, background: `linear-gradient(90deg,${data.accent}25,transparent)` }} />
          <div className="px-4 md:px-6 pb-4 pt-3">
            <p className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: textFaint }}>Segments</p>
            {mod.chapters.map((ch: any, j: number) => {
              const chLocked = !ch.free && !hasAccess;
              const hasUrl = !!(ch.videoUrl || mod.videoUrl);
              return (
                <button
                  key={j}
                  onClick={() => handleSegmentClick(ch)}
                  className="w-full flex items-center gap-2 py-2 text-left transition-all hover:opacity-80"
                  style={{ borderBottom: j < mod.chapters.length - 1 ? `1px solid ${isLight ? 'rgba(226,232,240,0.6)' : 'rgba(255,255,255,0.05)'}` : 'none' }}>
                  <div className="w-6 h-6 rounded-lg flex-shrink-0 flex items-center justify-center"
                    style={{ background: chLocked ? (isLight ? 'rgba(226,232,240,0.7)' : 'rgba(255,255,255,0.06)') : `${data.accent}18`, color: chLocked ? textFaint : data.accent }}>
                    {chLocked ? <SvgLockSm /> : <SvgPlay />}
                  </div>
                  <p className="text-xs font-medium flex-1 truncate" style={{ color: chLocked ? textFaint : textPrimary, opacity: chLocked ? 0.65 : 1 }}>{ch.title}</p>
                  <span className="text-[10px] flex-shrink-0 font-mono" style={{ color: textFaint }}>{ch.ref}</span>
                  {ch.free
                    ? <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full flex-shrink-0" style={{ background: 'rgba(16,185,129,0.12)', color: '#34D399' }}>FREE</span>
                    : <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full flex-shrink-0" style={{ background: 'rgba(81,148,246,0.10)', color: '#5194F6' }}>PAID</span>
                  }
                  {!chLocked && hasUrl && (
                    <span className="text-[9px] flex-shrink-0" style={{ color: data.accent }}>▶</span>
                  )}
                </button>
              );
            })}
          </div>
        </>
      )}

      {/* Locked unlock prompt — only when module-level locked and no chapters */}
      {locked && !mod.chapters?.length && (
        <div className="px-4 md:px-6 pb-4">
          <button onClick={onUnlock}
            className="w-full py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all hover:opacity-80 text-white"
            style={{ background: data.accentGrad }}>
            <SvgLockSm /> Unlock to Watch
          </button>
        </div>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════
// CERT MODULE CARD — mobile-first
// ════════════════════════════════════════════════════════════════════════
function CertModuleCard({ mod, data, isLight, cardBg, border, textPrimary, textMuted, textFaint, hasAccess, isAdmin: adminFlag, isSubscriber: subFlag, onUnlock, categoryId, onCertPdfAdded, onCertPdfDeleted, onVideoDeleted }: any) {
  const ls = levelStyleMap[mod.level] ?? levelStyleMap['Beginner'];
  const handlePdfOpen = (pdfUrl: string) => {
    const url = resolvePdfUrl(pdfUrl);
    if (url) window.open(url, '_blank', 'noopener,noreferrer');
  };
  const freePdfs    = (mod.pdfs || []).filter((p: any) => p.isFreePreview);
  const premiumPdfs = (mod.pdfs || []).filter((p: any) => !p.isFreePreview);

  // ── Admin: Add PDF to this cert module ───────────────────────────────
  const [addingPdf, setAddingPdf] = useState(false);
  const [showCertPdfModal, setShowCertPdfModal] = useState(false);

  const handleAddCertPdf = async (payload: { file: File; title: string; subtitle: string; isFreePreview: boolean }) => {
    if (!categoryId || !mod._id) return;
    setAddingPdf(true);
    try {
      await apiAddCertPdf(categoryId, mod._id, payload.file, payload.title, payload.subtitle, payload.isFreePreview);
      setShowCertPdfModal(false);
      onCertPdfAdded?.(null);
    } catch (err: any) {
      alert(`\u274C ${err.message}`);
    } finally {
      setAddingPdf(false);
    }
  };

  const handleDeleteCertPdf = async (pdfIndex: number, pdfTitle: string) => {
    if (!window.confirm(`Delete "${pdfTitle}"?\nThis will remove it from Cloudinary too.`)) return;
    try {
      await apiDeleteCertPdf(categoryId, mod._id, pdfIndex);
      onCertPdfDeleted?.(pdfIndex);
    } catch (err: any) {
      alert(`\u274C ${err.message}`);
    }
  };

  return (
    <div className="rounded-2xl overflow-hidden" style={{ background: cardBg, border: `1px solid ${border}`, boxShadow: isLight ? '0 2px 20px rgba(0,0,0,0.05)' : 'none' }}>
      <div className="h-0.5 w-full" style={{ background: data.accentGrad }} />
      <div className="px-4 md:px-6 pt-5 pb-4">
        <div className="flex items-start gap-3 mb-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 text-lg"
            style={{ background: `${data.accent}15`, border: `1px solid ${data.accent}25` }}>🎓</div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <h3 className="text-base md:text-lg font-bold leading-snug" style={{ color: textPrimary }}>{mod.title}</h3>
                <p className="text-xs italic mt-0.5" style={{ color: data.accent, opacity: 0.85 }}>{mod.subtitle}</p>
              </div>
              <div className="flex flex-col items-end gap-1 flex-shrink-0">
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full whitespace-nowrap" style={{ background: ls.bg, color: ls.text }}>{mod.level}</span>
                {adminFlag
                  ? <span className="text-[9px] font-bold px-2 py-0.5 rounded-full" style={{ background: 'rgba(168,85,247,0.12)', color: '#a855f7' }}>ADMIN</span>
                  : subFlag
                    ? <span className="text-[9px] font-bold px-2 py-0.5 rounded-full" style={{ background: 'rgba(34,197,94,0.12)', color: '#22c55e' }}>✓ UNLOCKED</span>
                    : <span className="text-[9px] font-bold px-2 py-0.5 rounded-full" style={{ background: 'rgba(81,148,246,0.12)', color: '#5194F6' }}>PREMIUM</span>
                }
              </div>
            </div>
          </div>
        </div>
        <p className="text-sm leading-relaxed" style={{ color: textMuted }}>{mod.description}</p>

        {/* ── Fix 4: Highlights ───────────────────────────────────────── */}
        {mod.highlights?.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-3">
            {mod.highlights.map((h: string, j: number) => (
              <span key={j} className="text-[10px] px-2 py-0.5 rounded-full"
                style={{ background: isLight ? `${data.accent}08` : `${data.accent}12`, color: data.accent, border: `1px solid ${data.accent}20` }}>{h}</span>
            ))}
          </div>
        )}
      </div>

      {/* ── Fix 4: Preview Topics ─────────────────────────────────────── */}
      {mod.previewTopics?.length > 0 && (
        <>
          <div className="mx-4 md:mx-6" style={{ height: 1, background: `linear-gradient(90deg,${data.accent}15,transparent)` }} />
          <div className="px-4 md:px-6 py-4">
            <p className="text-[10px] font-bold uppercase tracking-widest mb-3" style={{ color: textFaint }}>Program Covers</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-2 gap-x-4">
              {mod.previewTopics.map((topic: string, j: number) => (
                <div key={j} className="flex items-start gap-2">
                  <div className="w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                    style={{ background: `${data.accent}15`, color: data.accent }}><SvgCheck /></div>
                  <span className="text-xs leading-relaxed" style={{ color: textMuted }}>{topic}</span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      <div className="mx-4 md:mx-6" style={{ height: 1, background: `linear-gradient(90deg,${data.accent}20,transparent)` }} />
      <div className="px-4 md:px-6 py-4">
        <div className="flex items-center justify-between mb-3">
          <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: textFaint }}>Included PDFs</p>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ background: `${data.accent}10`, color: data.accent }}>{(mod.pdfs || []).length} PDFs</span>
            {/* ── Fix 3: Admin Add PDF button ─────────────────────────── */}
            {adminFlag && (
              <>
                <button type="button"
                  onClick={() => setShowCertPdfModal(true)}
                  disabled={addingPdf}
                  className="text-[10px] px-2.5 py-1 rounded-lg font-bold disabled:opacity-50"
                  style={{ background: 'rgba(168,85,247,0.10)', color: '#a855f7', border: '1px solid rgba(168,85,247,0.25)' }}>
                  {addingPdf ? '⏳ Uploading…' : '+ Add PDF'}
                </button>
                {showCertPdfModal && (
                  <CertAddPdfModal
                    isLight={isLight}
                    onClose={() => setShowCertPdfModal(false)}
                    onSubmit={handleAddCertPdf}
                    saving={addingPdf}
                  />
                )}
              </>
            )}
          </div>
        </div>
        <div className="space-y-2">
          {freePdfs.map((pdf: any, j: number) => {
            const globalIdx = (mod.pdfs || []).indexOf(pdf);
            return (
              <div key={j} className="flex items-center justify-between gap-2 p-2.5 rounded-xl"
                style={{ background: isLight ? 'rgba(16,185,129,0.04)' : 'rgba(16,185,129,0.07)', border: '1px solid rgba(16,185,129,0.18)' }}>
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(16,185,129,0.12)', color: '#34D399' }}><SvgFileText /></div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold truncate" style={{ color: textPrimary }}>{pdf.title}</p>
                    <p className="text-[10px] truncate" style={{ color: textMuted }}>{pdf.subtitle}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full hidden sm:block" style={{ background: 'rgba(16,185,129,0.12)', color: '#34D399' }}>FREE</span>
                  <button onClick={() => handlePdfOpen(pdf.pdfUrl)}
                    className="flex items-center gap-1 text-[11px] font-bold px-2.5 py-1.5 rounded-lg text-white"
                    style={{ background: 'rgba(16,185,129,0.85)' }}><SvgDownload /> <span className="hidden sm:inline">PDF</span></button>
                  {/* ── Fix 3: Admin Delete button ───────────────────── */}
                  {adminFlag && (
                    <button onClick={() => handleDeleteCertPdf(globalIdx, pdf.title)}
                      className="text-[10px] px-2 py-1.5 rounded-lg font-bold"
                      style={{ background: 'rgba(239,68,68,0.10)', color: '#f87171', border: '1px solid rgba(239,68,68,0.20)' }}>🗑️</button>
                  )}
                </div>
              </div>
            );
          })}
          {premiumPdfs.map((pdf: any, j: number) => {
            const globalIdx = (mod.pdfs || []).indexOf(pdf);
            if (!hasAccess) {
              return (
                <div key={j} className="flex items-center justify-between gap-2 p-2.5 rounded-xl"
                  style={{ background: isLight ? 'rgba(0,0,0,0.03)' : 'rgba(255,255,255,0.03)', border: isLight ? '1px solid rgba(0,0,0,0.07)' : '1px solid rgba(255,255,255,0.07)', opacity: 0.8 }}>
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(148,163,184,0.12)', color: 'rgba(148,163,184,0.5)' }}><SvgLockSm /></div>
                    <div className="h-3 rounded" style={{ width: `${90 + (j * 17) % 60}px`, background: isLight ? 'rgba(0,0,0,0.07)' : 'rgba(255,255,255,0.07)' }} />
                  </div>
                  <button onClick={onUnlock} className="text-[10px] font-bold px-2.5 py-1.5 rounded-lg flex-shrink-0"
                    style={{ background: 'rgba(81,148,246,0.10)', color: '#5194F6', border: '1px solid rgba(81,148,246,0.25)' }}>
                    <SvgLockSm /> Unlock
                  </button>
                </div>
              );
            }
            return (
              <div key={j} className="flex items-center justify-between gap-2 p-2.5 rounded-xl"
                style={{ background: isLight ? `${data.accent}05` : `${data.accent}08`, border: `1px solid ${data.accent}20` }}>
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: `${data.accent}15`, color: data.accent }}><SvgFileText /></div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold truncate" style={{ color: textPrimary }}>{pdf.title}</p>
                    <p className="text-[10px] truncate" style={{ color: textMuted }}>{pdf.subtitle}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <button onClick={() => handlePdfOpen(pdf.pdfUrl)}
                    className="flex items-center gap-1 text-[11px] font-bold px-2.5 py-1.5 rounded-lg text-white flex-shrink-0"
                    style={{ background: data.accentGrad }}><SvgDownload /> <span className="hidden sm:inline">PDF</span></button>
                  {/* ── Fix 3: Admin Delete button ───────────────────── */}
                  {adminFlag && (
                    <button onClick={() => handleDeleteCertPdf(globalIdx, pdf.title)}
                      className="text-[10px] px-2 py-1.5 rounded-lg font-bold"
                      style={{ background: 'rgba(239,68,68,0.10)', color: '#f87171', border: '1px solid rgba(239,68,68,0.20)' }}>🗑️</button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
        {!hasAccess && premiumPdfs.length > 0 && (
          <button onClick={onUnlock}
            className="w-full mt-3 py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 text-white"
            style={{ background: data.accentGrad }}>
            <SvgCrown /> Unlock All {premiumPdfs.length} PDFs
          </button>
        )}
      </div>
      {/* ── VIDEO SESSIONS (chapters) ─────────────────────────────────── */}
{mod.chapters?.length > 0 && (
  <>
    <div className="mx-4 md:mx-6" style={{ height: 1, background: `linear-gradient(90deg,${data.accent}20,transparent)` }} />
    <div className="px-4 md:px-6 py-4">
      <div className="flex items-center justify-between mb-3">
        <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: textFaint }}>
          🎥 Video Sessions
        </p>
        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
          style={{ background: `${data.accent}10`, color: data.accent }}>
          {mod.chapters.length} Videos
        </span>
      </div>
      <div className="space-y-2">
        {mod.chapters.map((ch: any, j: number) => {
          const chLocked = !ch.free && !hasAccess;
          return (
            <div key={j}
              className="flex items-center justify-between gap-2 p-2.5 rounded-xl"
              style={{
                background: chLocked
                  ? (isLight ? 'rgba(0,0,0,0.03)' : 'rgba(255,255,255,0.03)')
                  : (isLight ? 'rgba(81,148,246,0.04)' : 'rgba(81,148,246,0.07)'),
                border: chLocked
                  ? (isLight ? '1px solid rgba(0,0,0,0.07)' : '1px solid rgba(255,255,255,0.07)')
                  : '1px solid rgba(81,148,246,0.18)',
              }}>
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{
                    background: chLocked ? 'rgba(148,163,184,0.12)' : 'rgba(81,148,246,0.15)',
                    color: chLocked ? 'rgba(148,163,184,0.5)' : '#5194F6',
                  }}>
                  {chLocked ? <SvgLockSm /> : <SvgPlay />}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold truncate"
                    style={{ color: chLocked ? textFaint : textPrimary, opacity: chLocked ? 0.6 : 1 }}>
                    {ch.title}
                  </p>
                  {ch.ref && (
                    <p className="text-[10px]" style={{ color: textFaint }}>{ch.ref}</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1.5 flex-shrink-0">
                {ch.free
                  ? <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full hidden sm:block"
                      style={{ background: 'rgba(16,185,129,0.12)', color: '#34D399' }}>FREE</span>
                  : <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full hidden sm:block"
                      style={{ background: 'rgba(81,148,246,0.10)', color: '#5194F6' }}>PAID</span>
                }
                {chLocked ? (
                  <button onClick={onUnlock}
                    className="text-[10px] font-bold px-2.5 py-1.5 rounded-lg"
                    style={{ background: 'rgba(81,148,246,0.10)', color: '#5194F6', border: '1px solid rgba(81,148,246,0.25)' }}>
                    🔒 Unlock
                  </button>
                ) : (
                  <button
                  onClick={() => {
                    const url = ch.videoUrl || '';
                    if (url) window.open(url, '_blank', 'noopener,noreferrer');
                    else alert('No video URL set for this session yet.');
                  }}
                  className="flex items-center gap-1 text-[11px] font-bold px-2.5 py-1.5 rounded-lg text-white"
                  style={{ background: 'rgba(81,148,246,0.85)' }}>
                  <SvgPlay /> <span className="hidden sm:inline">Watch</span>
                </button>
              )}
              {/* ── Admin: Delete video ── */}
              {adminFlag && (
                <button
                  onClick={() => {
                    if (!window.confirm(`Delete video "${ch.title}"?`)) return;
                    onVideoDeleted?.(j);
                  }}
                  className="text-[10px] px-2 py-1.5 rounded-lg font-bold"
                  style={{ background: 'rgba(239,68,68,0.10)', color: '#f87171', border: '1px solid rgba(239,68,68,0.20)' }}>
                  🗑️
                </button>
              )}
              </div>
            </div>
          );
        })}
      </div>
      {!hasAccess && mod.chapters.some((ch: any) => !ch.free) && (
        <button onClick={onUnlock}
          className="w-full mt-3 py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 text-white"
          style={{ background: data.accentGrad }}>
          <SvgCrown /> Unlock All Videos
        </button>
      )}
    </div>
  </>
)}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════
// CERT ADD PDF MODAL — replaces window.prompt / window.confirm flow
// Opens when admin clicks "+ Add PDF" on a certification module card.
// ════════════════════════════════════════════════════════════════════════
function CertAddPdfModal({ isLight, onClose, onSubmit, saving }: any) {
  const [title,    setTitle]    = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [isFree,   setIsFree]   = useState(true);
  const [file,     setFile]     = useState<File | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const cardBg  = isLight ? '#ffffff' : '#1e2433';
  const border  = isLight ? 'rgba(226,232,240,0.8)' : 'rgba(255,255,255,0.10)';
  const primary = isLight ? '#0f172a' : '#f1f5f9';
  const muted   = isLight ? '#64748b' : '#94a3b8';

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > 50 * 1024 * 1024) { alert('File too large — max 50 MB'); return; }
    setFile(f);
  };

  const handleSubmit = async () => {
    if (!title.trim()) { alert('PDF Title is required'); return; }
    if (!file)         { alert('Please select a PDF file'); return; }
    await onSubmit({ file, title: title.trim(), subtitle: subtitle.trim(), isFreePreview: isFree });
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)' }}>
      <div className="w-full max-w-md mx-4 rounded-2xl overflow-hidden flex flex-col"
        style={{ background: cardBg, border: `1px solid ${border}`, maxHeight: '90dvh' }}>

        {/* Header */}
        <div className="px-5 py-4 flex items-center justify-between flex-shrink-0"
          style={{ borderBottom: `1px solid ${border}`, background: 'rgba(168,85,247,0.06)' }}>
          <span className="font-bold text-sm" style={{ color: '#a855f7' }}>📄 Add PDF to Module</span>
          <button onClick={onClose} disabled={saving}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-lg hover:opacity-60 disabled:opacity-30"
            style={{ color: muted }}>✕</button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-4">

          {/* Title */}
          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-bold uppercase tracking-wide" style={{ color: muted }}>PDF Title *</label>
            <input value={title} onChange={e => setTitle(e.target.value)}
              placeholder="e.g. NISM V-A Workbook Nov 2025"
              className="rounded-xl px-3 py-2.5 text-sm outline-none"
              style={{ background: isLight ? '#f8fafc' : '#0d1117', border: `1px solid ${border}`, color: primary }} />
          </div>

          {/* Subtitle */}
          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-bold uppercase tracking-wide" style={{ color: muted }}>Subtitle</label>
            <input value={subtitle} onChange={e => setSubtitle(e.target.value)}
              placeholder="e.g. Latest English edition"
              className="rounded-xl px-3 py-2.5 text-sm outline-none"
              style={{ background: isLight ? '#f8fafc' : '#0d1117', border: `1px solid ${border}`, color: primary }} />
          </div>

          {/* Free / Paid */}
          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-bold uppercase tracking-wide" style={{ color: muted }}>Access</label>
            <select value={isFree ? 'free' : 'paid'} onChange={e => setIsFree(e.target.value === 'free')}
              className="rounded-xl px-3 py-2.5 text-sm outline-none"
              style={{ background: isLight ? '#f8fafc' : '#0d1117', border: `1px solid ${border}`, color: primary }}>
              <option value="free">Free Preview</option>
              <option value="paid">Paid Only</option>
            </select>
          </div>

          {/* File picker */}
          <div className="flex flex-col gap-2">
            <label className="text-[11px] font-bold uppercase tracking-wide" style={{ color: muted }}>PDF File *</label>
            <button type="button" onClick={() => fileRef.current?.click()}
              className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-bold transition-all hover:opacity-80"
              style={{
                background: file ? 'rgba(81,148,246,0.08)' : (isLight ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.06)'),
                color:      file ? '#5194F6' : muted,
                border:     `1px solid ${file ? 'rgba(81,148,246,0.25)' : border}`,
              }}>
              <SvgUpload />
              <span className="truncate">{file ? `${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)` : 'Choose PDF (max 50 MB)'}</span>
            </button>
            <input ref={fileRef} type="file" accept="application/pdf" className="hidden" onChange={handleFile} />
            {file && (
              <button onClick={() => { setFile(null); if (fileRef.current) fileRef.current.value = ''; }}
                className="text-[11px] self-start font-bold" style={{ color: '#f87171' }}>✕ Remove file</button>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 pb-5 pt-3 flex gap-3 flex-shrink-0"
          style={{ borderTop: `1px solid ${border}` }}>
          <button onClick={onClose} disabled={saving}
            className="flex-1 py-3 rounded-xl text-sm font-bold disabled:opacity-40"
            style={{ background: isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.07)', color: muted, border: `1px solid ${border}` }}>
            Cancel
          </button>
          <button onClick={handleSubmit} disabled={saving || !title.trim() || !file}
            className="flex-1 py-3 rounded-xl text-sm font-bold text-white disabled:opacity-40"
            style={{ background: 'linear-gradient(135deg,#a855f7,#7c3aed)' }}>
            {saving ? '⏳ Uploading…' : '+ Upload PDF'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════
// ADMIN TOOLBAR — mobile-responsive
// ════════════════════════════════════════════════════════════════════════
function AdminModuleToolbar({ idx, onEdit, onDelete, onMoveUp, onMoveDown, totalModules }: any) {
  return (
    <div className="flex items-center justify-between gap-2 px-3 py-2 rounded-t-xl flex-wrap gap-y-1"
      style={{ background: 'rgba(168,85,247,0.08)', border: '1px solid rgba(168,85,247,0.18)', borderBottom: 'none' }}>
      <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: '#a855f7' }}>
        🛡️ Module {idx + 1}
      </span>
      <div className="flex items-center gap-1">
        {idx > 0 && (
          <button onClick={() => onMoveUp(idx)} className="text-[10px] px-1.5 py-1 rounded-lg font-bold"
            style={{ background: 'rgba(168,85,247,0.12)', color: '#a855f7', border: '1px solid rgba(168,85,247,0.25)' }}>↑</button>
        )}
        {idx < totalModules - 1 && (
          <button onClick={() => onMoveDown(idx)} className="text-[10px] px-1.5 py-1 rounded-lg font-bold"
            style={{ background: 'rgba(168,85,247,0.12)', color: '#a855f7', border: '1px solid rgba(168,85,247,0.25)' }}>↓</button>
        )}
        <button onClick={() => onEdit(idx)} className="text-[10px] px-2 py-1 rounded-lg font-bold"
          style={{ background: 'rgba(59,130,246,0.12)', color: '#5194F6', border: '1px solid rgba(59,130,246,0.25)' }}>✏️ Edit</button>
        <button onClick={() => onDelete(idx)} className="text-[10px] px-2 py-1 rounded-lg font-bold"
          style={{ background: 'rgba(239,68,68,0.10)', color: '#f87171', border: '1px solid rgba(239,68,68,0.25)' }}>🗑️ Del</button>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════
// ADMIN MODALS — mobile-first full-screen on small devices
// ════════════════════════════════════════════════════════════════════════
function AdminModal({ title, onClose, onSave, saving, children }: any) {
  return (
    <div className="fixed inset-0 z-[999] flex items-end sm:items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)' }}>
      {/* On mobile: slide up from bottom (rounded top). On desktop: centered dialog */}
      <div className="w-full sm:max-w-lg rounded-t-2xl sm:rounded-2xl overflow-hidden"
        style={{ background: 'var(--modal-bg)', maxHeight: '95dvh', display: 'flex', flexDirection: 'column' }}>
        {/* Header */}
        <div className="px-4 py-3 flex items-center justify-between flex-shrink-0"
          style={{ borderBottom: '1px solid var(--modal-border)', background: 'rgba(168,85,247,0.06)' }}>
          <span className="font-bold text-sm" style={{ color: '#a855f7' }}>{title}</span>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg text-lg hover:opacity-60"
            style={{ color: 'var(--modal-muted)' }}>✕</button>
        </div>
        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-4">
          {children}
        </div>
        {/* Footer */}
        <div className="px-4 pb-5 pt-3 flex gap-3 flex-shrink-0"
          style={{ borderTop: '1px solid var(--modal-border)' }}>
          <button onClick={onClose} disabled={saving}
            className="flex-1 py-3 rounded-xl text-sm font-bold disabled:opacity-50"
            style={{ background: 'var(--modal-btn-bg)', color: 'var(--modal-muted)', border: '1px solid var(--modal-border)' }}>
            Cancel
          </button>
          <button onClick={onSave} disabled={saving}
            className="flex-1 py-3 rounded-xl text-sm font-bold text-white disabled:opacity-50 flex items-center justify-center gap-2"
            style={{ background: 'linear-gradient(135deg,#a855f7,#7c3aed)' }}>
            {saving ? '⏳ Saving…' : title.includes('Edit') ? 'Save Changes' : '＋ Add Module'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════
// CERT ITEM EDITORS — inline PDF list + Video URL list for certification
// ════════════════════════════════════════════════════════════════════════

function CertPdfEditor({ items, setItems, isLight, border, primary, muted, faint }: any) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [pendingIdx, setPendingIdx] = useState<number | null>(null);

  const addItem = () =>
    setItems((prev: any[]) => [...prev, { title: '', subtitle: '', isFreePreview: true, _file: null, pdfUrl: '', pdfPublicId: '' }]);

  const update = (idx: number, key: string, val: any) =>
    setItems((prev: any[]) => prev.map((it, i) => i === idx ? { ...it, [key]: val } : it));

  const remove = (idx: number) =>
    setItems((prev: any[]) => prev.filter((_: any, i: number) => i !== idx));

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>, idx: number) => {
    const file = e.target.files?.[0];
    if (!file) return;
    update(idx, '_file', file);
    if (inputRef.current) inputRef.current.value = '';
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <label className="text-[11px] font-bold uppercase tracking-wide" style={{ color: muted }}>
          📄 PDF Items ({items.length})
        </label>
        <button type="button" onClick={addItem}
          className="text-[10px] px-2.5 py-1 rounded-lg font-bold"
          style={{ background: 'rgba(16,185,129,0.10)', color: '#34D399', border: '1px solid rgba(16,185,129,0.25)' }}>
          + Add PDF
        </button>
      </div>

      {items.length === 0 && (
        <p className="text-[11px] px-3 py-2 rounded-lg" style={{ color: faint, background: isLight ? 'rgba(0,0,0,0.03)' : 'rgba(255,255,255,0.04)', border: `1px dashed ${border}` }}>
          No PDFs yet. Click "+ Add PDF" to add.
        </p>
      )}

      {items.map((it: any, idx: number) => (
        <div key={idx} className="flex flex-col gap-1.5 p-3 rounded-xl"
          style={{ background: isLight ? 'rgba(16,185,129,0.03)' : 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.18)' }}>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold flex-shrink-0" style={{ color: '#34D399' }}>PDF #{idx + 1}</span>
            <input value={it.title} placeholder="PDF Title (e.g. NISM V-A Workbook Nov 2025)"
              onChange={e => update(idx, 'title', e.target.value)}
              className="flex-1 rounded-lg px-3 py-1.5 text-xs outline-none"
              style={{ background: isLight ? '#f8fafc' : '#0d1117', border: `1px solid ${border}`, color: primary }} />
            <button type="button" onClick={() => remove(idx)}
              className="w-6 h-6 flex items-center justify-center rounded-lg text-xs font-bold flex-shrink-0"
              style={{ background: 'rgba(239,68,68,0.10)', color: '#f87171', border: '1px solid rgba(239,68,68,0.20)' }}>✕</button>
          </div>
          <input value={it.subtitle} placeholder="Subtitle (e.g. Latest English edition)"
            onChange={e => update(idx, 'subtitle', e.target.value)}
            className="rounded-lg px-3 py-1.5 text-xs outline-none w-full"
            style={{ background: isLight ? '#f8fafc' : '#0d1117', border: `1px solid ${border}`, color: primary }} />
          <div className="flex items-center gap-2">
            <select value={it.isFreePreview ? 'free' : 'paid'}
              onChange={e => update(idx, 'isFreePreview', e.target.value === 'free')}
              className="rounded-lg px-2 py-1.5 text-xs outline-none flex-shrink-0"
              style={{ background: isLight ? '#f8fafc' : '#0d1117', border: `1px solid ${border}`, color: primary }}>
              <option value="free">FREE</option>
              <option value="paid">PAID</option>
            </select>
            {/* File picker */}
            <label className="flex-1 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-all hover:opacity-80"
              style={{ background: it._file ? 'rgba(81,148,246,0.10)' : (it.pdfUrl ? 'rgba(16,185,129,0.08)' : 'rgba(255,255,255,0.05)'), border: `1px solid ${it._file ? 'rgba(81,148,246,0.25)' : (it.pdfUrl ? 'rgba(16,185,129,0.20)' : border)}`, color: it._file ? '#5194F6' : (it.pdfUrl ? '#34D399' : muted) }}>
              <SvgUpload />
              <span className="truncate">
                {it._file ? it._file.name : it.pdfUrl ? '✓ PDF saved — replace?' : 'Upload PDF'}
              </span>
              <input type="file" accept="application/pdf" className="hidden"
                onChange={e => handleFile(e, idx)} />
            </label>
          </div>
        </div>
      ))}
    </div>
  );
}

function CertVideoEditor({ items, setItems, isLight, border, primary, muted, faint }: any) {
  const addItem = () =>
    setItems((prev: any[]) => [...prev, { title: '', videoUrl: '', isFreePreview: true }]);

  const update = (idx: number, key: string, val: any) =>
    setItems((prev: any[]) => prev.map((it: any, i: number) => i === idx ? { ...it, [key]: val } : it));

  const remove = (idx: number) =>
    setItems((prev: any[]) => prev.filter((_: any, i: number) => i !== idx));

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <label className="text-[11px] font-bold uppercase tracking-wide" style={{ color: muted }}>
          🎥 Video URLs ({items.length})
        </label>
        <button type="button" onClick={addItem}
          className="text-[10px] px-2.5 py-1 rounded-lg font-bold"
          style={{ background: 'rgba(81,148,246,0.10)', color: '#5194F6', border: '1px solid rgba(81,148,246,0.25)' }}>
          + Add Video
        </button>
      </div>

      {items.length === 0 && (
        <p className="text-[11px] px-3 py-2 rounded-lg" style={{ color: faint, background: isLight ? 'rgba(0,0,0,0.03)' : 'rgba(255,255,255,0.04)', border: `1px dashed ${border}` }}>
          No videos yet. Click "+ Add Video" to add.
        </p>
      )}

      {items.map((it: any, idx: number) => (
        <div key={idx} className="flex flex-col gap-1.5 p-3 rounded-xl"
          style={{ background: isLight ? 'rgba(81,148,246,0.03)' : 'rgba(81,148,246,0.06)', border: '1px solid rgba(81,148,246,0.18)' }}>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold flex-shrink-0" style={{ color: '#5194F6' }}>VID #{idx + 1}</span>
            <input value={it.title} placeholder="Video Title (e.g. Week 1 — Introduction)"
              onChange={e => update(idx, 'title', e.target.value)}
              className="flex-1 rounded-lg px-3 py-1.5 text-xs outline-none"
              style={{ background: isLight ? '#f8fafc' : '#0d1117', border: `1px solid ${border}`, color: primary }} />
            <button type="button" onClick={() => remove(idx)}
              className="w-6 h-6 flex items-center justify-center rounded-lg text-xs font-bold flex-shrink-0"
              style={{ background: 'rgba(239,68,68,0.10)', color: '#f87171', border: '1px solid rgba(239,68,68,0.20)' }}>✕</button>
          </div>
          <input value={it.videoUrl} placeholder="YouTube / Vimeo URL"
            onChange={e => update(idx, 'videoUrl', e.target.value)}
            className="rounded-lg px-3 py-1.5 text-xs outline-none w-full"
            style={{ background: isLight ? '#f8fafc' : '#0d1117', border: `1px solid ${border}`, color: primary }} />
          <select value={it.isFreePreview ? 'free' : 'paid'}
            onChange={e => update(idx, 'isFreePreview', e.target.value === 'free')}
            className="rounded-lg px-2 py-1.5 text-xs outline-none w-fit"
            style={{ background: isLight ? '#f8fafc' : '#0d1117', border: `1px solid ${border}`, color: primary }}>
            <option value="free">FREE</option>
            <option value="paid">PAID</option>
          </select>
        </div>
      ))}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════
// ADMIN EDIT MODAL
// ════════════════════════════════════════════════════════════════════════
function AdminEditModal({ mod, contentType, onSave, onClose, isLight }: any) {
  const isCertContent = contentType === 'certification';
  const isVideo = contentType === 'video';

  // ── For certification: inline PDF + Video lists ───────────────────────
  // certPdfs: existing pdfs from DB — we only let admin add NEW ones here
  // (delete existing ones via the card's 🗑️ button as before)
  const [certPdfItems,   setCertPdfItems]   = useState<any[]>([]);  // new PDFs to upload
  const [certVideoItems, setCertVideoItems] = useState<any[]>(
    // pre-fill chapters as videos if they have videoUrl
    Array.isArray(mod.chapters)
      ? mod.chapters.map((ch: any) => ({ title: ch.title || '', videoUrl: ch.videoUrl || '', isFreePreview: ch.free ?? true }))
      : []
  );

  const [form, setForm] = useState({
    title:         mod.title         || '',
    subtitle:      mod.subtitle      || '',
    description:   mod.description   || '',
    videoUrl:      mod.videoUrl      || '',
    level:         mod.level         || 'Beginner',
    isPaid:        mod.isPaid        ?? false,
    pdfUrl:        mod.pdfUrl        || '',
    highlights:    Array.isArray(mod.highlights)    ? mod.highlights.join(', ')    : '',
    previewTopics: Array.isArray(mod.previewTopics) ? mod.previewTopics.join(', ') : '',
    chapters: Array.isArray(mod.chapters)
      ? mod.chapters.map((ch: any) => ({ title: ch.title || '', ref: ch.ref || '', free: ch.free ?? true, videoUrl: ch.videoUrl || '' }))
      : [],
  });
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [saving,  setSaving]  = useState(false);

  const cardBg  = isLight ? '#ffffff' : '#1e2433';
  const border  = isLight ? 'rgba(226,232,240,0.8)' : 'rgba(255,255,255,0.10)';
  const primary = isLight ? '#0f172a' : '#f1f5f9';
  const muted   = isLight ? '#64748b' : '#94a3b8';
  const faint   = isLight ? '#94a3b8' : '#475569';

  const cssVars = { '--modal-bg': cardBg, '--modal-border': border, '--modal-muted': muted, '--modal-btn-bg': isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.07)' } as any;

  const handleSave = async () => {
    if (!form.title.trim()) { alert('Title is required'); return; }
    setSaving(true);
    try {
      // For certification: pass video items as chapters, new PDF items separately
      const chapters = isCertContent
        ? certVideoItems.map((v: any, i: number) => ({ title: v.title, ref: `Part ${i + 1}`, free: v.isFreePreview, videoUrl: v.videoUrl }))
        : form.chapters;

      await onSave({
        ...form,
        highlights:    form.highlights.split(',').map((s: string) => s.trim()).filter(Boolean),
        previewTopics: form.previewTopics.split(',').map((s: string) => s.trim()).filter(Boolean),
        chapters,
        _certNewPdfs: isCertContent ? certPdfItems : [],  // new PDFs to upload via cert-pdfs endpoint
      }, pdfFile);
    } finally { setSaving(false); }
  };

  // ── Chapter (segment) helpers for video ──────────────────────────────
  const addChapter    = () => setForm((f: any) => ({ ...f, chapters: [...f.chapters, { title: '', ref: '', free: true, videoUrl: '' }] }));
  const updateChapter = (idx: number, key: string, val: any) =>
    setForm((f: any) => ({ ...f, chapters: f.chapters.map((c: any, i: number) => i === idx ? { ...c, [key]: val } : c) }));
  const removeChapter = (idx: number) =>
    setForm((f: any) => ({ ...f, chapters: f.chapters.filter((_: any, i: number) => i !== idx) }));

  return (
    <div style={cssVars}>
      <AdminModal title="🛡️ Edit Module" onClose={onClose} onSave={handleSave} saving={saving}>
        <ModalField label="Title *" field="title" form={form} setForm={setForm} isLight={isLight} border={border} textPrimary={primary} textMuted={muted} />
        <ModalField label="Subtitle" field="subtitle" form={form} setForm={setForm} isLight={isLight} border={border} textPrimary={primary} textMuted={muted} />
        <ModalField label="Description" field="description" rows={3} form={form} setForm={setForm} isLight={isLight} border={border} textPrimary={primary} textMuted={muted} />

        {isCertContent ? (
          <>
            {/* ── CERTIFICATION: PDFs + Videos ─────────────────────── */}
            <div className="px-3 py-2 rounded-xl text-xs" style={{ background: 'rgba(168,85,247,0.07)', border: '1px solid rgba(168,85,247,0.18)', color: '#a855f7' }}>
              💡 Existing PDFs: delete them from the card's 🗑️ button. Add new PDFs below — they'll be uploaded to Cloudinary.
            </div>
            <CertPdfEditor items={certPdfItems} setItems={setCertPdfItems} isLight={isLight} border={border} primary={primary} muted={muted} faint={faint} />
            <CertVideoEditor items={certVideoItems} setItems={setCertVideoItems} isLight={isLight} border={border} primary={primary} muted={muted} faint={faint} />
          </>
        ) : isVideo ? (
          <>
            {/* ── VIDEO: Segments editor ───────────────────────────── */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-bold uppercase tracking-wide" style={{ color: muted }}>
                  Segments / Chapters ({form.chapters.length})
                </label>
                <button type="button" onClick={addChapter}
                  className="text-[10px] px-2.5 py-1 rounded-lg font-bold"
                  style={{ background: 'rgba(16,185,129,0.10)', color: '#34D399', border: '1px solid rgba(16,185,129,0.25)' }}>
                  + Add Segment
                </button>
              </div>
              {form.chapters.length === 0 && (
                <p className="text-[11px] px-3 py-2 rounded-lg" style={{ color: faint, background: isLight ? 'rgba(0,0,0,0.03)' : 'rgba(255,255,255,0.04)', border: `1px dashed ${border}` }}>
                  No segments yet. Click "+ Add Segment" to add.
                </p>
              )}
              {form.chapters.map((ch: any, idx: number) => (
                <div key={idx} className="flex flex-col gap-1.5 p-3 rounded-xl"
                  style={{ background: isLight ? 'rgba(0,0,0,0.02)' : 'rgba(255,255,255,0.04)', border: `1px solid ${border}` }}>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold flex-shrink-0" style={{ color: faint }}>#{idx + 1}</span>
                    <input value={ch.title} placeholder="Segment title"
                      onChange={e => updateChapter(idx, 'title', e.target.value)}
                      className="flex-1 rounded-lg px-3 py-1.5 text-xs outline-none"
                      style={{ background: isLight ? '#f8fafc' : '#0d1117', border: `1px solid ${border}`, color: primary }} />
                    <button type="button" onClick={() => removeChapter(idx)}
                      className="w-6 h-6 flex items-center justify-center rounded-lg text-xs font-bold flex-shrink-0"
                      style={{ background: 'rgba(239,68,68,0.10)', color: '#f87171', border: '1px solid rgba(239,68,68,0.20)' }}>✕</button>
                  </div>
                  <div className="flex items-center gap-2">
                    <input value={ch.ref} placeholder="Label (e.g. Part 1)"
                      onChange={e => updateChapter(idx, 'ref', e.target.value)}
                      className="flex-1 rounded-lg px-3 py-1.5 text-xs outline-none"
                      style={{ background: isLight ? '#f8fafc' : '#0d1117', border: `1px solid ${border}`, color: primary }} />
                    <select value={ch.free ? 'free' : 'paid'}
                      onChange={e => updateChapter(idx, 'free', e.target.value === 'free')}
                      className="rounded-lg px-2 py-1.5 text-xs outline-none flex-shrink-0"
                      style={{ background: isLight ? '#f8fafc' : '#0d1117', border: `1px solid ${border}`, color: primary }}>
                      <option value="free">FREE</option>
                      <option value="paid">PAID</option>
                    </select>
                  </div>
                  <input value={ch.videoUrl || ''} placeholder="Video URL for this segment (YouTube/Vimeo)"
                    onChange={e => updateChapter(idx, 'videoUrl', e.target.value)}
                    className="rounded-lg px-3 py-1.5 text-xs outline-none w-full"
                    style={{ background: isLight ? '#f8fafc' : '#0d1117', border: `1px solid ${border}`, color: primary }} />
                </div>
              ))}
            </div>
          </>
        ) : (
          <PdfFilePicker currentPdfUrl={form.pdfUrl} pdfFile={pdfFile} setPdfFile={setPdfFile}
            isLight={isLight} border={border} textPrimary={primary} textMuted={muted} textFaint={faint} />
        )}

        <div className="flex gap-3">
          <div className="flex-1 flex flex-col gap-1">
            <label className="text-[11px] font-bold uppercase tracking-wide" style={{ color: muted }}>Level</label>
            <select value={form.level} onChange={e => setForm((f: any) => ({ ...f, level: e.target.value }))}
              className="rounded-xl px-3 py-2 text-sm outline-none"
              style={{ background: isLight ? '#f8fafc' : '#0d1117', border: `1px solid ${border}`, color: primary }}>
              <option>Beginner</option><option>Intermediate</option><option>Advanced</option><option>All Levels</option>
            </select>
          </div>
          <div className="flex-1 flex flex-col gap-1">
            <label className="text-[11px] font-bold uppercase tracking-wide" style={{ color: muted }}>Access</label>
            <select value={form.isPaid ? 'premium' : 'free'} onChange={e => setForm((f: any) => ({ ...f, isPaid: e.target.value === 'premium' }))}
              className="rounded-xl px-3 py-2 text-sm outline-none"
              style={{ background: isLight ? '#f8fafc' : '#0d1117', border: `1px solid ${border}`, color: primary }}>
              <option value="free">Free</option><option value="premium">Premium</option>
            </select>
          </div>
        </div>
        <ModalField label="Highlights (comma-separated)" field="highlights" placeholder="Dec 2025, Free Download" form={form} setForm={setForm} isLight={isLight} border={border} textPrimary={primary} textMuted={muted} />
        <ModalField label="Preview Topics (comma-separated)" field="previewTopics" rows={2} placeholder="Topic 1, Topic 2" form={form} setForm={setForm} isLight={isLight} border={border} textPrimary={primary} textMuted={muted} />
      </AdminModal>
    </div>
  );
}

function AdminAddModal({ contentType, onSave, onClose, isLight }: any) {
  const isCertContent = contentType === 'certification';
  const isVideo = contentType === 'video';

  const [certPdfItems,   setCertPdfItems]   = useState<any[]>([]);
  const [certVideoItems, setCertVideoItems] = useState<any[]>([]);

  const [form, setForm] = useState({
    title: '', subtitle: '', description: '', level: 'Beginner', isPaid: false,
    highlights: '', previewTopics: '', videoUrl: '',
    pages: isVideo ? 'Video' : 'PDF',
    chapters: [] as { title: string; ref: string; free: boolean; videoUrl: string }[],
  });
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [saving,  setSaving]  = useState(false);

  const cardBg  = isLight ? '#ffffff' : '#1e2433';
  const border  = isLight ? 'rgba(226,232,240,0.8)' : 'rgba(255,255,255,0.10)';
  const primary = isLight ? '#0f172a' : '#f1f5f9';
  const muted   = isLight ? '#64748b' : '#94a3b8';
  const faint   = isLight ? '#94a3b8' : '#475569';

  const cssVars = { '--modal-bg': cardBg, '--modal-border': border, '--modal-muted': muted, '--modal-btn-bg': isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.07)' } as any;

  const handleSave = async () => {
    if (!form.title.trim()) { alert('Title is required'); return; }
    setSaving(true);
    try {
      const chapters = isCertContent
        ? certVideoItems.map((v: any, i: number) => ({ title: v.title, ref: `Part ${i + 1}`, free: v.isFreePreview, videoUrl: v.videoUrl }))
        : form.chapters;

      await onSave({
        ...form,
        highlights:    form.highlights.split(',').map((s: string) => s.trim()).filter(Boolean),
        previewTopics: form.previewTopics.split(',').map((s: string) => s.trim()).filter(Boolean),
        chapters,
        _certNewPdfs: isCertContent ? certPdfItems : [],
      }, pdfFile);
    } finally { setSaving(false); }
  };

  // ── Chapter helpers for video ─────────────────────────────────────────
  const addChapter    = () => setForm((f: any) => ({ ...f, chapters: [...f.chapters, { title: '', ref: '', free: true, videoUrl: '' }] }));
  const updateChapter = (idx: number, key: string, val: any) =>
    setForm((f: any) => ({ ...f, chapters: f.chapters.map((c: any, i: number) => i === idx ? { ...c, [key]: val } : c) }));
  const removeChapter = (idx: number) =>
    setForm((f: any) => ({ ...f, chapters: f.chapters.filter((_: any, i: number) => i !== idx) }));

  return (
    <div style={cssVars}>
      <AdminModal title="🛡️ Add New Module" onClose={onClose} onSave={handleSave} saving={saving}>
        <ModalField label="Title *" field="title" form={form} setForm={setForm} isLight={isLight} border={border} textPrimary={primary} textMuted={muted} />
        <ModalField label="Subtitle" field="subtitle" form={form} setForm={setForm} isLight={isLight} border={border} textPrimary={primary} textMuted={muted} />
        <ModalField label="Description" field="description" rows={3} form={form} setForm={setForm} isLight={isLight} border={border} textPrimary={primary} textMuted={muted} />

        {isCertContent ? (
          <>
            {/* ── CERTIFICATION: PDFs + Videos ─────────────────────── */}
            <CertPdfEditor items={certPdfItems} setItems={setCertPdfItems} isLight={isLight} border={border} primary={primary} muted={muted} faint={faint} />
            <CertVideoEditor items={certVideoItems} setItems={setCertVideoItems} isLight={isLight} border={border} primary={primary} muted={muted} faint={faint} />
          </>
        ) : isVideo ? (
          <>
            {/* ── VIDEO: Segments ─────────────────────────────────── */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-bold uppercase tracking-wide" style={{ color: muted }}>
                  Segments / Chapters ({form.chapters.length})
                </label>
                <button type="button" onClick={addChapter}
                  className="text-[10px] px-2.5 py-1 rounded-lg font-bold"
                  style={{ background: 'rgba(16,185,129,0.10)', color: '#34D399', border: '1px solid rgba(16,185,129,0.25)' }}>
                  + Add Segment
                </button>
              </div>
              {form.chapters.length === 0 && (
                <p className="text-[11px] px-3 py-2 rounded-lg" style={{ color: faint, background: isLight ? 'rgba(0,0,0,0.03)' : 'rgba(255,255,255,0.04)', border: `1px dashed ${border}` }}>
                  No segments yet. Click "+ Add Segment" to add.
                </p>
              )}
              {form.chapters.map((ch: any, idx: number) => (
                <div key={idx} className="flex flex-col gap-1.5 p-3 rounded-xl"
                  style={{ background: isLight ? 'rgba(0,0,0,0.02)' : 'rgba(255,255,255,0.04)', border: `1px solid ${border}` }}>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold flex-shrink-0" style={{ color: faint }}>#{idx + 1}</span>
                    <input value={ch.title} placeholder="Segment title"
                      onChange={e => updateChapter(idx, 'title', e.target.value)}
                      className="flex-1 rounded-lg px-3 py-1.5 text-xs outline-none"
                      style={{ background: isLight ? '#f8fafc' : '#0d1117', border: `1px solid ${border}`, color: primary }} />
                    <button type="button" onClick={() => removeChapter(idx)}
                      className="w-6 h-6 flex items-center justify-center rounded-lg text-xs font-bold flex-shrink-0"
                      style={{ background: 'rgba(239,68,68,0.10)', color: '#f87171', border: '1px solid rgba(239,68,68,0.20)' }}>✕</button>
                  </div>
                  <div className="flex items-center gap-2">
                    <input value={ch.ref} placeholder="Label (e.g. Part 1)"
                      onChange={e => updateChapter(idx, 'ref', e.target.value)}
                      className="flex-1 rounded-lg px-3 py-1.5 text-xs outline-none"
                      style={{ background: isLight ? '#f8fafc' : '#0d1117', border: `1px solid ${border}`, color: primary }} />
                    <select value={ch.free ? 'free' : 'paid'}
                      onChange={e => updateChapter(idx, 'free', e.target.value === 'free')}
                      className="rounded-lg px-2 py-1.5 text-xs outline-none flex-shrink-0"
                      style={{ background: isLight ? '#f8fafc' : '#0d1117', border: `1px solid ${border}`, color: primary }}>
                      <option value="free">FREE</option>
                      <option value="paid">PAID</option>
                    </select>
                  </div>
                  <input value={ch.videoUrl || ''} placeholder="Video URL for this segment (YouTube/Vimeo)"
                    onChange={e => updateChapter(idx, 'videoUrl', e.target.value)}
                    className="rounded-lg px-3 py-1.5 text-xs outline-none w-full"
                    style={{ background: isLight ? '#f8fafc' : '#0d1117', border: `1px solid ${border}`, color: primary }} />
                </div>
              ))}
            </div>
          </>
        ) : (
          <PdfFilePicker currentPdfUrl="" pdfFile={pdfFile} setPdfFile={setPdfFile}
            isLight={isLight} border={border} textPrimary={primary} textMuted={muted} textFaint={faint} />
        )}

        <div className="flex gap-3">
          <div className="flex-1 flex flex-col gap-1">
            <label className="text-[11px] font-bold uppercase tracking-wide" style={{ color: muted }}>Level</label>
            <select value={form.level} onChange={e => setForm((f: any) => ({ ...f, level: e.target.value }))}
              className="rounded-xl px-3 py-2 text-sm outline-none"
              style={{ background: isLight ? '#f8fafc' : '#0d1117', border: `1px solid ${border}`, color: primary }}>
              <option>Beginner</option><option>Intermediate</option><option>Advanced</option><option>All Levels</option>
            </select>
          </div>
          <div className="flex-1 flex flex-col gap-1">
            <label className="text-[11px] font-bold uppercase tracking-wide" style={{ color: muted }}>Access</label>
            <select value={form.isPaid ? 'premium' : 'free'} onChange={e => setForm((f: any) => ({ ...f, isPaid: e.target.value === 'premium' }))}
              className="rounded-xl px-3 py-2 text-sm outline-none"
              style={{ background: isLight ? '#f8fafc' : '#0d1117', border: `1px solid ${border}`, color: primary }}>
              <option value="free">Free</option><option value="premium">Premium</option>
            </select>
          </div>
        </div>
        <ModalField label="Highlights (comma-separated)" field="highlights" placeholder="Dec 2025, Free Download" form={form} setForm={setForm} isLight={isLight} border={border} textPrimary={primary} textMuted={muted} />
        <ModalField label="Preview Topics (comma-separated)" field="previewTopics" rows={2} placeholder="Topic 1, Topic 2" form={form} setForm={setForm} isLight={isLight} border={border} textPrimary={primary} textMuted={muted} />
      </AdminModal>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════
// MOBILE TOC — horizontal scrollable pill bar (replaces sidebar on mobile)
// ════════════════════════════════════════════════════════════════════════
function MobileTocBar({ pageModules, activeModule, data, hasAccess, textFaint, textMuted, onScrollTo, onUnlock }: any) {
  return (
    <div className="lg:hidden mb-4 -mx-4 px-4">
      <div className="flex gap-2 overflow-x-auto pb-2"
        style={{ scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' } as any}>
        {pageModules.map((mod: any, i: number) => {
          const modLocked = !hasAccess && mod.isPaid;
          return (
            <button key={i}
              onClick={() => modLocked ? onUnlock() : onScrollTo(i)}
              className="flex-shrink-0 text-xs px-3 py-1.5 rounded-full font-medium transition-all whitespace-nowrap flex items-center gap-1"
              style={{
                background: activeModule === i ? data.accentGrad : (modLocked ? 'rgba(148,163,184,0.08)' : 'rgba(148,163,184,0.12)'),
                color:      activeModule === i ? '#fff' : modLocked ? textFaint : textMuted,
                border:     activeModule === i ? 'none' : '1px solid rgba(148,163,184,0.15)',
              }}>
              {modLocked && <SvgLockSm />}
              {mod.title.length > 22 ? mod.title.slice(0, 22) + '…' : mod.title}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ════════════════════════════════════════════════════════════════════════
export const EducationDetailView: React.FC = () => {
  const { categoryId }    = useParams<{ categoryId: string }>();
  const navigate          = useNavigate();
  const { theme }         = useTheme();
  const { user, isAdmin } = useAuth();
  const { isSubscriber, loading: subLoading } = useSubscription();
  const isLight = theme === 'light';

  const isFullyOpen = categoryId === 'financial-ebooks';
  const hasAccess   = isAdmin || isSubscriber || isFullyOpen;

  const {
    data, modules: localModules, loading: dataLoading, dbSynced,
    addModule: hookAddModule, updateModule: hookUpdateModule,
    deleteModule: hookDeleteModule, moveModule: hookMoveModule,
  } = useEducation(categoryId);

  // ── Pagination ────────────────────────────────────────────────────────
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages  = Math.max(1, Math.ceil(localModules.length / ITEMS_PER_PAGE));
  const pageModules = localModules.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const handlePageChange = (p: number) => {
    setCurrentPage(p);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // ── Unlock handler ────────────────────────────────────────────────────
  const handleUnlock = () => {
    if (!user) navigate('/signin', { state: { from: `/education/${categoryId}` } });
    else navigate('/pricing');
  };

  // ── Admin modal state ─────────────────────────────────────────────────
  const [editingIdx,   setEditingIdx]   = useState<number | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);

  const handleDelete = async (pageIdx: number) => {
    const globalIdx = (currentPage - 1) * ITEMS_PER_PAGE + pageIdx;
    const mod = localModules[globalIdx];
    if (!mod) return;
    if (!window.confirm(`Delete "${mod.title}"?\n\nPDF will also be removed from Cloudinary.`)) return;
    await hookDeleteModule(mod._id ?? `local-${globalIdx}`);
  };

  const handleSaveEdit = async (updated: any, pdfFile?: File | null) => {
    if (editingIdx === null) return;
    const mod = localModules[editingIdx];
    await hookUpdateModule(mod._id ?? `local-${editingIdx}`, updated, pdfFile);

    // Upload any new cert PDFs via the correct cert-pdfs API function
    const certNewPdfs: any[] = updated._certNewPdfs || [];
    for (const pdfItem of certNewPdfs) {
      if (!pdfItem._file || !pdfItem.title?.trim()) continue;
      try {
        await apiAddCertPdf(
          categoryId!,
          mod._id,
          pdfItem._file,
          pdfItem.title.trim(),
          pdfItem.subtitle?.trim() || '',
          pdfItem.isFreePreview ?? true
        );
      } catch (e) { console.error('Cert PDF upload failed:', e); }
    }
    if (certNewPdfs.some((p: any) => p._file)) window.location.reload();
    else setEditingIdx(null);
  };

  const handleAddModule = async (newMod: any, pdfFile?: File | null) => {
    // hookAddModule now returns the saved module (including its DB _id)
    const savedModule = await hookAddModule(newMod, pdfFile);
    setShowAddModal(false);
    setCurrentPage(Math.ceil((localModules.length + 1) / ITEMS_PER_PAGE));

    // Upload cert PDFs now that we have the new module's _id
    const certNewPdfs: any[] = newMod._certNewPdfs || [];
    const hasCertPdfs = certNewPdfs.some((p: any) => p._file);

    if (hasCertPdfs && savedModule?._id && !savedModule._id.startsWith('local-')) {
      for (const pdfItem of certNewPdfs) {
        if (!pdfItem._file || !pdfItem.title?.trim()) continue;
        try {
          await apiAddCertPdf(
            categoryId!,
            savedModule._id,
            pdfItem._file,
            pdfItem.title.trim(),
            pdfItem.subtitle?.trim() || '',
            pdfItem.isFreePreview ?? true
          );
        } catch (e) { console.error('Cert PDF upload failed:', e); }
      }
      window.location.reload();
    }
  };

  const handleMoveUp   = async (i: number) => hookMoveModule((currentPage - 1) * ITEMS_PER_PAGE + i, 'up');
  const handleMoveDown = async (i: number) => hookMoveModule((currentPage - 1) * ITEMS_PER_PAGE + i, 'down');

  // ── Theme tokens ──────────────────────────────────────────────────────
  const pageBg      = isLight ? '#f8fafc' : '#0d1117';
  const cardBg      = isLight ? '#ffffff' : '#161b22';
  const border      = isLight ? 'rgba(226,232,240,0.8)' : 'rgba(255,255,255,0.08)';
  const textPrimary = isLight ? '#0f172a' : '#f1f5f9';
  const textMuted   = isLight ? '#64748b' : '#94a3b8';
  const textFaint   = isLight ? '#94a3b8' : '#475569';

  // ── Module refs for scroll / active tracking ──────────────────────────
  const moduleRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [activeModule, setActiveModule] = useState(0);

  useEffect(() => {
    moduleRefs.current = new Array(pageModules.length).fill(null);
    setActiveModule(0);
  }, [currentPage, pageModules.length]);

  useEffect(() => {
    const refs = moduleRefs.current.filter(Boolean);
    if (!refs.length) return;
    const observer = new IntersectionObserver(
      (entries) => entries.forEach(entry => {
        if (entry.isIntersecting) {
          const idx = moduleRefs.current.indexOf(entry.target as HTMLDivElement);
          if (idx !== -1) setActiveModule(idx);
        }
      }),
      { threshold: 0.15, rootMargin: '-60px 0px -50% 0px' }
    );
    refs.forEach(r => observer.observe(r!));
    return () => observer.disconnect();
  }, [pageModules]);

  const setModuleRef = useCallback((el: HTMLDivElement | null, i: number) => {
    moduleRefs.current[i] = el;
  }, []);

  const scrollToModule = (i: number) => {
    const ref = moduleRefs.current[i];
    if (ref) { ref.scrollIntoView({ behavior: 'smooth', block: 'start' }); setActiveModule(i); }
  };

  // ── Loading ───────────────────────────────────────────────────────────
  if (subLoading || dataLoading) {
    return (
      <Layout>
        <div style={{ background: pageBg, minHeight: '100vh' }}>
          <div className="max-w-5xl mx-auto px-4 py-6">
            <div className="animate-pulse space-y-4">
              <div className="h-6 w-24 rounded-xl" style={{ background: isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.06)' }} />
              <div className="h-40 rounded-2xl" style={{ background: isLight ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.04)' }} />
              <div className="h-56 rounded-2xl" style={{ background: isLight ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.04)' }} />
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (!data) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen px-4">
          <p style={{ color: '#94a3b8' }}>Category not found.</p>
        </div>
      </Layout>
    );
  }

  const isEbook = data.contentType === 'ebook';
  const isCert  = data.contentType === 'certification';

  return (
    <Layout>
      <div style={{ background: pageBg, minHeight: '100vh' }}>
        {/* ── Constrained container — full desktop width, safe padding ── */}
        <div className="max-w-7xl mx-auto px-4 md:px-8 lg:px-12 py-6">

          {/* Back */}
          <button onClick={() => navigate('/education')}
            className="flex items-center gap-1.5 text-sm mb-5 hover:opacity-70"
            style={{ color: textMuted }}>
            <SvgBack /> Back to Learn
          </button>

          {/* Seed banner (admin only, when DB not seeded) */}
          {isAdmin && !dbSynced && (
            <div className="mb-4 flex items-start gap-3 px-4 py-3 rounded-xl"
              style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.25)' }}>
              <span className="flex-shrink-0 mt-0.5" style={{ color: '#FBBF24' }}>⚠️</span>
              <p className="text-xs leading-relaxed" style={{ color: '#FBBF24', margin: 0 }}>
                <strong>Not seeded to DB yet.</strong> Edits lost on refresh.{' '}
                <button onClick={() => navigate('/admin/education-seed')}
                  style={{ fontWeight: 700, textDecoration: 'underline', background: 'none', border: 'none', cursor: 'pointer', color: '#FBBF24', padding: 0 }}>
                  Seed now →
                </button>
              </p>
            </div>
          )}

          {/* ── Hero card — mobile-first ──────────────────────────────── */}
          <div className="rounded-2xl p-5 md:p-8 mb-6 relative overflow-hidden"
            style={{ background: cardBg, border: `1px solid ${border}` }}>
            <div className="absolute inset-0 pointer-events-none"
              style={{ background: `radial-gradient(ellipse at 0% 0%, ${data.accent}10, transparent 60%)` }} />
            <div className="relative z-10">
              {/* Badges row */}
              <div className="flex items-center flex-wrap gap-2 mb-3">
                <span className="text-xs font-bold px-2.5 py-1 rounded-full"
                  style={{ background: `${data.accent}15`, color: data.accent, border: `1px solid ${data.accent}30` }}>{data.tag}</span>
                <span className="text-xs" style={{ color: textFaint }}>
                  {localModules.length} {isCert ? 'Programs' : isEbook ? 'PDFs' : 'Sessions'}
                </span>
                {isAdmin
                  ? <span className="text-xs font-bold px-2.5 py-1 rounded-full" style={{ background: 'rgba(168,85,247,0.12)', color: '#a855f7', border: '1px solid rgba(168,85,247,0.25)' }}>🛡️ Admin</span>
                  : isSubscriber
                    ? <span className="text-xs font-bold px-2.5 py-1 rounded-full" style={{ background: 'rgba(34,197,94,0.12)', color: '#22c55e', border: '1px solid rgba(34,197,94,0.25)' }}>✓ Premium</span>
                    : <button onClick={handleUnlock} className="text-xs font-bold px-2.5 py-1 rounded-full" style={{ background: 'rgba(81,148,246,0.12)', color: '#5194F6', border: '1px solid rgba(81,148,246,0.25)' }}>🔒 Subscribe</button>
                }
              </div>

              {/* Title + description + instructor — desktop: side by side, mobile: stacked */}
              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <h1 className="text-2xl md:text-3xl font-bold mb-2" style={{ color: textPrimary }}>{data.title}</h1>
                  <p className="text-sm leading-relaxed mb-4" style={{ color: textMuted }}>{data.description}</p>
                  {/* Duration */}
                  <span className="flex items-center gap-1 text-sm" style={{ color: textMuted }}>
                    <SvgClock /> {data.stats?.duration}
                  </span>
                </div>
                {/* Instructor pill — right side on desktop, below on mobile */}
                <div className="flex items-center gap-2.5 px-4 py-3 rounded-xl w-fit flex-shrink-0 self-start md:self-center"
                  style={{ background: isLight ? `${data.accent}08` : `${data.accent}12`, border: `1px solid ${data.accent}20` }}>
                  <span className="text-xl leading-none">{data.instructor?.avatar}</span>
                  <div>
                    <p className="text-xs font-semibold leading-tight" style={{ color: textPrimary }}>{data.instructor?.name}</p>
                    <p className="text-[10px] leading-tight" style={{ color: textMuted }}>{data.instructor?.role}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Admin header + Add button */}
          {isAdmin && (
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs font-bold uppercase tracking-widest" style={{ color: '#a855f7' }}>
                🛡️ {localModules.length} modules{dbSynced && <span style={{ color: '#34D399' }}> · Synced</span>}
              </span>
              <button onClick={() => setShowAddModal(true)}
                className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold text-white"
                style={{ background: 'linear-gradient(135deg,#a855f7,#7c3aed)' }}>
                ＋ Add Module
              </button>
            </div>
          )}

          {/* ── Body layout: sidebar (desktop) + module list ─────────── */}
          <div className="flex gap-5 items-start">

            {/* ── Desktop sidebar TOC ─────────────────────────────────── */}
            <aside className="hidden lg:flex flex-col w-52 flex-shrink-0 sticky top-24"
              style={{ maxHeight: 'calc(100vh - 120px)' }}>
              <p className="text-[10px] font-bold uppercase tracking-widest mb-2 flex-shrink-0" style={{ color: textFaint }}>
                {isEbook ? 'Books' : 'Sessions'}
                {totalPages > 1 && <span className="ml-1 normal-case font-normal">(p.{currentPage}/{totalPages})</span>}
              </p>
              <div className="flex-1 overflow-y-auto flex flex-col gap-0.5 pr-1"
                style={{ scrollbarWidth: 'thin', scrollbarColor: `${data.accent}40 transparent` }}>
                {pageModules.map((mod: any, i: number) => {
                  const modLocked = data.isPaid && mod.isPaid && !hasAccess;
                  return (
                    <button key={mod._id ?? i}
                      onClick={() => modLocked ? handleUnlock() : scrollToModule(i)}
                      className="text-left text-xs px-3 py-2 rounded-lg transition-all truncate flex items-center gap-1.5 flex-shrink-0"
                      style={{
                        background: activeModule === i ? `${data.accent}15` : 'transparent',
                        color: activeModule === i ? data.accent : modLocked ? textFaint : textMuted,
                        border: activeModule === i ? `1px solid ${data.accent}30` : '1px solid transparent',
                      }}>
                      {modLocked && <SvgLockSm />}
                      <span className="truncate">{mod.title}</span>
                    </button>
                  );
                })}
              </div>
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-3 pt-3 flex-shrink-0"
                  style={{ borderTop: `1px solid ${isLight ? 'rgba(226,232,240,0.7)' : 'rgba(255,255,255,0.07)'}` }}>
                  <button onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1}
                    className="text-xs px-2 py-1 rounded-lg font-bold disabled:opacity-30"
                    style={{ background: `${data.accent}15`, color: data.accent }}>← Prev</button>
                  <span className="text-[11px]" style={{ color: textFaint }}>{currentPage}/{totalPages}</span>
                  <button onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages}
                    className="text-xs px-2 py-1 rounded-lg font-bold disabled:opacity-30"
                    style={{ background: `${data.accent}15`, color: data.accent }}>Next →</button>
                </div>
              )}
              {!hasAccess && (
                <button onClick={handleUnlock} className="mt-3 w-full py-2 rounded-xl text-xs font-bold text-white"
                  style={{ background: data.accentGrad }}>🔓 Unlock All</button>
              )}
            </aside>

            {/* ── Module list ─────────────────────────────────────────── */}
            <div className="flex-1 min-w-0 flex flex-col gap-4">

              {/* Mobile horizontal TOC bar */}
              <MobileTocBar
                pageModules={pageModules}
                activeModule={activeModule}
                data={data}
                hasAccess={hasAccess}
                textFaint={textFaint}
                textMuted={textMuted}
                onScrollTo={scrollToModule}
                onUnlock={handleUnlock}
              />

              {pageModules.map((mod: any, i: number) => {
                const modLocked = data.isPaid && mod.isPaid && !hasAccess;
                const globalIdx = (currentPage - 1) * ITEMS_PER_PAGE + i;

                return (
                  <div key={mod._id ?? globalIdx} ref={el => setModuleRef(el, i)}>
                    {isAdmin && (
                      <AdminModuleToolbar
                        idx={i}
                        onEdit={() => setEditingIdx(globalIdx)}
                        onDelete={() => handleDelete(i)}
                        onMoveUp={handleMoveUp}
                        onMoveDown={handleMoveDown}
                        totalModules={pageModules.length}
                      />
                    )}
                    <div style={isAdmin ? { borderRadius: '0 0 16px 16px', overflow: 'hidden' } : {}}>
                      {modLocked ? (
                        <LockedModuleCard data={data} isLight={isLight} cardBg={cardBg} border={border} textFaint={textFaint} onUnlock={handleUnlock} />
                        ) : isCert ? (
                          <CertModuleCard mod={mod} data={data} isLight={isLight} cardBg={cardBg} border={border}
                            textPrimary={textPrimary} textMuted={textMuted} textFaint={textFaint}
                            hasAccess={hasAccess} isAdmin={isAdmin} isSubscriber={isSubscriber} onUnlock={handleUnlock}
                            categoryId={categoryId}
                            onCertPdfAdded={(updatedMod: any) => {
                              window.location.reload();
                            }}
                            onCertPdfDeleted={(pdfIdx: number) => {
                              window.location.reload();
                            }}
                            onVideoDeleted={async (chIdx: number) => {
                              const updatedChapters = mod.chapters.filter((_: any, ci: number) => ci !== chIdx);
                              await hookUpdateModule(mod._id, { ...mod, chapters: updatedChapters }, null);
                              window.location.reload();
                            }} />
                      ) : isEbook ? (
                        <PdfModuleCard mod={mod} data={data} isLight={isLight} cardBg={cardBg} border={border}
                          ls={levelStyleMap[mod.level] ?? levelStyleMap['Beginner']}
                          textPrimary={textPrimary} textMuted={textMuted} textFaint={textFaint}
                          locked={modLocked} onUnlock={handleUnlock} />
                      ) : (
                        <ModuleCard mod={mod} data={data} isLight={isLight} cardBg={cardBg} border={border}
                          ls={levelStyleMap[mod.level] ?? levelStyleMap['Beginner']}
                          textPrimary={textPrimary} textMuted={textMuted} textFaint={textFaint}
                          locked={modLocked} hasAccess={hasAccess} onUnlock={handleUnlock} />
                      )}
                    </div>
                  </div>
                );
              })}

              {/* ── Pagination — simplified on mobile ────────────────── */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-4 flex-wrap">
                  <button onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1}
                    className="px-3 md:px-4 py-2 rounded-xl text-sm font-bold disabled:opacity-30"
                    style={{ background: `${data.accent}15`, color: data.accent, border: `1px solid ${data.accent}25` }}>
                    ← Prev
                  </button>
                  {/* Page numbers: hidden on very small, show on sm+ */}
                  <div className="hidden sm:flex items-center gap-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                      <button key={p} onClick={() => handlePageChange(p)}
                        className="w-9 h-9 rounded-xl text-sm font-bold"
                        style={{
                          background: p === currentPage ? data.accentGrad : `${data.accent}10`,
                          color: p === currentPage ? '#fff' : data.accent,
                          border: `1px solid ${p === currentPage ? 'transparent' : data.accent + '25'}`,
                        }}>
                        {p}
                      </button>
                    ))}
                  </div>
                  {/* Mobile: just show current/total */}
                  <span className="sm:hidden text-sm font-bold px-3 py-2 rounded-xl"
                    style={{ background: `${data.accent}12`, color: data.accent }}>
                    {currentPage} / {totalPages}
                  </span>
                  <button onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages}
                    className="px-3 md:px-4 py-2 rounded-xl text-sm font-bold disabled:opacity-30"
                    style={{ background: `${data.accent}15`, color: data.accent, border: `1px solid ${data.accent}25` }}>
                    Next →
                  </button>
                </div>
              )}
              {totalPages > 1 && (
                <p className="text-center text-xs" style={{ color: textFaint }}>
                  {(currentPage - 1) * ITEMS_PER_PAGE + 1}–{Math.min(currentPage * ITEMS_PER_PAGE, localModules.length)} of {localModules.length} {isEbook ? 'PDFs' : 'modules'}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {isAdmin && editingIdx !== null && (
        <AdminEditModal mod={localModules[editingIdx]} contentType={data.contentType}
          onSave={handleSaveEdit} onClose={() => setEditingIdx(null)} isLight={isLight} />
      )}
      {isAdmin && showAddModal && (
        <AdminAddModal contentType={data.contentType}
          onSave={handleAddModule} onClose={() => setShowAddModal(false)} isLight={isLight} />
      )}
    </Layout>
  );
};