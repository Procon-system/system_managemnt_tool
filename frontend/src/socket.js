import { io } from "socket.io-client";
import store from "./Store/store"; // Your Redux store
import { addNotification } from "./features/notificationSlice";
import {
  addTask,
  upsertTask
} from "./features/taskSlice"; // Import new task actions

let socket;
const normalizeTask = (t) => ({
  ...t,
  _id: String(t._id),
  schedule: t?.schedule
    ? {
        ...t.schedule,
        start: t.schedule.start ? String(t.schedule.start) : null,
        end: t.schedule.end ? String(t.schedule.end) : null,
      }
    : null,
});
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

  socket.on("task:assigned", (data) => {
    console.log("📬 Notification received:", data);
    store.dispatch(addNotification({ ...data, isRead: false }));
  });
  
  socket.on("task:updated", (payload) => {
    store.dispatch(addNotification({ ...payload, isRead: false }));
    if (payload?.taskPayload?._id) {
      store.dispatch(upsertTask(normalizeTask(payload.taskPayload)));
    }
  });
  socket.on("task:deleted", (data) => {
    console.log("📬 Notification received:", data);
    store.dispatch(addNotification({ ...data, isRead: false }));
  });

const seenTaskCreated = new Set(); 
const SEEN_TTL_MS = 15000;

socket.on("task:created", (payload) => {
  if (!payload) return;

  const items = Array.isArray(payload.createdTask)
    ? payload.createdTask
    : [payload.createdTask].filter(Boolean);

  items.forEach((t) => t && store.dispatch(addTask(t)));

  let targets = [];
  if (Array.isArray(payload.createdTask) && payload.taskId) {
    const match = items.find((t) => t && t._id === payload.taskId);
    if (match) targets = [match];
  } else {
    if (items.length) targets = [items[0]];
  }

  targets.forEach((t) => {
    const key = t._id;
    if (seenTaskCreated.has(key)) return;
    seenTaskCreated.add(key);
    setTimeout(() => seenTaskCreated.delete(key), SEEN_TTL_MS);

    store.dispatch(
      addNotification({
        _id: key,
        type: "task:created",
        title: "New Task Created",
        message: payload.message || `New task "${t.title}" created.`,
        referenceId: t._id,
        organization: payload.organization || t.organization,
        createdBy: payload.createdBy,
        createdAt: new Date().toISOString(),
        isRead: false,
      })
    );
  });
});


  socket.on("task:created:admin", (payload) => {
    console.log("👑 Admin task created:", payload);
    if (payload) {
      store.dispatch(addTask(payload));
      
      store.dispatch(
        addNotification({
          _id: payload._id,
          type: "task:created:admin",
          title: "Task Created in Org",
          message: `Task "${payload.title}" was created by ${payload.createdBy?.name || "Service monitor"}.`,
          referenceId: payload.taskId,
          organization: payload.organization,
          createdBy: payload.createdBy,
          createdAt: new Date().toISOString(),
          isRead: false,
        })
      );
    }
  });
};

export const getSocket = () => socket;
