import express from "express";
import { verifyJwt } from "../middleware/verifyJwt.middleware.js";
import { verifyCustomer } from "../middleware/verifyCustomer.middleware.js";
import {
  confirmOrder,
  createOrder,
  getAllOrders,
  getMyOrders,
  getSingleOrder,
  cancelOrder,
} from "../controllers/orders.controller.js";
import { verifyAdmin } from "../middleware/verifyAdmin.middleware.js";

const ordersRouter = express.Router();

ordersRouter.get("/all", verifyJwt, verifyAdmin, getAllOrders);
ordersRouter.get("/my", verifyJwt, verifyCustomer, getMyOrders);
ordersRouter.get("/:orderId", verifyJwt, verifyCustomer, getSingleOrder);
ordersRouter.post("/", verifyJwt, verifyCustomer, createOrder);
ordersRouter.post("/:orderId/cancel", verifyJwt, verifyCustomer, cancelOrder);
ordersRouter.patch(
  "/:orderId/confirm",
  verifyJwt,
  verifyCustomer,
  confirmOrder
);

export default ordersRouter;