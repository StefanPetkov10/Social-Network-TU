"use client";

import { useState } from "react";
import { ThumbsUp } from "lucide-react";
import { Button } from "@frontend/components/ui/button";
import { cn } from "@frontend/lib/utils";
import { ReactionType } from "@frontend/lib/types/enums";

export const REACTION_CONFIG = {
  [ReactionType.Like]: { icon: "👍", label: "Харесва ми", color: "text-blue-600" },
  [ReactionType.Love]: { icon: "❤️", label: "Любов", color: "text-red-600" },
  [ReactionType.Funny]: { icon: "😆", label: "Ха-ха", color: "text-yellow-500" },
  [ReactionType.Congrats]: { icon: "👏", label: "Браво", color: "text-green-600" },
  [ReactionType.Support]: { icon: "🤗", label: "Подкрепа", color: "text-purple-600" },
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
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    
    const activeConfig = currentReaction !== null ? REACTION_CONFIG[currentReaction] : null;

    const buttonBaseClass = isComment 
        ? "h-auto p-0 text-xs hover:bg-transparent cursor-pointer font-semibold transition-none" 
        : "w-full flex gap-2 items-center hover:bg-muted/50 transition-colors py-6";

    return (
        <div 
            className="relative group inline-block"
            onMouseEnter={() => setIsMenuOpen(true)}
            onMouseLeave={() => setIsMenuOpen(false)}
        >
            {isMenuOpen && (
                <div className={cn(
                    "absolute left-0 flex bg-background border shadow-lg rounded-full p-1 gap-1 animate-in slide-in-from-bottom-2 z-50",
                    isComment ? "bottom-4" : "bottom-full"
                )}> 
                    {(Object.keys(REACTION_CONFIG) as unknown as ReactionType[]).map((type) => (
                        <button
                            key={type}
                            onClick={(e) => {
                                e.stopPropagation();
                                onReact(Number(type));
                                setIsMenuOpen(false);
                            }}
                            className="p-1.5 hover:bg-muted rounded-full transition-transform hover:scale-125 text-lg leading-none"
                        >
                            {REACTION_CONFIG[type].icon}
                        </button>
                    ))}
                </div>
            )}

            <Button 
                variant="ghost" 
                className={cn(
                    buttonBaseClass, 
                    activeConfig ? activeConfig.color : "text-muted-foreground",
                    isComment && (activeConfig ? "font-bold" : "font-medium")
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
                     <div className="flex items-center gap-1.5">
                        <span>
                            {activeConfig ? activeConfig.label : "Харесване"}
                        </span>
                        
                        {likesCount > 0 && (
                            <div className="flex items-center gap-1">
                                <span className="text-[10px] leading-none scale-110">
                                    {activeConfig ? activeConfig.icon : "👍"}
                                </span>
                                <span className={cn("font-normal text-[11px]", activeConfig ? activeConfig.color : "text-muted-foreground")}>
                                    {likesCount}
                                </span>
                            </div>
                        )}
                     </div>
                ) : (
                    <>
                        {activeConfig ? (
                           <>
                             <span className="text-lg leading-none">{activeConfig.icon}</span>
                             <span className="font-semibold">{activeConfig.label}</span>
                           </>
                        ) : (
                           <>
                             <ThumbsUp className="h-4 w-4" />
                             <span>Харесване</span>
                           </>
                        )}
                    </>
                )}
            </Button>
        </div>
    );
}