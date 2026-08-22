/**
 * ChatPanel — The Luci conversation panel
 *
 * Occupies ~30% of the screen width on the right side.
 * Glassmorphism background, smooth scrolling, minimalist design.
 *
 * Features:
 * - Persistent Chat History across page reloads (localStorage)
 * - Multi-turn conversation context passed to LLM (Groq Llama 3.3 70B)
 * - Phrase-by-Phrase Streaming Text-To-Speech (TTS)
 * - Alexa Plus Continuous Voice Loop vs Isolated Text Chat Mode
 */

import { useRef, useEffect, useCallback, useState } from 'react';
import { motion } from 'framer-motion';
import { ChatMessage } from './ChatMessage';
import type { Message } from './ChatMessage';
import { ChatInput } from './ChatInput';
import type { OrbState } from '../../engine/types';

interface ChatPanelProps {
  state: OrbState;
  onStateChange: (state: OrbState) => void;
  onRegisterSendHandler?: (handler: (text: string, isVoiceMode?: boolean) => void) => void;
  onClose?: () => void;
}

let messageId = Date.now();

function unlockWebSpeech() {
  if ('speechSynthesis' in window) {
    try {
      window.speechSynthesis.resume();
      window.speechSynthesis.getVoices();
    } catch {
      // Ignore
    }
  }
}

let currentAudioElement: HTMLAudioElement | null = null;
let activeAbortController: AbortController | null = null;

class AudioPlayerQueue {
  private audioContext: AudioContext | null = null;
  private queue: { index: number; buffer: ArrayBuffer }[] = [];
  private nextExpectedIndex: number = 0;
  private isPlaying: boolean = false;
  private currentSourceNode: AudioBufferSourceNode | null = null;
  private onStateChange?: (speaking: boolean) => void;

  constructor(onStateChange?: (speaking: boolean) => void) {
    this.onStateChange = onStateChange;
  }

  private initAudioContext(): AudioContext {
    if (!this.audioContext) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      this.audioContext = new AudioCtx();
    }
    if (this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }
    return this.audioContext;
  }

  public enqueueIndexed(index: number, buffer: ArrayBuffer): void {
    this.queue.push({ index, buffer });
    // Keep queue sorted by sentence index
    this.queue.sort((a, b) => a.index - b.index);

    if (!this.isPlaying) {
      this.playNext();
    }
  }

  public stopAndClear(): void {
    this.queue = [];
    this.nextExpectedIndex = 0;
    if (this.currentSourceNode) {
      try {
        this.currentSourceNode.stop();
        this.currentSourceNode.disconnect();
      } catch { }
      this.currentSourceNode = null;
    }
    this.isPlaying = false;
    if (this.onStateChange) this.onStateChange(false);
  }

  private async playNext(): Promise<void> {
    // Only play if the next expected sentence in sequence is ready
    if (this.queue.length === 0 || this.queue[0].index !== this.nextExpectedIndex) {
      if (this.queue.length === 0) {
        this.isPlaying = false;
        if (this.onStateChange) this.onStateChange(false);
      }
      return;
    }

    this.isPlaying = true;
    if (this.onStateChange) this.onStateChange(true);

    const item = this.queue.shift()!;
    this.nextExpectedIndex++;

    const ctx = this.initAudioContext();

    try {
      const audioBuffer = await ctx.decodeAudioData(item.buffer.slice(0));
      const source = ctx.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(ctx.destination);

      this.currentSourceNode = source;

      source.onended = () => {
        this.currentSourceNode = null;
        this.playNext();
      };

      source.start(0);
    } catch (err) {
      console.warn('[AudioPlayerQueue] Decode error, skipping chunk:', err);
      this.playNext();
    }
  }
}

let activeAudioQueue: AudioPlayerQueue | null = null;

export function stopAllSpeech() {
  if (activeAbortController) {
    activeAbortController.abort();
    activeAbortController = null;
  }
  if (activeAudioQueue) {
    activeAudioQueue.stopAndClear();
    activeAudioQueue = null;
  }
  if (currentAudioElement) {
    currentAudioElement.pause();
    currentAudioElement.currentTime = 0;
    currentAudioElement = null;
  }
  if ('speechSynthesis' in window) {
    try {
      window.speechSynthesis.cancel();
    } catch { }
  }
}

/**
 * Clean text for audio synthesis
 */
function cleanTextForSpeech(text: string): string {
  return text
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/http[s]?:\/\/\S+/gi, '')
    .replace(/[*_#`~>]/g, '')
    .replace(/L\.U\.C\.I\./gi, 'Lucy')
    .replace(/L\.U\.C\.I/gi, 'Lucy')
    .replace(/\bLuci\b/gi, 'Lucy')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Synthesizes a single sentence chunk and enqueues in exact chronological order
 */
async function synthesizeAndEnqueueSentence(
  sentenceIndex: number,
  sentence: string,
  queue: AudioPlayerQueue,
  signal: AbortSignal
): Promise<void> {
  const clean = cleanTextForSpeech(sentence);
  if (clean.length < 2) return;

  try {
    const res = await fetch('http://localhost:3001/api/tts/speak', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: clean }),
      signal,
    });

    if (!res.ok) return;

    const arrayBuf = await res.arrayBuffer();
    if (signal.aborted) return;

    queue.enqueueIndexed(sentenceIndex, arrayBuf);
  } catch (err: any) {
    if (err.name !== 'AbortError') {
      console.warn('[ChatPanel] Sentence synthesis failed:', sentence, err);
    }
  }
}

