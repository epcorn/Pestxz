import mongoose from "mongoose";

const casualSchema = new mongoose.Schema(
  {
    service: [
      {
        serviceId: { type: String },
        serviceName: { type: String },
        scopes: [Object],
        completed: { type: Boolean, default: false },
        completedAt: { type: Date, default: null },
        usedCalibration: { type: Object, default: {} },
        action: { type: Object, default: {} },
        comment: { type: Object, default: {} },
      },
    ],
    image: { type: [String], default: [] },
    user: {
      name: { type: String },
      id: { type: mongoose.Schema.Types.ObjectId },
    },
    pestCount: {
      type: Number,
      default: 0,
      max: [15, "Count cannot exceed 15"],
    },
    completedAt: { type: Date },
    type: { type: String, default: "casual" },
    status: { type: String, default: "Raise" },
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
  },
  { timestamps: true },
);

const Casual = mongoose.model("Casual", casualSchema);
export default Casual;
