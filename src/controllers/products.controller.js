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