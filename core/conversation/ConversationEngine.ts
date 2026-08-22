/**
 * ConversationEngine
 *
 * Manages conversational rhythm, speech pauses, backchanneling micro-reactions ("hum", "entendi"),
 * instant user barge-in interruption, and context-dependent persona styling.
 */

import { EventBus } from '../events/EventBus';

export interface PersonaStyle {
  mode: 'WORK' | 'EVENING' | 'NEUTRAL';
  conciseness: 'STRICT' | 'BALANCED';
  tone: string;
}

export class ConversationEngine {
  private eventBus: EventBus;
  private isLuciSpeaking = false;
  private backchannelUtterances = ['hum, entendi', 'pode continuar', 'estou ouvindo', 'certo'];

  constructor() {
    this.eventBus = EventBus.getInstance();
    this.setupListeners();
  }

  private setupListeners(): void {
    // 1. Instant User Barge-in Interruption: When user starts speaking, stop L.U.C.I. speech immediately
    this.eventBus.on('user:speech_start', () => {
      if (this.isLuciSpeaking) {
        console.log('[ConversationEngine] 🛑 User Barge-in Interruption detected! Stopping L.U.C.I. speech.');
        this.isLuciSpeaking = false;
        this.eventBus.emit('luci:speaking_end', { reason: 'INTERRUPTED_BY_USER' });
      }
    });

    // 2. Track L.U.C.I. speaking state
    this.eventBus.on('luci:speaking_start', () => {
      this.isLuciSpeaking = true;
    });

    this.eventBus.on('luci:speaking_end', () => {
      this.isLuciSpeaking = false;
    });
  }

  /**
   * Evaluates user speech pause for quick backchannel micro-reactions.
   */
  handleUserPause(partialTranscript: string): string | null {
    if (this.isLuciSpeaking || partialTranscript.trim().length < 10) return null;

    // Pick a random quick backchannel phrase
    const randomBackchannel = this.backchannelUtterances[Math.floor(Math.random() * this.backchannelUtterances.length)];
    this.eventBus.emit('luci:backchannel', { text: randomBackchannel });
    return randomBackchannel;
  }

  /**
   * Calculates contextual persona style based on time of day.
   */
  getPersonaStyle(): PersonaStyle {
    const hour = new Date().getHours();

    if (hour >= 8 && hour < 18) {
      return {
        mode: 'WORK',
        conciseness: 'STRICT',
        tone: 'Focada, eficiente, elegante e direta para o dia de trabalho.',
      };
    } else {
      return {
        mode: 'EVENING',
        conciseness: 'BALANCED',
        tone: 'Leve, amigável, acolhedora e descontraída para o fim do dia.',
      };
    }
  }

  /**
   * Helper to check if L.U.C.I. is currently speaking.
   */
  getIsSpeaking(): boolean {
    return this.isLuciSpeaking;
  }
}
