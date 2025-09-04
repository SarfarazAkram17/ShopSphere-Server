import express from "express";
import { verifyJwt } from "../middleware/verifyJwt.middleware.js";
import { verifyCustomer } from "../middleware/verifyCustomer.middleware.js";
import { applyForSeller } from "../controllers/sellers.controller.js";
const router = express.Router();

export const sellersRoutes = (users, sellers) => {
  router.post("/", verifyJwt, verifyCustomer, (req, res) => applyForSeller(req, res, sellers));

  return router;
};