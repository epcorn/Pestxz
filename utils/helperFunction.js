import jwt from "jsonwebtoken";
import QRCode from "qrcode";
import fs from "fs";
import { createCanvas, loadImage } from "canvas";
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

export const qrCodeGenerator = async ({ link, floor, location }) => {
  let loc = location.substring(0, 25);
  let subLoc = location.substring(25);
  try {
    let height = 360,
      width = 340,
      margin = 6;

    const qrCode = await QRCode.toDataURL(link, { width, height, margin });

    // Load the QR code image into a canvas
    const canvas = createCanvas(width, height + 95);
    const ctx = canvas.getContext("2d");
    const qrCodeImg = await loadImage(qrCode);
    ctx.drawImage(qrCodeImg, 0, 40);

    // Add the bottom text to the canvas
    ctx.fillStyle = "rgb(255,255,255)";
    ctx.font = "20px Arial";
    ctx.textAlign = "start";
    ctx.fillText(`Floor: ${floor}`, 2, height + 42);
    ctx.fillText(`Location: ${loc}`, 2, height + 64);
    ctx.fillText(subLoc, 2, height + 86);
    ctx.fillStyle = "rgb(32, 125, 192)";
    ctx.textAlign = "center";
    ctx.font = "italic bold 33px Arial";
    ctx.fillText(`Powered By PestXZ`, width / 2, 30);

    const buf = canvas.toBuffer("image/jpeg");
    return buf;
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
      quality: 40,
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
