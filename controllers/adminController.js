import mongoose from "mongoose";
import Admin from "../models/adminModel.js";
import Client from "../models/clientModel.js";
import Frequency from "../models/frequencyModal.js";
import Location from "../models/locationModel.js";
import Service from "../models/serviceModel.js";
import { capitalLetter } from "../utils/helperFunction.js";

// export const OldaddService = async (req, res) => {
//   // const { serviceName, serviceType } = req.body;
//   const { services } = req.body;
//   try {
//     if (!serviceName || !consumeable)
//       return res.status(400).json({ msg: "Please provide required values" });

//     const service = await Admin.findOne({ serviceName });
//     if (service)
//       return res.status(400).json({ msg: `${serviceName} already exists` });

//     const servName = capitalLetter(serviceName);

//     await Admin.create({
//       serviceType: "",
//       serviceName: "",
//       services: { label: servName, value: consumeable },
//     });

//     res.status(201).json({ msg: `${serviceName} successfully added` });
//   } catch (error) {
//     console.log(error);
//     res.status(500).json({ msg: "Server error, try again later" });
//   }
// };

//old admin service
// export const OldgetAllService = async (req, res) => {
//   try {
//     const allServices = await Admin.find();

//     const services = [];

//     // allServices.map(
//     //   (item) =>
//     //     (item.serviceType.label === "Product" &&
//     //       products.push(item.serviceName)) ||
//     //     (item.serviceType.label === "Service" &&
//     //       services.push(item.serviceName)),
//     // );
//     allServices.map((service) => services.push(service));

//     return res.json({ allServices, services });
//   } catch (error) {
//     console.log(error);
//     res.status(500).json({ msg: "Server error, try again later" });
//   }
// };
export const addFrequency = async (req, res) => {
  const { freq } = req.body;
  try {
    if (!req.user.rights.addData)
      return res.status(403).json({ msg: "You are not allowed to Add data" });
    if (!freq)
      return res.status(400).json({
        msg: "Frequency is required",
      });
    const alreadyExists = await Frequency.findOne({ name: freq });
    if (alreadyExists)
      return res.status(400).json({
        msg: "Frequency already exists",
      });
    const frequency = await Frequency.create({
      name: freq,
    });
    return res.status(201).json({ msg: "Frequency added" });
  } catch (error) {
    return res.status(500).json({ msg: "Server error" });
  }
};
export const getFrequency = async (req, res) => {
  try {
    const frequency = await Frequency.find();
    if (!frequency) return res.status.json({ msg: "frequency not found" });

    res.status(200).json(frequency);
  } catch (error) {
    return res.status(500).json({ msg: "Server error" });
  }
};
export const removeFrequency = async (req, res) => {
  const { id } = req.params;
  try {
    if (!req.user.rights.delete)
      return res.status(403).json({ msg: "You are not allowed to delete" });
    const frequency = await Frequency.findByIdAndDelete(id);
    if (!frequency) return res.status.json({ msg: "frequency not found" });

    res.status(200).json({ msg: "frequency removed successfully" });
  } catch (error) {
    return res.status(500).json({ msg: "Server error" });
  }
};
export const addService = async (req, res) => {
  const { serviceName, scopes } = req.body;

  try {
    if (!req.user.rights.addData)
      return res.status(403).json({ msg: "You are not allowed to Add data" });
    if (!serviceName)
      return res.status(400).json({ msg: "Service name required" });

    const service = await Admin.findOne({
      "service.serviceName": {
        $regex: new RegExp(`^${serviceName.trim()}$`, "i"),
      },
    });
    if (service)
      return res.status(400).json({ msg: `${serviceName} already exists` });

    const filteredScopes =
      scopes?.filter((scope) => scope.scopeName?.trim() !== "") || [];

    const cleanedScopes = filteredScopes.map((scope) => ({
      ...scope,
      consumables:
        scope.consumables?.filter((item) => item.name?.trim() !== "") || [],
    }));

    const payload = {
      serviceName: serviceName.trim(),
      scopes: cleanedScopes,
    };

    const newService = await Admin.create({
      service: [payload],
    });

    res.status(200).json({ msg: `${serviceName} successfully added` });
  } catch (error) {
    console.log(error);
    res.status(500).json({ msg: "Server error, try again later" });
  }
};

export const getAllService = async (req, res) => {
  try {
    const services = await Admin.find();

    return res.json({ services });
  } catch (error) {
    console.log(error);
    res.status(500).json({ msg: "Server error, try again later" });
  }
};

