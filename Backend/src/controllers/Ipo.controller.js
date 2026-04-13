import { IPO } from "../models/Ipo.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { uploadOnCloudinary, deleteFromCloudinary } from "../utils/cloudinary.js";

// ─── helper: parse subscription multiplier for sorting ─────────────────────
// "76.34x" → 76.34,  "2.5x" → 2.5,  "" → 0
function parseSubscription(str) {
  if (!str) return 0;
  const v = parseFloat(str.replace(/[^0-9.]/g, ""));
  return isNaN(v) ? 0 : v;
}

// GET /api/v1/ipo?status=open&search=tata&sort=gmp&category=SME
const getAllIPOs = asyncHandler(async (req, res) => {
  const { status, search, sort, category } = req.query;
  const filter = {};

  if (status && ["upcoming","open","closed"].includes(status)) {
    filter.status = status;
  }
  if (search?.trim()) {
    filter.$or = [
      { companyName: { $regex: search.trim(), $options: "i" } },
      { industry:    { $regex: search.trim(), $options: "i" } },
    ];
  }
  if (category && ["Mainboard","SME"].includes(category)) {
    filter.category = category;
  }

  // sort=subscribed is handled in-memory after fetch (string field)
  let sortOption = { createdAt: -1 };
  if (sort === "gmp")    sortOption = { gmp: -1, createdAt: -1 };
  if (sort === "rating") sortOption = { rating: -1, createdAt: -1 };

  let ipos = await IPO.find(filter).sort(sortOption).lean();

  // In-memory sort by subscription multiplier (e.g. "76.34x")
  if (sort === "subscribed") {
    ipos = ipos.sort((a, b) =>
      parseSubscription(b.subscriptionStatus) - parseSubscription(a.subscriptionStatus)
    );
  }

  const counts = {
    open:     await IPO.countDocuments({ status: "open" }),
    upcoming: await IPO.countDocuments({ status: "upcoming" }),
    closed:   await IPO.countDocuments({ status: "closed" }),
    total:    await IPO.countDocuments(),
  };

  return res.status(200).json(new ApiResponse(200, { ipos, counts }, "IPOs fetched"));
});

// GET /api/v1/ipo/:id
const getIPOById = asyncHandler(async (req, res) => {
  const ipo = await IPO.findById(req.params.id).lean();
  if (!ipo) throw new ApiError(404, "IPO not found");
  return res.status(200).json(new ApiResponse(200, ipo, "IPO fetched"));
});

// POST /api/v1/ipo   (multipart/form-data — logo image optional)
const createIPO = asyncHandler(async (req, res) => {
  const {
    companyName, logoText, industry, status, category, exchange,
    openDate, closeDate, allotmentDate, refundDate, upiDate, listingDate,
    priceRange, lotSize, issueSize, minInvestment,
    subscriptionStatus, listingGain, gmp, rating, rhpLink, swot,
  } = req.body;

  // Validation
  if (!companyName?.trim())   throw new ApiError(400, "companyName is required");
  if (!openDate?.trim())      throw new ApiError(400, "openDate is required");
  if (!closeDate?.trim())     throw new ApiError(400, "closeDate is required");
  if (!priceRange?.trim())    throw new ApiError(400, "priceRange is required");
  if (!issueSize?.trim())     throw new ApiError(400, "issueSize is required");
  if (!minInvestment?.trim()) throw new ApiError(400, "minInvestment is required");
  if (!lotSize || isNaN(Number(lotSize)) || Number(lotSize) < 1)
    throw new ApiError(400, "lotSize must be a valid positive number");

  const validStatuses = ["upcoming","open","closed"];
  if (status && !validStatuses.includes(status))
    throw new ApiError(400, `Invalid status. Allowed: ${validStatuses.join(", ")}`);

  // ── Handle logo image upload ──────────────────────────────────────────────
  let logoUrl = "";
  let logoPublicId = "";

  if (req.file?.path) {
    const uploaded = await uploadOnCloudinary(req.file.path, "ipo-logos");
    if (uploaded) {
      logoUrl       = uploaded.secure_url;
      logoPublicId  = uploaded.public_id;
    }
  }

  // Parse swot safely (comes as JSON string from multipart)
  let swotData = { strengths: [], weaknesses: [], opportunities: [], threats: [] };
  if (swot) {
    try {
      const parsed = typeof swot === "string" ? JSON.parse(swot) : swot;
      swotData = {
        strengths:     Array.isArray(parsed.strengths)     ? parsed.strengths.filter(Boolean)     : [],
        weaknesses:    Array.isArray(parsed.weaknesses)    ? parsed.weaknesses.filter(Boolean)    : [],
        opportunities: Array.isArray(parsed.opportunities) ? parsed.opportunities.filter(Boolean) : [],
        threats:       Array.isArray(parsed.threats)       ? parsed.threats.filter(Boolean)       : [],
      };
    } catch (_) { /* keep defaults */ }
  }

  const ipo = await IPO.create({
    companyName:        companyName.trim(),
    logo:               logoText?.trim().toUpperCase().slice(0,2) || "",
    logoUrl,
    logoPublicId,
    industry:           industry?.trim() || "",
    status:             status || "upcoming",
    category:           category || "Mainboard",
    exchange:           exchange || "NSE / BSE",
    openDate:           openDate.trim(),
    closeDate:          closeDate.trim(),
    allotmentDate:      allotmentDate?.trim() || "",
    refundDate:         refundDate?.trim() || "",
    upiDate:            upiDate?.trim() || "",
    listingDate:        listingDate?.trim() || "",
    priceRange:         priceRange.trim(),
    lotSize:            Number(lotSize),
    issueSize:          issueSize.trim(),
    minInvestment:      minInvestment.trim(),
    subscriptionStatus: subscriptionStatus?.trim() || "",
    listingGain:        (listingGain !== undefined && listingGain !== "" && listingGain !== null && listingGain !== "0" && Number(listingGain) !== 0) ? Number(listingGain) : null,
    gmp:                (gmp !== undefined && gmp !== "" && gmp !== null && gmp !== "0" && Number(gmp) !== 0) ? Number(gmp) : null,
    rating:             rating ? Number(rating) : 3,
    rhpLink:            rhpLink?.trim() || "",
    swot:               swotData,
  });

  console.log("✅ IPO created:", ipo.companyName);
  return res.status(201).json(new ApiResponse(201, ipo, "IPO created successfully"));
});

