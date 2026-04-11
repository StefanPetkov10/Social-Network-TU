import { Gender, FriendshipStatus } from "./enums"; 

export interface ProfileDto {
  id: string;
  firstName: string;
  lastName: string;
  fullName: string;
  username: string;
  authorAvatar?: string; 
  dateOfBirth: string; 
  sex: Gender; 
  bio?: string;
  
  friendsCount: number;
  followersCount: number;
  followingCount: number;

  isFollowed?: boolean;              
  friendshipStatus?: FriendshipStatus; 
  isFriendRequestSender?: boolean;   
  friendshipRequestId?: string;      
}

export interface UpdateProfileDto {
  firstName: string;
  lastName: string;
  username: string;
  sex: Gender; 
  bio?: string;
  photoBase64?: string | null;
}

export interface ChangePasswordDto {
  CurrentPassword: string;
  NewPassword: string;
  ConfirmNewPassword: string;
}