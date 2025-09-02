export const applyForRider = async (req, res, sellers, riders) => {
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
        message:
          "You have already applied for seller.",
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