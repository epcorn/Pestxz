import express from "express";
import {
  loginUser,
  logoutUser,
  getSingleUser,
  clientUsers,
} from "../controllers/userController.js";
import { authenticateUser } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/login", loginUser);
router.post("/logout", authenticateUser, logoutUser);
router.get("/singleUser/:id", authenticateUser, getSingleUser);
router.get("/clientuser/:id", authenticateUser, clientUsers);

export default router;
