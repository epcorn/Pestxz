import express from "express";
import {
  addLocation,
  assignLocation,
  deleteLocation,
  getAllLocations,
  getLocationDetails,
  getSingleLocation,
  updateLocation,
} from "../controllers/locationController.js";
import { getAllService } from "../controllers/adminController.js";
import { convertSvgToPngBuffer } from "../utils/helperFunction.js";
const router = express.Router();

router.get("/allServices", getAllService);
router.get("/client/:id", getAllLocations);
router.get("/convert", convertSvgToPngBuffer);
router.post("/add", addLocation);
router
  .route("/:id")
  .get(getLocationDetails)
  .put(updateLocation)
  .delete(deleteLocation);

router.post("/assign", assignLocation); // added new
export default router;
