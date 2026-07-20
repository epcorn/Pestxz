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
  addProductService,
  updateComplaint,
} from "../controllers/serviceController.js";
import { dailyServiceReport } from "../controllers/dailyReports.js";

const router = express.Router();

router.get("/allComplaints", getAllComplaints);
router.get("/dailyServiceReport/:value?", dailyServiceReport);

router.post("/casual/", casualServices);
router.get("/casual", getCasualServices);

router.post("/clientComplaint/:id", newComplaint);
router.post("/regular/:id", newRegularService);

router
  .route("/singleComplaint/:id")
  .get(getSingleComplaint)
  .put(updateComplaint);

router.route("/product").post(addProductService);

router.put("/assign-work", assignWork);
router.get("/assign-work", getAllAssignedWork);

export default router;
