import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/controllers/AuthContext';
import { useTheme } from '@/controllers/Themecontext';
import Header from '../components/Header';
import Footer from '../components/Footer';
import RequireSubscription from '@/components/RequireSubscription';
import {
  TrendingUp, TrendingDown, Calendar, Users, Building2,
  CheckCircle, Clock, AlertCircle, ArrowRight, Star, Target,
  Zap, BarChart3, FileText, Search, IndianRupee, Plus, X, Edit3,
  Save, Trash2, Loader2, RefreshCw, ChevronDown,
  ShieldCheck, ShieldAlert, AlertTriangle, Filter, Calculator, Upload,
} from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';
const IPO_ENDPOINT = `${API_BASE}/ipo`;

/* ── types ── */
type IPOStatus = 'upcoming' | 'open' | 'closed';   // "listed" removed

interface IPO {
  _id: string; companyName: string; logo: string; logoUrl?: string; logoPublicId?: string; industry: string;
  status: IPOStatus; openDate: string; closeDate: string;
  listingDate?: string; priceRange: string; lotSize: number;
  issueSize: string; minInvestment: string; subscriptionStatus?: string;
  listingGain?: number | null; gmp?: number | null; allotmentDate?: string;
  refundDate?: string; upiDate?: string; exchange: string; rating: number; rhpLink?: string; category?: string;
  swot?: { strengths: string[]; weaknesses: string[]; opportunities: string[]; threats: string[]; };
}
interface Counts { open: number; upcoming: number; closed: number; total: number; }

const STATUS_CFG = {
  upcoming: { bg: 'bg-blue-500/10',   text: 'text-blue-500',   label: 'Upcoming' },
  open:     { bg: 'bg-green-500/10',  text: 'text-green-500',  label: 'Open Now' },
  closed:   { bg: 'bg-orange-500/10', text: 'text-orange-500', label: 'Closed'   },
};

const INDUSTRIES = [
  'IT Services','Defence & Aerospace','FMCG & Retail','Automobile Components',
  'Renewable Energy','Electric Vehicles','Pharmaceuticals','Solar Manufacturing',
  'Food Delivery & Tech','E-Commerce & Beauty','Banking & Finance','Infrastructure',
  'Healthcare','Real Estate','Telecom','Insurance','Chemicals','Textiles',
  'Retail','Logistics','Media & Entertainment','Other',
];

const BLANK: Omit<IPO,'_id'> = {
  companyName:'', logo:'', industry:'', status:'upcoming',
  category:'Mainboard', exchange:'NSE / BSE',
  openDate:'', closeDate:'', allotmentDate:'', refundDate:'', upiDate:'', listingDate:'',
  priceRange:'', lotSize:0, issueSize:'', minInvestment:'',
  subscriptionStatus:'', listingGain:null, gmp:null, rating:3, rhpLink:'',
  swot:{ strengths:[], weaknesses:[], opportunities:[], threats:[] },
};

