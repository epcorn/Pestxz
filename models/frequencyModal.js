import mongoose from "mongoose";

const frequencySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
    },
  },
  { timestamps: true }
);

const Frequency = mongoose.model("Frequency", frequencySchema);

export default Frequency;
