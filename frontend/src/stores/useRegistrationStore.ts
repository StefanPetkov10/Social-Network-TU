import { create } from "zustand";
import {RegisterDto } from "@frontend/lib/types/auth";  
import { Gender } from "@frontend/lib/types/enums";
import { createJSONStorage, persist } from "zustand/middleware";

export type SignupState = RegisterDto & {
  confirmPassword: string;
  registrationInProgress: boolean;

  setField: <K extends keyof SignupState>(key: K, value: SignupState[K]) => void;

  startRegistrationFlow: () => void;

  reset: () => void;
};

const initialState: Omit<SignupState, "setField" | "startRegistrationFlow" | "reset"> = {
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
};


export const useRegistrationStore = create<SignupState>()( 
  persist(
    (set) => ({
      ...initialState,

      setField: (key, value) => 
        set((state) => ({ ...state, [key]: value })),

      startRegistrationFlow: () =>
        set({ registrationInProgress: true }),

      reset: () => {
        set({ ...initialState });
      },
    }),
    {    
      name: "signup-flow-store",
      storage: createJSONStorage(() => sessionStorage),
    
      partialize: (state) => ({
        registrationInProgress: state.registrationInProgress,
        Email: state.Email,
        FirstName: state.FirstName,
      }),
    }
  ) 
);

