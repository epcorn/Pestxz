import jwt from "jsonwebtoken";
import QRCode from "qrcode";
import fs from "fs";
import fspromise from "fs/promises";
import sharp from "sharp";
import { v2 as cloudinary } from "cloudinary";
import brevo from "@getbrevo/brevo";
import Location from "../models/locationModel.js";
import Client from "../models/clientModel.js";
import { productCounter } from "../controllers/locationController.js";
import mongoose from "mongoose";
import Counter from "../models/counterModel.js";
import path from "path";

export const capitalLetter = (name) => {
  return name
    .toLowerCase()
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

export const compressImage = async (file) => {
  const inputPath = file.tempFilePath;

  const originalName = path.parse(file.name).name;
  const outputPath = path.join(path.dirname(inputPath), `${originalName}.webp`);

  await sharp(inputPath)
    .rotate()
    .resize({
      width: 1600,
      height: 1600,
      fit: "inside",
      withoutEnlargement: true,
    })
    .webp({
      quality: 75,
    })
    .toFile(outputPath);

  return outputPath;
};

export const dateFormat = (date) => {
  const d = new Date(date);

  return {
    withTime: d.toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }),
    withoutTime: d.toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }),
    onlyTime: d.toLocaleString("en-IN", { hour: "2-digit", minute: "2-digit" }),
  };
};

export const generateToken = (res, userId) => {
  const token = jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_LIFETIME,
  });

  res.cookie("token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV !== "development", // Use secure cookies in production
    sameSite: "strict", // Prevent CSRF attacks
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });
};

//using sharp
export const qrCodeGenerator = async ({ link, floor, location }) => {
  let loc = location.substring(0, 25);
  let subLoc = location.substring(25);

  try {
    const width = 340;
    const qrHeight = 360;
    const totalHeight = qrHeight + 95;

    // 1. Generate QR Code as a Buffer (instead of DataURL)
    const qrBuffer = await QRCode.toBuffer(link, {
      width: width,
      margin: 6,
    });

    // 2. Create an SVG overlay for the text
    // SVG handles text placement much like HTML
    const svgText = `
      <svg width="${width}" height="${totalHeight}">
        <style>
          .branding { fill: rgb(32, 125, 192); font-size: 33px; font-family: Arial; font-weight: bold; font-style: italic; }
          .details { fill: white; font-size: 20px; font-family: Arial; }
        </style>
        
        <!-- Top Branding -->
        <text x="50%" y="30" text-anchor="middle" class="branding">Powered By PestXZ</text> 
        
        <!-- Bottom Details -->
        <text x="2" y="${qrHeight + 42}" class="details">Floor: ${floor}</text>
        <text x="2" y="${qrHeight + 64}" class="details">Location: ${loc}</text>
        <text x="2" y="${qrHeight + 86}" class="details">${subLoc}</text>
      </svg>
    `;

    // 3. Use Sharp to put it all together
    const buf = await sharp({
      create: {
        width: width,
        height: totalHeight,
        channels: 3,
        background: { r: 0, g: 0, b: 0 }, // Assuming a black background based on your text color choices
      },
    })
      .composite([
        { input: qrBuffer, top: 40, left: 0 }, // Place the QR code
        { input: Buffer.from(svgText), top: 0, left: 0 }, // Place the text overlay
      ])
      .jpeg()
      .toBuffer();

    // fs.writeFileSync("./tmp/qr.jpeg", buf);
    return buf;
  } catch (error) {
    console.log("QR Error", error);
    return false;
  }
};

