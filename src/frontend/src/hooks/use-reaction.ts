import { useEffect, useState } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { ReactionType } from "@frontend/lib/types/enums";
import { toast } from "sonner";
import { reactionService } from "@frontend/services/reaction-service";

interface UseReactionProps {
    initialReaction: ReactionType | null;
    initialCount: number;
    entityId: string; 
    reactApiCall: (id: string, type: ReactionType) => Promise<any>; 
}

export function useReaction({ 
    initialReaction, 
    initialCount, 
    entityId, 
    reactApiCall 
}: UseReactionProps) {
    const [currentReaction, setCurrentReaction] = useState<ReactionType | null>(initialReaction);
    const [likesCount, setLikesCount] = useState(initialCount);

    useEffect(() => {
        setCurrentReaction(initialReaction);
        setLikesCount(initialCount);
    }, [initialReaction, initialCount]);

    const handleReaction = async (type: ReactionType) => {
        const oldReaction = currentReaction;
        const oldCount = likesCount;

        if (currentReaction === type) {
            setCurrentReaction(null);
            setLikesCount(prev => Math.max(0, prev - 1));
        } else {
            setCurrentReaction(type);
            
            if (oldReaction === null) {
                setLikesCount(prev => prev + 1);
            }
        }

        try {
            await reactApiCall(entityId, type);
        } catch (error) {
            console.error("Failed to react", error);
            setCurrentReaction(oldReaction);
            setLikesCount(oldCount);
            toast.error("Възникна грешка при реакцията.");
        }
    };

    return {
        currentReaction,
        likesCount,
        handleReaction
    };
}

export const useGetReactors = (
    entityId: string, 
    isComment: boolean, 
    selectedType: ReactionType | null,
    isOpen: boolean 
) => {
    return useInfiniteQuery({
        queryKey: ["reactors", entityId, isComment, selectedType],
        queryFn: async ({ pageParam }) => {
            const response = await reactionService.getReactors(entityId, isComment, selectedType, pageParam);
            return response.data;
        },
        initialPageParam: undefined as string | undefined,
        getNextPageParam: (lastPage) => {
            const reactors = lastPage?.reactors;
            if (!reactors || reactors.length < 20) return undefined;

            return reactors[reactors.length - 1].reactedDate; 
        },
        enabled: isOpen, 
    });
};
