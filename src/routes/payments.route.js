import express from "express";
import { verifyJwt } from "../middleware/verifyJwt.middleware.js";
import { verifyCustomer } from "../middleware/verifyCustomer.middleware.js";
import { createPaymentIntent } from "../controllers/payments.controller.js";

const paymentsRouter = express.Router();

paymentsRouter.post("/create-payment-intent", verifyJwt, verifyCustomer, createPaymentIntent);

export default paymentsRouter;