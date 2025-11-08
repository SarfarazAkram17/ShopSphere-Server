import express from "express";
import { verifyJwt } from "../middleware/verifyJwt.middleware.js";
import { verifyCustomer } from "../middleware/verifyCustomer.middleware.js";
import {
  addProductOnCart,
  getCartProducts,
  updateCartItem,
  removeFromCart,
  getCartDetails,
  removeCartItems,
  getCheckoutItems,
} from "../controllers/cart.controller.js";

const cartRouter = express.Router();

// Get cart items
cartRouter.get("/", getCartProducts);

// Get cart with product details
cartRouter.get("/details", verifyJwt, verifyCustomer, getCartDetails);

// Add product to cart
cartRouter.post("/add", verifyJwt, verifyCustomer, addProductOnCart);

// Update cart item
cartRouter.put("/update", verifyJwt, verifyCustomer, updateCartItem);

// Remove single item from cart
cartRouter.delete(
  "/remove/:productId",
  verifyJwt,
  verifyCustomer,
  removeFromCart
);

// Remove multiple items from cart
cartRouter.post("/remove-items", verifyJwt, verifyCustomer, removeCartItems);

// get multiple items from cart for checkout
cartRouter.post("/checkout-items", verifyJwt, verifyCustomer, getCheckoutItems);

export default cartRouter;