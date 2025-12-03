import express from "express";
import { verifyJwt } from "../middleware/verifyJwt.middleware.js";
import { verifyCustomer } from "../middleware/verifyCustomer.middleware.js";
import { verifyAdmin } from "../middleware/verifyAdmin.middleware.js";
import { verifySeller } from "../middleware/verifySeller.middleware.js";
import { verifyCustomerOrSeller } from "../middleware/verifyCustomerOrSeller.middleware.js";
import {
  cancelOrder,
  getSellerOrders,
  updateStoreOrderStatus,
} from "../controllers/orders.seller.controller.js";
import {
  confirmOrder,
  createOrder,
  getMyOrders,
  getSingleOrder,
} from "../controllers/orders.customer.controller.js";
import { getAllOrders } from "../controllers/orders.admin.controller.js";

const ordersRouter = express.Router();

ordersRouter.get("/all", verifyJwt, verifyAdmin, getAllOrders);
ordersRouter.get("/my", verifyJwt, verifyCustomer, getMyOrders);
ordersRouter.get("/:orderId", verifyJwt, verifyCustomer, getSingleOrder);
ordersRouter.get("/seller/orders", verifyJwt, verifySeller, getSellerOrders);
ordersRouter.post("/", verifyJwt, verifyCustomer, createOrder);
ordersRouter.post(
  "/:orderId/cancel",
  verifyJwt,
  verifyCustomerOrSeller,
  cancelOrder
);
ordersRouter.patch(
  "/:orderId/confirm",
  verifyJwt,
  verifyCustomer,
  confirmOrder
);
ordersRouter.patch(
  "/:orderId/store-status",
  verifyJwt,
  verifySeller,
  updateStoreOrderStatus
);

export default ordersRouter;