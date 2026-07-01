import mongoose from "mongoose";

const scheduleItemSchema = new mongoose.Schema(
  {
    date: { type: Date },
    completed: { type: Boolean, default: false },
    status: { type: String },
    completedAt: { type: Date, default: null },
    completedBy: { type: String, default: "" },
  },
  { _id: false }, // schedule entries don't need their own _id
);
const productEntrySchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
  productName: { type: String },
  versionId: { type: mongoose.Schema.Types.ObjectId },
  versionName: { type: String },
  frequency: { type: String },
  code: { type: String },
  serialNo: { type: String },
  specification: { type: String },
  calibrations: [{ type: String }],
  schedule: [scheduleItemSchema],
});

const locationSchema = new mongoose.Schema(
  {
    floor: { type: String, required: true },
    subLocation: { type: String },
    location: { type: String, required: true },
    qr: { type: String },
    qrCount: { type: Number, default: 0 }, //added for show count
    service: { type: [Object], default: [] },
    product: [productEntrySchema],
    changes: [Object],
    client: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Client",
      required: true,
    },
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false,
    },
  },
  { timestamps: true },
);

const Location = mongoose.model("Location", locationSchema);
export default Location;
