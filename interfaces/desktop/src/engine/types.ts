/**
 * Luci Orb State Machine — Types
 *
 * These types represent the External State layer of the Luci State Machine.
 * Reference: docs/01_ARCHITECTURE/STATE_MACHINE.md
 *
 * External States are what the user perceives.
 * Internal States (dozens of cognitive steps) are abstracted away.
 *
 * Mapping:
 *   idle      → Standby    (awaiting stimuli)
 *   listening → Listening   (active input capture)
 *   thinking  → Thinking    (cognitive processing)
 *   speaking  → Responding  (communication)
 */

// ---------------------------------------------------------------------------
// External States
// ---------------------------------------------------------------------------

export type OrbState = 'idle' | 'listening' | 'thinking' | 'speaking';

// ---------------------------------------------------------------------------
// Transitions
// ---------------------------------------------------------------------------

export interface OrbTransition {
  from: OrbState;
  to: OrbState;
  timestamp: number;
}

// ---------------------------------------------------------------------------
// Observer callback
// ---------------------------------------------------------------------------

export type OrbStateListener = (
  state: OrbState,
  transition: OrbTransition,
) => void;

// ---------------------------------------------------------------------------
// Animation parameters produced by the Animation Engine
// ---------------------------------------------------------------------------

export interface OrbAnimationParams {
  /** Noise displacement frequency */
  noiseFrequency: number;
  /** Noise displacement amplitude */
  noiseAmplitude: number;
  /** Animation speed multiplier */
  speed: number;
  /** Overall brightness 0 → 1 */
  brightness: number;
  /** Glow intensity */
  glowIntensity: number;
  /** Glow radius */
  glowRadius: number;
  /** Particle count (Thinking state) */
  particleCount: number;
  /** Particle speed */
  particleSpeed: number;
  /** Distortion strength (Thinking state) */
  distortion: number;
  /** Fresnel power for edge glow */
  fresnelPower: number;
  /** Primary color [r, g, b] normalized */
  primaryColor: [number, number, number];
  /** Secondary color [r, g, b] normalized */
  secondaryColor: [number, number, number];
  /** Accent color [r, g, b] normalized */
  accentColor: [number, number, number];
}

// ---------------------------------------------------------------------------
// Valid transitions map
// ---------------------------------------------------------------------------

export const VALID_TRANSITIONS: Record<OrbState, OrbState[]> = {
  idle: ['listening', 'thinking', 'speaking'],
  listening: ['thinking', 'idle'],
  thinking: ['speaking', 'idle'],
  speaking: ['idle', 'listening'],
};
