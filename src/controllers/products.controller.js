import { ObjectId } from "mongodb";
import connectDB from "../config/db.js";

const { sellers, products } = await connectDB();

export const getMyProduct = async (req, res) => {
  try {
    let { page = 1, limit = 12, email } = req.query;
    page = parseInt(page);
    limit = parseInt(limit);
    const skip = (page - 1) * limit;

    const store = await sellers.findOne({ email });
    const query = { storeId: store._id.toString() };

    const total = await products.countDocuments(query);
    const myProducts = await products
      .find(query)
      .sort({ addedAt: -1 })
      .skip(skip)
      .limit(limit)
      .toArray();

    res.send({ myProducts, total });
  } catch (err) {
    res
      .status(500)
      .send({ message: "Failed to fetch products", error: err.message });
  }
};

export const addProduct = async (req, res) => {
  try {
    const { sellerEmail } = req.body;
    const seller = await sellers.findOne({ email: sellerEmail });

    const newProduct = { storeId: seller._id.toString(), ...req.body };

    const result = await products.insertOne(newProduct);
    const productId = result.insertedId;

    res.status(201).json({
      message: "Product added successfully",
      productId,
    });
  } catch (_) {
    res.status(500).json({ error: "Internal server error" });
  }
};

export const updateProduct = async (req, res) => {
  try {
    const productId = req.params.id;
    const {
      title,
      description,
      location,
      imagesToAdd = [],
      imagesToRemove = [],
    } = req.body;

    const query = { _id: new ObjectId(productId) };
    const product = await products.findOne(query);

    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    // Step 1: Apply $set and $pull
    const update1 = {
      $set: {
        title,
        description,
        location,
        updatedAt: new Date().toISOString(),
      },
    };

    if (imagesToRemove.length > 0) {
      update1.$pull = {
        images: { $in: imagesToRemove },
      };
    }

    await products.updateOne(query, update1);

    // Step 2: Apply $push (if any)
    if (imagesToAdd.length > 0) {
      const update2 = {
        $push: {
          images: { $each: imagesToAdd },
        },
      };
      await products.updateOne(query, update2);
    }

    res.send({ success: true, message: "Product updated successfully" });
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
};

export const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const query = { _id: new ObjectId(id) };
    const product = await products.findOne(query);

    if (product.sellerEmail !== req.query.email) {
      return res.status(403).send({
        message: "You are not allowded to delete other seller's product",
      });
    }

    const result = await products.deleteOne(query);
    res.send(result);
  } catch (err) {
    res
      .status(500)
      .send({ message: "Failed to delete product", error: err.message });
  }
};
