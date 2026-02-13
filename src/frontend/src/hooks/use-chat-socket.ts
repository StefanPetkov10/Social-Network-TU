import { useEffect, useState } from "react";
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

    useEffect(() => {
        if (!token || !myProfile?.id) return;

        if (!globalConnection) {
            console.log("Creating NEW SignalR Connection..."); 
            globalConnection = new signalR.HubConnectionBuilder()
                .withUrl(HUB_URL, {
                    accessTokenFactory: () => token,
                    skipNegotiation: true,
                    transport: signalR.HttpTransportType.WebSockets
                })
                .withAutomaticReconnect()
                .configureLogging(signalR.LogLevel.Error)
                .build();
        }

        const connection = globalConnection;

        connection.off("ReceiveMessage");
        connection.off("UserIsOnline");
        connection.off("UserIsOffline");
        connection.off("ErrorMessage");

        connection.on("ReceiveMessage", (newMessage: MessageDto) => {
            const isMine = newMessage.senderId === myProfile.id;
            const targetChatId = isMine ? newMessage.receiverId : newMessage.senderId;
            const cacheKey = targetChatId; 

            if (cacheKey) {
                queryClient.setQueryData(["chat-history", cacheKey], (oldMessages: MessageDto[] = []) => {
                    if (oldMessages.some(m => m.id === newMessage.id)) return oldMessages;
                    return [...oldMessages, newMessage];
                });
            }
            queryClient.invalidateQueries({ queryKey: ["conversations"] });
        });

        connection.on("UserIsOnline", (userId: string) => addOnlineUser(userId));
        connection.on("UserIsOffline", (userId: string) => removeOnlineUser(userId));
        connection.on("ErrorMessage", (err) => toast.error(err));

        const startConnection = async () => {
            if (connection.state === signalR.HubConnectionState.Connected) {
                setIsConnected(true);
                return;
            }
            
            if (connection.state !== signalR.HubConnectionState.Disconnected) {
                return;
            }

            try {
                await connection.start();
                console.log("Global SignalR Connected!");
                setIsConnected(true);

                try {
                    const currentOnlineUsers: string[] = await connection.invoke("GetOnlineUsers");
                    setOnlineUsers(new Set(currentOnlineUsers));
                } catch (e) {
                    console.error("Failed to fetch online users", e);
                }

                await connection.invoke("JoinChat", myProfile.id);

            } catch (err: any) {
                 console.error("Connection error: ", err);
                 setIsConnected(false);
            }
        };

        startConnection();

        return () => {
        };
    }, [token, myProfile?.id]); 

    useEffect(() => {
        if (globalConnection && globalConnection.state === signalR.HubConnectionState.Connected && chatId) {
            globalConnection.invoke("JoinChat", chatId).catch(err => console.error("Join Room Failed", err));
        }
    }, [chatId, isConnected]);

    const sendMessage = async (content: string, attachments: ChatAttachmentDto[] = []) => {
        if (!globalConnection || globalConnection.state !== signalR.HubConnectionState.Connected) {
             return;
        }
        try {
            if (!chatId) return; 
            await globalConnection.invoke("SendMessage", chatId, content, chatId, null, attachments);
        } catch (error) {
            console.error("Send failed", error);
            toast.error("Неуспешно изпращане.");
        }
    };

    const { onlineUsers } = useSocketStore();

    return { isConnected, sendMessage, onlineUsers };
};