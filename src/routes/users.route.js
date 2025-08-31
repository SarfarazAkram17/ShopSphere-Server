import express from "express";
import { createUser, getUserRole } from "../controllers/users.controller.js";
const router = express.Router();

export const usersRoutes = (users) => {
  router.get("/:email/role", (req, res) => getUserRole(req, res, users));

  router.post("/", (req, res) => createUser(req, res, users));

  return router;
};