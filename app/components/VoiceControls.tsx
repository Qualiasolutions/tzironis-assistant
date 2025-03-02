"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Mic, MicOff, Play, Square } from 'lucide-react';
import { useLanguage } from '../lib/LanguageContext';
import { 
  isSpeechRecognitionSupported, 
  isSpeechSynthesisSupported,
  initSpeechRecognition,
  speakText
} from '../lib/speech';

interface MicrophoneButtonProps {
  onTranscript: (text: string) => void;
  disabled?: boolean;
}

export function MicrophoneButton({ onTranscript, disabled = false }: MicrophoneButtonProps) {
  const { locale, t } = useLanguage();
  const [isListening, setIsListening] = useState(false);
  const [supported, setSupported] = useState(false);
  
  useEffect(() => {
    // Check if speech recognition is supported
    setSupported(isSpeechRecognitionSupported());
  }, []);
  
  const toggleListening = useCallback(() => {
    if (!supported || disabled) return;
    
    if (isListening) {
      setIsListening(false);
      return;
    }
    
    setIsListening(true);
    
    const speechRecognition = initSpeechRecognition(
      locale,
      (result) => {
        if (result.isFinal) {
          onTranscript(result.transcript);
          setIsListening(false);
        }
      },
      () => setIsListening(false)
    );
    
    speechRecognition.start();
    
    // Safety timeout - stop listening after 10 seconds if nothing is said
    setTimeout(() => {
      if (isListening) {
        speechRecognition.stop();
        setIsListening(false);
      }
    }, 10000);
  }, [locale, onTranscript, isListening, supported, disabled]);
  
  if (!supported) return null;
  
  return (
    <button
      onClick={toggleListening}
      disabled={disabled}
      className={`relative h-10 w-10 flex items-center justify-center rounded-full transition-colors ${
        isListening
          ? 'bg-red-500 text-white animate-pulse'
          : 'bg-primary text-white hover:bg-accent disabled:opacity-50'
      }`}
      aria-label={isListening ? t('microphoneOn') : t('microphoneOff')}
      title={isListening ? t('microphoneOn') : t('microphoneOff')}
    >
      {isListening ? (
        <MicOff className="h-5 w-5" />
      ) : (
        <Mic className="h-5 w-5" />
      )}
    </button>
  );
}

interface SpeakButtonProps {
  text: string;
  disabled?: boolean;
}

export function SpeakButton({ text, disabled = false }: SpeakButtonProps) {
  const { locale, t } = useLanguage();
  const [isPlaying, setIsPlaying] = useState(false);
  const [supported, setSupported] = useState(false);
  
  useEffect(() => {
    // Check if speech synthesis is supported
    setSupported(isSpeechSynthesisSupported());
  }, []);
  
  const toggleSpeech = useCallback(() => {
    if (!supported || disabled || !text) return;
    
    if (isPlaying) {
      window.speechSynthesis.cancel();
      setIsPlaying(false);
      return;
    }
    
    setIsPlaying(true);
    
    const speech = speakText(text, locale);
    speech.start();
    speech.onEnd(() => {
      setIsPlaying(false);
    });
  }, [locale, text, isPlaying, supported, disabled]);
  
  if (!supported || !text) return null;
  
  return (
    <button
      onClick={toggleSpeech}
      disabled={disabled}
      className={`flex items-center justify-center gap-1 rounded px-2 py-1 text-xs font-medium transition-colors ${
        isPlaying
          ? 'bg-red-500 text-white'
          : 'bg-primary text-white hover:bg-accent disabled:opacity-50'
      }`}
      aria-label={isPlaying ? t('stopPlayback') : t('playResponse')}
      title={isPlaying ? t('stopPlayback') : t('playResponse')}
    >
      {isPlaying ? (
        <>
          <Square className="h-3 w-3" />
          {t('stopPlayback')}
        </>
      ) : (
        <>
          <Play className="h-3 w-3" />
          {t('playResponse')}
        </>
      )}
    </button>
  );
} 