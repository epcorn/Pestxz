import Service from "../models/serviceModel.js";
import Client from "../models/clientModel.js";
import Location from "../models/locationModel.js";
import moment from "moment";
import exceljs from "exceljs";
import { sendEmail, uploadFile } from "../utils/helperFunction.js";

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
    let nextNumber = 1;
    if (lastComplaint?.complaintDetails?.number) {
      const lastNumber = parseInt(
        lastComplaint.complaintDetails.number.replace("SR-", "").trim(),
      );
      nextNumber = lastNumber + 1;
    }
    const sr = `SR-${String(nextNumber).padStart(4, "0")}`;
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
        service: req.body.service,
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
  const { search, page, location } = req.query;

  let query = {
    type: "Complaint",
  };
  if (req.user.role !== "Admin") {
    query.client = req.user.client;
  }
  if (search) {
    if (req.user.role !== "Admin") {
      query = {
        type: "Complaint",
        client: req.user.client,
        "complaintDetails.number": { $regex: search, $options: "i" },
      };
    } else {
      query = {
        type: "Complaint",
        "complaintDetails.number": { $regex: search, $options: "i" },
      };
    }
  }
  try {
    let pageNumber = Number(page) || 1;

    // let complaints = await Service.find(query)
    let complaints = await Service.find()
      .populate({
        path: "location client",
        select: "floor subLocation location name",
      })
      .sort("-createdAt")
      .skip(15 * (pageNumber - 1))
      .limit(15);

    if (location !== "All") {
      complaints = complaints.filter(
        (complaint) => complaint.location.floor === location,
      );
    }

    return res.status(200).json({
      complaints,
      pages: Math.min(10, Math.ceil(complaints.length / 15)),
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ msg: "Server error, try again later" });
  }
};

export const oldnewRegularService = async (req, res) => {
  const { action } = req.body;
  const { id } = req.params;
  try {
    if (action.length < 1)
      return res.status(400).json({ msg: "One service action is required" });

    const location = await Location.findById(id);
    if (!location) return res.status(404).json({ msg: "Location not found" });

    let images = [];
    if (req.files?.images) {
      images = Array.isArray(req.files.images)
        ? req.files.images
        : [req.files.images];
    }

    const regularService = [];
    const service = req.body;
    let imageUpload = 0;

    for (let i = 1; i < action.length; i++) {
      let link = "";
      if (service.upload[i] === "true") {
        link = await uploadFile({ filePath: images[imageUpload].tempFilePath });
        imageUpload += 1;
      }
      regularService.push({
        name: service.name[i],
        action: service.action[i],
        image: link,
        userName: req.user.name,
      });
    }

    await Service.create({
      regularService,
      client: location.client,
      location: id,
    });

    return res.status(201).json({ msg: "Service updated" });
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

    let imageLink = "";
    if (req.files?.image) {
      const file = Array.isArray(req.files.image)
        ? req.files.image[0]
        : req.files.image;
      imageLink = await uploadFile({ filePath: file.tempFilePath });
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
      scopes: service.scopes.map((scope) => ({
        scopeId: scope.scopeId,
        scopeName: scope.scopeName,
        consumables: scope.consumables.map((con) => ({
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

export const dailyServiceReport = async (req, res) => {
  try {
    const date = new Date();
    const today = date.setUTCHours(0, 0, 0, 0);
    const yesterday = new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate(),
    ).setUTCHours(0, 0, 0, 0);

    const clients = await Client.find().populate({
      path: "services",
      match: {
        updatedAt: {
          $gte: yesterday,
          $lt: today,
        },
      },
      populate: {
        path: "location",
      },
    });

    for (let client of clients) {
      if (client.services.length > 0) {
        const workbook = new exceljs.Workbook();
        await workbook.xlsx.readFile("./tmp/dailyReport.xlsx");
        let worksheet = workbook.getWorksheet("Sheet1");

        for (let i = 0; i < client.services.length; i++) {
          let row = worksheet.getRow(i + 4);
          const service = client.services[i];
          const location = `${service.location.floor}, ${service.location.location}, ${service.location.subLocation}`;
          if (
            service.type === "Complaint" &&
            service.complaintUpdate.length > 0
          ) {
            let length = service.complaintUpdate.length - 1;
            row.getCell(1).value = "Complaint";
            row.getCell(2).value = moment(service.updatedAt)
              .local()
              .format("HH:mm:ss");
            row.getCell(3).value = location;
            row.getCell(4).value = service.complaintDetails.service.join(", ");
            row.getCell(5).value = "NA";
            row.getCell(6).value = service.complaintUpdate[length].status;
            row.getCell(7).value = service.complaintUpdate[length].comment;
            row.getCell(8).value = service.complaintUpdate[length].userName;
            row.getCell(9).value =
              (service.complaintUpdate[length].image.length >= 1 && {
                text: "Download",
                hyperlink: service.complaintUpdate[length].image[0],
              }) ||
              "No Image";
            row.getCell(10).value =
              (service.complaintUpdate[length].image.length >= 2 && {
                text: "Download",
                hyperlink: service.complaintUpdate[length].image[1],
              }) ||
              "No Image";
            row.commit();
          } else {
            for (let regular of service.regularService) {
              row.getCell(1).value = "Regular";
              row.getCell(2).value = moment(service.updatedAt)
                .local()
                .format("HH:mm:ss");
              row.getCell(3).value = location;
              row.getCell(4).value = regular.name;
              row.getCell(5).value = regular.action;
              row.getCell(6).value = "NA";
              row.getCell(7).value = "NA";
              row.getCell(8).value = regular.username;
              row.getCell(9).value =
                (regular.image.length > 1 && {
                  text: "Download",
                  hyperlink: regular.image,
                }) ||
                "No Image";
              row.commit();
            }
          }
        }
        const filePath = `./tmp/${client.name}_Daily_Service_Report.xlsx`;
        await workbook.xlsx.writeFile(filePath);
        const link = await uploadFile({ filePath });
        if (link) {
          await sendEmail({
            attachment: [
              {
                url: link,
                name: `${client.name}_Daily_Service_Report.xlsx`,
              },
            ],
            emailList: [{ email: client.email }],
            templateId: 1,
            dynamicData: {
              client: client.name,
              date: moment(yesterday).format("DD/MM/YY"),
            },
          });
        }
      }
    }

    return res.json({ msg: "Report generated" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ msg: "Server error, try again later" });
  }
};
