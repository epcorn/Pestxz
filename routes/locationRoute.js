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
const router = express.Router();

router.get("/allServices", getAllService);
router.get("/client/:id", getAllLocations);
// router
//   .route("/:id")
//   .get(getSingleLocation)
router
  .route("/:id")
  .post(addLocation)
  .get(getLocationDetails)
  .put(updateLocation)
  .delete(deleteLocation);

router.post("/assign", assignLocation);
export default router;
