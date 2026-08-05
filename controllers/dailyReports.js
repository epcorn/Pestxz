import Client from "../models/clientModel.js";
import exceljs from "exceljs";
import {
  dateFormat,
  removeOldQr,
  uploadFile,
} from "../utils/helperFunction.js";
import fs from "fs/promises";
import fsSync from "fs";
import path from "path";
import Location from "../models/locationModel.js";
// Import models directly for direct, high-performance indexed queries
import Service from "../models/serviceModel.js";
import Casual from "../models/casualServiceModel.js";
import { Unscheduled } from "../models/unScheduleModel.js";
// import Unschedule from "../models/unscheduleModel.js";
// import Casual from "../models/casualModel.js";

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

export const dailyServiceReport = async (req, res) => {
  try {
    const { value = "monthly" } = req.params;
    const { today } = req.query;

    const todayStart = today ? new Date(today) : new Date();
    todayStart.setUTCHours(0, 0, 0, 0);
    const todayEnd = today ? new Date(today) : new Date();
    todayEnd.setUTCHours(23, 59, 59, 999);

    let startDate = "";
    let endDate = "";

    const isPestEmployee = req.user.type === "PestEmployee";
    const clientQuery =
      req.user.role === "ClientAdmin" ? { _id: req.user.client } : {};
    const selectFields = req.user.client ? "" : "-adminPass -adminName";

    let matchCondition = {};
    let scheduleDateMatch = {};
    let prodScheduleDateMatch = {};

    if (value === "custom") {
      startDate = todayStart;
      endDate = todayEnd;
    } else if (value === "weekly") {
      const weekEnd = new Date(todayStart);
      const weekStart = new Date(todayStart);
      weekStart.setUTCDate(weekStart.getUTCDate() - 7);
      startDate = weekStart;
      endDate = weekEnd;
    } else if (value === "fortnightly") {
      const fortnightEnd = new Date(todayStart);
      const fortnightStart = new Date(todayStart);
      fortnightStart.setUTCDate(fortnightStart.getUTCDate() - 15);
      startDate = fortnightStart;
      endDate = fortnightEnd;
    } else if (value === "monthly") {
      const prevMonthYear =
        todayStart.getUTCMonth() === 0
          ? todayStart.getUTCFullYear() - 1
          : todayStart.getUTCFullYear();
      const prevMonthIndex =
        todayStart.getUTCMonth() === 0 ? 11 : todayStart.getUTCMonth() - 1;
      const monthStart = new Date(Date.UTC(prevMonthYear, prevMonthIndex, 1));
      const monthEnd = new Date(
        Date.UTC(todayStart.getUTCFullYear(), todayStart.getUTCMonth(), 1),
      );
      startDate = monthStart;
      endDate = monthEnd;
    }

    if (value !== "all") {
      matchCondition = { updatedAt: { $gte: startDate, $lte: endDate } };
      scheduleDateMatch = {
        "service.schedule.date": { $gte: startDate, $lte: endDate },
      };
      prodScheduleDateMatch = {
        "product.schedule.date": { $gte: startDate, $lte: endDate },
      };
    }

    // 1. PRE-LOAD EXCEL TEMPLATE BUFFER ONCE
    const templatePath = isPestEmployee
      ? "./tmp/dailyReport_Pest.xlsx"
      : "./tmp/dailyReport_Client.xlsx";
    const templateBuffer = await fs.readFile(templatePath);

    console.time("service and product stats calculating...");

    // 2. OPTIMIZED AGGREGATIONS ($match BEFORE $unwind TO USE INDEXES)
    const [allServiceStats, allProdStats] = await Promise.all([
      Location.aggregate([
        ...(value !== "all" ? [{ $match: scheduleDateMatch }] : []),
        { $unwind: "$service" },
        { $unwind: "$service.schedule" },
        ...(value !== "all" ? [{ $match: scheduleDateMatch }] : []),
        {
          $group: {
            _id: { client: "$client", status: "$service.schedule.status" },
            count: { $sum: 1 },
          },
        },
      ]),
      Location.aggregate([
        ...(value !== "all" ? [{ $match: prodScheduleDateMatch }] : []),
        { $unwind: "$product" },
        { $unwind: "$product.schedule" },
        ...(value !== "all" ? [{ $match: prodScheduleDateMatch }] : []),
        {
          $group: {
            _id: { client: "$client", status: "$product.schedule.status" },
            count: { $sum: 1 },
          },
        },
      ]),
    ]);
    console.timeEnd("service and product stats calculating...");
    console.time("products & service stats mapping...");
    // Fast O(1) stats maps
    const serviceStatsMap = new Map();
    allServiceStats.forEach((s) => {
      const clientId = s._id.client?.toString();
      if (!clientId) return;
      if (!serviceStatsMap.has(clientId)) serviceStatsMap.set(clientId, {});
      const key = s._id.status?.trim()?.toLowerCase();
      if (key) serviceStatsMap.get(clientId)[key] = s.count;
    });

    const prodStatsMap = new Map();
    allProdStats.forEach((s) => {
      const clientId = s._id.client?.toString();
      if (!clientId) return;
      if (!prodStatsMap.has(clientId)) prodStatsMap.set(clientId, {});
      const key = s._id.status?.trim()?.toLowerCase();
      if (key) prodStatsMap.get(clientId)[key] = s.count;
    });

    console.timeEnd("products & service stats mapping...");
    console.time("finding clients...");
    // 3. CURSOR OVER CLIENTS WITHOUT HEAVY NESTED VIRTUAL POPULATIONS
    const clientCursor = Client.find(clientQuery)
      .select(selectFields)
      .lean()
      .cursor();

    const sufix =
      value === "all" ? "All" : todayStart.toISOString().split("T")[0];
    const generatedFiles = [];
    const dir = path.resolve("./tmp/reports");

    if (!fsSync.existsSync(dir)) {
      await fs.mkdir(dir, { recursive: true });
    }

    console.timeEnd("finding clients...");
    console.time("looping clients...");
    for await (let client of clientCursor) {
      const clientIdStr = client._id.toString();

      console.log("sevices, unschedules, casuals fetching ...");
      // Parallel direct-model queries for client relations (hits indexed fields directly)
      const [services, unschedules, casuals] = await Promise.all([
        Service.find({
          client: client._id,
          ...(value !== "all"
            ? { createdAt: { $gte: startDate, $lte: endDate } }
            : {}),
        })
          .populate("location")
          .lean(),
        Unscheduled.find({
          client: client._id,
          ...(value !== "all" ? matchCondition : {}),
        })
          .populate("location")
          .lean(),
        Casual.find({
          client: client._id,
          ...(value !== "all" ? matchCondition : {}),
        })
          .populate("location")
          .lean(),
      ]);

      const clientName = client.name
        .replace(/\./g, "")
        .replace(/[\\/:\*\?"<>\|]/g, "")
        .trim()
        .replace(/\s+/g, "_");
      const fileName = `${clientName}_Daily_Service_Report-${sufix}.xlsx`;
      const filePath = path.join(dir, fileName);

      // Single pass grouping for regular and complaint services
      const regulars = [];
      const complaints = [];

      for (let i = 0; i < services.length; i++) {
        const s = services[i];
        if (s.type === "Complaint") complaints.push(s);
        if (s.type === "Regular") regulars.push(s);
      }

      const clientServiceStats = serviceStatsMap.get(clientIdStr) || {};
      const clientProdStats = prodStatsMap.get(clientIdStr) || {};

      const regStats = {
        missed: clientServiceStats.missed || 0,
        done: clientServiceStats.done || 0,
        pending: clientServiceStats.pending || 0,
        pestCount: [],
      };

      const prodStats = {
        missed: clientProdStats.missed || 0,
        done: clientProdStats.done || 0,
        pending: clientProdStats.pending || 0,
      };

      // Group top pest counts
      const groupedPests = {};
      for (let i = 0; i < regulars.length; i++) {
        const reg = regulars[i];
        const service = reg?.regularService?.[0];
        if (service && service?.pestCount > 0) {
          const {
            serviceName: name,
            pestCount: count,
            serviceDate: date,
          } = service;
          const locationId = reg?.location?._id;
          const compositeName = `${name}_${locationId}`;

          if (!groupedPests[compositeName]) {
            groupedPests[compositeName] = {
              name,
              count: 0,
              date,
              floor: reg?.location?.floor,
              locationId,
              location: reg?.location?.location,
              subLocation: reg?.location?.subLocation,
            };
          }
          groupedPests[compositeName].count += count;
        }
      }
      regStats.pestCount = Object.values(groupedPests)
        .sort((a, b) => b.count - a.count)
        .slice(0, 3);

      // Complaint counts
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

      if (client.reportUrl) {
        await removeOldQr(client.reportUrl);
      }

      console.log("workbook initialised ...");
      // Load pre-buffered template into ExcelJS
      const workbook = new exceljs.Workbook();
      await workbook.xlsx.load(templateBuffer);

      const overviewWorkSheet = workbook.getWorksheet("Overview");
      const regularWorksheet = workbook.getWorksheet("Regular service");
      const complaintWorksheet = workbook.getWorksheet("Complaints");
      const unschWorksheet = workbook.getWorksheet("Unscheduled-Work");
      const casualWorksheet = workbook.getWorksheet("Casual-Work");

      console.time("overviewsheet writing ...");

      // Write Overview
      if (overviewWorkSheet) {
        const row1 = overviewWorkSheet.getRow(1);
        const displayEndDate =
          value === "custom"
            ? endDate
            : new Date(endDate.getTime() - 24 * 60 * 60 * 1000);
        row1.getCell(3).value =
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
        row4.getCell(1).value = prodStats.done;
        row4.getCell(2).value = prodStats.missed;
        row4.getCell(3).value = prodStats.pending;
        row4.commit();

        const row17 = overviewWorkSheet.getRow(17);
        row17.getCell(2).value = unschedules.length;

        const row19 = overviewWorkSheet.getRow(19);
        row19.getCell(2).value = casuals.length;

        const startColumn = 7;
        let currentRowNum = 6;
        row17.commit();
        row19.commit();

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
            const cell = currentRow.getCell(startColumn + idx);
            cell.value = val;
            cell.alignment = {
              wrapText: true,
              vertical: "middle",
              horizontal: "center",
            };
          });

          currentRow.commit();
          currentRowNum++;
        });
      }

      console.timeEnd("overviewsheet writing ...");
      console.time("complaintsheet writing ...");

      // Write Complaints
      if (complaintWorksheet) {
        let compRow = 4;
        for (let i = 0; i < complaints.length; i++) {
          const com = complaints[i];
          const comp = com.complaintDetails || {};
          const updt = com.complaintUpdate?.at(-1) || {};
          const loc = com.location || {};

          const row = complaintWorksheet.getRow(compRow);
          row.getCell(1).value = updt.date
            ? dateFormat(updt?.date).withoutTime
            : "N/A";
          row.getCell(2).value = comp.number || "N/A";
          row.getCell(3).value = Array.isArray(comp?.service)
            ? comp?.service?.join(", ")
            : "N/A";
          row.getCell(4).value = comp.assignedTo?.userName || "Unassigned";
          row.getCell(5).value = loc.floor || "-";
          row.getCell(6).value = loc.location || "-";
          row.getCell(7).value = loc.subLocation || "-";
          row.getCell(8).value = comp?.comment || "-";
          row.getCell(9).value = comp?.status || "-";
          row.getCell(10).value = comp.reopenCount || "-";
          row.commit();
          compRow++;
        }
      }
      console.timeEnd("complaintsheet writing ...");
      console.time("regularsheet writing ...");

      // Write Regular Services
      if (regularWorksheet) {
        let currRow = 4;

        for (let i = 0; i < regulars.length; i++) {
          const reg = regulars[i];
          const regs = reg.regularService?.[0];
          if (!regs) continue;
          const loc = reg.location || {};

          const serviceDate = dateFormat(regs.serviceDate);
          const images = Array.isArray(regs?.image)
            ? regs.image.join(", ")
            : regs?.image || "";

          const baseColumns = [
            serviceDate.withoutTime,
            serviceDate.onlyTime,
            regs?.frequency || "",
            regs?.pestCount || 0,
            regs?.userName || "",
            loc?.floor || "",
            loc?.location || "",
            loc?.subLocation || "",
            regs?.serviceName || "",
          ];

          if (isPestEmployee) {
            const scopeEntries = [];
            if (Array.isArray(regs?.scopes)) {
              for (const sc of regs.scopes) {
                if (
                  Array.isArray(sc?.consumables) &&
                  sc.consumables.length > 0
                ) {
                  for (const con of sc.consumables) {
                    scopeEntries.push([
                      sc.scopeName || "",
                      con.consumableName || "",
                      con.calibration || 0,
                      con.usedCalibration || 0,
                      con.action || "",
                    ]);
                  }
                }
              }
            }

            if (scopeEntries.length > 0) {
              for (const scope of scopeEntries) {
                const row = regularWorksheet.getRow(currRow);
                // Batch assign values starting at column 1 (1-indexed array)
                row.values = [undefined, ...baseColumns, ...scope, images];
                currRow++;
              }
            } else {
              const row = regularWorksheet.getRow(currRow);
              row.values = [
                undefined,
                ...baseColumns,
                "",
                "",
                "",
                "",
                "",
                images,
              ];
              currRow++;
            }
          } else {
            const row = regularWorksheet.getRow(currRow);
            row.values = [undefined, ...baseColumns, images];
            currRow++;
          }
        }
      }
      console.timeEnd("regularsheet writing ...");
      console.time("unschsheet writing ...");

      // Write Unscheduled Work
      if (unschWorksheet) {
        let unschCount = 4;
        for (let i = 0; i < unschedules.length; i++) {
          const unsc = unschedules[i];
          const loc = unsc.location || {};
          const row = unschWorksheet.getRow(unschCount);
          row.getCell(1).value = unsc.createdAt
            ? dateFormat(unsc?.createdAt).withTime
            : "";
          row.getCell(2).value = unsc.updatedAt
            ? dateFormat(unsc?.completedBy?.date).withTime
            : "";
          row.getCell(3).value = unsc?.pestCount || 0;
          row.getCell(4).value = loc?.floor || "-";
          row.getCell(5).value = loc?.location || "-";
          row.getCell(6).value = loc?.subLocation || "-";
          row.getCell(7).value =
            unsc?.service?.map((s) => s?.serviceName).join(", ") || "";
          row.getCell(8).value = unsc.raisedBy?.user || "";
          row.getCell(9).value = unsc.approval?.name || "";
          row.getCell(10).value = unsc.comment || "";
          row.getCell(11).value = unsc.update?.status || "";
          row.commit();
          unschCount++;
        }
      }

      console.timeEnd("unschsheet writing ...");
      console.time("casualsheet writing ...");

      // Write Casual Work
      if (casualWorksheet) {
        let casualCount = 4;
        for (let i = 0; i < casuals.length; i++) {
          const casual = casuals[i];
          const loc = casual?.location || {};
          const row = casualWorksheet.getRow(casualCount);
          row.getCell(1).value = casual.createdAt
            ? dateFormat(casual?.createdAt).withTime
            : "";
          row.getCell(2).value = casual?.pestCount || 0;
          row.getCell(3).value = loc?.floor || "-";
          row.getCell(4).value = loc?.location || "-";
          row.getCell(5).value = loc?.subLocation || "-";
          row.getCell(6).value =
            casual?.service?.map((s) => s?.serviceName).join(", ") || "";
          row.getCell(7).value = casual?.user?.name || "";
          row.getCell(8).value = casual?.status || "";
          row.getCell(9).value = casual?.image?.join(", ") || "";
          row.commit();
          casualCount++;
        }
      }
      console.timeEnd("casualsheet writing ...");
      console.time("writing excel ...");
      // Write workbook file and upload
      const buffer = await workbook.xlsx.writeBuffer();
      await fs.writeFile(filePath, buffer);

      const uploadURL = await uploadFile({ filePath });

      console.timeEnd("writing excel ...");
      console.time("uploading excel ...");
      if (uploadURL) {
        await Client.findByIdAndUpdate(client._id, { reportURL: uploadURL });
        generatedFiles.push({ client: client.name, url: uploadURL });
      }
      console.timeEnd("uploading excel ...");

      console.log("removing file ...");
      // Clean up temporary local file asynchronously
      if (fsSync.existsSync(filePath)) {
        try {
          await fs.unlink(filePath);
        } catch (err) {
          if (err.code !== "ENOENT") {
            console.error("Cleanup error:", err);
          }
        }
      }
    }
    console.timeEnd("looping clients...");

    return res.json({
      msg: `Report generated for ${value}`,
      files: generatedFiles,
    });
  } catch (error) {
    console.error("Report generation error:", error);
    res.status(500).json({ msg: "Server error, try again later" });
  }
};
