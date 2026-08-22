/**
 * benchmark_tts.ts
 *
 * Automated local benchmark for L.U.C.I. Conversational Voice Engine.
 * Tests standardized phrases, evaluates TTFA (Time To First Audio), Total Latency,
 * and verifies automatic fallback between Gemini TTS & Qwen3-TTS 0.6B.
 */

import { VoiceProviderManager } from '../speech/tts/VoiceProviderManager';
import { GeminiTTSProvider } from '../speech/tts/providers/GeminiTTSProvider';
import { QwenTTSProvider } from '../speech/tts/providers/QwenTTSProvider';

const TEST_PHRASES = [
  'Olá, tudo bem?',
  'Claro, posso verificar isso para você.',
  'Entendi o que aconteceu. Vamos analisar juntos.',
  'Essa alteração precisa ser feita com cuidado porque afeta outros módulos.',
  'Estou aqui para ajudar a organizar todo o sistema de voz da L.U.C.I. para tornar a conversa rápida, acolhedora e inteligente.',
];

async function runBenchmark() {
  console.log('=============== L.U.C.I. TTS BENCHMARK ===============\n');

  const gemini = new GeminiTTSProvider();
  const qwen = new QwenTTSProvider();
  const manager = new VoiceProviderManager();

  console.log(`Gemini Available: ${await gemini.isAvailable()}`);
  console.log(`Qwen Local Available: ${await qwen.isAvailable()}\n`);

  for (let i = 0; i < TEST_PHRASES.length; i++) {
    const phrase = TEST_PHRASES[i];
    console.log(`--- Test ${i + 1}/${TEST_PHRASES.length}: "${phrase.substring(0, 30)}..." ---`);

    const selectedProvider = await manager.selectBestProvider();
    console.log(`Selected Provider: ${selectedProvider.name}`);

    const start = Date.now();
    try {
      const result = await selectedProvider.synthesize({
        requestId: `bm_${i}`,
        text: phrase,
      });

      console.log(`✓ TTFA: ${result.timeToFirstAudioMs}ms`);
      console.log(`✓ Latência Total: ${result.totalLatencyMs}ms`);
      console.log(`✓ Tamanho do Áudio: ${result.audioBuffer.byteLength} bytes\n`);

      manager.recordSuccess(selectedProvider.name, result.timeToFirstAudioMs, result.totalLatencyMs);
    } catch (err: any) {
      console.error(`✗ Erro na síntese: ${err.message}\n`);
      manager.recordFailure(selectedProvider.name);
    }
  }

  console.log('=============== MÉTRICAS FINAIS ===============');
  console.dir(manager.getMetricsSummary(), { depth: null });
}

runBenchmark().catch(console.error);
