import { useState } from "react";
import { ReactionType } from "@frontend/lib/types/enums";
import { toast } from "sonner";

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