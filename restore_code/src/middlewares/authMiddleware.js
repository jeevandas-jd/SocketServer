const { verifyToken } = require("../utils/jwtUtils");

exports.protect = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "No token provided" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = verifyToken(token);
    req.user = decoded; // {id, role}
    next();
  } catch (err) {
    res.status(401).json({ message: "Invalid or expired token" });
  }
};
