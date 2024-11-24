const User = require('../Models/UserSchema');
const bcrypt = require('bcryptjs');

// Fetch all users
const fetchUsers = async () => {
  try {
    const users = await User.find({}, '-password'); // Exclude passwords
    return users;
  } catch (error) {
    throw new Error('Error fetching users');
  }
};

// Update user profile
const updateUser = async (id, updateData) => {
  try {
    const user = await User.findById(id);
    if (!user) {
      throw new Error('User not found');
    }

    // Update fields
    if (updateData.email) {
      const emailExists = await User.findOne({ email: updateData.email });
      if (emailExists && emailExists.id !== id) {
        throw new Error('Email already in use');
      }
      user.email = updateData.email;
    }

    if (updateData.password) {
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(updateData.password, salt);
    }

    if (updateData.first_name) user.first_name = updateData.first_name;
    if (updateData.last_name) user.last_name = updateData.last_name;

    user.updated_at = new Date();

    return await user.save();
  } catch (error) {
    throw new Error(error.message || 'Error updating user profile');
  }
};

// Delete user account
const deleteUser = async (id) => {
  try {
    const user = await User.findById(id);
    if (!user) {
      throw new Error('User not found');
    }

    await user.remove();
    return true;
  } catch (error) {
    throw new Error(error.message || 'Error deleting user account');
  }
};

module.exports = {
  fetchUsers,
  updateUser,
  deleteUser,
};
