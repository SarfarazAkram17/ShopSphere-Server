import { ObjectId } from "mongodb";
import connectDB from "../config/db.js";

const { orders, products } = await connectDB();

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
          (newStoreTotal - store.platformCommissionAmount).toFixed(2)
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
    const { page = 0, limit = 10, searchTerm = "", status } = req.query;

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = pageNum * limitNum;

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