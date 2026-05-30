import Admin from "../models/adminModel.js";
import Client from "../models/clientModel.js";
import Frequency from "../models/frequencyModal.js";
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
  const { serviceName,scopes } = req.body;
  console.log(serviceName,scopes);
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
      return res
        .status(400)
        .json({ msg: `${serviceName} already exists` });

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
  console.log(id, type, data);
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
  try {
    const client = await Client.findById(req.user.client).select("-adminPass -adminName");
    if (!client) return res.status(404).json({ msg: "Client not found" });

    const complaints = await Service.find({
      type: "Complaint",
      client: req.user.client,
    })
      .sort("-updatedAt")
      .populate({ path: "location", select: "floor subLocation location" });

    const complaintData = [complaints.length, 0, 0, 0];

    for (let complaint of complaints) {
      if (complaint.complaintDetails.status === "Open") complaintData[1] += 1;
      else if (complaint.complaintDetails.status === "In Progress")
        complaintData[2] += 1;
      else if (complaint.complaintDetails.status === "Close")
        complaintData[3] += 1;
    }

    return res.json({
      complaintData,
      latestComplaints: complaints.slice(0, 5),
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ msg: "Server error, try again later" });
  }
};

export const adminDashboard = async (req, res) => {
  const { id } = req.params;

  try {
    let complaints = [];

    if (id && id !== "select") {
      complaints = await Service.find({
        client: id,
      })
        .sort("-updatedAt")
        .populate({
          path: "location",
          select: "floor subLocation location",
        })
        .populate({
          path: "client",
          select: "name",
        });
    } else {
      complaints = await Service.find()
        .sort("-updatedAt")
        .populate({
          path: "location",
          select: "floor subLocation location",
        })
        .populate({
          path: "client",
          select: "name",
        });
    }

    const allcomplaints = await Service.find({
      type: "Complaint",
    })
      .populate({
        path: "location",
        select: "floor subLocation location",
      })
      .populate({
        path: "client",
        select: "name",
      });

    // ADD CLIENT NAME
    const formattedComplaints = complaints.map((item) => ({
      ...item._doc,
      clientName:
        item?.client?.name || item?.complaintDetails?.clientName || "-",
    }));

    const formattedAllComplaints = allcomplaints.map((item) => ({
      ...item._doc,
      clientName:
        item?.client?.name || item?.complaintDetails?.clientName || "-",
    }));

    const complaintData = {
      total: complaints.length,
      open: 0,
      inProgress: 0,
      closed: 0,
    };

    for (let complaint of complaints) {
      const status = complaint?.complaintDetails?.status;

      if (status === "Open") complaintData.open += 1;
      else if (status === "In Progress") complaintData.inProgress += 1;
      else if (status === "Close") complaintData.closed += 1;
    }

    return res.json({
      complaintData: [complaintData],
      all: formattedAllComplaints,
      latestComplaints: formattedComplaints.slice(0, 7),
    });
  } catch (error) {
    console.log(error);

    res.status(500).json({
      msg: "Server error, try again later",
    });
  }
};
