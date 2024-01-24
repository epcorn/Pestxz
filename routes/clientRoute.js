import express from "express";
import {
  deleteClient,
  getAllClient,
  registerClient,
} from "../controllers/clientController.js";
const router = express.Router();

router.get("/", getAllClient);
router.post("/register", registerClient);
router.delete("/:id", deleteClient);

export default router;
