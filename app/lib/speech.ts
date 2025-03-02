// Speech utility for voice capabilities

import { LocaleType } from './i18n';

// Speech recognition interface
export interface SpeechRecognitionResult {
  transcript: string;
  isFinal: boolean;
}

// Check if speech recognition is supported
export const isSpeechRecognitionSupported = (): boolean => {
  return 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;
};

// Check if speech synthesis is supported
export const isSpeechSynthesisSupported = (): boolean => {
  return 'speechSynthesis' in window;
};

// Initialize speech recognition
export const initSpeechRecognition = (
  locale: LocaleType,
  onResult: (result: SpeechRecognitionResult) => void,
  onEnd: () => void
): {
  start: () => void;
  stop: () => void;
} => {
  if (!isSpeechRecognitionSupported()) {
    console.error('Speech recognition is not supported in this browser');
    return {
      start: () => {},
      stop: () => {},
    };
  }

  // @ts-ignore - Using the webkitSpeechRecognition as a fallback
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  const recognition = new SpeechRecognition();
  
  // Configure speech recognition
  recognition.continuous = false;
  recognition.interimResults = true;
  recognition.lang = locale === 'el' ? 'el-GR' : 'en-US';
  
  recognition.onresult = (event: any) => {
    const transcript = Array.from(event.results)
      .map((result: any) => result[0].transcript)
      .join('');
    
    const isFinal = event.results[0].isFinal;
    
    onResult({ transcript, isFinal });
  };
  
  recognition.onend = onEnd;
  
  return {
    start: () => recognition.start(),
    stop: () => recognition.stop(),
  };
};

// Speak text using speech synthesis
export const speakText = (text: string, locale: LocaleType): {
  start: () => void;
  stop: () => void;
  onEnd: (callback: () => void) => void;
} => {
  if (!isSpeechSynthesisSupported()) {
    console.error('Speech synthesis is not supported in this browser');
    return {
      start: () => {},
      stop: () => {},
      onEnd: () => {},
    };
  }

  const synthesis = window.speechSynthesis;
  const utterance = new SpeechSynthesisUtterance(text);
  
  // Set language
  utterance.lang = locale === 'el' ? 'el-GR' : 'en-US';
  
  // Try to find appropriate voice
  let voices = synthesis.getVoices();
  const langCode = locale === 'el' ? 'el' : 'en';
  
  // Find a matching voice or use default
  const voice = voices.find((v) => v.lang.includes(langCode)) || voices[0];
  if (voice) {
    utterance.voice = voice;
  }
  
  // Set properties
  utterance.rate = 1;
  utterance.pitch = 1;
  
  let endCallback: () => void = () => {};
  utterance.onend = () => endCallback();
  
  return {
    start: () => {
      synthesis.cancel(); // Stop any current speech
      synthesis.speak(utterance);
    },
    stop: () => synthesis.cancel(),
    onEnd: (callback: () => void) => {
      endCallback = callback;
    },
  };
}; 