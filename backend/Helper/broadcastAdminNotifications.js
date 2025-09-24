// helpers/broadcastAdminNotifications.js
async function broadcastAdminNotifications({ orgId, createdTask, NotificationModel, tenantDB, notifyAccessRange }) {
 
  const UserModel =tenantDB.models?.get?.('User') || tenantDB.model?.('User');
      // tenantDB.models?.get?.('TenantUser') || tenantDB.model?.('TenantUser')      || 
    if (!UserModel) {
      console.warn('[AdminNotif] No User model found; sending socket only.');
      notifyAccessRange(orgId, 3, 5, 'task:created:admin', task);
      return { inserted: 0 };
    }
  
    // Get admins (roles 3..5). Adjust field names to your schema.
    const admins = await UserModel.find(
      { access_level: { $gte: 3, $lte: 5 }, isActive: { $ne: false } },
      { _id: 1 }
    ).lean();
  
    if (!admins.length) {
        
      notifyAccessRange(orgId, 3, 5, 'task:created:admin', createdTask);
      return { inserted: 0 };
    }
  
    const docs = admins.map(u => ({
      user: u._id,
      organization: orgId,
      title: 'New Task Created',
      message: `“${createdTask.title}” for ${new Date(createdTask.schedule.start).toLocaleDateString()}`,
      type: 'task',
      referenceId: createdTask._id,
      referenceModel: 'Task',
      isRead: false
    }));
   
    await NotificationModel.insertMany(docs, { ordered: false });
  
    // Realtime event (unchanged)
    notifyAccessRange(orgId, 3, 5, 'task:created:admin', createdTask);
  
    return { inserted: docs.length };
  }
  
  module.exports = { broadcastAdminNotifications };
  