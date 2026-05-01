import React, { useEffect, useState, useRef } from "react";

interface TVDataStampProps {
  mode: "domestic" | "global";
  type: "chart" | "heatmap";
  isLight: boolean;
}

// ── IST clock + NSE/BSE market open/closed — domestic only ──────────────────
// ✅ FIXED: Dynamic NSE holiday fetch — holiday pe bhi sahi "Market Closed" dikhega
const ZerodhaMarketClock = ({ isLight }: { isLight: boolean }) => {
  const [now, setNow]             = useState(() => new Date());
  const [isHoliday, setIsHoliday] = useState(false);

  const API = (import.meta as any).env?.VITE_API_URL ?? "http://localhost:8000/api/v1";

  // Tick every second — clock update
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  // ✅ NSE holidays dynamically fetch karo — din mein ek baar kaafi hai
  useEffect(() => {
    const fetchHolidays = async () => {
      try {
        const year  = new Date().getFullYear();
        const r     = await fetch(`${API}/kite/holidays?year=${year}`);
        const json  = await r.json();
        const dates: string[] = (json?.data ?? []).map((h: any) => h.date as string);

        // Aaj ki IST date "YYYY-MM-DD" format mein
        const istMs   = Date.now() + (5.5 * 60 * 60 * 1000);
        const istDate = new Date(istMs);
        const today   = [
          istDate.getUTCFullYear(),
          String(istDate.getUTCMonth() + 1).padStart(2, "0"),
          String(istDate.getUTCDate()).padStart(2, "0"),
        ].join("-");

        setIsHoliday(dates.includes(today));
        console.log(`[TVDataStamp] Today: ${today} | Holiday: ${dates.includes(today)} | Total: ${dates.length}`);
      } catch {
        // Fail silently — time-based check still works
        setIsHoliday(false);
      }
    };

    fetchHolidays();

    // Roz midnight ke baad refresh karo (new day = new holiday check)
    const midnight = new Date();
    midnight.setHours(24, 0, 0, 0);
    const msUntilMidnight = midnight.getTime() - Date.now();
    const timer = setTimeout(() => fetchHolidays(), msUntilMidnight);
    return () => clearTimeout(timer);
  }, [API]);

  const IST_OFFSET = 5.5 * 60 * 60 * 1000;
  const istDate = new Date(now.getTime() + IST_OFFSET);
  const hh = istDate.getUTCHours();
  const mm = istDate.getUTCMinutes();
  const ss = istDate.getUTCSeconds();
  const mins = hh * 60 + mm;
  const day = istDate.getUTCDay();
  const isWeekday = day >= 1 && day <= 5;

  // ✅ Holiday check include — holiday pe "Market Closed" dikhega
  const isOpen = isWeekday && !isHoliday && mins >= 9 * 60 + 15 && mins <= 15 * 60 + 30;

  const pad = (n: number) => String(n).padStart(2, "0");
  const period = hh < 12 ? "AM" : "PM";
  const h12 = hh % 12 || 12;
  const timeStr = `${pad(h12)}:${pad(mm)}:${pad(ss)} ${period} IST`;
  const textMuted = isLight ? "rgba(13,27,42,0.5)" : "rgba(200,210,225,0.45)";

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 5,
          background: isLight ? "rgba(13,37,64,0.05)" : "rgba(255,255,255,0.05)",
          border: isLight ? "1px solid rgba(13,37,64,0.08)" : "1px solid rgba(255,255,255,0.08)",
          borderRadius: 8,
          padding: "3px 8px",
          flexShrink: 0,
        }}
      >
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke={textMuted} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </svg>
        <span
          style={{
            fontSize: 11,
            fontWeight: 600,
            color: isLight ? "#0d1b2a" : "#e2e8f0",
            fontVariantNumeric: "tabular-nums",
            letterSpacing: "0.03em",
            whiteSpace: "nowrap",
          }}
        >
          {timeStr}
        </span>
      </div>
      <span
        style={{
          fontSize: 9,
          fontWeight: 700,
          letterSpacing: "0.06em",
          textTransform: "uppercase",
          padding: "2px 7px",
          borderRadius: 99,
          background: isOpen ? "rgba(34,197,94,0.12)" : "rgba(239,68,68,0.10)",
          color: isOpen ? "#22c55e" : "#ef4444",
          border: isOpen ? "1px solid rgba(34,197,94,0.25)" : "1px solid rgba(239,68,68,0.20)",
          whiteSpace: "nowrap",
          flexShrink: 0,
        }}
      >
        {isOpen ? "Market Open" : "Market Closed"}
      </span>
    </div>
  );
};

