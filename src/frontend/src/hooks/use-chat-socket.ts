import { useEffect, useRef, useState } from "react";
import * as signalR from "@microsoft/signalr";
import { useQueryClient } from "@tanstack/react-query";
import { MessageDto, ChatAttachmentDto } from "../lib/types/chat";
import { toast } from "sonner";
import { useAuthStore } from "@frontend/stores/useAuthStore";
import { useProfile } from "@frontend/hooks/use-profile"; 
import { useSocketStore } from "@frontend/stores/useSocketStore";

const HUB_URL = "https://localhost:44386/hubs/chat"; 

export const useChatSocket = (chatId: string | null) => {
    const [isConnected, setIsConnected] = useState(false);
    
    const { onlineUsers, setOnlineUsers, addOnlineUser, removeOnlineUser } = useSocketStore();

    const connectionRef = useRef<signalR.HubConnection | null>(null);
    const queryClient = useQueryClient();
    const token = useAuthStore((state) => state.token);
    
    const { data: myProfile } = useProfile();

    useEffect(() => {
        if (!token || !myProfile?.id) return;

        if (connectionRef.current?.state === signalR.HubConnectionState.Connected) {
            setIsConnected(true);
            return;
        }

        const connection = new signalR.HubConnectionBuilder()
            .withUrl(HUB_URL, {
                accessTokenFactory: () => token,
                skipNegotiation: true,
                transport: signalR.HttpTransportType.WebSockets
            })
            .withAutomaticReconnect()
            .configureLogging(signalR.LogLevel.None)
            .build();

        connection.on("ReceiveMessage", (newMessage: MessageDto) => {
            const isMine = newMessage.senderId === myProfile.id;

            const targetChatId = isMine ? newMessage.receiverId : newMessage.senderId;

            const finalTargetId = targetChatId || chatId;

            queryClient.setQueryData(["chat-history", finalTargetId], (oldMessages: MessageDto[] = []) => {
                if (oldMessages.some(m => m.id === newMessage.id)) return oldMessages;
                return [...oldMessages, newMessage];
            });
            
            queryClient.invalidateQueries({ queryKey: ["conversations"] });
        });

        connection.on("UserIsOnline", (userId: string) => {
            addOnlineUser(userId);
        });

        connection.on("UserIsOffline", (userId: string) => {
            removeOnlineUser(userId);
        });

        connection.on("ErrorMessage", (err) => { 
            toast.error(err);
        });

        let isMounted = true;

        const startConnection = async () => {
            try {
                await connection.start();
                if (isMounted) {
                    setIsConnected(true);

                    try {
                        const currentOnlineUsers: string[] = await connection.invoke("GetOnlineUsers");
                        setOnlineUsers(new Set(currentOnlineUsers));
                    } catch (e) {
                        console.error("Failed to fetch online users", e);
                    }

                    if (chatId) {
                        await connection.invoke("JoinChat", chatId);
                    }
                    if (myProfile.id !== chatId) {
                        await connection.invoke("JoinChat", myProfile.id);
                    }
                }
            } catch (err: any) {
                 console.error("Connection error: ", err);
            }
        };

        startConnection();
        connectionRef.current = connection;

        return () => {
            isMounted = false;
            connection.stop().catch(() => {}); 
        };
    }, [chatId, token, queryClient, myProfile?.id]);

    const sendMessage = async (content: string, attachments: ChatAttachmentDto[] = []) => {
        if (!connectionRef.current || connectionRef.current.state !== signalR.HubConnectionState.Connected) {
             return;
        }
        
        try {
            await connectionRef.current.invoke("SendMessage", chatId, content, chatId, null, attachments);
        } catch (error) {
            console.error("Send failed", error);
            toast.error("Неуспешно изпращане.");
        }
    };

    return { isConnected, sendMessage, onlineUsers };
};