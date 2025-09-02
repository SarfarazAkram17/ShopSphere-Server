export const verifyStoreOwner = (req, res, next) => {
  if (req.user.role !== "store owner") {
    return res.status(403).send({ message: "Forbidden: Store Owners only" });
  }
  next();
};