//using sharp
export const productQrCodeGenerator = async ({
  link,
  floor,
  location,
  serialNo,
}) => {
  const loc = location.substring(0, 25);
  const subLoc = location.substring(25);
  try {
    const width = 220;
    const qrSize = 220;
    const topPadding = 34;
    const bottomPadding = subLoc ? 65 : 55;
    const totalHeight = topPadding + qrSize + bottomPadding;

    // 1. QR code buffer
    const qrBuffer = await QRCode.toBuffer(link, {
      width: qrSize,
      margin: 2,
    });

    // 2. Text overlay — branding + serialNo at top, details at bottom
    const svgText = `
      <svg width="${width}" height="${totalHeight}">
        <style>
          .branding { fill: rgb(32, 125, 192); font-size: 16px; font-family: Arial; font-weight: bold; font-style: italic; }
          .serial   { fill: white; font-size: 12px; font-family: Arial; font-weight: bold; }
          .details  { fill: white; font-size: 13px; stroke:"red"; font-family: Arial; }
        </style>

        <!-- Top: branding + serial no -->
        <text x="50%" y="18" text-anchor="middle" class="branding">Powered By PestXZ</text>
        <text x="50%" y="32" text-anchor="middle" class="serial">S/N: ${serialNo ?? "-"}</text>

        <!-- Bottom: floor / location details, each line spaced to fit inside totalHeight -->
        <text x="6" y="${topPadding + qrSize + 20}" class="details">Floor: ${floor}</text>
        <text x="6" y="${topPadding + qrSize + 35}" class="details">Location: ${loc}</text>
        ${subLoc ? `<text x="6" y="${topPadding + qrSize + 45}" class="details">${subLoc}</text>` : ""}
      </svg>
    `;

    // 3. Composite
    const buf = await sharp({
      create: {
        width,
        height: totalHeight,
        channels: 3,
        background: { r: 0, g: 0, b: 0 },
      },
    })
      .composite([
        { input: qrBuffer, top: topPadding, left: (width - qrSize) / 2 },
        { input: Buffer.from(svgText), top: 0, left: 0 },
      ])
      .png()
      .toBuffer();
    fs.writeFileSync("./tmp/qr.jpeg", buf);

    return buf;
  } catch (error) {
    console.log("QR Error", error);
    return false;
  }
};

// productQrCodeGenerator({
//   floor: "1st",
//   link: "wwww.link.com",
//   location: "room class = details >Location",
//   serialNo: "RBC-2026-004",
// });

// for converting qr.jpg to svg
export const qrCodeGeneratorSVG = async ({ link, floor, location }) => {
  let loc = location.substring(0, 25);
  let subLoc = location.substring(25);

  try {
    const width = 340;
    const qrHeight = 360;
    const totalHeight = qrHeight + 95;

    // 1. Generate the inner QR code as pure SVG XML raw content
    // We use xmlMode: true to extract only the path/inner elements
    const rawQrSvg = await QRCode.toString(link, {
      type: "svg",
      width: width,
      margin: 6,
      color: {
        dark: "#ffffff", // White QR dots to stand out on black background
        light: "#000000", // Black QR background matching canvas background
      },
    });

    // 2. Combine your text layout and QR code into one clean SVG document string
    const finalSvgString = `
<svg width="${width}" height="${totalHeight}" viewBox="0 0 ${width} ${totalHeight}" xmlns="w3.org">
  <style>
    .branding { fill: rgb(32, 125, 192); font-size: 33px; font-family: Arial, sans-serif; font-weight: bold; font-style: italic; text-anchor: middle; }
    .details { fill: white; font-size: 20px; font-family: Arial, sans-serif; }
  </style>

  <!-- Background Base (replaces Sharp creation layer) -->
  <rect width="100%" height="100%" fill="#000000" />

  <!-- Top Branding Text -->
  <text x="50%" y="30" class="branding">Powered By PestXZ</text>

  <!-- Embedded QR Code -->
  <g transform="translate(0, 40)">
    ${rawQrSvg}
  </g>

  <!-- Bottom Details Text -->
  <text x="2" y="${qrHeight + 42}" class="details">Floor: ${floor}</text>
  <text x="2" y="${qrHeight + 64}" class="details">Location: ${loc}</text>
  <text x="2" y="${qrHeight + 86}" class="details">${subLoc}</text>
</svg>
    `.trim();

    // 3. Return the string to be saved directly into MongoDB
    return finalSvgString;
  } catch (error) {
    console.log("QR Error", error);
    return false;
  }
};

