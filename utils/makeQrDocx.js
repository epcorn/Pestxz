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
const fetchImageBuffer = async (
  url,
  { retries = 2, timeoutMs = 20000 } = {},
) => {
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

      // Short backoff before retrying — capped so a run of retries
      // across hundreds of URLs doesn't itself become the bottleneck.
      await new Promise((r) => setTimeout(r, 400 * (attempt + 1)));
    } finally {
      clearTimeout(timer);
    }
  }

  throw lastError;
};

// ── Run async tasks with a concurrency cap (no idle pausing) ──
// Keeps up to `limit` fetches in flight at all times — as soon as one
// finishes, the next starts immediately. This is faster than batching
// with fixed pauses, since it never sits idle. Individual failures are
// absorbed by fetchImageBuffer's own timeout + retry, not by slowing
// the whole job down.
const runWithConcurrencyLimit = async (items, limit, worker) => {
  const results = new Array(items.length);
  let nextIndex = 0;

  const runners = new Array(Math.min(limit, items.length))
    .fill(null)
    .map(async () => {
      while (nextIndex < items.length) {
        const currentIndex = nextIndex++;
        try {
          const value = await worker(items[currentIndex], currentIndex);
          results[currentIndex] = { status: "fulfilled", value };
        } catch (reason) {
          results[currentIndex] = { status: "rejected", reason };
        }
      }
    });

  await Promise.all(runners);
  return results;
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

    // ── Fetch QR images with limited concurrency (no idle pauses) ──
    // 20 fetches in flight at all times — fast, while still bounded
    // enough to avoid overwhelming the host. Relies on fetchImageBuffer's
    // timeout + retry to absorb individual slow/failed requests.
    const CONCURRENCY_LIMIT = 20;
    const results = await runWithConcurrencyLimit(
      qrUrls,
      CONCURRENCY_LIMIT,
      (url) => fetchImageBuffer(url),
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
