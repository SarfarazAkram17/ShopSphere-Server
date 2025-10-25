import express from "express";
import {
  createUser,
  getAllUsers,
  getUserRole,
  updateProfile,
  getUserAddresses,
  addUserAddresses,
  updateUserAddress,
  deleteUserAddress,
  setDefaultShippingAddress,
  setDefaultBillingAddress,
} from "../controllers/users.controller.js";
import { verifyJwt } from "../middleware/verifyJwt.middleware.js";
import { verifyAdmin } from "../middleware/verifyAdmin.middleware.js";
import { verifyCustomer } from "../middleware/verifyCustomer.middleware.js";

const userRouter = express.Router();

userRouter.get("/", verifyJwt, verifyAdmin, getAllUsers);

userRouter.get("/:email/role", getUserRole);

userRouter.get("/address", verifyJwt, verifyCustomer, getUserAddresses);

userRouter.post("/", createUser);

userRouter.post("/address", verifyJwt, verifyCustomer, addUserAddresses);

userRouter.put("/address/:id", verifyJwt, verifyCustomer, updateUserAddress);

userRouter.put(
  "/address/:id/default-shipping",
  verifyJwt,
  verifyCustomer,
  setDefaultShippingAddress
);

userRouter.put(
  "/address/:id/default-billing",
  verifyJwt,
  verifyCustomer,
  setDefaultBillingAddress
);

userRouter.patch("/", verifyJwt, updateProfile);

userRouter.delete("/address/:id", verifyJwt, verifyCustomer, deleteUserAddress);

export default userRouter;