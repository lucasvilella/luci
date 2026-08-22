import express from 'express';
import cors from 'cors';
import { ModelRouter } from '../core/orchestrator/ModelRouter';
import { config } from 'dotenv';

import { AudioSynthesisService } from './tts/audioSynthesisService';
import { TelegramChannel } from './channels/telegramChannel';
import { WhatsAppChannel } from './channels/whatsappChannel';
import { LuciVoiceEngine } from '../speech/tts/LuciVoiceEngine';

// Load environment variables (e.g. GEMINI_API_KEY)
config();

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

const router = new ModelRouter();
const ttsService = new AudioSynthesisService();
const voiceEngine = LuciVoiceEngine.getInstance();

const telegramChannel = new TelegramChannel(router, ttsService);
const whatsappChannel = new WhatsAppChannel(router, ttsService);

// Start Multichannel connectors
telegramChannel.start();
whatsappChannel.start();

process.on('uncaughtException', (err) => {
  console.error('FATAL: Uncaught Exception:', err);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('FATAL: Unhandled Rejection at:', promise, 'reason:', reason);
});

app.post('/api/chat', async (req, res) => {
  const { message, history, userId } = req.body;
  if (!message) {
    return res.status(400).json({ error: 'Message is required' });
  }

  try {
    const result = await router.route({ message, history, userId: userId || 'Lucas' });

    if (result.type === 'COMMAND') {
      // Local command returns JSON immediately
      res.json({
        type: 'COMMAND',
        content: result.content,
        latencyMs: result.latencyMs
      });
    } else if (result.type === 'REASONING' && result.stream) {
      // Cloud reasoning returns a Server-Sent Events (SSE) stream
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');

      // Flush headers
      res.flushHeaders();

      // Send metadata first
      res.write(`data: ${JSON.stringify({ type: 'REASONING', latencyMs: result.latencyMs })}\n\n`);

      for await (const chunk of result.stream) {
        // Send each chunk
        res.write(`data: ${JSON.stringify({ chunk })}\n\n`);
      }

      // End of stream
      res.write(`data: [DONE]\n\n`);
      res.end();
    } else {
      res.status(500).json({ error: 'Invalid router response' });
    }
  } catch (error: any) {
    console.error('API Error:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: error.message || 'Internal server error' });
    } else {
      res.write(`data: ${JSON.stringify({ error: error.message || 'Stream interrupted' })}\n\n`);
      res.write(`data: [DONE]\n\n`);
      res.end();
    }
  }
});

// Memory Audit endpoint
app.get('/api/memory/audit', (req, res) => {
  const userId = (req.query.userId as string) || 'Lucas';
  const memories = router.memory.audit(userId);
  res.json({ userId, memories });
});

// Memory Forget endpoint
app.post('/api/memory/forget', (req, res) => {
  const { userId, query } = req.body;
  if (!query) {
    return res.status(400).json({ error: 'Query is required to forget' });
  }
  const deletedCount = router.memory.forget(query, userId || 'Lucas');
  res.json({ success: true, deletedCount, message: `${deletedCount} memórias removidas.` });
});

// Nightly Memory Consolidation endpoint (Idle Cleaning Job)
app.post('/api/memory/consolidate', (req, res) => {
  const report = router.consolidator.runConsolidation();
  res.json({ success: true, report });
});

// Multichannel Status Endpoint
app.get('/api/channels/status', (req, res) => {
  res.json({
    telegram: telegramChannel.getStatus(),
    whatsapp: whatsappChannel.getStatus(),
  });
});

// Conversational Voice Synthesis Endpoint
app.post('/api/tts/speak', async (req, res) => {
  const { text, requestId } = req.body;
  if (!text) {
    return res.status(400).json({ error: 'Text is required for TTS' });
  }

  try {
    const results = await voiceEngine.speak(text, { requestId });
    const firstResult = results[0];

    res.setHeader('Content-Type', firstResult.mimeType);
    res.setHeader('X-TTS-Provider', firstResult.providerName);
    res.setHeader('X-TTS-TTFA', `${firstResult.timeToFirstAudioMs}ms`);
    res.send(Buffer.from(firstResult.audioBuffer));
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'TTS synthesis failed' });
  }
});

// Voice Engine Metrics & Health Audit Endpoint
import { BrazilLocationService } from '../core/skills/BrazilLocationService';

const brazilLocationService = new BrazilLocationService();

// Brazil Location & Financial Data Endpoints (BrasilAPI + ViaCEP Fallback)
app.get('/api/brasil/cep/:cep', async (req, res) => {
  const { cep } = req.params;
  const address = await brazilLocationService.getAddressByCep(cep);
  if (!address) {
    return res.status(404).json({ error: 'CEP não encontrado ou indisponível em ambos os provedores.' });
  }
  res.json(address);
});

app.get('/api/brasil/cnpj/:cnpj', async (req, res) => {
  const { cnpj } = req.params;
  const company = await brazilLocationService.getCnpj(cnpj);
  if (!company) {
    return res.status(404).json({ error: 'CNPJ não encontrado ou indisponível.' });
  }
  res.json(company);
});

app.get('/api/brasil/banks', async (_req, res) => {
  const banks = await brazilLocationService.getBanks();
  res.json(banks);
});

app.get('/api/brasil/holidays', async (_req, res) => {
  const holidays = await brazilLocationService.getHolidays(new Date().getFullYear());
  res.json(holidays);
});

app.get('/api/brasil/holidays/:year', async (req, res) => {
  const year = parseInt(req.params.year, 10) || new Date().getFullYear();
  const holidays = await brazilLocationService.getHolidays(year);
  res.json(holidays);
});

app.listen(port, () => {
  console.log(`Luci Backend API running at http://localhost:${port}`);
});
