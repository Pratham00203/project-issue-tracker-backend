const jwt = require("jsonwebtoken");
require("dotenv").config();

module.exports = function (req, res, next) {
  const token = req.header("x-auth-token");

  if (!token) {
    return res.status(401).json({ error: "No Token! User unauthorized" });
  }

  try {
    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
      if (err) {
        return res.status(401).json({ error: "Token is not Valid" });
      } else {
        req.user = decoded.user;
        next();
      }
    });
  } catch (error) {
    console.error("Something wrong with Auth middleware");
    return res.status(500).json({ error: "Server Error" });
  }
};
