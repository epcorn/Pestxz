import express from "express";
import { loginUser, logoutUser } from "../controllers/userController.js";
import { authenticateUser } from "../middleware/authMiddleware.js";
import { dailyServiceReport } from "../controllers/serviceController.js";

const router = express.Router();

router.post("/login", loginUser);
router.post("/logout", authenticateUser, logoutUser);
router.get("/dailyServiceReport", dailyServiceReport);

export default router;
