import express from "express";
import {
  addService,
  clientAdminDashboard,
  deleteService,
  editService,
} from "../controllers/adminController.js";
import {
  deleteUser,
  getAllUser,
  passwordChange,
  registerUser,
} from "../controllers/userController.js";

const router = express.Router();

router.route("/user").post(registerUser).get(getAllUser);
router.route("/service").post(addService);
router.get("/clientAdminDashboard", clientAdminDashboard);
router.route("/singleService/:id").put(editService).delete(deleteService);
router.route("/singleUser/:id").put(passwordChange).delete(deleteUser);

export default router;