export const editService = async (req, res) => {
  const { id } = req.params;
  const { type, data } = req.body;

  try {
    if (!req.user.rights.addData)
      return res.status(403).json({ msg: "You are not allowed to edit" });
    if (type === "serviceName") {
      const admin = await Admin.findOne({ "service._id": id });

      if (!admin) {
        return res.status(404).json({ msg: "Service not found" });
      }
      const service = admin.service.id(id);
      if (!service) {
        return res.status(404).json({ msg: "Service not found" });
      }

      service.serviceName = data;
      await admin.save();
      return res.status(200).json({
        msg: "Service updated successfully",
      });
    }
    if (type === "scope") {
      const service = await Admin.findOne({ "service._id": id });
      if (!service) return res.status(400).json({ msg: "service not found" });

      const selectedService = service.service.id(id);

      selectedService.scopes.push({
        scopeName: data,
        consumables: [],
      });
      await service.save();
      return res.status(200).json({ msg: "Scope added successfully!" });
    }
    //consumables
    if (type === "consumable") {
      const service = await Admin.findOne({ "service.scopes._id": id });
      if (!service) return res.status(400).json({ msg: "service not found" });
      let selectedScope;

      service.service.forEach((srv) => {
        const foundScope = srv.scopes.id(id);
        if (foundScope) {
          selectedScope = foundScope;
        }
      });
      if (!selectedScope)
        return res.status(404).json({ msg: "Scope not found" });

      selectedScope.consumables.push({ name: data });
      await service.save();

      return res.status(200).json({ msg: "consumable added successfully" });
    }
    return res.status(404).json({ msg: "Invalid type" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ msg: "Server error, try again later" });
  }
};

