// controllers/beanOfWisdom.controller.js
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { BeanOfWisdom } from "../models/beanOfWisdom.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";

// Get all beans (public access)
const getAllBeansOfWisdom = asyncHandler(async (req, res) => {
    const beans = await BeanOfWisdom.find()
        .sort({ createdAt: -1 })
        .select("-__v");

    return res
        .status(200)
        .json(new ApiResponse(200, beans, "Beans of wisdom fetched successfully"));
});

// Get bean by ID (public access)
const getBeanOfWisdomById = asyncHandler(async (req, res) => {
    const { id } = req.params;

    if (!id || id.trim() === "") {
        throw new ApiError(400, "Invalid bean ID");
    }

    const bean = await BeanOfWisdom.findById(id).select("-__v");

    if (!bean) {
        throw new ApiError(404, "Bean of wisdom not found");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, bean, "Bean of wisdom fetched successfully"));
});

// Update bean (admin only)
const updateBeanOfWisdom = asyncHandler(async (req, res) => {
    const { id } = req.params;

    if (!id || id.trim() === "") {
        throw new ApiError(400, "Invalid bean ID");
    }

    const updateData = {};

    const fields = [
        'avatarText', 'title', 'subtitle', 'sectionTitle',
        'description', 'keyPrinciple', 'quote', 'insightTag', 'insightText', 'weekLabel'
    ];

    fields.forEach(field => {
        if (req.body[field] !== undefined) {
            updateData[field] = req.body[field].trim();
        }
    });

    if (req.body.tags !== undefined) {
        if (!Array.isArray(req.body.tags) || req.body.tags.length === 0) {
            throw new ApiError(400, "At least one tag is required");
        }
    
        for (const tag of req.body.tags) {
            if (tag.trim().length > 30) {
                throw new ApiError(400, "Each tag cannot exceed 30 characters");
            }
        }
        updateData.tags = req.body.tags.map(tag => tag.trim());
    }

    const bean = await BeanOfWisdom.findByIdAndUpdate(
        id,
        { $set: updateData },
        { new: true, runValidators: true }
    ).select("-__v");

    if (!bean) {
        throw new ApiError(404, "Bean of wisdom not found");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, bean, "Bean of wisdom updated successfully"));
});

// Delete bean (admin only)
const deleteBeanOfWisdom = asyncHandler(async (req, res) => {
    const { id } = req.params;

    if (!id || id.trim() === "") {
        throw new ApiError(400, "Invalid bean ID");
    }

    const bean = await BeanOfWisdom.findByIdAndDelete(id);

    if (!bean) {
        throw new ApiError(404, "Bean of wisdom not found");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, {}, "Bean of wisdom deleted successfully"));
});

// Get field limits (public access)
const getFieldLimits = asyncHandler(async (req, res) => {
    const limits = {
        avatarText: 10,
        title: 200,
        subtitle: 300,
        sectionTitle: 150,
        description: 600,
        keyPrinciple: 120,
        quote: 200,
        insightTag: 50,
        insightText: 350,
        weekLabel: 30,
        tags: 30, 
    };

    return res
        .status(200)
        .json(new ApiResponse(200, limits, "Field limits fetched successfully"));
});

// Check if bean exists (public access)
const checkBeanExists = asyncHandler(async (req, res) => {
    const bean = await BeanOfWisdom.findOne();
    
    return res
        .status(200)
        .json(new ApiResponse(200, { exists: !!bean, bean: bean || null }, "Bean existence checked"));
});

export {
    getAllBeansOfWisdom,
    getBeanOfWisdomById,
    updateBeanOfWisdom,
    deleteBeanOfWisdom,
    getFieldLimits,
    checkBeanExists,
};