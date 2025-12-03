import connectDB from "../config/db.js";

const { orders } = await connectDB();

export const getAllOrders = async (req, res) => {
  try {
    const allOrders = await orders.find().toArray();
    res.send(allOrders);
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};