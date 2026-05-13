import jwt from "jsonwebtoken";
import QRCode from "qrcode";
import fs from "fs";
import sharp from "sharp";
// import { createCanvas, loadImage } from "canvas";

import { v2 as cloudinary } from "cloudinary";
import brevo from "@getbrevo/brevo";

export const capitalLetter = (name) => {
  return name
    .toLowerCase()
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
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

//using canvas
// export const qrCodeGenerator = async ({ link, floor, location }) => {
//   let loc = location.substring(0, 25);
//   let subLoc = location.substring(25);
//   try {
//     let height = 360,
//       width = 340,
//       margin = 6;

//     const qrCode = await QRCode.toDataURL(link, { width, height, margin });

//     // Load the QR code image into a canvas
//     const canvas = createCanvas(width, height + 95);
//     const ctx = canvas.getContext("2d");
//     const qrCodeImg = await loadImage(qrCode);
//     ctx.drawImage(qrCodeImg, 0, 40);

//     // Add the bottom text to the canvas
//     ctx.fillStyle = "rgb(255,255,255)";
//     ctx.font = "20px Arial";
//     ctx.textAlign = "start";
//     ctx.fillText(`Floor: ${floor}`, 2, height + 42);
//     ctx.fillText(`Location: ${loc}`, 2, height + 64);
//     ctx.fillText(subLoc, 2, height + 86);
//     ctx.fillStyle = "rgb(32, 125, 192)";
//     ctx.textAlign = "center";
//     ctx.font = "italic bold 33px Arial";
//     ctx.fillText(`Powered By PestXZ`, width / 2, 30);

//     const buf = canvas.toBuffer("image/jpeg");
//     return buf;
//   } catch (error) {
//     console.log("QR Error", error);
//     return false;
//   }
// };

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

    return buf;
  } catch (error) {
    console.log("QR Error", error);
    return false;
  }
};


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
