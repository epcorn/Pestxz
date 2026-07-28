import mongoose from "mongoose";
import Admin from "../models/adminModel.js";
import Client from "../models/clientModel.js";
import Frequency from "../models/frequencyModal.js";
import Location from "../models/locationModel.js";
import Service from "../models/serviceModel.js";
import { capitalLetter, uploadFile } from "../utils/helperFunction.js";
import Product from "../models/productModel.js";
import ProductService from "../models/productService.js";
import Casual from "../models/casualServiceModel.js";
import { Unscheduled } from "../models/unScheduleModel.js";

export const imageUploader = async (req, res) => {
  try {
    if (!req.files || !req.files.image)
      return res.status(400).json({ msg: "No images provided" });

    const url = await uploadFile({ filePath: req.files.image.tempFilePath });
    if (!url) return res.status(502).json({ msg: "Image upload failed" });
    res.status(200).json({ msg: "Image Uploaded", url });
  } catch (error) {
    console.log("Image upload error: ", error);
    res
      .status(500)
      .json({ msg: "Image Uploaded failed", error: error.message });
  }
};

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

const getDateRange = (filter, startDate) => {
  const now = startDate ? new Date(startDate) : new Date();
  let start = new Date(now);
  let end = new Date(now);

  switch (filter?.toLowerCase()) {
    case "daily": {
      start.setHours(0, 0, 0, 0);
      end = new Date(start);
      end.setDate(end.getDate() + 1);
      break;
    }
    case "weekly": {
      start.setDate(now.getDate() - now.getDay());
      start.setHours(0, 0, 0, 0);
      end = new Date(start);
      end.setDate(end.getDate() + 7);
      break;
    }
    case "monthly": {
      start = new Date(now.getFullYear(), now.getMonth(), 1);
      end = new Date(now.getFullYear(), now.getMonth() + 1, 1);
      break;
    }
    case "yearly": {
      start = new Date(now.getFullYear(), 0, 1);
      end = new Date(now.getFullYear() + 1, 0, 1);
      break;
    }
    case "overall":
    default: {
      return { dateFilter: {}, scheduleDateFilter: {} };
    }
  }

  return {
    dateFilter: { createdAt: { $gte: start, $lt: end } },
    scheduleDateFilter: { "combinedSchedules.date": { $gte: start, $lt: end } },
  };
};

