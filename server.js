import express from "express";
import path from "path";
import mongoose from "mongoose";
import morgan from "morgan";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import { v2 as cloudinary } from "cloudinary";
import fileUpload from "express-fileupload";

import userRoute from "./routes/userRoute.js";
import clientRoute from "./routes/clientRoute.js";
import adminRoute from "./routes/adminRoute.js";
import productRoute from "./routes/productRoutes.js";
import locationRoute from "./routes/locationRoute.js";
import serviceRoute from "./routes/serviceRoute.js";
import auditorRoute from "./routes/auditorRoute.js";

import { notFound } from "./middleware/notFound.js";

import {
  authenticateUser,
  authorizeUser,
} from "./middleware/authMiddleware.js";
import { createServer } from "http";
import { Server } from "socket.io";
import cronRouter from "./crons/cron.js";
import { fileURLToPath } from "url";

dotenv.config();
const app = express();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// red console
const originalConsoleError = console.error;
console.error = function (...args) {
  originalConsoleError("\x1b[31m" + args.join(" ") + "\x1b[0m");
};

const httpServer = createServer(app);
export const io = new Server(httpServer, {
  cors: {
    origin:
      process.env.NODE_ENV === "production"
        ? process.env.CLIENT_URL
        : "http://localhost:3000",
    credentials: true,
  },
  connectionStateRecovery: {
    maxDisconnectionDuration: 2 * 60 * 1000,
    skipMiddlewares: true,
  },
});

cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUD_KEY,
  api_secret: process.env.CLOUD_SECRET,
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(
  fileUpload({
    useTempFiles: true,
    tempFileDir: "/tmp/",
    limits: { fileSize: 10 * 1024 * 1024 },
    abortOnLimit: true,
  }),
);

if (process.env.NODE_ENV !== "production") app.use(morgan("dev"));

app.use("/api/cron", cronRouter);
app.use("/api/user", userRoute);
app.use("/api/products", authenticateUser, productRoute);
app.use(
  "/api/client",
  authenticateUser,
  authorizeUser(
    "Admin",
    "Auditor",
    "Operator",
    "Supervisor",
    "TeamLeader",
    "BranchAdmin",
    "ClientAdmin",
  ),
  clientRoute,
);
app.use(
  "/api/admin",
  authenticateUser,
  authorizeUser(
    "Admin",
    "Auditor",
    "ClientAdmin",
    "Operator",
    "BranchAdmin",
    "TeamLeader",
  ),
  adminRoute,
);
app.use("/api/location", authenticateUser, locationRoute);
app.use("/api/service", authenticateUser, serviceRoute);
app.use("/api/auditor", authenticateUser, auditorRoute);

if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname, "client", "dist")));
  app.get("*", (req, res) =>
    res.sendFile(path.resolve(__dirname, "client", "dist", "index.html")),
  );
} else {
  app.get("/", (req, res) => {
    res.send("API is running....");
  });
}

app.use(notFound);

const port = process.env.PORT || 5000;
export const MONGOURL =
  process.env.NODE_ENV === "production"
    ? process.env.MONGO_URI
    : process.env.MONGO_LOCAL;

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(MONGOURL, {
      serverSelectionTimeoutMS: 5000, // Timeout after 5s if DB is unreachable
    });
    console.log(`MongoDB Connected: ${conn.connection.host}`);

    httpServer.listen(port, () =>
      console.log(`Server listening on port ${port}`),
    );
  } catch (error) {
    console.error(`Database Connection Error: ${error.message}`);
    process.exit(1);
  }
};

connectDB();
