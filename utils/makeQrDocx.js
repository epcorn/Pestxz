import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
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

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Fetch a URL and return it as a Buffer
const fetchImageBuffer = async (url) => {
  if (!url || typeof url !== "string") {
    throw new Error(`Invalid QR url: ${url}`);
  }
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Failed to fetch image: ${url}`);
  const arrayBuffer = await response.arrayBuffer();
  if (!arrayBuffer || arrayBuffer.byteLength === 0) {
    throw new Error(`Empty image data for url: ${url}`);
  }
  return Buffer.from(arrayBuffer);
};

export const makeQrFile = async (req, res) => {
  const data = req.body;

  try {
    const QR_WIDTH = 220;
    const QR_HEIGHT = 270;

    // Fetch all QR images in parallel
    const qrBuffers = await Promise.all(data?.qrs?.map(fetchImageBuffer));

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

    // Change your loop block to this chunking logic:
    for (let i = 0; i < qrBuffers.length; i += 3) {
      const rowImages = [];

      // Loop up to 3 times for the current row
      for (let j = 0; j < 3; j++) {
        const imgIndex = i + j;

        // Stop if we run out of images
        if (imgIndex >= qrBuffers.length) break;

        // Add the QR code image
        rowImages.push(
          new ImageRun({
            data: qrBuffers[imgIndex],
            type: "jpg",
            transformation: { width: QR_WIDTH, height: QR_HEIGHT },
          }),
        );

        // Add horizontal spacing between images, but NOT after the last image in the row
        if (j < 2 && imgIndex < qrBuffers.length - 1) {
          rowImages.push(new TextRun({ text: "    " }));
        }
      }

      // Push the completed row of 3 as a single centered paragraph
      children.push(
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: rowImages,
          // This creates the vertical blank space directly under this row line
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

    // save doc to cludinary and remove olderdox
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
    res.status(200).json({ msg: "success", file: docName, qr: admin.qr });
  } catch (error) {
    console.error("makeQrFile error:", error);
    res.status(500).json({ error: error.message });
  }
};
