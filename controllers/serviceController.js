import Service from "../models/serviceModel.js";
import Client from "../models/clientModel.js";
import Location from "../models/locationModel.js";
import moment from "moment";
import exceljs from "exceljs";
import { removeOldQr, sendEmail, uploadFile } from "../utils/helperFunction.js";
import Casual from "../models/casualServiceModel.js";
import ProductService from "../models/productService.js";
import mongoose from "mongoose";

export const newComplaint = async (req, res) => {
  const { id } = req.params;

  try {
    if (!req?.user?.rights?.raise) {
      return res.status(400).json({
        msg: "You are not allowed to raise a complaint",
      });
    }
    const location = await Location.findById(id);
    if (!location) {
      return res.status(404).json({ msg: "Location not found" });
    }
    let clientId;
    let client;
    if (req.user.type === "ClientAdmin" || req.user.type === "ClientEmployee") {
      clientId = req.user.client;
    } else {
      clientId = location.client;
    }

    client = await Client.findById(clientId);

    if (!client) {
      return res.status(404).json({
        msg: "Client not found",
      });
    }

    const lastComplaint = await Service.findOne({
      type: "Complaint",
      client: clientId,
    })
      .sort({ createdAt: -1 })
      .select("complaintDetails.number");
    let nextNumber = 2;
    if (lastComplaint?.complaintDetails?.number) {
      const lastNumber = parseInt(
        lastComplaint.complaintDetails?.number
          ?.replace(`${client?.contractNo?.replace(/\//g, "")}-COM`, "")
          .trim(),
      );
      nextNumber = lastNumber + 1;
    }
    const sr = `${client?.contractNo?.replace(/\//g, "")}-COM${nextNumber}`;
    const imageLinks = [];

    if (req.files?.images) {
      const images = Array.isArray(req.files.images)
        ? req.files.images
        : [req.files.images];

      for (const image of images) {
        const link = await uploadFile({
          filePath: image.tempFilePath,
        });
        if (!link) {
          return res.status(400).json({
            msg: "Image upload error. Try again later",
          });
        }
        imageLinks.push(link);
      }
    }
    const complaint = await Service.create({
      type: "Complaint",
      complaintDetails: {
        number: sr,
        service: Array.isArray(req.body.service)
          ? req.body.service
          : [req.body.service],
        userName: req.user.name,
        raisedBy: req.user.type,
        raisedByRole: req.user.role,
        clientName: client.name,
        status: "Open",
        image: imageLinks,
        comment: req.body.comment,
      },
      complaintUpdate: [
        {
          image: imageLinks,
          comment: req.body.comment,
          userName: req.user.name,
          raisedBy: req.user.type,
          raisedByRole: req.user.role,
          clientName: client.name,
          status: "Open",
          date: new Date(),
        },
      ],
      client: clientId,
      location: id,
    });
    console.log("compliant id: ", complaint._id);
    return res.status(201).json({
      msg: `Your complaint number is ${complaint.complaintDetails.number}`,
      url: `/complaint/${complaint._id}`,
    });
  } catch (error) {
    return res.status(500).json({
      msg: "Server error, try again later",
    });
  }
};

export const getSingleComplaint = async (req, res) => {
  const { id } = req.params;
  try {
    const complaint = await Service.findById(id);
    if (!complaint) return res.status(404).json({ msg: "Complaint not found" });
    return res.json(complaint);
  } catch (error) {
    console.log(error);
    res.status(500).json({ msg: "Server error, try again later" });
  }
};

