import mongoose from "mongoose";

const AdminSchema = new mongoose.Schema(
  {
    serviceType: { type: Object, required: true },
    serviceName: { type: Object, required: true },
  },
  { timestamps: true }
);

const Admin = mongoose.model("Admin", AdminSchema);
export default Admin;
