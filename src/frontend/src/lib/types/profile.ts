import { Gender } from "./auth";

export interface ProfileDto {
  id: string;
  firstName: string;
  lastName?: string;
  fullName?: string;
  userName: string;
  photo?: string; 
  dateOfBirth: string; 
  sex: Gender;
  
  bio?: string;

  
  friendsCount?: number;
  followersCount?: number;
  followingCount?: number;

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
