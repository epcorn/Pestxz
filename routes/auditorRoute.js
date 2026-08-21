import express from "express";
import {
  createAuditReport,
  getAuditReports,
} from "../controllers/auditorController.js";

const router = express.Router();

router.post("/create", createAuditReport);
router.get("/", getAuditReports);

export default router;
