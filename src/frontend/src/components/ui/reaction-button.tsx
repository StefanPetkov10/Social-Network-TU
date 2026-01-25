"use client";

import { useState, useRef, useEffect } from "react";
import { ThumbsUp } from "lucide-react";
import { Button } from "@frontend/components/ui/button";
import { cn } from "@frontend/lib/utils";
import { ReactionType } from "@frontend/lib/types/enums";

export const REACTION_CONFIG = {
  [ReactionType.Like]: { icon: "👍", label: "Харесва ми", color: "text-blue-600", emoji: "👍" },
  [ReactionType.Love]: { icon: "❤️", label: "Любов", color: "text-red-600", emoji: "❤️" },
  [ReactionType.Funny]: { icon: "😆", label: "Ха-ха", color: "text-yellow-500", emoji: "😆" },
  [ReactionType.Congrats]: { icon: "👏", label: "Браво", color: "text-green-600", emoji: "👏" },
  [ReactionType.Support]: { icon: "🤗", label: "Подкрепа", color: "text-purple-600", emoji: "🤗" },
};

interface ReactionButtonProps {
    currentReaction: ReactionType | null;
    likesCount: number;
    onReact: (type: ReactionType) => void;
    isComment?: boolean; 
}

export function ReactionButton({ 
    currentReaction, 
    likesCount, 
    onReact,
    isComment = false 
}: ReactionButtonProps) {
    const [isHovered, setIsHovered] = useState(false);
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);
    
    const activeConfig = currentReaction !== null ? REACTION_CONFIG[currentReaction] : null;

    const handleMouseEnter = () => {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        setIsHovered(true);
    };

    const handleMouseLeave = () => {
        timeoutRef.current = setTimeout(() => {
            setIsHovered(false);
        }, 300); 
    };
    
    return (
        <div 
            className="relative inline-block"
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
        >
            {isHovered && (
                <div 
                    className={cn(
                        "absolute left-0 z-50 flex items-center gap-1 bg-white dark:bg-zinc-800 p-1.5 rounded-full shadow-xl border border-black/5 animate-in fade-in zoom-in slide-in-from-bottom-2 duration-200",
                        isComment ? "-top-14 left-0" : "bottom-full mb-0.5"
                    )}
                    style={{ minWidth: "max-content" }}
                > 
                    {(Object.keys(REACTION_CONFIG) as unknown as ReactionType[]).map((type) => (
                        <button
                            key={type}
                            onClick={(e) => {
                                e.stopPropagation();
                                onReact(Number(type));
                                setIsHovered(false);
                            }}
                            className="w-9 h-9 flex items-center justify-center text-2xl hover:scale-125 transition-transform duration-200 cursor-pointer rounded-full hover:bg-black/5 active:scale-95"
                            title={REACTION_CONFIG[type].label}
                        >
                            <span className="filter drop-shadow-sm leading-none block pt-0.5">
                                {REACTION_CONFIG[type].emoji}
                            </span>
                        </button>
                    ))}
                </div>
            )}

             <Button 
                variant="ghost" 
                size={isComment ? "sm" : "default"}
                className={cn(
                    "transition-colors relative",
                    isComment 
                        ? "h-auto p-0 px-1 text-xs font-bold hover:bg-transparent hover:underline text-muted-foreground" 
                        : "w-full py-6 flex gap-2 items-center",
                    activeConfig ? activeConfig.color : "text-muted-foreground hover:text-foreground"
                )}
                onClick={() => {
                    if (currentReaction !== null) {
                        onReact(currentReaction); 
                    } else {
                        onReact(ReactionType.Like); 
                    }
                }}
            >
                {isComment ? (
                     <span className={cn("text-xs font-bold", activeConfig && activeConfig.color)}>
                        {activeConfig ? activeConfig.label : "Харесване"}
                     </span>
                ) : (
                    <>
                        {activeConfig ? (
                           <>
                             <span className="text-xl leading-none">{activeConfig.icon}</span>
                             <span className="font-semibold">{activeConfig.label}</span>
                           </>
                        ) : (
                           <>
                             <ThumbsUp className="h-5 w-5 mb-0.5" />
                             <span className="font-semibold text-sm">Харесване</span>
                           </>
                        )}
                    </>
                )}
            </Button>
        </div>
    );
}