import mongoose from "mongoose";
import Casual from "../models/casualServiceModel.js";
import Client from "../models/clientModel.js";
import Counter from "../models/counterModel.js";
import Location from "../models/locationModel.js";
import Service from "../models/serviceModel.js";
import { Unscheduled } from "../models/unScheduleModel.js";
import {
  autoMarkMissed,
  capitalLetter,
  diffProducts,
  diffServices,
  formatProducts,
  formatServices,
  generateSchedule,
  productQrCodeGenerator,
  qrCodeGenerator,
  qrCodeGeneratorSVG,
  releaseProductCounter,
  removeOldQr,
  uploadFile,
} from "../utils/helperFunction.js";
import fs from "fs";
import ProductService from "../models/productService.js";

let locationId = null;
const internalRoles = [
  "Admin",
  "Operator",
  "Supervisor",
  "TeamLeader",
  "BranchAdmin",
];

export async function productCounter(code) {
  let counter = await Counter.findOneAndUpdate(
    { productCode: code },
    { $inc: { seq: 1 } },
    { new: true },
  );

  if (!counter) {
    try {
      counter = await Counter.create({ productCode: code, seq: 2 });
    } catch (err) {
      if (err.code === 11000) {
        // another request created it first — just increment normally
        counter = await Counter.findOneAndUpdate(
          { productCode: code },
          { $inc: { seq: 1 } },
          { new: true },
        );
      } else {
        throw err;
      }
    }
  }

  const today = new Date().getFullYear();
  const paddedSeq = String(counter.seq).padStart(3, "0");
  return `${code}-${today.toString().slice(2)}-${paddedSeq}`;
}

export const qrCounter = async (req, res) => {
  const { id } = req.params;
  try {
    const idArray = id.includes(",") ? id.split(",") : [id];

    const location = await Location.updateMany(
      { _id: { $in: idArray } },
      { $inc: { qrCount: 1 } },
      { new: true },
    );

    if (location.matchedCount === 0)
      return res.status(400).json({ msg: "location not found" });

    const updatedLocations = await Location.find(
      { _id: { $in: idArray } },
      "qrCount",
    );
    res.status(200).json({ qrCount: location.qrCount });
  } catch (error) {
    return res.status(500).json({
      msg: "Server error, try again later",
      error,
    });
  }
};

