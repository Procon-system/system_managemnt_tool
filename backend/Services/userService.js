const {
  AppError,
  NotFoundError,
  AuthorizationError,
  ValidationError,
  ConflictError,
  DatabaseError
} = require('../utils/errors');

const { validatePasswordStrength } = require('../Helper/validators');
class UserService {
 
async getAllUsers(requester, UserModel) {
    try {
      const users = await UserModel.find({})
        .select('-password -confirmationCode -resetPasswordToken -resetPasswordExpire');
        
      return users;
    } catch (error) {
      console.error('Error fetching users:', error);
      throw new DatabaseError('Failed to fetch users');
    }
}
async getUser(userId, requester,UserModel) {
    try {
      // Users can only view their own profile unless they're admin
      if (userId !== requester.id && requester.access_level < 3) {
        throw new AuthorizationError('Not authorized to view this user');
      }

      const user = await UserModel.findById(userId)
        .select('-password -confirmationCode -resetPasswordToken -resetPasswordExpire')
        .populate('organization', 'name');

      if (!user) throw new NotFoundError('User not found');
      return user;
    } catch (error) {
      if (error instanceof AuthorizationError || error instanceof NotFoundError) {
        throw error;
      }
      throw new DatabaseError('Failed to fetch user');
    }
}
async updateUser(userId, updateData, requester,UserModel) {
    try {
      
      if (userId !== requester.id) {
        throw new AuthorizationError('Not authorized to update this user');
      }

      if (requester.access_level < 3) {
        delete updateData.email;
        delete updateData.personal_number;
        delete updateData.access_level;
        delete updateData.role; 
        delete updateData.payroll; 

      }

      return await this._updateUser(userId, updateData, UserModel);

    } catch (error) {
      if (error instanceof AuthorizationError) {
        throw error;
      }
      throw new DatabaseError('Failed to update user');
    }
}
async adminUpdateUser(userId, updateData, requester,UserModel) {
    try {
      const userToUpdate = await UserModel.findById(userId);
      if (!userToUpdate) throw new NotFoundError('User not found');

      // Admins can't update super admins
      if (userToUpdate.access_level === 5 && requester.access_level < 5) {
        throw new AuthorizationError('Not authorized to update super admin');
      }

      // Organization admins can only update users in their organization
      if (requester.access_level === 4 && 
          userToUpdate.organization.toString() !== requester.organization.toString()) {
        throw new AuthorizationError('Not authorized to update users outside your organization');
      }

      // Prevent changing certain fields
      if (updateData.password) {
        throw new ValidationError('Password cannot be changed through this endpoint');
      }

      return await this._updateUser(userId, updateData, UserModel);

    } catch (error) {
      if (error instanceof NotFoundError || 
          error instanceof AuthorizationError || 
          error instanceof ValidationError) {
        throw error;
      }
      throw new DatabaseError('Failed to perform admin update');
    }
}
async _updateUser(userId, updateData,UserModel) {
    try {
      const user = await UserModel.findByIdAndUpdate(
        userId,
        updateData,
        { new: true, runValidators: true }
      ).select('-password -confirmationCode -resetPasswordToken -resetPasswordExpire');

      if (!user) throw new NotFoundError('User not found during update');
      return user;
    } catch (error) {
      if (error.name === 'ValidationError') {
        throw new ValidationError(error.message, error.errors);
      }
      if (error.name === 'MongoError' && error.code === 11000) {
        throw new ConflictError('User with this email or personal number already exists');
      }
      throw new DatabaseError('Failed to update user record');
    }
}
async deleteUser(userId, requester, UserModel) {
  try {
    const userToDelete = await UserModel.findById(userId);
    if (!userToDelete) {
      throw new NotFoundError('User not found');
    }

    const isSelfDelete = userToDelete._id.toString() === requester._id.toString();
    const isSuperAdmin = requester.access_level === 5;

    if (!isSuperAdmin && !isSelfDelete) {
      throw new AuthorizationError('Not authorized to delete this user');
    }
    
    // Super admins cannot be deleted by anyone but other super admins (and not themselves through this route)
    if (userToDelete.access_level === 5 && !isSuperAdmin) {
       throw new AuthorizationError('Not authorized to delete a super admin account');
    }

    // Prevent a super admin from deleting themselves via the admin panel
    if(userToDelete.access_level === 5 && isSelfDelete){
        throw new AuthorizationError('Super admins cannot delete their own account from this panel.');
    }

    await UserModel.deleteOne({ _id: userId });

    return { success: true };
  } catch (error) {
    if (error instanceof NotFoundError || error instanceof AuthorizationError) {
      throw error;
    }
    // Log the original error for better debugging
    console.error("Underlying delete error:", error);
    throw new DatabaseError('Failed to delete user');
  }
}
// async updateSelf({ requester, updateData, models }) {
//   try {
//     const { Superadmin, TenantUser, TenantUserInOrg } = models;
//     let CoreUserModel;
//     let UserInOrgModel;
//     let searchField;

//     if (requester.access_level === 5 && Superadmin) {
//       CoreUserModel = Superadmin;
//       searchField = '_id';
//     } else if (TenantUser) {
//       CoreUserModel = TenantUser;
//       searchField = 'email';
//       if (TenantUserInOrg) {
//         UserInOrgModel = TenantUserInOrg;
//       }
//     } else {
//       throw new DatabaseError('Server configuration error: No appropriate user model found.');
//     }

//     const userId = requester._id.toString();
//     const userEmail = requester.email;
//     const tenantId = requester.org_id ? requester.org_id.toString() : null;

//     const allowedFields = ['first_name', 'last_name', 'email', 'personal_number', 'phone', 'address', 'profilePicture'];
//     const filteredUpdateData = {};
//     for (const key in updateData) {
//       if (allowedFields.includes(key)) {
//         filteredUpdateData[key] = updateData[key];
//       }
//     }

//     if (Object.keys(filteredUpdateData).length === 0 && !updateData.password) {
//       throw new ValidationError('Please provide valid fields to update or a new password.');
//     }

//     let coreUserQuery = {};
//     if (searchField === '_id') {
//       coreUserQuery._id = userId;
//     } else {
//       coreUserQuery.email = userEmail;
//     }

//     // --- Email Uniqueness Check (using ConflictError) ---
//     if (filteredUpdateData.email && filteredUpdateData.email !== requester.email) {
//       const newEmail = filteredUpdateData.email;

//       // Check Superadmin model
//       if (Superadmin) {
//         const superadminExists = await Superadmin.findOne({ email: newEmail });
//         if (superadminExists && superadminExists._id.toString() !== userId) {
//           throw new ConflictError(`The email "${newEmail}" is already registered as a Superadmin. Please use a different email.`);
//         }
//       }

//       // Check TenantUser model
//       if (TenantUser && CoreUserModel !== TenantUser) {
//         const tenantUserExists = await TenantUser.findOne({ email: newEmail });
//         if (tenantUserExists && tenantUserExists._id.toString() !== userId) {
//           throw new ConflictError(`The email "${newEmail}" is already registered by another Tenant User. Please use a different email.`);
//         }
//       } else if (CoreUserModel === TenantUser) {
//         const existingTenantUser = await TenantUser.findOne({ email: newEmail });
//         if (existingTenantUser && existingTenantUser._id.toString() !== userId) {
//           throw new ConflictError(`The email "${newEmail}" is already in use by another user in the system. Please use a different email.`);
//         }
//       }
      
//     }
    
//     if (updateData.password) {
//       const user = await CoreUserModel.findOne(coreUserQuery);
//       if (!user) throw new NotFoundError('Your user account could not be found for password update.');
//       user.password = updateData.password;
//       await user.save();
//       delete filteredUpdateData.password;
//     }

//     let updatedCoreUser;
//     let updatedUserInOrg;
//     if (Object.keys(filteredUpdateData).length > 0) {
//       try {
//         updatedCoreUser = await CoreUserModel.findOneAndUpdate(
//           coreUserQuery,
//           { $set: filteredUpdateData },
//           { new: true, runValidators: true }
//         ).select('-password -confirmationCode -resetPasswordToken -resetPasswordExpire');

//         if (!updatedCoreUser) throw new NotFoundError('Your user account could not be found for profile update.');

//       } catch (mongooseError) {
//         if (mongooseError.name === 'MongoServerError' && mongooseError.code === 11000) {
//           const field = Object.keys(mongooseError.keyValue)[0];
//           throw new ConflictError(`The ${field} "${mongooseError.keyValue[field]}" is already taken.`);
//         }
//         console.error("Mongoose error during update:", mongooseError);
//         throw new DatabaseError("Failed to update user profile due to a database issue.");
//       }
//     } else {
//       updatedCoreUser = await CoreUserModel.findOne(coreUserQuery).select('-password -confirmationCode -resetPasswordToken -resetPasswordExpire');
//       if (!updatedCoreUser) throw new NotFoundError('Your user account could not be found after password update.');
//     }

//     if (UserInOrgModel && tenantId && (filteredUpdateData.email || filteredUpdateData.first_name || filteredUpdateData.last_name)) {
//       const userInOrg = await UserInOrgModel.findOne({
//         org_id: tenantId,
//         _id: userId
//       });

//       if (userInOrg) {
//         if (filteredUpdateData.email && filteredUpdateData.email !== requester.email) userInOrg.email = filteredUpdateData.email;
//         if (filteredUpdateData.first_name) userInOrg.first_name = filteredUpdateData.first_name;
//         if (filteredUpdateData.last_name) userInOrg.last_name = filteredUpdateData.last_name;
//         updatedUserInOrg = await userInOrg.save();
//       } else {
//         console.warn(`TenantUserInOrg not found for tenantId: ${tenantId}, userId: ${userId}. Name/Email not synced.`);
//       }
//     }

//     return updatedCoreUser;

//   } catch (error) {
//     if (error instanceof AppError) { // Catch all custom errors that inherit from AppError
//       throw error;
//     }
//     console.error('Unexpected error updating self profile:', error);
//     throw new DatabaseError('An unexpected server error occurred while updating your profile.');
//   }
// }
async updateSelf({ requester, updateData, models, getTenantConnection }) {
  try {
    const { Superadmin, TenantUser, TenantUserInOrg } = models;
    let CoreUserModel;
    let UserInOrgModel;
    let searchField;

    if (requester.access_level === 5 && Superadmin) {
      CoreUserModel = Superadmin;
      searchField = "_id";
    } else if (TenantUser) {
      CoreUserModel = TenantUser; // NOTE: this is the **schema**, but not necessarily bound to tenant conn
      searchField = "email";
      if (TenantUserInOrg) UserInOrgModel = TenantUserInOrg;
    } else {
      throw new DatabaseError("Server configuration error: No appropriate user model found.");
    }

    const userId = requester._id.toString();
    const userEmail = requester.email;
    const tenantId = requester.org_id ? requester.org_id.toString() : null;

    const allowedFields = [
      "first_name",
      "last_name",
      "email",
      "personal_number",
      "phone",
      "address",
      "profilePicture",
    ];
    const filteredUpdateData = {};
    for (const key in updateData) {
      if (allowedFields.includes(key)) filteredUpdateData[key] = updateData[key];
    }

    if (
      Object.keys(filteredUpdateData).length === 0 &&
      !updateData.password && !updateData.currentPassword && !updateData.confirmPassword
    ) {
      throw new ValidationError("Please provide valid fields to update or a new password.");
    }

    const coreUserQuery = (searchField === "_id") ? { _id: userId } : { email: userEmail };

    // --- Email uniqueness checks (unchanged from your version) ---
    if (filteredUpdateData.email && filteredUpdateData.email !== requester.email) {
      const newEmail = filteredUpdateData.email;

      if (Superadmin) {
        const superadminExists = await Superadmin.findOne({ email: newEmail });
        if (superadminExists && superadminExists._id.toString() !== userId) {
          throw new ConflictError(`The email "${newEmail}" is already registered as a Superadmin.`);
        }
      }

      // Check TenantUser globally (main or tenant — your repo likely binds `TenantUser` to main)
      if (TenantUser && CoreUserModel !== TenantUser) {
        const tenantUserExists = await TenantUser.findOne({ email: newEmail });
        if (tenantUserExists && tenantUserExists._id.toString() !== userId) {
          throw new ConflictError(`The email "${newEmail}" is already registered by another Tenant User.`);
        }
      } else if (CoreUserModel === TenantUser) {
        const existingTenantUser = await TenantUser.findOne({ email: newEmail });
        if (existingTenantUser && existingTenantUser._id.toString() !== userId) {
          throw new ConflictError(`The email "${newEmail}" is already in use by another user in the system.`);
        }
      }
    }

    // ---------------------------
    // TENANT-AWARE PASSWORD CHANGE
    // ---------------------------
    const wantsPwChange = (updateData.currentPassword || updateData.password || updateData.confirmPassword);

    if (wantsPwChange) {
      const currentPassword = String(updateData.currentPassword || "");
      const newPassword = String(updateData.password || "");
      const confirmPassword = String(updateData.confirmPassword || "");

      if (!currentPassword || !newPassword || !confirmPassword) {
        throw new ValidationError("Current password, new password and confirmation are all required.");
      }
      if (newPassword !== confirmPassword) {
        throw new ValidationError("New password and confirmation do not match.");
      }
      if (newPassword === currentPassword) {
        throw new ValidationError("New password must be different from your current password.");
      }

      // Resolve the right model/connection for password:
      let passwordDoc = null;

      if (requester.access_level === 5) {
        // Superadmin lives in main DB
        passwordDoc = await Superadmin.findOne({ _id: userId }).select("+password");
      } else {
        // Tenant users: get **tenant connection**, then bind TenantUser schema onto it
        if (!tenantId) {
          throw new ValidationError("Tenant is required for password change.");
        }

        // Get tenant mongoose connection (adapt this to your infra)
        // const tenantConn =
        //   models.tenantConn ||
        //   (typeof getTenantConnection === "function" ? getTenantConnection(tenantId) : null);

        // if (!tenantConn) {
        //   throw new DatabaseError("Tenant connection not available to update password.");
        // }

        // Bind the TenantUser model to the tenant connection using the same schema
        const TenantUserOnTenant = TenantUserInOrg
          
        // Prefer the core user id in tenant DB if available
        const coreId =
          requester.userIdInTenantDB?.toString() ||
          requester._id?.toString();

        passwordDoc = await TenantUserOnTenant.findOne({ _id: coreId }).select("+password");
      }

      if (!passwordDoc) {
        throw new NotFoundError("Your user account could not be found for password update.");
      }

      // Compare current password (instance method if available, otherwise bcrypt)
      let currentOk = false;
      if (typeof passwordDoc.comparePassword === "function") {
        currentOk = await passwordDoc.comparePassword(currentPassword);
      } else {
        const bcrypt = require("bcryptjs");
        if (!passwordDoc.password) {
          throw new ValidationError("Password cannot be verified for this account type.");
        }
        currentOk = await bcrypt.compare(currentPassword, passwordDoc.password);
      }
      if (!currentOk) {
        throw new ValidationError("Current password is incorrect.");
      }

      // Strength check (your existing helper)
      const { ok, message } = validatePasswordStrength(newPassword, {
        email: requester.email,
        first_name: requester.first_name,
        last_name: requester.last_name,
      });
      if (!ok) throw new ValidationError(message);

      // Set + save on tenant-bound doc so pre-save hash runs on tenant schema
      passwordDoc.password = newPassword;
      await passwordDoc.save();

      // scrub password fields from profile updates
      delete filteredUpdateData.password;
      delete filteredUpdateData.currentPassword;
      delete filteredUpdateData.confirmPassword;
    }

    // --- Profile fields update (main logic unchanged) ---
    let updatedCoreUser;
    if (Object.keys(filteredUpdateData).length > 0) {
      try {
        updatedCoreUser = await CoreUserModel.findOneAndUpdate(
          coreUserQuery,
          { $set: filteredUpdateData },
          { new: true, runValidators: true }
        ).select("-password -confirmationCode -resetPasswordToken -resetPasswordExpire");

        if (!updatedCoreUser) {
          throw new NotFoundError("Your user account could not be found for profile update.");
        }
      } catch (mongooseError) {
        if (mongooseError.name === "MongoServerError" && mongooseError.code === 11000) {
          const field = Object.keys(mongooseError.keyValue)[0];
          throw new ConflictError(`The ${field} "${mongooseError.keyValue[field]}" is already taken.`);
        }
        console.error("Mongoose error during update:", mongooseError);
        throw new DatabaseError("Failed to update user profile due to a database issue.");
      }
    } else {
      updatedCoreUser = await CoreUserModel.findOne(coreUserQuery)
        .select("-password -confirmationCode -resetPasswordToken -resetPasswordExpire");
      if (!updatedCoreUser) {
        throw new NotFoundError("Your user account could not be found after password update.");
      }
    }

    // --- Sync name/email to TenantUserInOrg (main-db mapping) ---
    if (
      UserInOrgModel &&
      tenantId &&
      (filteredUpdateData.email || filteredUpdateData.first_name || filteredUpdateData.last_name)
    ) {
      const userInOrg = await UserInOrgModel.findOne({ org_id: tenantId, _id: userId });
      if (userInOrg) {
        if (filteredUpdateData.email && filteredUpdateData.email !== requester.email)
          userInOrg.email = filteredUpdateData.email;
        if (filteredUpdateData.first_name) userInOrg.first_name = filteredUpdateData.first_name;
        if (filteredUpdateData.last_name) userInOrg.last_name = filteredUpdateData.last_name;
        await userInOrg.save();
      } else {
        console.warn(
          `TenantUserInOrg not found for tenantId: ${tenantId}, userId: ${userId}. Name/Email not synced.`
        );
      }
    }

    return updatedCoreUser;
  } catch (error) {
    if (error instanceof AppError) throw error;
    console.error("Unexpected error updating self profile:", error);
    throw new DatabaseError("An unexpected server error occurred while updating your profile.");
  }
}

async deleteSelf({ requester, models }) {
  try {
    const { Superadmin, TenantUser, TenantUserInOrg } = models;
    let UserModel;
    let UserInOrgModel; // Declare UserInOrgModel here

    if (requester.access_level === 5 && Superadmin) {
      UserModel = Superadmin;
    } else if (TenantUser) {
      UserModel = TenantUser;
      
      if (TenantUserInOrg) {
        UserInOrgModel = TenantUserInOrg; // Assign if it exists
      }
    } else {
      throw new DatabaseError('Server configuration error: No appropriate user model found.');
    }

    const userId = requester._id.toString();
    const newEmail = requester.email;
    const userToDelete = await UserModel.findOne({ email: newEmail });
    console.log("userToDelete",userToDelete);
    if (!userToDelete) {
      throw new NotFoundError('User not found');
    }

    // Check if the user is a super admin and prevent self-deletion
    if (requester.access_level === 5) {
       throw new AuthorizationError('Super admins cannot delete their own account through this endpoint. Please contact support.');
    }

    // Delete from the primary user model (Superadmin or TenantUser)
    await UserModel.deleteOne({ _id: userToDelete._id });

    // If TenantUserInOrg model exists, delete the corresponding entry
    if (UserInOrgModel) {
      await UserInOrgModel.deleteOne({ _id: userId }); // Assuming 'user' field links to TenantUser._id
    }

    return { success: true };
  } catch (error) {
    if (error instanceof NotFoundError || error instanceof AuthorizationError || error instanceof DatabaseError) {
      throw error;
    }
    console.error("Error deleting self account:", error);
    throw new DatabaseError('Failed to delete self account');
  }
}
}

module.exports = new UserService();