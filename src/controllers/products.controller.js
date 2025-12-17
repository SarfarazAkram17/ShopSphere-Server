import { ObjectId } from "mongodb";
import connectDB from "../config/db.js";

const { sellers, products } = await connectDB();

export const getMyProduct = async (req, res) => {
  try {
    let { page = 0, limit = 12, email } = req.query;
    page = parseInt(page);
    limit = parseInt(limit);
    const skip = page * limit;

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
      } else if (searchType === "productId") {
        query._id = new ObjectId(search);
      } else if (searchType === "storeId") {
        query.storeId = regex;
      } else {
        query.storeName = regex;
      }
    }

    const sorting = { price: sort === "priceDesc" ? -1 : 1 };

    const total = await products.countDocuments(query);
    const allProducts = await products
      .find(query)
      .skip(skip)
      .sort(sorting)
      .limit(limit)
      .toArray();
    res.send({ allProducts, total });
  } catch (error) {
    res
      .status(500)
      .send({ message: "Failed to fetch products", error: error.message });
  }
};

export const getProducts = async (req, res) => {
  try {
    let {
      page = 0,
      limit = 12,
      search,
      category,
      color,
      size,
      minPrice,
      maxPrice,
      discount,
      minRating,
    } = req.query;

    page = parseInt(page);
    limit = parseInt(limit);

    // Build $match filter (excluding price because we’ll use discountedPrice)
    const matchFilter = { status: "active" };

    // Search filter
    if (search) {
      matchFilter.$or = [
        { name: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }

    // Category filter
    if (category) {
      category = category.split(",");
      matchFilter.category = { $in: category };
    }

    // Color filter
    if (color) {
      matchFilter.color = { $in: Array.isArray(color) ? color : [color] };
    }

    // Size filter
    if (size) {
      matchFilter.size = { $in: Array.isArray(size) ? size : [size] };
    }

    // Discount filter
    if (discount) {
      matchFilter.discount = { $gte: Number(discount) };
    }

    // Rating filter
    if (minRating) {
      matchFilter.rating = { $gte: Number(minRating) };
    }

    // Build aggregation
    const pipeline = [
      {
        $addFields: {
          discountedPrice: {
            $cond: {
              if: { $gt: ["$discount", 0] },
              then: {
                $subtract: [
                  "$price",
                  { $multiply: ["$price", { $divide: ["$discount", 100] }] },
                ],
              },
              else: "$price",
            },
          },
        },
      },
      {
        $match: matchFilter,
      },
    ];

    // Price filter using discountedPrice
    if (minPrice || maxPrice) {
      const priceFilter = {};
      if (minPrice) priceFilter.$gte = Number(minPrice);
      if (maxPrice) priceFilter.$lte = Number(maxPrice);
      pipeline.push({
        $match: { discountedPrice: priceFilter },
      });
    }

    // Count total documents
    const totalAgg = await products
      .aggregate([...pipeline, { $count: "total" }])
      .toArray();
    const total = totalAgg.length > 0 ? totalAgg[0].total : 0;

    // Paginated data
    const allProducts = await products
      .aggregate([
        ...pipeline,
        { $sort: { addedAt: -1 } },
        { $skip: page * limit },
        { $limit: limit },
      ])
      .toArray();

    res.json({ allProducts, total });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getOfferedProducts = async (req, res) => {
  try {
    let {
      page = 0,
      limit = 12,
      search,
      category,
      color,
      size,
      minPrice,
      maxPrice,
      discount,
      minRating,
    } = req.query;

    page = parseInt(page);
    limit = parseInt(limit);

    // Build $match filter (excluding price because we’ll use discountedPrice)
    const matchFilter = { status: "active", discount: { $gt: 0 } };

    // Search filter
    if (search) {
      matchFilter.$or = [
        { name: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }

    // Category filter
    if (category) {
      category = category.split(",");
      matchFilter.category = { $in: category };
    }

    // Color filter
    if (color) {
      matchFilter.color = { $in: Array.isArray(color) ? color : [color] };
    }

    // Size filter
    if (size) {
      matchFilter.size = { $in: Array.isArray(size) ? size : [size] };
    }

    // Discount filter
    if (discount) {
      matchFilter.discount = { $gte: Number(discount) };
    }

    // Rating filter
    if (minRating) {
      matchFilter.rating = { $gte: Number(minRating) };
    }

    // Build aggregation
    const pipeline = [
      {
        $addFields: {
          discountedPrice: {
            $cond: {
              if: { $gt: ["$discount", 0] },
              then: {
                $subtract: [
                  "$price",
                  { $multiply: ["$price", { $divide: ["$discount", 100] }] },
                ],
              },
              else: "$price",
            },
          },
        },
      },
      {
        $match: matchFilter,
      },
    ];

    // Price filter using discountedPrice
    if (minPrice || maxPrice) {
      const priceFilter = {};
      if (minPrice) priceFilter.$gte = Number(minPrice);
      if (maxPrice) priceFilter.$lte = Number(maxPrice);
      pipeline.push({
        $match: { discountedPrice: priceFilter },
      });
    }

    // Count total documents
    const totalAgg = await products
      .aggregate([...pipeline, { $count: "total" }])
      .toArray();
    const total = totalAgg.length > 0 ? totalAgg[0].total : 0;

    // Paginated data
    const allProducts = await products
      .aggregate([
        ...pipeline,
        { $sort: { addedAt: -1 } },
        { $skip: page * limit },
        { $limit: limit },
      ])
      .toArray();

    res.json({ allProducts, total });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getSingleProduct = async (req, res) => {
  try {
    const { id } = req.params;

    const product = await products.findOne({ _id: new ObjectId(id) });
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    const store = await sellers.findOne({ _id: new ObjectId(product.storeId) });
    if (!store) {
      return res.status(404).json({ message: "Store not found" });
    }

    // Get random products from same store (excluding the current one)
    const sameStoreProducts = await products
      .aggregate([
        {
          $match: {
            storeId: store._id.toString(),
            _id: { $ne: new ObjectId(id) }, // exclude the current product
          },
        },
        { $sample: { size: 6 } },
      ])
      .toArray();

    // Random 6 products from same category
    const relevantProducts = await products
      .aggregate([
        {
          $match: {
            category: { $in: product.category },
            _id: { $ne: new ObjectId(id) },
            storeId: { $ne: store._id.toString() },
          },
        },
        { $sample: { size: 6 } },
      ])
      .toArray();

    res.send({ product, sameStoreProducts, relevantProducts });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const addProduct = async (req, res) => {
  try {
    const { sellerEmail } = req.body;
    const seller = await sellers.findOne({ email: sellerEmail });

    const newProduct = {
      storeId: seller._id.toString(),
      storeName: seller.storeName,
      ...req.body,
      status: "active",
    };

    const result = await products.insertOne(newProduct);
    const productId = result.insertedId;

    res.status(201).json({
      message: "Product added successfully",
      productId,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
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
        updatedAt: new Date().toISOString(),
      },
    };

    if (size) {
      update1.$set.size = size;
    }

    if (color) {
      update1.$set.color = color;
    }

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
    res.status(500).json({ message: error.message });
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