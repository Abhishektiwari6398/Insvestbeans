// routes/insight.routes.js
// Fix: /:id route pe verifyJWT hatao — guest users bhi modal dekh sakein
// verifySubscription khud JWT check karta hai aur subscription verify karta hai
// Non-subscriber/guest ko modal dikhega, andar locked sections honge
//
// NEW: GET /events-banner — public endpoint for EventsView InsightBox
//      Returns latest published insight, no auth required.

import { Router } from "express";
import {
  createInsight, getAllInsights, getInsightById,
  updateInsight, deleteInsight, getAdminInsights,
  getInsightStats, togglePublishStatus, toggleLike,
  getEventsBanner,                         // ← NEW
} from "../controllers/insight.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { verifyAdmin } from "../middlewares/admin.middleware.js";
import { verifySubscription } from "../middlewares/Subscription.middleware.js";
import { validateInsight, validateMongoId } from "../middlewares/validation.middleware.js";
import {
  optionalAuth,
  checkSubscription,
} from "../middlewares/Stripinsightfornonsubscriber.middleware.js";

const router = Router();

// ── Public list ──────────────────────────────────────────────────────────────
router.route("/").get(optionalAuth, checkSubscription, getAllInsights);

// ── Admin routes ─────────────────────────────────────────────────────────────
router.route("/admin/create").post(verifyJWT, verifyAdmin, validateInsight, createInsight);
router.route("/admin/all").get(verifyJWT, verifyAdmin, getAdminInsights);
router.route("/admin/stats").get(verifyJWT, verifyAdmin, getInsightStats);

router.route("/admin/:id")
  .put(verifyJWT, verifyAdmin, validateMongoId("id"), validateInsight, updateInsight)
  .delete(verifyJWT, verifyAdmin, validateMongoId("id"), deleteInsight);

router.route("/admin/:id/toggle-publish")
  .patch(verifyJWT, verifyAdmin, validateMongoId("id"), togglePublishStatus);

// ── NEW: Events page banner — public, no auth needed ─────────────────────────
// IMPORTANT: This route MUST appear before /:id to avoid the literal string
// "events-banner" being treated as a MongoDB ObjectId, which would throw a
// CastError. Express matches routes in order — always put specific paths first.
router.route("/events-banner").get(getEventsBanner);

// ── Like — login required ─────────────────────────────────────────────────────
router.route("/:id/like").post(verifyJWT, validateMongoId("id"), toggleLike);

// ── Single insight — optionalAuth so guest + non-subscriber see modal ─────────
router.route("/:id").get(optionalAuth, verifySubscription, validateMongoId("id"), getInsightById);

export default router;