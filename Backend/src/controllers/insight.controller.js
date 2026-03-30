import { Insight } from "../models/insight.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

// ── Helper: calculate read time from structured insight object ───────────────
const calculateReadTime = (description, investBeansInsight) => {
  const avgWordsPerMinute = 200;
  const insightText =
    investBeansInsight && typeof investBeansInsight === "object"
      ? [
          investBeansInsight.summary || "",
          investBeansInsight.marketSignificance || "",
          investBeansInsight.impactArea || "",
          investBeansInsight.stocksImpacted || "",
          investBeansInsight.shortTermView || "",
          investBeansInsight.longTermView || "",
          investBeansInsight.keyRisk || "",
        ].join(" ")
      : String(investBeansInsight || "");

  const totalText = `${description || ""} ${insightText}`;
  const wordCount = totalText.split(/\s+/).filter(Boolean).length;
  const minutes   = Math.ceil(wordCount / avgWordsPerMinute);
  return `${minutes} min read`;
};

// ── Helper: validate structured insight fields ───────────────────────────────
const validateStructuredInsight = (ibi) => {
  if (!ibi || typeof ibi !== "object" || Array.isArray(ibi)) {
    throw new ApiError(400, "investBeansInsight must be an object");
  }
  const required = ["summary", "marketSignificance", "impactArea", "shortTermView", "longTermView", "keyRisk"];
  for (const field of required) {
    if (!ibi[field] || String(ibi[field]).trim() === "") {
      throw new ApiError(400, `investBeansInsight.${field} is required`);
    }
  }
  const score = Number(ibi.impactScore);
  if (isNaN(score) || score < 1 || score > 10) {
    throw new ApiError(400, "impactScore must be a number between 1 and 10");
  }
};

// ── Helper: sanitize structured insight ─────────────────────────────────────
const sanitizeInsight = (ibi) => ({
  summary:            String(ibi.summary || "").trim(),
  marketSignificance: String(ibi.marketSignificance || "").trim(),
  impactArea:         String(ibi.impactArea || "").trim(),
  stocksImpacted:     String(ibi.stocksImpacted || "").trim(),
  shortTermView:      String(ibi.shortTermView || "").trim(),
  longTermView:       String(ibi.longTermView || "").trim(),
  keyRisk:            String(ibi.keyRisk || "").trim(),
  impactScore:        Number(ibi.impactScore),
});

// ────────────────────────────────────────────────────────────────────────────
// @desc    Create new insight (Admin only)
// @route   POST /api/v1/insights/admin/create
// @access  Private (Admin)
// ────────────────────────────────────────────────────────────────────────────
export const createInsight = asyncHandler(async (req, res) => {
  const { title, description, investBeansInsight, credits, sentiment, category, marketType } = req.body;

  if (!title?.trim())          throw new ApiError(400, "Title is required");
  if (!description?.trim())    throw new ApiError(400, "Description is required");
  if (!credits?.source?.trim()) throw new ApiError(400, "Credit source is required");
  if (!category?.trim())       throw new ApiError(400, "Category is required");
  if (!marketType)             throw new ApiError(400, "Market type is required");

  const validMarketTypes = ["domestic", "global", "commodities"];
  if (!validMarketTypes.includes(marketType)) {
    throw new ApiError(400, `marketType must be one of: ${validMarketTypes.join(", ")}`);
  }

  validateStructuredInsight(investBeansInsight);
  const sanitizedInsight = sanitizeInsight(investBeansInsight);
  const readTime = calculateReadTime(description, sanitizedInsight);

  const insight = await Insight.create({
    title:              title.trim(),
    description:        description.trim(),
    investBeansInsight: sanitizedInsight,
    credits: {
      source: credits.source.trim(),
      author: credits.author?.trim() || "",
      url:    credits.url?.trim() || "",
    },
    sentiment:   sentiment || "neutral",
    category:    category.trim(),
    marketType,
    readTime,
    author:      req.user._id,
    publishedAt: new Date(),
  });

  return res.status(201).json(new ApiResponse(201, insight, "Insight created successfully"));
});

