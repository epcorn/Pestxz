import express from "express";
import {
  createAuditPPTX,
  createAuditReport,
  createAuditXLSX,
  getAuditReports,
} from "../controllers/auditorController.js";

const router = express.Router();

router.post("/create", createAuditReport);
router.get("/", getAuditReports);
router.get("/createExcel/:id", createAuditXLSX);
router.get("/createPPTX/:id", createAuditPPTX);

export default router;
