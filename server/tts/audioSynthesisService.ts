/**
 * AudioSynthesisService
 *
 * Generates local audio files (.mp3) from text responses for multichannel voice replies
 * (Telegram Voice Notes and WhatsApp Voice Messages).
 */

import fs from 'fs';
import path from 'path';
import { LuciVoiceEngine } from '../../speech/tts/LuciVoiceEngine';

export class AudioSynthesisService {
  private outputDir: string;

  constructor() {
    this.outputDir = path.resolve(process.cwd(), 'storage', 'audio');
    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir, { recursive: true });
    }
  }

  /**
   * Synthesizes text into a local MP3 audio file using LuciVoiceEngine.
   * Returns absolute path to the generated audio file for Telegram & WhatsApp.
   */
  async textToSpeechFile(text: string): Promise<string> {
    const cleanText = text
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      .replace(/http[s]?:\/\/\S+/gi, '')
      .replace(/[*_#`~>]/g, '')
      .replace(/L\.U\.C\.I\./gi, 'Lucy')
      .replace(/L\.U\.C\.I/gi, 'Lucy')
      .replace(/\bLuci\b/gi, 'Lucy')
      .replace(/\s+/g, ' ')
      .trim();

    const filename = `speech-${Date.now()}-${Math.random().toString(36).substring(2, 6)}.mp3`;
    const filePath = path.join(this.outputDir, filename);

    try {
      const results = await LuciVoiceEngine.getInstance().speak(cleanText);
      const audioBuffer = Buffer.from(results[0].audioBuffer);
      fs.writeFileSync(filePath, audioBuffer);
      console.log(`[AudioSynthesisService] Telegram/WhatsApp voice note generated via LuciVoiceEngine (${results[0].providerName}): ${filePath}`);
      return filePath;
    } catch (err) {
      console.error('[AudioSynthesisService] LuciVoiceEngine failed for multichannel:', err);
      throw err;
    }
  }

  /**
   * Cleans up temporary audio files older than 1 hour.
   */
  cleanupOldAudioFiles(): void {
    try {
      const files = fs.readdirSync(this.outputDir);
      const now = Date.now();
      const oneHourMs = 60 * 60 * 1000;

      for (const file of files) {
        const filePath = path.join(this.outputDir, file);
        const stats = fs.statSync(filePath);
        if (now - stats.mtimeMs > oneHourMs) {
          fs.unlinkSync(filePath);
        }
      }
    } catch (e) {
      console.warn('[AudioSynthesisService] Cleanup error:', e);
    }
  }
}
