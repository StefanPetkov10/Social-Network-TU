export interface FollowUser {
  profileId: string;
  displayFullName: string;
  userName?: string;
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