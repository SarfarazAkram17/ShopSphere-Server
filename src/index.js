import express from "express";
import cors from "cors";
import "dotenv/config";
import cookieParser from "cookie-parser";
import http from "http";

const app = express();
const server = http.createServer(app);
const port = 5001;

import authRouter from "./routes/auth.route.js";
import userRouter from "./routes/users.route.js";
import addressRouter from "./routes/address.route.js";
import sellersRouter from "./routes/sellers.route.js";
import ridersRouter from "./routes/riders.route.js";
import productsRouter from "./routes/products.route.js";
import cartRouter from "./routes/cart.route.js";

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
    app.use("/auth", authRouter);
    app.use("/users", userRouter);
    app.use("/address", addressRouter);
    app.use("/sellers", sellersRouter);
    app.use("/riders", ridersRouter);
    app.use("/products", productsRouter);
    app.use("/cart", cartRouter);

    server.listen(port, () => {
      console.log(`server is running on port ${port}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
}

startServer();