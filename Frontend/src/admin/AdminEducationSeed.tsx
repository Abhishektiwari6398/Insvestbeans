/**
 * AdminEducationSeed.tsx
 *
 * One-time seed page. Visit as admin at /admin/education-seed
 * to push static CATEGORY_DATA_real.tsx into MongoDB.
 *
 * After seeding, all adds/edits/deletes from the UI will persist to the DB.
 * You can re-run it to reset everything back to the static baseline.
 *
 * Place in: src/pages/admin/AdminEducationSeed.tsx
 * Add to your router (admin-protected):
 *   <Route path="/admin/education-seed" element={<AdminEducationSeed />} />
 */

import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "@/controllers/Themecontext";
import { useAuth } from "@/controllers/AuthContext";
import CATEGORY_DATA from "@/data/CATEGORY_DATA_real";
import { seedEducation } from "@/services/api/educationApi";

const AdminEducationSeed: React.FC = () => {
  const { theme }      = useTheme();
  const { isAdmin }    = useAuth();
  const navigate       = useNavigate();
  const isLight        = theme === "light";

  const [status, setStatus]   = useState<"idle" | "running" | "done" | "error">("idle");
  const [result, setResult]   = useState<any>(null);
  const [confirm, setConfirm] = useState(false);

  const pageBg    = isLight ? "#f8fafc" : "#0d1117";
  const cardBg    = isLight ? "#ffffff" : "#161b22";
  const border    = isLight ? "rgba(226,232,240,0.8)" : "rgba(255,255,255,0.08)";
  const textMain  = isLight ? "#0f172a" : "#f1f5f9";
  const textMuted = isLight ? "#64748b" : "#94a3b8";

  if (!isAdmin) {
    return (
      <div style={{ background: pageBg, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <p style={{ color: textMuted }}>Admin access required.</p>
      </div>
    );
  }

  const handleSeed = async () => {
    if (!confirm) return;
    setStatus("running");
    try {
      const res = await seedEducation(CATEGORY_DATA as any);
      setResult(res);
      setStatus("done");
    } catch (e: any) {
      setResult({ error: e.message });
      setStatus("error");
    }
  };

  const categories = Object.entries(CATEGORY_DATA as any).map(([id, cat]: any) => ({
    id,
    title: cat.title,
    count: cat.modules?.length ?? 0,
  }));

  return (
    <div style={{ background: pageBg, minHeight: "100vh", padding: "40px 20px" }}>
      <div style={{ maxWidth: 640, margin: "0 auto" }}>

        {/* Header */}
        <button onClick={() => navigate(-1)}
          style={{ color: textMuted, fontSize: 13, marginBottom: 24, display: "flex", alignItems: "center", gap: 6, background: "none", border: "none", cursor: "pointer" }}>
          ← Back
        </button>

        <div style={{ background: cardBg, border: `1px solid ${border}`, borderRadius: 20, padding: 32, marginBottom: 20 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
            <span style={{ fontSize: 28 }}>🛡️</span>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: textMain, margin: 0 }}>
              Education DB Seed Tool
            </h1>
          </div>
          <p style={{ color: textMuted, fontSize: 14, lineHeight: 1.6, margin: "0 0 24px" }}>
            This tool imports all categories and modules from{" "}
            <code style={{ background: isLight ? "#f1f5f9" : "#0d1117", padding: "2px 6px", borderRadius: 6, fontSize: 12 }}>
              CATEGORY_DATA_real.tsx
            </code>{" "}
            into MongoDB. After seeding, admin edits from the UI will persist permanently.
            You can re-run this to reset back to the static baseline.
          </p>

          {/* Category list */}
          <div style={{ borderRadius: 12, border: `1px solid ${border}`, overflow: "hidden", marginBottom: 24 }}>
            <div style={{ background: isLight ? "#f8fafc" : "#0a1628", padding: "10px 16px", borderBottom: `1px solid ${border}` }}>
              <span style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: textMuted }}>
                {categories.length} Categories to Seed
              </span>
            </div>
            {categories.map(({ id, title, count }) => (
              <div key={id} style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "10px 16px", borderBottom: `1px solid ${border}`,
              }}>
                <div>
                  <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: textMain }}>{title}</p>
                  <p style={{ margin: 0, fontSize: 11, color: textMuted }}>{id}</p>
                </div>
                <span style={{ fontSize: 12, fontWeight: 700, color: "#5194F6", background: "rgba(81,148,246,0.1)", padding: "3px 10px", borderRadius: 20 }}>
                  {count} modules
                </span>
              </div>
            ))}
          </div>

          {/* Confirm checkbox */}
          {status === "idle" && (
            <label style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20, cursor: "pointer" }}>
              <input type="checkbox" checked={confirm} onChange={e => setConfirm(e.target.checked)}
                style={{ width: 16, height: 16, accentColor: "#a855f7" }} />
              <span style={{ fontSize: 13, color: textMuted }}>
                I understand this will overwrite existing DB data for these categories.
              </span>
            </label>
          )}

          {/* CTA */}
          {status === "idle" && (
            <button
              onClick={handleSeed}
              disabled={!confirm}
              style={{
                width: "100%", padding: "13px", borderRadius: 14, border: "none",
                background: confirm ? "linear-gradient(135deg,#a855f7,#7c3aed)" : (isLight ? "#e2e8f0" : "rgba(255,255,255,0.06)"),
                color: confirm ? "#fff" : textMuted,
                fontWeight: 700, fontSize: 14, cursor: confirm ? "pointer" : "not-allowed",
                transition: "opacity 0.2s",
              }}>
              🚀 Seed Education Database
            </button>
          )}

          {status === "running" && (
            <div style={{ textAlign: "center", padding: 20 }}>
              <div style={{ fontSize: 28, marginBottom: 8 }}>⏳</div>
              <p style={{ color: textMuted, fontSize: 14 }}>Seeding database…</p>
            </div>
          )}

          {status === "done" && (
            <div style={{ background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.25)", borderRadius: 14, padding: 20 }}>
              <p style={{ margin: "0 0 8px", fontWeight: 700, color: "#34D399", fontSize: 15 }}>✅ Seed complete!</p>
              <pre style={{ margin: 0, fontSize: 12, color: textMuted, whiteSpace: "pre-wrap" }}>
                {JSON.stringify(result, null, 2)}
              </pre>
              <button onClick={() => navigate("/education")}
                style={{ marginTop: 16, padding: "10px 24px", borderRadius: 12, background: "linear-gradient(135deg,#34D399,#059669)", color: "#fff", fontWeight: 700, fontSize: 13, border: "none", cursor: "pointer" }}>
                Go to Education →
              </button>
            </div>
          )}

          {status === "error" && (
            <div style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)", borderRadius: 14, padding: 20 }}>
              <p style={{ margin: "0 0 8px", fontWeight: 700, color: "#f87171", fontSize: 15 }}>❌ Seed failed</p>
              <pre style={{ margin: 0, fontSize: 12, color: textMuted, whiteSpace: "pre-wrap" }}>
                {JSON.stringify(result, null, 2)}
              </pre>
              <button onClick={() => setStatus("idle")}
                style={{ marginTop: 16, padding: "10px 24px", borderRadius: 12, background: "rgba(239,68,68,0.15)", color: "#f87171", fontWeight: 700, fontSize: 13, border: "1px solid rgba(239,68,68,0.3)", cursor: "pointer" }}>
                Try Again
              </button>
            </div>
          )}
        </div>

        <p style={{ fontSize: 12, color: textMuted, textAlign: "center" }}>
          This page is only accessible to admin users.
        </p>
      </div>
    </div>
  );
};

export default AdminEducationSeed;