export const getUserRole = async (req, res, users) => {
  try {
    const email = req.params.email;

    if (!email) {
      return res.status(400).send({ message: "Email is required" });
    }

    const user = await users.findOne({ email });

    if (!user) {
      return res.status(404).send({ message: "User not found" });
    }

    res.send({ role: user.role });
  } catch (error) {
    res.status(500).send({ message: error.message });
  }
};

export const createUser = async (req, res, users) => {
  const user = req.body;
  const email = user.email;

  const userExists = await users.findOne({ email });

  if (userExists) {
    const updateResult = await users.updateOne(
      { email },
      { $set: { last_log_in: user.last_log_in } }
    );
    return res.status(200).send({
      message: "User already exists, last_log_in updated",
      updated: updateResult.modifiedCount > 0,
    });
  }

  const result = await users.insertOne(user);
  res.send(result);
};