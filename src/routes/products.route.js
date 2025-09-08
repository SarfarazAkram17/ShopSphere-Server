import express from "express";
import { verifyJwt } from "../middleware/verifyJwt.middleware.js";
import { verifySeller } from "../middleware/verifySeller.middleware.js";
import { addProduct, deleteProduct, getMyProduct } from "../controllers/products.controller.js";

const productsRouter = express.Router();

productsRouter.get("/my", verifyJwt, verifySeller, getMyProduct);

productsRouter.post("/", verifyJwt, verifySeller, addProduct);

productsRouter.delete("/:id", verifyJwt, verifySeller, deleteProduct);

export default productsRouter;