//consrt svg to jpg at time of downloaing the qr code
export const convertSvgToPngBuffer = async (svgString) => {
  try {
    const pngBuffer = await sharp(Buffer.from(svgString)).png().toBuffer();

    return pngBuffer;
  } catch (error) {
    console.error("PNG Conversion Error:", error);
    throw error;
  }
};

export const uploadFile = async ({ filePath, remove = true }) => {
  try {
    const result = await cloudinary.uploader.upload(filePath, {
      use_filename: true,
      folder: "Pestxz",
      quality: "auto:low",
      resource_type: "auto",
      transformation: [
        {
          width: 1600,
          height: 1600,
          crop: "limit",
          angle: "auto",
          quality: 75,
          fetch_format: "webp",
        },
      ],
    });

    if (remove) fs.unlinkSync(filePath);

    return result.secure_url;
  } catch (error) {
    console.log("Upload Error", error);
    return false;
  }
};

export async function uploadWithRetry(filePath, retries = 1) {
  for (let i = 0; i <= retries; i++) {
    try {
      return await uploadFile({ filePath });
    } catch (err) {
      if (i === retries) throw err;
    }
  }
}

export const sendEmail = async ({
  attachment,
  dynamicData,
  emailList,
  templateId,
}) => {
  try {
    let apiInstance = new brevo.TransactionalEmailsApi();
    let apiKey = apiInstance.authentications["apiKey"];
    apiKey.apiKey = process.env.BREVO_KEY;
    let sendSmtpEmail = new brevo.SendSmtpEmail();

    sendSmtpEmail.sender = {
      name: "EPCORN",
      email: process.env.NO_REPLY_EMAIL,
    };
    sendSmtpEmail.to = emailList;
    sendSmtpEmail.params = dynamicData;
    sendSmtpEmail.templateId = templateId;
    if (attachment) sendSmtpEmail.attachment = attachment;
    await apiInstance.sendTransacEmail(sendSmtpEmail);
    return true;
  } catch (error) {
    console.error("Brevo API Status Code:", error.response?.statusCode);
    console.error(
      "Brevo Error Body:",
      JSON.stringify(error.response?.body, null, 2),
    );
    return false;
  }
};

export const removeOldQr = async (url) => {
  if (!url) return null;

  try {
    const match = url.match(
      /cloudinary\.com\/[^/]+\/(image|video|raw)\/upload\/(?:v\d+\/)?(.+)$/,
    );

    if (!match) return null;

    const resourceType = match[1];
    let publicId = match[2];

    // Remove extension
    if (resourceType !== "raw") {
      publicId = publicId.replace(/\.[^/.]+$/, "");
    }

    const result = await cloudinary.uploader.destroy(publicId, {
      resource_type: resourceType,
      invalidate: true,
    });

    console.log("Old file removed:", result);

    return result;
  } catch (error) {
    console.error("Error deleting old file:", error);
    return null;
  }
};

