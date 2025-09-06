import express from "express";
import cors from "cors";
import "dotenv/config";
import cookieParser from "cookie-parser";
import connectDB from "./config/db.js";

const app = express();
const port = 5001;

import { authRoutes } from "./routes/auth.route.js";
import { usersRoutes } from "./routes/users.route.js";
import { sellersRoutes } from "./routes/sellers.route.js";
import { ridersRoutes } from "./routes/riders.route.js";
import { productsRoutes } from "./routes/products.route.js";

app.use(
  cors({
    origin: [
      "https://shopsphere-sarfaraz.netlify.app",
      "http://localhost:5173",
    ],
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());

async function startServer() {
  try {
    const { users, sellers, riders, products } = await connectDB();

    app.use("/auth", authRoutes(users));
    app.use("/users", usersRoutes(users));
    app.use("/sellers", sellersRoutes(users, sellers, riders));
    app.use("/riders", ridersRoutes(users, sellers, riders));
    app.use("/products", productsRoutes(sellers, products));

    app.listen(port, () => {
      console.log(`server is running on port ${port}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
}

startServer();