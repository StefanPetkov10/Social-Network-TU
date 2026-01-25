import { GroupPrivacy, GroupRole } from "./enums";

export interface MutualFriend {
  authorAvatar: string | null;
  fullName: string;
}

export interface MemberDto {
  profileId: string;
  fullName: string;
  username: string; 
  authorAvatar: string | null;
  role: GroupRole; 
  joinedOn: string;
  
  isMe: boolean;
  isFriend: boolean;
  mutualFriendsCount: number;
  
  hasSentRequest: boolean;     
  hasReceivedRequest: boolean;
  pendingRequestId?: string;
}

export interface GroupDto {
  id: string;
  name: string;
  description?: string;
  isPrivate: boolean; 
  
  isMember: boolean;
  isAdmin: boolean;
  isOwner: boolean;
  hasRequestedJoin: boolean;
  
  membersCount: number;
  mutualFriends?: MutualFriend[];
  mutualFriendsCount?: number;
  
  canViewPosts: boolean;
  canCreatePost: boolean;
}

export interface CreateGroupDto {
  name: string;
  description?: string;
  groupPrivacy: GroupPrivacy;
}

export interface UpdateGroupDto {
  name: string;
  description?: string;
  isPrivate: boolean;
}