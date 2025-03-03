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
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Features from './components/Features';

export default function Home() {
  const { t, language } = useLanguage();
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const { data: session, status } = useSession();
  const router = useRouter();
  
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

  useEffect(() => {
    // Redirect to login page if user is not authenticated
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    }
  }, [status, router]);

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

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => {
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

  // If loading, show a simple loading state
  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-primary text-xl">Loading...</div>
      </div>
    );
  }

  // If authenticated, show the features page
  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50 dark:from-gray-900 dark:to-gray-800">
      <Features />
    </div>
  );
}
