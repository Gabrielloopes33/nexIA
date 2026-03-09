"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Search, MessageCircle, Send } from "lucide-react";
import { formatDistanceToNow } from "@/lib/utils";

interface Conversation {
  id: string;
  contact: {
    id: string;
    name: string;
    externalId: string;
  };
  lastMessage?: {
    content: string;
    direction: string;
    sentAt: Date;
  };
  status: string;
  unreadCount?: number;
}

interface InstagramDirectSectionProps {
  conversations: Conversation[];
  isLoading?: boolean;
  onSelectConversation: (id: string) => void;
  onSendMessage: (conversationId: string, text: string) => Promise<void>;
}

export function InstagramDirectSection({
  conversations,
  isLoading,
  onSelectConversation,
  onSendMessage,
}: InstagramDirectSectionProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [messageText, setMessageText] = useState("");
  const [isSending, setIsSending] = useState(false);

  const filteredConversations = conversations.filter((conv) =>
    conv.contact.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelectConversation = (id: string) => {
    setSelectedConversation(id);
    onSelectConversation(id);
  };

  const handleSendMessage = async () => {
    if (!selectedConversation || !messageText.trim()) return;

    setIsSending(true);
    try {
      await onSendMessage(selectedConversation, messageText.trim());
      setMessageText("");
    } finally {
      setIsSending(false);
    }
  };

  const selectedConv = conversations.find((c) => c.id === selectedConversation);

  return (
    <Card className="h-[600px]">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg flex items-center gap-2">
          <MessageCircle className="h-5 w-5" />
          Direct Messages
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="flex h-[520px]">
          {/* Conversation List */}
          <div className="w-80 border-r flex flex-col">
            <div className="p-3 border-b">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar conversas..."
                  className="pl-9"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto">
              {isLoading ? (
                <div className="p-4 text-center text-muted-foreground">
                  Carregando...
                </div>
              ) : filteredConversations.length === 0 ? (
                <div className="p-4 text-center text-muted-foreground">
                  Nenhuma conversa encontrada
                </div>
              ) : (
                filteredConversations.map((conv) => (
                  <button
                    key={conv.id}
                    onClick={() => handleSelectConversation(conv.id)}
                    className={`w-full p-3 flex items-start gap-3 hover:bg-accent transition-colors text-left ${
                      selectedConversation === conv.id ? "bg-accent" : ""
                    }`}
                  >
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-500 text-white text-sm">
                        {conv.contact.name.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="font-medium truncate">{conv.contact.name}</p>
                        {conv.unreadCount ? (
                          <Badge variant="default" className="ml-2">
                            {conv.unreadCount}
                          </Badge>
                        ) : null}
                      </div>
                      <p className="text-sm text-muted-foreground truncate">
                        {conv.lastMessage?.direction === "OUTBOUND" ? "Você: " : ""}
                        {conv.lastMessage?.content || "Sem mensagens"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {conv.lastMessage?.sentAt &&
                          formatDistanceToNow(new Date(conv.lastMessage.sentAt))}
                      </p>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Chat Area */}
          <div className="flex-1 flex flex-col">
            {selectedConv ? (
              <>
                {/* Header */}
                <div className="p-3 border-b flex items-center gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-500 text-white text-xs">
                      {selectedConv.contact.name.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span className="font-medium">{selectedConv.contact.name}</span>
                </div>

                {/* Messages */}
                <div className="flex-1 p-4 overflow-y-auto">
                  <div className="text-center text-muted-foreground text-sm">
                    Selecione uma conversa para ver as mensagens
                  </div>
                </div>

                {/* Input */}
                <div className="p-3 border-t flex gap-2">
                  <Input
                    placeholder="Digite uma mensagem..."
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                  />
                  <Button
                    size="icon"
                    onClick={handleSendMessage}
                    disabled={isSending || !messageText.trim()}
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-muted-foreground">
                Selecione uma conversa para começar
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
