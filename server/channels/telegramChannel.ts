/**
 * TelegramChannel
 *
 * Channel connector for Telegram Bot API using Telegraf.
 * Supports receiving text & voice messages from Telegram on mobile devices
 * and responding with text & voice notes using L.U.C.I.'s Cognitive ModelRouter & Memory.
 */

import { Telegraf } from 'telegraf';
import { ModelRouter } from '../../core/orchestrator/ModelRouter';
import { AudioSynthesisService } from '../tts/audioSynthesisService';

export class TelegramChannel {
  private bot: Telegraf | null = null;
  private router: ModelRouter;
  private ttsService: AudioSynthesisService;
  private isConnected = false;

  constructor(router: ModelRouter, ttsService: AudioSynthesisService, botToken?: string) {
    this.router = router;
    this.ttsService = ttsService;
    const token = botToken || process.env.TELEGRAM_BOT_TOKEN;

    if (!token) {
      console.log('[TelegramChannel] TELEGRAM_BOT_TOKEN not provided. Channel in standby (add TELEGRAM_BOT_TOKEN to .env to activate).');
      return;
    }

    try {
      this.bot = new Telegraf(token);
      this.setupHandlers();
    } catch (err) {
      console.error('[TelegramChannel] Initialization error:', err);
    }
  }

  private setupHandlers(): void {
    if (!this.bot) return;

    // Command /start
    this.bot.command('start', async (ctx) => {
      await ctx.reply('Olá! Sou a L.U.C.I. (Lógica Ubíqua de Consciência Integrada). Como posso te ajudar hoje?');
    });

    // Handle Text Messages
    this.bot.on('text', async (ctx) => {
      const userMessage = ctx.message.text;
      const senderName = ctx.from?.first_name || 'Lucas';
      console.log(`[TelegramChannel] Text received from [${senderName}]: "${userMessage}"`);

      try {
        await ctx.sendChatAction('typing');

        const result = await this.router.route({
          message: userMessage,
          userId: senderName,
        });

        let fullResponse = '';

        if (result.type === 'COMMAND') {
          fullResponse = result.content || 'Comando executado.';
        } else if (result.type === 'REASONING' && result.stream) {
          for await (const chunk of result.stream) {
            fullResponse += chunk;
          }
        }

        if (fullResponse.trim()) {
          // Send Text Reply
          await ctx.reply(fullResponse);

          // Send Voice Note Reply
          try {
            await ctx.sendChatAction('record_voice');
            const audioPath = await this.ttsService.textToSpeechFile(fullResponse);
            await ctx.replyWithVoice({ source: audioPath });
          } catch (ttsErr) {
            console.warn('[TelegramChannel] Could not send voice note:', ttsErr);
          }
        }
      } catch (err: any) {
        console.error('[TelegramChannel] Error processing text:', err);
        await ctx.reply('⚠️ Ocorreu um erro ao processar sua mensagem.');
      }
    });

    // Handle Voice Messages
    this.bot.on('voice', async (ctx) => {
      await ctx.reply('🎙️ Áudio recebido! Para transcrição completa de voz via Telegram, ative o Faster-Whisper.');
    });
  }

  /**
   * Starts the Telegram Bot listener.
   */
  async start(): Promise<void> {
    if (!this.bot) return;

    try {
      await this.bot.launch();
      this.isConnected = true;
      console.log(' Telegram Channel Active & Connected!');
    } catch (err) {
      console.error('[TelegramChannel] Failed to start Telegram bot:', err);
      this.isConnected = false;
    }
  }

  /**
   * Returns current status of Telegram channel.
   */
  getStatus() {
    return {
      channel: 'telegram',
      active: this.isConnected,
      configured: !!process.env.TELEGRAM_BOT_TOKEN,
    };
  }

  /**
   * Stops the bot.
   */
  stop(): void {
    if (this.bot && this.isConnected) {
      this.bot.stop('SIGINT');
      this.isConnected = false;
    }
  }
}
