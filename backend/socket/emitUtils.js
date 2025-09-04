const {  getIoInstance: getSocket} = require("./index");

function notifyUser(userId, event, data) {
  try {
    if (!userId) {
      console.error(`[Notify Error] Attempted to notify a null or undefined user for event: "${event}"`);
      return;
    }

    const userRoom = userId.toString();
    const socket = getSocket();

    console.log(`📤 Emitting to room "${userRoom}", event: "${event}", data: "${data}"`);
    socket.to(userRoom).emit(event, data);

  } catch (error) {
    console.error(`[Notify Error] A critical error occurred while trying to emit event "${event}" to user "${userId}".`);
    console.error(error);
  }
}
function notifyOrg(orgId, event, data) {
  try {
    if (!orgId) return console.error(`[Notify Error] Null org for event "${event}"`);
    const io = getSocket();
    const room = `org:${String(orgId)}`;
    const localCount = io.sockets.adapter.rooms.get(room)?.size || 0; // local node count
    console.log(`🏢 Emitting to room "${room}" (local members=${localCount}), event: "${event}"`);
    io.to(room).emit(event, data);
  } catch (err) {
    console.error(`[Notify Error] org emit failed (${event}):`, err);
  }
}

function notifyRole(orgId, role, event, data) {
  try {
    if (!orgId || !role) return console.error(`[Notify Error] Null org/role for event "${event}"`);
    const io = getSocket();
    const room = `org:${String(orgId)}:role:${String(role)}`;
    const localCount = io.sockets.adapter.rooms.get(room)?.size || 0;
    console.log(`👥 Emitting to room "${room}" (local members=${localCount}), event: "${event}"`);
    io.to(room).emit(event, data);
  } catch (err) {
    console.error(`[Notify Error] role emit failed (${event}):`, err);
  }
}

module.exports = { notifyUser, notifyOrg, notifyRole };
