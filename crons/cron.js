import express from "express";
import { autoMarkMissed, sendEmail } from "../utils/helperFunction.js";
import { dailyReportClient } from "../controllers/dailyReportClient.js";

const cronRouter = express.Router();

export const markMissedCron = async (req, res) => {
  const authHeader = req.headers["x-cron-auth"];
  if (authHeader !== "my_super_secret_password_123") {
    return res.status(401).send("Unauthorized");
  }
  try {
    console.log("Running schedule work via cron");
    await autoMarkMissed();
    return res.status(200).send("Job executed successfully");
  } catch (error) {
    console.error("Cron failed:", error);
    return res.status(500).send("Internal Server Error");
  }
};

export const dailyReport = async (req, res) => {
  const authHeader = req.headers["x-cron-auth"];
  if (authHeader !== "my_super_secret_password_123") {
    return res.status(401).send("Unauthorized");
  }
  try {
    console.log("Running scheduled daily service report via cron");
    await dailyReportClient(req, res);
  } catch (error) {
    console.error("Cron daily report error:", error);
    if (!res.headersSent) {
      return res.status(500).send("Internal server error");
    }
  }
};

const testEmail = async (req, res) => {
  const authHeader = req.headers["x-cron-auth"];

  if (authHeader !== "my_super_secret_password_123") {
    return res.status(401).send("Unauthorized");
  }

  // 1. Build a completely clean, minimal payload
  const mockPayload = {
    emailList: [{ email: "exteam.epcorn@gmail.com" }],
    templateId: 21,
    dynamicData: {
      REPORT_TYPE: "daily",
      CLIENT_NAME: "Vipul gehlot",
      DATE: "Your daily system check is normal.",
    },
    attachment: [
      {
        name: "Daily_report.xlsx",
        url: "https://res.cloudinary.com/djc8opvcg/raw/upload/v1786602170/Pestxz/Ms_St_Telemedia_Global_Data_Centres_Daily_Service_Report-2026-07-15_jz47sv.xlsx",
      },
    ],
  };

  // 2. Fire using your existing function
  const isSuccess = await sendEmail(mockPayload);

  if (isSuccess) {
    return res
      .status(200)
      .send("Minimal test successful! Your function works.");
  } else {
    return res.status(500).send("Failed. Check terminal for Brevo 403 logs.");
  }
};

cronRouter.post("/auto-mark-missed", markMissedCron);
cronRouter.route("/dailyReport").post(dailyReport).get(dailyReport);
cronRouter.get("/test", testEmail);

export default cronRouter;
