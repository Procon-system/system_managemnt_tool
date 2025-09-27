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

// NEW: add {debug} logging (chunks, ticket ids)
async function sendPushBatch(messages, { debug = false } = {}) {
  const tickets = [];
  const chunks = expo.chunkPushNotifications(messages);

  if (debug) console.log(`📦 [Push] Sending in ${chunks.length} chunk(s).`);

  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    if (debug) console.log(`   🚀 [Push] Chunk ${i + 1}/${chunks.length} → ${chunk.length} message(s)`);
    const ticketChunk = await expo.sendPushNotificationsAsync(chunk);
    tickets.push(...ticketChunk);
    if (debug) console.log(`   🎟️ [Push] Chunk ${i + 1} ticket(s):`, ticketChunk.map(t => t?.id || t?.status || "no-id"));
  }

  if (debug) console.log(`✅ [Push] Sent ${messages.length} message(s); received ${tickets.length} ticket(s).`);
  return tickets;
}

async function fetchAndHandleReceipts(tickets = []) {
  const receiptIds = tickets.map(t => t?.id).filter(Boolean);
  const receipts = [];
  const receiptChunks = expo.chunkPushNotificationReceiptIds(receiptIds);
  for (const chunk of receiptChunks) {
    receipts.push(await expo.getPushNotificationReceiptsAsync(chunk));
  }
  return receipts;
}

module.exports = {
  buildMessages,
  sendPushBatch,
  fetchAndHandleReceipts,
  Expo, // exported in case you need Expo.isExpoPushToken elsewhere
};
