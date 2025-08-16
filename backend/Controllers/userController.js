
const userService = require('../Services/userService');
const { 
  getFromCache, 
  setToCache, 
  deleteFromCache, 
  clearPattern,
  generateCacheKey
} = require('../redisUtils');

// Cache TTL configuration
const CACHE_TTL = {
  USER: 3600,        // 1 hour for individual users
  USER_LIST: 1800,   // 30 minutes for user lists
  DEFAULT: 1200      // 20 minutes default
};

class UserController {
  // Get all users
  async getAllUsers(req, res, next) {
    try {
      const cacheKey = generateCacheKey('users', req.user.org_id);
      const {  User } = req.tenantModels;
      const users = await userService.getAllUsers(req.user,User);
     
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
      const cacheKey = generateCacheKey('user', req.user.org_id, { id: req.params.id });
      const {  User } = req.tenantModels;
      const user = await userService.getUser(req.params.id, req.user,User);
      
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
      const {  User } = req.tenantModels;
      const user = await userService.updateUser(
        req.params.id, 
        req.body, 
        req.user,
        User
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
      const {  User } = req.tenantModels;
      const user = await userService.adminUpdateUser(
        req.params.id, 
        req.body, 
        req.user,
        User
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
      const {  User } = req.tenantModels;
      await userService.deleteUser(req.params.id, req.user,User);
      
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