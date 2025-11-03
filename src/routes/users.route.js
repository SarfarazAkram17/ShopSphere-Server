import express from "express";
import {
  createUser,
  getAllUsers,
  getUserRole,
  updateProfile,
} from "../controllers/users.controller.js";
import { verifyJwt } from "../middleware/verifyJwt.middleware.js";
import { verifyAdmin } from "../middleware/verifyAdmin.middleware.js";

const userRouter = express.Router();

userRouter.get("/", verifyJwt, verifyAdmin, getAllUsers);

userRouter.get("/:email/role", getUserRole);

userRouter.post("/", createUser);

userRouter.patch("/", verifyJwt, updateProfile);

export default userRouter;