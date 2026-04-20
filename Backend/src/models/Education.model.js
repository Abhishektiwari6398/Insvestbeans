/**
 * Education.model.js
 *
 * CHANGES vs original:
 *  1. ModuleSchema — added pdfPublicId field (to track Cloudinary raw asset for deletion)
 *  2. ModuleSchema — pdfUrl is now a full URL (Cloudinary secure_url), not a Supabase path
 *     (Supabase paths still work as-is for seeded data — no migration needed)
 *  3. ModuleSchema — added thumbnail / thumbnailPublicId fields at module level
 *  4. EducationCategorySchema — added thumbnail / thumbnailPublicId at category level
 *  5. PdfItemSchema — added pdfPublicId for individual PDFs inside certification modules
 *
 * Place in: src/models/Education.model.js
 */

import mongoose from "mongoose";

// ── Chapter (video tutorials) ─────────────────────────────────────────────────
const ChapterSchema = new mongoose.Schema(
  {
    title:    { type: String, required: true },
    ref:      { type: String, default: "" },   // "Part 1", "Week 1", timestamp ref, etc.
    duration: { type: String, default: "" },
    free:     { type: Boolean, default: false },
    videoUrl: { type: String, default: "" },
  },
  { _id: false }
);

// ── PDF item inside a certification module ────────────────────────────────────
const PdfItemSchema = new mongoose.Schema(
  {
    title:         { type: String, required: true },
    subtitle:      { type: String, default: "" },
    // pdfUrl: Cloudinary secure_url (new uploads) or Supabase path (seeded legacy)
    pdfUrl:        { type: String, default: "" },
    pdfPublicId:   { type: String, default: "" },  // Cloudinary public_id for deletion
    isFreePreview: { type: Boolean, default: false },
    isPaid:        { type: Boolean, default: false },
  },
  { _id: false }
);

// ── Single module (one PDF / one video session / one cert program) ────────────
const ModuleSchema = new mongoose.Schema(
  {
    title:         { type: String, required: true },
    subtitle:      { type: String, default: "" },
    description:   { type: String, default: "" },
    pages:         { type: String, default: "PDF" },
    level: {
      type: String,
      enum: ["Beginner", "Intermediate", "Advanced", "All Levels"],
      default: "Beginner",
    },
    isPaid:   { type: Boolean, default: false },

    // PDF asset — pdfUrl is Cloudinary secure_url for new uploads,
    //             or legacy Supabase relative path for seeded data
    pdfUrl:       { type: String, default: "" },
    pdfPublicId:  { type: String, default: "" },  // ← NEW: Cloudinary public_id (resource_type: raw)

    // Video link (YouTube / Vimeo URL — admin pastes link, no upload)
    videoUrl:     { type: String, default: "" },

    // Thumbnail image (optional, stored on Cloudinary)
    thumbnail:        { type: String, default: "" },
    thumbnailPublicId: { type: String, default: "" },

    highlights:    [{ type: String }],
    previewTopics: [{ type: String }],
    chapters:      [ChapterSchema],
    pdfs:          [PdfItemSchema],   // used for certification modules
    order:         { type: Number, default: 0 },
  },
  { timestamps: true }
);

// ── Instructor sub-doc ────────────────────────────────────────────────────────
const InstructorSchema = new mongoose.Schema(
  {
    name:   { type: String, default: "InvestBeans Research Team" },
    role:   { type: String, default: "NISM-Certified Experts" },
    avatar: { type: String, default: "📊" },
  },
  { _id: false }
);

// ── Stats sub-doc ─────────────────────────────────────────────────────────────
const StatsSchema = new mongoose.Schema(
  {
    rating:   { type: String, default: "4.9" },
    reviews:  { type: String, default: "0" },
    duration: { type: String, default: "" },
    modules:  { type: Number, default: 0 },
  },
  { _id: false }
);

// ── Main category document ────────────────────────────────────────────────────
const EducationCategorySchema = new mongoose.Schema(
  {
    categoryId:   { type: String, required: true, unique: true, index: true },
    title:        { type: String, required: true },
    tag:          { type: String, required: true },
    isPaid:       { type: Boolean, default: false },
    accent:       { type: String, default: "#3B82F6" },
    accentGrad:   { type: String, default: "linear-gradient(135deg,#3B82F6,#4F46E5)" },
    contentType: {
      type: String,
      enum: ["ebook", "video", "certification"],
      default: "ebook",
    },
    description:  { type: String, default: "" },
    whatYouLearn: [{ type: String }],
    stats:        { type: StatsSchema,      default: () => ({}) },
    instructor:   { type: InstructorSchema, default: () => ({}) },

    // Optional category-level thumbnail
    thumbnail:        { type: String, default: "" },
    thumbnailPublicId: { type: String, default: "" },

    modules: [ModuleSchema],
  },
  { timestamps: true }
);

// Keep stats.modules count in sync automatically on every save
EducationCategorySchema.pre("save", function (next) {
  this.stats.modules = this.modules.length;
  next();
});

export const EducationCategory = mongoose.model(
  "EducationCategory",
  EducationCategorySchema
);