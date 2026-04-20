"use client";

import { useState, useEffect } from "react";
import { X, Star, Loader2 } from "lucide-react";
import { useTheme } from "@/controllers/Themecontext";
import { createTestimonial, updateTestimonial, Testimonial } from "@/services/Testimonialservice";

interface Props {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: (t: Testimonial) => void;
    existing?: Testimonial | null; // if set → edit mode
}

const TAGS = [
    "General", "Equity Research", "Portfolio Growth", "Fintech",
    "FX Hedging", "Institutional", "Financial Planning", "Trading",
];

function StarPicker({
    value, onChange, isLight,
}: { value: number; onChange: (v: number) => void; isLight: boolean }) {
    const [hovered, setHovered] = useState(0);
    return (
        <div style={{ display: "flex", gap: "6px" }}>
            {[1, 2, 3, 4, 5].map((i) => (
                <Star
                    key={i}
                    size={24}
                    onClick={() => onChange(i)}
                    onMouseEnter={() => setHovered(i)}
                    onMouseLeave={() => setHovered(0)}
                    style={{
                        cursor: "pointer",
                        fill: i <= (hovered || value) ? "#F59E0B" : "transparent",
                        color: i <= (hovered || value) ? "#F59E0B" : isLight ? "rgba(13,37,64,0.2)" : "rgba(255,255,255,0.2)",
                        transition: "all 0.15s",
                    }}
                />
            ))}
        </div>
    );
}

