import { ObjectId } from "mongodb";
import connectDB from "../config/db.js";

const { users } = await connectDB();

export const getUserAddresses = async (req, res) => {
  try {
    const email = req.user.email;

    if (!email) {
      return res.status(400).send({ message: "Email is required" });
    }

    const user = await users.findOne({ email });

    res.send(user.addresses || []);
  } catch (error) {
    res.status(500).send({ message: error.message });
  }
};

export const addUserAddresses = async (req, res) => {
  try {
    const email = req.user.email;
    const newAddress = req.body;

    if (!email) {
      return res.status(400).send({ message: "Email is required" });
    }

    // Validate required fields from frontend
    if (
      !newAddress.name ||
      !newAddress.phone ||
      !newAddress.region ||
      !newAddress.district ||
      !newAddress.thana ||
      !newAddress.address
    ) {
      return res
        .status(400)
        .send({ message: "All required fields must be provided" });
    }

    // Set default label if not provided
    if (!newAddress.label) {
      newAddress.label = "HOME";
    }

    // Find user
    const user = await users.findOne({ email });

    if (!user) {
      return res.status(404).send({ message: "User not found" });
    }

    // Create address object with all fields from frontend
    const addressToAdd = {
      _id: new ObjectId(),
      name: newAddress.name,
      phone: newAddress.phone,
      region: newAddress.region,
      district: newAddress.district,
      thana: newAddress.thana,
      building: newAddress.building || "",
      colony: newAddress.colony || "",
      address: newAddress.address,
      label: newAddress.label,
      isDefaultShipping: false,
      isDefaultBilling: false,
    };

    // If this is the first address, make it default for both shipping and billing
    if (!user.addresses || user.addresses.length === 0) {
      addressToAdd.isDefaultShipping = true;
      addressToAdd.isDefaultBilling = true;
    }

    // Update user with new address
    const updateOperation =
      user.addresses && user.addresses.length > 0
        ? { $push: { addresses: addressToAdd } }
        : { $set: { addresses: [addressToAdd] } };

    const updatedUser = await users.updateOne({ email }, updateOperation);

    res.status(201).send({
      message: "Address added successfully",
    });
  } catch (error) {
    res.status(500).send({ message: error.message });
  }
};

export const updateUserAddress = async (req, res) => {
  try {
    const email = req.user.email;
    const addressId = req.params.id;
    const updatedAddress = req.body;

    if (!email) {
      return res.status(400).send({ message: "Email is required" });
    }

    if (!addressId) {
      return res.status(400).send({ message: "Address ID is required" });
    }

    // Validate required fields
    if (
      !updatedAddress.name ||
      !updatedAddress.phone ||
      !updatedAddress.region ||
      !updatedAddress.district ||
      !updatedAddress.thana ||
      !updatedAddress.address
    ) {
      return res
        .status(400)
        .send({ message: "All required fields must be provided" });
    }

    // Find user
    const user = await users.findOne({ email });

    if (!user) {
      return res.status(404).send({ message: "User not found" });
    }

    // Check if address exists
    const addressExists = user.addresses?.some(
      (addr) => addr._id.toString() === addressId
    );

    if (!addressExists) {
      return res.status(404).send({ message: "Address not found" });
    }

    // Update the specific address
    const result = await users.updateOne(
      { email, "addresses._id": new ObjectId(addressId) },
      {
        $set: {
          "addresses.$.name": updatedAddress.name,
          "addresses.$.phone": updatedAddress.phone,
          "addresses.$.region": updatedAddress.region,
          "addresses.$.district": updatedAddress.district,
          "addresses.$.thana": updatedAddress.thana,
          "addresses.$.building": updatedAddress.building || "",
          "addresses.$.address": updatedAddress.address,
          "addresses.$.label": updatedAddress.label || "HOME",
        },
      }
    );

    if (result.modifiedCount === 0) {
      return res.status(400).send({ message: "Failed to update address" });
    }

    res.send({
      message: "Address updated successfully",
    });
  } catch (error) {
    res.status(500).send({ message: error.message });
  }
};

