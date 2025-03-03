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
  const [showChat, setShowChat] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  
  // Animation effect for typing indicator
  useEffect(() => {
    if (inputValue.length > 0) {
      setIsTyping(true);
    } else {
      setIsTyping(false);
    }
  }, [inputValue]);

  // Set welcome message when chat is shown
  useEffect(() => {
    if (showChat) {
      setMessages([{
        role: "assistant",
        content: t("chatWelcomeMessage"),
      }]);
    }
  }, [showChat, language, t]);

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setInputValue(e.target.value);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim() !== "") {
      setShowChat(true);
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
      if (!showChat) {
        setShowChat(true);
      }
      handleSendMessage();
    }
  };

  const handleTextInput = (text: string) => {
    setInputValue(text);
  };

  const handleCapabilityClick = (capability: string) => {
    setShowChat(true);
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
      description: t("webSearchDesc") || "Search the web for information"
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
    <div className="min-h-screen bg-gradient-to-b from-white to-slate-50 dark:from-slate-900 dark:to-slate-950">
      <NavBar />
      <div className="container mx-auto px-4 pt-20 pb-10 flex flex-col lg:flex-row gap-8 min-h-[calc(100vh-4rem)]">
        {/* Main content area */}
        <div className="flex-1 flex flex-col">
          {!showChat ? (
            <>
              <div className="mb-10 max-w-3xl animate-fade-in">
                <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white mb-4">
                  {t("welcomeTitle") || "Welcome to Tzironis AI Assistant"}
                </h1>
                
                <div className="prose dark:prose-invert">
                  <p className="text-lg text-slate-700 dark:text-slate-300">
                    {t("welcomeSubtitle") || "I can help you with:"}
                  </p>
                  
                  <ul className="mt-4 space-y-2 text-slate-700 dark:text-slate-300">
                    <li className="flex items-start">
                      <ChevronRight className="w-4 h-4 mt-1 mr-2 text-primary" />
                      {t("feature1") || "Answering questions about Tzironis services in English or Greek"}
                    </li>
                    <li className="flex items-start">
                      <ChevronRight className="w-4 h-4 mt-1 mr-2 text-primary" />
                      {t("feature2") || "Searching the internet for information"}
                    </li>
                    <li className="flex items-start">
                      <ChevronRight className="w-4 h-4 mt-1 mr-2 text-primary" />
                      {t("feature3") || "Accessing data from Tzironis.gr"}
                    </li>
                    <li className="flex items-start">
                      <ChevronRight className="w-4 h-4 mt-1 mr-2 text-primary" />
                      {t("feature4") || "Creating invoices on union.gr"}
                    </li>
                    <li className="flex items-start">
                      <ChevronRight className="w-4 h-4 mt-1 mr-2 text-primary" />
                      {t("feature5") || "Processing voice commands"}
                    </li>
                  </ul>
                </div>
                
                <div className="mt-6">
                  <h2 className="text-lg font-medium text-slate-900 dark:text-white">
                    {t("helpQuestion") || "How can I help you today?"}
                  </h2>
                </div>
              </div>
              
              {/* Search input */}
              <form onSubmit={handleSubmit} className="mt-auto mb-10">
                <div className="relative max-w-3xl">
                  <input
                    type="text"
                    value={inputValue}
                    onChange={handleInputChange}
                    placeholder={t("typeMessage") || "Type your message or use voice input..."}
                    className="w-full py-4 pl-5 pr-12 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500"
                  />
                  <button
                    type="submit"
                    disabled={inputValue.trim() === ""}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 p-2 rounded-full text-white bg-primary hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors focus:outline-none"
                    aria-label={t("sendMessage") || "Send message"}
                  >
                    <Send className="h-5 w-5" />
                  </button>
                  {isTyping && (
                    <span className="absolute bottom-full left-4 mb-2 text-xs text-slate-600 dark:text-slate-400">
                      {t("pressEnterToSubmit") || "Press Enter to submit"}
                    </span>
                  )}
                </div>
              </form>
            </>
          ) : (
            <div className="flex flex-col h-full max-h-[calc(100vh-8rem)] w-full bg-white dark:bg-slate-900 relative rounded-xl shadow-md border border-slate-200 dark:border-slate-700">
              {/* Chat messages container */}
              <div className="flex-1 overflow-y-auto pb-32">
                <div className="px-4 py-4 space-y-6">
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
                  <div ref={messagesEndRef} className="h-4" />
                </div>
              </div>

              {/* Input area - fixed at bottom */}
              <div className="border-t border-slate-200 dark:border-slate-800 p-4 bg-white dark:bg-slate-900 absolute bottom-0 left-0 right-0 rounded-b-xl">
                <div className="relative flex items-center">
                  <VoiceControls 
                    onTextInput={handleTextInput} 
                    disabled={isLoading} 
                    className="absolute left-3 text-slate-500"
                  />
                  
                  <textarea
                    ref={inputRef}
                    value={inputValue}
                    onChange={handleInputChange}
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
          )}
          
          {/* App badges */}
          {!showChat && (
            <div className="mt-auto mb-4 flex flex-wrap gap-3">
              <div className="flex items-center space-x-2 px-3 py-2 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm">
                <Smartphone className="h-4 w-4 text-primary" />
                <span className="text-sm text-slate-700 dark:text-slate-300">
                  {t("mobileApp") || "Mobile App"}
                </span>
              </div>
              
              <div className="flex items-center space-x-2 px-3 py-2 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm">
                <Monitor className="h-4 w-4 text-primary" />
                <span className="text-sm text-slate-700 dark:text-slate-300">
                  {t("desktopApp") || "Desktop App"}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Capabilities sidebar */}
        <div className="lg:w-80 shrink-0">
          <div className="sticky top-20 bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
            <h2 className="font-medium text-lg mb-4 text-slate-900 dark:text-white">
              {t("capabilities") || "Capabilities"}
            </h2>
            
            <div className="space-y-4">
              {capabilities.map((capability) => (
                <button
                  key={capability.id}
                  onClick={() => handleCapabilityClick(capability.id)}
                  className="w-full flex items-start p-3 rounded-xl bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-left group"
                >
                  <div className="h-8 w-8 rounded-full bg-white dark:bg-slate-800 flex items-center justify-center shadow-sm border border-slate-200 dark:border-slate-700 mr-3">
                    {capability.icon}
                  </div>
                  <div>
                    <div className="font-medium text-slate-900 dark:text-white group-hover:text-primary transition-colors">
                      {capability.name}
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      {capability.description}
                    </div>
                  </div>
                </button>
              ))}
            </div>
            
            {showChat && (
              <div className="mt-8 pt-4 border-t border-slate-200 dark:border-slate-700">
                <button 
                  onClick={() => setShowChat(false)}
                  className="text-sm text-primary hover:text-primary/80 transition-colors flex items-center"
                >
                  {t("backToHome") || "Back to home"}
                  <ChevronRight className="ml-1 h-4 w-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
      <div className="text-center py-4 text-sm text-slate-500 dark:text-slate-400">
        Powered by QUALIA
      </div>
    </div>
  );
}
