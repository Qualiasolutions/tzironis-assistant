"use client";

import { useState, useEffect, useRef } from "react";
import { useLanguage } from "@/app/lib/LanguageContext";
import MessageBubble from "./MessageBubble";
import { Message } from "@/app/lib/types";
import VoiceControls from "./VoiceControls";
import { Send, Bot, Sparkles, Globe } from "lucide-react";

export default function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const { t, language, changeLanguage } = useLanguage();

  useEffect(() => {
    // Set welcome message
    setMessages([{
      role: "assistant",
      content: t("chatWelcomeMessage") || "Hello! I'm your Tzironis business assistant. How can I help you today?",
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
    
    // Check if the user is asking about Greek language
    if (inputValue.toLowerCase().trim() === "greek?" || 
        inputValue.toLowerCase().includes("switch to greek") || 
        inputValue.toLowerCase().includes("ελληνικά") || 
        inputValue.toLowerCase().includes("greek language")) {
      
      // Change language to Greek
      if (language !== "el") {
        changeLanguage("el");
        setMessages((prevMessages) => [
          ...prevMessages,
          {
            role: "assistant",
            content: "Αλλάζω σε Ελληνικά! Μπορείτε επίσης να αλλάξετε γλώσσα χρησιμοποιώντας τον επιλογέα γλώσσας στην επάνω δεξιά γωνία της οθόνης.",
          },
        ]);
      } else {
        setMessages((prevMessages) => [
          ...prevMessages,
          {
            role: "assistant",
            content: "Η εφαρμογή είναι ήδη στα Ελληνικά! Χρησιμοποιήστε τον επιλογέα γλώσσας στην επάνω δεξιά γωνία για να αλλάξετε γλώσσα.",
          },
        ]);
      }
      return;
    }
    
    // Check if the user is asking about English language
    if (inputValue.toLowerCase().trim() === "english?" || 
        inputValue.toLowerCase().includes("switch to english") || 
        inputValue.toLowerCase().includes("αγγλικά") ||
        inputValue.toLowerCase().includes("english language")) {
      
      // Change language to English
      if (language !== "en") {
        changeLanguage("en");
        setMessages((prevMessages) => [
          ...prevMessages,
          {
            role: "assistant",
            content: "Switching to English! You can also change the language using the language selector in the top right corner of the screen.",
          },
        ]);
      } else {
        setMessages((prevMessages) => [
          ...prevMessages,
          {
            role: "assistant",
            content: "The application is already in English! Use the language selector in the top right corner to change languages.",
          },
        ]);
      }
      return;
    }

    setIsLoading(true);

    // Check if this is a web search query
    const isWebSearch = /search for|find information|look up|αναζήτηση για|βρες πληροφορίες|ψάξε για/i.test(inputValue);
    
    if (isWebSearch) {
      setMessages((prevMessages) => [
        ...prevMessages,
        { 
          role: "assistant", 
          content: t("searchingKnowledgeBase") || "Searching the knowledge base...",
        },
      ]);
    }

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
      
      // If this was a search query, replace the "searching..." message
      if (isWebSearch) {
        setMessages((prevMessages) => [
          ...prevMessages.slice(0, prevMessages.length - 1),
          { 
            role: "assistant", 
            content: data.content,
            sources: data.sources 
          },
        ]);
      } else {
        setMessages((prevMessages) => [
          ...prevMessages,
          { role: "assistant", content: data.content, sources: data.sources },
        ]);
      }
    } catch (error) {
      console.error("Error sending message:", error);
      
      // If this was a search query, replace the "searching..." message
      if (isWebSearch) {
        setMessages((prevMessages) => [
          ...prevMessages.slice(0, prevMessages.length - 1),
          {
            role: "assistant",
            content: t("errorMessage") || "I'm sorry, I encountered an error while processing your request. Please try again.",
          },
        ]);
      } else {
        setMessages((prevMessages) => [
          ...prevMessages,
          {
            role: "assistant",
            content: t("errorMessage") || "I'm sorry, I encountered an error while processing your request. Please try again.",
          },
        ]);
      }
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
    <div className="flex flex-col h-full max-h-full w-full bg-white dark:bg-gray-900 relative">
      {/* Chat header */}
      <div className="border-b border-gray-200 dark:border-gray-800 py-3 px-4 bg-white dark:bg-gray-900">
        <div className="flex items-center">
          <Bot className="h-5 w-5 text-primary mr-2" />
          <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100">Tzironis Assistant</h2>
        </div>
      </div>
      
      {/* Chat messages container */}
      <div className="flex-1 overflow-y-auto pb-32">
        <div className="px-4 py-6 space-y-6">
          {messages.map((message, index) => (
            <MessageBubble key={index} message={message} />
          ))}
          {isLoading && (
            <div className="flex justify-center py-4">
              <div className="animate-pulse flex space-x-2 items-center">
                <Bot className="h-5 w-5 text-primary" />
                <span className="text-sm text-gray-600 dark:text-gray-300">{t("loading") || "Thinking..."}</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} className="h-4" />
        </div>
      </div>

      {/* Input area - fixed at bottom */}
      <div className="border-t border-gray-200 dark:border-gray-800 p-4 bg-white dark:bg-gray-900 absolute bottom-0 left-0 right-0 shadow-lg">
        <div className="relative flex items-center">
          <textarea
            ref={inputRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={t("chatPlaceholder") || "Type your message..."}
            className="w-full py-3 pl-4 pr-24 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full resize-none text-sm text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            rows={1}
            disabled={isLoading}
          />
          
          <div className="absolute right-12 top-1 transform -translate-y-1">
            <VoiceControls 
              onTextInput={handleTextInput} 
              disabled={isLoading} 
              className="text-gray-500 dark:text-gray-400 hover:text-primary dark:hover:text-primary transition-colors"
            />
          </div>
          
          <button
            onClick={handleSendMessage}
            disabled={inputValue.trim() === "" || isLoading}
            className="absolute right-3 p-2 rounded-full text-white bg-primary hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
            aria-label={t("sendMessage") || "Send message"}
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
        
        <div className="mt-2 flex justify-center">
          <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center">
            <Sparkles className="h-3 w-3 mr-1 text-primary" />
            {t("poweredBy") || "Powered by"} QUALIA
          </span>
        </div>
      </div>
    </div>
  );
} 