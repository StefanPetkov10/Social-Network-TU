export enum ReactionType {
  Like = 0,
  Love = 1,
  Funny = 2,
  Congrats = 3,
  Support = 4
}

export interface PostMediaDto {
  id: string;
  url: string;
  mediaType: number; 
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