import { v2 as cloudinary } from "cloudinary";
import dotenv from "dotenv";
import Location from "./models/locationModel.js";
import express from "express";
import mongoose from "mongoose";
dotenv.config();

// cloudinary.config({
//   cloud_name: process.env.CLOUD_NAME,
//   api_key: process.env.CLOUD_KEY,
//   api_secret: process.env.CLOUD_SECRET,
// });

// async function uploading() {
//   const result = await cloudinary.uploader.upload("./tmp/qr.jpeg");
//   console.log(result);
// }

// uploading()
// try {
// } catch (err) {
//   console.error(err);
// }

const app = express();

const func = async (req, res) => {
  const todayiso = new Date(new Date().setUTCHours(0, 0, 0, 0)).toISOString();
  const today = new Date(todayiso);

  const updated = await Location.collection.updateMany(
    {
      // 1. Correctly match documents where the product array contains a schedule match
      "product.schedule": {
        $elemMatch: {
          date: { $lt: today },
          completed: false,
          status: "Pending",
        },
      },
    },
    {
      $set: {
        // 2. Use nested positional filtering to reach inside BOTH arrays
        "product.$[prodElem].schedule.$[schedElem].status": "Missed",
      },
    },
    {
      arrayFilters: [
        { "prodElem.schedule": { $exists: true } }, // Identifies elements in the product array
        {
          // Identifies elements in the schedule array
          "schedElem.date": { $lt: today },
          "schedElem.completed": false,
          "schedElem.status": "Pending",
        },
      ],
    },
  );

  res.status(200).json({ today, updated });
};

app.get("/", (req, res) => {
  res.send("hello");
});
app.get("/val", func);

app.listen(8000, async () => {
  await mongoose
    .connect(process.env.MONGO_LOCAL)
    .then((conn) => console.log("mongoose connetcted"));
  console.log("app started 6000");
});

//2026-07-04T00:00:00.000Z
