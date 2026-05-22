import mongoose from "mongoose";

const serviceSchema = new mongoose.Schema(
  {
    type: { type: String, default: "Regular" },
    complaintDetails: {
      number: { type: String },
      service: { type: Array },
      status: { type: String },
      userName: { type: String },
      image: [String],
      comment: { type: String },
    },
    complaintUpdate: [
      {
        image: [String],
        comment: { type: String },
        userName: { type: String },
        status: { type: String },
        date: { type: Date },
      },
    ],
    regularService: [
      {
        serviceName: { type: String },
        scopeName: { type: String },
        consumableName: { type: String },

        calibration: { type: String },
        usedCalibration: { type: String },

        action: { type: String },
        comment: { type: String },

        image: { type: String },

        userName: { type: String },

        date: {
          type: Date,
          default: Date.now,
        },
      },
    ],
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

const Service = mongoose.model("Service", serviceSchema);
export default Service;
