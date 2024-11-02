// services/authService.js
const User = require('../Models/UserSchema');
const bcrypt = require('bcryptjs');
const hashPassword= require('../Middleware/hashPassword');
const generateToken= require('../Middleware/generateToken');
const registerValidator= require('../Helper/registerValidator');
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
  logoutUser
};
