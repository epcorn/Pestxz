import Service from "../models/serviceModel.js";
import Client from "../models/clientModel.js";
import Location from "../models/locationModel.js";
import moment from "moment";
import exceljs from "exceljs";
import { sendEmail, uploadFile } from "../utils/helperFunction.js";
import Casual from "../models/casualServiceModel.js";

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
    return res.status(201).json({
      msg: `Your complaint number is ${complaint.complaintDetails.number}`,
    });
  } catch (error) {
    console.log(error);
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

  if (req.user.role !== "Admin") {
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
      .sort("-createdAt")
      .skip(limit * (pageNumber - 1))
      .limit(limit);

    console.log(complaints.length);
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
    const serviceDate = req.body.serviceDate; // "27-May"

    const locationService = location.service.find(
      (s) =>
        s.serviceId?.toString().trim() === service.serviceId?.toString().trim(),
    );

    if (locationService && Array.isArray(locationService.schedule)) {
      const target = locationService.schedule.find(
        (s) => s.date === serviceDate,
      );
      if (target) {
        target.completed = true;
        target.status = "Done";
        target.completedAt = new Date();
        target.completedBy = req.user.name;
      }
    }

    location.markModified("service");
    await location.save();

    const regularService = {
      serviceId: service.serviceId,
      serviceName: service.serviceName,
      frequency: service.frequency,
      serviceDate,
      schedule: locationService?.schedule || [],
      scopes: service.scopes?.map((scope) => ({
        scopeId: scope.scopeId,
        scopeName: scope.scopeName,
        consumables: scope.consumables?.map((con) => ({
          consumableId: con.consumableId,
          consumableName: con.consumableName,
          calibration: con.calibration,
          usedCalibration:
            usedCalibration?.[scope.scopeId]?.[con.consumableId] || "",
          action: action?.[scope.scopeId]?.[con.consumableId] || "Done",
          comment: comment?.[scope.scopeId]?.[con.consumableId] || "",
        })),
      })),
      image: imageLink,
      userName: req.user.name,
      role: req.user.role,
      status: "Done",
      completedAt: new Date(),
    };

    await Service.create({
      type: "Regular",
      regularService: [regularService],
      client: location.client,
      location: id,
    });

    return res.status(201).json({ msg: "Service updated successfully" });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ msg: "Server error, try again later" });
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
    return res.status(200).json({ msg: "Operator assigned successfully" });
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
    console.log(complaints);
    res.status(200).json(complaints);
  } catch (error) {
    res.status(500).json({ msg: "server error" });
  }
};

export const casualServices = async (req, res) => {
  const { id } = req.params;
  const data = req.body;

  try {
    let casualService;
    if (id === "create") {
      await Casual.create({
        client: data.client,
        location: data.location,
        serviceId: data.service.value,
        serviceName: data.service.label,
        user: { name: req.user.name, id: req.user._id },
      });

      return res.status(200).json({ msg: `casual service created by ` });
    }
    if (id.length === 24) {
      // client: data.client._id,
      // location: data.location.id,
      // serviceId: data.serviceId,
      // serviceName: data,
      // serviceName,
      // scopes: data.scopes.map((sc) => ({
      //   scopeId: sc.scopeId,
      //   scopeName: sc.scopeName,
      //   consumables: sc.consumables.map((con) => ({
      //     consumableId: con.consumableId,
      //     consumableName: con.consumableName,
      //     calibration: con.calibration,
      //     action: con.action,
      //     comment: con.comment,
      //   })),
      // })),
    }
  } catch (error) {
    console.log(error);
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

