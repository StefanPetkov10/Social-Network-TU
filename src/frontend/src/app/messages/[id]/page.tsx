"use client";

import { useChatHistory, useConversations, useUploadChatFiles } from "@frontend/hooks/use-chat-query";
import { useChatSocket } from "@frontend/hooks/use-chat-socket";
import { useProfile, useProfileById } from "@frontend/hooks/use-profile";
import { useGroupById } from "@frontend/hooks/use-groups"; 
import { Avatar, AvatarFallback, AvatarImage } from "@frontend/components/ui/avatar";
import { Button } from "@frontend/components/ui/button";
import { Input } from "@frontend/components/ui/input";
import { Dialog, DialogContent, DialogClose, DialogTitle } from "@frontend/components/ui/dialog"; 
import { Loader2, Image as ImageIcon, Paperclip, Info, ArrowLeft, X, FileText, Download, Users } from "lucide-react"; 
import { useState, useRef, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { cn, getInitials, getFileDetails, getUserDisplayName } from "@frontend/lib/utils"; 
import { MessageDto, ChatAttachmentDto } from "@frontend/lib/types/chat";
import { toast } from "sonner";
import { validateFile, MAX_CHAT_FILES, MAX_CHAT_SIZE_MB } from "@frontend/lib/file-validation";
import * as VisuallyHidden from "@radix-ui/react-visually-hidden"; 

export default function ChatPage() {
  const params = useParams();
  const router = useRouter();
  const chatId = params.id as string;
  
  const { data: myProfile } = useProfile();
  const { data: conversations } = useConversations();
  
  const existingConversation = conversations?.find(c => c.id === chatId);

  const { data: profileData, isLoading: isProfileLoading } = useProfileById(chatId, {
      enabled: !existingConversation?.isGroup, 
      retry: false 
  });

  const { data: groupData, isLoading: isGroupLoading } = useGroupById(chatId, {
      enabled: !profileData?.data && (existingConversation?.isGroup !== false),
      retry: false 
  });

  let chatTarget = null;

  if (existingConversation) {
      chatTarget = {
          id: existingConversation.id,
          name: existingConversation.name,
          avatar: existingConversation.authorAvatar,
          initials: getInitials(existingConversation.name),
          isGroup: existingConversation.isGroup ?? false,
          membersCount: null 
      };
  } else if (groupData?.data) {
      chatTarget = {
          id: groupData.data.id,
          name: groupData.data.name,
          avatar: null, 
          initials: getInitials(groupData.data.name),
          isGroup: true,
          membersCount: groupData.data.membersCount
      };
  } else if (profileData?.data) {
      const name = getUserDisplayName(profileData.data);
      chatTarget = {
          id: profileData.data.id,
          name: name,
          avatar: profileData.data.authorAvatar,
          initials: getInitials(name),
          isGroup: false,
          membersCount: null
      };
  }

  const isLoadingTarget = !chatTarget && (isProfileLoading || isGroupLoading);

  const { data: historyMessages, isLoading: isHistoryLoading } = useChatHistory(chatId);
  
  const { sendMessage, isConnected, onlineUsers } = useChatSocket(chatId);
  const uploadMutation = useUploadChatFiles();

  const isUserOnline = !chatTarget?.isGroup && onlineUsers.has(chatId);

  const messages = historyMessages || [];

  const [input, setInput] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  
  const [selectedMedia, setSelectedMedia] = useState<{ url: string; fileName: string } | null>(null);

  const [isInitialized, setIsInitialized] = useState(false);

  const mediaInputRef = useRef<HTMLInputElement>(null);
  const docInputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!scrollRef.current || messages.length === 0) return;

    const scrollToBottom = (behavior: ScrollBehavior) => {
        scrollRef.current?.scrollIntoView({ behavior });
    };

    if (!isInitialized && !isHistoryLoading) {
        setTimeout(() => {
            scrollToBottom("auto");
            setIsInitialized(true); 
        }, 100); 
    } 
    else if (isInitialized) {
        setTimeout(() => {
            scrollToBottom("smooth");
        }, 100);
    }
  }, [messages, isHistoryLoading, isInitialized]);

  const handleDownload = async (url: string, fileName: string) => {
    try {
        const response = await fetch(url);
        const blob = await response.blob();
        const blobUrl = window.URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
        console.error("Download failed:", error);
        toast.error("Грешка при изтегляне.");
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
        const selectedFiles = Array.from(e.target.files);

        if (files.length + selectedFiles.length > MAX_CHAT_FILES) {
            toast.error(`Можете да качите максимум ${MAX_CHAT_FILES} файла.`);
            return;
        }

        const currentSize = files.reduce((acc, f) => acc + f.size, 0);
        const newSize = selectedFiles.reduce((acc, f) => acc + f.size, 0);
        
        if (currentSize + newSize > MAX_CHAT_SIZE_MB * 1024 * 1024) {
             toast.error(`Общият размер не трябва да надвишава ${MAX_CHAT_SIZE_MB}MB.`);
             return;
        }

        const validFiles: File[] = [];
        let hasInvalidType = false;

        selectedFiles.forEach((file) => {
            if (validateFile(file)) {
                validFiles.push(file);
            } else {
                hasInvalidType = true;
            }
        });

        if (hasInvalidType) {
            toast.error("Някои файлове бяха пропуснати (невалиден тип).");
        }

        if (validFiles.length > 0) {
            setFiles((prev) => [...prev, ...validFiles]);
        }
    }
    
    if (mediaInputRef.current) mediaInputRef.current.value = "";
    if (docInputRef.current) docInputRef.current.value = "";
  };

  const removeFile = (fileToRemove: File) => {
    setFiles(files.filter((f) => f !== fileToRemove));
  };

  const isMedia = (file: File) => file.type.startsWith("image/") || file.type.startsWith("video/");
  const isDoc = (file: File) => !isMedia(file);

  const handleSend = async () => {
    if (!input.trim() && files.length === 0) return;

    let attachments: ChatAttachmentDto[] = [];

    if (files.length > 0) {
        const formData = new FormData();
        files.forEach(file => {
            formData.append("Files", file);
        });

        try {
            const uploadedData = await uploadMutation.mutateAsync(formData);
            attachments = uploadedData;
        } catch (error) {
            return; 
        }
    }

    const isGroupChat = !!chatTarget?.isGroup;
    await sendMessage(input, attachments, isGroupChat);
    
    setInput("");
    setFiles([]);
  };

  return (
    <div className="flex flex-col h-full bg-background relative">
      <div className="h-[60px] border-b flex items-center justify-between px-4 bg-white shrink-0 shadow-sm z-10">
         <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="md:hidden" onClick={() => router.push('/messages')}>
                <ArrowLeft className="h-5 w-5" />
            </Button>
            
            <div className="relative">
                <Avatar className="h-10 w-10 border-2 border-white shadow-sm">
                    <AvatarImage src={chatTarget?.avatar || ""} className="object-cover"/>
                    
                    {chatTarget?.isGroup ? (
                        <AvatarFallback className="bg-gradient-to-br from-blue-600 via-indigo-500 to-purple-600 text-white font-bold text-xs">
                            {chatTarget.initials}
                        </AvatarFallback>
                    ) : (
                        <AvatarFallback className="bg-gradient-to-br from-violet-600 to-blue-600 text-white font-bold text-xs">
                            {chatTarget?.initials || "?"}
                        </AvatarFallback>
                    )}
                </Avatar>

                {isUserOnline && (
                    <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-green-500 border-2 border-white" />
                )}
            </div>

            <div>
                <h3 className="font-semibold text-sm">
                    {chatTarget?.name || (isLoadingTarget ? "Зареждане..." : "Chat Room")}
                </h3>
                
                <div className="flex items-center gap-1.5 h-4">
                     {chatTarget?.isGroup ? (
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Users className="w-3 h-3" /> 
                            {chatTarget.membersCount ? `${chatTarget.membersCount} членове` : "Групов чат"}
                        </span>
                     ) : (
                        isUserOnline ? (
                            <>
                                <span className="block h-2 w-2 rounded-full bg-green-500" />
                                <span className="text-xs text-green-600 font-medium">Active now</span>
                            </>
                        ) : (
                            <span className="text-xs text-muted-foreground">Offline</span>
                        )
                     )}
                </div>
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
                
                const showSenderInfo = !isMe && chatTarget?.isGroup;

                return (
                    <div key={msg.id || i} className={cn("flex gap-2 max-w-[85%] sm:max-w-[75%]", isMe ? "ml-auto flex-row-reverse" : "")}>
                        
                        {!isMe && (
                            <Avatar className="h-8 w-8 mt-1 border-2 border-white shadow-sm shrink-0">
                                <AvatarImage src={msg.senderPhoto} className="object-cover" />
                                <AvatarFallback className="bg-gradient-to-br from-violet-600 to-blue-600 text-white font-bold text-[10px]">
                                    {getInitials(msg.senderName)}
                                </AvatarFallback>
                            </Avatar>
                        )}

                        <div className={cn("flex flex-col", isMe ? "items-end" : "items-start")}>
                            
                            {showSenderInfo && (
                                <span className="text-[10px] text-muted-foreground ml-1 mb-1 block font-medium">
                                    {msg.senderName}
                                </span>
                            )}
                            
                            <div className={cn("px-3 py-2 text-sm shadow-sm break-words", isMe ? "bg-primary text-primary-foreground rounded-2xl rounded-tr-sm" : "bg-white border text-foreground rounded-2xl rounded-tl-sm")}>
                                {msg.content && <p className={cn("mb-1", !msg.media?.length && "mb-0")}>{msg.content}</p>}
                                
                                {msg.media && msg.media.length > 0 && (() => {
                                    const imagesAndVideos = msg.media.filter(m => m.mediaType === 0 || m.mediaType === 1);
                                    const documents = msg.media.filter(m => m.mediaType !== 0 && m.mediaType !== 1);

                                    return (
                                        <div className="flex flex-col gap-2 mt-1">
                                            
                                            {imagesAndVideos.length > 0 && (
                                                <div className={cn("grid gap-1", imagesAndVideos.length > 1 ? "grid-cols-2" : "grid-cols-1")}>
                                                    {imagesAndVideos.map((m) => (
                                                        <div key={m.id} className="relative group">
                                                            <img 
                                                                src={m.url} 
                                                                alt="attachment" 
                                                                onClick={() => setSelectedMedia({ url: m.url, fileName: m.fileName })}
                                                                className="rounded-md w-full object-cover max-h-[200px] cursor-pointer hover:opacity-95 transition-opacity" 
                                                            />
                                                        </div>
                                                    ))}
                                                </div>
                                            )}

                                            {documents.length > 0 && (
                                                <div className="flex flex-col gap-1">
                                                    {documents.map((m) => (
                                                        <a 
                                                            key={m.id}
                                                            href={m.url} 
                                                            target="_blank" 
                                                            rel="noopener noreferrer" 
                                                            className={cn(
                                                                "flex items-center gap-2 p-2 rounded-md transition-colors border no-underline",
                                                                isMe 
                                                                    ? "bg-black/10 border-black/5 hover:bg-black/20" 
                                                                    : "bg-white border-gray-200 hover:bg-gray-50"
                                                            )}
                                                        >
                                                            <div className="bg-white p-1.5 rounded-md shadow-sm shrink-0">
                                                                <FileText className="h-5 w-5 text-blue-600" />
                                                            </div>
                                                            <div className="flex flex-col overflow-hidden text-left min-w-0">
                                                                <span className={cn("text-xs font-medium truncate", isMe ? "text-primary-foreground" : "text-foreground")}>
                                                                    {m.fileName}
                                                                </span>
                                                                <span className={cn("text-[9px] uppercase opacity-70", isMe ? "text-primary-foreground" : "text-muted-foreground")}>
                                                                    FILE
                                                                </span>
                                                            </div>
                                                        </a>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })()}
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
        
        {files.length > 0 && (
            <div className="flex gap-2 mb-3 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-gray-200">
                {files.filter(isDoc).map((file, i) => {
                     const { Icon, colorClass } = getFileDetails(file.name);
                     return (
                        <div key={`doc-${i}`} className="relative group flex-shrink-0 w-16 h-16 bg-slate-100 border rounded-lg overflow-hidden flex flex-col items-center justify-center">
                            <button onClick={() => removeFile(file)} className="absolute top-0.5 right-0.5 bg-black/60 hover:bg-red-500 text-white rounded-full p-0.5 transition-colors z-10">
                                <X className="h-3 w-3" />
                            </button>
                            <div className={`${colorClass} p-1 rounded mb-1`}>
                                <Icon className="h-4 w-4" />
                            </div>
                            <span className="text-[8px] text-center w-full truncate px-1 text-slate-600">{file.name}</span>
                        </div>
                     )
                })}

                {files.filter(isMedia).map((file, i) => (
                    <div key={`media-${i}`} className="relative group flex-shrink-0 w-16 h-16 bg-slate-100 border rounded-lg overflow-hidden flex items-center justify-center">
                        <button onClick={() => removeFile(file)} className="absolute top-0.5 right-0.5 bg-black/60 hover:bg-red-500 text-white rounded-full p-0.5 transition-colors z-10">
                            <X className="h-3 w-3" />
                        </button>
                        {file.type.startsWith('image/') ? (
                            <img src={URL.createObjectURL(file)} alt="preview" className="w-full h-full object-cover" />
                        ) : (
                            <video src={URL.createObjectURL(file)} className="w-full h-full object-cover" />
                        )}
                    </div>
                ))}
            </div>
        )}

        <div className="flex items-center gap-2 border rounded-3xl px-3 py-1.5 bg-slate-50 focus-within:bg-white focus-within:ring-1 focus-within:ring-primary/20 focus-within:border-primary transition-all shadow-sm">
            
            <input 
                type="file" 
                ref={mediaInputRef} 
                className="hidden" 
                accept="image/*,video/*" 
                multiple 
                onChange={handleFileChange} 
            />

            <input 
                type="file" 
                ref={docInputRef} 
                className="hidden" 
                accept=".pdf,.doc,.docx,.txt,.ppt,.pptx,.xls,.xlsx,.csv,.zip,.rar,.7z" 
                multiple 
                onChange={handleFileChange} 
            />

            <Button 
                variant="ghost" 
                size="icon" 
                className="rounded-full text-muted-foreground hover:text-green-600 h-9 w-9 shrink-0"
                onClick={() => mediaInputRef.current?.click()}
                disabled={uploadMutation.isPending}
            >
                <ImageIcon className="h-5 w-5" />
            </Button>
            
             <Button 
                variant="ghost" 
                size="icon" 
                className="rounded-full text-muted-foreground hover:text-blue-600 h-9 w-9 shrink-0"
                onClick={() => docInputRef.current?.click()}
                disabled={uploadMutation.isPending}
            >
                <Paperclip className="h-5 w-5" />
            </Button>
            
            <Input 
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !uploadMutation.isPending && handleSend()}
                placeholder="Type a message..." 
                className="border-none bg-transparent focus-visible:ring-0 shadow-none px-2 h-9 text-base" 
                disabled={uploadMutation.isPending}
            />
            
            <Button 
                onClick={handleSend}
                disabled={(!input.trim() && files.length === 0) || uploadMutation.isPending}
                variant="ghost" 
                size="sm" 
                className={cn(
                    "font-semibold shrink-0 transition-all", 
                    (input.trim() || files.length > 0) ? "text-primary hover:bg-primary/10" : "text-muted-foreground"
                )}
            >
                {uploadMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Send"}
            </Button>
        </div>
      </div>

      <Dialog open={!!selectedMedia} onOpenChange={(open) => !open && setSelectedMedia(null)}>
            <DialogContent className="max-w-[90vw] md:max-w-[800px] bg-transparent border-none shadow-none p-0 flex flex-col items-center justify-center">
                <VisuallyHidden.Root>
                    <DialogTitle>Преглед на изображение</DialogTitle>
                </VisuallyHidden.Root>
                
                <div className="relative w-full h-full flex flex-col items-center">
                    <DialogClose className="absolute -top-10 right-0 bg-white/20 hover:bg-white/40 text-white rounded-full p-2 transition-colors">
                        <X className="h-6 w-6" />
                    </DialogClose>

                    {selectedMedia && (
                        <>
                            <img 
                                src={selectedMedia.url} 
                                alt="Full size" 
                                className="max-h-[80vh] w-auto object-contain rounded-md shadow-2xl"
                            />
                            
                            <Button 
                                onClick={() => handleDownload(selectedMedia.url, selectedMedia.fileName)}
                                className="mt-4 gap-2 bg-white text-black hover:bg-white/90"
                            >
                                <Download className="h-4 w-4" />
                                Изтегли
                            </Button>
                        </>
                    )}
                </div>
            </DialogContent>
      </Dialog>
    </div>
  );
}