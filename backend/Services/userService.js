const {
  NotFoundError,
  AuthorizationError,
  ValidationError,
  ConflictError,
  DatabaseError
} = require('../utils/errors');

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
async updateSelf({ requester, updateData, models }) {
  try {
    const { Superadmin, TenantUser, TenantUserInOrg } = models;
    let CoreUserModel;
    let UserInOrgModel;
    let searchField; 

    if (requester.access_level === 5 && Superadmin) {
      CoreUserModel = Superadmin;
      searchField = '_id';
    } else if (TenantUser) {
      CoreUserModel = TenantUser;
      searchField = 'email'; 
      if (TenantUserInOrg) {
        UserInOrgModel = TenantUserInOrg;
      }
    } else {
      throw new Error('No appropriate core user model found for updateSelf');
    }

    const userId = requester._id.toString(); 
    const userEmail = requester.email; 
    const tenantId = requester.org_id ? requester.org_id.toString() : null; 

    const allowedFields = ['first_name', 'last_name', 'email', 'personal_number', 'phone', 'address', 'profilePicture']; 
    const filteredUpdateData = {};
    for (const key in updateData) {
      if (allowedFields.includes(key)) {
        filteredUpdateData[key] = updateData[key];
      }
    }

    if (Object.keys(filteredUpdateData).length === 0 && !updateData.password) {
      throw new ValidationError('No valid fields or password provided for update');
    }

    let coreUserQuery = {};
    if (searchField === '_id') {
      coreUserQuery._id = userId;
    } else {
      coreUserQuery.email = userEmail;
    }


    if (updateData.password) {
      const user = await CoreUserModel.findOne(coreUserQuery);
      if (!user) throw new NotFoundError('User not found for password update');
      user.password = updateData.password; 
      await user.save();
      delete filteredUpdateData.password; 
    }

    let updatedCoreUser;
    let updatedUserInOrg;
    if (Object.keys(filteredUpdateData).length > 0) {
    
      updatedCoreUser = await CoreUserModel.findOneAndUpdate(
        coreUserQuery,
        { $set: filteredUpdateData },
        { new: true, runValidators: true }
      ).select('-password -confirmationCode -resetPasswordToken -resetPasswordExpire');

      if (!updatedCoreUser) throw new NotFoundError('Core User not found during self-update');
    } else {
      updatedCoreUser = await CoreUserModel.findOne(coreUserQuery).select('-password -confirmationCode -resetPasswordToken -resetPasswordExpire');
      if (!updatedCoreUser) throw new NotFoundError('Core User not found after password update');
    }
    if (UserInOrgModel && filteredUpdateData.email && tenantId) {
        const userInOrg = await UserInOrgModel.findOne({
        org_id: tenantId,
        _id: userId 
      });

      if (userInOrg) {
        userInOrg.email = filteredUpdateData.email;
        if (filteredUpdateData.first_name) userInOrg.first_name = filteredUpdateData.first_name;
        if (filteredUpdateData.last_name) userInOrg.last_name = filteredUpdateData.last_name;
        updatedUserInOrg = await userInOrg.save();
      } else {
        console.warn(`TenantUserInOrg not found for tenantId: ${tenantId}, userIdInTenantDB: ${userId}. Email not synced.`);
      }
    }

    // Return the primary updated user object. You might want to combine data if needed.
    return updatedCoreUser;

  } catch (error) {
    if (error instanceof NotFoundError || error instanceof ValidationError) {
      throw error;
    }
    console.error('Error updating self profile:', error);
    throw new DatabaseError('Failed to update self profile');
  }
}
async deleteSelf({ requester, models }) {
  try {
    const { Superadmin, TenantUser, TenantUserInOrg } = models;
    let UserModel;

    if (requester.scope === 'superadmin' && Superadmin) {
      UserModel = Superadmin;
    } else if (requester.scope === 'tenant_user' && TenantUserInOrg) {
      UserModel = TenantUserInOrg;
    } else if (TenantUser) {
      UserModel = TenantUser;
    } else {
      throw new Error('No appropriate user model found for deleteSelf');
    }

    const userId = requester._id.toString();
    const userToDelete = await UserModel.findById(userId);

    if (!userToDelete) {
      throw new NotFoundError('User not found');
    }

    // Prevent super admins from deleting themselves without special processes
    // Or require a different endpoint for super admin self-deletion
    if (userToDelete.access_level === 5) { // Assuming 5 is super admin
       throw new AuthorizationError('Super admins cannot delete their own account through this endpoint. Please contact support.');
    }

    await UserModel.deleteOne({ _id: userId });

    return { success: true };
  } catch (error) {
    if (error instanceof NotFoundError || error instanceof AuthorizationError) {
      throw error;
    }
    console.error("Error deleting self account:", error);
    throw new DatabaseError('Failed to delete self account');
  }
}
}

module.exports = new UserService();