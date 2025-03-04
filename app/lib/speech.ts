// Speech utility for voice capabilities

import { LocaleType } from './i18n';

// Speech recognition interface
export interface SpeechRecognitionResult {
  transcript: string;
  isFinal: boolean;
}

// Check if speech recognition is supported
export const isSpeechRecognitionSupported = (): boolean => {
  return typeof window !== 'undefined' && ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window);
};

// Check if speech synthesis is supported
export const isSpeechSynthesisSupported = (): boolean => {
  return typeof window !== 'undefined' && 'speechSynthesis' in window;
};

// Initialize speech recognition
export const initSpeechRecognition = (
  language: LocaleType,
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
  recognition.lang = language === 'el' ? 'el-GR' : 'en-US';
  
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

// Cache for voices to avoid repeated calls
let cachedVoices: SpeechSynthesisVoice[] | null = null;

// Get available voices with caching
const getVoices = (): Promise<SpeechSynthesisVoice[]> => {
  return new Promise((resolve) => {
    if (cachedVoices && cachedVoices.length > 0) {
      resolve(cachedVoices);
      return;
    }

    if (typeof window === 'undefined' || !window.speechSynthesis) {
      resolve([]);
      return;
    }

    // If voices are already available
    const voices = window.speechSynthesis.getVoices();
    if (voices && voices.length > 0) {
      cachedVoices = voices;
      resolve(voices);
      return;
    }

    // Wait for voices to be loaded
    const voicesChangedHandler = () => {
      const voices = window.speechSynthesis.getVoices();
      cachedVoices = voices;
      resolve(voices);
      window.speechSynthesis.removeEventListener('voiceschanged', voicesChangedHandler);
    };

    window.speechSynthesis.addEventListener('voiceschanged', voicesChangedHandler);
  });
};

// Get the best voice for a language
const getBestVoiceForLanguage = async (language: LocaleType): Promise<SpeechSynthesisVoice | null> => {
  try {
    const voices = await getVoices();
    if (!voices || voices.length === 0) return null;
    
    const langCode = language === 'el' ? 'el-GR' : 'en-US';
    
    // Preferences based on quality (specific voices known to be good)
    const preferredVoices = {
      'en-US': ['Google US English', 'Microsoft Zira', 'Samantha', 'Alex'],
      'el-GR': ['Google ελληνικά', 'Microsoft Stefanos']
    };
    
    // Try to find preferred voices first
    for (const preferredVoice of preferredVoices[langCode]) {
      const found = voices.find(v => v.name === preferredVoice);
      if (found) return found;
    }
    
    // Find any matching voice (exact match)
    const exactMatch = voices.find(v => v.lang === langCode);
    if (exactMatch) return exactMatch;
    
    // Find partial match (e.g. 'en-' for English)
    const partialMatch = voices.find(v => v.lang.startsWith(language));
    if (partialMatch) return partialMatch;
    
    // Fallback to any voice
    return voices[0];
  } catch (error) {
    console.error('Error selecting voice:', error);
    return null;
  }
};

// Speak text using speech synthesis
export const speakText = async (
  text: string, 
  language: LocaleType,
  options: {
    rate?: number;
    pitch?: number;
    volume?: number;
    stopPrevious?: boolean;
  } = {}
): Promise<{
  start: () => void;
  stop: () => void;
  onEnd: (callback: () => void) => void;
  isPaused: () => boolean;
  isPlaying: () => boolean;
  pause: () => void;
  resume: () => void;
}> => {
  if (!isSpeechSynthesisSupported()) {
    console.error('Speech synthesis is not supported in this browser');
    return {
      start: () => {},
      stop: () => {},
      onEnd: () => {},
      isPaused: () => false,
      isPlaying: () => false,
      pause: () => {},
      resume: () => {}
    };
  }

  const { rate = 1, pitch = 1, volume = 1, stopPrevious = true } = options;
  const synthesis = window.speechSynthesis;
  
  // Stop previous speech if requested
  if (stopPrevious) {
    synthesis.cancel();
  }

  const utterance = new SpeechSynthesisUtterance(text);
  
  // Set language
  utterance.lang = language === 'el' ? 'el-GR' : 'en-US';
  
  // Get the best available voice
  const voice = await getBestVoiceForLanguage(language);
  if (voice) {
    utterance.voice = voice;
  }
  
  // Set properties
  utterance.rate = rate;
  utterance.pitch = pitch;
  utterance.volume = volume;
  
  let endCallback: () => void = () => {};
  utterance.onend = () => endCallback();
  
  return {
    start: () => synthesis.speak(utterance),
    stop: () => synthesis.cancel(),
    onEnd: (callback: () => void) => {
      endCallback = callback;
    },
    isPaused: () => synthesis.paused,
    isPlaying: () => synthesis.speaking,
    pause: () => synthesis.pause(),
    resume: () => synthesis.resume()
  };
};

// Split text into sentences for more natural speech
export const speakTextInChunks = async (
  text: string,
  language: LocaleType,
  options: {
    rate?: number;
    onChunkStart?: (chunk: string, index: number) => void;
    onComplete?: () => void;
  } = {}
): Promise<() => void> => {
  if (!isSpeechSynthesisSupported()) {
    if (options.onComplete) options.onComplete();
    return () => {};
  }
  
  // Split text into sentences or chunks
  const sentenceRegex = /([.!?])\s+/g;
  const chunks = text
    .split(sentenceRegex)
    .reduce((acc: string[], item, i, arr) => {
      if (i % 2 === 0) {
        const nextPunctuation = arr[i + 1] || '';
        acc.push(item + nextPunctuation);
      }
      return acc;
    }, [])
    .filter(chunk => chunk.trim().length > 0);
  
  let currentIndex = 0;
  let isCancelled = false;
  
  // Function to speak each chunk sequentially
  const speakNextChunk = async () => {
    if (isCancelled || currentIndex >= chunks.length) {
      if (options.onComplete && !isCancelled) options.onComplete();
      return;
    }
    
    const chunk = chunks[currentIndex];
    
    if (options.onChunkStart) {
      options.onChunkStart(chunk, currentIndex);
    }
    
    const speech = await speakText(chunk, language, { 
      rate: options.rate || 1,
      stopPrevious: false 
    });
    
    speech.onEnd(() => {
      currentIndex++;
      speakNextChunk();
    });
    
    speech.start();
  };
  
  // Start speaking
  speakNextChunk();
  
  // Return cancel function
  return () => {
    isCancelled = true;
    if (isSpeechSynthesisSupported()) {
      window.speechSynthesis.cancel();
    }
  };
}; 