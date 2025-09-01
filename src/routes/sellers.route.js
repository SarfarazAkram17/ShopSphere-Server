import express from "express";
import { verifyJwt } from "../middleware/verifyJwt.middleware.js";
import { applyForSeller } from "../controllers/sellers.controller.js";
const router = express.Router();

export const sellersRoutes = (users, sellers) => {
  router.post("/", verifyJwt, (req, res) => applyForSeller(req, res, sellers));

  return router;
};
