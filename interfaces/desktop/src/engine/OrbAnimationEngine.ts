/**
 * L.U.C.I. Orb Animation Engine
 *
 * Declares animation parameters for each External State matching futuristic reference visual designs.
 */

import type { OrbState, OrbAnimationParams } from './types';

// ---------------------------------------------------------------------------
// Vivid Electric Cyan / Deep Blue / Purple palette matching Reference Designs
// ---------------------------------------------------------------------------

const COLORS = {
  deepBlue: [0.04, 0.18, 0.75] as [number, number, number],
  vividCyan: [0.0, 0.85, 1.0] as [number, number, number],
  electricBlue: [0.08, 0.45, 0.98] as [number, number, number],
  purpleEnergy: [0.55, 0.15, 0.95] as [number, number, number],
  softWhite: [0.95, 0.98, 1.0] as [number, number, number],
};

// ---------------------------------------------------------------------------
// State → Animation Parameters
// ---------------------------------------------------------------------------

const STATE_PARAMS: Record<OrbState, OrbAnimationParams> = {
  idle: {
    noiseFrequency: 0.8,
    noiseAmplitude: 0.03, // Soft gentle breathing
    speed: 0.1,
    brightness: 0.55,
    glowIntensity: 0.4,
    glowRadius: 1.4,
    particleCount: 80,
    particleSpeed: 0.04,
    distortion: 0.01,
    fresnelPower: 2.5,
    primaryColor: COLORS.deepBlue,
    secondaryColor: COLORS.electricBlue,
    accentColor: COLORS.softWhite,
  },

  listening: {
    noiseFrequency: 1.4,
    noiseAmplitude: 0.08,
    speed: 0.3, // Active rotation & breathing pulse
    brightness: 0.85,
    glowIntensity: 0.75,
    glowRadius: 1.8,
    particleCount: 180,
    particleSpeed: 0.12,
    distortion: 0.04,
    fresnelPower: 1.8,
    primaryColor: COLORS.electricBlue,
    secondaryColor: COLORS.vividCyan,
    accentColor: COLORS.softWhite,
  },

  thinking: {
    noiseFrequency: 2.2,
    noiseAmplitude: 0.15,
    speed: 0.55, // Shimmering & fast rotation energy
    brightness: 0.95,
    glowIntensity: 0.85,
    glowRadius: 2.1,
    particleCount: 240,
    particleSpeed: 0.25,
    distortion: 0.18,
    fresnelPower: 1.3,
    primaryColor: COLORS.purpleEnergy,
    secondaryColor: COLORS.vividCyan,
    accentColor: COLORS.softWhite,
  },

  speaking: {
    noiseFrequency: 1.6,
    noiseAmplitude: 0.1,
    speed: 0.4, // Dynamic speech audio wave pulse
    brightness: 1.0,
    glowIntensity: 0.9,
    glowRadius: 2.4,
    particleCount: 220,
    particleSpeed: 0.18,
    distortion: 0.08,
    fresnelPower: 1.1,
    primaryColor: COLORS.electricBlue,
    secondaryColor: COLORS.vividCyan,
    accentColor: COLORS.softWhite,
  },
};

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export function getAnimationParams(state: OrbState): OrbAnimationParams {
  return STATE_PARAMS[state];
}

export function lerpParams(
  from: OrbAnimationParams,
  to: OrbAnimationParams,
  t: number,
): OrbAnimationParams {
  const clamp = Math.max(0, Math.min(1, t));

  const lerpNum = (a: number, b: number) => a + (b - a) * clamp;
  const lerpColor = (
    a: [number, number, number],
    b: [number, number, number],
  ): [number, number, number] => [
    lerpNum(a[0], b[0]),
    lerpNum(a[1], b[1]),
    lerpNum(a[2], b[2]),
  ];

  return {
    noiseFrequency: lerpNum(from.noiseFrequency, to.noiseFrequency),
    noiseAmplitude: lerpNum(from.noiseAmplitude, to.noiseAmplitude),
    speed: lerpNum(from.speed, to.speed),
    brightness: lerpNum(from.brightness, to.brightness),
    glowIntensity: lerpNum(from.glowIntensity, to.glowIntensity),
    glowRadius: lerpNum(from.glowRadius, to.glowRadius),
    particleCount: Math.round(lerpNum(from.particleCount, to.particleCount)),
    particleSpeed: lerpNum(from.particleSpeed, to.particleSpeed),
    distortion: lerpNum(from.distortion, to.distortion),
    fresnelPower: lerpNum(from.fresnelPower, to.fresnelPower),
    primaryColor: lerpColor(from.primaryColor, to.primaryColor),
    secondaryColor: lerpColor(from.secondaryColor, to.secondaryColor),
    accentColor: lerpColor(from.accentColor, to.accentColor),
  };
}

export const TRANSITION_DURATION: Record<string, number> = {
  'idle→listening': 300,
  'listening→thinking': 250,
  'thinking→speaking': 200,
  'speaking→idle': 400,
  'listening→idle': 600,
  'thinking→idle': 600,
  'speaking→listening': 0,
};

export function getTransitionDuration(from: OrbState, to: OrbState): number {
  return TRANSITION_DURATION[`${from}→${to}`] ?? 600;
}
