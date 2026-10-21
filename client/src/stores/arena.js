import { create } from 'zustand';
export const useArena = create((set) => ({
  room: null,
  slot: null,
  connected: false,
  notice: null,
  setRoom: (room) => set({ room }),
  setSlot: (slot) => set({ slot }),
  toast: (notice) => set({ notice }),
}));
