import mongoose from "mongoose";

const locationSchema = new mongoose.Schema(
  {
    floor: { type: String, required: true },
    subLocation: { type: String, required: true },
    location: { type: String, required: true },
    qr: { type: String },
    service: [Object],
    product: [Object],
    client: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Client",
      required: true,
    },
  },
  { timestamps: true }
);

const Location = mongoose.model("Location", locationSchema);
export default Location;
