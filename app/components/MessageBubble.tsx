"use client";

import React, { useState } from "react";
import { Copy, Check, ExternalLink } from "lucide-react";
import { Message } from "@/app/lib/types";
import { useLanguage } from "@/app/lib/LanguageContext";

// Helper function to identify and parse code blocks in markdown
const parseCodeBlocks = (content: string) => {
  // Match code blocks ```language code ```
  const codeBlockRegex = /```(\w+)?\s*([\s\S]*?)```/g;
  const parts = [];
  let lastIndex = 0;
  let match;

  while ((match = codeBlockRegex.exec(content)) !== null) {
    // Add text before code block
    if (match.index > lastIndex) {
      parts.push({
        type: "text",
        content: content.substring(lastIndex, match.index),
      });
    }

    // Add code block
    parts.push({
      type: "code",
      language: match[1] || "plaintext",
      content: match[2].trim(),
    });

    lastIndex = match.index + match[0].length;
  }

  // Add remaining text
  if (lastIndex < content.length) {
    parts.push({
      type: "text",
      content: content.substring(lastIndex),
    });
  }

  return parts;
};

type MessageBubbleProps = {
  message: Message;
};

export default function MessageBubble({ message }: MessageBubbleProps) {
  const { t } = useLanguage();
  const [copied, setCopied] = useState(false);
  
  // If message is streaming, show a loading indicator
  if (message.isStreaming) {
    return (
      <div className="flex justify-start">
        <div className="max-w-[85%] md:max-w-[75%] message-bubble assistant">
          <div className="text-sm text-gray-800 dark:text-gray-100">
            <p className="flex items-center">
              {message.content || "Thinking"}
              <span className="ml-2 inline-flex">
                <span className="animate-bounce mx-0.5 h-1 w-1 rounded-full bg-gray-500 dark:bg-gray-300"></span>
                <span className="animate-bounce delay-100 mx-0.5 h-1 w-1 rounded-full bg-gray-500 dark:bg-gray-300"></span>
                <span className="animate-bounce delay-200 mx-0.5 h-1 w-1 rounded-full bg-gray-500 dark:bg-gray-300"></span>
              </span>
            </p>
          </div>
        </div>
      </div>
    );
  }
  
  // If message has an error, show error styling
  if (message.isError) {
    return (
      <div className="flex justify-start">
        <div className="max-w-[85%] md:max-w-[75%] message-bubble assistant border-red-300 bg-red-50 dark:bg-red-900/20 dark:border-red-800">
          <div className="text-sm text-red-600 dark:text-red-300">
            <p>{message.content}</p>
          </div>
        </div>
      </div>
    );
  }
  
  const parts = parseCodeBlocks(message.content);
  
  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy text:", error);
    }
  };

  // Function to render links
  const renderTextWithLinks = (text: string) => {
    // Match URLs
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const parts = text.split(urlRegex);
    
    return parts.map((part, i) => {
      if (part.match(urlRegex)) {
        return (
          <a 
            key={i} 
            href={part} 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-primary hover:text-primary-hover underline inline-flex items-center"
          >
            {part.length > 50 ? `${part.substring(0, 50)}...` : part}
            <ExternalLink className="h-3 w-3 ml-1" />
          </a>
        );
      }
      return part;
    });
  };

  // Render paragraphs with proper line breaks
  const renderParagraphs = (text: string) => {
    return text.split("\n\n").map((paragraph, index) => (
      <p key={index} className="mb-3 last:mb-0">
        {paragraph.split("\n").map((line, i) => (
          <React.Fragment key={i}>
            {i > 0 && <br />}
            {renderTextWithLinks(line)}
          </React.Fragment>
        ))}
      </p>
    ));
  };

  return (
    <div 
      className={`flex ${
        message.role === "user" ? "justify-end" : "justify-start"
      }`}
    >
      <div 
        className={`max-w-[85%] md:max-w-[75%] message-bubble ${
          message.role === "user" ? "user" : "assistant"
        }`}
      >
        {parts.map((part, index) => {
          if (part.type === "code") {
            return (
              <div key={index} className="my-4 first:mt-1 last:mb-1 rounded-lg overflow-hidden bg-slate-900 dark:bg-slate-800">
                <div className="flex items-center justify-between px-4 py-2 bg-slate-800 dark:bg-slate-700">
                  <span className="text-xs font-medium text-slate-200">
                    {part.language}
                  </span>
                  <button
                    onClick={() => copyToClipboard(part.content)}
                    className="text-slate-300 hover:text-white transition"
                    aria-label={t("copyCode") || "Copy code"}
                  >
                    {copied ? (
                      <Check className="h-4 w-4 text-green-400" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </button>
                </div>
                <pre className="p-4 overflow-x-auto text-sm text-slate-200 font-mono">
                  <code>{part.content}</code>
                </pre>
              </div>
            );
          } else {
            return (
              <div key={index} className={`${message.role === "user" ? "text-white" : "text-gray-800 dark:text-gray-100"} text-sm`}>
                {renderParagraphs(part.content)}
              </div>
            );
          }
        })}
        
        {/* Source citations if available */}
        {message.sources && message.sources.length > 0 && (
          <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
            <p className="text-xs font-medium text-slate-600 dark:text-slate-300">
              {t("sources") || "Sources"}:
            </p>
            <ul className="mt-1 text-xs text-slate-600 dark:text-slate-300">
              {message.sources.map((source, index) => (
                <li key={index} className="mb-1 last:mb-0">
                  <a 
                    href={source.url || "#"} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-primary hover:underline inline-flex items-center"
                  >
                    {source.title || source.url || `Source ${index + 1}`}
                    <ExternalLink className="h-3 w-3 ml-1" />
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
} 