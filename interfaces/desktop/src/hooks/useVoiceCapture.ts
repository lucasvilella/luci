/**
 * useVoiceCapture — Continuous Voice Session (Alexa Plus Style) & Silence Framing
 *
 * Requirements:
 * 1. Wake Word ("Ei, Luci"): Activates Continuous Voice Mode.
 * 2. Automatic Continuous Loop: Once activated via voice, after L.U.C.I. finishes speaking,
 *    it automatically re-opens the mic for follow-up questions without requiring "Ei Luci" again.
 * 3. Exit Trigger: If user stays silent for 3.5s after L.U.C.I. speaks (or says "tchau", "obrigado"),
 *    it exits continuous mode and returns to idle waiting for the Wake Word.
 * 4. Text Input Isolation: Sending messages via the chat text box DOES NOT trigger voice listening mode.
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import type { OrbState } from '../engine/types';

interface UseVoiceCaptureOptions {
  state: OrbState;
  onStateChange: (state: OrbState) => void;
  onSendTextMessage: (text: string, isVoiceMode: boolean) => void;
}

const WAKE_WORDS = ['hey luci', 'ei luci', 'luci', 'lucy', 'hey lucy', 'ei lucy'];
const EXIT_WORDS = ['tchau', 'obrigado', 'obrigada', 'valeu', 'cancelar', 'pode ir', 'encerra', 'desligar', 'parar'];

function speakWakewordAck() {
  // Browser WebSpeech disabled to prevent dual voice conflict with ElevenLabs
  if ('speechSynthesis' in window) {
    try {
      window.speechSynthesis.cancel();
    } catch {
      // Ignore
    }
  }
}

export function useVoiceCapture({ state, onStateChange, onSendTextMessage }: UseVoiceCaptureOptions) {
  const [isSupported, setIsSupported] = useState<boolean>(true);
  const [isListening, setIsListening] = useState<boolean>(false);
  const [isVoiceSessionActive, setIsVoiceSessionActive] = useState<boolean>(false);

  const recognitionRef = useRef<any>(null);
  const silenceTimerRef = useRef<any>(null);
  const sessionTimeoutRef = useRef<any>(null);
  const capturedTextRef = useRef<string>('');
  const isStartingRef = useRef<boolean>(false);

  const clearTimers = () => {
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
    if (sessionTimeoutRef.current) {
      clearTimeout(sessionTimeoutRef.current);
      sessionTimeoutRef.current = null;
    }
  };

  const endVoiceSession = useCallback(() => {
    console.log('[VoiceCapture] Ending voice session. Returning to idle Wake Word listener.');
    clearTimers();
    setIsVoiceSessionActive(false);
    onStateChange('idle');
  }, [onStateChange]);

  const startVoiceCapture = useCallback(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setIsSupported(false);
      return;
    }

    if (isStartingRef.current) return;
    isStartingRef.current = true;

    if (recognitionRef.current) {
      try {
        recognitionRef.current.onstart = null;
        recognitionRef.current.onend = null;
        recognitionRef.current.onerror = null;
        recognitionRef.current.onresult = null;
        recognitionRef.current.stop();
      } catch {}
    }

    const recognition = new SpeechRecognition();
    recognitionRef.current = recognition;

    if (state === 'idle' && !isVoiceSessionActive) {
      // WAKE WORD LISTENING MODE
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'pt-BR';

      recognition.onresult = (event: any) => {
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const transcript = event.results[i][0].transcript.toLowerCase().trim();
          const cleanTranscript = transcript.replace(/[.,!?]/g, '');

          if (WAKE_WORDS.some((word) => cleanTranscript.includes(word))) {
            console.log(`[VoiceCapture] Wake word detected: "${cleanTranscript}". Starting Continuous Voice Session.`);
            try {
              recognition.stop();
            } catch {}
            setIsVoiceSessionActive(true);
            speakWakewordAck();
            onStateChange('listening');
            break;
          }
        }
      };

      recognition.onstart = () => {
        setIsListening(true);
        isStartingRef.current = false;
      };

      recognition.onerror = (event: any) => {
        console.warn('[VoiceCapture] Recognition error:', event.error);
        isStartingRef.current = false;
      };

      recognition.onend = () => {
        setIsListening(false);
        isStartingRef.current = false;
      };

      try {
        recognition.start();
      } catch (e) {
        isStartingRef.current = false;
      }

    } else if (state === 'listening') {
      // ACTIVE CONTINUOUS SPEECH INPUT
      capturedTextRef.current = '';
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = 'pt-BR';

      // 3.5s Inactivity Timer: If user says nothing after L.U.C.I. activated, close session
      sessionTimeoutRef.current = setTimeout(() => {
        if (!capturedTextRef.current.trim()) {
          console.log('[VoiceCapture] 3.5s inactivity timeout reached. Closing voice session.');
          endVoiceSession();
        }
      }, 3500);

      recognition.onstart = () => {
        setIsListening(true);
        isStartingRef.current = false;
        console.log('[VoiceCapture] Listening for user voice input...');
      };

      recognition.onerror = (event: any) => {
        console.warn('[VoiceCapture] Active listening error:', event.error);
        isStartingRef.current = false;
      };

      recognition.onresult = (event: any) => {
        // Instant Barge-in Interruption: If L.U.C.I. is currently speaking when user talks, stop speech on the spot!
        if ('speechSynthesis' in window && window.speechSynthesis.speaking) {
          console.log('[VoiceCapture] 🛑 Instant User Barge-in: Interrupting L.U.C.I. speech!');
          window.speechSynthesis.cancel();
        }

        clearTimers();

        let finalTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          finalTranscript += event.results[i][0].transcript;
        }

        if (finalTranscript.trim()) {
          capturedTextRef.current = finalTranscript.trim();
          let cleanText = capturedTextRef.current;
          
          WAKE_WORDS.forEach((w) => {
            cleanText = cleanText.replace(new RegExp(w, 'gi'), '').trim();
          });
          capturedTextRef.current = cleanText;

          // 1.2s Silence Framing Timer: User finished sentence
          silenceTimerRef.current = setTimeout(() => {
            console.log(`[VoiceCapture] Sentence captured: "${capturedTextRef.current}"`);
            try {
              recognition.stop();
            } catch {}

            const lower = capturedTextRef.current.toLowerCase();
            const isExitCommand = EXIT_WORDS.some((w) => lower.includes(w));

            if (isExitCommand) {
              console.log('[VoiceCapture] Exit command spoken. Returning to idle.');
              onSendTextMessage('Até mais!', true);
              endVoiceSession();
            } else if (capturedTextRef.current.length > 1) {
              onSendTextMessage(capturedTextRef.current, true);
            } else {
              endVoiceSession();
            }
          }, 1200);
        }
      };

      recognition.onend = () => {
        setIsListening(false);
        isStartingRef.current = false;
      };

      try {
        recognition.start();
      } catch (e) {
        isStartingRef.current = false;
      }
    } else {
      isStartingRef.current = false;
    }
  }, [state, isVoiceSessionActive, onStateChange, onSendTextMessage, endVoiceSession]);

  useEffect(() => {
    startVoiceCapture();

    return () => {
      clearTimers();
      isStartingRef.current = false;
      if (recognitionRef.current) {
        try {
          recognitionRef.current.onstart = null;
          recognitionRef.current.onend = null;
          recognitionRef.current.onerror = null;
          recognitionRef.current.onresult = null;
          recognitionRef.current.stop();
        } catch {}
      }
    };
  }, [state, startVoiceCapture]);

  return {
    isSupported,
    isListening,
    isVoiceSessionActive,
    endVoiceSession,
    setIsVoiceSessionActive,
  };
}
