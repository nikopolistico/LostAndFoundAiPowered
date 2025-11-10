import { io } from "socket.io-client";

// Centralized singleton Socket.IO client for the app.
// Use this instead of creating io(...) in many components to avoid
// duplicate connections and noisy connect/disconnect cycles.

const SOCKET_URL = "http://localhost:5000";

let socket = null;

export function initSocket() {
  if (!socket) {
    socket = io(SOCKET_URL, {
      withCredentials: true,
      autoConnect: true,
      reconnection: true,
      reconnectionDelay: 500,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: Infinity,
    });

    socket.on("connect_error", (err) => {
      console.error("Socket connect_error:", err);
    });

    socket.on("connect_timeout", (err) => {
      console.warn("Socket connect_timeout:", err);
    });

    socket.on("disconnect", (reason) => {
      console.warn("Socket disconnected:", reason);
      if (reason === "io server disconnect") {
        // Server-side disconnects require manual reconnect attempts
        try {
          socket.connect();
        } catch (err) {
          console.error("Failed to trigger manual reconnect:", err);
        }
      }
    });
  }

  return socket;
}

export function disconnectSocket() {
  if (!socket) return;

  try {
    socket.removeAllListeners();
  } catch (err) {
    // Best-effort cleanup; ignore listener removal issues
  }

  socket.disconnect();
  socket = null;
}

export function getActiveSocket() {
  return socket;
}

export default initSocket;