export function dateTimeSplitter(date) {
  const getDate = new Date(date).toISOString();
  const [acDate, acTime] = getDate.split("T");
  return { date: acDate, time: acTime.split(".")[0] };
}
// GENERATE SCHEDULE
export const generateSchedule = (start, end, frequency, preffDay) => {
  const dayMap = {
    sunday: 0,
    monday: 1,
    tuesday: 2,
    wednesday: 3,
    thursday: 4,
    friday: 5,
    saturday: 6,
  };

  const today = new Date();
  const schedule = [];
  const freq = (frequency || "").toLowerCase().trim();

  // --- FREQUENCIES THAT NEVER USE PREFERRED DAYS ---
  const NO_PREF_DAY_FREQUENCIES = ["daily", "alternate days"];
  const usesPrefDay = !NO_PREF_DAY_FREQUENCIES.includes(freq);

  // --- NORMALIZE PREFERRED DAYS (accepts a single string or an array, max 3) ---
  const rawDays = usesPrefDay
    ? Array.isArray(preffDay)
      ? preffDay
      : preffDay
        ? [preffDay]
        : []
    : [];
  const targetDayNums = [
    ...new Set(
      rawDays
        .map((d) => (d || "").toLowerCase().trim())
        .filter((d) => d in dayMap)
        .map((d) => dayMap[d]),
    ),
  ].slice(0, 3);

  const daysToNearestTarget = (date) => {
    if (targetDayNums.length === 0) return 0;
    const currentDayNum = date.getDay();
    let min = 7;
    for (const targetDayNum of targetDayNums) {
      const diff = (targetDayNum - currentDayNum + 7) % 7;
      if (diff < min) min = diff;
    }
    return min === 7 ? 0 : min;
  };

  let current = new Date(start);
  let endDate = new Date(end);

  // current = today < current ? current : today;

  current.setDate(current.getDate() + daysToNearestTarget(current));

  while (current <= endDate) {
    schedule.push({
      date: current.toISOString().split("T")[0],
      status: "Pending",
      completed: false,
    });

    const next = new Date(current);

    switch (freq) {
      case "daily":
        next.setDate(next.getDate() + 1);
        break;

      case "alternate days":
        next.setDate(next.getDate() + 2);
        break;

      case "twice a week":
        next.setDate(next.getDate() + 3);
        break;

      case "thrice a week":
        next.setDate(next.getDate() + 2);
        break;

      case "weekly":
        next.setDate(next.getDate() + 7);
        break;

      case "fortnightly":
      case "bi-weekly":
        next.setDate(next.getDate() + 14);
        break;

      case "twice monthly":
        next.setDate(next.getDate() + 15);
        break;

      case "thrice a month":
        next.setDate(next.getDate() + 10);
        break;

      case "monthly": {
        const currentDay = next.getDate();
        next.setDate(1);
        next.setMonth(next.getMonth() + 1);
        next.setDate(currentDay);
        break;
      }

      case "alternate monthly": {
        const altDay = next.getDate();
        next.setDate(1);
        next.setMonth(next.getMonth() + 2);
        next.setDate(altDay);
        break;
      }

      case "quarterly": {
        const qDay = next.getDate();
        next.setDate(1);
        next.setMonth(next.getMonth() + 3);
        next.setDate(qDay);
        break;
      }

      case "half yearly": {
        const hDay = next.getDate();
        next.setDate(1);
        next.setMonth(next.getMonth() + 6);
        next.setDate(hDay);
        break;
      }

      case "3 services once in 4 month":
        next.setDate(next.getDate() + 40);
        break;

      case "2 services once in 6 month":
        next.setDate(next.getDate() + 90);
        break;

      case "yearly":
        next.setFullYear(next.getFullYear() + 1);
        break;

      default: {
        const dDay = next.getDate();
        next.setDate(1);
        next.setMonth(next.getMonth() + 1);
        next.setDate(dDay);
        break;
      }
    }

    // --- RE-ALIGN TO NEAREST PREFERRED DAY AFTER MONTHLY/YEARLY INCREMENTS ---
    if (
      usesPrefDay &&
      targetDayNums.length > 0 &&
      [
        "monthly",
        "alternate monthly",
        "quarterly",
        "half yearly",
        "yearly",
        "default",
      ].includes(freq)
    ) {
      next.setDate(next.getDate() + daysToNearestTarget(next));
    }

    current = next;
  }

  return schedule;
};

export const toArray = (val) => {
  if (Array.isArray(val)) return val;
  if (val === undefined || val === null || val === "") return [];
  return [val];
};

export const buildSchedule = (contractStart, contractEnd, frequency, day) =>
  generateSchedule(contractStart, contractEnd, frequency, day).map((d) => ({
    date: d.date,
    completed: d.completed,
    status: d.status,
    completedAt: null,
    completedBy: null,
  }));

export const releaseProductCounter = async (code, serialNo) => {
  if (!code || !serialNo) return;

  const released = await Counter.findOneAndUpdate(
    { productCode: code },
    { $inc: { seq: -1 } },
  );
  console.log(released);
  return released;
};

