import { ObjectId } from "mongodb";
import connectDB from "../config/db.js";

const { carts, products } = await connectDB();

// Helper function to check if items match (productId + color + size)
const itemsMatch = (item1, item2) => {
  const productMatch =
    item1.productId.toString() === item2.productId.toString();
  const colorMatch = (item1.color || null) === (item2.color || null);
  const sizeMatch = (item1.size || null) === (item2.size || null);

  return productMatch && colorMatch && sizeMatch;
};

// Get user's cart
export const getCartProducts = async (req, res) => {
  try {
    const email = req.query.email;

    const cart = await carts.findOne({ email });

    if (!cart) {
      // Create empty cart if doesn't exist
      await carts.insertOne({
        email,
        items: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      return res.json({ success: true, cart: [] });
    }

    res.json({ success: true, cart: cart.items || [] });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Add product to cart
export const addProductOnCart = async (req, res) => {
  try {
    const email = req.user.email;
    const { productId, quantity, color, size } = req.body;

    if (!productId || !quantity) {
      return res.status(400).json({
        success: false,
        message: "Product ID and quantity are required",
      });
    }

    const cart = await carts.findOne({ email });

    let items = [];

    if (cart) {
      items = cart.items || [];
    }

    // Create new item object for comparison
    const newItem = {
      productId: new ObjectId(productId),
      quantity: parseInt(quantity),
    };

    if (color) {
      newItem.color = color;
    }
    if (size) {
      newItem.size = size;
    }

    // Check if exact match exists (productId + color + size)
    const existingItemIndex = items.findIndex((item) =>
      itemsMatch(item, newItem)
    );

    if (existingItemIndex >= 0) {
      // Update existing item quantity (same product, color, and size)
      items[existingItemIndex].quantity += parseInt(quantity);
    } else {
      // Add as new item (different color/size combination)
      items.push(newItem);
    }

    // Update or insert cart
    await carts.updateOne(
      { email },
      {
        $set: {
          items: items,
          updatedAt: new Date().toISOString(),
        },
        $setOnInsert: {
          createdAt: new Date().toISOString(),
        },
      },
      { upsert: true }
    );

    res.json({ success: true, cart: items });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Update cart item quantity
export const updateCartItem = async (req, res) => {
  try {
    const email = req.user.email;
    const { productId, quantity, color, size } = req.body;

    if (!productId || !quantity) {
      return res.status(400).json({
        success: false,
        message: "Product ID and quantity are required",
      });
    }

    if (quantity < 1) {
      return res.status(400).json({
        success: false,
        message: "Quantity must be at least 1",
      });
    }

    const cart = await carts.findOne({ email });

    if (!cart) {
      return res.status(404).json({
        success: false,
        message: "Cart not found",
      });
    }

    let items = cart.items || [];

    // Find item by productId + color + size
    const searchItem = {
      productId: new ObjectId(productId),
      color: color || null,
      size: size || null,
    };

    const itemIndex = items.findIndex((item) => itemsMatch(item, searchItem));

    if (itemIndex >= 0) {
      items[itemIndex].quantity = parseInt(quantity);

      await carts.updateOne(
        { email },
        {
          $set: {
            items: items,
            updatedAt: new Date().toISOString(),
          },
        }
      );

      return res.json({ success: true, cart: items });
    } else {
      return res.status(404).json({
        success: false,
        message: "Item not found in cart",
      });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Remove item from cart
export const removeFromCart = async (req, res) => {
  try {
    const email = req.user.email;
    const { productId } = req.params;
    const { color, size } = req.query;

    const cart = await carts.findOne({ email });

    if (!cart) {
      return res.status(404).json({
        success: false,
        message: "Cart not found",
      });
    }

    let items = cart.items || [];

    // Create search criteria
    const searchItem = {
      productId: new ObjectId(productId),
      color: color || null,
      size: size || null,
    };

    // Filter out the specific item (matching productId + color + size)
    items = items.filter((item) => !itemsMatch(item, searchItem));

    await carts.updateOne(
      { email },
      {
        $set: {
          items: items,
          updatedAt: new Date().toISOString(),
        },
      }
    );

    res.json({ success: true, cart: items });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get cart with populated product details
export const getCartDetails = async (req, res) => {
  try {
    const email = req.user.email;

    const cart = await carts.findOne({ email });

    if (!cart || !cart.items || cart.items.length === 0) {
      return res.json({ success: true, cart: [] });
    }

    // Get unique product IDs from cart
    const productIds = [
      ...new Set(cart.items.map((item) => item.productId.toString())),
    ].map((id) => new ObjectId(id));

    // Fetch product details
    const productList = await products
      .find({
        _id: { $in: productIds },
      })
      .toArray();

    // Map products to cart items
    const cartWithDetails = cart.items
      .map((item) => {
        const product = productList.find(
          (p) => p._id.toString() === item.productId.toString()
        );

        if (!product) return null;

        return {
          ...item,
          productId: item.productId.toString(),
          product: {
            _id: product._id,
            name: product.name,
            price: product.price,
            discount: product.discount,
            images: product.images,
            stock: product.stock,
            storeName: product.storeName,
            storeId: product.storeId,
          },
        };
      })
      .filter((item) => item !== null);

    res.json({ success: true, cart: cartWithDetails });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Remove specific items from cart (after order placement)
export const removeCartItems = async (req, res) => {
  try {
    const email = req.user.email;
    const { itemsToRemove } = req.body; // Array of items with productId, color, size

    if (
      !itemsToRemove ||
      !Array.isArray(itemsToRemove) ||
      itemsToRemove.length === 0
    ) {
      return res.status(400).json({
        success: false,
        message: "Items to remove are required",
      });
    }

    const cart = await carts.findOne({ email });

    if (!cart) {
      return res.status(404).json({
        success: false,
        message: "Cart not found",
      });
    }

    let items = cart.items || [];

    // Remove each item from the cart
    itemsToRemove.forEach((itemToRemove) => {
      const searchItem = {
        productId: new ObjectId(itemToRemove.productId),
        color: itemToRemove.color || null,
        size: itemToRemove.size || null,
      };

      items = items.filter((item) => !itemsMatch(item, searchItem));
    });

    // Update cart
    await carts.updateOne(
      { email },
      {
        $set: {
          items: items,
          updatedAt: new Date().toISOString(),
        },
      }
    );

    res.json({ success: true, cart: items });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};