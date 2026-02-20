import { useEffect, useState, useRef } from "react";
import * as signalR from "@microsoft/signalr";
import { useQueryClient } from "@tanstack/react-query";
import { MessageDto, ChatAttachmentDto, ChatConversationDto } from "../lib/types/chat"; 
import { toast } from "sonner";
import { useAuthStore } from "@frontend/stores/useAuthStore";
import { useProfile } from "@frontend/hooks/use-profile"; 
import { useSocketStore } from "@frontend/stores/useSocketStore";

const HUB_URL = "https://localhost:44386/hubs/chat"; 

let globalConnection: signalR.HubConnection | null = null;

export const useChatSocket = (chatId: string | null) => {
    const [isConnected, setIsConnected] = useState(false);
    const { setOnlineUsers, addOnlineUser, removeOnlineUser } = useSocketStore();
    const queryClient = useQueryClient();
    const token = useAuthStore((state) => state.token);
    const { data: myProfile } = useProfile();

    const profileRef = useRef(myProfile);
    const isConnecting = useRef(false);

    const activeChatIdRef = useRef(chatId);

    useEffect(() => {
        profileRef.current = myProfile;
    }, [myProfile]);

    useEffect(() => {
        activeChatIdRef.current = chatId;
    }, [chatId]);

    useEffect(() => {
        if (!token || !myProfile?.id) return;

        const setupConnection = async () => {
            if (!globalConnection) {
                console.log("Initializing SignalR Connection..."); 
                globalConnection = new signalR.HubConnectionBuilder()
                    .withUrl(HUB_URL, {
                        accessTokenFactory: () => token,
                        skipNegotiation: true,
                        transport: signalR.HttpTransportType.WebSockets
                    })
                    .withKeepAliveInterval(15000) 
                    .withAutomaticReconnect([0, 2000, 5000, 10000]) 
                    .configureLogging(signalR.LogLevel.None) 
                    .build();
            }

            const connection = globalConnection;

            connection.off("ReceiveMessage");
            connection.off("MessageEdited");
            connection.off("MessageDeleted");
            connection.off("UserIsOnline");
            connection.off("UserIsOffline");
            connection.off("ErrorMessage");
            connection.off("MessagesMarkedAsRead"); 

            const handleMessageUpdate = (msg: MessageDto, eventType: "ReceiveMessage" | "MessageEdited" | "MessageDeleted") => {
                const currentProfileId = profileRef.current?.id;
                const isMine = msg.senderId === currentProfileId;
                
                let targetChatId = null;

                if (msg.groupId) {
                    targetChatId = msg.groupId;
                } else {
                    targetChatId = isMine ? msg.receiverId : msg.senderId;
                }

                if (targetChatId) {
                    queryClient.setQueryData(["chat-history", targetChatId], (oldMessages: MessageDto[] = []) => {
                        const index = oldMessages.findIndex(m => m.id === msg.id);
                        
                        if (index !== -1) {
                            const updatedList = [...oldMessages];
                            updatedList[index] = msg; 
                            return updatedList;
                        } else {
                            return [...oldMessages, msg];
                        }
                    });
                    
                    queryClient.invalidateQueries({ queryKey: ["chat-history", targetChatId] });

                    queryClient.setQueryData(["conversations"], (oldConvs: ChatConversationDto[] | undefined) => {
                        if (!oldConvs) return oldConvs;
                        
                        const convIndex = oldConvs.findIndex(c => c.id === targetChatId);
                        const isCurrentChatOpen = targetChatId === activeChatIdRef.current; 
                        
                        if (convIndex !== -1) {
                            const updatedConvs = [...oldConvs];
                            const conv = updatedConvs[convIndex];
                            
                            let newUnreadCount = conv.unreadCount;
                            
                            if (eventType === "ReceiveMessage" && !isMine && !isCurrentChatOpen) {
                                newUnreadCount += 1;
                            } else if (isCurrentChatOpen) {
                                newUnreadCount = 0; 
                            }

                            let lastMsgText = msg.content || "Прикачен файл";
                            if (msg.isDeleted) lastMsgText = "Съобщението е изтрито";

                            updatedConvs[convIndex] = {
                                ...conv,
                                lastMessage: lastMsgText,
                                lastMessageTime: msg.sentAt,
                                unreadCount: newUnreadCount
                            };

                            if (eventType === "ReceiveMessage") {
                                const [moved] = updatedConvs.splice(convIndex, 1);
                                updatedConvs.unshift(moved);
                            }
                            
                            return updatedConvs;
                        } else {
                            queryClient.invalidateQueries({ queryKey: ["conversations"] });
                            return oldConvs;
                        }
                    });
                }
            };

            const handleMessagesMarkedAsRead = (readerProfileId: string, messageIds: string[], targetChatId: string) => {
                queryClient.setQueryData(["chat-history", targetChatId], (oldMessages: MessageDto[] = []) => {
                    return oldMessages.map(msg => {
                        if (messageIds.includes(msg.id) && !msg.readBy?.includes(readerProfileId)) {
                            return { ...msg, readBy: [...(msg.readBy || []), readerProfileId] };
                        }
                        return msg;
                    });
                });

                if (readerProfileId === profileRef.current?.id) {
                    queryClient.setQueryData(["conversations"], (oldConvs: ChatConversationDto[] = []) => {
                        return oldConvs.map(conv => {
                            if (conv.id === targetChatId) {
                                return { ...conv, unreadCount: 0 };
                            }
                            return conv;
                        });
                    });
                }
            };

            connection.on("ReceiveMessage", (msg) => handleMessageUpdate(msg, "ReceiveMessage"));
            connection.on("MessageEdited", (msg) => handleMessageUpdate(msg, "MessageEdited"));
            connection.on("MessageDeleted", (msg) => handleMessageUpdate(msg, "MessageDeleted"));
            
            connection.on("MessagesMarkedAsRead", handleMessagesMarkedAsRead); 

            connection.on("UserIsOnline", (userId: string) => addOnlineUser(userId));
            connection.on("UserIsOffline", (userId: string) => removeOnlineUser(userId));
            connection.on("ErrorMessage", (err) => toast.error(err));

            connection.onreconnected(async () => {
                console.log("SignalR Reconnected!");
                setIsConnected(true);
                try {
                    const users = await connection.invoke("GetOnlineUsers");
                    setOnlineUsers(new Set(users));
                    if(profileRef.current?.id) await connection.invoke("JoinChat", profileRef.current.id);
                    if (activeChatIdRef.current) await connection.invoke("JoinChat", activeChatIdRef.current);
                } catch (e) { console.error("Reconnect setup failed", e); }
            });

            connection.onclose(() => {
                console.log("SignalR Connection Closed.");
                setIsConnected(false);
                isConnecting.current = false;
            });

            if (connection.state === signalR.HubConnectionState.Disconnected && !isConnecting.current) {
                isConnecting.current = true;
                try {
                    await connection.start();
                    console.log("Global SignalR Connected!");
                    setIsConnected(true);

                    const users = await connection.invoke("GetOnlineUsers");
                    setOnlineUsers(new Set(users));
                    await connection.invoke("JoinChat", myProfile.id);

                } catch (err) {
                    console.error("SignalR Start Error:", err);
                    setIsConnected(false);
                } finally {
                    isConnecting.current = false;
                }
            } else if (connection.state === signalR.HubConnectionState.Connected) {
                setIsConnected(true);
                connection.invoke("JoinChat", myProfile.id).catch(() => {});
            }
        };

        setupConnection();

        return () => {
            if (globalConnection) {
                globalConnection.off("ReceiveMessage");
                globalConnection.off("MessageEdited");
                globalConnection.off("MessageDeleted");
                globalConnection.off("UserIsOnline");
                globalConnection.off("UserIsOffline");
                globalConnection.off("ErrorMessage");
                globalConnection.off("MessagesMarkedAsRead"); 
            }
        };
    }, [token, myProfile?.id]); 

    useEffect(() => {
        if (globalConnection?.state === signalR.HubConnectionState.Connected && chatId) {
            globalConnection.invoke("JoinChat", chatId).catch(err => console.error("Join Room Failed", err));
        }
    }, [chatId, isConnected]);

    const sendMessage = async (content: string, attachments: ChatAttachmentDto[] = [], isGroup: boolean = false) => {
        if (!globalConnection || globalConnection.state !== signalR.HubConnectionState.Connected) {
             toast.error("Няма връзка със сървъра. Опитайте да презаредите.");
             return;
        }
        try {
            if (!chatId) return; 

            const receiverId = isGroup ? null : chatId; 
            const groupId = isGroup ? chatId : null;    

            await globalConnection.invoke(
                "SendMessage", 
                chatId,      
                content,     
                receiverId,  
                groupId,     
                attachments  
            );
        } catch (error) {
            console.error("Send failed", error);
            toast.error("Неуспешно изпращане.");
        }
    };

    const editMessage = async (messageId: string, newContent: string) => {
        if (!globalConnection || globalConnection.state !== signalR.HubConnectionState.Connected) {
            toast.error("Няма връзка със сървъра. Опитайте да презаредите.");
            return;
        }
        try {
            await globalConnection.invoke("EditMessage", messageId, newContent);
        } catch (error) {
            console.error("Edit failed", error);
            toast.error("Неуспешна редакция.");
        }
    };

    const reactToMessage = async (messageId: string, reactionType: number) => {
        if (!globalConnection || globalConnection.state !== signalR.HubConnectionState.Connected) {
            toast.error("Няма връзка със сървъра. Опитайте да презаредите.");
            return;
        }
        try {
            await globalConnection.invoke("ReactToMessage", messageId, reactionType);
        } catch (error) {
            console.error("Reaction failed", error);
            toast.error("Неуспешна реакция.");
        }
    };

    const deleteMessage = async (messageId: string) => {
        if (!globalConnection || globalConnection.state !== signalR.HubConnectionState.Connected) {
            toast.error("Няма връзка със сървъра. Опитайте да презаредите.");
            return;
        }
        try {
            await globalConnection.invoke("DeleteMessage", messageId);
        } catch (error) {
            console.error("Delete failed", error);
            toast.error("Неуспешно изтриване.");
        }
    };

    const markChatAsRead = async (targetChatId: string, isGroup: boolean = false) => {
        if (!globalConnection || globalConnection.state !== signalR.HubConnectionState.Connected) {
            return; 
        }
        try {
            await globalConnection.invoke("MarkChatAsRead", targetChatId, isGroup);
        } catch (error) {
            console.error("Failed to mark chat as read", error);
        }
    };

    const { onlineUsers } = useSocketStore();

    return { isConnected, sendMessage, editMessage, reactToMessage, deleteMessage, markChatAsRead, onlineUsers };
};