// ────────────────────────────────────────────────────────────────────────────
// @desc    Get all published insights (Public)
// @route   GET /api/v1/insights
// @access  Public
// ────────────────────────────────────────────────────────────────────────────
export const getAllInsights = asyncHandler(async (req, res) => {
  const { marketType, category, sentiment, limit = 100, page = 1, sort = "-publishedAt" } = req.query;

  const query = { isPublished: true };
  if (marketType) query.marketType = marketType;
  if (category)   query.category   = category;
  if (sentiment)  query.sentiment  = sentiment;

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const insights = await Insight.find(query)
    .sort(sort).limit(parseInt(limit)).skip(skip)
    .select("-viewedBy -viewedIPs")
    .lean();

  const userId = req.user?._id;
  const processedInsights = insights.map((insight) => {
    const obj = { ...insight };
    obj.isLiked =
      userId && Array.isArray(obj.likedBy)
        ? obj.likedBy.some((id) => id.toString() === userId.toString())
        : false;
    delete obj.likedBy;
    return obj;
  });

  const total = await Insight.countDocuments(query);

  return res.status(200).json(
    new ApiResponse(200, {
      insights: processedInsights,
      pagination: { total, page: parseInt(page), limit: parseInt(limit), totalPages: Math.ceil(total / parseInt(limit)) },
    }, "Insights fetched successfully")
  );
});

// ────────────────────────────────────────────────────────────────────────────
// @desc    Get single insight by ID (Public)
// @route   GET /api/v1/insights/:id
// @access  Public
// ────────────────────────────────────────────────────────────────────────────
export const getInsightById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const insight = await Insight.findById(id).populate("author", "name email image");
  if (!insight) throw new ApiError(404, "Insight not found");

  const userId = req.user?._id || null;
  const ip =
    req.headers["x-forwarded-for"]?.split(",")[0]?.trim() ||
    req.socket?.remoteAddress ||
    null;

  await insight.incrementViews(userId, ip);

  const response = insight.toObject();
  response.isLiked =
    userId && Array.isArray(insight.likedBy)
      ? insight.likedBy.some((lid) => lid.toString() === userId.toString())
      : false;
  delete response.likedBy;
  delete response.viewedBy;
  delete response.viewedIPs;

  return res.status(200).json(new ApiResponse(200, response, "Insight fetched successfully"));
});

// ────────────────────────────────────────────────────────────────────────────
// @desc    Toggle like on insight
// @route   POST /api/v1/insights/:id/like
// @access  Private
// ────────────────────────────────────────────────────────────────────────────
export const toggleLike = asyncHandler(async (req, res) => {
  const { id }   = req.params;
  const userId   = req.user._id;

  const insight = await Insight.findById(id);
  if (!insight) throw new ApiError(404, "Insight not found");

  await insight.toggleLike(userId);

  const updated = await Insight.findById(id);
  if (!updated) throw new ApiError(404, "Insight not found after update");

  const isLiked = Array.isArray(updated.likedBy)
    ? updated.likedBy.some((lid) => lid.toString() === userId.toString())
    : false;

  return res.status(200).json(
    new ApiResponse(200, { likes: updated.likes, isLiked }, isLiked ? "Insight liked" : "Insight unliked")
  );
});

// ────────────────────────────────────────────────────────────────────────────
// @desc    Update insight (Admin only)
// @route   PUT /api/v1/insights/admin/:id
// @access  Private (Admin)
// ────────────────────────────────────────────────────────────────────────────
export const updateInsight = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { title, description, investBeansInsight, credits, sentiment, category, marketType } = req.body;

  const insight = await Insight.findById(id);
  if (!insight) throw new ApiError(404, "Insight not found");

  if (marketType) {
    const validMarketTypes = ["domestic", "global", "commodities"];
    if (!validMarketTypes.includes(marketType)) {
      throw new ApiError(400, `marketType must be one of: ${validMarketTypes.join(", ")}`);
    }
  }

  if (title)       insight.title       = title.trim();
  if (description) insight.description = description.trim();
  if (sentiment)   insight.sentiment   = sentiment;
  if (category)    insight.category    = category.trim();
  if (marketType)  insight.marketType  = marketType;

  if (credits) {
    insight.credits = {
      source:        credits.source?.trim()  || insight.credits.source,
      author:        credits.author?.trim()  || insight.credits.author,
      url:           credits.url?.trim()     || insight.credits.url,
      publishedDate: insight.credits.publishedDate,
    };
  }

  if (investBeansInsight) {
    validateStructuredInsight(investBeansInsight);
    insight.investBeansInsight = sanitizeInsight(investBeansInsight);
  }

  if (description || investBeansInsight) {
    insight.readTime = calculateReadTime(
      description || insight.description,
      insight.investBeansInsight
    );
  }

  await insight.save();

  return res.status(200).json(new ApiResponse(200, insight, "Insight updated successfully"));
});

// ────────────────────────────────────────────────────────────────────────────
// @desc    Delete insight (Admin only)
// @route   DELETE /api/v1/insights/admin/:id
// @access  Private (Admin)
// ────────────────────────────────────────────────────────────────────────────
export const deleteInsight = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const insight = await Insight.findById(id);
  if (!insight) throw new ApiError(404, "Insight not found");

  await insight.deleteOne();

  return res.status(200).json(new ApiResponse(200, {}, "Insight deleted successfully"));
});

