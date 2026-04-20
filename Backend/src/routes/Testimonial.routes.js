import { Router } from "express";
import {
  getAllTestimonials,
  getMyTestimonial,
  createTestimonial,
  updateTestimonial,
  deleteTestimonial,
} from "../controllers/Testimonial.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { verifyAdmin } from "../middlewares/admin.middleware.js";

const router = Router();


const requireLogin = (req, res, next) => {
  // Option A: valid Passport session (Google login)
  if (req.isAuthenticated && req.isAuthenticated()) return next();

  // Option B: valid JWT token (falls through to verifyJWT logic)
  const token =
    req.cookies?.accessToken ||
    req.header("Authorization")?.replace("Bearer ", "");

  if (token) {
    return verifyJWT(req, res, next);
  }

  return res.status(401).json({
    success: false,
    message: "Please log in to continue.",
  });
};


// Public
router.route("/").get(getAllTestimonials);
router.route("/my").get(requireLogin, getMyTestimonial);

// Admin only (JWT + verifyAdmin)
router.route("/").post(verifyJWT, verifyAdmin, createTestimonial);
router.route("/:id").put(verifyJWT, verifyAdmin, updateTestimonial);
router.route("/:id").delete(verifyJWT, verifyAdmin, deleteTestimonial);

export default router;