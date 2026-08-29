import mongoose from "mongoose";

// 1. Schema for ARSM (Audit Risk Scoring Matrix) Categories
const arsmCategorySchema = new mongoose.Schema({
  category: { type: String },
  points: { type: Number },
  achieved: { type: Number },
});

// 2. Schema for Individual Questions
const questionSchema = new mongoose.Schema({
  id: { type: String },
  question: { type: String },
  checks: { type: String, default: null }, // "Yes" or "No"
  comment: { type: String, default: "" },
  recommendation: { type: String, default: "" },
  images: [{ type: String }],
});

// 3. Schema for Sections (Handles regular question sections + ARSM section)
const sectionSchema = new mongoose.Schema({
  id: { type: String },
  sectionId: { type: String },
  section: { type: String },

  // Standard Question Sections
  questions: [questionSchema],

  // ARSM Matrix Specific Fields
  categories: [arsmCategorySchema],
  totalPoints: { type: Number },
  totalAchieved: { type: Number },

  // Section Summary
  summary: {
    yes: { type: Number, default: 0 },
    no: { type: Number, default: 0 },
    total: { type: Number, default: 0 },
    score: { type: Number, default: 0 },
  },
});

// 4. Main Audit Schema
const auditAssessSchema = new mongoose.Schema(
  {
    // Client Reference ID (populatable via 'Client' model)
    client: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Client",
      default: null,
    },
    clientType: { type: String, default: "old" },
    clientName: { type: String, default: null },
    site: { type: String, required: true },
    siteType: { type: String, required: true },
    inspectionDate: { type: Date },
    siteAddrss: { type: String },
    meetUp: { type: String },
    auditor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    sections: [sectionSchema],
    summary: {
      yes: { type: Number, default: 0 },
      no: { type: Number, default: 0 },
      total: { type: Number, default: 0 },
    },
  },
  { timestamps: true },
);

export const Audit = mongoose.model("Audit", auditAssessSchema);
