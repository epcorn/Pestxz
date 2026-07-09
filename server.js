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
import { notFound } from "./middleware/notFound.js";
import {
  authenticateUser,
  authorizeUser,
} from "./middleware/authMiddleware.js";
import { createAdmin } from "./models/userModel.js";
import { createServer } from "http";
import { Server } from "socket.io";
import { autoMarkMissed } from "./utils/helperFunction.js";
import Location from "./models/locationModel.js";
import Counter from "./models/counterModel.js";

dotenv.config();
const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin:
      process.env.NODE_ENV === "production"
        ? process.env.CLIENT_URL
        : "http://localhost:3000",
    credentials: true,
  },
  connectionStateRecovery: {
    // ADD THIS BLOCK
    maxDisconnectionDuration: 2 * 60 * 1000,
    skipMiddlewares: true,
  },
});

cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUD_KEY,
  api_secret: process.env.CLOUD_SECRET,
});

io.on("connection", (socket) => {
  socket.on("join-admin", (role) => {
    if (
      [
        "Admin",
        "ClientAdmin",
        "Operator",
        "BranchAdmin",
        "Supervisor",
        "TeamLeader",
      ].includes(role)
    ) {
      socket.join("admin-room");
      console.log(`${role} joined Pestxz-room`); // helpful for debugging
    }
  });
  //join client
  socket.on("join-client", (clientId) => {
    if (clientId) {
      socket.join(`client-${clientId}`);
      console.log(`socket joined client-${clientId}`);
    }
  });

  // services
  socket.on("services", (data) => {
    io.to("admin-room").to(`client-${data.client}`).emit("services", data); // 👈 was broadcast.emit
  });
  socket.on("unscheduled-raised", (data) => {
    io.to("admin-room").emit("new-unscheduled-work", data); // 👈 was broadcast.emit
  });

  // updated
  socket.on("unscheduled-updated", (data) => {
    io.to("admin-room").emit("work-status-changed", data); // 👈 was broadcast.emit
  });

  // approved
  socket.on("unscheduled-approved", (data) => {
    io.to("admin-room").emit("work-status-approved", data); // 👈 was broadcast.emit
  });

  // rejected
  socket.on("unscheduled-rejected", (data) => {
    io.to("admin-room").emit("work-status-rejected", data); // 👈 was broadcast.emit
  });

  // complaint raised
  socket.on("complaint-raised", (data) => {
    io.to("admin-room").emit("new-complaint", data);
  });

  socket.on("complaint-updated", (data) => {
    io.to("admin-room").emit("complaint-updated", data);
  });
  socket.on("complaint-assigned", (data) => {
    io.to("admin-room").emit("complaint-assigned", data);
  });
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

// setup cron job
app.post("/api/cron/auto-mark-missed", (req, res) => {
  const authHeader = req.headers["x-cron-auth"];
  if (authHeader !== "my_super_secret_password_123") {
    return res.status(401).send("Unauthorized");
  }
  try {
    console.log("Running schedule work via cron-job.org");
    autoMarkMissed();
    return res.status(200).send("Job executed successfully");
  } catch (error) {
    console.error("Cron failed:", error);
    return res.status(500).send("Internal Server Error");
  }
});

app.use("/api/user", userRoute);
app.use("/api/products", authenticateUser, productRoute);
app.use(
  "/api/client",
  authenticateUser,
  authorizeUser(
    "Admin",
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
  authorizeUser("Admin", "ClientAdmin", "Operator", "TeamLeader"),
  adminRoute,
);
app.use("/api/location", authenticateUser, locationRoute);
app.use("/api/service", authenticateUser, serviceRoute);

if (process.env.NODE_ENV === "production") {
  const __dirname = path.resolve();
  app.use(express.static(path.join(__dirname, "/client/dist")));
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

// createAdmin();
// addAdminsjson()   // do not run this if not required
// autoMarkMissed()
const connectDB = async () => {
  try {
    await mongoose
      .connect(MONGOURL)
      .then((conn) => console.log(conn.connection.host));

    httpServer.listen(port, () => console.log("server is listening", port));
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};
connectDB();
