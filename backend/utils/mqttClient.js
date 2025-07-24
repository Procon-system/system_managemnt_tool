// src/mqttClient.js
const mqtt = require('mqtt');

const url = process.env.MQTT_URL;
const opts = {
  // A unique client ID is important for brokers
  clientId: `api-server-${Math.random().toString(16).substring(2, 10)}`,
  clean: true,
  connectTimeout: 4000,
  reconnectPeriod: 5000, // try to reconnect every 5 seconds
};

console.log(`🔌 Attempting to connect to MQTT broker at ${url}`);
const mqttClient = mqtt.connect(url, opts);

mqttClient.on('connect', () => {
  console.log(`✅ MQTT client connected to ${url}`);
});

mqttClient.on('error', (err) => {
  console.error('⚠️ MQTT connection error:', err);
  // It will attempt to reconnect automatically due to the reconnectPeriod option
});

mqttClient.on('close', () => {
    console.log(' MQTT client disconnected.');
});

// Export the single, shared client instance
module.exports = { mqttClient };