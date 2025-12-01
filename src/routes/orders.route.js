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
  updateStoreOrderStatus,
  getSellerOrders,
} from "../controllers/orders.controller.js";
import { verifyAdmin } from "../middleware/verifyAdmin.middleware.js";
import { verifySeller } from "../middleware/verifySeller.middleware.js";
import { verifyCustomerAndSeller } from "../middleware/verifyCustomerAndSeller.middleware.js";

const ordersRouter = express.Router();

ordersRouter.get("/all", verifyJwt, verifyAdmin, getAllOrders);
ordersRouter.get("/my", verifyJwt, verifyCustomer, getMyOrders);
ordersRouter.get("/:orderId", verifyJwt, verifyCustomer, getSingleOrder);
ordersRouter.post("/", verifyJwt, verifyCustomer, createOrder);

ordersRouter.patch(
  "/:orderId/confirm",
  verifyJwt,
  verifyCustomer,
  confirmOrder
);


export default ordersRouter;