import { v2 as cloudinary } from "cloudinary";
import dotenv from "dotenv";
import Location from "./models/locationModel.js";
import express from "express";
import mongoose from "mongoose";
import Service from "./models/serviceModel.js";
import Client from "./models/clientModel.js";
import { generateSchedule } from "./utils/helperFunction.js";
dotenv.config();
const app = express();

async function finds() {
  try {
    // Populate client to get startDate, endDate, and prefDay
    const locations = await Location.find({}).populate("client");
    let updatedCount = 0;

    for (const location of locations) {
      let isModified = false;

      if (location.service && Array.isArray(location.service)) {
        // Use a standard map or for-loop to avoid deep reference styling issues
        for (let ser of location.service) {
          if (ser.serviceName === "Ratrid") {
            ser.frequency = "weekly";

            // Grab your configuration parameters
            const startDate = location.startDate || location.client?.startDate;
            const endDate = location.endDate || location.client?.endDate;
            const prefDay = location.prefDay || location.client?.prefDay;

            if (startDate && endDate) {
              const newSchedules = generateSchedule(
                startDate,
                endDate,
                "weekly",
                prefDay,
              );

              ser.schedule = newSchedules;
              isModified = true;
            } else {
              console.warn(
                `Skipping schedule generation for location ${location._id} due to missing contract dates.`,
              );
            }
          }
        }
      }

      if (isModified) {
        location.markModified("service");
        await location.save();
        updatedCount++;
      }
    }

    console.log(
      `Successfully updated ${updatedCount} locations containing "Greenshield".`,
    );
  } catch (error) {
    console.error("Mongoose Save Error:", error);
  }
}

app.get("/", async (req, res) => {
  const data = await finds();
  res.send(data);
});
app.listen(8000, async () => {
  await mongoose
    .connect(process.env.MONGO_URI)
    .then((conn) => console.log("mongoose connetcted"));
  console.log("app started 8000");
});

//2026-07-04T00:00:00.000Z
