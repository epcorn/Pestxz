import express from "express";
import { autoMarkMissed, sendEmail } from "../utils/helperFunction.js";
import { dailyReportClient } from "../controllers/dailyReportClient.js";
import cron from 'node-cron'

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

export function dailyReportCron() {
  cron.schedule(
    "0 8 * * *",
    async () => {
      console.log("Running scheduled daily report at 08:00 AM IST...");
      try {
        await dailyReportClient();
        console.log("Daily report process completed successfully.");
      } catch (error) {
        console.error("Error executing scheduled daily report:", error);
      }
    },
    {
      scheduled: true,
      timezone: "Asia/Kolkata",
    },
  );
}


cronRouter.post("/auto-mark-missed", markMissedCron);
cronRouter.route("/dailyReport").post(dailyReport).get(dailyReport);

export default cronRouter;
