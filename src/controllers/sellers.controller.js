export const applyForSeller = async (req, res, sellers) => {
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
    const existingSeller = await sellers.findOne({ email });

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