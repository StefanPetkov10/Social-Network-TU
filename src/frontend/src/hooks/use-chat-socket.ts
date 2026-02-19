import { useEffect, useState, useRef } from "react";
import * as signalR from "@microsoft/signalr";
import { useQueryClient } from "@tanstack/react-query";
import { MessageDto, ChatAttachmentDto } from "../lib/types/chat";
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

    useEffect(() => {
        profileRef.current = myProfile;
    }, [myProfile]);

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

            const handleMessageUpdate = (msg: MessageDto) => {
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
                }
                
                queryClient.invalidateQueries({ queryKey: ["conversations"] });
            };

            connection.on("ReceiveMessage", handleMessageUpdate);
            connection.on("MessageEdited", handleMessageUpdate);
            connection.on("MessageDeleted", handleMessageUpdate);

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
                    if (chatId) await connection.invoke("JoinChat", chatId);
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

    const { onlineUsers } = useSocketStore();

    return { isConnected, sendMessage, editMessage, reactToMessage,deleteMessage, onlineUsers };
};