export const addLocation = async (req, res) => {
  const {
    floor,
    subLocation,
    location,
    clientId,
    serviceReq,
    productReq,
    type,
  } = req.body;

  try {
    const client = await Client.findById(clientId);
    if (!client) return res.status(404).json({ msg: "Client not found" });

    const locationExist = await Location.findOne({
      client: clientId,
      floor: { $regex: `^${floor}$`, $options: "i" },
      subLocation: { $regex: `^${subLocation || ""}$`, $options: "i" },
      location: { $regex: `^${location}$`, $options: "i" },
    });
    if (locationExist)
      return res.status(400).json({ msg: "Location already exists" });

    const contractStart = new Date(client.startDate);
    const contractEnd = new Date(client.endDate);

    const newLocation = await Location.create({
      floor: capitalLetter(floor),
      subLocation: capitalLetter(subLocation || ""),
      location: capitalLetter(location),
      client: client._id,
    });
    const locationId = newLocation._id;

    // ── build service array ──────────────────────────────────────────
    let formattedServices = [];
    if (type.includes("service") && serviceReq?.length) {
      const validServices = serviceReq.filter(
        (s) =>
          s.serviceId &&
          s.serviceName &&
          Array.isArray(s.scopes) &&
          s.scopes.length > 0,
      );
      if (validServices.length < 1)
        return res
          .status(400)
          .json({ msg: "Please add at least one valid service" });

      formattedServices = validServices.map((service) => {
        const schedule = generateSchedule(
          contractStart,
          contractEnd,
          service.frequency,
          client.prefDay,
        ).map((date) => ({
          date: date.date,
          completed: date.completed,
          status: date.status,
          completedAt: null,
          completedBy: null,
        }));

        return {
          serviceId: service.serviceId,
          serviceName: service.serviceName,
          frequency: service.frequency,
          schedule,
          scopes: service.scopes.map((scope) => ({
            scopeId: scope.scopeId,
            scopeName: scope.scopeName,
            consumables: (scope.consumables || []).map((con) => ({
              consumableId: con.consumableId,
              consumableName: con.consumableName,
              calibration: con.calibration,
            })),
          })),
        };
      });
    }

    // ── build product array ────────────────────────────────────────────
    let formattedProduct = [];
    if (type.includes("product") && productReq?.length) {
      const validProductReq = productReq.filter(
        (pr) => pr.productId && pr.versionId && pr.frequency,
      );
      if (validProductReq.length < 1)
        return res.status(400).json({ msg: "Please fill all product fields" });

      formattedProduct = await Promise.all(
        validProductReq.map(async (pr, i) => {
          const {
            productId,
            productName,
            versionId,
            versionName,
            frequency,
            code,
            specification,
            calibrations,
          } = pr;

          const schedule = generateSchedule(
            contractStart,
            contractEnd,
            frequency,
            client.prefDay,
          ).map((date) => ({
            date: date.date,
            completed: date.completed,
            status: date.status,
            completedAt: null,
            completedBy: null,
          }));
          const serialNo = await productCounter(code);
          const qrData = await productQrCodeGenerator({
            link: `https://pestxz.com/location/${locationId}`,
            floor: newLocation.floor,
            location: `${newLocation.location}, ${newLocation.subLocation}`,
            serialNo,
          });

          fs.writeFileSync(`./tmp/qr${i}.jpeg`, qrData);
          const qrLink = await uploadFile({ filePath: `./tmp/qr${i}.jpeg` });
          return {
            productId,
            productName,
            versionId,
            versionName,
            frequency,
            code,
            serialNo,
            specification,
            calibrations: calibrations ?? [],
            schedule,
            qr: qrLink,
          };
        }),
      );
    }

    if (!formattedServices.length && !formattedProduct.length)
      return res
        .status(400)
        .json({ msg: "Please add at least one service or product" });

    newLocation.service = formattedServices;
    newLocation.product = formattedProduct;

    const qrData = await qrCodeGenerator({
      link: `https://pestxz.com/location/${locationId}`,
      floor: newLocation.floor,
      location: `${newLocation.location}, ${newLocation.subLocation}`,
    });
    if (!qrData) {
      await Location.findByIdAndDelete(locationId);
      return res
        .status(400)
        .json({ msg: "QR generation error. Try again later" });
    }

    fs.writeFileSync("./tmp/qr.jpeg", qrData);
    const qrLink = await uploadFile({ filePath: "./tmp/qr.jpeg" });
    if (!qrLink) {
      await Location.findByIdAndDelete(locationId);
      return res.status(400).json({ msg: "QR upload error. Try again later" });
    }

    newLocation.qr = qrLink;
    await newLocation.save();
    autoMarkMissed();

    return res.status(201).json({ msg: "Location added successfully" });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ msg: "Server error, try again later" });
  }
};

