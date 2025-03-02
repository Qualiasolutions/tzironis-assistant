"use client";

import { useState } from "react";
import { Message } from "@/app/lib/types";
import { Bot, User, Volume2, Copy, Check } from "lucide-react";
import { speakText } from "@/app/lib/speech";
import { useLanguage } from "@/app/lib/LanguageContext";
import ReactMarkdown from "react-markdown";

interface MessageBubbleProps {
  message: Message;
  showAvatar?: boolean;
}

export default function MessageBubble({ message, showAvatar = false }: MessageBubbleProps) {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [copied, setCopied] = useState(false);
  const { language } = useLanguage();

  const handleSpeak = () => {
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    setIsSpeaking(true);
    const speech = speakText(message.content, language);
    speech.onEnd(() => {
      setIsSpeaking(false);
    });
    speech.start();
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isUser = message.role === "user";

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`message-bubble flex ${
          isUser
            ? "flex-row-reverse"
            : "flex-row"
        } max-w-[90%] lg:max-w-[75%]`}
      >
        {showAvatar && (
          <div className={`flex-shrink-0 ${isUser ? "ml-3" : "mr-3"}`}>
            <div className={`w-8 h-8 rounded-full ${isUser ? "bg-accent/20" : "bg-primary/20"} flex items-center justify-center`}>
              {isUser ? (
                <User className="h-5 w-5 text-accent" />
              ) : (
                <Bot className="h-5 w-5 text-primary" />
              )}
            </div>
          </div>
        )}

        <div
          className={`relative overflow-hidden ${
            isUser
              ? "user-message bg-accent text-white rounded-2xl rounded-tr-sm shadow-md"
              : "assistant-message bg-white/80 dark:bg-gray-800/70 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50 rounded-2xl rounded-tl-sm shadow-sm dark:text-white"
          } px-4 py-3 hover-card-effect`}
        >
          <div className="prose prose-sm dark:prose-invert max-w-none">
            <ReactMarkdown>
              {message.content}
            </ReactMarkdown>
          </div>
          
          <div className="flex justify-end items-center gap-1.5 mt-2 opacity-70 hover:opacity-100 transition-opacity">
            {!isUser && (
              <button
                onClick={handleSpeak}
                className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 transition-colors"
                aria-label={isSpeaking ? "Stop speaking" : "Speak message"}
              >
                <Volume2 className="h-3.5 w-3.5" />
              </button>
            )}
            
            <button
              onClick={copyToClipboard}
              className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 transition-colors"
              aria-label="Copy message"
            >
              {copied ? (
                <Check className="h-3.5 w-3.5 text-green-500" />
              ) : (
                <Copy className="h-3.5 w-3.5" />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 