export const deleteService = async (req, res) => {
  const { id } = req.params;

  const { serviceId, type, scopeId } = req.body;
  try {
    if (!req.user.rights.delete)
      return res.status(403).json({ msg: "You are not allowed to delete" });
    // DELETE SCOPE
    if (type === "scope") {
      await Admin.findOneAndUpdate(
        { "service._id": serviceId },
        {
          $pull: {
            "service.$.scopes": {
              _id: id,
            },
          },
        },
        { new: true },
      );
      return res.status(200).json({
        msg: "Scope deleted successfully",
      });
    }
    // DELETE CONSUMABLE
    if (type === "consumable") {
      const service = await Admin.findOne({
        "service._id": serviceId,
      });
      if (!service)
        return res.status(404).json({
          msg: "Scope not found",
        });
      let selectedScope;

      service.service.forEach((srv) => {
        const foundScope = srv.scopes.id(scopeId);
        if (foundScope) {
          selectedScope = foundScope;
        }
      });
      selectedScope.consumables.pull(id);
      await service.save();
      return res.status(200).json({
        msg: "Consumable deleted successfully",
      });
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({
      msg: "Server error",
    });
  }
};

export const clientAdminDashboard = async (req, res) => {
  const { id } = req.body;
  try {
    const client = await Client.findById(req.user.client).select(
      "-adminPass -adminName",
    );
    if (!client) return res.status(404).json({ msg: "Client not found" });
    const statusCounts = await Location.aggregate([
      { $match: { client: req.user.client } },
      { $unwind: "$service" },
      { $unwind: "$service.schedule" },
      {
        $group: {
          _id: "$service.schedule.status",
          count: { $sum: 1 },
        },
      },
    ]);

    // ── Single query, split in JS ─────────────────────────────────
    const services = await Service.find({ client: id || req.user.client })
      .sort("updatedAt")
      .populate({ path: "location", select: "floor subLocation location" });

    const complaints = services.filter((s) => s.type === "Complaint");
    const regulars = services.filter((s) => s.type === "Regular");

    const today = new Date().toISOString().split("T")[0];

    // ── Overall dashboard counts ──────────────────────────────────
    const dashBoardData = {
      allcomplaints: complaints.length,
      Open: 0,
      "In Progress": 0,
      Close: 0,
      reopenCount: 0,
      completedServices: 0,
      statusCounts,
    };

    complaints.forEach((complaint) => {
      const { status, reopenCount } = complaint.complaintDetails;
      if (status === "Open") dashBoardData.Open += 1;
      else if (status === "In Progress") dashBoardData["In Progress"] += 1;
      else if (status === "Close") dashBoardData.Close += 1;
      if (reopenCount >= 1) dashBoardData.reopenCount += 1;
    });

    regulars.forEach((regular) => {
      regular.regularService.forEach((reg) => {
        reg.schedule.forEach((sch) => {
          if (sch.status === "Done") dashBoardData.completedServices++;
        });
      });
    });

    // ── Build month keys from client creation date to today ───────
    const startDate = new Date(client.createdAt);
    const endDate = new Date();

    const monthMap = {}; // key: "YYYY-MM"

    // Generate all months between client start and now
    const cursor = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
    while (cursor <= endDate) {
      const key = `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, "0")}`;
      monthMap[key] = {
        month: key,
        complaints: 0,
        Open: 0,
        "In Progress": 0,
        Close: 0,
        completedServices: 0,
        missedServices: 0,
      };
      cursor.setMonth(cursor.getMonth() + 1);
    }

    // ── Fill complaints month-wise (by createdAt) ─────────────────
    complaints.forEach((complaint) => {
      const d = new Date(complaint.createdAt);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      if (!monthMap[key]) return;

      monthMap[key].complaints += 1;
      const { status } = complaint.complaintDetails;
      if (status === "Open") monthMap[key].Open += 1;
      else if (status === "In Progress") monthMap[key]["In Progress"] += 1;
      else if (status === "Close") monthMap[key].Close += 1;
    });

    // ── Fill regular services month-wise (by schedule date) ───────
    regulars.forEach((regular) => {
      regular.regularService.forEach((reg) => {
        reg.schedule.forEach((sch) => {
          if (!sch.date) return;
          const key = sch.date.substring(0, 7); // "YYYY-MM" from "YYYY-MM-DD"
          if (!monthMap[key]) return;

          if (sch.completed) monthMap[key].completedServices++;
          if (sch.status === "Missed") monthMap[key].missedServices++;
        });
      });
    });

    // ── Convert to sorted array ───────────────────────────────────
    const monthlyData = Object.values(monthMap).sort((a, b) =>
      a.month.localeCompare(b.month),
    );

    return res.json({
      all: services,
      dashBoardData,
      latestComplaints: complaints.slice(0, 5),
      monthlyData,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ msg: "Server error, try again later" });
  }
};

export const adminDashboard = async (req, res) => {
  const { id } = req.params;
  const clientFilter = id && id !== "select" ? { client: id } : {};

  try {
    // ── 1. Fetch complaints ────────────────────────────────────────────────
    const populateOpts = [
      { path: "location", select: "floor subLocation location" },
      { path: "client", select: "name -_id" },
    ];

    const [complaints, allComplaints] = await Promise.all([
      Service.find(clientFilter).sort("-updatedAt").populate(populateOpts),
      Service.find({ type: "Complaint" }).populate([
        { path: "location", select: "floor subLocation location" },
        { path: "client", select: "name" },
      ]),
    ]);

    // ── 2. Helper: attach clientName ───────────────────────────────────────
    const withClientName = (item) => ({
      ...item._doc,
      clientName:
        item?.client?.name || item?.complaintDetails?.clientName || "-",
    });

    // ── 3. Summary counts ──────────────────────────────────────────────────
    const onlyComplaints = complaints.filter((c) => c.type === "Complaint");
    const onlyRegulars = complaints.filter((c) => c.type === "Regular");

    const statusMap = {
      Open: "open",
      "In Progress": "inProgress",
      Close: "closed",
    };
    const complaintData = onlyComplaints.reduce(
      (acc, c) => {
        const key = statusMap[c?.complaintDetails?.status];
        if (key) acc[key] += 1;
        return acc;
      },
      {
        total: onlyComplaints.length,
        open: 0,
        inProgress: 0,
        closed: 0,
      },
    );

    // ── 4. Service schedule counts ─────────────────────────────────────────
    const locationMatch =
      id && id !== "select"
        ? { $match: { client: new mongoose.Types.ObjectId(id) } }
        : { $match: {} };

    const serviceCount = await Location.aggregate([
      locationMatch,
      { $unwind: "$service" },
      { $unwind: "$service.schedule" },
      { $group: { _id: "$service.schedule.status", count: { $sum: 1 } } },
      { $project: { _id: 0, label: "$_id", count: 1 } },
    ]);

    // ── 5. Month-wise breakdown ────────────────────────────────────────────
    const monthlyMap = {};

    for (const item of complaints) {
      const date = new Date(item.createdAt);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      const label = date.toLocaleString("default", {
        month: "long",
        year: "numeric",
      });

      if (!monthlyMap[key]) {
        monthlyMap[key] = {
          month: label,
          complaints: 0,
          regulars: 0,
          open: 0,
          inProgress: 0,
          closed: 0,
        };
      }

      if (item.type === "Complaint") {
        monthlyMap[key].complaints += 1;
        const status = item?.complaintDetails?.status;
        if (status === "Open") monthlyMap[key].open += 1;
        if (status === "In Progress") monthlyMap[key].inProgress += 1;
        if (status === "Close") monthlyMap[key].closed += 1;
      } else if (item.type === "Regular") {
        monthlyMap[key].regulars += 1;
      }
    }

    const monthlyData = Object.entries(monthlyMap)
      .sort(([a], [b]) => a.localeCompare(b)) // chronological order
      .map(([, v]) => v);

    const sortedComplaints = [...complaints].sort(
      (a, b) => new Date(b.updatedAt) - new Date(a.updatedAt),
    );
    // return res.json({ complaints, allComplaints });
    return res.json({
      complaintData: [{ ...complaintData, serviceCount }],
      all: allComplaints.map(withClientName),
      latestComplaints: sortedComplaints.slice(0, 15).map(withClientName),
      monthlyData,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: "Server error, try again later" });
  }
};

export const runnerData = async (req, res) => {
  const { lat, lon } = req.query;
  const appId = process.env.OPENWEATHER_APIKEY;
  try {
    console.log(lat, lon, appId);
    if (!lat || !lon || !appId)
      return res.status(400).json({ msg: "information not provided" });

    const resp = await fetch(
      `https://pestindex.vercel.app/pestxz?appid=${appId}&lat=${lat}&lon=${lon}`,
    );

    if (!resp.ok) {
      return res
        .status(resp.status)
        .json({ msg: "failed fetching internal server error" });
    }
    const data = await resp.json();
    
    res.status(200).json(data);
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ msg: "Server error", error });
  }
};
