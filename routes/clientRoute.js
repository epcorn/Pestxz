import express from "express";
import {
  deleteClient,
  getAllClient,
  getClient,
  registerClient,
} from "../controllers/clientController.js";
const router = express.Router();

router.get("/", getAllClient);
router.get("/:id", getClient);
router.post("/register", registerClient);
router.delete("/:id", deleteClient);

export default router;
