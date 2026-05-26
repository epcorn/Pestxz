import express from "express";
import {
  deleteClient,
  getAllClient,
  getClient,
  registerClient,
  updateClient,
} from "../controllers/clientController.js";
const router = express.Router();

router.get("/", getAllClient);
router.get("/:id", getClient);
router.post("/register", registerClient);
router.delete("/:id", deleteClient);
router.put("/update/:id", updateClient)

export default router;
