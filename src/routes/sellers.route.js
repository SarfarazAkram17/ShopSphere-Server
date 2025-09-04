import express from "express";
import { verifyJwt } from "../middleware/verifyJwt.middleware.js";
import { verifyCustomer } from "../middleware/verifyCustomer.middleware.js";
import {
  applyForSeller,
  getPendingSellers,
  updateSellerStatus,
  rejectSeller,
} from "../controllers/sellers.controller.js";
import { verifyAdmin } from "../middleware/verifyAdmin.middleware.js";
const router = express.Router();

export const sellersRoutes = (users, sellers, riders) => {
  router.get("/pending", verifyJwt, verifyAdmin, (req, res) =>
    getPendingSellers(req, res, sellers)
  );

  router.post("/", verifyJwt, verifyCustomer, (req, res) =>
    applyForSeller(req, res, sellers, riders)
  );

  router.patch("/:id/status", verifyJwt, verifyAdmin, (req, res) =>
    updateSellerStatus(req, res, users, sellers)
  );

  router.delete("/:id", verifyJwt, verifyAdmin, (req, res) =>
    rejectSeller(req, res, sellers)
  );

  return router;
};