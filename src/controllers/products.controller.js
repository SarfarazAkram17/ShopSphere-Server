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

export const getAllProducts = async (req, res) => {
  try {
    let { page = 0, limit = 10, search, searchType, sort } = req.query;

    page = parseInt(page);
    limit = parseInt(limit);

    const skip = page * limit;

    const query = {};

    if (search) {
      const regex = new RegExp(search, "i");
      if (searchType === "seller email") {
        query.sellerEmail = regex;
      } else if (searchType === "product name") {
        query.name = regex;
      } else if (searchType === "storeId") {
        query.storeId = regex;
      } else {
        query.storeName = regex;
      }
    }

    const sorting = sort === "priceDesc" ? -1 : 1;

    const total = await products.countDocuments(query);
    const allProducts = await products
      .find(query)
      .skip(skip)
      .sort({ price: sorting })
      .limit(limit)
      .toArray();
    res.send({ allProducts, total });
  } catch (error) {
    res
      .status(500)
      .send({ message: "Failed to fetch products", error: err.message });
  }
};

export const getSingleProduct = async (req, res) => {
  const { id } = req.params;
  const result = await products.findOne({ _id: new ObjectId(id) });
  res.send(result);
};

export const addProduct = async (req, res) => {
  try {
    const { sellerEmail } = req.body;
    const seller = await sellers.findOne({ email: sellerEmail });

    const newProduct = {
      storeId: seller._id.toString(),
      storeName: seller.storeName,
      ...req.body,
    };

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
      name,
      price,
      discount,
      description,
      stock,
      category,
      color,
      size,
      imagesToAdd = [],
      imagesToRemove = [],
    } = req.body;

    const query = { _id: new ObjectId(productId) };
    const product = await products.findOne(query);

    if (product.sellerEmail !== req.query.email) {
      return res.status(403).send({
        message: "You are not allowded to update other seller's product",
      });
    }

    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    // Step 1: Apply $set and $pull
    const update1 = {
      $set: {
        name,
        price,
        discount,
        description,
        stock,
        category,
        color,
        size,
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
    res.status(500).json({ error: error.message });
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