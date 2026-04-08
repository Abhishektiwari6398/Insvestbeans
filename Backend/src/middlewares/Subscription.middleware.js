import { Subscription } from "../models/Subscription.model.js";

export const verifySubscription = async (req, res, next) => {
  try {
    // ── 1. Guest (no token) ───────────────────────────────────────────────────
    if (!req.user?._id) {
      req.isSubscriber     = false;
      req.activePlans      = [];
      req.subscriptionPlan = null;
      req.isAdmin          = false;
      return next();
    }

    // ── 2. ADMIN BYPASS ───────────────────────────────────────────────────────
    // Agar user ka role "admin" hai to use sab kuch free mein milega
    // No DB query needed — direct set karo
    if (req.user.role === "admin") {
      req.isSubscriber     = true;
      req.activePlans      = ["foundation", "command"]; // sabhi plans open
      req.subscriptionPlan = "command";                 // highest plan
      req.subscriptions    = [];
      req.isAdmin          = true;
      return next();
    }

    // ── 3. Normal User — DB se active subscriptions fetch karo ───────────────
    req.isAdmin = false;

    const activeSubs = await Subscription.find({
      userId:  req.user._id,
      status:  "active",
      endDate: { $gt: new Date() },
    })
      .sort({ endDate: -1 }) // latest expiry first
      .lean();

    req.isSubscriber     = activeSubs.length > 0;
    req.activePlans      = activeSubs.map(s => s.plan); // ["foundation", "command"]
    req.subscriptionPlan = activeSubs[0]?.plan ?? null;  // primary plan (backward compat)
    req.subscriptions    = activeSubs;                   // full docs if needed

    next();
  } catch (err) {
    console.error("verifySubscription error:", err.message);
    req.isSubscriber     = false;
    req.activePlans      = [];
    req.subscriptionPlan = null;
    req.isAdmin          = false;
    next();
  }
};

// ─── Plan-specific middleware factory ─────────────────────────────────────────
// Usage: router.get("/command-data", verifySubscription, requirePlan("command"), handler)
export const requirePlan = (planId) => (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: "Login required" });
  }

  // Admin ko koi bhi plan check bypass ho jayega
  if (req.user.role === "admin") return next();

  if (!req.activePlans?.includes(planId)) {
    return res.status(403).json({
      success: false,
      message: `${planId} subscription required`,
      requiredPlan: planId,
      activePlans:  req.activePlans || [],
      upgradeUrl:   `/plans/${planId}/checkout`,
    });
  }
  next();
};

// ─── Any subscriber check ─────────────────────────────────────────────────────
export const requireAnySubscription = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: "Login required" });
  }

  // Admin ko yahan bhi bypass milega
  if (req.user.role === "admin") return next();

  if (!req.isSubscriber) {
    return res.status(403).json({
      success: false,
      message: "Active subscription required",
      activePlans: [],
      upgradeUrl:  "/plans",
    });
  }
  next();
};