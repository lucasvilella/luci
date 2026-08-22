/**
 * WhatsAppChannel
 *
 * WhatsApp Web bridge using @whiskeysockets/baileys and qrcode-terminal.
 * Displays QR Code in console for pairing.
 * Receives messages from WhatsApp and processes them via Luci's ModelRouter.
 */

import { ModelRouter } from '../../core/orchestrator/ModelRouter';
import { AudioSynthesisService } from '../tts/audioSynthesisService';
// @ts-ignore
import qrcode from 'qrcode-terminal';

export class WhatsAppChannel {
  private router: ModelRouter;
  private ttsService: AudioSynthesisService;
  private isConnected = false;
  private isConfigured = false;
  private sock: any = null;

  constructor(router: ModelRouter, ttsService: AudioSynthesisService) {
    this.router = router;
    this.ttsService = ttsService;
    this.isConfigured = process.env.ENABLE_WHATSAPP === 'true';
  }

  /**
   * Initializes WhatsApp Baileys socket connection.
   */
  async start(): Promise<void> {
    if (!this.isConfigured) {
      console.log('[WhatsAppChannel] WhatsApp Channel in standby (set ENABLE_WHATSAPP=true in .env to activate QR Code pairing).');
      return;
    }

    try {
      const baileys = await import('@whiskeysockets/baileys');
      const makeWASocket = baileys.default || baileys.makeWASocket;
      const { useMultiFileAuthState, DisconnectReason } = baileys;

      const { state, saveCreds } = await useMultiFileAuthState('storage/whatsapp_auth');

      this.sock = makeWASocket({
        auth: state,
        printQRInTerminal: false,
      });

      this.sock.ev.on('creds.update', saveCreds);

      this.sock.ev.on('connection.update', (update: any) => {
        const { connection, lastDisconnect, qr } = update;

        if (qr) {
          console.log('\n========================================');
          console.log('📱 ESCANEIE O QR CODE ABAIXO NO WHATSAPP:');
          console.log('========================================\n');
          qrcode.generate(qr, { small: true });
        }

        if (connection === 'close') {
          const shouldReconnect =
            lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
          console.log('[WhatsAppChannel] Connection closed. Reconnecting:', shouldReconnect);
          this.isConnected = false;
          if (shouldReconnect) {
            this.start();
          }
        } else if (connection === 'open') {
          console.log(' WhatsApp Channel Active & Connected!');
          this.isConnected = true;
        }
      });

      // Handle Incoming Messages
      this.sock.ev.on('messages.upsert', async (m: any) => {
        if (m.type !== 'notify') return;

        for (const msg of m.messages) {
          if (msg.key.fromMe) continue;

          const sender = msg.key.remoteJid;
          const textMessage = msg.message?.conversation || msg.message?.extendedTextMessage?.text;

          if (textMessage) {
            console.log(`[WhatsAppChannel] Message received from [${sender}]: "${textMessage}"`);

            try {
              const result = await this.router.route({
                message: textMessage,
                userId: 'Lucas',
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
                await this.sock.sendMessage(sender, { text: fullResponse });

                // Optionally send voice reply
                try {
                  const audioPath = await this.ttsService.textToSpeechFile(fullResponse);
                  const fs = await import('fs');
                  const audioBuffer = fs.readFileSync(audioPath);
                  await this.sock.sendMessage(sender, {
                    audio: audioBuffer,
                    mimetype: 'audio/mp4',
                    ptt: true, // Voice note format
                  });
                } catch (ttsErr) {
                  console.warn('[WhatsAppChannel] Could not send voice note:', ttsErr);
                }
              }
            } catch (err) {
              console.error('[WhatsAppChannel] Error handling message:', err);
            }
          }
        }
      });
    } catch (err) {
      console.error('[WhatsAppChannel] Failed to initialize Baileys:', err);
      this.isConnected = false;
    }
  }

  /**
   * Returns current status of WhatsApp channel.
   */
  getStatus() {
    return {
      channel: 'whatsapp',
      active: this.isConnected,
      configured: this.isConfigured,
    };
  }
}
