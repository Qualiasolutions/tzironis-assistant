"use client";

import { useState, useEffect, useRef } from "react";
import { useLanguage } from "@/app/lib/LanguageContext";
import MessageBubble from "./MessageBubble";
import { Message } from "@/app/lib/types";
import VoiceControls from "./VoiceControls";
import { Send, Bot, Sparkles } from "lucide-react";

export default function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const { t, language } = useLanguage();

  useEffect(() => {
    // Set welcome message
    setMessages([{
      role: "assistant",
      content: t("chatWelcomeMessage"),
    }]);
  }, [language, t]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSendMessage = async () => {
    if (inputValue.trim() === "" || isLoading) return;

    const userMessage: Message = {
      role: "user",
      content: inputValue,
    };

    setMessages((prevMessages) => [...prevMessages, userMessage]);
    setInputValue("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: [...messages, userMessage],
          language,
        }),
      });

      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }

      const data = await response.json();
      console.log("API Response:", data); // Debug log to see response structure
      
      setMessages((prevMessages) => [
        ...prevMessages,
        { role: "assistant", content: data.content },
      ]);
    } catch (error) {
      console.error("Error sending message:", error);
      setMessages((prevMessages) => [
        ...prevMessages,
        {
          role: "assistant",
          content: t("errorMessage"),
        },
      ]);
    } finally {
      setIsLoading(false);
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleTextInput = (text: string) => {
    setInputValue(text);
  };

  return (
    <div className="flex flex-col h-full w-full bg-white dark:bg-slate-900">
      {/* Chat messages container */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 pb-20">
        {messages.map((message, index) => (
          <MessageBubble key={index} message={message} />
        ))}
        {isLoading && (
          <div className="flex justify-center py-4">
            <div className="animate-pulse flex space-x-2 items-center">
              <Bot className="h-5 w-5 text-primary" />
              <span className="text-sm text-slate-500 dark:text-slate-400">{t("loading")}</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input area - fixed at bottom */}
      <div className="border-t border-slate-200 dark:border-slate-800 p-4 bg-white dark:bg-slate-900 absolute bottom-0 left-0 right-0">
        <div className="relative flex items-center">
          <VoiceControls 
            onTextInput={handleTextInput} 
            disabled={isLoading} 
            className="absolute left-3 text-slate-500"
          />
          
          <textarea
            ref={inputRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={t("chatPlaceholder")}
            className="w-full py-3 px-12 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full resize-none text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            rows={1}
            disabled={isLoading}
          />
          
          <button
            onClick={handleSendMessage}
            disabled={inputValue.trim() === "" || isLoading}
            className="absolute right-3 p-2 rounded-full text-white bg-primary hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
            aria-label={t("sendMessage")}
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
        
        <div className="mt-2 flex justify-center">
          <span className="text-xs text-slate-500 dark:text-slate-400 flex items-center">
            <Sparkles className="h-3 w-3 mr-1 text-primary" />
            {t("poweredBy")} QUALIA
          </span>
        </div>
      </div>
    </div>
  );
} 