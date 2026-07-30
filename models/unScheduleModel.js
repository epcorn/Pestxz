import mongoose from "mongoose";

const unScheduleSchema = new mongoose.Schema(
  {
    type: { type: String, default: "Unscheduled" },
    read: { type: Boolean, default: false },

    service: [
      {
        serviceId: { type: String },
        serviceName: { type: String },
        scopes: [Object],
        usedCalibration: { type: Object, default: {} },
        action: { type: Object, default: {} },
        comment: { type: Object, default: {} },
        completionImages: { type: [String], default: [] },
      },
    ],
    pestCount: {
      type: Number,
      default: 0,
      max: [15, "Count cannot exceed 15"],
    },
    status: { type: String, default: "Pending" },
    comment: { type: String },
    image: { type: [String], default: [] },
    raisedBy: { id: { type: String }, user: { type: String } },
    approval: {
      status: { type: String, default: "Pending" },
      id: { type: mongoose.Schema.Types.ObjectId },
      name: { type: String, default: "" },
      date: { type: Date, default: null },
    },
    completedBy: {
      id: { type: mongoose.Schema.Types.ObjectId },
      name: { type: String, default: "" },
      date: { type: Date, default: null },
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
  },
  { timestamps: true },
);

export const Unscheduled = mongoose.model("unschedule", unScheduleSchema);
