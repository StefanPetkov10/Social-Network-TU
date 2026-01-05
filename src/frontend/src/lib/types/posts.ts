import { MediaType } from "./enums";
import { ReactionType } from "./enums";

export interface PostMediaDto {
  id: string;
  url: string;
  mediaType: MediaType;
  fileName: string;
  order: number;
}

export interface PostDto {
  id: string;
  content: string;
  media: PostMediaDto[];
  
  profileId: string;
  authorName: string;       
  authorAvatar: string | null;
  
  visibility: number;
  likesCount: number;
  commentsCount: number;
  
  groupId: string | null;
  groupName: string | null;
  createdAt: string; 

  userReaction?: ReactionType | null; 
  isOwner?: boolean; 
}

