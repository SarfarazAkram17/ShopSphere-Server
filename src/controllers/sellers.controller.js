import { ObjectId } from "mongodb";
import connectDB from "../config/db.js";

const { sellers, riders, users, products } = await connectDB();

export const getPendingSellers = async (req, res) => {
  try {
    let {
      page = 0,
      limit = 10,
      region,
      district,
      searchType = "name",
      search = "",
    } = req.query;

    page = parseInt(page);
    limit = parseInt(limit);

    const skip = page * limit;

    const query = { status: "pending" };

    if (search) {
      const regex = new RegExp(search, "i");
      if (searchType === "email") {
        query.email = regex;
      } else {
        query.name = regex;
      }
    }

    if (region) {
      query.region = region;
    }
    if (district) {
      query.district = district;
    }

    const total = await sellers.countDocuments(query);
    const pendingSellers = await sellers
      .find(query)
      .skip(skip)
      .limit(limit)
      .toArray();
    res.send({ pendingSellers, total });
  } catch (error) {
    res.status(500).send({ message: "Failed to load pending sellers" });
  }
};

export const getSellers = async (req, res) => {
  try {
    let {
      page = 0,
      limit = 10,
      region,
      district,
      searchType = "name",
      search = "",
    } = req.query;

    page = parseInt(page);
    limit = parseInt(limit);

    const skip = page * limit;

    const query = { status: { $ne: "pending" } };

    if (search) {
      const regex = new RegExp(search, "i");
      if (searchType === "email") {
        query.email = regex;
      } else {
        query.name = regex;
      }
    }

    if (region) {
      query.region = region;
    }
    if (district) {
      query.district = district;
    }

    const total = await sellers.countDocuments(query);
    const notPendingSellers = await sellers
      .find(query)
      .skip(skip)
      .limit(limit)
      .toArray();
    res.send({ sellers: notPendingSellers, total });
  } catch (error) {
    res.status(500).send({ message: "Failed to load sellers" });
  }
};

export const getStore = async (req, res) => {
  try {
    const { email } = req.query;
    const store = await sellers.findOne({ email });
    res.send(store);
  } catch (error) {
    res.status(500).send({ message: error.message });
  }
};

export const applyForSeller = async (req, res) => {
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

export const updateStore = async (req, res) => {
  const { storeId } = req.params;

  const query = { _id: new ObjectId(storeId) };
  const store = await sellers.findOne(query);

  if (store.email !== req.query.email) {
    return res.status(403).send({
      message:
        "You are not allowded to update other seller's store or personal informations",
    });
  }

  const updatedDoc = { $set: req.body };

  try {
    const result = await sellers.updateOne(query, updatedDoc);

    // update store names on products
    if (req.body.storeName && req.body.storeName !== store.storeName) {
      const productUpdateResult = await products.updateMany(
        { storeId: storeId },
        { $set: { storeName: req.body.storeName } }
      );
    }

    res.send(result);
  } catch (err) {
    res.status(500).send({ message: err.message });
  }
};

export const updateSellerStatus = async (req, res) => {
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
      $unset: {
        deactiveAt: "",
      },
    };
  }
  if (status === "deactive") {
    updatedDoc = {
      $set: {
        status,
        work_status: "not available",
        deactiveAt: new Date().toISOString(),
      },
      $unset: {
        activeAt: "",
      },
    };
  }

  try {
    const result = await sellers.updateOne(query, updatedDoc);
    if (status === "active") {
      const userQuery = { email };
      const updatedUserDoc = { $set: { role: "seller" } };
      await users.updateOne(userQuery, updatedUserDoc);
    }

    res.send(result);
  } catch (err) {
    res.status(500).send({ message: "Failed to update seller status" });
  }
};

export const rejectSeller = async (req, res) => {
  try {
    const query = { _id: new ObjectId(req.params.id) };
    const result = await sellers.deleteOne(query);
    res.send(result);
  } catch (err) {
    res.status(500).send({ message: "Failed to update rider status" });
  }
};