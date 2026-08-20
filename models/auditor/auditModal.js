import mongoose from "mongoose";

const sectionSchema = new mongoose.Schema({
  sectionId: String,
  section: String,
  questions: [
    { id: String, question: String, comment: String, recommendation: String },
  ],
  summary: {
    yes: { type: Number },
    no: { type: Number },
    total: { type: Number },
  },
});

const auditAssessSchema = new mongoose.Schema(
  {
    client: {
      type: mongoose.Schema.Types.ObjectId,
      name: String,
      ref: "Client",
    },
    site: { type: String },
    siteType: { type: String },
    auditor: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    inspectionDate: { type: Date },
    sections: [sectionSchema],
  },
  { timestamps: true },
);

export const Audit = mongoose.model("Audit", auditAssessSchema);
