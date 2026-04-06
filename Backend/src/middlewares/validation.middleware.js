// middlewares/validation.middleware.js
// Input sanitization aur validation — XSS aur bad data se protection

import { body, param, validationResult } from "express-validator";

// ─── Helper: errors collect karo aur 400 bhejo ──────────────────────────────
export const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: errors.array()[0].msg,
      errors:  errors.array().map(e => ({ field: e.path, message: e.msg })),
    });
  }
  next();
};

// ─── Register validation ──────────────────────────────────────────────────────
export const validateRegister = [
  body("name")
    .trim()
    .notEmpty().withMessage("Name required hai")
    .isLength({ min: 2, max: 50 }).withMessage("Name 2-50 characters ka hona chahiye")
    .matches(/^[a-zA-Z\s\u0900-\u097F]+$/).withMessage("Name mein sirf letters allowed hain")
    .escape(),

  body("email")
    .trim()
    .notEmpty().withMessage("Email required hai")
    .isEmail().withMessage("Valid email enter karo")
    .normalizeEmail()
    .isLength({ max: 100 }).withMessage("Email bahut lamba hai"),

  body("password")
    .notEmpty().withMessage("Password required hai")
    .isLength({ min: 6 }).withMessage("Password kam se kam 6 characters ka hona chahiye")
    .isLength({ max: 128 }).withMessage("Password bahut lamba hai"),

  handleValidationErrors,
];

// ─── Login validation ─────────────────────────────────────────────────────────
export const validateLogin = [
  body("email")
    .trim()
    .notEmpty().withMessage("Email required hai")
    .isEmail().withMessage("Valid email enter karo")
    .normalizeEmail(),

  body("password")
    .notEmpty().withMessage("Password required hai")
    .isLength({ max: 128 }).withMessage("Invalid password"),

  handleValidationErrors,
];

// ─── Forgot password validation ───────────────────────────────────────────────
export const validateForgotPassword = [
  body("email")
    .trim()
    .notEmpty().withMessage("Email required hai")
    .isEmail().withMessage("Valid email enter karo")
    .normalizeEmail(),

  handleValidationErrors,
];

// ─── Reset password validation ────────────────────────────────────────────────
export const validateResetPassword = [
  body("token")
    .notEmpty().withMessage("Reset token required hai")
    .isLength({ min: 10 }).withMessage("Invalid token"),

  body("newPassword")
    .notEmpty().withMessage("New password required hai")
    .isLength({ min: 6 }).withMessage("Password kam se kam 6 characters ka hona chahiye")
    .isLength({ max: 128 }).withMessage("Password bahut lamba hai"),

  handleValidationErrors,
];

