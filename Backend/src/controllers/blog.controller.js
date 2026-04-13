import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Blog } from "../models/blog.model.js";
import { uploadOnCloudinary, deleteFromCloudinary } from "../utils/cloudinary.js";
import mongoose from "mongoose";


const parseCommaSeparated = (str) => {
    if (!str || typeof str !== 'string') return [];
    return str
        .split(',')
        .map(item => item.trim())
        .filter(item => item.length > 0);
};


const parseHeaderSections = (headerSectionsStr) => {
    if (!headerSectionsStr) return [];
    try {
        const parsed = JSON.parse(headerSectionsStr);
        return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
        console.error('Error parsing headerSections:', error);
        return [];
    }
};

// Create Blog (Admin Only)
const createBlog = asyncHandler(async (req, res) => {
    const { title, description, content, category, headerSections, tags } = req.body;

    // Validation
    if (!title || !title.trim()) {
        throw new ApiError(400, "Title is required");
    }
    if (!description || !description.trim()) {
        throw new ApiError(400, "Description is required");
    }
    if (!content || !content.trim()) {
        throw new ApiError(400, "Content is required");
    }
    if (!category || !category.trim()) {
        throw new ApiError(400, "Category is required");
    }

    // Check for blog image
    if (!req.file) {
        throw new ApiError(400, "Blog image is required");
    }

    // Upload image to cloudinary
    const imageUpload = await uploadOnCloudinary(req.file.path, "blogs");

    if (!imageUpload) {
        throw new ApiError(500, "Failed to upload image. Please try again");
    }

    // Parse headerSections and tags
    const parsedHeaderSections = parseHeaderSections(headerSections);
    const parsedTags = parseCommaSeparated(tags);

    // Create blog
    const blog = await Blog.create({
        title: title.trim(),
        description: description.trim(),
        content: content.trim(),
        category: category.trim(),
        headerSections: parsedHeaderSections,
        tags: parsedTags,
        blogImage: imageUpload.secure_url,
        cloudinaryPublicId: imageUpload.public_id,
        author: req.user._id
    });

    // Populate author details
    const createdBlog = await Blog.findById(blog._id)
        .populate('author', 'name email');

    if (!createdBlog) {
        throw new ApiError(500, "Failed to create blog. Please try again");
    }

    return res.status(201).json(
        new ApiResponse(201, createdBlog, "Blog created successfully")
    );
});

// Get All Blogs
const getAllBlogs = asyncHandler(async (req, res) => {
    const {
        search = '',
        category = '',
        page = 1,
        limit = 10,
        sort = 'desc',
        startDate,
        endDate,
        author
    } = req.query;

    const query = { isPublished: true };

    if (search) {
        query.$or = [
            { title: { $regex: search, $options: 'i' } },
            { description: { $regex: search, $options: 'i' } }
        ];
    }

    if (category && category !== 'all' && category !== 'All') {
        query.category = category;
    }

    if (startDate || endDate) {
        query.createdAt = {};
        if (startDate) {
            query.createdAt.$gte = new Date(startDate);
        }
        if (endDate) {
            const endDateTime = new Date(endDate);
            endDateTime.setHours(23, 59, 59, 999);
            query.createdAt.$lte = endDateTime;
        }
    }

    if (author && mongoose.Types.ObjectId.isValid(author)) {
        query.author = author;
    }

    const pageNumber = parseInt(page);
    const limitNumber = parseInt(limit);
    const skip = (pageNumber - 1) * limitNumber;
    const sortOrder = sort === 'asc' ? 1 : -1;

    const [blogs, totalBlogs] = await Promise.all([
        Blog.find(query)
            .populate('author', 'name email')
            .sort({ createdAt: sortOrder })
            .skip(skip)
            .limit(limitNumber)
            .lean(),
        Blog.countDocuments(query)
    ]);

    const totalPages = Math.ceil(totalBlogs / limitNumber);
    const hasNextPage = pageNumber < totalPages;
    const hasPrevPage = pageNumber > 1;

    return res.status(200).json(
        new ApiResponse(200, {
            blogs,
            pagination: {
                currentPage: pageNumber,
                totalPages,
                totalBlogs,
                limit: limitNumber,
                hasNextPage,
                hasPrevPage
            },
            filters: {
                search,
                category,
                sort,
                startDate,
                endDate
            }
        }, "Blogs fetched successfully")
    );
});


const getBlogById = asyncHandler(async (req, res) => {
    const { id } = req.params;

    let blog;

    // Try finding by ID first
    if (mongoose.Types.ObjectId.isValid(id)) {
        blog = await Blog.findById(id).populate('author', 'name email isAdmin');
    }

    // If not found, try slug
    if (!blog) {
        blog = await Blog.findOne({ slug: id }).populate('author', 'name email isAdmin');
    }

    if (!blog) {
        throw new ApiError(404, "Blog not found");
    }

    // Increment views
    blog.views += 1;
    await blog.save({ validateBeforeSave: false });

    return res.status(200).json(
        new ApiResponse(200, blog, "Blog fetched successfully")
    );
});

