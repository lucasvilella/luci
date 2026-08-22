/**
 * useWakeWord
 *
 * Hook to continuously listen for the wake word using the browser's Web Speech API.
 * This is used for the desktop validation prototype to avoid external binaries.
 */

import { useEffect, useRef, useState, useCallback } from 'react';

// Type declarations for Web Speech API
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

interface UseWakeWordOptions {
  onWakeWordDetected: () => void;
  isActive: boolean; // if true, it listens; if false, it stops
}

const WAKE_WORDS = ['hey luci', 'ei luci', 'luci', 'lucy', 'hey lucy', 'ei lucy'];

export function useWakeWord({ onWakeWordDetected, isActive }: UseWakeWordOptions) {
  const [isSupported, setIsSupported] = useState<boolean>(true);
  const [isListening, setIsListening] = useState<boolean>(false);
  const [micPermissionDenied, setMicPermissionDenied] = useState<boolean>(false);
  
  const recognitionRef = useRef<any>(null);
  const isIntentionalStop = useRef<boolean>(false);

  const initRecognition = useCallback(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setIsSupported(false);
      return null;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'pt-BR'; // Adjust based on user language or make it configurable

    recognition.onstart = () => {
      setIsListening(true);
      setMicPermissionDenied(false);
    };

    recognition.onresult = (event: any) => {
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        const transcript = event.results[i][0].transcript.toLowerCase().trim();
        
        // Remove punctuation
        const cleanTranscript = transcript.replace(/[.,!?]/g, '');

        if (WAKE_WORDS.some(word => cleanTranscript.includes(word))) {
          // Found wake word!
          console.log(`[WakeWord] Detected: "${cleanTranscript}"`);
          onWakeWordDetected();
          
          // Stop recognition momentarily to prevent double triggers
          isIntentionalStop.current = true;
          recognition.stop();
          break;
        }
      }
    };

    recognition.onerror = (event: any) => {
      console.warn('[WakeWord] Error:', event.error);
      if (event.error === 'not-allowed') {
        setMicPermissionDenied(true);
        isIntentionalStop.current = true;
      }
    };

    recognition.onend = () => {
      setIsListening(false);
      // If we didn't intentionally stop and we are supposed to be active, restart
      if (!isIntentionalStop.current && isActive && !micPermissionDenied) {
        try {
          recognition.start();
        } catch (e) {
          console.error('[WakeWord] Failed to restart:', e);
        }
      }
    };

    return recognition;
  }, [isActive, micPermissionDenied, onWakeWordDetected]);

  useEffect(() => {
    if (!recognitionRef.current) {
      recognitionRef.current = initRecognition();
    }

    const recognition = recognitionRef.current;

    if (isActive && recognition && !isListening && !micPermissionDenied) {
      isIntentionalStop.current = false;
      try {
        recognition.start();
      } catch (e) {
        console.error('[WakeWord] Failed to start:', e);
      }
    } else if (!isActive && recognition && isListening) {
      isIntentionalStop.current = true;
      recognition.stop();
    }

    return () => {
      if (recognition) {
        isIntentionalStop.current = true;
        recognition.stop();
      }
    };
  }, [isActive, isListening, micPermissionDenied, initRecognition]);

  return { isSupported, isListening, micPermissionDenied };
}
