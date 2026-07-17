import mongoose from "mongoose";

const serviceSchema = new mongoose.Schema(
  {
    type: { type: String, enum: ["Regular", "Complaint"], default: "Regular" },
    complaintDetails: {
      number: { type: String },
      service: { type: Array },
      status: { type: String },
      clientName: { type: String },
      userName: { type: String },
      image: [String],
      comment: { type: String },
      reopenCount: {
        type: Number,
        default: 0,
      },

      finalClosed: {
        type: Boolean,
        default: false,
      },

      assignedTo: {
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          default: null,
        },
        userName: { type: String, default: null },
        status: { type: Boolean, default: false },
        date: { type: Date },
      },
      assignedBy: {
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          default: null,
        },
        userName: { type: String, default: null },
        date: { type: Date, default: null },
      },
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
        serviceId: { type: String },
        serviceName: { type: String },
        frequency: { type: String },
        serviceDate: { type: String },
        schedule: [],
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
        userName: { type: String },
        completedAt: { type: Date },
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

serviceSchema.index({ location: 1, createdAt: -1 });
serviceSchema.index({ client: 1, createdAt: -1 });
serviceSchema.index({ type: 1, createdAt: -1 });
serviceSchema.index({
  "complaintDetails.assignedTo.userId": 1,
  "complaintDetails.status": -1,
});
serviceSchema.index({ "complaintDetails.status": 1 });

serviceSchema.pre("save", function (next) {
  if (this.type === "Regular") {
    this.complaintDetails = undefined;
    this.complaintUpdate = undefined;
  } else {
    this.regularService = undefined;
  }
  next();
});

serviceSchema.pre(["updateOne", "findOneAndUpdate"], function (next) {
  const update = this.getUpdate();
  if (update?.type === "Regular") {
    delete update.complaintDetails;
    delete update.complaintUpdate;
  } else if (update?.type === "Complaint") {
    delete update.regularService;
  }
  next();
});

const Service = mongoose.model("Service", serviceSchema);
export default Service;
