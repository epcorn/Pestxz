import mongoose from "mongoose";

const serviceSchema = new mongoose.Schema({
  name: { type: String, required: true },
  type: { type: String, required: true },
});

const NewAdminSchema = new mongoose.Schema(
  {
    service: { type: serviceSchema, required: true },
  },
  { timeseries: true },
);

const NewAdmin = mongoose.model("NewAdmin", NewAdminSchema);

export default NewAdmin;