/**
 * Direct playback for complete text (used in fast commands or fallback)
 */
async function playDirectSpeech(
  text: string,
  isVoiceMode: boolean,
  onStateChange: (state: OrbState) => void
): Promise<void> {
  stopAllSpeech();

  const cleanText = cleanTextForSpeech(text);
  if (cleanText.length < 2) {
    onStateChange(isVoiceMode ? 'listening' : 'idle');
    return;
  }

  const controller = new AbortController();
  activeAbortController = controller;

  const audioQueue = new AudioPlayerQueue((speaking) => {
    onStateChange(speaking ? 'speaking' : (isVoiceMode ? 'listening' : 'idle'));
  });
  activeAudioQueue = audioQueue;

  // Split into natural sentences for immediate pipelined synthesis
  const rawSentences = cleanText.match(/[^.!?]+[.!?]+|\S+/g) || [cleanText];
  const sentences: string[] = [];
  let buffer = '';

  for (const s of rawSentences) {
    buffer = buffer ? `${buffer} ${s.trim()}` : s.trim();
    if (buffer.split(/\s+/).length >= 3 && buffer.length >= 12) {
      sentences.push(buffer);
      buffer = '';
    }
  }
  if (buffer.trim()) sentences.push(buffer.trim());

  // Trigger synthesis of sentences with deterministic sequence indexing
  for (let i = 0; i < sentences.length; i++) {
    if (controller.signal.aborted) break;
    await synthesizeAndEnqueueSentence(i, sentences[i], audioQueue, controller.signal);
  }
}

