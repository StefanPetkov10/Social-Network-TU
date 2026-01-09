import { GroupPrivacy, GroupRole } from "./enums";

export interface MemberDto {
  profileId: string;
  fullName: string;
  photo?: string;
  role: GroupRole;
  joinedOn: string; 
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