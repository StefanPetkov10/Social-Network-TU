"use client";

import { useChatSocket } from "@frontend/hooks/use-chat-socket";

export function SocketInitializer() {
    useChatSocket(null);
    
    return null;
}