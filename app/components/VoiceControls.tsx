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
  const { language } = useLanguage();

  useEffect(() => {
    if (typeof window !== "undefined" && "SpeechRecognition" in window || "webkitSpeechRecognition" in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognitionInstance = new SpeechRecognition();
      recognitionInstance.continuous = true;
      recognitionInstance.interimResults = true;
      recognitionInstance.lang = language === "en" ? "en-US" : "el-GR";
      
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
    <button
      onClick={toggleListening}
      disabled={disabled}
      className={`p-2 ${isListening ? 'text-red-500' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'} disabled:opacity-50 disabled:cursor-not-allowed transition-colors ${className}`}
      aria-label={isListening ? "Stop listening" : "Start voice input"}
    >
      {isListening ? <StopCircle className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
    </button>
  );
} 
} 