import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { MONGOURL } from "../server.js";

const userSchema = new mongoose.Schema(
  {
    email: { type: String, required: true },
    password: { type: String, required: true },
    name: { type: String, required: true },
    role: { type: String, required: true },
    type: { type: String, required: true },
    department: { type: String, required: true },
    client: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Client",
      required: function () {
        return this.role !== "Admin";
      },
    },
  },
  { timestamps: true },
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
    name = "Vipul",
    role = "Admin",
    type = "PestAdmin",
    department = "Pest control";
  try {
    // await mongoose.connect(MONGOURL);

    const adminExists = await User.findOne({ email: email });
    if (adminExists) {
      console.log("Admin already exists!");
      process.exit();
    }
    await User.create({
      name: name,
      email: email,
      password: password,
      role: role,
      type: type,
      department: department,
    });
    console.log("new admin created! ");
    process.exit();
  } catch (error) {
    console.error("Error creating admin:", error);
    process.exit(1);
  }
};
