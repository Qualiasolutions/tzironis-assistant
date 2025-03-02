"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Brain, ArrowLeft, ExternalLink } from "lucide-react";
import Link from "next/link";
import axios from "axios";
import { useLanguage } from "../lib/LanguageContext";
import { MicrophoneButton, SpeakButton } from "./VoiceControls";

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
};

export default function ChatInterface() {
  const { t, language } = useLanguage();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content: "",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Update welcome message when language changes
  useEffect(() => {
    setMessages([
      {
        id: "welcome",
        role: "assistant",
        content: t("chatWelcome"),
        timestamp: new Date(),
      },
    ]);
  }, [language, t]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Function to check if the user is asking about Tzironis website
  const shouldRedirectToTzironis = (input: string): boolean => {
    const lowerInput = input.toLowerCase();
    return (
      (lowerInput.includes("tzironis") || lowerInput.includes("tzironis.gr")) &&
      (lowerInput.includes("website") || 
       lowerInput.includes("visit") || 
       lowerInput.includes("go to") || 
       lowerInput.includes("open") ||
       lowerInput.includes("show me") ||
       lowerInput.includes("take me"))
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    // Check if we should redirect to tzironis.gr
    const redirectToTzironis = shouldRedirectToTzironis(input);

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
      timestamp: new Date(),
    };
    
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      if (redirectToTzironis) {
        // Add a response message about redirection
        const redirectMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: t("redirectToTzironis"),
          timestamp: new Date(),
        };
        
        setMessages((prev) => [...prev, redirectMessage]);
        
        // Delay redirection slightly so user can see the message
        setTimeout(() => {
          window.open("https://tzironis.gr", "_blank");
        }, 1000);
      } else {
        // Format messages for API (excluding timestamps and IDs)
        const apiMessages = messages.concat(userMessage).map(({ role, content }) => ({
          role,
          content,
        }));

        // Call the API
        const response = await axios.post("/api/chat", {
          messages: apiMessages,
          language, // Pass current language to the API
        });

        // Add assistant response
        const assistantMessage = {
          ...response.data,
          timestamp: new Date(response.data.timestamp),
        };

        setMessages((prev) => [...prev, assistantMessage]);
      }
    } catch (error) {
      console.error("Error sending message:", error);
      
      // Add error message
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: t("chatError"),
        timestamp: new Date(),
      };
      
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle voice transcript
  const handleVoiceTranscript = (transcript: string) => {
    setInput(transcript);
    if (transcript.trim()) {
      // Auto-submit after voice input
      setTimeout(() => {
        const formEvent = { preventDefault: () => {} } as React.FormEvent;
        handleSubmit(formEvent);
      }, 500);
    }
  };

  return (
    <div className="flex h-screen flex-col bg-white">
      <header className="sticky top-0 z-50 flex h-16 items-center justify-between border-b bg-white px-4 shadow-sm">
        <div className="flex items-center gap-2">
          <Link href="/" className="mr-2 rounded-full p-1 hover:bg-primary/10 transition-colors">
            <ArrowLeft className="h-5 w-5 text-primary" />
          </Link>
          <Brain className="h-7 w-7 text-primary" />
          <h1 className="text-xl font-bold text-primary">Qualia</h1>
        </div>
        <a 
          href="https://tzironis.gr" 
          target="_blank" 
          rel="noopener noreferrer"
          className="flex items-center text-sm text-primary hover:underline"
        >
          <span>tzironis.gr</span>
          <ExternalLink className="ml-1 h-3 w-3" />
        </a>
      </header>

      <div className="flex-1 overflow-y-auto p-4 bg-white">
        <div className="mx-auto max-w-3xl">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`mb-4 flex ${
                message.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`message-bubble px-4 py-2 max-w-[80%] ${
                  message.role === "user"
                    ? "user-message bg-primary text-white"
                    : "assistant-message bg-white border border-primary/20 text-gray-900 shadow-sm"
                }`}
              >
                <div className="whitespace-pre-wrap">{message.content}</div>
                <div
                  className={`flex justify-between items-center mt-1 ${
                    message.role === "user"
                      ? "text-white/80"
                      : "text-gray-500"
                  }`}
                >
                  <span className="text-xs">
                    {message.timestamp.toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                  
                  {message.role === "assistant" && (
                    <SpeakButton 
                      text={message.content} 
                      disabled={isLoading}
                    />
                  )}
                </div>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="mb-4 flex justify-start">
              <div className="message-bubble assistant-message border border-primary/20 bg-white px-4 py-3 shadow-sm">
                <div className="flex items-center space-x-2">
                  <div className="h-2 w-2 animate-bounce rounded-full bg-primary"></div>
                  <div
                    className="h-2 w-2 animate-bounce rounded-full bg-primary"
                    style={{ animationDelay: "0.2s" }}
                  ></div>
                  <div
                    className="h-2 w-2 animate-bounce rounded-full bg-primary"
                    style={{ animationDelay: "0.4s" }}
                  ></div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      <div className="border-t bg-white p-4 shadow-sm">
        <form
          onSubmit={handleSubmit}
          className="mx-auto flex max-w-3xl items-center gap-2"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={t("chatPlaceholder")}
            className="flex-1 rounded-full border border-gray-300 bg-white px-4 py-2.5 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus:border-primary transition-colors"
            disabled={isLoading}
          />
          
          <MicrophoneButton 
            onTranscript={handleVoiceTranscript}
            disabled={isLoading}
          />
          
          <button
            type="submit"
            className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-primary text-white hover:bg-accent disabled:opacity-50 transition-colors"
            disabled={isLoading || !input.trim()}
          >
            <Send className="h-5 w-5" />
          </button>
        </form>
      </div>
    </div>
  );
} 