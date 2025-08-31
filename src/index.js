import express from "express";
import cors from "cors";
import "dotenv/config";
import cookieParser from "cookie-parser";
import connectDB from "./config/db.js";

const app = express();
const port = 5001;

import { authRoutes } from "./routes/auth.route.js";
import { usersRoutes } from "./routes/users.route.js";

app.use(
  cors({
    origin: ["http://localhost:5173"],
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));

async function startServer() {
  try {
    const { users } = await connectDB();

    app.use("/auth", authRoutes(users));
    app.use("/users", usersRoutes(users));

    app.listen(port, () => {
      console.log(`server is running on port ${port}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
}

startServer();