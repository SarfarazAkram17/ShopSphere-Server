import express from "express";
import { createToken, logout } from "../controllers/auth.controller.js";

const authRouter = express.Router();

authRouter.post("/jwt", createToken);

authRouter.post("/logout", logout);

export default authRouter;