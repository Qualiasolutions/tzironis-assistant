"use client";

import { useState, useEffect } from "react";
import { Mic, MicOff, StopCircle, Volume2, VolumeX } from "lucide-react";
import { useLanguage } from "@/app/lib/LanguageContext";
import { isSpeechRecognitionSupported, isSpeechSynthesisSupported } from "@/app/lib/speech";

interface VoiceControlsProps {
  onTextInput: (text: string) => void;
  disabled?: boolean;
  className?: string;
  isSpeaking?: boolean;
  onToggleSpeech?: () => void;
}

export default function VoiceControls({ 
  onTextInput, 
  disabled = false, 
  className = "",
  isSpeaking = false,
  onToggleSpeech
}: VoiceControlsProps) {
  const [isListening, setIsListening] = useState(false);
  const [recognition, setRecognition] = useState<SpeechRecognition | null>(null);
  const { t, language } = useLanguage();
  const [speechSupported, setSpeechSupported] = useState(false);
  const [speechSynthesisSupported, setSpeechSynthesisSupported] = useState(false);

  useEffect(() => {
    setSpeechSupported(isSpeechRecognitionSupported());
    setSpeechSynthesisSupported(isSpeechSynthesisSupported());
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined" && isSpeechRecognitionSupported()) {
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

  if (!speechSupported && !speechSynthesisSupported) {
    return null;
  }

  return (
    <div className="flex space-x-2">
      {/* Speech synthesis toggle button */}
      {speechSynthesisSupported && onToggleSpeech && (
        <button
          onClick={onToggleSpeech}
          disabled={disabled}
          className={`p-2 rounded-full transition-all duration-200 ${
            isSpeaking 
              ? 'text-blue-400 bg-blue-500/10 hover:bg-blue-500/20 ring-2 ring-blue-500/30' 
              : 'text-slate-400 hover:text-primary hover:bg-slate-600/30'
          } disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
          aria-label={isSpeaking ? t("disableVoice") : t("enableVoice")}
          title={isSpeaking ? t("disableVoice") : t("enableVoice")}
        >
          {isSpeaking ? (
            <div className="relative">
              <Volume2 className="h-5 w-5" />
              <span className="absolute -top-1 -right-1 w-2 h-2 bg-blue-500 rounded-full animate-pulse"></span>
            </div>
          ) : (
            <VolumeX className="h-5 w-5" />
          )}
        </button>
      )}

      {/* Speech recognition button */}
      {speechSupported && (
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
              {t("listening")}
            </div>
          )}
        </div>
      )}
    </div>
  );
} 