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
      className={`flex ${isUser ? "justify-end" : "justify-start"} animate-fadein w-full`}
    >
      <div
        className={`flex items-start gap-3 ${
          isUser ? "flex-row-reverse" : "flex-row"
        } max-w-[85%] sm:max-w-[75%]`}
      >
        {showAvatar && (
          <div className="flex-shrink-0 mt-1">
            {isUser ? (
              <div className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center shadow-md">
                <User className="h-5 w-5 text-white" />
              </div>
            ) : (
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center shadow-md">
                <Bot className="h-5 w-5 text-white" />
              </div>
            )}
          </div>
        )}

        <div
          className={`
            ${isUser
              ? "bg-blue-600 text-white rounded-2xl rounded-tr-sm shadow-md"
              : "bg-slate-700 text-slate-100 rounded-2xl rounded-tl-sm shadow-md border border-slate-600"
            } 
            px-5 py-3.5 w-full break-words
          `}
        >
          <div className="prose prose-sm dark:prose-invert max-w-none overflow-auto">
            <div className="whitespace-pre-wrap break-words text-sm">
              <ReactMarkdown>
                {message.content}
              </ReactMarkdown>
            </div>
            
            {message.sources && message.sources.length > 0 && (
              <div className="mt-3 pt-3 border-t border-slate-600">
                <div className="text-xs font-medium text-slate-300 mb-2">Sources:</div>
                <div className="space-y-1.5">
                  {message.sources.map((source, idx) => (
                    <div key={idx} className="flex items-start">
                      <div className="text-xs text-slate-400 hover:text-slate-200">
                        {source.url ? (
                          <a 
                            href={source.url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="underline hover:text-primary"
                          >
                            {source.title || source.url}
                          </a>
                        ) : (
                          <span>{source.filename || 'Unknown source'}</span>
                        )}
                        {source.score !== undefined && (
                          <span className="ml-1 text-slate-500">
                            ({Math.round(source.score * 100)}% match)
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          
          <div className={`flex ${isUser ? "justify-start" : "justify-end"} items-center gap-2 mt-2 opacity-70 hover:opacity-100 transition-opacity`}>
            {!isUser && (
              <button
                onClick={handleSpeak}
                className={`p-1.5 rounded-full hover:bg-slate-600 text-slate-300 transition-colors ${isSpeaking ? 'bg-slate-600' : ''}`}
                aria-label={isSpeaking ? "Stop speaking" : "Speak message"}
                title={isSpeaking ? "Stop speaking" : "Speak message"}
              >
                <Volume2 className="h-3.5 w-3.5" />
              </button>
            )}
            
            <button
              onClick={copyToClipboard}
              className="p-1.5 rounded-full hover:bg-slate-600 text-slate-300 transition-colors"
              aria-label="Copy message"
              title="Copy to clipboard"
            >
              {copied ? (
                <Check className="h-3.5 w-3.5 text-green-400" />
              ) : (
                <Copy className="h-3.5 w-3.5" />
              )}
            </button>
            
            <span className="text-xs text-slate-400 ml-1">
              {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
} 