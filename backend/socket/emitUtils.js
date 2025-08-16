const {  getIoInstance: getSocket} = require("./index");

function notifyUser(userId, event, data) {
  try {
    if (!userId) {
      console.error(`[Notify Error] Attempted to notify a null or undefined user for event: "${event}"`);
      return;
    }

    const userRoom = userId.toString();
    const socket = getSocket();

    console.log(`📤 Emitting to room "${userRoom}", event: "${event}"`);
    socket.to(userRoom).emit(event, data);

  } catch (error) {
    console.error(`[Notify Error] A critical error occurred while trying to emit event "${event}" to user "${userId}".`);
    console.error(error);
  }
}
function notifyOrg(orgId, event, data) {
  getSocket().to(`org:${orgId}`).emit(event, data);
}

function notifyRole(orgId, role, event, data) {
  getSocket().to(`org:${orgId}:role:${role}`).emit(event, data);
}

module.exports = { notifyUser, notifyOrg, notifyRole };
