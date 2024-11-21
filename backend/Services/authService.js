const jwt = require("jsonwebtoken");
const User = require('../Models/UserSchema');
const bcrypt = require('bcryptjs');
const hashPassword= require('../Middleware/hashPassword');
const generateToken= require('../Middleware/generateToken');
const registerValidator= require('../Helper/registerValidator');
const {generateConfirmationCode }= require('../Helper/generateConfirmationCode');
const {
  sendConfirmationEmail,
  sendWelcomeEmail,
  sendRestPasswordLink,
} = require("../Helper/sendEmail");
require('dotenv').config();
// Service to register a new user
const registerUser = async (userData) => {
  
  const { email,password,last_name,first_name,personal_number,working_group, access_level } = userData;
  const validation=registerValidator.validate({email,password});
  if(validation.error){
    throw new Error(validation.error.details.map((d)=>
    d.message).join('<br>'));
  }
  // Check if the user already exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new Error('User already exists with this username or email');
  }
  const hashedPassword=await hashPassword(password);
  if (!hashedPassword){
    throw new Error("Error hashing password");
  }
  // Create new user
  const newUser = new User({
   email,
   password:hashedPassword,
   last_name,
   first_name,
   personal_number,
   working_group,
   access_level
  });

  // Save the user to the database
  await newUser.save();
  const confirmationCode = generateConfirmationCode();
  console.log("ccc",confirmationCode);
  await User.findByIdAndUpdate(newUser._id, { confirmationCode });

  // await sendConfirmationEmail(newUser.email, confirmationCode, newUser.first_name);

   const token =await generateToken({id:newUser._id});
   if(!token){
    throw new Error("Error generating token");
   }
   return {user:newUser,token}
};

const loginUser = async (email, password, rememberMe) => {
  console.log("Input values:", email, password, rememberMe);

  // Validate email and password format
  const validation = registerValidator.validate({ email, password });
  if (validation.error) {
    console.log("Validation Error:", validation.error);
    throw new Error(validation.error.details.map((d) => d.message).join('<br>'));
  }

  // Find user by email
  const user = await User.findOne({ email });
  if (!user) {
    throw new Error('User not found');
  }

  // Check password
  const isPasswordCorrect = await bcrypt.compareSync(password, user.password);
  if (!isPasswordCorrect) {
    throw new Error('Incorrect password');
  }

  // Define token expiry based on rememberMe
  const tokenExpiry = rememberMe ? '30d' : '1h';
  const token = await generateToken({ id: user._id }, tokenExpiry);
  console.log("Generated Token:", token);

  if (!token) {
    throw new Error('Error generating token');
  }
  
  return { user, token };
};
async function confirmEmail(confirmationCode) {
  const user = await User.findOne({ confirmationCode });
  if (!user) throw new Error("Invalid confirmation code/User not found");

  user.isConfirmed = true;
  user.confirmationCode = "Confirmed";
  await user.save();

  await sendWelcomeEmail(user.email, user.first_name);

  return { success: true, message: "Your account has been confirmed" };
}

async function forgotPassword(email) {
  const user = await User.findOne({ email });
  if (!user) throw new Error("User with this email does not exist");

  const token = await generateToken({ id: user._id });
  if (!token) throw new Error("Token generation failed");

  await sendRestPasswordLink(email, user._id, token);

  return { token, id: user._id };
}

async function resetPassword(id, token, password) {
  const decoded = jwt.verify(token, process.env.JWT_TOKEN_KEY);
  if (!decoded) throw new Error("Invalid token");

  const hashedPassword = await bcrypt.hash(password, 10);
  const updatedUser = await User.findByIdAndUpdate(
    id,
    { password: hashedPassword },
    { new: true }
  );

  if (!updatedUser) throw new Error("User not found");

  return { message: "Password has been reset successfully" };
}

const logoutUser = () => {
  try {
  //   const token = req.cookies.jwt; // Get the JWT token from the cookie

  //       if (!token) {
  //           return false; 
  //       }
    return true; // Indicate successful logout
} catch (error) {
    console.error('Error during logout:', error);
    return false;
}
};
// Export the services
module.exports = {
  registerUser,
  loginUser,
  logoutUser,
  confirmEmail,
  forgotPassword,
  resetPassword
};
