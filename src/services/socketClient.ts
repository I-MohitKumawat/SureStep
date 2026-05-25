/**
 * SureStep — src/services/socketClient.ts
 * WebSocket client factory using Socket.IO.
 * Rooms scoped by patient_id to prevent data leakage across patients.
 * TDD Section 8.3.
 *
 * Usage:
 *   const socket = connectSocket(accessToken);
 *   socket.emit('join:patient', patientId);
 *   socket.on('task:update', handler);
 *   socket.on('state:change', handler);
 *   socket.on('alert:new', handler);
 *   socket.on('voice:message', handler);
 */

// Socket.IO client — install with: npm install socket.io-client
// Type stubs below allow this file to compile before the package is installed.
type Socket = {
  on:         (event: string, handler: (...args: any[]) => void) => void;
  off:        (event: string, handler?: (...args: any[]) => void) => void;
  emit:       (event: string, ...args: any[]) => void;
  disconnect: () => void;
  connected:  boolean;
};

let socket: Socket | null = null;

export const connectSocket = (accessToken: string): Socket => {
  if (socket?.connected) return socket;

  // Dynamic import avoids crash if socket.io-client is not yet installed
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { io } = require('socket.io-client') as { io: (url: string, opts: object) => Socket };
    socket = io(process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000', {
      auth:       { token: accessToken },
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay:    1000,
    });
  } catch {
    console.warn('[socketClient] socket.io-client not installed — WebSocket disabled');
    // Return a no-op socket so callers do not crash
    socket = {
      on:         () => {},
      off:        () => {},
      emit:       () => {},
      disconnect: () => {},
      connected:  false,
    };
  }

  return socket;
};

export const disconnectSocket = () => {
  socket?.disconnect();
  socket = null;
};

export const getSocket = (): Socket | null => socket;

/**
 * Context subscriptions — each context calls these on mount.
 * TaskContext:         socket.on('task:update', ...)
 * PatientStateContext: socket.on('state:change', ...)
 * AlertContext:        socket.on('alert:new', ...)
 * VoiceContext:        socket.on('voice:message', ...)
 */
