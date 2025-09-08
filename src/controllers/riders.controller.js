import { ObjectId } from "mongodb";
import connectDB from "../config/db.js";

const { riders, sellers, users } = await connectDB();

export const getPendingRiders = async (req, res) => {
  try {
    let { page = 1, limit = 10 } = req.query;

    page = parseInt(page);
    limit = parseInt(limit);

    const skip = (page - 1) * limit;
    const total = await riders.countDocuments({
      status: "pending",
    });

    const pendingRiders = await riders
      .find({ status: "pending" })
      .skip(skip)
      .limit(limit)
      .toArray();
    res.send({ pendingRiders, total });
  } catch (error) {
    res.status(500).send({ message: "Failed to load pending riders" });
  }
};

export const applyForRider = async (req, res) => {
  try {
    const {
      name,
      email,
      age,
      phone,
      experience,
      region,
      district,
      thana,
      stripeAccountId,
      status,
      appliedAt,
    } = req.body;

    // Check if seller already exists
    const existingSeller = await sellers.findOne({ email });
    const existingRider = await riders.findOne({ email });

    if (existingSeller) {
      return res.status(409).json({
        message: "You have already applied for seller.",
      });
    }

    if (existingRider) {
      return res.status(409).json({
        message: "You have already applied. Please wait for approval.",
      });
    }

    // Insert new rider
    const result = await riders.insertOne({
      name,
      email,
      age,
      phone,
      experience,
      region,
      district,
      thana,
      stripeAccountId,
      status,
      appliedAt,
    });

    if (result.insertedId) {
      return res.status(201).json({ insertedId: result.insertedId });
    } else {
      return res
        .status(500)
        .json({ message: "Failed to submit application, try again." });
    }
  } catch (err) {
    return res
      .status(500)
      .json({ message: "Server error", error: err.message });
  }
};

export const updateRiderStatus = async (req, res) => {
  const { id } = req.params;
  const { status = "active", email } = req.body;
  const query = { _id: new ObjectId(id) };

  let updatedDoc = {};
  if (status === "active") {
    updatedDoc = {
      $set: {
        status,
        work_status: "available",
        activeAt: new Date().toISOString(),
      },
    };
  }
  if (status === "deactive") {
    updatedDoc = {
      $set: {
        status,
        work_status: "not_available",
        deactiveAt: new Date().toISOString(),
      },
    };
  }

  try {
    const result = await riders.updateOne(query, updatedDoc);
    const userQuery = { email };
    const updatedUserDoc = { $set: { role: "rider" } };
    await users.updateOne(userQuery, updatedUserDoc);

    res.send(result);
  } catch (err) {
    res.status(500).send({ message: "Failed to update rider status" });
  }
};

export const rejectRider = async (req, res) => {
  try {
    const query = { _id: new ObjectId(req.params.id) };
    const result = await riders.deleteOne(query);
    res.send(result);
  } catch (err) {
    res.status(500).send({ message: "Failed to update rider status" });
  }
};
