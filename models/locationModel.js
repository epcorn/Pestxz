import mongoose from "mongoose";

const locationSchema = new mongoose.Schema(
  {
    floor: { type: String, required: true },
    subLocation: { type: String },
    location: { type: String, required: true },
    qr: { type: String },
    qrCount: { type: Number, default: 0 }, //added for show count
    service: { type: [Object], default: [] },
    product: [Object],
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
