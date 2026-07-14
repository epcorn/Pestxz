import Client from "../models/clientModel.js";
import Location from "../models/locationModel.js";
import Service from "../models/serviceModel.js";
import User from "../models/userModel.js";
import { capitalLetter } from "../utils/helperFunction.js";

export const registerClient = async (req, res) => {
  const {
    name,
    address,
    contractNo,
    email,
    startDate,
    servicePeriod,
    endDate,
    phone,
    adminPass,
    adminName,
    prefDay,
    prefTime,
  } = req.body;
  try {
    if (
      !name ||
      !address ||
      !contractNo ||
      !email ||
      !startDate ||
      !endDate ||
      !phone
    )
      return res.status(400).json({ msg: "Please provide required values" });

    let capitalName = capitalLetter(name);

    const clientExists = await Client.findOne({
      $or: [{ name: capitalName }, { email }, { contractNo }],
    }).select("-adminPass -adminName");

    if (clientExists)
      return res.status(400).json({ msg: "Client already exists" });

    const client = await Client.create({
      name: capitalName,
      address,
      contractNo,
      email,
      phone,
      startDate,
      servicePeriod,
      endDate,
      adminName: adminName || "",
      adminPass: adminPass || "",
      prefDay: Array.isArray(prefDay) ? prefDay : [],
      prefTime: prefTime || "",
    });

    if (adminName)
      await User.create({
        email,
        name: adminName,
        phone,
        password: adminPass,
        role: "ClientAdmin",
        type: "ClientEmployee",
        client: client._id,
        rights: {
          raise: true,
          close: true,
        },
      });

    res.status(201).json({ msg: `${adminName} has been created` });
  } catch (error) {
    console.log(error);
    res.status(500).json({ msg: "Server error, try again later" });
  }
};

export const getAllClient = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const [clients, totalClients] = await Promise.all([
      Client.find().select("-adminPass -adminName").skip(skip).limit(limit),
      Client.countDocuments(),
    ]);
    if (!clients || clients.length === 0)
      return res.status(400).json({ msg: "clients not found" });

    return res.json({
      clients,
      pages: Math.ceil(totalClients / limit),
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ msg: "Server error, try again later" });
  }
};

export const getClient = async (req, res) => {
  const { id } = req.params;
  try {
    const client = await Client.findById(id).select("-adminPass -adminName");
    if (!client) return res.status(400).json({ msg: "client not found" });
    return res.status(200).json(client);
  } catch (error) {
    res.status(500).json({ msg: "Server error, try again later" });
  }
};

export const deleteClient = async (req, res) => {
  const { id } = req.params;
  try {
    if (!req.user.rights.delete)
      return res.status(403).json({ msg: "You are not allowed to delete" });
    const client = await Client.findById(id).select("-adminPass -adminName");
    if (!client) return res.status(404).json({ msg: "Client not found" });

    await Service.deleteMany({ client: id });
    await Location.deleteMany({ client: id });
    await User.deleteMany({ client: id });
    await Client.findByIdAndDelete(id);

    return res.json({ msg: "Client has been deleted" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ msg: "Server error, try again later" });
  }
};

export const updateClient = async (req, res) => {
  const { id } = req.params;
  const data = req.body;

  try {
    if (!req.user.rights.addData)
      return res.status(403).json({ msg: "You are not allowed to update" });

    const updatedClient = await Client.findByIdAndUpdate(
      id,
      {
        address: data.address,
        email: data.email,
        phone: data.phone,
      },
      {
        new: true,
        runValidators: true,
      },
    );

    if (!updatedClient) {
      return res.status(404).json({ msg: "Client not found" });
    }
    return res.status(200).json(updatedClient);
  } catch (error) {
    return res.status(500).json({ msg: "Server error", error: error.message });
  }
};
