export const verifyCustomerAndSeller = (req, res, next) => {
  if (!["seller", "customer"].includes(req.user.role)) {
    return res
      .status(403)
      .send({ message: "Forbidden: Customers and sellers only" });
  }
  next();
};