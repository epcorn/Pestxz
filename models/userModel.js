import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { MONGOURL } from "../server.js";

const userSchema = new mongoose.Schema(
  {
    email: { type: String, required: true },
    password: { type: String, required: true },
    name: { type: String, required: true },
    phone: { type: String, required: true },
    type: {
      type: String,
      required: true,
      enum: ["Admin", "PestEmployee", "ClientEmployee"],
    },
    department: { type: String, required: false },
    qr: { type: String, default: "" },
    role: {
      type: String,
      required: true,
      enum: [
        "Admin",
        "Operator",
        "Supervisor",
        "TeamLeader",
        "BranchAdmin",
        "ClientAdmin",
        "ClientEmployee",
      ],
    },
    client: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Client",
      required: function () {
        return this.role !== "Admin";
      },
    },
    rights: {
      raise: { type: Boolean, default: false },
      close: { type: Boolean, default: false },
      scan_Scheduled: { type: Boolean, default: false },
      scan_Unscheduled: { type: Boolean, default: false },
      delete: { type: Boolean, default: false },
      addData: { type: Boolean, default: false },
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

userSchema.pre("save", async function () {
  if (!this.isModified("password")) return;
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

userSchema.methods.comparePassword = async function (password) {
  return await bcrypt.compare(password, this.password);
};

const User = mongoose.model("User", userSchema);
export default User;

export const createAdmin = async () => {
  const email = "vipul@epcorn.com",
    password = "12345",
    name = "vipul",
    role = "Admin",
    type = "PestEmployee",
    department = "Pest control",
    phone = "9999999999",
    rights = {
      raise: true,
      close: true,
      scan_Scheduled: true,
      scan_Unscheduled: true,
      delete: true,
    };
  try {
    const adminExists = await User.findOne({ email: email });
    if (adminExists) {
      console.log("Admin already exists!");
      return;
    }
    await User.create({
      name: name,
      email: email,
      password: password,
      role: role,
      type: type,
      phone: phone,
      department: department,
      rights: rights,
    });
    console.log("new admin created! ");
  } catch (error) {
    console.error("Error creating admin:", error);
  }
};
