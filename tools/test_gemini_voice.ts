import { GoogleGenAI } from '@google/genai';
import fs from 'fs';
import path from 'path';
import { config } from 'dotenv';

config();

async function testGeminiVoice() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('GEMINI_API_KEY missing');

  const ai = new GoogleGenAI({ apiKey });

  console.log('🎙️ Testando síntese de áudio nativa do Gemini 2.5 Flash (Voz Neural de Alta Fluidez)...');

  const response = await ai.models.generateContent({
    model: 'gemini-2.0-flash-exp',
    contents: 'Fale com entonação humana super natural, espontânea e fluida em português do Brasil: Olá Lucas! Eu sou a Luci. O meu sistema de voz agora fala de forma totalmente humana e fluida com você.',
    config: {
      responseModalities: ['AUDIO'],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: {
            voiceName: 'Kore', // Natural Female Voice
          },
        },
      },
    },
  });

  const candidates = response.candidates;
  if (candidates && candidates[0]?.content?.parts) {
    for (const part of candidates[0].content.parts) {
      if (part.inlineData && part.inlineData.mimeType.startsWith('audio/')) {
        const audioBuffer = Buffer.from(part.inlineData.data, 'base64');
        const filePath = path.resolve(process.cwd(), 'sample_gemini_native_voice.wav');
        fs.writeFileSync(filePath, audioBuffer);
        console.log(`✅ Áudio NATIVO do Gemini gerado com sucesso: ${filePath} (${audioBuffer.length} bytes)!`);
        return;
      }
    }
  }
  console.log('Nenhum bloco de áudio retornado:', JSON.stringify(response, null, 2));
}

testGeminiVoice().catch(console.error);
