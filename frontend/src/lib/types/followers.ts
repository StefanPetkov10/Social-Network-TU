export interface FollowUser {
  profileId: string;
  displayFullName: string;
  username?: string;
  authorAvatar?: string;
  bio?: string;       
  
  isFollowing: boolean; 
  isFollower: boolean;  
  isFriend: boolean;    
}

export interface FollowSuggestion extends FollowUser {
  reason: string;       
  mutualFollowersCount: number;  
}