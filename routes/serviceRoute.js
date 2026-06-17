import express from "express";
import {
  assignWork,
  casualServices,
  getAllAssignedWork,
  getAllComplaints,
  getCasualServices,
  getSingleComplaint,
  newComplaint,
  newRegularService,
  updateComplaint,
} from "../controllers/serviceController.js";
import { dailyServiceReport } from "../controllers/dailyReports.js";

const router = express.Router();

router.get("/allComplaints", getAllComplaints);
router.get("/dailyServiceReport/:value", dailyServiceReport);

router.post("/casual/:id", casualServices);
router.post("/casual/", getCasualServices);

router.post("/clientComplaint/:id", newComplaint);
router.post("/regular/:id", newRegularService);

router
  .route("/singleComplaint/:id")
  .get(getSingleComplaint)
  .put(updateComplaint);

router.put("/assign-work", assignWork);
router.get("/assign-work", getAllAssignedWork);

export default router;
