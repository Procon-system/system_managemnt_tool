import { io } from "socket.io-client";
import store from "./Store/store"; // Your Redux store
import { addNotification } from "./features/notificationSlice";
import {
  addTask,
  // updateTask, // We'll add this to your taskSlice
  // removeTask, // We'll add this to your taskSlice
} from "./features/taskSlice"; // Import new task actions

let socket;

export const connectSocket = (token) => {
  socket = io(process.env.REACT_APP_SOCKET_URL || "https://app.tasknitter.com", {
    auth: {
      token,
    },
    transports: ["websocket"],
    withCredentials: true,
  });

  socket.on("connect", () => {
    console.log("✅ Socket connected:", socket.id);
  });

  socket.on("disconnect", () => {
    console.warn("❌ Socket disconnected");
  });

  socket.on("connect_error", (err) => {
    console.error("⚠️ Socket connection error:", err.message);
  });

  socket.on("task:updated", (data) => {
    console.log("📬 Notification received:", data);
    store.dispatch(addNotification({ ...data, isRead: false }));
  });

  socket.on("task:assigned", (data) => {
    console.log("📬 Notification received:", data);
    store.dispatch(addNotification({ ...data, isRead: false }));
  });

  socket.on("task:deleted", (data) => {
    console.log("📬 Notification received:", data);
    store.dispatch(addNotification({ ...data, isRead: false }));
  });

  socket.on("task:created", (payload) => {
    console.log("🆕 Real-time task created:", payload);
    if (payload) {
      store.dispatch(addTask(payload.createdTask));
      
      store.dispatch(addNotification({
        _id: payload.notificationId || `temp-task-created-${payload._id}-${Date.now()}`,
        type: 'task:created',
        title: 'New Task Created', 
        message: payload.message || `New task "${payload.title}" created.`,
        referenceId: payload._id,
        organization: payload.organization, 
        createdBy: payload.createdBy,    
        createdAt: new Date().toISOString(),
        isRead: false 
      }));
    }
  });

  
};

export const getSocket = () => socket;
