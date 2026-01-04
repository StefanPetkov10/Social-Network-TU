export enum FriendshipStatus {
    Pending = 0,
    Accepted = 1,
    Declined = 2,
    Blocked = 3,
    None = -1 
}

export interface FriendRequest {
  pendingRequestId: string; 
  profileId: string;       
  displayFullName: string;
  userName: string;
  authorAvatar: string | null;
  mutualFriendsCount: number;
}

export interface FriendSuggestion {
  profileId: string;
  displayFullName: string;
  authorAvatar?: string;
  mutualFriendsCount: number;
}

