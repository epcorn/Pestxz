import mongoose from "mongoose";

const productServiceSchema = mongoose.Schema(
  {
    quality: {
      status: { type: String, default: "ok", required: true },
      image: { type: String, default: "" },
    },
    product: {
      name: { type: String, default: "" },
      id: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
    },
    serialNo: { type: String, required: true, unique: true },
    version: {
      name: { type: String, default: "" },
      id: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
    },
    code: { type: String, default: "" },
    calibration: [mongoose.Schema.Types.Mixed],
    servicedBy: {
      name: { type: String, required: true },
      id: { type: mongoose.Schema.Types.ObjectId },
      date: { type: Date },
    },
    client: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Client",
      required: true,
    },
    location: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Location",
      required: true,
    },
    success: { type: Boolean, default: true },
  },
  { timestamps: true },
);

productServiceSchema.index({ location: 1, serialNo: 1, createdAt: -1 });
productServiceSchema.index({ client: 1, createdAt: -1 });
productServiceSchema.index({ "product.id": 1 });

const ProductService = mongoose.model("ProductService", productServiceSchema);

export default ProductService;
