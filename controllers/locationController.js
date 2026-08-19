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

export async function productCounter(code, client) {
  const productCode = `${client.contractNo}_${code}`;

  let counter = await Counter.findOneAndUpdate(
    { productCode: productCode },
    { $inc: { seq: 1 } },
    { new: true },
  );

  if (!counter) {
    try {
      counter = await Counter.create({
        productCode: productCode,
        seq: 2,
      });
    } catch (err) {
      if (err.code === 11000) {
        // another request created it first — just increment normally
        counter = await Counter.findOneAndUpdate(
          { productCode: productCode },
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
  return `${productCode}-${today.toString().slice(2)}-${paddedSeq}`;
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
          const serialNo = await productCounter(code, client);
          const prQrData = await productQrCodeGenerator({
            link: `https://pestxz.com/location/${locationId}`,
            floor: newLocation.floor,
            location: `${newLocation.location}, ${newLocation.subLocation}`,
            serialNo,
          });

          fs.writeFileSync(`./tmp/qr${i}.jpeg`, prQrData);
          const prQrLink = await uploadFile({ filePath: `./tmp/qr${i}.jpeg` });
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
            qr: prQrLink,
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

    let qrLink = "";
    if (type.includes("service")) {
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
      qrLink = await uploadFile({ filePath: "./tmp/qr.jpeg" });
      if (!qrLink) {
        await Location.findByIdAndDelete(locationId);
        return res
          .status(400)
          .json({ msg: "QR upload error. Try again later" });
      }
      newLocation.qr = qrLink;
    }
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
    // Check if pagination parameters are provided
    const hasPagination = req.query.page && req.query.limit;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    if (id && id.length === 25) {
      const clientId = id.slice(0, 24);
      console.log("Processing 25-character appended ID. Extracted:", clientId);

      if (!mongoose.Types.ObjectId.isValid(clientId)) {
        return res.status(400).json({ msg: "Invalid location ID format" });
      }

      const client = await Client.findById(clientId)
        .select("name locations")
        .populate({
          path: "locations",
          select: "qr floor location service.serviceId product.qr",
        });
      if (!client) {
        return res.status(404).json({
          client,
          msg: "Location document not found in database",
        });
      }
      return res.status(200).json({ client, msg: "success" });
    }

    //=================================================================
    // CASE A: NO ID PARAMETER PASSED -> FETCH SYSTEM-WIDE LOCATIONS
    //=================================================================
    if (!id || id === "undefined") {
      let locations;
      let totalLocations;
      let totalPages = 1;

      if (hasPagination) {
        const [paginatedData, count] = await Promise.all([
          Location.find()
            .populate("client", "name email")
            .skip(skip)
            .limit(limit)
            .lean(),
          Location.countDocuments(),
        ]);

        locations = paginatedData;
        totalLocations = count;
        totalPages = Math.ceil(count / limit);
      } else {
        locations = await Location.find()
          .populate("client", "name email")
          .lean();
        totalLocations = locations.length;
      }

      if (!locations || locations.length === 0) {
        return res.status(404).json({ msg: "No locations found" });
      }

      const floors = await Location.distinct("floor", { client: clientId });

      return res.json({
        locations,
        floors,
        pages: totalPages,
        totalLocations,
      });
    }

    //=================================================================
    // CASE B: CLIENT / EMPLOYEE ID PROVIDED -> ORIGINAL CLIENT FILTER WITH PAGINATION
    //=================================================================
    let clientId;

    if (id === "ClientEmployee") {
      clientId = req.user.client;
    } else if (id.length === 24) {
      const location = await Location.findById(id).select("client").lean();
      console.log("this runs");
      if (location) {
        clientId = location.client;
      } else {
        clientId = id;
      }
    }

    if (!clientId) {
      return res.status(400).json({ msg: "Invalid parameter format provided" });
    }

    const client = await Client.findById(clientId).select(
      "-adminPass -adminName",
    );
    if (!client) {
      return res.status(404).json({ msg: "Client not found" });
    }

    // FIXED: Apply pagination logic to the client-specific query block
    let locations;
    let totalLocations;
    let totalPages = 1;

    if (hasPagination) {
      const [paginatedData, count] = await Promise.all([
        Location.find({ client: clientId }).skip(skip).limit(limit),
        Location.countDocuments({ client: clientId }),
      ]);
      locations = paginatedData;
      totalLocations = count;
      totalPages = Math.ceil(count / limit);
    } else {
      locations = await Location.find({ client: clientId });
      totalLocations = locations.length;
    }

    const floors = await Location.distinct("floor", { client: clientId });

    return res.json({
      client,
      clientName: client.name,
      locations,
      floors,
      pages: totalPages, // Added to support frontend pagination components
      totalLocations, // Added to track total matched items
    });
  } catch (error) {
    console.error("Error in getAllLocations:", error);
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
    confirmRemoval = {},
  } = req.body;

  try {
    const existingLocation = await Location.findById(id);
    if (!existingLocation)
      return res.status(404).json({ msg: "Location not found" });

    const removingService =
      !type.includes("service") && existingLocation.service?.length > 0;
    const removingProduct =
      !type.includes("product") && existingLocation.product?.length > 0;

    if (removingService && !confirmRemoval.service) {
      return res.status(409).json({
        msg: "This update will remove all existing services. Please confirm removal.",
        code: "CONFIRM_SERVICE_REMOVAL",
      });
    }
    if (removingProduct && !confirmRemoval.product) {
      return res.status(409).json({
        msg: "This update will remove all existing products. Please confirm removal.",
        code: "CONFIRM_PRODUCT_REMOVAL",
      });
    }

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
        client.prefDay,
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
        id,
        { floor, subLocation, location },
        client,
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
          service: type.includes("service") ? formattedServices : [],
          product: type.includes("product") ? formattedProduct : [],
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
    const location = await Location.findById(id).select("-changes").lean();
    if (!location)
      return res.status(404).json({ msg: "Location not found, contact admin" });

    const client = await Client.findByIdSafe(location.client);
    const isInternalUser = internalRoles.includes(req.user.role);
    const isSameClient =
      location.client.toString() === req.user.client?.toString();

    if (!isInternalUser && !isSameClient)
      return res.status(401).json({ msg: "You are not authorized" });

    const [
      complaints,
      services,
      regularService,
      unscheduled,
      casuals,
      productsService,
    ] = await Promise.all([
      Service.find({
        type: "Complaint",
        location: id,
        "complaintDetails.status": { $ne: "Close" },
      }).lean(),

      Service.find({ location: id }).sort({ createdAt: -1 }).limit(50).lean(),

      Service.find({
        type: "Regular",
        location: id,
      })
        .sort({ createdAt: -1 })
        .lean(),

      Unscheduled.find({ location: id }).sort({ updatedAt: -1 }).lean(),

      Casual.find({ location: id }).sort({ updatedAt: -1 }).lean(),

      ProductService.find({ location: id }).sort({ updatedAt: -1 }).lean(),
    ]);

    let lastServices = [];
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
    const location = await Location.findById(id).select("-changes").lean();
    if (!location)
      return res.status(404).json({ msg: "Location not found, contact admin" });

    res.status(200).json(location);
  } catch (error) {
    console.log(error);
    res.status(500).json({ msg: "Server error, try again later" });
  }
};
//get single location complaints
export const complaintLocation = async (req, res) => {
  const { id } = req.params;

  try {
    let clientId;

    if (id === "ClientEmployee") {
      clientId = req.user.client;
    } else if (id?.length === 24) {
      const [client, location] = await Promise.all([
        Client.findById(id).select("_id").lean(),
        Location.findById(id).select("client").lean(),
      ]);

      clientId = client ? id : location?.client;
    }

    if (!clientId) {
      return res.status(400).json({
        msg: "Invalid parameter format provided",
      });
    }

    const [locations, floors, clients] = await Promise.all([
      Location.find({ client: clientId })
        .select("floor location subLocation service")
        .lean(),

      Location.distinct("floor", { client: clientId }),
      Client.find({}).select("name contractNo phone").lean(),
    ]);

    return res.status(200).json({
      locations,
      floors,
      clients,
    });
  } catch (error) {
    console.error("Error in complaintLocation:", error);
    return res.status(500).json({
      msg: "Server error, try again",
    });
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
