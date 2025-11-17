import { Gender } from "./auth";

export interface ProfileDto {
  Id: string;
  FirstName: string;
  LastName: string;
  BirthDate?: string;
  Sex: Gender;
  UserName: string;
  Email: string;
}

export interface UpdateProfileDto {
  FirstName: string;
  LastName: string;
  BirthDate?: string;
  Sex: Gender;
}

export interface ChangePasswordDto {
  CurrentPassword: string;
  NewPassword: string;
  ConfirmNewPassword: string;
}
