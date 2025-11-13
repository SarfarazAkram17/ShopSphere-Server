import express from "express";
import { verifyJwt } from "../middleware/verifyJwt.middleware.js";
import { verifyCustomer } from "../middleware/verifyCustomer.middleware.js";
import { confirmOrder, createOrder } from "../controllers/orders.controller.js";

const ordersRouter = express.Router();

ordersRouter.post("/", verifyJwt, verifyCustomer, createOrder);
ordersRouter.patch("/:orderId/confirm", verifyJwt, verifyCustomer, confirmOrder);

export default ordersRouter;