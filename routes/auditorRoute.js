import express from "express";
import { createAuditReport } from "../controllers/auditorController.js";

const router = express.Router();

router.post("/create", createAuditReport);

export default router;
