import mongoose from "mongoose";

const productSchema = new mongoose.Schema({
  name: { type: String, default: "", required },
  version: [{ type: String, default: "" }],
  service: [{ name: String, Qty: String }],
  specification: { type: String },
  description: { type: String },
});

const Product = mongoose.model("Product", productSchema);

export default Product;