export async function adminDashboard(req, res) {
  const { id } = req.params;
  const { filter = "overall", startDate } = req.query;
  const isSpecificClient = id && id !== "select";

  const clientMatch = isSpecificClient
    ? { client: new mongoose.Types.ObjectId(id) }
    : {};

  const clientMatchStage = isSpecificClient
    ? { $match: { client: new mongoose.Types.ObjectId(id) } }
    : { $match: {} };

  // Calculate clean start & end date range based on filter and startDate
  const { dateFilter, scheduleDateFilter } = getDateRange(filter, startDate);

  try {
    const populateLocationAndClient = [
      { path: "location", select: "floor subLocation location" },
      { path: "client", select: "name" },
    ];

    const [
      latestComplaints,
      latestServices,
      casualServices,
      casualCounts,
      unscheduledServices,
      unscheduledCounts,
      pestCountData,
      complaintMetrics,
      productDashboard,
      serviceDashboard,
    ] = await Promise.all([
      // 1. Complaints List
      Service.find({ ...clientMatch, ...dateFilter, type: "Complaint" })
        .sort({ updatedAt: -1 })
        .limit(30)
        .populate(populateLocationAndClient)
        .lean(),

      // 2. Regular Services List
      Service.find({ ...clientMatch, ...dateFilter, type: "Regular" })
        .sort({ createdAt: -1 })
        .limit(30)
        .populate(populateLocationAndClient)
        .lean(),

      Casual.find({ ...clientMatch, ...dateFilter })
        .sort({ createdAt: -1 })
        .limit(30)
        .populate(populateLocationAndClient)
        .lean(),
      Casual.countDocuments({ ...clientMatch, ...dateFilter }),
      Unscheduled.find({ ...clientMatch, ...dateFilter })
        .sort({
          createdAt: -1,
        })
        .populate(populateLocationAndClient)
        .limit(30),
      Unscheduled.countDocuments({ ...clientMatch, ...dateFilter }),

      // 3. Pest Count Aggregation by Pest Name
      Service.aggregate([
        { $match: { type: "Regular", ...dateFilter, ...clientMatch } },
        { $unwind: "$regularService" },
        { $match: { "regularService.pestCount": { $gt: 0 } } },
        {
          $group: {
            _id: "$regularService.serviceName",
            totalCount: { $sum: "$regularService.pestCount" },
          },
        },
      ]),

      // 4. Complaint Status Summary Metrics
      Service.aggregate([
        { $match: { type: "Complaint", ...dateFilter, ...clientMatch } },
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            open: {
              $sum: {
                $cond: [{ $eq: ["$complaintDetails.status", "Open"] }, 1, 0],
              },
            },
            inProgress: {
              $sum: {
                $cond: [
                  { $eq: ["$complaintDetails.status", "In Progress"] },
                  1,
                  0,
                ],
              },
            },
            closeReq: {
              $sum: {
                $cond: [
                  { $eq: ["$complaintDetails.status", "Close Req"] },
                  1,
                  0,
                ],
              },
            },
            closed: {
              $sum: {
                $cond: [{ $eq: ["$complaintDetails.status", "Close"] }, 1, 0],
              },
            },
            reopenCount: {
              $sum: { $ifNull: ["$complaintDetails.reopenCount", 0] },
            },
          },
        },
      ]),

      // 5. Product Metrics
      Location.aggregate([
        clientMatchStage,
        {
          $facet: {
            totalProducts: [{ $unwind: "$product" }, { $count: "count" }],
            scheduleCount: [
              { $unwind: "$product" },
              { $unwind: "$product.schedule" },
              {
                $match: scheduleDateFilter["combinedSchedules.date"]
                  ? {
                      "product.schedule.date":
                        scheduleDateFilter["combinedSchedules.date"],
                    }
                  : {},
              },
              {
                $group: { _id: "$product.schedule.status", count: { $sum: 1 } },
              },
              { $project: { _id: 0, label: "$_id", count: 1 } },
            ],
          },
        },
      ]),

      // 6. Service Metrics
      Location.aggregate([
        clientMatchStage,
        {
          $facet: {
            totalServices: [{ $unwind: "$service" }, { $count: "count" }],
            scheduleCount: [
              { $unwind: "$service" },
              { $unwind: "$service.schedule" },
              {
                $match: scheduleDateFilter["combinedSchedules.date"]
                  ? {
                      "service.schedule.date":
                        scheduleDateFilter["combinedSchedules.date"],
                    }
                  : {},
              },
              {
                $group: { _id: "$service.schedule.status", count: { $sum: 1 } },
              },
              { $project: { _id: 0, label: "$_id", count: 1 } },
            ],
          },
        },
      ]),
    ]);

    // Format Product & Service Counts
    const statuses = ["Done", "Pending", "Missed"];

    const productData = {
      total: productDashboard?.[0]?.totalProducts?.[0]?.count || 0,
      scheduleCount: statuses.map((label) => ({
        label,
        count:
          productDashboard?.[0]?.scheduleCount?.find(
            (item) => item.label === label,
          )?.count || 0,
      })),
    };

    const serviceData = {
      total: serviceDashboard?.[0]?.totalServices?.[0]?.count || 0,
      scheduleCount: statuses.map((label) => ({
        label,
        count:
          serviceDashboard?.[0]?.scheduleCount?.find(
            (item) => item.label === label,
          )?.count || 0,
      })),
    };

    // Format Complaint Metrics
    const complaintData = complaintMetrics[0] || {
      total: 0,
      open: 0,
      closeReq: 0,
      closed: 0,
      inProgress: 0,
      reopenCount: 0,
    };
    delete complaintData._id;

    // Format Pest Counts into key-value map (e.g., { Mosquito: 12, Cockroach: 5 })
    const pestCounts = {};
    pestCountData.forEach((item) => {
      if (item._id) pestCounts[item._id] = item.totalCount;
    });

    return res.json({
      summary: {
        complaints: complaintData,
        products: productData,
        services: serviceData,
        pestCounts,
        casualCounts,
        unscheduledCounts,
      },
      latestCasuals: casualServices,
      latestUnschedules: unscheduledServices,
      latestComplaints,
      latestServices,
    });
  } catch (error) {
    console.error("Admin Dashboard Error:", error);
    return res.status(500).json({ msg: "Server error, try again later" });
  }
}

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

