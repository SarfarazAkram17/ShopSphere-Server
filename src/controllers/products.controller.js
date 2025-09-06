export const addProduct = async (req, res, sellers, products) => {
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