/**
 * useOrbState — React hook for the OrbStateMachine
 *
 * Bridges the pure TypeScript state machine with React's reactivity model.
 * Creates a single shared instance and syncs state via useSyncExternalStore.
 */

import { useSyncExternalStore, useRef, useCallback } from 'react';
import { OrbStateMachine } from '../engine/OrbStateMachine';
import {
  getAnimationParams,
  lerpParams,
  getTransitionDuration,
} from '../engine/OrbAnimationEngine';
import type { OrbState, OrbAnimationParams } from '../engine/types';

// Singleton — one state machine per application instance
const machine = new OrbStateMachine();

export function useOrbState() {
  const state = useSyncExternalStore(
    (cb) => machine.subscribe(cb),
    () => machine.getState(),
  );

  const transition = useCallback((to: OrbState) => machine.transition(to), []);
  const startListening = useCallback(() => machine.startListening(), []);
  const startThinking = useCallback(() => machine.startThinking(), []);
  const startSpeaking = useCallback(() => machine.startSpeaking(), []);
  const returnToIdle = useCallback(() => machine.returnToIdle(), []);

  return {
    state,
    transition,
    startListening,
    startThinking,
    startSpeaking,
    returnToIdle,
    machine,
  };
}

/**
 * useOrbAnimation — provides smoothly interpolated animation params
 *
 * Returns a ref and tick function. The ref holds current interpolated params.
 * tick() must be called each frame (from useFrame in R3F).
 */
export interface OrbAnimationHandle {
  paramsRef: React.RefObject<OrbAnimationParams>;
  tick: (delta: number) => void;
}

export function useOrbAnimation(state: OrbState): OrbAnimationHandle {
  const paramsRef = useRef<OrbAnimationParams>(getAnimationParams('idle'));
  const targetRef = useRef<OrbAnimationParams>(getAnimationParams('idle'));
  const progressRef = useRef(1);
  const prevStateRef = useRef<OrbState>('idle');
  const durationRef = useRef(800);

  // When state changes, start interpolation
  if (state !== prevStateRef.current) {
    targetRef.current = getAnimationParams(state);
    durationRef.current = getTransitionDuration(prevStateRef.current, state);
    progressRef.current = 0;
    prevStateRef.current = state;
  }

  // Advance interpolation (called each frame from useFrame in R3F)
  const tick = useCallback((delta: number) => {
    if (progressRef.current < 1) {
      progressRef.current = Math.min(
        1,
        progressRef.current + (delta * 1000) / durationRef.current,
      );
      // Ease out cubic for smooth deceleration
      const t = 1 - Math.pow(1 - progressRef.current, 3);
      paramsRef.current = lerpParams(paramsRef.current, targetRef.current, t);
    }
  }, []);

  return { paramsRef, tick };
}
