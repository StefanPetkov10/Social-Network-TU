export interface FriendRequest {
  pendingRequestId: string; 
  profileId: string;       
  displayFullName: string;
  userName: string;
  avatarUrl: string | null;
  mutualFriendsCount: number;
}

export interface FriendSuggestion {
  profileId: string;
  displayFullName: string;
  authorAvatar?: string;
  mutualFriendsCount: number;
}

