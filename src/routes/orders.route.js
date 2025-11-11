import express from "express";
import { verifyJwt } from "../middleware/verifyJwt.middleware.js";
import { verifyCustomer } from "../middleware/verifyCustomer.middleware.js";
import { createOrder } from "../controllers/orders.controller.js";

const ordersRouter = express.Router();

ordersRouter.post('/', verifyJwt, verifyCustomer, createOrder)

export default ordersRouter;