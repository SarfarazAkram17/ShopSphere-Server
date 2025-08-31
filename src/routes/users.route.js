import express from "express";
import {
  createUser,
  getAllUsers,
  getUserRole,
  updateProfile,
} from "../controllers/users.controller.js";
import { verifyJwt } from "../middleware/verifyJwt.js";
import { verifyAdmin } from "../middleware/verifyAdmin.middleware.js";
const router = express.Router();

export const usersRoutes = (users) => {
  router.get("/", verifyJwt, verifyAdmin, (req, res) =>
    getAllUsers(req, res, users)
  );

  router.get("/:email/role", (req, res) => getUserRole(req, res, users));

  router.post("/", (req, res) => createUser(req, res, users));

  router.patch("/", verifyJwt, (req, res) => updateProfile(req, res, users));

  return router;
};