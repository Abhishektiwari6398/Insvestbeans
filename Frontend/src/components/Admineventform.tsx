// Frontend/src/components/admin/AdminEventForm.tsx
// Admin enrichment form — 2 sections ONLY:
//   1. Market Impact  (direction + time horizon)
//   2. Who Is Affected (single asset class + key sectors ≤70 words)
//
// Events come from the API feed — admin ONLY enriches them with these 2 fields.
// ✅ Dark + Light  ✅ Fully responsive

import React, { useState } from "react";
import { useAuth } from "@/controllers/AuthContext";
import { useTheme } from "@/controllers/Themecontext";

const API = (import.meta.env.VITE_API_URL || "http://localhost:8000/api/v1");

interface EventFormData {
  marketImpact: "" | "bullish" | "bearish" | "mixed";
  impactTerm:   "" | "short"   | "medium"  | "long" | "short-medium";
  asset:   string;   // single-select
  sectors: string;   // max 70 words
}

const EMPTY: EventFormData = {
  marketImpact:"", impactTerm:"", asset:"", sectors:"",
};

const ASSETS = ["Equity","Commodities","Forex","Bonds"] as const;

const ASSET_C: Record<string,{color:string;bg:string}> = {
  Equity:      {color:"#74A8C9", bg:"rgba(116,168,201,0.14)"},
  Commodities: {color:"#00d084", bg:"rgba(0,208,132,0.12)"},
  Forex:       {color:"#ffa825", bg:"rgba(255,168,37,0.12)"},
  Bonds:       {color:"#a78bfa", bg:"rgba(167,139,250,0.12)"},
};

function wc(s:string){ return s.trim().split(/\s+/).filter(Boolean).length; }

interface Props {
  initial?: Partial<EventFormData> & {_id?:string; whoAffected?:{assets?:string[];sectors?:string|string[]}};
  onSuccess?:()=>void; onCancel?:()=>void;
}

const DK = {
  card:"#0b1525", sec:"#060d1c", bor:"#1a3050", abor:"rgba(81,148,246,0.3)",
  acc:"#5194F6", adim:"rgba(81,148,246,0.12)",
  g:"#22c55e", gdim:"rgba(34,197,94,0.12)",
  r:"#ef4444", rdim:"rgba(239,68,68,0.12)",
  am:"#f59e0b", amdim:"rgba(245,158,11,0.12)",
  mu:"#64748b", sub:"#94a3b8", txt:"#e2e8f0", pri:"#ffffff",
  inp:"#040c18", div:"rgba(30,58,95,0.6)", scr:"#1a3050",
};
const LT = {
  card:"#ffffff", sec:"#f0f7fe", bor:"#d1dff5", abor:"rgba(37,99,235,0.3)",
  acc:"#2563eb", adim:"rgba(37,99,235,0.08)",
  g:"#16a34a", gdim:"rgba(22,163,74,0.08)",
  r:"#dc2626", rdim:"rgba(220,38,38,0.08)",
  am:"#d97706", amdim:"rgba(217,119,6,0.08)",
  mu:"#64748b", sub:"#475569", txt:"#0f172a", pri:"#0f172a",
  inp:"#ffffff", div:"#e2e8f0", scr:"#cbd5e1",
};

