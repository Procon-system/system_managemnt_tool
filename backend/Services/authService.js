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
const registerUser = async (userData,tenantId) => {
  const tenantDB = await getOrganizationDB(tenantId);
  const User = tenantDB.model('User');
  const { email, password, last_name, first_name, organization, personal_number,access_level,
      isConfirmed,
      isActive,
   } = userData;
  
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

 
  // Create new user
  const newUser = new User({
    email,
    password: password,
    last_name,
    first_name,
    access_level: access_level,
    personal_number: personal_number || null,
    organization: organization,
    isConfirmed: userData.isConfirmed || false,
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
const loginUser = async (email, password, rememberMe, orgIdentifier) => {
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

    // 3. Regular User Login (Tenant DB)
    if (!orgIdentifier) {
      throw new Error('Organization identifier is required for regular users');
    }

    // Resolve orgId from slug/subdomain if needed
    let orgId = orgIdentifier;
    if (!mongoose.Types.ObjectId.isValid(orgIdentifier)) {
      const Organization = mongoose.model('Organization');
      const org = await Organization.findOne({
        $or: [
          { subdomain: orgIdentifier },
          { slug: orgIdentifier }
        ]
      });
      if (!org) throw new Error('Organization not found');
      orgId = org._id;
    }

    const tenantDB = await getOrganizationDB(orgId);
    const User = tenantDB.model('User');

    const user = await User.findOne({ email })
      .select('+password +loginAttempts +lockUntil');
    
    if (!user) throw new Error('User not found');

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
        access_level:user.access_level,
        role: user.role,
        organization: user.organization,
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
// const loginUser = async (email, password, rememberMe) => {
//   try {
//     password = password.trim();
//     // Validate input
//     const validation = validateRegistration({ email, password });
//     if (validation.error) {
//       throw new Error(validation.error.details.map(d => d.message).join('<br>'));
//     }

//     // First check if this is a superadmin (in main DB)
//     const Superadmin = mongoose.model('Superadmin');
//     const superadmin = await Superadmin.findOne({ email })
//       .select('+password +loginAttempts +lockUntil');

//     if (superadmin) {
//       // SUPERADMIN LOGIN FLOW
//       if (superadmin.lockUntil && superadmin.lockUntil > Date.now()) {
//         const lockMinutes = Math.ceil((superadmin.lockUntil - Date.now()) / 60000);
//         throw new Error(`Account locked. Try again in ${lockMinutes} minutes.`);
//       }

//       const isMatch = await superadmin.comparePassword(password);
//       if (!isMatch) {
//         await superadmin.incrementLoginAttempts();
//         await superadmin.save();
//         throw new Error('Incorrect password');
//       }

//       // Reset attempts and update last login
//       await superadmin.resetLoginAttempts();
//       superadmin.lastLogin = new Date();
//       await superadmin.save();

//       // Get org details (from main DB)
//       const Organization = mongoose.model('Organization');
//       const organization = await Organization.findById(superadmin.org_id);
//       if (!organization) throw new Error('Organization not found');

//       // Generate token with superadmin role
//       const token = superadmin.generateAuthToken();

//       return {
//         user: {
//           _id: superadmin._id,
//           email: superadmin.email,
//           first_name: superadmin.first_name,
//           last_name: superadmin.last_name,
//           role: 'admin',
//           organization: organization,
//           tenantId: organization._id // Org ID acts as tenant context
//         },
//         token
//       };
//     } 
//     // else {
//     //   // REGULAR USER LOGIN FLOW (tenant DB)
//     //   if (!orgIdentifier) {
//     //     throw new Error('Organization context required for regular users');
//     //   }

//     //   // Resolve org ID if subdomain was provided
//     //   let orgId = orgIdentifier;
//     //   if (typeof orgIdentifier === 'string' && !mongoose.Types.ObjectId.isValid(orgIdentifier)) {
//     //     const Organization = mongoose.model('Organization');
//     //     const org = await Organization.findOne({ 
//     //       $or: [
//     //         { subdomain: orgIdentifier },
//     //         { slug: orgIdentifier }
//     //       ]
//     //     });
//     //     if (!org) throw new Error('Organization not found');
//     //     orgId = org._id;
//     //   }

//     //   const tenantDB = await getOrganizationDB(orgId);
//     //   const User = tenantDB.model('User');

//     //   const user = await User.findOne({ email })
//     //     .select('+password +loginAttempts +lockUntil');
      
//     //   if (!user) throw new Error('User not found');

//     //   // ... rest of regular user flow remains same as before ...
//     //   // (account lock check, password verification, etc.)

//     //   const token = user.generateAuthToken();

//     //   return {
//     //     user: {
//     //       _id: user._id,
//     //       email: user.email,
//     //       first_name: user.first_name,
//     //       last_name: user.last_name,
//     //       role: 'user',
//     //       organization: user.organization,
//     //       tenantId: orgId
//     //     },
//     //     token
//     //   };
//     // }

//   } catch (error) {
//     console.error("Login error:", error);
//     throw error;
//   }
// };


// const loginUser = async (email, password, rememberMe, orgId) => {
//   try {
//     password = password.trim();

//     // Validate input
//     const validation = validateRegistration({ email, password });
//     if (validation.error) {
//       throw new Error(validation.error.details.map(d => d.message).join('<br>'));
//     }

//     // Get tenant-specific DB connection
//     const tenantDB = await getOrganizationDB(orgId);
//     const User = tenantDB.model('User');

//     // Find user
//     const user = await User.findOne({ email })
//       .select('+password +loginAttempts +lockUntil');
    
//     if (!user) throw new Error('User not found');

//     // Check account lock
//     if (user.lockUntil && user.lockUntil > Date.now()) {
//       const lockMinutes = Math.ceil((user.lockUntil - Date.now()) / 60000);
//       throw new Error(`Account locked. Try again in ${lockMinutes} minutes.`);
//     }

//     // Verify password
//     const isMatch = await user.comparePassword(password);
//     if (!isMatch) {
//       await user.incrementLoginAttempts();
//       await user.save();
//       throw new Error('Incorrect password');
//     }

//     // Reset attempts
//     await user.resetLoginAttempts();
//     user.lastLogin = new Date();
//     await user.save();

//     // Generate token with tenant context
//     const token = user.generateAuthToken();

//     return {
//       user: {
//         _id: user._id,
//         email: user.email,
//         first_name: user.first_name,
//         last_name: user.last_name,
//         organization: user.organization,
//         access_level: user.access_level,
//         tenantId: orgId // Include tenant ID in response
//       },
//       token
//     };

//   } catch (error) {
//     console.error("Login error:", error);
//     throw error;
//   }
// };
// const loginUser = async (email, password, rememberMe) => {
//   try {
//     password = password.trim();

//     // Validate input
//     const validation = validateRegistration({ email, password });
//     if (validation.error) {
//       throw new Error(validation.error.details.map(d => d.message).join('<br>'));
//     }

//     // Find user
//     const user = await User.findOne({ email }).select('+password +loginAttempts +lockUntil');
//     if (!user) throw new Error('User not found');

//     // Check account lock
//     if (user.lockUntil && user.lockUntil > Date.now()) {
//       const lockMinutes = Math.ceil((user.lockUntil - Date.now()) / 60000);
//       throw new Error(`Account locked. Try again in ${lockMinutes} minutes.`);
//     }

//     // Verify password
//     const isMatch = await user.comparePassword(password);
//     if (!isMatch) {
//       await user.incrementLoginAttempts();
//       await user.save();
//       throw new Error('Incorrect password');
//     }

//     // Reset attempts
//     await user.resetLoginAttempts();
//     user.lastLogin = new Date();
//     await user.save();

//     // Check email confirmation
//     // if (!user.isConfirmed) {
//     //   throw new Error('Please confirm your email first');
//     // }

//     // Generate token
//     const token = user.generateAuthToken();

//     // Return properly structured response
//     return {
//       user: {
//         _id: user._id,
//         email: user.email,
//         first_name: user.first_name,
//         last_name: user.last_name,
//         organization: user.organization,
//         access_level: user.access_level
//       },
//       token
//     };

//   } catch (error) {
//     console.error("Login error:", error);
//     throw error;
//   }
// };
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