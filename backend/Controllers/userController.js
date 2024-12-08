const { 
  fetchUsers,
  updateUser,
  deleteUser
} = require('../Services/userService');

// Controller to fetch all users
const getUsers = async (req, res) => {
  try {
    const users = await fetchUsers();
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
const getUsersByIds = async (req, res) => {
  try {
    const { userIds } = req.body; // Expect an array of user IDs in the request body
    if (!Array.isArray(userIds)) {
      return res.status(400).json({ error: 'Invalid input: userIds must be an array' });
    }

    const users = await User.find({ _id: { $in: userIds } }, '-password'); // Exclude passwords
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Controller to update user profile
const updateUserProfile = async (req, res) => {
  const { id } = req.params;
  const loggedInUserId = req.user.id; // ID of the logged-in user (from token)
  const { email, password, first_name, last_name, access_level } = req.body; // Include 'status' in request body
   console.log("req",req.body)
  try {
    // Authorization check for updating own profile or admin-level access
    if (id !== loggedInUserId && req.user.access_level < 4) {
      return res.status(403).json({ error: 'You are not authorized to update this profile' });
    }

    // Restrict status updates to access levels > 4
    if (access_level !== undefined && req.user.access_level <= 4) {
      return res.status(403).json({ error: 'You are not authorized to update the status field' });
    }

    // Perform the update
    const updatedUser = await updateUser(id, { email, password, first_name, last_name, access_level });
    if (!updatedUser) {
      return res.status(404).json({ error: 'User not found or not updated' });
    }

    res.status(200).json({
      message: 'User profile updated successfully',
      user: updatedUser
    });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ error: error.message });
  }
};

// Controller to delete user account
const deleteUserAccount = async (req, res) => {
  const { id } = req.params; // ID of the user being deleted
  const loggedInUserId = req.user.id; // ID of the logged-in user (extracted from token)

  try {
    // Check if the logged-in user matches the user being deleted
    // if (id !== loggedInUserId) {
    //   return res.status(403).json({ error: 'You can only delete your own account' });
    // }

    const success = await deleteUser(id);
    if (success) {
      res.status(200).json({ message: 'User account deleted successfully' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  getUsers,
  getUsersByIds,
  updateUserProfile,
  deleteUserAccount,
};
