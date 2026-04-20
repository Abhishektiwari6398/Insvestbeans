// Backend/src/utils/kiteAutoLogin.js
// npm install otpauth node-cron axios tough-cookie axios-cookiejar-support

import axios          from "axios";
import crypto         from "crypto";
import * as OTPAuth   from "otpauth";
import { wrapper }    from "axios-cookiejar-support";
import { CookieJar }  from "tough-cookie";
import { kiteWS, registerAutoLogin } from "./kiteWebSocket.js";
import { TokenModel } from "../models/TokenModel.js";

// ── env vars runtime pe read karo ─────────────────────────────────────────
const getEnv = () => ({
  API_KEY:     process.env.KITE_API_KEY,
  API_SECRET:  process.env.KITE_API_SECRET,
  TOTP_SECRET: process.env.KITE_TOTP_SECRET,
  USER_ID:     process.env.KITE_USER_ID,
  PASSWORD:    process.env.KITE_PASSWORD,
});

// ── TOTP generate ──────────────────────────────────────────────────────────
function generateTOTP(secret) {
  const totp = new OTPAuth.TOTP({
    secret:    OTPAuth.Secret.fromBase32(secret.replace(/\s/g, "").toUpperCase()),
    algorithm: "SHA1",
    digits:    6,
    period:    30,
  });
  return totp.generate();
}

// ── Server start pe DB se token load ──────────────────────────────────────
export async function loadTokenFromDB() {
  const { API_KEY } = getEnv();
  try {
    const doc = await TokenModel.findOne({ key: "kite_token" });
    if (doc?.accessToken) {
      process.env.KITE_ACCESS_TOKEN = doc.accessToken;
      kiteWS.connect(API_KEY, doc.accessToken);
      console.log(`✅ Token loaded from DB: ${doc.accessToken.slice(0, 8)}…`);
      return doc.accessToken;
    }
    console.warn("⚠️  No token in DB — auto-login try karta hoon");
    return null;
  } catch (err) {
    console.error("❌ loadTokenFromDB failed:", err.message);
    return null;
  }
}

// ── Token save to DB ───────────────────────────────────────────────────────
async function saveTokenToDB(accessToken) {
  await TokenModel.findOneAndUpdate(
    { key: "kite_token" },
    { accessToken, updatedAt: new Date() },
    { upsert: true, new: true }
  );
  process.env.KITE_ACCESS_TOKEN = accessToken;
  console.log("💾 Token MongoDB mein save ho gaya");
}

