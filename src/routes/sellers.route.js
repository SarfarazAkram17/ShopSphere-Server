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

const sellersRouter = express.Router();

sellersRouter.get("/pending", verifyJwt, verifyAdmin, getPendingSellers);

sellersRouter.post("/", verifyJwt, verifyCustomer, applyForSeller);

sellersRouter.patch("/:id/status", verifyJwt, verifyAdmin, updateSellerStatus);

sellersRouter.delete("/:id", verifyJwt, verifyAdmin, rejectSeller);

export default sellersRouter;