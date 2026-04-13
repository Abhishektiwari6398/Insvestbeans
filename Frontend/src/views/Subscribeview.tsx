import React, { useState, useEffect } from "react";
import { Mail, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import axios from "axios";
import { useAuth } from "@/controllers/AuthContext";

// ─── Email validation ──────────────────────────────────────────────────────
const EMAIL_REGEX = /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/;

const DISPOSABLE_DOMAINS = new Set([
  "mailinator.com", "guerrillamail.com", "10minutemail.com",
  "trashmail.com", "yopmail.com", "tempmail.com", "throwaway.email",
  "sharklasers.com",
]);

const validateEmail = (email: string): string | null => {
  const trimmed = email.trim();
  if (!trimmed) return "Email address is required.";
  if (trimmed.length > 254) return "Email address is too long.";
  if (!EMAIL_REGEX.test(trimmed)) return "Please enter a valid email address.";
  const domain = trimmed.split("@")[1]?.toLowerCase();
  if (DISPOSABLE_DOMAINS.has(domain)) return "Disposable email addresses are not allowed.";
  return null; // valid
};

// ─── Types ────────────────────────────────────────────────────────────────
type Status = "idle" | "loading" | "success" | "error" | "duplicate";

interface SubscribeviewProps {
  sectionWrapBg: string;
  sectionWrapBorder: string;
  sectionTopLine: string;
  glow1: string;
  headingCls: string;
  subTextCls: string;
  GOLD: string;
  emailInputBg: string;
  emailInputBorder: string;
  emailInputText: string;
}

const Subscribeview = ({
  headingCls,
  subTextCls,
  emailInputBg,
  emailInputBorder,
  emailInputText,
}: SubscribeviewProps) => {
  const { isAuthenticated, user } = useAuth();
  const API_URL = import.meta.env.VITE_API_URL;

  // ── State ──────────────────────────────────────────────────────────────
  const [email, setEmail] = useState("");
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [serverMessage, setServerMessage] = useState("");
  const [touched, setTouched] = useState(false);

  // ── Pre-fill email if user is logged in ────────────────────────────────
  useEffect(() => {
    if (isAuthenticated && user?.email) {
      setEmail(user.email);
    }
  }, [isAuthenticated, user]);

  // ── Real-time validation (only after first blur/touch) ────────────────
  useEffect(() => {
    if (touched) {
      setFieldError(validateEmail(email));
    }
  }, [email, touched]);

  // ── Handlers ───────────────────────────────────────────────────────────
  const handleBlur = () => {
    setTouched(true);
    setFieldError(validateEmail(email));
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
    if (status === "error" || status === "duplicate") {
      setStatus("idle");
      setServerMessage("");
    }
  };

  const handleSubmit = async () => {
    setTouched(true);
    const error = validateEmail(email);
    setFieldError(error);
    if (error) return;

    setStatus("loading");
    setServerMessage("");

    try {
      const { data } = await axios.post(
        `${API_URL}/subscribe`,
        { email: email.trim().toLowerCase(), source: "homepage" },
        { withCredentials: true }
      );
      setStatus("success");
      setServerMessage(data.message);
    } catch (err: any) {
      const responseData = err.response?.data;
      const httpStatus = err.response?.status;
      if (httpStatus === 409 || responseData?.alreadySubscribed) {
        setStatus("duplicate");
        setServerMessage(responseData?.message || "This email is already subscribed!");
      } else {
        setStatus("error");
        setServerMessage(responseData?.message || "Something went wrong. Please try again.");
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") handleSubmit();
  };

  const inputBorderStyle = () => {
    if (fieldError) return "1px solid #ef4444";
    if (status === "success") return "1px solid #22c55e";
    if (status === "duplicate") return "1px solid #f59e0b";
    return emailInputBorder;
  };

  // ── Success state ──────────────────────────────────────────────────────
  // No wrapper card — HomeView's outer rounded-3xl panel is the card
  if (status === "success") {
    return (
      <div className="flex flex-col sm:flex-row items-center gap-5 sm:gap-8">
        {/* Left: icon + message */}
        <div className="flex items-center gap-3 flex-shrink-0">
          <CheckCircle className="w-7 h-7 text-green-400 flex-shrink-0" />
          <div className="text-left">
            <p className={`text-base font-bold leading-tight ${headingCls}`}>
              You're <span className="text-[#0A3656] dark:text-[#9bc1da]">In!</span>
            </p>
            <p className={`text-xs mt-0.5 ${subTextCls}`}>{serverMessage}</p>
          </div>
        </div>
        {/* Right: inbox note */}
        <div className="flex items-center gap-2 px-4 py-2 rounded-full text-sm"
          style={{ background: "rgba(10,54,86,0.10)", border: "1px solid rgba(10,54,86,0.25)" }}>
          <Mail className="w-4 h-4 text-[#0A3656] dark:text-[#74A8C9] flex-shrink-0" />
          <span className="text-[#0A3656] dark:text-[#74A8C9] font-medium text-xs">
            Welcome email sent to <strong>{email.trim().toLowerCase()}</strong> 🫘
          </span>
        </div>
      </div>
    );
  }

  // ── Main form ──────────────────────────────────────────────────────────
  // No wrapper card — HomeView's outer rounded-3xl panel is the card
  return (
    <div className="flex flex-col sm:flex-row items-center gap-6 sm:gap-10">

      {/* Left: mail icon + copy */}
      <div className="flex items-center gap-3 flex-shrink-0">
        <Mail className="w-7 h-7 text-[#0A3656] dark:text-[#74A8C9] flex-shrink-0" />
        <div className="text-left">
          <h3 className={`text-base font-bold leading-tight ${headingCls}`}>
            Stay Ahead in the{" "}
            <span className="text-[#0A3656] dark:text-[#9bc1da]">Market</span>
          </h3>
          <p className={`text-xs mt-0.5 ${subTextCls}`}>
            Daily insights, market trends &amp; expert analysis
          </p>
        </div>
      </div>

      {/* Right: input + button + hints */}
      <div className="flex-1 w-full sm:w-auto min-w-0">
        {/* Logged-in hint */}
        {isAuthenticated && user?.email && (
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full mb-2 text-xs"
            style={{ background: "rgba(10,54,86,0.08)", border: "1px solid rgba(10,54,86,0.20)" }}>
            <CheckCircle className="w-3 h-3 text-[#0A3656] dark:text-[#74A8C9]" />
            <span className="text-[#0A3656] dark:text-[#74A8C9]">Using your account email</span>
          </div>
        )}

        {/* Input + button side by side */}
        <div className="flex gap-2">
          <input
            type="email"
            value={email}
            onChange={handleChange}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            placeholder="Enter your email"
            disabled={status === "loading"}
            className="flex-1 min-w-0 h-10 px-4 rounded-lg text-sm focus:outline-none placeholder:text-slate-400 disabled:opacity-60"
            style={{
              background: emailInputBg,
              border: inputBorderStyle(),
              color: emailInputText,
              transition: "border-color 0.2s ease",
            }}
            aria-label="Email address"
            aria-invalid={!!fieldError}
            aria-describedby={fieldError ? "email-error" : undefined}
          />
          <button
            onClick={handleSubmit}
            disabled={status === "loading" || !!fieldError}
            className="h-10 px-5 rounded-lg font-semibold text-sm text-white whitespace-nowrap flex items-center gap-2 flex-shrink-0 disabled:opacity-60 disabled:cursor-not-allowed transition-all hover:bg-[#072a44] hover:shadow-lg hover:shadow-[#0A3656]/25"
            style={{ background: "#0A3656" }}
            aria-label="Subscribe"
          >
            {status === "loading"
              ? <><Loader2 className="w-4 h-4 animate-spin" /> Subscribing…</>
              : "Subscribe"}
          </button>
        </div>

        {/* Field error */}
        {fieldError && (
          <div id="email-error" className="flex items-center gap-1.5 mt-1.5 text-xs text-red-400" role="alert">
            <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
            <span>{fieldError}</span>
          </div>
        )}

        {/* Server error / duplicate */}
        {(status === "error" || status === "duplicate") && serverMessage && (
          <div className="flex items-center gap-1.5 mt-1.5 text-xs"
            style={{ color: status === "duplicate" ? "#f59e0b" : "#ef4444" }}
            role="alert">
            <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
            <span>{serverMessage}</span>
          </div>
        )}

        {/* Social proof */}
        <p className={`text-xs mt-1.5 ${subTextCls}`}>
          🔒 No spam, ever. Get daily market insights you can trust.
        </p>
      </div>
    </div>
  );
};

export default Subscribeview;