export const adminDashboardMonthlyTrend = async (req, res) => {
  const { id } = req.params;
  const isSpecificClient = id && id !== "select";

  const clientMatch = isSpecificClient
    ? { client: new mongoose.Types.ObjectId(id) }
    : {};

  const clientMatchStage = isSpecificClient
    ? { $match: { client: new mongoose.Types.ObjectId(id) } }
    : { $match: {} };

  try {
    const [complaints, regular, product] = await Promise.all([
      // 1. Complaints Trend
      Service.aggregate([
        {
          $match: {
            type: "Complaint",
            ...clientMatch,
          },
        },
        {
          $group: {
            _id: {
              year: { $year: "$createdAt" },
              month: { $month: "$createdAt" },
            },
            totalComplaints: { $sum: 1 },
            closedComplaints: {
              $sum: {
                $cond: [{ $eq: ["$complaintDetails.status", "Close"] }, 1, 0],
              },
            },
          },
        },
        {
          $sort: {
            "_id.year": 1,
            "_id.month": 1,
          },
        },
      ]),

      // 2. Regular Services Done Trend
      Location.aggregate([
        clientMatchStage,
        { $unwind: "$service" },
        { $unwind: "$service.schedule" },
        {
          $match: {
            "service.schedule.status": "Done",
          },
        },
        {
          $group: {
            _id: {
              year: { $year: "$service.schedule.date" },
              month: { $month: "$service.schedule.date" },
            },
            totalRegularDone: { $sum: 1 },
          },
        },
        {
          $sort: {
            "_id.year": 1,
            "_id.month": 1,
          },
        },
      ]),

      // 3. Product Services Done Trend
      Location.aggregate([
        clientMatchStage,
        { $unwind: "$product" },
        { $unwind: "$product.schedule" },
        {
          $match: {
            "product.schedule.status": "Done",
          },
        },
        {
          $group: {
            _id: {
              year: { $year: "$product.schedule.date" },
              month: { $month: "$product.schedule.date" },
            },
            totalProductDone: { $sum: 1 },
          },
        },
        {
          $sort: {
            "_id.year": 1,
            "_id.month": 1,
          },
        },
      ]),
    ]);

    const dashboardMap = {};

    const ensureMonth = (year, month) => {
      const key = `${year}-${String(month).padStart(2, "0")}`;

      if (!dashboardMap[key]) {
        dashboardMap[key] = {
          month: new Date(year, month - 1).toLocaleDateString("en-IN", {
            month: "long",
            year: "numeric",
          }),
          totalComplaints: 0,
          closedComplaints: 0,
          totalRegularDone: 0,
          totalProductDone: 0,
        };
      }
      return dashboardMap[key];
    };

    // Populate aggregated data into map
    complaints.forEach((item) => {
      if (item._id?.year && item._id?.month) {
        const month = ensureMonth(item._id.year, item._id.month);
        month.totalComplaints = item.totalComplaints;
        month.closedComplaints = item.closedComplaints;
      }
    });

    regular.forEach((item) => {
      if (item._id?.year && item._id?.month) {
        const month = ensureMonth(item._id.year, item._id.month);
        month.totalRegularDone = item.totalRegularDone;
      }
    });

    product.forEach((item) => {
      if (item._id?.year && item._id?.month) {
        const month = ensureMonth(item._id.year, item._id.month);
        month.totalProductDone = item.totalProductDone;
      }
    });

    // Convert map to sorted array
    const trendData = Object.entries(dashboardMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([, value]) => value);

    return res.status(200).json(trendData);
  } catch (error) {
    console.error("Admin Dashboard Monthly Trend Error:", error);
    return res.status(500).json({ msg: "Server error, try again later" });
  }
};
