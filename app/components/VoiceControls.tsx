"use client";

import { useState, useEffect } from "react";
import { Mic, MicOff, StopCircle } from "lucide-react";
import { useLanguage } from "@/app/lib/LanguageContext";

interface VoiceControlsProps {
  onTextInput: (text: string) => void;
  disabled?: boolean;
  className?: string;
}

export default function VoiceControls({ onTextInput, disabled = false, className = "" }: VoiceControlsProps) {
  const [isListening, setIsListening] = useState(false);
  const [recognition, setRecognition] = useState<SpeechRecognition | null>(null);
  const { t, language } = useLanguage();

  useEffect(() => {
    if (typeof window !== "undefined" && ("SpeechRecognition" in window || "webkitSpeechRecognition" in window)) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognitionInstance = new SpeechRecognition();
      recognitionInstance.continuous = true;
      recognitionInstance.interimResults = true;
      
      // Update language when the language context changes
      recognitionInstance.lang = language === "el" ? "el-GR" : "en-US";
      
      recognitionInstance.onresult = (event) => {
        const transcript = Array.from(event.results)
          .map(result => result[0])
          .map(result => result.transcript)
          .join("");
          
        if (event.results[0].isFinal) {
          onTextInput(transcript);
          stopListening();
        }
      };
      
      recognitionInstance.onerror = (event) => {
        console.error("Speech recognition error", event.error);
        stopListening();
      };
      
      setRecognition(recognitionInstance);
    }
    
    return () => {
      if (recognition) {
        recognition.stop();
      }
    };
  }, [language]);

  const toggleListening = () => {
    if (disabled) return;
    
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  const startListening = () => {
    if (recognition) {
      try {
        recognition.start();
        setIsListening(true);
      } catch (error) {
        console.error("Failed to start speech recognition:", error);
      }
    }
  };

  const stopListening = () => {
    if (recognition) {
      recognition.stop();
      setIsListening(false);
    }
  };

  if (!recognition) {
    return null;
  }

  return (
    <div className="relative">
      <button
        onClick={toggleListening}
        disabled={disabled}
        className={`p-2 rounded-full transition-all duration-200 ${
          isListening 
            ? 'text-red-400 bg-red-500/10 hover:bg-red-500/20 ring-2 ring-red-500/30' 
            : 'text-slate-400 hover:text-primary hover:bg-slate-600/30'
        } disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
        aria-label={isListening ? t("stopListening") : t("startListening")}
        title={isListening ? t("stopListening") : t("startListening")}
      >
        {isListening ? (
          <div className="relative">
            <StopCircle className="h-5 w-5" />
            <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
          </div>
        ) : (
          <Mic className="h-5 w-5" />
        )}
      </button>
      
      {isListening && (
        <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-red-500 to-red-600 text-white text-xs py-1.5 px-3 rounded-full shadow-md whitespace-nowrap flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></span>
          {language === "el" ? "Σας ακούω..." : "Listening..."}
        </div>
      )}
    </div>
  );
} 