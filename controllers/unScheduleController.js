import Admin from "../models/adminModel.js";
import Location from "../models/locationModel.js";
import Service from "../models/serviceModel.js";
import { Unscheduled } from "../models/unScheduleModel.js";

export const unScheduleReport = async (req, res) => {
  const data = req.body;
  try {
    let unschedule;
    // update service work
    if (data.type === "update") {
      unschedule = await Unscheduled.findByIdAndUpdate(
        data.id,
        {
          $set: {
            "update.comment": data.comment,
            "update.status": data.status.label,
            "update.id": req.user.id,
            "update.user": req.user.name,
          },
        },
        { new: true },
      );
      return res.status(200).json({ msg: "Updated successfull" });
    }

    // new create or raise
    if (data.type === "raise") {
      const location = await Location.findById(data.locationId);
      if (!location) return res.status(400).json({ msg: "location not found" });
      const service = await Admin.findOne({
        "service._id": data.service.value,
      });
      unschedule = await Unscheduled.create({
        client: location.client,
        location: data.locationId,
        comment: data.comment,
        raisedBy: { user: req.user.name, id: req.user._id },
        serviceName: data.service.label,
        serviceId: data.service.value,
        scopes: service.service.flatMap((s) => s.scopes),
        type: "Unscheduled",
      });
      return res
        .status(200)
        .json({ msg: `Pest reported ${unschedule.serviceName}` });
    }
  } catch (error) {
    console.error("server error: ", error.message);
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
    res.status(200).json({ msg: "status changed" });
  } catch (error) {
    res.status(500).json({ msg: "server error" });
  }
};
