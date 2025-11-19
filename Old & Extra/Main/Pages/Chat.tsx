


import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useUserGuardContext } from "app/auth";
import brain from "brain";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Send, MessageSquare, User, Bot } from "lucide-react";
import type {
  ConversationResponse,
  MessageResponse,
  ChatMessage,
  ChatStreamRequest,
} from "types";

const Chat = () => {
  // Force refresh to resolve UserGuard context
  const { user } = useUserGuardContext();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const conversationId = searchParams.get("id");

  // State
  const [conversations, setConversations] = useState<ConversationResponse[]>([]);
  const [messages, setMessages] = useState<MessageResponse[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoadingConversations, setIsLoadingConversations] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [streamingMessage, setStreamingMessage] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);

  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Load conversations
  const loadConversations = async () => {
    try {
      setIsLoadingConversations(true);
      const response = await brain.list_conversations();
      const data = await response.json();
      setConversations(data);
    } catch (error) {
      console.error("Failed to load conversations:", error);
      toast.error("Failed to load conversations");
    } finally {
      setIsLoadingConversations(false);
    }
  };

  // Load messages for conversation
  const loadMessages = async (convId: string) => {
    if (!convId) return;
    
    try {
      setIsLoadingMessages(true);
      const response = await brain.list_messages({ conversationId: convId });
      const data = await response.json();
      setMessages(data);
    } catch (error) {
      console.error("Failed to load messages:", error);
      toast.error("Failed to load messages");
    } finally {
      setIsLoadingMessages(false);
    }
  };

  // Create new conversation
  const createNewConversation = async () => {
    try {
      const response = await brain.create_conversation({ title: "New Chat" });
      const data = await response.json();
      
      // Update conversations list
      setConversations(prev => [data, ...prev]);
      
      // Navigate to new conversation
      setSearchParams({ id: data.id });
      
      toast.success("New conversation created");
    } catch (error) {
      console.error("Failed to create conversation:", error);
      toast.error("Failed to create new conversation");
    }
  };

  // Send message with streaming
  const sendMessage = async () => {
    if (!inputMessage.trim() || isSending) return;
    
    const messageContent = inputMessage.trim();
    setInputMessage("");
    setIsSending(true);
    setIsStreaming(true);
    setStreamingMessage("");

    try {
      // Prepare messages for the API
      const chatMessages: ChatMessage[] = [
        ...messages.map(msg => ({
          role: msg.role,
          content: msg.content
        })),
        {
          role: "user",
          content: messageContent
        }
      ];

      const requestData: ChatStreamRequest = {
        conversation_id: conversationId,
        messages: chatMessages
      };

      // Stream the response
      let fullResponse = "";
      for await (const chunk of brain.chat_stream(requestData)) {
        fullResponse += chunk;
        setStreamingMessage(fullResponse);
      }

      // After streaming is complete, reload messages to get the persisted data
      if (conversationId) {
        await loadMessages(conversationId);
      }
      
      // If this was a new conversation, reload conversations to see it in the list
      if (!conversationId) {
        await loadConversations();
        // The API should return the conversation ID somehow, but for now we'll reload
      }

    } catch (error) {
      console.error("Failed to send message:", error);
      toast.error("Failed to send message");
    } finally {
      setIsSending(false);
      setIsStreaming(false);
      setStreamingMessage("");
    }
  };

  // Handle keyboard shortcuts
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Load conversations on mount
  useEffect(() => {
    loadConversations();
  }, []);

  // Load messages when conversation changes
  useEffect(() => {
    if (conversationId) {
      loadMessages(conversationId);
    } else {
      setMessages([]);
    }
  }, [conversationId]);

  // Auto-scroll when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages, streamingMessage]);

  return (
    <div className="flex h-screen bg-gray-900 text-white">
      {/* Sidebar - Conversation History */}
      <div className="w-80 bg-gray-800 border-r border-gray-700 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-700">
          <Button
            onClick={createNewConversation}
            className="w-full bg-purple-600 hover:bg-purple-700 text-white"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Chat
          </Button>
        </div>

        {/* Conversations List */}
        <ScrollArea className="flex-1 p-2">
          {isLoadingConversations ? (
            <div className="space-y-2">
              {[1, 2, 3, 4, 5].map(i => (
                <Skeleton key={i} className="h-12 w-full bg-gray-700" />
              ))}
            </div>
          ) : conversations.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <MessageSquare className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>No conversations yet</p>
              <p className="text-sm">Start a new chat to begin</p>
            </div>
          ) : (
            <div className="space-y-1">
              {conversations.map(conv => (
                <button
                  key={conv.id}
                  onClick={() => setSearchParams({ id: conv.id })}
                  className={`w-full text-left p-3 rounded-lg transition-colors ${
                    conversationId === conv.id
                      ? "bg-purple-600 text-white"
                      : "hover:bg-gray-700 text-gray-300"
                  }`}
                >
                  <div className="font-medium truncate">{conv.title}</div>
                  <div className="text-xs opacity-70 mt-1">
                    {new Date(conv.updated_at).toLocaleDateString()}
                  </div>
                </button>
              ))}
            </div>
          )}
        </ScrollArea>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {!conversationId ? (
          /* Welcome Screen */
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center max-w-md">
              <MessageSquare className="w-16 h-16 mx-auto mb-4 text-purple-400" />
              <h2 className="text-2xl font-semibold mb-2">Welcome to Eisa's AI</h2>
              <p className="text-gray-400 mb-6">
                Select a conversation from the sidebar or start a new chat to begin.
              </p>
              <Button
                onClick={createNewConversation}
                className="bg-purple-600 hover:bg-purple-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                Start New Chat
              </Button>
            </div>
          </div>
        ) : (
          <>
            {/* Messages Area */}
            <div className="flex-1 overflow-hidden">
              <ScrollArea className="h-full">
                <div className="p-4 space-y-4">
                  {isLoadingMessages ? (
                    <div className="space-y-4">
                      {[1, 2, 3].map(i => (
                        <div key={i} className="flex items-start space-x-3">
                          <Skeleton className="w-8 h-8 rounded-full bg-gray-700" />
                          <div className="space-y-2 flex-1">
                            <Skeleton className="h-4 w-1/4 bg-gray-700" />
                            <Skeleton className="h-16 w-3/4 bg-gray-700" />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : messages.length === 0 && !isStreaming ? (
                    <div className="text-center py-8 text-gray-400">
                      <MessageSquare className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p>Start the conversation</p>
                      <p className="text-sm">Send a message to begin chatting</p>
                    </div>
                  ) : (
                    <>
                      {messages.map(message => (
                        <div key={message.id} className="flex items-start space-x-3">
                          <div className="flex-shrink-0">
                            {message.role === "user" ? (
                              <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center">
                                <User className="w-4 h-4" />
                              </div>
                            ) : (
                              <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center">
                                <Bot className="w-4 h-4" />
                              </div>
                            )}
                          </div>
                          <div className="flex-1 space-y-1">
                            <div className="text-sm font-medium text-gray-300">
                              {message.role === "user" ? "You" : "Assistant"}
                            </div>
                            <div className="prose prose-invert max-w-none">
                              <p className="text-gray-100 whitespace-pre-wrap">
                                {message.content}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                      
                      {/* Streaming Message */}
                      {isStreaming && streamingMessage && (
                        <div className="flex items-start space-x-3">
                          <div className="flex-shrink-0">
                            <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center">
                              <Bot className="w-4 h-4" />
                            </div>
                          </div>
                          <div className="flex-1 space-y-1">
                            <div className="text-sm font-medium text-gray-300">
                              Assistant
                            </div>
                            <div className="prose prose-invert max-w-none">
                              <p className="text-gray-100 whitespace-pre-wrap">
                                {streamingMessage}
                                <span className="inline-block w-2 h-4 bg-purple-400 ml-1 animate-pulse" />
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>
            </div>

            {/* Message Composer */}
            <div className="border-t border-gray-700 p-4">
              <div className="flex space-x-2">
                <div className="flex-1">
                  <Textarea
                    ref={textareaRef}
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Type your message... (Enter to send, Shift+Enter for new line)"
                    className="resize-none bg-gray-800 border-gray-600 text-white placeholder-gray-400 focus:border-purple-500"
                    rows={1}
                    disabled={isSending}
                  />
                </div>
                <Button
                  onClick={sendMessage}
                  disabled={!inputMessage.trim() || isSending}
                  className="bg-purple-600 hover:bg-purple-700 disabled:opacity-50"
                >
                  {isSending ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </Button>
              </div>
              
              {/* Hint */}
              <div className="text-xs text-gray-500 mt-2">
                Press Enter to send, Shift+Enter for new line
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Chat;
