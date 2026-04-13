import { Router } from "express";
import {
    createBlog,
    getAllBlogs,
    getBlogById,
    updateBlog,
    deleteBlog,
    getAdminBlogs,
    getBlogStats,
    toggleLike
} from "../controllers/blog.controller.js";
import { verifyJWT, verifyJWTOrSession } from "../middlewares/auth.middleware.js";
import { verifyAdmin } from "../middlewares/admin.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";

const router = Router();


router.route("/admin/create")
    .post(verifyJWT, verifyAdmin, upload.single("blogImage"), createBlog);
router.route("/admin/all")
    .get(verifyJWT, verifyAdmin, getAdminBlogs);

router.route("/admin/stats")
    .get(verifyJWT, verifyAdmin, getBlogStats);

router.route("/admin/:id")
    .put(verifyJWT, verifyAdmin, upload.single("blogImage"), updateBlog)
    .delete(verifyJWT, verifyAdmin, deleteBlog);
router.route("/")
    .get(getAllBlogs);

router.route("/:id")
    .get(getBlogById);
router.post('/:id/like', verifyJWTOrSession, toggleLike);







export default router;