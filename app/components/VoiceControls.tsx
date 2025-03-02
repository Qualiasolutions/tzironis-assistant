"use client";

import { useState, useEffect } from "react";
import { Mic, MicOff } from "lucide-react";
import { useLanguage } from "@/app/lib/LanguageContext";
import { initSpeechRecognition } from "@/app/lib/speech";

interface VoiceControlsProps {
  onTextInput: (text: string) => void;
}

export default function VoiceControls({ onTextInput }: VoiceControlsProps) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [recognitionInstance, setRecognitionInstance] = useState<{ start: () => void; stop: () => void } | null>(null);
  const { t, language } = useLanguage();

  useEffect(() => {
    // Initialize speech recognition
    try {
      const instance = initSpeechRecognition(
        language,
        (result) => {
          if (result.isFinal) {
            setTranscript(result.transcript);
            onTextInput(result.transcript);
          }
        },
        () => {
          setIsListening(false);
        }
      );
      
      setRecognitionInstance(instance);
    } catch (error) {
      console.error("Speech recognition not supported", error);
    }

    return () => {
      if (recognitionInstance) {
        recognitionInstance.stop();
      }
    };
  }, [language, onTextInput]);

  const toggleListening = () => {
    if (isListening) {
      recognitionInstance?.stop();
      setIsListening(false);
    } else if (recognitionInstance) {
      try {
        recognitionInstance.start();
        setIsListening(true);
        setTranscript("");
      } catch (error) {
        console.error("Failed to start speech recognition", error);
      }
    }
  };

  return (
    <div className="flex gap-2">
      <button
        onClick={toggleListening}
        className={`flex items-center justify-center w-12 h-12 rounded-full transition-all ${
          isListening
            ? "bg-red-500 text-white hover:bg-red-600 animate-pulse"
            : "bg-primary/10 text-primary hover:bg-primary/20"
        } hover-card-effect`}
        aria-label={isListening ? t("stopListening") : t("startListening")}
        title={isListening ? t("stopListening") : t("startListening")}
      >
        {isListening ? (
          <MicOff className="h-5 w-5" />
        ) : (
          <Mic className="h-5 w-5" />
        )}
      </button>
    </div>
  );
} 