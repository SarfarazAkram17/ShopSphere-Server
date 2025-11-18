import { ObjectId } from "mongodb";
import connectDB from "../config/db.js";
import stripe from "../config/stripe.js";

const { orders, payments } = await connectDB();

export const createPaymentIntent = async (req, res) => {
  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: req.body.amount,
      currency: "bdt",
      payment_method_types: ["card"],
    });
    res.json({ clientSecret: paymentIntent.client_secret });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const createPayment = async (req, res) => {
  try {
    const { email } = req.user;
    const { orderId, amount, paymentMethod, transactionId, paymentStatus } =
      req.body;

    const paymentDoc = {
      orderId,
      email,
      amount,
      paymentMethod,
      transactionId,
      paidAt: new Date().toISOString(),
      status: "payment done",
    };

    const paymentResult = await payments.insertOne(paymentDoc);

    const updateOrder = await orders.updateOne(
      { _id: new ObjectId(orderId) },
      {
        $set: {
          paymentMethod,
          transactionId,
          paymentStatus,
          orderStatus: 'confirmed',
          'stores.$[].storeOrderStatus': 'confirmed',
          paymentId: paymentResult.insertedId,
          paidAt: new Date().toISOString(),
        },
      }
    );

    res.status(201).send({
      message: "Payment recorded and order marked as paid",
      insertedId: paymentResult.insertedId,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};