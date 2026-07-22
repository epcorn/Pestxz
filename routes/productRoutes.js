import express from "express";
import { addProducts, getProducts } from "../controllers/productController.js";

const router = express.Router();

router.route("/product").post(addProducts).get(getProducts);

export default router;
