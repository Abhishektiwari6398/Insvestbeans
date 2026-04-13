import mongoose from "mongoose";

const insightSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
      maxlength: [200, "Title cannot exceed 200 characters"],
    },
    description: {
      type: String,
      required: [true, "Description is required"],
      trim: true,
      maxlength: [1000, "Description cannot exceed 1000 characters"],
    },

    // ✅ Replaced plain string with structured object (Perfect Mobile Format)
    investBeansInsight: {
      summary: {
        type: String,
        required: [true, "Summary is required"],
        trim: true,
        maxlength: [500, "Summary cannot exceed 500 characters"],
      },
      marketSignificance: {
        type: String,
        required: [true, "Market Significance is required"],
        trim: true,
        maxlength: [600, "Market Significance cannot exceed 600 characters"],
      },
      impactArea: {
        type: String,
        required: [true, "Impact Area is required"],
        trim: true,
        maxlength: [300, "Impact Area cannot exceed 300 characters"],
      },
      stocksImpacted: {
        type: String,
        trim: true,
        maxlength: [500, "Stocks Impacted cannot exceed 500 characters"],
        default: "",
      },
      shortTermView: {
        type: String,
        required: [true, "Short-Term View is required"],
        trim: true,
        maxlength: [600, "Short-Term View cannot exceed 600 characters"],
      },
      longTermView: {
        type: String,
        required: [true, "Long-Term View is required"],
        trim: true,
        maxlength: [600, "Long-Term View cannot exceed 600 characters"],
      },
      keyRisk: {
        type: String,
        required: [true, "Key Risk is required"],
        trim: true,
        maxlength: [500, "Key Risk cannot exceed 500 characters"],
      },
      impactScore: {
        type: Number,
        required: [true, "Impact Score is required"],
        min: [1, "Impact Score must be at least 1"],
        max: [10, "Impact Score cannot exceed 10"],
        default: 5,
      },
    },

    credits: {
      source: {
        type: String,
        required: [true, "Credit source is required"],
        trim: true,
      },
      author: {
        type: String,
        trim: true,
      },
      url: {
        type: String,
        required: [true, "Source URL is required"],
        trim: true,
        validate: {
          validator: function (v) {
            return /^https?:\/\/.+/.test(v);
          },
          message: "Please provide a valid URL starting with http:// or https://",
        },
      },
      publishedDate: {
        type: Date,
        default: Date.now,
      },
    },

    sentiment: {
      type: String,
      enum: ["positive", "negative", "neutral"],
      default: "neutral",
    },
    category: {
      type: String,
      required: [true, "Category is required"],
      trim: true,
    },
    marketType: {
      type: String,
      enum: ["domestic", "global", "commodities"],
      required: [true, "Market type is required"],
    },
    views: {
      type: Number,
      default: 0,
    },
    // ✅ Tracks which logged-in users have already viewed (prevents duplicate counts)
    viewedBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    // ✅ Tracks guest IPs so they also can't inflate views on refresh
    viewedIPs: [
      {
        type: String,
        trim: true,
      },
    ],
    likes: {
      type: Number,
      default: 0,
    },
    likedBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    readTime: {
      type: String,
      default: "5 min read",
    },
    isPublished: {
      type: Boolean,
      default: true,
    },
    publishedAt: {
      type: Date,
      default: Date.now,
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for faster queries
insightSchema.index({ marketType: 1, isPublished: 1, publishedAt: -1 });
insightSchema.index({ category: 1 });
insightSchema.index({ sentiment: 1 });
insightSchema.index({ viewedBy: 1 });   // ✅ Fast lookup for dedup check


insightSchema.methods.incrementViews = function (userId, ip) {
  if (userId) {
    // Logged-in user: check viewedBy array
    const alreadyViewed = this.viewedBy.some(
      (id) => id.toString() === userId.toString()
    );
    if (alreadyViewed) return Promise.resolve(this); // ← no increment, no DB write
    this.viewedBy.push(userId);
  } else if (ip) {
    // Guest user: check viewedIPs array
    // Keep the list capped at 500 to avoid unbounded growth on popular posts
    if (this.viewedIPs.includes(ip)) return Promise.resolve(this);
    if (this.viewedIPs.length >= 500) this.viewedIPs.shift(); // drop oldest
    this.viewedIPs.push(ip);
  }

  this.views += 1;
  return this.save();
};

// Method to toggle like
insightSchema.methods.toggleLike = function (userId) {
  const userIdStr = userId.toString();
  const isLiked = this.likedBy.some((id) => id.toString() === userIdStr);

  if (isLiked) {
    this.likedBy = this.likedBy.filter((id) => id.toString() !== userIdStr);
    this.likes = Math.max(0, this.likes - 1);
  } else {
    this.likedBy.push(userId);
    this.likes += 1;
  }

  return this.save();
};

export const Insight = mongoose.model("Insight", insightSchema);