export const updateComplaint = async (req, res) => {
  const { id } = req.params;
  try {
    const status = req.body.status;
    const canUpdateComplaint =
      req.user.role === "Admin" ||
      req.user.role === "Operator" ||
      req.user.role === "Supervisor" ||
      req.user.role === "TeamLeader" ||
      req.user.role === "ClientAdmin";
    if (!canUpdateComplaint) {
      return res.status(403).json({
        msg: "You are not authorized",
      });
    }
    const complaint = await Service.findById(id);
    if (!complaint) {
      return res.status(404).json({
        msg: "Complaint not found",
      });
    }
    // BLOCK IF FINALLY CLOSED
    if (complaint.complaintDetails.finalClosed) {
      return res.status(400).json({
        msg: "Complaint is permanently closed",
        url: `/complaint/${complaint._id}`,
      });
    }
    // IMAGE UPLOAD
    const imageLinks = [];
    if (req.files?.images) {
      let images = [];
      if (Array.isArray(req.files.images)) {
        images = req.files.images;
      } else {
        images = [req.files.images];
      }
      for (const image of images) {
        const link = await uploadFile({
          filePath: image.tempFilePath,
        });
        if (!link) {
          return res.status(400).json({
            msg: "Image upload error. Try again later",
          });
        }
        imageLinks.push(link);
      }
    }
    // REOPEN LOGIC
    if (status === "Reopen") {
      // only client admin can reopen
      if (req.user.role !== "ClientAdmin") {
        return res.status(403).json({
          msg: "Only Client Admin can reopen complaint",
        });
      }
      const reopenCount = complaint.complaintDetails.reopenCount || 0;
      if (reopenCount >= 3) {
        complaint.complaintDetails.finalClosed = true;
        complaint.complaintDetails.status = "Final Closed";

        await complaint.save();
        return res.status(400).json({
          msg: "Maximum reopen limit reached. Complaint permanently closed.",
        });
      }
      complaint.complaintDetails.reopenCount = reopenCount + 1;
    }
    // FINAL CLOSE
    if (status === "Close" && complaint.complaintDetails.reopenCount >= 3) {
      complaint.complaintDetails.finalClosed = true;
    }

    // UPDATE HISTORY
    complaint.complaintUpdate.push({
      image: imageLinks,
      comment: req.body.comment,
      userName: req.user.name,
      status,
      date: new Date(),
    });

    // MAIN STATUS UPDATE
    complaint.complaintDetails.status = status;
    await complaint.save();
    return res.json({
      msg: "Updated successfully",
      url: `/complaint/${complaint._id}`,
    });
  } catch (error) {
    console.log(error);

    return res.status(500).json({
      msg: "Server error, try again later",
    });
  }
};

export const getAllComplaints = async (req, res) => {
  const { search, page, client, location } = req.query;

  const query = { type: "Complaint" };

  if (req.user.type !== "PestEmployee") {
    query.client = req.user.client;
  } else if (client) {
    query.client = client;
  }

  if (search) {
    query["complaintDetails.number"] = { $regex: search, $options: "i" };
  }

  if (location && location !== "All") {
    const matchingLocations = await Location.find({ floor: location }).select(
      "_id",
    );
    query.location = { $in: matchingLocations.map((l) => l._id) };
  }

  try {
    const pageNumber = Number(page) || 1;
    const limit = 10;

    const total = await Service.countDocuments(query);
    const complaints = await Service.find(query)
      .populate({
        path: "location client",
        select: "floor subLocation location name",
      })
      .sort("-updatedAt")
      .skip(limit * (pageNumber - 1))
      .limit(limit);

    return res.status(200).json({
      complaints,
      pages: Math.min(10, Math.ceil(total / limit)),
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ msg: "Server error, try again later" });
  }
};

