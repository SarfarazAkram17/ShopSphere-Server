import express from "express";
import { createToken, logout } from "../controllers/auth.controller.js";

const router = express.Router();

export const authRoutes = (users) => {
  router.post("/jwt", (req, res) => createToken(req, res, users));

  router.post("/logout", (req, res) => logout(req, res));

  return router;
};