import express from "express";
import {
  addLocation,
  deleteLocation,
  getAllLocations,
  getLocationDetails,
  updateLocation,
} from "../controllers/locationController.js";
import { getAllService } from "../controllers/adminController.js";
const router = express.Router();

router.get("/allServices", getAllService);
router.get("/client/:id", getAllLocations);
router
  .route("/:id")
  .post(addLocation)
  .get(getLocationDetails)
  .put(updateLocation)
  .delete(deleteLocation);

export default router;
