import express from "express";
import { verifyJwt } from "../middleware/verifyJwt.middleware.js";
import { verifyCustomer } from "../middleware/verifyCustomer.middleware.js";
import { verifyAdmin } from "../middleware/verifyAdmin.middleware.js";
import {
  getPendingRiders,
  applyForRider,
  updateRiderStatus,
  rejectRider,
} from "../controllers/riders.controller.js";
const router = express.Router();

export const ridersRoutes = (users, sellers, riders) => {
  router.get("/pending", verifyJwt, verifyAdmin, (req, res) =>
    getPendingRiders(req, res, riders)
  );

  router.post("/", verifyJwt, verifyCustomer, (req, res) =>
    applyForRider(req, res, sellers, riders)
  );

  router.patch("/:id/status", verifyJwt, verifyAdmin, (req, res) =>
    updateRiderStatus(req, res, users, riders)
  );

  router.delete("/:id", verifyJwt, verifyAdmin, (req, res) =>
    rejectRider(req, res, riders)
  );

  return router;
};