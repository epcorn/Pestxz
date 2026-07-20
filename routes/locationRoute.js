import express from "express";
import {
  addLocation,
  assignLocation,
  deleteLocation,
  getAllLocations,
  getLocationDetails,
  getSingleLocation,
  qrCounter,
  updateLocation,
} from "../controllers/locationController.js";
import { getAllService } from "../controllers/adminController.js";
import { convertSvgToPngBuffer } from "../utils/helperFunction.js";
import { makeQrFile } from "../utils/makeQrDocx.js";
import { getUnscheduledReports, statusUnscheduled, unScheduleReport } from "../controllers/unScheduleController.js";
const router = express.Router();

router.post("/makeQrDoc", makeQrFile);

router.post("/unSchedule", unScheduleReport)
router.get("/getUnscheduledReports/:id", getUnscheduledReports)
router.patch("/statusUnschedule/:id", statusUnscheduled)

router.get("/allServices", getAllService);
router.get("/client/:id?", getAllLocations);
router.get("/convert", convertSvgToPngBuffer);
router.post("/add", addLocation);
router.patch("/qr-count/:id", qrCounter);
router
  .route("/:id")
  .get(getLocationDetails)
  .put(updateLocation)
  .delete(deleteLocation);

router.post("/assign", assignLocation); // added new
export default router;
