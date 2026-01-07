import { FriendSuggestion, FriendRequest, FriendDto } from "@frontend/lib/types/friends";
import { FollowUser } from "@frontend/lib/types/followers";
import { ProfileDto } from "@frontend/lib/types/profile";

export type ProfilePreviewData = 
    | FriendSuggestion 
    | FriendRequest 
    | FriendDto
    | FollowUser
    | Partial<ProfileDto>;