// ── formatting ─────────────────────────────────────────────
export const formatServices = (
  serviceReq,
  existingServices,
  contractStart,
  contractEnd,
  day,
) => {
  const valid = serviceReq.filter(
    (s) => s.serviceId && s.serviceName && s.scopes?.length > 0,
  );
  if (!valid.length) return { error: "Please add at least one valid service" };

  const formatted = valid.map((service) => {
    const old = existingServices.find(
      (s) => s.serviceId?.toString() === service.serviceId?.toString(),
    );
    const schedule =
      old?.schedule?.length && old.frequency === service.frequency
        ? old.schedule
        : buildSchedule(contractStart, contractEnd, service.frequency, day);

    return {
      serviceId: service.serviceId,
      serviceName: service.serviceName,
      frequency: service.frequency,
      schedule,
      scopes: service.scopes.map((sc) => ({
        scopeId: sc.scopeId,
        scopeName: sc.scopeName,
        consumables: (sc.consumables || []).map((c) => ({
          consumableId: c.consumableId,
          consumableName: c.consumableName,
          calibration: c.calibration,
        })),
      })),
    };
  });

  return { formatted };
};

export const formatProducts = async (
  productReq,
  existingProducts,
  contractStart,
  contractEnd,
  locationId,
  loc,
  client,
) => {
  const valid = productReq.filter(
    (p) => p.productId && p.versionId && p.frequency,
  );
  if (!valid.length) return { error: "Please fill all product fields" };

  const formatted = await Promise.all(
    valid.map(async (pr, i) => {
      const old = pr._id
        ? existingProducts.find((p) => p._id?.toString() === pr._id?.toString())
        : null;

      const changed =
        !old ||
        old.productId?.toString() !== pr.productId ||
        old.versionId?.toString() !== pr.versionId;

      const serialNo = changed
        ? await productCounter(pr.code, client)
        : old.serialNo;

      const schedule =
        !changed && old?.schedule?.length && old.frequency === pr.frequency
          ? old.schedule
          : buildSchedule(
              contractStart,
              contractEnd,
              pr.frequency,
              client.prefDay,
            );

      const qrData = await productQrCodeGenerator({
        link: `https://pestxz.com/location/${locationId}`,
        floor: loc.floor,
        location: `${loc.location}, ${loc.subLocation}`,
        serialNo,
      });

      fs.writeFileSync(`./tmp/qr${i}.jpeg`, qrData);
      const qrLink = await uploadFile({ filePath: `./tmp/qr${i}.jpeg` });

      return {
        _id: old?._id || new mongoose.Types.ObjectId(),
        productId: pr.productId,
        productName: pr.productName,
        versionId: pr.versionId,
        versionName: pr.versionName,
        frequency: pr.frequency,
        code: pr.code,
        serialNo,
        specification: pr.specification,
        calibrations: toArray(pr.calibrations),
        schedule,
        qr: qrLink,
      };
    }),
  );

  return { formatted };
};

// ── diffing ────────────────────────────────────────────────
// Helper to safely handle calibration values
// const toArray = (val) => (Array.isArray(val) ? val : val ? [val] : []);

