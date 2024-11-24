// const jwt = require("jsonwebtoken");
// require("dotenv").config();
// async function generateToken(payload, tokenExpiry = "7d") {
//   const token = jwt.sign(payload, process.env.JWT_TOKEN_KEY, {
//     expiresIn: tokenExpiry,
//   });
//   return token;
// }

// module.exports = generateToken;
const jwt = require("jsonwebtoken");
require("dotenv").config();

/**
 * Generates a JWT token with the given payload.
 * 
 * @param {Object} payload - The payload to include in the token (e.g., user details).
 * @param {string} tokenExpiry - The expiry duration for the token (default is "7d").
 * @returns {string} - The generated JWT token.
 */
async function generateToken(payload, tokenExpiry = "7d") {
  // Ensure access_level is included in the payload
  if (!payload.access_level) {
    throw new Error("Access level is required to generate a token.");
  }
 console.log("access level",payload.access_level)
  const token = jwt.sign(payload, process.env.JWT_TOKEN_KEY, {
    expiresIn: tokenExpiry,
  });
  return token;
}

module.exports = generateToken;
