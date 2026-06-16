import mongoose from "mongoose";

const casualSchema = new mongoose.Schema(
  {
    serviceId: { type: String },
    serviceName: { type: String },
    scopes: [
      {
        scopeId: { type: String },
        scopeName: { type: String },
        consumables: [
          {
            consumableId: String,
            consumableName: String,
            calibration: String,
            usedCalibration: String,
            action: String,
            comment: String,
          },
        ],
      },
    ],
    image: { type: [String], default: [] },
    user: {
      name: { type: String },
      id: { type: mongoose.Schema.Types.ObjectId },
    },
    completedAt: { type: Date },

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
