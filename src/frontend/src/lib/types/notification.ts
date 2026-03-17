export enum NotificationType {
    PostReaction = 0,
    CommentReaction = 1,
    PostComment = 2,
    NewFollower = 3,
    FriendRequest = 4,
    FriendAccept = 5,
    GroupJoinRequest = 6,
    GroupJoinAccept = 7
}

export interface NotificationDto {
    id: string;
    triggeredById: string;
    triggeredByName: string;
    triggeredByUsername: string;
    triggeredByAvatar: string | null;
    type: NotificationType;
    referenceId: string | null;
    count: number;
    isRead: boolean;
    isSeen: boolean;
    createdDate: string;
    updatedDate: string | null;
}

export interface UnseenNotificationsCountDto {
    count: number;
}
