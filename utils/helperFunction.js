import jwt from "jsonwebtoken";
import QRCode from "qrcode";
import fs from "fs";
import sharp from "sharp";
import { v2 as cloudinary } from "cloudinary";
import brevo from "@getbrevo/brevo";
import Location from "../models/locationModel.js";
import Client from "../models/clientModel.js";
import { productCounter } from "../controllers/locationController.js";
import mongoose from "mongoose";
import Counter from "../models/counterModel.js";

export const capitalLetter = (name) => {
  return name
    .toLowerCase()
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
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
    const width = 220; // was 100 — bigger for reliable scanning at print size
    const qrSize = 220;
    const topPadding = 34; // room for branding + serialNo
    const bottomPadding = subLoc ? 65 : 55; // room for 4 lines: floor, location, sub-location, spacing
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

export const uploadFile = async ({ filePath }) => {
  try {
    const result = await cloudinary.uploader.upload(filePath, {
      use_filename: true,
      folder: "Pestxz",
      quality: 30,
      resource_type: "auto",
    });

    fs.unlinkSync(filePath);

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
    console.log(error);
    return false;
  }
};

export const removeOldQr = async (url) => {
  if (!url) return null; // ✅ guard for new locations or missing QR

  const parts = url.split("/upload/");
  if (parts.length < 2) return null;

  const pathWithVersion = parts[1].replace(/^v\d+\//, "");
  const publicId = pathWithVersion.split(".").slice(0, -1).join(".");

  try {
    const result = await cloudinary.uploader.destroy(publicId, {
      invalidate: true,
    });
    return result;
  } catch (error) {
    console.error("Error deleting asset: ", error);
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
export const diffServices = (oldServices, newServices) => {
  const diff = {};
  const oldNames = oldServices.map((s) => s.serviceName);
  const newNames = newServices.map((s) => s.serviceName);

  const added = newNames.filter((n) => !oldNames.includes(n));
  const removed = oldNames.filter((n) => !newNames.includes(n));
  if (added.length) diff.servicesAdded = added;
  if (removed.length) diff.servicesRemoved = removed;

  const freqChanges = newServices
    .map((s) => {
      const old = oldServices.find(
        (o) => o.serviceId?.toString() === s.serviceId?.toString(),
      );
      return old && old.frequency !== s.frequency
        ? { service: s.serviceName, from: old.frequency, to: s.frequency }
        : null;
    })
    .filter(Boolean);
  if (freqChanges.length) diff.frequencyChanges = freqChanges;

  const oldScopes = oldServices.flatMap(
    (s) => s.scopes?.map((sc) => sc.scopeName) || [],
  );
  const newScopes = newServices.flatMap((s) =>
    s.scopes.map((sc) => sc.scopeName),
  );
  const scopesAdded = newScopes.filter((s) => !oldScopes.includes(s));
  const scopesRemoved = oldScopes.filter((s) => !newScopes.includes(s));
  if (scopesAdded.length) diff.scopesAdded = scopesAdded;
  if (scopesRemoved.length) diff.scopesRemoved = scopesRemoved;

  const flattenConsumables = (services) =>
    services.flatMap(
      (s) =>
        s.scopes?.flatMap(
          (sc) =>
            sc.consumables?.map((c) => ({
              consumableName: c.consumableName,
              calibration: c.calibration,
            })) || [],
        ) || [],
    );
  const oldConsumables = flattenConsumables(oldServices);
  const newConsumables = flattenConsumables(newServices);

  const consumablesAdded = newConsumables
    .filter(
      (n) => !oldConsumables.find((o) => o.consumableName === n.consumableName),
    )
    .map((c) => c.consumableName);
  const consumablesRemoved = oldConsumables
    .filter(
      (o) => !newConsumables.find((n) => n.consumableName === o.consumableName),
    )
    .map((c) => c.consumableName);
  if (consumablesAdded.length) diff.consumablesAdded = consumablesAdded;
  if (consumablesRemoved.length) diff.consumablesRemoved = consumablesRemoved;

  const calibrationChanges = newConsumables
    .map((n) => {
      const old = oldConsumables.find(
        (o) => o.consumableName === n.consumableName,
      );
      return old && old.calibration !== n.calibration
        ? {
            consumable: n.consumableName,
            from: old.calibration,
            to: n.calibration,
          }
        : null;
    })
    .filter(Boolean);
  if (calibrationChanges.length) diff.calibrationChanges = calibrationChanges;

  return diff;
};

export const diffProducts = async (oldProducts, newProducts) => {
  const diff = {};
  const matchById = (list, id) =>
    list.find((p) => p._id?.toString() === id?.toString());

  const addedProducts = newProducts
    .filter((p) => !matchById(oldProducts, p._id))
    .map((p) => p.productName);
  const removedRows = oldProducts.filter((p) => !matchById(newProducts, p._id));
  if (addedProducts.length) diff.productsAdded = addedProducts;
  if (removedRows.length)
    diff.productsRemoved = removedRows.map((p) => p.productName);

  await Promise.all(
    removedRows.map((p) => releaseProductCounter(p.code, p.serialNo)),
  );

  const versionChanges = [],
    freqChanges = [],
    calAdded = [],
    calRemoved = [];
  newProducts.forEach((p) => {
    const old = matchById(oldProducts, p._id);
    if (!old) return;
    if (old.versionId?.toString() !== p.versionId)
      versionChanges.push({
        product: p.productName,
        from: old.versionName,
        to: p.versionName,
      });
    if (old.frequency !== p.frequency)
      freqChanges.push({
        product: p.productName,
        from: old.frequency,
        to: p.frequency,
      });

    const newCal = toArray(p.calibrations),
      oldCal = toArray(old.calibrations);
    const added = newCal.filter((c) => !oldCal.includes(c));
    const removed = oldCal.filter((c) => !newCal.includes(c));
    if (added.length) calAdded.push({ product: p.productName, added });
    if (removed.length) calRemoved.push({ product: p.productName, removed });
  });

  if (versionChanges.length) diff.versionChanges = versionChanges;
  if (freqChanges.length) diff.productFrequencyChanges = freqChanges;
  if (calAdded.length) diff.productCalibrationsAdded = calAdded;
  if (calRemoved.length) diff.productCalibrationsRemoved = calRemoved;

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