// ─── Insight create/update validation ────────────────────────────────────────
//
// BUG FIX 1: .escape() title/description se hata diya.
//   .escape() HTML-encode kar deta hai (&amp; &lt; etc.) req.body ko in-place,
//   toh controller ko already-mutated string milti thi. Controller apna khud
//   ka .trim() karta hai — sanitization wahan kaafi hai.
//
// BUG FIX 2: impactScore ke liye .isInt() → .isFloat() + toInt() sanitizer.
//   Frontend Number type bhejta hai (e.g. 5). express-validator ka .isInt()
//   nested object mein JS number pe fail ho jaata hai. .isFloat() pass karta
//   hai aur .toInt() ensure karta hai integer store ho.
//
// BUG FIX 3: credits.url — agar empty string bheja toh .isURL() fail karta
//   tha. .if(body(...).notEmpty()) guard se sirf non-empty values validate hoti.
// ─────────────────────────────────────────────────────────────────────────────
export const validateInsight = [
  // ── Core fields ────────────────────────────────────────────────────────────
  body("title")
    .trim()
    .notEmpty().withMessage("Title required hai")
    .isLength({ max: 200 }).withMessage("Title 200 characters se zyada nahi ho sakta"),
    // ❌ .escape() removed — controller already trims; escaping here corrupts saved data

  body("description")
    .trim()
    .notEmpty().withMessage("Description required hai")
    .isLength({ max: 1000 }).withMessage("Description 1000 characters se zyada nahi ho sakta"),
    // ❌ .escape() removed — same reason as above

  body("category")
    .trim()
    .notEmpty().withMessage("Category required hai")
    .isLength({ max: 50 }).withMessage("Category bahut lamba hai"),
    // ❌ .escape() removed — category text bhi corrupt ho jaati thi

  body("marketType")
    .notEmpty().withMessage("marketType required hai")
    .isIn(["domestic", "global", "commodities"])
    .withMessage("marketType: domestic, global ya commodities hona chahiye"),

  body("sentiment")
    .optional()
    .isIn(["positive", "negative", "neutral"])
    .withMessage("sentiment: positive, negative ya neutral hona chahiye"),

  // ── investBeansInsight nested fields ───────────────────────────────────────
  body("investBeansInsight.summary")
    .trim()
    .notEmpty().withMessage("investBeansInsight.summary required hai")
    .isLength({ max: 500 }).withMessage("Summary bahut lamba hai"),

  body("investBeansInsight.marketSignificance")
    .trim()
    .notEmpty().withMessage("investBeansInsight.marketSignificance required hai")
    .isLength({ max: 600 }).withMessage("Market significance bahut lamba hai"),

  body("investBeansInsight.impactArea")
    .trim()
    .notEmpty().withMessage("investBeansInsight.impactArea required hai")
    .isLength({ max: 300 }).withMessage("Impact area bahut lamba hai"),

  body("investBeansInsight.shortTermView")
    .trim()
    .notEmpty().withMessage("investBeansInsight.shortTermView required hai")
    .isLength({ max: 600 }).withMessage("Short term view bahut lamba hai"),

  body("investBeansInsight.longTermView")
    .trim()
    .notEmpty().withMessage("investBeansInsight.longTermView required hai")
    .isLength({ max: 600 }).withMessage("Long term view bahut lamba hai"),

  body("investBeansInsight.keyRisk")
    .trim()
    .notEmpty().withMessage("investBeansInsight.keyRisk required hai")
    .isLength({ max: 500 }).withMessage("Key risk bahut lamba hai"),

  body("investBeansInsight.stocksImpacted")
    .optional({ nullable: true, checkFalsy: true })
    .trim()
    .isLength({ max: 500 }).withMessage("Stocks impacted bahut lamba hai"),

  body("investBeansInsight.impactScore")
    .optional()
    // ✅ FIX: .isFloat() instead of .isInt() — works for both JS number and string "5"
    .isFloat({ min: 1, max: 10 }).withMessage("Impact score 1-10 ke beech hona chahiye")
    // ✅ Sanitize to integer so DB mein clean value jaye
    .toInt(),

  // ── Credits ────────────────────────────────────────────────────────────────
  body("credits.source")
    .trim()
    .notEmpty().withMessage("Credit source required hai")
    .isLength({ max: 100 }).withMessage("Source name bahut lamba hai"),

  body("credits.url")
    // ✅ FIX: Only validate URL format if a non-empty value was actually sent.
    //    Empty string "" se pehle .isURL() fail karta tha.
    .if(body("credits.url").notEmpty())
    .trim()
    .isURL({ require_protocol: true }).withMessage("Valid URL enter karo (https:// required)"),

  handleValidationErrors,
];

// ─── Payment process validation ──────────────────────────────────────────────
export const validatePayment = [
  body("amount")
    .notEmpty().withMessage("Amount required hai")
    .isFloat({ min: 1 }).withMessage("Amount valid hona chahiye")
    .customSanitizer(v => Math.round(Number(v))),

  body("userId")
    .notEmpty().withMessage("UserId required hai")
    .isMongoId().withMessage("Invalid userId format"),

  body("planId")
    .notEmpty().withMessage("PlanId required hai")
    .isIn(["foundation", "command", "edge"]).withMessage("Invalid plan. foundation, command, ya edge hona chahiye"),

  handleValidationErrors,
];

// ─── Subscription grant validation (admin) ───────────────────────────────────
export const validateGrantSubscription = [
  body("plan")
    .notEmpty().withMessage("Plan required hai")
    .isIn(["foundation", "command", "edge", "basic", "pro", "elite"]).withMessage("Invalid plan"),

  body("durationDays")
    .notEmpty().withMessage("durationDays required hai")
    .isInt({ min: 1, max: 3650 }).withMessage("Duration 1-3650 days hona chahiye"),

  body("amount")
    .optional()
    .isFloat({ min: 0 }).withMessage("Amount valid hona chahiye"),

  handleValidationErrors,
];

// ─── MongoDB ObjectId param validation ───────────────────────────────────────
export const validateMongoId = (paramName = "id") => [
  param(paramName)
    .isMongoId().withMessage(`Invalid ${paramName} format`),

  handleValidationErrors,
];