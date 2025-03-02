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

export default function MessageBubble({ message, showAvatar = true }: MessageBubbleProps) {
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
    <div 
      className={`flex ${isUser ? "justify-end" : "justify-start"} animate-fadein`}
    >
      <div
        className={`flex items-start gap-3 ${
          isUser ? "flex-row-reverse" : "flex-row"
        } max-w-[85%]`}
      >
        {showAvatar && (
          <div className="flex-shrink-0 mt-1">
            <div className={`w-8 h-8 rounded-full ${isUser ? "bg-accent/10" : "bg-primary/10"} flex items-center justify-center`}>
              {isUser ? (
                <User className="h-4 w-4 text-accent" />
              ) : (
                <Bot className="h-4 w-4 text-primary" />
              )}
            </div>
          </div>
        )}

        <div
          className={`
            ${isUser
              ? "bg-accent text-white rounded-2xl rounded-tr-sm"
              : "bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-2xl rounded-tl-sm border border-slate-200 dark:border-slate-700"
            } 
            px-4 py-3 shadow-sm
          `}
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
                className="p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 transition-colors"
                aria-label={isSpeaking ? "Stop speaking" : "Speak message"}
              >
                <Volume2 className="h-3.5 w-3.5" />
              </button>
            )}
            
            <button
              onClick={copyToClipboard}
              className="p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 transition-colors"
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