/**
 * education.controller.js — v4
 *
 * CRITICAL FIX: PDF uploaded as image (PNG) instead of raw PDF
 * ─────────────────────────────────────────────────────────────
 * Root cause: uploadOnCloudinary utility hardcodes resource_type internally
 * and ignores the extra options we pass. Cloudinary was treating the PDF
 * as an image, converting page 1 to a PNG — that's why only 1 page
 * downloaded and the URL had /image/upload/... instead of /raw/upload/...
 *
 * Fix: call cloudinary.uploader.upload() DIRECTLY with resource_type: "raw"
 * inside uploadPdfToCloudinary — completely bypassing the utility wrapper.
 *
 * Place in: src/controllers/education.controller.js
 */

import mongoose from "mongoose";
import { v2 as cloudinary } from "cloudinary"; // ← direct Cloudinary SDK import
import fs from "fs";
import { asyncHandler }      from "../utils/asyncHandler.js";
import { ApiError }          from "../utils/ApiError.js";
import { ApiResponse }       from "../utils/ApiResponse.js";
import { EducationCategory } from "../models/Education.model.js";
import {
  uploadOnCloudinary,      // used only for IMAGE uploads (thumbnails)
  deleteFromCloudinary,    // used for image deletion
} from "../utils/cloudinary.js";

// ── Upload PDF directly with resource_type: "raw" ─────────────────────────────
// Does NOT use uploadOnCloudinary utility — that utility forces resource_type: image
// which converts PDFs to PNG (only page 1 visible on download)
async function uploadPdfToCloudinary(filePath, folder = "education/pdfs") {
  try {
    const result = await cloudinary.uploader.upload(filePath, {
      resource_type: "raw",   // ← CRITICAL: must be "raw" for PDF, not "image" or "auto"
      folder,
      type: "upload",         // explicitly "upload" not "authenticated"
      access_mode: "public",  // explicitly public — raw files are private by default
    });

    if (!result || !result.secure_url) {
      throw new ApiError(500, "Cloudinary PDF upload failed — no URL returned");
    }

    // Clean up temp file
    try { fs.unlinkSync(filePath); } catch (_) {}

    return result; // { secure_url, public_id, bytes, resource_type: "raw", ... }
  } catch (err) {
    // Clean up temp file even on error
    try { fs.unlinkSync(filePath); } catch (_) {}
    if (err instanceof ApiError) throw err;
    throw new ApiError(500, `Cloudinary PDF upload error: ${err.message}`);
  }
}

