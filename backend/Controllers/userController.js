const userService = require('../Services/userService');

class UserController {
  // Get all users
  async getAllUsers(req, res, next) {
    try {
      const users = await userService.getAllUsers(req.user);
      res.status(200).json({
        success: true,
        count: users.length,
        data: users
      });
    } catch (err) {
      next(err);
    }
  }

  // Get single user
  async getUser(req, res, next) {
    try {
      const user = await userService.getUser(req.params.id, req.user);
      res.status(200).json({
        success: true,
        data: user
      });
    } catch (err) {
      next(err);
    }
  }

  // Update user
  async updateUser(req, res, next) {
    try {
      const user = await userService.updateUser(
        req.params.id, 
        req.body, 
        req.user
      );
      res.status(200).json({
        success: true,
        data: user,
        message: "User updated successfully"
      });
    } catch (err) {
      next(err);
    }
  }

  // Admin update user
  async adminUpdateUser(req, res, next) {
    try {
      const user = await userService.adminUpdateUser(
        req.params.id, 
        req.body, 
        req.user
      );
      res.status(200).json({
        success: true,
        data: user,
        message: "User updated successfully"
      });
    } catch (err) {
      next(err);
    }
  }

  // Delete user
  async deleteUser(req, res, next) {
    try {
      await userService.deleteUser(req.params.id, req.user);
      res.status(200).json({
        success: true,
        data: {},
        message: "User deleted successfully"
      });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new UserController();