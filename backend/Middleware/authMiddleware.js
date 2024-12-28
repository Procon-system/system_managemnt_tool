
const jwt = require('jsonwebtoken');
const User = require('../Models/UserSchema');
// Define access levels
const ROLES = {
  RANDOM_USER: 1,
  SERVICE_PERSONAL: 2,
  MANAGER: 3,
  FREE: 4,
  ADMIN: 5,
};
const authenticateUser = async (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      console.log("Authorization Header Missing or Malformed:", authHeader);

      return res.status(401).json({ error: "Token missing or improperly formatted" });
    }

    const token = authHeader.split(" ")[1].trim();
    console.log("Extracted Token:", token);
    console.log("JWT Secret:", process.env.JWT_TOKEN_KEY);

    try {
      const decoded = jwt.verify(token, process.env.JWT_TOKEN_KEY);
      console.log("Decoded Token:", decoded);
      
      req.user = decoded; // Attach user info from token to request object
      next(); // Proceed to the next middleware
    } catch (error) {
      console.error("Token Verification Error:", error.message);
      if (error.name === "TokenExpiredError") {
        return res.status(401).json({ error: "Token expired. Please log in again." });
      }
      return res.status(401).json({ error: "Invalid token" });
    }
};
// Middleware for random user (level 1)
const isRandomUser = (req, res, next) => {
  if (req.user.access_level >= ROLES.RANDOM_USER) {
    return next();
  }
  return res.status(403).json({ error: "Access denied. Random user privileges required." });
};

// Middleware for service personnel (level 2)
const isServicePersonal = (req, res, next) => {
  if (req.user.access_level >= ROLES.SERVICE_PERSONAL) {
    return next();
  }
  console.log("access",req.user.access_level)
  return res.status(403).json({ error: "Access denied. Service personnel privileges required." });
};

// Middleware for manager (level 3)
const isManager = (req, res, next) => {
  if (req.user.access_level >= ROLES.MANAGER) {
    return next();
  }
  return res.status(403).json({ error: "Access denied. Manager privileges required." });
};

// Middleware for free access (level 4)
const isFreeAccess = (req, res, next) => {
  // Check if the user has the free access level and the required roles
  if (req.user.access_level >= ROLES.FREE) {
    return next();
  }

  return res.status(403).json({
    error: "Access denied. Collaborator or Project Manager role required for Free access.",
  });
};

// Middleware for admin (level 5)
const isAdmin = (req, res, next) => {
  if (req.user.access_level === ROLES.ADMIN) {
    return next();
  }
  console.log("req user",req.user.access_level);
  return res.status(403).json({ error: "Access denied. Admin privileges required." });
};

module.exports = {
  authenticateUser,
  isRandomUser,
  isServicePersonal,
  isManager,
  isFreeAccess,
  isAdmin,
};