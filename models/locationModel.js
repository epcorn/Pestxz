import mongoose from "mongoose";

const scheduleItemSchema = new mongoose.Schema(
  {
    date: { type: Date },
    completed: { type: Boolean, default: false },
    status: { type: String, default: "" },
    completedAt: { type: Date, default: null },
    completedBy: { type: String, default: null },
  },
  { _id: false },
);
const productEntrySchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
  productName: { type: String },
  versionId: { type: mongoose.Schema.Types.ObjectId },
  versionName: { type: String },
  frequency: { type: String, required: [true, "product frequency required"] },
  code: { type: String, required: [true, "product code required"] },
  qr: { type: String },
  serialNo: {
    type: String,
    unique: true,
    required: [true, "product serial no required"],
  },
  specification: { type: String },
  calibrations: [{ type: String }],
  schedule: [scheduleItemSchema],
});

const scopeConsumableSchema = new mongoose.Schema(
  {
    consumableId: { type: mongoose.Schema.Types.ObjectId },
    consumableName: { type: String },
    calibration: { type: String },
  },
  { _id: false },
);

const scopeSchema = new mongoose.Schema(
  {
    scopeId: { type: mongoose.Schema.Types.ObjectId },
    scopeName: { type: String },
    consumables: [scopeConsumableSchema],
  },
  { _id: false },
);

const serviceEntrySchema = new mongoose.Schema({
  serviceId: { type: mongoose.Schema.Types.ObjectId, ref: "Service" }, // adjust ref as needed
  serviceName: { type: String },
  frequency: { type: String },
  schedule: [scheduleItemSchema],
  scopes: [scopeSchema],
});

const locationSchema = new mongoose.Schema(
  {
    floor: { type: String, required: true },
    subLocation: { type: String },
    location: { type: String, required: true },
    qr: { type: String },
    qrCount: { type: Number, default: 0 }, //added for show count
    service: [serviceEntrySchema],
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

locationSchema.index({ client: 1, floor: 1, location: 1, subLocation: 1 });
locationSchema.index({ "product.productId": 1 });
locationSchema.index({ "product.schedule.date": 1 });
locationSchema.index({ "service.schedule.date": 1 });

const Location = mongoose.model("Location", locationSchema);
export default Location;
