export const getAllUsers = async (req, res, users) => {
  try {
    let {
      page = 1,
      limit = 10,
      search = "",
      searchType = "name",
      role = "",
    } = req.query;

    page = parseInt(page);
    limit = parseInt(limit);

    const query = {};

    if (search) {
      const regex = new RegExp(search, "i");
      if (searchType === "email") {
        query.email = regex;
      } else {
        query.name = regex;
      }
    }

    if (role) {
      query.role = role;
    }

    const skip = (page - 1) * limit;
    const total = await users.countDocuments(query);
    const allUsers = await users.find(query).skip(skip).limit(limit).toArray();

    res.send({ allUsers, total });
  } catch (err) {
    res.status(500).send({ message: "Server error", error: err.message });
  }
};

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

export const updateProfile = async (req, res, users) => {
  try {
    const { name, photo } = req.body;
    const { email } = req.query;

    if (!email) {
      return res
        .status(400)
        .send({ success: false, message: "Email is required." });
    }

    const query = { email };
    const updateDoc = { $set: { name, photo } };

    const result = await users.updateOne(query, updateDoc);
    res.send(result);
  } catch (error) {
    res.status(500).send({
      success: false,
      message: error.message,
    });
  }
};