export const newRegularService = async (req, res) => {
  const { id } = req.params;

  try {
    const location = await Location.findById(id);
    if (!location) return res.status(404).json({ msg: "Location not found" });

    let imageLink = [];
    if (req.files?.image) {
      const file = Array.isArray(req.files.image)
        ? req.files.image
        : [req.files.image];

      const fileUpload = file.slice(0, 2);
      for (const file of fileUpload) {
        const link = await uploadFile({ filePath: file.tempFilePath });
        imageLink.push(link);
      }
    }

    const service = JSON.parse(req.body.service);
    const usedCalibration = JSON.parse(req.body.usedCalibration || "{}");
    const action = JSON.parse(req.body.action || "{}");
    const comment = JSON.parse(req.body.comment || "{}");
    const serviceDate = req.body.serviceDate;

    const locationService = location.service.find(
      (s) =>
        s.serviceId?.toString().trim() === service.serviceId?.toString().trim(),
    );

    // ── De-duplicated conditional check ──
    if (!locationService || !Array.isArray(locationService.schedule)) {
      return res
        .status(400)
        .json({ msg: "Service schedule data not found for this location" });
    }

    const target = locationService.schedule.find((s) => {
      if (!s.date) return false;

      const dateString =
        typeof s.date.toISOString === "function"
          ? s.date.toISOString().split("T")[0]
          : String(s.date).split("T")[0];
      // console.log(dateString, new Date(serviceDate).toISOString().split("T")[0]);
      return (
        dateString === new Date(serviceDate).toISOString().split("T")[0] &&
        !s.completed
      );
    });

    // Safeguard guard clause to prevent tracking empty/ghost services
    if (!target) {
      return res.status(400).json({
        msg: "No matching pending schedule date found or date already completed.",
      });
    }

    // Update target parameters safely
    target.completed = true;
    target.status = "Done";
    target.completedAt = serviceDate;
    target.completedBy = req.user.name;

    location.markModified("service");
    await location.save();

    const regularService = {
      serviceId: service.serviceId,
      serviceName: service.serviceName,
      frequency: service.frequency,
      serviceDate,
      schedule: locationService.schedule,
      scopes: service.scopes?.map((scope) => ({
        scopeId: scope.scopeId,
        scopeName: scope.scopeName,
        consumables: scope.consumables?.map((con) => ({
          consumableId: con.consumableId,
          consumableName: con.consumableName,
          calibration: con.calibration,
          usedCalibration:
            usedCalibration?.[scope.scopeId]?.[con.consumableId] || "1",
          action: action?.[scope.scopeId]?.[con.consumableId] || "Done",
          comment: comment?.[scope.scopeId]?.[con.consumableId] || "Completed",
        })),
      })),
      image: imageLink,
      userName: req.user.name,
      role: req.user.role,
      status: "Done",
      completedAt: serviceDate,
    };

    await Service.create({
      type: "Regular",
      regularService: [regularService],
      client: location.client,
      location: id,
      createdAt: new Date(serviceDate),
      updatedAt: new Date(serviceDate),
    });

    return res.status(201).json({
      msg: `Service Done on ${location.floor}`,
      client: location.client,
      user: req.user.name,
      url: `/`,
    });
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .json({ msg: "Server error, try again later", error });
  }
};

export const assignWork = async (req, res) => {
  const { value, label, complaintId } = req.body;
  try {
    if (!value) return res.status(400).json({ msg: "userId not provided" });
    const service = await Service.findById(complaintId);
    if (!service) return res.status(400).json({ msg: "complaint not found" });

    if (service.complaintDetails.assignedTo.status === true)
      return res.status(403).json({
        msg: `Already assigned to ${service.complaintDetails.assignedTo.userName}`,
      });
    if (service.status !== "Open") {
      service.complaintDetails.assignedTo = {
        userId: value,
        userName: label,
        assignedAt: new Date(),
        status: true,
      };
      service.complaintDetails.assignedBy = {
        userId: req.user._id,
        userName: req.user.name,
        role: req.user.role,
      };
    }

    await service.save();
    return res.status(200).json({
      msg: "Operator assigned successfully",
      url: `/complaint/${complaintId}`,
    });
  } catch (error) {
    console.error("Error in assignWork controller:", error);
    return res.status(500).json({
      success: false,
      msg: "Internal server error",
      error: error.message,
    });
  }
};

export const getAllAssignedWork = async (req, res) => {
  try {
    const complaints = await Service.find({
      type: "Complaint",
      "complaintDetails.assignedTo.userId": req.user._id,
    }).sort({ updatedAt: -1 });

    res.status(200).json(complaints);
  } catch (error) {
    res.status(500).json({ msg: "server error" });
  }
};

