
const userService = require('../Services/userService');
const { 
  getFromCache, 
  setToCache, 
  deleteFromCache, 
  clearPattern,
  generateCacheKey
} = require('../redisUtils');
const mongoose = require('mongoose');
const { AppError } = require('../utils/errors');
class UserController {

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
  async adminUpdateUser(req, res, next) {
    try {
      const {  User } = req.tenantModels;
      const cache = req.tenantCache;
      const user = await userService.adminUpdateUser(
        req.params.id, 
        req.body, 
        req.user,
        User
      );
      
      await cache.delPattern(`tasks:org:${req.user.org_id}:*`);

      res.status(200).json({
        success: true,
        data: user,
        message: "User updated successfully"
      });
    } catch (err) {
      next(err);
    }
  }
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
  async updateMe(req, res, next) {
    try {
      // self-profile only; ignore path id if present
      const { User } = req.tenantModels || {};
      const Superadmin = mongoose.model('Superadmin');
      const TenantUser = mongoose.model('TenantUser');
     
      const updated = await userService.updateSelf({
        requester: req.user,           
        updateData: req.body,
        models: { Superadmin, TenantUser, TenantUserInOrg: User }, // pass all
      });

      // optional: bust tenant caches if we’re inside an org
      if (req.tenantCache && req.user?.org_id) {
        await req.tenantCache.delPattern(`tasks:org:${req.user.org_id}:*`);
      }

      res.status(200).json({
        success: true,
        data: updated,
        message: 'User updated successfully',
      });
    } catch (err) {
     
      if (err instanceof AppError) {
        return res.status(err.statusCode).json({
          success: false,
          message: err.message,
          ...(err.name === 'ValidationError' && err.errors && err.errors.length > 0 && { errors: err.errors })
        });
      }
      console.error('Unhandled error in updateMe controller:', err);
      return res.status(500).json({
        success: false,
        message: 'An unexpected server error occurred.',
      });
     
    }
  }
  async deleteMe(req, res, next) {
    try {
      const { User } = req.tenantModels || {};
      const Superadmin = mongoose.model('Superadmin');
      const TenantUser = mongoose.model('TenantUser');
      const cache = req.tenantCache;
      await userService.deleteSelf({
        requester: req.user,
        models: { Superadmin, TenantUser, TenantUserInOrg: User },
      });

      await cache.delPattern(`tasks:org:${req.user.org_id}:*`);

      res.status(200).json({
        success: true,
        data: {},
        message: 'User deleted successfully',
      });
    } catch (err) {
      if (err instanceof AppError) {
        return res.status(err.statusCode).json({
          success: false,
          message: err.message,
          ...(err.name === 'ValidationError' && err.errors && err.errors.length > 0 && { errors: err.errors })
        });
      }
      console.error('Unhandled error in deleteMe controller:', err);
      return res.status(500).json({
        success: false,
        message: 'An unexpected server error occurred.',
      });
    }
  }
}

module.exports = new UserController();