// PUT /api/v1/ipo/:id   (multipart/form-data — logo image optional)
const updateIPO = asyncHandler(async (req, res) => {
  const ipo = await IPO.findById(req.params.id);
  if (!ipo) throw new ApiError(404, "IPO not found");

  if (req.body.status && !["upcoming","open","closed"].includes(req.body.status))
    throw new ApiError(400, "Invalid status. Allowed: upcoming, open, closed");

  // ── Handle new logo image upload ──────────────────────────────────────────
  if (req.file?.path) {
    // Delete old Cloudinary image if exists
    if (ipo.logoPublicId) {
      await deleteFromCloudinary(ipo.logoPublicId);
    }
    const uploaded = await uploadOnCloudinary(req.file.path, "ipo-logos");
    if (uploaded) {
      ipo.logoUrl      = uploaded.secure_url;
      ipo.logoPublicId = uploaded.public_id;
    }
  }

  // Plain scalar fields
  const fields = [
    "companyName","industry","status","category","exchange",
    "openDate","closeDate","allotmentDate","refundDate","upiDate","listingDate",
    "priceRange","lotSize","issueSize","minInvestment",
    "subscriptionStatus","listingGain","gmp","rating","rhpLink",
  ];

  // logoText → stored as ipo.logo (2-char initials)
  if (req.body.logoText !== undefined) {
    ipo.logo = req.body.logoText.trim().toUpperCase().slice(0, 2);
  }

  fields.forEach((f) => {
    if (req.body[f] === undefined) return;
    if (["lotSize","rating"].includes(f)) ipo[f] = Number(req.body[f]);
    else if (["listingGain","gmp"].includes(f))
      ipo[f] = (req.body[f] !== "" && req.body[f] !== null && req.body[f] !== "0" && Number(req.body[f]) !== 0) ? Number(req.body[f]) : null;
    else ipo[f] = req.body[f];
  });

  // Handle swot (may arrive as JSON string from multipart)
  if (req.body.swot) {
    try {
      const parsed = typeof req.body.swot === "string" ? JSON.parse(req.body.swot) : req.body.swot;
      ipo.swot = {
        strengths:     Array.isArray(parsed.strengths)     ? parsed.strengths.filter(Boolean)     : ipo.swot?.strengths     || [],
        weaknesses:    Array.isArray(parsed.weaknesses)    ? parsed.weaknesses.filter(Boolean)    : ipo.swot?.weaknesses    || [],
        opportunities: Array.isArray(parsed.opportunities) ? parsed.opportunities.filter(Boolean) : ipo.swot?.opportunities || [],
        threats:       Array.isArray(parsed.threats)       ? parsed.threats.filter(Boolean)       : ipo.swot?.threats       || [],
      };
    } catch (_) { /* keep existing swot */ }
  }

  await ipo.save();
  console.log("✅ IPO updated:", ipo.companyName);
  return res.status(200).json(new ApiResponse(200, ipo, "IPO updated successfully"));
});

// DELETE /api/v1/ipo/:id
const deleteIPO = asyncHandler(async (req, res) => {
  const ipo = await IPO.findById(req.params.id);
  if (!ipo) throw new ApiError(404, "IPO not found");

  // Delete Cloudinary logo image if exists
  if (ipo.logoPublicId) {
    await deleteFromCloudinary(ipo.logoPublicId);
  }

  await ipo.deleteOne();
  console.log("✅ IPO deleted:", ipo.companyName);
  return res.status(200).json(new ApiResponse(200, { id: req.params.id }, "IPO deleted"));
});

export { getAllIPOs, getIPOById, createIPO, updateIPO, deleteIPO };