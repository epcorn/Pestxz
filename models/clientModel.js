import mongoose from "mongoose";

const clientSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true },
    address: { type: String, required: true },
    contractNo: { type: String, required: true },
    phone: { type: String, required: true },

    startDate: { type: Date, required: true },
    servicePeriod: { type: String, required: true },
    endDate: { type: Date, required: true },
    prefDay: { type: [String], default: [] },
    prefTime: { type: String, default: "" },

    adminName: { type: String },
    adminPass: { type: String },

    reportURL: { type: String },
  },
  {
    timestamps: true,
    toObject: { virtuals: true },
    toJSON: { virtuals: true },
  },
);

clientSchema.statics.findSafe = function (query) {
  return this.findOne(query).select("-adminPass -adminName");
};

clientSchema.statics.findByIdSafe = function (id) {
  return this.findById(id).select("-adminPass -adminName");
};

clientSchema.statics.findSafeAll = function (query = {}) {
  return this.find(query).select("-adminPass -adminName");
};

clientSchema.virtual("services", {
  ref: "Service",
  localField: "_id",
  foreignField: "client",
  justOne: false,
});
clientSchema.virtual("unschedules", {
  ref: "unschedule",
  localField: "_id",
  foreignField: "client",
  justOne: false,
});
clientSchema.virtual("casuals", {
  ref: "Casual",
  localField: "_id",
  foreignField: "client",
  justOne: false,
});
clientSchema.virtual("locations", {
  ref: "Location",
  localField: "_id",
  foreignField: "client",
  justOne: false,
});

const Client = mongoose.model("Client", clientSchema);
export default Client;
