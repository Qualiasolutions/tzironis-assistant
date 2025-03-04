"use client";

import { useState, useEffect, useRef } from "react";
import { useLanguage } from "@/app/lib/LanguageContext";
import MessageBubble from "./MessageBubble";
import { Message } from "@/app/lib/types";
import VoiceControls from "./VoiceControls";
import { Send, Bot, Sparkles, Globe } from "lucide-react";
import { speakTextInChunks, isSpeechSynthesisSupported } from "@/app/lib/speech";

export default function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  // Store the thread ID for conversation persistence
  const [threadId, setThreadId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const { t, language, changeLanguage } = useLanguage();
  
  // Voice response state
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [currentSpeechCanceller, setCurrentSpeechCanceller] = useState<(() => void) | null>(null);

  useEffect(() => {
    // Set welcome message
    setMessages([{
      role: "assistant",
      content: t("chatWelcomeMessage") || "Hello! I'm your Tzironis business assistant. How can I help you today?",
    }]);
    
    // Try to restore thread ID from localStorage
    const savedThreadId = localStorage.getItem('assistantThreadId');
    if (savedThreadId) {
      setThreadId(savedThreadId);
    }
    
    // Try to restore voice preference from localStorage
    const savedVoicePreference = localStorage.getItem('voiceEnabled');
    if (savedVoicePreference === 'true') {
      setVoiceEnabled(true);
    }
  }, [language, t]);

  // Stop speaking when language changes
  useEffect(() => {
    stopSpeaking();
  }, [language]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Save threadId to localStorage whenever it changes
  useEffect(() => {
    if (threadId) {
      localStorage.setItem('assistantThreadId', threadId);
    }
  }, [threadId]);
  
  // Save voice preference to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('voiceEnabled', voiceEnabled.toString());
  }, [voiceEnabled]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };
  
  // Function to toggle text-to-speech
  const toggleSpeech = () => {
    if (isSpeaking) {
      stopSpeaking();
    }
    setVoiceEnabled(!voiceEnabled);
  };
  
  // Function to stop any ongoing speech
  const stopSpeaking = () => {
    if (currentSpeechCanceller) {
      currentSpeechCanceller();
      setCurrentSpeechCanceller(null);
    }
    setIsSpeaking(false);
  };
  
  // Function to speak the last assistant message
  const speakLastMessage = async () => {
    if (!voiceEnabled || !isSpeechSynthesisSupported()) return;
    
    // Find the last assistant message
    const lastAssistantMsg = [...messages].reverse().find(m => m.role === "assistant" && !m.isStreaming);
    if (!lastAssistantMsg) return;
    
    // Stop any ongoing speech
    stopSpeaking();
    
    // Start speaking
    setIsSpeaking(true);
    
    const canceller = await speakTextInChunks(
      lastAssistantMsg.content,
      language,
      {
        rate: 1.0,
        onComplete: () => {
          setIsSpeaking(false);
          setCurrentSpeechCanceller(null);
        }
      }
    );
    
    setCurrentSpeechCanceller(() => canceller);
  };
  
  // Speak the assistant's message when a new one is added
  useEffect(() => {
    const assistantMessages = messages.filter(m => m.role === "assistant" && !m.isStreaming);
    if (assistantMessages.length > 0 && voiceEnabled) {
      const lastMsg = assistantMessages[assistantMessages.length - 1];
      
      // Don't speak if this is just the welcome message on initial load
      if (messages.length > 1) {
        speakLastMessage();
      }
    }
  }, [messages, voiceEnabled]);

  const handleSendMessage = async () => {
    if (inputValue.trim() === "" || isLoading) return;

    const userMessage: Message = {
      role: "user",
      content: inputValue,
    };

    setMessages((prevMessages) => [...prevMessages, userMessage]);
    setInputValue("");
    
    // Stop any ongoing speech when user sends a message
    stopSpeaking();
    
    // Handle language switching client-side
    if (handleLanguageChange(inputValue)) {
      return;
    }

    setIsLoading(true);

    try {
      // Add a placeholder message for the assistant's response
      const placeholderId = `placeholder-${Date.now()}`;
      setMessages((prevMessages) => [
        ...prevMessages,
        { role: "assistant", content: "", id: placeholderId, isStreaming: true },
      ]);

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: [...messages, userMessage],
          language,
          threadId, // Send the current threadId if available
        }),
      });

      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }

      if (!response.body) {
        throw new Error("Response body is null");
      }

      // Process the streaming response
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let assistantMessage = "";
      let receivedThreadId = threadId;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        const chunk = decoder.decode(value);
        const lines = chunk.split('\n').filter(line => line.trim());
        
        for (const line of lines) {
          try {
            const data = JSON.parse(line);
            
            // Handle different event types
            switch (data.type) {
              case 'threadId':
                receivedThreadId = data.threadId;
                setThreadId(data.threadId);
                break;
                
              case 'message':
                // Final message
                assistantMessage = data.content;
                setMessages((prevMessages) => 
                  prevMessages.map(msg => 
                    msg.id === placeholderId 
                      ? { ...msg, content: data.content, isStreaming: false, sources: data.sources } 
                      : msg
                  )
                );
                break;
                
              case 'status':
                // Update the placeholder with status info if needed
                if (data.status === 'thinking') {
                  setMessages((prevMessages) => 
                    prevMessages.map(msg => 
                      msg.id === placeholderId 
                        ? { ...msg, content: "Thinking...", isStreaming: true } 
                        : msg
                    )
                  );
                }
                break;
                
              case 'error':
                // Handle error
                setMessages((prevMessages) => 
                  prevMessages.map(msg => 
                    msg.id === placeholderId 
                      ? { ...msg, content: data.message, isStreaming: false, isError: true } 
                      : msg
                  )
                );
                break;
            }
          } catch (e) {
            console.error("Error parsing stream chunk:", e);
          }
        }
      }
      
      // Update the threadId if received
      if (receivedThreadId && receivedThreadId !== threadId) {
        setThreadId(receivedThreadId);
      }
    } catch (error) {
      console.error("Error sending message:", error);
      
      setMessages((prevMessages) => [
        ...prevMessages.filter(msg => !msg.isStreaming),
        {
          role: "assistant",
          content: "I'm sorry, I encountered an error processing your request. Please try again later.",
        },
      ]);
    } finally {
      setIsLoading(false);
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  };

  // Handle language switching directly in the component
  const handleLanguageChange = (input: string): boolean => {
    // Check if the user is asking about Greek language
    if (input.toLowerCase().trim() === "greek?" || 
        input.toLowerCase().includes("switch to greek") || 
        input.toLowerCase().includes("ελληνικά") || 
        input.toLowerCase().includes("greek language")) {
      
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
      return true;
    }
    
    // Check if the user is asking about English language
    if (input.toLowerCase().trim() === "english?" || 
        input.toLowerCase().includes("switch to english") || 
        input.toLowerCase().includes("αγγλικά") ||
        input.toLowerCase().includes("english language")) {
      
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
      return true;
    }
    
    // Check for "new conversation" command
    if (input.toLowerCase().includes("new conversation") || 
        input.toLowerCase().includes("start over") || 
        input.toLowerCase().includes("reset chat") ||
        input.toLowerCase().includes("νέα συζήτηση") || 
        input.toLowerCase().includes("ξεκίνα από την αρχή")) {
      
      // Clear thread ID and messages
      setThreadId(null);
      localStorage.removeItem('assistantThreadId');
      
      setMessages([{
        role: "assistant",
        content: t("newConversationMessage"),
      }]);
      
      return true;
    }
    
    return false;
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

  const handlePredefinedMessage = (message: string) => {
    setInputValue(message);
  };

  const startNewConversation = () => {
    // Clear thread ID and messages
    setThreadId(null);
    localStorage.removeItem('assistantThreadId');
    
    setMessages([{
      role: "assistant",
      content: t("newConversationMessage"),
    }]);
  };

  return (
    <div className="flex flex-col h-full max-h-full w-full bg-white dark:bg-gray-900 relative">
      {/* Chat header */}
      <div className="border-b border-gray-200 dark:border-gray-800 py-3 px-4 bg-white dark:bg-gray-900">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Bot className="h-5 w-5 text-primary mr-2" />
            <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100">Tzironis Assistant</h2>
          </div>
          
          {/* Add New Conversation button */}
          <button 
            onClick={startNewConversation} 
            className="text-sm text-gray-600 hover:text-primary dark:text-gray-400 dark:hover:text-primary flex items-center"
          >
            <Sparkles className="h-4 w-4 mr-1" />
            {t("newConversation")}
          </button>
        </div>
      </div>
      
      {/* Chat messages container */}
      <div className="flex-1 overflow-y-auto px-4 py-6">
        <div className="space-y-6">
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
          {messages.length === 1 && (
            <div className="bg-muted/40 rounded-lg p-4 mt-4">
              <h3 className="font-medium text-lg mb-2 text-foreground">{t("chatWelcome") || "Welcome to Tzironis Assistant"}</h3>
              <p className="text-muted-foreground mb-3">{t("features") || "You can ask me about:"}</p>
              
              <div className="space-y-2">
                <button
                  className="w-full bg-background text-foreground hover:bg-muted/60 p-2 rounded-md text-left text-sm transition-colors"
                  onClick={() => handlePredefinedMessage(t("invoiceAutomationQuery") || "Create an invoice for ABC Company with VAT EL123456789 for consulting services")}
                >
                  {t("invoiceAutomationQuery") || "Create an invoice for ABC Company with VAT EL123456789 for consulting services"}
                </button>
                <button
                  className="w-full bg-background text-foreground hover:bg-muted/60 p-2 rounded-md text-left text-sm transition-colors"
                  onClick={() => handlePredefinedMessage(t("leadGenerationQuery") || "Generate 5 leads from the technology industry")}
                >
                  {t("leadGenerationQuery") || "Generate 5 leads from the technology industry"}
                </button>
                <button
                  className="w-full bg-background text-foreground hover:bg-muted/60 p-2 rounded-md text-left text-sm transition-colors"
                  onClick={() => handlePredefinedMessage(t("productQuery") || "What school supplies do you offer?")}
                >
                  {t("productQuery") || "What school supplies do you offer?"}
                </button>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} className="h-4" />
        </div>
      </div>

      {/* Input area - fixed at bottom */}
      <div className="border-t border-gray-200 dark:border-gray-800 p-4 bg-white dark:bg-gray-900">
        <div className="relative flex items-center">
          <textarea
            ref={inputRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={t("chatInputPlaceholder") || "Ask something about Tzironis products, services or invoice automation..."}
            className="w-full py-3 pl-4 pr-24 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full resize-none text-sm text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            rows={1}
            disabled={isLoading}
          />
          
          <div className="absolute right-12 top-1 transform -translate-y-1">
            <VoiceControls 
              onTextInput={handleTextInput} 
              disabled={isLoading} 
              className="text-gray-500 dark:text-gray-400 hover:text-primary dark:hover:text-primary transition-colors"
              isSpeaking={isSpeaking}
              onToggleSpeech={toggleSpeech}
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
        
        {/* Voice/Speech status indicator */}
        {voiceEnabled && (
          <div className="mt-2 text-xs text-center text-gray-500 dark:text-gray-400 flex items-center justify-center">
            <Bot className="h-3 w-3 mr-1" />
            {isSpeaking ? t("voiceSpeaking") : t("voiceEnabled")}
          </div>
        )}
      </div>
    </div>
  );
} 