import { v2 as cloudinary } from "cloudinary";
import dotenv from "dotenv";
import Location from "./models/locationModel.js";
import express from "express";
import mongoose from "mongoose";
import Service from "./models/serviceModel.js";
import Client from "./models/clientModel.js";
dotenv.config();
const app = express();

async function finds() {
  // 1. Fetch the aggregated counts
  const aggregatedData = await Location.aggregate([
    { $match: {} },
    {
      $facet: {
        totalServices: [{ $unwind: "$service" }, { $count: "count" }],
        scheduleCount: [
          { $unwind: "$service" },
          { $unwind: "$service.schedule" },
          {
            $group: {
              _id: "$service.schedule.status",
              count: { $sum: 1 },
            },
          },
          { $project: { _id: 0, label: "$_id", count: 1 } },
        ],
      },
    },
  ]);

  // 2. Fetch the raw location documents to run your monthly loops
  // (Fixes the "location is not defined" ReferenceError)
  const locations = await Location.find({});

  const monthlyMap = {};
  
  const getMonthKey = (date) =>
    `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;

  const ensureMonth = (date) => {
    const key = getMonthKey(date);

    if (!monthlyMap[key]) {
      monthlyMap[key] = {
        month: date.toLocaleString("default", {
          month: "long",
          year: "numeric",
        }),
        complaints: 0,
        regulars: 0,
        open: 0,
        closeReq: 0,
        inProgress: 0,
        closed: 0,
        reopenCount: 0,
        product: { Done: 0, Pending: 0, Missed: 0 },
        regular: { Done: 0, Pending: 0, Missed: 0 },
      };
    }
    return monthlyMap[key];
  };

  // Loop through the array of locations fetched from the database
  locations.forEach((location) => {
    location.service?.forEach((service) => {
      service.schedule?.forEach((schedule) => {
        if (!schedule.date) return;

        const month = ensureMonth(new Date(schedule.date));

        switch (schedule.status?.trim()) {
          case "Done":
            month.regular.Done++;
            break;
          case "Pending":
            month.regular.Pending++;
            break;
          case "Missed":
            month.regular.Missed++;
            break;
        }
      });
    });
  });

  // 3. Combine both sets of data into your final return object
  return {
    summary: aggregatedData[0] || { totalServices: [], scheduleCount: [] },
    monthlyBreakdown: Object.values(monthlyMap) // Converts map object to scannable array
  };
}

app.get("/", async (req, res) => {
  const data = await finds();
  res.send(data);
});
app.listen(8000, async () => {
  await mongoose
    .connect(process.env.MONGO_LOCAL)
    .then((conn) => console.log("mongoose connetcted"));
  console.log("app started 8000");
});

//2026-07-04T00:00:00.000Z
