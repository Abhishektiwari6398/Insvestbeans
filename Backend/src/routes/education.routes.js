// routes/education.routes.js
// Public-facing education routes — no auth required
//
// Register in app.js:
//   import educationRouter from "./routes/education.routes.js";
//   app.use("/api/v1/education", educationRouter);

import { Router } from "express";
import { listCategories, getCategory } from "../controllers/education.controller.js";

const router = Router();

// GET /api/v1/education/categories          → all category meta (no modules)
router.get("/categories", listCategories);

// GET /api/v1/education/categories/:id      → full category + all modules
router.get("/categories/:id", getCategory);

export default router;