// ── Delete a Cloudinary asset ─────────────────────────────────────────────────
// resourceType: "image" for thumbnails, "raw" for PDFs
async function deleteCloudinaryAsset(publicId, resourceType = "image") {
  if (!publicId) return;
  try {
    await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
  } catch (e) {
    console.error(`Cloudinary delete failed for ${publicId} (${resourceType}):`, e.message);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// PUBLIC — list all categories (no modules)
// GET /api/v1/education/categories
// ─────────────────────────────────────────────────────────────────────────────
export const listCategories = asyncHandler(async (req, res) => {
  const cats = await EducationCategory.find({}, "-modules -whatYouLearn").lean();
  return res.status(200).json(
    new ApiResponse(200, { categories: cats, total: cats.length }, "Categories fetched")
  );
});

// ─────────────────────────────────────────────────────────────────────────────
// PUBLIC — get one full category + all modules (sorted by order)
// GET /api/v1/education/categories/:id
// ─────────────────────────────────────────────────────────────────────────────
export const getCategory = asyncHandler(async (req, res) => {
  const cat = await EducationCategory.findOne({ categoryId: req.params.id }).lean();
  if (!cat) throw new ApiError(404, "Category not found");

  cat.modules = (cat.modules || []).sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

  return res.status(200).json(new ApiResponse(200, cat, "Category fetched"));
});

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN — seed DB from static CATEGORY_DATA
// POST .../education/seed
// Requires app.js: express.json({ limit: "5mb" })
// ─────────────────────────────────────────────────────────────────────────────
export const seedCategories = asyncHandler(async (req, res) => {
  const { categories } = req.body;
  if (!categories || typeof categories !== "object") {
    throw new ApiError(400, "categories object is required");
  }

  const results = [];
  for (const [categoryId, data] of Object.entries(categories)) {
    const modules = (data.modules || []).map((m, i) => ({ ...m, order: i }));
    const doc = await EducationCategory.findOneAndUpdate(
      { categoryId },
      {
        $set: {
          categoryId,
          title:        data.title        || "",
          tag:          data.tag          || "Financial",
          isPaid:       data.isPaid       ?? false,
          accent:       data.accent       || "#3B82F6",
          accentGrad:   data.accentGrad   || "linear-gradient(135deg,#3B82F6,#4F46E5)",
          contentType:  data.contentType  || "ebook",
          description:  data.description  || "",
          whatYouLearn: data.whatYouLearn  || [],
          stats:        data.stats        || {},
          instructor:   data.instructor   || {},
          modules,
        },
      },
      { upsert: true, new: true }
    );
    results.push({ categoryId, moduleCount: doc.modules.length });
  }

  return res.status(200).json(
    new ApiResponse(200, { seeded: results, total: results.length }, `✅ Seeded ${results.length} categories`)
  );
});

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN — update category meta
// PATCH .../education/categories/:id
// ─────────────────────────────────────────────────────────────────────────────
export const updateCategoryMeta = asyncHandler(async (req, res) => {
  const ALLOWED = ["title", "description", "tag", "isPaid", "accent", "accentGrad", "contentType", "stats", "instructor", "whatYouLearn"];
  const update = {};
  for (const key of ALLOWED) {
    if (req.body[key] !== undefined) update[key] = req.body[key];
  }
  if (Object.keys(update).length === 0) throw new ApiError(400, "No valid fields provided");

  const cat = await EducationCategory.findOneAndUpdate(
    { categoryId: req.params.id },
    { $set: update },
    { new: true, runValidators: true }
  );
  if (!cat) throw new ApiError(404, "Category not found");
  return res.status(200).json(new ApiResponse(200, cat, "Category updated"));
});

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN — upload category thumbnail (IMAGE — uses existing utility, fine)
// POST .../education/categories/:id/thumbnail   field: "thumbnail"
// ─────────────────────────────────────────────────────────────────────────────
export const uploadCategoryThumbnail = asyncHandler(async (req, res) => {
  if (!req.file?.path) throw new ApiError(400, "Thumbnail image file is required");

  const cat = await EducationCategory.findOne({ categoryId: req.params.id });
  if (!cat) throw new ApiError(404, "Category not found");

  await deleteCloudinaryAsset(cat.thumbnailPublicId, "image");

  // Image upload — uploadOnCloudinary utility is fine here (resource_type: image)
  const uploaded = await uploadOnCloudinary(req.file.path, "education/thumbnails");
  if (!uploaded) throw new ApiError(500, "Cloudinary image upload failed");

  cat.thumbnail         = uploaded.secure_url;
  cat.thumbnailPublicId = uploaded.public_id;
  await cat.save();

  return res.status(200).json(new ApiResponse(200, { thumbnail: cat.thumbnail }, "Thumbnail uploaded"));
});

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN — delete category thumbnail
// DELETE .../education/categories/:id/thumbnail
// ─────────────────────────────────────────────────────────────────────────────
export const deleteCategoryThumbnail = asyncHandler(async (req, res) => {
  const cat = await EducationCategory.findOne({ categoryId: req.params.id });
  if (!cat) throw new ApiError(404, "Category not found");

  await deleteCloudinaryAsset(cat.thumbnailPublicId, "image");
  cat.thumbnail = undefined;
  cat.thumbnailPublicId = undefined;
  await cat.save();

  return res.status(200).json(new ApiResponse(200, {}, "Thumbnail deleted"));
});

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN — add a new module (with optional PDF upload via raw upload)
// POST .../education/categories/:id/modules
// Accepts multipart/form-data, optional field "pdf"
// ─────────────────────────────────────────────────────────────────────────────
export const addModule = asyncHandler(async (req, res) => {
  const cat = await EducationCategory.findOne({ categoryId: req.params.id });
  if (!cat) throw new ApiError(404, "Category not found");

  const {
    title, subtitle, description, level = "Beginner",
    isPaid, pages, videoUrl = "",
    highlights, previewTopics, chapters, pdfs,
  } = req.body;

  if (!title?.trim()) throw new ApiError(400, "Module title is required");

  const parseArray = (val) => {
    if (!val) return [];
    if (Array.isArray(val)) return val;
    try { return JSON.parse(val); } catch { return val.split(",").map(s => s.trim()).filter(Boolean); }
  };

  const defaultPages = cat.contentType === "video" ? "Video" : "PDF";

  const moduleData = {
    title:         title.trim(),
    subtitle:      (subtitle  || "").trim(),
    description:   (description || "").trim(),
    level,
    isPaid:        isPaid === "true" || isPaid === true,
    pages:         pages || defaultPages,
    videoUrl:      (videoUrl || "").trim(),
    highlights:    parseArray(highlights),
    previewTopics: parseArray(previewTopics),
    chapters:      parseArray(chapters),
    pdfs:          parseArray(pdfs),
  };

  // ── PDF upload — direct raw upload ────────────────────────────────────────
  if (req.file) {
    const uploaded = await uploadPdfToCloudinary(req.file.path);
    moduleData.pdfUrl      = uploaded.secure_url;
    moduleData.pdfPublicId = uploaded.public_id;
  }

  const maxOrder = cat.modules.length > 0
    ? Math.max(...cat.modules.map((m) => m.order ?? 0))
    : -1;

  cat.modules.push({ ...moduleData, order: maxOrder + 1 });
  cat.stats.modules = cat.modules.length;
  await cat.save();

  const added = cat.modules[cat.modules.length - 1];
  return res.status(201).json(new ApiResponse(201, added, "Module added"));
});

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN — edit a module (with optional new PDF upload)
// PATCH .../education/categories/:id/modules/:moduleId
// ─────────────────────────────────────────────────────────────────────────────
export const updateModule = asyncHandler(async (req, res) => {
  const { id: categoryId, moduleId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(moduleId)) throw new ApiError(400, "Invalid moduleId");

  const cat = await EducationCategory.findOne({ categoryId });
  if (!cat) throw new ApiError(404, "Category not found");

  const mod = cat.modules.id(moduleId);
  if (!mod) throw new ApiError(404, "Module not found");

  const EDITABLE = ["title", "subtitle", "description", "videoUrl", "level", "isPaid", "highlights", "previewTopics", "pages", "chapters", "pdfs"];

  const parseArray = (val) => {
    if (!val) return undefined;
    if (Array.isArray(val)) return val;
    try { return JSON.parse(val); } catch { return val.split(",").map(s => s.trim()).filter(Boolean); }
  };

  for (const field of EDITABLE) {
    if (req.body[field] !== undefined) {
      if (["highlights", "previewTopics", "chapters", "pdfs"].includes(field)) {
        const parsed = parseArray(req.body[field]);
        if (parsed !== undefined) mod[field] = parsed;
      } else if (field === "isPaid") {
        mod[field] = req.body[field] === "true" || req.body[field] === true;
      } else {
        mod[field] = req.body[field];
      }
    }
  }

  // ── New PDF upload — direct raw upload ────────────────────────────────────
  if (req.file) {
    await deleteCloudinaryAsset(mod.pdfPublicId, "raw");
    const uploaded = await uploadPdfToCloudinary(req.file.path);
    mod.pdfUrl      = uploaded.secure_url;
    mod.pdfPublicId = uploaded.public_id;
  }

  await cat.save();
  return res.status(200).json(new ApiResponse(200, mod, "Module updated"));
});

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN — upload / replace just the PDF for a module
// POST .../education/categories/:id/modules/:moduleId/pdf   field: "pdf"
// ─────────────────────────────────────────────────────────────────────────────
export const uploadModulePdf = asyncHandler(async (req, res) => {
  if (!req.file?.path) throw new ApiError(400, "PDF file is required");

  const { id: categoryId, moduleId } = req.params;
  if (!mongoose.Types.ObjectId.isValid(moduleId)) throw new ApiError(400, "Invalid moduleId");

  const cat = await EducationCategory.findOne({ categoryId });
  if (!cat) throw new ApiError(404, "Category not found");

  const mod = cat.modules.id(moduleId);
  if (!mod) throw new ApiError(404, "Module not found");

  // Delete old PDF (raw) from Cloudinary before uploading new one
  await deleteCloudinaryAsset(mod.pdfPublicId, "raw");

  const uploaded = await uploadPdfToCloudinary(req.file.path);
  mod.pdfUrl      = uploaded.secure_url;
  mod.pdfPublicId = uploaded.public_id;
  await cat.save();

  return res.status(200).json(
    new ApiResponse(200, { pdfUrl: mod.pdfUrl, pdfPublicId: mod.pdfPublicId }, "PDF uploaded successfully")
  );
});

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN — delete just the PDF for a module (keeps module, clears pdfUrl)
// DELETE .../education/categories/:id/modules/:moduleId/pdf
// ─────────────────────────────────────────────────────────────────────────────
export const deleteModulePdf = asyncHandler(async (req, res) => {
  const { id: categoryId, moduleId } = req.params;
  if (!mongoose.Types.ObjectId.isValid(moduleId)) throw new ApiError(400, "Invalid moduleId");

  const cat = await EducationCategory.findOne({ categoryId });
  if (!cat) throw new ApiError(404, "Category not found");

  const mod = cat.modules.id(moduleId);
  if (!mod) throw new ApiError(404, "Module not found");

  await deleteCloudinaryAsset(mod.pdfPublicId, "raw");
  mod.pdfPublicId = undefined;
  mod.pdfUrl      = "";
  await cat.save();

  return res.status(200).json(new ApiResponse(200, {}, "Module PDF deleted"));
});

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN — upload module thumbnail (IMAGE)
// POST .../education/categories/:id/modules/:moduleId/thumbnail   field: "thumbnail"
// ─────────────────────────────────────────────────────────────────────────────
export const uploadModuleThumbnail = asyncHandler(async (req, res) => {
  if (!req.file?.path) throw new ApiError(400, "Thumbnail image file is required");

  const { id: categoryId, moduleId } = req.params;
  if (!mongoose.Types.ObjectId.isValid(moduleId)) throw new ApiError(400, "Invalid moduleId");

  const cat = await EducationCategory.findOne({ categoryId });
  if (!cat) throw new ApiError(404, "Category not found");

  const mod = cat.modules.id(moduleId);
  if (!mod) throw new ApiError(404, "Module not found");

  await deleteCloudinaryAsset(mod.thumbnailPublicId, "image");

  const uploaded = await uploadOnCloudinary(req.file.path, "education/modules");
  if (!uploaded) throw new ApiError(500, "Cloudinary image upload failed");

  mod.thumbnail         = uploaded.secure_url;
  mod.thumbnailPublicId = uploaded.public_id;
  await cat.save();

  return res.status(200).json(new ApiResponse(200, { thumbnail: mod.thumbnail }, "Module thumbnail uploaded"));
});

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN — delete a module entirely (PDF + thumbnail removed from Cloudinary)
// DELETE .../education/categories/:id/modules/:moduleId
// ─────────────────────────────────────────────────────────────────────────────
export const deleteModule = asyncHandler(async (req, res) => {
  const { id: categoryId, moduleId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(moduleId)) throw new ApiError(400, "Invalid moduleId");

  const cat = await EducationCategory.findOne({ categoryId });
  if (!cat) throw new ApiError(404, "Category not found");

  const mod = cat.modules.id(moduleId);
  if (!mod) throw new ApiError(404, "Module not found");

  await deleteCloudinaryAsset(mod.pdfPublicId,       "raw");
  await deleteCloudinaryAsset(mod.thumbnailPublicId,  "image");

  mod.deleteOne();
  cat.stats.modules = cat.modules.length;
  await cat.save();

  return res.status(200).json(new ApiResponse(200, { totalModules: cat.modules.length }, "Module deleted"));
});

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN — add a PDF to a certification module's pdfs[] array
// POST .../education/categories/:id/modules/:moduleId/cert-pdfs
// field: "pdf" (file) + body: title, subtitle, isFreePreview
// ─────────────────────────────────────────────────────────────────────────────
export const addCertModulePdf = asyncHandler(async (req, res) => {
  if (!req.file?.path) throw new ApiError(400, "PDF file is required");

  const { id: categoryId, moduleId } = req.params;
  if (!mongoose.Types.ObjectId.isValid(moduleId)) throw new ApiError(400, "Invalid moduleId");

  const cat = await EducationCategory.findOne({ categoryId });
  if (!cat) throw new ApiError(404, "Category not found");

  const mod = cat.modules.id(moduleId);
  if (!mod) throw new ApiError(404, "Module not found");

  const { title, subtitle = "", isFreePreview } = req.body;
  if (!title?.trim()) throw new ApiError(400, "PDF title is required");

  // Upload PDF to Cloudinary as raw file
  const uploaded = await uploadPdfToCloudinary(req.file.path, "education/cert-pdfs");

  mod.pdfs.push({
    title:         title.trim(),
    subtitle:      subtitle.trim(),
    pdfUrl:        uploaded.secure_url,
    pdfPublicId:   uploaded.public_id,
    isFreePreview: isFreePreview === "true" || isFreePreview === true,
    isPaid:        !(isFreePreview === "true" || isFreePreview === true),
  });

  await cat.save();

  const addedPdf = mod.pdfs[mod.pdfs.length - 1];
  return res.status(201).json(new ApiResponse(201, addedPdf, "PDF added to certification module"));
});

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN — delete a specific PDF from a certification module's pdfs[] array
// DELETE .../education/categories/:id/modules/:moduleId/cert-pdfs/:pdfIndex
// pdfIndex: 0-based index into mod.pdfs array
// ─────────────────────────────────────────────────────────────────────────────
export const deleteCertModulePdf = asyncHandler(async (req, res) => {
  const { id: categoryId, moduleId, pdfIndex } = req.params;
  if (!mongoose.Types.ObjectId.isValid(moduleId)) throw new ApiError(400, "Invalid moduleId");

  const idx = parseInt(pdfIndex, 10);
  if (isNaN(idx) || idx < 0) throw new ApiError(400, "Invalid pdfIndex");

  const cat = await EducationCategory.findOne({ categoryId });
  if (!cat) throw new ApiError(404, "Category not found");

  const mod = cat.modules.id(moduleId);
  if (!mod) throw new ApiError(404, "Module not found");

  if (idx >= mod.pdfs.length) throw new ApiError(404, "PDF not found at that index");

  const pdfToDelete = mod.pdfs[idx];

  // Delete from Cloudinary (raw resource type for PDFs)
  await deleteCloudinaryAsset(pdfToDelete.pdfPublicId, "raw");

  // Remove from array
  mod.pdfs.splice(idx, 1);
  await cat.save();

  return res.status(200).json(new ApiResponse(200, { totalPdfs: mod.pdfs.length }, "PDF deleted from certification module"));
});

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN — reorder modules
// PATCH .../education/categories/:id/modules/reorder
// Body: { orderedIds: string[] }
// ─────────────────────────────────────────────────────────────────────────────
export const reorderModules = asyncHandler(async (req, res) => {
  const { orderedIds } = req.body;

  if (!Array.isArray(orderedIds) || orderedIds.length === 0) {
    throw new ApiError(400, "orderedIds must be a non-empty array");
  }

  const cat = await EducationCategory.findOne({ categoryId: req.params.id });
  if (!cat) throw new ApiError(404, "Category not found");

  const orderMap = {};
  orderedIds.forEach((id, idx) => { orderMap[id.toString()] = idx; });

  cat.modules.forEach((m) => {
    const key = m._id.toString();
    if (orderMap[key] !== undefined) m.order = orderMap[key];
  });

  await cat.save();

  const sorted = [...cat.modules].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  return res.status(200).json(new ApiResponse(200, { modules: sorted }, "Modules reordered"));
});