import express from "express";
import { verifyJwt } from "../middleware/verifyJwt.middleware.js";
import { verifyCustomer } from "../middleware/verifyCustomer.middleware.js";
import { verifyAdmin } from "../middleware/verifyAdmin.middleware.js";
import {
  getPendingRiders,
  applyForRider,
  updateRiderStatus,
  rejectRider,
  getRiders,
} from "../controllers/riders.controller.js";
const ridersRouter = express.Router();

ridersRouter.get("/pending", verifyJwt, verifyAdmin, getPendingRiders);

ridersRouter.get("/", verifyJwt, verifyAdmin, getRiders);

ridersRouter.post("/", verifyJwt, verifyCustomer, applyForRider);

ridersRouter.patch("/:id/status", verifyJwt, verifyAdmin, updateRiderStatus);

ridersRouter.delete("/:id", verifyJwt, verifyAdmin, rejectRider);

export default ridersRouter;