export const casualServices = async (req, res) => {
  const { service, usedCalibration, action, comment } = req.body;

  try {
    if (!service) {
      return res.status(400).json({ msg: "Missing services data" });
    }

    const parsedService = JSON.parse(service);
    const parsedUsedCalibration = usedCalibration
      ? JSON.parse(usedCalibration)
      : {};
    const parsedAction = action ? JSON.parse(action) : {};
    const parsedComment = comment ? JSON.parse(comment) : {};

    const { serviceId, serviceName, scopes, locationId } = parsedService;
    if (!locationId)
      return res.status(400).json({ msg: "missing location id" });

    const location = await Location.findById(locationId);
    if (!location)
      return res.status(400).json({ msg: "location not available" });

    const imageUrl = [];
    if (req?.files?.image) {
      const images = Array?.isArray(req?.files?.image)
        ? req.files.image
        : [req.files.image];
      for (const image of images) {
        const link = await uploadFile({ filePath: image.tempFilePath });
        if (!link) {
          return res.status(400).json({ msg: "Image upload error" });
        }
        imageUrl.push(link);
      }
    }

    const scopeReadings = (scopes || []).map((sc) => ({
      scopeId: sc.scopeId,
      scopeName: sc.scopeName,
      consumables: (sc.consumables || []).map((con) => ({
        consumableId: con.consumableId,
        consumableName: con.consumableName,
        calibration: con.calibration || 0,
        used: parsedUsedCalibration?.[sc.scopeId]?.[con.consumableId] || "",
        action: parsedAction?.[sc.scopeId]?.[con.consumableId] || "",
        comment: parsedComment?.[sc.scopeId]?.[con.consumableId] || "",
      })),
    }));

    await Casual.create({
      status: "Done",
      client: location.client,
      location: locationId,
      image: imageUrl,
      service: [
        {
          serviceId,
          serviceName,
          scopes: scopeReadings,
          completed: true,
        },
      ],
      user: { name: req.user.name, id: req.user._id },
    });

    return res.status(200).json({ msg: `casual service created by `, url: `` });
  } catch (error) {
    console.error(error);
    res.status(500).json(error.message);
  }
};

export const getCasualServices = async (req, res) => {
  try {
    const casuals = await Casual.find();
    if (!casuals)
      return res.status(400).json({ msg: "No casual service s added!" });

    res.status(200).json(casuals);
  } catch (error) {
    res.status(500).json({ msg: "server error" });
  }
};

export const addProductService = async (req, res) => {
  const {
    locationId,
    quality,
    calibration,
    code,
    product,
    serialNo,
    version,
    serviceDate,
  } = req.body;
  try {
    const location = await Location.findById(locationId);
    if (!location) return res.status(404).json({ msg: "Location not found" });

    const isSameUTCDay = (a, b) =>
      a.getUTCFullYear() === b.getUTCFullYear() &&
      a.getUTCMonth() === b.getUTCMonth() &&
      a.getUTCDate() === b.getUTCDate();

    const today = new Date(serviceDate);
    console.log(serviceDate, today);

    const locationProduct = location.product.find(
      (p) =>
        p.serialNo?.toString().trim() === serialNo?.toString().trim() &&
        p.productId?.toString() === product.id?.toString() &&
        p.schedule?.some(
          (sc) => isSameUTCDay(new Date(sc.date), today) && !sc.completed,
        ),
    );
    console.log("location product:", locationProduct);
    if (!locationProduct) {
      return res
        .status(404)
        .json({ msg: "Product not found for this location" });
    }

    if (Array.isArray(locationProduct.schedule)) {
      const target = locationProduct.schedule.find(
        (s) => isSameUTCDay(new Date(s.date), today) && !s.completed,
      );

      if (target) {
        target.completed = true;
        target.status = "Done";
        target.completedAt = today;
        target.completedBy = req.user.name;
      }
      console.log("target: ", target);
    }

    await ProductService.create({
      quality: { status: quality.status, image: quality.image },
      product: { name: product.name, id: product.id },
      code,
      serialNo,
      version: { name: version.name, id: version.id },
      calibration: calibration.map((cal) => ({
        name: cal.name,
        status: cal.status,
        image: cal.image,
        size: cal?.size || "",
      })),
      servicedBy: {
        name: req.user.name,
        id: req.user._id,
        date: today,
      },
      location: locationId,
      client: location.client,
      success: true,
      createdAt: today,
      updatedAt: today,
    });

    location.markModified("product");
    await location.save();

    return res.status(201).json({
      msg: `Product service ${product.name}`,
      client: location.client,
      user: req.user.name,
    });
  } catch (error) {
    try {
      const imagesurls = [quality.image];
      if (typeof quality.image === "string") {
        imagesurls.push(quality.image);
      }
      if (Array.isArray(calibration)) {
        calibration.forEach((cal) => {
          if (
            typeof cal.image === "string" &&
            cal.image !== "" &&
            cal.image.trim()
          ) {
            imagesurls.push(cal.image);
          }
        });
      }
      const uniqueImgs = [...new Set(imagesurls)];

      for (let imgs of uniqueImgs) {
        await removeOldQr(imgs);
      }
      console.log(`images cleared ${uniqueImgs.length}`);
    } catch (error) {
      console.log("error in removing old urls: ", error);
    }
    console.error("error occurred: ", error);
    return res.status(500).json({ msg: "Internal server error" });
  }
};
