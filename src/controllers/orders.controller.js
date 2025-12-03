import connectDB from "../config/db.js";
import { ObjectId } from "mongodb";

const { orders, products, carts } = await connectDB();

export const getAllOrders = async (req, res) => {
  try {
    const orders = await orders.find().toArray();
    res.send(orders);
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getMyOrders = async (req, res) => {
  try {
    const { email } = req.user;
    const { page = 1, limit = 10, searchTerm = "", status } = req.query;

    // Convert page and limit to numbers
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Build the filter query
    let filter = { customerEmail: email };

    // Add status filter if provided and not "all"
    if (status && status !== "all") {
      filter.orderStatus = status;
    }

    // Add search filter if searchTerm is provided
    if (searchTerm && searchTerm.trim() !== "") {
      const trimmedSearch = searchTerm.trim();
      const searchRegex = new RegExp(trimmedSearch, "i");

      // Build $or array for search conditions
      const searchConditions = [
        { "stores.storeName": searchRegex }, // Search by store name
        { "stores.items.productName": searchRegex }, // Search by product name
        { "shippingAddress.name": searchRegex }, // Search by customer name
        { "shippingAddress.phone": searchRegex }, // Search by phone
      ];

      // Check if searchTerm is a valid ObjectId (24 hex characters)
      if (ObjectId.isValid(trimmedSearch)) {
        searchConditions.push({ _id: new ObjectId(trimmedSearch) });
      }

      filter.$or = searchConditions;
    }

    // Get total count for pagination
    const total = await orders.countDocuments(filter);

    // Get paginated orders
    const myOrders = await orders
      .find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .toArray();

    // Calculate statistics for all orders (not just current page)
    const allOrdersFilter = { customerEmail: email };
    const stats = {
      all: await orders.countDocuments(allOrdersFilter),
      pending: await orders.countDocuments({
        ...allOrdersFilter,
        orderStatus: "pending",
      }),
      confirmed: await orders.countDocuments({
        ...allOrdersFilter,
        orderStatus: "confirmed",
      }),
      prepared: await orders.countDocuments({
        ...allOrdersFilter,
        orderStatus: "prepared",
      }),
      shipped: await orders.countDocuments({
        ...allOrdersFilter,
        orderStatus: "shipped",
      }),
      delivered: await orders.countDocuments({
        ...allOrdersFilter,
        orderStatus: "delivered",
      }),
      cancelled: await orders.countDocuments({
        ...allOrdersFilter,
        orderStatus: "cancelled",
      }),
    };

    res.status(200).json({
      success: true,
      myOrders,
      total,
      stats,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch orders",
    });
  }
};

export const getSingleOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    const userEmail = req.user.email;

    const order = await orders.findOne({
      _id: new ObjectId(orderId),
      customerEmail: userEmail,
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    res.status(200).json(order);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

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
      cashPaymentFee,
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
        message: "Forbidden: Email mismatch",
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
        if (product.status !== "active") {
          return res.status(400).json({
            success: false,
            message: `Product is not available: ${item.productName}`,
          });
        }

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
      cashPaymentFee,
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

    const order = await orders.findOne({
      _id: new ObjectId(result.insertedId.toString()),
    });
    const stockUpdatePromises = [];
    for (const store of order.stores) {
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

    // Return success response
    return res.status(201).json({
      success: true,
      message: "Order placed successfully",
      id: result.insertedId,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const confirmOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    const customerEmail = req.user.email;

    // Find the order
    const order = await orders.findOne({
      _id: new ObjectId(orderId),
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    // Verify customer email matches
    if (order.customerEmail !== customerEmail) {
      return res.status(403).json({
        success: false,
        message: "Forbidden: You can only confirm your own orders",
      });
    }

    // Check if order is already confirmed
    if (order.orderStatus === "confirmed") {
      return res.status(400).json({
        success: false,
        message: "Order is already confirmed",
      });
    }

    // Update order status and payment method
    const result = await orders.updateOne(
      { _id: new ObjectId(orderId) },
      {
        $set: {
          orderStatus: "pending",
          paymentMethod: "cash_on_delivery",
          cashPaymentFee: 20,
          totalAmount: Number(order.totalAmount + 20),
          updatedAt: new Date().toISOString(),
        },
      }
    );

    if (result.modifiedCount === 0) {
      return res.status(500).json({
        success: false,
        message: "Failed to confirm order",
      });
    }

    // Update product stock (decrement)
    const stockUpdatePromises = [];
    for (const store of order.stores) {
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

    return res.status(200).json({
      success: true,
      message: "Order confirmed successfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const cancelOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { items, reason } = req.body;
    const { role, email: userEmail } = req.user;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Please provide items to cancel",
      });
    }

    if (!reason || reason.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: "Please provide a cancellation reason",
      });
    }

    const order = await orders.findOne({
      _id: new ObjectId(orderId),
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    // Authorization check based on role
    if (role === "customer") {
      if (order.customerEmail !== userEmail) {
        return res.status(403).json({
          success: false,
          message: "Forbidden: You can only cancel your own orders",
        });
      }
      if (order.orderStatus !== "pending" || order.paymentStatus !== "unpaid") {
        return res.status(400).json({
          success: false,
          message: "Order cannot be cancelled. It has been confirmed or paid.",
        });
      }
    } else if (role === "seller") {
      // Seller can only cancel items from their own store
      const sellerStoreIds = order.stores
        .filter((s) => s.storeEmail === userEmail)
        .map((s) => s.storeId.toString());

      if (sellerStoreIds.length === 0) {
        return res.status(403).json({
          success: false,
          message: "Forbidden: You don't have any products in this order",
        });
      }

      // Verify all items to cancel belong to seller's stores
      for (const cancelRequest of items) {
        if (!sellerStoreIds.includes(cancelRequest.storeId)) {
          return res.status(403).json({
            success: false,
            message: "Forbidden: You can only cancel items from your own store",
          });
        }
      }
    }

    let totalRefund = 0;
    let itemsRefund = 0;
    let deliveryRefund = 0;
    let updatedStores = [...order.stores];
    const cancelledItems = [];

    for (const cancelRequest of items) {
      const { storeId, items: productsToCancel } = cancelRequest;

      const storeIndex = updatedStores.findIndex(
        (s) => s.storeId.toString() === storeId
      );

      if (storeIndex === -1) continue;

      const store = updatedStores[storeIndex];

      // Role-specific checks
      if (role === "seller" && store.storeEmail !== userEmail) {
        continue;
      }

      if (role === "customer" && store.storeOrderStatus !== "pending") {
        continue;
      }

      if (role === "seller" && store.storeOrderStatus !== "pending") {
        continue;
      }

      for (const productCancel of productsToCancel) {
        const { itemIndex, productId, quantity, color, size } = productCancel;

        let itemIdx = itemIndex;

        if (itemIdx === undefined || itemIdx === null) {
          itemIdx = store.items.findIndex(
            (item) =>
              item.productId.toString() === productId &&
              (color
                ? item.color === color
                : !item.color || item.color === null) &&
              (size ? item.size === size : !item.size || item.size === null)
          );
        }

        if (itemIdx === -1 || itemIdx >= store.items.length) continue;

        const item = store.items[itemIdx];

        if (item.status === "cancelled") continue;

        if (item.productId.toString() !== productId) continue;

        const itemRefund = item.subtotal;

        itemsRefund = Number((itemsRefund + itemRefund).toFixed(2));

        await products.updateOne(
          { _id: new ObjectId(productId) },
          { $inc: { stock: quantity } }
        );

        cancelledItems.push({
          storeId: store.storeId,
          storeName: store.storeName,
          productId: item.productId,
          productName: item.productName,
          color: item.color || null,
          size: item.size || null,
          quantity: item.quantity,
          refundAmount: Number(itemRefund.toFixed(2)),
        });

        store.items[itemIdx].status = "cancelled";
        store.items[itemIdx].cancelledAt = new Date().toISOString();
        store.items[itemIdx].cancellationReason = reason;
        store.items[itemIdx].cancelledBy = role;
      }

      const allItemsCancelled = store.items.every(
        (item) => item.status === "cancelled"
      );

      if (allItemsCancelled) {
        deliveryRefund = Number(
          (deliveryRefund + store.deliveryCharge).toFixed(2)
        );
        store.storeOrderStatus = "cancelled";
        store.cancelledAt = new Date().toISOString();
        store.cancellationReason = reason;
        store.cancelledBy = role;
      } else {
        const activeItems = store.items.filter(
          (item) => item.status !== "cancelled"
        );
        const newStoreTotal = activeItems.reduce(
          (sum, item) => sum + item.subtotal,
          0
        );
        store.storeTotal = Number(newStoreTotal.toFixed(2));

        store.platformCommissionAmount = Number(
          ((newStoreTotal * store.platformCommission) / 100).toFixed(2)
        );
        store.sellerAmount = Number(
          (
            newStoreTotal +
            store.deliveryCharge -
            store.platformCommissionAmount -
            store.riderAmount
          ).toFixed(2)
        );
      }

      updatedStores[storeIndex] = store;
    }

    totalRefund = Number((itemsRefund + deliveryRefund).toFixed(2));

    const allStoresCancelled = updatedStores.every(
      (s) => s.storeOrderStatus === "cancelled"
    );

    let cashFeeRefund = 0;
    if (allStoresCancelled) {
      if (order.cashPaymentFee) {
        cashFeeRefund = Number(order.cashPaymentFee.toFixed(2));
        totalRefund = Number((totalRefund + cashFeeRefund).toFixed(2));
      }
    }

    const activeStores = updatedStores.filter(
      (s) => s.storeOrderStatus !== "cancelled"
    );
    const newItemsTotal = activeStores.reduce(
      (sum, store) => sum + store.storeTotal,
      0
    );
    const newDeliveryTotal = activeStores.reduce(
      (sum, store) => sum + store.deliveryCharge,
      0
    );
    const newTotalAmount =
      newItemsTotal +
      newDeliveryTotal +
      (allStoresCancelled ? 0 : order.cashPaymentFee || 0);

    const updateData = {
      stores: updatedStores,
      itemsTotal: Number(newItemsTotal.toFixed(2)),
      totalDeliveryCharge: Number(newDeliveryTotal.toFixed(2)),
      totalAmount: Number(newTotalAmount.toFixed(2)),
      updatedAt: new Date().toISOString(),
      cancellationHistory: [
        ...(order.cancellationHistory || []),
        {
          cancelledAt: new Date().toISOString(),
          cancelledBy: userEmail,
          cancelledByRole: role,
          reason: reason,
          items: cancelledItems,
          refundAmount: Number(totalRefund.toFixed(2)),
        },
      ],
    };

    if (allStoresCancelled) {
      updateData.orderStatus = "cancelled";
      updateData.cancelledAt = new Date().toISOString();
    }

    await orders.updateOne(
      { _id: new ObjectId(orderId) },
      { $set: updateData }
    );

    res.status(200).json({
      success: true,
      message: "Order items cancelled successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getSellerOrders = async (req, res) => {
  try {
    const { email } = req.user;
    const { page = 1, limit = 10, searchTerm = "", status } = req.query;

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    const pipeline = [
      {
        $match: {
          "stores.storeEmail": email,
        },
      },
    ];

    if (searchTerm && searchTerm.trim() !== "") {
      const trimmedSearch = searchTerm.trim();
      const searchRegex = new RegExp(trimmedSearch, "i");

      const searchConditions = [
        { "stores.items.productName": searchRegex },
        { "shippingAddress.name": searchRegex },
        { "shippingAddress.phone": searchRegex },
      ];

      if (ObjectId.isValid(trimmedSearch)) {
        searchConditions.push({ _id: new ObjectId(trimmedSearch) });
      }

      pipeline.push({
        $match: {
          $or: searchConditions,
        },
      });
    }

    pipeline.push({
      $project: {
        _id: 1,
        customerEmail: 1,
        orderStatus: 1,
        paymentStatus: 1,
        shippingAddress: 1,
        billingAddress: 1,
        paymentMethod: 1,
        transactionId: 1,
        createdAt: 1,
        updatedAt: 1,
        stores: {
          $filter: {
            input: "$stores",
            as: "store",
            cond: { $eq: ["$$store.storeEmail", email] },
          },
        },
      },
    });

    if (status && status !== "all") {
      pipeline.push({
        $match: {
          "stores.storeOrderStatus": status,
        },
      });
    }

    pipeline.push({
      $match: {
        $expr: { $gt: [{ $size: "$stores" }, 0] },
      },
    });

    pipeline.push({
      $sort: { createdAt: -1 },
    });

    const countPipeline = [...pipeline, { $count: "total" }];
    const countResult = await orders.aggregate(countPipeline).toArray();
    const total = countResult.length > 0 ? countResult[0].total : 0;

    pipeline.push({ $skip: skip });
    pipeline.push({ $limit: limitNum });

    const sellerOrders = await orders.aggregate(pipeline).toArray();

    const statsPipeline = [
      {
        $match: {
          "stores.storeEmail": email,
        },
      },
      {
        $unwind: "$stores",
      },
      {
        $match: {
          "stores.storeEmail": email,
        },
      },
      {
        $group: {
          _id: "$stores.storeOrderStatus",
          count: { $sum: 1 },
        },
      },
    ];

    const statsResult = await orders.aggregate(statsPipeline).toArray();

    const stats = {
      all: 0,
      pending: 0,
      confirmed: 0,
      prepared: 0,
      shipped: 0,
      delivered: 0,
      cancelled: 0,
    };

    statsResult.forEach((stat) => {
      if (stats.hasOwnProperty(stat._id)) {
        stats[stat._id] = stat.count;
      }
    });

    stats.all = Object.values(stats).reduce((sum, count) => sum + count, 0);

    res.status(200).json({
      success: true,
      orders: sellerOrders,
      total,
      stats,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch seller orders",
    });
  }
};

export const updateStoreOrderStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { storeId, status } = req.body;
    const sellerEmail = req.user.email;

    if (!storeId || !status) {
      return res.status(400).json({
        success: false,
        message: "Store ID and status are required",
      });
    }

    const validStatuses = ["confirmed", "prepared"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status. Only 'confirmed' and 'prepared' are allowed.",
      });
    }

    const order = await orders.findOne({
      _id: new ObjectId(orderId),
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    const storeIndex = order.stores.findIndex(
      (s) => s.storeId.toString() === storeId && s.storeEmail === sellerEmail
    );

    if (storeIndex === -1) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to update this store order",
      });
    }

    const store = order.stores[storeIndex];
    const currentStatus = store.storeOrderStatus;

    const allowedTransitions = {
      pending: ["confirmed"],
      confirmed: ["prepared"],
    };

    if (!allowedTransitions[currentStatus]?.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Cannot change status from ${currentStatus} to ${status}`,
      });
    }

    // Update the specific store's status
    const updateResult = await orders.updateOne(
      {
        _id: new ObjectId(orderId),
        "stores.storeId": new ObjectId(storeId),
      },
      {
        $set: {
          "stores.$.storeOrderStatus": status,
          "stores.$.updatedAt": new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      }
    );

    if (updateResult.modifiedCount === 0) {
      return res.status(500).json({
        success: false,
        message: "Failed to update order status",
      });
    }

    // Fetch the updated order to check all stores' statuses
    const updatedOrder = await orders.findOne({
      _id: new ObjectId(orderId),
    });

    // Check if all stores have the same status
    const allStoreStatuses = updatedOrder.stores.map((s) => s.storeOrderStatus);
    const allConfirmed = allStoreStatuses.every((s) => s === "confirmed");
    const allPrepared = allStoreStatuses.every((s) => s === "prepared");

    // Update main order status based on all stores
    let newOrderStatus = updatedOrder.orderStatus;
    if (allPrepared) {
      newOrderStatus = "prepared";
    } else if (allConfirmed) {
      newOrderStatus = "confirmed";
    }

    // Update the main order status if it changed
    if (newOrderStatus !== updatedOrder.orderStatus) {
      await orders.updateOne(
        { _id: new ObjectId(orderId) },
        {
          $set: {
            orderStatus: newOrderStatus,
            updatedAt: new Date().toISOString(),
          },
        }
      );
    }

    res.status(200).json({
      success: true,
      message: `Order status updated to ${status}`,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to update order status",
    });
  }
};