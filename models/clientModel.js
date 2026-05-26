import mongoose from "mongoose";

const clientSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true },
    address: { type: String, required: true },
    contractNo: { type: String, required: true },
    startDate: { type: String, required:true },
    endDate: { type: String, required:true },
    phone: { type: String, required:true },
  },
  {
    timestamps: true,
    toObject: { virtuals: true },
    toJSON: { virtuals: true },
  },
);

clientSchema.virtual("services", {
  ref: "Service",
  localField: "_id",
  foreignField: "client",
  justOne: false,
});

const Client = mongoose.model("Client", clientSchema);
export default Client;
