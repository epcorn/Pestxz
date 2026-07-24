import Admin from "../models/adminModel.js";
import Location from "../models/locationModel.js";
import Service from "../models/serviceModel.js";
import { Unscheduled } from "../models/unScheduleModel.js";
import { uploadFile } from "../utils/helperFunction.js";

export const unScheduleReport = async (req, res) => {
  const data = req.body;
  console.log(data);
  try {
    let unschedule;

    if (data.type === "update") {
      const unscheduledId = data.unscheduledId;
      const unscheduled = await Unscheduled.findById(unscheduledId);
      if (!unscheduled)
        return res.status(400).json({ msg: "Unscheduled report not found" });

      let ser;
      try {
        ser =
          typeof data.service === "string"
            ? JSON.parse(data.service)
            : data.service;
      } catch (e) {
        return res.status(400).json({ msg: "Invalid service data format" });
      }

      const parsedUsedCalibration = data.usedCalibration
        ? JSON.parse(data.usedCalibration)
        : {};
      const parsedAction = data.action ? JSON.parse(data.action) : {};
      const parsedComment = data.comment ? JSON.parse(data.comment) : {};

      const imageUrl = [];
      if (req.files?.image) {
        const images = Array.isArray(req.files.image)
          ? req.files.image
          : [req.files.image];
        for (const img of images) {
          const link = await uploadFile({ filePath: img.tempFilePath });
          if (!link)
            return res
              .status(400)
              .json({ msg: "Image upload error. Try again later" });
          imageUrl.push(link);
        }
      }

      const target = unscheduled.service.find(
        (s) =>
          s.serviceId?.toString() === ser.serviceId?.toString() ||
          s.serviceName === ser.serviceName,
      );
      if (!target)
        return res
          .status(400)
          .json({ msg: "Service not found on this report" });

      const scopeReadings = (ser.scopes || []).map((sc) => ({
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
      
      target.scopes = scopeReadings;
      target.completed = true;
      target.completedAt = new Date();
      target.completionImages = imageUrl;
      target.completedBy = { user: req.user.name, id: req.user._id };

      unscheduled.update = { user: req.user.name, id: req.user._id };
      await unscheduled.save();

      return res
        .status(200)
        .json({ msg: "Unscheduled service updated", imageUrl });
    }

    if (data.type === "raise") {
      const location = await Location.findById(data.locationId);
      if (!location) return res.status(400).json({ msg: "location not found" });

      let service_array;
      try {
        service_array =
          typeof data.service === "string"
            ? JSON.parse(data.service)
            : data.service;
      } catch (e) {
        return res.status(400).json({ msg: "Invalid service data format" });
      }
      if (!Array.isArray(service_array)) {
        service_array = service_array ? [service_array] : [];
      }
      if (service_array.length === 0) {
        return res.status(400).json({ msg: "Service details are missing" });
      }

      const serviceIds = service_array.map((s) => s.value);
      const adminDocs = await Admin.find({
        "service._id": { $in: serviceIds },
      });
      if (!adminDocs.length)
        return res.status(400).json({ msg: "Service not found" });

      const serviceMap = new Map();
      adminDocs.forEach((doc) => {
        doc.service.forEach((s) => serviceMap.set(s._id.toString(), s));
      });

      const parsedServices = service_array.map((selectedService) => {
        const matched = serviceMap.get(selectedService.value.toString());

        const scopes = (matched?.scopes || []).map((sc) => ({
          scopeId: sc._id,
          scopeName: sc.scopeName,
          consumables: (sc.consumables || []).map((con) => ({
            consumableId: con._id,
            consumableName: con.name,
            calibration: "0",
          })),
        }));

        return {
          serviceName: selectedService.label,
          serviceId: selectedService.value,
          scopes,
        };
      });

      const imageUrl = [];
      if (req.files?.image) {
        const images = Array.isArray(req.files.image)
          ? req.files.image
          : [req.files.image];
        for (const img of images) {
          const link = await uploadFile({ filePath: img.tempFilePath });
          if (!link)
            return res
              .status(400)
              .json({ msg: "Image upload error. Try again later" });
          imageUrl.push(link);
        }
      }

      const unschedule = await Unscheduled.create({
        client: location.client,
        location: data.locationId,
        comment: data.comment,
        image: imageUrl,
        raisedBy: { user: req.user.name, id: req.user._id },
        service: parsedServices,
        type: "Unscheduled",
      });

      const serviceNamesReported = unschedule.service
        .map((s) => s.serviceName)
        .join(", ");
      return res.status(200).json({
        msg: `Pest reported for ${serviceNamesReported}`,
        imageUrl,
      });
    }
    return res.status(400).json({ msg: "Invalid type" });
  } catch (error) {
    console.error("server error: ", error);
    return res.status(500).json({ msg: "Server error" });
  }
};

export const getUnscheduledReports = async (req, res) => {
  const { id } = req.params;

  try {
    let unschedule;

    if (id.length === 24) {
      unschedule = await Unscheduled.findById(id)
        .populate("location")
        .populate({ path: "client", select: "name" });
    } else if (id === "Operator") {
      unschedule = await Unscheduled.find({ "raisedBy.id": req.user._id }).sort(
        { updatedAt: -1 },
      );
    } else {
      unschedule = await Unscheduled.find({
        client: req.user.client,
      })
        .sort({ updatedAt: 1 })
        .populate({ path: "client", select: "name" });
    }

    res.status(200).json(unschedule);
  } catch (error) {
    console.error("Server error", error);
  }
};

export const statusUnscheduled = async (req, res) => {
  const { id } = req.params;
  const data = req.body;
  try {
    const unschedule = await Unscheduled.findById(id);
    const location = await Location.findById(unschedule.location);

    if (data?.read) {
      unschedule.read = true;
    }

    if (data?.req === "update") {
    } else if (data.req === "approval") {
      unschedule.approval.status = data?.status;
      unschedule.approval.id = req.user._id;
      unschedule.approval.name = req.user.name;
    }

    await unschedule.save();
    res
      .status(200)
      .json({
        msg: `Unschedule work for ${location.floor} has been ${data.status}`,
        url: `/unschedule/${id}`,
      });
  } catch (error) {
    res.status(500).json({ msg: "server error" });
  }
};
