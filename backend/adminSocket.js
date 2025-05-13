const WebSocket = require('ws');

const socket = new WebSocket('ws://user-reg:8765'); // or whatever host:port Flask pushes to

socket.on('open', () => {
  console.log('🟢 WebSocket connected to user-reg');
});

socket.on('message', async (data) => {
  try {
    const adminData = JSON.parse(data);
    console.log('📥 Received admin data via WebSocket:', adminData);

    // Example: Trigger your sync logic or registration handler
    const result = await handleAdminRegistration(adminData);

    console.log('✅ Admin synced:', result);
  } catch (err) {
    console.error('❌ Error processing WebSocket message:', err.message);
  }
});

socket.on('close', () => {
  console.warn('🔌 WebSocket connection closed');
});

socket.on('error', (err) => {
  console.error('⚠️ WebSocket error:', err);
});
