// const jwt = require('jsonwebtoken');
// const User = require('../Models/UserSchema');

// const authenticateUser = async (req, res, next) => {
//     const authHeader = req.headers.authorization;
//     if (!authHeader || !authHeader.startsWith("Bearer ")) {
//       return res.status(401).json({ error: "Token missing or improperly formatted" });
//     }
  
//     const token = authHeader.split(" ")[1]; // Extract token after "Bearer"
//     console.log("ttt",token)
//     try {
//       const decoded = jwt.verify(token, process.env.JWT_TOKEN_KEY); // Verify token using secret
//       req.user = decoded; // Attach user info from token to request object
//       next(); // Proceed to the next middleware
//     } catch (error) {
//     console.log("err",error)
//     return res.status(401).json({ error: "Invalid token" });
//   }
// };

// module.exports = authenticateUser;
const jwt = require('jsonwebtoken');
const User = require('../Models/UserSchema');

const authenticateUser = async (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
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
      console.log("Token Verification Error:", error.message);
      return res.status(401).json({ error: "Invalid token" });
    }
};

module.exports = authenticateUser;