// Update Blog (Admin Only)
const updateBlog = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { title, description, content, category, isPublished, headerSections, tags } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new ApiError(400, "Invalid blog ID");
    }

    const blog = await Blog.findById(id);
    if (!blog) throw new ApiError(404, "Blog not found");

    if (title?.trim()) blog.title = title.trim();
    if (description?.trim()) blog.description = description.trim();
    if (content?.trim()) blog.content = content.trim();
    if (category?.trim()) blog.category = category.trim();
    if (typeof isPublished === "boolean") blog.isPublished = isPublished;
    
    if (headerSections !== undefined) {
        blog.headerSections = parseHeaderSections(headerSections);
    }
    if (tags !== undefined) {
        blog.tags = parseCommaSeparated(tags);
    }

    if (req.file) {
        if (blog.cloudinaryPublicId) {
            await deleteFromCloudinary(blog.cloudinaryPublicId);
        }

        const newImage = await uploadOnCloudinary(req.file.path, "blogs");
        if (!newImage) throw new ApiError(500, "Failed to upload new image");

        blog.blogImage = newImage.secure_url;
        blog.cloudinaryPublicId = newImage.public_id;
    }

    await blog.save();
    await blog.populate("author", "name email avatar");

    return res.status(200).json(
        new ApiResponse(200, blog, "Blog updated successfully")
    );
});

// Delete Blog (Admin Only)
const deleteBlog = asyncHandler(async (req, res) => {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new ApiError(400, "Invalid blog ID");
    }

    const blog = await Blog.findById(id);

    if (!blog) {
        throw new ApiError(404, "Blog not found");
    }

    if (blog.cloudinaryPublicId) {
        await deleteFromCloudinary(blog.cloudinaryPublicId);
    }

    await Blog.findByIdAndDelete(id);

    return res.status(200).json(
        new ApiResponse(200, {}, "Blog deleted successfully")
    );
});

// Get Admin Blogs
const getAdminBlogs = asyncHandler(async (req, res) => {
    const {
        search = '',
        category = '',
        page = 1,
        limit = 10,
        sort = 'desc',
        isPublished
    } = req.query;

    const query = {};

    if (search) {
        query.$or = [
            { title: { $regex: search, $options: 'i' } },
            { description: { $regex: search, $options: 'i' } }
        ];
    }

    if (category && category !== 'all' && category !== 'All') {
        query.category = category;
    }

    if (typeof isPublished !== 'undefined') {
        query.isPublished = isPublished === 'true';
    }

    const pageNumber = parseInt(page);
    const limitNumber = parseInt(limit);
    const skip = (pageNumber - 1) * limitNumber;
    const sortOrder = sort === 'asc' ? 1 : -1;

    const [blogs, totalBlogs] = await Promise.all([
        Blog.find(query)
            .populate('author', 'name email')
            .sort({ createdAt: sortOrder })
            .skip(skip)
            .limit(limitNumber)
            .lean(),
        Blog.countDocuments(query)
    ]);

    const totalPages = Math.ceil(totalBlogs / limitNumber);

    return res.status(200).json(
        new ApiResponse(200, {
            blogs,
            pagination: {
                currentPage: pageNumber,
                totalPages,
                totalBlogs,
                limit: limitNumber,
                hasNextPage: pageNumber < totalPages,
                hasPrevPage: pageNumber > 1
            }
        }, "Admin blogs fetched successfully")
    );
});

// Get Blog Statistics
const getBlogStats = asyncHandler(async (req, res) => {
    const [totalBlogs, publishedBlogs, totalViews, categoryStats] = await Promise.all([
        Blog.countDocuments(),
        Blog.countDocuments({ isPublished: true }),
        Blog.aggregate([
            { $group: { _id: null, totalViews: { $sum: "$views" } } }
        ]),
        Blog.aggregate([
            { $group: { _id: "$category", count: { $sum: 1 } } },
            { $sort: { count: -1 } }
        ])
    ]);

    return res.status(200).json(
        new ApiResponse(200, {
            totalBlogs,
            publishedBlogs,
            unpublishedBlogs: totalBlogs - publishedBlogs,
            totalViews: totalViews[0]?.totalViews || 0,
            categoryStats
        }, "Blog statistics fetched successfully")
    );
});

const toggleLike = asyncHandler(async (req, res) => {
    const blogId = req.params.id;
    const userId = req.user?._id;


 
    if (!userId) {
        throw new ApiError(401, "Please login to like this blog");
    }

  
    if (!mongoose.Types.ObjectId.isValid(blogId)) {
        throw new ApiError(400, "Invalid blog ID");
    }

 
    const blog = await Blog.findById(blogId);

    if (!blog) {
        throw new ApiError(404, "Blog not found");
    }

   


    const userIdString = userId.toString();
    const likedIndex = blog.likedBy.findIndex(id => id.toString() === userIdString);
    const alreadyLiked = likedIndex !== -1;

    console.log('Already Liked?', alreadyLiked);

    if (alreadyLiked) {
     
        blog.likes = Math.max(0, blog.likes - 1);
        blog.likedBy.splice(likedIndex, 1);
        console.log('UNLIKED - New likes:', blog.likes);
    } else {
    
        blog.likes = blog.likes + 1;
        blog.likedBy.push(userId);
        console.log('LIKED - New likes:', blog.likes);
    }

    // Save blog
    await blog.save({ validateBeforeSave: false });

    console.log('Blog saved successfully');
    console.log('====== TOGGLE LIKE COMPLETED ======');

    return res.status(200).json(
        new ApiResponse(200, {
            likes: blog.likes,
            isLiked: !alreadyLiked,
            likedBy: blog.likedBy.map(id => id.toString())
        }, `Blog ${alreadyLiked ? 'unliked' : 'liked'} successfully`)
    );
});

export {
    createBlog,
    getAllBlogs,
    getBlogById,
    updateBlog,
    deleteBlog,
    getAdminBlogs,
    getBlogStats,
    toggleLike
};