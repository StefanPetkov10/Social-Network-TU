import { create } from "zustand";
import { Gender,  RegisterDto } from "@frontend/lib/types/auth";  

export type SignupState = RegisterDto & {
  confirmPassword: string;
  registrationInProgress: boolean;

  setField: <K extends keyof SignupState>(key: K, value: SignupState[K]) => void;

  setRegistrationInProgress: (value: boolean) => void;

  reset: () => void;
};

const initialState: SignupState = {
  FirstName: "",
  LastName: "",
  BirthDay: 1,
  BirthMonth: 1,
  BirthYear: 1995,
  Sex: Gender.Male,

  UserName: "",
  Email: "",
  Password: "",
  confirmPassword: "",

  registrationInProgress: false,

  setField: () => {},
  setRegistrationInProgress: () => {},
  reset: () => {},
};

/*interface RegistrationState {
  registrationInProgress: boolean;
  setRegistrationInProgress: (value: boolean) => void;
}*/

export const useRegistrationStore = create<SignupState>((set) => ({
  ...initialState,

  setField: (key, value) =>
    set((state) => ({
      ...state,
      [key]: value,
    })),

  setRegistrationInProgress: (value: boolean) => {
    set({ registrationInProgress: value });
    localStorage.setItem("registrationInProgress", value ? "true" : "false");
  },
  
  reset: () => {
    set({ ...initialState });
    localStorage.removeItem("registrationInProgress");
  },
}));

if (typeof window !== "undefined") {
  const stored = localStorage.getItem("registrationInProgress") === "true";
  useRegistrationStore.getState().setRegistrationInProgress(stored);
}
