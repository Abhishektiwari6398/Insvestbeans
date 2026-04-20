// Backend/src/routes/adminEvents_routes.js
// ─────────────────────────────────────────────────────────────────────────────
// Admin-only Event Management API
// All routes require: isAuthenticated + isAdmin middleware
//
// Event schema fields admin can set:
//   title, date, region, impact, description
//   marketImpact:  "bullish" | "bearish" | "mixed"
//   impactTerm:    "short" | "medium" | "long" | "short-medium"
//   whoAffected:
//     assets:  ["Equity"] | ["Commodities"] | ["Forex"] | ["Bonds"] (1 or more)
//     sectors: string (max 70 words, free-text key sectors description)
//   investbeansInsight: string (max 300 words)
//   whatHappened:       string (max 2 lines / ~200 chars)
//   sourceUrl:          string (URL for SOURCE ↗ link on card)
// ─────────────────────────────────────────────────────────────────────────────

import express from "express";
import mongoose from "mongoose";
import {  verifyAdmin } from "../middlewares/admin.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = express.Router();

// ─── Mongoose Schema ──────────────────────────────────────────────────────────
const marketEventSchema = new mongoose.Schema(
  {
    title:       { type: String, required: true, trim: true, maxlength: 200 },
    date:        { type: String, required: true }, // "YYYY-MM-DD"
    region:      { type: String, enum: ["india", "global"], default: "india" },
    impact:      { type: String, enum: ["High", "Medium", "Low"], default: "Medium" },
    description: { type: String, maxlength: 400, default: "" },

    // Admin-controlled display fields
    marketImpact: { type: String, enum: ["bullish", "bearish", "mixed", ""], default: "" },
    impactTerm:   { type: String, enum: ["short", "medium", "long", "short-medium", ""], default: "" },
    whoAffected: {
      assets:  {
        type: [{ type: String, enum: ["Equity", "Commodities", "Forex", "Bonds"] }],
        default: [],
      },
      // Key sectors — free text, max ~70 words, set by admin
      sectors: { type: String, maxlength: 600, default: "" },
    },
    investbeansInsight: { type: String, maxlength: 2000, default: "" },
    whatHappened:       { type: String, maxlength: 500,  default: "" },
    sourceUrl:          { type: String, default: "" },

    // Auto-management: event expires 2 days after its date
    isActive: { type: Boolean, default: true },

    // Who created/last-edited this
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

// Auto-index on date for fast future-event queries
marketEventSchema.index({ date: 1 });
marketEventSchema.index({ region: 1, date: 1 });

const MarketEvent = mongoose.models.MarketEvent || mongoose.model("MarketEvent", marketEventSchema);

// ─── Validators ───────────────────────────────────────────────────────────────
function wordCount(str = "") {
  return str.trim().split(/\s+/).filter(Boolean).length;
}

// Used for POST (full event creation from feed / manual)
function validateEventBody(body, requireTitle = true) {
  const errors = [];
  if (requireTitle && !body.title?.trim()) errors.push("title is required");
  if (!body.date || !/^\d{4}-\d{2}-\d{2}$/.test(body.date))
    errors.push("date must be YYYY-MM-DD");
  return errors;
}

// ─── Admin-only enrichment validator (PATCH) ──────────────────────────────────
// Admin can ONLY populate: marketImpact, impactTerm, whoAffected, investbeansInsight
function validateEnrichmentBody(body) {
  const errors = [];

  const VALID_ASSETS  = ["Equity", "Commodities", "Forex", "Bonds"];
  const VALID_IMPACT  = ["bullish", "bearish", "mixed", ""];
  const VALID_TERM    = ["short", "medium", "long", "short-medium", ""];

  if (body.marketImpact !== undefined && !VALID_IMPACT.includes(body.marketImpact))
    errors.push("marketImpact must be: bullish | bearish | mixed");

  if (body.impactTerm !== undefined && !VALID_TERM.includes(body.impactTerm))
    errors.push("impactTerm must be: short | medium | long | short-medium");

  if (body.whoAffected?.assets !== undefined) {
    if (!Array.isArray(body.whoAffected.assets))
      errors.push("whoAffected.assets must be an array");
    else {
      const invalid = body.whoAffected.assets.filter(a => !VALID_ASSETS.includes(a));
      if (invalid.length) errors.push(`invalid assets: ${invalid.join(", ")}`);
      // Single-select enforced: max 1 asset
      if (body.whoAffected.assets.length > 1)
        errors.push("only one asset class may be selected");
    }
  }

  if (body.whoAffected?.sectors) {
    const wc = wordCount(body.whoAffected.sectors);
    if (wc > 70) errors.push(`sectors too long (${wc} words, max 70)`);
  }

  if (body.investbeansInsight) {
    const wc = wordCount(body.investbeansInsight);
    if (wc > 300) errors.push(`investbeansInsight too long (${wc} words, max 300)`);
  }

  return errors;
}

// ─── Helper: parse sectors from frontend (may be array or string) ──────────────
function parseSectors(raw) {
  if (!raw) return "";
  if (Array.isArray(raw)) return raw.join(", ");
  return String(raw).slice(0, 600);
}

// ─── GET /api/v1/admin/events ─── List all events (admin sees all, paginated) ──
// Optional query params: region, title (exact, case-insensitive), date (YYYY-MM-DD)
router.get("/", verifyJWT, verifyAdmin, async (req, res) => {
  try {
    const page  = Math.max(1, parseInt(req.query.page)  || 1);
    const limit = Math.min(100, parseInt(req.query.limit) || 20);

    const query = {};
    if (req.query.region) query.region = req.query.region;
    // Duplicate-check support: title + date exact match
    if (req.query.title) query.title = { $regex: new RegExp(`^${req.query.title.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i") };
    if (req.query.date)  query.date  = req.query.date;

    const [events, total] = await Promise.all([
      MarketEvent.find(query)
        .sort({ date: 1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      MarketEvent.countDocuments(query),
    ]);

    res.json({
      success: true,
      data: events,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (err) {
    console.error("[AdminEvents] GET list error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── GET /api/v1/admin/events/public ── Public feed (used by frontend Events page)
// Returns only future events + events within 2 days of passing
router.get("/public", async (req, res) => {
  try {
    const now        = new Date();
    const todayStr   = now.toISOString().slice(0, 10);
    // 2 days ago
    const twoDaysAgo = new Date(now);
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
    const twoDaysAgoStr = twoDaysAgo.toISOString().slice(0, 10);

    const events = await MarketEvent.find({
      isActive: true,
      date: { $gte: twoDaysAgoStr }, // at most 2 days past
    })
      .sort({ date: 1 })
      .limit(200)
      .lean();

    // Transform for frontend MarketEvent interface
    const mapped = events.map(e => ({
      id:                 e._id.toString(),
      date:               e.date,
      title:              e.title,
      description:        e.description,
      region:             e.region,
      category:           inferCategory(e.title),
      impact:             e.impact,
      source:             "api",
      marketImpact:       e.marketImpact   || undefined,
      impactTerm:         e.impactTerm     || undefined,
      whatHappened:       e.whatHappened   || undefined,
      investbeansInsight: e.investbeansInsight || undefined,
      sourceUrl:          e.sourceUrl      || undefined,
      whoAffected: (e.whoAffected?.assets?.length || e.whoAffected?.sectors)
        ? {
            assets:  e.whoAffected.assets || [],
            sectors: e.whoAffected.sectors ? [e.whoAffected.sectors] : [],
          }
        : undefined,
    }));

    res.json({ success: true, data: mapped });
  } catch (err) {
    console.error("[AdminEvents] GET public error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
});

function inferCategory(title = "") {
  const t = title.toLowerCase();
  if (/fomc|rbi|mpc|ecb|boj|boe|monetary policy|rate decision|fed funds/.test(t)) return "monetary";
  if (/budget|fiscal/.test(t)) return "budget";
  if (/earnings|results|q[1-4]\s+fy/.test(t)) return "earnings";
  if (/gst|policy|regulation/.test(t)) return "policy";
  if (/war|geopolit|tension|sanction/.test(t)) return "geopolitical";
  return "economic";
}

// ─── POST /api/v1/admin/events ─── Create new event ───────────────────────────
router.post("/", verifyJWT,verifyAdmin, async (req, res) => {
  try {
    const errors = validateEventBody(req.body);
    if (errors.length) return res.status(400).json({ success: false, message: errors.join("; ") });

    const event = await MarketEvent.create({
      title:       req.body.title.trim(),
      date:        req.body.date,
      region:      req.body.region       || "india",
      impact:      req.body.impact       || "Medium",
      description: req.body.description  || "",
      marketImpact:       req.body.marketImpact       || "",
      impactTerm:         req.body.impactTerm         || "",
      whatHappened:       req.body.whatHappened       || "",
      investbeansInsight: req.body.investbeansInsight || "",
      sourceUrl:          req.body.sourceUrl          || "",
      whoAffected: {
        assets:  req.body.whoAffected?.assets  || [],
        sectors: parseSectors(req.body.whoAffected?.sectors),
      },
      isActive:  true,
      createdBy: req.user._id,
      updatedBy: req.user._id,
    });

    console.log(`[AdminEvents] Created event "${event.title}" by ${req.user.email}`);
    res.status(201).json({ success: true, data: event });
  } catch (err) {
    console.error("[AdminEvents] POST create error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── GET /api/v1/admin/events/:id ─── Get single event ────────────────────────
router.get("/:id", verifyJWT, verifyAdmin, async (req, res) => {
  try {
    const event = await MarketEvent.findById(req.params.id).lean();
    if (!event) return res.status(404).json({ success: false, message: "Event not found" });
    res.json({ success: true, data: event });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── PATCH /api/v1/admin/events/:id ─── Enrichment-only (Market Impact + Who Affected + Insight)
// Admin can ONLY set: marketImpact, impactTerm, whoAffected, investbeansInsight
router.patch("/:id", verifyJWT, verifyAdmin, async (req, res) => {
  try {
    const errors = validateEnrichmentBody(req.body);
    if (errors.length) return res.status(400).json({ success: false, message: errors.join("; ") });

    const update = { updatedBy: req.user._id };

    // ── Only these enrichment fields are admin-settable ──
    if (req.body.marketImpact       !== undefined) update.marketImpact       = req.body.marketImpact;
    if (req.body.impactTerm         !== undefined) update.impactTerm         = req.body.impactTerm;
    if (req.body.investbeansInsight !== undefined) update.investbeansInsight = req.body.investbeansInsight;
    if (req.body.isActive           !== undefined) update.isActive           = req.body.isActive;

    // whoAffected: single-asset enforced, free-text sectors (max 70 words)
    if (req.body.whoAffected !== undefined) {
      if (req.body.whoAffected.assets !== undefined)
        update["whoAffected.assets"] = Array.isArray(req.body.whoAffected.assets)
          ? req.body.whoAffected.assets.slice(0, 1)
          : [];
      if (req.body.whoAffected.sectors !== undefined)
        update["whoAffected.sectors"] = parseSectors(req.body.whoAffected.sectors);
    }

    const event = await MarketEvent.findByIdAndUpdate(
      req.params.id,
      { $set: update },
      { new: true, runValidators: true }
    );
    if (!event) return res.status(404).json({ success: false, message: "Event not found" });

    console.log(`[AdminEvents] Enriched event "${event.title}" by ${req.user.email}`);
    res.json({ success: true, data: event });
  } catch (err) {
    console.error("[AdminEvents] PATCH error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── PUT /api/v1/admin/events/:id ─── Full update (admin edits all fields) ────
router.put("/:id", verifyJWT, verifyAdmin, async (req, res) => {
  try {
    const errors = validateEventBody(req.body, true);
    if (errors.length) return res.status(400).json({ success: false, message: errors.join("; ") });

    // Validate enrichment fields too
    const enrichErrors = validateEnrichmentBody(req.body);
    if (enrichErrors.length) return res.status(400).json({ success: false, message: enrichErrors.join("; ") });

    const update = {
      title:              req.body.title.trim(),
      date:               req.body.date,
      region:             req.body.region             || "india",
      impact:             req.body.impact             || "Medium",
      description:        req.body.description        || "",
      marketImpact:       req.body.marketImpact       || "",
      impactTerm:         req.body.impactTerm         || "",
      whatHappened:       req.body.whatHappened       || "",
      investbeansInsight: req.body.investbeansInsight || "",
      sourceUrl:          req.body.sourceUrl          || "",
      whoAffected: {
        assets:  Array.isArray(req.body.whoAffected?.assets)
                   ? req.body.whoAffected.assets.slice(0, 1)
                   : [],
        sectors: parseSectors(req.body.whoAffected?.sectors),
      },
      updatedBy: req.user._id,
    };

    const event = await MarketEvent.findByIdAndUpdate(
      req.params.id,
      { $set: update },
      { new: true, runValidators: true }
    );
    if (!event) return res.status(404).json({ success: false, message: "Event not found" });

    console.log(`[AdminEvents] Full-updated event "${event.title}" by ${req.user.email}`);
    res.json({ success: true, data: event });
  } catch (err) {
    console.error("[AdminEvents] PUT error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
});


router.delete("/:id", verifyJWT, verifyAdmin, async (req, res) => {
  try {
    const hard = req.query.hard === "true"; // ?hard=true for permanent delete

    let result;
    if (hard) {
      result = await MarketEvent.findByIdAndDelete(req.params.id);
    } else {
      result = await MarketEvent.findByIdAndUpdate(
        req.params.id,
        { $set: { isActive: false, updatedBy: req.user._id } },
        { new: true }
      );
    }

    if (!result) return res.status(404).json({ success: false, message: "Event not found" });

    console.log(`[AdminEvents] ${hard ? "Hard-deleted" : "Soft-deleted"} event "${result.title}" by ${req.user.email}`);
    res.json({ success: true, message: hard ? "Event permanently deleted" : "Event deactivated" });
  } catch (err) {
    console.error("[AdminEvents] DELETE error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── POST /api/v1/admin/events/cleanup ─── Manual: deactivate all events > 2 days past
router.post("/cleanup", verifyJWT, verifyAdmin, async (req, res) => {
  try {
    const twoDaysAgo = new Date();
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
    const cutoff = twoDaysAgo.toISOString().slice(0, 10);

    const result = await MarketEvent.updateMany(
      { date: { $lt: cutoff }, isActive: true },
      { $set: { isActive: false } }
    );

    console.log(`[AdminEvents] Cleanup: deactivated ${result.modifiedCount} expired events`);
    res.json({ success: true, message: `Deactivated ${result.modifiedCount} expired events` });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export { MarketEvent };
export default router;