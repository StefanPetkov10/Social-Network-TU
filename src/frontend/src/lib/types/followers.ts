export interface FollowUser {
  profileId: string;
  displayFullName: string;
  userName?: string;
  avatarUrl?: string;
  bio?: string;       
  
  isFollowing: boolean; 
  isFollower: boolean;  
  isFriend: boolean;    
}

export interface FollowSuggestion extends FollowUser {
  reason: string;       
  mutualCount: number;  
}