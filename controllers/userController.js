import Client from "../models/clientModel.js";
import User from "../models/userModel.js";
import { capitalLetter, generateToken } from "../utils/helperFunction.js";

export const OldregisterUser = async (req, res) => {
  const { name, password, email, department } = req.body;
  try {
    if (!name || !password || !email)
      return res.status(400).json({ msg: "Please provide required values" });

    const type =
      req.user.type === "PestAdmin" ? "PestEmployee" : "ClientEmployee";
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
export const registerUser = async (req, res) => {
  const { name, email, role, type, password, department, client, rights } =
    req.body;
  try {
    if (!name || !password || !email)
      return res.status(400).json({ msg: "Please provide required values" });

    // const type =
    //   req.user.type === "PestEmployee" ? "PestEmployee" : "ClientEmployee";
    // let client = req.user.client;
    // if (req.user.role === "Admin") client = req.body.client.value;

    const userExists = await User.findOne({ email });
    if (userExists)
      return res.status(400).json({ msg: "Email id already exists" });
    console.log(type);
    let user;
    type === "PestEmployee"
      ? (user = await User.create({
          name: capitalLetter(name),
          email,
          password,
          role,
          type,
          client,
          rights,
        }))
      : (user = await User.create({
          name: capitalLetter(name),
          email,
          password,
          role,
          type,
          department: capitalLetter(department),
          client,
          rights,
        }));

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
      return res.status(401).json({ msg: "Please provide required values" });

    const user = await User.findOne({ email });
    const director = await User.findOne({ email }).select("role");
    if (user && (await user.comparePassword(password))) {
      generateToken(res, user._id);

      return res.json({
        _id: user._id,
        name: user.name,
        role: user.role,
        type: user.type,
        department: user.department,
        client: user?.client,
        rights: user.rights,
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
  const { password, rights } = req.body;
  try {
    if (!id) return res.status(404).json({ msg: "id not available" });
    const user = await User.findById(id);
    if (!user) return res.status(404).json({ msg: "User not found" });

    if (password && password.trim() !== "") {
      if (password.length < 5) {
        return res
          .status(400)
          .json({ msg: "Password must be at least 5 characters" });
      }

      if (await user.comparePassword(password)) {
        return res.status(400).json({
          msg: "Please provide a new password, different from the old one",
        });
      }

      user.password = password;
    }
    if (
      rights &&
      typeof rights === "object" &&
      Object.keys(rights).length > 0
    ) {
      user.rights = {
        raise: rights.raise ?? user.rights?.raise ?? false,
        close: rights.close ?? user.rights?.close ?? false,
        scan_Scheduled:
          rights.scan_Scheduled ?? user.rights?.scan_Scheduled ?? false,
        scan_Unscheduled:
          rights.scan_Unscheduled ?? user.rights?.scan_Unscheduled ?? false,
        delete: rights.delete ?? user.rights?.delete ?? false,
        addData: rights.addData ?? user.rights?.addData ?? false,
      };
    }

    await user.save();
    return res.status(200).json({
      msg: "Employee updated successfully",
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        rights: user.rights,
      },
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ msg: "Server error, try again later" });
  }
};

export const deleteUser = async (req, res) => {
  const { id } = req.params;
  try {
    if (!req.user.rights.delete)
      return res.status(403).json({ msg: "You are not allowed to delete" });
    const user = await User.findById(id);
    if (!user) return res.status(400).json({ msg: "User not found" });

    await User.findByIdAndDelete(id);
    return res.json({ msg: "User has been deleted" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ msg: "Server error, try again later" });
  }
};

export const getSingleUser = async (req, res) => {
  const { id } = req.params;
  try {
    const user = await User.findById(id).select("-password");
    if (!user) return res.status(400).json({ msg: "User not found" });

    return res.status(200).json(user);
  } catch (error) {
    console.log("error", error);
    res.status(500).json({ msg: "Server error, try again later" });
  }
};
export const clientUsers = async (req, res) => {
  const { id } = req.params;
  
  try {
    if (req.user.role !== "ClientAdmin") {
      return res.status(403).json({ msg: "Access denied. Unauthorized role." });
    }

    const users = await User.find({ client: id }).select("-password");

    if (!users || users.length === 0) {
      return res.status(404).json({ msg: "No users found for this client." });
    }
    return res.status(200).json(users);

  } catch (error) {
    console.error("Error fetching client users:", error);
    return res.status(500).json({ msg: "Server error, try again later" });
  }
};
