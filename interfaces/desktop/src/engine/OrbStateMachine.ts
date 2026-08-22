/**
 * L.U.C.I. Orb State Machine
 *
 * Pure TypeScript implementation — zero React dependencies.
 * Manages the 4 External States of the L.U.C.I. platform.
 *
 * This class is intentionally decoupled from any UI framework so that:
 * - The Orb's visual appearance can be replaced without changing state logic
 * - Voice, text, and future input modalities reuse the same state machine
 * - The state machine can be connected to the Cognitive Bus via events
 *
 * Reference: docs/01_ARCHITECTURE/STATE_MACHINE.md
 */

import type {
  OrbState,
  OrbTransition,
  OrbStateListener,
} from './types';
import { VALID_TRANSITIONS } from './types';

export class OrbStateMachine {
  private currentState: OrbState = 'idle';
  private listeners: Set<OrbStateListener> = new Set();
  private transitionHistory: OrbTransition[] = [];

  // -----------------------------------------------------------------------
  // Public API
  // -----------------------------------------------------------------------

  /** Current external state */
  getState(): OrbState {
    return this.currentState;
  }

  /** Attempt a state transition. Returns true if valid. */
  transition(to: OrbState): boolean {
    if (this.currentState === to) return false;

    const allowed = VALID_TRANSITIONS[this.currentState];
    if (!allowed.includes(to)) {
      console.warn(
        `[OrbStateMachine] Invalid transition: ${this.currentState} → ${to}`,
      );
      return false;
    }

    const record: OrbTransition = {
      from: this.currentState,
      to,
      timestamp: Date.now(),
    };

    this.currentState = to;
    this.transitionHistory.push(record);
    this.notify(record);

    return true;
  }

  /** Subscribe to state changes */
  subscribe(listener: OrbStateListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /** Reset to idle (Standby) */
  reset(): void {
    if (this.currentState !== 'idle') {
      this.transition('idle');
    }
  }

  /** Full transition history (useful for observability / debugging) */
  getHistory(): ReadonlyArray<OrbTransition> {
    return this.transitionHistory;
  }

  // -----------------------------------------------------------------------
  // Convenience methods matching the cognitive cycle
  // -----------------------------------------------------------------------

  /** Standby → Listening */
  startListening(): boolean {
    return this.transition('listening');
  }

  /** Listening → Thinking */
  startThinking(): boolean {
    return this.transition('thinking');
  }

  /** Thinking → Speaking (Responding) */
  startSpeaking(): boolean {
    return this.transition('speaking');
  }

  /** Any → Idle (Standby) */
  returnToIdle(): boolean {
    return this.transition('idle');
  }

  // -----------------------------------------------------------------------
  // Internal
  // -----------------------------------------------------------------------

  private notify(transition: OrbTransition): void {
    this.listeners.forEach((listener) => {
      try {
        listener(this.currentState, transition);
      } catch (error) {
        console.error('[OrbStateMachine] Listener error:', error);
      }
    });
  }
}
