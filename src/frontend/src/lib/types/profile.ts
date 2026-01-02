import { Gender } from "./auth"; 
import { FriendshipStatus } from "./friends"; 

export interface ProfileDto {
  id: string;
  firstName: string;
  lastName: string;
  fullName: string;
  userName: string;
  authorAvatar?: string; 
  dateOfBirth: string; 
  sex: string; 
  bio?: string;
  
  friendsCount: number;
  followersCount: number;
  followingCount: number;

  friendshipStatus?: FriendshipStatus; 
  isFriendRequestSender?: boolean;
}

export interface UpdateProfileDto {
  firstName: string;
  lastName: string;
  userName: string;
  sex: Gender; 
  bio?: string;
  photoBase64?: string | null;
}
export interface ChangePasswordDto {
  CurrentPassword: string;
  NewPassword: string;
  ConfirmNewPassword: string;
}