// ────────────────────────────────────────────────────────────────────────────
// @desc    Get all insights for admin (Admin only)
// @route   GET /api/v1/insights/admin/all
// @access  Private (Admin)
// ────────────────────────────────────────────────────────────────────────────
export const getAdminInsights = asyncHandler(async (req, res) => {
  const { marketType, category, sentiment, limit = 100, page = 1, sort = "-createdAt" } = req.query;

  const query = {};
  if (marketType) query.marketType = marketType;
  if (category)   query.category   = category;
  if (sentiment)  query.sentiment  = sentiment;

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const insights = await Insight.find(query)
    .sort(sort).limit(parseInt(limit)).skip(skip)
    .populate("author", "name email").lean();

  const total = await Insight.countDocuments(query);

  return res.status(200).json(
    new ApiResponse(200, {
      insights,
      pagination: { total, page: parseInt(page), limit: parseInt(limit), totalPages: Math.ceil(total / parseInt(limit)) },
    }, "Admin insights fetched successfully")
  );
});

// ────────────────────────────────────────────────────────────────────────────
// @desc    Get insight statistics (Admin only)
// @route   GET /api/v1/insights/admin/stats
// @access  Private (Admin)
// ────────────────────────────────────────────────────────────────────────────
export const getInsightStats = asyncHandler(async (req, res) => {
  const totalInsights       = await Insight.countDocuments();
  const publishedInsights   = await Insight.countDocuments({ isPublished: true });
  const draftInsights       = await Insight.countDocuments({ isPublished: false });
  const domesticInsights    = await Insight.countDocuments({ marketType: "domestic",    isPublished: true });
  const globalInsights      = await Insight.countDocuments({ marketType: "global",      isPublished: true });
  const commoditiesInsights = await Insight.countDocuments({ marketType: "commodities", isPublished: true });

  const viewsResult = await Insight.aggregate([{ $group: { _id: null, totalViews: { $sum: "$views" } } }]);
  const totalViews  = viewsResult[0]?.totalViews || 0;

  const likesResult = await Insight.aggregate([{ $group: { _id: null, totalLikes: { $sum: "$likes" } } }]);
  const totalLikes  = likesResult[0]?.totalLikes || 0;

  const topInsights = await Insight.find({ isPublished: true })
    .sort("-views").limit(5).select("title views likes category marketType").lean();

  const categoryStats = await Insight.aggregate([
    { $match: { isPublished: true } },
    { $group: { _id: "$category", count: { $sum: 1 } } },
    { $sort: { count: -1 } },
  ]);

  const impactResult = await Insight.aggregate([
    { $match: { isPublished: true } },
    { $group: { _id: null, avgImpactScore: { $avg: "$investBeansInsight.impactScore" } } },
  ]);
  const avgImpactScore = impactResult[0]?.avgImpactScore
    ? parseFloat(impactResult[0].avgImpactScore.toFixed(1)) : 0;

  return res.status(200).json(
    new ApiResponse(200, {
      total: totalInsights, published: publishedInsights, drafts: draftInsights,
      domestic: domesticInsights, global: globalInsights, commodities: commoditiesInsights,
      totalViews, totalLikes, avgImpactScore, topInsights, categoryStats,
    }, "Statistics fetched successfully")
  );
});

// ────────────────────────────────────────────────────────────────────────────
// @desc    Toggle publish status (Admin only)
// @route   PATCH /api/v1/insights/admin/:id/toggle-publish
// @access  Private (Admin)
// ────────────────────────────────────────────────────────────────────────────
export const togglePublishStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const insight = await Insight.findById(id);
  if (!insight) throw new ApiError(404, "Insight not found");

  insight.isPublished = !insight.isPublished;
  await insight.save();

  return res.status(200).json(new ApiResponse(200, insight, "Publish status updated successfully"));
});

// ────────────────────────────────────────────────────────────────────────────
// @desc    Get latest published insight for the Events page banner (Public)
// @route   GET /api/v1/insights/events-banner
// @access  Public
//
// Returns exactly 1 insight — the most recently published one.
// Returns null data (not 404) when no insights are published yet,
// so the frontend can show a graceful empty state without throwing an error.
// ────────────────────────────────────────────────────────────────────────────
export const getEventsBanner = asyncHandler(async (req, res) => {
  const insight = await Insight.findOne({ isPublished: true })
    .sort({ publishedAt: -1 })
    .select(
      "title description investBeansInsight sentiment category marketType credits readTime publishedAt"
    )
    .lean();

  // Return null data instead of 404 — frontend handles empty state gracefully
  return res.status(200).json(
    new ApiResponse(
      200,
      insight ?? null,
      insight ? "Events banner insight fetched" : "No published insights available"
    )
  );
});