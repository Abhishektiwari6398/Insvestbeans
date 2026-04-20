import { Testimonial } from "../models/Testimonial.model.js";

// ─────────────────────────────────────────────────────────────────────────────
//  PROFANITY FILTER
//  Extend this list as needed. Checks are case-insensitive.
// ─────────────────────────────────────────────────────────────────────────────
const BANNED_WORDS = [
  "fuck", "shit", "bitch", "asshole", "bastard", "cunt", "dick",
  "pussy", "nigga", "nigger", "faggot", "whore", "slut", "motherfucker",
  "rape", "retard", "chutiya", "madarchod", "bhenchod", "bhosdike",
  "gaandu", "randi", "harami", "saala", "kamina", "mc", "bc",
];

// ─────────────────────────────────────────────────────────────────────────────
//  AUTH HELPER — works with both Passport session AND JWT
// ─────────────────────────────────────────────────────────────────────────────
function getUser(req) {
  // Passport session populates req.user directly
  // JWT verifyJWT also populates req.user
  return req.user || null;
}

function containsProfanity(text) {
  if (!text) return false;
  const lower = text.toLowerCase();

  return BANNED_WORDS.some((word) => {
    // Full word match only — "mc" inside "platform cuts" will NOT trigger.
    // Uses negative lookbehind/lookahead so only standalone words are caught.
    const regex = new RegExp(`(?<![a-z0-9])${word}(?![a-z0-9])`, "i");
    return regex.test(lower);
  });
}

function checkAllFields(...fields) {
  return fields.some(containsProfanity);
}

// ─────────────────────────────────────────────────────────────────────────────
//  GET ALL TESTIMONIALS  (public)
// ─────────────────────────────────────────────────────────────────────────────
export const getAllTestimonials = async (req, res) => {
  const user = getUser(req);
  try {
    const testimonials = await Testimonial.find({ approved: true })
      .sort({ createdAt: -1 })
      .populate("user", "_id name email");

    return res.status(200).json({
      success: true,
      data: testimonials,
    });
  } catch (err) {
    console.error("getAllTestimonials error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
//  GET MY TESTIMONIAL  (logged-in user — to know if they already posted)
// ─────────────────────────────────────────────────────────────────────────────
export const getMyTestimonial = async (req, res) => {
  const user = getUser(req);
  try {
    const testimonial = await Testimonial.findOne({ user: user._id });
    return res.status(200).json({
      success: true,
      data: testimonial || null,
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
//  CREATE TESTIMONIAL  (logged-in user, once per user)
// ─────────────────────────────────────────────────────────────────────────────
export const createTestimonial = async (req, res) => {
  const user = getUser(req);
  try {
    const { name, role, company, rating, preview, fullText, tag, source } = req.body;

    // Validate required
    if (!name || !rating || !preview || !fullText) {
      return res.status(400).json({
        success: false,
        message: "Name, rating, preview, and full review are required.",
      });
    }

    // Profanity check
    if (checkAllFields(name, role, company, preview, fullText, tag)) {
      return res.status(400).json({
        success: false,
        message:
          "Your review contains inappropriate language. Please remove it and try again.",
      });
    }

    // Generate avatar initials from name
    const parts = name.trim().split(" ");
    const avatar =
      parts.length >= 2
        ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
        : name.slice(0, 2).toUpperCase();

    const testimonial = await Testimonial.create({
      user: user._id,
      name,
      role: role || "",
      company: company || "",
      avatar,
      rating: Number(rating),
      preview,
      fullText,
      tag: tag || "General",
      source: source || "InvestBeans",
    });

    return res.status(201).json({ success: true, data: testimonial });
  } catch (err) {
    console.error("createTestimonial error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
//  UPDATE TESTIMONIAL  (owner only)
// ─────────────────────────────────────────────────────────────────────────────
export const updateTestimonial = async (req, res) => {
  const user = getUser(req);
  try {
    const testimonial = await Testimonial.findById(req.params.id);
    if (!testimonial) {
      return res.status(404).json({ success: false, message: "Review not found." });
    }

    const { name, role, company, rating, preview, fullText, tag, source } = req.body;

    // Profanity check on new values
    if (checkAllFields(name, role, company, preview, fullText, tag)) {
      return res.status(400).json({
        success: false,
        message:
          "Your review contains inappropriate language. Please remove it and try again.",
      });
    }

    // Re-compute avatar if name changed
    let avatar = testimonial.avatar;
    if (name && name !== testimonial.name) {
      const parts = name.trim().split(" ");
      avatar =
        parts.length >= 2
          ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
          : name.slice(0, 2).toUpperCase();
    }

    if (name)     testimonial.name     = name;
    if (role !== undefined)    testimonial.role    = role;
    if (company !== undefined) testimonial.company = company;
    if (rating)   testimonial.rating   = Number(rating);
    if (preview)  testimonial.preview  = preview;
    if (fullText) testimonial.fullText = fullText;
    if (tag)      testimonial.tag      = tag;
    if (source)   testimonial.source   = source;
    testimonial.avatar = avatar;

    await testimonial.save();

    return res.status(200).json({ success: true, data: testimonial });
  } catch (err) {
    console.error("updateTestimonial error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
//  DELETE TESTIMONIAL  (admin only)
// ─────────────────────────────────────────────────────────────────────────────
export const deleteTestimonial = async (req, res) => {
  const user = getUser(req);
  try {
    const testimonial = await Testimonial.findById(req.params.id);
    if (!testimonial) {
      return res.status(404).json({ success: false, message: "Review not found." });
    }

    await testimonial.deleteOne();

    return res.status(200).json({ success: true, message: "Review deleted successfully." });
  } catch (err) {
    console.error("deleteTestimonial error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};