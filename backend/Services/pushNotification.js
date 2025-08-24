
const { Expo } = require('expo-server-sdk');
const expo = new Expo();

function buildMessages(tokens, { title, body, data, sound = 'default', priority = 'high' }) {
  return tokens
    .filter(t => Expo.isExpoPushToken(t))
    .map(t => ({
      to: t,
      title,
      body,
      data: data || {},
      sound,
      priority,
      channelId: 'default', 
    }));
}

async function sendPushBatch(messages) {
  const tickets = [];
  const chunks = expo.chunkPushNotifications(messages);
  for (const chunk of chunks) {
    const ticketChunk = await expo.sendPushNotificationsAsync(chunk);
    tickets.push(...ticketChunk);
  }
  return tickets;
}

async function fetchAndHandleReceipts(tickets = []) {
  const receiptIds = tickets
    .map(t => t.id)
    .filter(Boolean);

  const receiptChunks = expo.chunkPushNotificationReceiptIds(receiptIds);
  const receipts = [];
  for (const chunk of receiptChunks) {
    const result = await expo.getPushNotificationReceiptsAsync(chunk);
    receipts.push(result);
  }
  return receipts;
}

module.exports = {
  buildMessages,
  sendPushBatch,
  fetchAndHandleReceipts,
};
