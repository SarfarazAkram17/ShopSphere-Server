import express from "express";
import { verifyJwt } from "../middleware/verifyJwt.middleware.js";
import { verifySeller } from "../middleware/verifySeller.middleware.js";
import { addProduct } from "../controllers/products.controller.js";

const router = express.Router();

export const productsRoutes = (sellers, products) => {
  router.post("/", verifyJwt, verifySeller, (req, res) => addProduct(req, res, sellers, products));

  return router;
};