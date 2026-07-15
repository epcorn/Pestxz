import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import dns from "node:dns";
import {
  Document,
  Packer,
  Paragraph,
  ImageRun,
  AlignmentType,
  TextRun,
} from "docx";
import User from "../models/userModel.js";
import { removeOldQr, uploadFile } from "./helperFunction.js";

// ── Force IPv4 resolution ─────────────────────────────────────
// Render (and many cloud hosts) resolve hostnames to IPv6 first via
// Happy Eyeballs, but often have flaky/no IPv6 routing to external
// hosts like Cloudinary. This causes intermittent ETIMEDOUT / fetch
// failed errors that don't happen locally. Preferring IPv4 avoids it.
dns.setDefaultResultOrder("ipv4first");

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ── Fetch a URL and return it as a Buffer, with timeout + retry ──
const fetchImageBuffer = async (url, { retries = 2, timeoutMs = 10000 } = {}) => {
  if (!url || typeof url !== "string") {
    throw new Error(`Invalid QR url: ${url}`);
  }

  let lastError;

  for (let attempt = 0; attempt <= retries; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(url, { signal: controller.signal });

      if (!response.ok) {
        throw new Error(`Failed to fetch image (${response.status}): ${url}`);
      }

      const arrayBuffer = await response.arrayBuffer();

      if (!arrayBuffer || arrayBuffer.byteLength === 0) {
        throw new Error(`Empty image data for url: ${url}`);
      }

      return Buffer.from(arrayBuffer);
    } catch (err) {
      lastError = err;

      // Don't retry on validation-type errors, only network/timeout ones
      const isLastAttempt = attempt === retries;
      if (isLastAttempt) break;

      // Exponential-ish backoff before retrying
      await new Promise((r) => setTimeout(r, 500 * (attempt + 1)));
    } finally {
      clearTimeout(timer);
    }
  }

  throw lastError;
};

export const makeQrFile = async (req, res) => {
  const data = req.body;

  try {
    const QR_WIDTH = 220;
    const QR_HEIGHT = 270;

    const qrUrls = Array.isArray(data?.qrs) ? data.qrs : [];

    if (qrUrls.length === 0) {
      return res.status(400).json({ error: "No QR codes provided" });
    }

    // ── Fetch all QR images in parallel, tolerating individual failures ──
    const results = await Promise.allSettled(
      qrUrls.map((url) => fetchImageBuffer(url)),
    );

    const qrBuffers = results
      .filter((r) => r.status === "fulfilled")
      .map((r) => r.value);

    const failed = results
      .map((r, i) =>
        r.status === "rejected"
          ? { url: qrUrls[i], reason: r.reason?.message || String(r.reason) }
          : null,
      )
      .filter(Boolean);

    if (failed.length > 0) {
      console.warn(
        `makeQrFile: ${failed.length}/${qrUrls.length} QR image(s) failed to fetch:`,
        failed,
      );
    }

    if (qrBuffers.length === 0) {
      return res.status(502).json({
        error:
          "Failed to fetch any QR images. Please check your connection and try again.",
      });
    }

    const children = [
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [
          new TextRun({
            text: `Client: ${data.client}`,
            bold: true,
            size: 28,
          }),
        ],
        spacing: { after: 400 },
      }),
    ];

    // Chunk images into rows of 3
    for (let i = 0; i < qrBuffers.length; i += 3) {
      const rowImages = [];

      for (let j = 0; j < 3; j++) {
        const imgIndex = i + j;

        if (imgIndex >= qrBuffers.length) break;

        rowImages.push(
          new ImageRun({
            data: qrBuffers[imgIndex],
            type: "jpg",
            transformation: { width: QR_WIDTH, height: QR_HEIGHT },
          }),
        );

        if (j < 2 && imgIndex < qrBuffers.length - 1) {
          rowImages.push(new TextRun({ text: "    " }));
        }
      }

      children.push(
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: rowImages,
          spacing: { after: 800 },
        }),
      );
    }

    const doc = new Document({
      sections: [
        {
          properties: {
            page: {
              size: { width: 11906, height: 16838 },
              margin: { top: 567, right: 567, bottom: 567, left: 567 },
            },
          },
          children,
        },
      ],
    });

    const rand = Math.round(Math.random() * 100);
    const docName = `qr_output_${rand}.docx`;
    const outputPath = path.resolve(__dirname, "../tmp", docName);

    const buff = await Packer.toBuffer(doc);
    fs.writeFileSync(outputPath, buff);

    // save doc to cloudinary and remove older docx
    const admin = await User.findById(req.user._id);
    if (admin.qr && admin.qr !== "") {
      await removeOldQr(admin.qr);
    }

    if (docName) {
      const uploadLink = await uploadFile({ filePath: outputPath });
      admin.qr = uploadLink;
    }
    await admin.save();
    if (fs.existsSync(outputPath)) {
      fs.unlinkSync(outputPath);
    }

    res.status(200).json({
      msg: failed.length > 0 ? "partial_success" : "success",
      file: docName,
      qr: admin.qr,
      ...(failed.length > 0 && {
        warning: `${failed.length} of ${qrUrls.length} QR image(s) could not be included`,
        failedCount: failed.length,
      }),
    });
  } catch (error) {
    console.error("makeQrFile error:", error);
    res.status(500).json({ error: error.message });
  }
};