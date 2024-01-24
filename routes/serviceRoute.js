import express from "express";
import {
  getAllComplaints,
  getSingleComplaint,
  newComplaint,
  newRegularService,
  updateComplaint,
} from "../controllers/serviceController.js";

const router = express.Router();

router.get("/allComplaints", getAllComplaints);

router.post("/clientComplaint/:id", newComplaint);
router.post("/regular/:id", newRegularService);

router
  .route("/singleComplaint/:id")
  .get(getSingleComplaint)
  .put(updateComplaint);

export default router;