/* ── date helpers ── */
function toInputDate(s: string): string {
  if (!s) return '';
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  const d = new Date(s);
  return isNaN(d.getTime()) ? '' : d.toISOString().slice(0, 10);
}
function fmtDate(s: string): string {
  if (!s) return '—';
  const d = new Date(s);
  return isNaN(d.getTime())
    ? s
    : d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

/* ── effective status based on today's date ── */
function getEffectiveStatus(ipo: IPO): IPOStatus {
  const today = new Date(); today.setHours(0,0,0,0);
  const open  = ipo.openDate  ? new Date(ipo.openDate)  : null;
  const close = ipo.closeDate ? new Date(ipo.closeDate) : null;
  if (open)  open.setHours(0,0,0,0);
  if (close) close.setHours(0,0,0,0);
  if (open && close) {
    if (today < open)  return 'upcoming';
    if (today <= close) return 'open';
    return 'closed';
  }
  return ipo.status;
}
function parseUpperPrice(pr: string): number | null {
  const c = pr.replace(/₹/g, '').replace(/,/g, '');
  const v = parseFloat(c.split(/[-–—]/).pop()!.trim());
  return isNaN(v) ? null : v;
}
function calcMin(pr: string, lot: number): string {
  const upper = parseUpperPrice(pr);
  if (!upper || !lot || lot < 1) return '';
  return `₹${(upper * lot).toLocaleString('en-IN')}`;
}

function autoLogo(name: string) {
  return name.split(' ').slice(0,2).map(w=>w[0]).join('').toUpperCase().slice(0,2);
}

/* ── PriceBandInput — auto ₹ prefix on both numbers ── */
function PriceBandInput({ value, onChange, className, style }: {
  value: string; onChange: (v: string) => void; className?: string; style?: React.CSSProperties;
}) {
  return (
    <input className={className} style={style} placeholder="₹475 – ₹500" value={value}
      onChange={e => {
        const raw = e.target.value.replace(/₹/g, '').replace(/\s*[–-]\s*/g, '-').trim();
        const parts = raw.split('-');
        if (parts.length >= 2) {
          const p1 = parts[0].trim();
          const p2 = parts.slice(1).join('-').trim();
          onChange(p2 ? `₹${p1} – ₹${p2}` : `₹${p1} –`);
        } else {
          onChange(raw ? `₹${raw}` : '');
        }
      }}
    />
  );
}

// callAPI — supports JSON and FormData (for file uploads)
async function callAPI(url: string, opts?: RequestInit & { formData?: FormData }) {
  const { formData, ...rest } = (opts || {}) as any;
  const res = await fetch(url, {
    credentials: 'include',
    ...(formData
      ? { method: rest.method || 'POST', body: formData }
      : { headers: { 'Content-Type': 'application/json' }, ...rest }
    ),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.message || `Error ${res.status}`);
  return json.data;
}

/* ── Status Badge ── */
function StatusBadge({ status }: { status: IPOStatus }) {
  const c = STATUS_CFG[status];
  const Icon = { upcoming:Clock, open:CheckCircle, closed:AlertCircle }[status];
  return (
    <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${c.bg} ${c.text}`}>
      <Icon className="w-3 h-3" />{c.label}
    </span>
  );
}

/* ── Stars ── */
function Stars({ rating, onClick }: { rating: number; onClick?: (n:number)=>void }) {
  return (
    <div className="flex items-center gap-0.5">
      {[...Array(5)].map((_,i) => (
        <Star key={i} onClick={()=>onClick?.(i+1)}
          className={`w-3.5 h-3.5 ${i<rating?'fill-yellow-500 text-yellow-500':'text-gray-300'} ${onClick?'cursor-pointer hover:scale-110 transition-transform':''}`} />
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   FORM MODAL (inline version — full dark/light theming)
═══════════════════════════════════════════════════════════════════ */
function FormModal({ initial, onSave, onClose, saving }: {
  initial?: IPO; onSave:(d:Omit<IPO,'_id'>, logoFile?: File|null)=>Promise<void>; onClose:()=>void; saving:boolean;
}) {
  const { theme } = useTheme();
  const isDark = theme !== 'light';

  const [form,        setForm]       = useState<Omit<IPO,'_id'>>(initial ? {...initial} : {...BLANK});
  const [errors,      setErrors]     = useState<Record<string,string>>({});
  const [logoFile,    setLogoFile]   = useState<File|null>(null);
  const [logoPreview, setLogoPreview] = useState<string>(initial?.logoUrl || '');

  // Lock body scroll while modal is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  const set = (k: keyof Omit<IPO,'_id'>, v: any) =>
    setForm(prev => {
      const next: Omit<IPO,'_id'> = {
        ...prev, [k]: v,
        ...(k==='companyName'&&!initial ? {logo:autoLogo(v)} : {}),
      };
      const pr  = k === 'priceRange' ? v : next.priceRange;
      const lot = k === 'lotSize'    ? v : next.lotSize;
      const auto = calcMin(pr, Number(lot));
      if ((k === 'priceRange' || k === 'lotSize') && auto) next.minInvestment = auto;
      return next;
    });

  const handleLogoFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLogoFile(file);
    const reader = new FileReader();
    reader.onload = ev => setLogoPreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const validate = () => {
    const e: Record<string,string> = {};
    if (!form.companyName.trim())   e.companyName   = 'Required';
    if (!form.openDate.trim())      e.openDate      = 'Required';
    if (!form.closeDate.trim())     e.closeDate     = 'Required';
    if (!form.priceRange.trim())    e.priceRange    = 'Required';
    if (!form.issueSize.trim())     e.issueSize     = 'Required';
    if (!form.minInvestment.trim()) e.minInvestment = 'Required';
    if (!form.lotSize||form.lotSize<1) e.lotSize    = 'Required';
    setErrors(e); return !Object.keys(e).length;
  };

  const submit = async () => { if (!validate()) return; await onSave({...form, logo:form.logo||autoLogo(form.companyName)}, logoFile); };

  /* ── tokens ── */
  const modalBg   = isDark ? '#101528' : '#f0f7fe';
  const modalBdr  = isDark ? 'rgba(255,255,255,0.10)' : 'rgba(13,37,64,0.12)';
  const blockBg   = isDark ? 'rgba(81,148,246,0.06)'  : 'rgba(81,148,246,0.06)';
  const blockBdr  = isDark ? 'rgba(81,148,246,0.18)'  : 'rgba(81,148,246,0.18)';
  const bLabel    = isDark ? '#5194F6'  : '#2563eb';
  const footBg    = isDark ? '#101528'  : '#f0f7fe';
  const footBdr   = isDark ? 'rgba(255,255,255,0.10)' : 'rgba(13,37,64,0.10)';
  const inBg      = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.90)';
  const inBdr     = isDark ? 'rgba(255,255,255,0.12)' : 'rgba(13,37,64,0.18)';
  const inTxt     = isDark ? '#ffffff'  : '#0d1b2a';
  const lblClr    = isDark ? 'rgba(148,163,184,1)' : 'rgba(13,37,64,0.55)';
  const hintClr   = isDark ? 'rgba(100,116,139,1)' : 'rgba(13,37,64,0.40)';
  const starOff   = isDark ? 'rgb(209,213,219)' : 'rgba(13,37,64,0.20)';
  const cancelClr = isDark ? 'rgba(148,163,184,1)' : 'rgba(13,37,64,0.60)';
  const cancelBdr = isDark ? 'rgba(255,255,255,0.12)' : 'rgba(13,37,64,0.15)';
  /* solid select bg so option text is ALWAYS readable */
  const selBg     = isDark ? '#1C3656' : '#ffffff';
  const selTxt    = isDark ? '#ffffff' : '#0d1b2a';

  const IC = `w-full rounded-lg px-3 py-2.5 text-sm focus:outline-none transition-colors`;
  const IS: React.CSSProperties = { background: inBg, border:`1px solid ${inBdr}`, color: inTxt, outline:'none' };
  const SS: React.CSSProperties = { background: selBg, border:`1px solid ${inBdr}`, color: selTxt, outline:'none', cursor:'pointer' };
  const OS: React.CSSProperties = { background: selBg, color: selTxt };
  const DS: React.CSSProperties = { ...IS, colorScheme: isDark ? 'dark' : 'light' };
  const LB = 'block text-xs font-semibold uppercase tracking-wider mb-1.5';
  const ER = 'text-xs mt-1 text-red-400';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-sm" onClick={onClose}>
      <div className="rounded-2xl w-full max-w-2xl max-h-[92vh] overflow-y-auto shadow-2xl"
        style={{ background: modalBg, border:`1px solid ${modalBdr}` }}
        onClick={e=>e.stopPropagation()}>

        {/* header */}
        <div className="sticky top-0 p-5 flex items-center justify-between z-10 rounded-t-2xl"
          style={{ background:'linear-gradient(90deg,#101528,#5194F6)' }}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center">
              {initial ? <Edit3 className="w-4 h-4 text-white"/> : <Plus className="w-4 h-4 text-white"/>}
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">{initial ? 'Edit IPO' : 'Add New IPO'}</h2>
              <p className="text-white/60 text-xs">* fields are required</p>
            </div>
          </div>
          <button onClick={onClose} className="text-white/70 hover:text-white hover:bg-white/20 rounded-full p-2 transition-all">
            <X className="w-5 h-5"/>
          </button>
        </div>

        <div className="p-5 space-y-5">

          {/* Company Info */}
          <section className="p-4 rounded-xl space-y-4" style={{background:blockBg,border:`1px solid ${blockBdr}`}}>
            <p className="text-xs font-bold uppercase tracking-wider" style={{color:bLabel}}>Company Information</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className={LB} style={{color:lblClr}}>Company Name *</label>
                <input className={IC} style={IS} placeholder="e.g. Tata Technologies Ltd"
                  value={form.companyName} onChange={e=>set('companyName',e.target.value)}/>
                {errors.companyName&&<p className={ER}>{errors.companyName}</p>}
              </div>
              <div>
                <label className={LB} style={{color:lblClr}}>Company Logo</label>
                <div className="flex items-center gap-3">
                  {/* Preview circle */}
                  <div className="w-14 h-14 rounded-full flex-shrink-0 flex items-center justify-center overflow-hidden"
                    style={{background:'rgba(81,148,246,0.12)',border:'2px solid rgba(81,148,246,0.25)'}}>
                    {logoPreview
                      ? <img src={logoPreview} alt="logo" className="w-full h-full object-cover"/>
                      : <span className="text-[#5194F6] font-bold text-lg">{form.logo||'?'}</span>
                    }
                  </div>
                  {/* Upload button */}
                  <div className="flex-1">
                    <label className="flex items-center gap-2 cursor-pointer w-full px-3 py-2.5 rounded-lg text-sm"
                      style={{background:inBg,border:`1px solid ${inBdr}`,color:inTxt}}>
                      <Upload className="w-4 h-4 flex-shrink-0" style={{color:'#5194F6'}}/>
                      <span className="truncate" style={{color:logoFile?inTxt:'rgba(148,163,184,0.8)'}}>
                        {logoFile ? logoFile.name : 'Upload image (JPG/PNG)'}
                      </span>
                      <input type="file" accept="image/jpeg,image/jpg,image/png,image/webp"
                        className="hidden" onChange={handleLogoFile}/>
                    </label>
                    <p className="text-[10px] mt-1" style={{color:hintClr}}>No image? Initials auto-generated from name</p>
                    {logoFile&&(
                      <button type="button" onClick={()=>{setLogoFile(null);setLogoPreview('');}}
                        className="text-[10px] mt-0.5 text-red-400 hover:text-red-500">✕ Remove</button>
                    )}
                  </div>
                </div>
              </div>
              <div>
                <label className={LB} style={{color:lblClr}}>Industry</label>
                <select className={IC} style={SS}
                  value={INDUSTRIES.filter(i=>i!=='Other').includes(form.industry) ? form.industry : form.industry ? 'Other' : ''}
                  onChange={e => {
                    if (e.target.value === 'Other') set('industry', '__other__');
                    else set('industry', e.target.value);
                  }}>
                  <option value="" style={OS}>-- Select Industry --</option>
                  {INDUSTRIES.map(i=><option key={i} value={i} style={OS}>{i}</option>)}
                </select>
                {/* Custom text input when Other is selected */}
                {!INDUSTRIES.filter(i=>i!=='Other').includes(form.industry) && (
                  <input className={IC} style={{...IS, marginTop:8}}
                    placeholder="Type your industry name..."
                    value={form.industry === '__other__' ? '' : form.industry}
                    onChange={e=>set('industry', e.target.value)}/>
                )}
              </div>
            </div>
          </section>

          {/* Classification */}
          <section className="p-4 rounded-xl space-y-3" style={{background:blockBg,border:`1px solid ${blockBdr}`}}>
            <p className="text-xs font-bold uppercase tracking-wider" style={{color:bLabel}}>Classification</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="sm:col-span-2">
                <label className={LB} style={{color:lblClr}}>Status *</label>
                <select className={IC} style={SS} value={form.status} onChange={e=>set('status',e.target.value as IPOStatus)}>
                  <option value="upcoming" style={OS}>Upcoming</option>
                  <option value="open"     style={OS}>Open Now</option>
                  <option value="closed"   style={OS}>Closed</option>
                  {/* "listed" removed */}
                </select>
              </div>
              <div>
                <label className={LB} style={{color:lblClr}}>Exchange</label>
                <select className={IC} style={SS} value={form.exchange} onChange={e=>set('exchange',e.target.value)}>
                  {['NSE / BSE','NSE','BSE','NSE SME','BSE SME'].map(ex=><option key={ex} value={ex} style={OS}>{ex}</option>)}
                </select>
              </div>
              <div>
                <label className={LB} style={{color:lblClr}}>Segment</label>
                <select className={IC} style={SS} value={form.category} onChange={e=>set('category',e.target.value)}>
                  {['Mainboard','SME'].map(c=><option key={c} value={c} style={OS}>{c}</option>)}
                </select>
              </div>
            </div>
          </section>

          {/* Pricing */}
          <section className="p-4 rounded-xl space-y-3" style={{background:blockBg,border:`1px solid ${blockBdr}`}}>
            <p className="text-xs font-bold uppercase tracking-wider" style={{color:bLabel}}>Pricing & Size</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className={LB} style={{color:lblClr}}>Price Band *</label>
                {/* PriceBandInput: auto ₹ prefix on both numbers */}
                <PriceBandInput className={IC} style={IS}
                  value={form.priceRange} onChange={v=>set('priceRange',v)}/>
                {errors.priceRange&&<p className={ER}>{errors.priceRange}</p>}
              </div>
              <div>
                <label className={LB} style={{color:lblClr}}>Lot Size (shares) *</label>
                <input type="number" className={IC} style={IS} placeholder="30" min={1}
                  value={form.lotSize||''} onChange={e=>set('lotSize',parseInt(e.target.value)||0)}/>
                {errors.lotSize&&<p className={ER}>{errors.lotSize}</p>}
              </div>
              <div>
                <label className={LB} style={{color:lblClr}}>
                  Min Investment *
                  {calcMin(form.priceRange,form.lotSize)&&(
                    <span className="ml-1 font-normal normal-case tracking-normal" style={{color:'#5194F6',fontSize:10}}>
                      <Calculator className="inline w-3 h-3 mr-0.5"/>auto
                    </span>
                  )}
                </label>
                <input className={IC}
                  style={{...IS, ...(calcMin(form.priceRange,form.lotSize)?{borderColor:'rgba(81,148,246,0.55)',color:'#5194F6',fontWeight:600}:{})}}
                  placeholder="Auto-calculated"
                  value={form.minInvestment} onChange={e=>set('minInvestment',e.target.value)}/>
                {/* NO formula hint */}
                {errors.minInvestment&&<p className={ER}>{errors.minInvestment}</p>}
              </div>
              <div className="sm:col-span-2">
                <label className={LB} style={{color:lblClr}}>Issue Size *</label>
                <div className="flex gap-2">
                  <input className={IC} style={{...IS, flex:1}} type="number" min={0} placeholder="e.g. 306"
                    value={(() => {
                      const match = form.issueSize.replace(/₹|,/g,'').match(/^[\d.]+/);
                      return match ? match[0] : (form.issueSize || '');
                    })()}
                    onChange={e => {
                      const unit = form.issueSize.match(/Lac/i)?.[0] || 'Cr';
                      set('issueSize', e.target.value ? `${e.target.value} ${unit}` : '');
                    }}/>
                  <select className={IC} style={{...SS, width:90, flex:'none'}}
                    value={form.issueSize.match(/Lac/i) ? 'Lac' : 'Cr'}
                    onChange={e => {
                      const num = form.issueSize.replace(/₹|,/g,'').match(/^[\d.]+/)?.[0] || '';
                      set('issueSize', num ? `${num} ${e.target.value}` : '');
                    }}>
                    <option value="Cr" style={OS}>Cr</option>
                    <option value="Lac" style={OS}>Lac</option>
                  </select>
                </div>
                {errors.issueSize&&<p className={ER}>{errors.issueSize}</p>}
              </div>
              <div>
                <label className={LB} style={{color:lblClr}}>Rating (1–5)</label>
                <div className="flex items-center gap-1 mt-2">
                  {[1,2,3,4,5].map(n=>(
                    <button key={n} type="button" onClick={()=>set('rating',n)} className="p-0.5 transition-transform hover:scale-110">
                      <Star className="w-6 h-6" style={{fill:n<=form.rating?'#F59E0B':'transparent',color:n<=form.rating?'#F59E0B':starOff}}/>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* Important Dates — date picker */}
          <section className="p-4 rounded-xl space-y-3" style={{background:blockBg,border:`1px solid ${blockBdr}`}}>
            <p className="text-xs font-bold uppercase tracking-wider" style={{color:bLabel}}>Important Dates</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {[
                {k:'openDate',      l:'Open Date *',       minKey:''},
                {k:'closeDate',     l:'Close Date *',      minKey:'openDate'},
                {k:'allotmentDate', l:'Allotment Date',    minKey:'closeDate'},
                {k:'refundDate',    l:'Refund Date',       minKey:'closeDate'},
                {k:'upiDate',       l:'UPI / Mandate Date',minKey:'openDate'},
                {k:'listingDate',   l:'Listing Date',      minKey:'closeDate'},
              ].map(({k,l,minKey})=>(
                <div key={k}>
                  <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{color:lblClr}}>{l}</label>
                  <input type="date" className={IC} style={DS}
                    value={toInputDate((form as any)[k]||'')}
                    min={minKey ? toInputDate((form as any)[minKey]||'') : undefined}
                    onChange={e=>set(k as any, e.target.value)}/>
                  {errors[k]&&<p className={ER}>{errors[k]}</p>}
                </div>
              ))}
            </div>
          </section>

          {/* Performance */}
          <section className="p-4 rounded-xl space-y-3" style={{background:blockBg,border:`1px solid ${blockBdr}`}}>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider" style={{color:bLabel}}>Performance Data</p>
              <p className="text-xs mt-0.5" style={{color:hintClr}}>Optional — can be updated later</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs mb-1.5" style={{color:lblClr}}>Subscription</label>
                <input className={IC} style={IS} placeholder="e.g. 69.43×"
                  value={form.subscriptionStatus||''} onChange={e=>set('subscriptionStatus',e.target.value)}/>
              </div>
              <div>
                <label className="block text-xs mb-1.5" style={{color:lblClr}}>GMP (₹)</label>
                <input type="number" className={IC} style={IS} placeholder="e.g. 650"
                  value={form.gmp??''} onChange={e=>set('gmp',e.target.value!==''?Number(e.target.value):null)}/>
              </div>
              <div>
                <label className="block text-xs mb-1.5" style={{color:lblClr}}>Listing Gain (%)</label>
                <input type="number" className={IC} style={IS} placeholder="e.g. 140 ya -12"
                  value={form.listingGain??''} onChange={e=>set('listingGain',e.target.value!==''?Number(e.target.value):null)}/>
              </div>
            </div>
          </section>

          {/* SWOT Analysis — admin enters bullet points */}
          <section className="p-4 rounded-xl space-y-3" style={{background:blockBg,border:`1px solid ${blockBdr}`}}>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider" style={{color:bLabel}}>SWOT Analysis</p>
              <p className="text-xs mt-0.5" style={{color:hintClr}}>Each point on a new line (press Enter for next point)</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {([
                {k:'strengths',     l:'Strengths',     col:'#22c55e', ph:'e.g. Strong brand presence\nConsistent revenue growth'},
                {k:'weaknesses',    l:'Weaknesses',    col:'#ef4444', ph:'e.g. High valuation\nClient concentration risk'},
                {k:'opportunities', l:'Opportunities', col:'#3b82f6', ph:'e.g. Market expansion\nPolicy tailwinds'},
                {k:'threats',       l:'Threats',       col:'#f59e0b', ph:'e.g. Competition\nMacro sensitivity'},
              ] as const).map(({k,l,col,ph})=>(
                <div key={k}>
                  <label className="block text-xs font-semibold mb-1.5" style={{color:col}}>{l}</label>
                  <textarea
                    className={IC}
                    style={{...IS, minHeight:90, resize:'vertical', lineHeight:1.5}}
                    placeholder={ph}
                    value={(form.swot?.[k]||[]).join('\n')}
                    onChange={e => {
                      // Store raw lines — do NOT trim/filter so spaces & Enter work freely
                      const lines = e.target.value.split('\n');
                      set('swot', { ...form.swot, [k]: lines });
                    }}
                    onBlur={e => {
                      // Clean up only on blur: trim and remove blank lines
                      const lines = e.target.value.split('\n').map(s=>s.trim()).filter(Boolean);
                      set('swot', { ...form.swot, [k]: lines });
                    }}
                  />
                </div>
              ))}
            </div>
          </section>

          {/* RHP */}
          <div>
            <label className={LB} style={{color:lblClr}}>RHP / DRHP Link (optional)</label>
            <input className={IC} style={IS} placeholder="https://sebi.gov.in/..."
              value={form.rhpLink||''} onChange={e=>set('rhpLink',e.target.value)}/>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 p-4 flex gap-3 rounded-b-2xl"
          style={{background:footBg, borderTop:`1px solid ${footBdr}`}}>
          <button onClick={onClose} className="flex-1 py-3 rounded-xl text-sm font-semibold transition-all hover:opacity-80"
            style={{border:`1px solid ${cancelBdr}`, color:cancelClr, background:'transparent'}}>
            Cancel
          </button>
          <button onClick={submit} disabled={saving}
            className="flex-1 py-3 rounded-xl text-white text-sm font-bold flex items-center justify-center gap-2 hover:shadow-lg transition-all disabled:opacity-60"
            style={{background:'linear-gradient(135deg,#5194F6,#3a7de0)'}}>
            {saving?<><Loader2 className="w-4 h-4 animate-spin"/>Saving...</>:<><Save className="w-4 h-4"/>{initial?'Save Changes':'Add IPO'}</>}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   SWOT ANALYSIS — reads from backend, visible to ALL users
   Hidden if admin hasn't entered any data yet
═══════════════════════════════════════════════════════════════════ */
function SwotAnalysis({ ipo, isLight = false }: { ipo: IPO; isLight?: boolean }) {
  const swotData = ipo.swot;
  const hasSwot = swotData && (
    (swotData.strengths?.length     || 0) +
    (swotData.weaknesses?.length    || 0) +
    (swotData.opportunities?.length || 0) +
    (swotData.threats?.length       || 0)
  ) > 0;

  if (!hasSwot) return null;

  const rows = [
    {k:'strengths'     as const, l:'Strengths',     col:'#16a34a', lightBg:'rgba(220,252,231,0.8)', darkBg:'rgba(34,197,94,0.08)',  lightBdr:'rgba(134,239,172,0.6)', darkBdr:'rgba(34,197,94,0.20)',  Icon:ShieldCheck},
    {k:'weaknesses'    as const, l:'Weaknesses',    col:'#dc2626', lightBg:'rgba(254,226,226,0.8)', darkBg:'rgba(239,68,68,0.08)',  lightBdr:'rgba(252,165,165,0.6)', darkBdr:'rgba(239,68,68,0.20)',  Icon:ShieldAlert},
    {k:'opportunities' as const, l:'Opportunities', col:'#2563eb', lightBg:'rgba(219,234,254,0.8)', darkBg:'rgba(59,130,246,0.08)', lightBdr:'rgba(147,197,253,0.6)', darkBdr:'rgba(59,130,246,0.20)', Icon:TrendingUp},
    {k:'threats'       as const, l:'Threats',       col:'#d97706', lightBg:'rgba(254,243,199,0.8)', darkBg:'rgba(245,158,11,0.08)', lightBdr:'rgba(253,211,77,0.6)',  darkBdr:'rgba(245,158,11,0.20)', Icon:AlertTriangle},
  ];
  return (
    <div>
      <h3 className={`text-base font-bold mb-3 flex items-center gap-2 ${isLight ? 'text-slate-800' : 'text-white'}`}>
        <BarChart3 className="w-4 h-4 text-[#5194F6]"/>SWOT Analysis
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {rows.map(({k,l,col,lightBg,darkBg,lightBdr,darkBdr,Icon})=>{
          const pts = swotData[k]||[];
          if(!pts.length) return null;
          return (
            <div key={k} className="rounded-xl p-4"
              style={{background: isLight ? lightBg : darkBg, border:`1px solid ${isLight ? lightBdr : darkBdr}`}}>
              <div className="flex items-center gap-2 mb-3">
                <Icon className="w-4 h-4" style={{color:col}}/>
                <span className="text-sm font-bold" style={{color:col}}>{l}</span>
              </div>
              <ul className="space-y-1.5">
                {pts.map((pt,i)=>(
                  <li key={i} className={`flex items-start gap-2 text-xs ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>
                    <span className="mt-0.5 w-1.5 h-1.5 rounded-full flex-shrink-0" style={{background:col}}/>
                    {pt}
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   DETAIL MODAL — fully theme-aware (light + dark)
═══════════════════════════════════════════════════════════════════ */
function DetailModal({ ipo, onClose, onEdit, onDelete, deleting, isAdmin }: {
  ipo:IPO; onClose:()=>void; onEdit:()=>void; onDelete:()=>void; deleting:boolean; isAdmin:boolean;
}) {
  const { theme } = useTheme();
  const isLight = theme === 'light';
  const effectiveStatus = getEffectiveStatus(ipo);

  // Lock body scroll while modal is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  // ── Token map ──────────────────────────────────────────────────────────────
  const modalBg      = isLight ? '#ffffff' : 'linear-gradient(135deg,#101528 0%,#0d1d38 100%)';
  const modalBorder  = isLight ? '1px solid rgba(226,232,240,0.9)' : '1px solid rgba(81,148,246,0.15)';
  const headerBg     = isLight ? '#f8fbff' : 'linear-gradient(135deg,#101528,#1C3656)';
  const headerBorder = isLight ? '1px solid rgba(226,232,240,0.8)' : '1px solid rgba(81,148,246,0.20)';
  const titleColor   = isLight ? '#0f172a' : 'white';
  const metaColor    = isLight ? '#64748b' : '#94a3b8';
  const categoryBorder = isLight ? '1px solid rgba(226,232,240,0.9)' : '1px solid rgba(255,255,255,0.15)';
  const tableBorder  = isLight ? '1px solid rgba(226,232,240,0.8)' : '1px solid rgba(255,255,255,0.08)';
  const rowEven      = isLight ? 'rgba(248,250,252,0.8)' : 'rgba(255,255,255,0.02)';
  const rowOdd       = isLight ? 'rgba(241,245,249,0.5)' : 'rgba(255,255,255,0.04)';
  const rowLabel     = isLight ? '#64748b' : '#94a3b8';
  const rowValue     = isLight ? '#0f172a' : 'white';
  const sectionTitle = isLight ? '#0f172a' : 'white';
  const perfLabel    = isLight ? '#64748b' : '#94a3b8';
  const minInvBg     = isLight ? 'rgba(239,246,255,0.8)' : 'rgba(81,148,246,0.06)';
  const minInvBdr    = isLight ? '1px solid rgba(219,234,254,0.9)' : '1px solid rgba(81,148,246,0.18)';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-sm" onClick={onClose}>
      <div className="rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        style={{background:modalBg, border:modalBorder, boxShadow: isLight ? '0 32px 80px rgba(0,0,0,0.12)' : '0 32px 80px rgba(0,0,0,0.5)'}}
        onClick={e=>e.stopPropagation()}>

        {/* Top accent line */}
        <div style={{height:3,background:'linear-gradient(90deg,#5194F6,rgba(81,148,246,0.4),transparent)'}}/>

        {/* Header */}
        <div className="sticky top-0 p-5 md:p-6 z-10 rounded-t-2xl"
          style={{background:headerBg, borderBottom:headerBorder}}>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full flex items-center justify-center overflow-hidden flex-shrink-0"
                style={{background: isLight ? 'rgba(239,246,255,0.9)' : 'rgba(81,148,246,0.15)', border: isLight ? '2px solid rgba(147,197,253,0.5)' : '2px solid rgba(81,148,246,0.30)'}}>
                {ipo.logoUrl
                  ? <img src={ipo.logoUrl} alt={ipo.logo} className="w-full h-full object-cover"/>
                  : <span className="text-[#5194F6] font-bold text-xl">{ipo.logo}</span>
                }
              </div>
              <div>
                <h2 className="text-xl font-bold leading-tight" style={{color:titleColor}}>{ipo.companyName}</h2>
                <p className="text-sm mt-0.5" style={{color:metaColor}}>{ipo.industry} · {ipo.exchange}</p>
                <div className="flex items-center gap-2 mt-2 flex-wrap">
                  <StatusBadge status={effectiveStatus}/>
                  {ipo.category&&(
                    <span className="text-xs px-2 py-0.5 rounded-full" style={{color:metaColor, border:categoryBorder}}>{ipo.category}</span>
                  )}
                  <Stars rating={ipo.rating}/>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1 flex-shrink-0 ml-2">
              {isAdmin&&(
                <>
                  <button onClick={onEdit}
                    className={`${isLight ? 'text-slate-400 hover:text-slate-700 hover:bg-slate-100' : 'text-slate-400 hover:text-white hover:bg-white/10'} rounded-lg p-2 transition-colors`}>
                    <Edit3 className="w-4 h-4"/>
                  </button>
                  <button onClick={onDelete} disabled={deleting}
                    className={`${isLight ? 'text-slate-400 hover:text-red-500 hover:bg-red-50' : 'text-slate-400 hover:text-red-400 hover:bg-red-500/10'} rounded-lg p-2 transition-colors`}>
                    {deleting?<Loader2 className="w-4 h-4 animate-spin"/>:<Trash2 className="w-4 h-4"/>}
                  </button>
                </>
              )}
              <button onClick={onClose}
                className={`${isLight ? 'text-slate-400 hover:text-slate-700 hover:bg-slate-100' : 'text-slate-400 hover:text-white hover:bg-white/10'} rounded-full p-2 transition-colors`}>
                <X className="w-5 h-5"/>
              </button>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="p-5 md:p-6 space-y-6">

          {/* Issue Details */}
          <div>
            <h3 className="text-base font-bold mb-3 flex items-center gap-2" style={{color:sectionTitle}}>
              <Zap className="w-4 h-4 text-[#5194F6]"/>Issue Details
            </h3>
            <div className="rounded-xl overflow-hidden" style={{border:tableBorder}}>
              {[['Price Band',ipo.priceRange],['Issue Size',ipo.issueSize],
                ['Lot Size',`${ipo.lotSize} shares`],['Min. Investment',ipo.minInvestment],
                ['Exchange',ipo.exchange]].map(([l,v],i)=>(
                <div key={i} className="flex items-center justify-between px-4 py-1.5 text-sm"
                  style={{background: i%2===0 ? rowEven : rowOdd}}>
                  <span style={{color:rowLabel}}>{l}</span>
                  <span className="font-semibold" style={{color:rowValue}}>{v}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Dates */}
          <div>
            <h3 className="text-base font-bold mb-3 flex items-center gap-2" style={{color:sectionTitle}}>
              <Calendar className="w-4 h-4 text-[#5194F6]"/>Important Dates
            </h3>
            <div className="rounded-xl overflow-hidden" style={{border:tableBorder}}>
              {[
                ['Open Date',    ipo.openDate,      'text-emerald-500'],
                ['Close Date',   ipo.closeDate,     'text-orange-500'],
                ...(ipo.allotmentDate?[['Allotment', ipo.allotmentDate,'text-blue-500']]:[]),
                ...(ipo.refundDate?   [['Refund Date', ipo.refundDate, isLight ? 'text-slate-500' : 'text-slate-400']]:[]),
                ...(ipo.upiDate?      [['UPI / Mandate', ipo.upiDate,  'text-violet-500']]:[]),
                ...(ipo.listingDate?  [['Listing',   ipo.listingDate,  'text-purple-500']]:[]),
              ].map(([l,v,cls],i)=>(
                <div key={i} className="flex items-center justify-between px-4 py-1.5 text-sm"
                  style={{background: i%2===0 ? rowEven : rowOdd}}>
                  <span style={{color:rowLabel}}>{l}</span>
                  <span className={`font-semibold ${cls}`}>{fmtDate(v as string)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Performance — only show if at least one field has real non-zero data */}
          {(ipo.subscriptionStatus?.trim()||(ipo.gmp!=null&&ipo.gmp!==0)||(ipo.listingGain!=null&&ipo.listingGain!==0))&&(
            <div>
              <h3 className="text-base font-bold mb-3 flex items-center gap-2" style={{color:sectionTitle}}>
                <BarChart3 className="w-4 h-4 text-[#5194F6]"/>Performance
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {ipo.subscriptionStatus?.trim()&&(
                  <div className={`rounded-xl p-4 text-center ${isLight ? 'bg-emerald-50 border border-emerald-100' : 'bg-green-500/10 border border-green-500/20'}`}>
                    <p className="text-xs mb-1" style={{color:perfLabel}}>Subscription</p>
                    <p className="text-2xl font-bold text-emerald-500">{ipo.subscriptionStatus}</p>
                    <p className="text-xs" style={{color:perfLabel}}>times</p>
                  </div>
                )}
                {ipo.gmp!=null&&ipo.gmp!==0&&(
                  <div className={`rounded-xl p-4 text-center ${isLight ? 'bg-blue-50 border border-blue-100' : 'bg-blue-500/10 border border-blue-500/20'}`}>
                    <p className="text-xs mb-1" style={{color:perfLabel}}>GMP</p>
                    <p className="text-2xl font-bold text-blue-500">{ipo.gmp>0?'+':''}₹{ipo.gmp}</p>
                    <p className="text-xs" style={{color:perfLabel}}>grey market</p>
                  </div>
                )}
                {ipo.listingGain!=null&&ipo.listingGain!==0&&(
                  <div className={`rounded-xl p-4 text-center border ${
                    ipo.listingGain>=0
                      ? isLight ? 'bg-emerald-50 border-emerald-100' : 'bg-green-500/10 border-green-500/20'
                      : isLight ? 'bg-red-50 border-red-100'         : 'bg-red-500/10 border-red-500/20'
                  }`}>
                    <p className="text-xs mb-1" style={{color:perfLabel}}>Listing Gain</p>
                    <p className={`text-2xl font-bold ${ipo.listingGain>=0?'text-emerald-500':'text-red-500'}`}>
                      {ipo.listingGain>=0?'+':''}{ipo.listingGain}%
                    </p>
                    <p className="text-xs" style={{color:perfLabel}}>on listing day</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* SWOT — subscribers only */}
          <RequireSubscription
            title="Premium Analysis"
            description="Subscribe to unlock full SWOT analysis for this IPO."
            ctaText="View Plans"
            ctaHref="/pricing"
            mode="overlay"
            minHeight="180px"
          >
            <SwotAnalysis ipo={ipo} isLight={isLight}/>
          </RequireSubscription>

          {/* CTA — ASBA removed, only RHP */}
          <button
            onClick={()=>ipo.rhpLink?window.open(ipo.rhpLink,'_blank'):null}
            disabled={!ipo.rhpLink}
            className="w-full py-3 px-4 text-white rounded-lg font-semibold text-sm hover:shadow-lg hover:shadow-blue-500/25 transition-all flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
            style={{background:'linear-gradient(135deg,#5194F6,#3a7de0)'}}>
            <FileText className="w-4 h-4"/>View RHP / DRHP
          </button>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   IPO CARD
═══════════════════════════════════════════════════════════════════ */
function IPOCard({ ipo, onViewDetail, onEdit, onDelete, isAdmin }: {
  ipo:IPO; onViewDetail:()=>void; onEdit:()=>void; onDelete:()=>void; isAdmin:boolean;
}) {
  const { theme } = useTheme();
  const isLight = theme === 'light';
  const effectiveStatus = getEffectiveStatus(ipo);
  const displayIpo = { ...ipo, status: effectiveStatus };
  return (
    <div
      className="rounded-xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden group hover:-translate-y-0.5 flex flex-col"
      style={{background:isLight?'rgba(255,255,255,0.70)':'rgba(255,255,255,0.04)',border:isLight?'1px solid rgba(13,37,64,0.12)':'1px solid rgba(255,255,255,0.08)'}}
      onMouseEnter={e=>(e.currentTarget.style.borderColor='rgba(81,148,246,0.40)')}
      onMouseLeave={e=>(e.currentTarget.style.borderColor=isLight?'rgba(13,37,64,0.12)':'rgba(255,255,255,0.08)')}>

      <div className="px-4 pt-4 pb-3" style={{borderBottom:isLight?'1px solid rgba(13,37,64,0.08)':'1px solid rgba(255,255,255,0.06)'}}>
        <div className="flex items-center justify-between mb-2.5">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-10 h-10 rounded-full flex items-center justify-center overflow-hidden flex-shrink-0"
              style={{background:'linear-gradient(135deg,rgba(81,148,246,0.20),rgba(58,125,224,0.10))',border:'1px solid rgba(81,148,246,0.25)'}}>
              {ipo.logoUrl
                ? <img src={ipo.logoUrl} alt={ipo.logo} className="w-full h-full object-cover"/>
                : <span className="text-[#5194F6] font-bold text-xs">{ipo.logo}</span>
              }
            </div>
            <div className="min-w-0">
              <h3 className={`font-bold text-[13px] leading-tight truncate ${isLight?'text-navy':'text-white'}`}>{ipo.companyName}</h3>
              <p className={`text-[11px] mt-0.5 truncate ${isLight?'text-navy/60':'text-slate-400'}`}>{ipo.industry||'—'}</p>
            </div>
          </div>
          {isAdmin&&(
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 ml-1">
              <button onClick={e=>{e.stopPropagation();onEdit();}}
                className="w-6 h-6 rounded-md flex items-center justify-center text-[#5194F6]" style={{background:'rgba(81,148,246,0.10)'}}>
                <Edit3 className="w-3 h-3"/>
              </button>
              <button onClick={e=>{e.stopPropagation();onDelete();}}
                className="w-6 h-6 rounded-md flex items-center justify-center text-red-400" style={{background:'rgba(239,68,68,0.10)'}}>
                <Trash2 className="w-3 h-3"/>
              </button>
            </div>
          )}
        </div>
        <div className="flex items-center justify-between">
          <StatusBadge status={displayIpo.status}/><Stars rating={ipo.rating}/>
        </div>
      </div>

      <div className="px-4 py-3 flex-1 space-y-2">
        <div className="grid grid-cols-2 gap-x-3 gap-y-1.5">
          {[
            ['Price Band',    ipo.priceRange,    isLight?'text-navy':'text-white',    true],
            ['Lot Size',      `${ipo.lotSize} shares`, isLight?'text-navy':'text-white', false],
            ['Min. Investment', ipo.minInvestment, 'text-[#5194F6]',                  true],
            ['Issue Size',    ipo.issueSize,      isLight?'text-navy':'text-white',    false],
          ].map(([lbl,val,cls,bold],i)=>(
            <div key={i}>
              <p className={`text-[9px] uppercase tracking-wider ${isLight?'text-navy/50':'text-slate-500'}`}>{lbl as string}</p>
              <p className={`text-xs leading-tight ${cls} ${bold?'font-bold':'font-semibold'}`}>{val as string}</p>
            </div>
          ))}
        </div>
        <div className={`flex items-center gap-1.5 text-[11px] pt-2 ${isLight?'text-navy/60':'text-slate-400'}`}
          style={{borderTop:isLight?'1px solid rgba(13,37,64,0.08)':'1px solid rgba(255,255,255,0.06)'}}>
          <Calendar className="w-3 h-3 flex-shrink-0"/>
          <span>{fmtDate(ipo.openDate)}</span>
          <span>→</span>
          <span>{fmtDate(ipo.closeDate)}</span>
          {ipo.listingDate&&<span className="ml-auto text-purple-400 font-medium text-[10px]">{fmtDate(ipo.listingDate)}</span>}
        </div>
        {(ipo.subscriptionStatus?.trim()||(ipo.gmp!=null&&ipo.gmp!==0)||(ipo.listingGain!=null&&ipo.listingGain!==0))&&(
          <div className="flex flex-wrap gap-1 pt-0.5">
            {ipo.subscriptionStatus?.trim()&&<span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-green-500/10 border border-green-500/20 rounded-full text-[10px] font-bold text-emerald-400"><Users className="w-2.5 h-2.5"/>{ipo.subscriptionStatus}</span>}
            {ipo.gmp!=null&&ipo.gmp!==0&&<span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-blue-500/10 border border-blue-500/20 rounded-full text-[10px] font-bold text-blue-400"><Target className="w-2.5 h-2.5"/>₹{ipo.gmp}</span>}
            {ipo.listingGain!=null&&ipo.listingGain!==0&&<span className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-bold border ${ipo.listingGain>=0?'bg-green-500/10 border-green-500/20 text-emerald-400':'bg-red-500/10 border-red-500/20 text-red-400'}`}>{ipo.listingGain>=0?<TrendingUp className="w-2.5 h-2.5"/>:<TrendingDown className="w-2.5 h-2.5"/>}{ipo.listingGain>=0?'+':''}{ipo.listingGain}%</span>}
            <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] ml-auto ${isLight?'text-navy/60':'text-slate-400'}`} style={{background:isLight?'rgba(13,37,64,0.06)':'rgba(255,255,255,0.05)'}}>{ipo.exchange}</span>
          </div>
        )}
      </div>

      <div className="px-4 pb-4 pt-2">
        <button onClick={onViewDetail}
          className="w-full py-2 px-3 text-white rounded-lg font-semibold text-xs hover:shadow-md transition-all flex items-center justify-center gap-1.5 group/btn"
          style={{background:'linear-gradient(135deg,#5194F6,#3a7de0)'}}>
          View Details<ArrowRight className="w-3.5 h-3.5 group-hover/btn:translate-x-0.5 transition-transform"/>
        </button>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   MAIN PAGE
═══════════════════════════════════════════════════════════════════ */
export default function IPOPage() {
  const navigate    = useNavigate();
  const { isAdmin } = useAuth();
  const { theme }   = useTheme();
  const isLight     = theme === 'light';

  const [allIpos,    setAllIpos]   = useState<IPO[]>([]);
  const [ipos,       setIpos]      = useState<IPO[]>([]);
  const [counts,     setCounts]    = useState<Counts>({ open:0, upcoming:0, closed:0, total:0 });
  const [activeTab,  setActiveTab] = useState<IPOStatus>('upcoming');
  const [search,     setSearch]    = useState('');
  const [sortBy,     setSortBy]    = useState<'default'|'gmp'|'rating'|'subscribed'>('default');
  const [catFilter,  setCatFilter] = useState<''|'Mainboard'|'SME'>('');
  const [loading,    setLoading]   = useState(true);
  const [error,      setError]     = useState<string|null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 12;

  const [selectedIPO, setSelectedIPO] = useState<IPO|null>(null);
  const [detailOpen,  setDetailOpen]  = useState(false);
  const [formOpen,    setFormOpen]    = useState(false);
  const [editIPO,     setEditIPO]     = useState<IPO|null>(null);
  const [saving,      setSaving]      = useState(false);
  const [deleting,    setDeleting]    = useState(false);

  const isSearching = search.trim().length > 0;
  const timer = useRef<any>(null);
  const totalPages = Math.ceil(ipos.length / PAGE_SIZE);

  const fetchIPOs = useCallback(async () => {
    const p = new URLSearchParams();
    if (isSearching) p.set('search', search.trim());
    if (sortBy !== 'default') p.set('sort', sortBy);
    if (catFilter)            p.set('category', catFilter);
    // fetch all statuses — we filter client-side by effective status
    setLoading(true); setError(null);
    try {
      const data = await callAPI(`${IPO_ENDPOINT}?${p}`);
      const fetched: IPO[] = data.ipos ?? [];
      setAllIpos(fetched);
      // Derive effective counts
      const effCounts = { open:0, upcoming:0, closed:0, total: fetched.length };
      fetched.forEach(i => { const s = getEffectiveStatus(i); effCounts[s]++; });
      setCounts(effCounts);
    } catch (e:any) { setError(e.message); }
    finally { setLoading(false); }
  }, [search, sortBy, catFilter, isSearching]);

  useEffect(() => {
    clearTimeout(timer.current);
    timer.current = setTimeout(fetchIPOs, isSearching ? 400 : 0);
    return () => clearTimeout(timer.current);
  }, [fetchIPOs]);

  // reset page on filter change
  useEffect(() => { setCurrentPage(1); }, [activeTab, search, catFilter, sortBy, ipos]);

  // Filter allIpos by effective status (auto-computed from dates)
  useEffect(() => {
    if (isSearching) {
      setIpos(allIpos);
    } else {
      const filtered = allIpos
        .filter(i => getEffectiveStatus(i) === activeTab)
        .sort((a, b) => {
          // Sort by openDate descending (latest first)
          const da = new Date(a.openDate).getTime() || 0;
          const db = new Date(b.openDate).getTime() || 0;
          return db - da;
        });
      setIpos(filtered);
    }
  }, [allIpos, activeTab, isSearching]);

  // Build multipart FormData — separates logo file from text fields
  const buildFormData = (data: Omit<IPO,'_id'>, logoFile?: File|null): FormData => {
    const fd = new FormData();
    const skip = new Set(['swot', 'logoUrl', 'logoPublicId', '_id', 'logo']);
    Object.entries(data).forEach(([k, v]) => {
      if (skip.has(k)) return;
      if (v === null || v === undefined) return;
      fd.append(k, String(v));
    });
    // logoText = 2-char initials (backend reads req.body.logoText)
    fd.append('logoText', data.logo || '');
    // swot as JSON string (backend JSON.parses it)
    if (data.swot) fd.append('swot', JSON.stringify(data.swot));
    // logo image file (multer field name 'logo')
    if (logoFile) fd.append('logo', logoFile);
    return fd;
  };

  const handleAdd = async (data: Omit<IPO,'_id'>, logoFile?: File|null) => {
    setSaving(true);
    try {
      const fd = buildFormData(data, logoFile);
      await callAPI(IPO_ENDPOINT, { method:'POST', formData:fd } as any);
      setFormOpen(false); setEditIPO(null); await fetchIPOs();
    } catch (e:any) { alert('❌ '+e.message); } finally { setSaving(false); }
  };

  const handleEdit = async (data: Omit<IPO,'_id'>, logoFile?: File|null) => {
    if (!editIPO) return; setSaving(true);
    try {
      const fd = buildFormData(data, logoFile);
      await callAPI(`${IPO_ENDPOINT}/${editIPO._id}`, { method:'PUT', formData:fd } as any);
      setFormOpen(false); setEditIPO(null); setDetailOpen(false); setSelectedIPO(null); await fetchIPOs();
    } catch (e:any) { alert('❌ '+e.message); } finally { setSaving(false); }
  };

  const handleDelete = async (ipo: IPO) => {
    if (!confirm(`Delete "${ipo.companyName}"?`)) return; setDeleting(true);
    try { await callAPI(`${IPO_ENDPOINT}/${ipo._id}`,{method:'DELETE'}); setDetailOpen(false); setSelectedIPO(null); await fetchIPOs(); }
    catch (e:any) { alert('❌ '+e.message); } finally { setDeleting(false); }
  };

  const visibleIpos = ipos.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  /* shared dropdown style for filter bar */
  const fSelBg  = isLight ? '#ffffff' : '#1C3656';
  const fSelTxt = isLight ? '#0d1b2a' : '#ffffff';
  const fBdr    = isLight ? 'rgba(13,37,64,0.15)' : 'rgba(255,255,255,0.10)';
  const fBg     = isLight ? 'rgba(13,37,64,0.05)' : 'rgba(255,255,255,0.05)';

  return (
    <>
      <Header/>
      <div className="min-h-screen"
        style={{background:isLight?'linear-gradient(160deg,#dce8f7 0%,#e8f2fd 45%,#dce8f7 100%)':'linear-gradient(160deg,#101528 0%,#101528 45%,#101528 100%)'}}>

        {/* HERO */}
        <section className="relative overflow-hidden pt-10 pb-6 md:pt-14 md:pb-8"
          style={{background:isLight?'linear-gradient(135deg,#edf5fe,#dce8f7,#e8f2fd)':'linear-gradient(135deg,#101528,#1C3656,#101528)',borderBottom:isLight?'1px solid rgba(13,37,64,0.10)':'1px solid rgba(255,255,255,0.06)'}}>
          <div className="absolute top-0 right-0 w-80 h-80 rounded-full blur-[100px] pointer-events-none" style={{background:'radial-gradient(circle,rgba(81,148,246,0.10) 0%,transparent 70%)'}}/>
          <div className="absolute bottom-0 left-0 w-64 h-64 rounded-full blur-[80px] pointer-events-none" style={{background:'radial-gradient(circle,rgba(56,189,248,0.06) 0%,transparent 70%)'}}/>

          <div className="container mx-auto px-4 md:px-6 relative z-10 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-2"
                  style={{background:'rgba(81,148,246,0.10)',border:'1px solid rgba(81,148,246,0.20)'}}>
                  <Zap className="w-3.5 h-3.5 text-[#5194F6]"/>
                  <span className="text-xs font-medium text-[#5194F6]">Live IPO Tracker</span>
                </div>
                <h1 className={`text-3xl md:text-4xl font-bold ${isLight?'text-navy':'text-white'}`}>
                  All{' '}
                  <span style={{background:'linear-gradient(135deg,#5194F6,#7ab8fa)',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent'}}>IPOs</span>
                </h1>
                <p className={`mt-1 text-sm ${isLight?'text-navy/60':'text-slate-400'}`}>
                  Total <span className={`font-bold ${isLight?'text-navy':'text-white'}`}>{counts.total}</span> IPOs — NSE / BSE 
                </p>
              </div>
            </div>

            {/* ── CONTROL BAR ── */}
            <div className="flex flex-col gap-3">
              <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center">

                {/* Status tabs — "listed" tab removed */}
                <div className="flex flex-wrap gap-2 flex-shrink-0">
                  {(['upcoming','open','closed'] as IPOStatus[]).map(s=>(
                    <button key={s}
                      onClick={()=>{setActiveTab(s);setSearch('');}}
                      className="px-3 py-2 rounded-xl text-sm font-semibold transition-all whitespace-nowrap"
                      style={activeTab===s&&!isSearching
                        ?{background:'linear-gradient(135deg,#5194F6,#3a7de0)',color:'#ffffff'}
                        :isLight
                          ?{background:'rgba(13,37,64,0.05)',border:'1px solid rgba(13,37,64,0.15)',color:'rgba(13,37,64,0.70)'}
                          :{background:'rgba(255,255,255,0.05)',border:'1px solid rgba(255,255,255,0.12)',color:'rgba(255,255,255,0.60)'}}>
                      {STATUS_CFG[s].label}
                      <span className="ml-1.5 text-[11px] opacity-80">({counts[s]})</span>
                    </button>
                  ))}
                </div>

                {/* Search */}
                <div className="relative flex-1 min-w-0">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none"/>
                  <input type="text" placeholder="Search company or industry…"
                    value={search} onChange={e=>setSearch(e.target.value)}
                    className={`w-full rounded-xl pl-10 pr-10 py-2.5 text-sm focus:outline-none transition-all ${isLight?'text-navy placeholder:text-navy/40':'text-white placeholder:text-slate-500'}`}
                    style={{background:isLight?'rgba(13,37,64,0.05)':'rgba(255,255,255,0.06)',border:`1px solid ${isSearching?'rgba(81,148,246,0.50)':isLight?'rgba(13,37,64,0.15)':'rgba(255,255,255,0.12)'}`}}
                  />
                  {search&&<button onClick={()=>setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"><X className="w-4 h-4"/></button>}
                </div>

                {/* Right actions */}
                <div className="flex items-center gap-2 flex-shrink-0 flex-wrap">

                  {/* Sort dropdown */}
                  <div className="relative">
                    <select value={sortBy} onChange={e=>setSortBy(e.target.value as any)}
                      className="appearance-none rounded-xl pl-3 pr-7 py-2.5 text-sm focus:outline-none cursor-pointer"
                      style={{background:fSelBg,border:`1px solid ${fBdr}`,color:fSelTxt}}>
                      <option value="default"    style={{background:fSelBg,color:fSelTxt}}>Sort: Default</option>
                      <option value="gmp"        style={{background:fSelBg,color:fSelTxt}}>Sort: GMP ↓</option>
                      <option value="rating"     style={{background:fSelBg,color:fSelTxt}}>Sort: Rating ↓</option>
                      <option value="subscribed" style={{background:fSelBg,color:fSelTxt}}>Sort: Subscribed ↓</option>
                    </select>
                    <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400 pointer-events-none"/>
                  </div>

                  {/* ── Segment / Category dropdown (replaces All|Mainboard|SME buttons) ── */}
                  <div className="relative flex items-center gap-1.5 rounded-xl px-3 py-2.5"
                    style={{background:fBg,border:`1px solid ${fBdr}`}}>
                    <Filter className={`w-3.5 h-3.5 flex-shrink-0 ${isLight?'text-navy/50':'text-slate-400'}`}/>
                    <select value={catFilter} onChange={e=>setCatFilter(e.target.value as any)}
                      className="text-sm focus:outline-none cursor-pointer bg-transparent pr-5 appearance-none"
                      style={{color:isLight?'rgba(13,37,64,0.75)':'rgba(255,255,255,0.80)',background:'transparent'}}>
                      <option value=""          style={{background:fSelBg,color:fSelTxt}}>All Segments</option>
                      <option value="Mainboard" style={{background:fSelBg,color:fSelTxt}}>Mainboard IPO</option>
                      <option value="SME"       style={{background:fSelBg,color:fSelTxt}}>SME IPO</option>
                    </select>
                    <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400 pointer-events-none"/>
                  </div>

                  {/* Refresh */}
                  <button onClick={fetchIPOs} disabled={loading} title="Refresh"
                    className={`p-2.5 rounded-xl transition-all flex-shrink-0 ${isLight?'text-navy/50 hover:text-navy':'text-slate-400 hover:text-white'}`}
                    style={{background:isLight?'rgba(13,37,64,0.05)':'rgba(255,255,255,0.04)',border:isLight?'1px solid rgba(13,37,64,0.10)':'1px solid rgba(255,255,255,0.08)'}}>
                    <RefreshCw className={`w-4 h-4 ${loading?'animate-spin':''}`}/>
                  </button>

                  {/* Add IPO (admin) */}
                  {isAdmin&&(
                    <button onClick={()=>{setEditIPO(null);setFormOpen(true);}}
                      className="flex items-center gap-2 px-4 py-2.5 text-white rounded-xl font-bold text-sm hover:shadow-lg transition-all whitespace-nowrap"
                      style={{background:'linear-gradient(135deg,#5194F6,#3a7de0)'}}>
                      <Plus className="w-4 h-4"/>
                      <span className="hidden sm:inline">Add IPO</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Search hint */}
              {isSearching&&!loading&&(
                <div className={`flex items-center gap-2 text-sm ${isLight?'text-navy/60':'text-slate-400'}`}>
                  <Search className="w-3.5 h-3.5 text-[#5194F6]"/>
                  <span>Found <strong className={isLight?'text-navy':'text-white'}>{ipos.length}</strong> IPO{ipos.length!==1?'s':''} for <span className="text-[#5194F6]">"{search}"</span></span>
                  <button onClick={()=>setSearch('')} className="ml-auto text-xs text-[#5194F6] hover:underline">Clear</button>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* CONTENT */}
        <div className="container mx-auto px-4 md:px-6 py-8">

          {loading&&(
            <div className="flex flex-col items-center justify-center py-24 gap-3">
              <Loader2 className="w-10 h-10 text-[#5194F6] animate-spin"/>
              <p className="text-slate-400 text-sm">Loading IPOs...</p>
            </div>
          )}

          {error&&!loading&&(
            <div className="text-center py-16">
              <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4"/>
              <h3 className={`text-xl font-semibold mb-2 ${isLight?'text-navy':'text-white'}`}>Something went wrong</h3>
              <p className={`text-sm font-mono px-4 py-2 rounded-lg inline-block ${isLight?'text-navy/70 bg-navy/5':'text-slate-400 bg-white/5'}`}>{error}</p>
              <br/>
              <button onClick={fetchIPOs} className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold"
                style={{background:'rgba(81,148,246,0.10)',border:'1px solid rgba(81,148,246,0.20)',color:'#5194F6'}}>
                <RefreshCw className="w-4 h-4"/>Try Again
              </button>
            </div>
          )}

          {/* Empty state — fallback to Open/Closed */}
          {!loading&&!error&&ipos.length===0&&(
            <div className="text-center py-20">
              <div className="w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-4"
                style={{background:'rgba(81,148,246,0.08)',border:'1px solid rgba(81,148,246,0.15)'}}>
                <Building2 className="w-10 h-10 text-[#5194F6]/40"/>
              </div>
              <h3 className={`text-xl font-semibold mb-2 ${isLight?'text-navy':'text-white'}`}>
                {isSearching?`No results for "${search}"`:`No ${STATUS_CFG[activeTab].label} IPOs right now`}
              </h3>
              <p className={`text-sm mb-6 ${isLight?'text-navy/60':'text-slate-400'}`}>
                {isSearching?'Try a different search term.':'Check Open Now or Closed tabs for available IPOs.'}
              </p>
              <div className="flex items-center justify-center gap-3 flex-wrap">
                {!isSearching&&activeTab!=='open'&&(
                  <button onClick={()=>{setActiveTab('open');setSearch('');}}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold"
                    style={{background:'rgba(34,197,94,0.10)',border:'1px solid rgba(34,197,94,0.25)',color:'#22c55e'}}>
                    <CheckCircle className="w-4 h-4"/>View Open Now
                  </button>
                )}
                {!isSearching&&activeTab!=='closed'&&(
                  <button onClick={()=>{setActiveTab('closed');setSearch('');}}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold"
                    style={{background:'rgba(249,115,22,0.10)',border:'1px solid rgba(249,115,22,0.25)',color:'#f97316'}}>
                    <AlertCircle className="w-4 h-4"/>View Closed
                  </button>
                )}
                {isSearching&&(
                  <button onClick={()=>setSearch('')}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold"
                    style={{background:'rgba(255,255,255,0.06)',border:'1px solid rgba(255,255,255,0.12)',color:'#fff'}}>
                    <X className="w-4 h-4"/>Clear Search
                  </button>
                )}
                {isAdmin&&(
                  <button onClick={()=>{setEditIPO(null);setFormOpen(true);}}
                    className="inline-flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-sm"
                    style={{background:'linear-gradient(135deg,#5194F6,#3a7de0)',color:'#ffffff'}}>
                    <Plus className="w-4 h-4"/>Add New IPO
                  </button>
                )}
              </div>
            </div>
          )}

          {/* IPO Grid */}
          {!loading&&!error&&ipos.length>0&&(
            <>
              <p className={`text-sm mb-4 ${isLight?'text-navy/60':'text-slate-400'}`}>
                Showing{' '}
                <span className={`font-semibold ${isLight?'text-navy':'text-white'}`}>
                  {(currentPage-1)*PAGE_SIZE+1}–{Math.min(currentPage*PAGE_SIZE,ipos.length)}
                </span>
                {' '}of{' '}
                <span className={`font-semibold ${isLight?'text-navy':'text-white'}`}>{ipos.length}</span>
                {' '}IPO{ipos.length!==1?'s':''}
                {!isSearching&&<span className={`ml-1 ${isLight?'text-navy/40':'text-slate-500'}`}>— {STATUS_CFG[activeTab].label}</span>}
              </p>

              <div className={`grid gap-4 ${
                visibleIpos.length === 1
                  ? 'grid-cols-1 max-w-xs mx-auto'
                  : visibleIpos.length === 2
                  ? 'grid-cols-1 sm:grid-cols-2 max-w-xl mx-auto'
                  : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
              }`}>
                {visibleIpos.map(ipo=>(
                  <IPOCard key={ipo._id} ipo={ipo} isAdmin={isAdmin}
                    onViewDetail={()=>{setSelectedIPO(ipo);setDetailOpen(true);}}
                    onEdit={()=>{setEditIPO(ipo);setFormOpen(true);}}
                    onDelete={()=>handleDelete(ipo)}
                  />
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-8">
                  {/* Prev */}
                  <button
                    onClick={()=>setCurrentPage(p=>Math.max(1,p-1))}
                    disabled={currentPage===1}
                    className="px-3 py-2 rounded-lg text-sm font-semibold transition-all disabled:opacity-30"
                    style={{background:isLight?'rgba(13,37,64,0.06)':'rgba(255,255,255,0.06)',border:isLight?'1px solid rgba(13,37,64,0.15)':'1px solid rgba(255,255,255,0.12)',color:isLight?'rgba(13,37,64,0.70)':'rgba(255,255,255,0.70)'}}>
                    ‹ Prev
                  </button>

                  {/* Page numbers */}
                  {Array.from({length:totalPages},(_,i)=>i+1).map(page=>{
                    // Show first, last, current ±1, and ellipsis
                    const show = page===1||page===totalPages||Math.abs(page-currentPage)<=1;
                    const isEllipsis = !show&&(page===2||page===totalPages-1);
                    if (!show && !isEllipsis) return null;
                    if (isEllipsis) return <span key={page} className="px-1 text-slate-500">…</span>;
                    return (
                      <button key={page}
                        onClick={()=>setCurrentPage(page)}
                        className="w-9 h-9 rounded-lg text-sm font-semibold transition-all"
                        style={page===currentPage
                          ?{background:'linear-gradient(135deg,#5194F6,#3a7de0)',color:'#ffffff',boxShadow:'0 2px 8px rgba(81,148,246,0.35)'}
                          :{background:isLight?'rgba(13,37,64,0.05)':'rgba(255,255,255,0.05)',border:isLight?'1px solid rgba(13,37,64,0.12)':'1px solid rgba(255,255,255,0.10)',color:isLight?'rgba(13,37,64,0.65)':'rgba(255,255,255,0.65)'}}>
                        {page}
                      </button>
                    );
                  })}

                  {/* Next */}
                  <button
                    onClick={()=>setCurrentPage(p=>Math.min(totalPages,p+1))}
                    disabled={currentPage===totalPages}
                    className="px-3 py-2 rounded-lg text-sm font-semibold transition-all disabled:opacity-30"
                    style={{background:isLight?'rgba(13,37,64,0.06)':'rgba(255,255,255,0.06)',border:isLight?'1px solid rgba(13,37,64,0.15)':'1px solid rgba(255,255,255,0.12)',color:isLight?'rgba(13,37,64,0.70)':'rgba(255,255,255,0.70)'}}>
                    Next ›
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <Footer/>

      {detailOpen&&selectedIPO&&!formOpen&&(
        <DetailModal ipo={selectedIPO}
          onClose={()=>{setDetailOpen(false);setSelectedIPO(null);}}
          onEdit={()=>{setEditIPO(selectedIPO);setFormOpen(true);}}
          onDelete={()=>handleDelete(selectedIPO)}
          deleting={deleting} isAdmin={isAdmin}
        />
      )}

      {formOpen&&isAdmin&&(
        <FormModal
          initial={editIPO??undefined}
          onSave={editIPO?handleEdit:handleAdd}
          onClose={()=>{setFormOpen(false);setEditIPO(null);}}
          saving={saving}
        />
      )}
    </>
  );
}