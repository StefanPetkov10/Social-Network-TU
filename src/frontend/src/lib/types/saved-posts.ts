export interface SavedCollectionDto {
  name: string;
  count: number;
  coverImageUrl: string | null;
}

export interface SavePostRequest {
  postId: string;
  collectionName?: string | null; 
}