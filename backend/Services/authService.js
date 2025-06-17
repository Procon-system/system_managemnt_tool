// @ts-nocheck
const jwt = require("jsonwebtoken");
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { getOrganizationDB } = require('../config/dbManager');
const Organization = require('../Models/OrganizationSchema');
const Superadmin = require('../Models/SuperAdminSchema');
const mongoose = require('mongoose');

const {
  sendConfirmationEmail,
  sendWelcomeEmail,
  sendResetPasswordLink
} = require("../Helper/sendEmail");
const { validateRegistration } = require('../Helper/validators');

// Service to register a new user
const registerUser = async (userData, tenantId, User) => {
  const {
    email, password, last_name, first_name,
    org_id, personal_number, access_level,
    isConfirmed, isActive,payroll
  } = userData;

  const validation = validateRegistration({ email, password });
  if (validation.error) {
    throw new Error(validation.error.details.map(d => d.message).join('<br>'));
  }

  const existingUser = await User.findOne({ email });
  if (existingUser) throw new Error('User already exists with this email');

  if (personal_number) {
    const existingWithPN = await User.findOne({ personal_number });
    if (existingWithPN) throw new Error('This personal number is already in use');
  }

  const newUser = new User({
    email,
    password,
    last_name,
    first_name,
    access_level,
    personal_number: personal_number || null,
    org_id: org_id,
    isConfirmed: isConfirmed || false,
    isActive: isActive !== false,
    confirmationCode: crypto.randomBytes(20).toString('hex'),
    payroll: { // +++ Add the payroll object here +++
      rate_type: payroll?.rate_type || 'hourly',
      rate: payroll?.rate || 0,
      currency: payroll?.currency || 'USD',
      overtime_multiplier: payroll?.overtime_multiplier || 1.5,
    }
  });

  await newUser.save();

  // Save minimal user reference in main DB
  const TenantUser = mongoose.model('TenantUser');
  await TenantUser.create({
    tenantId,
    email: newUser.email,
    userIdInTenantDB: newUser._id,
    access_level: newUser.access_level
  });

  return {
    _id: newUser._id,
    email: newUser.email,
    first_name: newUser.first_name,
    last_name: newUser.last_name,
    payroll: newUser.payroll ,
    org_id
  };
};

// services/authService.js
const registerAdminUser = async (userData) => {
  const { 
    email, 
    password, 
    last_name, 
    first_name, 
    organizationName,
    personal_number,
    access_level = 5, // Default to admin access
    max_permitted_user_amount = 1,
    max_permitted_resource_amount = 1,
    subscription_type = 'free'
  } = userData;

  // Validate input
  const validation = validateRegistration({ email, password });
  if (validation.error) {
    throw new Error(validation.error.details.map(d => d.message).join('<br>'));
  }

  // Check if organization exists in main DB
  const Organization = mongoose.model('Organization');
  let organization = await Organization.findOne({ name: organizationName });
  
  if (!organization) {
    // Create new organization in main DB
    organization = await Organization.create({
      name: organizationName,
      subdomain: organizationName.toLowerCase().replace(/\s+/g, '-'),
      config: {
        databaseName: `org_${mongoose.Types.ObjectId()}`, // Unique DB name
        features: {
          tasks: true,
          resources: true,
          teams: true
        }
      },
      subscription: {
        plan: subscription_type
      }
    });
  }

  // Get tenant-specific DB connection
  const tenantDB = await getOrganizationDB(organization._id);
  const User = tenantDB.model('User');

  // Check if user exists by email in tenant DB
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new Error('User already exists with this email');
  }

  // Create admin user in tenant DB
  const newUser = new User({
    email,
    password,
    last_name,
    first_name,
    access_level,
    personal_number: personal_number || null,
    max_permitted_user_amount,
    max_permitted_resource_amount,
    subscription_type,
    isConfirmed: true, // Admin users are auto-confirmed
    isActive: true    // Admin users are auto-activated
  });

  await newUser.save();

  return {
    _id: newUser._id,
    email: newUser.email,
    first_name: newUser.first_name,
    last_name: newUser.last_name,
    tenantId: organization._id // Return tenant ID for JWT
  };
};
const loginUser = async (email, password, rememberMe) => {
  try {
    password = password.trim();

    // 1. Validate input
    const validation = validateRegistration({ email, password });
    if (validation.error) {
      throw new Error(validation.error.details.map(d => d.message).join('<br>'));
    }

    // 2. Try Superadmin (main DB)
    const Superadmin = mongoose.model('Superadmin');
    const superadmin = await Superadmin.findOne({ email })
      .select('+password +loginAttempts +lockUntil');

    if (superadmin) {
      if (superadmin.lockUntil && superadmin.lockUntil > Date.now()) {
        const lockMinutes = Math.ceil((superadmin.lockUntil - Date.now()) / 60000);
        throw new Error(`Account locked. Try again in ${lockMinutes} minutes.`);
      }

      const isMatch = await superadmin.comparePassword(password);
      if (!isMatch) {
        await superadmin.incrementLoginAttempts();
        await superadmin.save();
        throw new Error('Incorrect password');
      }

      await superadmin.resetLoginAttempts();
      superadmin.lastLogin = new Date();
      await superadmin.save();

      const Organization = mongoose.model('Organization');
      const organization = await Organization.findById(superadmin.org_id);
      if (!organization) throw new Error('Organization not found');

      const token = superadmin.generateAuthToken();

      return {
        user: {
          _id: superadmin._id,
          email: superadmin.email,
          first_name: superadmin.first_name,
          last_name: superadmin.last_name,
          access_level: superadmin.access_level,
          role: 'admin',
          isGlobalAdmin: true,
          organization,
          tenantId: organization._id
        },
        token
      };
    }

    // 3. Try Regular User: Find tenantId from main DB
    const TenantUser = mongoose.model('TenantUser');
    const tenantUser = await TenantUser.findOne({ email });
    if (!tenantUser) throw new Error('User not found');
     
    
    const orgId = tenantUser.tenantId;
    const tenantConn = await getOrganizationDB(orgId);
    const User =tenantConn.models.get('User');

    const user = await User.findOne({ email })
      .select('+password +loginAttempts +lockUntil');

    if (!user) throw new Error('User not found in tenant');

    if (user.lockUntil && user.lockUntil > Date.now()) {
      const lockMinutes = Math.ceil((user.lockUntil - Date.now()) / 60000);
      throw new Error(`Account locked. Try again in ${lockMinutes} minutes.`);
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      await user.incrementLoginAttempts();
      await user.save();
      throw new Error('Incorrect password');
    }

    await user.resetLoginAttempts();
    user.lastLogin = new Date();
    await user.save();

    const token = user.generateAuthToken();

    return {
      user: {
        _id: user._id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        access_level: user.access_level,
        role: user.role,
        org_id: user.org_id,
        tenantId: orgId,
        isGlobalAdmin: false
      },
      token
    };

  } catch (error) {
    console.error('Login error:', error.message);
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
  registerAdminUser,
  loginUser,
  logoutUser,
  confirmEmail,
  forgotPassword,
  resetPassword
};