import { create } from 'zustand';

interface SocketState {
  onlineUsers: Set<string>;
  setOnlineUsers: (users: Set<string>) => void;
  addOnlineUser: (userId: string) => void;
  removeOnlineUser: (userId: string) => void;
}

export const useSocketStore = create<SocketState>((set) => ({
  onlineUsers: new Set(),
  setOnlineUsers: (users) => set({ onlineUsers: users }),
  
  addOnlineUser: (userId) => set((state) => ({ 
      onlineUsers: new Set(state.onlineUsers).add(userId) 
  })),
  
  removeOnlineUser: (userId) => set((state) => {
    const newSet = new Set(state.onlineUsers);
    newSet.delete(userId);
    return { onlineUsers: newSet };
  }),
}));