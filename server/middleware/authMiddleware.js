import jwt from "jsonwebtoken";
import asyncHandler from "express-async-handler";
import User from "../models/userModel.js";

const protect = asyncHandler(async (req, res, next) => {
  let token;

  token = req.cookies.jwt_token;
  const backend_token = req.cookies.backend_token;
  if (backend_token) {
    try {
      const decoded = jwt.verify(backend_token, process.env.JWT_SECRET_KEY);
      req.user = await User.findById(decoded.userId).select("-password");
      next();
    } catch (err) {
      res.status(401);
      throw new Error("Invalid Token");
    }
  } else {
    res.status(401);
    throw new Error("no Token");
  }
});

export { protect };
