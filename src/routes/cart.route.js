import express from "express";
import { verifyJwt } from "../middleware/verifyJwt.middleware.js";
import { verifyCustomer } from "../middleware/verifyCustomer.middleware.js";
import {
  addProductOnCart,
  getCartProducts,
  updateCartItem,
  removeFromCart,
  // clearCart,
  // syncCart,
  getCartDetails,
  removeCartItems
} from "../controllers/cart.controller.js";

const cartRouter = express.Router();

// Get cart items
cartRouter.get("/", getCartProducts); // done

// Get cart with product details
cartRouter.get("/details", verifyJwt, verifyCustomer, getCartDetails); // done

// Add product to cart
cartRouter.post("/add", verifyJwt, verifyCustomer, addProductOnCart); // done

// Update cart item
cartRouter.put("/update", verifyJwt, verifyCustomer, updateCartItem); //done

// Remove single item from cart
cartRouter.delete("/remove/:productId", verifyJwt, verifyCustomer, removeFromCart); // done

// Remove multiple items from cart (after order)
cartRouter.post("/remove-items", verifyJwt, verifyCustomer, removeCartItems); //done

// Clear entire cart
// cartRouter.delete("/clear", verifyJwt, verifyCustomer, clearCart);

// Sync local cart with server
// cartRouter.post("/sync", verifyJwt, verifyCustomer, syncCart);

export default cartRouter;