export default function TestimonialForm({ isOpen, onClose, onSuccess, existing }: Props) {
    const { theme } = useTheme();
    const isLight = theme === "light";
    const isEdit = !!existing;

    const [form, setForm] = useState({
        name: "", role: "", company: "",
        rating: 5, preview: "", fullText: "", tag: "General", source: "InvestBeans",
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Pre-fill when editing
    useEffect(() => {
        if (existing) {
            setForm({
                name: existing.name,
                role: existing.role || "",
                company: existing.company || "",
                rating: existing.rating,
                preview: existing.preview,
                fullText: existing.fullText,
                tag: existing.tag || "General",
                source: existing.source || "InvestBeans",
            });
        } else {
            setForm({ name: "", role: "", company: "", rating: 5, preview: "", fullText: "", tag: "General", source: "InvestBeans" });
        }
        setError(null);
    }, [existing, isOpen]);

    if (!isOpen) return null;

    const set = (key: string, value: any) => setForm((f) => ({ ...f, [key]: value }));

    const handleSubmit = async () => {
        if (!form.name.trim() || !form.preview.trim() || !form.fullText.trim()) {
            setError("Name, short preview, and full review are required.");
            return;
        }
        try {
            setLoading(true);
            setError(null);
            let result: Testimonial;
            if (isEdit && existing) {
                result = await updateTestimonial(existing._id, form);
            } else {
                result = await createTestimonial(form);
            }
            onSuccess(result);
            onClose();
        } catch (err: any) {
            setError(err.message || "Something went wrong. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    // ── Theme tokens ─────────────────────────────────────────────────────────
    const overlayBg = "rgba(0,0,0,0.5)";
    const modalBg = isLight ? "#ffffff" : "#101528";
    const modalBorder = isLight ? "1px solid rgba(226,232,240,0.9)" : "1px solid #1C3656";
    const labelColor = isLight ? "#64748b" : "rgba(203,213,225,1)";
    const inputBg = isLight ? "rgba(248,250,252,0.9)" : "rgba(28,54,86,0.40)";
    const inputBorder = isLight ? "1px solid rgba(226,232,240,0.9)" : "1px solid #1C3656";
    const inputColor = isLight ? "#1e293b" : "#E8EDF5";
    const titleColor = isLight ? "#0f172a" : "white";
    const errorBg = isLight ? "rgba(254,242,242,1)" : "rgba(220,38,38,0.12)";

    const inputStyle: React.CSSProperties = {
        width: "100%", boxSizing: "border-box", padding: "10px 14px",
        borderRadius: "10px", background: inputBg, border: inputBorder,
        color: inputColor, fontSize: "14px", outline: "none",
        fontFamily: "inherit", resize: "none" as any,
    };

    return (
        <>
        <style>{`
            .ib-form-overlay::-webkit-scrollbar { display: none; }
            .ib-form-overlay { scrollbar-width: none; -ms-overflow-style: none; }
            .ib-form-textarea::-webkit-scrollbar { display: none; }
            .ib-form-textarea { scrollbar-width: none; -ms-overflow-style: none; }
            .ib-form-body::-webkit-scrollbar { width: 4px; }
            .ib-form-body::-webkit-scrollbar-track { background: transparent; }
            .ib-form-body::-webkit-scrollbar-thumb { background: rgba(100,116,139,0.35); border-radius: 4px; }
            .ib-form-body { scrollbar-width: thin; scrollbar-color: rgba(100,116,139,0.35) transparent; }
        `}</style>
        <div
            className="ib-form-overlay"
            style={{
                position: "fixed", inset: 0, zIndex: 1000,
                background: overlayBg,
                overflowY: "auto",
                WebkitOverflowScrolling: "touch" as any,
                padding: "16px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
            }}
            onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
        >
            <div
                style={{
                    background: modalBg, border: modalBorder, borderRadius: "16px",
                    width: "100%", maxWidth: "480px",
                    maxHeight: "88vh",
                    display: "flex", flexDirection: "column",
                    boxShadow: "0 24px 64px rgba(0,0,0,0.35)",
                    boxSizing: "border-box" as const,
                    overflow: "hidden",
                }}
            >
                {/* ── Fixed Header ── */}
                <div style={{
                    display: "flex", justifyContent: "space-between", alignItems: "center",
                    padding: "16px 18px 12px",
                    borderBottom: isLight ? "1px solid rgba(226,232,240,0.7)" : "1px solid rgba(28,54,86,0.8)",
                    flexShrink: 0,
                }}>
                    <h2 style={{ margin: 0, fontSize: "17px", fontWeight: 800, color: titleColor }}>
                        {isEdit ? "Edit Your Review" : "Write a Review"}
                    </h2>
                    <button
                        onClick={onClose}
                        style={{ background: "none", border: "none", cursor: "pointer", color: labelColor, padding: "4px" }}
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* ── Scrollable Body ── */}
                <div
                    className="ib-form-body"
                    style={{ overflowY: "auto", flex: 1, padding: "14px 18px" }}
                >
                    {/* Error */}
                    {error && (
                        <div style={{
                            background: errorBg, border: "1px solid rgba(220,38,38,0.3)",
                            borderRadius: "8px", padding: "10px 14px",
                            color: isLight ? "#991b1b" : "#fca5a5",
                            fontSize: "12px", marginBottom: "14px",
                        }}>
                            {error}
                        </div>
                    )}

                    {/* Fields */}
                    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>

                        {/* Name */}
                        <div>
                            <label style={{ display: "block", fontSize: "11px", fontWeight: 600, color: labelColor, marginBottom: "5px", textTransform: "uppercase", letterSpacing: "0.07em" }}>
                                Your Name *
                            </label>
                            <input
                                style={inputStyle} value={form.name} maxLength={80}
                                onChange={(e) => set("name", e.target.value)}
                                placeholder="e.g. Priya Sharma"
                            />
                        </div>

                        {/* Role + Company */}
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: "10px" }}>
                            <div>
                                <label style={{ display: "block", fontSize: "11px", fontWeight: 600, color: labelColor, marginBottom: "5px", textTransform: "uppercase", letterSpacing: "0.07em" }}>
                                    Role
                                </label>
                                <input
                                    style={inputStyle} value={form.role} maxLength={80}
                                    onChange={(e) => set("role", e.target.value)}
                                    placeholder="e.g. Portfolio Manager"
                                />
                            </div>
                            <div>
                                <label style={{ display: "block", fontSize: "11px", fontWeight: 600, color: labelColor, marginBottom: "5px", textTransform: "uppercase", letterSpacing: "0.07em" }}>
                                    Company
                                </label>
                                <input
                                    style={inputStyle} value={form.company} maxLength={80}
                                    onChange={(e) => set("company", e.target.value)}
                                    placeholder="e.g. Axis Capital"
                                />
                            </div>
                        </div>

                        {/* Rating */}
                        <div>
                            <label style={{ display: "block", fontSize: "11px", fontWeight: 600, color: labelColor, marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.07em" }}>
                                Rating *
                            </label>
                            <StarPicker value={form.rating} onChange={(v) => set("rating", v)} isLight={isLight} />
                        </div>

                        {/* Tag */}
                        <div>
                            <label style={{ display: "block", fontSize: "11px", fontWeight: 600, color: labelColor, marginBottom: "5px", textTransform: "uppercase", letterSpacing: "0.07em" }}>
                                Category
                            </label>
                            <select
                                value={form.tag}
                                onChange={(e) => set("tag", e.target.value)}
                                style={{
                                    ...inputStyle,
                                    cursor: "pointer",
                                    backgroundColor: isLight ? "rgba(13,37,64,0.04)" : "#1C3656",
                                    color: isLight ? "#0d1b2a" : "#E8EDF5",
                                }}
                            >
                                {TAGS.map((t) => <option key={t} value={t}>{t}</option>)}
                            </select>
                        </div>

                        {/* Preview */}
                        <div>
                            <label style={{ display: "block", fontSize: "11px", fontWeight: 600, color: labelColor, marginBottom: "5px", textTransform: "uppercase", letterSpacing: "0.07em" }}>
                                Short Preview * <span style={{ fontWeight: 400, textTransform: "none" }}>(max 300 chars, shown on card)</span>
                            </label>
                            <textarea
                                className="ib-form-textarea"
                                style={{ ...inputStyle, minHeight: "68px" }} value={form.preview} maxLength={300}
                                onChange={(e) => set("preview", e.target.value)}
                                placeholder="A short summary of your experience..."
                            />
                            <div style={{ textAlign: "right", fontSize: "11px", color: labelColor, marginTop: "3px" }}>
                                {form.preview.length}/300
                            </div>
                        </div>

                        {/* Full Review */}
                        <div>
                            <label style={{ display: "block", fontSize: "11px", fontWeight: 600, color: labelColor, marginBottom: "5px", textTransform: "uppercase", letterSpacing: "0.07em" }}>
                                Full Review * <span style={{ fontWeight: 400, textTransform: "none" }}>(shown in popup)</span>
                            </label>
                            <textarea
                                className="ib-form-textarea"
                                style={{ ...inputStyle, minHeight: "100px" }} value={form.fullText} maxLength={2000}
                                onChange={(e) => set("fullText", e.target.value)}
                                placeholder="Share your detailed experience with InvestBeans..."
                            />
                            <div style={{ textAlign: "right", fontSize: "11px", color: labelColor, marginTop: "3px" }}>
                                {form.fullText.length}/2000
                            </div>
                        </div>
                    </div>
                </div>

                {/* ── Fixed Footer / Actions ── */}
                <div style={{
                    display: "flex", flexDirection: "column", gap: "8px",
                    padding: "12px 18px 16px",
                    borderTop: isLight ? "1px solid rgba(226,232,240,0.7)" : "1px solid rgba(28,54,86,0.8)",
                    flexShrink: 0,
                }}>
                    <button
                        onClick={handleSubmit}
                        disabled={loading}
                        style={{
                            width: "100%", padding: "11px", borderRadius: "10px", fontSize: "14px", fontWeight: 700,
                            border: "none", background: loading ? "rgba(81,148,246,0.5)" : "#2563eb",
                            color: "#fff", cursor: loading ? "not-allowed" : "pointer",
                            display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
                        }}
                    >
                        {loading ? <><Loader2 size={15} className="animate-spin" /> Submitting…</> : isEdit ? "Save Changes" : "Post Review"}
                    </button>
                    <button
                        onClick={onClose}
                        style={{
                            width: "100%", padding: "10px", borderRadius: "10px", fontSize: "13px", fontWeight: 600,
                            border: isLight ? "1px solid rgba(13,37,64,0.15)" : "1px solid #334155",
                            background: "transparent", color: labelColor, cursor: "pointer",
                        }}
                    >
                        Cancel
                    </button>
                </div>
            </div>
        </div>
        </>
    );
}