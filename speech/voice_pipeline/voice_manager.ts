/**
 * voice_manager.ts
 *
 * Voice Pipeline Manager for L.U.C.I. (Inspired by Jarvis Local & Friday Voice Agent)
 *
 * Handles continuous ambient audio listening, Wake-word ("Luci") detection,
 * Echo cancellation state, Global Dictation Mode (WisprFlow style),
 * and syncs visual states with the EventBus.
 */

import { EventBus } from '../../core/events/EventBus';

export type VoiceState = 'IDLE' | 'LISTENING' | 'THINKING' | 'SPEAKING';

export interface VoiceConfig {
  wakeWord: string;
  sttEngine: 'faster-whisper' | 'sarvam' | 'openai';
  ttsEngine: 'piper' | 'openai' | 'sarvam';
  echoCancellationEnabled: boolean;
  dictationShortcutKey: string;
}

export class VoiceManager {
  private currentState: VoiceState = 'IDLE';
  private config: VoiceConfig;
  private eventBus: EventBus;
  private isEchoSuppressed: boolean = false;

  constructor(config?: Partial<VoiceConfig>) {
    this.config = {
      wakeWord: 'Luci',
      sttEngine: 'faster-whisper',
      ttsEngine: 'piper',
      echoCancellationEnabled: true,
      dictationShortcutKey: 'Ctrl+Win',
      ...config,
    };
    this.eventBus = EventBus.getInstance();
    this.setupListeners();
  }

  /**
   * Set active voice state and emit event for UI / 3D Orb visual feedback.
   */
  public setState(newState: VoiceState): void {
    if (this.currentState === newState) return;
    this.currentState = newState;
    console.log(`[VoiceManager] State changed -> ${newState}`);
    this.eventBus.emit('voice:state_change', { state: newState });
  }

  /**
   * Get current voice pipeline state.
   */
  public getState(): VoiceState {
    return this.currentState;
  }

  /**
   * Process incoming transcript chunk for Wake-word Anywhere detection.
   */
  public processAudioTranscript(transcript: string): { wakeWordDetected: boolean; queryContent: string } {
    const normalized = transcript.toLowerCase();
    const wakeWordLower = this.config.wakeWord.toLowerCase();

    // Check if assistant is currently speaking to prevent echo loops
    if (this.isEchoSuppressed && this.currentState === 'SPEAKING') {
      console.log('[VoiceManager] Echo Filter: Suppressed self-speech audio.');
      return { wakeWordDetected: false, queryContent: '' };
    }

    const index = normalized.indexOf(wakeWordLower);
    if (index !== -1) {
      // Extract content after wake word
      const queryContent = transcript.substring(index + wakeWordLower.length).trim();
      this.setState('THINKING');
      return { wakeWordDetected: true, queryContent };
    }

    return { wakeWordDetected: false, queryContent: transcript };
  }

  /**
   * Trigger Global Dictation Mode (Press shortcut, speak, auto-paste into active app).
   */
  public startDictationSession(): void {
    console.log(`[VoiceManager] 🎙️ Global Dictation Mode active (${this.config.dictationShortcutKey}). Listening...`);
    this.setState('LISTENING');
  }

  /**
   * Finalize Dictation Session and return cleaned text (removing hesitations "um", "uh").
   */
  public finishDictationSession(rawTranscript: string): string {
    const cleanedText = rawTranscript
      .replace(/\b(um+|uh+|ahn+|tipo|é...)\b/gi, '')
      .replace(/\s+/g, ' ')
      .trim();

    console.log(`[VoiceManager] 📝 Dictation text clean: "${cleanedText}"`);
    this.setState('IDLE');
    return cleanedText;
  }

  private setupListeners(): void {
    this.eventBus.on('luci:speaking_start', () => {
      this.isEchoSuppressed = true;
      this.setState('SPEAKING');
    });

    this.eventBus.on('luci:speaking_end', () => {
      this.isEchoSuppressed = false;
      this.setState('IDLE');
    });
  }
}