export function ChatPanel({ state, onStateChange, onRegisterSendHandler, onClose }: ChatPanelProps) {
  // Pre-load WebSpeech voices and set up global user gesture unlock listener
  useEffect(() => {
    unlockWebSpeech();
    if ('speechSynthesis' in window) {
      window.speechSynthesis.onvoiceschanged = () => {
        window.speechSynthesis.getVoices();
      };
    }

    const onUserInteraction = () => {
      unlockWebSpeech();
    };

    window.addEventListener('click', onUserInteraction, { capture: true });
    window.addEventListener('keydown', onUserInteraction, { capture: true });

    return () => {
      window.removeEventListener('click', onUserInteraction, { capture: true });
      window.removeEventListener('keydown', onUserInteraction, { capture: true });
    };
  }, []);

  // Load initial messages from localStorage
  const [messages, setMessages] = useState<Message[]>(() => {
    try {
      const saved = localStorage.getItem('luci_chat_history');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-save messages to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem('luci_chat_history', JSON.stringify(messages));
    } catch (e) {
      console.error('Failed to save chat history:', e);
    }
  }, [messages]);

  // Auto-scroll on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  }, [messages]);

  const handleClearHistory = useCallback(() => {
    stopAllSpeech();
    setMessages([]);
    localStorage.removeItem('luci_chat_history');
    onStateChange('idle');
  }, [onStateChange]);

  const handleSend = useCallback(
    async (text: string, isVoiceMode = false) => {
      // Cancel any leftover speech & clear queue from previous turn
      stopAllSpeech();

      // Add user message
      const userMsg: Message = {
        id: `msg-${++messageId}`,
        role: 'user',
        content: text,
        timestamp: Date.now(),
      };

      // Prepare conversation history to send (excluding empty or thinking states)
      const currentHistory = messages.map((m) => ({
        role: m.role,
        content: m.content,
      }));

      setMessages((prev) => [...prev, userMsg]);

      // State: Thinking (waiting for network / model initialization)
      onStateChange('thinking');

      try {
        const response = await fetch('http://localhost:3001/api/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            message: text,
            userId: 'Lucas',
            history: currentHistory,
          }),
        });

        if (!response.ok) {
          throw new Error('API Error');
        }

        const contentType = response.headers.get('content-type');

        if (contentType && contentType.includes('application/json')) {
          // COMMAND response (fast, direct)
          const data = await response.json();
          const fullContent = data.content;

          const assistantMsg: Message = {
            id: `msg-${++messageId}`,
            role: 'assistant',
            content: fullContent,
            timestamp: Date.now(),
          };
          setMessages((prev) => [...prev, assistantMsg]);

          await playDirectSpeech(fullContent, isVoiceMode, onStateChange);

        } else if (contentType && contentType.includes('text/event-stream')) {
          // REASONING response (streaming text in real-time)
          const reader = response.body?.getReader();
          const decoder = new TextDecoder();
          let fullText = '';

          const assistantMsgId = `msg-${++messageId}`;
          setMessages((prev) => [
            ...prev,
            { id: assistantMsgId, role: 'assistant', content: '', timestamp: Date.now() },
          ]);

          const controller = new AbortController();
          activeAbortController = controller;

          const audioQueue = new AudioPlayerQueue((speaking) => {
            onStateChange(speaking ? 'speaking' : (isVoiceMode ? 'listening' : 'idle'));
          });
          activeAudioQueue = audioQueue;

          let sentenceBuffer = '';
          let streamSentenceCounter = 0;

          if (reader) {
            while (true) {
              const { value, done } = await reader.read();
              if (done) break;

              const chunkText = decoder.decode(value, { stream: true });
              const lines = chunkText.split('\n');

              for (const line of lines) {
                if (line.startsWith('data: ')) {
                  const dataStr = line.replace('data: ', '').trim();
                  if (dataStr === '[DONE]') break;

                  try {
                    const parsed = JSON.parse(dataStr);

                    if (parsed.chunk) {
                      fullText += parsed.chunk;
                      sentenceBuffer += parsed.chunk;

                      // When a complete sentence is formed (. ! ? \n), send immediately for synthesis
                      const match = sentenceBuffer.match(/([^.!?\n]+[.!?\n]+)([\s\S]*)/);
                      if (match) {
                        const completeSentence = match[1].trim();
                        sentenceBuffer = match[2] || '';

                        if (completeSentence.split(/\s+/).length >= 2 || completeSentence.length >= 8) {
                          const idx = streamSentenceCounter++;
                          // Asynchronous synthesis with strict index ordering
                          synthesizeAndEnqueueSentence(idx, completeSentence, audioQueue, controller.signal);
                        }
                      }

                      const currentFull = fullText;
                      // Update UI message token-by-token in real-time
                      setMessages((prev) =>
                        prev.map((m) =>
                          m.id === assistantMsgId ? { ...m, content: currentFull } : m
                        )
                      );
                    }
                  } catch (e) {
                    console.error('Error parsing SSE data:', e);
                  }
                }
              }
            }
          }

          // Synthesize any remaining sentence buffer
          if (sentenceBuffer.trim()) {
            const idx = streamSentenceCounter++;
            synthesizeAndEnqueueSentence(idx, sentenceBuffer.trim(), audioQueue, controller.signal);
          }
        }
      } catch (error) {
        console.error('Failed to send message (Network/API Error):', error);
        const fallbackText = "Estou aqui, Lucas. Como posso te ajudar?";
        const assistantMsg: Message = {
          id: `msg-${++messageId}`,
          role: 'assistant',
          content: fallbackText,
          timestamp: Date.now(),
        };
        setMessages((prev) => [...prev, assistantMsg]);
        await playDirectSpeech(fallbackText, isVoiceMode, onStateChange);
      }
    },
    [messages, onStateChange],
  );

  // Pre-load Web Speech API voices on component mount
  useEffect(() => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.getVoices();
      window.speechSynthesis.onvoiceschanged = () => {
        window.speechSynthesis.getVoices();
      };
    }
  }, []);

  useEffect(() => {
    if (onRegisterSendHandler) {
      onRegisterSendHandler(handleSend);
    }
  }, [onRegisterSendHandler, handleSend]);



  const isProcessing = state !== 'idle';

  return (
    <motion.aside
      className="chat-panel"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
    >
      <div className="chat-panel__header">
        <div className="chat-panel__title-group">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className={`chat-panel__indicator chat-panel__indicator--${state}`} />
            <h3 className="chat-panel__title">Luci</h3>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {messages.length > 0 && (
            <button
              onClick={handleClearHistory}
              className="chat-panel__clear-btn"
              title="Limpar histórico de conversa"
              style={{
                background: 'transparent',
                border: 'none',
                color: 'rgba(255, 255, 255, 0.4)',
                cursor: 'pointer',
                fontSize: '12px',
                padding: '4px 8px',
                borderRadius: '4px',
                transition: 'all 0.2s ease',
              }}
            >
              Limpar
            </button>
          )}
          {onClose && (
            <button
              onClick={onClose}
              title="Minimizar Chat"
              style={{
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                color: 'rgba(255, 255, 255, 0.7)',
                cursor: 'pointer',
                fontSize: '13px',
                width: '26px',
                height: '26px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s ease',
              }}
            >
              ✕
            </button>
          )}
        </div>
      </div>

      <div className="chat-panel__messages" ref={scrollRef}>
        {messages.length === 0 && (
          <div className="chat-panel__empty">
            <p className="chat-panel__empty-text">
              Inicie uma conversa com a Luci.
            </p>
          </div>
        )}
        {messages.map((msg) => (
          <ChatMessage key={msg.id} message={msg} />
        ))}
        {state === 'thinking' && (
          <motion.div
            className="chat-panel__thinking"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            <span className="chat-panel__thinking-dot" />
            <span className="chat-panel__thinking-dot" />
            <span className="chat-panel__thinking-dot" />
          </motion.div>
        )}
      </div>

      <ChatInput onSend={(text) => handleSend(text, false)} disabled={isProcessing} />
    </motion.aside>
  );
}
