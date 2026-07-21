import { populate } from "dotenv";
import Client from "../models/clientModel.js";
import Service from "../models/serviceModel.js";
import exceljs from "exceljs";
import {
  dateTimeSplitter,
  removeOldQr,
  sendEmail,
  uploadFile,
} from "../utils/helperFunction.js";
import fs from "fs";
import path from "path";
import Location from "../models/locationModel.js";

export const dailyServiceReport = async (req, res) => {
  try {
    // const id = req.user.client ? req.user.client : null;
    // const date = new Date();
    // const today = date.setUTCHours(0, 0, 0, 0);
    // const yesterday = new Date(
    //   date.getFullYear(),
    //   date.getMonth(),
    //   date.getDate(),
    // ).setUTCHours(0, 0, 0, 0);

    // const clients = await Client.find().populate({
    //   path: "services",
    //   match: {
    //     updatedAt: {
    //       $gte: yesterday,
    //       $lt: today,
    //     },
    //   },
    //   populate: {
    //     path: "location",
    //   },
    // });
    // let regulars, complaints;
    // for (let service of clients) {
    //   regulars = service.services.filter((s) => s.type === "Regulars");
    //   complaints = service.services.filter((s) => s.type === "Complaint");
    // for(i=0;i<regulars.length;i++){

    // }
    // }

    // for (let client of clients) {
    //   if (client.services.length > 0) {
    //     const workbook = new exceljs.Workbook();
    //     await workbook.xlsx.readFile("./tmp/dailyReport.xlsx");
    //     let worksheet = workbook.getWorksheet("Sheet1");

    //     for (let i = 0; i < client.services.length; i++) {
    //       let row = worksheet.getRow(i + 4);
    //       const service = client.services[i];
    //       const location = `${service.location.floor}, ${service.location.location}, ${service.location.subLocation}`;
    //       if (
    //         service.type === "Complaint" &&
    //         service.complaintUpdate.length > 0
    //       ) {
    //         let length = service.complaintUpdate.length - 1;
    //         row.getCell(1).value = "Complaint";
    //         row.getCell(2).value = moment(service.updatedAt)
    //           .local()
    //           .format("HH:mm:ss");
    //         row.getCell(3).value = location;
    //         row.getCell(4).value = service.complaintDetails.service.join(", ");
    //         row.getCell(5).value = "NA";
    //         row.getCell(6).value = service.complaintUpdate[length].status;
    //         row.getCell(7).value = service.complaintUpdate[length].comment;
    //         row.getCell(8).value = service.complaintUpdate[length].userName;
    //         row.getCell(9).value =
    //           (service.complaintUpdate[length].image.length >= 1 && {
    //             text: "Download",
    //             hyperlink: service.complaintUpdate[length].image[0],
    //           }) ||
    //           "No Image";
    //         row.getCell(10).value =
    //           (service.complaintUpdate[length].image.length >= 2 && {
    //             text: "Download",
    //             hyperlink: service.complaintUpdate[length].image[1],
    //           }) ||
    //           "No Image";
    //         row.commit();
    //       } else {
    //         for (let regular of service.regularService) {
    //           row.getCell(1).value = "Regular";
    //           row.getCell(2).value = moment(service.updatedAt)
    //             .local()
    //             .format("HH:mm:ss");
    //           row.getCell(3).value = location;
    //           row.getCell(4).value = regular.frequency;
    //           row.getCell(5).value = regular.serviceName;
    //           row.getCell(6).value = regular.scopes.map((sc) => sc.scopeName);
    //           row.getCell(7).value = regular.action;
    //           row.getCell(8).value = "NA";
    //           row.getCell(9).value = "NA";
    //           row.getCell(10).value = regular.userName;
    //           row.getCell(11).value =
    //             (regular.image.length > 1 && {
    //               text: "Download",
    //               hyperlink: regular.image,
    //             }) ||
    //             "No Image";
    //           row.commit();
    //         }
    //       }
    //     }

    //     const filePath = `./tmp/${client.name}_Daily_Service_Report.xlsx`;
    //     await workbook.xlsx.writeFile(filePath);
    //     // const link = await uploadFile({ filePath });
    //     // if (link) {
    //     //   await sendEmail({
    //     //     attachment: [
    //     //       {
    //     //         url: link,
    //     //         name: `${client.name}_Daily_Service_Report.xlsx`,
    //     //       },
    //     //     ],
    //     //     emailList: [{ email: client.email }],
    //     //     templateId: 1,
    //     //     dynamicData: {
    //     //       client: client.name,
    //     //       date: moment(yesterday).format("DD/MM/YY"),
    //     //     },
    //     //   });
    //     // }
    //   }
    // }

    const { value = "all" } = req.params;
    const { today } = req.query;

    const todayStart = new Date(today);
    todayStart?.setUTCHours(0, 0, 0, 0);
    const todayEnd = new Date(today);
    todayEnd.setUTCHours(23, 59, 59, 999);

    const isPestEmployee = req.user.type === "PestEmployee";
    const clientQuery =
      req.user.role === "ClientAdmin" ? { _id: req.user.client } : {};
    const selectFields = req.user.client ? "" : "-adminPass";

    let uploadURL;
    let matchCondition;

    let scheduleDateMatch = {};

    if (value === "custom") {
      matchCondition = {
        updatedAt: { $gte: todayStart, $lte: todayEnd },
      };
      scheduleDateMatch = {
        "service.schedule.date": { $gte: todayStart, $lte: todayEnd },
      };
    } else if (value === "weekly") {
      const weekStart = new Date(
        Date.UTC(
          todayStart.getUTCFullYear(),
          todayStart.getUTCMonth(),
          todayStart.getUTCDate(),
        ),
      );
      const weekEnd = new Date(weekStart);
      weekEnd.setUTCDate(weekEnd.getUTCDate() + 7);

      matchCondition = { updatedAt: { $gte: weekStart, $lt: weekEnd } }; // no `const`

      scheduleDateMatch = {
        "service.schedule.date": { $gte: weekStart, $lt: weekEnd },
      };
    }

    let populateOptions = [
      {
        path: "services",
        match: matchCondition,
        populate: { path: "location" },
      },
      {
        path: "locations",
      },
      {
        path: "unschedules",
        match: matchCondition,
        populate: { path: "location" },
      },
      {
        path: "casuals",
        match: matchCondition,
        populate: { path: "location" },
      },
      // {
      //   path: "productservices",
      //   match: matchCondition,
      //   populate: { path: "location" },
      // },
    ];

    const clients = await Client.find(clientQuery)
      .select(selectFields)
      .populate(populateOptions);

    const sufix =
      value === "all" ? "All" : todayStart.toISOString().split("T")[0];
    const generatedFiles = [];

    const status = { missed: 0, done: 0, pending: 0 };

    for (let clientDoc of clients) {
      const client = clientDoc.toObject({ virtuals: true });

      const serviceStatusAgg = await Location.aggregate([
        { $match: { client: clientDoc._id } },
        { $unwind: "$service" },
        { $unwind: "$service.schedule" },
        ...(value !== "all" ? [{ $match: scheduleDateMatch }] : []),
        {
          $group: { _id: "$service.schedule.status", count: { $sum: 1 } },
        },
        { $project: { _id: 0, label: "$_id", count: 1 } },
      ]);

      serviceStatusAgg.forEach((s) => {
        const key = s.label?.trim()?.toLowerCase();
        if (key && key in status) {
          status[key] = s.count;
        }
      });

      if (client.reportUrl) {
        await removeOldQr(client.reportUrl);
        console.log("removed old url");
      }

      const workbook = new exceljs.Workbook();

      if (isPestEmployee) {
        await workbook.xlsx.readFile("./tmp/dailyReport_Pest.xlsx");
      } else {
        await workbook.xlsx.readFile("./tmp/dailyReport_Client.xlsx");
      }
      // ✅ Fresh workbook per client so rows don't bleed across clients

      const regularWorksheet = workbook.getWorksheet("Regular service");
      const complaintWorksheet = workbook.getWorksheet("Complaints");
      const unschWorksheet = workbook.getWorksheet("Unscheduled-Work");

      let currRow = 4;
      let compRow = 4;
      let unschCount = 4;

      const regulars = client.services.filter((ser) => ser.type === "Regular");
      const complaints = client.services.filter(
        (ser) => ser.type === "Complaint",
      );
      const status = { missed: 0, done: 0, pending: 0 };
      const regularData = regulars.map((reg) => {
        const regs = reg.regularService[0];
        const loc = reg.location;

        const flattenedScopes = regs.scopes
          ? regs.scopes.flatMap((sc) =>
              sc.consumables && sc.consumables.length > 0
                ? sc.consumables.map((con) => ({
                    scopeName: sc.scopeName || "",
                    consumableName: con.consumableName || "",
                    usedCalibration: con.usedCalibration || "",
                    comment: con.comment || "",
                  }))
                : [
                    {
                      scopeName: sc.scopeName || "",
                      consumableName: "",
                      usedCalibration: "",
                      comment: "",
                    },
                  ],
            )
          : null;
        const { date, time } = dateTimeSplitter(regs.serviceDate);

        regs.schedule.forEach((sch) => {
          const key = sch.status.toLowerCase();
          if (key && key in status) {
            status[key] += 1;
          }
        });

        return {
          serviceDate: date,
          serviceTime: time,
          frequency: regs.frequency,
          userName: regs.userName,
          location: `${loc.floor}, ${loc.location}, ${loc.subLocation}`,
          serviceName: regs.serviceName,
          scopes: flattenedScopes,
          images: regs.image.join(", "),
        };
      });

      regularData.forEach((dataItem) => {
        const row = regularWorksheet.getRow(currRow);
        let scopeRichText;

        if (dataItem.scopes && dataItem.scopes.length > 0) {
          scopeRichText = { richText: [] };
          dataItem.scopes.forEach((sc, index) => {
            scopeRichText.richText.push({
              font: { bold: true },
              text: sc.scopeName,
            });
            scopeRichText.richText.push({
              font: { bold: false },
              text: ` → ${sc.consumableName} → ${sc.usedCalibration} → ${sc.comment}`,
            });
            if (index < dataItem.scopes.length - 1) {
              scopeRichText.richText.push({
                font: { bold: false },
                text: "\n",
              });
            }
          });
        } else {
          scopeRichText = "N/A";
        }

        row.getCell(1).value = dataItem.serviceDate;
        row.getCell(2).value = dataItem.serviceTime;
        row.getCell(3).value = dataItem.frequency;
        row.getCell(4).value = dataItem.userName;
        row.getCell(5).value = dataItem.location;
        row.getCell(6).value = dataItem.serviceName;
        if (req.user.type === "PestEmployee") {
          row.getCell(7).value = scopeRichText;
          row.getCell(7).alignment = { wrapText: true, vertical: "middle" };
        }
        req.user.type === "PestEmployee"
          ? (row.getCell(8).value = dataItem.images)
          : (row.getCell(7).value = dataItem.images);

        row.commit();
        currRow++;
      });
      console.log(status);
      const row = regularWorksheet.getRow(7);
      row.getCell(12).value = status.done;
      row.getCell(13).value = status.missed;
      row.getCell(14).value = status.pending;
      row.getCell(15).value = client?.locations?.length;

      // --- Complaints ---
      const complaintData = complaints.map((com) => {
        const comp = com.complaintDetails;
        const updt = com.complaintUpdate.at(-1);
        const loc = com.location;
        return {
          date: new Date(updt.date).toLocaleString(),
          number: comp.number,
          location: `${loc.floor}, ${loc.location}, ${loc.subLocation}`,
          status: comp.status,
          comment: comp.comment,
          service: comp.service.join(", "),
          reopenC: comp.reopenCount,
          assignedto: comp.assignedTo.userName,
        };
      });

      complaintData.forEach((d) => {
        const row = complaintWorksheet.getRow(compRow);
        row.getCell(1).value = d.date;
        row.getCell(2).value = d.number;
        row.getCell(3).value = d.service;
        row.getCell(4).value = d.assignedto;
        row.getCell(5).value = d.location;
        row.getCell(6).value = d.comment;
        row.getCell(7).value = d.status;
        row.getCell(8).value = d.reopenC;
        row.commit();
        compRow++;
      });

      // --- Unscheduled Work ---
      client.unschedules.forEach((unsc) => {
        const row = unschWorksheet.getRow(unschCount);
        const loc = unsc.location;
        row.getCell(1).value = new Date(unsc.createdAt).toLocaleString();
        row.getCell(2).value = new Date(unsc.updatedAt).toLocaleString();
        row.getCell(3).value =
          `${loc?.floor}, ${loc?.location}, ${loc?.subLocation}`;
        row.getCell(4).value = unsc?.serviceName;
        row.getCell(5).value = unsc.raisedBy.user;
        row.getCell(6).value = unsc?.approval?.name;
        row.getCell(7).value = unsc?.comment;
        row.getCell(8).value = unsc?.update?.status;
        row.commit();
        unschCount++;
      });

      // ✅ Per-client file: always include client name in filename
      const clientName = client.name.replace(/[\s\/]+/g, "_"); // sanitize spaces
      const fileName = `${clientName}_Daily_Service_Report-${sufix}.xlsx`;
      const filePath = `./tmp/reports/${fileName}`;

      const dir = "./tmp/reports";
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      await workbook.xlsx.writeFile(filePath);

      await removeOldQr(filePath); //removes old sheet
      uploadURL = await uploadFile({ filePath });

      if (uploadURL) {
        await Client.findByIdAndUpdate(client._id, { reportURL: uploadURL });
        generatedFiles.push({ client: client.name, url: uploadURL });
      } else {
        console.log(`Failed to upload report for ${client.name}`);
        generatedFiles.push({ client: client.name, url: null });
      }

      // const fileBuffer = fs.readFileSync(filePath);
      // const fileBase64 = fileBuffer.toString("base64");

      // const attachment = [{ content: fileBase64, name: fileName }];

      // await sendEmail({
      //   attachment,
      //   emailList: [{ email: req.user.email }],
      //   dynamicData: {
      //     clientName: client.name,
      //     reportType: value === "today" ? "Today's report" : "Full Report",
      //     generatedOn: new Date().toLocaleString(),
      //   },
      //   templateId: 1,
      // });

      // fs.unlinkSync(filePath);
      // generatedFiles.push(filePath);
    }

    return res.json({
      msg: `Report generated for ${value}`,
      files: generatedFiles,
      uploadURL,
      clients,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ msg: "Server error, try again later" });
  }
};
