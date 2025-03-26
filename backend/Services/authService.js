// @ts-nocheck
const jwt = require("jsonwebtoken");
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const User = require('../Models/UserSchema');
const Organization = require('../Models/OrganizationSchema');
const {
  sendConfirmationEmail,
  sendWelcomeEmail,
  sendResetPasswordLink
} = require("../Helper/sendEmail");
const { validateRegistration } = require('../Helper/validators');

// Service to register a new user
const registerUser = async (userData) => {
  const { email, password, last_name, first_name, organizationName, personal_number,access_level } = userData;
  
  // Validate input
  const validation = validateRegistration({ email, password });
  if (validation.error) {
    throw new Error(validation.error.details.map(d => d.message).join('<br>'));
  }

  // Check if user exists by email
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new Error('User already exists with this email');
  }

  // Check if personal_number is provided and unique
  if (personal_number) {
    const existingWithPN = await User.findOne({ personal_number });
    if (existingWithPN) {
      throw new Error('This personal number is already in use');
    }
  }

  // Find or create organization
  let organization = await Organization.findOne({ name: organizationName });
  if (!organization) {
    organization = await Organization.create({ name: organizationName });
  }

  // Hash password
  // const hashedPassword = await bcrypt.hash(password, 10);

  // Create new user
  const newUser = new User({
    email,
    password: password,
    last_name,
    first_name,
    access_level: access_level,
    personal_number: personal_number || null,
    organization: organization._id,
    confirmationCode: crypto.randomBytes(20).toString('hex')
  });

  await newUser.save();

  return {
    _id: newUser._id,
    email: newUser.email,
    first_name: newUser.first_name,
    last_name: newUser.last_name,
    organization: organization
  };
};
const loginUser = async (email, password, rememberMe) => {
  try {
    password = password.trim();

    // Validate input
    const validation = validateRegistration({ email, password });
    if (validation.error) {
      throw new Error(validation.error.details.map(d => d.message).join('<br>'));
    }

    // Find user
    const user = await User.findOne({ email }).select('+password +loginAttempts +lockUntil');
    if (!user) throw new Error('User not found');

    // Check account lock
    if (user.lockUntil && user.lockUntil > Date.now()) {
      const lockMinutes = Math.ceil((user.lockUntil - Date.now()) / 60000);
      throw new Error(`Account locked. Try again in ${lockMinutes} minutes.`);
    }

    // Verify password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      await user.incrementLoginAttempts();
      await user.save();
      throw new Error('Incorrect password');
    }

    // Reset attempts
    await user.resetLoginAttempts();
    user.lastLogin = new Date();
    await user.save();

    // Check email confirmation
    // if (!user.isConfirmed) {
    //   throw new Error('Please confirm your email first');
    // }

    // Generate token
    const token = user.generateAuthToken();

    // Return properly structured response
    return {
      user: {
        _id: user._id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        organization: user.organization,
        access_level: user.access_level
      },
      token
    };

  } catch (error) {
    console.error("Login error:", error);
    throw error;
  }
};
async function confirmEmail(confirmationCode) {
  const user = await User.findOne({ confirmationCode });
  if (!user) throw new Error("Invalid confirmation code");

  user.isConfirmed = true;
  user.confirmationCode = undefined;
  await user.save();

  await sendWelcomeEmail(user.email, user.first_name);

  return { success: true, message: "Account confirmed successfully" };
}

async function forgotPassword(email) {
  const user = await User.findOne({ email });
  if (!user) throw new Error("User with this email does not exist");

  // Generate reset token
  const resetToken = crypto.randomBytes(20).toString('hex');
  user.resetPasswordToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');
  user.resetPasswordExpire = Date.now() + 10 * 60 * 1000; // 10 minutes
  
  await user.save();

  await sendResetPasswordLink(user.email, resetToken);

  return { 
    success: true, 
    message: "Password reset email sent",
    resetToken 
  };
}

async function resetPassword(token, password) {
  // Hash the token to compare with database
  const hashedToken = crypto
    .createHash('sha256')
    .update(token)
    .digest('hex');

  const user = await User.findOne({
    resetPasswordToken: hashedToken,
    resetPasswordExpire: { $gt: Date.now() }
  });

  if (!user) {
    throw new Error("Invalid or expired token");
  }

  // Update password
  user.password = await bcrypt.hash(password, 12);
  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;
  await user.save();

  // Generate new auth token
  const authToken = jwt.sign(
    { id: user._id, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: '1h' }
  );

  return { 
    success: true,
    message: "Password reset successful",
    token: authToken
  };
}

const logoutUser = () => {
  // This is handled by the controller clearing cookies
  return true;
};

module.exports = {
  registerUser,
  loginUser,
  logoutUser,
  confirmEmail,
  forgotPassword,
  resetPassword
};