import mongoose from "mongoose";

const productSchema = new mongoose.Schema({
  name: { type: String, default: "", required: true },
  version: [
    {
      name: { type: String, default: "" },
      code: { type: String, default: "" },
      calibration: [{ type: String }],
    },
  ],
  specification: { type: String },
});

const Product = mongoose.model("Product", productSchema);

export default Product;
