export const verifySeller = (req, res, next) => {
  if (req.user.role !== "seller") {
    return res.status(403).send({ message: "Forbidden: Store Owners only" });
  }
  next();
};