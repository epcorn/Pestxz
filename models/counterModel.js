import mongoose from "mongoose";

const counterSchema = new mongoose.Schema({
  productCode: { type: String, required: true, unique: true },
  seq: { type: Number, default: 2 },
});

const Counter = mongoose.model("Counter", counterSchema);

export default Counter;
