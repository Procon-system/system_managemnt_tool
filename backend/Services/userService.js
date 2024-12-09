const { db } = require('../config/couchdb'); // CouchDB connection
const UserModel = require('../Models/UserSchema'); // User schema
const bcrypt = require('bcryptjs');

/**
 * Format a user based on the UserModel schema.
 */
const formatUser = (userData) => {
  const formattedUser = { ...UserModel, ...userData };
  formattedUser.created_at = formattedUser.created_at || new Date().toISOString();
  formattedUser.updated_at = new Date().toISOString();
  return formattedUser;
};

/**
 * Fetch all users (excluding passwords).
 */
const fetchUsers = async () => {
  try {
    const result = await db.find({
      selector: { type: UserModel.type },
      fields: ['_id', 'email', 'first_name', 'last_name', 'personal_number', 'access_level', 'isConfirmed', 'created_at', 'updated_at'], // Exclude password
    });
    return result.docs;
  } catch (error) {
    throw new Error('Error fetching users: ' + error.message);
  }
};

/**
 * Update a user by ID.
 */
const updateUser = async (id, updateData) => {
  try {
    const existingUser = await db.get(id);
    if (!existingUser) throw new Error('User not found');

    // Validate email uniqueness
    if (updateData.email && updateData.email !== existingUser.email) {
      const emailExists = await db.find({
        selector: { type: UserModel.type, email: updateData.email },
      });
      if (emailExists.docs.length > 0) throw new Error('Email already in use');
    }

    // Hash password if updated
    if (updateData.password) {
      const salt = await bcrypt.genSalt(10);
      updateData.password = await bcrypt.hash(updateData.password, salt);
    }

    // Merge updates and save
    const updatedUser = formatUser({ ...existingUser, ...updateData });
    const response = await db.insert(updatedUser);
    return response;
  } catch (error) {
    throw new Error('Error updating user: ' + error.message);
  }
};

/**
 * Delete a user by ID.
 */
const deleteUser = async (id) => {
  try {
    const user = await db.get(id);
    if (!user) throw new Error('User not found');
    const response = await db.destroy(id, user._rev);
    return response;
  } catch (error) {
    throw new Error('Error deleting user: ' + error.message);
  }
};


module.exports = {
  fetchUsers,
  updateUser,
  deleteUser,
  
};
