import jwt from "jsonwebtoken";

const generateToken = (res, userId) => {
  const token = jwt.sign({ userId }, process.env.JWT_SECRET_KEY, {
    expiresIn: "30d",
  });
  res.cookie("backend_token", token, {
    // httpOnly: true,
    // secure: false,
    // sameSite: "none",
    maxAge: 30 * 24 * 60 * 60 * 1000,
  });
  return token;
};

export default generateToken;
