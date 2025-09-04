import { ObjectId } from "mongodb";

export const getPendingSellers = async (req, res, sellers) => {
  try {
    let { page = 1, limit = 10 } = req.query;

    page = parseInt(page);
    limit = parseInt(limit);

    const skip = (page - 1) * limit;
    const total = await sellers.countDocuments({
      status: "pending",
    });

    const pendingSellers = await sellers
      .find({ status: "pending" })
      .skip(skip)
      .limit(limit)
      .toArray();
    res.send({ pendingSellers, total });
  } catch (error) {
    res.status(500).send({ message: "Failed to load pending sellers" });
  }
};

export const applyForSeller = async (req, res, sellers, riders) => {
  try {
    const {
      name,
      email,
      age,
      phone,
      experience,
      storeAddress,
      region,
      district,
      thana,
      storeName,
      storeLogo,
      coverImage,
      categories,
      stripeAccountId,
      status,
      appliedAt,
    } = req.body;

    // Check if seller already exists
    const existingRider = await riders.findOne({ email });
    const existingSeller = await sellers.findOne({ email });

    if (existingRider) {
      return res.status(409).json({
        message: "You have already applied for rider.",
      });
    }

    if (existingSeller) {
      return res.status(409).json({
        message: "You have already applied. Please wait for approval.",
      });
    }

    // Insert new seller
    const result = await sellers.insertOne({
      name,
      email,
      age,
      phone,
      experience,
      storeAddress,
      region,
      district,
      thana,
      storeName,
      storeLogo,
      coverImage,
      categories,
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

export const updateSellerStatus = async (req, res, users, sellers) => {
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
    const result = await sellers.updateOne(query, updatedDoc);
    const userQuery = { email };
    const updatedUserDoc = { $set: { role: "seller" } };
    await users.updateOne(userQuery, updatedUserDoc);

    res.send(result);
  } catch (err) {
    res.status(500).send({ message: "Failed to update seller status" });
  }
};

export const rejectSeller = async (req, res, sellers) => {
  try {
    const query = { _id: new ObjectId(req.params.id) };
    const result = await sellers.deleteOne(query);
    res.send(result);
  } catch (err) {
    res.status(500).send({ message: "Failed to update rider status" });
  }
};