import { api } from './api';
import { useArena } from '../stores/arena';
let socket, pending;
export async function getSocket() {
  if (socket?.connected) return socket;
  if (pending) return pending;
  pending = (async () => {
    await api.post('/session');
    if (!socket) {
      const { io } = await import('socket.io-client');
      socket = io(import.meta.env.VITE_API_URL || undefined, {
        withCredentials: true,
        autoConnect: false,
      });
      socket.on('connect', () => {
        useArena.setState({ connected: true });
        socket.emit('room:sync', {}, (r) => {
          if (r.ok) useArena.setState({ room: r.room, slot: r.slot });
        });
      });
      socket.on('disconnect', () => useArena.setState({ connected: false }));
      socket.on('room:state', (room) => useArena.setState({ room }));
      socket.on('room:closed', ({ message }) =>
        useArena.setState({ room: null, slot: null, notice: message })
      );
      socket.on('server:error', ({ message }) => useArena.getState().toast(message));
    }
    await new Promise((resolve, reject) => {
      const success = () => {
          cleanup();
          resolve();
        },
        failure = (e) => {
          cleanup();
          reject(e);
        },
        cleanup = () => {
          socket.off('connect', success);
          socket.off('connect_error', failure);
        };
      socket.once('connect', success);
      socket.once('connect_error', failure);
      socket.connect();
    });
    return socket;
  })();
  try {
    return await pending;
  } finally {
    pending = null;
  }
}
export async function emit(event, data = {}) {
  const s = await getSocket();
  return new Promise((resolve, reject) => {
    s.timeout(5000).emit(event, data, (err, r) => {
      if (err) return reject(new Error('Server did not respond. Please reconnect.'));
      if (!r.ok) return reject(new Error(r.error));
      resolve(r);
    });
  });
}
export async function leaveRoom() {
  if (useArena.getState().room) await emit('room:leave');
  useArena.setState({ room: null, slot: null });
}
export function resetSocket() {
  socket?.disconnect();
  socket = null;
  useArena.setState({ connected: false, room: null, slot: null });
}
