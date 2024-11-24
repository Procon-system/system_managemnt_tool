const { fetchUsers, updateUser, deleteUser } = require('../Services/userService');

// Controller to fetch all users
const getUsers = async (req, res) => {
  try {
    const users = await fetchUsers();
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Controller to update user profile
const updateUserProfile = async (req, res) => {
  const { id } = req.params; // ID of the user being updated
  const loggedInUserId = req.user.id; // ID of the logged-in user (extracted from token)
  const { email, password, first_name, last_name } = req.body;

  try {
    // Check if the logged-in user matches the user being updated
    if (id !== loggedInUserId) {
      return res.status(403).json({ error: 'You can only update your own profile' });
    }

    const updatedUser = await updateUser(id, { email, password, first_name, last_name });
    res.status(200).json({ message: 'User profile updated successfully', user: updatedUser });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Controller to delete user account
const deleteUserAccount = async (req, res) => {
  const { id } = req.params; // ID of the user being deleted
  const loggedInUserId = req.user.id; // ID of the logged-in user (extracted from token)

  try {
    // Check if the logged-in user matches the user being deleted
    if (id !== loggedInUserId) {
      return res.status(403).json({ error: 'You can only delete your own account' });
    }

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
  updateUserProfile,
  deleteUserAccount,
};
