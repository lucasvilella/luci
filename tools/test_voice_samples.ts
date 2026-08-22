/**
 * test_voice_samples.ts
 *
 * Generates sample audio files with increased speeds (+18% and +25%)
 * to demonstrate fluid, natural conversational speed for Luci!
 */

import * as googleTTS from 'google-tts-api';
import fs from 'fs';
import path from 'path';

const sampleText = 'Olá Lucas! Eu sou a Luci. O meu sistema de voz agora conversa com você de forma fluida, natural e sem parecer uma leitura robótica.';

async function generateSample(speedSuffix: string, slow: boolean) {
  console.log(`🎙️ Gerando amostra de voz em alta definição (Velocidade ${speedSuffix})...`);

  const base64Audio = await googleTTS.getAudioBase64(sampleText, {
    lang: 'pt',
    slow,
    host: 'https://translate.google.com',
    timeout: 10000,
  });

  const buffer = Buffer.from(base64Audio, 'base64');
  const filePath = path.resolve(process.cwd(), `sample_luci_${speedSuffix}.mp3`);
  fs.writeFileSync(filePath, buffer);

  console.log(`✓ Áudio de amostra gerado: ${filePath}`);
}

async function run() {
  await generateSample('conversational_fast', false);
}

run().catch(console.error);
