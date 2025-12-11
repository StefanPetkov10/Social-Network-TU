export enum ReactionType {
  Like = 0,
  Love = 1,
  Funny = 2,
  Congrats = 3,
  Support = 4
}
export enum MediaType {
  Image = 0,
  Video = 1,
  Document = 2,
  Gif = 3,
  Other = 4
}

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

