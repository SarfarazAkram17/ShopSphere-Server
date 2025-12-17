import { ObjectId } from "mongodb";
import connectDB from "../config/db.js";

const { orders } = await connectDB();

export const getAllOrders = async (req, res) => {
  try {
    const {
      page = 0,
      limit = 10,
      searchTerm = "",
      status,
      paymentStatus,
    } = req.query;

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = pageNum * limitNum;

    // Build query filters
    const query = {};

    if (searchTerm && searchTerm.trim() !== "") {
      const trimmedSearch = searchTerm.trim();
      const searchRegex = new RegExp(trimmedSearch, "i");

      // Build $or array for search conditions
      const searchConditions = [
        { "stores.storeName": searchRegex }, // Search by store name
        { "stores.items.productName": searchRegex }, // Search by product name
        { "shippingAddress.name": searchRegex }, // Search by customer name
        { "shippingAddress.email": searchRegex }, // Search by customer email
        { "shippingAddress.phone": searchRegex }, // Search by phone
      ];

      // Check if searchTerm is a valid ObjectId (24 hex characters)
      if (ObjectId.isValid(trimmedSearch)) {
        searchConditions.push({ _id: new ObjectId(trimmedSearch) });
      }

      query.$or = searchConditions;
    }

    // Order status filter
    if (status && status !== "all") {
      query.orderStatus = status;
    }

    // Payment status filter
    if (paymentStatus && paymentStatus !== "all") {
      query.paymentStatus = paymentStatus;
    }

    const total = await orders.countDocuments(query);

    const allOrders = await orders
      .find(query)
      .sort({ createdAt: -1 }) // Latest orders first
      .skip(skip)
      .limit(limitNum)
      .toArray();

    // Calculate statistics
    const statsAggregation = await orders
      .aggregate([
        {
          $facet: {
            // Order status stats
            orderStatus: [
              {
                $group: {
                  _id: "$orderStatus",
                  count: { $sum: 1 },
                },
              },
            ],
            // Payment status stats
            paymentStatus: [
              {
                $group: {
                  _id: "$paymentStatus",
                  count: { $sum: 1 },
                },
              },
            ],
            // Total count
            total: [
              {
                $count: "count",
              },
            ],
          },
        },
      ])
      .toArray();

    // Format stats
    const stats = {
      all: statsAggregation[0]?.total[0]?.count || 0,
      pending: 0,
      confirmed: 0,
      prepared: 0,
      shipped: 0,
      delivered: 0,
      cancelled: 0,
      paid: 0,
      unpaid: 0,
    };

    // Populate order status counts
    statsAggregation[0]?.orderStatus.forEach((item) => {
      if (item._id) {
        stats[item._id] = item.count;
      }
    });

    // Populate payment status counts
    statsAggregation[0]?.paymentStatus.forEach((item) => {
      if (item._id) {
        stats[item._id] = item.count;
      }
    });

    res.status(200).json({
      success: true,
      allOrders,
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