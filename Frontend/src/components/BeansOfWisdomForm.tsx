import React, { useEffect, useState } from 'react';
import { BeanOfWisdom, FieldLimits, getFieldLimits, updateBean } from '@/services/beanOfWisdomService';
import { Loader2, X, AlertCircle, Save } from 'lucide-react';
import { useTheme } from '@/controllers/Themecontext';

interface BeansOfWisdomFormProps {
  isOpen: boolean;
  onClose: () => void;
  bean: BeanOfWisdom | null;
  onSuccess?: () => void;
}

export default function BeansOfWisdomForm({ isOpen, onClose, bean, onSuccess }: BeansOfWisdomFormProps) {
  const { theme } = useTheme();
  const isLight = theme === "light";
  const [fieldLimits, setFieldLimits] = useState<FieldLimits | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  
  const [formData, setFormData] = useState<Partial<BeanOfWisdom>>({
    title: "",
    subtitle: "",
    sectionTitle: "",
    description: "",
    keyPrinciple: "",
    quote: "",
    insightTag: "",
    insightText: "",
    weekLabel: "",
    tags: [],
  });

  useEffect(() => {
    const fetchLimits = async () => {
      try {
        const limits = await getFieldLimits();
        setFieldLimits(limits);
      } catch (err) {
        console.error('Error fetching field limits:', err);
        setError('Failed to load form validation rules');
      }
    };

    if (isOpen) {
      fetchLimits();
      setError(null);
      setFieldErrors({});
      
      if (bean) {
        setFormData({
          title: bean.title || "",
          subtitle: bean.subtitle || "",
          sectionTitle: bean.sectionTitle || "",
          description: bean.description || "",
          keyPrinciple: bean.keyPrinciple || "",
          quote: bean.quote || "",
          insightTag: bean.insightTag || "",
          insightText: bean.insightText || "",
          weekLabel: (bean as any).weekLabel || "",
          tags: bean.tags || [],
        });
      }
    }
  }, [isOpen, bean]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    
    if (fieldErrors[name]) {
      setFieldErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleTagsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const tags = e.target.value
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean);
    setFormData((prev) => ({ ...prev, tags }));
    
    if (fieldErrors.tags) {
      setFieldErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors.tags;
        return newErrors;
      });
    }
  };

  const getCharCount = (fieldName: keyof typeof formData): number => {
    const value = formData[fieldName];
    if (typeof value === 'string') {
      return value.length;
    }
    if (Array.isArray(value)) {
      return value.join(", ").length;
    }
    return 0;
  };

  const validateForm = (): boolean => {
    if (!fieldLimits) {
      setError('Form validation rules not loaded');
      return false;
    }

    const newFieldErrors: Record<string, string> = {};

    const fields = [
      { name: 'title', label: 'Title', limit: fieldLimits.title },
      { name: 'subtitle', label: 'Subtitle', limit: fieldLimits.subtitle },
      { name: 'sectionTitle', label: 'Section title', limit: fieldLimits.sectionTitle },
      { name: 'description', label: 'Description', limit: fieldLimits.description },
      { name: 'keyPrinciple', label: 'Key principle', limit: fieldLimits.keyPrinciple },
      { name: 'quote', label: 'Quote', limit: fieldLimits.quote },
      { name: 'insightTag', label: 'Insight tag', limit: fieldLimits.insightTag },
      { name: 'insightText', label: 'Insight text', limit: fieldLimits.insightText },
    ];

    for (const field of fields) {
      const value = (formData[field.name as keyof typeof formData] as string) || '';

      if (!value.trim()) {
        newFieldErrors[field.name] = `${field.label} is required`;
      } else if (value.length > field.limit) {
        newFieldErrors[field.name] = `Cannot exceed ${field.limit} characters`;
      }
    }

    if (!formData.tags || formData.tags.length === 0) {
      newFieldErrors.tags = 'At least one tag is required';
    } else {
      for (const tag of formData.tags) {
        if (tag.length > fieldLimits.tags) {
          newFieldErrors.tags = `Each tag cannot exceed ${fieldLimits.tags} characters`;
          break;
        }
      }
    }

    setFieldErrors(newFieldErrors);

    if (Object.keys(newFieldErrors).length > 0) {
      setError('Please fix the errors below');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!validateForm()) return;

    if (!bean?._id) {
      setError('Bean ID not found');
      return;
    }

    try {
      setLoading(true);
      await updateBean(bean._id, formData);
      onSuccess?.();
      onClose();
    } catch (err: any) {
      console.error('Error submitting bean:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Failed to submit';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/55 backdrop-blur-sm">
      {/* Scoped CSS — adapts to theme */}
      <style>{`
        .bow-form-modal input::placeholder,
        .bow-form-modal textarea::placeholder {
          color: ${isLight ? "rgba(148,163,184,0.7)" : "rgba(148,163,184,0.5)"} !important;
          opacity: 1;
        }
        .bow-form-modal input:-webkit-autofill,
        .bow-form-modal textarea:-webkit-autofill {
          -webkit-box-shadow: 0 0 0px 1000px ${isLight ? "#f8fafc" : "#0f1628"} inset !important;
          -webkit-text-fill-color: ${isLight ? "#1e293b" : "#e8edf5"} !important;
        }
      `}</style>
      {/* Modal */}
      <div className="bow-form-modal relative rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden"
        style={{ background: isLight ? "#ffffff" : "rgba(13,19,36,0.98)", boxShadow: isLight ? "0 32px 80px rgba(0,0,0,0.12), 0 0 0 1px rgba(226,232,240,0.9)" : "0 32px 80px rgba(0,0,0,0.60), 0 0 0 1px rgba(81,148,246,0.20)", color: isLight ? "#1e293b" : "#e8edf5" }}>
        {/* Blue top accent bar */}
        <div className="h-[4px] w-full flex-shrink-0" style={{ background: "linear-gradient(90deg,#3a7de8,#5194F6,#7ab3f8)" }} />

        {/* Header */}
        <div className="flex items-center justify-between px-7 md:px-9 py-5"
          style={{ background: isLight ? "#ffffff" : "rgba(13,19,36,0.98)", borderBottom: isLight ? "1px solid rgba(226,232,240,0.8)" : "1px solid rgba(81,148,246,0.15)" }}>
          <div>
            <h2 className="text-xl md:text-2xl font-bold" style={{ color: isLight ? "#0f172a" : "#ffffff" }}>
              Edit Bean of Wisdom
            </h2>
            <p className="text-sm mt-0.5" style={{ color: isLight ? "#64748b" : "rgba(148,163,184,0.8)" }}>Update this week's investment insight</p>
          </div>
          <button onClick={onClose}
            className="w-9 h-9 flex items-center justify-center rounded-lg transition-all"
            style={{ background: isLight ? "rgba(241,245,249,0.9)" : "rgba(255,255,255,0.07)", color: isLight ? "#64748b" : "rgba(148,163,184,0.8)" }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "rgba(81,148,246,0.10)"; (e.currentTarget as HTMLElement).style.color = "#5194F6"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = isLight ? "rgba(241,245,249,0.9)" : "rgba(255,255,255,0.07)"; (e.currentTarget as HTMLElement).style.color = isLight ? "#64748b" : "rgba(148,163,184,0.8)"; }}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mx-7 md:mx-9 mt-5 p-3.5 rounded-xl flex items-start gap-3" style={{ background: "rgba(254,242,242,0.9)", border: "1px solid rgba(254,202,202,0.8)" }}>
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-red-500" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-red-600">Error</p>
              <p className="text-sm mt-0.5 text-red-500">{error}</p>
            </div>
            <button onClick={() => setError(null)} className="text-red-400 hover:text-red-600">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Form Content - Scrollable */}
        <div className="flex-1 overflow-y-auto px-7 md:px-9 py-6" style={{ background: isLight ? "#ffffff" : "transparent" }}>
          {!fieldLimits ? (
            <div className="flex items-center justify-center py-20">
              <div className="text-center">
                <Loader2 className="w-10 h-10 animate-spin mx-auto mb-4" style={{ color: "#5194F6" }} />
                <p className="text-sm" style={{ color: "rgba(148,163,184,0.7)" }}>Loading form...</p>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Title */}
              <FormField
                label="Title"
                name="title"
                value={formData.title || ''}
                onChange={handleInputChange}
                maxLength={fieldLimits.title}
                current={getCharCount('title')}
                max={fieldLimits.title}
                error={fieldErrors.title}
                placeholder="e.g., The Power of Compound Interest"
                required
                isLight={isLight}
              />

              {/* Subtitle */}
              <FormField
                label="Subtitle"
                name="subtitle"
                value={formData.subtitle || ''}
                onChange={handleInputChange}
                maxLength={fieldLimits.subtitle}
                current={getCharCount('subtitle')}
                max={fieldLimits.subtitle}
                error={fieldErrors.subtitle}
                placeholder="Brief description of the wisdom"
                textarea
                rows={2}
                required
                isLight={isLight}
              />

              {/* Two Column Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Section Title */}
                <FormField
                  label="Section Title"
                  name="sectionTitle"
                  value={formData.sectionTitle || ''}
                  onChange={handleInputChange}
                  maxLength={fieldLimits.sectionTitle}
                  current={getCharCount('sectionTitle')}
                  max={fieldLimits.sectionTitle}
                  error={fieldErrors.sectionTitle}
                  placeholder="e.g., Core Concept"
                  required
                  isLight={isLight}
                />

                {/* Key Principle */}
                <FormField
                  label="Key Principle"
                  name="keyPrinciple"
                  value={formData.keyPrinciple || ''}
                  onChange={handleInputChange}
                  maxLength={fieldLimits.keyPrinciple}
                  current={getCharCount('keyPrinciple')}
                  max={fieldLimits.keyPrinciple}
                  error={fieldErrors.keyPrinciple}
                  placeholder="e.g., Patience & Discipline"
                  required
                  isLight={isLight}
                />
              </div>

              {/* Description */}
              <FormField
                label="Description"
                name="description"
                value={formData.description || ''}
                onChange={handleInputChange}
                maxLength={fieldLimits.description}
                current={getCharCount('description')}
                max={fieldLimits.description}
                error={fieldErrors.description}
                placeholder="Detailed explanation of the wisdom..."
                textarea
                rows={4}
                required
                isLight={isLight}
              />

              {/* Quote */}
              <FormField
                label="Quote"
                name="quote"
                value={formData.quote || ''}
                onChange={handleInputChange}
                maxLength={fieldLimits.quote}
                current={getCharCount('quote')}
                max={fieldLimits.quote}
                error={fieldErrors.quote}
                placeholder="Inspirational quote..."
                textarea
                rows={3}
                required
                isLight={isLight}
              />

              {/* Insight Section */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <FormField
                  label="Insight Tag"
                  name="insightTag"
                  value={formData.insightTag || ''}
                  onChange={handleInputChange}
                  maxLength={fieldLimits.insightTag}
                  current={getCharCount('insightTag')}
                  max={fieldLimits.insightTag}
                  error={fieldErrors.insightTag}
                  placeholder="e.g., Practical"
                  required
                  isLight={isLight}
                />

                <div className="md:col-span-2">
                  <FormField
                    label="Insight Text"
                    name="insightText"
                    value={formData.insightText || ''}
                    onChange={handleInputChange}
                    maxLength={fieldLimits.insightText}
                    current={getCharCount('insightText')}
                    max={fieldLimits.insightText}
                    error={fieldErrors.insightText}
                    placeholder="Additional insight..."
                    textarea
                    rows={3}
                    required
                    isLight={isLight}
                  />
                </div>
              </div>

              {/* Week Label */}
              {fieldLimits.weekLabel && (
                <FormField
                  label="Week Label (e.g. Week 16 · 2026)"
                  name="weekLabel"
                  value={(formData as any).weekLabel || ''}
                  onChange={handleInputChange}
                  maxLength={fieldLimits.weekLabel}
                  current={((formData as any).weekLabel || '').length}
                  max={fieldLimits.weekLabel}
                  error={fieldErrors.weekLabel}
                  placeholder="e.g., Week 16 · 2026"
                  isLight={isLight}
                />
              )}

              {/* Tags */}
              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: isLight ? "#475569" : "rgba(203,213,225,1)" }}>
                  Tags <span style={{ color: "#5194F6" }}>*</span>
                </label>
                <input
                  type="text"
                  value={formData.tags?.join(", ") || ''}
                  onChange={handleTagsChange}
                  className="w-full px-4 py-3 rounded-xl text-sm transition-all outline-none"
                  style={{
                    background: isLight ? "rgba(248,250,252,0.9)" : "rgba(255,255,255,0.05)",
                    border: fieldErrors.tags
                      ? "1.5px solid rgba(239,68,68,0.6)"
                      : isLight ? "1.5px solid rgba(226,232,240,0.9)" : "1.5px solid rgba(81,148,246,0.20)",
                    color: isLight ? "#1e293b" : "#e8edf5",
                  }}
                  onFocus={e => {
                    if (!fieldErrors.tags) (e.target as HTMLElement).style.borderColor = "#5194F6";
                    (e.target as HTMLElement).style.background = isLight ? "#ffffff" : "rgba(81,148,246,0.06)";
                    (e.target as HTMLElement).style.boxShadow = "0 0 0 3px rgba(81,148,246,0.10)";
                  }}
                  onBlur={e => {
                    if (!fieldErrors.tags) (e.target as HTMLElement).style.borderColor = isLight ? "rgba(226,232,240,0.9)" : "rgba(81,148,246,0.20)";
                    (e.target as HTMLElement).style.background = isLight ? "rgba(248,250,252,0.9)" : "rgba(255,255,255,0.05)";
                    (e.target as HTMLElement).style.boxShadow = "none";
                  }}
                  placeholder="e.g., investing, finance, wisdom (comma-separated)"
                />
                {fieldErrors.tags && (
                  <p className="mt-1.5 text-xs font-medium text-red-500">{fieldErrors.tags}</p>
                )}
                <p className="mt-1.5 text-xs" style={{ color: isLight ? "rgba(148,163,184,0.9)" : "rgba(100,116,139,0.8)" }}>
                  Separate tags with commas. Max {fieldLimits.tags} characters per tag.
                </p>
              </div>
            </form>
          )}
        </div>

        {/* Footer */}
        <div className="flex-shrink-0 px-7 md:px-9 py-4 flex flex-col-reverse sm:flex-row gap-3 justify-end"
          style={{ background: isLight ? "#ffffff" : "rgba(13,19,36,0.98)", borderTop: isLight ? "1px solid rgba(226,232,240,0.8)" : "1px solid rgba(81,148,246,0.15)" }}>
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-6 py-2.5 rounded-xl font-semibold text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              background: isLight ? "rgba(248,250,252,0.9)" : "rgba(255,255,255,0.06)",
              border: isLight ? "1.5px solid rgba(226,232,240,0.9)" : "1.5px solid rgba(255,255,255,0.12)",
              color: isLight ? "#64748b" : "rgba(203,213,225,0.8)"
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = isLight ? "#f1f5f9" : "rgba(255,255,255,0.10)"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = isLight ? "rgba(248,250,252,0.9)" : "rgba(255,255,255,0.06)"; }}
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading || !fieldLimits}
            className="px-6 py-2.5 text-white rounded-xl font-semibold text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            style={{ background: "linear-gradient(135deg,#5194F6,#3a7de8)", boxShadow: "0 2px 12px rgba(81,148,246,0.30)" }}
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Updating...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Save Changes
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

interface FormFieldProps {
  label: string;
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  maxLength: number;
  current: number;
  max: number;
  error?: string;
  placeholder?: string;
  textarea?: boolean;
  rows?: number;
  required?: boolean;
  isLight?: boolean;
}

function FormField({
  label,
  name,
  value,
  onChange,
  maxLength,
  current,
  max,
  error,
  placeholder,
  textarea,
  rows = 3,
  required,
  isLight = false,
}: FormFieldProps) {
  const isWarning = current > max * 0.8;
  const isError = current > max || !!error;

  const baseStyle: React.CSSProperties = {
    width: "100%",
    padding: "10px 16px",
    borderRadius: "10px",
    fontSize: "14px",
    color: isLight ? "#1e293b" : "#e8edf5",
    background: isLight ? "rgba(248,250,252,0.9)" : "rgba(255,255,255,0.05)",
    border: isError
      ? "1.5px solid #f87171"
      : isLight
        ? "1.5px solid rgba(226,232,240,0.9)"
        : "1.5px solid rgba(81,148,246,0.18)",
    outline: "none",
    transition: "border-color 0.15s, box-shadow 0.15s, background 0.15s",
    resize: "none" as const,
    WebkitAppearance: "none",
    appearance: "none",
    colorScheme: isLight ? "light" : "dark",
  };

  const handleFocus = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (!isError) {
      e.target.style.borderColor = "#5194F6";
      e.target.style.boxShadow = "0 0 0 3px rgba(81,148,246,0.10)";
      e.target.style.background = isLight ? "#ffffff" : "rgba(81,148,246,0.06)";
    }
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (!isError) {
      e.target.style.borderColor = isLight ? "rgba(226,232,240,0.9)" : "rgba(81,148,246,0.18)";
      e.target.style.boxShadow = "none";
      e.target.style.background = isLight ? "rgba(248,250,252,0.9)" : "rgba(255,255,255,0.05)";
    }
  };

  return (
    <div>
      <label className="block text-sm font-semibold mb-2" style={{ color: isLight ? "#475569" : "rgba(203,213,225,1)" }}>
        {label} {required && <span style={{ color: "#5194F6" }}>*</span>}
      </label>
      {textarea ? (
        <textarea
          name={name}
          value={value}
          onChange={onChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          maxLength={maxLength}
          rows={rows}
          style={baseStyle}
          placeholder={placeholder}
        />
      ) : (
        <input
          type="text"
          name={name}
          value={value}
          onChange={onChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          maxLength={maxLength}
          style={baseStyle}
          placeholder={placeholder}
        />
      )}
      <div className="flex justify-between items-center mt-1.5">
        {error && <p className="text-xs font-medium" style={{ color: "#ef4444" }}>{error}</p>}
        <p
          className="text-xs font-medium ml-auto"
          style={{ color: isError ? "#ef4444" : isWarning ? "#f97316" : isLight ? "rgba(148,163,184,0.8)" : "rgba(100,116,139,0.7)" }}
        >
          {current}/{max}
        </p>
      </div>
    </div>
  );
}