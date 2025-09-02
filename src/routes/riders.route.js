import express from "express";
import { verifyJwt } from "../middleware/verifyJwt.middleware.js";
import { applyForRider } from "../controllers/riders.controller.js";
const router = express.Router();

export const ridersRoutes = (users, sellers, riders) => {
  router.post("/", verifyJwt, (req, res)=> applyForRider(req, res, sellers, riders));

  return router;
};