const {  getIoInstance: getSocket} = require("./index");

function notifyUser(userId, event, data) {
  const userRoom = userId.toString(); 
  
  console.log(`📤 Emitting to room "${userRoom}", event: ${event}`);
  getSocket().to(userRoom).emit(event, data);
}

function notifyOrg(orgId, event, data) {
  getSocket().to(`org:${orgId}`).emit(event, data);
}

function notifyRole(orgId, role, event, data) {
  getSocket().to(`org:${orgId}:role:${role}`).emit(event, data);
}

module.exports = { notifyUser, notifyOrg, notifyRole };
