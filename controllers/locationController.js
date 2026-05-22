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

export const addLocation = async (req, res) => {
  const { floor, subLocation, location, clientId, serviceReq } = req.body;

  try {
    const client = await Client.findById(clientId);
    if (!client) return res.status(404).json({ msg: "Client not found" });

    const locationExist = await Location.findOne({
      client: clientId,
      floor: { $regex: floor, $options: "i" },
      subLocation: { $regex: subLocation, $options: "i" },
      location: { $regex: location, $options: "i" },
    });
    if (locationExist)
      return res.status(400).json({ msg: "Location already exist" });

    const services = serviceReq.filter(
      (ser) => ser.serviceId && ser.scopeId && ser.consumableId,
    );

    const newLocation = await Location.create({
      floor: capitalLetter(floor),
      subLocation: capitalLetter(subLocation),
      location: capitalLetter(location),
      service: services,
      client: client._id,
    });
    locationId = newLocation._id;

    const qrData = await qrCodeGenerator({
      link: `https://pestxz.onrender.com/location/${locationId}`,
      floor: newLocation.floor,
      location: `${newLocation.location}, ${newLocation.subLocation}`,
    });
    if (!qrData) {
      await Location.findByIdAndDelete(locationId);
      locationId = null;
      return res
        .status(400)
        .json({ msg: "QR generation error. Try again later" });
    }

    fs.writeFileSync("./tmp/qr.jpeg", qrData);

    const qrLink = await uploadFile({ filePath: "./tmp/qr.jpeg" });
    if (!qrLink) {
      await Location.findByIdAndDelete(locationId);
      locationId = null;
      return res.status(400).json({ msg: "QR upload error. Try again later" });
    }
    // This line converts your raw SVG template string into a safe Base64 string
    const base64Svg = Buffer.from(qrData).toString("base64");

    newLocation.qr = qrLink;
    // newLocation.qr = base64Svg; //addded for svg

    await newLocation.save();
    locationId = null;

    return res.status(201).json({ msg: "Location added successfully" });
  } catch (error) {
    if (locationId) {
      await Location.findByIdAndDelete(locationId);
      locationId = null;
    }
    console.log(error);
    res.status(500).json({ msg: "Server error, try again later" });
  }
};

export const getAllLocations = async (req, res) => {
  const { id } = req.params;
  try {
    let clientId = id;
    let floors = [];
    if (clientId === "ClientAdmin") 
      clientId = req.user.client;
      const client = await Client.findById(clientId);
      if (!client) return res.status(404).json({ msg: "Client not found" });

      const locations = await Location.find({ client: clientId });
      locations.map(
        (item) => !floors.includes(item.floor) && floors.push(item.floor),
      );
    // } else{
    //   const locations = await Location.find();

    // }

    return res.json({ client, locations, floors });
  } catch (error) {
    console.log(error);
    res.status(500).json({ msg: "Server error, try again later" });
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
    location.service = req.body.service;
    location.product = req.body.product;

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
    if (!location)
      return res.status(404).json({ msg: "Location not found, contact admin" });

    if (
      req.user.role !== "Admin" &&
      location.client.toString() !== req.user.client.toString()
    ) {
      console.log("ok");
      return res.status(401).json({ msg: "You are not authorized" });
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
            pest: service.regularService.map((item) => item.name),
            status: "NA",
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
          });
        }

        if (lastServices.length === 3) break;
      }
    }

    const regularService = await Service.findOne({
      type: "Regular",
      location: id,
    }).sort("-createdAt");

    return res.json({ location, complaints, lastServices, regularService });
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
