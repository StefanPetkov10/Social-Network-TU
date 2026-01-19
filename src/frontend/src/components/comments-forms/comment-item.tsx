import { formatDistanceToNow } from "date-fns";
import { bg } from "date-fns/locale";
import { Avatar, AvatarFallback, AvatarImage } from "@frontend/components/ui/avatar";
import { CommentDto } from "@frontend/lib/types/comment";
import { getInitials } from "@frontend/lib/utils";
import { MediaType } from "@frontend/lib/types/enums";

interface CommentItemProps {
    comment: CommentDto;
}

export function CommentItem({ comment }: CommentItemProps) {
    const isVideo = comment.media?.mediaType === MediaType.Video; 
    
    return (
        <div className="flex gap-2 mb-4 animate-in fade-in duration-300">
            <Avatar className="w-8 h-8 cursor-pointer hover:opacity-80">
                <AvatarImage src={comment.authorAvatar || ""} />
                <AvatarFallback>{getInitials(comment.authorName)}</AvatarFallback>
            </Avatar>
            
            <div className="flex flex-col max-w-[85%]">
                <div className="bg-muted/40 rounded-2xl p-3 px-4 w-fit min-w-[120px]">
                    <span className="font-semibold text-sm block text-foreground cursor-pointer hover:underline">
                        {comment.authorName}
                    </span>
                    <p className="text-sm text-foreground/90 whitespace-pre-wrap leading-relaxed break-words">
                        {comment.content}
                    </p>
                </div>
                
                {comment.media && (
                    <div className="mt-2 rounded-xl overflow-hidden border bg-black/5 max-w-[300px]">
                        {isVideo ? (
                             <video src={comment.media.url} controls className="w-full h-auto" />
                        ) : (
                            <img src={comment.media.url} alt="Прикачен файл" className="w-full h-auto object-cover" />
                        )}
                    </div>
                )}

                <div className="flex gap-4 px-2 mt-1 text-xs text-muted-foreground font-medium">
                    <span>{formatDistanceToNow(new Date(comment.createdDate), { addSuffix: true, locale: bg })}</span>
                    <button className="hover:underline hover:text-foreground cursor-pointer">Харесване</button>
                    <button className="hover:underline hover:text-foreground cursor-pointer">Отговор</button>
                </div>
            </div>
        </div>
    );
}