// ── Main auto-login ────────────────────────────────────────────────────────
export async function autoLoginKite() {
  const { API_KEY, API_SECRET, TOTP_SECRET, USER_ID, PASSWORD } = getEnv();

  if (!API_KEY || !API_SECRET || !TOTP_SECRET || !USER_ID || !PASSWORD) {
    console.warn("⚠️  autoLoginKite: env vars missing hain:", {
      KITE_API_KEY:     !!API_KEY,
      KITE_API_SECRET:  !!API_SECRET,
      KITE_TOTP_SECRET: !!TOTP_SECRET,
      KITE_USER_ID:     !!USER_ID,
      KITE_PASSWORD:    !!PASSWORD,
    });
    return null;
  }

  // ── Browser jaisi cookie jar — sab cookies automatically handle hongi ──
  const jar    = new CookieJar();
  const client = wrapper(axios.create({
    jar,
    withCredentials: true,
    headers: {
      "User-Agent":     "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      "X-Kite-Version": "3",
    },
  }));

  try {
    console.log("🔐 Kite auto-login shuru...");

    // ── Step 1: Login ──────────────────────────────────────────────────────
    const loginRes = await client.post(
      "https://kite.zerodha.com/api/login",
      new URLSearchParams({ user_id: USER_ID, password: PASSWORD }),
      { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
    );
    const requestId = loginRes.data?.data?.request_id;
    if (!requestId) throw new Error(`Step 1 fail: ${JSON.stringify(loginRes.data)}`);
    console.log("✅ Step 1 — request_id mila");

    // ── Step 2: TOTP ───────────────────────────────────────────────────────
    const totpCode = generateTOTP(TOTP_SECRET);
    console.log(`🔢 TOTP: ${totpCode}`);

    const totpRes = await client.post(
      "https://kite.zerodha.com/api/twofa",
      new URLSearchParams({
        user_id:      USER_ID,
        request_id:   requestId,
        twofa_value:  totpCode,
        twofa_type:   "totp",
        skip_session: "",
      }),
      { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
    );
    console.log("📋 Step 2 response:", JSON.stringify(totpRes.data));

    // enctoken — body ya cookie jar mein
    let encToken = totpRes.data?.data?.enctoken;
    if (!encToken) {
      const cookies = await jar.getCookies("https://kite.zerodha.com");
      const enc = cookies.find(c => c.key === "enctoken");
      if (enc) encToken = enc.value;
      console.log("🍪 Cookies in jar:", cookies.map(c => c.key).join(", "));
    }
    if (!encToken) throw new Error(`Step 2 fail — enctoken nahi mila: ${JSON.stringify(totpRes.data)}`);
    console.log(`✅ Step 2 — enctoken mila`);

    // ── Step 3: request_token — redirect follow karo lekin callback pe RUKKO ─
    let reqToken = null;

    const connectRes = await client.get(
      `https://kite.zerodha.com/connect/login?v=3&api_key=${API_KEY}`,
      {
        maxRedirects:   0,
        validateStatus: s => s < 400,
      }
    );

    const location3a = connectRes.headers?.location || "";
    console.log("📋 Step 3a location:", location3a);

    try { reqToken = new URL(location3a).searchParams.get("request_token"); } catch (_) {}

    // sess_id wala intermediate redirect — follow karo
    if (!reqToken && location3a.includes("sess_id")) {
      console.log("🔄 sess_id intermediate — follow kar raha hoon...");
      const sessRes = await client.get(location3a, {
        maxRedirects:   0,
        validateStatus: s => s < 400,
      });
      const location3b = sessRes.headers?.location || "";
      console.log("📋 Step 3b location:", location3b);
      try { reqToken = new URL(location3b).searchParams.get("request_token"); } catch (_) {}
    }

    if (!reqToken) throw new Error(`Step 3 fail — request_token nahi mila`);
    console.log(`✅ Step 3 — request_token: ${reqToken.slice(0, 12)}…`);

    // ── Step 4: access_token exchange ─────────────────────────────────────
    const checksum = crypto
      .createHash("sha256")
      .update(API_KEY + reqToken + API_SECRET)
      .digest("hex");

    const sessionRes = await client.post(
      "https://api.kite.trade/session/token",
      new URLSearchParams({ api_key: API_KEY, request_token: reqToken, checksum }),
      { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
    );

    const accessToken = sessionRes.data?.data?.access_token;
    if (!accessToken) throw new Error(`Step 4 fail: ${JSON.stringify(sessionRes.data)}`);
    console.log(`✅ Step 4 — access_token: ${accessToken.slice(0, 8)}…`);

    // ── Step 5: Save + reconnect ───────────────────────────────────────────
    await saveTokenToDB(accessToken);
    kiteWS.connect(API_KEY, accessToken);
    console.log("🚀 Auto-login complete! WebSocket reconnected.");

    return accessToken;

  } catch (err) {
    console.error("❌ Auto-login failed:", err?.response?.data || err.message);
    return null;
  }
}

// ── Register autoLoginKite with kiteWebSocket (no circular dep) ───────────
// kiteWebSocket.js ne registerAutoLogin export kiya hai sirf is purpose ke liye.
// Ye line module load hone ke baad turant execute hoti hai.
registerAutoLogin(autoLoginKite);