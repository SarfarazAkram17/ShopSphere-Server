import express from "express";
import {
  addProduct,
  deleteProduct,
  getMyProduct,
  getAllProducts,
  getSingleProduct,
  updateProduct,
  getProducts,
  getOfferedProducts
} from "../controllers/products.controller.js";
import { verifyJwt } from "../middleware/verifyJwt.middleware.js";
import { verifySeller } from "../middleware/verifySeller.middleware.js";
import { verifyAdmin } from "../middleware/verifyAdmin.middleware.js";

const productsRouter = express.Router();

productsRouter.get("/my", verifyJwt, verifySeller, getMyProduct);

// get for all products page only for admin
productsRouter.get("/", verifyJwt, verifyAdmin, getAllProducts);

// get for products page for all
productsRouter.get("/all", getProducts);

// get for offers page for all
productsRouter.get("/offer", getOfferedProducts);

productsRouter.get("/:id", getSingleProduct);

productsRouter.post("/", verifyJwt, verifySeller, addProduct);

productsRouter.patch("/:id", verifyJwt, verifySeller, updateProduct);

productsRouter.delete("/:id", verifyJwt, verifySeller, deleteProduct);

export default productsRouter;