import express from "express";
import { verifyJwt } from "../middleware/verifyJwt.middleware.js";
import { verifySeller } from "../middleware/verifySeller.middleware.js";
import {
  addProduct,
  deleteProduct,
  getMyProduct,
  getAllProducts,
  getSingleProduct,
  updateProduct,
} from "../controllers/products.controller.js";

const productsRouter = express.Router();

productsRouter.get("/my", verifyJwt, verifySeller, getMyProduct);

productsRouter.get("/", getAllProducts);

productsRouter.get("/:id", getSingleProduct);

productsRouter.post("/", verifyJwt, verifySeller, addProduct);

productsRouter.patch("/:id", verifyJwt, verifySeller, updateProduct);

productsRouter.delete("/:id", verifyJwt, verifySeller, deleteProduct);

export default productsRouter;