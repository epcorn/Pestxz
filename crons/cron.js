import express from "express";
import { autoMarkMissed } from "../utils/helperFunction.js";
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
    
    // Await the asynchronous report generation
    await dailyReportClient(req, res);
  } catch (error) {
    console.error("Cron daily report error:", error);
    if (!res.headersSent) {
      return res.status(500).send("Internal server error");
    }
  }
};

cronRouter.post("/auto-mark-missed", markMissedCron);
cronRouter.route("/dailyReport").post(dailyReport).get(dailyReport);

export default cronRouter;