export const diffServices = (oldServices = [], newServices = []) => {
  const diff = {};

  const oldMap = new Map(oldServices.map((s) => [s.serviceId?.toString(), s]));
  const newMap = new Map(newServices.map((s) => [s.serviceId?.toString(), s]));

  // 1. Direct Additions & Removals
  const added = newServices
    .filter((s) => !oldMap.has(s.serviceId?.toString()))
    .map((s) => s.serviceName);
  const removed = oldServices
    .filter((s) => !newMap.has(s.serviceId?.toString()))
    .map((s) => s.serviceName);

  if (added.length) diff.servicesAdded = added;
  if (removed.length) diff.servicesRemoved = removed;

  // Track deep scope and calibration changes for existing services
  const scopesAdded = [];
  const scopesRemoved = [];
  const calibrationChanges = [];

  // 2. Deep Structural Changes on Matching Services
  newServices.forEach((s) => {
    const old = oldMap.get(s.serviceId?.toString());
    if (!old) return; // Handled by additions

    const serviceName = s.serviceName;

    // Map scopes for nested comparison
    const oldScopesMap = new Map(
      (old.scopes || []).map((sc) => [sc.scopeName, sc]),
    );
    const newScopes = s.scopes || [];

    // Scope level additions / removals
    newScopes.forEach((sc) => {
      if (!oldScopesMap.has(sc.scopeName)) {
        scopesAdded.push({ service: serviceName, scope: sc.scopeName });
      }
    });

    (old.scopes || []).forEach((sc) => {
      if (!newScopes.some((nsc) => nsc.scopeName === sc.scopeName)) {
        scopesRemoved.push({ service: serviceName, scope: sc.scopeName });
      }
    });

    // Deep Calibration Check inside Scopes
    newScopes.forEach((newScope) => {
      const oldScope = oldScopesMap.get(newScope.scopeName);
      if (!oldScope) return; // Handled by scopesAdded

      const oldConsMap = new Map(
        (oldScope.consumables || []).map((c) => [c.consumableName, c]),
      );
      const newCons = newScope.consumables || [];

      newCons.forEach((c) => {
        const oldC = oldConsMap.get(c.consumableName);
        if (oldC && oldC.calibration !== c.calibration) {
          calibrationChanges.push({
            consumable: c.consumableName,
            service: serviceName,
            scope: newScope.scopeName,
            from: oldC.calibration,
            to: c.calibration,
          });
        }
      });
    });
  });

  if (scopesAdded.length) diff.scopesAdded = scopesAdded;
  if (scopesRemoved.length) diff.scopesRemoved = scopesRemoved;
  if (calibrationChanges.length) diff.calibrationChanges = calibrationChanges;

  return diff;
};

export const diffProducts = async (oldProducts, newProducts) => {
  const diff = {};
  const matchById = (list, id) =>
    list.find((p) => p._id?.toString() === id?.toString());

  const addedProducts = newProducts.filter(
    (p) => !matchById(oldProducts, p._id),
  );
  if (addedProducts.length) {
    diff.productsAdded = addedProducts;
  }

  const removedProducts = oldProducts.filter(
    (p) => !matchById(newProducts, p._id),
  );
  if (removedProducts.length) {
    diff.productsRemoved = removedProducts;

    await Promise.all(
      removedProducts.map((p) => releaseProductCounter(p.code, p.serialNo)),
    );
  }

  return diff;
};

export const autoMarkMissed = async () => {
  try {
    // 1. Prepare today as a native Date object (for product array)
    const todayiso = new Date(new Date().setUTCHours(0, 0, 0, 0)).toISOString();
    const todayDateObj = new Date(todayiso);

    // 2. Prepare today as a YYYY-MM-DD String (for service array)
    const todayString = todayiso.split("T")[0];

    const updated = await Location.collection.updateMany(
      {
        // Match documents where EITHER array contains an outdated pending item
        $or: [
          {
            "product.schedule": {
              $elemMatch: {
                date: { $lt: todayDateObj },
                completed: false,
                status: "Pending",
              },
            },
          },
          {
            "service.schedule": {
              $elemMatch: {
                date: { $lt: todayString },
                completed: false,
                status: "Pending",
              },
            },
          },
        ],
      },
      {
        $set: {
          "product.$[prodElem].schedule.$[prodSchedElem].status": "Missed",
          "service.$[servElem].schedule.$[servSchedElem].status": "Missed",
        },
      },
      {
        arrayFilters: [
          // Identifiers for outer arrays
          { "prodElem.schedule": { $exists: true } },
          { "servElem.schedule": { $exists: true } },

          // Target array matching for products (using Date Object)
          {
            "prodSchedElem.date": { $lt: todayDateObj },
            "prodSchedElem.completed": false,
            "prodSchedElem.status": "Pending",
          },
          // Target array matching for services (using YYYY-MM-DD String)
          {
            "servSchedElem.date": { $lt: todayString },
            "servSchedElem.completed": false,
            "servSchedElem.status": "Pending",
          },
        ],
      },
    );

    console.log(
      `[Cron Success] Acknowledged: ${updated.acknowledged}. Modified: ${updated.modifiedCount}`,
    );
  } catch (error) {
    console.error(
      "[Cron Error] Error updating missed schedules:",
      error.message,
    );
  }
};
