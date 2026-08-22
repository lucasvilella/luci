import { WebSocket } from 'ws';
import fs from 'fs';
import path from 'path';

function generateEdgeNeuralTTS(text: string, voiceName = 'pt-BR-ThalitaNeural', rate = '+35%'): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const token = '6A5AA1D4EAFF4E9FB37E23D68491D6F4';
    const uuid = () => crypto.randomUUID().replaceAll('-', '');
    const wsUrl = `wss://speech.platform.bing.com/consumer/speech/synthesize/readaloud/edge/v1?TrustedClientToken=${token}&ConnectionId=${uuid()}`;

    const ws = new WebSocket(wsUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36 Edg/131.0.0.0',
        'Origin': 'chrome-extension://jdiccldimpdaibmpdkjnbmckianbfold',
      },
    });

    const audioChunks: Buffer[] = [];

    ws.on('open', () => {
      const configMsg = `X-Timestamp:${Date()}\r\nContent-Type:application/json; charset=utf-8\r\nPath:speech.config\r\n\r\n{"context":{"synthesis":{"audio":{"metadataoptions":{"sentenceBoundaryEnabled":false,"wordBoundaryEnabled":false},"outputFormat":"audio-24khz-96kbitrate-mono-mp3"}}}}`;
      ws.send(configMsg);

      const ssmlMsg = `X-RequestId:${uuid()}\r\nContent-Type:application/ssml+xml\r\nX-Timestamp:${Date()}Z\r\nPath:ssml\r\n\r\n<speak version='1.0' xmlns='http://www.w3.org/2001/10/synthesis' xml:lang='pt-BR'><voice name='${voiceName}'><prosody pitch='+0Hz' rate='${rate}' volume='+0%'>${text}</prosody></voice></speak>`;
      ws.send(ssmlMsg);
    });

    ws.on('message', (data: any, isBinary: boolean) => {
      if (!isBinary) {
        const textStr = data.toString('utf8');
        if (textStr.includes('turn.end')) {
          ws.close();
          resolve(Buffer.concat(audioChunks));
        }
      } else {
        const buf = data as Buffer;
        const needle = 'Path:audio\r\n';
        const idx = buf.indexOf(needle);
        if (idx !== -1) {
          audioChunks.push(buf.subarray(idx + needle.length));
        }
      }
    });

    ws.on('error', (err) => reject(err));
  });
}

async function run() {
  console.log('🎙️ Testando síntese neural de altíssima fluidez via Microsoft Edge Neural (pt-BR-ThalitaNeural)...');
  const buffer = await generateEdgeNeuralTTS('Olá Lucas! Eu sou a Luci. Agora meu sistema fala com extrema fluidez, ritmo natural e entonação perfeita como uma pessoa de verdade conversando com você.');
  const filePath = path.resolve(process.cwd(), 'sample_thalita_ultra_fluid.mp3');
  fs.writeFileSync(filePath, buffer);
  console.log(`✓ Áudio ultra-fluído gerado em: ${filePath} (${buffer.length} bytes)`);
}

run().catch(console.error);
