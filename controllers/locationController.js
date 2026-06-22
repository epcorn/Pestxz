import Casual from "../models/casualServiceModel.js";
import Client from "../models/clientModel.js";
import Location from "../models/locationModel.js";
import Service from "../models/serviceModel.js";
import { Unscheduled } from "../models/unScheduleModel.js";
import {
  autoMarkMissed,
  capitalLetter,
  generateSchedule,
  qrCodeGenerator,
  qrCodeGeneratorSVG,
  removeOldQr,
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
  const { floor, subLocation, location, clientId, serviceReq } = req.body;

  try {
    const client = await Client.findByIdSafe(clientId);

    if (!client) {
      return res.status(404).json({
        msg: "Client not found",
      });
    }
    const locationExist = await Location.findOne({
      client: clientId,
      floor: { $regex: `^${floor}$`, $options: "i" },
      subLocation: {
        $regex: `^${subLocation || ""}$`,
        $options: "i",
      },
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
    const contractStart = new Date(client.startDate);
    const contractEnd = new Date(client.endDate);

    const formattedServices = validServices.map((service) => {
      const generatedDates = generateSchedule(
        contractStart,
        contractEnd,
        service.frequency,
      );
      const schedule = generatedDates.map((date) => ({
        date: date.date,
        completed: date.completed,
        status: date.status,
        completedAt: null,
        completedBy: "",
      }));
      return {
        serviceId: service.serviceId,
        serviceName: service.serviceName,
        frequency: service.frequency,
        schedule,
        scopes: service.scopes.map((scope) => ({
          scopeId: scope.scopeId,
          scopeName: scope.scopeName,
          consumables: (scope.consumables || []).map((consumable) => ({
            consumableId: consumable.consumableId,
            consumableName: consumable.consumableName,
            calibration: consumable.calibration,
          })),
        })),
      };
    });

    const newLocation = await Location.create({
      floor: capitalLetter(floor),
      subLocation: capitalLetter(subLocation || ""),
      location: capitalLetter(location),
      service: formattedServices,
      client: client._id,
    });
    const locationId = newLocation._id;
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
    fs.writeFileSync("./tmp/qr.jpeg", qrData);
    const qrLink = await uploadFile({
      filePath: "./tmp/qr.jpeg",
    });
    if (!qrLink) {
      await Location.findByIdAndDelete(locationId);
      return res.status(400).json({
        msg: "QR upload error. Try again later",
      });
    }

    newLocation.qr = qrLink;
    await newLocation.save();

    autoMarkMissed();
    return res.status(201).json({
      msg: "Location added successfully",
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      msg: "Server error, try again later",
    });
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

  try {
    const location = await Location.findById(id);

    if (!location) {
      return res.status(404).json({ msg: "Location not found" });
    }

    await removeOldQr(location.qr);

    const client = await Client.findByIdSafe(location.client);
    const contractStart = new Date(client.startDate);
    const contractEnd = client.endDate;

    const validServices = (req.body.serviceReq || []).filter(
      (service) =>
        service.serviceId &&
        service.serviceName &&
        Array.isArray(service.scopes) &&
        service.scopes.length > 0,
    );

    const formattedServices = validServices.map((service) => {
      const existingService = location.service.find(
        (s) => s.serviceId?.toString() === service.serviceId?.toString(),
      );

      let schedule = existingService?.schedule || [];

      if (
        !schedule.length ||
        existingService?.frequency !== service.frequency
      ) {
        const generatedDates = generateSchedule(
          contractStart,
          contractEnd,
          service.frequency,
        );
        schedule = generatedDates.map((date) => ({
          date: date.date,
          completed: date.completed,
          status: date.status,
          completedAt: null,
          completedBy: "",
        }));
      }

      return {
        serviceId: service.serviceId,
        serviceName: service.serviceName,
        frequency: service.frequency,
        schedule,
        scopes: service.scopes.map((scope) => ({
          scopeId: scope.scopeId,
          scopeName: scope.scopeName,
          consumables: (scope.consumables || []).map((consumable) => ({
            consumableId: consumable.consumableId,
            consumableName: consumable.consumableName,
            calibration: consumable.calibration,
          })),
        })),
      };
    });

    // --- Build diff of what changed ---
    const diff = {};

    if (req.body.floor !== location.floor) {
      diff.floor = { from: location.floor, to: req.body.floor };
    }
    if (req.body.location !== location.location) {
      diff.location = { from: location.location, to: req.body.location };
    }
    if (req.body.subLocation !== location.subLocation) {
      diff.subLocation = {
        from: location.subLocation,
        to: req.body.subLocation,
      };
    }

    // Services diff
    const oldServiceNames = location.service.map((s) => s.serviceName);
    const newServiceNames = formattedServices.map((s) => s.serviceName);

    const addedServices = newServiceNames.filter(
      (s) => !oldServiceNames.includes(s),
    );
    const removedServices = oldServiceNames.filter(
      (s) => !newServiceNames.includes(s),
    );

    const frequencyChanges = formattedServices
      .filter((newSvc) => {
        const old = location.service.find(
          (s) => s.serviceId?.toString() === newSvc.serviceId?.toString(),
        );
        return old && old.frequency !== newSvc.frequency;
      })
      .map((newSvc) => {
        const old = location.service.find(
          (s) => s.serviceId?.toString() === newSvc.serviceId?.toString(),
        );
        return {
          service: newSvc.serviceName,
          from: old.frequency,
          to: newSvc.frequency,
        };
      });

    // Scopes diff
    const oldScopesName = location?.service?.flatMap((s) =>
      s?.scopes?.map((sc) => sc?.scopeName),
    );
    const newScopesName = formattedServices?.flatMap((s) =>
      s?.scopes.map((sc) => sc?.scopeName),
    );

    const addedScopes = newScopesName.filter((s) => !oldScopesName.includes(s));
    const removedScopes = oldScopesName.filter(
      (s) => !newScopesName.includes(s),
    );

    // Consumables diff
    const oldConsumables = location?.service?.flatMap((s) =>
      s?.scopes?.flatMap((sc) =>
        sc?.consumables?.map((con) => ({
          consumableName: con.consumableName,
          calibration: con.calibration,
        })),
      ),
    );
    const newConsumables = formattedServices?.flatMap((s) =>
      s?.scopes?.flatMap((sc) =>
        sc?.consumables?.map((con) => ({
          consumableName: con.consumableName,
          calibration: con.calibration,
        })),
      ),
    );

    const addedConsumables = newConsumables
      .filter(
        (n) =>
          !oldConsumables?.find((o) => o?.consumableName === n?.consumableName),
      )
      ?.map((c) => c?.consumableName);

    const removedConsumables = oldConsumables
      .filter(
        (o) =>
          !newConsumables?.find((n) => n?.consumableName === o?.consumableName),
      )
      ?.map((c) => c?.consumableName);

    // Calibration changes on existing consumables
    const calibrationChanges = newConsumables
      .filter((n) => {
        const old = oldConsumables?.find(
          (o) => o?.consumableName === n.consumableName,
        );
        return old && old.calibration !== n.calibration;
      })
      .map((n) => {
        const old = oldConsumables.find(
          (o) => o?.consumableName === n.consumableName,
        );
        return {
          consumable: n.consumableName,
          from: old.calibration,
          to: n.calibration,
        };
      });

    if (req.body.floor !== location.floor)
      diff.floor = { from: location.floor, to: req.body.floor };
    if (req.body.location !== location.location)
      diff.location = { from: location.location, to: req.body.location };
    if (req.body.subLocation !== location.subLocation)
      diff.subLocation = {
        from: location.subLocation,
        to: req.body.subLocation,
      };

    if (addedServices.length) diff.servicesAdded = addedServices;
    if (removedServices.length) diff.servicesRemoved = removedServices;
    if (frequencyChanges.length) diff.frequencyChanges = frequencyChanges;
    if (addedScopes.length) diff.scopesAdded = addedScopes;
    if (removedScopes.length) diff.scopesRemoved = removedScopes;
    if (addedConsumables.length) diff.consumablesAdded = addedConsumables;
    if (removedConsumables.length) diff.consumablesRemoved = removedConsumables;
    if (calibrationChanges.length) diff.calibrationChanges = calibrationChanges;

    const changeEntry =
      Object.keys(diff).length > 0
        ? {
            changedAt: new Date(),
            changedBy_id: req.user?.id || null,
            changedBy_user: req.user?.name || null,
            reason: req?.body?.changes,
            diff,
          }
        : null;

    const qrData = await qrCodeGenerator({
      link: `https://pestxz.onrender.com/location/${id}`,
      floor: req.body.floor,
      location: `${req.body.location}, ${req.body.subLocation}`,
    });

    fs.writeFileSync("./tmp/qr.jpeg", qrData);
    const qrLink = await uploadFile({
      filePath: "./tmp/qr.jpeg",
    });

    const updatedLocation = await Location.findByIdAndUpdate(
      id,
      {
        $set: {
          floor: req.body.floor,
          subLocation: req.body.subLocation,
          location: req.body.location,
          service: formattedServices,
          qr: qrLink,
          product: Array.isArray(req.body.product) ? req.body.product : [],
        },
        ...(changeEntry && { $push: { changes: changeEntry } }),
      },
      { new: true, runValidators: true },
    );

    autoMarkMissed();
    if (!updatedLocation) {
      return res.status(404).json({ msg: "Location not found" });
    }

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

    location.service = [
      ...(location.service || []),
      ...(location.product || []),
    ];

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

    return res.json({
      location,
      client: client?.name || "",
      complaints,
      lastServices,
      regularService,
      unscheduled: unscheduled || [],
      casuals: casuals || [],
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
