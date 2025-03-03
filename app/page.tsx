"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useLanguage } from "./lib/LanguageContext";
import { 
  Globe, 
  Mic, 
  FileText, 
  Send, 
  Smartphone, 
  Monitor,
  Search,
  ChevronRight,
  Bot,
  Sparkles
} from "lucide-react";
import NavBar from "./components/NavBar";
import { Message } from "./lib/types";
import MessageBubble from "./components/MessageBubble";
import VoiceControls from "./components/VoiceControls";

export default function HomePage() {
  const { t, language } = useLanguage();
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  
  // Set welcome message on initial load
  useEffect(() => {
    setMessages([{
      role: "assistant",
      content: t("chatWelcomeMessage") || "Hello! I'm Qualia, your business assistant for Tzironis. How can I help you today?",
    }]);
  }, [language, t]);

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Animation effect for typing indicator
  useEffect(() => {
    if (inputValue.length > 0) {
      setIsTyping(true);
    } else {
      setIsTyping(false);
    }
  }, [inputValue]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setInputValue(e.target.value);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim() !== "") {
      handleSendMessage();
    }
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
        { role: "assistant", content: data.content },
      ]);
    } catch (error) {
      console.error("Error sending message:", error);
      setMessages((prevMessages) => [
        ...prevMessages,
        {
          role: "assistant",
          content: t("errorMessage") || "Sorry, I encountered an error. Please try again.",
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

  const handleCapabilityClick = (capability: string) => {
    setInputValue(`Tell me about ${capability}`);
    setTimeout(() => {
      handleSendMessage();
    }, 100);
  };

  // Define capabilities with icons
  const capabilities = [
    { 
      id: "web-search", 
      name: t("webSearch") || "Web Search", 
      icon: <Search className="w-5 h-5 text-blue-500" />,
      description: t("webSearchDesc") || "Search the Tzironis knowledge base for information",
      examples: ["Search for invoice automation", "Find information about Tzironis services", "Look up product details"]
    },
    { 
      id: "voice", 
      name: t("voiceCommands") || "Voice Commands", 
      icon: <Mic className="w-5 h-5 text-purple-500" />,
      description: t("voiceCommandsDesc") || "Control with voice in English and Greek"
    },
    { 
      id: "invoice", 
      name: t("invoiceCreation") || "Invoice Creation", 
      icon: <FileText className="w-5 h-5 text-emerald-500" />,
      description: t("invoiceCreationDesc") || "Create and manage invoices"
    },
    { 
      id: "multilingual", 
      name: t("multilingual") || "Multilingual", 
      icon: <Globe className="w-5 h-5 text-amber-500" />,
      description: t("multilingualDesc") || "Support for multiple languages"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-950">
      <NavBar />
      <div className="container mx-auto px-4 pt-16 pb-6 flex flex-col lg:flex-row gap-6 min-h-[calc(100vh-4rem)]">
        {/* Main content area - Full-sized chatbot */}
        <div className="flex-1 flex flex-col">
          {/* Chat interface - Enhanced UI */}
          <div className="flex-1 flex flex-col bg-slate-900 border border-slate-700 rounded-xl overflow-hidden shadow-xl h-[calc(100vh-8rem)]">
            {/* Chat header */}
            <div className="bg-slate-800 border-b border-slate-700 p-4 flex items-center justify-between">
              <div className="flex items-center">
                <Bot className="h-6 w-6 text-primary mr-2" />
                <h2 className="font-medium text-white text-lg">Tzironis AI Assistant</h2>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded-full flex items-center">
                  <span className="w-2 h-2 bg-green-400 rounded-full mr-1"></span>
                  Online
                </span>
              </div>
            </div>
            
            {/* Chat messages container */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 max-h-full">
              {messages.map((message, index) => (
                <MessageBubble key={index} message={message} />
              ))}
              {isLoading && (
                <div className="flex justify-center py-4">
                  <div className="animate-pulse flex space-x-2 items-center">
                    <Bot className="h-5 w-5 text-primary" />
                    <span className="text-sm text-slate-400">{t("loading") || "Loading..."}</span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} className="h-4" />
            </div>
            
            {/* Input area - Enhanced UI */}
            <div className="border-t border-slate-700 p-4 bg-slate-800">
              <form onSubmit={handleSubmit} className="relative">
                <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400">
                  <VoiceControls 
                    onTextInput={handleTextInput} 
                    disabled={isLoading}
                    className="hover:text-primary transition-colors"
                  />
                </div>
                
                <input
                  type="text"
                  value={inputValue}
                  onChange={handleInputChange}
                  onKeyDown={handleKeyDown}
                  placeholder={t("typeMessage") || "Type your message or use voice input..."}
                  className="w-full py-3.5 px-12 bg-slate-700 border border-slate-600 rounded-full text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent shadow-inner"
                  disabled={isLoading}
                />
                
                <button
                  type="submit"
                  disabled={inputValue.trim() === "" || isLoading}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 p-2 rounded-full text-white bg-primary hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors focus:outline-none shadow-md"
                  aria-label={t("sendMessage") || "Send message"}
                >
                  <Send className="h-4 w-4" />
                </button>
                
                {isTyping && (
                  <span className="absolute bottom-full left-4 mb-2 text-xs text-slate-400">
                    {t("pressEnterToSubmit") || "Press Enter to submit"}
                  </span>
                )}
              </form>
              
              <div className="mt-2 flex justify-center">
                <span className="text-xs text-slate-500 flex items-center">
                  <Sparkles className="h-3 w-3 mr-1 text-primary" />
                  {t("poweredBy") || "Powered by"} QUALIA
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Capabilities sidebar - Enhanced UI */}
        <div className="lg:w-80 shrink-0">
          <div className="sticky top-20 bg-slate-800 rounded-xl shadow-lg border border-slate-700 p-5 overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500"></div>
            <h2 className="font-medium text-lg mb-4 text-white flex items-center">
              <Sparkles className="h-4 w-4 mr-2 text-primary" />
              {t("capabilities") || "Capabilities"}
            </h2>
            
            <div className="space-y-3">
              {capabilities.map((capability) => (
                <button
                  key={capability.id}
                  onClick={() => handleCapabilityClick(capability.id)}
                  className="w-full flex items-start p-3 rounded-lg bg-slate-700 hover:bg-slate-600 transition-all text-left group hover:scale-[1.02] active:scale-[0.98]"
                >
                  <div className="h-9 w-9 rounded-full bg-slate-800 flex items-center justify-center shadow-md border border-slate-600 mr-3">
                    {capability.icon}
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-white group-hover:text-primary transition-colors">
                      {capability.name}
                    </div>
                    <div className="text-xs text-slate-400 mt-1">
                      {capability.description}
                    </div>
                    {capability.examples && (
                      <div className="mt-2 space-y-1">
                        {capability.examples.map((example, index) => (
                          <div 
                            key={index}
                            onClick={(e) => {
                              e.stopPropagation();
                              setInputValue(example);
                              setTimeout(() => handleSendMessage(), 100);
                            }}
                            className="text-xs bg-slate-800 text-slate-300 px-2 py-1 rounded hover:bg-slate-600 hover:text-white cursor-pointer transition-colors inline-block mr-1 mb-1"
                          >
                            {example}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </button>
              ))}
            </div>
            
            {/* App badges - Enhanced UI */}
            <div className="mt-6 pt-4 border-t border-slate-700 flex flex-col gap-3">
              <h3 className="text-sm font-medium text-slate-300 mb-1">Available on</h3>
              <div className="flex items-center space-x-2 px-3 py-2.5 bg-slate-700 rounded-lg border border-slate-600 shadow-sm hover:bg-slate-600 transition-colors cursor-pointer">
                <Smartphone className="h-5 w-5 text-primary" />
                <span className="text-sm text-slate-300">
                  {t("mobileApp") || "Mobile App"}
                </span>
              </div>
              
              <div className="flex items-center space-x-2 px-3 py-2.5 bg-slate-700 rounded-lg border border-slate-600 shadow-sm hover:bg-slate-600 transition-colors cursor-pointer">
                <Monitor className="h-5 w-5 text-primary" />
                <span className="text-sm text-slate-300">
                  {t("desktopApp") || "Desktop App"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="text-center py-4 text-sm text-slate-500">
        Powered by QUALIA
      </div>
    </div>
  );
}
