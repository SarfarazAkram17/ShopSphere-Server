import express from "express";
import { verifyJwt } from "../middleware/verifyJwt.middleware.js";
import { verifySeller } from "../middleware/verifySeller.middleware.js";
import { addProduct } from "../controllers/products.controller.js";

const productsRouter = express.Router();

productsRouter.post("/", verifyJwt, verifySeller, addProduct);

export default productsRouter;