import Client from "../models/clientModel.js";
import exceljs from "exceljs";
import {
  dateFormat,
  dateTimeSplitter,
  removeOldQr,
  sendEmail,
  uploadFile,
} from "../utils/helperFunction.js";
import fs from "fs/promises";
import fsSync from "fs";
import path from "path";
import Location from "../models/locationModel.js";
import { generateHtmlReport } from "../utils/html.js";

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

// Helper to download image buffer for ExcelJS
const fetchImageBuffer = async (url) => {
  try {
    const response = await fetch(url);
    if (!response.ok) return null;
    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  } catch (err) {
    console.error("Failed to fetch image for Excel:", err);
    return null;
  }
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
    const selectFields = req.user.client ? "" : "-adminPass";

    let matchCondition = {};
    let scheduleDateMatch = {};
    let prodScheduleDateMatch = {};

    if (value === "custom") {
      matchCondition = { updatedAt: { $gte: todayStart, $lte: todayEnd } };
      scheduleDateMatch = {
        "service.schedule.date": { $gte: todayStart, $lte: todayEnd },
      };
      prodScheduleDateMatch = {
        "product.schedule.date": { $gte: todayStart, $lte: todayEnd },
      };
      startDate = todayStart;
      endDate = todayEnd;
    } else if (value === "weekly") {
      const weekEnd = new Date(todayStart);
      const weekStart = new Date(todayStart);
      weekStart.setUTCDate(weekStart.getUTCDate() - 7);
      matchCondition = { updatedAt: { $gte: weekStart, $lt: weekEnd } };
      scheduleDateMatch = {
        "service.schedule.date": { $gte: weekStart, $lt: weekEnd },
      };
      prodScheduleDateMatch = {
        "product.schedule.date": { $gte: weekStart, $lt: weekEnd },
      };
      startDate = weekStart;
      endDate = weekEnd;
    } else if (value === "fortnightly") {
      const fortnightEnd = new Date(todayStart);
      const fortnightStart = new Date(todayStart);
      fortnightStart.setUTCDate(fortnightStart.getUTCDate() - 15);
      matchCondition = {
        updatedAt: { $gte: fortnightStart, $lt: fortnightEnd },
      };
      scheduleDateMatch = {
        "service.schedule.date": { $gte: fortnightStart, $lt: fortnightEnd },
      };
      prodScheduleDateMatch = {
        "product.schedule.date": { $gte: fortnightStart, $lt: fortnightEnd },
      };
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

      matchCondition = { updatedAt: { $gte: monthStart, $lt: monthEnd } };
      scheduleDateMatch = {
        "service.schedule.date": { $gte: monthStart, $lt: monthEnd },
      };
      prodScheduleDateMatch = {
        "product.schedule.date": { $gte: monthStart, $lt: monthEnd },
      };
      startDate = monthStart;
      endDate = monthEnd;
    }

    // 1. PRE-LOAD EXCEL TEMPLATE IN MEMORY (DO NOT READ DISK PER CLIENT)
    const templatePath = isPestEmployee
      ? "./tmp/dailyReport_Pest.xlsx"
      : "./tmp/dailyReport_Client.xlsx";
    const templateBuffer = await fs.readFile(templatePath);

    // 2. BATCH AGGREGATIONS FOR ALL CLIENTS AT ONCE (AVOID N+1 QUERIES)

    const [allServiceStats, allProdStats] = await Promise.all([
      Location.aggregate([
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

    // Map aggregations by client ID for fast O(1) lookup
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

    const populateOptions = [
      {
        path: "services",
        match: { createdAt: { $gte: startDate, $lte: endDate } },
        select: "type regularService complaintDetails complaintUpdate location",
        populate: {
          path: "location",
          select: "_id location floor subLocation",
        },
      },
      { path: "locations", select: "_id location floor subLocation" },
      {
        path: "unschedules",
        match: matchCondition,
        populate: {
          path: "location",
          select: "_id location floor subLocation",
        },
      },
      {
        path: "casuals",
        match: matchCondition,
        populate: {
          path: "location",
          select: "_id location floor subLocation",
        },
      },
      {
        path: "productservices",
        match: matchCondition,
        populate: {
          path: "location",
          select: "_id location floor subLocation",
        },
      },
    ];

    const clientCursor = Client.find(clientQuery)
      .select(selectFields)
      .populate(populateOptions)
      .lean()
      .cursor();

    const sufix =
      value === "all" ? "All" : todayStart.toISOString().split("T")[0];
    const generatedFiles = [];
    const dir = path.resolve("./tmp/reports");

    if (!fsSync.existsSync(dir)) {
      await fs.mkdir(dir, { recursive: true });
    }
    let dats = {};

    for await (let client of clientCursor) {
      const clientIdStr = client._id.toString();
      const clientName = client.name
        .replace(/\./g, "")
        .replace(/[\\/:\*\?"<>\|]/g, "")
        .trim()
        .replace(/\s+/g, "_");
      const fileName = `${clientName}_Daily_Service_Report-${sufix}.xlsx`;
      const filePath = path.join(dir, fileName);
      dats = { client };
      // SINGLE PASS grouping for services by type
      const regulars = [];
      const complaints = [];

      const clientServices = client.services || [];
      for (const s of clientServices) {
        if (s.type === "Complaint") {
          complaints.push(s);
        }
        if (s.type === "Regular") {
          regulars.push(s);
        }
      }
      console.log(regulars.length, complaints.length);

      const clientServiceStats = serviceStatsMap.get(clientIdStr) || {};
      const clientProdStats = prodStatsMap.get(clientIdStr) || {};

      const regStats = {
        missed: clientServiceStats.missed || 0,
        done: clientServiceStats.done || 0,
        pending: clientServiceStats.pending || 0,
        location: 0,
        pestCount: [],
      };

      const prodStats = {
        missed: clientProdStats.missed || 0,
        done: clientProdStats.done || 0,
        pending: clientProdStats.pending || 0,
        location: 0,
      };

      // Group pest counts
      const groupedPests = {};
      for (let i = 0; i < regulars.length; i++) {
        const reg = regulars[i];
        const service = reg?.regularService?.[0];
        if (service && service?.pestCount > 0) {
          const {
            serviceName: name,
            pestCount: count,
            serviceDate: date,
            image,
          } = service;
          const locationId = reg?.location?._id;
          const compositeName = `${name}_${locationId}`;

          if (!groupedPests[compositeName]) {
            groupedPests[compositeName] = {
              name,
              count: 0,
              date,
              image,
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

      // Complaint rollup
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

      // LOAD WORKBOOK FROM PRE-LOADED BUFFER
      const workbook = new exceljs.Workbook();
      await workbook.xlsx.load(templateBuffer);

      const overviewWorkSheet = workbook.getWorksheet("Overview");
      const regularWorksheet = workbook.getWorksheet("Regular service");
      const complaintWorksheet = workbook.getWorksheet("Complaints");
      const unschWorksheet = workbook.getWorksheet("Unscheduled-Work");
      const casualWorksheet = workbook.getWorksheet("Casual-Work");
      console.log("writing to overview sheet ...");
      // Populate Overview
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
        row17.getCell(2).value = client?.unschedules?.length ?? 0;

        const row19 = overviewWorkSheet.getRow(19);
        row19.getCell(2).value = client?.casuals?.length ?? 0;

        const startColumn = 7;
        let currentRowNum = 6;
        row17.commit();
        row19.commit();

        // Loop through top pest counts and embed images into Excel
        for (const p of regStats?.pestCount || []) {
          const currentRow = overviewWorkSheet.getRow(currentRowNum);
          currentRow.height = 50; // Increased row height to fit the embedded image better

          const rowData = [
            dateFormat(p?.date).withTime || "",
            p?.floor || "-",
            p?.location || "-",
            p?.subLocation || "-",
            PEST_MAP[p.name] || "",
            p?.count || 0,
          ];

          // Write text data to cells (Columns G through L)
          rowData.forEach((val, idx) => {
            const cell = currentRow.getCell(startColumn + idx);
            cell.value = val;
            cell.alignment = {
              wrapText: true,
              vertical: "middle",
              horizontal: "center",
            };
          });

          // Extract first image URL (if image is an array or string)
          const imageUrl = Array.isArray(p?.image) ? p.image[0] : p?.image;

          if (
            imageUrl &&
            typeof imageUrl === "string" &&
            imageUrl.startsWith("http")
          ) {
            const imgBuffer = await fetchImageBuffer(imageUrl);

            if (imgBuffer) {
              // Determine extension (png vs jpeg/jpg)
              const extension = imageUrl.toLowerCase().endsWith(".png")
                ? "png"
                : "jpeg";

              const imageId = workbook.addImage({
                buffer: imgBuffer,
                extension,
              });

              // Embed the image in Column 13 (Column M) or whatever your image column index is
              const imageColumnIdx = startColumn + rowData.length; // Next available column after text data

              overviewWorkSheet.addImage(imageId, {
                tl: { col: imageColumnIdx - 1, row: currentRowNum - 1 },
                ext: { width: 55, height: 75 }, 
                editAs: "oneCell",
              });
            }
          }

          currentRow.commit();
          currentRowNum++;
        }
      }

      // Populate Complaints
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

      // Populate Regular Services
      if (regularWorksheet) {
        console.log("writing to regular sheet ...");
        let currRow = 4;
        for (let i = 0; i < regulars?.length; i++) {
          const reg = regulars[i];
          const regs = reg.regularService?.[0];
          if (!regs) continue;
          const loc = reg.location || {};

          // Build flattened scope/consumable entries
          const scopeEntries = [];
          if (isPestEmployee && Array.isArray(regs?.scopes)) {
            regs.scopes.forEach((sc) => {
              if (Array.isArray(sc?.consumables) && sc.consumables.length > 0) {
                sc.consumables.forEach((con) => {
                  scopeEntries.push({
                    scopeName: sc.scopeName || "",
                    consumableName: con.consumableName || "",
                    calibration: con.calibration || 0,
                    usedCalibration: con.usedCalibration || 0,
                    action: con.action || "",
                  });
                });
              }
            });
          }

          const writeBaseColumns = (row) => {
            row.height = 30;
            row.getCell(1).value = dateFormat(regs.serviceDate).withoutTime;
            row.getCell(2).value = dateFormat(regs.serviceDate).onlyTime;
            row.getCell(3).value = regs?.frequency;
            row.getCell(4).value = regs?.pestCount || 0;
            row.getCell(5).value = regs?.userName;
            row.getCell(6).value = loc?.floor;
            row.getCell(7).value = loc?.location;
            row.getCell(8).value = loc?.subLocation;
            row.getCell(9).value = regs?.serviceName;
          };

          if (isPestEmployee) {
            if (scopeEntries.length > 0) {
              // one row per scope/consumable entry
              for (const entry of scopeEntries) {
                const row = regularWorksheet.getRow(currRow);
                writeBaseColumns(row);
                row.getCell(10).value = entry.scopeName;
                row.getCell(11).value = entry.consumableName;
                row.getCell(12).value = entry.calibration;
                row.getCell(13).value = entry.usedCalibration;
                row.getCell(14).value = entry.action;
                row.getCell(15).value = Array.isArray(regs?.image)
                  ? regs?.image.join(", ")
                  : regs?.image || "";
                row.commit();
                currRow++;
              }
            } else {
              // no scopes/consumables — still write one base row
              const row = regularWorksheet.getRow(currRow);
              writeBaseColumns(row);
              row.getCell(15).value = Array.isArray(regs?.image)
                ? regs?.image.join(", ")
                : regs?.image || "";
              row.commit();
              currRow++;
            }
          } else {
            const row = regularWorksheet.getRow(currRow);
            writeBaseColumns(row);
            row.getCell(10).value = Array.isArray(regs?.image)
              ? regs?.image.join(", ")
              : regs?.image || "";
            row.commit();
            currRow++;
          }
        }
      }

      // Populate Unscheduled Work
      if (unschWorksheet) {
        let unschCount = 4;
        const unschedules = client.unschedules || [];
        console.log(unschedules.length);
        for (let i = 0; i < unschedules.length; i++) {
          const unsc = unschedules[i];
          const loc = unsc.location || {};
          const row = unschWorksheet.getRow(unschCount);
          row.getCell(1).value = unsc.createdAt
            ? dateFormat(unsc?.createdAt).withTime
            : "";
          row.getCell(2).value = unsc.updatedAt
            ? dateFormat(unsc?.completedBy.date).withTime
            : "";
          row.getCell(3).value = unsc?.pestCount || 0;
          row.getCell(4).value = loc?.floor || "-";
          row.getCell(5).value = loc?.location || "-";
          row.getCell(6).value = loc?.subLocation || "-";
          row.getCell(7).value =
            unsc.service.map((s) => s.serviceName).join(", ") || "";
          row.getCell(8).value = unsc.raisedBy?.user || "";
          row.getCell(9).value = unsc.approval?.name || "";
          row.getCell(10).value = unsc.comment || "";
          row.getCell(11).value =
            unsc?.status || unsc.approval?.status || "Done";
          row.commit();
          unschCount++;
        }
      }
      if (casualWorksheet) {
        let casualCount = 4;
        const casualsWork = client.casuals || [];
        console.log(casualsWork.length);
        for (let i = 0; i < casualsWork.length; i++) {
          const casual = casualsWork[i];
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
          row.getCell(7).value = casual?.user.name || "";
          row.getCell(8).value = casual?.status || "";
          row.getCell(9).value = casual?.image.join(", ");
          // row.getCell(11).value =
          row.commit();
          casualCount++;
        }
      }

      // Save file
      console.log("writing to excel ...");
      await workbook.xlsx.writeFile(filePath);

      console.log("uploading excel ...");
      const uploadURL = await uploadFile({ filePath });
      if (uploadURL) {
        await Client.findByIdAndUpdate(client._id, { reportURL: uploadURL });
        generatedFiles.push({ client: client.name, url: uploadURL });
      }

      // Async cleanup
      console.log("cleaning excel ...");
      if (fsSync.existsSync(filePath)) {
        try {
          await fs.unlink(filePath);
        } catch (err) {
          if (err.code !== "ENOENT") {
            console.error("Unexpected cleanup error:", err);
          }
        }
      }
    }

    console.log("excel cleaned ,, sending response...");
    return res.json({
      msg: `Report generated for ${value}`,
      files: generatedFiles,
      dats,
    });
  } catch (error) {
    console.error("Report generation error:", error);
    res.status(500).json({ msg: "Server error, try again later" });
  }
};