const AdminEventForm: React.FC<Props> = ({initial, onSuccess, onCancel}) => {
  const {isAdmin, showToast} = useAuth();
  const {theme} = useTheme();
  const isL = theme==="light";
  const C = isL ? LT : DK;

  const initAsset = initial?.asset || (Array.isArray(initial?.whoAffected?.assets) ? initial!.whoAffected!.assets[0]??"" : "");
  const initSec   = initial?.sectors || (Array.isArray(initial?.whoAffected?.sectors) ? (initial!.whoAffected!.sectors as string[]).join(", ") : (initial?.whoAffected?.sectors as string)||"");

  const [form, setForm] = useState<EventFormData>({...EMPTY, ...initial, asset:initAsset, sectors:initSec});
  const [saving, setSaving] = useState(false);
  const editId = (initial as any)?._id;

  if (!isAdmin) return null;

  const set = <K extends keyof EventFormData>(k:K, v:EventFormData[K]) => setForm(f=>({...f,[k]:v}));
  const swAsset = (a:string) => set("asset", form.asset===a ? "" : a);

  const sw = wc(form.sectors);
  const swOk = sw <= 70;

  const handleSubmit = async (e:React.FormEvent) => {
    e.preventDefault();
    if (!editId) return showToast("No event selected to enrich","error");
    if (!swOk) return showToast("Sectors ≤70 words","error");
    setSaving(true);
    try {
      const body = {
        marketImpact: form.marketImpact,
        impactTerm:   form.impactTerm,
        whoAffected: { assets: form.asset ? [form.asset] : [], sectors: form.sectors },
      };
      const token = localStorage.getItem("accessToken");
      const res = await fetch(`${API}/admin/events/${editId}`, {
        method: "PATCH",
        headers:{"Content-Type":"application/json", ...(token?{Authorization:`Bearer ${token}`}:{})},
        credentials:"include", body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message||"Save failed");
      showToast("Event enriched!","success");
      onSuccess?.();
    } catch(err:any){ showToast(err.message||"Error saving","error"); }
    finally { setSaving(false); }
  };

  // style helpers
  const inp = (ex:React.CSSProperties={}):React.CSSProperties => ({
    width:"100%", padding:"8px 10px", borderRadius:6, fontSize:12,
    border:`1px solid ${C.bor}`, background:C.inp, color:C.txt,
    outline:"none", fontFamily:"inherit", transition:"border-color 0.15s",
    boxSizing:"border-box", ...ex,
  });
  const sublbl:React.CSSProperties = {fontSize:9,fontWeight:700,color:C.sub,letterSpacing:"0.09em",display:"block",marginBottom:5,textTransform:"uppercase"};
  const pill = (on:boolean,ac:string,bg:string):React.CSSProperties => ({
    padding:"5px 13px", borderRadius:5, fontSize:11, fontWeight:700, cursor:"pointer",
    border:`1px solid ${on?ac:C.bor}`, background:on?bg:"transparent",
    color:on?ac:C.mu, transition:"all 0.12s", whiteSpace:"nowrap",
  });
  const secBox:React.CSSProperties = {background:C.sec,border:`1px solid ${C.bor}`,borderRadius:8,padding:"12px 14px",marginBottom:14};
  const secHead = (label:string) => (
    <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:12,paddingBottom:8,borderBottom:`1px solid ${C.div}`}}>
      <span style={{fontSize:9,fontWeight:700,letterSpacing:"0.18em",color:C.mu,textTransform:"uppercase"}}>{label}</span>
      <div style={{flex:1,height:1,background:C.div}}/>
      <span style={{fontSize:8,padding:"1px 7px",borderRadius:3,background:C.adim,color:C.acc,fontWeight:600,border:`1px solid ${C.abor}`,whiteSpace:"nowrap"}}>Shown on card</span>
    </div>
  );

  const MI = [
    {val:"bullish",label:"▲ BULLISH",c:C.g,  bg:C.gdim},
    {val:"bearish",label:"▼ BEARISH",c:C.r,  bg:C.rdim},
    {val:"mixed",  label:"— MIXED",  c:C.am, bg:C.amdim},
  ] as const;
  const TERM = [
    {val:"short",       label:"SHORT"},
    {val:"medium",      label:"MEDIUM"},
    {val:"long",        label:"LONG"},
    {val:"short-medium",label:"SHORT–MED"},
  ] as const;

  return (
    <>
      <style>{`
        .aef-scr::-webkit-scrollbar{width:4px}
        .aef-scr::-webkit-scrollbar-track{background:transparent}
        .aef-scr::-webkit-scrollbar-thumb{background:${C.scr};border-radius:2px}
        .aef-i:focus{border-color:${C.acc}!important;outline:none!important}
        .aef-pb:hover{opacity:0.82}
        @media(max-width:500px){
          .aef-pills{gap:4px!important}
          .aef-pills button{padding:4px 9px!important;font-size:10px!important}
        }
      `}</style>

      <div style={{background:C.card,border:`1px solid ${C.bor}`,borderRadius:12,fontFamily:"'Inter',sans-serif",display:"flex",flexDirection:"column",maxHeight:"90vh",overflow:"hidden",boxShadow:isL?"0 8px 40px rgba(37,99,235,0.10)":"0 8px 40px rgba(0,0,0,0.6)",width:"100%"}}>

        {/* Header */}
        <div style={{padding:"13px 18px",borderBottom:`1px solid ${C.bor}`,display:"flex",alignItems:"center",justifyContent:"space-between",background:C.card,flexShrink:0}}>
          <div style={{display:"flex",alignItems:"center",gap:10,minWidth:0}}>
            <div style={{width:8,height:8,borderRadius:"50%",background:C.acc,boxShadow:`0 0 0 3px ${C.adim}`,flexShrink:0}}/>
            <div style={{minWidth:0}}>
              <span style={{fontSize:14,fontWeight:700,color:C.pri,lineHeight:1,display:"block"}}>Enrich Event</span>
              <span style={{fontSize:9,color:C.mu,display:"block",marginTop:3}}>
                Market Impact · Who Is Affected
              </span>
            </div>
          </div>
          {onCancel && (
            <button onClick={onCancel} style={{width:28,height:28,borderRadius:6,flexShrink:0,background:"transparent",border:`1px solid ${C.bor}`,color:C.mu,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,lineHeight:1}}>×</button>
          )}
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="aef-scr" style={{overflowY:"auto",flex:1,padding:"16px 18px"}}>

          {/* 01 — Market Impact */}
          {secHead("01 — Market Impact")}
          <div style={secBox}>
            <div style={{marginBottom:12}}>
              <span style={sublbl}>Direction — select one</span>
              <div className="aef-pills" style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                <button type="button" className="aef-pb" onClick={()=>set("marketImpact","")} style={pill(form.marketImpact==="",C.mu,isL?"rgba(100,116,139,0.08)":"rgba(100,116,139,0.12)")}>NONE</button>
                {MI.map(o=>(
                  <button type="button" key={o.val} className="aef-pb" onClick={()=>set("marketImpact",o.val)} style={pill(form.marketImpact===o.val,o.c,o.bg)}>{o.label}</button>
                ))}
              </div>
            </div>
            <div>
              <span style={sublbl}>Time Horizon — select one</span>
              <div className="aef-pills" style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                <button type="button" className="aef-pb" onClick={()=>set("impactTerm","")} style={pill(form.impactTerm==="",C.mu,isL?"rgba(100,116,139,0.08)":"rgba(100,116,139,0.12)")}>NONE</button>
                {TERM.map(o=>(
                  <button type="button" key={o.val} className="aef-pb" onClick={()=>set("impactTerm",o.val)} style={pill(form.impactTerm===o.val,C.acc,C.adim)}>{o.label}</button>
                ))}
              </div>
            </div>
          </div>

          {/* 02 — Who Is Affected */}
          {secHead("02 — Who Is Affected")}
          <div style={secBox}>
            <div style={{marginBottom:12}}>
              <span style={sublbl}>Asset Class — select one</span>
              <div className="aef-pills" style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                {ASSETS.map(a=>{
                  const ac=ASSET_C[a];
                  return <button type="button" key={a} className="aef-pb" onClick={()=>swAsset(a)} style={pill(form.asset===a,ac.color,ac.bg)}>{a.toUpperCase()}</button>;
                })}
              </div>
              {form.asset && (
                <div style={{marginTop:6,display:"flex",alignItems:"center",gap:6}}>
                  <span style={{fontSize:9,padding:"2px 8px",borderRadius:3,fontWeight:700,background:ASSET_C[form.asset]?.bg,color:ASSET_C[form.asset]?.color,border:`1px solid ${ASSET_C[form.asset]?.color}40`}}>
                    ✓ {form.asset.toUpperCase()} selected
                  </span>
                  <button type="button" onClick={()=>set("asset","")} style={{fontSize:9,color:C.mu,background:"none",border:"none",cursor:"pointer"}}>clear ×</button>
                </div>
              )}
            </div>
            <div>
              <span style={{...sublbl,display:"flex",alignItems:"center",gap:6,flexWrap:"wrap"}}>
                Key Sectors
                <span style={{fontWeight:400,textTransform:"none",fontSize:9,color:!swOk?C.r:C.mu}}>
                  {sw}/70 words · broad, not stock-specific
                </span>
              </span>
              <textarea className="aef-i" style={{...inp({borderColor:!swOk?C.r:C.bor}),resize:"none",minHeight:48,maxHeight:88,lineHeight:"1.55",overflowY:"auto"}}
                value={form.sectors} onChange={e=>set("sectors",e.target.value)}
                placeholder="e.g. Banking & NBFCs · Housing Finance · Infrastructure · Auto"
                maxLength={600}/>
              {!swOk && <p style={{fontSize:9,color:C.r,margin:"3px 0 0"}}>Exceeds 70 words — please shorten</p>}
            </div>
          </div>

          {/* Actions */}
          <div style={{display:"flex",gap:8,justifyContent:"flex-end",paddingTop:4,paddingBottom:2,flexWrap:"wrap"}}>
            {onCancel && (
              <button type="button" onClick={onCancel} style={{padding:"9px 20px",borderRadius:7,fontSize:12,fontWeight:600,border:`1px solid ${C.bor}`,background:"transparent",color:C.mu,cursor:"pointer"}}>
                Cancel
              </button>
            )}
            <button type="submit" disabled={!(!saving&&swOk)} style={{padding:"9px 24px",borderRadius:7,fontSize:12,fontWeight:700,border:"none",background:(!saving&&swOk)?C.acc:C.bor,color:"#fff",cursor:(!saving&&swOk)?"pointer":"not-allowed",opacity:saving?0.65:1,transition:"all 0.15s",letterSpacing:"0.02em"}}>
              {saving?"Saving…":"Save Changes"}
            </button>
          </div>

        </form>
      </div>
    </>
  );
};

export default AdminEventForm;