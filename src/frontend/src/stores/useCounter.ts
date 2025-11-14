import { create } from "zustand";

type State = { 
  count: number 
};

type Actions = { 
  inc: () => void;
  dec: () => void;
  reset: () => void;
};

export const useCounter = create<State & Actions>((set) => ({
  count: 0,
  inc: () => set((s) => ({ count: s.count + 1 })),
  dec: () => set((s) => ({ count: s.count - 1 })),
  reset: () => set({ count: 0 }),
}));
