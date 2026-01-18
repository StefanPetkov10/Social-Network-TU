import { FriendshipStatus } from "./enums";

export interface FriendRequest {
  pendingRequestId: string; 
  profileId: string;       
  displayFullName: string;
  username: string;
  authorAvatar: string | null;
}

export interface FriendSuggestion {
  profileId: string;
  displayFullName: string;
  authorAvatar?: string;
  mutualFriendsCount: number;

  friendshipStatus?: FriendshipStatus; 
  isFriendRequestSender?: boolean;
}

export interface FriendDto {
    profileId: string;
    displayFullName: string;
    username: string;
    authorAvatar?: string;
}