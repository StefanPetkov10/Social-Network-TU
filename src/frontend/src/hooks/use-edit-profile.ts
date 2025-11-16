import { useMutation } from "@tanstack/react-query";
import api from "../lib/axios";

type ChangePasswordPayload = {
  currentPassword: string;
  newPassword: string;
  confirmNewPassword: string;
};

//export function useChangePassword() {
