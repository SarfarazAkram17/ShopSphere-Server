import express from "express";
import { verifyJwt } from "../middleware/verifyJwt.middleware.js";
import { verifyCustomer } from "../middleware/verifyCustomer.middleware.js";
import {
  applyForSeller,
  getPendingSellers,
  updateSellerStatus,
  rejectSeller,
  getSellers,
  getStore,
  updateStore
} from "../controllers/sellers.controller.js";
import { verifyAdmin } from "../middleware/verifyAdmin.middleware.js";
import { verifySeller } from "../middleware/verifySeller.middleware.js";

const sellersRouter = express.Router();

sellersRouter.get("/pending", verifyJwt, verifyAdmin, getPendingSellers);

sellersRouter.get("/", verifyJwt, verifyAdmin, getSellers);

sellersRouter.get("/myStore", verifyJwt, verifySeller, getStore);

sellersRouter.post("/", verifyJwt, verifyCustomer, applyForSeller);

sellersRouter.patch("/myStore/:storeId", verifyJwt, verifySeller, updateStore);

sellersRouter.patch("/:id/status", verifyJwt, verifyAdmin, updateSellerStatus);

sellersRouter.delete("/:id", verifyJwt, verifyAdmin, rejectSeller);

export default sellersRouter;