// ── Main TVDataStamp ─────────────────────────────────────────────────────────
const TVDataStamp: React.FC<TVDataStampProps> = ({ mode, type, isLight }) => {
  const [time, setTime] = useState<string>("");
  const [pulse, setPulse] = useState(true);
  const pulseRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const formatTime = () => {
    const now = new Date();
    const options: Intl.DateTimeFormatOptions = {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
      timeZone: mode === "domestic" ? "Asia/Kolkata" : "America/New_York",
    };
    return now.toLocaleTimeString("en-IN", options);
  };

  useEffect(() => {
    setTime(formatTime());
    const interval = setInterval(() => setTime(formatTime()), 1000);
    return () => clearInterval(interval);
  }, [mode]);

  useEffect(() => {
    pulseRef.current = setInterval(() => setPulse((p) => !p), 1000);
    return () => {
      if (pulseRef.current) clearInterval(pulseRef.current);
    };
  }, []);

  const timezone = mode === "domestic" ? "IST" : "EST";
  const exchange = mode === "domestic" ? "NSE / BSE" : "NASDAQ / NYSE";
  const label = type === "chart" ? "Live Chart" : "Live Heatmap";
  const tvChartLink = mode === "domestic" ? "https://in.tradingview.com/chart/" : "https://www.tradingview.com/chart/";

  const bg = isLight ? "rgba(255,255,255,0.95)" : "rgba(10,15,30,0.9)";
  const borderTop = isLight ? "1px solid rgba(0,0,0,0.06)" : "1px solid rgba(255,255,255,0.07)";
  const textPrimary = isLight ? "#0d1b2a" : "#e2e8f0";
  const textMuted = isLight ? "rgba(13,27,42,0.5)" : "rgba(200,210,225,0.45)";
  const tagBg = isLight ? "rgba(37,99,235,0.06)" : "rgba(37,99,235,0.08)";
  const tagBorder = isLight ? "1px solid rgba(37,99,235,0.15)" : "1px solid rgba(37,99,235,0.18)";

  return (
    <>
      <style>{`
        .tvstamp-desktop { display: flex; }
        .tvstamp-desktop-inline { display: inline; }
        .tvstamp-mobile-icon { display: none; }
        @media (max-width: 640px) {
          .tvstamp-desktop { display: none !important; }
          .tvstamp-desktop-inline { display: none !important; }
          .tvstamp-mobile-icon { display: flex !important; }
        }
      `}</style>

      <div
        style={{
          background: bg,
          borderTop,
          backdropFilter: "blur(8px)",
          WebkitBackdropFilter: "blur(8px)",
          padding: "8px 14px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 8,
          minHeight: 40,
          flexWrap: "nowrap",
          overflow: "hidden",
        }}
      >
        {/* ── LEFT: Live dot + label + exchange (desktop) ── */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0, overflow: "hidden" }}>
          <div style={{ position: "relative", width: 10, height: 10, flexShrink: 0 }}>
            <span
              style={{
                position: "absolute",
                inset: -3,
                borderRadius: "50%",
                background: "rgba(34,197,94,0.25)",
                transform: pulse ? "scale(1.6)" : "scale(1)",
                transition: "transform 0.5s ease",
              }}
            />
            <span
              style={{
                position: "absolute",
                inset: 0,
                borderRadius: "50%",
                background: "#22c55e",
                boxShadow: "0 0 5px 1px rgba(34,197,94,0.5)",
              }}
            />
          </div>

          <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", color: "#22c55e", flexShrink: 0 }}>
            LIVE
          </span>

          <span
            className="tvstamp-desktop"
            style={{ width: 1, height: 14, background: isLight ? "rgba(0,0,0,0.1)" : "rgba(255,255,255,0.12)", flexShrink: 0 }}
          />
          <span
            className="tvstamp-desktop"
            style={{ fontSize: 12, fontWeight: 600, color: textPrimary, whiteSpace: "nowrap", flexShrink: 0 }}
          >
            {label}
          </span>
          <span
            className="tvstamp-desktop"
            style={{
              fontSize: 10,
              fontWeight: 600,
              color: isLight ? "#0A3656" : "#9bc1da",
              background: tagBg,
              border: tagBorder,
              borderRadius: 99,
              padding: "2px 8px",
              whiteSpace: "nowrap",
              flexShrink: 0,
            }}
          >
            {exchange}
          </span>
        </div>

        {/* ── RIGHT ── */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>

          {/* DOMESTIC: IST clock + Market Open/Closed badge */}
          {mode === "domestic" ? (
            <ZerodhaMarketClock isLight={isLight} />
          ) : (
            /* GLOBAL: EST clock pill */
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 5,
                background: isLight ? "rgba(13,37,64,0.05)" : "rgba(255,255,255,0.05)",
                border: isLight ? "1px solid rgba(13,37,64,0.08)" : "1px solid rgba(255,255,255,0.08)",
                borderRadius: 8,
                padding: "3px 8px",
                flexShrink: 0,
              }}
            >
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke={textMuted} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  color: textPrimary,
                  fontVariantNumeric: "tabular-nums",
                  letterSpacing: "0.03em",
                  whiteSpace: "nowrap",
                }}
              >
                {time}
              </span>
              <span style={{ fontSize: 10, color: textMuted, fontWeight: 500, whiteSpace: "nowrap" }}>
                {timezone}
              </span>
            </div>
          )}

          {/* Powered by TradingView — desktop only (both modes) */}
          <span
            className="tvstamp-desktop"
            style={{ fontSize: 10, color: textMuted, whiteSpace: "nowrap", alignItems: "center" }}
          >
            Powered by{" "}
            <a
              href={tvChartLink}
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: "#3b82f6", textDecoration: "none", fontWeight: 600, marginLeft: 3 }}
            >
              TradingView
            </a>
          </span>

          {/* TradingView icon — mobile only */}
          <a
            className="tvstamp-mobile-icon"
            href={tvChartLink}
            target="_blank"
            rel="noopener noreferrer"
            title="Open on TradingView"
            style={{
              alignItems: "center",
              justifyContent: "center",
              width: 28,
              height: 28,
              borderRadius: 7,
              background: isLight ? "rgba(37,99,235,0.08)" : "rgba(59,130,246,0.15)",
              border: isLight ? "1px solid rgba(37,99,235,0.18)" : "1px solid rgba(59,130,246,0.25)",
              flexShrink: 0,
              textDecoration: "none",
            }}
          >
            <svg width="16" height="16" viewBox="0 0 36 28" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M0 0h36v4H21v24h-6V4H0V0z" fill="#3b82f6" />
            </svg>
          </a>
        </div>
      </div>
    </>
  );
};

export default TVDataStamp;