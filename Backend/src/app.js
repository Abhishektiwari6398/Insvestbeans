

import "dotenv/config";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import session from "express-session";
import MongoStore from "connect-mongo";
import passport from "passport";
import { configurePassport } from "./config/passport.config.js";
import { errorHandler, notFound } from "./middlewares/errorHandler.middleware.js";
import { adminLimiter, authLimiter } from "./middlewares/Ratelimit.middleware.js";

const app = express();

const FRONTEND_URL  = process.env.FRONTEND_URL || "http://localhost:8080";
const MONGODB_URI   = process.env.MONGODB_URI;
const IS_PRODUCTION = process.env.NODE_ENV === "production";

if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
  console.error("❌ GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET must be set");
  process.exit(1);
}
if (!process.env.SESSION_SECRET || process.env.SESSION_SECRET.length < 32) {
  console.error("❌ SESSION_SECRET must be at least 32 characters long");
  process.exit(1);
}

if (IS_PRODUCTION) { app.set("trust proxy", 1); console.log("✅ Trust proxy enabled"); }

app.use((req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("X-XSS-Protection", "1; mode=block");
  res.removeHeader("X-Powered-By");
  next();
});

const allowedOrigins = [
  "http://localhost:8080",
  "http://127.0.0.1:8080",
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "https://investbeans.com",
  "https://api.investbeans.com",
].filter(Boolean);
const uniqueOrigins = [...new Set(allowedOrigins)];
console.log("✅ Allowed CORS origins:", uniqueOrigins);

app.use(cors({
  origin: (origin, cb) => {
    if (!origin || uniqueOrigins.includes(origin)) cb(null, true);
    else { console.warn("⚠️ Blocked CORS:", origin); cb(null, true); }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "Cookie"],
  exposedHeaders: ["Set-Cookie"],
  preflightContinue: false,
  optionsSuccessStatus: 204,
}));

app.use((req, res, next) => {
  res.header("Access-Control-Allow-Credentials", "true");
  res.header("Access-Control-Allow-Origin", req.headers.origin || "http://localhost:8080");
  res.header("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,PATCH,OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type,Authorization,Cookie");
  if (req.method === "OPTIONS") return res.sendStatus(200);
  next();
});

// ← CHANGED: raised from "20kb" to "5mb" to support education seed payload
app.use(express.json({ limit: "5mb" }));
app.use(express.urlencoded({ extended: true, limit: "5mb" })); // ← CHANGED
app.use(cookieParser());

const sessionStore = MongoStore.create({
  mongoUrl: MONGODB_URI, collectionName: "sessions",
  ttl: 7 * 24 * 60 * 60, autoRemove: "native", touchAfter: 24 * 3600, stringify: false,
});
sessionStore.on("create",  id  => console.log("✅ Session created:", id));
sessionStore.on("destroy", id  => console.log("🗑️  Session destroyed:", id));
sessionStore.on("error",   err => console.error("❌ Session store error:", err));

const sessionConfig = {
  secret: process.env.SESSION_SECRET,
  name: "investbeans.sid",
  store: sessionStore,
  resave: false,
  saveUninitialized: false,
  rolling: true,
  proxy: IS_PRODUCTION,
  cookie: {
    httpOnly: true,
    secure: IS_PRODUCTION,
    sameSite: IS_PRODUCTION ? "none" : "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: "/",
    domain: undefined,
  },
};

app.use((req, res, next) => {
  if (req.path.startsWith("/socket.io")) return next();
  session(sessionConfig)(req, res, next);
});

configurePassport();

app.use((req, res, next) => {
  if (req.path.startsWith("/socket.io")) return next();
  passport.initialize()(req, res, next);
});
app.use((req, res, next) => {
  if (req.path.startsWith("/socket.io")) return next();
  passport.session()(req, res, next);
});

if (!IS_PRODUCTION) {
  app.use((req, res, next) => {
    if (req.path.startsWith("/socket.io")) return next();
    console.log("\n📨 Incoming Request:");
    console.log("  Method:", req.method, "| Path:", req.path);
    console.log("  Origin:", req.headers.origin || "No origin");
    console.log("  Session ID:", req.sessionID || "No session");
    console.log("  Authenticated:", req.isAuthenticated ? req.isAuthenticated() : false);
    next();
  });
}

app.get("/health", (req, res) => res.status(200).json({
  success: true,
  message: "Server is running",
  environment: process.env.NODE_ENV || "development",
  timestamp: new Date().toISOString(),
}));

// ══════════════════════════════════════════════════════════════════════
// Route imports
// ══════════════════════════════════════════════════════════════════════
import userRouter          from "./routes/user.routes.js";
import googleAuthRouter    from "./routes/googleAuth.routes.js";
import blogRouter          from "./routes/blog.routes.js";
import beansOfWisdom       from "./routes/beanOfWisdom.routes.js";
import insightRouter       from "./routes/insight.routes.js";
import globalMarketsRouter from "./routes/globalMarkets.routes.js";
import marketHistoryRouter from "./routes/marketHistory.routes.js";
import ipoRouter           from "./routes/Ipo.routes.js";
import testimonialRouter   from "./routes/Testimonial.routes.js";
import subscriberRouter    from "./routes/Subscriber.routes.js";
import KiteRouter          from "./routes/kite.routes.js";
import commoditiesRouter   from "./routes/Commodities.routes.js";
import paymentRouter       from "./routes/Payment.routes.js";
import kiteTestRouter      from "./routes/Kite_test.js";
import adminRouter         from "./routes/Admin.routes.js";
import subscriptionRouter  from "./routes/Subscription.routes.js";
import adminEventsRouter   from "./routes/adminEvents_routes.js";
import educationRouter       from "./routes/education.routes.js";
import adminEducationRouter  from "./routes/adminEducation.routes.js";

app.use("/api/v1/admin/events", adminEventsRouter);

// ══════════════════════════════════════════════════════════════════════
// Route registration
// ══════════════════════════════════════════════════════════════════════
app.use("/api/v1/kite",            kiteTestRouter);
app.use("/api/v1/users",           authLimiter, userRouter);
app.use("/auth",                   authLimiter, googleAuthRouter);
app.use("/api/v1/blogs",           blogRouter);
app.use("/api/v1/beans-of-wisdom", beansOfWisdom);
app.use("/api/v1/insights",        insightRouter);
app.use("/api/v1",                 paymentRouter);
app.use("/api/v1/markets",         globalMarketsRouter);
app.use("/api/v1/markets",         marketHistoryRouter);
app.use("/api/v1/kite",            KiteRouter);
app.use("/api/v1/subscriptions",   subscriptionRouter);
app.use("/api/v1/commodities",     commoditiesRouter);
app.use("/api/v1/subscribe",       subscriberRouter);
app.use("/api/v1/ipo",             ipoRouter);
app.use("/api/v1/testimonials",    testimonialRouter);
app.use(`/api/v1/${process.env.ADMIN_API_SEGMENT || "xp-insights-42"}`, adminLimiter, adminRouter);

// ── Education (public) ────────────────────────────────────────────────────────
app.use("/api/v1/education", educationRouter);

// ── Education (admin CRUD — obfuscated segment) ───────────────────────────────
app.use(
  `/api/v1/${process.env.ADMIN_API_SEGMENT || "xp-insights-42"}/education`,
  adminLimiter,
  adminEducationRouter
);

app.use(notFound);
app.use(errorHandler);

export { app };