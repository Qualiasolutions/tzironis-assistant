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
      
      setMessages((prevMessages) => [
        ...prevMessages,
        { role: "assistant", content: data.message },
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
    <div className="flex flex-col h-full max-w-4xl mx-auto">
      <div className="flex-1 overflow-y-auto p-4 space-y-4 mb-4 relative">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-50 to-transparent dark:from-blue-900/20 dark:to-transparent opacity-70 pointer-events-none"></div>
        <div className="relative z-10 space-y-4">
          {messages.map((message, index) => (
            <div 
              key={index}
              className={`animate-fadein`}
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <MessageBubble
                message={message}
                showAvatar={true}
              />
            </div>
          ))}
          {isLoading && (
            <div className="message-bubble assistant flex items-center p-4 rounded-xl max-w-[80%] animate-pulse bg-white/80 dark:bg-gray-800/70 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50 shadow-sm">
              <div className="flex-shrink-0 mr-3">
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                  <Bot className="h-5 w-5 text-primary" />
                </div>
              </div>
              <div className="flex space-x-2">
                <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: "0s" }}></div>
                <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: "0.2s" }}></div>
                <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: "0.4s" }}></div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-white/70 dark:bg-gray-800/50 backdrop-blur-md rounded-t-xl">
        <div className="relative flex items-end gap-2">
          <div className="relative flex-1">
            <textarea
              ref={inputRef}
              className="w-full p-3 pr-12 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder:text-gray-400 resize-none min-h-[56px] max-h-[200px] focus:ring-2 focus:ring-primary/30 focus:border-primary focus:outline-none"
              placeholder={t("typeMessage")}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              rows={1}
              style={{ height: Math.min(Math.max(56, inputValue.split('\n').length * 24 + 24), 200) + 'px' }}
            />
            <button
              onClick={handleSendMessage}
              disabled={inputValue.trim() === "" || isLoading}
              className="absolute right-2 bottom-2 p-2 bg-primary text-white rounded-lg disabled:opacity-50 hover:bg-accent hover-card-effect transition-all"
              aria-label={t("sendMessage")}
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
          <VoiceControls onTextInput={handleTextInput} />
        </div>
        
        <div className="mt-3 text-xs text-center text-gray-500 dark:text-gray-400 flex justify-center items-center space-x-1">
          <Sparkles className="h-3 w-3" />
          <span>{t("poweredByMistral")}</span>
        </div>
      </div>
    </div>
  );
} 