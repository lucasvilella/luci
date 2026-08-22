/**
 * LuciVoiceProfile.ts
 *
 * Centralized Vocal Identity & Configuration for L.U.C.I.
 *
 * Personality:
 * - Adult Brazilian Female (pt-BR)
 * - Warm, secure, intelligent, calm, spontaneous, conversational
 * - Moderate rate, natural pauses, varied intonation (no robotic monotone or telemarketing tone)
 */

export interface VoicePersonalityConfig {
  language: string;
  gender: 'female' | 'male';
  rate: number;
  pitch: number;
  volume: number;
  style: string;
  defaultEmotion: string;
  prosodyInstructions: string;
  preferredProvider: 'f5tts' | 'xtts' | 'kokoro' | 'edgetts' | 'gemini' | 'auto';
  f5tts: {
    model: string;
    referenceAudio: string;
    referenceText: string;
    speed: number;
    endpoint: string;
  };
  xtts: {
    model: string;
    referenceAudio: string;
    speed: number;
    temperature: number;
    repetitionPenalty: number;
    topK: number;
    topP: number;
    seed: number;
  };
  kokoro: {
    voice: string;
    endpoint: string;
  };
  edge: {
    voiceName: string;
  };
}

export const LUCI_VOICE_PROFILE: VoicePersonalityConfig = {
  language: 'pt-BR',
  gender: 'female',
  rate: 1.13,
  pitch: 1.0,
  volume: 1.0,
  style: 'conversational-intelligent',
  defaultEmotion: 'warm-calm',
  prosodyInstructions: `
    Voz Oficial Exclusiva: XTTS-v2 Clonada (Lucy do filme - Dublagem pt-BR / Timbre aveludado e sereno).
    Modo: 100% XTTS-v2 (Fallbacks desativados temporariamente durante validação).
    Micro-respostas em cache: "Hum", "Sei", "Ah, sim", "Entendido", "Certo" para conversação dinâmica.
    Tom conversacional inteligente, cadência calma e natural, pontuação preservada.
  `.trim(),
  preferredProvider: 'xtts',
  f5tts: {
    model: 'F5-TTS',
    referenceAudio: 'lucy_best_ref_24k.wav',
    referenceText: 'É, são todas as partes que constroem a matéria',
    speed: 1.0,
    endpoint: 'http://localhost:8003',
  },
  xtts: {
    model: 'tts_models/multilingual/multi-dataset/xtts_v2',
    referenceAudio: 'lucy_best_ref_24k.wav',
    speed: 1.13,
    temperature: 0.65,
    repetitionPenalty: 3.5,
    topK: 50,
    topP: 0.70,
    seed: 42,
  },
  kokoro: {
    voice: 'pf_dora',
    endpoint: 'http://localhost:8880',
  },
  edge: {
    voiceName: 'pt-BR-FranciscaNeural',
  },
};
