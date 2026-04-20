import mongoose from "mongoose";

const testimonialSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      // unique constraint removed — admin can add multiple reviews
    },
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 80,
    },
    role: {
      type: String,
      trim: true,
      maxlength: 80,
      default: "",
    },
    company: {
      type: String,
      trim: true,
      maxlength: 80,
      default: "",
    },
    avatar: {
      type: String,
      trim: true,
      maxlength: 5,
      default: "",
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    preview: {
      type: String,
      required: true,
      trim: true,
      maxlength: 300,
    },
    fullText: {
      type: String,
      required: true,
      trim: true,
      maxlength: 2000,
    },
    tag: {
      type: String,
      trim: true,
      maxlength: 40,
      default: "General",
    },
    source: {
      type: String,
      trim: true,
      maxlength: 60,
      default: "InvestBeans",
    },
    approved: {
      type: Boolean,
      default: true, // auto-approved since profanity is filtered before saving
    },
  },
  { timestamps: true }
);

export const Testimonial = mongoose.model("Testimonial", testimonialSchema);