export const getAllLocations = async (req, res) => {
  const { id } = req.params;

  try {
    let clientId;
    // CASE 1: ClientEmployee → get client from token
    if (id === "ClientEmployee") {
      clientId = req.user.client;
    } else if (id.length === 24) {
      const location = await Location.findById(id).select("client");
      if (location) {
        clientId = location.client;
        // console.log("getAllLocations Id ln-156:", clientId);
      } else {
        clientId = id;
      }
    }
    // FIND CLIENT
    const client = await Client.findById(clientId).select(
      "-adminPass -adminName",
    );
    if (!client) {
      return res.status(404).json({ msg: "Client not found" });
    }

    const locations = await Location.find({ client: clientId });
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
  const {
    floor,
    subLocation,
    location,
    serviceReq,
    productReq,
    type,
    changes,
  } = req.body;

  try {
    const existingLocation = await Location.findById(id);
    if (!existingLocation)
      return res.status(404).json({ msg: "Location not found" });

    const client = await Client.findById(existingLocation.client);
    const contractStart = new Date(client.startDate);
    const contractEnd = new Date(client.endDate);

    let formattedServices = [];
    if (type.includes("service") && serviceReq?.length) {
      const { formatted, error } = formatServices(
        serviceReq,
        existingLocation.service,
        contractStart,
        contractEnd,
      );
      if (error) return res.status(400).json({ msg: error });
      formattedServices = formatted;
    }

    let formattedProduct = [];
    if (type.includes("product") && productReq?.length) {
      const { formatted, error } = await formatProducts(
        productReq,
        existingLocation.product,
        contractStart,
        contractEnd,
      );
      if (error) return res.status(400).json({ msg: error });
      formattedProduct = formatted;
    }

    if (!formattedServices.length && !formattedProduct.length)
      return res
        .status(400)
        .json({ msg: "Please add at least one service or product" });

    // ── diff ──────────────────────────────────────────────
    const diff = {};
    if (floor !== existingLocation.floor)
      diff.floor = { from: existingLocation.floor, to: floor };
    if (location !== existingLocation.location)
      diff.location = { from: existingLocation.location, to: location };
    if (subLocation !== existingLocation.subLocation)
      diff.subLocation = {
        from: existingLocation.subLocation,
        to: subLocation,
      };

    if (type.includes("service"))
      Object.assign(
        diff,
        diffServices(existingLocation.service, formattedServices),
      );
    if (type.includes("product"))
      Object.assign(
        diff,
        await diffProducts(existingLocation.product, formattedProduct),
      );

    if (type.includes("service") && !existingLocation.service?.length)
      diff.serviceAdded = formattedServices.map((s) => s.serviceName);
    if (!type.includes("service") && existingLocation.service?.length)
      diff.serviceRemoved = existingLocation.service.map((s) => s.serviceName);

    if (!type.includes("product") && existingLocation.product?.length) {
      diff.productRemoved = existingLocation.product.map((p) => p.productName);
      await Promise.all(
        existingLocation.product.map((p) =>
          releaseProductCounter(p.code, p.serialNo),
        ),
      );
    }

    const changeEntry = Object.keys(diff).length
      ? {
          changedAt: new Date(),
          changedBy_id: req.user?.id || null,
          changedBy_user: req.user?.name || null,
          reason: changes,
          diff,
        }
      : null;

    // ── QR (only regenerate if location fields actually changed) ──
    const locationFieldsChanged =
      floor !== existingLocation.floor ||
      location !== existingLocation.location ||
      subLocation !== existingLocation.subLocation;

    let qrLink = existingLocation.qr;

    if (locationFieldsChanged) {
      const qrData = await qrCodeGenerator({
        link: `https://pestxz.onrender.com/location/${id}`,
        floor,
        location: `${location}, ${subLocation}`,
      });
      fs.writeFileSync("./tmp/qr.jpeg", qrData);

      const uploadedLink = await uploadFile({ filePath: "./tmp/qr.jpeg" });

      if (!uploadedLink) {
        return res
          .status(502)
          .json({ msg: "Failed to generate QR code, please try again" });
      }

      await removeOldQr(existingLocation.qr);
      qrLink = uploadedLink;
    }

    // ── persist ─────────────────────────────────────────────
    const updatedLocation = await Location.findByIdAndUpdate(
      id,
      {
        $set: {
          floor,
          subLocation,
          location,
          qr: qrLink,
          service: type.includes("service")
            ? formattedServices
            : existingLocation.service || [],
          product: type.includes("product")
            ? formattedProduct
            : existingLocation.product || [],
        },
        ...(changeEntry && { $push: { changes: changeEntry } }),
      },
      { new: true, runValidators: true },
    );

    if (!updatedLocation)
      return res.status(404).json({ msg: "Location not found" });

    autoMarkMissed();
    return res.json({ msg: "Updated successfully" });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ msg: "Server error, try again later" });
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
    const location = await Location.findById(id);
    if (!location)
      return res.status(404).json({ msg: "Location not found, contact admin" });

    const client = await Client.findByIdSafe(location.client);
    const isInternalUser = internalRoles.includes(req.user.role);
    const isSameClient =
      location.client.toString() === req.user.client?.toString();

    if (!isInternalUser && !isSameClient)
      return res.status(401).json({ msg: "You are not authorized" });

    // location.service = [
    //   ...(location.service || []),
    //   ...(location.product || []),
    // ];

    const complaints = await Service.find({
      type: "Complaint",
      location: id,
      "complaintDetails.status": { $ne: "Close" },
    });

    let lastServices = [];

    const services = await Service.find({ location: id })
      .sort("-createdAt")
      .limit(50); // fetch more to guarantee 10 after filtering

    for (const service of services) {
      if (lastServices.length >= 10) break;
      if (service.type === "Regular") {
        service.regularService.forEach((reg) => {
          const locationService = location?.service?.find(
            (ls) =>
              ls.serviceId?.toString().trim() ===
              reg.serviceId?.toString().trim(),
          );

          lastServices.push({
            id: service._id,
            type: service.type,
            date: service.createdAt,
            serviceId: service.serviceId,
            serviceDate: reg.serviceDate,
            serviceName: reg.serviceName,
            frequency: reg.frequency,
            schedule: locationService?.schedule || [],
            userName: reg.userName,

            scopes:
              reg.scopes?.map((sc) => ({
                scopeName: sc.scopeName,
                scopeId: sc.scopeId,
                consumables: sc.consumables?.map((con) => ({
                  action: con.action,
                  calibration: con.calibration,
                  comment: con.comment,
                  consumableName: con.consumableName,
                  usedCalibration: con.usedCalibration,
                })),
              })) || [],

            image: reg.image || [],

            completedAt: reg.completedAt || service.createdAt,
          });
        });
      } else if (
        service.type === "Complaint" &&
        service.complaintDetails?.status !== "Open"
      ) {
        lastServices.push({
          id: service._id,
          type: service.type,
          date: service.updatedAt,
          service: service.complaintDetails.service,
          status: service.complaintDetails.status,
          userName: service.complaintDetails.userName,
        });
      }
    }

    // trim in case regularService had multiple entries per doc
    lastServices = lastServices.slice(0, 10);

    const regularService = await Service.find({
      type: "Regular",
      location: id,
    }).sort("-createdAt");

    const unscheduled = await Unscheduled.find({ location: location._id }).sort(
      {
        updatedAt: -1,
      },
    );
    const casuals = await Casual.find({ location: location._id }).sort({
      updatedAt: -1,
    });

    const productsService = await ProductService.find({
      location: location._id,
    }).sort({ updatedAt: -1 });
    // const productsService = await ProductService.aggregate([
    //   { $sort: { createdAt: -1 } },
    //   {
    //     $group: {
    //       _id: "$code",
    //       productservices: { $push: "$$ROOT" },
    //     },
    //   },
    // ]);

    return res.json({
      location,
      client: client?.name || "",
      complaints,
      lastServices,
      regularService,
      unscheduled: unscheduled || [],
      casuals: casuals || [],
      productsService,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ msg: "Server error, try again later" });
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

//do not run
export const backfillSchedules = async (req, res) => {
  try {
    const locations = await Location.find().populate("client");

    let updated = 0;
    let skipped = 0;

    for (const location of locations) {
      if (!location.client) {
        skipped++;
        continue;
      }

      const contractStart = new Date(location.client.startDate);
      const contractEnd = new Date(location.client.endDate);

      let modified = false;

      for (const service of location.service) {
        // SKIP if schedule already exists
        if (service.schedule && service.schedule.length > 0) continue;

        const generatedDates = generateSchedule(
          contractStart,
          contractEnd,
          service.frequency,
        );

        service.schedule = generatedDates.map((date) => ({
          date: date.date,
          completed: date.completed,
          status: date.status,
          completedAt: null,
          completedBy: "",
        }));

        modified = true;
      }

      if (modified) {
        location.markModified("service");
        await location.save();
        updated++;
      } else {
        skipped++;
      }
    }
    return res.json({
      msg: `Done. Updated: ${updated}, Skipped: ${skipped}`,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ msg: "Server error" });
  }
};
