import express from "express";
import {
  addFrequency,
  addService,
  adminDashboard,
  adminDashboardMonthlyTrend,
  clientAdminDashboard,
  deleteService,
  editService,
  getFrequency,
  imageUploader,
  removeFrequency,
  runnerData,
} from "../controllers/adminController.js";
import {
  deleteUser,
  getAllUser,
  passwordChange,
  registerUser,
} from "../controllers/userController.js";

const router = express.Router();

router.route("/user").post(registerUser).get(getAllUser);
router.route("/service").post(addService);
router.post("/upload", imageUploader);
router.route("/freq").post(addFrequency).get(getFrequency);
router.delete("/freq/:id", removeFrequency);
router.get("/clientAdminDashboard", clientAdminDashboard);
router.get("/adminDashboard/:id?", adminDashboard);
router.get("/dashMonthlytrend/:id?", adminDashboardMonthlyTrend);

router.route("/singleService/:id").put(editService).delete(deleteService);
router.route("/singleUser/:id").put(passwordChange).delete(deleteUser);

router.get("/runner", runnerData);

export default router;
