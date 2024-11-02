const jwt = require("jsonwebtoken");
require("dotenv").config();

// async function generateToken(payload, expiresIn = "7d") {
//   const token = jwt.sign(payload, process.env.JWT_TOKEN_KEY, { expiresIn });
//   return token;
async function generateToken(payload, tokenExpiry = "7d") {
  const token = jwt.sign(payload, process.env.JWT_TOKEN_KEY, {
    expiresIn: tokenExpiry,
  });
  return token;
}

module.exports = generateToken;
