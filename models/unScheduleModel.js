import mongoose from "mongoose";

const unScheduleSchema = new mongoose.Schema(
  {
    type: { type: String, default: "Unscheduled" },
    read: { type: Boolean, default: false },
    serviceId: { type: String },
    serviceName: { type: String },
    serviceDate: { type: String },
    scopes: [Object],
    update: {
      comment: { type: String, default: "" },
      status: { type: String },
      user: { type: String },
      id: { type: String },
    },
    comment: { type: String },
    image: { type: [String], default: [] },
    raisedBy: { id: { type: String }, user: { type: String } },
    approval: {
      status: { type: String, default: "Pending" },
      id: { type: mongoose.Schema.Types.ObjectId },
      name: { type: String, default: "" },
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

export const Unscheduled = mongoose.model("unschedule", unScheduleSchema);
