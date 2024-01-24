import User from "../models/userModel.js";
import { capitalLetter, generateToken } from "../utils/helperFunction.js";

export const registerUser = async (req, res) => {
  const { name, password, email, department } = req.body;
  try {
    if (!name || !password || !email)
      return res.status(400).json({ msg: "Please provide required values" });

    const type = req.user.type;
    let client = req.user.client;
    if (req.user.role === "Admin") client = req.body.client.value;

    const userExists = await User.findOne({ email });
    if (userExists)
      return res.status(400).json({ msg: "Email id already exists" });

    const user = await User.create({
      name: capitalLetter(name),
      email,
      password,
      role: req.user.role === "Admin" ? "PestEmployee" : "ClientEmployee",
      department: capitalLetter(department),
      type,
      client,
    });

    return res.status(201).json({ msg: `${user.name} is created` });
  } catch (error) {
    console.log(error);
    res.status(500).json({ msg: "Server error, try again later" });
  }
};

export const loginUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    if (!email || !password)
      return res.status(400).json({ msg: "Please provide required values" });

    const user = await User.findOne({ email });
    if (user && (await user.comparePassword(password))) {
      generateToken(res, user._id);

      return res.json({
        _id: user._id,
        name: user.name,
        role: user.role,
        type: user.type,
      });
    } else res.status(400).json({ msg: "Invalid credentials" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ msg: "Server error, try again later" });
  }
};

export const logoutUser = async (req, res) => {
  res.cookie("token", "", {
    httpOnly: true,
    expires: new Date(0),
  });
  res.status(200).json({ msg: "Logged out successfully" });
};

export const getAllUser = async (req, res) => {
  let query = {};
  if (req.user.role === "ClientAdmin") {
    query.client = req.user.client;
    query.type = "ClientEmployee";
  } else if (req.user.role === "Admin") {
    query.type = "PestEmployee";
  }
  try {
    const users = await User.find(query)
      .select("-password")
      .populate({ path: "client", select: "name" });
    return res.json(users);
  } catch (error) {
    console.log(error);
    res.status(500).json({ msg: "Server error, try again later" });
  }
};

export const passwordChange = async (req, res) => {
  const { id } = req.params;
  const { password } = req.body;
  try {
    if (!password || password.length < 5)
      return res
        .status(400)
        .json({ msg: "Password must be at least 5 characters" });

    const user = await User.findById(id);
    if (!user) return res.status(400).json({ msg: "User not found" });
    if (await user.comparePassword(password)) {
      return res.status(400).json({ msg: "Please provide new password" });
    }

    user.password = password;
    await user.save();

    return res.json({ msg: "Password updated successfully" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ msg: "Server error, try again later" });
  }
};

export const deleteUser = async (req, res) => {
  const { id } = req.params;
  try {
    const user = await User.findById(id);
    if (!user) return res.status(400).json({ msg: "User not found" });

    await User.findByIdAndDelete(id);
    return res.json({ msg: "User has been deleted" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ msg: "Server error, try again later" });
  }
};
