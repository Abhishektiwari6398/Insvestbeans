import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";

// Admin emails list - in production, store this in environment variables or database
export const ADMIN_EMAILS = [
    process.env.ADMIN_EMAIL_1,
    process.env.ADMIN_EMAIL_2,
    process.env.ADMIN_EMAIL_3,
    // Add more admin emails as needed
].filter(Boolean); // Remove undefined values

export const  verifyAdmin= asyncHandler(async (req, res, next) => {
    if (!req.user) {
        throw new ApiError(401, "Authentication required");
    }

    const userEmail = req.user.email?.toLowerCase();

    if (!ADMIN_EMAILS.includes(userEmail)) {
        throw new ApiError(403, "Access denied. Admin privileges required");
    }

    // Mark user as admin in request
    req.isAdmin = true;
    next();
});

// Optional middleware to check admin without throwing error
export const checkAdmin = asyncHandler(async (req, res, next) => {
    if (req.user) {
        const userEmail = req.user.email?.toLowerCase();
        req.isAdmin = ADMIN_EMAILS.includes(userEmail);
    } else {
        req.isAdmin = false;
    }
    next();
});