import connectDB from "../config/db.js";
import { ObjectId } from "mongodb";

const { orders, products, carts } = await connectDB();

export const createOrder = async (req, res) => {
  try {
    const {
      customerEmail,
      orderStatus,
      paymentStatus,
      shippingAddress,
      billingAddress,
      stores,
      itemsTotal,
      totalDeliveryCharge,
      totalAmount,
      paymentMethod,
      transactionId,
    } = req.body;

    // Validation
    if (
      !customerEmail ||
      !shippingAddress ||
      !billingAddress ||
      !stores ||
      stores.length === 0
    ) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields",
      });
    }

    // Verify customer email matches JWT
    if (customerEmail !== req.user.email) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized: Email mismatch",
      });
    }

    // Validate stock availability and prices
    for (const store of stores) {
      for (const item of store.items) {
        const product = await products.findOne({
          _id: new ObjectId(item.productId),
        });

        if (!product) {
          return res.status(404).json({
            success: false,
            message: `Product not found: ${item.productName}`,
          });
        }

        // Check if product is available
        // if (product.status !== "active") {
        //   return res.status(400).json({
        //     success: false,
        //     message: `Product is not available: ${item.productName}`,
        //   });
        // }

        // Check stock availability
        if (product.stock < item.quantity) {
          return res.status(400).json({
            success: false,
            message: `Insufficient stock for ${item.productName}. Available: ${product.stock}`,
          });
        }

        // Verify price hasn't changed significantly
        const currentPrice = product.price;
        const orderPrice = item.unitPrice;

        if (Math.abs(currentPrice - orderPrice) > 0.01) {
          return res.status(400).json({
            success: false,
            message: `Price has changed for ${item.productName}. Please refresh and try again.`,
          });
        }
      }
    }

    // Prepare order document
    const orderDocument = {
      customerEmail,
      orderStatus: orderStatus || "pending",
      paymentStatus: paymentStatus || "unpaid",
      shippingAddress: {
        name: shippingAddress.name,
        phone: shippingAddress.phone,
        email: shippingAddress.email,
        address: shippingAddress.address,
        building: shippingAddress.building || "",
        thana: shippingAddress.thana,
        district: shippingAddress.district,
        region: shippingAddress.region,
        label: shippingAddress.label,
      },
      billingAddress: {
        name: billingAddress.name,
        phone: billingAddress.phone,
        email: billingAddress.email,
        address: billingAddress.address,
        building: billingAddress.building || "",
        thana: billingAddress.thana,
        district: billingAddress.district,
        region: billingAddress.region,
        label: billingAddress.label,
      },
      stores: stores.map((store) => ({
        storeId: new ObjectId(store.storeId),
        storeName: store.storeName,
        storeEmail: store.storeEmail,
        storeOrderStatus: store.storeOrderStatus || "pending",
        items: store.items.map((item) => ({
          productId: new ObjectId(item.productId),
          productName: item.productName,
          productImage: item.productImage,
          color: item.color,
          size: item.size,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          discount: item.discount,
          discountedPrice: item.discountedPrice,
          subtotal: item.subtotal,
        })),
        deliveryCharge: store.deliveryCharge,
        storeTotal: store.storeTotal,
        platformCommission: store.platformCommission,
        platformCommissionAmount: store.platformCommissionAmount,
        sellerAmount: store.sellerAmount,
        riderAmount: store.riderAmount,
      })),
      itemsTotal,
      totalDeliveryCharge,
      totalAmount,
      paymentMethod: paymentMethod || null,
      transactionId: transactionId || null,
      createdAt: new Date().toISOString(),
    };

    // Insert order into database
    const result = await orders.insertOne(orderDocument);

    if (!result.insertedId) {
      return res.status(500).json({
        success: false,
        message: "Failed to place order",
      });
    }

    // Update product stock (decrement)
    const stockUpdatePromises = [];
    for (const store of stores) {
      for (const item of store.items) {
        stockUpdatePromises.push(
          products.updateOne(
            { _id: new ObjectId(item.productId) },
            {
              $inc: { stock: -item.quantity },
              $set: { updatedAt: new Date().toISOString() },
            }
          )
        );
      }
    }

    await Promise.all(stockUpdatePromises);

    // Remove ordered items from cart
    const cart = await carts.findOne({ email: customerEmail });

    if (cart && cart.items && cart.items.length > 0) {
      let cartItems = cart.items;

      // Helper function to check if items match (productId + color + size)
      const itemsMatch = (item1, item2) => {
        const productMatch =
          item1.productId.toString() === item2.productId.toString();
        const colorMatch = (item1.color || null) === (item2.color || null);
        const sizeMatch = (item1.size || null) === (item2.size || null);
        return productMatch && colorMatch && sizeMatch;
      };

      // Collect all ordered items from all stores
      const orderedItems = [];
      for (const store of stores) {
        for (const item of store.items) {
          orderedItems.push({
            productId: new ObjectId(item.productId),
            color: item.color || null,
            size: item.size || null,
          });
        }
      }

      // Remove ordered items from cart
      cartItems = cartItems.filter((cartItem) => {
        return !orderedItems.some((orderedItem) =>
          itemsMatch(cartItem, orderedItem)
        );
      });

      // Update cart in database
      await carts.updateOne(
        { email: customerEmail },
        {
          $set: {
            items: cartItems,
            updatedAt: new Date().toISOString(),
          },
        }
      );
    }

    // Return success response
    return res.status(201).json({
      success: true,
      message: "Order placed successfully",
    });
  } catch (error) {
    console.error("Error creating order:", error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};