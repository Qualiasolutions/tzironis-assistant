"use client";

import { useState, useEffect } from "react";
import { Mic, MicOff, Volume2 } from "lucide-react";
import { useLanguage } from "@/app/lib/LanguageContext";
import { initSpeechRecognition, speakText } from "@/app/lib/speech";
import { LocaleType } from "@/app/lib/i18n";

interface VoiceControlsProps {
  onTextInput: (text: string) => void;
}

export default function VoiceControls({ onTextInput }: VoiceControlsProps) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [recognition, setRecognition] = useState<SpeechRecognition | null>(null);
  const { t, language } = useLanguage();

  useEffect(() => {
    // Initialize speech recognition
    try {
      const recognitionInstance = initSpeechRecognition(language);
      
      if (recognitionInstance) {
        recognitionInstance.onresult = (event) => {
          const current = event.resultIndex;
          const transcript = event.results[current][0].transcript;
          setTranscript(transcript);
          onTextInput(transcript);
        };

        recognitionInstance.onend = () => {
          setIsListening(false);
        };

        recognitionInstance.onerror = (event) => {
          console.error("Speech recognition error", event.error);
          setIsListening(false);
        };

        setRecognition(recognitionInstance);
      }
    } catch (error) {
      console.error("Speech recognition not supported", error);
    }

    return () => {
      if (recognition) {
        recognition.abort();
      }
    };
  }, [language]);

  const toggleListening = () => {
    if (isListening) {
      recognition?.abort();
      setIsListening(false);
    } else if (recognition) {
      try {
        recognition.start();
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