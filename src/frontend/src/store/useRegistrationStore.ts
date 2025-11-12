import { create } from "zustand";

interface RegistrationState {
  registrationInProgress: boolean;
  setRegistrationInProgress: (value: boolean) => void;
}

export const useRegistrationStore = create<RegistrationState>((set) => ({
  registrationInProgress: false,

  setRegistrationInProgress: (value: boolean) => {
    set({ registrationInProgress: value });
    localStorage.setItem("registrationInProgress", value ? "true" : "false");
  },
}));

if (typeof window !== "undefined") {
  const stored = localStorage.getItem("registrationInProgress") === "true";
  useRegistrationStore.getState().setRegistrationInProgress(stored);
}
