import express from "express";
import {
  getUserAddresses,
  addUserAddresses,
  updateUserAddress,
  deleteUserAddress,
  setDefaultShippingAddress,
  setDefaultBillingAddress,
} from "../controllers/address.controller.js";
import { verifyJwt } from "../middleware/verifyJwt.middleware.js";
import { verifyCustomer } from "../middleware/verifyCustomer.middleware.js";

const addressRouter = express.Router();

addressRouter.get("/", verifyJwt, verifyCustomer, getUserAddresses);

addressRouter.post("/", verifyJwt, verifyCustomer, addUserAddresses);

addressRouter.put("/:id", verifyJwt, verifyCustomer, updateUserAddress);

addressRouter.put(
  "/:id/default-shipping",
  verifyJwt,
  verifyCustomer,
  setDefaultShippingAddress
);

addressRouter.put(
  "/:id/default-billing",
  verifyJwt,
  verifyCustomer,
  setDefaultBillingAddress
);

addressRouter.delete("/:id", verifyJwt, verifyCustomer, deleteUserAddress);

export default addressRouter;