export const deleteUserAddress = async (req, res) => {
  try {
    const email = req.user.email;
    const addressId = req.params.id;

    if (!email) {
      return res.status(400).send({ message: "Email is required" });
    }

    if (!addressId) {
      return res.status(400).send({ message: "Address ID is required" });
    }

    // Find user
    const user = await users.findOne({ email });

    if (!user) {
      return res.status(404).send({ message: "User not found" });
    }

    // Check if address exists
    const addressToDelete = user.addresses?.find(
      (addr) => addr._id.toString() === addressId
    );

    if (!addressToDelete) {
      return res.status(404).send({ message: "Address not found" });
    }

    // Remove the address
    const result = await users.updateOne(
      { email },
      { $pull: { addresses: { _id: new ObjectId(addressId) } } }
    );

    if (result.modifiedCount === 0) {
      return res.status(400).send({ message: "Failed to delete address" });
    }

    // If the deleted address was a default, set the first remaining address as default
    if (addressToDelete.isDefaultShipping || addressToDelete.isDefaultBilling) {
      const updatedUser = await users.findOne({ email });

      if (updatedUser.addresses && updatedUser.addresses.length > 0) {
        const updateDefaults = {};

        if (addressToDelete.isDefaultShipping) {
          updateDefaults["addresses.0.isDefaultShipping"] = true;
        }

        if (addressToDelete.isDefaultBilling) {
          updateDefaults["addresses.0.isDefaultBilling"] = true;
        }

        if (Object.keys(updateDefaults).length > 0) {
          await users.updateOne({ email }, { $set: updateDefaults });
        }
      }
    }

    res.send({
      message: "Address deleted successfully",
    });
  } catch (error) {
    res.status(500).send({ message: error.message });
  }
};

export const setDefaultShippingAddress = async (req, res) => {
  try {
    const email = req.user.email;
    const addressId = req.params.id;

    if (!email) {
      return res.status(400).send({ message: "Email is required" });
    }

    if (!addressId) {
      return res.status(400).send({ message: "Address ID is required" });
    }

    // Find user
    const user = await users.findOne({ email });

    if (!user) {
      return res.status(404).send({ message: "User not found" });
    }

    // Check if address exists
    const addressExists = user.addresses?.some(
      (addr) => addr._id.toString() === addressId
    );

    if (!addressExists) {
      return res.status(404).send({ message: "Address not found" });
    }

    // Set all addresses isDefaultShipping to false
    await users.updateOne(
      { email },
      { $set: { "addresses.$[].isDefaultShipping": false } }
    );

    // Set the selected address as default shipping
    const result = await users.updateOne(
      { email, "addresses._id": new ObjectId(addressId) },
      { $set: { "addresses.$.isDefaultShipping": true } }
    );

    if (result.modifiedCount === 0) {
      return res
        .status(400)
        .send({ message: "Failed to set default shipping address" });
    }

    res.send({
      message: "Default shipping address updated successfully",
    });
  } catch (error) {
    res.status(500).send({ message: error.message });
  }
};

export const setDefaultBillingAddress = async (req, res) => {
  try {
    const email = req.user.email;
    const addressId = req.params.id;

    if (!email) {
      return res.status(400).send({ message: "Email is required" });
    }

    if (!addressId) {
      return res.status(400).send({ message: "Address ID is required" });
    }

    // Find user
    const user = await users.findOne({ email });

    if (!user) {
      return res.status(404).send({ message: "User not found" });
    }

    // Check if address exists
    const addressExists = user.addresses?.some(
      (addr) => addr._id.toString() === addressId
    );

    if (!addressExists) {
      return res.status(404).send({ message: "Address not found" });
    }

    // Set all addresses isDefaultBilling to false
    await users.updateOne(
      { email },
      { $set: { "addresses.$[].isDefaultBilling": false } }
    );

    // Set the selected address as default billing
    const result = await users.updateOne(
      { email, "addresses._id": new ObjectId(addressId) },
      { $set: { "addresses.$.isDefaultBilling": true } }
    );

    if (result.modifiedCount === 0) {
      return res
        .status(400)
        .send({ message: "Failed to set default billing address" });
    }

    res.send({
      message: "Default billing address updated successfully",
    });
  } catch (error) {
    res.status(500).send({ message: error.message });
  }
};