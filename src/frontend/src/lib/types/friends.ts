export interface FriendRequest {
  id: string;
  firstName: string;
  lastName: string;
  authorAvatar?: string;
  mutualFriendsCount: number;
}

export interface FriendSuggestion {
  profileId: string;
  firstName: string;
  lastName: string;
  authorAvatar?: string;
  mutualFriendsCount: number;
}