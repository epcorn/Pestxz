"use strict";

import Client from "../models/clientModel.js";
import exceljs from "exceljs";
import {
  dateFormat,
  removeOldQr,
  sendEmail,
  uploadFile,
} from "../utils/helperFunction.js";
import fs from "fs/promises";
import fsSync from "fs";
import path from "path";
import Location from "../models/locationModel.js";
import Service from "../models/serviceModel.js";
import Casual from "../models/casualServiceModel.js";
import { Unscheduled } from "../models/unScheduleModel.js";

const PEST_MAP = {
  Ratrid: "Rodein",
  GreenShield: "Cocroaches",
  Greenshield: "Cocroaches",
  Mosquit: "Mosquitoes",
  Flyban: "Fly",
  Termite: "Termite",
  LizzPro: "Lizard",
  Antron: "Ant",
};

// NOTE: This job is CLIENT-ONLY.
export const dailyReportClient = async (req = {}, res) => {
  try {
    // 1. CRON & REQUEST FALLBACK SAFEGUARDS
    const params = req.params || {};
    const query = req.query || {};
    const user = req.user || { role: "Admin" };

    // Allow test override via query param, e.g. ?testDate=2026-07-07
    const testDate = query.testDate ? new Date(query.testDate) : null;
    const now = testDate && !isNaN(testDate) ? testDate : new Date();

    const dayOfMonth = now.getDate();
    let value;
    if (dayOfMonth === 1) value = "monthly";
    else if (dayOfMonth === 8 || dayOfMonth === 23 || dayOfMonth === 30)
      value = "weekly";
    else if (dayOfMonth === 16) value = "fortnightly";
    else value = "daily";

    const todayStart = new Date(now);
    todayStart.setUTCHours(0, 0, 0, 0);
    const todayEnd = new Date(now);
    todayEnd.setUTCHours(23, 59, 59, 999);

    let startDate = todayStart;
    let endDate = todayEnd;

    if (value === "daily") {
      startDate = new Date(todayStart);
      startDate.setUTCDate(startDate.getUTCDate() - 1);
      endDate = new Date(todayStart);
      endDate.setMilliseconds(-1);
    } else if (value === "weekly") {
      startDate = new Date(todayStart);
      startDate.setUTCDate(startDate.getUTCDate() - 7);
    } else if (value === "fortnightly") {
      startDate = new Date(todayStart);
      startDate.setUTCDate(startDate.getUTCDate() - 15);
    } else if (value === "monthly") {
      const prevMonthYear =
        todayStart.getUTCMonth() === 0
          ? todayStart.getUTCFullYear() - 1
          : todayStart.getUTCFullYear();
      const prevMonthIndex =
        todayStart.getUTCMonth() === 0 ? 11 : todayStart.getUTCMonth() - 1;
      startDate = new Date(Date.UTC(prevMonthYear, prevMonthIndex, 1));
      endDate = new Date(
        Date.UTC(todayStart.getUTCFullYear(), todayStart.getUTCMonth(), 1),
      );
    }

    // 2. TEMPLATE BUFFER PRE-LOAD
    const templatePath = "./tmp/dailyReport_Client.xlsx";

    if (!fsSync.existsSync(templatePath)) {
      throw new Error(`Excel template not found at ${templatePath}`);
    }
    const templateBuffer = await fs.readFile(templatePath);

    const dir = path.resolve("./tmp/reports");
    if (!fsSync.existsSync(dir)) {
      await fs.mkdir(dir, { recursive: true });
    }

    const sufix = todayStart.toISOString().split("T")[0];
    const generatedFiles = [];

    // 3. CURSOR STREAMING FOR ALL CLIENTS
    const clientCursor = Client.find({})
      .select(
        "-adminPass -adminName -address -prefDay -servicePeriod -prefTime -endDate",
      )
      .lean()
      .batchSize(5)
      .cursor();

    console.log(`[CRON] Processing reports for value=${value}`);

    for await (let client of clientCursor) {
      const clientId = client._id;

      // Indexed Date Match Query
      const dateMatch = { createdAt: { $gte: startDate, $lte: endDate } };

      const scheduleMatch = {
        "service.schedule.date": { $gte: startDate, $lte: endDate },
      };

      const prodScheduleMatch = {
        "product.schedule.date": { $gte: startDate, $lte: endDate },
      };

      // 4. EFFICIENT SCOPED PER-CLIENT DATA FETCHING
      const [services, unschedules, casuals, serviceStats, prodStats] =
        await Promise.all([
          Service.find({ client: clientId, ...dateMatch })
            .populate("location")
            .lean(),
          Unscheduled.find({
            client: clientId,
            updatedAt: { $gte: startDate, $lte: endDate },
          })
            .populate("location")
            .lean(),
          Casual.find({
            client: clientId,
            updatedAt: { $gte: startDate, $lte: endDate },
          })
            .populate("location")
            .lean(),
          Location.aggregate([
            { $match: { client: clientId, ...scheduleMatch } },
            { $unwind: "$service" },
            { $unwind: "$service.schedule" },
            { $match: scheduleMatch },
            { $group: { _id: "$service.schedule.status", count: { $sum: 1 } } },
          ]),
          Location.aggregate([
            { $match: { client: clientId, ...prodScheduleMatch } },
            { $unwind: "$product" },
            { $unwind: "$product.schedule" },
            { $match: prodScheduleMatch },
            { $group: { _id: "$product.schedule.status", count: { $sum: 1 } } },
          ]),
        ]);

      const clientServiceStats = {};
      serviceStats.forEach((s) => {
        if (s._id) clientServiceStats[s._id.trim().toLowerCase()] = s.count;
      });

      const clientProdStats = {};
      prodStats.forEach((s) => {
        if (s._id) clientProdStats[s._id.trim().toLowerCase()] = s.count;
      });

      const regStats = {
        missed: clientServiceStats.missed || 0,
        done: clientServiceStats.done || 0,
        pending: clientServiceStats.pending || 0,
        pestCount: [],
      };

      const prodStatsData = {
        missed: clientProdStats.missed || 0,
        done: clientProdStats.done || 0,
        pending: clientProdStats.pending || 0,
      };

      const regulars = [];
      const complaints = [];
      for (let i = 0; i < services.length; i++) {
        if (services[i].type === "Complaint") complaints.push(services[i]);
        if (services[i].type === "Regular") regulars.push(services[i]);
      }

      const groupedPests = {};
      for (let i = 0; i < regulars.length; i++) {
        const service = regulars[i]?.regularService?.[0];
        if (service && service?.pestCount > 0) {
          const compositeName = `${service.serviceName}_${regulars[i]?.location?._id}`;
          if (!groupedPests[compositeName]) {
            groupedPests[compositeName] = {
              name: service.serviceName,
              count: 0,
              date: service.serviceDate,
              floor: regulars[i]?.location?.floor,
              location: regulars[i]?.location?.location,
              subLocation: regulars[i]?.location?.subLocation,
            };
          }
          groupedPests[compositeName].count += service.pestCount;
        }
      }

      regStats.pestCount = Object.values(groupedPests)
        .sort((a, b) => b.count - a.count)
        .slice(0, 3);

      const complaintData = complaints.reduce(
        (acc, complaint) => {
          const { status, reopenCount = 0 } = complaint.complaintDetails || {};
          if (status === "Open") acc.open++;
          else if (status === "In Progress") acc.inProgress++;
          else if (status === "Close Req") acc.closeReq++;
          else if (status === "Close") acc.closed++;
          acc.reopenCount += reopenCount;
          acc.total++;
          return acc;
        },
        {
          total: 0,
          open: 0,
          closeReq: 0,
          closed: 0,
          inProgress: 0,
          reopenCount: 0,
        },
      );

      // 5. EXCEL WORKBOOK POPULATION
      let workbook = new exceljs.Workbook();
      await workbook.xlsx.load(templateBuffer);

      const overviewWorkSheet = workbook.getWorksheet("Overview");
      const regularWorksheet = workbook.getWorksheet("Regular service");
      const complaintWorksheet = workbook.getWorksheet("Complaints");
      const unschWorksheet = workbook.getWorksheet("Unscheduled-Work");
      const casualWorksheet = workbook.getWorksheet("Casual-Work");

      // Overview Tab
      if (overviewWorkSheet) {
        const displayEndDate =
          value === "custom"
            ? endDate
            : new Date(endDate.getTime() - 24 * 60 * 60 * 1000);
        overviewWorkSheet.getRow(1).getCell(3).value =
          `${value}-Report - From ${dateFormat(startDate).withoutTime}, To ${dateFormat(displayEndDate).withoutTime}`;

        const row2 = overviewWorkSheet.getRow(6);
        row2.getCell(1).value = regStats.done;
        row2.getCell(2).value = regStats.missed;
        row2.getCell(3).value = regStats.pending;

        const row3 = overviewWorkSheet.getRow(14);
        row3.getCell(1).value = complaintData.total;
        row3.getCell(2).value = complaintData.open;
        row3.getCell(3).value = complaintData.closed;
        row3.getCell(4).value = complaintData.reopenCount;
        row3.getCell(5).value = complaintData.closeReq;

        const row4 = overviewWorkSheet.getRow(10);
        row4.getCell(1).value = prodStatsData.done;
        row4.getCell(2).value = prodStatsData.missed;
        row4.getCell(3).value = prodStatsData.pending;

        overviewWorkSheet.getRow(17).getCell(2).value = unschedules.length;
        overviewWorkSheet.getRow(19).getCell(2).value = casuals.length;

        let currentRowNum = 6;
        regStats.pestCount.forEach((p) => {
          const currentRow = overviewWorkSheet.getRow(currentRowNum);
          currentRow.height = 30;
          const rowData = [
            dateFormat(p.date).withTime || "",
            p.floor || "-",
            p.location || "-",
            p.subLocation || "-",
            PEST_MAP[p.name] || "",
            p.count || 0,
          ];
          rowData.forEach((val, idx) => {
            const cell = currentRow.getCell(7 + idx);
            cell.value = val;
            cell.alignment = {
              wrapText: true,
              vertical: "middle",
              horizontal: "center",
            };
          });
          currentRowNum++;
        });
      }

      // Complaints Tab
      if (complaintWorksheet) {
        let compRow = 4;
        for (let i = 0; i < complaints.length; i++) {
          const comp = complaints[i].complaintDetails || {};
          const updt = complaints[i].complaintUpdate?.at(-1) || {};
          const loc = complaints[i].location || {};
          complaintWorksheet.getRow(compRow).values = [
            updt.date ? dateFormat(updt.date).withoutTime : "N/A",
            comp.number || "N/A",
            Array.isArray(comp?.service) ? comp.service.join(", ") : "N/A",
            comp.assignedTo?.userName || "Unassigned",
            loc.floor || "-",
            loc.location || "-",
            loc.subLocation || "-",
            comp?.comment || "-",
            comp?.status || "-",
            comp.reopenCount || "-",
          ];
          compRow++;
        }
      }

      // Regular Tab
      if (regularWorksheet) {
        let currRow = 4;
        for (let i = 0; i < regulars.length; i++) {
          const regs = regulars[i].regularService?.[0];
          if (!regs) continue;
          const loc = regulars[i].location || {};
          const serviceDate = dateFormat(regs.serviceDate);
          const images = Array.isArray(regs.image)
            ? regs.image.join(", ")
            : regs.image || "";

          const baseCols = [
            serviceDate.withoutTime || "",
            serviceDate.onlyTime || "",
            regs.frequency || "",
            regs.pestCount || 0,
            regs.userName || "",
            loc.floor || "",
            loc.location || "",
            loc.subLocation || "",
            regs.serviceName || "",
          ];

          regularWorksheet.getRow(currRow).values = [...baseCols, images];
          currRow++;
        }
      }

      // Unscheduled Tab
      if (unschWorksheet) {
        let unschCount = 4;
        for (let i = 0; i < unschedules.length; i++) {
          const unsc = unschedules[i];
          const loc = unsc.location || {};
          unschWorksheet.getRow(unschCount).values = [
            unsc.createdAt ? dateFormat(unsc.createdAt).withTime : "",
            unsc.completedBy?.date
              ? dateFormat(unsc.completedBy.date).withTime
              : "",
            unsc?.pestCount || 0,
            loc?.floor || "-",
            loc?.location || "-",
            loc?.subLocation || "-",
            unsc?.service?.map((s) => s?.serviceName).join(", ") || "",
            unsc.raisedBy?.user || "",
            unsc.approval?.name || "",
            unsc.comment || "",
            unsc.update?.status || "",
          ];
          unschCount++;
        }
      }

      // Casual Tab
      if (casualWorksheet) {
        let casualCount = 4;
        for (let i = 0; i < casuals.length; i++) {
          const casual = casuals[i];
          const loc = casual?.location || {};
          casualWorksheet.getRow(casualCount).values = [
            casual.createdAt ? dateFormat(casual.createdAt).withTime : "",
            casual?.pestCount || 0,
            loc?.floor || "-",
            loc?.location || "-",
            loc?.subLocation || "-",
            casual?.service?.map((s) => s?.serviceName).join(", ") || "",
            casual?.user?.name || "",
            casual?.status || "",
            casual?.image?.join(", ") || "",
          ];
          casualCount++;
        }
      }

      // 6. SAVE & UPLOAD PER CLIENT
      const clientNameClean = (client.name || "Client")
        .replace(/\./g, "")
        .replace(/[\\/:\*\?"<>\|]/g, "")
        .trim()
        .replace(/\s+/g, "_");

      const fileName = `${clientNameClean}_${value}_Service_Report-${sufix}.xlsx`;
      const filePath = path.join(dir, fileName);

      let buffer = await workbook.xlsx.writeBuffer({
        zip: { compression: "DEFLATE", compressionOptions: { level: 1 } },
      });

      await fs.writeFile(filePath, buffer);

      if (!fsSync.existsSync(filePath)) {
        console.error(
          `[CRON ERROR] Generated file not found at path: ${filePath}`,
        );
        continue;
      }

      if (client?.report?.url) {
        try {
          await removeOldQr(client?.report?.url);
        } catch (e) {
          console.warn("Failed to delete previous report asset:", e.message);
        }
      }

      const uploadURL = await uploadFile({ filePath, remove: false });

      if (uploadURL) {
        await Client.findByIdAndUpdate(clientId, {
          report: {
            type: value,
            date: `${startDate} - ${endDate}`,
            url: uploadURL,
          },
        });
        generatedFiles.push({ client: client.name, url: uploadURL });
      }

      // 7. SEND EMAIL IF FILE AND CLIENT EMAIL EXIST
      if (uploadURL && client.email) {
        try {
          const fileBuffer = await fs.readFile(filePath);
          const base64Content = fileBuffer.toString("base64");

          const attachment = [
            {
              content: base64Content,
              name: `${clientNameClean}_Service_Report_${sufix}.xlsx`,
            },
          ];

          const emailList = [{ email: client.email, name: client.name }];
          const dynamicData = {
            CLIENT_NAME: client.name,
            REPORT_TYPE: value,
            REPORT_URL: uploadURL,
            DATE: dateFormat(todayStart).withoutTime,
          };

          const BREVO_TEMPLATE_ID =
            Number(process.env.BREVO_DAILY_REPORT_TEMPLATE_ID) || 21;

          sendEmail({
            emailList,
            templateId: BREVO_TEMPLATE_ID,
            dynamicData,
            attachment,
          }).then((success) => {
            if (success) console.log(`Report sent to ${client.email}`);
            else console.warn(`Failed to send report to ${client.email}`);
          });
        } catch (error) {
          console.error("Email preparation error:", error.message || error);
        }
      }

      // Clean local storage
      if (fsSync.existsSync(filePath)) {
        await fs
          .unlink(filePath)
          .then((res) => console.log("file cleaned"))
          .catch((err) => {
            console.log("File remove error:", err.message);
          });
      }

      // Explicit Memory Release for garbage collection
      workbook = null;
      buffer = null;
      if (global.gc) {
        global.gc();
      }
    } // clients loop

    if (res && typeof res.json === "function") {
      return res.json({
        msg: `Report generated for ${value}`,
        files: generatedFiles,
      });
    }

    return { status: "success", files: generatedFiles };
  } catch (error) {
    console.error("Report generation error:", error);
    if (res && typeof res.status === "function") {
      return res.status(500).json({ msg: "Server error, try again later" });
    }
    throw error;
  }
};
