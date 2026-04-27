/**
 * adminEducation.routes.js — v3
 *
 * CHANGES vs v2:
 *  1. Removed PDF minimum size (1 MB) — any PDF accepted
 *  2. multer PDF limit: 50 MB (unchanged)
 *  3. multer image limit: 5 MB (unchanged)
 *  4. All routes intact — reorder BEFORE :moduleId (Express ordering)
 */

import { Router }      from "express";
import multer          from "multer";
import path            from "path";
import os              from "os";
import { verifyJWT }   from "../middlewares/auth.middleware.js";
import { verifyAdmin } from "../middlewares/admin.middleware.js";
import {
  seedCategories,
  updateCategoryMeta,
  uploadCategoryThumbnail,
  deleteCategoryThumbnail,
  addModule,
  updateModule,
  uploadModulePdf,
  deleteModulePdf,
  uploadModuleThumbnail,
  deleteModule,
  reorderModules,
  addCertModulePdf,     // ← NEW: add PDF to cert module pdfs[]
  deleteCertModulePdf,  // ← NEW: delete PDF from cert module pdfs[]
} from "../controllers/education.controller.js";

const router = Router();

// ── multer storage ────────────────────────────────────────────────────────────
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, os.tmpdir()),
  filename:    (_req, file, cb) =>
    cb(null, `${Date.now()}-${Math.random().toString(36).slice(2)}${path.extname(file.originalname)}`),
});

const fileFilter = (req, file, cb) => {
  if (file.fieldname === "pdf") {
    if (file.mimetype === "application/pdf") return cb(null, true);
    return cb(new Error("Only PDF files are allowed for the 'pdf' field"), false);
  }
  if (file.fieldname === "thumbnail") {
    if (file.mimetype.startsWith("image/")) return cb(null, true);
    return cb(new Error("Only image files are allowed for the 'thumbnail' field"), false);
  }
  cb(new Error(`Unknown file field: ${file.fieldname}`), false);
};

// PDF: up to 50 MB (no minimum enforced — any valid PDF accepted)
const uploadPdf   = multer({ storage, fileFilter, limits: { fileSize: 50 * 1024 * 1024 } });
// Thumbnail images: up to 5 MB
const uploadImage = multer({ storage, fileFilter, limits: { fileSize: 5  * 1024 * 1024 } });

// ── Every route: authenticated + admin ───────────────────────────────────────
router.use(verifyJWT, verifyAdmin);

// ── Seed (one-time bulk import) ───────────────────────────────────────────────
// POST .../education/seed
router.post("/seed", seedCategories);

// ── Category meta ─────────────────────────────────────────────────────────────
// PATCH  .../education/categories/:id
router.patch("/categories/:id", updateCategoryMeta);

// POST   .../education/categories/:id/thumbnail
router.post(
  "/categories/:id/thumbnail",
  uploadImage.single("thumbnail"),
  uploadCategoryThumbnail
);
// DELETE .../education/categories/:id/thumbnail
router.delete("/categories/:id/thumbnail", deleteCategoryThumbnail);

// ── Modules ───────────────────────────────────────────────────────────────────

// POST .../education/categories/:id/modules   (with optional pdf file)
router.post(
  "/categories/:id/modules",
  uploadPdf.single("pdf"),
  addModule
);

// ⚠️ Reorder MUST be before :moduleId — Express matches top to bottom
// PATCH .../education/categories/:id/modules/reorder
router.patch("/categories/:id/modules/reorder", reorderModules);

// PATCH .../education/categories/:id/modules/:moduleId   (with optional new pdf)
router.patch(
  "/categories/:id/modules/:moduleId",
  uploadPdf.single("pdf"),
  updateModule
);

// POST   .../education/categories/:id/modules/:moduleId/pdf
router.post(
  "/categories/:id/modules/:moduleId/pdf",
  uploadPdf.single("pdf"),
  uploadModulePdf
);
// DELETE .../education/categories/:id/modules/:moduleId/pdf
router.delete("/categories/:id/modules/:moduleId/pdf", deleteModulePdf);

// POST   .../education/categories/:id/modules/:moduleId/thumbnail
router.post(
  "/categories/:id/modules/:moduleId/thumbnail",
  uploadImage.single("thumbnail"),
  uploadModuleThumbnail
);

// ── Certification module PDFs (pdfs[] array) ─────────────────────────────────
// POST   .../education/categories/:id/modules/:moduleId/cert-pdfs
// Adds a new PDF entry to mod.pdfs[] — used for certification content type
router.post(
  "/categories/:id/modules/:moduleId/cert-pdfs",
  uploadPdf.single("pdf"),
  addCertModulePdf
);

// DELETE .../education/categories/:id/modules/:moduleId/cert-pdfs/:pdfIndex
// Removes PDF at 0-based pdfIndex from mod.pdfs[] + deletes from Cloudinary
router.delete("/categories/:id/modules/:moduleId/cert-pdfs/:pdfIndex", deleteCertModulePdf);

// DELETE .../education/categories/:id/modules/:moduleId
router.delete("/categories/:id/modules/:moduleId", deleteModule);

export default router;