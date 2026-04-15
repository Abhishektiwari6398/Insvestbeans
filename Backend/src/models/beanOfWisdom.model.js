// models/beanOfWisdom.model.js
import mongoose from "mongoose";

const beanOfWisdomSchema = new mongoose.Schema(
    {
        avatarText: {
            type: String,
            required: [true, "Avatar text is required"],
            trim: true,
            maxlength: [10, "Avatar text cannot exceed 10 characters"],
        },
        title: {
            type: String,
            required: [true, "Title is required"],
            trim: true,
            maxlength: [200, "Title cannot exceed 200 characters"],
        },
        subtitle: {
            type: String,
            required: [true, "Subtitle is required"],
            trim: true,
            maxlength: [300, "Subtitle cannot exceed 300 characters"],
        },
        sectionTitle: {
            type: String,
            required: [true, "Section title is required"],
            trim: true,
            maxlength: [150, "Section title cannot exceed 150 characters"],
        },
        description: {
            type: String,
            required: [true, "Description is required"],
            trim: true,
            maxlength: [600, "Description cannot exceed 600 characters"],
        },
        keyPrinciple: {
            type: String,
            required: [true, "Key principle is required"],
            trim: true,
            maxlength: [150, "Key principle cannot exceed 150 characters"],
        },
        quote: {
            type: String,
            required: [true, "Quote is required"],
            trim: true,
            maxlength: [300, "Quote cannot exceed 300 characters"],
        },
        insightTag: {
            type: String,
            required: [true, "Insight tag is required"],
            trim: true,
            maxlength: [50, "Insight tag cannot exceed 50 characters"],
        },
        insightText: {
            type: String,
            required: [true, "Insight text is required"],
            trim: true,
            maxlength: [350, "Insight text cannot exceed 350 characters"],
        },
        weekLabel: {
            type: String,
            trim: true,
            maxlength: [30, "Week label cannot exceed 30 characters"],
        },
        tags: [
            {
                type: String,
                trim: true,
                maxlength: [30, "Tag cannot exceed 30 characters"],
            },
        ],
    },
    { timestamps: true }
);

export const BeanOfWisdom = mongoose.models.BeanOfWisdom || mongoose.model("BeanOfWisdom", beanOfWisdomSchema);