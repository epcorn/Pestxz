import Client from "../models/clientModel.js";
import Location from "../models/locationModel.js";
import Service from "../models/serviceModel.js";
import {
  capitalLetter,
  qrCodeGenerator,
  qrCodeGeneratorSVG,
  uploadFile,
} from "../utils/helperFunction.js";
import fs from "fs";

let locationId = null;
const internalRoles = [
  "Admin",
  "Operator",
  "Supervisor",
  "TeamLeader",
  "BranchAdmin",
];

export const addLocation = async (req, res) => {
  const { floor, subLocation, location, clientId, serviceReq } = req.body;

  try {
    const client = await Client.findById(clientId);
    if (!client) {
      return res.status(404).json({ msg: "Client not found" });
    }
    const locationExist = await Location.findOne({
      client: clientId,
      floor: { $regex: `^${floor}$`, $options: "i" },
      subLocation: { $regex: `^${subLocation || ""}$`, $options: "i" },
      location: { $regex: `^${location}$`, $options: "i" },
    });

    if (locationExist) {
      return res.status(400).json({
        msg: "Location already exist",
      });
    }

    const validServices = (serviceReq || []).filter(
      (service) =>
        service.serviceId &&
        service.serviceName &&
        Array.isArray(service.scopes) &&
        service.scopes.length > 0,
    );
    if (validServices.length < 1) {
      return res.status(400).json({
        msg: "Please add at least one valid service",
      });
    }

    const formattedServices = validServices.map((service) => ({
      serviceId: service.serviceId,
      serviceName: service.serviceName,
      frequency: service.frequency,
      scopes: service.scopes.map((scope) => ({
        scopeId: scope.scopeId,
        scopeName: scope.scopeName,
        consumables: (scope.consumables || []).map((consumable) => ({
          consumableId: consumable.consumableId,
          consumableName: consumable.consumableName,
          calibration: consumable.calibration,
        })),
      })),
    }));

    // CREATE LOCATION
    const newLocation = await Location.create({
      floor: capitalLetter(floor),
      subLocation: capitalLetter(subLocation || ""),
      location: capitalLetter(location),
      service: formattedServices,
      client: client._id,
    });
    const locationId = newLocation._id;

    // GENERATE QR
    const qrData = await qrCodeGenerator({
      link: `https://pestxz.onrender.com/location/${locationId}`,
      floor: newLocation.floor,
      location: `${newLocation.location}, ${newLocation.subLocation}`,
    });

    if (!qrData) {
      await Location.findByIdAndDelete(locationId);
      return res.status(400).json({
        msg: "QR generation error. Try again later",
      });
    }

    // SAVE TEMP QR
    fs.writeFileSync("./tmp/qr.jpeg", qrData);
    // UPLOAD QR
    const qrLink = await uploadFile({
      filePath: "./tmp/qr.jpeg",
    });

    if (!qrLink) {
      await Location.findByIdAndDelete(locationId);
      return res.status(400).json({
        msg: "QR upload error. Try again later",
      });
    }

    // SAVE QR
    newLocation.qr = qrLink;
    await newLocation.save();

    return res.status(201).json({
      msg: "Location added successfully",
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      msg: "Server error, try again later",
    });
  }
};

export const getAllLocations = async (req, res) => {
  const { id } = req.params;

  console.log(id);
  try {
    let clientId;
    // CASE 1: ClientEmployee → get client from token
    if (id === "ClientEmployee") {
      clientId = req.user.client;
    }
    // CASE 2: frontend sends LOCATION ID → derive client from it
    // else if (id.length === 24) {
    //   const location = await Location.findById(id).select("client");
    //   if (!location) {
    //     return res.status(404).json({ msg: "Location not found" });
    //   }
    //   clientId = location.client;
    // }
    // CASE 3: already clientId
    else {
      clientId = id;
    }
    // FIND CLIENT
    const client = await Client.findById(clientId);
    if (!client) {
      return res.status(404).json({ msg: "Client not found" });
    }
    // FIND ALL LOCATIONS OF THAT CLIENT
    const locations = await Location.find({ client: clientId });
    // UNIQUE FLOORS
    const floors = [...new Set(locations.map((l) => l.floor))];

    return res.json({
      client,
      clientName: client.name,
      locations,
      floors,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ msg: "Server error, try again later" });
  }
};

