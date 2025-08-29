// src/services/mqttService.js
import mqtt from 'mqtt';
import { addMultipleTasksFromSocket } from './slices/taskSlice'; // Adjust path
// You will need to create this action in the next step
import { updateTaskFromSocket } from './slices/taskSlice'; // Adjust path

let mqttClient = null;

const MQTT_URL = 'ws://your-mqtt-broker-address:8083/mqtt'; // Use WS or WSS for browsers

export const connectMqtt = (dispatch, orgId) => {
  if (mqttClient || !orgId) {
    return; // Already connected or no organization to connect for
  }

  console.log(`🔌 Attempting to connect to MQTT broker for organization: ${orgId}`);
  mqttClient = mqtt.connect(MQTT_URL, {
    clientId: `frontend-${orgId}-${Math.random().toString(16).slice(2)}`,
    // Add username/password if your broker requires it
  });

  mqttClient.on('connect', () => {
    console.log('✅ MQTT Client Connected');

    // Subscribe to the topics the backend now publishes to
    const createTaskTopic = `organizations/${orgId}/tasks/created`;
    const updateTaskTopic = `organizations/${orgId}/tasks/updated`;
    
    mqttClient.subscribe([createTaskTopic, updateTaskTopic], { qos: 1 }, (err) => {
      if (!err) {
        console.log(`<sub> Subscribed to: ${createTaskTopic} & ${updateTaskTopic}`);
      }
    });
  });

  mqttClient.on('message', (topic, message) => {
    try {
      const payload = JSON.parse(message.toString());
      console.log(`📨 MQTT Message received on topic ${topic}:`, payload);
      
      const topicParts = topic.split('/');
      const action = topicParts[topicParts.length - 1]; // 'created' or 'updated'

      switch (action) {
        case 'created':
          dispatch(addMultipleTasksFromSocket(payload));
          break;
        case 'updated':
          dispatch(updateTaskFromSocket(payload));
          break;
        default:
          break;
      }
    } catch (e) {
      console.error('Failed to parse MQTT message:', e);
    }
  });

  mqttClient.on('error', (err) => {
    console.error('MQTT Error:', err);
    mqttClient.end();
  });

  mqttClient.on('close', () => {
    console.log('MQTT Client Disconnected');
    mqttClient = null; // Allow reconnection
  });
};

export const disconnectMqtt = () => {
  if (mqttClient) {
    mqttClient.end();
  }
};