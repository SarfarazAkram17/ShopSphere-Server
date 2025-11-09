import { ObjectId } from "mongodb";
import connectDB from "../config/db.js";

const { carts, products, sellers } = await connectDB();

// Helper function to check if items match (productId + color + size)
const itemsMatch = (item1, item2) => {
  const productMatch =
    item1.productId.toString() === item2.productId.toString();
  const colorMatch = (item1.color || null) === (item2.color || null);
  const sizeMatch = (item1.size || null) === (item2.size || null);

  return productMatch && colorMatch && sizeMatch;
};

// Helper function to calculate total quantity for a product across all variants
const calculateTotalQuantityForProduct = (items, productId) => {
  return items
    .filter((item) => item.productId.toString() === productId.toString())
    .reduce((total, item) => total + item.quantity, 0);
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

    // Fetch product to check stock
    const product = await products.findOne({ _id: new ObjectId(productId) });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    const cart = await carts.findOne({ email });
    let items = [];

    if (cart) {
      items = cart.items || [];
    }

    // Calculate total quantity already in cart for this product (all variants)
    const existingTotalQuantity = calculateTotalQuantityForProduct(
      items,
      productId
    );

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

    let newTotalQuantity;

    if (existingItemIndex >= 0) {
      // Update existing item quantity (same product, color, and size)
      newTotalQuantity = existingTotalQuantity + parseInt(quantity);
    } else {
      // Adding as new variant
      newTotalQuantity = existingTotalQuantity + parseInt(quantity);
    }

    // Check if new total exceeds stock
    if (newTotalQuantity > product.stock) {
      const availableToAdd = product.stock - existingTotalQuantity;
      return res.status(400).json({
        success: false,
        message: `Cannot add ${quantity} items. Only ${availableToAdd} items available (${existingTotalQuantity} already in cart, ${product.stock} total stock)`,
        availableToAdd,
        existingQuantity: existingTotalQuantity,
        totalStock: product.stock,
      });
    }

    if (existingItemIndex >= 0) {
      items[existingItemIndex].quantity += parseInt(quantity);
    } else {
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

    res.json({ success: true });
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

    // Fetch product to check stock
    const product = await products.findOne({ _id: new ObjectId(productId) });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
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

    if (itemIndex < 0) {
      return res.status(404).json({
        success: false,
        message: "Item not found in cart",
      });
    }

    // Calculate total quantity for this product (excluding current item)
    const existingTotalQuantity = calculateTotalQuantityForProduct(
      items,
      productId
    );
    const currentItemQuantity = items[itemIndex].quantity;
    const otherVariantsQuantity = existingTotalQuantity - currentItemQuantity;

    // Check if new total would exceed stock
    const newTotalQuantity = otherVariantsQuantity + parseInt(quantity);

    if (newTotalQuantity > product.stock) {
      const maxAllowed = product.stock - otherVariantsQuantity;
      return res.status(400).json({
        success: false,
        message: `Cannot set quantity to ${quantity}. Maximum allowed is ${maxAllowed} (${otherVariantsQuantity} in other variants, ${product.stock} total stock)`,
        maxAllowed,
        otherVariantsQuantity,
        totalStock: product.stock,
      });
    }

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

    res.json({ success: true });
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

        let imageIndex = 0;

        if (item.color && product.color && Array.isArray(product.color)) {
          const colorIndex = product.color.findIndex(
            (color) => color.toLowerCase() === item.color.toLowerCase()
          );

          if (colorIndex !== -1 && product.images[colorIndex]) {
            imageIndex = colorIndex;
          }
        }

        return {
          ...item,
          productId: item.productId.toString(),
          product: {
            _id: product._id,
            name: product.name,
            price: product.price,
            discount: product.discount,
            image: product.images[imageIndex],
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

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getCheckoutItems = async (req, res) => {
  try {
    const { items } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Items array is required",
      });
    }

    // Extract unique product IDs
    const productIds = [...new Set(items.map((item) => item.productId))].map(
      (id) => new ObjectId(id)
    );

    // Fetch all products from database
    const productList = await products
      .find({
        _id: { $in: productIds },
      })
      .toArray();

    // Extract unique store IDs from products
    const storeIds = [
      ...new Set(
        productList.map((p) => p.storeId).filter((id) => id) // Remove null/undefined
      ),
    ].map((id) => new ObjectId(id));

    // Fetch all stores in one query (more efficient)
    const storeList = await sellers
      .find({
        _id: { $in: storeIds },
      })
      .toArray();

    // Create a store lookup map for quick access
    const storeMap = {};
    storeList.forEach((store) => {
      storeMap[store._id.toString()] = store;
    });

    // Map products with the requested quantity, color, and size
    const checkoutItems = items
      .map((item) => {
        const product = productList.find(
          (p) => p._id.toString() === item.productId
        );

        // If product not found, return null (will be filtered out)
        if (!product) {
          console.warn(`Product not found: ${item.productId}`);
          return null;
        }

        // Check if product is out of stock
        if (product.stock < 1) {
          console.warn(`Product out of stock: ${product.name}`);
          return null;
        }

        // Check if requested quantity exceeds available stock
        if (item.quantity > product.stock) {
          console.warn(
            `Requested quantity (${item.quantity}) exceeds stock (${product.stock}) for: ${product.name}`
          );
          // Adjust to available stock
          item.quantity = product.stock;
        }

        // Get store from the pre-fetched map
        const store = storeMap[product.storeId];

        // Find the index of the selected color in product's color array
        let imageIndex = 0;

        if (item.color && product.color && Array.isArray(product.color)) {
          const colorIndex = product.color.findIndex(
            (color) => color.toLowerCase() === item.color.toLowerCase()
          );

          if (colorIndex !== -1 && product.images[colorIndex]) {
            imageIndex = colorIndex;
          }
        }

        const checkoutItem = {
          productId: item.productId,
          quantity: parseInt(item.quantity),
          product: {
            _id: product._id,
            name: product.name,
            price: product.price,
            discount: product.discount || 0,
            image: product.images[imageIndex],
            stock: product.stock,
            storeName: product.storeName,
            storeId: product.storeId,
            storeInfo: {
              storeName: store.storeName,
              address: store.storeAddress,
              district: store.district,
              region: store.region,
              thana: store.thana,
            },
          },
        };

        // Only add color if it exists in the request
        if (item.color) {
          checkoutItem.color = item.color;
        }

        // Only add size if it exists in the request
        if (item.size) {
          checkoutItem.size = item.size;
        }

        return checkoutItem;
      })
      .filter((item) => item !== null);

    res.json({ success: true, items: checkoutItems });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};