export const updateLocation = async (req, res) => {
  const { id } = req.params;
  try {
    const location = await Location.findById(id);
    if (!location) return res.status(404).json({ msg: "Location not found" });

    location.floor = req.body.floor;
    location.subLocation = req.body.subLocation;
    location.location = req.body.location;
    location.service = req.body.serviceReq;
    location.product = Array.isArray(req.body.product) ? req.body.product : [];

    await location.save();
    return res.json({ msg: "Updated successfully" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ msg: "Server error, try again later" });
  }
};

export const deleteLocation = async (req, res) => {
  const { id } = req.params;
  try {
    if (!req.user.rights.delete)
      return res.status(403).json({ msg: "You are not allowed to delete" });
    const location = await Location.findById(id);
    if (!location) return res.status(404).json({ msg: "Location not found" });

    await Service.deleteMany({ location: id });
    await Location.findByIdAndDelete(id);
    return res.json({ msg: "Location & all its records deleted" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ msg: "Server error, try again later" });
  }
};

export const getLocationDetails = async (req, res) => {
  const { id } = req.params;

  try {
    let location = await Location.findById(id);
    const client = await Client.findById(location.client);
    if (!location)
      return res.status(404).json({ msg: "Location not found, contact admin" });

    const isInternalUser = internalRoles.includes(req.user.role);
    const isSameClient =
      location.client.toString() === req.user.client?.toString();

    if (!isInternalUser && !isSameClient) {
      return res.status(401).json({
        msg: "You are not authorized",
      });
    }

    location.service = location.service.concat(location.product);

    const complaints = await Service.find({
      type: "Complaint",
      location: id,
      "complaintDetails.status": { $ne: "Close" },
    });

    let lastServices = [];
    if (req.user.type === "ClientEmployee") {
      const ser = await Service.find({ location: id })
        .sort("-updatedAt")
        .limit(10);
      for (let service of ser) {
        if (service.type === "Regular")
          lastServices.push({
            id: service._id,
            type: service.type,
            date: service.updatedAt,
            pest: service.regularService.map((item) => ({
              name: item.serviceName,
              scope: item.scopeName,
            })),
            userName: service.userName,
            status: service.regularService.map((item) => item.action),
          });
        else if (
          service.type === "Complaint" &&
          service.complaintDetails.status !== "Open"
        ) {
          lastServices.push({
            id: service._id,
            type: service.type,
            date: service.updatedAt,
            pest: service.complaintDetails.service,
            status: service.complaintDetails.status,
            userName: service.userName,
          });
        }

        if (lastServices.length === 3) break;
      }
    }

    const regularService = await Service.findOne({
      type: "Regular",
      location: id,
    }).sort("-createdAt");

    return res.json({
      location,
      client: client.name,
      complaints,
      lastServices,
      regularService,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ msg: "Server error, try again later" });
  }
};

// added newly
export const getSingleLocation = async (req, res) => {
  const { id } = req.params;
  if (id.length !== 24) {
    return res.status(404).json({ msg: "Location not found, contact admin" });
  }
  try {
    const location = await Location.findById(id);
    if (!location)
      return res.status(404).json({ msg: "Location not found, contact admin" });

    res.status(200).json(location);
  } catch (error) {
    console.log(error);
    res.status(500).json({ msg: "Server error, try again later" });
  }
};

export const assignLocation = async (req, res) => {
  const { id, userId } = req.body.data;
  const clientAdmin = req.user.role === "ClientAdmin" && req.user.role;
  if (clientAdmin === "ClientAdmin") {
    const assignLocation = await Location.findByIdAndUpdate(
      id,
      { employee: userId },
      { new: true },
    ).populate("User");
    res.status(200).json(assignLocation);
  } else {
    res.status(500).json({ msg: "server error" });
  }
};
