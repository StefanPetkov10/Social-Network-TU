"use client";

import { useChatHistory, useConversations } from "@frontend/hooks/use-chat-query";
import { useChatSocket } from "@frontend/hooks/use-chat-socket";
import { useProfile } from "@frontend/hooks/use-profile";
import { Avatar, AvatarFallback, AvatarImage } from "@frontend/components/ui/avatar";
import { Button } from "@frontend/components/ui/button";
import { Input } from "@frontend/components/ui/input";
import { Loader2, Image as ImageIcon, Paperclip, Info, ArrowLeft } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { cn, getInitials } from "@frontend/lib/utils"; 
import { MessageDto } from "@frontend/lib/types/chat";

export default function ChatPage() {
  const params = useParams();
  const router = useRouter();
  const chatId = params.id as string;
  
  const { data: myProfile } = useProfile();
  
  const { data: conversations } = useConversations();
  const currentChatUser = conversations?.find(c => c.id === chatId);

  const { data: historyMessages, isLoading: isHistoryLoading } = useChatHistory(chatId);

  const { sendMessage, isConnected } = useChatSocket(chatId);

  const messages = historyMessages || [];

  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
        scrollRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const handleSend = () => {
    if (!input.trim()) return;
    sendMessage(input, []);
    setInput("");
  };

  return (
    <div className="flex flex-col h-full bg-background">
      <div className="h-[60px] border-b flex items-center justify-between px-4 bg-white shrink-0 shadow-sm z-10">
         <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="md:hidden" onClick={() => router.push('/messages')}>
                <ArrowLeft className="h-5 w-5" />
            </Button>

            <Avatar className="h-10 w-10 border-2 border-white shadow-sm">
                <AvatarImage 
                    src={currentChatUser?.authorAvatar || ""} 
                    className="object-cover"
                />
                <AvatarFallback className="bg-gradient-to-br from-violet-600 to-blue-600 text-white font-bold text-xs">
                    {getInitials(currentChatUser?.name || "Chat")}
                </AvatarFallback>
            </Avatar>

            <div>
                <h3 className="font-semibold text-sm">{currentChatUser?.name || "Chat Room"}</h3>
                <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <span className={cn("block h-2 w-2 rounded-full", isConnected ? "bg-green-500" : "bg-yellow-500")} />
                    {isConnected ? "Active now" : "Connecting..."}
                </span>
            </div>
         </div>
         <Button variant="ghost" size="icon">
            <Info className="h-5 w-5 text-muted-foreground" />
         </Button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
        {isHistoryLoading ? (
            <div className="flex justify-center items-center h-full">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        ) : (
            messages.map((msg: MessageDto, i: number) => {
                const isMe = myProfile ? msg.senderId === myProfile.id : false;

                return (
                    <div key={msg.id || i} className={cn("flex gap-2 max-w-[75%]", isMe ? "ml-auto flex-row-reverse" : "")}>
                        {!isMe && (
                            <Avatar className="h-8 w-8 mt-1 border-2 border-white shadow-sm shrink-0">
                                <AvatarImage src={msg.senderPhoto} className="object-cover" />
                                <AvatarFallback className="bg-gradient-to-br from-violet-600 to-blue-600 text-white font-bold text-[10px]">
                                    {getInitials(msg.senderName)}
                                </AvatarFallback>
                            </Avatar>
                        )}
                        
                        <div className={cn("flex flex-col", isMe ? "items-end" : "items-start")}>
                            {!isMe && <span className="text-[10px] text-muted-foreground ml-1 mb-1 block">{msg.senderName}</span>}
                            
                            <div className={cn(
                                "px-4 py-2 text-sm shadow-sm break-words",
                                isMe 
                                ? "bg-primary text-primary-foreground rounded-2xl rounded-tr-sm" 
                                : "bg-white border text-foreground rounded-2xl rounded-tl-sm"
                            )}>
                                {msg.content}
                                
                                {msg.media && msg.media.length > 0 && (
                                    <div className="mt-2 grid gap-1">
                                        {msg.media.map((m) => (
                                            <img key={m.id} src={m.url} alt="file" className="rounded-md max-w-full object-cover" />
                                        ))}
                                    </div>
                                )}
                            </div>
                            <span className="text-[10px] text-muted-foreground mt-1 px-1 block opacity-70">
                                {new Date(msg.sentAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                            </span>
                        </div>
                    </div>
                )
            })
        )}
        <div ref={scrollRef} />
      </div>

      <div className="p-4 bg-white shrink-0 border-t">
        <div className="flex items-center gap-2 border rounded-3xl px-3 py-1.5 bg-slate-50 focus-within:bg-white focus-within:ring-1 focus-within:ring-primary/20 focus-within:border-primary transition-all shadow-sm">
            <Button variant="ghost" size="icon" className="rounded-full text-muted-foreground hover:text-primary h-9 w-9 shrink-0">
                <ImageIcon className="h-5 w-5" />
            </Button>
             <Button variant="ghost" size="icon" className="rounded-full text-muted-foreground hover:text-primary h-9 w-9 shrink-0">
                <Paperclip className="h-5 w-5" />
            </Button>
            
            <Input 
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Message..." 
                className="border-none bg-transparent focus-visible:ring-0 shadow-none px-2 h-9 text-base" 
            />
            
            <Button 
                onClick={handleSend}
                disabled={!input.trim()}
                variant="ghost" 
                size="sm" 
                className={cn("font-semibold shrink-0 transition-all", input.trim() ? "text-primary hover:bg-primary/10" : "text-muted-foreground")}
            >
                Send
            </Button>
        </div>
      </div>
    </div>
  );
}